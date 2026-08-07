import React, { useState, useEffect } from 'react';
import { Store, ShieldCheck, Zap, Globe, Sparkles, Check, ArrowRight, Server, Users, DollarSign, Layers } from 'lucide-react';

interface SaaSLandingPageProps {
  onOpenOnboarding: (planCode?: string) => void;
  onOpenSuperAdmin: () => void;
  onOpenStoreERP: () => void;
  onOpenLogin?: () => void;
}

export const SaaSLandingPage: React.FC<SaaSLandingPageProps> = ({
  onOpenOnboarding,
  onOpenSuperAdmin,
  onOpenStoreERP,
  onOpenLogin,
}) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetch('/api/onboarding/plans')
      .then((res) => res.json())
      .then((data) => {
        if (data.plans) setPlans(data.plans);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl" />
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">
                StoreERP
              </span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
                Hardware ERP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenLogin || onOpenSuperAdmin}
              className="text-sm font-semibold text-slate-300 hover:text-white transition px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800"
            >
              Sign In / Login
            </button>

            <button
              onClick={onOpenSuperAdmin}
              className="text-sm font-medium text-purple-400 hover:text-purple-300 transition px-4 py-2 rounded-lg hover:bg-purple-500/10 border border-purple-500/20"
            >
              Super Admin Portal
            </button>

            <button
              onClick={() => onOpenOnboarding()}
              className="text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition flex items-center gap-2"
            >
              Launch Your Store <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>


      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 mb-8 text-sm text-indigo-400 font-medium">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Computer Hardware Business ERP Platform</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight max-w-5xl mx-auto">
          Intelligent ERP Solution for Computer Hardware Businesses <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Information Powerhouse
          </span>
        </h1>

        <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
          Manage inventory, procurement, sales, POS, warranty tracking, service jobs, and finance for your computer hardware business from one unified ERP workspace.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <button
            onClick={() => onOpenOnboarding('GROWTH')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white font-bold text-lg shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition duration-200"
          >
            Start Your ERP Setup
          </button>
          <button
            onClick={onOpenStoreERP}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold text-lg hover:bg-slate-800 transition"
          >
            Explore Live ERP
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left mt-16">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <Globe className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Multi-Branch Operations</h3>
            <p className="text-sm text-slate-400">
              Operate retail outlets, warehouse counters, and service desks with centralized control and branch-level visibility.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <ShieldCheck className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Stock Accuracy & Traceability</h3>
            <p className="text-sm text-slate-400">
              Track serial numbers, batches, warranty status, and movement history so every hardware item is accounted for.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <DollarSign className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Sales, Margins & Finance</h3>
            <p className="text-sm text-slate-400">
              Control quotations, invoices, receivables, payables, and profitability with built-in financial workflows.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <Layers className="w-8 h-8 text-pink-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Service & Repair Management</h3>
            <p className="text-sm text-slate-400">
              Handle diagnostics, repair queues, spare parts usage, technician assignments, and turnaround tracking in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Flexible Hardware ERP Plans</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-8">
            Choose the right ERP package for your computer hardware retail, wholesale, and repair operations.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                billingCycle === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yearly Billing
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.priceMonthly : Math.round(plan.priceYearly / 12);
            const features = JSON.parse(plan.featuresJson || '[]');

            return (
              <div
                key={plan.id}
                className={`relative p-8 rounded-3xl transition duration-300 flex flex-col justify-between ${
                  plan.isPopular
                    ? 'bg-gradient-to-b from-indigo-950/80 via-slate-900 to-slate-900 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-105'
                    : 'bg-slate-900/60 border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs shadow-md">
                    MOST POPULAR
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-xs text-slate-400 min-h-[36px] mb-6">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-white">${price}</span>
                    <span className="text-slate-400 text-sm"> / month</span>
                  </div>

                  <ul className="space-y-3 text-sm text-slate-300 mb-8">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Up to <strong>{plan.maxProducts.toLocaleString()}</strong> Products</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Up to <strong>{plan.maxStaff}</strong> Staff Accounts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check
                        className={`w-4 h-4 shrink-0 ${
                          plan.customDomainAllowed ? 'text-emerald-400' : 'text-slate-600'
                        }`}
                      />
                      <span className={plan.customDomainAllowed ? 'font-semibold text-indigo-300' : 'text-slate-500'}>
                        Custom Top-Level Domain
                      </span>
                    </li>

                    {features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => onOpenOnboarding(plan.code)}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition ${
                    plan.isPopular
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  Choose {plan.name}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-12 px-6 text-center text-sm text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-slate-300">StoreERP Hardware Business ERP</span>
          </div>
          <p>© 2026 StoreERP Inc. Built for computer hardware inventory, sales, procurement, and service excellence.</p>
        </div>
      </footer>
    </div>
  );
};
