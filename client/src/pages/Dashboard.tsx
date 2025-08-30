import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Users, 
  PiggyBank, 
  Banknote, 
  TrendingUp, 
  UserPlus, 
  FileText,
  Download,
  Plus,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react";
import StatCard from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FinancialChart from "@/components/charts/FinancialChart";
import NewTransactionModal from "@/components/modals/NewTransactionModal";
import { exportDashboardReport } from "@/components/export/ExportUtils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { type DashboardStats, type TransactionWithDetails } from "@shared/schema";

export default function Dashboard() {
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<TransactionWithDetails[]>({
    queryKey: ["/api/transactions"],
  });

  const handleExportReport = async () => {
    try {
      await exportDashboardReport(stats, recentTransactions || [], "current");
      toast({
        title: "Export successful",
        description: "Dashboard report has been downloaded.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export dashboard report.",
      });
    }
  };

  if (statsLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-5 rounded-lg shadow">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours === 1) return "1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return { icon: ArrowDown, color: "text-green-600", bg: "bg-green-100" };
      case "loan_disbursement":
        return { icon: ArrowUp, color: "text-yellow-600", bg: "bg-yellow-100" };
      case "loan_payment":
        return { icon: ArrowDown, color: "text-blue-600", bg: "bg-blue-100" };
      default:
        return { icon: UserPlus, color: "text-blue-600", bg: "bg-blue-100" };
    }
  };

  return (
    <div className="py-6" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold leading-7 text-gray-900 sm:text-2xl lg:text-3xl sm:truncate" data-testid="dashboard-title">
              Dashboard Overview
            </h2>
            <p className="mt-1 text-sm sm:text-base text-gray-500" data-testid="dashboard-subtitle">
              Welcome back! Here's what's happening with your SACCO today.
            </p>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row md:mt-0 md:ml-4 space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" className="mobile-button touch-friendly" data-testid="button-export-report">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button className="mobile-button touch-friendly" data-testid="button-new-transaction">
              <Plus className="mr-2 h-4 w-4" />
              New Transaction
            </Button>
          </div>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8" data-testid="stats-overview">
          <StatCard
            title="Total Members"
            value={stats?.totalMembers || 0}
            icon={Users}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
            trend={{ value: `+${stats?.memberGrowth || 0}`, label: "this month", positive: true }}
            testId="stat-total-members"
          />
          <StatCard
            title="Total Savings"
            value={stats?.totalSavings || "UGX 0"}
            icon={PiggyBank}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
            trend={{ value: stats?.savingsGrowth || "+0%", label: "from last month", positive: true }}
            testId="stat-total-savings"
          />
          <StatCard
            title="Active Loans"
            value={stats?.activeLoans || "UGX 0"}
            icon={Banknote}
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-100"
            trend={{ value: `${stats?.loanCount || 0}`, label: "loan accounts" }}
            testId="stat-active-loans"
          />
          <StatCard
            title="Monthly Revenue"
            value={stats?.monthlyRevenue || "UGX 0"}
            icon={TrendingUp}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
            trend={{ value: stats?.revenueGrowth || "+0%", label: "vs last month", positive: true }}
            testId="stat-monthly-revenue"
          />
        </div>

        {/* Quick Actions for Admin/Manager */}
        {user && (user.role === 'admin' || user.role === 'manager') && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/savings">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-emerald-200 hover:border-emerald-400" data-testid="card-savings-shortcut">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-emerald-700 text-sm font-medium">Savings Management</CardTitle>
                      <PiggyBank className="h-5 w-5 text-emerald-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs">
                      Record and manage member savings, approvals, and balances
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/members">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-blue-200 hover:border-blue-400" data-testid="card-members-shortcut">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-blue-700 text-sm font-medium">Member Management</CardTitle>
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs">
                      Manage member accounts, status, and information
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/loans">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-yellow-200 hover:border-yellow-400" data-testid="card-loans-shortcut">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-yellow-700 text-sm font-medium">Loan Management</CardTitle>
                      <Banknote className="h-5 w-5 text-yellow-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs">
                      Process loan applications and track repayments
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/reports">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-purple-200 hover:border-purple-400" data-testid="card-reports-shortcut">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-purple-700 text-sm font-medium">Financial Reports</CardTitle>
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs">
                      Generate and export financial reports
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Financial Overview Chart */}
          <div className="bg-white overflow-hidden shadow rounded-lg" data-testid="financial-chart-section">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Financial Overview</h3>
              <FinancialChart />
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white overflow-hidden shadow rounded-lg" data-testid="recent-transactions-section">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Transactions</h3>
                <Button variant="link" size="sm" className="touch-friendly" data-testid="link-view-all-transactions">
                  View all
                </Button>
              </div>
              <div className="flow-root">
                {transactionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse flex space-x-3">
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="-mb-8" data-testid="transactions-list">
                    {recentTransactions?.slice(0, 3).map((transaction, idx) => {
                      const { icon: TransactionIcon, color, bg } = getTransactionIcon(transaction.type);
                      const isLast = idx === Math.min(2, (recentTransactions.length || 1) - 1);
                      
                      return (
                        <li key={transaction.id} data-testid={`transaction-${transaction.id}`}>
                          <div className={`relative ${!isLast ? 'pb-8' : ''}`}>
                            {!isLast && (
                              <span
                                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                aria-hidden="true"
                              />
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full ${bg} flex items-center justify-center ring-8 ring-white`}>
                                  <TransactionIcon className={`h-4 w-4 ${color}`} />
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5">
                                <div className="flex justify-between">
                                  <p className="text-sm text-gray-900" data-testid={`transaction-${transaction.id}-description`}>
                                    {transaction.description}
                                  </p>
                                  <p className={`text-sm font-medium ${
                                    transaction.type === 'deposit' || transaction.type === 'loan_payment' 
                                      ? 'text-green-600' 
                                      : transaction.type === 'loan_disbursement'
                                      ? 'text-yellow-600'
                                      : 'text-blue-600'
                                  }`} data-testid={`transaction-${transaction.id}-amount`}>
                                    {transaction.type === 'deposit' || transaction.type === 'loan_payment' ? '+' : 
                                     transaction.type === 'loan_disbursement' ? '-' : '+'}UGX {parseInt(transaction.amount).toLocaleString()}
                                  </p>
                                </div>
                                <p className="text-xs text-gray-500" data-testid={`transaction-${transaction.id}-time`}>
                                  {formatTimeAgo(new Date(transaction.transactionDate))}
                                </p>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white overflow-hidden shadow rounded-lg" data-testid="quick-actions-section">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 h-auto space-y-2"
                    data-testid="button-add-member"
                  >
                    <UserPlus className="h-8 w-8 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Add Member</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 h-auto space-y-2"
                    data-testid="button-process-loan"
                  >
                    <Banknote className="h-8 w-8 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Process Loan</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 h-auto space-y-2"
                    data-testid="button-record-deposit"
                  >
                    <PiggyBank className="h-8 w-8 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Record Deposit</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-4 bg-yellow-50 hover:bg-yellow-100 h-auto space-y-2"
                    data-testid="button-generate-report"
                  >
                    <FileText className="h-8 w-8 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">Generate Report</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-white overflow-hidden shadow rounded-lg" data-testid="system-alerts-section">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">System Alerts</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3" data-testid="alert-overdue-payments">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">5 loan payments overdue</p>
                    <p className="text-xs text-gray-500">Requires follow-up action</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3" data-testid="alert-backup-completed">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">Monthly backup completed</p>
                    <p className="text-xs text-gray-500">Data secure and up to date</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3" data-testid="alert-systems-operational">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">All systems operational</p>
                    <p className="text-xs text-gray-500">No issues detected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NewTransactionModal
        isOpen={showNewTransactionModal}
        onClose={() => setShowNewTransactionModal(false)}
      />
    </div>
  );
}
