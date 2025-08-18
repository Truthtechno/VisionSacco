import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import LoanForm from "@/components/forms/LoanForm";
import { type LoanWithMember } from "@shared/schema";

export default function Loans() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: loans = [], isLoading } = useQuery<LoanWithMember[]>({
    queryKey: ["/api/loans"],
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
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate" data-testid="loans-title">
              Loans Management
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Track and manage member loans and repayments
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-loan">
                  <Plus className="mr-2 h-4 w-4" />
                  New Loan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" data-testid="loan-dialog">
                <DialogHeader>
                  <DialogTitle>Create New Loan</DialogTitle>
                </DialogHeader>
                <LoanForm onSuccess={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
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

        {/* Loans Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card data-testid="loans-summary-active">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {loans.filter(l => l.status === 'active').length}
                </p>
                <p className="text-sm text-gray-600">Active Loans</p>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="loans-summary-total-amount">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  UGX {loans.reduce((sum, l) => sum + parseFloat(l.balance), 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total Outstanding</p>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="loans-summary-overdue">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {loans.filter(l => l.status === 'overdue').length}
                </p>
                <p className="text-sm text-gray-600">Overdue Loans</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="loans-grid">
          {filteredLoans.map((loan) => {
            const progress = calculateProgress(loan.principal, loan.balance);
            
            return (
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
                  <p className="text-sm text-gray-600" data-testid={`loan-${loan.id}-member`}>
                    {loan.memberName}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Principal:</span>
                      <span className="text-sm font-medium" data-testid={`loan-${loan.id}-principal`}>
                        UGX {parseInt(loan.principal).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Balance:</span>
                      <span className="text-sm font-medium text-red-600" data-testid={`loan-${loan.id}-balance`}>
                        UGX {parseInt(loan.balance).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Interest Rate:</span>
                      <span className="text-sm font-medium" data-testid={`loan-${loan.id}-rate`}>
                        {loan.interestRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Term:</span>
                      <span className="text-sm font-medium" data-testid={`loan-${loan.id}-term`}>
                        {loan.termMonths} months
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Due Date:</span>
                      <span className="text-sm font-medium" data-testid={`loan-${loan.id}-due-date`}>
                        {new Date(loan.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Repayment Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Repayment Progress</span>
                      <span className="text-xs text-gray-500" data-testid={`loan-${loan.id}-progress-percent`}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                        data-testid={`loan-${loan.id}-progress-bar`}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" data-testid={`button-view-loan-${loan.id}`}>
                      View Details
                    </Button>
                    {loan.status === 'active' && (
                      <Button size="sm" className="flex-1" data-testid={`button-payment-loan-${loan.id}`}>
                        Record Payment
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredLoans.length === 0 && (
          <div className="text-center py-12" data-testid="no-loans-found">
            <p className="text-gray-500 text-lg">
              {searchTerm ? "No loans found matching your search." : "No loans issued yet."}
            </p>
            {!searchTerm && (
              <Button
                className="mt-4"
                onClick={() => setDialogOpen(true)}
                data-testid="button-add-first-loan"
              >
                <Plus className="mr-2 h-4 w-4" />
                Issue Your First Loan
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
