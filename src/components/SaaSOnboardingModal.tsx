import React, { useState } from 'react';
import { X, Store, Globe, Check, AlertCircle, Sparkles, Loader2, ArrowRight } from 'lucide-react';

interface SaaSOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlanCode?: string;
  onSuccess: (data: any) => void;
}

export const SaaSOnboardingModal: React.FC<SaaSOnboardingModalProps> = ({
  isOpen,
  onClose,
  initialPlanCode = 'GROWTH',
  onSuccess,
}) => {
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlanCode, setSelectedPlanCode] = useState(initialPlanCode);

  const [loading, setLoading] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleStoreNameChange = (name: string) => {
    setStoreName(name);
    if (!slug || step === 1) {
      const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
      checkSlugAvailability(generatedSlug);
    }
  };

  const checkSlugAvailability = async (candidateSlug: string) => {
    if (!candidateSlug || candidateSlug.length < 2) return;
    try {
      setSlugChecking(true);
      const res = await fetch('/api/onboarding/check-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: candidateSlug }),
      });
      const data = await res.json();
      setSlugAvailable(data.available);
    } catch (err) {
      console.error(err);
    } finally {
      setSlugChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!storeName || !slug || !email || !password || !ownerName) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/onboarding/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          slug,
          customDomain: customDomain ? customDomain.trim() : undefined,
          ownerName,
          email,
          password,
          planCode: selectedPlanCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to provision store.');
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-950/50 to-purple-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Create Your Store ERP</h2>
              <p className="text-xs text-slate-400">Step {step} of 2 - Store & Domain Configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Store Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Hardware Store"
                  value={storeName}
                  onChange={(e) => handleStoreNameChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Subdomain Slug *
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="apex-hardware"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      checkSlugAvailability(e.target.value);
                    }}
                    className="w-full pl-4 pr-32 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition text-sm font-mono"
                  />
                  <span className="absolute right-3 text-xs text-slate-500 font-mono pointer-events-none">
                    .infomats.net
                  </span>

                </div>

                {slugChecking && (
                  <p className="text-xs text-indigo-400 mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                  </p>
                )}
                {slugAvailable === true && (
                  <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Subdomain is available!
                  </p>
                )}
                {slugAvailable === false && (
                  <p className="text-xs text-rose-400 mt-1">Subdomain is already taken.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-indigo-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  Custom Top-Level Domain (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. apexhardware.com"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-indigo-500/30 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition font-mono text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  You can connect your own top-level domain (<code className="text-indigo-300">yourbrand.com</code>). Can also be configured later in Store Settings.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!storeName || !slug}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition flex items-center gap-2"
                >
                  Continue to Owner Account <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Store Owner Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Owner Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="jane@apexhardware.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Subscription Plan Tier
                </label>
                <select
                  value={selectedPlanCode}
                  onChange={(e) => setSelectedPlanCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="FREE">Free Starter ($0/mo - 25 Products)</option>
                  <option value="STARTER">Growth Store ($29/mo - 250 Products)</option>
                  <option value="GROWTH">Pro Brand ($79/mo - Custom Domain + 2,500 Products)</option>
                  <option value="ENTERPRISE">Enterprise ERP ($199/mo - Unlimited)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  ← Back to Store Info
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Provisioning Store...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Launch Store ERP
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
