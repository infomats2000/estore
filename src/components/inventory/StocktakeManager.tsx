import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ClipboardCheck, Play, PlusCircle, CheckCircle2, AlertTriangle, Trash2, 
  Search, Scan, FileText, ArrowRight, X, Volume2, Save, Printer, ArrowDownRight, TrendingUp, Sparkles, LayoutGrid, Package, ChevronRight, Check
} from 'lucide-react';
import { Product, StocktakeSession, StocktakeItem, ShrinkageRecord, StocktakeType } from '../../types';
import { useAdminInteractions } from '../../context/AdminInteractionContext';

interface StocktakeManagerProps {
  products: Product[];
  categories: string[];
  stocktakes: StocktakeSession[];
  shrinkageRecords: ShrinkageRecord[];
  onAddStocktake: (session: StocktakeSession) => void;
  onUpdateStocktake: (session: StocktakeSession) => void;
  onAddShrinkageRecord: (record: ShrinkageRecord) => void;
  onUpdateProductStock: (productId: string, newStock: number, reason: string, notes?: string) => void;
}

export default function StocktakeManager({
  products,
  categories,
  stocktakes,
  shrinkageRecords,
  onAddStocktake,
  onUpdateStocktake,
  onAddShrinkageRecord,
  onUpdateProductStock
}: StocktakeManagerProps) {
  const interactions = useAdminInteractions();
  const [activeTab, setActiveTab] = useState<'sessions' | 'counting' | 'variance' | 'shrinkage'>('sessions');

  // Guided counting session states
  const [activeCountingSessionId, setActiveCountingSessionId] = useState<string | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [countFilter, setCountFilter] = useState<'all' | 'uncounted' | 'discrepancy' | 'matched'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const guidedScannerInputRef = useRef<HTMLInputElement>(null);

  // New stocktake session creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<StocktakeType>('Full Stocktake');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedLocationName, setSelectedLocationName] = useState('Main Warehouse');
  const [auditorName, setAuditorName] = useState('Admin auditor');

  // New direct shrinkage write-off state
  const [showShrinkageModal, setShowShrinkageModal] = useState(false);
  const [shrinkProductId, setShrinkProductId] = useState('');
  const [shrinkQty, setShrinkQty] = useState('');
  const [shrinkReason, setShrinkReason] = useState<ShrinkageRecord['reason']>('Shrinkage / Theft');
  const [shrinkNotes, setShrinkNotes] = useState('');

  // Audio beep simulation for barcode scans
  const triggerBeep = (type: 'success' | 'error') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'success') {
        oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.08);
      } else {
        oscillator.frequency.setValueAtTime(320, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.25);
      }
    } catch (err) {
      console.warn('Web Audio blocked or unsupported:', err);
    }
  };

  // Get active session
  const activeSession = useMemo(() => {
    return stocktakes.find(s => s.id === activeCountingSessionId) || null;
  }, [stocktakes, activeCountingSessionId]);

  // Set initial focus in counting mode
  useEffect(() => {
    if (activeTab === 'counting' && guidedScannerInputRef.current) {
      guidedScannerInputRef.current.focus();
    }
  }, [activeTab, activeCountingSessionId]);

  // Auto start/resume first active count if tab clicked
  useEffect(() => {
    if (activeTab === 'counting' && !activeCountingSessionId) {
      const firstActive = stocktakes.find(s => s.status === 'In Progress');
      if (firstActive) {
        setActiveCountingSessionId(firstActive.id);
      }
    }
  }, [activeTab, stocktakes, activeCountingSessionId]);

  // Create new stocktake session
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Filter products to count
    let targetProducts = [...products];
    if (newType === 'Category Cycle Count' && selectedCategoryFilter) {
      targetProducts = targetProducts.filter(p => p.category === selectedCategoryFilter);
    }

    const items: StocktakeItem[] = targetProducts.map(p => ({
      productId: p.id,
      productName: p.name,
      sku: p.id,
      barcode: p.specs?.barcode || p.id,
      category: p.category,
      expectedQty: p.stock,
      countedQty: 0,
      variance: -p.stock,
      unitCost: p.costPrice || (p.price * 0.6),
      varianceValue: -p.stock * (p.costPrice || (p.price * 0.6)),
      status: 'Pending'
    }));

    const session: StocktakeSession = {
      id: `STK-${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      status: 'In Progress',
      categoryFilter: newType === 'Category Cycle Count' ? selectedCategoryFilter : undefined,
      locationName: selectedLocationName,
      startDate: new Date().toISOString().split('T')[0],
      conductedBy: auditorName,
      items,
      totalExpectedUnits: items.reduce((sum, i) => sum + i.expectedQty, 0),
      totalCountedUnits: 0,
      netVarianceUnits: items.reduce((sum, i) => sum + i.expectedQty, 0) * -1,
      netVarianceValue: items.reduce((sum, i) => sum + i.varianceValue, 0),
      shrinkageUnits: 0,
      shrinkageValue: 0
    };

    onAddStocktake(session);
    setActiveCountingSessionId(session.id);
    setActiveTab('counting');
    setShowCreateModal(false);
    
    // Reset form
    setNewTitle('');
    setSelectedCategoryFilter('');
  };

  // Perform barcode scan logic
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !barcodeInput.trim()) return;

    const query = barcodeInput.trim().toLowerCase();
    const updatedItems = [...activeSession.items];
    
    // Match by barcode, SKU (product ID), or exact name
    const itemIndex = updatedItems.findIndex(i => 
      i.barcode.toLowerCase() === query || 
      i.productId.toLowerCase() === query
    );

    if (itemIndex !== -1) {
      const item = updatedItems[itemIndex];
      const newCount = item.countedQty + 1;
      const variance = newCount - item.expectedQty;
      const varianceValue = variance * item.unitCost;
      
      updatedItems[itemIndex] = {
        ...item,
        countedQty: newCount,
        variance,
        varianceValue,
        status: (variance === 0 ? 'Matched' : 'Discrepancy') as 'Matched' | 'Discrepancy',
        scannedAt: new Date().toISOString()
      };

      const updatedSession: StocktakeSession = {
        ...activeSession,
        items: updatedItems,
        totalCountedUnits: updatedItems.reduce((sum, i) => sum + i.countedQty, 0),
        netVarianceUnits: updatedItems.reduce((sum, i) => sum + i.variance, 0),
        netVarianceValue: updatedItems.reduce((sum, i) => sum + i.varianceValue, 0)
      };

      onUpdateStocktake(updatedSession);
      triggerBeep('success');
    } else {
      triggerBeep('error');
      void interactions.notify({ title: 'Barcode Not Found', message: `Barcode "${barcodeInput}" is not in the current stocktake schedule.` });
    }

    setBarcodeInput('');
    guidedScannerInputRef.current?.focus();
  };

  // Manual adjustment of counts
  const handleUpdateItemCount = (productId: string, val: number) => {
    if (!activeSession) return;

    const updatedItems = activeSession.items.map(item => {
      if (item.productId === productId) {
        const newCount = Math.max(0, val);
        const variance = newCount - item.expectedQty;
        const varianceValue = variance * item.unitCost;
        return {
          ...item,
          countedQty: newCount,
          variance,
          varianceValue,
          status: (variance === 0 ? 'Matched' : 'Discrepancy') as 'Matched' | 'Discrepancy'
        };
      }
      return item;
    });

    const updatedSession: StocktakeSession = {
      ...activeSession,
      items: updatedItems,
      totalCountedUnits: updatedItems.reduce((sum, i) => sum + i.countedQty, 0),
      netVarianceUnits: updatedItems.reduce((sum, i) => sum + i.variance, 0),
      netVarianceValue: updatedItems.reduce((sum, i) => sum + i.varianceValue, 0)
    };

    onUpdateStocktake(updatedSession);
  };

  // Finalize audit and post adjustments to database
  const handleFinalizeSession = async (sessionId: string) => {
    const session = stocktakes.find(s => s.id === sessionId);
    if (!session) return;

    if (!(await interactions.confirm({ title: 'Finalize Stocktake?', message: 'System stock levels will be updated to match the counted quantities. Review all discrepancies before continuing.', confirmLabel: 'Finalize Stocktake' }))) {
      return;
    }

    // Apply adjustments
    session.items.forEach(item => {
      if (item.variance !== 0) {
        // Adjust product stock
        onUpdateProductStock(
          item.productId, 
          item.countedQty, 
          'Physical Stocktake', 
          `Adjusted via stocktake audit ${session.id}`
        );

        // Record shrinkage if negative variance
        if (item.variance < 0) {
          const qtyShrunk = Math.abs(item.variance);
          onAddShrinkageRecord({
            id: `SHR-${Date.now()}-${item.productId}`,
            stocktakeId: session.id,
            productId: item.productId,
            productName: item.productName,
            category: item.category,
            locationName: session.locationName,
            quantity: qtyShrunk,
            unitCost: item.unitCost,
            totalCostValue: qtyShrunk * item.unitCost,
            reason: 'Shrinkage / Theft',
            date: new Date().toISOString().split('T')[0],
            reportedBy: session.conductedBy,
            actionTaken: 'Stock Adjusted'
          });
        }
      }
    });

    const completedSession: StocktakeSession = {
      ...session,
      status: 'Completed',
      completedDate: new Date().toISOString().split('T')[0]
    };

    onUpdateStocktake(completedSession);
    setActiveCountingSessionId(null);
    setActiveTab('sessions');
  };

  // Direct manual shrinkage write-off form handler
  const handleDirectShrinkageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shrinkProductId || !shrinkQty) return;

    const product = products.find(p => p.id === shrinkProductId);
    if (!product) return;

    const qty = parseInt(shrinkQty);
    if (isNaN(qty) || qty <= 0) return;

    if (qty > product.stock) {
      void interactions.notify({ title: 'Write-off Exceeds Stock', message: `Only ${product.stock} unit(s) are currently available to write off.` });
      return;
    }

    const unitCost = product.costPrice || (product.price * 0.6);
    const totalCostValue = qty * unitCost;

    // 1. Record write-off ledger entry
    onAddShrinkageRecord({
      id: `SHR-DIR-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      category: product.category,
      locationName: 'Main Warehouse',
      quantity: qty,
      unitCost,
      totalCostValue,
      reason: shrinkReason,
      date: new Date().toISOString().split('T')[0],
      reportedBy: 'Store Manager',
      actionTaken: 'Written Off',
      notes: shrinkNotes
    });

    // 2. Deplete product stock
    const newStock = product.stock - qty;
    onUpdateProductStock(
      product.id,
      newStock,
      'Damaged in Transit',
      `Manual Shrinkage Write-off (${shrinkReason}): ${shrinkNotes}`
    );

    setShowShrinkageModal(false);
    setShrinkProductId('');
    setShrinkQty('');
    setShrinkNotes('');
  };

  // Variance analytics metrics
  const totalShrinkageUnits = useMemo(() => {
    return shrinkageRecords.reduce((sum, r) => sum + r.quantity, 0);
  }, [shrinkageRecords]);

  const totalShrinkageValue = useMemo(() => {
    return shrinkageRecords.reduce((sum, r) => sum + r.totalCostValue, 0);
  }, [shrinkageRecords]);

  const cycleAccuracyPercent = useMemo(() => {
    const completed = stocktakes.filter(s => s.status === 'Completed');
    if (completed.length === 0) return 100;
    
    let totalItems = 0;
    let matchedItems = 0;
    completed.forEach(s => {
      s.items.forEach(i => {
        totalItems++;
        if (i.variance === 0) matchedItems++;
      });
    });

    return totalItems > 0 ? Math.round((matchedItems / totalItems) * 100) : 100;
  }, [stocktakes]);

  // Guided count filtered view list
  const filteredCountItems = useMemo(() => {
    if (!activeSession) return [];

    return activeSession.items.filter(item => {
      const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.productId.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (countFilter === 'uncounted') return item.countedQty === 0;
      if (countFilter === 'discrepancy') return item.variance !== 0;
      if (countFilter === 'matched') return item.variance === 0;
      return true;
    });
  }, [activeSession, countFilter, searchQuery]);

  return (
    <div className="space-y-6 text-left animate-fade-in" id="stocktake-workspace">
      
      {/* KPI Headers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 font-sans shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">AUDIT ACCURACY RATE</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{cycleAccuracyPercent}%</span>
            <span className="text-[10px] font-mono text-emerald-500 font-bold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> Target 98%
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 font-sans shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">TOTAL SHRINKAGE LOSS</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">${totalShrinkageValue.toFixed(2)}</span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">{totalShrinkageUnits} Units</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 font-sans shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">ACTIVE AUDITS</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stocktakes.filter(s => s.status === 'In Progress').length}
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">Currently Live</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 font-sans shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">COMPLETED COUNTS</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stocktakes.filter(s => s.status === 'Completed').length}
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">Sessions Logged</span>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 flex gap-1 font-mono text-xs uppercase tracking-wider font-bold">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'sessions' 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ClipboardCheck className="h-4 w-4" /> 1. Stocktake Sessions
        </button>

        <button
          onClick={() => setActiveTab('counting')}
          className={`px-4 py-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'counting' 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Scan className="h-4 w-4" /> 2. Guided Counting Mode {activeSession && <span className="bg-rose-600 text-white rounded-full px-1.5 py-0.5 text-[9px] animate-pulse">ACTIVE</span>}
        </button>

        <button
          onClick={() => setActiveTab('variance')}
          className={`px-4 py-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'variance' 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="h-4 w-4" /> 3. Variance & Audit Reports
        </button>

        <button
          onClick={() => setActiveTab('shrinkage')}
          className={`px-4 py-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'shrinkage' 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Trash2 className="h-4 w-4" /> 4. Shrinkage & Write-offs
        </button>
      </div>

      {/* Tab 1: Sessions list & scheduler */}
      {activeTab === 'sessions' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="font-sans text-sm font-extrabold uppercase text-slate-900 dark:text-white">Active Audit & Cycle Counting Schedules</h3>
              <p className="font-sans text-[11px] text-slate-500 uppercase tracking-wide">Perform cycle counting by category or location to monitor shrinkage during active operations.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-mono text-xs uppercase font-black tracking-wider px-4 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-slate-800 transition-all"
            >
              <PlusCircle className="h-4 w-4" /> Schedule Count Session
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 font-mono text-[9px] uppercase tracking-widest text-slate-400 font-black">
                  <th className="px-4 py-3">Audit Details</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Auditor & Location</th>
                  <th className="px-4 py-3">Count Progress</th>
                  <th className="px-4 py-3">Variance Net</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans text-slate-800 dark:text-slate-100">
                {stocktakes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 font-mono text-slate-400 uppercase tracking-wider">
                      No Scheduled audits found. Click above to schedule a cycle count.
                    </td>
                  </tr>
                ) : (
                  stocktakes.map(session => {
                    const counted = session.items.filter(i => i.countedQty > 0).length;
                    const total = session.items.length;
                    const progressPercent = total > 0 ? Math.round((counted / total) * 100) : 0;

                    return (
                      <tr key={session.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-4 font-sans font-bold">
                          <span className="block font-black uppercase text-slate-900 dark:text-white">{session.title}</span>
                          <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-wide mt-0.5">Session: {session.id} &bull; Started: {session.startDate}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-block bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide">
                            {session.type}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="block font-bold">{session.conductedBy}</span>
                          <span className="block text-[10px] text-slate-400">{session.locationName}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="w-32">
                            <div className="flex justify-between font-mono text-[10px] text-slate-500 font-bold mb-1">
                              <span>Progress:</span><span>{progressPercent}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 w-full">
                              <div className="h-full bg-indigo-600" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <span className="block text-[9px] font-mono text-slate-400 mt-1">{counted} / {total} Items Audited</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono font-bold">
                          <span className={session.netVarianceValue === 0 ? 'text-slate-400' : session.netVarianceValue > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {session.netVarianceValue > 0 ? '+' : ''}${session.netVarianceValue.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-block border px-2 py-0.5 font-mono text-[9px] uppercase font-bold ${
                            session.status === 'Completed' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' :
                            session.status === 'In Progress' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600 animate-pulse' :
                            'border-slate-350 text-slate-500'
                          }`}>
                            {session.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {session.status === 'In Progress' && (
                              <>
                                <button
                                  onClick={() => {
                                    setActiveCountingSessionId(session.id);
                                    setActiveTab('counting');
                                  }}
                                  className="px-2 py-1 bg-indigo-600 text-white font-mono text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
                                  title="Enter Guided Audit Count Mode"
                                >
                                  <Scan className="h-3 w-3" /> Audit
                                </button>
                                <button
                                  onClick={() => handleFinalizeSession(session.id)}
                                  className="px-2 py-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Save className="h-3 w-3" /> Reconcile
                                </button>
                              </>
                            )}
                            {session.status === 'Completed' && (
                              <button
                                onClick={() => {
                                  setActiveCountingSessionId(session.id);
                                  setActiveTab('variance');
                                }}
                                className="px-2 py-1 border border-slate-300 hover:border-slate-900 font-mono text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <FileText className="h-3 w-3" /> View Report
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Guided counting mode */}
      {activeTab === 'counting' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5">
          {!activeSession ? (
            <div className="py-12 text-center space-y-3">
              <ClipboardCheck className="h-10 w-10 text-slate-400 mx-auto" />
              <h4 className="font-mono text-sm font-black uppercase text-slate-900 dark:text-white">No active stocktake session selected</h4>
              <p className="font-sans text-xs text-slate-500 uppercase tracking-wide">Please select or schedule a stocktake session from the "Stocktake Sessions" tab first.</p>
              <button
                onClick={() => setActiveTab('sessions')}
                className="bg-slate-900 text-white px-4 py-2 font-mono text-xs uppercase font-bold cursor-pointer"
              >
                Go to Sessions Tab
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Session Context Banner */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h4 className="font-sans text-xs uppercase font-black text-indigo-600 dark:text-indigo-400">GUIDED COUNT ACTIVE</h4>
                  <h3 className="font-sans text-base font-black uppercase text-slate-900 dark:text-white">{activeSession.title}</h3>
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block mt-1">Conducted by: {activeSession.conductedBy} &bull; Target Location: {activeSession.locationName}</span>
                </div>

                <div className="flex gap-3">
                  <div className="bg-white dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-800 font-mono text-center">
                    <span className="block text-[8px] text-slate-400 uppercase">Items Audited:</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {activeSession.items.filter(i => i.countedQty > 0).length} / {activeSession.items.length}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-800 font-mono text-center">
                    <span className="block text-[8px] text-slate-400 uppercase">Net Variance:</span>
                    <span className={`text-sm font-black ${activeSession.netVarianceValue >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {activeSession.netVarianceValue > 0 ? '+' : ''}${activeSession.netVarianceValue.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleFinalizeSession(activeSession.id)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs uppercase font-black tracking-wider px-4 flex items-center justify-center cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    Finalize count
                  </button>
                </div>
              </div>

              {/* Real-time Barcode Scanner input box */}
              <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-4">
                <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={guidedScannerInputRef}
                      type="text"
                      placeholder="Scan hardware barcode or type SKU (product ID) and press Enter..."
                      value={barcodeInput}
                      onChange={e => setBarcodeInput(e.target.value)}
                      className="w-full border-2 border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-950 rounded-none pl-10 pr-4 py-3 font-sans text-xs outline-none text-slate-900 dark:text-white focus:border-indigo-600 transition-all font-medium"
                    />
                    <Scan className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-indigo-600" />
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs uppercase font-black px-6 cursor-pointer"
                  >
                    Simulate scan
                  </button>
                </form>
                <div className="mt-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-indigo-600 font-bold">
                  <Volume2 className="h-3.5 w-3.5" /> Barcode scanner guided sound triggers enabled (Web Audio API)
                </div>
              </div>

              {/* Items filter and count table */}
              <div className="space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div className="flex gap-1.5 font-mono text-[9px] uppercase font-bold">
                    {(['all', 'uncounted', 'discrepancy', 'matched'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setCountFilter(f)}
                        className={`px-3 py-1.5 border transition-all cursor-pointer ${
                          countFilter === f
                            ? 'bg-slate-900 border-slate-900 text-white font-extrabold'
                            : 'bg-white border-slate-300 text-slate-600 hover:border-slate-900'
                        }`}
                      >
                        {f} ({
                          f === 'all' ? activeSession.items.length :
                          f === 'uncounted' ? activeSession.items.filter(i => i.countedQty === 0).length :
                          f === 'discrepancy' ? activeSession.items.filter(i => i.variance !== 0).length :
                          activeSession.items.filter(i => i.variance === 0).length
                        })
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full max-w-xs">
                    <input
                      type="text"
                      placeholder="Filter items list..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full border border-slate-350 bg-white p-2 pl-8 font-sans text-xs outline-none focus:border-slate-900 text-neutral-900"
                    />
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Counter Table */}
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left font-sans text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                        <th className="px-4 py-3">Product Name / Barcode</th>
                        <th className="px-4 py-3 text-center">Expected (System)</th>
                        <th className="px-4 py-3 text-center">Counted (Physical)</th>
                        <th className="px-4 py-3 text-center">Variance</th>
                        <th className="px-4 py-3 text-right">Value Variance</th>
                        <th className="px-4 py-3 text-center">Audit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans text-slate-800 dark:text-slate-100">
                      {filteredCountItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 font-mono text-slate-400 uppercase tracking-wider">
                            No hardware items matched selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredCountItems.map(item => (
                          <tr key={item.productId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wide">{item.productName}</div>
                              <div className="font-mono text-[10px] text-slate-500 font-bold mt-0.5">Barcode: {item.barcode} &bull; SKU: {item.productId}</div>
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-sm">
                              {item.expectedQty}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="inline-flex items-center gap-1.5 justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemCount(item.productId, item.countedQty - 1)}
                                  className="h-6 w-6 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:text-white flex items-center justify-center font-bold text-neutral-700 cursor-pointer"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={item.countedQty || ''}
                                  onChange={(e) => handleUpdateItemCount(item.productId, parseInt(e.target.value) || 0)}
                                  className="w-12 text-center border border-slate-300 p-1 font-mono font-bold bg-white text-neutral-900 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemCount(item.productId, item.countedQty + 1)}
                                  className="h-6 w-6 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:text-white flex items-center justify-center font-bold text-neutral-700 cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-sm">
                              <span className={item.variance === 0 ? 'text-slate-400' : item.variance > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                {item.variance > 0 ? '+' : ''}{item.variance}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold">
                              <span className={item.varianceValue === 0 ? 'text-slate-400' : item.varianceValue > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                {item.varianceValue > 0 ? '+' : ''}${item.varianceValue.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-block border px-2 py-0.5 font-mono text-[9px] uppercase font-bold ${
                                item.variance === 0 ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' :
                                item.countedQty === 0 ? 'border-slate-300 text-slate-400' :
                                'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                              }`}>
                                {item.variance === 0 ? 'MATCHED' : item.countedQty === 0 ? 'PENDING' : 'VARIANCE'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Variance Reports */}
      {activeTab === 'variance' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="font-sans text-sm font-extrabold uppercase text-slate-900 dark:text-white">Audit Variance & Inventory Discrepancy Records</h3>
              <p className="font-sans text-[11px] text-slate-500 uppercase tracking-wide">Historical log of audit variance events, expected system levels vs. counted stock, and monetary adjustments.</p>
            </div>
            
            <button
              onClick={() => window.print()}
              className="border border-slate-300 hover:border-slate-900 px-4 py-2 font-mono text-xs uppercase font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="h-4 w-4" /> Print Audit Sheet
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Audit Session</th>
                  <th className="px-4 py-3">Product details</th>
                  <th className="px-4 py-3 text-center">Expected</th>
                  <th className="px-4 py-3 text-center">Counted</th>
                  <th className="px-4 py-3 text-center">Variance Units</th>
                  <th className="px-4 py-3 text-right">Cost Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans text-slate-800 dark:text-slate-100">
                {stocktakes.filter(s => s.status === 'Completed').length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 font-mono text-slate-400 uppercase tracking-wider">
                      No completed audit data available. Reconcile an active stocktake session to view variance analysis.
                    </td>
                  </tr>
                ) : (
                  stocktakes.filter(s => s.status === 'Completed').flatMap(s => 
                    s.items.filter(i => i.variance !== 0).map((item, idx) => (
                      <tr key={`${s.id}-${item.productId}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{s.completedDate || s.startDate}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold block uppercase text-slate-900 dark:text-white">{s.title}</span>
                          <span className="block text-[9px] font-mono text-slate-400 uppercase">Ref: {s.id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold block uppercase text-slate-900 dark:text-white">{item.productName}</span>
                          <span className="block text-[9px] font-mono text-slate-400">SKU: {item.productId} &bull; Category: {item.category}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold">{item.expectedQty}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold">{item.countedQty}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-rose-600">
                          {item.variance}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                          ${item.varianceValue.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Damage & Shrinkage write-off ledger */}
      {activeTab === 'shrinkage' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="font-sans text-sm font-extrabold uppercase text-slate-900 dark:text-white">Damage & Theft Write-off Ledger</h3>
              <p className="font-sans text-[11px] text-slate-500 uppercase tracking-wide">Official records of damaged, broken, lost, or stolen hardware written off from the physical assets inventory.</p>
            </div>
            
            <button
              onClick={() => setShowShrinkageModal(true)}
              className="bg-rose-950 dark:bg-rose-900 text-white font-mono text-xs uppercase font-black tracking-wider px-4 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-rose-800 transition-all"
            >
              <Trash2 className="h-4 w-4" /> Record Damage Write-off
            </button>
          </div>

          {/* Shrinkage Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                  <th className="px-4 py-3">Write-Off Ref</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Product Details</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-center">Qty Written Off</th>
                  <th className="px-4 py-3 text-right">Total Cost Value</th>
                  <th className="px-4 py-3">Auditor / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans text-slate-800 dark:text-slate-100">
                {shrinkageRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 font-mono text-slate-400 uppercase tracking-wider">
                      No shrinkage write-offs logged in the ledger.
                    </td>
                  </tr>
                ) : (
                  shrinkageRecords.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-[10px] text-slate-500 uppercase">{record.id}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{record.date}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold block uppercase text-slate-900 dark:text-white">{record.productName}</span>
                        <span className="block text-[9px] font-mono text-slate-400">SKU: {record.productId} &bull; Category: {record.category}</span>
                      </td>
                      <td className="px-4 py-3 font-bold uppercase text-rose-600 dark:text-rose-400">
                        {record.reason}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-sm text-rose-600">{record.quantity} Units</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">${record.totalCostValue.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className="block font-bold">{record.reportedBy}</span>
                        <span className="inline-block bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-500 uppercase font-bold mt-0.5">{record.actionTaken}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Schedule Stocktake count session */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-700 p-6 rounded-none shadow-xl text-left">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-sans text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-indigo-600" /> Schedule Audit Count / Cycle Count
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Audit Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Laptops Rolling Cycle Count"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-350 p-2 font-sans text-xs outline-none focus:border-slate-900 text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Audit Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as StocktakeType)}
                    className="w-full bg-slate-50 border border-slate-350 p-2 font-sans text-xs outline-none focus:border-slate-900 text-neutral-900"
                  >
                    <option value="Full Stocktake">Full Audit Stocktake</option>
                    <option value="Category Cycle Count">Category Cycle Count</option>
                    <option value="Location Cycle Count">Warehouse Location Cycle Count</option>
                    <option value="Spot Audit">Spot / Discrepancy Audit</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Warehouse / Store Location</label>
                  <select
                    value={selectedLocationName}
                    onChange={e => setSelectedLocationName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-350 p-2 font-sans text-xs outline-none focus:border-slate-900 text-neutral-900"
                  >
                    <option value="Main Logistics Hub">Main Logistics Hub</option>
                    <option value="Sydney Showroom">Sydney Showroom</option>
                    <option value="Repair Bay">Repair Bay</option>
                  </select>
                </div>
              </div>

              {newType === 'Category Cycle Count' && (
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Filter by Category</label>
                  <select
                    value={selectedCategoryFilter}
                    onChange={e => setSelectedCategoryFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-350 p-2 font-sans text-xs outline-none focus:border-slate-900 text-neutral-900"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Conducted / Scheduled By</label>
                <input
                  type="text"
                  required
                  value={auditorName}
                  onChange={e => setAuditorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-350 p-2 font-sans text-xs outline-none focus:border-slate-900 text-neutral-900"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="border border-slate-300 hover:border-slate-900 px-4 py-2 font-mono text-xs uppercase font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-950 text-white font-mono text-xs uppercase font-bold px-6 py-2 cursor-pointer hover:bg-slate-800"
                >
                  Start Count Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Write off damaged stock */}
      {showCreateModal === false && showShrinkageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-700 p-6 rounded-none shadow-xl text-left">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-sans text-sm font-black uppercase tracking-wider text-rose-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-rose-600" /> Write-Off Damaged / Broken Stock
              </h3>
              <button onClick={() => setShowShrinkageModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDirectShrinkageSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Select Product</label>
                <select
                  required
                  value={shrinkProductId}
                  onChange={e => setShrinkProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-350 p-2 font-sans text-xs outline-none focus:border-slate-900 text-neutral-900"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Quantity to Write Off</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={shrinkQty}
                    onChange={e => setShrinkQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-350 p-2 font-sans text-xs outline-none focus:border-slate-900 text-neutral-900"
                    placeholder="e.g. 2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Reason Category</label>
                  <select
                    value={shrinkReason}
                    onChange={e => setShrinkReason(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-350 p-2 font-sans text-xs outline-none focus:border-slate-900 text-neutral-900"
                  >
                    <option value="Damaged / Broken">Damaged / Broken</option>
                    <option value="Shrinkage / Theft">Shrinkage / Theft</option>
                    <option value="Expired / Obsolete">Expired / Obsolete</option>
                    <option value="Sample / Demo Usage">Sample / Demo Usage</option>
                    <option value="Data Entry Error">Data Entry Error</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Notes / Explanatory Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why the stock is being written off (e.g., forklift drop in bay B, missing from box on receipt)..."
                  value={shrinkNotes}
                  onChange={e => setShrinkNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-350 p-2 font-sans text-xs outline-none focus:border-slate-900 text-neutral-900"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowShrinkageModal(false)}
                  className="border border-slate-300 hover:border-slate-900 px-4 py-2 font-mono text-xs uppercase font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-950 text-white font-mono text-xs uppercase font-bold px-6 py-2 cursor-pointer hover:bg-rose-800"
                >
                  Write Off Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
