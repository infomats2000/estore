import React, { useState, useEffect } from 'react';
import { Layers, Plus, X, Edit2, Trash2, CheckCircle2, AlertTriangle, Loader2, Shield, Lock, Check } from 'lucide-react';
import { ALL_FEATURES, DEFAULT_PLAN_FEATURES } from '../constants/features';
import { ContextualHelp } from './ContextualHelp';

interface PlanManagerModalProps {
  onClose: () => void;
  onPlansUpdated: () => void;
}

export const PlanManagerModal: React.FC<PlanManagerModalProps> = ({ onClose, onPlansUpdated }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State for Creating/Editing Plan
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [priceMonthly, setPriceMonthly] = useState('');
  const [priceYearly, setPriceYearly] = useState('');
  const [maxProducts, setMaxProducts] = useState('100');
  const [maxOrdersPerMonth, setMaxOrdersPerMonth] = useState('1000');
  const [maxStaff, setMaxStaff] = useState('2');
  const [customDomainAllowed, setCustomDomainAllowed] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState('');

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch('/api/superadmin/plans', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch plan tiers.');
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const resetForm = () => {
    setEditingPlanId(null);
    setName('');
    setCode('');
    setDescription('');
    setPriceMonthly('');
    setPriceYearly('');
    setMaxProducts('100');
    setMaxOrdersPerMonth('1000');
    setMaxStaff('2');
    setCustomDomainAllowed(false);
    setIsPopular(false);
    setSelectedFeatureIds(['pos']);
    setFormMsg('');
  };

  const parseFeatures = (featuresJson: string | string[]): string[] => {
    if (Array.isArray(featuresJson)) return featuresJson;
    try {
      const parsed = JSON.parse(featuresJson || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const handleEditClick = (plan: any) => {
    const featList = parseFeatures(plan.featuresJson);
    setEditingPlanId(plan.id);
    setName(plan.name);
    setCode(plan.code);
    setDescription(plan.description || '');
    setPriceMonthly(String(plan.priceMonthly));
    setPriceYearly(String(plan.priceYearly));
    setMaxProducts(String(plan.maxProducts));
    setMaxOrdersPerMonth(String(plan.maxOrdersPerMonth));
    setMaxStaff(String(plan.maxStaff));
    setCustomDomainAllowed(!!plan.customDomainAllowed || featList.includes('custom_domain'));
    setIsPopular(!!plan.isPopular);

    setSelectedFeatureIds(featList);
    setFormMsg('');
  };

  const toggleFeature = (featureId: string) => {
    if (featureId === 'pos') return; // POS is included by default on every plan tier
    if (selectedFeatureIds.includes(featureId)) {
      setSelectedFeatureIds(selectedFeatureIds.filter((id) => id !== featureId));
    } else {
      setSelectedFeatureIds([...selectedFeatureIds, featureId]);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg('');
    if (!name || !code) {
      setFormMsg('Plan name and code are required.');
      return;
    }
    if (!Number.isInteger(Number(maxStaff)) || Number(maxStaff) < 1) {
      setFormMsg('Maximum tenant users must be at least 1 because it includes the tenant owner/admin account.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('authToken') || '';
      const url = editingPlanId
        ? `/api/superadmin/plans/${editingPlanId}`
        : '/api/superadmin/plans';
      const method = editingPlanId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          code,
          description,
          priceMonthly,
          priceYearly,
          maxProducts,
          maxOrdersPerMonth,
          maxStaff,
          customDomainAllowed: selectedFeatureIds.includes('custom_domain'),
          isPopular,
          featuresJson: JSON.stringify(selectedFeatureIds),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save plan tier.');

      setFormMsg(editingPlanId ? 'Plan updated successfully!' : 'New plan tier created successfully!');
      setTimeout(() => {
        resetForm();
        fetchPlans();
        onPlansUpdated();
      }, 800);
    } catch (err: any) {
      setFormMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-emerald-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl text-slate-900 tracking-tight">SaaS Feature Gate &amp; Tier Manager</h2>
              <p className="text-xs text-slate-500 font-medium">Control pricing, quotas, and granular module feature access per plan tier</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ContextualHelp className="mx-6 mt-4" compact line1="Manage billing tiers, prices, quotas and the modules included in each tenant plan." line2="Feature changes control what tenants can access, so review assignments before saving a plan." />

        {/* Modal Content Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Plan List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Active Plan Tiers</h3>
              <button
                onClick={resetForm}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> New Plan Tier
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                <p className="text-xs font-medium">Loading tier definitions...</p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((p) => {
                  const enabledFeats = parseFeatures(p.featuresJson);
                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border transition ${
                        editingPlanId === p.id
                          ? 'bg-indigo-50/70 border-indigo-300 shadow-sm'
                          : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">{p.name}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
                            {p.code}
                          </span>
                          {p.isPopular && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              ★ POPULAR
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 shadow-sm transition"
                          title="Configure Features & Quotas"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-500 mb-2 font-medium">{p.description || 'No description provided.'}</p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {enabledFeats.length === 0 ? (
                          <span className="text-[10px] text-slate-400 font-semibold italic">No features unlocked</span>
                        ) : (
                          enabledFeats.map((fid) => {
                            const featObj = ALL_FEATURES.find((f) => f.id === fid);
                            return (
                              <span
                                key={fid}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-indigo-700 shadow-2xs"
                              >
                                ✓ {featObj ? featObj.name : fid}
                              </span>
                            );
                          })
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-slate-200/80 text-slate-600">
                        <div>
                          <span className="font-extrabold text-slate-900">${p.priceMonthly}</span>/mo (${p.priceYearly}/yr)
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                          <span>{p.maxProducts} Prods</span> •
                          <span>{p.maxStaff} Staff</span> •
                          <span className="text-indigo-600 font-bold">{p._count?.tenants || 0} Stores</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Form for Create/Edit */}
          <div className="lg:col-span-7 bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {editingPlanId ? `Configure Features: ${name}` : 'Create New Plan Tier'}
            </h3>

            {formMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  formMsg.includes('success')
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}
              >
                {formMsg.includes('success') ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{formMsg}</span>
              </div>
            )}

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pro Brand"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Plan Code *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPlanId}
                    placeholder="PRO_BRAND"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 transition disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Best for growing retail chains & custom domains"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Price Monthly ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="79.00"
                    value={priceMonthly}
                    onChange={(e) => setPriceMonthly(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Price Yearly ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="790.00"
                    value={priceYearly}
                    onChange={(e) => setPriceYearly(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Max Products
                  </label>
                  <input
                    type="number"
                    value={maxProducts}
                    onChange={(e) => setMaxProducts(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Max Orders/Mo
                  </label>
                  <input
                    type="number"
                    value={maxOrdersPerMonth}
                    onChange={(e) => setMaxOrdersPerMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Maximum Tenant Users
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxStaff}
                    onChange={(e) => setMaxStaff(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-indigo-600 transition"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">Includes the tenant owner/admin and every staff login.</p>
                </div>
              </div>

              {/* GRANULAR FEATURE MODULE SELECTION CHECKBOXES */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Unlocked Module Features ({selectedFeatureIds.length} / {ALL_FEATURES.length})
                  </label>
                  <span className="text-[10px] text-indigo-600 font-bold">Check to enable for this tier</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 rounded-2xl bg-white border border-slate-200 shadow-inner">
                  {ALL_FEATURES.map((feat) => {
                    const isChecked = feat.id === 'pos' ? true : selectedFeatureIds.includes(feat.id);
                    const isLockedOn = feat.id === 'pos';
                    return (
                      <label
                        key={feat.id}
                        onClick={() => toggleFeature(feat.id)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition flex items-start gap-2.5 ${
                          isLockedOn ? 'cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          isChecked
                            ? 'bg-indigo-50/80 border-indigo-300 text-slate-900'
                            : 'bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-100/80'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isLockedOn}
                          onChange={() => {}} // Handled by container onClick
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                        />
                        <div>
                          <div className={`font-bold text-xs ${isChecked ? 'text-indigo-900' : 'text-slate-700'}`}>
                            {feat.name}{isLockedOn ? ' (Included on all tiers)' : ''}
                          </div>
                          <div className="text-[10px] font-normal text-slate-500 leading-tight mt-0.5">
                            {feat.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedFeatureIds.includes('custom_domain')}
                    onChange={(e) => {
                      setCustomDomainAllowed(e.target.checked);
                      setSelectedFeatureIds((current) => e.target.checked
                        ? Array.from(new Set([...current, 'custom_domain']))
                        : current.filter((id) => id !== 'custom_domain'));
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Allow Custom Top-Level Domain Binding</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                  />
                  <span>Mark as "Most Popular" Badge</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                {editingPlanId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{editingPlanId ? 'Update Tier Features' : 'Save New Tier'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
