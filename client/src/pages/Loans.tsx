import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Eye, DollarSign, Download, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import LoanForm from "@/components/forms/LoanForm";
import CreateLoanModal from "@/components/modals/CreateLoanModal";
import LoanDetailsModal from "@/components/modals/LoanDetailsModal";
import RecordPaymentModal from "@/components/modals/RecordPaymentModal";
import { exportLoansCSV } from "@/components/export/ExportUtils";
import { type LoanWithMember } from "@shared/schema";

export default function Loans() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showCreateLoanModal, setShowCreateLoanModal] = useState(false);
  const [showLoanDetailsModal, setShowLoanDetailsModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithMember | null>(null);
  const { toast } = useToast();

  const { data: loans = [], isLoading } = useQuery<LoanWithMember[]>({
    queryKey: ["/api/loans"],
  });

  // Get current user for approval operations
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/auth/me");
      return response.json();
    },
  });

  const handleExportLoans = async () => {
    try {
      await exportLoansCSV(loans, "current");
      toast({
        title: "Export successful",
        description: "Loans data has been downloaded.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export loans data.",
      });
    }
  };

  const handleViewDetails = (loan: LoanWithMember) => {
    setSelectedLoan(loan);
    setShowLoanDetailsModal(true);
  };

  const handleRecordPayment = (loan: LoanWithMember) => {
    setSelectedLoan(loan);
    setShowRecordPaymentModal(true);
  };

  const approveLoanMutation = useMutation({
    mutationFn: (loanId: string) =>
      apiRequest("POST", `/api/loans/${loanId}/approve`, { approverId: currentUser?.data?.id }),
    onSuccess: () => {
      toast({
        title: "Loan approved",
        description: "The loan has been successfully approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
    },
    onError: (error: any) => {
      console.error("Approval error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.message || "Failed to approve loan.",
      });
    },
  });

  const rejectLoanMutation = useMutation({
    mutationFn: (loanId: string) =>
      apiRequest("POST", `/api/loans/${loanId}/reject`, { approverId: currentUser?.data?.id }),
    onSuccess: () => {
      toast({
        title: "Loan rejected",
        description: "The loan has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
    },
    onError: (error: any) => {
      console.error("Rejection error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.message || "Failed to reject loan.",
      });
    },
  });

  const filteredLoans = loans.filter(loan =>
    loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.memberName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "defaulted":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateProgress = (principal: string, balance: string) => {
    const principalAmount = parseFloat(principal);
    const balanceAmount = parseFloat(balance);
    return Math.max(0, ((principalAmount - balanceAmount) / principalAmount) * 100);
  };

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6" data-testid="loans-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold leading-7 text-gray-900 sm:text-2xl lg:text-3xl sm:truncate mobile-responsive" data-testid="loans-title">
              Loans Management
            </h2>
            <p className="mt-1 text-sm sm:text-base text-gray-500">
              Track and manage all SACCO loans
            </p>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row md:mt-0 md:ml-4 space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              onClick={handleExportLoans}
              data-testid="button-export-loans"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={() => setShowCreateLoanModal(true)}
              data-testid="button-create-loan"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Loan
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search loans..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-loans"
            />
          </div>
        </div>

        {/* Loans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="loans-grid">
          {filteredLoans.map((loan) => (
            <Card key={loan.id} className="hover:shadow-md transition-shadow" data-testid={`loan-card-${loan.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg" data-testid={`loan-${loan.id}-number`}>
                    {loan.loanNumber}
                  </CardTitle>
                  <Badge className={getStatusColor(loan.status)} data-testid={`loan-${loan.id}-status`}>
                    {loan.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500" data-testid={`loan-${loan.id}-member`}>
                  {loan.memberName}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Principal:</span>
                  <span className="text-sm font-medium" data-testid={`loan-${loan.id}-principal`}>
                    UGX {parseFloat(loan.principal).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Balance:</span>
                  <span className="text-sm font-medium text-red-600" data-testid={`loan-${loan.id}-balance`}>
                    UGX {parseFloat(loan.balance).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Progress:</span>
                  <span className="text-sm font-medium text-green-600">
                    {calculateProgress(loan.principal, loan.balance).toFixed(1)}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full" 
                    style={{ width: `${calculateProgress(loan.principal, loan.balance)}%` }}
                  ></div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(loan)}
                    data-testid={`button-view-loan-${loan.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  
                  {loan.status === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecordPayment(loan)}
                      data-testid={`button-record-payment-${loan.id}`}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Payment
                    </Button>
                  )}
                  
                  {loan.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => approveLoanMutation.mutate(loan.id)}
                        data-testid={`button-approve-loan-${loan.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rejectLoanMutation.mutate(loan.id)}
                        data-testid={`button-reject-loan-${loan.id}`}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLoans.length === 0 && (
          <div className="text-center py-12" data-testid="no-loans-found">
            <p className="text-gray-500 text-lg">
              {searchTerm ? "No loans found matching your search." : "No loans registered yet."}
            </p>
            {!searchTerm && (
              <Button
                className="mt-4"
                onClick={() => setShowCreateLoanModal(true)}
                data-testid="button-create-first-loan"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Loan
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateLoanModal
        isOpen={showCreateLoanModal}
        onClose={() => setShowCreateLoanModal(false)}
      />
      <LoanDetailsModal
        isOpen={showLoanDetailsModal}
        onClose={() => setShowLoanDetailsModal(false)}
        loan={selectedLoan}
      />
      <RecordPaymentModal
        isOpen={showRecordPaymentModal}
        onClose={() => setShowRecordPaymentModal(false)}
        loan={selectedLoan}
        currentUserId={currentUser?.data?.id}
      />
    </div>
  );
}