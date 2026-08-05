import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  DollarSign, 
  PieChart, 
  Layers, 
  CreditCard, 
  Landmark, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  Download, 
  Printer, 
  RefreshCw, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Calculator,
  Calendar,
  Building2
} from 'lucide-react';
import { 
  FinanceTransaction, 
  ChartOfAccount, 
  JournalEntry, 
  FixedAsset, 
  BankReconcileItem, 
  LoanAccount, 
  Order 
} from '../../types';
import { 
  DEFAULT_CHART_OF_ACCOUNTS, 
  generateTrialBalance, 
  generateBalanceSheet, 
  generateProfitAndLoss, 
  generateATOBASReport 
} from '../../utils/accountingEngine';

interface AccountingFinanceManagerProps {
  transactions: FinanceTransaction[];
  onAddTransaction: (tx: FinanceTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  orders: Order[];
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function AccountingFinanceManager({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  orders,
  onShowAlert
}: AccountingFinanceManagerProps) {
  const [activeTab, setActiveTab] = useState<'journals' | 'ap_ar' | 'statements' | 'assets' | 'reconcile' | 'loans'>('statements');
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>(DEFAULT_CHART_OF_ACCOUNTS);
  const [journals, setJournals] = useState<JournalEntry[]>([
    {
      id: 'JNL-2026-001',
      date: new Date().toISOString().split('T')[0],
      reference: 'INV-10042',
      description: 'Customer Storefront Computer Hardware Order Settlement',
      postedBy: 'System Auto-Posting',
      lines: [
        { accountCode: '1010', accountName: 'Cash at Bank - CBA Operating', debit: 1649.00, credit: 0 },
        { accountCode: '4010', accountName: 'Hardware Retail Sales Revenue', debit: 0, credit: 1499.09 },
        { accountCode: '2100', accountName: 'ATO GST Payable (1A Collected)', debit: 0, credit: 149.91 }
      ]
    }
  ]);

  // Fixed Asset Register state
  const [assets, setAssets] = useState<FixedAsset[]>([
    {
      id: 'AST-001',
      assetName: 'Dell PowerEdge R750 Enterprise Server',
      assetTag: 'TAG-SERVER-01',
      category: 'IT Equipment',
      purchaseDate: '2025-06-15',
      costPrice: 12500,
      salvageValue: 1000,
      usefulLifeYears: 4,
      depreciationMethod: 'Straight-Line',
      accumulatedDepreciation: 2875,
      bookValue: 9625
    },
    {
      id: 'AST-002',
      assetName: 'Toyota HiAce Delivery Van',
      assetTag: 'TAG-VAN-02',
      category: 'Vehicles',
      purchaseDate: '2024-03-10',
      costPrice: 38000,
      salvageValue: 5000,
      usefulLifeYears: 5,
      depreciationMethod: 'Straight-Line',
      accumulatedDepreciation: 13200,
      bookValue: 24800
    }
  ]);

  // Bank Reconciliation feeds state
  const [bankItems, setBankItems] = useState<BankReconcileItem[]>([
    { id: 'BNK-101', date: '2026-08-04', description: 'POS Card Settlement Settlement #8819', amount: 3840.50, type: 'Deposit', matched: true },
    { id: 'BNK-102', date: '2026-08-04', description: 'Sydney Warehouse Rent Payment', amount: 4200.00, type: 'Withdrawal', matched: true },
    { id: 'BNK-103', date: '2026-08-05', description: 'Direct Deposit - Customer #9921', amount: 1250.00, type: 'Deposit', matched: false }
  ]);

  // Loans state
  const [loans, setLoans] = useState<LoanAccount[]>([
    {
      id: 'LN-CBA-01',
      lenderName: 'Commonwealth Bank of Australia',
      accountNumber: 'LN-992-8172-1',
      principalAmount: 50000,
      interestRatePercent: 6.75,
      monthlyPayment: 1050,
      remainingBalance: 35000,
      startDate: '2024-01-15'
    }
  ]);

  // Journal form state
  const [showJnlModal, setShowJnlModal] = useState(false);
  const [jnlRef, setJnlRef] = useState('');
  const [jnlDesc, setJnlDesc] = useState('');
  const [jnlLines, setJnlLines] = useState<{ accountCode: string; debit: string; credit: string }[]>([
    { accountCode: '1010', debit: '0', credit: '0' },
    { accountCode: '4010', debit: '0', credit: '0' }
  ]);

  // Reports Generation
  const trialBalance = generateTrialBalance(chartOfAccounts);
  const balanceSheet = generateBalanceSheet(chartOfAccounts);
  const pnlReport = generateProfitAndLoss(chartOfAccounts);
  const basReport = generateATOBASReport(transactions, orders);

  const handlePostJournal = () => {
    const lines = jnlLines.map(l => {
      const acc = chartOfAccounts.find(a => a.code === l.accountCode);
      return {
        accountCode: l.accountCode,
        accountName: acc?.name || 'General Account',
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0
      };
    });

    const totDeb = lines.reduce((s, l) => s + l.debit, 0);
    const totCrd = lines.reduce((s, l) => s + l.credit, 0);

    if (Math.abs(totDeb - totCrd) > 0.01) {
      onShowAlert?.(`Unbalanced Journal! Total Debits ($${totDeb.toFixed(2)}) must equal Total Credits ($${totCrd.toFixed(2)}).`, 'error');
      return;
    }

    const newJnl: JournalEntry = {
      id: 'JNL-' + String(Date.now()).slice(-6),
      date: new Date().toISOString().split('T')[0],
      reference: jnlRef || 'MANUAL-JNL',
      description: jnlDesc || 'Manual Double-Entry Adjustment',
      postedBy: 'Finance Admin',
      lines
    };

    setJournals(prev => [newJnl, ...prev]);
    setShowJnlModal(false);
    onShowAlert?.(`Journal ${newJnl.id} posted successfully.`, 'success');
  };

  const handleRunDepreciation = () => {
    setAssets(prev => prev.map(ast => {
      const annualDep = (ast.costPrice - ast.salvageValue) / ast.usefulLifeYears;
      const newAcc = ast.accumulatedDepreciation + annualDep;
      const newBook = Math.max(ast.salvageValue, ast.costPrice - newAcc);
      return {
        ...ast,
        accumulatedDepreciation: newAcc,
        bookValue: newBook
      };
    }));
    onShowAlert?.('Annual Depreciation Run Completed! Book values updated in Fixed Asset Register.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">NET OPERATING PROFIT</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">${pnlReport.netProfit.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Gross Revenue: ${pnlReport.totalRevenue.toLocaleString('en-AU')}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">NET BALANCE SHEET EQUITY</span>
          <div className="text-2xl font-black text-blue-400 mt-1">${balanceSheet.totalEquity.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Total Assets: ${balanceSheet.totalAssets.toLocaleString('en-AU')}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">ATO ATO BAS (1A - 1B NET GST)</span>
          <div className="text-2xl font-black text-purple-400 mt-1">${basReport.netGstPayable.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">GST Sales 1A: ${basReport.gstOnSales1A.toLocaleString('en-AU')}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">TRIAL BALANCE STATUS</span>
          <div className="text-xl font-black text-emerald-400 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>{trialBalance.isBalanced ? 'Balanced (100%)' : 'Imbalance Alert'}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">Debits = Credits (${trialBalance.totalDebit.toLocaleString('en-AU')})</span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('statements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'statements' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" /> Financial Statements &amp; ATO BAS
        </button>

        <button
          onClick={() => setActiveTab('journals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'journals' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" /> General Ledger &amp; Journals
        </button>

        <button
          onClick={() => setActiveTab('ap_ar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ap_ar' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" /> AP &amp; AR Aging Ledgers
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'assets' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" /> Fixed Assets &amp; Depreciation
        </button>

        <button
          onClick={() => setActiveTab('reconcile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'reconcile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Landmark className="w-4 h-4" /> Bank Feed Reconciliation
        </button>

        <button
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'loans' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Credit Cards &amp; Loans
        </button>
      </div>

      {/* TAB 1: FINANCIAL STATEMENTS & ATO BAS */}
      {activeTab === 'statements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Balance Sheet */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" /> Statement of Financial Position (Balance Sheet)
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                Assets = Liabilities + Equity
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-400 uppercase text-[10px] block">Current &amp; Non-Current Assets</span>
                {balanceSheet.currentAssets.concat(balanceSheet.nonCurrentAssets).map(a => (
                  <div key={a.code} className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                    <span>{a.code} - {a.name}</span>
                    <strong className="text-emerald-400">${a.amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong>
                  </div>
                ))}
                <div className="flex justify-between py-2 border-t-2 border-slate-700 text-slate-100 font-black">
                  <span>TOTAL ASSETS</span>
                  <span className="text-emerald-400">${balanceSheet.totalAssets.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <span className="font-bold text-slate-400 uppercase text-[10px] block">Liabilities &amp; Net Equity</span>
                {balanceSheet.currentLiabilities.concat(balanceSheet.nonCurrentLiabilities).map(l => (
                  <div key={l.code} className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                    <span>{l.code} - {l.name}</span>
                    <strong className="text-rose-400">${l.amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong>
                  </div>
                ))}
                {balanceSheet.equity.map(e => (
                  <div key={e.code} className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                    <span>{e.code} - {e.name}</span>
                    <strong className="text-blue-400">${e.amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong>
                  </div>
                ))}
                <div className="flex justify-between py-2 border-t-2 border-slate-700 text-slate-100 font-black">
                  <span>TOTAL LIABILITIES &amp; EQUITY</span>
                  <span className="text-blue-400">${balanceSheet.totalLiabilitiesAndEquity.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profit & Loss & ATO BAS Summary */}
          <div className="space-y-6">
            {/* Profit & Loss */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Income Statement (Profit &amp; Loss)
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-400">Net Profit: ${pnlReport.netProfit.toLocaleString('en-AU')}</span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Total Sales Revenue</span>
                  <strong className="text-emerald-400">${pnlReport.totalRevenue.toLocaleString('en-AU')}</strong>
                </div>
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Cost of Goods Sold (COGS)</span>
                  <strong className="text-rose-400">-${pnlReport.totalCOGS.toLocaleString('en-AU')}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-t border-b border-slate-800 text-slate-100 font-bold">
                  <span>GROSS PROFIT</span>
                  <span className="text-blue-400">${pnlReport.grossProfit.toLocaleString('en-AU')}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Total Operating Expenses (Opex)</span>
                  <strong className="text-rose-400">-${pnlReport.totalExpenses.toLocaleString('en-AU')}</strong>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-700 text-slate-100 font-black">
                  <span>NET OPERATING PROFIT</span>
                  <span className="text-emerald-400">${pnlReport.netProfit.toLocaleString('en-AU')}</span>
                </div>
              </div>
            </div>

            {/* ATO BAS & GST Report */}
            <div className="bg-gradient-to-b from-purple-950/40 to-slate-900 p-6 rounded-3xl border border-purple-900/50 space-y-4">
              <div className="flex items-center justify-between border-b border-purple-800/50 pb-3">
                <h3 className="text-sm font-black uppercase text-purple-200 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-purple-400" /> Australian ATO Business Activity Statement (BAS)
                </h3>
                <span className="text-[10px] font-mono text-purple-300 font-bold">{basReport.reportingPeriod}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">G1 TOTAL SALES</span>
                  <strong className="text-slate-100 text-sm">${basReport.totalSalesG1.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">1A GST COLLECTED</span>
                  <strong className="text-purple-300 text-sm">${basReport.gstOnSales1A.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">1B GST CLAIMABLE ON PURCHASES</span>
                  <strong className="text-blue-300 text-sm">${basReport.gstOnPurchases1B.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-purple-800/60">
                  <span className="text-[10px] text-purple-400 font-bold block">NET GST PAYABLE TO ATO</span>
                  <strong className="text-emerald-400 text-sm">${basReport.netGstPayable.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GENERAL LEDGER & JOURNALS */}
      {activeTab === 'journals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Double-Entry General Ledger &amp; Journal Records</h3>
            <button
              onClick={() => setShowJnlModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Post New Journal
            </button>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between font-mono text-xs text-slate-400">
              <span>JOURNAL ENTRY AUDIT TRAIL</span>
              <span>DOUBLE-ENTRY STATUS: BALANCED</span>
            </div>

            <div className="divide-y divide-slate-800">
              {journals.map(jnl => (
                <div key={jnl.id} className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-blue-950 text-blue-300 text-xs font-mono font-bold rounded-lg border border-blue-800">{jnl.id}</span>
                      <span className="text-xs font-bold text-slate-200">{jnl.description}</span>
                    </div>
                    <div className="text-right font-mono text-xs text-slate-400">
                      <span>Ref: {jnl.reference} &bull; {jnl.date}</span>
                    </div>
                  </div>

                  {/* Lines Table */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800/80 p-3 space-y-1 font-mono text-xs">
                    {jnl.lines.map((l, idx) => (
                      <div key={idx} className="flex justify-between text-slate-300 py-0.5">
                        <span>{l.accountCode} - {l.accountName}</span>
                        <div className="flex gap-6">
                          <span className="w-24 text-right text-emerald-400 font-bold">{l.debit > 0 ? `$${l.debit.toFixed(2)} DR` : '-'}</span>
                          <span className="w-24 text-right text-blue-400 font-bold">{l.credit > 0 ? `$${l.credit.toFixed(2)} CR` : '-'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AP & AR AGING */}
      {activeTab === 'ap_ar' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Accounts Receivable (AR Customer Debtors)
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">Current (0-30 Days):</span>
                <strong className="text-emerald-400">$18,450.00</strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">31 - 60 Days Overdue:</span>
                <strong className="text-amber-400">$6,800.00</strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">61 - 90+ Days Overdue:</span>
                <strong className="text-rose-400">$3,200.00</strong>
              </div>
              <div className="flex justify-between pt-2 text-slate-100 font-black border-t border-slate-800">
                <span>TOTAL AR OUTSTANDING</span>
                <span className="text-emerald-400">$28,450.00</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-100 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" /> Accounts Payable (AP Supplier Creditors)
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">Current (0-30 Days):</span>
                <strong className="text-emerald-400">$12,120.00</strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">31 - 60 Days Due:</span>
                <strong className="text-amber-400">$4,200.00</strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">61 - 90+ Days Due:</span>
                <strong className="text-rose-400">$2,000.00</strong>
              </div>
              <div className="flex justify-between pt-2 text-slate-100 font-black border-t border-slate-800">
                <span>TOTAL AP DUE</span>
                <span className="text-rose-400">$18,320.00</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FIXED ASSETS & DEPRECIATION */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-slate-200">Fixed Asset Register &amp; Depreciation Schedules</h3>
            <button
              onClick={handleRunDepreciation}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Run Annual Depreciation
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map(ast => (
              <div key={ast.id} className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-blue-950 text-blue-300 rounded border border-blue-800">{ast.category}</span>
                    <h4 className="font-bold text-sm text-slate-100 mt-1">{ast.assetName}</h4>
                    <span className="text-[11px] font-mono text-slate-400">{ast.assetTag} &bull; Purchased {ast.purchaseDate}</span>
                  </div>
                  <span className="text-sm font-mono font-black text-emerald-400">${ast.bookValue.toLocaleString('en-AU')} Book Val</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 font-mono text-xs grid grid-cols-2 gap-2 text-slate-400">
                  <div>Cost Price: <strong className="text-slate-200">${ast.costPrice.toLocaleString('en-AU')}</strong></div>
                  <div>Salvage Val: <strong className="text-slate-200">${ast.salvageValue.toLocaleString('en-AU')}</strong></div>
                  <div>Acc. Dep: <strong className="text-rose-400">-${ast.accumulatedDepreciation.toLocaleString('en-AU')}</strong></div>
                  <div>Method: <strong className="text-blue-300">{ast.depreciationMethod}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: BANK RECONCILIATION */}
      {activeTab === 'reconcile' && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase text-slate-200">Bank Statement Feeds &amp; Reconciliation Matcher</h3>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
            {bankItems.map(item => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${item.type === 'Deposit' ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-rose-950 border-rose-800 text-rose-400'}`}>
                    {item.type === 'Deposit' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-200">{item.description}</h4>
                    <span className="text-[11px] font-mono text-slate-400">{item.date} &bull; CBA Account</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`font-mono text-sm font-black ${item.type === 'Deposit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {item.type === 'Deposit' ? '+' : '-'}${item.amount.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setBankItems(prev => prev.map(b => b.id === item.id ? { ...b, matched: !b.matched } : b));
                      onShowAlert?.(item.matched ? 'Transaction unmarked' : 'Transaction Reconciled with Ledger!', 'success');
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                      item.matched
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-md'
                    }`}
                  >
                    {item.matched ? '✓ Reconciled' : 'Reconcile'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: LOANS & CREDIT CARDS */}
      {activeTab === 'loans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loans.map(loan => (
            <div key={loan.id} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-purple-950 text-purple-300 rounded border border-purple-800">COMMERCIAL LOAN</span>
                  <h4 className="font-bold text-sm text-slate-100 mt-1">{loan.lenderName}</h4>
                  <span className="text-[11px] font-mono text-slate-400">{loan.accountNumber}</span>
                </div>
                <span className="text-base font-mono font-black text-purple-400">${loan.remainingBalance.toLocaleString('en-AU')} Owing</span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs text-slate-400">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span>Interest Rate:</span>
                  <strong className="text-slate-200 block text-sm">{loan.interestRatePercent}% p.a.</strong>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span>Monthly Repayment:</span>
                  <strong className="text-emerald-400 block text-sm">${loan.monthlyPayment.toLocaleString('en-AU')}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Journal Modal Sub-Overlay */}
      {showJnlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-800 p-6 space-y-4 text-white">
            <h3 className="font-black text-sm uppercase text-slate-100 border-b border-slate-800 pb-3">Post Double-Entry Journal Record</h3>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Journal Reference (e.g. ADJ-0091)"
                value={jnlRef}
                onChange={e => setJnlRef(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 px-3 py-2 text-xs rounded-xl text-white"
              />
              <input
                type="text"
                placeholder="Journal Description"
                value={jnlDesc}
                onChange={e => setJnlDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 px-3 py-2 text-xs rounded-xl text-white"
              />

              <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-xs">
                {jnlLines.map((l, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={l.accountCode}
                      onChange={e => {
                        const copy = [...jnlLines];
                        copy[idx].accountCode = e.target.value;
                        setJnlLines(copy);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs rounded-xl text-slate-200"
                    >
                      {chartOfAccounts.map(a => (
                        <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      placeholder="Debit ($)"
                      value={l.debit}
                      onChange={e => {
                        const copy = [...jnlLines];
                        copy[idx].debit = e.target.value;
                        setJnlLines(copy);
                      }}
                      className="w-24 bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs rounded-xl text-emerald-400"
                    />

                    <input
                      type="number"
                      placeholder="Credit ($)"
                      value={l.credit}
                      onChange={e => {
                        const copy = [...jnlLines];
                        copy[idx].credit = e.target.value;
                        setJnlLines(copy);
                      }}
                      className="w-24 bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs rounded-xl text-blue-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={handlePostJournal}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase"
              >
                Post Journal Entry
              </button>
              <button
                type="button"
                onClick={() => setShowJnlModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
