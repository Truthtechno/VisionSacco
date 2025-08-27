import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Calendar, FileText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FinancialChart from "@/components/charts/FinancialChart";
import { type DashboardStats, type TransactionWithDetails, type MemberWithSavings } from "@shared/schema";
import jsPDF from "jspdf";

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");

  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toLocaleString()}`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("SACCO Financial Report", 20, 30);
    
    // Current date
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Report Period: ${selectedPeriod}`, 20, 55);
    
    // Summary totals section
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Summary", 20, 75);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const summaryY = 90;
    doc.text(`Total Members: ${stats?.totalMembers || 0}`, 20, summaryY);
    doc.text(`Total Savings: ${formatCurrency(parseFloat(stats?.totalSavings || "0"))}`, 20, summaryY + 10);
    doc.text(`Total Loans Disbursed: ${formatCurrency(parseFloat(stats?.totalLoansValue || "0"))}`, 20, summaryY + 20);
    doc.text(`Total Deposits: ${formatCurrency(totalDeposits)}`, 20, summaryY + 30);
    doc.text(`Total Withdrawals: ${formatCurrency(totalWithdrawals)}`, 20, summaryY + 40);
    doc.text(`Loan Disbursements: ${formatCurrency(totalLoanDisbursements)}`, 20, summaryY + 50);
    doc.text(`Loan Payments: ${formatCurrency(totalLoanPayments)}`, 20, summaryY + 60);
    doc.text(`Net Cash Flow: ${formatCurrency(netCashFlow)}`, 20, summaryY + 70);
    
    // Transactions table
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Transaction History", 20, summaryY + 90);
    
    // Manual table creation
    const tableStartY = summaryY + 110;
    const rowHeight = 12;
    const colWidths = [30, 45, 30, 35, 50]; // Column widths
    const colStarts = [20, 50, 95, 125, 160]; // Column start positions
    
    // Table header
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.rect(20, tableStartY - 8, 170, 10); // Header background
    doc.text("Date", colStarts[0] + 2, tableStartY - 2);
    doc.text("Member Name", colStarts[1] + 2, tableStartY - 2);
    doc.text("Type", colStarts[2] + 2, tableStartY - 2);
    doc.text("Amount", colStarts[3] + 2, tableStartY - 2);
    doc.text("Description", colStarts[4] + 2, tableStartY - 2);
    
    // Table rows
    doc.setFont("helvetica", "normal");
    transactions.slice(0, 20).forEach((transaction, index) => {
      const y = tableStartY + (index * rowHeight) + 5;
      
      // Draw row border
      doc.rect(20, y - 8, 170, rowHeight);
      
      // Add data with text truncation for long fields
      const truncateText = (text: string, maxLength: number) => {
        return text.length > maxLength ? text.substring(0, maxLength - 3) + "..." : text;
      };
      
      doc.text(formatDate(transaction.transactionDate), colStarts[0] + 2, y);
      doc.text(truncateText(transaction.memberName || "N/A", 15), colStarts[1] + 2, y);
      doc.text(truncateText(transaction.type.replace("_", " ").toUpperCase(), 10), colStarts[2] + 2, y);
      doc.text(formatCurrency(parseFloat(transaction.amount)), colStarts[3] + 2, y);
      doc.text(truncateText(transaction.description || "", 20), colStarts[4] + 2, y);
    });
    
    // Save the PDF
    doc.save(`SACCO_Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: transactions = [] } = useQuery<TransactionWithDetails[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: members = [] } = useQuery<MemberWithSavings[]>({
    queryKey: ["/api/members"],
  });

  // Calculate report metrics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => 
    new Date(t.transactionDate).getMonth() === currentMonth &&
    new Date(t.transactionDate).getFullYear() === currentYear
  );

  const deposits = monthlyTransactions.filter(t => t.type === 'deposit');
  const withdrawals = monthlyTransactions.filter(t => t.type === 'withdrawal');
  const loanDisbursements = monthlyTransactions.filter(t => t.type === 'loan_disbursement');
  const loanPayments = monthlyTransactions.filter(t => t.type === 'loan_payment');

  const totalDeposits = deposits.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalWithdrawals = withdrawals.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalLoanDisbursements = loanDisbursements.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalLoanPayments = loanPayments.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const netCashFlow = totalDeposits + totalLoanPayments - totalWithdrawals - totalLoanDisbursements;

  const reportCards = [
    {
      title: "Total Deposits",
      value: `UGX ${totalDeposits.toLocaleString()}`,
      icon: TrendingUp,
      change: "+12.5%",
      testId: "report-total-deposits"
    },
    {
      title: "Total Withdrawals", 
      value: `UGX ${totalWithdrawals.toLocaleString()}`,
      icon: TrendingUp,
      change: "-8.2%",
      testId: "report-total-withdrawals"
    },
    {
      title: "Loan Disbursements",
      value: `UGX ${totalLoanDisbursements.toLocaleString()}`,
      icon: TrendingUp,
      change: "+15.3%",
      testId: "report-loan-disbursements"
    },
    {
      title: "Net Cash Flow",
      value: `UGX ${netCashFlow.toLocaleString()}`,
      icon: TrendingUp,
      change: netCashFlow >= 0 ? "+5.4%" : "-2.1%",
      testId: "report-net-cash-flow"
    },
  ];

  return (
    <div className="py-6" data-testid="reports-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate" data-testid="reports-title">
              Financial Reports
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Comprehensive financial analytics and reporting
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]" data-testid="select-report-period">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">This Week</SelectItem>
                <SelectItem value="monthly">This Month</SelectItem>
                <SelectItem value="quarterly">This Quarter</SelectItem>
                <SelectItem value="yearly">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={generatePDFReport} data-testid="button-export-report">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Report Metrics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8" data-testid="report-metrics">
          {reportCards.map((card) => (
            <Card key={card.title} data-testid={card.testId}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <card.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.title}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {card.value}
                      </dd>
                    </dl>
                    <div className="mt-1">
                      <span className={`text-sm font-medium ${
                        card.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {card.change}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">from last period</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report Tabs */}
        <Tabs defaultValue="overview" className="space-y-6" data-testid="report-tabs">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="members" data-testid="tab-members">Member Analysis</TabsTrigger>
            <TabsTrigger value="loans" data-testid="tab-loans">Loan Portfolio</TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions">Transaction History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6" data-testid="overview-tab-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Chart */}
              <Card data-testid="overview-financial-chart">
                <CardHeader>
                  <CardTitle>Financial Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <FinancialChart />
                </CardContent>
              </Card>

              {/* Key Insights */}
              <Card data-testid="overview-key-insights">
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-green-700">Strong Growth</h4>
                    <p className="text-sm text-gray-600">
                      Member savings have increased by 8.2% this month, indicating healthy financial habits.
                    </p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-semibold text-yellow-700">Loan Demand</h4>
                    <p className="text-sm text-gray-600">
                      Loan applications have increased by 15.3%, suggesting growing member confidence.
                    </p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-blue-700">Revenue Growth</h4>
                    <p className="text-sm text-gray-600">
                      Interest income has contributed to a 12% increase in monthly revenue.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-6" data-testid="members-tab-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="member-demographics">
                <CardHeader>
                  <CardTitle>Member Demographics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Active Members</span>
                      <span className="font-semibold">{stats?.totalMembers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>New Members (This Month)</span>
                      <span className="font-semibold text-green-600">+{stats?.memberGrowth || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Savings Balance</span>
                      <span className="font-semibold">
                        UGX {members.length > 0 
                          ? Math.round(members.reduce((sum, m) => sum + parseFloat(m.savingsBalance), 0) / members.length).toLocaleString()
                          : 0
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="member-activity">
                <CardHeader>
                  <CardTitle>Member Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Active This Month</span>
                      <span className="font-semibold">
                        {transactions.filter(t => t.memberId).length} transactions
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Most Active Member</span>
                      <span className="font-semibold">Mary Nakato</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Retention Rate</span>
                      <span className="font-semibold text-green-600">98.5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="loans" className="space-y-6" data-testid="loans-tab-content">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card data-testid="loan-performance">
                <CardHeader>
                  <CardTitle>Loan Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Repayment Rate</span>
                      <span className="text-sm font-semibold text-green-600">96.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Default Rate</span>
                      <span className="text-sm font-semibold text-red-600">3.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg. Loan Term</span>
                      <span className="text-sm font-semibold">12 months</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="interest-income">
                <CardHeader>
                  <CardTitle>Interest Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">This Month</span>
                      <span className="text-sm font-semibold">UGX {totalLoanPayments.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg. Interest Rate</span>
                      <span className="text-sm font-semibold">15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Revenue Growth</span>
                      <span className="text-sm font-semibold text-green-600">+15.3%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="loan-distribution">
                <CardHeader>
                  <CardTitle>Loan Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Small Loans (&lt;1M)</span>
                      <span className="text-sm font-semibold">60%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Medium Loans (1M-5M)</span>
                      <span className="text-sm font-semibold">35%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Large Loans (&gt;5M)</span>
                      <span className="text-sm font-semibold">5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6" data-testid="transactions-tab-content">
            <Card data-testid="transaction-summary">
              <CardHeader>
                <CardTitle>Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.slice(0, 10).map((transaction) => (
                        <tr key={transaction.id} data-testid={`transaction-row-${transaction.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(transaction.transactionDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.type === 'deposit' 
                                ? 'bg-green-100 text-green-800'
                                : transaction.type === 'loan_disbursement'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {transaction.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.memberName || 'System'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            UGX {parseInt(transaction.amount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {transaction.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
