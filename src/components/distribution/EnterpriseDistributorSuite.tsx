import React, { useState } from 'react';
import { 
  Building2, 
  Truck, 
  Tag, 
  Users, 
  Layers, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  DollarSign, 
  FileText, 
  Package, 
  Printer, 
  Search, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Boxes,
  Zap,
  Globe
} from 'lucide-react';
import { Product, Supplier } from '../../types';
import { 
  DEFAULT_PRICE_MATRIX_RULES, 
  DEFAULT_CONTAINER_SHIPMENTS, 
  DEFAULT_RESELLER_PARTNERS, 
  calculateContractPrice 
} from '../../utils/distributorEngine';

interface EnterpriseDistributorSuiteProps {
  products: Product[];
  suppliers: Supplier[];
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function EnterpriseDistributorSuite({
  products,
  suppliers,
  onShowAlert
}: EnterpriseDistributorSuiteProps) {
  const [activeTab, setActiveTab] = useState<'containers' | 'pricing_matrix' | 'logistics' | 'resellers'>('containers');
  const [containers, setContainers] = useState(DEFAULT_CONTAINER_SHIPMENTS);
  const [priceRules, setPriceRules] = useState(DEFAULT_PRICE_MATRIX_RULES);
  const [resellers, setResellers] = useState(DEFAULT_RESELLER_PARTNERS);

  const [selectedTier, setSelectedTier] = useState('Gold Reseller Tier');
  const [bulkQty, setBulkQty] = useState('50');

  const handlePrintConsignmentNote = (containerId: string) => {
    onShowAlert?.(`Pallet Consignment Manifest printed for Container ${containerId}!`, 'success');
  };

  const handleUpdateCreditLimit = (resellerId: string, newLimit: number) => {
    setResellers(prev => prev.map(r => r.id === resellerId ? { ...r, creditLimit: newLimit } : r));
    onShowAlert?.(`Credit limit updated for reseller ${resellerId}!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl text-slate-900 dark:text-white shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-600/30 border border-blue-200 dark:border-blue-400/30 rounded-2xl backdrop-blur-md">
            <Building2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-blue-50 text-blue-700 rounded border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
              IT WHOLESALE &amp; DISTRIBUTOR OPERATIONS
            </span>
            <h2 className="text-xl font-black tracking-tight mt-1 text-slate-900 dark:text-white">High-Volume Purchasing, Logistics &amp; MSP Management</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Targeted for Hardware Distributors, IT Wholesalers, Importers, MSP Suppliers &amp; System Integrators</p>
          </div>
        </div>
      </div>

      {/* Target Sectors Ribbon */}
      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 font-mono text-[11px]">
        <span className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] mr-2">Target Customers:</span>
        {['Computer Hardware Distributors', 'IT Wholesalers', 'Importers', 'Networking & Laptop Distributors', 'MSP Suppliers', 'System Integrators'].map(sec => (
          <span key={sec} className="px-2.5 py-1 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 rounded-lg border border-slate-200 dark:border-slate-800 font-bold shadow-2xs">
            {sec}
          </span>
        ))}
      </div>

      {/* Workspace Tabs */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 shadow-xs">
        <button
          onClick={() => setActiveTab('containers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'containers' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Boxes className="w-4 h-4" /> High-Volume Container Purchasing
        </button>

        <button
          onClick={() => setActiveTab('pricing_matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'pricing_matrix' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" /> Customer-Specific Matrix Pricing
        </button>

        <button
          onClick={() => setActiveTab('logistics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'logistics' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" /> Logistics &amp; Pallet Dispatch
        </button>

        <button
          onClick={() => setActiveTab('resellers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'resellers' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Reseller &amp; MSP Partner Management
        </button>
      </div>

      {/* TAB 1: CONTAINER PURCHASING */}
      {activeTab === 'containers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200">Sea Freight Shipping Containers &amp; Bulk POs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {containers.map(c => (
              <div key={c.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-700 rounded border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">{c.id}</span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">{c.containerNumber}</h4>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Customs Code: {c.customsClearanceCode}</span>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border ${
                    c.status === 'Cleared Port' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-1 text-slate-700 dark:text-slate-300">
                  <div>Pallet Quantity: <strong className="text-blue-600 dark:text-blue-300">{c.palletsCount} Pallets</strong></div>
                  <div>Duty &amp; Tariffs: <strong className="text-purple-600 dark:text-purple-300">${c.dutyTaxAmount.toFixed(2)} AUD</strong></div>
                  <div>Sea Freight Cost: <strong className="text-emerald-600 dark:text-emerald-400">${c.freightCost.toFixed(2)} AUD</strong></div>
                  <div>ETA Port Arrival: <strong className="text-slate-900 dark:text-slate-200">{c.etaPortDate}</strong></div>
                </div>

                <button
                  onClick={() => handlePrintConsignmentNote(c.id)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Container Unloading Manifest
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PRICING MATRIX */}
      {activeTab === 'pricing_matrix' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100">Customer-Specific Tiered Price Matrix Calculator</h3>
            <div className="flex gap-2">
              <select
                value={selectedTier}
                onChange={e => setSelectedTier(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-200 rounded-xl"
              >
                <option value="Gold Reseller Tier">Gold Reseller (25% Off)</option>
                <option value="Silver Reseller Tier">Silver Reseller (18% Off)</option>
                <option value="MSP Partner Tier">MSP Partner (20% Off)</option>
                <option value="System Integrator Tier">System Integrator (22% Off)</option>
              </select>

              <input
                type="number"
                placeholder="Bulk Qty"
                value={bulkQty}
                onChange={e => setBulkQty(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-mono text-emerald-600 dark:text-emerald-400 rounded-xl w-24 font-bold"
              />
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {products.slice(0, 5).map(prod => {
              const contract = calculateContractPrice(prod, selectedTier, parseInt(bulkQty, 10) || 1);
              return (
                <div key={prod.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{prod.name}</span>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Retail Base MSRP: <strong className="text-slate-700 dark:text-slate-300">${prod.price.toFixed(2)} AUD</strong></span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 text-sm">
                      {contract.formatted}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: LOGISTICS & PALLET DISPATCH */}
      {activeTab === 'logistics' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100">Pallet Logistics &amp; Carrier Consignment Notes</h3>
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">Consignment #CON-AU-99201</span>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Carrier: Toll Priority Freight &bull; Destination: Sydney B2B Hub</span>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold rounded-lg border border-blue-200 dark:border-blue-800">4 Pallets Dispatched</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">Consignment #CON-AU-88210</span>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Carrier: Mainfreight Express &bull; Destination: Melbourne Depot</span>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">8 Pallets Delivered</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RESELLER & MSP PARTNER MANAGEMENT */}
      {activeTab === 'resellers' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100">Reseller &amp; MSP Partner Accounts</h3>
          <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] uppercase bg-slate-100 dark:bg-slate-900">
                  <th className="p-3">Partner Business</th>
                  <th className="p-3">Sector</th>
                  <th className="p-3">Price Tier</th>
                  <th className="p-3">Trade Credit Limit</th>
                  <th className="p-3">Payment Terms</th>
                  <th className="p-3">Assigned Account Manager</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {resellers.map(r => (
                  <tr key={r.id}>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{r.businessName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 text-[10px]">{r.sector}</span>
                    </td>
                    <td className="p-3 text-purple-700 dark:text-purple-300 font-bold">{r.priceTier}</td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">${r.creditLimit.toLocaleString()} AUD</td>
                    <td className="p-3 text-amber-600 dark:text-amber-400 font-bold">{r.paymentTerms}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{r.assignedAccountManager}</td>
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
