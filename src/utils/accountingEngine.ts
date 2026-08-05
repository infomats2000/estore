import { ChartOfAccount, JournalEntry, FixedAsset, FinanceTransaction, Order } from '../types';

export const DEFAULT_CHART_OF_ACCOUNTS: ChartOfAccount[] = [
  // ASSETS (1000s)
  { code: '1010', name: 'Cash at Bank - CBA Operating', type: 'Asset', category: 'Current Assets', balance: 145280.50 },
  { code: '1020', name: 'Petty Cash Register Float', type: 'Asset', category: 'Current Assets', balance: 750.00 },
  { code: '1100', name: 'Accounts Receivable (Trade Debtors)', type: 'Asset', category: 'Current Assets', balance: 28450.00 },
  { code: '1200', name: 'Inventory Asset - Hardware & Stock', type: 'Asset', category: 'Current Assets', balance: 94600.00 },
  { code: '1510', name: 'Fixed Asset - IT & Workshop Equipment', type: 'Asset', category: 'Non-Current Assets', balance: 45000.00 },
  { code: '1520', name: 'Fixed Asset - Delivery Vehicles', type: 'Asset', category: 'Non-Current Assets', balance: 38000.00 },
  { code: '1590', name: 'Accumulated Depreciation - Fixed Assets', type: 'Asset', category: 'Non-Current Assets', balance: -12500.00 },

  // LIABILITIES (2000s)
  { code: '2010', name: 'Accounts Payable (Trade Creditors)', type: 'Liability', category: 'Current Liabilities', balance: 18320.00 },
  { code: '2100', name: 'ATO GST Payable (1A Collected)', type: 'Liability', category: 'Current Liabilities', balance: 14250.00 },
  { code: '2110', name: 'ATO GST Credit (1B Paid)', type: 'Liability', category: 'Current Liabilities', balance: -8410.00 },
  { code: '2200', name: 'Business Credit Card - AMEX Corporate', type: 'Liability', category: 'Current Liabilities', balance: 4650.00 },
  { code: '2500', name: 'Commercial Equipment Loan - CBA', type: 'Liability', category: 'Non-Current Liabilities', balance: 35000.00 },

  // EQUITY (3000s)
  { code: '3010', name: 'Shareholder Capital', type: 'Equity', category: 'Owner Equity', balance: 150000.00 },
  { code: '3020', name: 'Retained Earnings', type: 'Equity', category: 'Owner Equity', balance: 72950.50 },

  // REVENUE (4000s)
  { code: '4010', name: 'Hardware Retail Sales Revenue', type: 'Revenue', category: 'Operating Revenue', balance: 284500.00 },
  { code: '4020', name: 'B2B Wholesale Sales Revenue', type: 'Revenue', category: 'Operating Revenue', balance: 195000.00 },
  { code: '4030', name: 'Service & Repair Labour Revenue', type: 'Revenue', category: 'Operating Revenue', balance: 42800.00 },

  // EXPENSES (5000s)
  { code: '5010', name: 'Cost of Goods Sold (COGS)', type: 'Expense', category: 'Direct Expenses', balance: 245000.00 },
  { code: '5100', name: 'Salaries & Staff Wages', type: 'Expense', category: 'Operating Expenses', balance: 78000.00 },
  { code: '5200', name: 'Warehouse Rent & Lease', type: 'Expense', category: 'Operating Expenses', balance: 24000.00 },
  { code: '5300', name: 'Freight & Express Shipping', type: 'Expense', category: 'Operating Expenses', balance: 14500.00 },
  { code: '5400', name: 'Utilities & Power', type: 'Expense', category: 'Operating Expenses', balance: 6800.00 },
  { code: '5500', name: 'Depreciation Expense', type: 'Expense', category: 'Operating Expenses', balance: 4500.00 }
];

export interface TrialBalanceReport {
  rows: { code: string; name: string; type: string; debit: number; credit: number }[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

export function generateTrialBalance(accounts: ChartOfAccount[]): TrialBalanceReport {
  let totalDebit = 0;
  let totalCredit = 0;

  const rows = accounts.map(acc => {
    let debit = 0;
    let credit = 0;

    if (acc.type === 'Asset' || acc.type === 'Expense') {
      if (acc.balance >= 0) debit = acc.balance;
      else credit = Math.abs(acc.balance);
    } else {
      if (acc.balance >= 0) credit = acc.balance;
      else debit = Math.abs(acc.balance);
    }

    totalDebit += debit;
    totalCredit += credit;

    return { code: acc.code, name: acc.name, type: acc.type, debit, credit };
  });

  return {
    rows,
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
  };
}

export interface BalanceSheetReport {
  currentAssets: { code: string; name: string; amount: number }[];
  totalCurrentAssets: number;
  nonCurrentAssets: { code: string; name: string; amount: number }[];
  totalNonCurrentAssets: number;
  totalAssets: number;

  currentLiabilities: { code: string; name: string; amount: number }[];
  totalCurrentLiabilities: number;
  nonCurrentLiabilities: { code: string; name: string; amount: number }[];
  totalNonCurrentLiabilities: number;
  totalLiabilities: number;

  equity: { code: string; name: string; amount: number }[];
  totalEquity: number;

  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export function generateBalanceSheet(accounts: ChartOfAccount[]): BalanceSheetReport {
  const assets = accounts.filter(a => a.type === 'Asset');
  const liabilities = accounts.filter(a => a.type === 'Liability');
  const equityAccounts = accounts.filter(a => a.type === 'Equity');

  const currentAssets = assets.filter(a => a.category.includes('Current') && !a.category.includes('Non-Current')).map(a => ({ code: a.code, name: a.name, amount: a.balance }));
  const totalCurrentAssets = currentAssets.reduce((sum, a) => sum + a.amount, 0);

  const nonCurrentAssets = assets.filter(a => a.category.includes('Non-Current')).map(a => ({ code: a.code, name: a.name, amount: a.balance }));
  const totalNonCurrentAssets = nonCurrentAssets.reduce((sum, a) => sum + a.amount, 0);
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  const currentLiabilities = liabilities.filter(l => l.category.includes('Current') && !l.category.includes('Non-Current')).map(l => ({ code: l.code, name: l.name, amount: l.balance }));
  const totalCurrentLiabilities = currentLiabilities.reduce((sum, l) => sum + l.amount, 0);

  const nonCurrentLiabilities = liabilities.filter(l => l.category.includes('Non-Current')).map(l => ({ code: l.code, name: l.name, amount: l.balance }));
  const totalNonCurrentLiabilities = nonCurrentLiabilities.reduce((sum, l) => sum + l.amount, 0);
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

  const equity = equityAccounts.map(e => ({ code: e.code, name: e.name, amount: e.balance }));
  const totalEquity = equity.reduce((sum, e) => sum + e.amount, 0);

  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  return {
    currentAssets,
    totalCurrentAssets,
    nonCurrentAssets,
    totalNonCurrentAssets,
    totalAssets,
    currentLiabilities,
    totalCurrentLiabilities,
    nonCurrentLiabilities,
    totalNonCurrentLiabilities,
    totalLiabilities,
    equity,
    totalEquity,
    totalLiabilitiesAndEquity,
    isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1.00
  };
}

export interface ProfitAndLossReport {
  revenueItems: { code: string; name: string; amount: number }[];
  totalRevenue: number;
  cogsItems: { code: string; name: string; amount: number }[];
  totalCOGS: number;
  grossProfit: number;
  expenseItems: { code: string; name: string; amount: number }[];
  totalExpenses: number;
  netProfit: number;
}

export function generateProfitAndLoss(accounts: ChartOfAccount[]): ProfitAndLossReport {
  const revenueAccounts = accounts.filter(a => a.type === 'Revenue');
  const expenseAccounts = accounts.filter(a => a.type === 'Expense');

  const revenueItems = revenueAccounts.map(r => ({ code: r.code, name: r.name, amount: r.balance }));
  const totalRevenue = revenueItems.reduce((sum, r) => sum + r.amount, 0);

  const cogsItems = expenseAccounts.filter(e => e.code === '5010' || e.name.toLowerCase().includes('cogs')).map(e => ({ code: e.code, name: e.name, amount: e.balance }));
  const totalCOGS = cogsItems.reduce((sum, c) => sum + c.amount, 0);
  const grossProfit = totalRevenue - totalCOGS;

  const expenseItems = expenseAccounts.filter(e => e.code !== '5010' && !e.name.toLowerCase().includes('cogs')).map(e => ({ code: e.code, name: e.name, amount: e.balance }));
  const totalExpenses = expenseItems.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  return {
    revenueItems,
    totalRevenue,
    cogsItems,
    totalCOGS,
    grossProfit,
    expenseItems,
    totalExpenses,
    netProfit
  };
}

export interface ATOBASReport {
  totalSalesG1: number;
  gstOnSales1A: number;
  gstOnPurchases1B: number;
  netGstPayable: number;
  reportingPeriod: string;
}

export function generateATOBASReport(transactions: FinanceTransaction[], orders: Order[]): ATOBASReport {
  const totalSalesG1 = orders.reduce((sum, o) => sum + o.total, 0);
  const gstOnSales1A = orders.reduce((sum, o) => sum + o.tax, 0);
  
  const businessExpenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
  const gstOnPurchases1B = businessExpenses * 0.10; // 10% GST claimable on purchases
  const netGstPayable = gstOnSales1A - gstOnPurchases1B;

  return {
    totalSalesG1,
    gstOnSales1A,
    gstOnPurchases1B,
    netGstPayable,
    reportingPeriod: `Q3 FY2026 (${new Date().toISOString().slice(0, 7)})`
  };
}
