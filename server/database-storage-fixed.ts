import { db } from "./db";
import { 
  users,
  members,
  loans,
  transactions,
  savings,
  repayments,
  type User,
  type InsertUser,
  type Member, 
  type InsertMember, 
  type Loan, 
  type InsertLoan,
  type Transaction,
  type InsertTransaction,
  type Savings,
  type InsertSavings,
  type Repayment,
  type InsertRepayment,
  type MemberWithSavings,
  type LoanWithMember,
  type TransactionWithDetails,
  type RepaymentWithDetails,
  type DashboardStats
} from "@shared/schema";
import { eq, sql, desc, count, sum } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Authentication
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user)
      .returning();
    return newUser;
  }

  // Members
  async getMembers(): Promise<MemberWithSavings[]> {
    // Get all members with their savings balance
    const membersWithSavings = await db
      .select({
        id: members.id,
        memberNumber: members.memberNumber,
        firstName: members.firstName,
        lastName: members.lastName,
        email: members.email,
        phone: members.phone,
        nationalId: members.nationalId,
        address: members.address,
        role: members.role,
        status: members.status,
        dateJoined: members.dateJoined,
        isActive: members.isActive,
      })
      .from(members)
      .orderBy(desc(members.dateJoined));

    // Add savings balance to each member
    const result: MemberWithSavings[] = [];
    for (const member of membersWithSavings) {
      const [savingsRecord] = await db
        .select({ balance: savings.balance })
        .from(savings)
        .where(eq(savings.memberId, member.id))
        .limit(1);
      
      result.push({
        ...member,
        savingsBalance: savingsRecord?.balance || "0"
      });
    }

    return result;
  }

  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, id))
      .limit(1);
    return member;
  }

  async getMemberByNumber(memberNumber: string): Promise<Member | undefined> {
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.memberNumber, memberNumber))
      .limit(1);
    return member;
  }

  async createMember(member: InsertMember): Promise<Member> {
    const [newMember] = await db
      .insert(members)
      .values(member)
      .returning();
    
    // Create savings account for new member
    await db
      .insert(savings)
      .values({
        memberId: newMember.id,
        balance: "0"
      });
    
    return newMember;
  }

  async updateMember(id: string, updates: Partial<InsertMember>): Promise<Member> {
    const [updatedMember] = await db
      .update(members)
      .set(updates)
      .where(eq(members.id, id))
      .returning();
    
    if (!updatedMember) {
      throw new Error("Member not found");
    }
    
    return updatedMember;
  }

  async updateMemberStatus(id: string, status: string): Promise<Member> {
    return await this.updateMember(id, { status });
  }

  async deleteMember(id: string): Promise<void> {
    await db
      .delete(members)
      .where(eq(members.id, id));
  }

  // Loans
  async getLoans(): Promise<LoanWithMember[]> {
    return await this.getLoansWithMembers();
  }

  async getLoansWithMembers(): Promise<LoanWithMember[]> {
    // Get loans directly to avoid circular dependency
    const allLoans = await db
      .select()
      .from(loans)
      .orderBy(desc(loans.createdAt));
    
    const result: LoanWithMember[] = [];

    for (const loan of allLoans) {
      const member = await this.getMember(loan.memberId);
      const approver = loan.approvedBy ? await this.getMember(loan.approvedBy) : null;

      result.push({
        ...loan,
        memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown",
        approverName: approver ? `${approver.firstName} ${approver.lastName}` : undefined
      });
    }

    return result;
  }

  async getLoan(id: string): Promise<Loan | undefined> {
    const [loan] = await db
      .select()
      .from(loans)
      .where(eq(loans.id, id))
      .limit(1);
    return loan;
  }

  async getLoansByStatus(status: string): Promise<LoanWithMember[]> {
    const allLoansWithMembers = await this.getLoansWithMembers();
    return allLoansWithMembers.filter(loan => loan.status === status);
  }

  async getLoansByMember(memberId: string): Promise<Loan[]> {
    return await db
      .select()
      .from(loans)
      .where(eq(loans.memberId, memberId))
      .orderBy(desc(loans.createdAt));
  }

  async createLoan(loan: InsertLoan): Promise<Loan> {
    const [newLoan] = await db
      .insert(loans)
      .values({
        ...loan,
        balance: loan.principal, // Initial balance equals principal
      })
      .returning();
    return newLoan;
  }

  async updateLoan(id: string, updates: Partial<InsertLoan>): Promise<Loan> {
    const [updatedLoan] = await db
      .update(loans)
      .set(updates)
      .where(eq(loans.id, id))
      .returning();
    
    if (!updatedLoan) {
      throw new Error("Loan not found");
    }
    
    return updatedLoan;
  }

  async approveLoan(id: string, approverId: string): Promise<Loan> {
    const [approvedLoan] = await db
      .update(loans)
      .set({
        status: "active",
        approvedBy: approverId,
        approvedAt: new Date(),
        disbursementDate: new Date(),
      })
      .where(eq(loans.id, id))
      .returning();
    
    if (!approvedLoan) {
      throw new Error("Loan not found");
    }
    
    return approvedLoan;
  }

  async rejectLoan(id: string, approverId: string): Promise<Loan> {
    const [rejectedLoan] = await db
      .update(loans)
      .set({
        status: "rejected",
        approvedBy: approverId,
        approvedAt: new Date(),
      })
      .where(eq(loans.id, id))
      .returning();
    
    if (!rejectedLoan) {
      throw new Error("Loan not found");
    }
    
    return rejectedLoan;
  }

  // Transactions
  async getTransactions(limit?: number): Promise<TransactionWithDetails[]> {
    const transactionsQuery = db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.transactionDate));
    
    const allTransactions = limit ? 
      await transactionsQuery.limit(limit) : 
      await transactionsQuery;

    const result: TransactionWithDetails[] = [];
    for (const transaction of allTransactions) {
      let memberName: string | undefined;
      if (transaction.memberId) {
        const member = await this.getMember(transaction.memberId);
        memberName = member ? `${member.firstName} ${member.lastName}` : undefined;
      }

      result.push({
        ...transaction,
        memberName
      });
    }

    return result;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);
    return transaction;
  }

  async getTransactionsByMember(memberId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.memberId, memberId))
      .orderBy(desc(transactions.transactionDate));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  // Savings
  async getSavings(memberId: string): Promise<Savings | undefined> {
    const [memberSavings] = await db
      .select()
      .from(savings)
      .where(eq(savings.memberId, memberId))
      .limit(1);
    return memberSavings;
  }

  async createOrUpdateSavings(savingsData: InsertSavings): Promise<Savings> {
    const existing = await this.getSavings(savingsData.memberId);
    
    if (existing) {
      const [updated] = await db
        .update(savings)
        .set({ balance: savingsData.balance })
        .where(eq(savings.memberId, savingsData.memberId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(savings)
        .values(savingsData)
        .returning();
      return created;
    }
  }

  // Repayments
  async getRepayments(): Promise<RepaymentWithDetails[]> {
    const allRepayments = await db
      .select()
      .from(repayments)
      .orderBy(desc(repayments.paymentDate));

    const result: RepaymentWithDetails[] = [];
    for (const repayment of allRepayments) {
      // Get loan information
      const loan = await this.getLoan(repayment.loanId);
      const loanNumber = loan?.loanNumber || "Unknown";

      // Get member information from the loan
      let memberName = "Unknown";
      if (loan) {
        const member = await this.getMember(loan.memberId);
        memberName = member ? `${member.firstName} ${member.lastName}` : "Unknown";
      }

      // Get processor information
      const processor = await this.getMember(repayment.processedBy);
      const processorName = processor ? `${processor.firstName} ${processor.lastName}` : "Unknown";

      result.push({
        ...repayment,
        loanNumber,
        memberName,
        processorName
      });
    }

    return result;
  }

  async getRepaymentsByLoan(loanId: string): Promise<RepaymentWithDetails[]> {
    const loanRepayments = await db
      .select()
      .from(repayments)
      .where(eq(repayments.loanId, loanId))
      .orderBy(desc(repayments.paymentDate));

    const result: RepaymentWithDetails[] = [];
    for (const repayment of loanRepayments) {
      // Get loan information
      const loan = await this.getLoan(repayment.loanId);
      const loanNumber = loan?.loanNumber || "Unknown";

      // Get member information from the loan
      let memberName = "Unknown";
      if (loan) {
        const member = await this.getMember(loan.memberId);
        memberName = member ? `${member.firstName} ${member.lastName}` : "Unknown";
      }

      // Get processor information
      const processor = await this.getMember(repayment.processedBy);
      const processorName = processor ? `${processor.firstName} ${processor.lastName}` : "Unknown";

      result.push({
        ...repayment,
        loanNumber,
        memberName,
        processorName
      });
    }

    return result;
  }

  async createRepayment(repayment: InsertRepayment): Promise<Repayment> {
    const [newRepayment] = await db
      .insert(repayments)
      .values(repayment)
      .returning();
    return newRepayment;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    // Get member count
    const [memberStats] = await db
      .select({ totalMembers: count() })
      .from(members)
      .where(eq(members.isActive, true));

    // Get total savings
    const [savingsStats] = await db
      .select({ totalSavings: sum(savings.balance) })
      .from(savings);

    // Get active loans total
    const [loanStats] = await db
      .select({ activeLoans: sum(loans.balance) })
      .from(loans)
      .where(eq(loans.status, "active"));

    // Get pending loans count
    const [pendingStats] = await db
      .select({ pendingLoans: count() })
      .from(loans)
      .where(eq(loans.status, "pending"));

    return {
      totalMembers: memberStats.totalMembers,
      totalSavings: savingsStats.totalSavings || "0",
      activeLoans: loanStats.activeLoans || "0",
      monthlyRevenue: "0", // Calculate based on your business logic
      memberGrowth: 0,
      savingsGrowth: "0",
      loanCount: 0,
      revenueGrowth: "0",
      pendingLoans: pendingStats.pendingLoans,
      defaultRate: "0",
    };
  }

  // Demo data
  async loadDemoData(): Promise<void> {
    console.log("Loading demo data...");

    // Create demo members
    const demoMembers = [
      {
        memberNumber: "M001",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "0788123456",
        nationalId: "1234567890123",
        address: "Kampala, Uganda",
        role: "member",
        status: "active",
        isActive: true,
      },
      {
        memberNumber: "M002", 
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        phone: "0788234567",
        nationalId: "1234567890124",
        address: "Entebbe, Uganda",
        role: "member",
        status: "active",
        isActive: true,
      },
      {
        memberNumber: "M003",
        firstName: "Michael",
        lastName: "Johnson",
        email: "michael.johnson@example.com",
        phone: "0788345678",
        nationalId: "1234567890125",
        address: "Jinja, Uganda",
        role: "member",
        status: "active",
        isActive: true,
      }
    ];

    // Insert demo members
    for (const memberData of demoMembers) {
      try {
        const existingMember = await this.getMemberByNumber(memberData.memberNumber);
        if (!existingMember) {
          const member = await this.createMember(memberData);
          
          // Add initial savings
          await this.createOrUpdateSavings({
            memberId: member.id,
            balance: Math.floor(Math.random() * 5000000).toString() // Random balance up to 5M UGX
          });
        }
      } catch (error) {
        console.error(`Failed to create member ${memberData.memberNumber}:`, error);
      }
    }

    // Create demo loans
    const allMembers = await this.getMembers();
    if (allMembers.length > 0) {
      for (let i = 0; i < 3; i++) {
        const member = allMembers[i % allMembers.length];
        try {
          await this.createLoan({
            memberId: member.id,
            loanNumber: `L${String(Date.now() + i).slice(-6)}`,
            principal: String((Math.floor(Math.random() * 10) + 1) * 1000000), // 1M - 10M UGX
            interestRate: "15.00",
            termMonths: 12,
            status: Math.random() > 0.5 ? "pending" : "active",
            intendedPurpose: ["Business expansion", "Education", "Agriculture", "Housing"][Math.floor(Math.random() * 4)],
          });
        } catch (error) {
          console.error(`Failed to create loan for member ${member.memberNumber}:`, error);
        }
      }
    }

    console.log("Demo data loaded successfully");
  }
}