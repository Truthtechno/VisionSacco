import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export interface LineChartData {
  month: string;
  contributions: number;
  deposits: number;
}

interface MonthlyContributionsLineProps {
  data: LineChartData[];
  isLoading?: boolean;
}

export default function MonthlyContributionsLine({ data, isLoading = false }: MonthlyContributionsLineProps) {
  if (isLoading) {
    return (
      <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center" data-testid="line-chart-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0 || data.every(d => d.contributions === 0 && d.deposits === 0)) {
    return (
      <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center" data-testid="line-chart-no-data">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">No contribution data available</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Chart will display once contributions are recorded</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg" data-testid="line-chart-tooltip">
          <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey === 'contributions' ? 'Total Contributions' : 'Deposits Only'}: UGX {entry.value.toFixed(1)}M
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full" data-testid="monthly-contributions-line">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-600" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280" 
            className="dark:stroke-gray-400"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280" 
            className="dark:stroke-gray-400"
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
            dataKey="contributions" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            name="Total Contributions"
          />
          <Line 
            type="monotone" 
            dataKey="deposits" 
            stroke="#3b82f6" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
            name="Deposits Only"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}