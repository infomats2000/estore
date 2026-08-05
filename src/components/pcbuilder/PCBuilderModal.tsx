import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Layers, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  Sparkles, 
  Gamepad2, 
  Activity, 
  Monitor, 
  Search,
  HardDrive,
  Box,
  Wind,
  Share2
} from 'lucide-react';
import { Product, PCComponentCategory, PCBuildSelection, CartItem } from '../../types';
import { verifyPCBuildCompatibility, calculatePCBuildMetrics } from '../../utils/pcBuilderEngine';

interface PCBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCartBatch: (items: { product: Product; quantity: number }[]) => void;
  onShowAlert?: (title: string, message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function PCBuilderModal({
  isOpen,
  onClose,
  products,
  onAddToCartBatch,
  onShowAlert
}: PCBuilderModalProps) {
  const [selection, setSelection] = useState<PCBuildSelection>({});
  const [activeSlotPicker, setActiveSlotPicker] = useState<PCComponentCategory | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  if (!isOpen) return null;

  const slots: { category: PCComponentCategory; title: string; icon: any; desc: string }[] = [
    { category: 'CPU', title: 'Processor (CPU)', icon: Cpu, desc: 'Central Processing Unit (Intel / AMD)' },
    { category: 'Motherboard', title: 'Motherboard', icon: Layers, desc: 'Main System Circuit Board' },
    { category: 'RAM', title: 'Memory (RAM)', icon: Activity, desc: 'Dual-Channel Memory Kit' },
    { category: 'GPU', title: 'Graphics Card (GPU)', icon: Monitor, desc: 'Dedicated Video Card' },
    { category: 'PSU', title: 'Power Supply (PSU)', icon: Zap, desc: '80+ Power Supply Unit' },
    { category: 'SSD', title: 'Storage (M.2 NVMe)', icon: HardDrive, desc: 'High-Speed NVMe Storage' },
    { category: 'Case', title: 'PC Chassis / Case', icon: Box, desc: 'Tower & Enclosure' },
    { category: 'Cooler', title: 'CPU Cooler', icon: Wind, desc: 'Liquid AIO or Air Tower' }
  ];

  const warnings = verifyPCBuildCompatibility(selection);
  const metrics = calculatePCBuildMetrics(selection);
  const errors = warnings.filter(w => w.type === 'error');

  const handleSelectProductForSlot = (category: PCComponentCategory, product: Product) => {
    setSelection(prev => ({ ...prev, [category.toLowerCase()]: product }));
    setActiveSlotPicker(null);
    setPickerSearch('');
  };

  const handleRemoveSlot = (category: PCComponentCategory) => {
    setSelection(prev => {
      const copy = { ...prev };
      delete copy[category.toLowerCase() as keyof PCBuildSelection];
      return copy;
    });
  };

  const handleAddToCartAll = () => {
    const selectedItems = Object.values(selection).filter(Boolean) as Product[];
    if (selectedItems.length === 0) {
      onShowAlert?.('Empty Build', 'Please select at least 1 component to add to your cart.', 'warning');
      return;
    }
    if (errors.length > 0) {
      onShowAlert?.('Compatibility Error', 'Please resolve incompatible component errors before checking out.', 'error');
      return;
    }

    const itemsToAdd = selectedItems.map(p => ({ product: p, quantity: 1 }));
    onAddToCartBatch(itemsToAdd);
    onShowAlert?.('Custom PC Added!', `Added ${selectedItems.length} components to cart ($${metrics.totalCost.toFixed(2)} Total).`, 'success');
    onClose();
  };

  const filterProductsForCategory = (cat: PCComponentCategory): Product[] => {
    const q = pickerSearch.toLowerCase();
    return products.filter(p => {
      const c = p.category.toLowerCase();
      const n = p.name.toLowerCase();
      
      let catMatch = false;
      if (cat === 'CPU') catMatch = c.includes('cpu') || c.includes('processor') || n.includes('intel') || n.includes('ryzen');
      else if (cat === 'Motherboard') catMatch = c.includes('motherboard') || c.includes('mb') || n.includes('z790') || n.includes('b650') || n.includes('b550');
      else if (cat === 'RAM') catMatch = c.includes('ram') || c.includes('memory') || n.includes('ddr4') || n.includes('ddr5');
      else if (cat === 'GPU') catMatch = c.includes('gpu') || c.includes('graphics') || n.includes('rtx') || n.includes('radeon') || n.includes('geforce');
      else if (cat === 'PSU') catMatch = c.includes('psu') || c.includes('power') || n.includes('watt') || n.includes('80+');
      else if (cat === 'SSD') catMatch = c.includes('ssd') || c.includes('storage') || n.includes('nvme') || n.includes('m.2');
      else if (cat === 'Case') catMatch = c.includes('case') || c.includes('chassis') || n.includes('tower');
      else if (cat === 'Cooler') catMatch = c.includes('cooler') || c.includes('cooling') || n.includes('aio') || n.includes('fan');
      else catMatch = true;

      return catMatch && (!q || n.includes(q));
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-800 text-white flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                  REAL-TIME PC PART PICKER
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 8-Point Verification Active
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight mt-0.5">Interactive Custom PC Builder &amp; Compatibility Engine</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right font-mono pr-2 border-r border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">TOTAL RIG COST</span>
              <span className="text-xl font-black text-emerald-400">${metrics.totalCost.toFixed(2)}</span>
            </div>

            <button
              type="button"
              onClick={handleAddToCartAll}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              Add Rig to Cart
            </button>

            <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main 2-Col Content Area */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2-Cols: 8 Hardware Slots */}
          <div className="lg:col-span-2 space-y-3">
            {/* Real-time Compatibility Warning Banner */}
            <div className="space-y-2">
              {warnings.length === 0 ? (
                <div className="bg-emerald-950/60 border border-emerald-800/60 p-4 rounded-2xl flex items-center gap-3 text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs">100% Component Compatibility Verified</h4>
                    <p className="text-[11px] text-emerald-400/80">Sockets, RAM types, TDP wattage headroom, and chassis dimensions are fully matched.</p>
                  </div>
                </div>
              ) : (
                warnings.map(w => (
                  <div key={w.id} className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    w.type === 'error'
                      ? 'bg-rose-950/60 border-rose-800 text-rose-200'
                      : w.type === 'warning'
                      ? 'bg-amber-950/60 border-amber-800 text-amber-200'
                      : 'bg-blue-950/60 border-blue-800 text-blue-200'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      w.type === 'error' ? 'text-rose-400' : 'text-amber-400'
                    }`} />
                    <div>
                      <h4 className="font-bold text-xs">{w.title}</h4>
                      <p className="text-[11px] opacity-90 mt-0.5">{w.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Hardware Slots Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {slots.map(slot => {
                const Icon = slot.icon;
                const selectedProd = selection[slot.category.toLowerCase() as keyof PCBuildSelection];

                return (
                  <div
                    key={slot.category}
                    className={`p-4 rounded-2xl border transition-all ${
                      selectedProd
                        ? 'bg-slate-950 border-blue-600/50 shadow-md'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{slot.title}</span>
                      </div>
                      {selectedProd && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(slot.category)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Remove part"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {selectedProd ? (
                      <div className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        {selectedProd.image && (
                          <img src={selectedProd.image} alt="" className="w-10 h-10 object-contain bg-slate-950 p-1 rounded-lg border border-slate-800" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-slate-100 line-clamp-1">{selectedProd.name}</h5>
                          <span className="text-[11px] font-mono font-bold text-emerald-400">${(selectedProd.discountPrice || selectedProd.price).toFixed(2)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveSlotPicker(slot.category)}
                          className="px-2 py-1 text-[10px] font-bold text-blue-300 bg-blue-950 border border-blue-800 rounded-lg hover:bg-blue-900"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveSlotPicker(slot.category)}
                        className="w-full py-3 bg-slate-900/60 hover:bg-slate-850 border border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-300 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Select {slot.title}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 1-Col: Performance HUD & AI Recommendations */}
          <div className="space-y-4">
            {/* TDP Power Calculator HUD */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" /> System Power (TDP)
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">{metrics.estimatedWattage} W</span>
              </div>

              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${metrics.psuSufficient ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, (metrics.estimatedWattage / metrics.recommendedWattage) * 100)}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                <span>Estimated TDP: {metrics.estimatedWattage}W</span>
                <span>Rec PSU: <strong className="text-slate-200">{metrics.recommendedWattage}W+</strong></span>
              </div>
            </div>

            {/* Performance & Bottleneck HUD */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-400" /> Rig Performance Rating
                </span>
                <span className="text-xs font-mono font-black text-blue-400">{metrics.performanceScore} / 100</span>
              </div>

              <div className="text-xs text-slate-300 font-mono bg-blue-950/40 p-2.5 rounded-xl border border-blue-900/50 flex justify-between">
                <span>Hardware Balance:</span>
                <strong className="text-emerald-400">{metrics.bottleneckRating}</strong>
              </div>
            </div>

            {/* Gaming FPS Benchmark Grid */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-purple-400" /> Estimated Gaming FPS
              </span>

              <div className="space-y-2 text-xs">
                {metrics.fpsEstimates.map(fps => (
                  <div key={fps.game} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-slate-200 text-[11px]">{fps.game}</span>
                    <div className="grid grid-cols-3 gap-1 font-mono text-[10px] text-slate-400">
                      <div>1080p: <strong className="text-emerald-400">{fps.fps1080p} FPS</strong></div>
                      <div>1440p: <strong className="text-blue-400">{fps.fps1440p} FPS</strong></div>
                      <div>4K: <strong className="text-purple-400">{fps.fps4k} FPS</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-gradient-to-b from-blue-950/60 to-slate-950 p-5 rounded-2xl border border-blue-900/50 space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> AI Hardware Advisor
              </span>
              {metrics.aiRecommendations.map((tip, idx) => (
                <p key={idx} className="text-xs text-slate-300 leading-relaxed font-sans">
                  &bull; {tip}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Product Picker Modal Sub-Overlay */}
        {activeSlotPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
              <div className="bg-slate-950 p-4 flex items-center justify-between border-b border-slate-800">
                <h3 className="font-bold text-sm text-slate-100">Select {activeSlotPicker} Component</h3>
                <button type="button" onClick={() => setActiveSlotPicker(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 border-b border-slate-800">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Search ${activeSlotPicker} catalog...`}
                    value={pickerSearch}
                    onChange={e => setPickerSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 pl-10 pr-4 py-2 text-xs rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filterProductsForCategory(activeSlotPicker).map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProductForSlot(activeSlotPicker, prod)}
                    className="bg-slate-950 hover:bg-slate-850 p-3 rounded-2xl border border-slate-800 hover:border-blue-500/50 flex items-center justify-between gap-4 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {prod.image && <img src={prod.image} alt="" className="w-12 h-12 object-contain bg-slate-900 p-1 rounded-xl" />}
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">{prod.name}</h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{prod.category}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-mono font-black text-emerald-400">${(prod.discountPrice || prod.price).toFixed(2)}</span>
                      <button type="button" className="block text-[10px] font-bold text-blue-400 hover:underline mt-0.5">Select Part &rarr;</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
