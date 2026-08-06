import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export const CustomDomainSettings: React.FC = () => {
  const [customDomain, setCustomDomain] = useState('');
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);
  const [slug, setSlug] = useState('default-tenant');
  const [planName, setPlanName] = useState('Free Starter');
  const [customDomainAllowed, setCustomDomainAllowed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchStoreInfo();
  }, []);

  const fetchStoreInfo = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setCurrentDomain(data.website || null);
        setCustomDomain(data.website || '');
        setSlug(data.slug || 'default-tenant');
        setPlanName(data.planName || 'Pro Brand');
        setCustomDomainAllowed(data.customDomainAllowed ?? true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const cleanDomain = customDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();

    try {
      setLoading(true);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: cleanDomain }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update custom domain.');
      }

      setCurrentDomain(cleanDomain);
      setMessage({ type: 'success', text: `Custom domain '${cleanDomain}' saved! Update your CNAME/A records to point to our servers.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Custom Top-Level Domain Settings</h2>
            <p className="text-xs text-slate-400">Connect your own brand domain (e.g. www.yourbrand.com)</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 font-semibold text-xs border border-indigo-500/20">
          {planName}
        </span>
      </div>

      {/* Default Subdomain Card */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 uppercase font-semibold">StoreERP Default Subdomain</span>
          <p className="text-sm font-mono text-indigo-400 font-semibold mt-0.5">
            https://{slug}.infomats.net
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-1 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" /> Active &amp; SSL Secured
        </span>
      </div>


      {/* Custom Domain Form */}
      <form onSubmit={handleSaveDomain} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Custom Domain Name
          </label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="e.g. www.apexhardware.com"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition font-mono text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Save Custom Domain
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </form>

      {/* DNS Configuration Instructions */}
      <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-3">
        <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-indigo-400" /> DNS Setup Instructions for Custom Top-Level Domains
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          To point your custom domain name to StoreERP, add the following DNS records in your domain registrar (e.g. GoDaddy, Namecheap, Cloudflare):
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/20">
            <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold block">A Record</span>
            <div className="text-white mt-1">Host: <code className="text-indigo-300">@</code></div>
            <div className="text-white">Value: <code className="text-emerald-400">76.76.21.21</code></div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/20">
            <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold block">CNAME Record</span>
            <div className="text-white mt-1">Host: <code className="text-indigo-300">www</code></div>
            <div className="text-white">Value: <code className="text-emerald-400">cname.infomats.net</code></div>
          </div>

        </div>
      </div>
    </div>
  );
};
