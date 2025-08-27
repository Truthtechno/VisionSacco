import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, User, FileText, Clock } from "lucide-react";
import { format } from "date-fns";

interface LoanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: any;
  member?: any;
}

export default function LoanDetailsModal({ isOpen, onClose, loan, member }: LoanDetailsModalProps) {
  if (!loan) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "paid": return "bg-blue-100 text-blue-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "defaulted": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const monthlyPayment = loan.principal ? 
    (parseFloat(loan.principal) * (1 + parseFloat(loan.interestRate || 0) / 100)) / loan.termMonths : 0;

  const totalInterest = loan.principal ? 
    parseFloat(loan.principal) * (parseFloat(loan.interestRate || 0) / 100) : 0;

  const totalAmount = loan.principal ? 
    parseFloat(loan.principal) + totalInterest : 0;

  const paidAmount = loan.principal && loan.balance ? 
    parseFloat(loan.principal) - parseFloat(loan.balance) : 0;

  const remainingPayments = loan.balance && monthlyPayment > 0 ? 
    Math.ceil(parseFloat(loan.balance) / monthlyPayment) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Loan Details - {loan.loanNumber}</span>
            <Badge className={getStatusColor(loan.status)}>
              {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member Information */}
          {member && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Member Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{member.firstName} {member.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Member Number</p>
                    <p className="font-medium">{member.memberNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{member.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{member.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loan Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Loan Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Principal Amount</p>
                  <p className="font-medium text-lg">UGX {parseFloat(loan.principal || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Interest Rate</p>
                  <p className="font-medium">{loan.interestRate}% per annum</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Term</p>
                  <p className="font-medium">{loan.termMonths} months</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Balance</p>
                  <p className="font-medium text-lg text-red-600">UGX {parseFloat(loan.balance || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Monthly Payment</p>
                  <p className="font-medium">UGX {monthlyPayment.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Interest</p>
                  <p className="font-medium">UGX {totalInterest.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-medium">UGX {totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount Paid</p>
                  <p className="font-medium text-green-600">UGX {paidAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates and Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Application Date</p>
                  <p className="font-medium">
                    {loan.createdAt ? format(new Date(loan.createdAt), "MMM dd, yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Approval Date</p>
                  <p className="font-medium">
                    {loan.approvedAt ? format(new Date(loan.approvedAt), "MMM dd, yyyy") : "Pending"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Disbursement Date</p>
                  <p className="font-medium">
                    {loan.disbursementDate ? format(new Date(loan.disbursementDate), "MMM dd, yyyy") : "Not disbursed"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="font-medium">
                    {loan.dueDate ? format(new Date(loan.dueDate), "MMM dd, yyyy") : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purpose */}
          {loan.intendedPurpose && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Purpose
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800">{loan.intendedPurpose}</p>
              </CardContent>
            </Card>
          )}

          {loan.status === "active" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Next Payment Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Remaining Payments</p>
                    <p className="font-medium">{remainingPayments} payments</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Progress</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full" 
                        style={{ width: `${((paidAmount / parseFloat(loan.principal)) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {((paidAmount / parseFloat(loan.principal)) * 100).toFixed(1)}% paid
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} data-testid="button-close-details">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}