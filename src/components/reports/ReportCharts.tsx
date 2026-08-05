import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { ERPReportData } from '../../types';

interface ReportChartsProps {
  report: ERPReportData;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function ReportCharts({ report }: ReportChartsProps) {
  if (report.type === 'pnl') {
    const chartData = [
      { name: 'Revenue', amount: Number(report.kpis.find(k => k.label.includes('Revenue'))?.value || 0) },
      { name: 'COGS', amount: Number(report.kpis.find(k => k.label.includes('COGS'))?.value || 0) },
      { name: 'Gross Profit', amount: Number(report.kpis.find(k => k.label.includes('Gross Profit'))?.value || 0) },
      { name: 'Expenses', amount: Number(report.kpis.find(k => k.label.includes('Expenses'))?.value || 0) },
      { name: 'Net Profit', amount: Number(report.kpis.find(k => k.label.includes('Net Profit'))?.value || 0) },
    ];

    return (
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-3">Profit &amp; Loss Waterfall Visual</h4>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={val => `$${val}`} />
              <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={Number(entry.amount) < 0 ? '#ef4444' : COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (report.type === 'ar-aging') {
    const chartData = [
      { name: 'Current (0-30d)', amount: Number(report.summaryRow?.current || 0) },
      { name: '31-60 Days', amount: Number(report.summaryRow?.d1to30 || 0) },
      { name: '61-90 Days', amount: Number(report.summaryRow?.d31to60 || 0) },
      { name: '90+ Days Overdue', amount: Number(report.summaryRow?.dOverdue60 || 0) },
    ];

    return (
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-3">Accounts Receivable Overdue Aging Breakdown</h4>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={val => `$${val}`} />
              <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Outstanding']} />
              <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
                <Cell fill="#ef4444" />
                <Cell fill="#991b1b" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (report.type === 'inventory-valuation' || report.type === 'sales-velocity') {
    const categoryTotals: Record<string, number> = {};
    report.rows.forEach(r => {
      const cat = r.category || 'Other';
      const val = Number(r.totalRetail || r.totalRevenue || 1);
      categoryTotals[cat] = (categoryTotals[cat] || 0) + val;
    });

    const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

    return (
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-3">Category Distribution Breakdown</h4>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Value']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return null;
}
