import { 
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
import { randomUUID } from "crypto";

export interface IStorage {
  // Authentication
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Members
  getMembers(): Promise<MemberWithSavings[]>;
  getMember(id: string): Promise<Member | undefined>;
  getMemberByNumber(memberNumber: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: string, updates: Partial<InsertMember>): Promise<Member>;
  updateMemberStatus(id: string, status: string): Promise<Member>;
  deleteMember(id: string): Promise<void>;

  // Loans
  getLoans(): Promise<LoanWithMember[]>;
  getLoan(id: string): Promise<Loan | undefined>;
  getLoansByMember(memberId: string): Promise<Loan[]>;
  getLoansByStatus(status: string): Promise<LoanWithMember[]>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  updateLoan(id: string, updates: Partial<InsertLoan>): Promise<Loan>;
  approveLoan(id: string, approverId: string): Promise<Loan>;
  rejectLoan(id: string, approverId: string): Promise<Loan>;

  // Transactions
  getTransactions(limit?: number): Promise<TransactionWithDetails[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByMember(memberId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Savings
  getSavings(memberId: string): Promise<Savings | undefined>;
  createOrUpdateSavings(savings: InsertSavings): Promise<Savings>;

  // Repayments
  getRepayments(): Promise<RepaymentWithDetails[]>;
  getRepaymentsByLoan(loanId: string): Promise<RepaymentWithDetails[]>;
  createRepayment(repayment: InsertRepayment): Promise<Repayment>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;

  // Demo data
  loadDemoData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private members: Map<string, Member>;
  private loans: Map<string, Loan>;
  private transactions: Map<string, Transaction>;
  private savings: Map<string, Savings>;
  private repayments: Map<string, Repayment>;

  constructor() {
    this.users = new Map();
    this.members = new Map();
    this.loans = new Map();
    this.transactions = new Map();
    this.savings = new Map();
    this.repayments = new Map();
    
    // Initialize with some sample data for demonstration
    this.initializeSampleData();
  }

  // Authentication methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      name: insertUser.name,
      email: insertUser.email,
      passwordHash: insertUser.passwordHash,
      role: insertUser.role || "member",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  private initializeSampleData() {
    // Sample members
    const member1Id = randomUUID();
    const member2Id = randomUUID();
    const member3Id = randomUUID();

    const sampleMembers = [
      {
        id: member1Id,
        memberNumber: "VFA001",
        firstName: "Mary",
        lastName: "Nakato",
        email: "mary.nakato@email.com",
        phone: "+256701234567",
        nationalId: "CM123456789",
        address: "Kampala, Uganda",
        role: "admin",
        dateJoined: new Date("2023-01-15"),
        isActive: true,
      },
      {
        id: member2Id,
        memberNumber: "VFA002",
        firstName: "Peter",
        lastName: "Okello",
        email: "peter.okello@email.com",
        phone: "+256702345678",
        nationalId: "CM987654321",
        address: "Gulu, Uganda",
        role: "manager",
        dateJoined: new Date("2023-03-20"),
        isActive: true,
      },
      {
        id: member3Id,
        memberNumber: "VFA003",
        firstName: "Sarah",
        lastName: "Akello",
        email: "sarah.akello@email.com",
        phone: "+256703456789",
        nationalId: "CM456789123",
        address: "Jinja, Uganda",
        role: "member",
        dateJoined: new Date("2024-01-10"),
        isActive: true,
      }
    ];

    sampleMembers.forEach(member => this.members.set(member.id, member));

    // Sample savings
    const sampleSavings = [
      { id: randomUUID(), memberId: member1Id, balance: "2500000", lastUpdated: new Date() },
      { id: randomUUID(), memberId: member2Id, balance: "1800000", lastUpdated: new Date() },
      { id: randomUUID(), memberId: member3Id, balance: "500000", lastUpdated: new Date() },
    ];

    sampleSavings.forEach(saving => this.savings.set(saving.memberId, saving));

    // Sample loans
    const loan1Id = randomUUID();
    const loan2Id = randomUUID();
    const sampleLoans = [
      {
        id: loan1Id,
        memberId: member2Id,
        loanNumber: "LN001",
        principal: "1500000",
        interestRate: "15.00",
        termMonths: 12,
        disbursementDate: new Date("2024-01-01"),
        dueDate: new Date("2024-12-31"),
        status: "active",
        balance: "1200000",
        intendedPurpose: "Equipment purchase",
        approvedBy: member1Id,
        approvedAt: new Date("2023-12-28"),
        createdAt: new Date("2024-01-01"),
      },
      {
        id: loan2Id,
        memberId: member3Id,
        loanNumber: "LN002",
        principal: "800000",
        interestRate: "14.00",
        termMonths: 6,
        disbursementDate: null,
        dueDate: null,
        status: "pending",
        balance: "800000",
        intendedPurpose: "Education fees",
        approvedBy: null,
        approvedAt: null,
        createdAt: new Date("2024-02-10"),
      }
    ];

    sampleLoans.forEach(loan => this.loans.set(loan.id, loan));

    // Sample transactions
    const sampleTransactions = [
      {
        id: randomUUID(),
        memberId: member1Id,
        loanId: null,
        type: "deposit",
        amount: "250000",
        description: "Savings Deposit - Mary Nakato",
        transactionDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        processedBy: "John Doe",
      },
      {
        id: randomUUID(),
        memberId: member2Id,
        loanId: loan1Id,
        type: "loan_disbursement",
        amount: "1500000",
        description: "Loan Disbursement - Peter Okello",
        transactionDate: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        processedBy: "John Doe",
      },
      {
        id: randomUUID(),
        memberId: member3Id,
        loanId: null,
        type: "deposit",
        amount: "500000",
        description: "New Member Registration - Sarah Akello",
        transactionDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        processedBy: "John Doe",
      }
    ];

    sampleTransactions.forEach(transaction => this.transactions.set(transaction.id, transaction));
  }

  async getMembers(): Promise<MemberWithSavings[]> {
    const members = Array.from(this.members.values());
    return members.map(member => {
      const savings = this.savings.get(member.id);
      return {
        ...member,
        savingsBalance: savings?.balance || "0"
      };
    });
  }

  async getMember(id: string): Promise<Member | undefined> {
    return this.members.get(id);
  }

  async getMemberByNumber(memberNumber: string): Promise<Member | undefined> {
    return Array.from(this.members.values()).find(
      (member) => member.memberNumber === memberNumber
    );
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const id = randomUUID();
    const member: Member = {
      id,
      memberNumber: insertMember.memberNumber,
      firstName: insertMember.firstName,
      lastName: insertMember.lastName,
      email: insertMember.email ?? null,
      phone: insertMember.phone,
      nationalId: insertMember.nationalId ?? null,
      address: insertMember.address ?? null,
      role: insertMember.role ?? "member",
      dateJoined: new Date(),
      isActive: insertMember.isActive ?? true,
    };
    this.members.set(id, member);
    
    // Initialize savings account
    await this.createOrUpdateSavings({ memberId: id, balance: "0" });
    
    return member;
  }

  async updateMember(id: string, updates: Partial<InsertMember>): Promise<Member> {
    const existing = this.members.get(id);
    if (!existing) {
      throw new Error("Member not found");
    }
    const updated = { ...existing, ...updates };
    this.members.set(id, updated);
    return updated;
  }

  async deleteMember(id: string): Promise<void> {
    this.members.delete(id);
    this.savings.delete(id);
  }

  async getLoans(): Promise<LoanWithMember[]> {
    const loans = Array.from(this.loans.values());
    return loans.map(loan => {
      const member = this.members.get(loan.memberId);
      const approver = loan.approvedBy ? this.members.get(loan.approvedBy) : null;
      return {
        ...loan,
        memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown Member",
        approverName: approver ? `${approver.firstName} ${approver.lastName}` : undefined
      };
    });
  }

  async getLoan(id: string): Promise<Loan | undefined> {
    return this.loans.get(id);
  }

  async getLoansByMember(memberId: string): Promise<Loan[]> {
    return Array.from(this.loans.values()).filter(loan => loan.memberId === memberId);
  }

  async createLoan(insertLoan: InsertLoan): Promise<Loan> {
    const id = randomUUID();
    const loan: Loan = {
      id,
      memberId: insertLoan.memberId,
      loanNumber: insertLoan.loanNumber,
      principal: insertLoan.principal,
      interestRate: insertLoan.interestRate,
      termMonths: insertLoan.termMonths,
      disbursementDate: insertLoan.disbursementDate ?? null,
      dueDate: insertLoan.dueDate ?? null,
      status: insertLoan.status ?? "pending",
      balance: insertLoan.principal, // Initial balance equals principal
      intendedPurpose: insertLoan.intendedPurpose ?? null,
      approvedBy: insertLoan.approvedBy ?? null,
      approvedAt: insertLoan.approvedAt ?? null,
      createdAt: new Date(),
    };
    this.loans.set(id, loan);
    return loan;
  }

  async updateLoan(id: string, updates: Partial<InsertLoan>): Promise<Loan> {
    const existing = this.loans.get(id);
    if (!existing) {
      throw new Error("Loan not found");
    }
    const updated = { ...existing, ...updates };
    this.loans.set(id, updated);
    return updated;
  }

  async getLoansByStatus(status: string): Promise<LoanWithMember[]> {
    const loans = Array.from(this.loans.values()).filter(loan => loan.status === status);
    return loans.map(loan => {
      const member = this.members.get(loan.memberId);
      const approver = loan.approvedBy ? this.members.get(loan.approvedBy) : null;
      return {
        ...loan,
        memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown Member",
        approverName: approver ? `${approver.firstName} ${approver.lastName}` : undefined
      };
    });
  }

  async approveLoan(id: string, approverId: string): Promise<Loan> {
    const existing = this.loans.get(id);
    if (!existing) {
      throw new Error("Loan not found");
    }
    const updated = { 
      ...existing, 
      status: "approved",
      approvedBy: approverId,
      approvedAt: new Date()
    };
    this.loans.set(id, updated);
    return updated;
  }

  async rejectLoan(id: string, approverId: string): Promise<Loan> {
    const existing = this.loans.get(id);
    if (!existing) {
      throw new Error("Loan not found");
    }
    const updated = { 
      ...existing, 
      status: "rejected",
      approvedBy: approverId,
      approvedAt: new Date()
    };
    this.loans.set(id, updated);
    return updated;
  }

  async getTransactions(limit?: number): Promise<TransactionWithDetails[]> {
    const transactions = Array.from(this.transactions.values())
      .sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());
    
    const limitedTransactions = limit ? transactions.slice(0, limit) : transactions;
    
    return limitedTransactions.map(transaction => {
      const member = transaction.memberId ? this.members.get(transaction.memberId) : null;
      return {
        ...transaction,
        memberName: member ? `${member.firstName} ${member.lastName}` : undefined
      };
    });
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByMember(memberId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      transaction => transaction.memberId === memberId
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      id,
      type: insertTransaction.type,
      memberId: insertTransaction.memberId ?? null,
      loanId: insertTransaction.loanId ?? null,
      amount: insertTransaction.amount,
      description: insertTransaction.description,
      transactionDate: new Date(),
      processedBy: insertTransaction.processedBy,
    };
    this.transactions.set(id, transaction);

    // Update savings balance if it's a deposit/withdrawal
    if (insertTransaction.memberId && (insertTransaction.type === "deposit" || insertTransaction.type === "withdrawal")) {
      const currentSavings = this.savings.get(insertTransaction.memberId);
      if (currentSavings) {
        const currentBalance = parseFloat(currentSavings.balance);
        const transactionAmount = parseFloat(insertTransaction.amount);
        const newBalance = insertTransaction.type === "deposit" 
          ? currentBalance + transactionAmount 
          : currentBalance - transactionAmount;
        
        await this.createOrUpdateSavings({
          memberId: insertTransaction.memberId,
          balance: newBalance.toString()
        });
      }
    }

    return transaction;
  }

  async getSavings(memberId: string): Promise<Savings | undefined> {
    return this.savings.get(memberId);
  }

  async createOrUpdateSavings(insertSavings: InsertSavings): Promise<Savings> {
    const existing = this.savings.get(insertSavings.memberId);
    const savings: Savings = {
      id: existing?.id || randomUUID(),
      memberId: insertSavings.memberId,
      balance: insertSavings.balance ?? "0",
      lastUpdated: new Date(),
    };
    this.savings.set(insertSavings.memberId, savings);
    return savings;
  }

  async getRepayments(): Promise<RepaymentWithDetails[]> {
    const repayments = Array.from(this.repayments.values());
    return repayments.map(repayment => {
      const loan = this.loans.get(repayment.loanId);
      const member = loan ? this.members.get(loan.memberId) : null;
      const processor = this.members.get(repayment.processedBy);
      return {
        ...repayment,
        loanNumber: loan?.loanNumber || "Unknown",
        memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown Member",
        processorName: processor ? `${processor.firstName} ${processor.lastName}` : "Unknown Processor"
      };
    });
  }

  async getRepaymentsByLoan(loanId: string): Promise<RepaymentWithDetails[]> {
    const repayments = Array.from(this.repayments.values()).filter(r => r.loanId === loanId);
    return repayments.map(repayment => {
      const loan = this.loans.get(repayment.loanId);
      const member = loan ? this.members.get(loan.memberId) : null;
      const processor = this.members.get(repayment.processedBy);
      return {
        ...repayment,
        loanNumber: loan?.loanNumber || "Unknown",
        memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown Member",
        processorName: processor ? `${processor.firstName} ${processor.lastName}` : "Unknown Processor"
      };
    });
  }

  async createRepayment(insertRepayment: InsertRepayment): Promise<Repayment> {
    const id = randomUUID();
    const repayment: Repayment = {
      id,
      loanId: insertRepayment.loanId,
      amount: insertRepayment.amount,
      paymentMethod: insertRepayment.paymentMethod,
      processedBy: insertRepayment.processedBy,
      paymentDate: new Date(),
      notes: insertRepayment.notes ?? null,
    };
    this.repayments.set(id, repayment);

    // Update loan balance
    const loan = this.loans.get(insertRepayment.loanId);
    if (loan) {
      const currentBalance = parseFloat(loan.balance);
      const paymentAmount = parseFloat(insertRepayment.amount);
      const newBalance = Math.max(0, currentBalance - paymentAmount);
      
      // Update loan balance directly
      const updated = { 
        ...loan, 
        balance: newBalance.toString(),
        status: newBalance === 0 ? "paid" : loan.status
      };
      this.loans.set(insertRepayment.loanId, updated);

      // Create a transaction record
      const member = this.members.get(loan.memberId);
      if (member) {
        await this.createTransaction({
          memberId: member.id,
          loanId: loan.id,
          type: "loan_payment",
          amount: insertRepayment.amount,
          description: `Loan payment for ${loan.loanNumber} - ${member.firstName} ${member.lastName}`,
          processedBy: insertRepayment.processedBy
        });
      }
    }

    return repayment;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const members = Array.from(this.members.values());
    const loans = Array.from(this.loans.values());
    const savings = Array.from(this.savings.values());
    const transactions = Array.from(this.transactions.values());

    const totalMembers = members.filter(m => m.isActive).length;
    const totalSavings = savings.reduce((sum, s) => sum + parseFloat(s.balance), 0);
    const activeLoansTotal = loans
      .filter(l => l.status === "active")
      .reduce((sum, l) => sum + parseFloat(l.balance), 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyTransactions = transactions.filter(t => 
      t.transactionDate.getMonth() === currentMonth &&
      t.transactionDate.getFullYear() === currentYear
    );
    
    const monthlyRevenue = monthlyTransactions
      .filter(t => t.type === "loan_payment")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const pendingLoans = loans.filter(l => l.status === "pending").length;
    const totalLoansPrincipal = loans.reduce((sum, l) => sum + parseFloat(l.principal), 0);
    const totalPaidAmount = totalLoansPrincipal - activeLoansTotal;
    const defaultRate = totalLoansPrincipal > 0 ? 
      ((loans.filter(l => l.status === "defaulted").length / loans.length) * 100).toFixed(1) : "0.0";

    return {
      totalMembers,
      totalSavings: `UGX ${(totalSavings / 1000000).toFixed(1)}M`,
      activeLoans: `UGX ${(activeLoansTotal / 1000000).toFixed(1)}M`,
      monthlyRevenue: `UGX ${(monthlyRevenue / 1000000).toFixed(1)}M`,
      memberGrowth: 12,
      savingsGrowth: "+8.2%",
      loanCount: loans.filter(l => l.status === "active").length,
      revenueGrowth: "+15.3%",
      pendingLoans,
      defaultRate: `${defaultRate}%`,
    };
  }

  async loadDemoData(): Promise<void> {
    // Clear existing data
    this.members.clear();
    this.loans.clear();
    this.transactions.clear();
    this.savings.clear();
    this.repayments.clear();

    // Create more comprehensive demo data
    const memberIds: string[] = [];
    const loanIds: string[] = [];

    // Create 15 demo members
    const memberNames = [
      { firstName: "Mary", lastName: "Nakato", email: "mary.nakato@email.com" },
      { firstName: "Peter", lastName: "Okello", email: "peter.okello@email.com" },
      { firstName: "Sarah", lastName: "Akello", email: "sarah.akello@email.com" },
      { firstName: "John", lastName: "Mukasa", email: "john.mukasa@email.com" },
      { firstName: "Grace", lastName: "Nabirye", email: "grace.nabirye@email.com" },
      { firstName: "David", lastName: "Ssekandi", email: "david.ssekandi@email.com" },
      { firstName: "Ruth", lastName: "Namubiru", email: "ruth.namubiru@email.com" },
      { firstName: "Moses", lastName: "Lubega", email: "moses.lubega@email.com" },
      { firstName: "Joyce", lastName: "Tumwebaze", email: "joyce.tumwebaze@email.com" },
      { firstName: "Samuel", lastName: "Kigozi", email: "samuel.kigozi@email.com" },
      { firstName: "Rebecca", lastName: "Nakaweesi", email: "rebecca.nakaweesi@email.com" },
      { firstName: "James", lastName: "Watako", email: "james.watako@email.com" },
      { firstName: "Esther", lastName: "Nansubuga", email: "esther.nansubuga@email.com" },
      { firstName: "Daniel", lastName: "Ssemanda", email: "daniel.ssemanda@email.com" },
      { firstName: "Agnes", lastName: "Kiconco", email: "agnes.kiconco@email.com" }
    ];

    for (let i = 0; i < memberNames.length; i++) {
      const memberId = randomUUID();
      memberIds.push(memberId);
      
      const member: Member = {
        id: memberId,
        memberNumber: `VFA${String(i + 1).padStart(3, '0')}`,
        firstName: memberNames[i].firstName,
        lastName: memberNames[i].lastName,
        email: memberNames[i].email,
        phone: `+25670${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
        nationalId: `CM${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
        address: ["Kampala", "Entebbe", "Jinja", "Gulu", "Mbarara", "Fort Portal"][Math.floor(Math.random() * 6)] + ", Uganda",
        role: i === 0 ? "admin" : i === 1 ? "manager" : "member",
        dateJoined: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        isActive: true,
      };
      
      this.members.set(memberId, member);

      // Create savings for each member
      const savingsAmount = Math.floor(Math.random() * 5000000) + 500000; // 500K to 5.5M
      const savings: Savings = {
        id: randomUUID(),
        memberId,
        balance: String(savingsAmount),
        lastUpdated: new Date(),
      };
      this.savings.set(memberId, savings);
    }

    // Create demo loans
    const loanStatuses = ["active", "pending", "paid", "overdue", "approved"];
    const purposes = ["Equipment purchase", "Education fees", "Medical expenses", "Business expansion", "Agriculture", "Housing"];
    
    for (let i = 0; i < 12; i++) {
      const loanId = randomUUID();
      loanIds.push(loanId);
      
      const principal = Math.floor(Math.random() * 10000000) + 500000; // 500K to 10.5M
      const balance = Math.floor(principal * (0.3 + Math.random() * 0.7)); // 30-100% of principal
      const status = loanStatuses[Math.floor(Math.random() * loanStatuses.length)];
      const termMonths = [6, 12, 18, 24, 36][Math.floor(Math.random() * 5)];
      
      const loan: Loan = {
        id: loanId,
        memberId: memberIds[Math.floor(Math.random() * memberIds.length)],
        loanNumber: `LN${String(i + 1).padStart(3, '0')}`,
        principal: String(principal),
        interestRate: String(12 + Math.random() * 8), // 12-20%
        termMonths,
        disbursementDate: status !== "pending" ? new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000) : null,
        dueDate: status !== "pending" ? new Date(Date.now() + termMonths * 30 * 24 * 60 * 60 * 1000) : null,
        status,
        balance: String(balance),
        intendedPurpose: purposes[Math.floor(Math.random() * purposes.length)],
        approvedBy: status !== "pending" ? memberIds[0] : null, // Admin approves
        approvedAt: status !== "pending" ? new Date(Date.now() - Math.random() * 200 * 24 * 60 * 60 * 1000) : null,
        createdAt: new Date(Date.now() - Math.random() * 200 * 24 * 60 * 60 * 1000),
      };
      
      this.loans.set(loanId, loan);
    }

    // Create demo transactions (last 6 months)
    const transactionTypes = ["deposit", "withdrawal", "loan_disbursement", "loan_payment"];
    
    for (let i = 0; i < 50; i++) {
      const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const memberId = memberIds[Math.floor(Math.random() * memberIds.length)];
      const loanId = (type === "loan_disbursement" || type === "loan_payment") ? 
        loanIds[Math.floor(Math.random() * loanIds.length)] : null;
      
      let amount: number;
      switch (type) {
        case "deposit":
          amount = Math.floor(Math.random() * 2000000) + 100000; // 100K - 2.1M
          break;
        case "withdrawal":
          amount = Math.floor(Math.random() * 1000000) + 50000; // 50K - 1.05M
          break;
        case "loan_disbursement":
          amount = Math.floor(Math.random() * 8000000) + 500000; // 500K - 8.5M
          break;
        case "loan_payment":
          amount = Math.floor(Math.random() * 500000) + 50000; // 50K - 550K
          break;
        default:
          amount = 100000;
      }
      
      const member = this.members.get(memberId);
      const transaction: Transaction = {
        id: randomUUID(),
        memberId,
        loanId,
        type,
        amount: String(amount),
        description: `${type.replace('_', ' ')} - ${member?.firstName} ${member?.lastName}`,
        transactionDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000), // Last 6 months
        processedBy: "Demo System",
      };
      
      this.transactions.set(transaction.id, transaction);
    }

    // Create demo repayments
    const activeLoanIds = Array.from(this.loans.values())
      .filter(l => l.status === "active" || l.status === "paid")
      .map(l => l.id);
      
    for (let i = 0; i < 20; i++) {
      if (activeLoanIds.length === 0) break;
      
      const loanId = activeLoanIds[Math.floor(Math.random() * activeLoanIds.length)];
      const loan = this.loans.get(loanId);
      if (!loan) continue;
      
      const repayment: Repayment = {
        id: randomUUID(),
        loanId,
        amount: String(Math.floor(Math.random() * 400000) + 100000), // 100K - 500K
        paymentMethod: ["cash", "bank_transfer", "mobile_money"][Math.floor(Math.random() * 3)],
        processedBy: memberIds[0], // Admin processes
        paymentDate: new Date(Date.now() - Math.random() * 120 * 24 * 60 * 60 * 1000), // Last 4 months
        notes: "Regular monthly payment",
      };
      
      this.repayments.set(repayment.id, repayment);
    }
  }
}

import { DatabaseStorage } from './database-storage-fixed';

export const storage = new DatabaseStorage();
