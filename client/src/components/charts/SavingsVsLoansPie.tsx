import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface SavingsVsLoansPieProps {
  data: PieChartData[];
  isLoading?: boolean;
}

export default function SavingsVsLoansPie({ data, isLoading = false }: SavingsVsLoansPieProps) {
  if (isLoading) {
    return (
      <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center" data-testid="pie-chart-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center" data-testid="pie-chart-no-data">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Chart will display once financial data is recorded</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg" data-testid="pie-chart-tooltip">
          <p className="font-medium text-gray-900 dark:text-gray-100">{data.name}</p>
          <p style={{ color: data.payload.color }} className="text-sm">
            Value: UGX {data.value.toFixed(1)}M
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {((data.value / data.payload.total) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex justify-center gap-4 mt-4 text-sm">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2" data-testid={`legend-item-${index}`}>
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700 dark:text-gray-300">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Calculate total for percentage calculation
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = data.map(item => ({ ...item, total }));

  return (
    <div className="h-64 w-full" data-testid="savings-vs-loans-pie">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataWithTotal}
            cx="50%"
            cy="40%"
            outerRadius={60}
            innerRadius={20}
            paddingAngle={5}
            dataKey="value"
          >
            {dataWithTotal.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}