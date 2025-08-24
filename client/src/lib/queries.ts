import { type Member, type Loan, type Transaction, type Savings, type DashboardStats } from "@shared/schema";

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export interface LineChartData {
  month: string;
  contributions: number;
  deposits: number;
}

export interface BarChartData {
  status: string;
  count: number;
  amount: number;
  color: string;
}

// Utility function to fetch and aggregate savings vs loans data for pie chart
export async function fetchSavingsVsLoansData(): Promise<PieChartData[]> {
  try {
    const [dashboardResponse, transactionsResponse] = await Promise.all([
      fetch('/api/dashboard/stats', { credentials: 'include' }),
      fetch('/api/transactions', { credentials: 'include' })
    ]);

    if (!dashboardResponse.ok || !transactionsResponse.ok) {
      throw new Error('Failed to fetch data');
    }

    const stats: DashboardStats = await dashboardResponse.json();
    const transactions: Transaction[] = await transactionsResponse.json();

    // Parse the string values from dashboard stats
    const totalSavings = parseFloat(stats.totalSavings.replace(/[^\d.-]/g, '')) || 0;
    const activeLoansValue = parseFloat(stats.activeLoans.replace(/[^\d.-]/g, '')) || 0;

    return [
      {
        name: 'Total Savings',
        value: totalSavings,
        color: '#10b981' // green
      },
      {
        name: 'Active Loans',
        value: activeLoansValue,
        color: '#f59e0b' // amber
      }
    ];
  } catch (error) {
    console.error('Error fetching savings vs loans data:', error);
    return [];
  }
}

// Utility function to fetch and aggregate monthly contributions data for line chart
export async function fetchMonthlyContributionsData(): Promise<LineChartData[]> {
  try {
    const response = await fetch('/api/transactions', { credentials: 'include' });
    
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    const transactions: Transaction[] = await response.json();
    
    // Generate data for the last 6 months
    const currentDate = new Date();
    const chartData: LineChartData[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Filter transactions for this month
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.transactionDate);
        return transactionDate.getMonth() === date.getMonth() && 
               transactionDate.getFullYear() === date.getFullYear();
      });
      
      // Calculate deposits and loan payments (contributions) for this month
      const deposits = monthTransactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const loanPayments = monthTransactions
        .filter(t => t.type === 'loan_payment')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const totalContributions = deposits + loanPayments;
      
      chartData.push({
        month: monthName,
        contributions: totalContributions / 1000000, // Convert to millions
        deposits: deposits / 1000000
      });
    }
    
    return chartData;
  } catch (error) {
    console.error('Error fetching monthly contributions data:', error);
    return [];
  }
}

// Utility function to fetch and aggregate loans by status data for bar chart
export async function fetchLoansByStatusData(): Promise<BarChartData[]> {
  try {
    const response = await fetch('/api/loans', { credentials: 'include' });
    
    if (!response.ok) {
      throw new Error('Failed to fetch loans');
    }

    const loans: Loan[] = await response.json();
    
    // Define status colors
    const statusColors: Record<string, string> = {
      'pending': '#f59e0b', // amber
      'approved': '#10b981', // green
      'active': '#3b82f6', // blue
      'paid': '#6b7280', // gray
      'overdue': '#ef4444', // red
      'defaulted': '#dc2626', // red-600
      'rejected': '#9ca3af' // gray-400
    };

    // Group loans by status
    const statusGroups = loans.reduce((acc, loan) => {
      const status = loan.status;
      if (!acc[status]) {
        acc[status] = {
          count: 0,
          totalAmount: 0
        };
      }
      acc[status].count += 1;
      acc[status].totalAmount += parseFloat(loan.principal);
      return acc;
    }, {} as Record<string, { count: number; totalAmount: number }>);

    // Convert to chart data format
    return Object.entries(statusGroups).map(([status, data]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: data.count,
      amount: data.totalAmount / 1000000, // Convert to millions
      color: statusColors[status] || '#6b7280'
    }));
  } catch (error) {
    console.error('Error fetching loans by status data:', error);
    return [];
  }
}

// Utility function to get aggregated financial overview
export async function fetchFinancialOverview() {
  try {
    const [stats, savingsData, loansData, contributionsData] = await Promise.all([
      fetch('/api/dashboard/stats', { credentials: 'include' }).then(res => res.json()),
      fetchSavingsVsLoansData(),
      fetchLoansByStatusData(),
      fetchMonthlyContributionsData()
    ]);

    return {
      stats,
      savingsVsLoans: savingsData,
      loansByStatus: loansData,
      monthlyContributions: contributionsData
    };
  } catch (error) {
    console.error('Error fetching financial overview:', error);
    return null;
  }
}