import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export interface BarChartData {
  status: string;
  count: number;
  amount: number;
  color: string;
}

interface LoansByStatusBarProps {
  data: BarChartData[];
  isLoading?: boolean;
  showAmount?: boolean; // Toggle between showing count or amount
}

export default function LoansByStatusBar({ data, isLoading = false, showAmount = false }: LoansByStatusBarProps) {
  if (isLoading) {
    return (
      <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center" data-testid="bar-chart-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center" data-testid="bar-chart-no-data">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">No loan data available</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Chart will display once loans are recorded</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg" data-testid="bar-chart-tooltip">
          <p className="font-medium text-gray-900 dark:text-gray-100">{label} Loans</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Count: {data.count} loan{data.count !== 1 ? 's' : ''}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Amount: UGX {data.amount.toFixed(1)}M
          </p>
        </div>
      );
    }
    return null;
  };

  const dataKey = showAmount ? 'amount' : 'count';
  const yAxisLabel = showAmount ? 'Amount (UGX Millions)' : 'Number of Loans';

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Show:</span>
          <button
            onClick={() => {}} // Parent component should handle this
            className={`px-3 py-1 rounded text-xs ${
              !showAmount 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}
            data-testid="toggle-count"
          >
            Count
          </button>
          <button
            onClick={() => {}} // Parent component should handle this
            className={`px-3 py-1 rounded text-xs ${
              showAmount 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}
            data-testid="toggle-amount"
          >
            Amount
          </button>
        </div>
      </div>
      
      <div className="h-64 w-full" data-testid="loans-by-status-bar">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-600" />
            <XAxis 
              dataKey="status" 
              stroke="#6b7280" 
              className="dark:stroke-gray-400"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6b7280" 
              className="dark:stroke-gray-400"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey={dataKey} 
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}