import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { type TransactionWithDetails } from "@shared/schema";

interface ChartDataPoint {
  month: string;
  savings: number;
  loans: number;
  revenue: number;
}

export default function FinancialChart() {
  const { data: transactions = [], isLoading } = useQuery<TransactionWithDetails[]>({
    queryKey: ["/api/transactions"],
  });

  if (isLoading) {
    return (
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center" data-testid="chart-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading chart data...</p>
        </div>
      </div>
    );
  }

  // Process transactions to create chart data
  const generateChartData = (): ChartDataPoint[] => {
    const currentDate = new Date();
    const chartData: ChartDataPoint[] = [];
    
    // Generate data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Filter transactions for this month
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.transactionDate);
        return transactionDate.getMonth() === date.getMonth() && 
               transactionDate.getFullYear() === date.getFullYear();
      });
      
      // Calculate totals for this month
      const deposits = monthTransactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const loanDisbursements = monthTransactions
        .filter(t => t.type === 'loan_disbursement')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const loanPayments = monthTransactions
        .filter(t => t.type === 'loan_payment')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      chartData.push({
        month: monthName,
        savings: deposits / 1000000, // Convert to millions for better display
        loans: loanDisbursements / 1000000,
        revenue: loanPayments / 1000000,
      });
    }
    
    return chartData;
  };

  const chartData = generateChartData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg" data-testid="chart-tooltip">
          <p className="font-medium text-gray-900">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey === 'savings' ? 'Savings' : 
                 entry.dataKey === 'loans' ? 'Loans' : 'Revenue'}: UGX ${entry.value.toFixed(1)}M`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartData.every(d => d.savings === 0 && d.loans === 0 && d.revenue === 0)) {
    return (
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center" data-testid="chart-no-data">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No financial data available</p>
          <p className="text-xs text-gray-400">Chart will display once transactions are recorded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full" data-testid="financial-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Amount (UGX Millions)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="savings" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            name="Savings Deposits"
          />
          <Line 
            type="monotone" 
            dataKey="loans" 
            stroke="#f59e0b" 
            strokeWidth={3}
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
            name="Loan Disbursements"
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            name="Interest Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
