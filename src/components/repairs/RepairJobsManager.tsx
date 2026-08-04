import React, { useState, useMemo } from 'react';
import {
  Wrench, Plus, ChevronDown, ChevronUp, Printer, Clock, CheckCircle2,
  AlertTriangle, Package, User, Smartphone, Search, X, Edit3, Trash2,
  ArrowRight, Shield, DollarSign, FileText
} from 'lucide-react';
import { RepairJob, RepairJobPart, Product, StoreSettings, CustomerProfile } from '../../types';
import { printJobCard } from '../../utils/jobCardPrinter';

interface RepairJobsManagerProps {
  repairJobs: RepairJob[];
  onAddRepairJob: (job: RepairJob) => void;
  onUpdateRepairJob: (job: RepairJob) => void;
  onDeleteRepairJob: (id: string) => void;
  products: Product[];
  customers: CustomerProfile[];
  storeSettings?: StoreSettings;
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onDeductPartsFromStock?: (productId: string, qty: number) => void;
}

const STATUS_ORDER: RepairJob['status'][] = [
  'Intake', 'Diagnosed', 'Awaiting Parts', 'In Progress', 'QC', 'Ready', 'Collected'
];

const STATUS_COLORS: Record<string, string> = {
  'Intake': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Diagnosed': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Awaiting Parts': 'bg-amber-100 text-amber-700 border-amber-200',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  'QC': 'bg-purple-100 text-purple-700 border-purple-200',
  'Ready': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Collected': 'bg-neutral-100 text-neutral-600 border-neutral-200',
  'Cancelled': 'bg-red-100 text-red-600 border-red-200',
};

const DEVICE_TYPES = ['Laptop', 'Desktop', 'Monitor', 'Server', 'Printer', 'Tablet', 'Phone', 'Other'];
const TECHNICIANS = ['John Smith', 'Sarah Jones', 'Mike Brown', 'Lisa Chen'];

const emptyJob = (): Omit<RepairJob, 'id'> => ({
  status: 'Intake',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  deviceType: 'Laptop',
  deviceBrand: '',
  deviceModel: '',
  serialNumber: '',
  fault: '',
  diagnosis: '',
  technicianName: '',
  partsUsed: [],
  labourHours: 1,
  labourRatePerHour: 85,
  estimatedCost: 0,
  isWarrantyJob: false,
  intakeDate: new Date().toISOString().split('T')[0],
  notes: '',
  internalNotes: '',
});

export default function RepairJobsManager({
  repairJobs,
  onAddRepairJob,
  onUpdateRepairJob,
  onDeleteRepairJob,
  products,
  customers,
  storeSettings,
  onShowAlert,
  onDeductPartsFromStock,
}: RepairJobsManagerProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<RepairJob | null>(null);
  const [form, setForm] = useState(emptyJob());
  const [partSearch, setPartSearch] = useState('');

  const filtered = useMemo(() => {
    return repairJobs.filter(j => {
      const matchStatus = statusFilter === 'All' || j.status === statusFilter;
      const matchSearch = !search ||
        j.customerName.toLowerCase().includes(search.toLowerCase()) ||
        j.id.toLowerCase().includes(search.toLowerCase()) ||
        j.deviceBrand.toLowerCase().includes(search.toLowerCase()) ||
        j.deviceModel.toLowerCase().includes(search.toLowerCase()) ||
        (j.serialNumber || '').toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [repairJobs, search, statusFilter]);

  const stats = useMemo(() => ({
    open: repairJobs.filter(j => !['Collected', 'Cancelled'].includes(j.status)).length,
    inProgress: repairJobs.filter(j => j.status === 'In Progress').length,
    ready: repairJobs.filter(j => j.status === 'Ready').length,
    thisMonth: repairJobs.filter(j => j.intakeDate.startsWith(new Date().toISOString().slice(0, 7))).length,
  }), [repairJobs]);

  const openForm = (job?: RepairJob) => {
    if (job) {
      setEditingJob(job);
      setForm({ ...job });
    } else {
      setEditingJob(null);
      setForm(emptyJob());
    }
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.customerName.trim() || !form.deviceBrand.trim() || !form.fault.trim()) {
      onShowAlert?.('Customer name, device brand, and fault description are required.', 'error');
      return;
    }
    if (editingJob) {
      onUpdateRepairJob({ ...editingJob, ...form });
      onShowAlert?.(`Job ${editingJob.id} updated.`, 'success');
    } else {
      const newJob: RepairJob = {
        ...form,
        id: 'JOB-' + String(Date.now()).slice(-6),
      };
      onAddRepairJob(newJob);
      onShowAlert?.(`Job ${newJob.id} created.`, 'success');
    }
    setShowForm(false);
  };

  const handleAdvanceStatus = (job: RepairJob) => {
    const idx = STATUS_ORDER.indexOf(job.status);
    if (idx === -1 || idx >= STATUS_ORDER.length - 1) return;
    const nextStatus = STATUS_ORDER[idx + 1];
    const updated: RepairJob = {
      ...job,
      status: nextStatus,
      completedDate: nextStatus === 'Ready' ? new Date().toISOString().split('T')[0] : job.completedDate,
      collectedDate: nextStatus === 'Collected' ? new Date().toISOString().split('T')[0] : job.collectedDate,
    };
    // Deduct parts from stock when moving to "In Progress"
    if (nextStatus === 'In Progress' && job.status !== 'In Progress') {
      job.partsUsed.forEach(p => onDeductPartsFromStock?.(p.productId, p.quantity));
    }
    onUpdateRepairJob(updated);
    onShowAlert?.(`${job.id} → ${nextStatus}`, 'success');
  };

  const handleAddPart = (product: Product) => {
    const existing = form.partsUsed.find(p => p.productId === product.id);
    if (existing) {
      setForm(f => ({
        ...f,
        partsUsed: f.partsUsed.map(p => p.productId === product.id
          ? { ...p, quantity: p.quantity + 1 }
          : p
        )
      }));
    } else {
      const part: RepairJobPart = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitCost: product.costPrice || product.price * 0.6,
      };
      setForm(f => ({ ...f, partsUsed: [...f.partsUsed, part] }));
    }
    setPartSearch('');
  };

  const partResults = partSearch.length > 1
    ? products.filter(p => p.name.toLowerCase().includes(partSearch.toLowerCase())).slice(0, 6)
    : [];

  const calcJobTotal = (job: RepairJob) => {
    if (job.isWarrantyJob) return 0;
    const parts = job.partsUsed.reduce((s, p) => s + p.quantity * p.unitCost, 0);
    return (job.finalCost ?? (parts + job.labourHours * job.labourRatePerHour));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open Jobs', value: stats.open, color: 'border-indigo-400 bg-indigo-50', textColor: 'text-indigo-700' },
          { label: 'In Progress', value: stats.inProgress, color: 'border-blue-400 bg-blue-50', textColor: 'text-blue-700' },
          { label: 'Ready for Collection', value: stats.ready, color: 'border-emerald-400 bg-emerald-50', textColor: 'text-emerald-700' },
          { label: 'This Month', value: stats.thisMonth, color: 'border-amber-400 bg-amber-50', textColor: 'text-amber-700' },
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
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer, device, serial…"
            className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="All">All Statuses</option>
          {[...STATUS_ORDER, 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          id="repair-new-job-btn"
        >
          <Plus className="h-4 w-4" /> New Job
        </button>
      </div>

      {/* Job List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-neutral-400 border border-dashed border-neutral-300 rounded-xl">
            <Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm uppercase tracking-wider">No repair jobs found</p>
          </div>
        )}

        {filtered.map(job => {
          const isExpanded = expandedJobId === job.id;
          const statusIdx = STATUS_ORDER.indexOf(job.status);
          const canAdvance = statusIdx >= 0 && statusIdx < STATUS_ORDER.length - 1;

          return (
            <div key={job.id} className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
              {/* Job Row */}
              <div
                className="flex flex-wrap items-center gap-3 p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black text-neutral-400">{job.id}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[job.status]}`}>
                      {job.status}
                    </span>
                    {job.isWarrantyJob && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        Warranty
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-bold text-sm text-neutral-900">{job.customerName}</div>
                  <div className="text-xs text-neutral-500">{job.deviceBrand} {job.deviceModel} {job.serialNumber ? `· S/N: ${job.serialNumber}` : ''}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-neutral-900">${calcJobTotal(job).toFixed(2)}</div>
                  <div className="text-xs text-neutral-400">{job.intakeDate}</div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-neutral-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0" />}
              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="border-t border-neutral-100 bg-neutral-50 p-4 space-y-4">
                  {/* Progress bar */}
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-2">Job Progress</div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {STATUS_ORDER.map((s, i) => (
                        <React.Fragment key={s}>
                          <span className={`text-[9px] font-bold px-2 py-1 rounded ${
                            i < statusIdx ? 'bg-emerald-500 text-white' :
                            i === statusIdx ? 'bg-blue-600 text-white' :
                            'bg-neutral-200 text-neutral-500'
                          }`}>{s}</span>
                          {i < STATUS_ORDER.length - 1 && <ArrowRight className="h-3 w-3 text-neutral-300 shrink-0" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    {[
                      ['Technician', job.technicianName || 'Unassigned'],
                      ['Phone', job.customerPhone || '—'],
                      ['Email', job.customerEmail || '—'],
                      ['Device Type', job.deviceType],
                      ['Intake Date', job.intakeDate],
                      ['Completed', job.completedDate || '—'],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div className="text-[9px] font-black uppercase text-neutral-400 mb-0.5">{label}</div>
                        <div className="font-semibold text-neutral-800">{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Fault & Diagnosis */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[9px] font-black uppercase text-neutral-400 mb-1">Reported Fault</div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">{job.fault || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase text-neutral-400 mb-1">Diagnosis</div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">{job.diagnosis || 'Not yet diagnosed'}</div>
                    </div>
                  </div>

                  {/* Parts */}
                  {job.partsUsed.length > 0 && (
                    <div>
                      <div className="text-[9px] font-black uppercase text-neutral-400 mb-2">Parts Used</div>
                      <table className="w-full text-xs border border-neutral-200 rounded-lg overflow-hidden">
                        <thead className="bg-neutral-800 text-white">
                          <tr>
                            <th className="text-left p-2">Part</th>
                            <th className="text-center p-2 w-12">Qty</th>
                            <th className="text-right p-2 w-20">Cost</th>
                            <th className="text-right p-2 w-20">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {job.partsUsed.map((p, i) => (
                            <tr key={i} className="border-t border-neutral-100">
                              <td className="p-2">{p.productName}</td>
                              <td className="p-2 text-center">{p.quantity}</td>
                              <td className="p-2 text-right">${p.unitCost.toFixed(2)}</td>
                              <td className="p-2 text-right">${(p.quantity * p.unitCost).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Cost summary */}
                  <div className="flex items-center gap-6 text-xs font-bold text-neutral-600">
                    <span>Parts: ${job.partsUsed.reduce((s, p) => s + p.quantity * p.unitCost, 0).toFixed(2)}</span>
                    <span>Labour: {job.labourHours}h × ${job.labourRatePerHour} = ${(job.labourHours * job.labourRatePerHour).toFixed(2)}</span>
                    <span className="text-neutral-900 font-black">Total: ${calcJobTotal(job).toFixed(2)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-200">
                    {canAdvance && job.status !== 'Cancelled' && (
                      <button
                        onClick={() => handleAdvanceStatus(job)}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        <ArrowRight className="h-3 w-3" /> → {STATUS_ORDER[statusIdx + 1]}
                      </button>
                    )}
                    <button
                      onClick={() => printJobCard(job, storeSettings)}
                      className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    >
                      <Printer className="h-3 w-3" /> Print Job Card
                    </button>
                    <button
                      onClick={() => openForm(job)}
                      className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    >
                      <Edit3 className="h-3 w-3" /> Edit
                    </button>
                    {job.status !== 'Cancelled' && (
                      <button
                        onClick={() => { onUpdateRepairJob({ ...job, status: 'Cancelled' }); onShowAlert?.(`${job.id} cancelled.`, 'info'); }}
                        className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        <X className="h-3 w-3" /> Cancel
                      </button>
                    )}
                    <button
                      onClick={() => { if (confirm(`Delete job ${job.id}?`)) { onDeleteRepairJob(job.id); onShowAlert?.(`Job deleted.`, 'info'); } }}
                      className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ml-auto"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* NEW / EDIT JOB FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h2 className="font-black text-lg uppercase tracking-wider">{editingJob ? `Edit ${editingJob.id}` : 'New Repair Job'}</h2>
              <button onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-neutral-900"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Customer */}
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3">Customer</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Customer Name *', key: 'customerName', type: 'text' },
                    { label: 'Phone', key: 'customerPhone', type: 'tel' },
                    { label: 'Email', key: 'customerEmail', type: 'email' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs font-bold text-neutral-600 block mb-1">{f.label}</label>
                      <input
                        type={f.type}
                        value={(form as any)[f.key]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Device */}
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3">Device</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-600 block mb-1">Device Type</label>
                    <select value={form.deviceType} onChange={e => setForm(f => ({ ...f, deviceType: e.target.value }))}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                      {DEVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  {[
                    { label: 'Brand *', key: 'deviceBrand' },
                    { label: 'Model', key: 'deviceModel' },
                    { label: 'Serial Number', key: 'serialNumber' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs font-bold text-neutral-600 block mb-1">{f.label}</label>
                      <input
                        value={(form as any)[f.key]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Fault & Diagnosis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Reported Fault *</label>
                  <textarea rows={3} value={form.fault}
                    onChange={e => setForm(f => ({ ...f, fault: e.target.value }))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Technician Diagnosis</label>
                  <textarea rows={3} value={form.diagnosis}
                    onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Technician & Labour */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Technician</label>
                  <input list="tech-list" value={form.technicianName}
                    onChange={e => setForm(f => ({ ...f, technicianName: e.target.value }))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Technician name"
                  />
                  <datalist id="tech-list">{TECHNICIANS.map(t => <option key={t} value={t} />)}</datalist>
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Labour Hours</label>
                  <input type="number" min="0" step="0.5" value={form.labourHours}
                    onChange={e => setForm(f => ({ ...f, labourHours: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Rate ($/hr)</label>
                  <input type="number" min="0" value={form.labourRatePerHour}
                    onChange={e => setForm(f => ({ ...f, labourRatePerHour: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Parts picker */}
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-2">Parts Used (from inventory)</div>
                <div className="relative">
                  <input value={partSearch} onChange={e => setPartSearch(e.target.value)}
                    placeholder="Search inventory for parts…"
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                  {partResults.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 bg-white border border-neutral-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                      {partResults.map(p => (
                        <button key={p.id} onClick={() => handleAddPart(p)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-neutral-100 flex items-center justify-between">
                          <span>{p.name}</span>
                          <span className="text-xs text-neutral-400">Stock: {p.stock} · ${(p.costPrice || p.price * 0.6).toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {form.partsUsed.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {form.partsUsed.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm">
                        <span className="flex-1 font-medium">{p.productName}</span>
                        <input type="number" min="1" value={p.quantity}
                          onChange={e => setForm(f => ({ ...f, partsUsed: f.partsUsed.map((pp, ii) => ii === i ? { ...pp, quantity: parseInt(e.target.value) || 1 } : pp) }))}
                          className="w-14 border border-neutral-300 rounded px-2 py-0.5 text-xs text-center"
                        />
                        <span className="text-xs text-neutral-400">${p.unitCost.toFixed(2)} each</span>
                        <button onClick={() => setForm(f => ({ ...f, partsUsed: f.partsUsed.filter((_, ii) => ii !== i) }))}>
                          <X className="h-3.5 w-3.5 text-red-400 hover:text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                  <input type="checkbox" checked={form.isWarrantyJob}
                    onChange={e => setForm(f => ({ ...f, isWarrantyJob: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  Warranty Job (No Charge)
                </label>
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Intake Date</label>
                  <input type="date" value={form.intakeDate}
                    onChange={e => setForm(f => ({ ...f, intakeDate: e.target.value }))}
                    className="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Notes for Customer</label>
                  <textarea rows={2} value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Internal Notes</label>
                  <textarea rows={2} value={form.internalNotes}
                    onChange={e => setForm(f => ({ ...f, internalNotes: e.target.value }))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-neutral-200">
              <button onClick={() => setShowForm(false)}
                className="px-5 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleSave}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors">
                {editingJob ? 'Save Changes' : 'Create Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
