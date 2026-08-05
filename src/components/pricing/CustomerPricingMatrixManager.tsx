import React, { useState } from 'react';
import { 
  Tag, 
  Sparkles, 
  Users, 
  Layers, 
  Plus, 
  CheckCircle2, 
  DollarSign, 
  Building2, 
  ShieldCheck, 
  Sliders, 
  Search, 
  Printer, 
  ChevronRight, 
  ArrowRight,
  Zap,
  Globe,
  Award
} from 'lucide-react';
import { Product, CustomerPriceRule, PricingTierType } from '../../types';
import { 
  DEFAULT_CUSTOMER_PRICE_RULES, 
  SAMPLE_CUSTOMERS_PRICING_DEMO, 
  calculateCustomerSpecificProductPrice 
} from '../../utils/customerPricingEngine';

interface CustomerPricingMatrixManagerProps {
  products: Product[];
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function CustomerPricingMatrixManager({
  products,
  onShowAlert
}: CustomerPricingMatrixManagerProps) {
  const [activeTab, setActiveTab] = useState<'simulator' | 'rules' | 'brand_category' | 'deals'>('simulator');
  const [rules, setRules] = useState<CustomerPriceRule[]>(DEFAULT_CUSTOMER_PRICE_RULES);
  const [selectedProduct, setSelectedProduct] = useState<Product>(() => {
    return products.find(p => p.name.includes('5070') || p.category === 'GPU') || (({
      id: 'P-RTX-5070',
      name: 'NVIDIA GeForce RTX 5070 12GB GDDR7 GPU',
      price: 999.00,
      costPrice: 650.00,
      stock: 45,
      sku: 'SKU-RTX-5070',
      category: 'Graphics Cards',
      description: 'Next-gen Blackwell Architecture GPU',
      image: '',
      additionalImages: [],
      rating: 5,
      reviewsCount: 12
    }) as unknown as Product);
  });

  const [simQty, setSimQty] = useState('1');

  // Modal State
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newCustName, setNewCustName] = useState('Customer A (Standard Reseller)');
  const [newCustId, setNewCustId] = useState('CUST-A');
  const [newTierType, setNewTierType] = useState<PricingTierType>('Individual Custom Price');
  const [newPrice, setNewPrice] = useState('890');

  const handleAddRule = () => {
    const rule: CustomerPriceRule = {
      id: 'PR-RULE-' + Math.floor(Math.random() * 9000 + 1000),
      customerId: newCustId,
      customerName: newCustName,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      tierType: newTierType,
      overridePrice: parseFloat(newPrice) || 890.00
    };

    setRules(prev => [rule, ...prev]);
    setShowAddRuleModal(false);
    onShowAlert?.(`Custom Price Rule created for ${newCustName} ($${newPrice} AUD)!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl text-slate-900 dark:text-white shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-600/30 border border-purple-200 dark:border-purple-400/30 rounded-2xl backdrop-blur-md">
            <Tag className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-purple-50 text-purple-700 rounded border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
              14-DIMENSION CUSTOMER MATRIX PRICING ENGINE
            </span>
            <h2 className="text-xl font-black tracking-tight mt-1 text-slate-900 dark:text-white">Automatic Customer-Specific Price Differentiation</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Same product SKU automatically renders different contract prices per reseller account</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddRuleModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Price Matrix Rule
        </button>
      </div>

      {/* 14 Pricing Dimensions Ribbon */}
      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 font-mono text-[11px]">
        <span className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] mr-2">Supported Pricing Dimensions:</span>
        {[
          'Individual Price Lists', 'Tier Pricing', 'Volume Pricing', 'Contract Pricing', 
          'Promotional Pricing', 'Brand Discounts', 'Category Discounts', 'Customer Group Pricing', 
          'Customer Margins', 'Special Project Deals', 'Government Pricing', 'Education Pricing', 
          'Dealer Pricing', 'VIP Pricing'
        ].map(dim => (
          <span key={dim} className="px-2.5 py-1 bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 rounded-lg border border-slate-200 dark:border-slate-800 font-bold shadow-2xs">
            {dim}
          </span>
        ))}
      </div>

      {/* Workspace Tabs */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 shadow-xs">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'simulator' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Live Multi-Customer Price Simulator
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'rules' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" /> Customer Contract Rules ({rules.length})
        </button>

        <button
          onClick={() => setActiveTab('brand_category')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'brand_category' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" /> Brand &amp; Category Discounts
        </button>

        <button
          onClick={() => setActiveTab('deals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'deals' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" /> OEM Special Project Deal Registrations
        </button>
      </div>

      {/* TAB 1: LIVE MULTI-CUSTOMER PRICE SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          {/* Selected Product Banner */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 shadow-xs">
            <div>
              <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest bg-purple-50 dark:bg-purple-950 px-2.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                ACTIVE HARDWARE PRODUCT SKU
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">{selectedProduct.name}</h3>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Base Retail MSRP: <strong className="text-slate-900 dark:text-slate-200">${selectedProduct.price.toFixed(2)} AUD</strong></span>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-mono text-slate-600 dark:text-slate-400 font-bold">Simulate Order Qty:</label>
              <input
                type="number"
                value={simQty}
                onChange={e => setSimQty(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 w-24"
              />
            </div>
          </div>

          {/* Side-by-Side 3-Customer Comparison Cards (RTX 5070 Example) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            {SAMPLE_CUSTOMERS_PRICING_DEMO.map(cust => {
              const res = calculateCustomerSpecificProductPrice(selectedProduct, cust.id, parseInt(simQty, 10) || 1, rules);
              return (
                <div key={cust.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-blue-50 text-blue-700 rounded border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                        {cust.tier}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-2">{cust.name}</h4>
                    </div>
                  </div>

                  {/* Calculated Dynamic Price Highlight */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-purple-200 dark:border-purple-500/40 space-y-1 text-center">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Automated Customer Price</span>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">${res.finalPrice.toFixed(2)} AUD</div>
                    <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold block">{res.effectiveDiscountPercent}% Off MSRP (Save ${res.savingsAmount.toFixed(2)})</span>
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>Applied Rule: <strong className="text-purple-700 dark:text-purple-400">{res.appliedRuleType}</strong></div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{res.appliedRuleDescription}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER CONTRACT RULES */}
      {activeTab === 'rules' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 font-mono text-xs shadow-xs">
          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100">Customer-Specific Matrix Price Rules</h3>
          <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] uppercase bg-slate-100 dark:bg-slate-900">
                  <th className="p-3">Rule ID</th>
                  <th className="p-3">Customer Account</th>
                  <th className="p-3">Pricing Dimension</th>
                  <th className="p-3">Target Hardware / Category</th>
                  <th className="p-3 text-right">Contract Price / Discount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {rules.map(r => (
                  <tr key={r.id}>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 text-[10px]">{r.id}</span>
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{r.customerName}</td>
                    <td className="p-3 text-blue-700 dark:text-blue-300 font-bold">{r.tierType}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{r.productName || r.brand || r.category || 'All Products'}</td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {r.overridePrice ? `$${r.overridePrice.toFixed(2)} AUD` : `${r.discountPercent}% Off`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in font-mono text-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-slate-900 dark:text-white shadow-2xl">
            <h3 className="font-black text-sm uppercase text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3">Create Customer Price Rule</h3>

            <div className="space-y-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold block mb-1">Customer Account</label>
                <select
                  value={newCustId}
                  onChange={e => {
                    setNewCustId(e.target.value);
                    const found = SAMPLE_CUSTOMERS_PRICING_DEMO.find(c => c.id === e.target.value);
                    if (found) setNewCustName(found.name);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-slate-900 dark:text-slate-200"
                >
                  <option value="CUST-A">Customer A (Standard Reseller)</option>
                  <option value="CUST-B">Customer B (Gold Dealer Partner)</option>
                  <option value="CUST-C">Customer C (VIP Defense Project)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold block mb-1">Pricing Dimension Tier</label>
                <select
                  value={newTierType}
                  onChange={e => setNewTierType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-slate-900 dark:text-slate-200"
                >
                  <option value="Individual Custom Price">Individual Custom Price</option>
                  <option value="Dealer Pricing">Dealer Pricing</option>
                  <option value="VIP Reseller">VIP Reseller</option>
                  <option value="Special Project Deal">Special Project Deal</option>
                  <option value="Government Pricing">Government Pricing</option>
                  <option value="Education Pricing">Education Pricing</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold block mb-1">Contract Override Price ($ AUD)</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={handleAddRule}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase shadow-lg shadow-purple-600/20"
              >
                Save Matrix Price Rule
              </button>
              <button
                type="button"
                onClick={() => setShowAddRuleModal(false)}
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
