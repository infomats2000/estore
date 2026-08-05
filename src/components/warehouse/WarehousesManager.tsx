import React, { useState, useMemo } from 'react';
import { 
  Building2, MapPin, Layers, ArrowLeftRight, Plus, Search, Filter, 
  Printer, CheckCircle2, AlertCircle, Clock, Trash2, Edit3, ChevronDown, 
  ChevronUp, Package, Tag, FileText, Check, X, ShieldAlert, ArrowRight, UserCheck, Phone, Mail
} from 'lucide-react';
import { WarehouseLocation, WarehouseBin, StockTransfer, StockTransferItem, Product, StockUnit, Order, StoreSettings } from '../../types';
import { printStockTransferNote } from '../../utils/transferNotePrinter';

interface WarehousesManagerProps {
  warehouses: WarehouseLocation[];
  onAddWarehouse: (warehouse: WarehouseLocation) => void;
  onUpdateWarehouse: (warehouse: WarehouseLocation) => void;
  onDeleteWarehouse: (id: string) => void;
  stockTransfers: StockTransfer[];
  onAddStockTransfer: (transfer: StockTransfer) => void;
  onUpdateStockTransfer: (transfer: StockTransfer) => void;
  onCompleteStockTransfer: (transferId: string) => void;
  products: Product[];
  stockUnits: StockUnit[];
  orders: Order[];
  storeSettings?: StoreSettings;
  onShowAlert?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function WarehousesManager({
  warehouses = [],
  onAddWarehouse,
  onUpdateWarehouse,
  onDeleteWarehouse,
  stockTransfers = [],
  onAddStockTransfer,
  onUpdateStockTransfer,
  onCompleteStockTransfer,
  products = [],
  stockUnits = [],
  orders = [],
  storeSettings,
  onShowAlert,
}: WarehousesManagerProps) {
  const [subTab, setSubTab] = useState<'locations' | 'stock' | 'transfers' | 'pick-list'>('locations');
  
  // Modals
  const [showAddWH, setShowAddWH] = useState(false);
  const [editingWH, setEditingWH] = useState<WarehouseLocation | null>(null);
  const [selectedWHForBin, setSelectedWHForBin] = useState<WarehouseLocation | null>(null);
  const [showAddBinModal, setShowAddBinModal] = useState(false);
  
  const [showNewTransferModal, setShowNewTransferModal] = useState(false);
  const [selectedTransferForDetail, setSelectedTransferForDetail] = useState<StockTransfer | null>(null);
  const [selectedOrderForPickList, setSelectedOrderForPickList] = useState<Order | null>(null);

  // Forms
  const [whForm, setWhForm] = useState({
    code: '',
    name: '',
    address: '',
    contactPerson: '',
    phone: '',
    email: '',
    isDefault: false,
  });

  const [binForm, setBinForm] = useState({
    code: '',
    zone: 'Zone A',
    rack: 'Rack 1',
    shelf: 'Shelf 1',
    binNumber: '01',
    notes: '',
  });

  const [transferForm, setTransferForm] = useState<{
    fromLocationId: string;
    toLocationId: string;
    reason: string;
    requestedBy: string;
    notes: string;
    items: { productId: string; quantity: number }[];
  }>({
    fromLocationId: warehouses[0]?.id || '',
    toLocationId: warehouses[1]?.id || warehouses[0]?.id || '',
    reason: 'Stock replenishment for showroom',
    requestedBy: 'Logistics Manager',
    notes: '',
    items: [{ productId: products[0]?.id || '', quantity: 1 }],
  });

  // Searches & Filters
  const [locationSearch, setLocationSearch] = useState('');
  const [transferSearch, setTransferSearch] = useState('');
  const [stockSearch, setStockSearch] = useState('');

  // Stats
  const totalBins = useMemo(() => warehouses.reduce((sum, w) => sum + (w.bins?.length || 0), 0), [warehouses]);
  const activeTransfers = useMemo(() => stockTransfers.filter(t => t.status === 'In Transit' || t.status === 'Pending').length, [stockTransfers]);

  // Handlers for Warehouse
  const openAddWHModal = (wh?: WarehouseLocation) => {
    if (wh) {
      setEditingWH(wh);
      setWhForm({
        code: wh.code,
        name: wh.name,
        address: wh.address || '',
        contactPerson: wh.contactPerson || '',
        phone: wh.phone || '',
        email: wh.email || '',
        isDefault: !!wh.isDefault,
      });
    } else {
      setEditingWH(null);
      setWhForm({
        code: 'WH-' + String(Date.now()).slice(-4),
        name: '',
        address: '',
        contactPerson: '',
        phone: '',
        email: '',
        isDefault: warehouses.length === 0,
      });
    }
    setShowAddWH(true);
  };

  const handleSaveWH = () => {
    if (!whForm.name.trim() || !whForm.code.trim()) {
      onShowAlert?.('Warehouse name and code are required.', 'error');
      return;
    }
    if (editingWH) {
      onUpdateWarehouse({
        ...editingWH,
        code: whForm.code.toUpperCase().trim(),
        name: whForm.name.trim(),
        address: whForm.address,
        contactPerson: whForm.contactPerson,
        phone: whForm.phone,
        email: whForm.email,
        isDefault: whForm.isDefault,
      });
      onShowAlert?.(`Warehouse ${whForm.name} updated.`, 'success');
    } else {
      const newWh: WarehouseLocation = {
        id: 'wh-' + String(Date.now()).slice(-6),
        code: whForm.code.toUpperCase().trim(),
        name: whForm.name.trim(),
        address: whForm.address,
        contactPerson: whForm.contactPerson,
        phone: whForm.phone,
        email: whForm.email,
        isDefault: whForm.isDefault,
        bins: [
          { id: 'bin-01', code: 'A-01-01', zone: 'Zone A', rack: 'Rack 1', shelf: 'Shelf 1', binNumber: '01', notes: 'Default Bin' }
        ],
      };
      onAddWarehouse(newWh);
      onShowAlert?.(`Warehouse ${newWh.name} added.`, 'success');
    }
    setShowAddWH(false);
  };

  // Bin Handlers
  const handleAddBin = () => {
    if (!selectedWHForBin) return;
    const generatedCode = `${binForm.zone.replace(/\s+/g, '')[0] || 'Z'}-${binForm.rack.replace(/\D/g, '') || '1'}-${binForm.shelf.replace(/\D/g, '') || '1'}-${binForm.binNumber}`.toUpperCase();
    const finalCode = binForm.code.trim() ? binForm.code.toUpperCase().trim() : generatedCode;

    const newBin: WarehouseBin = {
      id: 'bin-' + String(Date.now()).slice(-6),
      code: finalCode,
      zone: binForm.zone,
      rack: binForm.rack,
      shelf: binForm.shelf,
      binNumber: binForm.binNumber,
      notes: binForm.notes,
    };

    const updatedWh = {
      ...selectedWHForBin,
      bins: [...(selectedWHForBin.bins || []), newBin],
    };

    onUpdateWarehouse(updatedWh);
    setSelectedWHForBin(updatedWh);
    onShowAlert?.(`Bin ${finalCode} added to ${selectedWHForBin.name}.`, 'success');
    setShowAddBinModal(false);
  };

  const handleDeleteBin = (wh: WarehouseLocation, binId: string) => {
    const updated = {
      ...wh,
      bins: wh.bins.filter(b => b.id !== binId),
    };
    onUpdateWarehouse(updated);
    setSelectedWHForBin(updated);
    onShowAlert?.('Bin location removed.', 'info');
  };

  // Transfer Handlers
  const handleSaveTransfer = () => {
    if (!transferForm.fromLocationId || !transferForm.toLocationId) {
      onShowAlert?.('Please select origin and destination warehouses.', 'error');
      return;
    }
    if (transferForm.fromLocationId === transferForm.toLocationId) {
      onShowAlert?.('Origin and destination warehouses cannot be the same.', 'error');
      return;
    }
    const fromWh = warehouses.find(w => w.id === transferForm.fromLocationId);
    const toWh = warehouses.find(w => w.id === transferForm.toLocationId);

    const validItems: StockTransferItem[] = transferForm.items.map(it => {
      const prod = products.find(p => p.id === it.productId);
      return {
        productId: it.productId,
        productName: prod?.name || 'Item',
        quantity: Math.max(1, it.quantity),
      };
    }).filter(it => it.quantity > 0);

    if (validItems.length === 0) {
      onShowAlert?.('Add at least one item to transfer.', 'error');
      return;
    }

    const transfer: StockTransfer = {
      id: 'ST-' + String(Date.now()).slice(-6),
      fromLocationId: transferForm.fromLocationId,
      fromLocationName: fromWh?.name || 'Origin',
      toLocationId: transferForm.toLocationId,
      toLocationName: toWh?.name || 'Destination',
      status: 'In Transit',
      transferDate: new Date().toISOString().split('T')[0],
      requestedBy: transferForm.requestedBy,
      reason: transferForm.reason,
      notes: transferForm.notes,
      items: validItems,
    };

    onAddStockTransfer(transfer);
    onShowAlert?.(`Stock Transfer Note ${transfer.id} generated.`, 'success');
    setShowNewTransferModal(false);
  };

  const filteredWarehouses = warehouses.filter(w =>
    w.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
    w.code.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const filteredTransfers = stockTransfers.filter(t =>
    t.id.toLowerCase().includes(transferSearch.toLowerCase()) ||
    t.fromLocationName.toLowerCase().includes(transferSearch.toLowerCase()) ||
    t.toLocationName.toLowerCase().includes(transferSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Warehouses', value: warehouses.length, color: 'border-blue-400 bg-blue-50', textColor: 'text-blue-700' },
          { label: 'Total Bin Locations', value: totalBins, color: 'border-emerald-400 bg-emerald-50', textColor: 'text-emerald-700' },
          { label: 'Transfers In Transit', value: activeTransfers, color: 'border-amber-400 bg-amber-50', textColor: 'text-amber-700' },
          { label: 'Serialized Stock Tracked', value: stockUnits.length, color: 'border-indigo-400 bg-indigo-50', textColor: 'text-indigo-700' },
        ].map(s => (
          <div key={s.label} className={`border-l-4 ${s.color} rounded-xl p-4 shadow-sm`}>
            <div className={`text-2xl font-black ${s.textColor}`}>{s.value}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2">
          {[
            { id: 'locations', label: 'Warehouses & Bins', icon: Building2 },
            { id: 'stock', label: 'Stock By Location', icon: Layers },
            { id: 'transfers', label: 'Stock Transfers', icon: ArrowLeftRight },
            { id: 'pick-list', label: 'Order Pick Lists', icon: FileText },
          ].map(t => {
            const Icon = t.icon;
            const isActive = subTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {subTab === 'locations' && (
          <button
            onClick={() => openAddWHModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Warehouse
          </button>
        )}

        {subTab === 'transfers' && (
          <button
            onClick={() => setShowNewTransferModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" /> New Stock Transfer Note
          </button>
        )}
      </div>

      {/* SUB-TAB 1: WAREHOUSES & BINS */}
      {subTab === 'locations' && (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={locationSearch}
              onChange={e => setLocationSearch(e.target.value)}
              placeholder="Search by warehouse code or location name…"
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWarehouses.map(wh => (
              <div key={wh.id} className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-neutral-900 text-white px-2 py-0.5 rounded">{wh.code}</span>
                      {wh.isDefault && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Default Hub</span>
                      )}
                    </div>
                    <h3 className="font-black text-lg text-neutral-900 mt-1">{wh.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openAddWHModal(wh)} className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    {!wh.isDefault && (
                      <button onClick={() => onDeleteWarehouse(wh.id)} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-neutral-600">
                  {wh.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                      <span>{wh.address}</span>
                    </div>
                  )}
                  {wh.contactPerson && (
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                      <span>Manager: {wh.contactPerson} {wh.phone ? `(${wh.phone})` : ''}</span>
                    </div>
                  )}
                </div>

                {/* Bins List Section */}
                <div className="border-t border-neutral-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Bin Locations ({wh.bins?.length || 0})</span>
                    <button
                      onClick={() => { setSelectedWHForBin(wh); setShowAddBinModal(true); }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Bin
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {wh.bins && wh.bins.length > 0 ? (
                      wh.bins.map(b => (
                        <div key={b.id} className="group relative flex items-center gap-1 bg-neutral-100 border border-neutral-200 px-2 py-1 rounded-lg text-xs font-mono">
                          <Tag className="h-3 w-3 text-neutral-400" />
                          <span className="font-bold text-neutral-800">{b.code}</span>
                          <button
                            onClick={() => handleDeleteBin(wh, b.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 ml-1 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs italic text-neutral-400">No bins assigned yet.</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: STOCK BY LOCATION */}
      {subTab === 'stock' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={stockSearch}
                onChange={e => setStockSearch(e.target.value)}
                placeholder="Filter items by product name or serial number…"
                className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="text-xs font-bold text-neutral-500">
              Showing stock breakdown across {warehouses.length} locations
            </div>
          </div>

          {/* Location Breakdown Table */}
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-neutral-800 text-white">
                <tr>
                  <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider">Product</th>
                  <th className="text-center p-3 font-bold text-[10px] uppercase tracking-wider">Total Stock</th>
                  {warehouses.map(w => (
                    <th key={w.id} className="text-center p-3 font-bold text-[10px] uppercase tracking-wider">{w.code} ({w.name.split(' ')[0]})</th>
                  ))}
                  <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider">Serialized Assets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products
                  .filter(p => p.name.toLowerCase().includes(stockSearch.toLowerCase()))
                  .map(p => {
                    const unitsForProd = stockUnits.filter(u => u.productId === p.id);
                    return (
                      <tr key={p.id} className="hover:bg-neutral-50">
                        <td className="p-3 font-bold text-xs text-neutral-900">{p.name}</td>
                        <td className="p-3 text-center font-extrabold text-blue-600">{p.stock}</td>
                        {warehouses.map(w => {
                          const whUnits = unitsForProd.filter(u => u.locationId === w.id);
                          const count = w.isDefault ? (p.stock - (unitsForProd.length - whUnits.length)) : whUnits.length;
                          return (
                            <td key={w.id} className="p-3 text-center font-mono text-xs">
                              <span className={`px-2 py-0.5 rounded font-bold ${count > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-neutral-400'}`}>
                                {Math.max(0, count)}
                              </span>
                            </td>
                          );
                        })}
                        <td className="p-3 text-xs">
                          {unitsForProd.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {unitsForProd.slice(0, 3).map(u => (
                                <span key={u.id} className="font-mono text-[10px] bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded text-neutral-700">
                                  {u.serialNumber} ({u.locationName || 'Hub'})
                                </span>
                              ))}
                              {unitsForProd.length > 3 && <span className="text-[10px] font-bold text-neutral-400">+{unitsForProd.length - 3} more</span>}
                            </div>
                          ) : (
                            <span className="text-neutral-400 text-[11px] italic">Bulk non-serialized</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: STOCK TRANSFERS */}
      {subTab === 'transfers' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={transferSearch}
              onChange={e => setTransferSearch(e.target.value)}
              placeholder="Search transfers by ID or warehouse name…"
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-3">
            {filteredTransfers.length === 0 && (
              <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center text-neutral-400">
                <ArrowLeftRight className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm uppercase tracking-wider">No Stock Transfers Recorded</p>
                <p className="text-xs mt-1">Create a Stock Transfer Note to shift items between warehouses.</p>
              </div>
            )}

            {filteredTransfers.map(st => (
              <div key={st.id} className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm hover:border-neutral-300 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg">{st.id}</span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                      st.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      st.status === 'In Transit' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      'bg-neutral-100 text-neutral-700 border-neutral-200'
                    }`}>
                      {st.status}
                    </span>
                    <span className="text-xs text-neutral-400">Date: {st.transferDate}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => printStockTransferNote(st, storeSettings)}
                      className="flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    >
                      <Printer className="h-3.5 w-3.5" /> Transfer Note
                    </button>
                    {st.status !== 'Completed' && (
                      <button
                        onClick={() => { onCompleteStockTransfer(st.id); onShowAlert?.(`Transfer ${st.id} marked Completed.`, 'success'); }}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark Received
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 text-xs">
                  <div>
                    <span className="text-[9px] font-black uppercase text-neutral-400 block mb-0.5">Origin Warehouse</span>
                    <span className="font-bold text-neutral-800">{st.fromLocationName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-neutral-400 block mb-0.5">Destination Warehouse</span>
                    <span className="font-bold text-neutral-800">{st.toLocationName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-neutral-400 block mb-0.5">Transfer Items ({st.items.reduce((s, i) => s + i.quantity, 0)})</span>
                    <span className="font-semibold text-neutral-700">{st.items.map(i => `${i.quantity}× ${i.productName}`).join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ORDER PICK LIST GENERATOR */}
      {subTab === 'pick-list' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-black text-lg uppercase tracking-wider text-neutral-900">Warehouse Order Pick List Generator</h3>
            <p className="text-xs text-neutral-500 mt-1">Select a customer order to view the exact Warehouse Bin locations for fast picking.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {orders.slice(0, 6).map(ord => (
              <div
                key={ord.id}
                onClick={() => setSelectedOrderForPickList(ord)}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  selectedOrderForPickList?.id === ord.id
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-xs font-bold text-blue-600">{ord.id}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">{ord.status}</span>
                </div>
                <div className="font-bold text-xs text-neutral-900">{ord.customerName}</div>
                <div className="text-[11px] text-neutral-500">{ord.items.length} items · ${ord.total.toFixed(2)}</div>
              </div>
            ))}
          </div>

          {selectedOrderForPickList && (
            <div className="border-t border-neutral-200 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-md text-neutral-900">Pick List for Order {selectedOrderForPickList.id}</h4>
                  <p className="text-xs text-neutral-500">Customer: {selectedOrderForPickList.customerName} ({selectedOrderForPickList.customerAddress || 'Standard Delivery'})</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg text-xs font-bold"
                >
                  <Printer className="h-4 w-4" /> Print Pick Sheet
                </button>
              </div>

              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-neutral-800 text-white font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3 text-left">Item Name</th>
                      <th className="p-3 text-center w-16">Qty</th>
                      <th className="p-3 text-left">Assigned Warehouse</th>
                      <th className="p-3 text-left">Target Bin Code</th>
                      <th className="p-3 text-center w-20">Picked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedOrderForPickList.items.map((it, idx) => {
                      const units = stockUnits.filter(u => u.productId === it.productId);
                      const assignedBin = units[0]?.binLocation || 'A-01-01 (Main Rack)';
                      const assignedWh = units[0]?.locationName || 'Main Logistics Hub';
                      return (
                        <tr key={idx} className="hover:bg-neutral-50">
                          <td className="p-3 font-semibold text-neutral-800">{it.name}</td>
                          <td className="p-3 text-center font-bold text-blue-600">{it.quantity}</td>
                          <td className="p-3 font-medium text-neutral-700">{assignedWh}</td>
                          <td className="p-3 font-mono font-bold text-blue-700">{assignedBin}</td>
                          <td className="p-3 text-center">
                            <input type="checkbox" className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT WAREHOUSE MODAL */}
      {showAddWH && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h2 className="font-black text-lg uppercase tracking-wider">{editingWH ? 'Edit Warehouse' : 'New Warehouse Location'}</h2>
              <button onClick={() => setShowAddWH(false)}><X className="h-5 w-5 text-neutral-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Location Code *</label>
                  <input
                    type="text"
                    value={whForm.code}
                    onChange={e => setWhForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="e.g. WH-MELB"
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={whForm.contactPerson}
                    onChange={e => setWhForm(f => ({ ...f, contactPerson: e.target.value }))}
                    placeholder="Manager name"
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-600 block mb-1">Warehouse Name *</label>
                <input
                  type="text"
                  value={whForm.name}
                  onChange={e => setWhForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Melbourne Logistics Centre"
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-600 block mb-1">Physical Address</label>
                <input
                  type="text"
                  value={whForm.address}
                  onChange={e => setWhForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Address details…"
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={whForm.phone}
                    onChange={e => setWhForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Email</label>
                  <input
                    type="email"
                    value={whForm.email}
                    onChange={e => setWhForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="wh-default-chk"
                  checked={whForm.isDefault}
                  onChange={e => setWhForm(f => ({ ...f, isDefault: e.target.checked }))}
                  className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="wh-default-chk" className="text-xs font-bold text-neutral-700">Set as Primary Default Warehouse</label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-neutral-200">
              <button onClick={() => setShowAddWH(false)} className="px-5 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
              <button onClick={handleSaveWH} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg">{editingWH ? 'Save Changes' : 'Create Location'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD BIN MODAL */}
      {showAddBinModal && selectedWHForBin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <div>
                <h2 className="font-black text-lg uppercase tracking-wider">Add Bin Location</h2>
                <div className="text-xs text-neutral-400 font-mono">{selectedWHForBin.name} ({selectedWHForBin.code})</div>
              </div>
              <button onClick={() => setShowAddBinModal(false)}><X className="h-5 w-5 text-neutral-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Zone</label>
                  <input
                    type="text"
                    value={binForm.zone}
                    onChange={e => setBinForm(f => ({ ...f, zone: e.target.value }))}
                    placeholder="e.g. Zone A"
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Rack</label>
                  <input
                    type="text"
                    value={binForm.rack}
                    onChange={e => setBinForm(f => ({ ...f, rack: e.target.value }))}
                    placeholder="e.g. Rack 1"
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Shelf</label>
                  <input
                    type="text"
                    value={binForm.shelf}
                    onChange={e => setBinForm(f => ({ ...f, shelf: e.target.value }))}
                    placeholder="e.g. Shelf 2"
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Bin Number</label>
                  <input
                    type="text"
                    value={binForm.binNumber}
                    onChange={e => setBinForm(f => ({ ...f, binNumber: e.target.value }))}
                    placeholder="e.g. 12"
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-600 block mb-1">Custom Bin Code (Optional)</label>
                <input
                  type="text"
                  value={binForm.code}
                  onChange={e => setBinForm(f => ({ ...f, code: e.target.value }))}
                  placeholder="Auto-generated if left blank (e.g. A-01-02-12)"
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-neutral-200">
              <button onClick={() => setShowAddBinModal(false)} className="px-5 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
              <button onClick={handleAddBin} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg">Add Bin Code</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW STOCK TRANSFER NOTE MODAL */}
      {showNewTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h2 className="font-black text-lg uppercase tracking-wider">New Stock Transfer Note</h2>
              <button onClick={() => setShowNewTransferModal(false)}><X className="h-5 w-5 text-neutral-400" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Origin (Dispatch From) *</label>
                  <select
                    value={transferForm.fromLocationId}
                    onChange={e => setTransferForm(f => ({ ...f, fromLocationId: e.target.value }))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Destination (Deliver To) *</label>
                  <select
                    value={transferForm.toLocationId}
                    onChange={e => setTransferForm(f => ({ ...f, toLocationId: e.target.value }))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Transfer Purpose / Reason</label>
                  <input
                    type="text"
                    value={transferForm.reason}
                    onChange={e => setTransferForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="e.g. Showroom stock refill"
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-600 block mb-1">Requested By</label>
                  <input
                    type="text"
                    value={transferForm.requestedBy}
                    onChange={e => setTransferForm(f => ({ ...f, requestedBy: e.target.value }))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <label className="text-xs font-bold text-neutral-600 block mb-2">Items to Transfer</label>
                <div className="space-y-2">
                  {transferForm.items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={it.productId}
                        onChange={e => {
                          const val = e.target.value;
                          setTransferForm(f => ({
                            ...f,
                            items: f.items.map((x, i) => i === idx ? { ...x, productId: val } : x)
                          }));
                        }}
                        className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                      >
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (Available: {p.stock})</option>)}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 1;
                          setTransferForm(f => ({
                            ...f,
                            items: f.items.map((x, i) => i === idx ? { ...x, quantity: val } : x)
                          }));
                        }}
                        className="w-20 border border-neutral-300 rounded-lg px-3 py-2 text-sm text-center font-bold"
                      />

                      {transferForm.items.length > 1 && (
                        <button
                          onClick={() => setTransferForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => setTransferForm(f => ({ ...f, items: [...f.items, { productId: products[0]?.id || '', quantity: 1 }] }))}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2"
                  >
                    <Plus className="h-3 w-3" /> Add Another Line Item
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-neutral-200">
              <button onClick={() => setShowNewTransferModal(false)} className="px-5 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
              <button onClick={handleSaveTransfer} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg">Generate Transfer Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
