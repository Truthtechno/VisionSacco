import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CreditCard, DollarSign, Calendar, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { Loan, Transaction, Savings } from "@shared/schema";

export default function MemberPortal() {
  const { user } = useAuth();
  const [showLoanRequest, setShowLoanRequest] = useState(false);

  // For now, since we have demo data in the members table, let's fetch from demo members
  // In a real app, we'd match auth users to member records
  const demoMemberId = "M001"; // This should be mapped from user.id to member.id

  // Fetch member's loans (using demo data approach)
  const { data: allLoans = [], isLoading: loansLoading } = useQuery<Loan[]>({
    queryKey: ['/api/loans'],
  });

  // Filter loans for this member (demo approach)
  const loans = allLoans.filter(loan => loan.memberId === demoMemberId);

  // Fetch member's transactions (using demo data approach)
  const { data: allTransactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  // Filter transactions for this member
  const transactions = allTransactions.filter(transaction => transaction.memberId === demoMemberId);

  // Fetch member's savings
  const { data: savings } = useQuery<Savings>({
    queryKey: ['/api/members', demoMemberId, 'savings'],
  });

  const formatCurrency = (amount: string) => {
    return `UGX ${parseFloat(amount).toLocaleString()}`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800", 
      active: "bg-blue-100 text-blue-800",
      paid: "bg-gray-100 text-gray-800",
      rejected: "bg-red-100 text-red-800",
      overdue: "bg-red-100 text-red-800"
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
          Member Portal
        </h1>
        <Button onClick={() => setShowLoanRequest(true)} data-testid="button-request-loan">
          <Plus className="h-4 w-4 mr-2" />
          Request Loan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card data-testid="card-savings-balance">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-savings-amount">
              {savings ? formatCurrency(savings.balance) : "UGX 0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated: {savings ? formatDate(savings.lastUpdated) : "Never"}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-loans">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-loans-count">
              {loans.filter(loan => loan.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total outstanding
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-requests">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-requests-count">
              {loans.filter(loan => loan.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="loans" className="space-y-4">
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="loans" data-testid="tab-loans">My Loans</TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="space-y-4">
          <Card data-testid="card-loans-list">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                My Loan Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loansLoading ? (
                <div className="text-center py-8" data-testid="loading-loans">
                  Loading loans...
                </div>
              ) : loans.length === 0 ? (
                <div className="text-center py-8 text-gray-500" data-testid="no-loans">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  No loan applications yet
                  <p className="text-sm">Click "Request Loan" to apply for your first loan</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {loans.map((loan) => (
                    <div key={loan.id} className="border rounded-lg p-4" data-testid={`loan-item-${loan.id}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold" data-testid={`text-loan-number-${loan.id}`}>
                            {loan.loanNumber}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {loan.intendedPurpose || "General purpose"}
                          </p>
                        </div>
                        {getStatusBadge(loan.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Principal:</span>
                          <p className="font-medium" data-testid={`text-loan-principal-${loan.id}`}>
                            {formatCurrency(loan.principal)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Balance:</span>
                          <p className="font-medium" data-testid={`text-loan-balance-${loan.id}`}>
                            {formatCurrency(loan.balance)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Interest Rate:</span>
                          <p className="font-medium">{loan.interestRate}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Term:</span>
                          <p className="font-medium">{loan.termMonths} months</p>
                        </div>
                      </div>
                      {loan.disbursementDate && (
                        <div className="mt-2 text-sm text-gray-500">
                          Disbursed: {formatDate(loan.disbursementDate)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card data-testid="card-transactions-list">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="text-center py-8" data-testid="loading-transactions">
                  Loading transactions...
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500" data-testid="no-transactions">
                  No transactions yet
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center border-b pb-3" data-testid={`transaction-item-${transaction.id}`}>
                      <div>
                        <p className="font-medium" data-testid={`text-transaction-description-${transaction.id}`}>
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(transaction.transactionDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'deposit' ? 'text-green-600' : 
                          transaction.type === 'withdrawal' ? 'text-red-600' : 
                          'text-blue-600'
                        }`} data-testid={`text-transaction-amount-${transaction.id}`}>
                          {transaction.type === 'withdrawal' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {transaction.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card data-testid="card-profile-info">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>Profile management features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Loan Request Modal placeholder */}
      {showLoanRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="modal-loan-request">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Request New Loan</h2>
            <p className="text-gray-600 mb-4">
              Loan request form will be implemented here.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowLoanRequest(false)} data-testid="button-cancel-loan-request">
                Cancel
              </Button>
              <Button onClick={() => setShowLoanRequest(false)} data-testid="button-submit-loan-request">
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}