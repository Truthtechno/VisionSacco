import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Eye, DollarSign, Download, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import CreateDepositModal from "../components/modals/CreateDepositModal";
import DepositDetailsModal from "../components/modals/DepositDetailsModal";
import { type DepositWithDetails } from "@shared/schema";

export default function Deposits() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDepositModal, setShowCreateDepositModal] = useState(false);
  const [showDepositDetailsModal, setShowDepositDetailsModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositWithDetails | null>(null);
  const { toast } = useToast();

  const { data: deposits = [], isLoading } = useQuery<DepositWithDetails[]>({
    queryKey: ["/api/deposits"],
  });

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
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Rejection failed",
        description: error?.response?.data?.message || "Failed to reject deposit. Please try again.",
      });
    },
  });

  const handleApproveDeposit = (deposit: DepositWithDetails) => {
    if (deposit.status !== "pending") {
      toast({
        variant: "destructive",
        title: "Cannot approve",
        description: "Only pending deposits can be approved.",
      });
      return;
    }
    approveDepositMutation.mutate(deposit.id);
  };

  const handleRejectDeposit = (deposit: DepositWithDetails) => {
    if (deposit.status !== "pending") {
      toast({
        variant: "destructive",
        title: "Cannot reject",
        description: "Only pending deposits can be rejected.",
      });
      return;
    }
    rejectDepositMutation.mutate(deposit.id);
  };

  const handleViewDetails = (deposit: DepositWithDetails) => {
    setSelectedDeposit(deposit);
    setShowDepositDetailsModal(true);
  };

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
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredDeposits = deposits.filter(deposit =>
    deposit.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deposit.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deposit.depositNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deposit.depositMethod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingDeposits = deposits.filter(d => d.status === "pending");
  const approvedDeposits = deposits.filter(d => d.status === "approved");
  const rejectedDeposits = deposits.filter(d => d.status === "rejected");
  const totalDepositAmount = approvedDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deposits Management</h1>
          <p className="text-gray-600 mt-1">Track and manage member deposits</p>
        </div>
        <Button 
          onClick={() => setShowCreateDepositModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
          data-testid="button-create-deposit"
        >
          <Plus className="mr-2 h-4 w-4" />
          Record Deposit
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deposits.length}</div>
            <p className="text-xs text-muted-foreground">All time deposits</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingDeposits.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Deposits</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedDeposits.length}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalDepositAmount.toString())}</div>
            <p className="text-xs text-muted-foreground">Approved deposits</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by member name, number, deposit number, or method..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-deposits"
          />
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deposit Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeposits.map((deposit) => (
                <tr key={deposit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{deposit.depositNumber}</div>
                      <div className="text-sm text-gray-500">Recorded by: {deposit.recordedByName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{deposit.memberName}</div>
                      <div className="text-sm text-gray-500">{deposit.memberNumber}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(deposit.amount)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{deposit.depositMethod.replace('_', ' ')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(deposit.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(deposit.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(deposit)}
                        data-testid={`button-view-deposit-${deposit.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {deposit.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproveDeposit(deposit)}
                            className="text-green-600 hover:text-green-700 border-green-300 hover:border-green-400"
                            disabled={approveDepositMutation.isPending}
                            data-testid={`button-approve-deposit-${deposit.id}`}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectDeposit(deposit)}
                            className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                            disabled={rejectDepositMutation.isPending}
                            data-testid={`button-reject-deposit-${deposit.id}`}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDeposits.length === 0 && (
          <div className="text-center py-12" data-testid="no-deposits-found">
            <p className="text-gray-500 text-lg">
              {searchTerm ? "No deposits found matching your search." : "No deposits recorded yet."}
            </p>
            {!searchTerm && (
              <Button
                className="mt-4"
                onClick={() => setShowCreateDepositModal(true)}
                data-testid="button-create-first-deposit"
              >
                <Plus className="mr-2 h-4 w-4" />
                Record Your First Deposit
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateDepositModal
        isOpen={showCreateDepositModal}
        onClose={() => setShowCreateDepositModal(false)}
      />
      <DepositDetailsModal
        isOpen={showDepositDetailsModal}
        onClose={() => setShowDepositDetailsModal(false)}
        deposit={selectedDeposit}
      />
    </div>
  );
}