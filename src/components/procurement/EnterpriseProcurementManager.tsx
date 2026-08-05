import React, { useState } from 'react';
import { 
  Building2, 
  Globe, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Boxes, 
  Ship, 
  Truck, 
  ShieldCheck, 
  Award, 
  Plus, 
  Search, 
  Printer, 
  ChevronRight, 
  Layers, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { EnterpriseProcurementRFQ, SupplierQuoteBid } from '../../types';
import { DEFAULT_PROCUREMENT_RFQS, calculateLandedCostAllocation } from '../../utils/enterpriseProcurementEngine';

interface EnterpriseProcurementManagerProps {
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function EnterpriseProcurementManager({ onShowAlert }: EnterpriseProcurementManagerProps) {
  const [rfqs, setRfqs] = useState<EnterpriseProcurementRFQ[]>(DEFAULT_PROCUREMENT_RFQS);
  const [activeTab, setActiveTab] = useState<'rfqs' | 'comparison' | 'approvals' | 'landed_costs'>('rfqs');
  const [selectedRFQ, setSelectedRFQ] = useState<EnterpriseProcurementRFQ | null>(DEFAULT_PROCUREMENT_RFQS[0]);

  const handleApprovePurchase = (rfqId: string) => {
    setRfqs(prev => prev.map(r => r.id === rfqId ? { ...r, status: 'Contract Approved' } : r));
    onShowAlert?.(`Manager Approval granted for ${rfqId}! Purchase Order generated.`, 'success');
  };

  const handleReceiveContainer = (rfqId: string) => {
    setRfqs(prev => prev.map(r => r.id === rfqId ? { ...r, status: 'Container Received' } : r));
    onShowAlert?.(`40ft Sea Freight Container received for ${rfqId}! Landed costs allocated to stock.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl text-slate-900 dark:text-white shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-600/30 border border-purple-200 dark:border-purple-400/30 rounded-2xl backdrop-blur-md">
            <Globe className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-purple-50 text-purple-700 rounded border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
              ENTERPRISE GLOBAL PROCUREMENT SUITE
            </span>
            <h2 className="text-xl font-black tracking-tight mt-1 text-slate-900 dark:text-white">RFQs, Multi-Currency Bids &amp; Landed Cost Allocation</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Side-by-Side Supplier Quotations, Container Receiving &amp; Manager Approvals</p>
          </div>
        </div>
      </div>

      {/* 13 Procurement Features Ribbon */}
      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 font-mono text-[11px]">
        <span className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] mr-2">Purchasing Features:</span>
        {[
          'RFQs', 'Multiple Supplier Quotes', 'Supplier Comparison Matrix', 'Purchase Approvals', 
          'Purchase Contracts', 'Purchase Orders', 'Partial Receiving (GRN)', 'Container Receiving', 
          'Landed Cost Allocation', 'Freight Allocation', 'Duty Allocation', 'Customs Charges', 'Multi-Currency FX'
        ].map(feat => (
          <span key={feat} className="px-2.5 py-1 bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 rounded-lg border border-slate-200 dark:border-slate-800 font-bold shadow-2xs">
            {feat}
          </span>
        ))}
      </div>

      {/* Toolbar & Tabs */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('rfqs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'rfqs' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> Global RFQs &amp; Bids ({rfqs.length})
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'comparison' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" /> Side-by-Side Supplier Comparison Matrix
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'approvals' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Manager Purchase Approvals
          </button>

          <button
            onClick={() => setActiveTab('landed_costs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'landed_costs' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Landed Cost Allocation Engine
          </button>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
        {/* Left Column: RFQs Directory */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">Active Global RFQs</h3>
          <div className="space-y-3">
            {rfqs.map(rfq => (
              <div
                key={rfq.id}
                onClick={() => setSelectedRFQ(rfq)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                  selectedRFQ?.id === rfq.id 
                    ? 'bg-white dark:bg-slate-900 border-purple-500 shadow-md' 
                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-50 text-purple-700 rounded border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">{rfq.id}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">{rfq.status}</span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2 font-sans">{rfq.title}</h4>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                  <span>Qty: <strong>{rfq.requestedQty} Units</strong></span>
                  <strong className="text-emerald-600 dark:text-emerald-400">${rfq.poTotalAUD.toLocaleString()} AUD</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2-Cols: Selected RFQ Detail Workspace */}
        <div className="lg:col-span-2 space-y-4">
          {selectedRFQ ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800 font-sans">
                    {selectedRFQ.status}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1 font-sans">{selectedRFQ.title}</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Target Item: {selectedRFQ.targetSKU}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprovePurchase(selectedRFQ.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 font-sans"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Approve Purchase Order
                  </button>

                  <button
                    onClick={() => handleReceiveContainer(selectedRFQ.id)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 font-sans"
                  >
                    <Ship className="w-3.5 h-3.5" /> Receive 40ft Container (GRN)
                  </button>
                </div>
              </div>

              {/* Side-by-Side Supplier Bids Matrix */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase text-slate-500 dark:text-slate-400 text-[10px] font-sans">Multiple Supplier Quotations &amp; FX Rate Matrix</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {selectedRFQ.quotes.map(q => (
                    <div
                      key={q.supplierId}
                      className={`p-4 rounded-2xl border ${
                        selectedRFQ.winningSupplierId === q.supplierId ? 'bg-slate-50 dark:bg-slate-950 border-purple-500 shadow-md' : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                          {q.currency} Bid
                        </span>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Score: {q.qualityScore}/100</span>
                      </div>

                      <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-2 font-sans">{q.supplierName}</h5>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 mt-2">
                        <div>Quoted FX Price: <strong>{q.quotedUnitPrice.toFixed(2)} {q.currency}</strong></div>
                        <div>Converted AUD: <strong className="text-emerald-600 dark:text-emerald-400">${q.unitPriceAUD.toFixed(2)} AUD</strong></div>
                        <div>Lead Time: <strong>{q.leadTimeDays} Days</strong></div>
                        <div>Terms: <strong>{q.paymentTerms}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Landed Cost Allocation Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold uppercase text-purple-700 dark:text-purple-400 text-[10px] font-sans">Landed Cost Allocation Breakdown (Sea Freight, Duty &amp; Customs)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>Sea Freight: <strong className="text-slate-800 dark:text-slate-200">${selectedRFQ.freightCostAUD.toFixed(2)} AUD</strong></div>
                  <div>Import Duty Tax: <strong className="text-purple-700 dark:text-purple-300">${selectedRFQ.dutyTaxAUD.toFixed(2)} AUD</strong></div>
                  <div>Customs Charges: <strong className="text-blue-700 dark:text-blue-300">${selectedRFQ.customsChargesAUD.toFixed(2)} AUD</strong></div>
                  <div>Allocated Cost / Unit: <strong className="text-emerald-600 dark:text-emerald-400">+${selectedRFQ.allocatedLandedCostPerUnit.toFixed(2)} AUD</strong></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 text-slate-500 dark:text-slate-400 font-sans">
              <Globe className="w-10 h-10 mx-auto text-purple-500 opacity-60" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-200">Select a Procurement RFQ</h4>
              <p className="text-xs max-w-sm mx-auto">Select an RFQ from the left panel to inspect side-by-side supplier quotation bids, FX rates, and landed cost allocations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
