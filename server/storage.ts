import { 
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
  // Members
  getMembers(): Promise<MemberWithSavings[]>;
  getMember(id: string): Promise<Member | undefined>;
  getMemberByNumber(memberNumber: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: string, updates: Partial<InsertMember>): Promise<Member>;
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
}

export class MemStorage implements IStorage {
  private members: Map<string, Member>;
  private loans: Map<string, Loan>;
  private transactions: Map<string, Transaction>;
  private savings: Map<string, Savings>;
  private repayments: Map<string, Repayment>;

  constructor() {
    this.members = new Map();
    this.loans = new Map();
    this.transactions = new Map();
    this.savings = new Map();
    this.repayments = new Map();
    
    // Initialize with some sample data for demonstration
    this.initializeSampleData();
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
      ...insertMember,
      id,
      dateJoined: new Date(),
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
      ...insertLoan,
      id,
      balance: insertLoan.principal, // Initial balance equals principal
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
      ...insertTransaction,
      id,
      transactionDate: new Date(),
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
      ...insertSavings,
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
      ...insertRepayment,
      id,
      paymentDate: new Date(),
    };
    this.repayments.set(id, repayment);

    // Update loan balance
    const loan = this.loans.get(insertRepayment.loanId);
    if (loan) {
      const currentBalance = parseFloat(loan.balance);
      const paymentAmount = parseFloat(insertRepayment.amount);
      const newBalance = Math.max(0, currentBalance - paymentAmount);
      
      await this.updateLoan(insertRepayment.loanId, {
        balance: newBalance.toString(),
        status: newBalance === 0 ? "paid" : loan.status
      });

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
}

export const storage = new MemStorage();
