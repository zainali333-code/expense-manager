export const CATEGORIES = {
  expense: ['Food', 'Shopping', 'Bills', 'Transport', 'Rent', 'Entertainment', 'Health', 'Education', 'Subscription', 'Other'],
  income: ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'],
};
export const ALL_CATEGORIES = [...new Set([...CATEGORIES.expense, ...CATEGORIES.income])];
export const METHODS = ['Cash', 'Bank', 'Card', 'Easypaisa', 'JazzCash'];
export const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR'];
export const CHART_COLORS = ['#2563eb', '#f97316', '#16a34a', '#f5b50a', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#84cc16', '#64748b'];

export const money = (n, currency = 'PKR') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n || 0);

export const today = () => new Date().toISOString().slice(0, 10);
export const thisMonth = () => new Date().toISOString().slice(0, 7);

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const monthLabel = (m) => {
  const [y, mo] = m.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};
