import React, { useState, useEffect } from 'react';
import { ShieldCheck, Store, Users, DollarSign, Package, ShoppingCart, Globe, AlertTriangle, ArrowLeft, RefreshCw, CheckCircle2, XCircle, Plus, X, Loader2, Layers, Edit2, UserPlus, FileText, CreditCard, LayoutDashboard, Eye, EyeOff } from 'lucide-react';
import { PlanManagerModal } from './PlanManagerModal';
import { UserAccountDropdown } from './UserAccountDropdown';
import { ChangePasswordModal } from './ChangePasswordModal';
import { TenantManagerModal } from './TenantManagerModal';
import { SuperAdminUserManagerModal } from './SuperAdminUserManagerModal';
import { SuperAdminTenantChargeModal } from './SuperAdminTenantChargeModal';
import { SuperAdminInvoiceManagerModal } from './SuperAdminInvoiceManagerModal';
import { ContextualHelp } from './ContextualHelp';
import { useAdminInteractions } from '../context/AdminInteractionContext';

interface SuperAdminDashboardProps {
  onBackToApp: () => void;
  onLogout?: () => void;
  onImpersonateStore?: (tenant: any) => void;
  currentUser?: any;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onBackToApp, onLogout, onImpersonateStore, currentUser }) => {
  const interactions = useAdminInteractions();

  const [metrics, setMetrics] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [selectedEditTenantId, setSelectedEditTenantId] = useState<string | null>(null);
  const [chargingTenant, setChargingTenant] = useState<any | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // New Tenant Provisioning Form State
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showProvisionPassword, setShowProvisionPassword] = useState(false);
  const [planCode, setPlanCode] = useState('GROWTH');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const fetchSuperAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken') || '';

      const [metricsRes, tenantsRes] = await Promise.all([
        fetch('/api/superadmin/metrics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/superadmin/tenants', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!metricsRes.ok || !tenantsRes.ok) {
        throw new Error('Super Admin access denied. Please login with Super Admin credentials.');
      }

      const metricsData = await metricsRes.json();
      const tenantsData = await tenantsRes.json();

      setMetrics(metricsData);
      setTenants(tenantsData.tenants || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const handleStatusChange = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchSuperAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (!storeName || !slug || !ownerEmail || !password) {
      setModalError('Store Name, Subdomain Slug, Owner Email, and Initial Password are required.');
      return;
    }
    if (password.length < 8) {
      setModalError('The initial owner password must contain at least 8 characters.');
      return;
    }

    try {
      setModalLoading(true);
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeName,
          slug,
          customDomain: customDomain ? customDomain.trim() : undefined,
          ownerName,
          ownerEmail,
          password,
          planCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to provision store.');
      }

      setModalSuccess(`Store '${storeName}' provisioned successfully!`);
      setTimeout(() => {
        setShowCreateModal(false);
        setStoreName('');
        setSlug('');
        setCustomDomain('');
        setOwnerName('');
        setOwnerEmail('');
        setPassword('');
        setShowProvisionPassword(false);
        setModalSuccess('');
        fetchSuperAdminData();
      }, 1000);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleImpersonate = async (tenantId: string) => {
    try {
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/impersonate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to impersonate store.');

      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      if (onImpersonateStore) {
        onImpersonateStore(data.tenant);
      }
    } catch (err: any) {
      void interactions.notify({ title: 'Impersonation Failed', message: err.message || 'The tenant store could not be opened.' });
    }
  };

  return (

    <div className="super-admin-scope min-h-screen bg-slate-100 text-slate-800 font-sans selection:bg-blue-500 selection:text-white pb-12">
      {/* BOOTSTRAP SLEEK TOP NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToApp}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition flex items-center gap-1"
              title="Return to Store Workspace"
            >
              <ArrowLeft className="w-4 h-4" /> Store
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                BS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-sm tracking-tight">SuperAdmin Control Panel</span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase">
                    v5.3 Admin
                  </span>
                </div>
                <div className="text-[10px] leading-4 text-slate-500 font-medium">
                  <p>Monitor tenants, platform users, plans, invoices and recurring revenue.</p>
                  <p>Use the toolbar or tenant directory; access and billing changes may apply immediately.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUserModal(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" /> Users
            </button>

            <button
              onClick={() => setShowPlanModal(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" /> Tiers
            </button>

            <button
              onClick={() => setShowInvoiceModal(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" /> Invoices
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Tenant
            </button>

            <button
              onClick={fetchSuperAdminData}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 shadow-xs transition"
              title="Refresh Metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Profile Dropdown */}
            <div className="pl-1 border-l border-slate-200">
              <UserAccountDropdown
                userName={currentUser?.name || 'Super Admin'}
                userEmail={currentUser?.email || 'admin@infomats.net'}
                roleBadge="Super Admin"
                isSuperAdmin={true}
                onChangePassword={() => setShowChangePasswordModal(true)}
                onLogout={() => {
                  localStorage.removeItem('authToken');
                  if (onLogout) onLogout();
                  else window.location.href = '/?mode=login';
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {error ? (
          <div className="max-w-md mx-auto my-12 p-6 rounded-2xl bg-white border border-rose-200 shadow-sm text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
            <p className="text-xs text-slate-600">{error}</p>
            <button
              onClick={onBackToApp}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white font-bold text-xs shadow-xs"
            >
              Return to Store
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* BOOTSTRAP SLEEK METRIC CARDS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {/* MRR Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 border-t-4 border-t-emerald-500 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Est. MRR</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">${metrics?.estimatedMrr || 0}</div>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Monthly Subscription Revenue</p>
              </div>

              {/* Active Tenants Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 border-t-4 border-t-blue-500 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Active Stores</span>
                  <Store className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{metrics?.activeTenants || 0} <span className="text-xs font-semibold text-slate-400">/ {metrics?.totalTenants || 0}</span></div>
                <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Operational Tenants</p>
              </div>

              {/* Users Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 border-t-4 border-t-purple-500 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Platform Users</span>
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{metrics?.totalUsers || 0}</div>
                <p className="text-[11px] text-purple-600 font-semibold mt-0.5">Registered User Accounts</p>
              </div>

              {/* Products Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 border-t-4 border-t-pink-500 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Total Products</span>
                  <Package className="w-4 h-4 text-pink-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{metrics?.totalProducts || 0}</div>
                <p className="text-[11px] text-pink-600 font-semibold mt-0.5">Catalog SKUs Listed</p>
              </div>

              {/* Orders Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 border-t-4 border-t-amber-500 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Total Orders</span>
                  <ShoppingCart className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{metrics?.totalOrders || 0}</div>
                <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Processed Store Orders</p>
              </div>
            </div>

            {/* BOOTSTRAP SLEEK CARD CONTAINER TABLE */}
            <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
              {/* Card Header */}
              <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Tenant Store Directory</h2>
                  <p className="text-xs text-slate-500">Overview of all active store ERPs, custom domains, and subscription tiers</p>
                </div>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Provision Store
                </button>
              </div>

              {/* Bootstrap Table */}
              <div className="responsive-table-shell overflow-x-auto">
                <table className="responsive-data-table w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Store Name &amp; Domain</th>
                      <th className="p-3.5">Custom TLD</th>
                      <th className="p-3.5">Plan Tier</th>
                      <th className="p-3.5">Catalog SKUs</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {tenants.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td data-label="Store" className="p-3.5">
                          <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                          <div className="text-[11px] text-blue-600 font-mono font-semibold">{t.slug}.infomats.net</div>
                        </td>

                        <td data-label="Custom domain" className="p-3.5">
                          {t.customDomain ? (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-bold flex items-center gap-1 w-fit">
                              <Globe className="w-3 h-3 text-emerald-600" />
                              <span>{t.customDomain}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">None</span>
                          )}
                        </td>

                        <td data-label="Plan" className="p-3.5">
                          <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-900 border border-purple-200 font-bold text-xs inline-block">
                            {t.plan?.name || 'Free Plan'}
                          </span>
                        </td>

                        <td data-label="Products" className="p-3.5 font-bold text-slate-800">
                          {t._count?.products || 0} Products
                        </td>

                        <td data-label="Status" className="p-3.5">
                          {t.status === 'ACTIVE' ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200 uppercase">
                              ✓ Active
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 text-[10px] font-extrabold border border-rose-200 uppercase">
                              ✕ Suspended
                            </span>
                          )}
                        </td>

                        <td data-label="Actions" className="p-3.5 text-right flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleImpersonate(t.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-extrabold shadow-xs transition text-xs flex items-center gap-1"
                            title="Impersonate Store & Bypass Subscription Feature Gates"
                          >
                            <span>🎭 Impersonate</span>
                          </button>

                          <button
                            onClick={() => setChargingTenant(t)}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 shadow-xs transition text-xs flex items-center gap-1"
                            title="Charge Tenant Subscription Fee"
                          >
                            <DollarSign className="w-3.5 h-3.5 text-purple-600" /> Charge
                          </button>


                          <button
                            onClick={() => setSelectedEditTenantId(t.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition text-xs flex items-center gap-1"
                            title="Edit Tenant Settings & Custom Tier"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>

                          <button
                            onClick={() => handleStatusChange(t.id, t.status)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border shadow-xs transition ${
                              t.status === 'ACTIVE'
                                ? 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-600 text-white border-emerald-600'
                            }`}
                          >
                            {t.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PROVISION STORE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Provision New SaaS Tenant Store</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <ContextualHelp
              compact
              line1="Create a tenant store, its owner account and the initial subscription plan from this form."
              line2="Required fields must be valid and the owner will use the supplied email and password to sign in."
            />

            <form onSubmit={handleCreateStore} className="space-y-3.5 text-xs font-semibold">
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {modalError}
                </div>
              )}
              {modalSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  {modalSuccess}
                </div>
              )}

              <div>
                <label className="block text-slate-700 uppercase mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Hardware Store"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 uppercase mb-1">Subdomain Slug *</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="apex-hardware"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600"
                  />
                  <span className="absolute right-3 text-slate-400 font-mono text-[11px]">.infomats.net</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 uppercase mb-1">Owner Email *</label>
                <input
                  type="email"
                  required
                  placeholder="owner@apexhardware.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 uppercase mb-1">Initial Login Password *</label>
                <div className="relative">
                  <input
                    type={showProvisionPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 pr-11 font-mono font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowProvisionPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-700"
                    aria-label={showProvisionPassword ? 'Hide password' : 'Show password'}
                    title={showProvisionPassword ? 'Hide password' : 'Show password'}
                  >
                    {showProvisionPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[10px] font-medium normal-case text-slate-500">The store owner will use this password with the email above to sign in.</p>
              </div>

              <div>
                <label className="block text-slate-700 uppercase mb-1">Subscription Plan Tier</label>
                <select
                  value={planCode}
                  onChange={(e) => setPlanCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                >
                  <option value="FREE">Free Starter ($0/mo)</option>
                  <option value="STARTER">Growth Store ($29/mo)</option>
                  <option value="GROWTH">Pro Brand ($79/mo)</option>
                  <option value="ENTERPRISE">Enterprise Custom ($299/mo)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white font-extrabold shadow-xs flex items-center gap-1.5"
                >
                  {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Provision Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Tier Manager Modal */}
      {showPlanModal && (
        <PlanManagerModal
          onClose={() => setShowPlanModal(false)}
          onPlansUpdated={() => fetchSuperAdminData()}
        />
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}

      {/* Tenant Manager Modal */}
      {selectedEditTenantId && (
        <TenantManagerModal
          tenantId={selectedEditTenantId}
          onClose={() => setSelectedEditTenantId(null)}
          onTenantUpdated={() => {
            setSelectedEditTenantId(null);
            fetchSuperAdminData();
          }}
        />
      )}

      {/* Global User Management Modal */}
      {showUserModal && (
        <SuperAdminUserManagerModal
          onClose={() => setShowUserModal(false)}
          onUsersUpdated={() => fetchSuperAdminData()}
        />
      )}

      {/* Charge Tenant Subscription Fee Modal */}
      {chargingTenant && (
        <SuperAdminTenantChargeModal
          tenant={chargingTenant}
          onClose={() => setChargingTenant(null)}
          onSuccess={() => {
            setChargingTenant(null);
            fetchSuperAdminData();
          }}
        />
      )}

      {/* Global Tenant Invoice & Billing Ledger Modal */}
      {showInvoiceModal && (
        <SuperAdminInvoiceManagerModal
          onClose={() => setShowInvoiceModal(false)}
          onInvoicesUpdated={() => fetchSuperAdminData()}
        />
      )}
    </div>
  );
};
