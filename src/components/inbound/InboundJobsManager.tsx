import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Loader2, PackageCheck, Plus, RefreshCw, ShieldCheck, Warehouse, X } from 'lucide-react';
import { PurchaseOrder, WarehouseLocation } from '../../types';
import { useAdminInteractions } from '../../context/AdminInteractionContext';

type Step = { id: string; stepKey: string; sequence: number; status: string; result?: string; notes: string; required: boolean };
type JobItem = { id: string; productName: string; itemType: string; manufacturerSerial?: string; internalAssetNumber?: string; acceptedQuantity: number; rejectedQuantity: number; status: string; currentStep: string; sellable: boolean; currentLocation: string; steps: Step[] };
type InboundJob = { id: string; jobNumber: string; status: string; priority: string; supplierName: string; purchaseOrderRef?: string; receivedAt: string; receivingLocation: string; items: JobItem[]; receipts: Array<{ grnNumber: string }> };

const STEP_NAMES: Record<string, string> = {
  IDENTIFICATION: 'Identification', PHYSICAL_INSPECTION: 'Physical Inspection', DATA_SANITIZATION: 'Data Sanitization',
  DIAGNOSTICS: 'Diagnostics', REPAIR: 'Repair', RETEST: 'Retest', GRADING: 'Grading', COSTING: 'Costing',
  QC_APPROVAL: 'QC Approval', PUT_AWAY: 'Put-Away', INVENTORY_RELEASE: 'Inventory Release',
};

const authHeaders = (json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
});

export default function InboundJobsManager({ purchaseOrders, warehouses, onUpdatePurchaseOrder, onShowAlert }: {
  purchaseOrders: PurchaseOrder[]; warehouses: WarehouseLocation[];
  onUpdatePurchaseOrder?: (purchaseOrder: PurchaseOrder) => void;
  onShowAlert?: (message: string, type: 'success' | 'error' | 'info') => void;
}) {
  const interactions = useAdminInteractions();
  const [jobs, setJobs] = useState<InboundJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [docket, setDocket] = useState('');
  const [invoice, setInvoice] = useState('');
  const [itemType, setItemType] = useState('NEW_STOCK');
  const [submitting, setSubmitting] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const selectedPo = purchaseOrders.find((po) => po.id === selectedPoId);
  const openPurchaseOrders = purchaseOrders.filter((po) => !['Cancelled', 'Received'].includes(po.status));

  const fetchJobs = async () => {
    try {
      setLoading(true); setError('');
      const res = await fetch('/api/inbound-jobs', { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load inbound jobs.');
      setJobs(data.jobs || []);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { void fetchJobs(); }, []);
  useEffect(() => {
    if (selectedPo) setSupplierName(selectedPo.supplierName);
  }, [selectedPoId]);

  const metrics = useMemo(() => ({
    open: jobs.filter((job) => job.status !== 'COMPLETED').length,
    quarantine: jobs.flatMap((job) => job.items).filter((item) => !item.sellable).length,
    qc: jobs.flatMap((job) => job.items).filter((item) => item.currentStep === 'QC_APPROVAL').length,
    released: jobs.flatMap((job) => job.items).filter((item) => item.sellable).length,
  }), [jobs]);

  const createJob = async () => {
    if (!supplierName.trim() || !selectedPo) return setError('Select a purchase order and supplier.');
    try {
      setSubmitting(true); setError('');
      const items = selectedPo.items
        .filter((line) => line.orderedQty > line.receivedQty)
        .map((line) => {
          const remaining = line.orderedQty - line.receivedQty;
          return {
          purchaseOrderLineRef: line.id, productId: line.productId, productName: line.productName,
          itemType, expectedQuantity: remaining, deliveredQuantity: remaining,
          acceptedQuantity: remaining, rejectedQuantity: 0, purchaseCost: line.unitCost,
          };
        });
      const res = await fetch('/api/inbound-jobs', {
        method: 'POST', headers: authHeaders(true),
        body: JSON.stringify({ purchaseOrderRef: selectedPo.id, supplierName, warehouseId: warehouseId || undefined, supplierInvoiceNumber: invoice, deliveryDocketNumber: docket, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create inbound job.');
      onUpdatePurchaseOrder?.({
        ...selectedPo,
        status: 'Received',
        receivedDate: new Date().toISOString().slice(0, 10),
        items: selectedPo.items.map((line) => ({ ...line, receivedQty: line.orderedQty })),
      });
      setShowCreate(false); setSelectedPoId(''); setSupplierName(''); setDocket(''); setInvoice('');
      onShowAlert?.(`${data.job.jobNumber} created and stock placed in quarantine.`, 'success');
      await fetchJobs();
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  };

  const completeStep = async (job: InboundJob, item: JobItem, step: Step, result: 'PASSED' | 'FAILED') => {
    const notes = await interactions.prompt({ title: `${STEP_NAMES[step.stepKey] || step.stepKey} Result`, help: `Record notes for the ${result.toLowerCase()} result.`, label: 'Processing notes', required: false, confirmLabel: 'Save Result' });
    if (notes === null) return;
    try {
      const res = await fetch(`/api/inbound-jobs/${job.id}/items/${item.id}/steps/${step.id}`, {
        method: 'PATCH', headers: authHeaders(true), body: JSON.stringify({ result, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to complete step.');
      onShowAlert?.(`${STEP_NAMES[step.stepKey]} ${result.toLowerCase()}.`, result === 'FAILED' ? 'error' : 'success');
      await fetchJobs();
    } catch (err: any) { setError(err.message); }
  };

  const putAway = async (job: InboundJob, item: JobItem) => {
    const destinationWarehouse = await interactions.prompt({ title: 'Put Away Inventory', help: 'Select the warehouse that will hold this sellable stock.', label: 'Destination warehouse code or ID', initialValue: warehouseId || warehouses[0]?.id || 'WH-MAIN', confirmLabel: 'Continue' });
    if (!destinationWarehouse) return;
    const bin = await interactions.prompt({ title: 'Choose Storage Bin', help: `Enter the bin location inside ${destinationWarehouse}.`, label: 'Destination bin', initialValue: 'A-01-01', confirmLabel: 'Release Inventory' });
    if (!bin) return;
    try {
      const res = await fetch(`/api/inbound-jobs/${job.id}/items/${item.id}/put-away`, {
        method: 'POST', headers: authHeaders(true), body: JSON.stringify({ warehouseId: destinationWarehouse, bin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Put-away failed.');
      onShowAlert?.(`${item.productName} released to sellable inventory at ${destinationWarehouse}/${bin}.`, 'success');
      await fetchJobs();
    } catch (err: any) { setError(err.message); }
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-black uppercase text-slate-900">Receive Goods</h2><p className="text-xs text-slate-500">Receive into quarantine, process every required step, approve QC, then release through put-away.</p></div>
      <div className="flex gap-2"><button onClick={() => void fetchJobs()} className="p-2 border rounded-lg"><RefreshCw className="h-4 w-4" /></button><button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold"><Plus className="h-4 w-4" /> Receive Delivery</button></div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[['Open Jobs', metrics.open], ['In Quarantine', metrics.quarantine], ['Awaiting QC', metrics.qc], ['Released', metrics.released]].map(([label, value]) => <div key={label} className="rounded-xl border bg-white p-4"><div className="text-2xl font-black text-slate-900">{value}</div><div className="text-[10px] uppercase font-bold text-slate-500">{label}</div></div>)}
    </div>
    {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs"><AlertTriangle className="h-4 w-4" />{error}</div>}
    {loading ? <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div> : jobs.length === 0 ? <div className="p-12 text-center border-2 border-dashed rounded-xl text-slate-400"><PackageCheck className="h-10 w-10 mx-auto mb-2" /><p className="font-bold">No inbound jobs yet</p></div> : <div className="space-y-3">{jobs.map((job) => {
      const done = job.items.filter((item) => item.sellable).length;
      return <div key={job.id} className="border rounded-xl bg-white overflow-hidden">
        <button onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)} className="w-full p-4 flex items-center justify-between text-left">
          <div><div className="flex items-center gap-2"><span className="font-mono font-black text-blue-700">{job.jobNumber}</span><span className={`text-[9px] px-2 py-1 rounded-full font-bold ${job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{job.status}</span></div><div className="font-bold text-sm mt-1">{job.supplierName} · {job.purchaseOrderRef || 'No PO'}</div><div className="text-xs text-slate-400">GRN {job.receipts[0]?.grnNumber} · Quarantine: {job.receivingLocation}</div></div>
          <div className="text-right"><div className="font-black">{done}/{job.items.length}</div><div className="text-[9px] uppercase text-slate-400">Released</div></div>
        </button>
        {expandedJob === job.id && <div className="border-t bg-slate-50 p-4 space-y-4">{job.items.map((item) => <div key={item.id} className="rounded-xl border bg-white p-4">
          <div className="flex flex-wrap justify-between gap-2 mb-3"><div><div className="font-bold text-sm">{item.productName}</div><div className="text-[10px] text-slate-500">{item.internalAssetNumber || `${item.acceptedQuantity} units`} · {item.currentLocation}</div></div><span className={`text-[9px] h-fit px-2 py-1 rounded-full font-bold ${item.sellable ? 'bg-emerald-100 text-emerald-700' : item.status === 'ON_HOLD' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{item.status}</span></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{item.steps.map((step) => {
            const available = step.status === 'READY' || item.currentStep === step.stepKey;
            const controlled = ['PUT_AWAY', 'INVENTORY_RELEASE'].includes(step.stepKey);
            return <div key={step.id} className={`p-2.5 rounded-lg border ${step.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200' : step.status === 'FAILED' ? 'bg-red-50 border-red-200' : available ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-white border flex items-center justify-center text-[9px] font-bold">{step.status === 'COMPLETED' ? '✓' : step.sequence + 1}</span><span className="text-[10px] font-bold uppercase">{STEP_NAMES[step.stepKey] || step.stepKey}</span></div>
              {available && !controlled && step.status !== 'COMPLETED' && <div className="flex gap-1 mt-2"><button onClick={() => void completeStep(job, item, step, 'PASSED')} className="px-2 py-1 bg-emerald-600 text-white rounded text-[9px] font-bold">Pass</button><button onClick={() => void completeStep(job, item, step, 'FAILED')} className="px-2 py-1 bg-red-600 text-white rounded text-[9px] font-bold">Fail</button></div>}
              {step.stepKey === 'PUT_AWAY' && available && <button onClick={() => void putAway(job, item)} className="mt-2 px-2 py-1 bg-indigo-600 text-white rounded text-[9px] font-bold">Scan & Put Away</button>}
            </div>;
          })}</div>
        </div>)}</div>}
      </div>;
    })}</div>}

    {showCreate && <div className="fixed inset-0 z-[300] bg-slate-900/60 flex items-center justify-center p-4"><div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden"><div className="p-5 border-b flex justify-between"><div><h3 className="font-black">Receive Delivery & Create Job</h3><p className="text-xs text-slate-500">A GRN and quarantine workflow will be created.</p></div><button onClick={() => setShowCreate(false)}><X className="h-5 w-5" /></button></div><div className="p-5 grid grid-cols-2 gap-3">
      <label className="col-span-2 text-xs font-bold">Purchase Order<select value={selectedPoId} onChange={(e) => setSelectedPoId(e.target.value)} className="mt-1 w-full border rounded-lg p-2"><option value="">Select PO</option>{openPurchaseOrders.map((po) => <option key={po.id} value={po.id}>{po.id} — {po.supplierName}</option>)}</select></label>
      <label className="col-span-2 text-xs font-bold">Supplier<input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="mt-1 w-full border rounded-lg p-2" /></label>
      <label className="text-xs font-bold">Warehouse<select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="mt-1 w-full border rounded-lg p-2"><option value="">Receiving quarantine</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></label>
      <label className="text-xs font-bold">Processing Route<select value={itemType} onChange={(e) => setItemType(e.target.value)} className="mt-1 w-full border rounded-lg p-2"><option value="NEW_STOCK">New stock</option><option value="USED_DEVICE">Used/refurbished device</option><option value="DATA_BEARING_DEVICE">Data-bearing equipment</option><option value="CUSTOMER_RETURN">Customer return</option></select></label>
      <label className="text-xs font-bold">Delivery Docket<input value={docket} onChange={(e) => setDocket(e.target.value)} className="mt-1 w-full border rounded-lg p-2" /></label><label className="text-xs font-bold">Supplier Invoice<input value={invoice} onChange={(e) => setInvoice(e.target.value)} className="mt-1 w-full border rounded-lg p-2" /></label>
      {selectedPo && <div className="col-span-2 p-3 bg-slate-50 border rounded-lg text-xs"><strong>{selectedPo.items.length} lines will enter quarantine:</strong>{selectedPo.items.map((line) => <div key={line.id} className="mt-1 flex justify-between"><span>{line.productName}</span><span>{Math.max(0, line.orderedQty - line.receivedQty)} units</span></div>)}</div>}
    </div><div className="p-5 border-t flex justify-end gap-2"><button onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs font-bold">Cancel</button><button disabled={submitting || !selectedPo} onClick={() => void createJob()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}Create Job & GRN</button></div></div></div>}
  </div>;
}
