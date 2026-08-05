import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, AlertTriangle, Cpu, Wrench, ShieldAlert, Award, 
  Trash2, Plus, Info, Scale, BatteryCharging, ShieldCheck, Play, Save, ChevronDown, ChevronRight, ClipboardList
} from 'lucide-react';
import { Product, StockUnit, RefurbGrade, RefurbChecklistCategory, RefurbPartUsed, RefurbInspectionSession } from '../../types';

interface RefurbGradingManagerProps {
  products: Product[];
  stockUnits: StockUnit[];
  onUpdateStockUnit: (unit: StockUnit) => void;
  onShowAlert?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

// Defining the 50 checklist items with unique keys and descriptions
const CHECKLIST_ITEMS: { id: string; label: string; category: RefurbChecklistCategory }[] = [
  // 1. Cosmetic / Exterior
  { id: 'cos-01', label: 'Chassis free of deep scratches / gouges', category: 'Cosmetic' },
  { id: 'cos-02', label: 'Chassis corners free of major denting / drop marks', category: 'Cosmetic' },
  { id: 'cos-03', label: 'Display hinges stable (holds angle, no play)', category: 'Cosmetic' },
  { id: 'cos-04', label: 'Screen bezel intact and firmly glued', category: 'Cosmetic' },
  { id: 'cos-05', label: 'All rubber support feet present on bottom cover', category: 'Cosmetic' },
  { id: 'cos-06', label: 'Bottom panel screws present and not stripped', category: 'Cosmetic' },
  { id: 'cos-07', label: 'Manufacturer logo badges intact', category: 'Cosmetic' },
  { id: 'cos-08', label: 'Speaker grills and cooling vents clean of dust', category: 'Cosmetic' },
  { id: 'cos-09', label: 'Keycaps free of heavy wear / shine', category: 'Cosmetic' },
  { id: 'cos-10', label: 'External ports clean and free of oxidation', category: 'Cosmetic' },

  // 2. Screen & Display
  { id: 'dsp-01', label: 'Uniform backlight (no hot spots / heavy bleed)', category: 'Display' },
  { id: 'dsp-02', label: 'Zero dead or stuck pixels detected', category: 'Display' },
  { id: 'dsp-03', label: 'Screen glass scratch and crack free', category: 'Display' },
  { id: 'dsp-04', label: 'Color calibration and hue uniformity check', category: 'Display' },
  { id: 'dsp-05', label: 'Peak brightness levels meet spec', category: 'Display' },
  { id: 'dsp-06', label: 'Touchscreen digitizer registration (if applicable)', category: 'Display' },
  { id: 'dsp-07', label: 'IPS screen free of pressure bruises / white marks', category: 'Display' },
  { id: 'dsp-08', label: 'Refresh rate stability test', category: 'Display' },
  { id: 'dsp-09', label: 'Ribbon cable connection secure (no flickering)', category: 'Display' },
  { id: 'dsp-10', label: 'Ambient light sensor responsiveness', category: 'Display' },

  // 3. Core Processing & Hardware
  { id: 'hw-01', label: 'CPU stress test passed (no thermal throttling)', category: 'Core Hardware' },
  { id: 'hw-02', label: 'RAM check passed (zero errors in MemTest)', category: 'Core Hardware' },
  { id: 'hw-03', label: 'GPU rendering stability and stress pass', category: 'Core Hardware' },
  { id: 'hw-04', label: 'SSD Health / SMART report (>80% life left)', category: 'Core Hardware' },
  { id: 'hw-05', label: 'Storage sequential read/write benchmarks pass', category: 'Core Hardware' },
  { id: 'hw-06', label: 'Motherboard VRM and capacitor voltage check', category: 'Core Hardware' },
  { id: 'hw-07', label: 'Internal fan spins freely without bearing noise', category: 'Core Hardware' },
  { id: 'hw-08', label: 'Heatsink thermal paste performance (idle < 55°C)', category: 'Core Hardware' },
  { id: 'hw-09', label: 'BIOS / UEFI firmware updated to latest stable', category: 'Core Hardware' },
  { id: 'hw-10', label: 'CMOS battery voltage meets spec (>2.8V)', category: 'Core Hardware' },

  // 4. Battery & Power
  { id: 'pwr-01', label: 'Charge controller correctly communicates health', category: 'Power' },
  { id: 'pwr-02', label: 'Power jack connection tight and charges consistently', category: 'Power' },
  { id: 'pwr-03', label: 'AC Adapter wattage matches system requirements', category: 'Power' },
  { id: 'pwr-04', label: 'Rapid charge speed meets spec rate', category: 'Power' },
  { id: 'pwr-05', label: 'Charging thermal profile (no excessive heat)', category: 'Power' },
  { id: 'pwr-06', label: 'Battery cells voltage balanced in report', category: 'Power' },
  { id: 'pwr-07', label: 'Idle battery discharge rate is stable', category: 'Power' },
  { id: 'pwr-08', label: 'Sleep/wake power draw states working', category: 'Power' },
  { id: 'pwr-09', label: 'Battery physically inspected (no swelling)', category: 'Power' },
  { id: 'pwr-10', label: 'Power supply adapter cable safety check', category: 'Power' },

  // 5. Inputs & Ports Connectivity
  { id: 'con-01', label: 'All keyboard keys register in matrix test', category: 'Connectivity' },
  { id: 'con-02', label: 'Touchpad click, gestures and tracking working', category: 'Connectivity' },
  { id: 'con-03', label: 'Wi-Fi signal strength test (2.4GHz + 5GHz)', category: 'Connectivity' },
  { id: 'con-04', label: 'Bluetooth pairing and audio stream test', category: 'Connectivity' },
  { id: 'con-05', label: 'USB Type-A port speed and power output', category: 'Connectivity' },
  { id: 'con-06', label: 'USB Type-C / Thunderbolt transfer test', category: 'Connectivity' },
  { id: 'con-07', label: 'HDMI / DisplayPort output display detection', category: 'Connectivity' },
  { id: 'con-08', label: 'Webcam feed and autofocus test', category: 'Connectivity' },
  { id: 'con-09', label: 'Dual microphones gain and noise cancel pass', category: 'Connectivity' },
  { id: 'con-10', label: 'Headphone jack audio outputs clean stereo', category: 'Connectivity' },
];

export default function RefurbGradingManager({
  products,
  stockUnits,
  onUpdateStockUnit,
  onShowAlert
}: RefurbGradingManagerProps) {
  // Sidebar selection
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  // Active session workspace states
  const [passedCheckIds, setPassedCheckIds] = useState<string[]>([]);
  const [batteryHealth, setBatteryHealth] = useState<number>(100);
  const [technicianName, setTechnicianName] = useState('Senior Refurb Tech');
  const [laborHours, setLaborHours] = useState<number>(1.5);
  const [laborRate, setLaborRate] = useState<number>(50);
  const [refurbNotes, setRefurbNotes] = useState('');

  // Parts list
  const [partsUsed, setPartsUsed] = useState<RefurbPartUsed[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartCost, setNewPartCost] = useState('');

  // Category accordions expand/collapse
  const [expandedCategories, setExpandedCategories] = useState<Record<RefurbChecklistCategory, boolean>>({
    'Cosmetic': true,
    'Display': false,
    'Core Hardware': false,
    'Power': false,
    'Connectivity': false
  });

  const selectedUnit = useMemo(() => {
    return stockUnits.find(u => u.id === selectedUnitId) || null;
  }, [stockUnits, selectedUnitId]);

  // Load inspection if selected unit already has one
  const handleSelectUnit = (unit: StockUnit) => {
    setSelectedUnitId(unit.id);
    if (unit.refurbSession) {
      setPassedCheckIds(unit.refurbSession.passedChecks);
      setBatteryHealth(unit.refurbSession.batteryHealth);
      setTechnicianName(unit.refurbSession.inspectedBy);
      setLaborHours(unit.refurbSession.laborHours);
      setLaborRate(unit.refurbSession.laborRate);
      setPartsUsed(unit.refurbSession.partsUsed);
      setRefurbNotes(unit.refurbSession.notes || '');
    } else {
      // Set default inputs
      setPassedCheckIds([]);
      setBatteryHealth(100);
      setLaborHours(1.0);
      setLaborRate(50);
      setPartsUsed([]);
      setRefurbNotes('');
    }
  };

  // Toggle category accordion
  const toggleCategory = (cat: RefurbChecklistCategory) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Toggle single checkpoint pass state
  const handleToggleCheck = (id: string) => {
    setPassedCheckIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  // Pass all / Fail all categories shortcuts
  const handleCategoryShortcut = (cat: RefurbChecklistCategory, action: 'pass' | 'fail') => {
    const categoryItemIds = CHECKLIST_ITEMS.filter(i => i.category === cat).map(i => i.id);
    if (action === 'pass') {
      setPassedCheckIds(prev => Array.from(new Set([...prev, ...categoryItemIds])));
    } else {
      setPassedCheckIds(prev => prev.filter(id => !categoryItemIds.includes(id)));
    }
  };

  // Add Refurb Part helper
  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim() || !newPartCost) return;
    const cost = parseFloat(newPartCost);
    if (isNaN(cost) || cost < 0) return;

    setPartsUsed(prev => [...prev, { partName: newPartName.trim(), cost }]);
    setNewPartName('');
    setNewPartCost('');
  };

  const handleRemovePart = (idx: number) => {
    setPartsUsed(prev => prev.filter((_, i) => i !== idx));
  };

  // Score stats calculations
  const totalScore = passedCheckIds.length; // Max 50
  
  // Grade algorithm based on score & battery
  const calculatedGrade: RefurbGrade = useMemo(() => {
    if (totalScore >= 48 && batteryHealth >= 90) return 'A+';
    if (totalScore >= 45 && batteryHealth >= 85) return 'A';
    if (totalScore >= 40 && batteryHealth >= 80) return 'B';
    if (totalScore >= 30 && batteryHealth >= 70) return 'C';
    return 'D';
  }, [totalScore, batteryHealth]);

  // Financial calculations
  const partsCostSum = useMemo(() => {
    return partsUsed.reduce((sum, p) => sum + p.cost, 0);
  }, [partsUsed]);

  const laborCostSum = useMemo(() => {
    return laborHours * laborRate;
  }, [laborHours, laborRate]);

  const purchaseCost = selectedUnit ? selectedUnit.costPrice : 0;
  const trueCOGS = useMemo(() => {
    return purchaseCost + partsCostSum + laborCostSum;
  }, [purchaseCost, partsCostSum, laborCostSum]);

  // Finalize Refurb Session
  const handleFinalizeGrading = () => {
    if (!selectedUnit) return;

    const refurbSession: RefurbInspectionSession = {
      inspectedAt: new Date().toISOString().split('T')[0],
      inspectedBy: technicianName,
      passedChecks: passedCheckIds,
      batteryHealth,
      calculatedGrade,
      purchaseCost,
      partsUsed,
      laborHours,
      laborRate,
      refurbPartsCost: partsCostSum,
      refurbLaborCost: laborCostSum,
      trueCOGS
    };

    const updatedUnit: StockUnit = {
      ...selectedUnit,
      status: 'In Stock',
      grade: calculatedGrade,
      costPrice: trueCOGS, // Update the true COGS as the unit asset's costPrice
      refurbSession,
      notes: refurbNotes || selectedUnit.notes,
      auditLog: [
        {
          date: new Date().toISOString().split('T')[0],
          action: `Graded Refurbished ${calculatedGrade}`,
          performedBy: technicianName,
          notes: `Checklist score: ${totalScore}/50. Battery: ${batteryHealth}%. COGS: $${trueCOGS.toFixed(2)}`
        },
        ...selectedUnit.auditLog
      ]
    };

    onUpdateStockUnit(updatedUnit);
    onShowAlert?.(`Refurbishment graded "${calculatedGrade}" for Serial ${selectedUnit.serialNumber} and listed "In Stock".`, 'success');
  };

  // Grade color helper
  const getGradeColor = (grade: RefurbGrade) => {
    if (grade === 'A+') return 'bg-emerald-600 border-emerald-500 text-white';
    if (grade === 'A') return 'bg-emerald-500 border-emerald-400 text-white';
    if (grade === 'B') return 'bg-blue-600 border-blue-500 text-white';
    if (grade === 'C') return 'bg-amber-500 border-amber-400 text-white';
    return 'bg-rose-600 border-rose-500 text-white';
  };

  return (
    <div className="space-y-6 text-left animate-fade-in" id="refurb-workspace">
      
      {/* KPI stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">IN REPAIR / TESTING</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stockUnits.filter(u => u.status === 'In Repair').length} Units
            </span>
            <span className="text-[10px] font-mono text-amber-500 font-bold">Awaiting Grade</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">GRADED SYSTEM STOCK</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {stockUnits.filter(u => u.grade).length} Units
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">Refurbished Ready</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">AVG PARTS REFURB COST</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ${(stockUnits.filter(u => u.refurbSession).reduce((sum, u) => sum + (u.refurbSession?.refurbPartsCost || 0), 0) / 
                Math.max(1, stockUnits.filter(u => u.refurbSession).length)).toFixed(2)}
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">Per Hardware Unit</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">QUALITY COMPLIANCE</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">100%</span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">50-Point Audited</span>
          </div>
        </div>
      </div>

      {/* Main workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: serialized unit queue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 lg:col-span-1">
          <h3 className="font-sans text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 border-b pb-3">
            <ClipboardList className="h-4 w-4 text-indigo-600" /> Refurbishment & Testing Queue
          </h3>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {stockUnits.length === 0 ? (
              <div className="text-center py-10 font-mono text-slate-400 text-[10px] uppercase">
                No serialized stock units in system.
              </div>
            ) : (
              stockUnits.map(unit => {
                const isSelected = selectedUnitId === unit.id;
                const refurbStatus = unit.status;

                return (
                  <div
                    key={unit.id}
                    onClick={() => handleSelectUnit(unit)}
                    className={`border p-4.5 cursor-pointer text-left transition-all ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20' 
                        : 'border-slate-200 hover:border-slate-900 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono text-[9px] text-slate-400 font-bold block">ID: {unit.id}</span>
                        <h4 className="font-sans text-xs font-extrabold uppercase text-slate-900 dark:text-white mt-0.5">{unit.productName}</h4>
                      </div>
                      {unit.grade && (
                        <span className={`px-1.5 py-0.5 font-mono text-[9px] font-bold ${getGradeColor(unit.grade)}`}>
                          Grade {unit.grade}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3 text-[10px] font-mono font-bold text-slate-500">
                      <span>S/N: {unit.serialNumber}</span>
                      <span>&bull;</span>
                      <span className={`uppercase text-[9px] ${
                        refurbStatus === 'In Repair' ? 'text-amber-500' : 'text-slate-400'
                      }`}>{refurbStatus}</span>
                    </div>

                    {unit.refurbSession && (
                      <div className="mt-2.5 pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-400">
                        <span>COGS: ${unit.costPrice.toFixed(2)}</span>
                        <span>Batt: {unit.refurbSession.batteryHealth}%</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Columns: Active Diagnostic Worksheet */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedUnit ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
              <Wrench className="h-10 w-10 text-slate-400 mx-auto" />
              <h4 className="font-mono text-sm font-black uppercase text-slate-900 dark:text-white">No hardware unit selected</h4>
              <p className="font-sans text-xs text-slate-500 uppercase tracking-wide">Please select a serialized device from the testing queue to start diagnostics and refurb grading.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6">
              
              {/* Device context banner */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400">
                    <Wrench className="h-3.5 w-3.5" /> DIAGNOSTIC WORKSHEET
                  </div>
                  <h3 className="font-sans text-base font-black uppercase text-slate-900 dark:text-white mt-1">{selectedUnit.productName}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-400 mt-1 uppercase">
                    <span>S/N: {selectedUnit.serialNumber}</span>
                    <span>&bull;</span>
                    <span>Received: {selectedUnit.receivedDate}</span>
                    <span>&bull;</span>
                    <span>Purchase Cost: ${selectedUnit.costPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Grade display */}
                <div className="text-center font-mono">
                  <span className="block text-[8px] text-slate-400 uppercase">CALCULATED GRADE</span>
                  <div className={`px-4 py-1.5 border font-black text-lg mt-0.5 ${getGradeColor(calculatedGrade)}`}>
                    {calculatedGrade}
                  </div>
                </div>
              </div>

              {/* Diagnostic Checklist Accordions */}
              <div className="space-y-4">
                <h4 className="font-sans text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  50-Point Diagnostic Checklist ({totalScore}/50 passed)
                </h4>

                <div className="space-y-3">
                  {(['Cosmetic', 'Display', 'Core Hardware', 'Power', 'Connectivity'] as RefurbChecklistCategory[]).map(cat => {
                    const isExpanded = expandedCategories[cat];
                    const catItems = CHECKLIST_ITEMS.filter(i => i.category === cat);
                    const catPassed = catItems.filter(i => passedCheckIds.includes(i.id)).length;

                    return (
                      <div key={cat} className="border border-slate-250 dark:border-slate-800">
                        {/* Accordion header */}
                        <div 
                          onClick={() => toggleCategory(cat)}
                          className="bg-slate-50 dark:bg-slate-850 px-4 py-3 flex justify-between items-center cursor-pointer select-none hover:bg-slate-100/50"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-sans text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">{cat}</span>
                            <span className="font-mono text-[9px] uppercase bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 font-bold">
                              {catPassed} / 10 passed
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Fast-toggles */}
                            <div className="flex gap-1.5 text-[9px] font-mono font-bold uppercase" onClick={e => e.stopPropagation()}>
                              <button 
                                type="button"
                                onClick={() => handleCategoryShortcut(cat, 'pass')}
                                className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
                              >
                                Pass All
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleCategoryShortcut(cat, 'fail')}
                                className="px-2 py-0.5 bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                              >
                                Reset
                              </button>
                            </div>

                            {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                          </div>
                        </div>

                        {/* Accordion list */}
                        {isExpanded && (
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2 divide-y md:divide-y-0 divide-slate-100 dark:divide-slate-800">
                            {catItems.map(item => {
                              const isChecked = passedCheckIds.includes(item.id);
                              return (
                                <div 
                                  key={item.id}
                                  onClick={() => handleToggleCheck(item.id)}
                                  className="flex items-start gap-3 p-2 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}} // Controlled by wrapper div click
                                    className="mt-0.5 accent-indigo-600"
                                  />
                                  <span className={`font-sans text-xs ${isChecked ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-400'}`}>
                                    {item.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Slider for battery health % */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center font-mono text-[10px] text-slate-500 font-bold uppercase">
                    <span>Battery Health percentage (%)</span>
                    <span className="text-slate-900 dark:text-white font-extrabold text-sm">{batteryHealth}%</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={batteryHealth}
                    onChange={e => setBatteryHealth(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="block text-[8px] font-mono text-slate-400 uppercase">Note: Battery Health &lt; 70% automatically caps grade at D</span>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Technician Name</label>
                  <input
                    type="text"
                    value={technicianName}
                    onChange={e => setTechnicianName(e.target.value)}
                    className="w-full bg-white border border-slate-350 p-2 font-sans text-xs outline-none focus:border-slate-900 text-neutral-900 font-semibold"
                  />
                </div>
              </div>

              {/* COGS worksheet */}
              <div className="border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <h4 className="font-sans text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Refurbishment Costs &amp; COGS Worksheet
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* Left: Refurb Parts */}
                  <div className="space-y-3">
                    <span className="font-mono text-[9px] text-slate-400 font-bold uppercase block">1. Replacement Parts Consumed</span>
                    
                    <form onSubmit={handleAddPart} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Part name (e.g. screen, battery)..."
                        value={newPartName}
                        onChange={e => setNewPartName(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-300 p-1.5 font-sans text-xs outline-none focus:border-slate-900 text-neutral-900"
                      />
                      <input
                        type="number"
                        placeholder="$ Cost"
                        value={newPartCost}
                        onChange={e => setNewPartCost(e.target.value)}
                        className="w-20 bg-slate-50 border border-slate-300 p-1.5 font-mono text-xs outline-none focus:border-slate-900 text-neutral-900"
                      />
                      <button
                        type="submit"
                        className="bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs px-3 uppercase font-bold cursor-pointer"
                      >
                        Add
                      </button>
                    </form>

                    {/* Parts list */}
                    <div className="border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-36 overflow-y-auto">
                      {partsUsed.length === 0 ? (
                        <div className="p-3 text-center text-slate-400 font-mono text-[9px] uppercase">
                          No refurb parts recorded.
                        </div>
                      ) : (
                        partsUsed.map((p, idx) => (
                          <div key={idx} className="p-2 flex justify-between items-center text-xs">
                            <span className="font-medium text-slate-900 dark:text-white uppercase">{p.partName}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold">${p.cost.toFixed(2)}</span>
                              <button
                                type="button"
                                onClick={() => handleRemovePart(idx)}
                                className="text-slate-400 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right: Labor Hours & totals */}
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 font-mono text-xs">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">2. Technician Labor Cost</span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] text-slate-500 uppercase font-bold mb-1">Labor Hours</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={laborHours}
                          onChange={e => setLaborHours(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-350 p-1.5 font-mono text-xs outline-none text-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] text-slate-500 uppercase font-bold mb-1">Hourly Rate ($/hr)</label>
                        <input
                          type="number"
                          value={laborRate}
                          onChange={e => setLaborRate(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-350 p-1.5 font-mono text-xs outline-none text-neutral-900"
                        />
                      </div>
                    </div>

                    {/* Financial Rollup summary */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Purchase Cost:</span>
                        <span className="font-bold">${purchaseCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Refurb Parts:</span>
                        <span className="font-bold">${partsCostSum.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tech Labor:</span>
                        <span className="font-bold">${laborCostSum.toFixed(2)}</span>
                      </div>
                      
                      <div className="pt-2 border-t border-dashed border-slate-300 dark:border-slate-800 flex justify-between text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                        <span>True Unit COGS:</span>
                        <span>${trueCOGS.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Refurb Notes */}
              <div className="space-y-1.5 text-left">
                <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Refurbishment & Grading notes</label>
                <textarea
                  rows={2}
                  placeholder="Record screen replacements, board micro-soldering repairs, key cap switches, or cosmetic remarks here..."
                  value={refurbNotes}
                  onChange={e => setRefurbNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-350 p-2 font-sans text-xs outline-none focus:border-slate-900 text-neutral-900"
                />
              </div>

              {/* Submit panel */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedUnitId(null)}
                  className="border border-slate-300 hover:border-slate-900 px-5 py-2.5 font-mono text-xs uppercase font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinalizeGrading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs uppercase font-black tracking-wider px-6 py-2.5 flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Save className="h-4 w-4" /> Finalize & Grade {calculatedGrade}
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
