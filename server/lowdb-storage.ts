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
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import type { IStorage } from './storage';

interface DatabaseData {
  members: Member[];
  loans: Loan[];
  transactions: Transaction[];
  savings: Savings[];
  repayments: Repayment[];
}

const defaultData: DatabaseData = {
  members: [],
  loans: [],
  transactions: [],
  savings: [],
  repayments: []
};

export class LowDBStorage implements IStorage {
  private db: Low<DatabaseData>;
  private initialized = false;

  constructor() {
    const adapter = new JSONFile<DatabaseData>('db.json');
    this.db = new Low(adapter, defaultData);
  }

  private async ensureInitialized() {
    if (this.initialized) return;
    
    await this.db.read();
    
    // Convert date strings back to Date objects
    this.db.data.members = this.db.data.members.map(member => ({
      ...member,
      dateJoined: new Date(member.dateJoined)
    }));
    
    this.db.data.loans = this.db.data.loans.map(loan => ({
      ...loan,
      disbursementDate: loan.disbursementDate ? new Date(loan.disbursementDate) : null,
      dueDate: loan.dueDate ? new Date(loan.dueDate) : null,
      approvedAt: loan.approvedAt ? new Date(loan.approvedAt) : null,
      createdAt: new Date(loan.createdAt)
    }));
    
    this.db.data.transactions = this.db.data.transactions.map(transaction => ({
      ...transaction,
      transactionDate: new Date(transaction.transactionDate)
    }));
    
    this.db.data.savings = this.db.data.savings.map(saving => ({
      ...saving,
      lastUpdated: new Date(saving.lastUpdated)
    }));
    
    this.db.data.repayments = this.db.data.repayments.map(repayment => ({
      ...repayment,
      paymentDate: new Date(repayment.paymentDate)
    }));
    
    // Initialize with sample data if database is empty
    if (this.db.data.members.length === 0) {
      await this.initializeSampleData();
    }
    
    this.initialized = true;
  }

  private async initializeSampleData() {
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

    this.db.data.members = sampleMembers;

    // Sample savings
    const sampleSavings = [
      { id: randomUUID(), memberId: member1Id, balance: "2500000", lastUpdated: new Date() },
      { id: randomUUID(), memberId: member2Id, balance: "1800000", lastUpdated: new Date() },
      { id: randomUUID(), memberId: member3Id, balance: "500000", lastUpdated: new Date() },
    ];

    this.db.data.savings = sampleSavings;

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

    this.db.data.loans = sampleLoans;

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
        processedBy: "Mary Nakato",
      },
      {
        id: randomUUID(),
        memberId: member3Id,
        loanId: null,
        type: "deposit",
        amount: "100000",
        description: "Savings Deposit - Sarah Akello",
        transactionDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        processedBy: "Mary Nakato",
      }
    ];

    this.db.data.transactions = sampleTransactions;

    await this.db.write();
  }

  async getMembers(): Promise<MemberWithSavings[]> {
    await this.ensureInitialized();
    return this.db.data.members.map(member => {
      const savings = this.db.data.savings.find(s => s.memberId === member.id);
      return {
        ...member,
        savingsBalance: savings?.balance || "0"
      };
    });
  }

  async getMember(id: string): Promise<Member | undefined> {
    await this.ensureInitialized();
    return this.db.data.members.find(m => m.id === id);
  }

  async getMemberByNumber(memberNumber: string): Promise<Member | undefined> {
    await this.ensureInitialized();
    return this.db.data.members.find(m => m.memberNumber === memberNumber);
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    await this.ensureInitialized();
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
    
    this.db.data.members.push(member);
    
    // Initialize savings account
    await this.createOrUpdateSavings({ memberId: id, balance: "0" });
    
    await this.db.write();
    return member;
  }

  async updateMember(id: string, updates: Partial<InsertMember>): Promise<Member> {
    await this.ensureInitialized();
    const memberIndex = this.db.data.members.findIndex(m => m.id === id);
    if (memberIndex === -1) {
      throw new Error("Member not found");
    }
    
    this.db.data.members[memberIndex] = { ...this.db.data.members[memberIndex], ...updates };
    await this.db.write();
    return this.db.data.members[memberIndex];
  }

  async deleteMember(id: string): Promise<void> {
    await this.ensureInitialized();
    this.db.data.members = this.db.data.members.filter(m => m.id !== id);
    this.db.data.savings = this.db.data.savings.filter(s => s.memberId !== id);
    await this.db.write();
  }

  async getLoans(): Promise<LoanWithMember[]> {
    await this.ensureInitialized();
    return this.db.data.loans.map(loan => {
      const member = this.db.data.members.find(m => m.id === loan.memberId);
      const approver = loan.approvedBy ? this.db.data.members.find(m => m.id === loan.approvedBy) : null;
      return {
        ...loan,
        memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown Member",
        approverName: approver ? `${approver.firstName} ${approver.lastName}` : undefined
      };
    });
  }

  async getLoan(id: string): Promise<Loan | undefined> {
    await this.ensureInitialized();
    return this.db.data.loans.find(l => l.id === id);
  }

  async getLoansByMember(memberId: string): Promise<Loan[]> {
    await this.ensureInitialized();
    return this.db.data.loans.filter(loan => loan.memberId === memberId);
  }

  async createLoan(insertLoan: InsertLoan): Promise<Loan> {
    await this.ensureInitialized();
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
    
    this.db.data.loans.push(loan);
    await this.db.write();
    return loan;
  }

  async updateLoan(id: string, updates: Partial<InsertLoan>): Promise<Loan> {
    await this.ensureInitialized();
    const loanIndex = this.db.data.loans.findIndex(l => l.id === id);
    if (loanIndex === -1) {
      throw new Error("Loan not found");
    }
    
    this.db.data.loans[loanIndex] = { ...this.db.data.loans[loanIndex], ...updates };
    await this.db.write();
    return this.db.data.loans[loanIndex];
  }

  async getLoansByStatus(status: string): Promise<LoanWithMember[]> {
    await this.ensureInitialized();
    const filteredLoans = this.db.data.loans.filter(loan => loan.status === status);
    return filteredLoans.map(loan => {
      const member = this.db.data.members.find(m => m.id === loan.memberId);
      const approver = loan.approvedBy ? this.db.data.members.find(m => m.id === loan.approvedBy) : null;
      return {
        ...loan,
        memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown Member",
        approverName: approver ? `${approver.firstName} ${approver.lastName}` : undefined
      };
    });
  }

  async approveLoan(id: string, approverId: string): Promise<Loan> {
    await this.ensureInitialized();
    const loanIndex = this.db.data.loans.findIndex(l => l.id === id);
    if (loanIndex === -1) {
      throw new Error("Loan not found");
    }
    
    this.db.data.loans[loanIndex] = { 
      ...this.db.data.loans[loanIndex],
      status: "approved",
      approvedBy: approverId,
      approvedAt: new Date()
    };
    
    await this.db.write();
    return this.db.data.loans[loanIndex];
  }

  async rejectLoan(id: string, approverId: string): Promise<Loan> {
    await this.ensureInitialized();
    const loanIndex = this.db.data.loans.findIndex(l => l.id === id);
    if (loanIndex === -1) {
      throw new Error("Loan not found");
    }
    
    this.db.data.loans[loanIndex] = { 
      ...this.db.data.loans[loanIndex],
      status: "rejected",
      approvedBy: approverId,
      approvedAt: new Date()
    };
    
    await this.db.write();
    return this.db.data.loans[loanIndex];
  }

  async getTransactions(limit?: number): Promise<TransactionWithDetails[]> {
    await this.ensureInitialized();
    const transactions = this.db.data.transactions
      .sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());
    
    const limitedTransactions = limit ? transactions.slice(0, limit) : transactions;
    
    return limitedTransactions.map(transaction => {
      const member = transaction.memberId ? this.db.data.members.find(m => m.id === transaction.memberId) : null;
      return {
        ...transaction,
        memberName: member ? `${member.firstName} ${member.lastName}` : undefined
      };
    });
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    await this.ensureInitialized();
    return this.db.data.transactions.find(t => t.id === id);
  }

  async getTransactionsByMember(memberId: string): Promise<Transaction[]> {
    await this.ensureInitialized();
    return this.db.data.transactions.filter(t => t.memberId === memberId);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    await this.ensureInitialized();
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
    
    this.db.data.transactions.push(transaction);

    // Update savings balance if it's a deposit/withdrawal
    if (insertTransaction.memberId && (insertTransaction.type === "deposit" || insertTransaction.type === "withdrawal")) {
      const savingsIndex = this.db.data.savings.findIndex(s => s.memberId === insertTransaction.memberId);
      if (savingsIndex !== -1) {
        const currentBalance = parseFloat(this.db.data.savings[savingsIndex].balance);
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

    await this.db.write();
    return transaction;
  }

  async getSavings(memberId: string): Promise<Savings | undefined> {
    await this.ensureInitialized();
    return this.db.data.savings.find(s => s.memberId === memberId);
  }

  async createOrUpdateSavings(insertSavings: InsertSavings): Promise<Savings> {
    await this.ensureInitialized();
    const existingIndex = this.db.data.savings.findIndex(s => s.memberId === insertSavings.memberId);
    
    const savings: Savings = {
      id: existingIndex !== -1 ? this.db.data.savings[existingIndex].id : randomUUID(),
      memberId: insertSavings.memberId,
      balance: insertSavings.balance ?? "0",
      lastUpdated: new Date(),
    };
    
    if (existingIndex !== -1) {
      this.db.data.savings[existingIndex] = savings;
    } else {
      this.db.data.savings.push(savings);
    }
    
    await this.db.write();
    return savings;
  }

  async getRepayments(): Promise<RepaymentWithDetails[]> {
    await this.ensureInitialized();
    return this.db.data.repayments.map(repayment => {
      const loan = this.db.data.loans.find(l => l.id === repayment.loanId);
      const member = loan ? this.db.data.members.find(m => m.id === loan.memberId) : null;
      const processor = this.db.data.members.find(m => m.id === repayment.processedBy);
      return {
        ...repayment,
        loanNumber: loan?.loanNumber || "Unknown",
        memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown Member",
        processorName: processor ? `${processor.firstName} ${processor.lastName}` : "Unknown Processor"
      };
    });
  }

  async getRepaymentsByLoan(loanId: string): Promise<RepaymentWithDetails[]> {
    await this.ensureInitialized();
    const repayments = this.db.data.repayments.filter(r => r.loanId === loanId);
    return repayments.map(repayment => {
      const loan = this.db.data.loans.find(l => l.id === repayment.loanId);
      const member = loan ? this.db.data.members.find(m => m.id === loan.memberId) : null;
      const processor = this.db.data.members.find(m => m.id === repayment.processedBy);
      return {
        ...repayment,
        loanNumber: loan?.loanNumber || "Unknown",
        memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown Member",
        processorName: processor ? `${processor.firstName} ${processor.lastName}` : "Unknown Processor"
      };
    });
  }

  async createRepayment(insertRepayment: InsertRepayment): Promise<Repayment> {
    await this.ensureInitialized();
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
    
    this.db.data.repayments.push(repayment);

    // Update loan balance
    const loanIndex = this.db.data.loans.findIndex(l => l.id === insertRepayment.loanId);
    if (loanIndex !== -1) {
      const loan = this.db.data.loans[loanIndex];
      const currentBalance = parseFloat(loan.balance);
      const paymentAmount = parseFloat(insertRepayment.amount);
      const newBalance = Math.max(0, currentBalance - paymentAmount);
      
      // Update loan balance directly
      this.db.data.loans[loanIndex] = {
        ...loan,
        balance: newBalance.toString(),
        status: newBalance === 0 ? "paid" : loan.status
      };

      // Create a transaction record
      const member = this.db.data.members.find(m => m.id === loan.memberId);
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

    await this.db.write();
    return repayment;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    await this.ensureInitialized();
    const members = this.db.data.members;
    const loans = this.db.data.loans;
    const savings = this.db.data.savings;
    const transactions = this.db.data.transactions;

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
    this.db.data = {
      members: [],
      loans: [],
      transactions: [],
      savings: [],
      repayments: []
    };

    // Create comprehensive demo data
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
      
      this.db.data.members.push(member);

      // Create savings for each member
      const savingsAmount = Math.floor(Math.random() * 5000000) + 500000; // 500K to 5.5M
      const savings: Savings = {
        id: randomUUID(),
        memberId,
        balance: String(savingsAmount),
        lastUpdated: new Date(),
      };
      this.db.data.savings.push(savings);
    }

    // Create demo loans with realistic data
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
      
      this.db.data.loans.push(loan);
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
      
      const member = this.db.data.members.find(m => m.id === memberId);
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
      
      this.db.data.transactions.push(transaction);
    }

    // Create demo repayments
    const activeLoans = this.db.data.loans.filter(l => l.status === "active" || l.status === "paid");
      
    for (let i = 0; i < 20; i++) {
      if (activeLoans.length === 0) break;
      
      const loan = activeLoans[Math.floor(Math.random() * activeLoans.length)];
      
      const repayment: Repayment = {
        id: randomUUID(),
        loanId: loan.id,
        amount: String(Math.floor(Math.random() * 400000) + 100000), // 100K - 500K
        paymentMethod: ["cash", "bank_transfer", "mobile_money"][Math.floor(Math.random() * 3)],
        processedBy: memberIds[0], // Admin processes
        paymentDate: new Date(Date.now() - Math.random() * 120 * 24 * 60 * 60 * 1000), // Last 4 months
        notes: "Regular monthly payment",
      };
      
      this.db.data.repayments.push(repayment);
    }

    await this.db.write();
  }
}