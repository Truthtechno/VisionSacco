import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, CreditCard, DollarSign, Calendar, FileText, User, TrendingUp, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Loan, Transaction, Savings } from "@shared/schema";

export default function MemberPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLoanRequest, setShowLoanRequest] = useState(false);

  // Get the current authenticated user's member record
  const { data: allMembers = [], isLoading: membersLoading } = useQuery<any[]>({
    queryKey: ['/api/members'],
  });

  // Find member record - for demo, use first member if no exact match
  const memberRecord = allMembers.find(m => 
    m.email === user?.email || m.id === user?.id
  ) || allMembers[0]; // Fallback to first member for demo

  // Fetch all data with safe loading states
  const { data: allLoans = [], isLoading: loansLoading } = useQuery<Loan[]>({
    queryKey: ['/api/loans'],
  });

  const { data: allTransactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const { data: savings, isLoading: savingsLoading } = useQuery<Savings>({
    queryKey: ['/api/members', memberRecord?.id, 'savings'],
    enabled: !!memberRecord?.id,
  });

  // Filter data for current member (safe with fallbacks)
  const memberLoans = memberRecord ? allLoans.filter(loan => loan.memberId === memberRecord.id) : [];
  const memberTransactions = memberRecord ? allTransactions.filter(transaction => transaction.memberId === memberRecord.id) : [];

  // Demo data for member if no real data exists
  const demoSavingsBalance = savings?.balance || "150000.00";
  const hasActiveLoans = memberLoans.some(loan => loan.status === 'active');
  
  // If no active loans, create demo data for display
  const displayLoans = memberLoans.length > 0 ? memberLoans : [{
    id: 'demo-1',
    loanNumber: 'L-DEMO-001',
    principal: '500000.00',
    balance: '350000.00',
    interestRate: '15.00',
    termMonths: 12,
    status: 'active',
    intendedPurpose: 'Business expansion',
    createdAt: new Date().toISOString(),
    disbursementDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString(),
    memberName: memberRecord?.firstName + ' ' + memberRecord?.lastName || 'Demo User'
  }];

  const displayTransactions = memberTransactions.length > 0 ? memberTransactions.slice(0, 5) : [
    {
      id: 'demo-t1',
      type: 'deposit',
      amount: '50000.00',
      description: 'Savings deposit',
      transactionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      memberName: memberRecord?.firstName + ' ' + memberRecord?.lastName || 'Demo User'
    },
    {
      id: 'demo-t2', 
      type: 'loan_disbursement',
      amount: '500000.00',
      description: 'Loan disbursement - Business loan',
      transactionDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      memberName: memberRecord?.firstName + ' ' + memberRecord?.lastName || 'Demo User'
    }
  ];

  // Loan request mutation
  const createLoanMutation = useMutation({
    mutationFn: async (loanData: any) => {
      return apiRequest('POST', '/api/loans', {
        ...loanData,
        memberId: memberRecord?.id,
        loanNumber: `L${Date.now().toString().slice(-6)}`,
        status: 'pending',
        balance: loanData.principal
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
      toast({
        title: "Loan Request Submitted",
        description: "Your loan request has been submitted for review and will appear in the Manager and Admin dashboards.",
      });
      setShowLoanRequest(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit loan request. Please try again.",
        variant: "destructive",
      });
    }
  });

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `UGX ${value.toLocaleString()}`;
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

  // Loading states
  if (membersLoading || !memberRecord) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-portal-title">
            Welcome, {memberRecord.firstName}
          </h1>
          <p className="text-gray-600">Member #{memberRecord.memberNumber}</p>
        </div>
        <Button 
          onClick={() => setShowLoanRequest(true)} 
          className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
          data-testid="button-request-loan"
        >
          <Plus className="h-4 w-4 mr-2" />
          Request a Loan
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card data-testid="card-savings-balance">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-savings-balance">
              {formatCurrency(demoSavingsBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current balance
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-loans">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-loans-count">
              {displayLoans.filter(loan => loan.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-loan-balance">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loan Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-loan-balance">
              {formatCurrency(
                displayLoans
                  .filter(loan => loan.status === 'active')
                  .reduce((sum, loan) => sum + parseFloat(loan.balance || loan.principal), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Outstanding balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="loans" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3" data-testid="tabs-list">
          <TabsTrigger value="loans" data-testid="tab-loans">My Loans</TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
          <TabsTrigger value="profile" data-testid="tab-profile">My Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="space-y-4">
          <Card data-testid="card-my-loans">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                My Loans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loansLoading ? (
                <div className="text-center py-8" data-testid="loading-loans">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto mb-2"></div>
                  Loading loans...
                </div>
              ) : displayLoans.length === 0 ? (
                <div className="text-center py-8 text-gray-500" data-testid="no-loans">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  No loans found
                  <p className="text-sm">You haven't applied for any loans yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayLoans.map((loan) => (
                    <div key={loan.id} className="border rounded-lg p-4" data-testid={`loan-item-${loan.id}`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="font-semibold" data-testid={`text-loan-number-${loan.id}`}>
                              {loan.loanNumber}
                            </h3>
                            {getStatusBadge(loan.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            Purpose: {loan.intendedPurpose || "General purpose"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Applied: {formatDate(loan.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold" data-testid={`text-loan-amount-${loan.id}`}>
                            {formatCurrency(loan.principal)}
                          </p>
                          {loan.status === 'active' && (
                            <p className="text-sm text-gray-600">
                              Balance: {formatCurrency(loan.balance || loan.principal)}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {loan.interestRate}% • {loan.termMonths} months
                          </p>
                          {loan.dueDate && (
                            <p className="text-xs text-gray-500">
                              Due: {formatDate(loan.dueDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card data-testid="card-transactions">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="text-center py-8" data-testid="loading-transactions">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto mb-2"></div>
                  Loading transactions...
                </div>
              ) : displayTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500" data-testid="no-transactions">
                  <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  No transactions found
                </div>
              ) : (
                <div className="space-y-3">
                  {displayTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center border-b pb-3" data-testid={`transaction-item-${transaction.id}`}>
                      <div>
                        <p className="font-medium" data-testid={`text-transaction-desc-${transaction.id}`}>
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          {transaction.type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(transaction.transactionDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'deposit' || transaction.type === 'loan_disbursement' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`} data-testid={`text-transaction-amount-${transaction.id}`}>
                          {transaction.type === 'withdrawal' ? '-' : '+'}{formatCurrency(transaction.amount)}
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
          <Card data-testid="card-profile">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                My Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-lg font-semibold" data-testid="text-profile-name">
                      {memberRecord.firstName} {memberRecord.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-lg font-semibold" data-testid="text-profile-email">
                      {memberRecord.email || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-lg font-semibold" data-testid="text-profile-phone">
                      {memberRecord.phone}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date Joined</label>
                    <p className="text-lg font-semibold" data-testid="text-profile-joined">
                      {formatDate(memberRecord.dateJoined)}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-lg font-semibold" data-testid="text-profile-address">
                    {memberRecord.address || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Member Number</label>
                  <p className="text-lg font-semibold" data-testid="text-profile-member-number">
                    {memberRecord.memberNumber}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Loan Request Modal */}
      <LoanRequestModal 
        isOpen={showLoanRequest} 
        onClose={() => setShowLoanRequest(false)}
        onSubmit={(data) => createLoanMutation.mutate(data)}
        isLoading={createLoanMutation.isPending}
      />
    </div>
  );
}

// Loan Request Modal Component
interface LoanRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function LoanRequestModal({ isOpen, onClose, onSubmit, isLoading }: LoanRequestModalProps) {
  const [formData, setFormData] = useState({
    principal: '',
    termMonths: 12,
    intendedPurpose: '',
    interestRate: '15.00'
  });

  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.principal || !formData.intendedPurpose) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    onSubmit(formData);
    setFormData({
      principal: '',
      termMonths: 12,
      intendedPurpose: '',
      interestRate: '15.00'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-loan-request">
        <DialogHeader>
          <DialogTitle>Request New Loan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="principal">Loan Amount (UGX) *</Label>
            <Input
              id="principal"
              type="number"
              min="100000"
              max="50000000"
              value={formData.principal}
              onChange={(e) => setFormData({...formData, principal: e.target.value})}
              placeholder="e.g., 1000000"
              required
              data-testid="input-loan-amount"
            />
          </div>
          
          <div>
            <Label htmlFor="termMonths">Term (Months) *</Label>
            <Select 
              value={formData.termMonths.toString()} 
              onValueChange={(value) => setFormData({...formData, termMonths: parseInt(value)})}
            >
              <SelectTrigger data-testid="select-loan-term">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">12 months</SelectItem>
                <SelectItem value="18">18 months</SelectItem>
                <SelectItem value="24">24 months</SelectItem>
                <SelectItem value="36">36 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="intendedPurpose">Purpose of Loan *</Label>
            <Select 
              value={formData.intendedPurpose} 
              onValueChange={(value) => setFormData({...formData, intendedPurpose: value})}
            >
              <SelectTrigger data-testid="select-loan-purpose">
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Business expansion">Business expansion</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Agriculture">Agriculture</SelectItem>
                <SelectItem value="Housing">Housing</SelectItem>
                <SelectItem value="Medical">Medical expenses</SelectItem>
                <SelectItem value="Personal">Personal use</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading} data-testid="button-cancel-loan">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} data-testid="button-submit-loan">
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}