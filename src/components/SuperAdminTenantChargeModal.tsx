import React, { useState } from 'react';
import { CreditCard, DollarSign, ShieldCheck, CheckCircle2, AlertTriangle, Loader2, X, ExternalLink, RefreshCw, Send } from 'lucide-react';
import { ContextualHelp } from './ContextualHelp';

interface SuperAdminTenantChargeModalProps {
  tenant: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const SuperAdminTenantChargeModal: React.FC<SuperAdminTenantChargeModalProps> = ({
  tenant,
  onClose,
  onSuccess,
}) => {
  const defaultAmount = tenant?.plan?.priceMonthly ? String(tenant.plan.priceMonthly) : '79.00';
  const [provider, setProvider] = useState<'stripe' | 'paypal' | 'manual'>('stripe');
  const [amount, setAmount] = useState(defaultAmount);
  const [description, setDescription] = useState(`SaaS Subscription Fee - ${tenant?.plan?.name || 'Growth Plan'}`);
  const [extendPeriod, setExtendPeriod] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');

  const handleChargeTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResultMsg('');
    setCheckoutUrl('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid charge amount.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch(`/api/superadmin/tenants/${tenant.id}/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider,
          amount: parseFloat(amount),
          description,
          extendPeriod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process tenant charge.');

      setResultMsg(data.message || `Tenant charged $${amount} successfully!`);
      if (data.checkoutUrl) {
        setCheckoutUrl(data.checkoutUrl);
      }

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900 flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl text-slate-900 tracking-tight">Charge Subscription Fee</h2>
              <p className="text-xs text-slate-500 font-medium">Tenant: <strong className="text-slate-900">{tenant?.name}</strong> ({tenant?.slug})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ContextualHelp className="mx-6 mt-4" compact line1="Create and process a subscription charge for the selected tenant store." line2="Confirm the amount, description and payment method carefully because successful charges become billing records." />

        {/* Modal Form */}
        <form onSubmit={handleChargeTenant} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resultMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resultMsg}</span>
            </div>
          )}

          {/* Payment Gateway Selection */}
          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
              Select Payment Gateway
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProvider('stripe')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                  provider === 'stripe'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                }`}
              >
                <span className="text-base">💳</span>
                <span className="text-xs font-extrabold">Stripe</span>
                <span className="text-[9px] text-slate-400">Card Charge</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('paypal')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                  provider === 'paypal'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                }`}
              >
                <span className="text-base">🅿️</span>
                <span className="text-xs font-extrabold">PayPal</span>
                <span className="text-[9px] text-slate-400">Checkout Link</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('manual')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                  provider === 'manual'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                }`}
              >
                <span className="text-base">🏦</span>
                <span className="text-xs font-extrabold">Manual</span>
                <span className="text-[9px] text-slate-400">Direct Wire</span>
              </button>
            </div>
          </div>

          {/* Amount & Description */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Charge Amount ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-extrabold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Active Plan Tier
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs">
                {tenant?.plan?.name || 'Free Plan'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Billing Description / Invoice Ref
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium text-xs focus:outline-none focus:border-indigo-600 focus:bg-white transition"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 pt-1">
            <input
              type="checkbox"
              checked={extendPeriod}
              onChange={(e) => setExtendPeriod(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Extend Subscription Next Billing Date by +1 Month</span>
          </label>

          {checkoutUrl && (
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center justify-between">
              <span>Checkout Link Generated:</span>
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold inline-flex items-center gap-1 hover:bg-indigo-700 transition"
              >
                Open Checkout <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition flex items-center gap-2 ${
                provider === 'stripe'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : provider === 'paypal'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing Charge...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Charge ${amount} via {provider.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
