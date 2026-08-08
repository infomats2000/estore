import React, { useEffect, useState } from 'react';
import { X, Calendar, DollarSign, Clock, CheckCircle2, User, Printer, Layers } from 'lucide-react';
import { LaybyOrder, StoreSettings } from '../../types';
import { useAdminInteractions } from '../../context/AdminInteractionContext';

interface LaybyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  laybyOrders: LaybyOrder[];
  onAddInstallment: (laybyNumber: string, amount: number, paymentMethod: string) => void;
  onShowAlert?: (title: string, message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  storeSettings?: StoreSettings;
  shiftId?: string;
}

export default function LaybyManagerModal({
  isOpen,
  onClose,
  laybyOrders,
  onAddInstallment,
  onShowAlert,
  storeSettings,
  shiftId
}: LaybyManagerModalProps) {
  const interactions = useAdminInteractions();
  const [selectedLayby, setSelectedLayby] = useState<LaybyOrder | null>(null);
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [installmentMethod, setInstallmentMethod] = useState<'Cash' | 'EFTPOS Card' | 'EFT Bank Deposit'>('Cash');
  const [persistedLaybys, setPersistedLaybys] = useState<any[]>([]);
  const [error, setError] = useState('');
  const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` });
  const loadLaybys = async () => {
    const response = await fetch('/api/pos/laybys', { headers: authHeaders() });
    const result = await response.json();
    if (response.ok) setPersistedLaybys(result.laybys || []); else setError(result.error || 'Unable to load reservations.');
  };
  useEffect(() => { if (isOpen) void loadLaybys(); }, [isOpen]);

  if (!isOpen) return null;

  const source = persistedLaybys.length ? persistedLaybys.map(layby => ({
    ...layby, status: layby.status === 'ACTIVE' ? 'Active' : layby.status === 'COMPLETED' ? 'Completed' : layby.status,
    depositPaid: layby.paidAmount, expiryDate: String(layby.expiryDate).split('T')[0],
  })) : laybyOrders;
  const activeOrders = source.filter(l => l.status === 'Active');

  const handleProcessInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLayby) return;

    const amt = parseFloat(installmentAmount);
    if (isNaN(amt) || amt <= 0) {
      onShowAlert?.('Invalid Amount', 'Please enter a valid installment payment amount.', 'error');
      return;
    }

    if (amt > selectedLayby.remainingBalance) {
      onShowAlert?.('Overpayment', `Installment ($${amt.toFixed(2)}) exceeds remaining balance ($${selectedLayby.remainingBalance.toFixed(2)}).`, 'warning');
      return;
    }

    const method = installmentMethod === 'Cash' ? 'CASH' : installmentMethod === 'EFTPOS Card' ? 'EFTPOS' : 'BANK_TRANSFER';
    const reference = method === 'CASH' ? undefined : await interactions.prompt({ title: 'Payment Reference', help: 'Enter the approved terminal or bank reference for this instalment.', label: 'Provider reference', confirmLabel: 'Record Payment' }) || undefined;
    if (method !== 'CASH' && !reference) { setError('A provider reference is required for non-cash installments.'); return; }
    const response = await fetch(`/api/pos/laybys/${selectedLayby.id}/payments`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ amount: amt, method, shiftId, reference }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || 'Unable to record installment.'); return; }
    onAddInstallment(selectedLayby.laybyNumber, amt, installmentMethod);
    onShowAlert?.('Instalment Received', `Received $${amt.toFixed(2)} payment for reservation #${selectedLayby.laybyNumber}.`, 'success');
    await loadLaybys();
    setInstallmentAmount('');
    setSelectedLayby(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm">Reserve &amp; Deposit Manager</h3>
              <p className="text-[11px] text-slate-400">Track active customer reservations, instalment deposits, and stock release</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Active Lay-bys List */}
          {error && <div className="rounded border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Customer Reservations ({activeOrders.length})</span>
            
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              {activeOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic">
                  No active customer reservations found.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900 font-mono text-[10px] uppercase text-slate-500">
                    <tr>
                      <th className="p-3">Reservation #</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3 text-right">Total ($)</th>
                      <th className="p-3 text-right">Paid ($)</th>
                      <th className="p-3 text-right">Balance ($)</th>
                      <th className="p-3 text-center">Expiry</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-sans">
                    {activeOrders.map(layby => (
                      <tr key={layby.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{layby.laybyNumber}</td>
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{layby.customerName}</td>
                        <td className="p-3 text-right font-mono">${layby.totalAmount.toFixed(2)}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600">${layby.depositPaid.toFixed(2)}</td>
                        <td className="p-3 text-right font-mono font-bold text-rose-600">${layby.remainingBalance.toFixed(2)}</td>
                        <td className="p-3 text-center font-mono text-[10px] text-slate-500">{layby.expiryDate}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedLayby(layby)}
                            className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                          >
                            + Pay Deposit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Pay Installment Modal Box */}
          {selectedLayby && (
            <form onSubmit={handleProcessInstallment} className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Record Instalment for Reservation #{selectedLayby.laybyNumber}
                </span>
                <button type="button" onClick={() => setSelectedLayby(null)} className="text-slate-400 hover:text-slate-600 text-xs">
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">Payment Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder={`Max $${selectedLayby.remainingBalance.toFixed(2)}`}
                    value={installmentAmount}
                    onChange={e => setInstallmentAmount(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">Payment Option</label>
                  <select
                    value={installmentMethod}
                    onChange={e => setInstallmentMethod(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="EFTPOS Card">EFTPOS Card</option>
                    <option value="EFT Bank Deposit">EFT Bank Deposit</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
                  >
                    Submit Payment
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
