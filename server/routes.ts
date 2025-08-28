import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMemberSchema, insertLoanSchema, insertTransactionSchema, insertRepaymentSchema, insertUserSchema, insertUnfreezeRequestSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

// Extend session interface for TypeScript
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

// Initialize demo users
async function initializeDemoUsers() {
  try {
    // Check if users already exist
    const existingAdmin = await storage.getUserByEmail("admin@sacco.test");
    if (existingAdmin) return; // Users already initialized
    
    // Create demo users with hashed passwords
    const demoPassword = "password123"; // Demo password for all users
    const hashedPassword = await bcrypt.hash(demoPassword, 10);
    
    await storage.createUser({
      name: "Admin User",
      email: "admin@sacco.test",
      passwordHash: hashedPassword,
      role: "admin"
    });
    
    await storage.createUser({
      name: "Manager User",
      email: "manager@sacco.test",
      passwordHash: hashedPassword,
      role: "manager"
    });
    
    await storage.createUser({
      name: "Member User",
      email: "member@sacco.test",
      passwordHash: hashedPassword,
      role: "member"
    });
    
    console.log("Demo users initialized:");
    console.log("- admin@sacco.test / password123 (admin)");
    console.log("- manager@sacco.test / password123 (manager)");
    console.log("- member@sacco.test / password123 (member)");
  } catch (error) {
    console.error("Failed to initialize demo users:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize demo users
  await initializeDemoUsers();

  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: "Name, email, and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, error: "User already exists with this email" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        name,
        email,
        passwordHash,
        role: "member"
      });

      // Create session
      req.session.userId = user.id;

      res.status(201).json({ 
        success: true, 
        data: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role 
        } 
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ success: false, error: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, error: "Email and password are required" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }

      // Create session
      req.session.userId = user.id;

      res.json({ 
        success: true, 
        data: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role 
        } 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: "Failed to authenticate" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(401).json({ success: false, error: "User not found" });
      }

      res.json({ 
        success: true, 
        data: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role 
        } 
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ success: false, error: "Failed to get user" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Members routes
  app.get("/api/members", async (req, res) => {
    try {
      const members = await storage.getMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.get("/api/members/:id", async (req, res) => {
    try {
      const member = await storage.getMember(req.params.id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  app.post("/api/members", async (req, res) => {
    try {
      const validatedData = insertMemberSchema.parse(req.body);
      
      // Check if member number already exists
      const existing = await storage.getMemberByNumber(validatedData.memberNumber);
      if (existing) {
        return res.status(400).json({ message: "Member number already exists" });
      }

      const member = await storage.createMember(validatedData);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create member" });
    }
  });

  app.put("/api/members/:id", async (req, res) => {
    try {
      const validatedData = insertMemberSchema.partial().parse(req.body);
      const member = await storage.updateMember(req.params.id, validatedData);
      res.json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      if (error instanceof Error && error.message === "Member not found") {
        return res.status(404).json({ message: "Member not found" });
      }
      res.status(500).json({ message: "Failed to update member" });
    }
  });

  app.patch("/api/members/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !["active", "inactive", "frozen"].includes(status)) {
        return res.status(400).json({ success: false, error: "Invalid status. Must be active, inactive, or frozen" });
      }
      
      const member = await storage.updateMemberStatus(req.params.id, status);
      res.json({ success: true, data: member });
    } catch (error) {
      if (error instanceof Error && error.message === "Member not found") {
        return res.status(404).json({ success: false, error: "Member not found" });
      }
      res.status(500).json({ success: false, error: "Failed to update member status" });
    }
  });

  app.delete("/api/members/:id", async (req, res) => {
    try {
      await storage.deleteMember(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

  // Loans routes
  app.get("/api/loans", async (req, res) => {
    try {
      const status = req.query.status as string;
      const loans = status ? 
        await storage.getLoansByStatus(status) : 
        await storage.getLoans();
      res.json(loans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loans" });
    }
  });

  app.get("/api/loans/:id", async (req, res) => {
    try {
      const loan = await storage.getLoan(req.params.id);
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      res.json(loan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loan" });
    }
  });

  app.get("/api/members/:id/loans", async (req, res) => {
    try {
      const loans = await storage.getLoansByMember(req.params.id);
      res.json(loans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member loans" });
    }
  });

  app.post("/api/loans", async (req, res) => {
    try {
      const validatedData = insertLoanSchema.parse(req.body);
      const loan = await storage.createLoan(validatedData);
      res.status(201).json(loan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create loan" });
    }
  });

  app.post("/api/loans/:id/approve", async (req, res) => {
    try {
      const { approverId } = req.body;
      if (!approverId) {
        return res.status(400).json({ message: "Approver ID is required" });
      }
      
      // Find the member corresponding to the user ID
      const approverUser = await storage.getUserById(approverId);
      if (!approverUser) {
        return res.status(400).json({ message: "Approver user not found" });
      }
      
      // Find member with matching email
      const members = await storage.getMembers();
      const approverMember = members.find(m => m.email === approverUser.email);
      if (!approverMember) {
        return res.status(400).json({ message: "Approver member record not found" });
      }
      
      console.log("Approving loan:", req.params.id, "by user:", approverId, "member:", approverMember.id);
      const loan = await storage.approveLoan(req.params.id, approverMember.id);
      console.log("Loan approved:", loan);
      
      // Create disbursement transaction if approved
      await storage.createTransaction({
        memberId: loan.memberId,
        loanId: loan.id,
        type: "loan_disbursement",
        amount: loan.principal,
        description: `Loan Disbursement - ${loan.loanNumber}`,
        processedBy: approverMember.id,
      });

      res.json(loan);
    } catch (error) {
      console.error("Error approving loan:", error);
      if (error instanceof Error && error.message === "Loan not found") {
        return res.status(404).json({ message: "Loan not found" });
      }
      res.status(500).json({ message: "Failed to approve loan", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/loans/:id/reject", async (req, res) => {
    try {
      const { approverId } = req.body;
      if (!approverId) {
        return res.status(400).json({ message: "Approver ID is required" });
      }
      
      // Find the member corresponding to the user ID
      const approverUser = await storage.getUserById(approverId);
      if (!approverUser) {
        return res.status(400).json({ message: "Approver user not found" });
      }
      
      // Find member with matching email
      const members = await storage.getMembers();
      const approverMember = members.find(m => m.email === approverUser.email);
      if (!approverMember) {
        return res.status(400).json({ message: "Approver member record not found" });
      }
      
      console.log("Rejecting loan:", req.params.id, "by user:", approverId, "member:", approverMember.id);
      const loan = await storage.rejectLoan(req.params.id, approverMember.id);
      res.json(loan);
    } catch (error) {
      console.error("Error rejecting loan:", error);
      if (error instanceof Error && error.message === "Loan not found") {
        return res.status(404).json({ message: "Loan not found" });
      }
      res.status(500).json({ message: "Failed to reject loan", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Transactions routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getTransactions(limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/members/:id/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByMember(req.params.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Savings routes
  app.get("/api/members/:id/savings", async (req, res) => {
    try {
      const savings = await storage.getSavings(req.params.id);
      if (!savings) {
        return res.status(404).json({ message: "Savings account not found" });
      }
      res.json(savings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch savings" });
    }
  });

  // Repayments routes
  app.get("/api/repayments", async (req, res) => {
    try {
      const repayments = await storage.getRepayments();
      res.json(repayments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch repayments" });
    }
  });

  app.get("/api/loans/:id/repayments", async (req, res) => {
    try {
      const repayments = await storage.getRepaymentsByLoan(req.params.id);
      res.json(repayments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loan repayments" });
    }
  });

  app.post("/api/repayments", async (req, res) => {
    try {
      console.log("Creating repayment with data:", req.body);
      
      // Find member corresponding to processedBy if it's a user ID
      let processedByMemberId = req.body.processedBy;
      if (req.body.processedBy && req.body.processedBy.length > 10) { // Likely a UUID
        const processorUser = await storage.getUserById(req.body.processedBy);
        if (processorUser) {
          const members = await storage.getMembers();
          const processorMember = members.find(m => m.email === processorUser.email);
          if (processorMember) {
            processedByMemberId = processorMember.id;
          }
        }
      }
      
      const validatedData = insertRepaymentSchema.parse({
        ...req.body,
        processedBy: processedByMemberId
      });
      
      console.log("Validated repayment data:", validatedData);
      const repayment = await storage.createRepayment(validatedData);
      
      // Update loan balance
      const loan = await storage.getLoan(validatedData.loanId);
      if (loan) {
        const newBalance = Math.max(0, parseFloat(loan.balance) - parseFloat(validatedData.amount));
        const status = newBalance === 0 ? "paid" : loan.status;
        await storage.updateLoan(loan.id, { 
          status
        });
      }
      
      res.status(201).json(repayment);
    } catch (error) {
      console.error("Error creating repayment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to process repayment", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Load demo data (development only)
  app.post("/api/admin/load-demo-data", async (req, res) => {
    try {
      // Only allow in development environment
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: "Demo data loading not allowed in production" });
      }

      await storage.loadDemoData();
      res.json({ message: "Demo data loaded successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to load demo data" });
    }
  });

  // Unfreeze requests routes
  app.get("/api/unfreeze-requests", async (req, res) => {
    try {
      const requests = await storage.getUnfreezeRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unfreeze requests" });
    }
  });

  app.get("/api/unfreeze-requests/pending", async (req, res) => {
    try {
      const requests = await storage.getPendingUnfreezeRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending unfreeze requests" });
    }
  });

  app.post("/api/unfreeze-requests", async (req, res) => {
    try {
      const validatedData = insertUnfreezeRequestSchema.parse(req.body);
      const request = await storage.createUnfreezeRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create unfreeze request" });
    }
  });

  app.patch("/api/unfreeze-requests/:id/process", async (req, res) => {
    try {
      const { status, processedBy, adminNotes } = req.body;
      
      if (!status || !["approved", "denied"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'denied'" });
      }
      
      if (!processedBy) {
        return res.status(400).json({ message: "ProcessedBy is required" });
      }
      
      const request = await storage.processUnfreezeRequest(req.params.id, processedBy, status, adminNotes);
      res.json(request);
    } catch (error) {
      if (error instanceof Error && error.message === "Unfreeze request not found") {
        return res.status(404).json({ message: "Unfreeze request not found" });
      }
      res.status(500).json({ message: "Failed to process unfreeze request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
