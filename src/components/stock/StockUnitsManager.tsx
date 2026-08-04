import React, { useState, useMemo } from 'react';
import {
  Barcode, Search, Plus, ChevronDown, ChevronUp, X, Upload,
  Clock, CheckCircle2, Edit3, AlertTriangle, ArrowRight, FileDown
} from 'lucide-react';
import { StockUnit, StockUnitAuditEntry, Product } from '../../types';

interface StockUnitsManagerProps {
  stockUnits: StockUnit[];
  onAddStockUnit: (unit: StockUnit) => void;
  onUpdateStockUnit: (unit: StockUnit) => void;
  products: Product[];
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const STATUS_COLORS: Record<string, string> = {
  'In Stock': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Reserved': 'bg-blue-100 text-blue-700 border-blue-200',
  'Sold': 'bg-neutral-100 text-neutral-600 border-neutral-200',
  'In Repair': 'bg-amber-100 text-amber-700 border-amber-200',
  'Returned': 'bg-purple-100 text-purple-700 border-purple-200',
  'Scrapped': 'bg-red-100 text-red-600 border-red-200',
  'Write-Off': 'bg-red-200 text-red-700 border-red-300',
};

const GRADE_COLORS: Record<string, string> = {
  'A+': 'bg-emerald-500 text-white',
  'A': 'bg-emerald-400 text-white',
  'B': 'bg-amber-400 text-white',
  'C': 'bg-orange-400 text-white',
  'D': 'bg-red-400 text-white',
};

const ALL_STATUSES: StockUnit['status'][] = ['In Stock', 'Reserved', 'Sold', 'In Repair', 'Returned', 'Scrapped', 'Write-Off'];
const ALL_GRADES: (StockUnit['grade'])[] = ['A+', 'A', 'B', 'C', 'D'];

export default function StockUnitsManager({
  stockUnits,
  onAddStockUnit,
  onUpdateStockUnit,
  products,
  onShowAlert,
}: StockUnitsManagerProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState<StockUnit | null>(null);

  // Add form
  const [addProductId, setAddProductId] = useState('');
  const [addSerial, setAddSerial] = useState('');
  const [addCost, setAddCost] = useState('');
  const [addGrade, setAddGrade] = useState<StockUnit['grade']>('A');
  const [addNotes, setAddNotes] = useState('');
  const [addProductSearch, setAddProductSearch] = useState('');

  // Update modal
  const [updateStatus, setUpdateStatus] = useState<StockUnit['status']>('In Stock');
  const [updateGrade, setUpdateGrade] = useState<StockUnit['grade']>('A');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updateAction, setUpdateAction] = useState('');

  // Bulk import
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkProductId, setBulkProductId] = useState('');
  const [bulkCost, setBulkCost] = useState('');
  const [bulkSerials, setBulkSerials] = useState('');

  const filtered = useMemo(() => stockUnits.filter(u => {
    const matchStatus = statusFilter === 'All' || u.status === statusFilter;
    const matchSearch = !search ||
      u.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      u.productName.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }), [stockUnits, search, statusFilter]);

  const stats = useMemo(() => ({
    inStock: stockUnits.filter(u => u.status === 'In Stock').length,
    sold: stockUnits.filter(u => u.status === 'Sold').length,
    inRepair: stockUnits.filter(u => u.status === 'In Repair').length,
    total: stockUnits.length,
  }), [stockUnits]);

  const productResults = addProductSearch.length > 1
    ? products.filter(p => p.name.toLowerCase().includes(addProductSearch.toLowerCase())).slice(0, 6)
    : [];

  const selectedProduct = products.find(p => p.id === addProductId);

  const handleAddUnit = () => {
    if (!addProductId || !addSerial.trim()) {
      onShowAlert?.('Product and serial number are required.', 'error');
      return;
    }
    const prod = products.find(p => p.id === addProductId);
    const unit: StockUnit = {
      id: 'UNIT-' + String(Date.now()).slice(-6),
      serialNumber: addSerial.trim(),
      productId: addProductId,
      productName: prod?.name || '',
      status: 'In Stock',
      grade: addGrade,
      costPrice: parseFloat(addCost) || 0,
      notes: addNotes,
      auditLog: [{ date: new Date().toISOString(), action: 'Added to inventory', notes: addNotes }],
      receivedDate: new Date().toISOString().split('T')[0],
    };
    onAddStockUnit(unit);
    onShowAlert?.(`Unit ${unit.id} added.`, 'success');
    setShowAddForm(false);
    setAddSerial(''); setAddCost(''); setAddNotes(''); setAddProductId(''); setAddProductSearch('');
  };

  const handleBulkImport = () => {
    if (!bulkProductId) { onShowAlert?.('Select a product first.', 'error'); return; }
    const serials = bulkSerials.split(/[\n,;]/).map(s => s.trim()).filter(Boolean);
    if (serials.length === 0) { onShowAlert?.('No serial numbers entered.', 'error'); return; }
    const prod = products.find(p => p.id === bulkProductId);
    serials.forEach(sn => {
      onAddStockUnit({
        id: 'UNIT-' + String(Date.now() + Math.random()).slice(-8),
        serialNumber: sn,
        productId: bulkProductId,
        productName: prod?.name || '',
        status: 'In Stock',
        grade: 'A',
        costPrice: parseFloat(bulkCost) || 0,
        auditLog: [{ date: new Date().toISOString(), action: 'Bulk imported' }],
        receivedDate: new Date().toISOString().split('T')[0],
      });
    });
    onShowAlert?.(`${serials.length} units imported.`, 'success');
    setShowBulkImport(false);
    setBulkSerials(''); setBulkCost(''); setBulkProductId('');
  };

  const openUpdateModal = (unit: StockUnit) => {
    setShowUpdateModal(unit);
    setUpdateStatus(unit.status);
    setUpdateGrade(unit.grade || 'A');
    setUpdateNotes('');
    setUpdateAction('Status updated');
  };

  const handleUpdateUnit = () => {
    if (!showUpdateModal) return;
    const auditEntry: StockUnitAuditEntry = {
      date: new Date().toISOString(),
      action: updateAction || 'Status updated',
      notes: updateNotes,
    };
    onUpdateStockUnit({
      ...showUpdateModal,
      status: updateStatus,
      grade: updateGrade,
      notes: updateNotes || showUpdateModal.notes,
      auditLog: [...showUpdateModal.auditLog, auditEntry],
    });
    onShowAlert?.('Unit updated.', 'success');
    setShowUpdateModal(null);
  };

  const exportCSV = () => {
    const headers = ['ID', 'Serial Number', 'Product', 'Status', 'Grade', 'Cost Price', 'Received Date', 'Sale Order', 'Repair Job'];
    const rows = stockUnits.map(u => [u.id, u.serialNumber, u.productName, u.status, u.grade || '', u.costPrice, u.receivedDate, u.saleOrderId || '', u.repairJobId || '']);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'stock-units.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'In Stock', value: stats.inStock, color: 'border-emerald-400 bg-emerald-50', textColor: 'text-emerald-700' },
          { label: 'Sold', value: stats.sold, color: 'border-neutral-400 bg-neutral-50', textColor: 'text-neutral-600' },
          { label: 'In Repair', value: stats.inRepair, color: 'border-amber-400 bg-amber-50', textColor: 'text-amber-700' },
          { label: 'Total Units', value: stats.total, color: 'border-blue-400 bg-blue-50', textColor: 'text-blue-700' },
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
            placeholder="Search by serial number or product…"
            className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div className="flex gap-1">
          {['All', ...ALL_STATUSES].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${statusFilter === s ? 'bg-neutral-800 text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'}`}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-2 rounded-lg text-xs font-bold">
          <FileDown className="h-3.5 w-3.5" /> Export CSV
        </button>
        <button onClick={() => setShowBulkImport(true)} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-bold">
          <Upload className="h-3.5 w-3.5" /> Bulk Import
        </button>
        <button onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          id="stock-unit-add-btn">
          <Plus className="h-4 w-4" /> Add Unit
        </button>
      </div>

      {/* Units table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-800 text-white">
              <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider">Serial #</th>
              <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider">Product</th>
              <th className="text-center p-3 font-bold text-[10px] uppercase tracking-wider">Grade</th>
              <th className="text-center p-3 font-bold text-[10px] uppercase tracking-wider">Status</th>
              <th className="text-right p-3 font-bold text-[10px] uppercase tracking-wider">Cost</th>
              <th className="text-right p-3 font-bold text-[10px] uppercase tracking-wider">Received</th>
              <th className="text-center p-3 font-bold text-[10px] uppercase tracking-wider w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-16 text-neutral-400">
                <Barcode className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-xs uppercase tracking-wider">No stock units found</p>
              </td></tr>
            )}
            {filtered.map(unit => {
              const isExpanded = expandedId === unit.id;
              return (
                <React.Fragment key={unit.id}>
                  <tr className="border-t border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : unit.id)}>
                    <td className="p-3 font-mono font-bold text-xs text-neutral-700">{unit.serialNumber}</td>
                    <td className="p-3">
                      <div className="font-semibold text-xs text-neutral-800 leading-tight">{unit.productName}</div>
                      <div className="text-[9px] text-neutral-400 font-mono">{unit.id}</div>
                    </td>
                    <td className="p-3 text-center">
                      {unit.grade ? (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${GRADE_COLORS[unit.grade]}`}>{unit.grade}</span>
                      ) : <span className="text-neutral-300">—</span>}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[unit.status]}`}>{unit.status}</span>
                    </td>
                    <td className="p-3 text-right text-xs font-semibold">${unit.costPrice.toFixed(2)}</td>
                    <td className="p-3 text-right text-xs text-neutral-400">{unit.receivedDate}</td>
                    <td className="p-3 text-center">
                      <button onClick={e => { e.stopPropagation(); openUpdateModal(unit); }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold">Edit</button>
                    </td>
                  </tr>

                  {/* Expanded audit log */}
                  {isExpanded && (
                    <tr className="border-t border-neutral-100 bg-neutral-50">
                      <td colSpan={7} className="p-4">
                        <div className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3">Audit History</div>
                        {unit.auditLog.length === 0
                          ? <p className="text-xs text-neutral-400">No audit entries.</p>
                          : (
                            <div className="space-y-2">
                              {[...unit.auditLog].reverse().map((entry, i) => (
                                <div key={i} className="flex items-start gap-3">
                                  <div className="shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-neutral-800">{entry.action}</span>
                                      {entry.performedBy && <span className="text-[9px] text-neutral-400">by {entry.performedBy}</span>}
                                    </div>
                                    {entry.notes && <p className="text-xs text-neutral-500 mt-0.5">{entry.notes}</p>}
                                    <div className="text-[9px] text-neutral-400 mt-0.5">{new Date(entry.date).toLocaleString()}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                        {/* Linked references */}
                        <div className="flex gap-4 mt-3 text-xs">
                          {unit.purchaseOrderId && <div><span className="font-bold text-neutral-400">PO:</span> {unit.purchaseOrderId}</div>}
                          {unit.saleOrderId && <div><span className="font-bold text-neutral-400">Order:</span> {unit.saleOrderId}</div>}
                          {unit.repairJobId && <div><span className="font-bold text-neutral-400">Repair:</span> {unit.repairJobId}</div>}
                          {unit.warrantyExpiryDate && <div><span className="font-bold text-neutral-400">Warranty Exp:</span> {unit.warrantyExpiryDate}</div>}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ADD UNIT MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h2 className="font-black text-lg uppercase tracking-wider">Add Stock Unit</h2>
              <button onClick={() => setShowAddForm(false)} className="text-neutral-400 hover:text-neutral-900"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-600 block mb-1">Product *</label>
                <div className="relative">
                  <input value={addProductSearch} onChange={e => setAddProductSearch(e.target.value)}
                    placeholder="Search product…"
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  {productResults.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 bg-white border border-neutral-200 rounded-lg shadow-xl mt-1">
                      {productResults.map(p => (
                        <button key={p.id} onClick={() => { setAddProductId(p.id); setAddProductSearch(p.name); setAddCost(String(p.costPrice || '')); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-neutral-100">
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-600 block mb-1">Serial Number *</label>
                <input value={addSerial} onChange={e => setAddSerial(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Cost Price</label>
                  <input type="number" min="0" value={addCost} onChange={e => setAddCost(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Grade</label>
                  <select value={addGrade} onChange={e => setAddGrade(e.target.value as any)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    {ALL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-600 block mb-1">Notes</label>
                <textarea rows={2} value={addNotes} onChange={e => setAddNotes(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-neutral-200">
              <button onClick={() => setShowAddForm(false)} className="px-5 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
              <button onClick={handleAddUnit} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg">Add Unit</button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <div>
                <h2 className="font-black text-lg uppercase tracking-wider">Update Unit</h2>
                <div className="text-xs font-mono text-neutral-400">{showUpdateModal.serialNumber}</div>
              </div>
              <button onClick={() => setShowUpdateModal(null)}><X className="h-5 w-5 text-neutral-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">New Status</label>
                  <select value={updateStatus} onChange={e => setUpdateStatus(e.target.value as any)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Grade</label>
                  <select value={updateGrade} onChange={e => setUpdateGrade(e.target.value as any)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    {ALL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-600 block mb-1">Audit Action Label</label>
                <input value={updateAction} onChange={e => setUpdateAction(e.target.value)}
                  placeholder="e.g. Sent for repair, Sold, Graded"
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-600 block mb-1">Notes</label>
                <textarea rows={2} value={updateNotes} onChange={e => setUpdateNotes(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-neutral-200">
              <button onClick={() => setShowUpdateModal(null)} className="px-5 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
              <button onClick={handleUpdateUnit} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {showBulkImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h2 className="font-black text-lg uppercase tracking-wider">Bulk Import Serials</h2>
              <button onClick={() => setShowBulkImport(false)}><X className="h-5 w-5 text-neutral-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-600 block mb-1">Product *</label>
                <select value={bulkProductId} onChange={e => setBulkProductId(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Select a product…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-600 block mb-1">Cost Price per Unit</label>
                <input type="number" min="0" value={bulkCost} onChange={e => setBulkCost(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-600 block mb-1">Serial Numbers (one per line, or comma-separated)</label>
                <textarea rows={8} value={bulkSerials} onChange={e => setBulkSerials(e.target.value)}
                  placeholder={"SN001\nSN002\nSN003"}
                  className="w-full font-mono border border-neutral-300 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:border-blue-500" />
                <div className="text-xs text-neutral-400 mt-1">{bulkSerials.split(/[\n,;]/).filter(s => s.trim()).length} serials detected</div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-neutral-200">
              <button onClick={() => setShowBulkImport(false)} className="px-5 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
              <button onClick={handleBulkImport} className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg">Import All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
