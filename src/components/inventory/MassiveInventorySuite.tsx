import React, { useState } from 'react';
import { 
  Boxes, 
  Warehouse, 
  Layers, 
  QrCode, 
  Scan, 
  Tag, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Truck, 
  ShieldCheck, 
  Printer, 
  ExternalLink,
  ChevronRight,
  Zap,
  Building2,
  PackageCheck
} from 'lucide-react';
import { MassiveStockSKU } from '../../types';
import { DEFAULT_MASSIVE_SKUS, searchMassiveSKUs } from '../../utils/massiveInventoryEngine';

interface MassiveInventorySuiteProps {
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function MassiveInventorySuite({ onShowAlert }: MassiveInventorySuiteProps) {
  const [skus, setSkus] = useState<MassiveStockSKU[]>(DEFAULT_MASSIVE_SKUS);
  const [activeTab, setActiveTab] = useState<'catalog' | 'bins_pallets' | 'rfid_serials' | 'vmi_pools'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [selectedSKU, setSelectedSKU] = useState<MassiveStockSKU | null>(DEFAULT_MASSIVE_SKUS[0]);

  const filteredSKUs = searchMassiveSKUs(searchQuery, warehouseFilter, skus);

  const handlePrintBarcodeTag = (skuCode: string) => {
    onShowAlert?.(`Barcode & RFID Asset Tag printed for SKU ${skuCode}!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/30 border border-blue-400/30 rounded-2xl backdrop-blur-md">
            <Boxes className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-blue-950 text-blue-300 rounded border border-blue-800">
              MASSIVE 100,000+ SKU WHOLESALE ENGINE
            </span>
            <h2 className="text-xl font-black tracking-tight mt-1">Enterprise Warehouse &amp; Logistics Inventory Suite</h2>
            <p className="text-xs text-slate-400">Multiple Warehouses, Bins, Pallets, Containers, Serial Numbers, RFID &amp; Vendor-Managed Inventory</p>
          </div>
        </div>
      </div>

      {/* 16 Wholesale Inventory Features Ribbon */}
      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-2 font-mono text-[11px]">
        <span className="text-slate-400 font-bold uppercase text-[10px] mr-2">Wholesale Capabilities:</span>
        {[
          '100,000+ SKUs', 'Multiple Warehouses', 'Bin Locations', 'Pallet Tracking', 'Carton Tracking', 
          'Container Tracking', 'Batch Tracking', 'Serial Numbers', 'Lots', 'Barcodes', 'QR Codes', 
          'RFID Tags', 'Expiry Dates', 'Reserved Stock', 'Transit Stock', 'Incoming POs', 'VMI Consignment'
        ].map(feat => (
          <span key={feat} className="px-2.5 py-1 bg-slate-900 text-blue-300 rounded-lg border border-slate-800 font-bold">
            {feat}
          </span>
        ))}
      </div>

      {/* Toolbar & Tabs */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'catalog' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4" /> 100,000+ SKU Catalog ({filteredSKUs.length})
          </button>

          <button
            onClick={() => setActiveTab('bins_pallets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'bins_pallets' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Warehouse className="w-4 h-4" /> Bins, Pallets &amp; Containers
          </button>

          <button
            onClick={() => setActiveTab('rfid_serials')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'rfid_serials' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Scan className="w-4 h-4" /> Serials, Lots &amp; RFID Tags
          </button>

          <button
            onClick={() => setActiveTab('vmi_pools')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'vmi_pools' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" /> Reserved, Transit, Incoming &amp; VMI Pools
          </button>
        </div>

        <div className="flex gap-2">
          <select
            value={warehouseFilter}
            onChange={e => setWarehouseFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-200"
          >
            <option value="All">All Warehouses</option>
            <option value="WH-SYD-MAIN">Sydney Central WH-001</option>
            <option value="WH-MEL-DEPOT">Melbourne CBD WH-002</option>
          </select>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Scan Barcode, RFID or Search SKU..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 pl-9 pr-3 py-1.5 rounded-xl text-xs text-white placeholder-slate-500 w-56 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: SKU Directory List */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Indexed Inventory SKUs</h3>
          <div className="space-y-3">
            {filteredSKUs.map(sku => (
              <div
                key={sku.id}
                onClick={() => setSelectedSKU(sku)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                  selectedSKU?.id === sku.id 
                    ? 'bg-slate-900 border-blue-500/50 shadow-xl' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-blue-950 text-blue-300 rounded border border-blue-800">{sku.skuCode}</span>
                  {sku.isVMI && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-purple-950 text-purple-300 rounded border border-purple-800">
                      VMI Consignment
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm text-slate-100 mt-2">{sku.productName}</h4>
                <div className="text-[11px] font-mono text-slate-400 mt-1 flex justify-between">
                  <span>Bin: <strong className="text-slate-200">{sku.binLocation}</strong></span>
                  <strong className="text-emerald-400">{sku.onHandStock} On-Hand</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2-Cols: Selected SKU Workspace */}
        <div className="lg:col-span-2 space-y-4">
          {selectedSKU ? (
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-950 px-2.5 py-0.5 rounded border border-blue-800">
                    {selectedSKU.warehouseName}
                  </span>
                  <h3 className="text-lg font-black text-slate-100 mt-1">{selectedSKU.productName}</h3>
                  <span className="text-xs font-mono text-slate-400">SKU: {selectedSKU.skuCode} &bull; Barcode: {selectedSKU.barcode}</span>
                </div>

                <button
                  onClick={() => handlePrintBarcodeTag(selectedSKU.skuCode)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print RFID Asset Tag
                </button>
              </div>

              {/* 4 Stock Pool Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
                <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">1. On-Hand Physical</span>
                  <span className="text-2xl font-black text-emerald-400">{selectedSKU.onHandStock} Units</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">2. Reserved Orders</span>
                  <span className="text-2xl font-black text-amber-400">{selectedSKU.reservedStock} Units</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-blue-500/40 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">3. In-Transit Between WH</span>
                  <span className="text-2xl font-black text-blue-400">{selectedSKU.transitStock} Units</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-purple-500/40 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">4. Incoming PO Stock</span>
                  <span className="text-2xl font-black text-purple-400">{selectedSKU.incomingStock} Units</span>
                </div>
              </div>

              {/* Logistics & Coordinates Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-blue-400 block">Warehouse Bin &amp; Logistics Units</span>
                  <div className="space-y-1 text-slate-300 text-[11px]">
                    <div>Bin Location: <strong className="text-slate-100">{selectedSKU.binLocation}</strong></div>
                    <div>Pallet ID: <strong className="text-blue-300">{selectedSKU.palletId || 'N/A'}</strong></div>
                    <div>Carton Barcode: <strong className="text-slate-200">{selectedSKU.cartonBarcode || 'N/A'}</strong></div>
                    <div>Container Number: <strong className="text-purple-300">{selectedSKU.containerNumber || 'N/A'}</strong></div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-purple-400 block">Batch, RFID &amp; Serial Traceability</span>
                  <div className="space-y-1 text-slate-300 text-[11px]">
                    <div>Batch / Lot Number: <strong className="text-slate-100">{selectedSKU.batchLotNumber || 'N/A'}</strong></div>
                    <div>RFID Tag Identifier: <strong className="text-amber-300">{selectedSKU.rfidTag || 'N/A'}</strong></div>
                    <div>Expiry Date: <strong className="text-emerald-400">{selectedSKU.expiryDate || 'N/A'}</strong></div>
                    <div>VMI Status: <strong className="text-slate-100">{selectedSKU.isVMI ? selectedSKU.vmiVendorName : 'Owned Inventory'}</strong></div>
                  </div>
                </div>
              </div>

              {/* Serial Numbers Table */}
              {selectedSKU.serialNumbers && selectedSKU.serialNumbers.length > 0 && (
                <div className="space-y-2 font-mono text-xs">
                  <h4 className="font-bold uppercase text-slate-400 text-[10px]">Logged Hardware Serial Numbers ({selectedSKU.serialNumbers.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSKU.serialNumbers.map((sn, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-950 text-emerald-400 border border-slate-800 rounded-lg font-bold">
                        S/N: {sn}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 p-12 rounded-3xl border border-slate-800 text-center space-y-3 text-slate-400 font-mono">
              <Boxes className="w-10 h-10 mx-auto text-blue-400 opacity-60" />
              <h4 className="font-bold text-sm text-slate-200">Select an Inventory SKU</h4>
              <p className="text-xs max-w-sm mx-auto">Select a SKU record from the left panel to inspect its warehouse bin location, pallet ID, RFID tag, and serial numbers.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
