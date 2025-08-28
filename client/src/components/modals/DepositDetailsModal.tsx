import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DollarSign, User, Calendar, CreditCard, FileText, CheckCircle, XCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type DepositWithDetails } from "@shared/schema";

interface DepositDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deposit: DepositWithDetails | null;
}

export default function DepositDetailsModal({ isOpen, onClose, deposit }: DepositDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user for approval operations
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/auth/me");
      return response.json();
    },
  });

  // Approve deposit mutation
  const approveDepositMutation = useMutation({
    mutationFn: async (depositId: string) => {
      const response = await apiRequest("POST", `/api/deposits/${depositId}/approve`, {
        approverId: currentUser?.data?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deposit approved",
        description: "The deposit has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Approval failed",
        description: error?.response?.data?.message || "Failed to approve deposit. Please try again.",
      });
    },
  });

  // Reject deposit mutation
  const rejectDepositMutation = useMutation({
    mutationFn: async (depositId: string) => {
      const response = await apiRequest("POST", `/api/deposits/${depositId}/reject`, {
        approverId: currentUser?.data?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deposit rejected",
        description: "The deposit has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Rejection failed",
        description: error?.response?.data?.message || "Failed to reject deposit. Please try again.",
      });
    },
  });

  const handleApproveDeposit = () => {
    if (!deposit || deposit.status !== "pending") {
      toast({
        variant: "destructive",
        title: "Cannot approve",
        description: "Only pending deposits can be approved.",
      });
      return;
    }
    approveDepositMutation.mutate(deposit.id);
  };

  const handleRejectDeposit = () => {
    if (!deposit || deposit.status !== "pending") {
      toast({
        variant: "destructive",
        title: "Cannot reject",
        description: "Only pending deposits can be rejected.",
      });
      return;
    }
    rejectDepositMutation.mutate(deposit.id);
  };

  if (!deposit) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Deposit Details</span>
            {getStatusBadge(deposit.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Deposit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Deposit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Deposit Number</label>
                  <p className="text-lg font-semibold">{deposit.depositNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-lg font-semibold text-emerald-600">{formatCurrency(deposit.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Deposit Method</label>
                  <p className="text-lg capitalize">{deposit.depositMethod.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(deposit.status)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Member Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Member Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Member Name</label>
                  <p className="text-lg">{deposit.memberName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Member Number</label>
                  <p className="text-lg">{deposit.memberNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Recorded Date</label>
                  <p className="text-lg">{formatDate(deposit.depositDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Recorded By</label>
                  <p className="text-lg">{deposit.recordedByName}</p>
                </div>
                {deposit.approvedAt && deposit.approvedByName && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        {deposit.status === "approved" ? "Approved Date" : "Rejected Date"}
                      </label>
                      <p className="text-lg">{formatDate(deposit.approvedAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        {deposit.status === "approved" ? "Approved By" : "Rejected By"}
                      </label>
                      <p className="text-lg">{deposit.approvedByName}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {deposit.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{deposit.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button variant="outline" onClick={onClose} data-testid="button-close">
            Close
          </Button>
          
          {deposit.status === "pending" && (
            <div className="flex space-x-2">
              <Button
                onClick={handleRejectDeposit}
                variant="outline"
                className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                disabled={rejectDepositMutation.isPending}
                data-testid="button-reject-deposit"
              >
                <XCircle className="mr-2 h-4 w-4" />
                {rejectDepositMutation.isPending ? "Rejecting..." : "Reject"}
              </Button>
              <Button
                onClick={handleApproveDeposit}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={approveDepositMutation.isPending}
                data-testid="button-approve-deposit"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {approveDepositMutation.isPending ? "Approving..." : "Approve"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}