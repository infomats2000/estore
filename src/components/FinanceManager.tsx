import React, { useState, useMemo } from 'react';
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, Search, Download } from 'lucide-react';
import { FinanceTransaction } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface FinanceManagerProps {
  transactions: FinanceTransaction[];
  onAddTransaction: (tx: FinanceTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function FinanceManager({ transactions, onAddTransaction, onDeleteTransaction }: FinanceManagerProps) {
  const [budgetCap, setBudgetCap] = useState<number>(5000);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'Income' | 'Expense'>('Income');
  const [category, setCategory] = useState('Sales');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [tags, setTags] = useState('');

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    const KEYWORD_MAP = [
        { keywords: ['shipping', 'courier', 'fedex', 'dhl'], category: 'Shipping', tags: ['shipping'] },
        { keywords: ['raw', 'materials', 'supplies', 'fabric'], category: 'Inventory', tags: ['materials'] },
        { keywords: ['rent', 'office', 'utilities', 'electricity'], category: 'Operations', tags: ['office'] },
    ];
    const found = KEYWORD_MAP.find(item => item.keywords.some(k => val.toLowerCase().includes(k)));
    if (found) {
        setCategory(found.category);
        setTags(found.tags.join(', '));
    }
  };

  const chartData = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyData: Record<string, { date: string, Income: number, Expenses: number, NetProfit: number }> = {};
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        dailyData[dateStr] = { date: String(i), Income: 0, Expenses: 0, NetProfit: 0 };
    }

    transactions.forEach(t => {
        const d = new Date(t.date);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            if (dailyData[t.date]) {
                if (t.type === 'Income') dailyData[t.date].Income += t.amount;
                else dailyData[t.date].Expenses += t.amount;
                dailyData[t.date].NetProfit = dailyData[t.date].Income - dailyData[t.date].Expenses;
            }
        }
    });

    return Object.values(dailyData);
  }, [transactions]);

  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
    t.reference?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const monthlyTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [transactions]);

  const totalIncome = monthlyTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = monthlyTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;
  
  const expensePercentage = budgetCap > 0 ? (totalExpense / budgetCap) * 100 : 0;
  const warningClass = expensePercentage >= 100 ? 'border-red-500 bg-red-50' : 
                       expensePercentage >= 80 ? 'border-orange-400 bg-orange-50' : 'border-neutral-400';

  const handleDownloadCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Reference', 'Tags'];
    const rows = filtered.map(tx => [
        tx.date,
        tx.type,
        tx.category,
        `"${tx.description.replace(/"/g, '""')}"`,
        tx.amount.toFixed(2),
        `"${tx.reference?.replace(/"/g, '""') || ''}"`,
        `"${tx.tags?.join('; ') || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTransaction({
      id: 'TX-' + Date.now(),
      date,
      type,
      category,
      amount: parseFloat(amount),
      description,
      reference,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
    });
    setShowAdd(false);
    setAmount('');
    setDescription('');
    setReference('');
    setTags('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Total Income: <span className="text-slate-900 dark:text-slate-100">${totalIncome.toFixed(2)}</span>
        </div>
        <div className="font-mono font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
          Total Expense: <span className="text-slate-900 dark:text-slate-100">${totalExpense.toFixed(2)}</span>
        </div>
        <div className="font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
          Net Profit Margin: <span className="text-slate-900 dark:text-slate-100">${netProfit.toFixed(2)} ({totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0'}%)</span>
        </div>
        {expensePercentage >= 80 && (
          <div className="font-mono font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            {expensePercentage >= 100 ? 'Budget Exceeded' : 'Budget Near Limit'}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Monthly Budget Cap ($):</span>
          <input
            type="number"
            value={budgetCap}
            onChange={e => setBudgetCap(Number(e.target.value))}
            className="h-7 w-28 rounded-md border border-slate-300 bg-slate-50 px-2.5 font-mono text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      <div className="h-44 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Income" stroke="#198754" strokeWidth={3} />
                <Line type="monotone" dataKey="Expenses" stroke="#dc3545" strokeWidth={3} />
                <Line type="monotone" dataKey="NetProfit" stroke="#0d6efd" strokeWidth={3} />
            </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans text-xs"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-600" />
            EXPORT CSV
          </button>
          <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white px-5 py-2 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            NEW TRANSACTION
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border-2 border-blue-500 space-y-3 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-xs font-mono font-bold" required />
            <select value={type} onChange={e => setType(e.target.value as any)} className="p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-xs font-bold">
              <option value="Income">Income (+)</option>
              <option value="Expense">Expense (-)</option>
            </select>
            <input type="text" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} className="p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-xs" required />
          </div>
          <input type="number" placeholder="Amount ($)" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-xs font-mono font-bold" required step="0.01" />
          <input type="text" placeholder="Description" value={description} onChange={e => handleDescriptionChange(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-xs" required />
          <input type="text" placeholder="Reference (optional)" value={reference} onChange={e => setReference(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-xs" />
          <input type="text" placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-xs" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer">CANCEL</button>
            <button type="submit" className="px-5 py-2 text-xs font-black bg-[#198754] hover:bg-[#157347] text-white rounded-xl shadow-md transition-all cursor-pointer">SAVE TRANSACTION</button>
          </div>
        </form>
      )}

      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-md">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-mono text-[10px] uppercase text-slate-700 dark:text-slate-300 font-bold">
            <tr>
              <th className="p-3.5">Date</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Description</th>
              <th className="p-3.5">Tags</th>
              <th className="p-3.5 text-right">Amount</th>
              <th className="p-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map(tx => (
              <tr key={tx.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400 font-bold">{tx.date}</td>
                <td className="p-3.5 font-bold">
                  {tx.type === 'Income' ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full font-mono text-[9px]">
                      <TrendingUp className="h-3 w-3" /> INCOME
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-2.5 py-1 rounded-full font-mono text-[9px]">
                      <TrendingDown className="h-3 w-3" /> EXPENSE
                    </span>
                  )}
                </td>
                <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{tx.category}</td>
                <td className="p-3.5 text-slate-600 dark:text-slate-400">{tx.description}</td>
                <td className="p-3.5">
                    <div className="flex flex-wrap gap-1">
                        {tx.tags?.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 text-[9px] font-mono font-bold rounded-full">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </td>
                <td className={`p-3.5 font-mono font-black text-right text-sm ${tx.type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {tx.type === 'Income' ? '+' : '-'}${tx.amount.toFixed(2)}
                </td>
                <td className="p-3.5 text-right">
                  <button onClick={() => onDeleteTransaction(tx.id)} className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-rose-50 cursor-pointer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
