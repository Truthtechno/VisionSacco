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
    const result = await db
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
        savingsBalance: sql<string>`COALESCE(${savings.balance}, '0')`.as('savingsBalance'),
      })
      .from(members)
      .leftJoin(savings, eq(members.id, savings.memberId));
    
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
    
    // Create initial savings account
    await db
      .insert(savings)
      .values({
        memberId: newMember.id,
        balance: "0",
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
    const [updatedMember] = await db
      .update(members)
      .set({ status })
      .where(eq(members.id, id))
      .returning();
    
    if (!updatedMember) {
      throw new Error("Member not found");
    }
    
    return updatedMember;
  }

  async deleteMember(id: string): Promise<void> {
    await db
      .delete(members)
      .where(eq(members.id, id));
  }

  // Loans
  async getLoans(): Promise<LoanWithMember[]> {
    const result = await db
      .select({
        id: loans.id,
        memberId: loans.memberId,
        loanNumber: loans.loanNumber,
        principal: loans.principal,
        interestRate: loans.interestRate,
        termMonths: loans.termMonths,
        disbursementDate: loans.disbursementDate,
        dueDate: loans.dueDate,
        status: loans.status,
        balance: loans.balance,
        intendedPurpose: loans.intendedPurpose,
        approvedBy: loans.approvedBy,
        approvedAt: loans.approvedAt,
        createdAt: loans.createdAt,
        memberName: sql<string>`${members.firstName} || ' ' || ${members.lastName}`.as('memberName'),
        approverName: sql<string>`COALESCE(approver.firstName || ' ' || approver.lastName, '')`.as('approverName'),
      })
      .from(loans)
      .leftJoin(members, eq(loans.memberId, members.id))
      .leftJoin(sql`${members} as approver`, eq(loans.approvedBy, sql`approver.id`));
    
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

  async getLoansByMember(memberId: string): Promise<Loan[]> {
    return await db
      .select()
      .from(loans)
      .where(eq(loans.memberId, memberId));
  }

  async getLoansByStatus(status: string): Promise<LoanWithMember[]> {
    const result = await db
      .select({
        id: loans.id,
        memberId: loans.memberId,
        loanNumber: loans.loanNumber,
        principal: loans.principal,
        interestRate: loans.interestRate,
        termMonths: loans.termMonths,
        disbursementDate: loans.disbursementDate,
        dueDate: loans.dueDate,
        status: loans.status,
        balance: loans.balance,
        intendedPurpose: loans.intendedPurpose,
        approvedBy: loans.approvedBy,
        approvedAt: loans.approvedAt,
        createdAt: loans.createdAt,
        memberName: sql<string>`${members.firstName} || ' ' || ${members.lastName}`.as('memberName'),
        approverName: sql<string>`COALESCE(approver.firstName || ' ' || approver.lastName, '')`.as('approverName'),
      })
      .from(loans)
      .leftJoin(members, eq(loans.memberId, members.id))
      .leftJoin(sql`${members} as approver`, eq(loans.approvedBy, sql`approver.id`))
      .where(eq(loans.status, status));
    
    return result;
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
    let query = db
      .select({
        id: transactions.id,
        memberId: transactions.memberId,
        loanId: transactions.loanId,
        type: transactions.type,
        amount: transactions.amount,
        description: transactions.description,
        transactionDate: transactions.transactionDate,
        processedBy: transactions.processedBy,
        memberName: sql<string>`${members.firstName} || ' ' || ${members.lastName}`.as('memberName'),
      })
      .from(transactions)
      .leftJoin(members, eq(transactions.memberId, members.id))
      .orderBy(desc(transactions.transactionDate));
    
    if (limit) {
      return await query.limit(limit);
    }
    
    return await query;
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
    const result = await db
      .select({
        id: repayments.id,
        loanId: repayments.loanId,
        amount: repayments.amount,
        paymentMethod: repayments.paymentMethod,
        processedBy: repayments.processedBy,
        paymentDate: repayments.paymentDate,
        notes: repayments.notes,
        loanNumber: loans.loanNumber,
        memberName: sql<string>`${members.firstName} || ' ' || ${members.lastName}`.as('memberName'),
        processorName: sql<string>`processor.firstName || ' ' || processor.lastName`.as('processorName'),
      })
      .from(repayments)
      .leftJoin(loans, eq(repayments.loanId, loans.id))
      .leftJoin(members, eq(loans.memberId, members.id))
      .leftJoin(members.as('processor'), eq(repayments.processedBy, members.id))
      .orderBy(desc(repayments.paymentDate));
    
    return result;
  }

  async getRepaymentsByLoan(loanId: string): Promise<RepaymentWithDetails[]> {
    const result = await db
      .select({
        id: repayments.id,
        loanId: repayments.loanId,
        amount: repayments.amount,
        paymentMethod: repayments.paymentMethod,
        processedBy: repayments.processedBy,
        paymentDate: repayments.paymentDate,
        notes: repayments.notes,
        loanNumber: loans.loanNumber,
        memberName: sql<string>`${members.firstName} || ' ' || ${members.lastName}`.as('memberName'),
        processorName: sql<string>`processor.firstName || ' ' || processor.lastName`.as('processorName'),
      })
      .from(repayments)
      .leftJoin(loans, eq(repayments.loanId, loans.id))
      .leftJoin(members, eq(loans.memberId, members.id))
      .leftJoin(members.as('processor'), eq(repayments.processedBy, members.id))
      .where(eq(repayments.loanId, loanId))
      .orderBy(desc(repayments.paymentDate));
    
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
      .from(members);

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
    // This method can be implemented to load demo data if needed
    console.log("Demo data loading not implemented for database storage");
  }
}