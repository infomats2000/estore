import React, { useState } from 'react';
import { DollarSign, CheckCircle2, Clock, Filter, Search, ShieldCheck, Tag } from 'lucide-react';
import { ConsignmentPayoutRecord } from '../../types';

interface ConsignmentPayoutManagerProps {
  payouts: ConsignmentPayoutRecord[];
  onUpdatePayoutStatus: (id: string, status: 'Paid' | 'Processing', reference?: string) => void;
  onShowAlert?: (title: string, message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function ConsignmentPayoutManager({
  payouts,
  onUpdatePayoutStatus,
  onShowAlert
}: ConsignmentPayoutManagerProps) {
  const [statusFilter, setStatusFilter] = useState<'All' | 'Unpaid' | 'Paid'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  let filtered = payouts.filter(p => {
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return p.vendorName.toLowerCase().includes(q) || p.productName.toLowerCase().includes(q) || p.saleOrderId.toLowerCase().includes(q);
    }
    return true;
  });

  const totalUnpaidPayouts = payouts.filter(p => p.status === 'Unpaid').reduce((a, b) => a + b.vendorPayoutAmount, 0);
  const totalCommissionEarned = payouts.reduce((a, b) => a + b.storeCommissionAmount, 0);
  const totalVendorPayoutsProcessed = payouts.filter(p => p.status === 'Paid').reduce((a, b) => a + b.vendorPayoutAmount, 0);

  const handleMarkPaid = (payout: ConsignmentPayoutRecord) => {
    const ref = prompt(`Enter Payment Reference # (EFT/Bank Deposit) for ${payout.vendorName}:`, `EFT-CONS-${Date.now().toString().slice(-5)}`);
    if (ref !== null) {
      onUpdatePayoutStatus(payout.id, 'Paid', ref);
      onShowAlert?.('Payout Processed', `Consignment payout of $${payout.vendorPayoutAmount.toFixed(2)} marked as PAID to ${payout.vendorName}.`, 'success');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Unpaid Vendor Payouts</span>
          <div className="text-xl font-black text-rose-600 font-mono">
            ${totalUnpaidPayouts.toFixed(2)}
          </div>
          <p className="text-[10px] text-slate-400">Owed to Consignment Vendors</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Store Retained Commission</span>
          <div className="text-xl font-black text-emerald-600 font-mono">
            ${totalCommissionEarned.toFixed(2)}
          </div>
          <p className="text-[10px] text-slate-400">Store Commission Revenue</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Settled Payouts</span>
          <div className="text-xl font-black text-blue-600 font-mono">
            ${totalVendorPayoutsProcessed.toFixed(2)}
          </div>
          <p className="text-[10px] text-slate-400">Paid to Consignment Vendors</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Status:</span>
          {(['All', 'Unpaid', 'Paid'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                statusFilter === s
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor or product..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Vendor Name</th>
                <th className="p-3">Consigned Product</th>
                <th className="p-3">Sale Order #</th>
                <th className="p-3 text-right">Sale Price ($)</th>
                <th className="p-3 text-right">Store Commission ($)</th>
                <th className="p-3 text-right">Vendor Payout ($)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    No consignment payout records found.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{p.vendorName}</td>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{p.productName}</td>
                    <td className="p-3 font-mono font-semibold text-blue-600 dark:text-blue-400">{p.saleOrderId}</td>
                    <td className="p-3 text-right font-mono">${p.saleAmount.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600">${p.storeCommissionAmount.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600">${p.vendorPayoutAmount.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md ${
                        p.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {p.status === 'Unpaid' ? (
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(p)}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">{p.payoutReference || 'Settled'}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
