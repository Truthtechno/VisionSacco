import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberNumber: text("member_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").unique(),
  phone: text("phone").notNull(),
  nationalId: text("national_id").unique(),
  address: text("address"),
  role: text("role").notNull().default("member"), // member, manager, admin
  dateJoined: timestamp("date_joined").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const loans = pgTable("loans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").references(() => members.id).notNull(),
  loanNumber: text("loan_number").notNull().unique(),
  principal: decimal("principal", { precision: 15, scale: 2 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
  termMonths: integer("term_months").notNull(),
  disbursementDate: timestamp("disbursement_date"),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"), // pending, approved, active, paid, overdue, defaulted, rejected
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull(),
  intendedPurpose: text("intended_purpose"),
  approvedBy: varchar("approved_by").references(() => members.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").references(() => members.id),
  loanId: varchar("loan_id").references(() => loans.id),
  type: text("type").notNull(), // deposit, withdrawal, loan_disbursement, loan_payment
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description").notNull(),
  transactionDate: timestamp("transaction_date").defaultNow().notNull(),
  processedBy: text("processed_by").notNull(),
});

export const savings = pgTable("savings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").references(() => members.id).notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default('0'),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const repayments = pgTable("repayments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loanId: varchar("loan_id").references(() => loans.id).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, bank_transfer, mobile_money
  processedBy: varchar("processed_by").references(() => members.id).notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  notes: text("notes"),
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  dateJoined: true,
});

export const insertLoanSchema = createInsertSchema(loans).omit({
  id: true,
  createdAt: true,
  balance: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  transactionDate: true,
});

export const insertSavingsSchema = createInsertSchema(savings).omit({
  id: true,
  lastUpdated: true,
});

export const insertRepaymentSchema = createInsertSchema(repayments).omit({
  id: true,
  paymentDate: true,
});

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loans.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertSavings = z.infer<typeof insertSavingsSchema>;
export type Savings = typeof savings.$inferSelect;
export type InsertRepayment = z.infer<typeof insertRepaymentSchema>;
export type Repayment = typeof repayments.$inferSelect;

// Derived types for API responses
export type MemberWithSavings = Member & { savingsBalance: string };
export type LoanWithMember = Loan & { memberName: string; approverName?: string };
export type TransactionWithDetails = Transaction & { memberName?: string };
export type RepaymentWithDetails = Repayment & { loanNumber: string; memberName: string; processorName: string };

export type DashboardStats = {
  totalMembers: number;
  totalSavings: string;
  activeLoans: string;
  monthlyRevenue: string;
  memberGrowth: number;
  savingsGrowth: string;
  loanCount: number;
  revenueGrowth: string;
  pendingLoans: number;
  defaultRate: string;
};
