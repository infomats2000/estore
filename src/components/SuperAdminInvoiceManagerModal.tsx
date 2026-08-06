import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, Send, CheckCircle2, AlertTriangle, Clock, X, Plus, Loader2, Download, Search, Filter, RefreshCw, Zap, ShieldCheck, Mail } from 'lucide-react';

interface SuperAdminInvoiceManagerModalProps {
  onClose: () => void;
  onInvoicesUpdated?: () => void;
}

export const SuperAdminInvoiceManagerModal: React.FC<SuperAdminInvoiceManagerModalProps> = ({
  onClose,
  onInvoicesUpdated,
}) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New Invoice State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('79.00');
  const [planName, setPlanName] = useState('Pro Brand Tier');
  const [dueDateDays, setDueDateDays] = useState('7');
  const [createLoading, setCreateLoading] = useState(false);

  // Auto-Billing State
  const [autoBillingLoading, setAutoBillingLoading] = useState(false);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken') || '';

      const [invRes, tenRes] = await Promise.all([
        fetch('/api/superadmin/invoices', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/superadmin/tenants', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!invRes.ok) throw new Error('Failed to load tenant billing invoices.');
      const invData = await invRes.json();
      const tenData = await tenRes.json();

      setInvoices(invData.invoices || []);
      setTenants(tenData.tenants || []);
      if (tenData.tenants && tenData.tenants.length > 0) {
        setSelectedTenantId(tenData.tenants[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');

    try {
      setCreateLoading(true);
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch('/api/superadmin/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: selectedTenantId,
          amount: parseFloat(invoiceAmount),
          planName,
          dueDateDays: parseInt(dueDateDays, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice.');

      setMsg(`Invoice ${data.invoice.invoiceNumber} created and emailed to tenant!`);
      setShowCreateModal(false);
      fetchInvoiceData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSendInvoiceEmail = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setMsg('');
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch(`/api/superadmin/invoices/${invoiceId}/email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invoice email.');

      setMsg(`Invoice ${invoiceNumber} emailed to tenant owner successfully!`);
      fetchInvoiceData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRecordPayment = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setMsg('');
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch(`/api/superadmin/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentProvider: 'stripe',
          paymentRef: `PAY_RECORD_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment.');

      setMsg(`Payment recorded for Invoice ${invoiceNumber}! Tenant subscription renewed.`);
      fetchInvoiceData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRunAutoBilling = async () => {
    try {
      setAutoBillingLoading(true);
      setMsg('');
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch('/api/superadmin/invoices/run-auto-billing', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Auto billing process failed.');

      setMsg(data.message || 'Auto-billing routine executed! Invoices generated and emailed.');
      fetchInvoiceData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAutoBillingLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.tenant?.name.toLowerCase().includes(search.toLowerCase()) ||
      inv.planName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = invoices.filter((i) => i.status === 'PAID').reduce((acc, i) => acc + i.total, 0);
  const totalUnpaid = invoices.filter((i) => i.status === 'UNPAID' || i.status === 'OVERDUE').reduce((acc, i) => acc + i.total, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl tracking-tight text-white">Tenant Invoices &amp; Billing Ledger</h2>
              <p className="text-xs text-slate-300 font-medium">Automated subscription invoicing, emailing, and payment records</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAutoBilling}
              disabled={autoBillingLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
            >
              {autoBillingLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 text-amber-300" />
              )}
              <span>Run Auto Billing Routine</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Issue Invoice
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Financial Metrics Summary */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue Paid</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-0.5">${totalPaid.toFixed(2)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ✓
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding Invoices</p>
              <h3 className="text-2xl font-black text-amber-600 mt-0.5">${totalUnpaid.toFixed(2)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              ⏳
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Invoices Issued</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{invoices.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              📄
            </div>
          </div>
        </div>

        {/* Filter Controls & Alerts */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {msg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{msg}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search invoice number, store name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-slate-500">Status:</span>
              {['ALL', 'UNPAID', 'PAID', 'OVERDUE'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white font-extrabold shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices Directory Table */}
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
              <p className="text-sm font-semibold">Loading tenant billing ledger...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
              No subscription invoices match the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Invoice #</th>
                    <th className="p-3.5">Tenant Store</th>
                    <th className="p-3.5">Plan / Description</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="p-3.5">
                        <strong className="text-slate-900">{inv.tenant?.name}</strong>
                        <div className="text-[10px] text-slate-400 font-mono">{inv.tenant?.slug}.infomats.net</div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-700">{inv.planName}</td>
                      <td className="p-3.5 font-black text-slate-900">${inv.total.toFixed(2)}</td>
                      <td className="p-3.5 text-slate-600">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : inv.status === 'OVERDUE'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right flex items-center justify-end gap-1.5">
                        {inv.status !== 'PAID' && (
                          <button
                            onClick={() => handleRecordPayment(inv.id, inv.invoiceNumber)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 transition text-[11px] flex items-center gap-1"
                            title="Record Payment & Renew Subscription"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Pay
                          </button>
                        )}

                        <button
                          onClick={() => handleSendInvoiceEmail(inv.id, inv.invoiceNumber)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition text-[11px] flex items-center gap-1"
                          title="Email Invoice to Tenant Owner"
                        >
                          <Mail className="w-3.5 h-3.5" /> Email
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW INVOICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Issue Tenant Subscription Invoice</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 uppercase mb-1">Target Tenant Store</label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.slug}.infomats.net)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 uppercase mb-1">Subscription Plan / Line Item Name</label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 uppercase mb-1">Invoice Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 uppercase mb-1">Payment Due Days</label>
                  <input
                    type="number"
                    required
                    value={dueDateDays}
                    onChange={(e) => setDueDateDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-extrabold shadow-md flex items-center gap-1.5"
                >
                  {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Generate &amp; Email Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
