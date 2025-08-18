// This file provides utility functions for generating chart data from actual transactions
// No mock data is generated here - all data comes from the backend API

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  month: string;
  savings: number;
  loans: number;
  revenue: number;
}

/**
 * Converts raw transaction data into chart-friendly format
 * This is a utility function, not mock data generation
 */
export const processTransactionsForChart = (transactions: any[]): TimeSeriesDataPoint[] => {
  const monthlyData: { [key: string]: TimeSeriesDataPoint } = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.transactionDate);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthName,
        savings: 0,
        loans: 0,
        revenue: 0,
      };
    }
    
    const amount = parseFloat(transaction.amount) / 1000000; // Convert to millions
    
    switch (transaction.type) {
      case 'deposit':
        monthlyData[monthKey].savings += amount;
        break;
      case 'loan_disbursement':
        monthlyData[monthKey].loans += amount;
        break;
      case 'loan_payment':
        monthlyData[monthKey].revenue += amount;
        break;
    }
  });
  
  return Object.values(monthlyData).sort((a, b) => 
    new Date(a.month).getTime() - new Date(b.month).getTime()
  );
};

/**
 * Generates color schemes for charts
 */
export const getChartColors = () => ({
  primary: '#3b82f6',
  success: '#10b981', 
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
});

/**
 * Format currency values for display
 */
export const formatCurrency = (amount: number, currency = 'UGX'): string => {
  return `${currency} ${amount.toLocaleString()}`;
};

/**
 * Calculate percentage change
 */
export const calculatePercentageChange = (current: number, previous: number): string => {
  if (previous === 0) return '+0%';
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};

/**
 * Generate month labels for the last N months
 */
export const getLastNMonths = (n: number): string[] => {
  const months: string[] = [];
  const currentDate = new Date();
  
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    months.push(date.toLocaleDateString('en-US', { month: 'short' }));
  }
  
  return months;
};
