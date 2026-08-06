import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Zap, ArrowUpRight, ShieldCheck, Layers, Package, Users, ShoppingCart, Loader2, AlertCircle, Sparkles, RefreshCw, Lock } from 'lucide-react';
import { ALL_FEATURES } from '../constants/features';

export const TenantBillingSettings: React.FC = () => {
  const [billingData, setBillingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [settingUpRecurring, setSettingUpRecurring] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'stripe' | 'paypal'>('stripe');
  const [msg, setMsg] = useState('');

  const fetchBillingOverview = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch('/api/billing/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load store subscription data.');
      const data = await res.json();
      setBillingData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingOverview();
  }, []);

  const handleUpgradePlan = async (planId: string, planName: string) => {
    try {
      setUpgradingPlanId(planId);
      setMsg('');
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch('/api/billing/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update plan tier.');

      setMsg(`Success! Your store plan has been updated to ${planName}.`);
      fetchBillingOverview();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpgradingPlanId(null);
    }
  };

  const handleSetupRecurringPayment = async () => {
    try {
      setSettingUpRecurring(true);
      setMsg('');
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch('/api/billing/setup-recurring-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentProvider: selectedProvider,
          billingCycle: 'monthly',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to setup recurring billing.');

      setMsg(data.message || `Automated recurring payments activated via ${selectedProvider.toUpperCase()}!`);
      fetchBillingOverview();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSettingUpRecurring(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-sm font-semibold">Loading subscription tier &amp; billing overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const { tenant, currentPlan, usage, plans } = billingData || {};
  const currentFeatures: string[] = typeof currentPlan?.featuresJson === 'string'
    ? JSON.parse(currentPlan.featuresJson || '[]')
    : (Array.isArray(currentPlan?.featuresJson) ? currentPlan.featuresJson : []);

  return (
    <div className="space-y-8 text-slate-900 font-sans">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold text-xs uppercase tracking-wider border border-indigo-500/30">
              ACTIVE PLAN TIER
            </span>
            <span className="text-xs text-slate-300 font-semibold">• Store: {tenant?.name}</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight">{currentPlan?.name || 'Free Starter'}</h2>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Status: <span className="text-emerald-400 font-bold uppercase">{tenant?.subscriptionStatus || 'Active'}</span>
            {tenant?.currentPeriodEnd && ` • Next Billing Date: ${new Date(tenant.currentPeriodEnd).toLocaleDateString()}`}
          </p>
        </div>

        <div className="text-right">
          <div className="text-3xl font-black text-white">${currentPlan?.priceMonthly || 0}<span className="text-sm font-normal text-slate-300">/mo</span></div>
          <p className="text-xs text-emerald-400 font-bold">Automated Billing Active</p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* AUTOMATED MONTHLY RECURRING PAYMENT METHOD SETUP */}
      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Automated Monthly Recurring Payment Gateway</h3>
            <p className="text-xs text-slate-500 font-medium">Configure automatic monthly charges for your subscription plan</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-300">
            ✓ Auto-Charge Enabled
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <label
            onClick={() => setSelectedProvider('stripe')}
            className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
              selectedProvider === 'stripe'
                ? 'bg-indigo-50/80 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                💳
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900">Stripe Auto-Pay</div>
                <div className="text-xs text-slate-500">Credit / Debit Card Monthly Auto-Charge</div>
              </div>
            </div>
            <input
              type="radio"
              name="provider"
              checked={selectedProvider === 'stripe'}
              onChange={() => {}}
              className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
          </label>

          <label
            onClick={() => setSelectedProvider('paypal')}
            className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
              selectedProvider === 'paypal'
                ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                🅿️
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900">PayPal Subscription</div>
                <div className="text-xs text-slate-500">Automated Recurring PayPal Wallet Charge</div>
              </div>
            </div>
            <input
              type="radio"
              name="provider"
              checked={selectedProvider === 'paypal'}
              onChange={() => {}}
              className="text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSetupRecurringPayment}
            disabled={settingUpRecurring}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            {settingUpRecurring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Activating...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" /> Save &amp; Activate {selectedProvider.toUpperCase()} Recurring Payments
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quota Limit Progress Bars */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Subscription Quota &amp; Feature Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Products Usage */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <span>Products Listed</span>
              </div>
              <span>{usage?.products?.used || 0} / {usage?.products?.limit || 100}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${usage?.products?.percent || 0}%` }}
              />
            </div>
          </div>

          {/* Orders Usage */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span>Monthly Orders</span>
              </div>
              <span>{usage?.orders?.used || 0} / {usage?.orders?.limit || 1000}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${usage?.orders?.percent || 0}%` }}
              />
            </div>
          </div>

          {/* Staff Accounts */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Staff Accounts</span>
              </div>
              <span>{usage?.staff?.used || 0} / {usage?.staff?.limit || 2}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${usage?.staff?.percent || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Module Checklist for Current Tier */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Unlocked Feature Modules for {currentPlan?.name}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {ALL_FEATURES.map((feat) => {
            const isUnlocked = currentFeatures.includes(feat.id);
            return (
              <div
                key={feat.id}
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 ${
                  isUnlocked
                    ? 'bg-emerald-50/60 border-emerald-200 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                {isUnlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className={`font-extrabold text-xs ${isUnlocked ? 'text-slate-900' : 'text-slate-500'}`}>
                    {feat.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                    {isUnlocked ? feat.description : 'Locked on current tier'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Plans for Upgrade */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Available Plan Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {plans?.map((p: any) => {
            const isCurrent = currentPlan?.id === p.id;
            return (
              <div
                key={p.id}
                className={`p-6 rounded-3xl border transition flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-indigo-50/50 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-extrabold text-lg text-slate-900">{p.name}</h4>
                    {isCurrent && (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-4">{p.description}</p>

                  <div className="mb-4">
                    <span className="text-3xl font-black text-slate-900">${p.priceMonthly}</span>
                    <span className="text-xs text-slate-500">/mo</span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-600 font-medium mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span><strong>{p.maxProducts}</strong> Products</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span><strong>{p.maxOrdersPerMonth}</strong> Orders/Mo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span><strong>{p.maxStaff}</strong> Staff Accounts</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgradePlan(p.id, p.name)}
                  disabled={isCurrent || upgradingPlanId === p.id}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-slate-200 text-slate-500 cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {upgradingPlanId === p.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    <>
                      <span>Upgrade Plan</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
