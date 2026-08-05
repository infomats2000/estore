import React, { useState } from 'react';
import { 
  Building2, 
  Award, 
  TrendingUp, 
  ShieldCheck, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Search, 
  Plus, 
  Printer, 
  ChevronRight, 
  History, 
  Activity,
  Zap,
  Globe
} from 'lucide-react';
import { EnterpriseSupplierScorecard } from '../../types';
import { DEFAULT_ENTERPRISE_SUPPLIERS, calculateWeightedSupplierScore } from '../../utils/enterpriseSupplierEngine';

interface EnterpriseSupplierManagerProps {
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function EnterpriseSupplierManager({ onShowAlert }: EnterpriseSupplierManagerProps) {
  const [suppliers, setSuppliers] = useState<EnterpriseSupplierScorecard[]>(DEFAULT_ENTERPRISE_SUPPLIERS);
  const [activeTab, setActiveTab] = useState<'scorecard' | 'contracts' | 'price_history' | 'defects'>('scorecard');
  const [selectedSupplier, setSelectedSupplier] = useState<EnterpriseSupplierScorecard | null>(DEFAULT_ENTERPRISE_SUPPLIERS[0]);

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600/30 border border-purple-400/30 rounded-2xl backdrop-blur-md">
            <Award className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-purple-950 text-purple-300 rounded border border-purple-800">
              ENTERPRISE SUPPLIER PERFORMANCE &amp; SCORECARD SUITE
            </span>
            <h2 className="text-xl font-black tracking-tight mt-1">Master Supply Contracts, Defect Rates &amp; Price History Logs</h2>
            <p className="text-xs text-slate-400">Vendor Scorecards, Lead Times, Delivery Accuracy % &amp; Historical Unit COGS Trends</p>
          </div>
        </div>
      </div>

      {/* 7 Supplier Features Ribbon */}
      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="text-slate-400 font-bold uppercase text-[10px] mr-2">Supplier Capabilities:</span>
        {[
          'Supplier Contracts', 'Price History Logs', 'Lead Times (Days)', 
          'Overall Performance Score (0-100)', 'Defect Rates %', 'Delivery Accuracy %', 'Supplier Scorecards'
        ].map(feat => (
          <span key={feat} className="px-2.5 py-1 bg-slate-900 text-purple-300 rounded-lg border border-slate-800 font-bold">
            {feat}
          </span>
        ))}
      </div>

      {/* Workspace Tabs */}
      <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 flex flex-wrap gap-2 font-sans font-bold">
        <button
          onClick={() => setActiveTab('scorecard')}
          className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
            activeTab === 'scorecard' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" /> Vendor Scorecards &amp; Performance KPIs ({suppliers.length})
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
            activeTab === 'contracts' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" /> Master Supply Contracts
        </button>

        <button
          onClick={() => setActiveTab('price_history')}
          className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
            activeTab === 'price_history' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" /> SKU Purchase Price History Ledger
        </button>

        <button
          onClick={() => setActiveTab('defects')}
          className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
            activeTab === 'defects' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" /> Defect Rate &amp; RMA Warranty Audit
        </button>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Supplier Directory */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-sans font-bold">Evaluated Vendors</h3>
          <div className="space-y-3">
            {suppliers.map(s => (
              <div
                key={s.id}
                onClick={() => setSelectedSupplier(s)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                  selectedSupplier?.id === s.id 
                    ? 'bg-slate-900 border-purple-500/50 shadow-xl' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-950 text-purple-300 rounded border border-purple-800">{s.code}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-400 rounded border border-emerald-800">
                    Score: {s.overallPerformanceScore}/100
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-100 mt-2 font-sans">{s.supplierName}</h4>
                <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                  <span>Accuracy: <strong className="text-emerald-400">{s.deliveryAccuracyPercent}%</strong></span>
                  <strong className="text-amber-400">Defect: {s.defectRatePercent}%</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2-Cols: Scorecard Workspace */}
        <div className="lg:col-span-2 space-y-4">
          {selectedSupplier ? (
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-950 px-2 py-0.5 rounded border border-purple-800 font-sans">
                    {selectedSupplier.code} Scorecard
                  </span>
                  <h3 className="text-lg font-black text-slate-100 mt-1 font-sans">{selectedSupplier.supplierName}</h3>
                  <span className="text-xs text-slate-400">Account Lead: {selectedSupplier.assignedAccountManager}</span>
                </div>

                <div className="px-4 py-2 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-2xl text-center">
                  <span className="text-[10px] uppercase font-bold block text-slate-400">Overall Rating</span>
                  <span className="text-xl font-black">{selectedSupplier.overallPerformanceScore} / 100</span>
                </div>
              </div>

              {/* 4 Scorecard KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Delivery Accuracy %</span>
                  <span className="text-2xl font-black text-emerald-400">{selectedSupplier.deliveryAccuracyPercent}%</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-purple-500/40 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">On-Time Delivery Rate</span>
                  <span className="text-2xl font-black text-purple-400">{selectedSupplier.onTimeDeliveryRatePercent}%</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Defect / RMA Rate %</span>
                  <span className="text-2xl font-black text-amber-400">{selectedSupplier.defectRatePercent}%</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-blue-500/40 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Avg Lead Time</span>
                  <span className="text-2xl font-black text-blue-400">{selectedSupplier.avgLeadTimeDays} Days</span>
                </div>
              </div>

              {/* Master Contracts List */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase text-slate-400 text-[10px] font-sans">Active Supply Contracts &amp; Commitments</h4>
                {selectedSupplier.contracts.map(c => (
                  <div key={c.contractId} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-100 font-sans text-xs">{c.title}</span>
                      <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 text-[10px] font-bold rounded border border-emerald-800">{c.status}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-300">
                      <div>Minimum Spend: <strong className="text-slate-100">${c.minimumSpendAUD.toLocaleString()} AUD</strong></div>
                      <div>Current YTD Spend: <strong className="text-emerald-400">${c.currentSpendAUD.toLocaleString()} AUD</strong></div>
                      <div>Discount Tier: <strong className="text-purple-300">{c.discountTier}</strong></div>
                      <div>Expiry Date: <strong className="text-amber-400">{c.expiryDate}</strong></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* SKU Purchase Price History */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase text-slate-400 text-[10px] font-sans">Historical SKU Purchase Price Ledger</h4>
                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                        <th className="p-3">Date</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Hardware Product Description</th>
                        <th className="p-3 text-right">Unit Price (AUD)</th>
                        <th className="p-3 text-right">Price Variance %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {selectedSupplier.priceHistory.map(ph => (
                        <tr key={ph.id}>
                          <td className="p-3 text-slate-400">{ph.date}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-blue-950 text-blue-300 font-bold rounded border border-blue-800 text-[10px]">{ph.sku}</span>
                          </td>
                          <td className="p-3 font-bold text-slate-100">{ph.productName}</td>
                          <td className="p-3 text-right font-bold text-emerald-400">${ph.priceAUD.toFixed(2)}</td>
                          <td className="p-3 text-right font-bold text-purple-300">{ph.changePercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 p-12 rounded-3xl border border-slate-800 text-center space-y-3 text-slate-400 font-sans">
              <Award className="w-10 h-10 mx-auto text-purple-400 opacity-60" />
              <h4 className="font-bold text-sm text-slate-200">Select a Supplier Account</h4>
              <p className="text-xs max-w-sm mx-auto">Select a supplier from the left panel to inspect performance scorecards, defect rates, contracts, and price history logs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
