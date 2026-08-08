import React, { useState } from 'react';
import { 
  Warehouse, 
  Boxes, 
  Scan, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Truck, 
  ShieldCheck, 
  Printer, 
  Layers, 
  Zap, 
  Search, 
  QrCode, 
  Map,
  PackageCheck,
  ChevronRight
} from 'lucide-react';
import { WMSWarehouseZone, WMSShipmentPickTask, WMSCycleCountAudit, WMSPickingStrategy } from '../../types';
import { DEFAULT_WMS_ZONES, DEFAULT_PICKING_TASKS, DEFAULT_CYCLE_AUDITS } from '../../utils/wmsEngine';

interface WMSSystemManagerProps {
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function WMSSystemManager({ onShowAlert }: WMSSystemManagerProps) {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'picking_strategies' | 'map_optimization' | 'mobile_app' | 'cycle_counting'>('pipeline');
  const [tasks, setTasks] = useState<WMSShipmentPickTask[]>(DEFAULT_PICKING_TASKS);
  const [zones, setZones] = useState<WMSWarehouseZone[]>(DEFAULT_WMS_ZONES);
  const [audits, setAudits] = useState<WMSCycleCountAudit[]>(DEFAULT_CYCLE_AUDITS);
  const [selectedTask, setSelectedTask] = useState<WMSShipmentPickTask | null>(DEFAULT_PICKING_TASKS[0]);

  // Mobile App State
  const [scannedBarcode, setScannedBarcode] = useState('');

  const handleCompletePick = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Packed' } : t));
    onShowAlert?.(`Pick Task ${taskId} verified and sent to Packing Station!`, 'success');
  };

  const handleApproveAuditVariance = (auditId: string) => {
    setAudits(prev => prev.map(a => a.id === auditId ? { ...a, status: 'Variance Approved' } : a));
    onShowAlert?.(`Cycle count variance approved for Audit ${auditId}! Inventory reconciled.`, 'success');
  };

  const handleSimulateMobileScan = () => {
    if (!scannedBarcode.trim()) {
      onShowAlert?.('Please enter or scan a barcode.', 'error');
      return;
    }
    onShowAlert?.(`Barcode "${scannedBarcode}" verified! Item matched to Pick Task ${selectedTask?.id}`, 'success');
    setScannedBarcode('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl text-slate-900 dark:text-white shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-600/30 border border-emerald-200 dark:border-emerald-400/30 rounded-2xl backdrop-blur-md">
            <Warehouse className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 rounded border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
              WAREHOUSES AND STOCK
            </span>
            <h2 className="text-xl font-black tracking-tight mt-1 text-slate-900 dark:text-white">Pick, Pack, Ship, Wave Picking &amp; Mobile Floor App</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Receiving, AI Put-Away, 2D Zone Maps, Bin Slotting Optimization &amp; Cycle Counting</p>
          </div>
        </div>
      </div>

      {/* 14 WMS Features Ribbon */}
      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 font-mono text-[11px]">
        <span className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] mr-2">Warehouse Capabilities:</span>
        {[
          'Receiving', 'AI Put-Away', 'Picking', 'Packing', 'Shipping', 
          'Wave Picking', 'Zone Picking', 'Batch Picking', 'Bin Optimization', 
          'Barcode Scanning', 'Mobile Warehouse App', 'Warehouse 2D Maps', 'Cycle Counting', 'Stock Audits'
        ].map(feat => (
          <span key={feat} className="px-2.5 py-1 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 rounded-lg border border-slate-200 dark:border-slate-800 font-bold shadow-2xs">
            {feat}
          </span>
        ))}
      </div>

      {/* Workspace Tabs */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 shadow-xs">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'pipeline' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <PackageCheck className="w-4 h-4" /> Pick, Pack &amp; Ship Pipeline ({tasks.length})
        </button>

        <button
          onClick={() => setActiveTab('picking_strategies')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'picking_strategies' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" /> Wave, Zone &amp; Batch Picking
        </button>

        <button
          onClick={() => setActiveTab('map_optimization')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'map_optimization' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Map className="w-4 h-4" /> Interactive 2D Map &amp; Bin Optimization
        </button>

        <button
          onClick={() => setActiveTab('mobile_app')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'mobile_app' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4" /> Mobile Warehouse Scanner App
        </button>

        <button
          onClick={() => setActiveTab('cycle_counting')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'cycle_counting' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Cycle Counting &amp; Stock Audits
        </button>
      </div>

      {/* TAB 1: PICK, PACK & SHIP PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
          {/* Left Column: Tasks Directory */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans font-bold">Warehouse Pick Tasks</h3>
            <div className="space-y-3">
              {tasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                    selectedTask?.id === t.id 
                      ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-md' 
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">{t.id}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">{t.status}</span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2 font-sans">{t.customerName}</h4>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                    <span>Strategy: <strong className="text-purple-700 dark:text-purple-300">{t.strategy}</strong></span>
                    <strong className="text-slate-800 dark:text-slate-200">{t.items.length} Lines</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 2-Cols: Pick Task Details */}
          <div className="lg:col-span-2 space-y-4">
            {selectedTask ? (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-sans">
                      {selectedTask.strategy}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1 font-sans">{selectedTask.customerName}</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Target Zone: {selectedTask.targetZone} &bull; Assigned Picker: {selectedTask.assignedPicker}</span>
                  </div>

                  <button
                    onClick={() => handleCompletePick(selectedTask.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 font-sans"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete Pick &amp; Send to Packing
                  </button>
                </div>

                {/* Items to Pick Table */}
                <div className="space-y-2">
                  <h4 className="font-bold uppercase text-slate-500 dark:text-slate-400 text-[10px] font-sans">Directed Bin Locations &amp; Picking Progress</h4>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] uppercase bg-slate-100 dark:bg-slate-900">
                          <th className="p-3">SKU</th>
                          <th className="p-3">Item Description</th>
                          <th className="p-3">Warehouse Bin Location</th>
                          <th className="p-3 text-right">Requested Qty</th>
                          <th className="p-3 text-right">Picked Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                        {selectedTask.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 text-[10px]">{item.sku}</span>
                            </td>
                            <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{item.productName}</td>
                            <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">{item.binLocation}</td>
                            <td className="p-3 text-right font-bold">{item.requestedQty}</td>
                            <td className="p-3 text-right font-bold text-purple-700 dark:text-purple-300">{item.pickedQty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 text-slate-500 dark:text-slate-400 font-sans">
                <Warehouse className="w-10 h-10 mx-auto text-emerald-500 opacity-60" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-200">Select a Pick Task</h4>
                <p className="text-xs max-w-sm mx-auto">Select a picking task from the left panel to inspect directed warehouse bin coordinates and picking progress.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: INTERACTIVE 2D MAP & BIN OPTIMIZATION */}
      {activeTab === 'map_optimization' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 font-mono text-xs shadow-xs">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100 font-sans">2D Warehouse Layout Map &amp; Bin Utilization</h3>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
              AI Slotting &amp; Bin Optimization Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {zones.map(z => (
              <div key={z.zoneId} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-blue-50 text-blue-700 rounded border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">{z.zoneId}</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{z.capacityUtilizationPercent}% Full</span>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-sans">{z.zoneName}</h4>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-900">
                  <div>Aisles: <strong className="text-slate-800 dark:text-slate-200">{z.aislesCount} Aisles</strong></div>
                  <div>Used Bins: <strong className="text-slate-800 dark:text-slate-200">{z.usedBins} / {z.totalBins} Bins</strong></div>
                  <div>Primary Cargo: <strong className="text-purple-700 dark:text-purple-300">{z.primaryCategory}</strong></div>
                </div>

                {/* Visual Capacity Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-300 dark:border-slate-800">
                  <div 
                    className={`h-full ${z.capacityUtilizationPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${z.capacityUtilizationPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MOBILE WAREHOUSE SCANNER APP */}
      {activeTab === 'mobile_app' && (
        <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 font-mono text-xs max-w-lg mx-auto shadow-lg">
          <div className="text-center space-y-1 border-b border-slate-200 dark:border-slate-800 pb-4">
            <Smartphone className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 uppercase font-sans">Mobile Warehouse Floor Scanner</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Handheld RF Barcode Scanner Interface</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Current Task: PICK-9901</span>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Target Bin: Aisle A4-Bay 12-Shelf 3</div>
            <div className="text-xs text-slate-800 dark:text-slate-200">Item: Dell Latitude 5420 Laptop i7</div>
          </div>

          <div className="space-y-2">
            <label className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">Scan Barcode / QR Code:</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 9312345678901"
                value={scannedBarcode}
                onChange={e => setScannedBarcode(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-slate-900 dark:text-white font-mono"
              />
              <button
                onClick={handleSimulateMobileScan}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md font-sans uppercase"
              >
                Scan Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CYCLE COUNTING & AUDITS */}
      {activeTab === 'cycle_counting' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 font-mono text-xs shadow-xs">
          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100 font-sans">Cycle Counting &amp; Stock Audit Variance Logs</h3>
          <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] uppercase bg-slate-100 dark:bg-slate-900">
                  <th className="p-3">Audit ID</th>
                  <th className="p-3">Bin Location</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3 text-right">System Qty</th>
                  <th className="p-3 text-right">Counted Qty</th>
                  <th className="p-3 text-right">Variance Qty</th>
                  <th className="p-3">Auditor</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {audits.map(a => (
                  <tr key={a.id}>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 text-[10px]">{a.id}</span>
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{a.binLocation}</td>
                    <td className="p-3 text-blue-700 dark:text-blue-300 font-bold">{a.skuCode}</td>
                    <td className="p-3 text-right">{a.systemQty}</td>
                    <td className="p-3 text-right font-bold text-purple-700 dark:text-purple-300">{a.countedQty}</td>
                    <td className="p-3 text-right font-bold text-amber-600 dark:text-amber-400">{a.varianceQty > 0 ? `+${a.varianceQty}` : a.varianceQty}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{a.auditorName}</td>
                    <td className="p-3 text-right">
                      {a.status === 'Pending Audit' && (
                        <button
                          onClick={() => handleApproveAuditVariance(a.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm font-sans"
                        >
                          Approve Variance
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
