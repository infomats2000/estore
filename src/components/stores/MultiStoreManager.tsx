import React, { useState } from 'react';
import { 
  Building2, 
  Store, 
  MapPin, 
  Globe, 
  DollarSign, 
  ArrowRightLeft, 
  CheckCircle2, 
  Plus, 
  Search, 
  Layers, 
  Tag, 
  Percent, 
  TrendingUp, 
  RefreshCw, 
  ShieldCheck,
  X
} from 'lucide-react';
import { StoreBranch, StockTransferOrder, Product, WarehouseLocation, RegionalPriceOverride } from '../../types';
import { DEFAULT_STORE_BRANCHES, calculateRegionalPrice, calculateLocalTax } from '../../utils/multiStoreEngine';

interface MultiStoreManagerProps {
  products: Product[];
  warehouses: WarehouseLocation[];
  onUpdateProductStock?: (productId: string, newStock: number, reason: string, notes?: string) => void;
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function MultiStoreManager({
  products,
  warehouses,
  onUpdateProductStock,
  onShowAlert
}: MultiStoreManagerProps) {
  const [activeTab, setActiveTab] = useState<'branches' | 'transfers' | 'regional_pricing' | 'tax_currencies'>('branches');
  const [stores, setStores] = useState<StoreBranch[]>(DEFAULT_STORE_BRANCHES);

  // Transfers state
  const [transfers, setTransfers] = useState<StockTransferOrder[]>([
    {
      id: 'TRF-1001',
      transferNumber: 'TRF-2026-081',
      sourceStoreId: 'STORE-SYD-01',
      sourceStoreName: 'Sydney Flagship Store & HQ',
      destinationStoreId: 'STORE-MEL-02',
      destinationStoreName: 'Melbourne CBD Hardware Hub',
      sourceWarehouseId: 'WH-001',
      destinationWarehouseId: 'WH-002',
      status: 'In Transit',
      createdDate: '2026-08-03',
      dispatchedDate: '2026-08-04',
      items: [
        { productId: 'P-001', productName: 'Dell Latitude 5420 Enterprise Laptop', quantity: 5 },
        { productId: 'P-002', productName: 'Lenovo ThinkPad T14 Gen 2', quantity: 3 }
      ]
    }
  ]);

  // Regional Price Overrides State
  const [overrides, setOverrides] = useState<RegionalPriceOverride[]>([
    { productId: 'P-001', storeId: 'STORE-AKL-01', regionalPrice: 1899.00, regionalDiscountPrice: 1699.00 },
    { productId: 'P-001', storeId: 'STORE-USA-01', regionalPrice: 1149.00, regionalDiscountPrice: 999.00 }
  ]);

  // New Store Branch modal state
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCode, setNewStoreCode] = useState('');
  const [newStoreRegion, setNewStoreRegion] = useState<StoreBranch['region']>('Australia - NSW');

  // New Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [trfSourceStore, setTrfSourceStore] = useState('STORE-SYD-01');
  const [trfDestStore, setTrfDestStore] = useState('STORE-MEL-02');
  const [trfProdId, setTrfProdId] = useState(products[0]?.id || 'P-001');
  const [trfQty, setTrfQty] = useState('5');

  const handleAddStore = () => {
    if (!newStoreName.trim() || !newStoreCode.trim()) {
      onShowAlert?.('Store name and store code are required.', 'error');
      return;
    }

    const branch: StoreBranch = {
      id: 'STORE-' + newStoreCode.toUpperCase(),
      storeName: newStoreName,
      code: newStoreCode.toUpperCase(),
      region: newStoreRegion,
      currencySymbol: '$',
      currencyCode: 'AUD',
      currencyRateToAUD: 1.0,
      localTaxRatePercent: 10.0,
      defaultWarehouseId: 'WH-001',
      address: 'Central Business Hub',
      phone: '1300 000 STORE',
      active: true
    };

    setStores(prev => [...prev, branch]);
    setShowAddStoreModal(false);
    setNewStoreName('');
    setNewStoreCode('');
    onShowAlert?.(`Store branch "${branch.storeName}" (${branch.code}) added!`, 'success');
  };

  const handleCreateTransfer = () => {
    const prod = products.find(p => p.id === trfProdId);
    const srcStore = stores.find(s => s.id === trfSourceStore);
    const dstStore = stores.find(s => s.id === trfDestStore);

    if (!prod || !srcStore || !dstStore) return;

    const trf: StockTransferOrder = {
      id: 'TRF-' + Date.now(),
      transferNumber: 'TRF-' + String(Date.now()).slice(-5),
      sourceStoreId: srcStore.id,
      sourceStoreName: srcStore.storeName,
      destinationStoreId: dstStore.id,
      destinationStoreName: dstStore.storeName,
      sourceWarehouseId: srcStore.defaultWarehouseId,
      destinationWarehouseId: dstStore.defaultWarehouseId,
      status: 'In Transit',
      createdDate: new Date().toISOString().split('T')[0],
      dispatchedDate: new Date().toISOString().split('T')[0],
      items: [
        { productId: prod.id, productName: prod.name, quantity: parseInt(trfQty, 10) || 1 }
      ]
    };

    setTransfers(prev => [trf, ...prev]);
    setShowTransferModal(false);
    onShowAlert?.(`Inter-Branch Transfer ${trf.transferNumber} created & dispatched!`, 'success');
  };

  const handleCompleteTransfer = (trfId: string) => {
    setTransfers(prev => prev.map(t => {
      if (t.id !== trfId) return t;
      t.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const currentStock = prod ? prod.stock : 0;
        onUpdateProductStock?.(item.productId, currentStock + item.quantity, 'Inter-Branch Stock Transfer', `Stock transfer #${t.transferNumber} received`);
      });
      return {
        ...t,
        status: 'Completed',
        receivedDate: new Date().toISOString().split('T')[0]
      };
    }));
    onShowAlert?.('Transfer marked as Completed! Stock successfully credited to destination warehouse.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ACTIVE STORE BRANCHES</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stores.length} Retail Stores</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-mono">Australia, New Zealand &amp; USA</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ACTIVE INTER-STORE TRANSFERS</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{transfers.filter(t => t.status === 'In Transit').length} In Transit</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Real-time Stock Relocation</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">SUPPORTED CURRENCIES</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">5 Global FX</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-mono">AUD, NZD, USD, GBP, EUR</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">REGIONAL TAX COMPLIANCE</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>10% GST / 15% NZ GST</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-mono">Automated Regional Tax Calculations</span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 shadow-xs">
        <button
          onClick={() => setActiveTab('branches')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'branches' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Store className="w-4 h-4" /> Retail Store Branches &amp; Directory
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'transfers' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" /> Inter-Branch Stock Transfers
        </button>

        <button
          onClick={() => setActiveTab('regional_pricing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'regional_pricing' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" /> Regional Pricing Matrix
        </button>

        <button
          onClick={() => setActiveTab('tax_currencies')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'tax_currencies' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" /> Local Tax &amp; FX Currency Rules
        </button>
      </div>

      {/* TAB 1: STORE BRANCHES */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200">Store Branches &amp; Regional Outlets</h3>
            <button
              onClick={() => setShowAddStoreModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Store Branch
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map(store => (
              <div key={store.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-700 rounded border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">{store.code}</span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">{store.storeName}</h4>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{store.region}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    Tax: {store.localTaxRatePercent}%
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 font-mono text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <div>Currency: <strong className="text-slate-900 dark:text-slate-200">{store.currencySymbol} ({store.currencyCode}) @ {store.currencyRateToAUD}x AUD</strong></div>
                  <div>Assigned WH: <strong className="text-blue-600 dark:text-blue-300">{store.defaultWarehouseId}</strong></div>
                  <div>Address: <strong className="text-slate-700 dark:text-slate-300">{store.address}</strong></div>
                  <div>Phone: <strong className="text-slate-700 dark:text-slate-300">{store.phone}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: INTER-BRANCH STOCK TRANSFERS */}
      {activeTab === 'transfers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200">Inter-Branch Inventory Transfers</h3>
            <button
              onClick={() => setShowTransferModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" /> Create Stock Transfer
            </button>
          </div>

          <div className="space-y-3">
            {transfers.map(trf => (
              <div key={trf.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-xs font-mono font-bold rounded-lg border border-amber-200 dark:border-amber-800">{trf.transferNumber}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200">{trf.sourceStoreName} &rarr; {trf.destinationStoreName}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
                    Dispatched: {trf.dispatchedDate} &bull; Items: {trf.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border ${
                    trf.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
                  }`}>
                    {trf.status}
                  </span>

                  {trf.status === 'In Transit' && (
                    <button
                      onClick={() => handleCompleteTransfer(trf.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md"
                    >
                      Receive Transfer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REGIONAL PRICING MATRIX */}
      {activeTab === 'regional_pricing' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100">Regional Price Overrides Matrix</h3>
          <div className="space-y-3 font-mono text-xs">
            {products.slice(0, 5).map(prod => (
              <div key={prod.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{prod.name}</span>
                  <span className="text-slate-500 dark:text-slate-400">Base AUD Price: <strong className="text-emerald-600 dark:text-emerald-400">${prod.price.toFixed(2)} AUD</strong></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  {stores.map(store => {
                    const regional = calculateRegionalPrice(prod, store, overrides);
                    return (
                      <div key={store.id} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">{store.code} ({store.currencyCode})</span>
                        <strong className="text-blue-600 dark:text-blue-300">{regional.formatted}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TAX & CURRENCY RULES */}
      {activeTab === 'tax_currencies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Percent className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Regional Local Tax Rules
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between">
                <span className="text-slate-700 dark:text-slate-300">Australia (NSW, VIC, QLD):</span>
                <strong className="text-purple-700 dark:text-purple-400">10.0% ATO GST</strong>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between">
                <span className="text-slate-700 dark:text-slate-300">New Zealand (Auckland):</span>
                <strong className="text-purple-700 dark:text-purple-400">15.0% IRD GST</strong>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between">
                <span className="text-slate-700 dark:text-slate-300">United States (California):</span>
                <strong className="text-purple-700 dark:text-purple-400">8.25% Sales Tax</strong>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Live FX Multi-Currency Exchange Rates
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between">
                <span className="text-slate-700 dark:text-slate-300">1.00 AUD &rarr; AUD (Base Currency)</span>
                <strong className="text-blue-600 dark:text-blue-400">1.00x</strong>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between">
                <span className="text-slate-700 dark:text-slate-300">1.00 AUD &rarr; NZD (New Zealand Dollar)</span>
                <strong className="text-blue-600 dark:text-blue-400">1.08x NZD</strong>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between">
                <span className="text-slate-700 dark:text-slate-300">1.00 AUD &rarr; USD (US Dollar)</span>
                <strong className="text-blue-600 dark:text-blue-400">0.65x USD</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Store Modal */}
      {showAddStoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-slate-900 dark:text-white shadow-2xl">
            <h3 className="font-black text-sm uppercase text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3">Add Store Branch</h3>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Store Name (e.g. Perth Flagship)"
                value={newStoreName}
                onChange={e => setNewStoreName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl text-slate-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Store Code (e.g. PER-01)"
                value={newStoreCode}
                onChange={e => setNewStoreCode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl text-slate-900 dark:text-white uppercase font-mono"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={handleAddStore}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase"
              >
                Create Store Branch
              </button>
              <button
                type="button"
                onClick={() => setShowAddStoreModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-slate-900 dark:text-white shadow-2xl">
            <h3 className="font-black text-sm uppercase text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3">Create Inter-Branch Stock Transfer</h3>

            <div className="space-y-3">
              <select
                value={trfSourceStore}
                onChange={e => setTrfSourceStore(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl text-slate-900 dark:text-slate-200"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>Source: {s.storeName}</option>
                ))}
              </select>

              <select
                value={trfDestStore}
                onChange={e => setTrfDestStore(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl text-slate-900 dark:text-slate-200"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>Destination: {s.storeName}</option>
                ))}
              </select>

              <select
                value={trfProdId}
                onChange={e => setTrfProdId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl text-slate-900 dark:text-slate-200"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Transfer Quantity"
                value={trfQty}
                onChange={e => setTrfQty(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl text-emerald-600 dark:text-emerald-400 font-mono"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={handleCreateTransfer}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase"
              >
                Dispatch Transfer
              </button>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
