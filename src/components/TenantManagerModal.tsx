import React, { useState, useEffect } from 'react';
import { Store, Globe, Layers, CreditCard, Shield, Users, Package, ShoppingCart, X, CheckCircle2, AlertTriangle, Loader2, Save, Power, Sliders, Check } from 'lucide-react';

interface TenantManagerModalProps {
  tenantId: string;
  onClose: () => void;
  onTenantUpdated: () => void;
}

export const TenantManagerModal: React.FC<TenantManagerModalProps> = ({
  tenantId,
  onClose,
  onTenantUpdated,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'contact' | 'stats'>('general');

  // Form Fields
  const [tenantData, setTenantData] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  // Billing Fields
  const [planId, setPlanId] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState('active');

  // Store Settings & Contact Fields
  const [storeName, setStoreName] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [taxRatePercent, setTaxRatePercent] = useState('10');
  const [taxName, setTaxName] = useState('GST');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken') || '';

      const [tenantRes, plansRes] = await Promise.all([
        fetch(`/api/superadmin/tenants/${tenantId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/superadmin/plans', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!tenantRes.ok) throw new Error('Failed to load tenant store details.');

      const data = await tenantRes.json();
      const plansData = await plansRes.json();

      const t = data.tenant;
      setTenantData(t);
      setPlans(plansData.plans || []);

      // Populate Form State
      setName(t.name || '');
      setSlug(t.slug || '');
      setCustomDomain(t.customDomain || '');
      setStatus(t.status || 'ACTIVE');

      setPlanId(t.planId || '');
      setSubscriptionStatus(t.subscriptionStatus || 'active');

      const ss = t.storeSettings?.[0] || {};
      setStoreName(ss.storeName || t.name || '');
      setCurrencySymbol(ss.currencySymbol || '$');
      setTaxRatePercent(String(ss.taxRatePercent ?? 10));
      setTaxName(ss.taxName || 'GST');
      setPhone(ss.phone || '');
      setEmail(ss.email || '');
      setAddress(ss.address || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantDetails();
  }, [tenantId]);

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccessMsg('');

    try {
      setSubmitting(true);
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch(`/api/superadmin/tenants/${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          slug,
          customDomain: customDomain ? customDomain.trim() : undefined,
          status,
          planId: planId || null,
          subscriptionStatus,
          storeName,
          currencySymbol,
          taxRatePercent,
          taxName,
          phone,
          email,
          address,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update tenant store.');

      setSuccessMsg(`Store '${data.tenant.name}' updated successfully!`);
      setTimeout(() => {
        onTenantUpdated();
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-indigo-50 to-purple-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-xl text-slate-900 tracking-tight">{name || 'Manage Tenant'}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${
                  status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}>
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Subdomain: <code className="text-indigo-600 font-bold font-mono">{slug}.infomats.net</code></p>

            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600 bg-white font-extrabold shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" /> Identity &amp; Domain
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'billing'
                ? 'border-indigo-600 text-indigo-600 bg-white font-extrabold shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Standard Tiers
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'contact'
                ? 'border-indigo-600 text-indigo-600 bg-white font-extrabold shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" /> Owner &amp; Contact Info
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'stats'
                ? 'border-indigo-600 text-indigo-600 bg-white font-extrabold shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" /> Catalog Statistics
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
              <p className="text-sm font-semibold">Loading tenant information...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveTenant} className="space-y-6">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* TAB 1: General Info & Custom Domain */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Store Business Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Subdomain Slug *
                      </label>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
                      Custom Top-Level Domain (TLD)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. www.mybrandstore.com"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-indigo-200 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                    />
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">
                      Point DNS A-record to <code className="text-indigo-600 font-bold">76.76.21.21</code> or CNAME to <code className="text-indigo-600 font-bold">cname.infomats.net</code>
                    </p>

                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Store Platform Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                    >
                      <option value="ACTIVE">ACTIVE (Store Online &amp; Operational)</option>
                      <option value="SUSPENDED">SUSPENDED (Access Blocked by Super Admin)</option>
                      <option value="CANCELED">CANCELED (Subscription Terminated)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 2: Standard Tier Plans */}
              {activeTab === 'billing' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Assigned Subscription Plan Tier
                      </label>
                      <select
                        value={planId}
                        onChange={(e) => setPlanId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                      >
                        <option value="">No Plan Assigned</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (${p.priceMonthly}/mo)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Subscription Billing Status
                      </label>
                      <select
                        value={subscriptionStatus}
                        onChange={(e) => setSubscriptionStatus(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                      >
                        <option value="active">Active (Paid)</option>
                        <option value="trialing">Trialing (Free Trial)</option>
                        <option value="past_due">Past Due (Payment Failure)</option>
                        <option value="canceled">Canceled</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Store Contact & Settings */}
              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 mb-4">
                    <h4 className="text-xs font-extrabold uppercase text-indigo-900 tracking-wider mb-2">Registered Tenant Owners</h4>
                    {tenantData?.tenantUsers?.map((tu: any) => (
                      <div key={tu.id} className="text-xs font-medium text-slate-700 flex items-center justify-between py-1 border-b border-indigo-100/80 last:border-0">
                        <div>
                          <strong className="text-slate-900">{tu.user?.name}</strong> ({tu.user?.email})
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-200 text-indigo-900 font-bold text-[10px] uppercase">
                          {tu.role}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Store Contact Phone
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Store Support Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Business Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: Catalog Statistics */}
              {activeTab === 'stats' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <Package className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                    <div className="text-2xl font-black text-slate-900">{tenantData?._count?.products || 0}</div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Products</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <ShoppingCart className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <div className="text-2xl font-black text-slate-900">{tenantData?._count?.orders || 0}</div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Orders</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <div className="text-2xl font-black text-slate-900">{tenantData?._count?.customers || 0}</div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Customers</p>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 hover:from-emerald-700 hover:to-purple-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Tenant Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
