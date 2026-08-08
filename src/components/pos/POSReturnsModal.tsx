import React, { useState } from 'react';
import { RotateCcw, Search, X } from 'lucide-react';
import { useAdminInteractions } from '../../context/AdminInteractionContext';

interface Props {
  isOpen: boolean;
  shiftId?: string;
  onClose: () => void;
  onCompleted: (message: string) => void;
}

const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` });

export default function POSReturnsModal({ isOpen, shiftId, onClose, onCompleted }: Props) {
  const interactions = useAdminInteractions();
  const [receipt, setReceipt] = useState('');
  const [order, setOrder] = useState<any | null>(null);
  const [returned, setReturned] = useState<Record<string, number>>({});
  const [lines, setLines] = useState<Record<string, { quantity: number; disposition: string }>>({});
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('EFTPOS');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!isOpen) return null;

  const lookup = async () => {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/pos/receipts/${encodeURIComponent(receipt.trim())}`, { headers: authHeaders() });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setOrder(result.order); setReturned(result.returnedQuantities || {}); setLines({});
    } catch (err: any) { setError(err.message || 'Receipt not found.'); }
    finally { setBusy(false); }
  };

  const submit = async (approvalId?: string) => {
    const selected = Object.entries(lines).filter(([, line]) => line.quantity > 0).map(([orderItemId, line]) => ({ orderItemId, ...line }));
    if (!selected.length) return setError('Select at least one item quantity to return.');
    if (reason.trim().length < 3) return setError('Enter a return reason.');
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/pos/returns', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ orderNumber: order.orderNumber, shiftId, refundMethod, reason, items: selected, approvalId }) });
      const result = await response.json();
      if (!response.ok && /Manager approval is required/.test(result.error || '') && !approvalId) {
        const amount = Number(String(result.error).match(/\$([0-9.]+)/)?.[1] || 0);
        const managerEmail = await interactions.prompt({ title: 'Manager Refund Approval', help: `Approval is required for this $${amount.toFixed(2)} refund.`, label: 'Manager email', confirmLabel: 'Continue' });
        const managerPassword = managerEmail && await interactions.prompt({ title: 'Verify Manager', label: 'Manager password', type: 'password', confirmLabel: 'Approve Refund' });
        if (!managerEmail || !managerPassword) throw new Error('Manager approval cancelled.');
        const approvalResponse = await fetch('/api/pos/approvals', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ managerEmail, managerPassword, action: 'REFUND', amount, reason }) });
        const approval = await approvalResponse.json();
        if (!approvalResponse.ok) throw new Error(approval.error);
        setBusy(false);
        return void submit(approval.approval.id);
      }
      if (!response.ok) throw new Error(result.error);
      onCompleted(`${result.return.returnNumber} completed. Refund $${result.return.refundAmount.toFixed(2)}.`);
      setOrder(null); setReceipt(''); setReason(''); setLines({}); onClose();
    } catch (err: any) { setError(err.message || 'Return could not be completed.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-auto border border-neutral-300 shadow-2xl">
        <div className="bg-neutral-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 font-mono font-black uppercase"><RotateCcw className="h-4 w-4" /> Receipt Return / Refund</div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <input value={receipt} onChange={event => setReceipt(event.target.value)} onKeyDown={event => event.key === 'Enter' && void lookup()} placeholder="Scan or enter POS receipt number" className="flex-1 border border-neutral-400 p-2 font-mono text-sm" />
            <button onClick={lookup} disabled={busy || !receipt.trim()} className="bg-blue-700 text-white px-4 font-mono text-xs font-bold flex items-center gap-2"><Search className="h-4 w-4" /> Find</button>
          </div>
          {order && <>
            <div className="bg-neutral-100 border p-3 text-xs"><strong>{order.orderNumber}</strong> · {new Date(order.createdAt).toLocaleString()} · Paid ${order.total.toFixed(2)}</div>
            <div className="divide-y border">
              {order.items.map((item: any) => {
                const remaining = item.quantity - (returned[item.id] || 0);
                const line = lines[item.id] || { quantity: 0, disposition: 'RESTOCK' };
                return <div key={item.id} className="p-3 grid grid-cols-12 gap-2 items-center text-xs">
                  <div className="col-span-5"><strong>{item.name}</strong><div className="font-mono text-[10px] text-neutral-500">{item.serialNumber || item.productId} · {remaining} returnable</div></div>
                  <input type="number" min="0" max={remaining} value={line.quantity} onChange={event => setLines(prev => ({ ...prev, [item.id]: { ...line, quantity: Math.min(remaining, Math.max(0, Number(event.target.value) || 0)) } }))} className="col-span-2 border p-2" />
                  <select value={line.disposition} onChange={event => setLines(prev => ({ ...prev, [item.id]: { ...line, disposition: event.target.value } }))} className="col-span-5 border p-2">
                    <option value="RESTOCK">Return to sellable stock</option><option value="QUARANTINE">Quarantine / inspect</option><option value="RETURN_TO_SUPPLIER">Return to supplier</option><option value="WRITE_OFF">Write off</option>
                  </select>
                </div>;
              })}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={refundMethod} onChange={event => setRefundMethod(event.target.value)} className="border p-2 text-sm"><option value="EFTPOS">EFTPOS reversal</option><option value="CARD">Card refund</option><option value="CASH">Cash refund</option><option value="STORE_CREDIT">Store credit</option></select>
              <input value={reason} onChange={event => setReason(event.target.value)} placeholder="Return reason" className="border p-2 text-sm" />
            </div>
            <button onClick={() => void submit()} disabled={busy} className="w-full bg-rose-700 text-white p-3 font-mono text-xs font-black uppercase">Complete Return and Refund</button>
          </>}
          {error && <div role="alert" className="bg-rose-50 border border-rose-300 text-rose-700 p-3 text-xs font-bold">{error}</div>}
        </div>
      </div>
    </div>
  );
}
