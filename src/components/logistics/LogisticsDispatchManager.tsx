import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  PenTool, 
  ShieldCheck, 
  DollarSign, 
  Printer, 
  Search, 
  ExternalLink, 
  Zap, 
  Navigation,
  Globe,
  ChevronRight,
  Package
} from 'lucide-react';
import { LogisticsDispatchPlan, LogisticsCarrier } from '../../types';
import { DEFAULT_DISPATCH_PLANS, calculateFreightCost } from '../../utils/logisticsDispatchEngine';

interface LogisticsDispatchManagerProps {
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function LogisticsDispatchManager({ onShowAlert }: LogisticsDispatchManagerProps) {
  const [plans, setPlans] = useState<LogisticsDispatchPlan[]>(DEFAULT_DISPATCH_PLANS);
  const [activeTab, setActiveTab] = useState<'planning' | 'routes' | 'tracking' | 'pod_costing'>('planning');
  const [selectedPlan, setSelectedPlan] = useState<LogisticsDispatchPlan | null>(DEFAULT_DISPATCH_PLANS[0]);

  // POD State
  const [recipientName, setRecipientName] = useState('David Miller');

  const handleBookCourier = (planId: string) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, status: 'Scheduled' } : p));
    onShowAlert?.(`Carrier Courier API Booking dispatched for ${planId}! Tracking number active.`, 'success');
  };

  const handleCapturePOD = (planId: string) => {
    setPlans(prev => prev.map(p => p.id === planId ? { 
      ...p, 
      status: 'Delivered', 
      podSignatureName: recipientName, 
      podTimestamp: new Date().toISOString() 
    } : p));
    onShowAlert?.(`Digital Proof of Delivery (POD) signed by ${recipientName} for ${planId}!`, 'success');
  };

  const handleOptimizeRoutes = () => {
    // Sort plans by sequence index
    setPlans(prev => [...prev].sort((a, b) => a.routeSequenceIndex - b.routeSequenceIndex));
    onShowAlert?.('Delivery Route Optimization executed! 3 stops sorted by minimum travel distance.', 'success');
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/30 border border-blue-400/30 rounded-2xl backdrop-blur-md">
            <Truck className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-blue-950 text-blue-300 rounded border border-blue-800">
              ENTERPRISE LOGISTICS &amp; FREIGHT DISPATCH
            </span>
            <h2 className="text-xl font-black tracking-tight mt-1">Multi-Courier Booking, Route Optimization &amp; Digital POD</h2>
            <p className="text-xs text-slate-400">Carrier API Integrations (Toll, Mainfreight, DHL, StarTrack), Tracking &amp; Freight Costing</p>
          </div>
        </div>

        <button
          onClick={handleOptimizeRoutes}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 font-mono"
        >
          <Navigation className="w-4 h-4" /> Run Route Optimization
        </button>
      </div>

      {/* 7 Logistics Features Ribbon */}
      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="text-slate-400 font-bold uppercase text-[10px] mr-2">Logistics Capabilities:</span>
        {[
          'Shipment Planning', 'Courier Integration', 'Delivery Scheduling', 
          'Route Optimization', 'Tracking Numbers', 'POD (Proof of Delivery)', 'Freight Costing'
        ].map(feat => (
          <span key={feat} className="px-2.5 py-1 bg-slate-900 text-blue-300 rounded-lg border border-slate-800 font-bold">
            {feat}
          </span>
        ))}
      </div>

      {/* Workspace Tabs */}
      <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 flex flex-wrap gap-2 font-sans font-bold">
        <button
          onClick={() => setActiveTab('planning')}
          className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
            activeTab === 'planning' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" /> Shipment Planning &amp; Carrier Booking ({plans.length})
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
            activeTab === 'routes' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Navigation className="w-4 h-4" /> Multi-Stop Route Optimization Engine
        </button>

        <button
          onClick={() => setActiveTab('tracking')}
          className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
            activeTab === 'tracking' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" /> Delivery Scheduling &amp; Live Tracking
        </button>

        <button
          onClick={() => setActiveTab('pod_costing')}
          className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
            activeTab === 'pod_costing' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <PenTool className="w-4 h-4" /> Digital Proof of Delivery (POD) &amp; Freight Costing
        </button>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Shipment Directory */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-sans font-bold">Consignment Plans</h3>
          <div className="space-y-3">
            {plans.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                  selectedPlan?.id === p.id 
                    ? 'bg-slate-900 border-blue-500/50 shadow-xl' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-950 text-blue-300 rounded border border-blue-800">{p.id}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-950 text-purple-300 rounded border border-purple-800">{p.status}</span>
                </div>

                <h4 className="font-bold text-sm text-slate-100 mt-2 font-sans">{p.customerName}</h4>
                <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                  <span>Carrier: <strong className="text-blue-300">{p.carrier}</strong></span>
                  <strong className="text-emerald-400">${p.freightCostAUD.toFixed(2)} AUD</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2-Cols: Shipment Detail Workspace */}
        <div className="lg:col-span-2 space-y-4">
          {selectedPlan ? (
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-950 px-2 py-0.5 rounded border border-blue-800 font-sans">
                    {selectedPlan.carrier} API Connected
                  </span>
                  <h3 className="text-lg font-black text-slate-100 mt-1 font-sans">{selectedPlan.customerName}</h3>
                  <span className="text-xs text-slate-400">Address: {selectedPlan.deliveryAddress}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleBookCourier(selectedPlan.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 font-sans"
                  >
                    <Zap className="w-3.5 h-3.5" /> Book Courier API Dispatch
                  </button>
                </div>
              </div>

              {/* Courier & Tracking Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Live Tracking Number</span>
                  <span className="font-bold text-emerald-400 mt-1 block">{selectedPlan.trackingNumber}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Scheduled Time Window</span>
                  <span className="font-bold text-amber-400 mt-1 block">{selectedPlan.scheduledDeliveryTime}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Route Optimized Sequence</span>
                  <span className="font-bold text-purple-300 mt-1 block">Stop #{selectedPlan.routeSequenceIndex} ({selectedPlan.distanceKm} km)</span>
                </div>
              </div>

              {/* Freight Costing Calculation */}
              {(() => {
                const fc = calculateFreightCost(selectedPlan.weightKg, selectedPlan.volumeCbm, selectedPlan.carrier, selectedPlan.distanceKm);
                return (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <h4 className="font-bold uppercase text-blue-400 text-[10px] font-sans">Freight Costing Breakdown (Actual vs Volumetric CBM)</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                      <div>Actual Weight: <strong className="text-slate-200">{selectedPlan.weightKg} kg</strong></div>
                      <div>Cubic Volume: <strong className="text-purple-300">{selectedPlan.volumeCbm} CBM</strong></div>
                      <div>Cubic Weight: <strong className="text-blue-300">{fc.cubicWeightKg} kg</strong></div>
                      <div>Freight Charge: <strong className="text-emerald-400">${selectedPlan.freightCostAUD.toFixed(2)} AUD</strong></div>
                    </div>
                  </div>
                );
              })()}

              {/* Proof of Delivery (POD) Section */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold uppercase text-purple-400 text-[10px] font-sans">Digital Proof of Delivery (POD) Signature Capture</h4>
                {selectedPlan.podSignatureName ? (
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-emerald-400 font-bold">Sign-off Recipient: {selectedPlan.podSignatureName}</span>
                      <span className="text-slate-400 block text-[11px]">Timestamp: {selectedPlan.podTimestamp}</span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-950 text-emerald-400 font-bold rounded-lg border border-emerald-800">
                      POD Signed &amp; Archived
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Recipient Signee Name"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-white text-xs font-mono"
                    />
                    <button
                      onClick={() => handleCapturePOD(selectedPlan.id)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md font-sans uppercase"
                    >
                      Capture Digital POD
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 p-12 rounded-3xl border border-slate-800 text-center space-y-3 text-slate-400 font-sans">
              <Truck className="w-10 h-10 mx-auto text-blue-400 opacity-60" />
              <h4 className="font-bold text-sm text-slate-200">Select a Consignment Dispatch Plan</h4>
              <p className="text-xs max-w-sm mx-auto">Select a shipment record from the left panel to inspect courier API status, route sequence, tracking numbers, and digital POD.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
