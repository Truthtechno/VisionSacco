import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Users, CreditCard, TrendingUp, FileText, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { LoanWithMember, DashboardStats } from "@shared/schema";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [selectedLoan, setSelectedLoan] = useState<LoanWithMember | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  // Fetch pending loans
  const { data: pendingLoans = [], isLoading: pendingLoading } = useQuery<LoanWithMember[]>({
    queryKey: ['/api/loans?status=pending'],
  });

  // Fetch all loans for overview
  const { data: allLoans = [], isLoading: loansLoading } = useQuery<LoanWithMember[]>({
    queryKey: ['/api/loans'],
  });

  // Approve loan mutation
  const approveLoanMutation = useMutation({
    mutationFn: async (loanId: string) => {
      return apiRequest('POST', `/api/loans/${loanId}/approve`, { approverId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Loan Approved",
        description: "The loan has been approved successfully.",
      });
      setSelectedLoan(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve loan. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Reject loan mutation
  const rejectLoanMutation = useMutation({
    mutationFn: async (loanId: string) => {
      return apiRequest('POST', `/api/loans/${loanId}/reject`, { approverId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Loan Rejected",
        description: "The loan has been rejected.",
      });
      setSelectedLoan(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject loan. Please try again.",
        variant: "destructive",
      });
    }
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

  const calculateDaysWaiting = (createdAt: string | Date) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
          Manager Dashboard
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card data-testid="card-pending-approvals">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-count">
              {stats?.pendingLoans || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Require your approval
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-members">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-members">
              {stats?.totalMembers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats?.memberGrowth || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-loans">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-loans">
              {stats?.activeLoans || "UGX 0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Total outstanding
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-default-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Default Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-default-rate">
              {stats?.defaultRate || "0%"}
            </div>
            <p className="text-xs text-muted-foreground">
              Portfolio risk level
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending Approvals ({pendingLoans.length})
          </TabsTrigger>
          <TabsTrigger value="all-loans" data-testid="tab-all-loans">All Loans</TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card data-testid="card-pending-loans">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Loans Awaiting Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="text-center py-8" data-testid="loading-pending">
                  Loading pending loans...
                </div>
              ) : pendingLoans.length === 0 ? (
                <div className="text-center py-8 text-gray-500" data-testid="no-pending-loans">
                  <CheckCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  No pending loan applications
                  <p className="text-sm">All caught up! Check back later for new applications.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingLoans.map((loan) => (
                    <div key={loan.id} className="border rounded-lg p-4 hover:bg-gray-50" data-testid={`pending-loan-${loan.id}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold" data-testid={`text-loan-number-${loan.id}`}>
                            {loan.loanNumber} - {loan.memberName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {loan.intendedPurpose || "General purpose"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Applied {calculateDaysWaiting(loan.createdAt)} days ago
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(loan.status)}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedLoan(loan)}
                                data-testid={`button-view-loan-${loan.id}`}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl" data-testid="dialog-loan-review">
                              <DialogHeader>
                                <DialogTitle>Loan Application Review</DialogTitle>
                              </DialogHeader>
                              {selectedLoan && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Loan Number</label>
                                      <p className="mt-1" data-testid="text-review-loan-number">{selectedLoan.loanNumber}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Member</label>
                                      <p className="mt-1" data-testid="text-review-member-name">{selectedLoan.memberName}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Requested Amount</label>
                                      <p className="mt-1 font-semibold" data-testid="text-review-principal">
                                        {formatCurrency(selectedLoan.principal)}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Interest Rate</label>
                                      <p className="mt-1">{selectedLoan.interestRate}% per annum</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Term</label>
                                      <p className="mt-1">{selectedLoan.termMonths} months</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Application Date</label>
                                      <p className="mt-1">{formatDate(selectedLoan.createdAt)}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Purpose</label>
                                    <p className="mt-1" data-testid="text-review-purpose">
                                      {selectedLoan.intendedPurpose || "Not specified"}
                                    </p>
                                  </div>

                                  <div className="flex gap-2 pt-4">
                                    <Button
                                      onClick={() => approveLoanMutation.mutate(selectedLoan.id)}
                                      disabled={approveLoanMutation.isPending}
                                      className="bg-green-600 hover:bg-green-700"
                                      data-testid="button-approve-loan"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      {approveLoanMutation.isPending ? 'Approving...' : 'Approve'}
                                    </Button>
                                    <Button
                                      onClick={() => rejectLoanMutation.mutate(selectedLoan.id)}
                                      disabled={rejectLoanMutation.isPending}
                                      variant="destructive"
                                      data-testid="button-reject-loan"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      {rejectLoanMutation.isPending ? 'Rejecting...' : 'Reject'}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <p className="font-medium" data-testid={`text-pending-amount-${loan.id}`}>
                            {formatCurrency(loan.principal)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Term:</span>
                          <p className="font-medium">{loan.termMonths} months</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Interest:</span>
                          <p className="font-medium">{loan.interestRate}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-loans" className="space-y-4">
          <Card data-testid="card-all-loans">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                All Loan Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loansLoading ? (
                <div className="text-center py-8" data-testid="loading-all-loans">
                  Loading loans...
                </div>
              ) : (
                <div className="space-y-3">
                  {allLoans.map((loan) => (
                    <div key={loan.id} className="flex justify-between items-center border-b pb-3" data-testid={`all-loan-${loan.id}`}>
                      <div>
                        <p className="font-medium" data-testid={`text-all-loan-number-${loan.id}`}>
                          {loan.loanNumber} - {loan.memberName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {loan.intendedPurpose || "General purpose"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Applied: {formatDate(loan.createdAt)}
                          {loan.approverName && ` • Approved by: ${loan.approverName}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" data-testid={`text-all-loan-amount-${loan.id}`}>
                          {formatCurrency(loan.principal)}
                        </p>
                        {getStatusBadge(loan.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card data-testid="card-reports">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Management Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                Advanced reporting features coming soon
                <p className="text-sm">Generate detailed reports on loan performance, member activity, and financial metrics.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}