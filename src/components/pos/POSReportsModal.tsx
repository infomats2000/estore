import React, { useEffect, useState } from 'react';
import { BarChart3, Printer, X } from 'lucide-react';

export default function POSReportsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [report, setReport] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [from, setFrom] = useState(new Date().toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const load = async () => {
    const response = await fetch(`/api/pos/reports/summary?from=${from}T00:00:00&to=${to}T23:59:59.999`, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` } });
    const result = await response.json();
    if (response.ok) { setReport(result); setError(''); } else setError(result.error || 'Unable to load report.');
  };
  useEffect(() => { if (isOpen) void load(); }, [isOpen]);
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[85] bg-black/60 flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-auto border shadow-2xl">
      <div className="bg-neutral-900 text-white p-4 flex justify-between"><div className="font-mono font-black uppercase flex gap-2"><BarChart3 className="h-5 w-5" /> POS Operational Report</div><button onClick={onClose}><X /></button></div>
      <div className="p-5 space-y-5" id="pos-operational-report">
        <div className="flex gap-2 items-end"><label className="text-xs">From<input type="date" value={from} onChange={e => setFrom(e.target.value)} className="block border p-2" /></label><label className="text-xs">To<input type="date" value={to} onChange={e => setTo(e.target.value)} className="block border p-2" /></label><button onClick={load} className="bg-blue-700 text-white px-4 py-2 text-xs font-bold">Refresh</button><button onClick={() => window.print()} className="ml-auto border px-4 py-2 text-xs font-bold flex gap-2"><Printer className="h-4 w-4" /> Print</button></div>
        {error && <div className="bg-rose-50 border border-rose-300 p-3 text-rose-700 text-xs font-bold">{error}</div>}
        {report && <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{[
            ['Sales', `$${report.sales.total.toFixed(2)}`], ['GST', `$${report.sales.tax.toFixed(2)}`], ['Refunds', `$${report.refunds.total.toFixed(2)}`], ['Drawer variance', `$${report.shifts.variance.toFixed(2)}`], ['Reservations outstanding', `$${report.laybys.outstanding.toFixed(2)}`],
          ].map(([label, value]) => <div key={label} className="border bg-neutral-50 p-3"><div className="text-[10px] uppercase text-neutral-500">{label}</div><div className="font-mono text-lg font-black">{value}</div></div>)}</div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border"><h4 className="bg-neutral-100 p-2 text-xs font-bold uppercase">Tender reconciliation</h4>{report.tenders.map((row: any) => <div key={row.method} className="flex justify-between p-2 border-t text-xs"><span>{row.method}</span><strong>${row.amount.toFixed(2)}</strong></div>)}</div>
            <div className="border"><h4 className="bg-neutral-100 p-2 text-xs font-bold uppercase">Top products</h4>{report.topProducts.map((row: any) => <div key={row.productId} className="grid grid-cols-12 p-2 border-t text-xs"><span className="col-span-7">{row.name}</span><span className="col-span-2 text-right">{row.quantity}</span><strong className="col-span-3 text-right">${row.revenue.toFixed(2)}</strong></div>)}</div>
          </div>
          <div className="text-[10px] text-neutral-500">{report.sales.count} paid sales · {report.refunds.count} returns · {report.shifts.count} shifts · {report.laybys.created} reservations created</div>
        </>}
      </div>
    </div>
  </div>;
}
