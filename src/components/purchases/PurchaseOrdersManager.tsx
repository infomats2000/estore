import React, { useState, useMemo } from 'react';
import {
  ClipboardList, Plus, ChevronDown, ChevronUp, X, Search,
  Edit3, Truck, CheckCircle2, DollarSign, Package, AlertTriangle,
  ArrowRight, Receipt
} from 'lucide-react';
import { PurchaseOrder, POLineItem, Product, Supplier, StoreSettings } from '../../types';

interface PurchaseOrdersManagerProps {
  purchaseOrders: PurchaseOrder[];
  onAddPurchaseOrder: (po: PurchaseOrder) => void;
  onUpdatePurchaseOrder: (po: PurchaseOrder) => void;
  onDeletePurchaseOrder: (id: string) => void;
  onReceiveGRN: (poId: string, receivedItems: { lineItemId: string; receivedQty: number }[]) => void;
  products: Product[];
  suppliers: Supplier[];
  storeSettings?: StoreSettings;
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const STATUS_COLORS: Record<string, string> = {
  'Draft': 'bg-neutral-100 text-neutral-600 border-neutral-200',
  'Sent': 'bg-blue-100 text-blue-700 border-blue-200',
  'Partially Received': 'bg-amber-100 text-amber-700 border-amber-200',
  'Received': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Cancelled': 'bg-red-100 text-red-600 border-red-200',
};

const PAY_COLORS: Record<string, string> = {
  'Unpaid': 'text-red-600',
  'Partial': 'text-amber-600',
  'Paid': 'text-emerald-600',
};

const emptyLineItem = (): POLineItem => ({
  id: 'LI-' + Date.now(),
  productName: '',
  orderedQty: 1,
  receivedQty: 0,
  unitCost: 0,
  totalCost: 0,
});

export default function PurchaseOrdersManager({
  purchaseOrders,
  onAddPurchaseOrder,
  onUpdatePurchaseOrder,
  onDeletePurchaseOrder,
  onReceiveGRN,
  products,
  suppliers,
  storeSettings,
  onShowAlert,
}: PurchaseOrdersManagerProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);

  // Form state
  const [formSupplier, setFormSupplier] = useState('');
  const [formExpectedDelivery, setFormExpectedDelivery] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formFreight, setFormFreight] = useState('0');
  const [formDuties, setFormDuties] = useState('0');
  const [formItems, setFormItems] = useState<POLineItem[]>([emptyLineItem()]);
  const [formProductSearch, setFormProductSearch] = useState('');
  const [formInvNumber, setFormInvNumber] = useState('');
  const [formPayDue, setFormPayDue] = useState('');

  // GRN state
  const [grnPoId, setGrnPoId] = useState<string | null>(null);
  const [grnReceived, setGrnReceived] = useState<Record<string, number>>({});

  const filtered = useMemo(() => purchaseOrders.filter(po => {
    const matchStatus = statusFilter === 'All' || po.status === statusFilter;
    const matchSearch = !search ||
      po.id.toLowerCase().includes(search.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }), [purchaseOrders, search, statusFilter]);

  const stats = useMemo(() => ({
    open: purchaseOrders.filter(po => !['Received', 'Cancelled'].includes(po.status)).length,
    openValue: purchaseOrders.filter(po => !['Received', 'Cancelled'].includes(po.status))
      .reduce((s, po) => s + po.total, 0),
    unpaidValue: purchaseOrders.filter(po => po.paymentStatus === 'Unpaid' && po.status === 'Received')
      .reduce((s, po) => s + po.total, 0),
    thisMonth: purchaseOrders.filter(po => po.createdDate.startsWith(new Date().toISOString().slice(0, 7))).length,
  }), [purchaseOrders]);

  const openForm = (po?: PurchaseOrder) => {
    if (po) {
      setEditingPO(po);
      setFormSupplier(po.supplierName);
      setFormExpectedDelivery(po.expectedDelivery);
      setFormNotes(po.notes || '');
      setFormFreight(String(po.freight));
      setFormDuties(String(po.duties));
      setFormItems([...po.items]);
      setFormInvNumber(po.supplierInvoiceNumber || '');
      setFormPayDue(po.paymentDueDate || '');
    } else {
      setEditingPO(null);
      setFormSupplier('');
      setFormExpectedDelivery('');
      setFormNotes('');
      setFormFreight('0');
      setFormDuties('0');
      setFormItems([emptyLineItem()]);
      setFormInvNumber('');
      setFormPayDue('');
    }
    setShowForm(true);
  };

  const calcSubtotal = (items: POLineItem[]) =>
    items.reduce((s, item) => s + item.orderedQty * item.unitCost, 0);

  const handleSavePO = (asDraft = false) => {
    if (!formSupplier.trim()) { onShowAlert?.('Supplier name is required.', 'error'); return; }
    if (formItems.some(i => !i.productName.trim())) { onShowAlert?.('All line items need a product name.', 'error'); return; }

    const items = formItems.map(i => ({ ...i, totalCost: i.orderedQty * i.unitCost }));
    const subtotal = calcSubtotal(items);
    const freight = parseFloat(formFreight) || 0;
    const duties = parseFloat(formDuties) || 0;

    const po: PurchaseOrder = {
      id: editingPO?.id || 'PO-' + String(Date.now()).slice(-6),
      supplierName: formSupplier,
      status: asDraft ? 'Draft' : (editingPO?.status || 'Sent'),
      items,
      subtotal,
      freight,
      duties,
      total: subtotal + freight + duties,
      expectedDelivery: formExpectedDelivery,
      notes: formNotes,
      createdDate: editingPO?.createdDate || new Date().toISOString().split('T')[0],
      supplierInvoiceNumber: formInvNumber,
      paymentStatus: editingPO?.paymentStatus || 'Unpaid',
      paymentDueDate: formPayDue,
    };

    if (editingPO) {
      onUpdatePurchaseOrder(po);
      onShowAlert?.(`${po.id} updated.`, 'success');
    } else {
      onAddPurchaseOrder(po);
      onShowAlert?.(`${po.id} created.`, 'success');
    }
    setShowForm(false);
  };

  const handleOpenGRN = (po: PurchaseOrder) => {
    setGrnPoId(po.id);
    const initial: Record<string, number> = {};
    po.items.forEach(item => {
      initial[item.id] = item.orderedQty - item.receivedQty;
    });
    setGrnReceived(initial);
  };

  const handleSubmitGRN = () => {
    if (!grnPoId) return;
    const po = purchaseOrders.find(p => p.id === grnPoId);
    if (!po) return;

    const receivedItems = po.items.map(item => ({
      lineItemId: item.id,
      receivedQty: grnReceived[item.id] || 0,
    }));

    onReceiveGRN(grnPoId, receivedItems);
    setGrnPoId(null);
    onShowAlert?.('GRN confirmed. Stock updated.', 'success');
  };

  const productResults = formProductSearch.length > 1
    ? products.filter(p => p.name.toLowerCase().includes(formProductSearch.toLowerCase())).slice(0, 5)
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open POs', value: stats.open, color: 'border-blue-400 bg-blue-50', textColor: 'text-blue-700' },
          { label: 'Open Value', value: `$${stats.openValue.toFixed(0)}`, color: 'border-indigo-400 bg-indigo-50', textColor: 'text-indigo-700' },
          { label: 'Unpaid Supplier Inv.', value: `$${stats.unpaidValue.toFixed(0)}`, color: 'border-red-400 bg-red-50', textColor: 'text-red-700' },
          { label: 'This Month', value: stats.thisMonth, color: 'border-emerald-400 bg-emerald-50', textColor: 'text-emerald-700' },
        ].map(s => (
          <div key={s.label} className={`border-l-4 ${s.color} rounded-xl p-4`}>
            <div className={`text-2xl font-black ${s.textColor}`}>{s.value}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by PO number or supplier…"
            className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          {['All', 'Draft', 'Sent', 'Partially Received', 'Received', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => openForm()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          id="po-new-btn">
          <Plus className="h-4 w-4" /> New PO
        </button>
      </div>

      {/* PO List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-neutral-400 border border-dashed border-neutral-300 rounded-xl">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm uppercase tracking-wider">No purchase orders found</p>
          </div>
        )}

        {filtered.map(po => {
          const isExpanded = expandedId === po.id;
          return (
            <div key={po.id} className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : po.id)}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black text-neutral-400">{po.id}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[po.status]}`}>{po.status}</span>
                    <span className={`text-[10px] font-bold ${PAY_COLORS[po.paymentStatus]}`}>{po.paymentStatus}</span>
                  </div>
                  <div className="mt-1 font-bold text-sm text-neutral-900">{po.supplierName}</div>
                  <div className="text-xs text-neutral-500">{po.items.length} line items · Expected: {po.expectedDelivery || '—'}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-neutral-900">${po.total.toFixed(2)}</div>
                  <div className="text-xs text-neutral-400">{po.createdDate}</div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
              </div>

              {isExpanded && (
                <div className="border-t border-neutral-100 bg-neutral-50 p-4 space-y-4">
                  {/* Line items table */}
                  <table className="w-full text-xs border border-neutral-200 rounded-lg overflow-hidden">
                    <thead className="bg-neutral-800 text-white">
                      <tr>
                        <th className="text-left p-2">Product</th>
                        <th className="text-center p-2 w-20">Ordered</th>
                        <th className="text-center p-2 w-20">Received</th>
                        <th className="text-right p-2 w-24">Unit Cost</th>
                        <th className="text-right p-2 w-24">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {po.items.map(item => (
                        <tr key={item.id} className="border-t border-neutral-100">
                          <td className="p-2 font-medium">{item.productName}</td>
                          <td className="p-2 text-center">{item.orderedQty}</td>
                          <td className={`p-2 text-center font-bold ${item.receivedQty >= item.orderedQty ? 'text-emerald-600' : item.receivedQty > 0 ? 'text-amber-600' : 'text-neutral-400'}`}>
                            {item.receivedQty}
                          </td>
                          <td className="p-2 text-right">${item.unitCost.toFixed(2)}</td>
                          <td className="p-2 text-right">${(item.orderedQty * item.unitCost).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-neutral-50">
                      <tr className="border-t border-neutral-200 font-bold">
                        <td colSpan={4} className="p-2 text-right">Subtotal</td>
                        <td className="p-2 text-right">${po.subtotal.toFixed(2)}</td>
                      </tr>
                      {po.freight > 0 && <tr className="border-t border-neutral-100">
                        <td colSpan={4} className="p-2 text-right text-neutral-500">Freight</td>
                        <td className="p-2 text-right">${po.freight.toFixed(2)}</td>
                      </tr>}
                      {po.duties > 0 && <tr className="border-t border-neutral-100">
                        <td colSpan={4} className="p-2 text-right text-neutral-500">Import Duties</td>
                        <td className="p-2 text-right">${po.duties.toFixed(2)}</td>
                      </tr>}
                      <tr className="border-t-2 border-neutral-300 bg-neutral-800 text-white">
                        <td colSpan={4} className="p-2 text-right font-black">TOTAL (Landed Cost)</td>
                        <td className="p-2 text-right font-black">${po.total.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* PO meta */}
                  {(po.supplierInvoiceNumber || po.paymentDueDate || po.notes) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      {po.supplierInvoiceNumber && <div><span className="font-black text-neutral-400 uppercase block">Supplier Inv #</span>{po.supplierInvoiceNumber}</div>}
                      {po.paymentDueDate && <div><span className="font-black text-neutral-400 uppercase block">Payment Due</span>{po.paymentDueDate}</div>}
                      {po.notes && <div className="col-span-full"><span className="font-black text-neutral-400 uppercase block">Notes</span>{po.notes}</div>}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-200">
                    {!['Received', 'Cancelled'].includes(po.status) && (
                      <button onClick={() => handleOpenGRN(po)}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                        <Truck className="h-3 w-3" /> Receive GRN
                      </button>
                    )}
                    {po.paymentStatus !== 'Paid' && po.status === 'Received' && (
                      <button onClick={() => { onUpdatePurchaseOrder({ ...po, paymentStatus: 'Paid' }); onShowAlert?.('Marked as paid.', 'success'); }}
                        className="flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                        <DollarSign className="h-3 w-3" /> Mark Paid
                      </button>
                    )}
                    {po.status === 'Draft' && (
                      <button onClick={() => { onUpdatePurchaseOrder({ ...po, status: 'Sent' }); onShowAlert?.(`${po.id} marked as Sent.`, 'info'); }}
                        className="flex items-center gap-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                        <ArrowRight className="h-3 w-3" /> Mark as Sent
                      </button>
                    )}
                    <button onClick={() => openForm(po)}
                      className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                      <Edit3 className="h-3 w-3" /> Edit
                    </button>
                    <button onClick={() => { if (confirm(`Delete ${po.id}?`)) { onDeletePurchaseOrder(po.id); onShowAlert?.('PO deleted.', 'info'); } }}
                      className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ml-auto">
                      <X className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* NEW/EDIT PO FORM */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h2 className="font-black text-lg uppercase tracking-wider">{editingPO ? `Edit ${editingPO.id}` : 'New Purchase Order'}</h2>
              <button onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-neutral-900"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Supplier *</label>
                  <input list="supplier-list" value={formSupplier} onChange={e => setFormSupplier(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Supplier name" />
                  <datalist id="supplier-list">{suppliers.map(s => <option key={s.id} value={s.name} />)}</datalist>
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Expected Delivery</label>
                  <input type="date" value={formExpectedDelivery} onChange={e => setFormExpectedDelivery(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Supplier Invoice #</label>
                  <input value={formInvNumber} onChange={e => setFormInvNumber(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Payment Due Date</label>
                  <input type="date" value={formPayDue} onChange={e => setFormPayDue(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Line Items</div>
                  <div className="relative">
                    <input value={formProductSearch} onChange={e => setFormProductSearch(e.target.value)}
                      placeholder="Add from inventory…"
                      className="border border-neutral-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 w-52"
                    />
                    {productResults.length > 0 && (
                      <div className="absolute z-10 top-full right-0 bg-white border border-neutral-200 rounded-lg shadow-xl mt-1 w-64">
                        {productResults.map(p => (
                          <button key={p.id} onClick={() => {
                            setFormItems(prev => [...prev, {
                              id: 'LI-' + Date.now(),
                              productId: p.id,
                              productName: p.name,
                              orderedQty: 1,
                              receivedQty: 0,
                              unitCost: p.costPrice || p.price * 0.6,
                              totalCost: p.costPrice || p.price * 0.6,
                            }]);
                            setFormProductSearch('');
                          }} className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-neutral-100 flex items-center justify-between">
                            <span>{p.name}</span>
                            <span className="text-neutral-400">${(p.costPrice || p.price * 0.6).toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {formItems.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg p-2">
                      <input value={item.productName}
                        onChange={e => setFormItems(prev => prev.map((it, ii) => ii === i ? { ...it, productName: e.target.value } : it))}
                        placeholder="Product/description *"
                        className="flex-1 min-w-0 border border-neutral-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                      />
                      <input type="number" min="1" value={item.orderedQty}
                        onChange={e => setFormItems(prev => prev.map((it, ii) => ii === i ? { ...it, orderedQty: parseInt(e.target.value) || 1 } : it))}
                        className="w-16 border border-neutral-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-blue-400"
                        placeholder="Qty"
                      />
                      <span className="text-neutral-400 text-xs">@</span>
                      <input type="number" min="0" step="0.01" value={item.unitCost}
                        onChange={e => setFormItems(prev => prev.map((it, ii) => ii === i ? { ...it, unitCost: parseFloat(e.target.value) || 0 } : it))}
                        className="w-24 border border-neutral-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:border-blue-400"
                        placeholder="Unit cost"
                      />
                      <span className="text-xs font-bold text-neutral-600 w-20 text-right shrink-0">
                        ${(item.orderedQty * item.unitCost).toFixed(2)}
                      </span>
                      <button onClick={() => setFormItems(prev => prev.filter((_, ii) => ii !== i))}>
                        <X className="h-3.5 w-3.5 text-red-400 hover:text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setFormItems(prev => [...prev, emptyLineItem()])}
                  className="mt-2 flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
                  <Plus className="h-3.5 w-3.5" /> Add Line Item
                </button>
              </div>

              {/* Landed costs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Freight Cost</label>
                  <input type="number" min="0" step="0.01" value={formFreight} onChange={e => setFormFreight(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Import Duties</label>
                  <input type="number" min="0" step="0.01" value={formDuties} onChange={e => setFormDuties(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              {/* Total preview */}
              <div className="bg-neutral-800 text-white rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-bold">Landed Cost Total</span>
                <span className="text-xl font-black">${(calcSubtotal(formItems) + (parseFloat(formFreight) || 0) + (parseFloat(formDuties) || 0)).toFixed(2)}</span>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-neutral-600 block mb-1">Notes</label>
                <textarea rows={2} value={formNotes} onChange={e => setFormNotes(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-neutral-200">
              <button onClick={() => setShowForm(false)} className="px-5 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
              {!editingPO && (
                <button onClick={() => handleSavePO(true)} className="px-5 py-2 text-sm font-bold bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg">
                  Save as Draft
                </button>
              )}
              <button onClick={() => handleSavePO(false)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg">
                {editingPO ? 'Save Changes' : 'Create & Send PO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRN MODAL */}
      {grnPoId && (() => {
        const po = purchaseOrders.find(p => p.id === grnPoId);
        if (!po) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="flex items-center justify-between p-5 border-b border-neutral-200">
                <div>
                  <h2 className="font-black text-lg uppercase tracking-wider">Receive GRN</h2>
                  <div className="text-xs text-neutral-400 mt-0.5">{po.id} — {po.supplierName}</div>
                </div>
                <button onClick={() => setGrnPoId(null)} className="text-neutral-400 hover:text-neutral-900"><X className="h-5 w-5" /></button>
              </div>

              <div className="p-5 space-y-3">
                <p className="text-xs text-neutral-500">Enter the quantity actually received for each line item. Partial receives are allowed.</p>
                {po.items.map(item => {
                  const remaining = item.orderedQty - item.receivedQty;
                  return (
                    <div key={item.id} className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm">{item.productName}</div>
                        <div className="text-xs text-neutral-400">Ordered: {item.orderedQty} · Previously received: {item.receivedQty} · Remaining: {remaining}</div>
                      </div>
                      <div className="shrink-0">
                        <label className="text-[9px] font-black uppercase text-neutral-400 block mb-1">Receiving Now</label>
                        <input type="number" min="0" max={remaining}
                          value={grnReceived[item.id] ?? remaining}
                          onChange={e => setGrnReceived(prev => ({ ...prev, [item.id]: parseInt(e.target.value) || 0 }))}
                          className="w-20 border border-neutral-300 rounded-lg px-2 py-1.5 text-sm text-center font-bold focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-3 p-5 border-t border-neutral-200">
                <button onClick={() => setGrnPoId(null)} className="px-5 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
                <button onClick={handleSubmitGRN} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg">
                  <CheckCircle2 className="h-4 w-4" /> Confirm Receipt & Update Stock
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
