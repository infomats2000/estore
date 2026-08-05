import React, { useState } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Users, 
  Globe, 
  Sparkles, 
  Tag, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  Package, 
  DollarSign, 
  Zap, 
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';
import { Product, Order, CustomerProfile } from '../../types';
import { 
  calculateSalesForecast, 
  calculateABCXYZAnalysis, 
  calculateCustomerCLVAndChurn, 
  calculateGeographicHeatmap 
} from '../../utils/businessIntelligenceEngine';

interface BusinessIntelligenceManagerProps {
  products: Product[];
  orders: Order[];
  customers: CustomerProfile[];
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function BusinessIntelligenceManager({
  products,
  orders,
  customers,
  onShowAlert
}: BusinessIntelligenceManagerProps) {
  const [activeTab, setActiveTab] = useState<'forecasting' | 'abc_xyz' | 'clv_churn' | 'dynamic_pricing' | 'heatmap'>('forecasting');

  const forecast = calculateSalesForecast(orders);
  const biProducts = calculateABCXYZAnalysis(products, orders);
  const biCustomers = calculateCustomerCLVAndChurn(customers, orders);
  const geoHeatmap = calculateGeographicHeatmap(orders);

  const handleLaunchCampaign = (customerName: string) => {
    onShowAlert?.(`Re-engagement Email & SMS offer dispatched to ${customerName}!`, 'success');
  };

  const handleApplyDynamicPrice = (productName: string, newPrice: number) => {
    onShowAlert?.(`Dynamic Price adjustment applied to ${productName} (New Price: $${newPrice.toFixed(2)})`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Executive Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl text-slate-900 dark:text-white shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-600/30 border border-purple-200 dark:border-purple-400/30 rounded-2xl backdrop-blur-md">
            <Sparkles className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">
              EXECUTIVE PREDICTIVE INTELLIGENCE
            </span>
            <h2 className="text-xl font-black tracking-tight mt-1">Business Intelligence &amp; AI Decision Suite</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Sales Forecasting, ABC/XYZ Matrix, Customer CLV, Churn Radar &amp; Dynamic Pricing</p>
          </div>
        </div>

        <button
          onClick={() => onShowAlert?.('Refreshing AI Predictive Datasets...', 'info')}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh AI Models
        </button>
      </div>

      {/* Workspace Tabs */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 shadow-xs">
        <button
          onClick={() => setActiveTab('forecasting')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'forecasting' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Sales &amp; Demand Forecasting
        </button>

        <button
          onClick={() => setActiveTab('abc_xyz')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'abc_xyz' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" /> ABC / XYZ Inventory Matrix
        </button>

        <button
          onClick={() => setActiveTab('clv_churn')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'clv_churn' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Customer CLV &amp; Churn Radar
        </button>

        <button
          onClick={() => setActiveTab('dynamic_pricing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'dynamic_pricing' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" /> Dynamic Pricing &amp; Upsell Engine
        </button>

        <button
          onClick={() => setActiveTab('heatmap')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'heatmap' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" /> Geographic Sales Heatmap
        </button>
      </div>

      {/* TAB 1: SALES & DEMAND FORECASTING */}
      {activeTab === 'forecasting' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">30-DAY PREDICTIVE SALES</span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">${forecast.day30.toLocaleString()} AUD</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">Confidence Band: ${forecast.confidenceMin.toLocaleString()} - ${forecast.confidenceMax.toLocaleString()}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">60-DAY PREDICTIVE SALES</span>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400">${forecast.day60.toLocaleString()} AUD</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">Projected Growth: +8.4% YoY</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">90-DAY PREDICTIVE SALES</span>
              <div className="text-3xl font-black text-purple-600 dark:text-purple-400">${forecast.day90.toLocaleString()} AUD</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">Quarterly Demand Trajectory</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100">Stock Depletion Countdown &amp; Reorder Forecast</h3>
            <div className="space-y-3 font-mono text-xs">
              {biProducts.slice(0, 5).map(prod => (
                <div key={prod.productId} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{prod.productName}</span>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] mt-0.5">Estimated Depletion Date: <strong className="text-amber-600 dark:text-amber-400">{prod.stockDepletionDate}</strong></span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold rounded-lg border border-slate-200 dark:border-slate-800">
                      {prod.daysOfStockRemaining} Days Stock Left
                    </span>

                    {prod.recommendedReorderQty > 0 && (
                      <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">
                        Reorder +{prod.recommendedReorderQty} Units
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ABC / XYZ MATRIX */}
      {activeTab === 'abc_xyz' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100">ABC / XYZ 9-Box Inventory Strategy Grid</h3>
            <span className="text-[11px] font-mono text-purple-700 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded border border-purple-200 dark:border-purple-800">
              Pareto Revenue (ABC) x Demand Volatility (XYZ)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-emerald-300 dark:border-emerald-500/40 space-y-2">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold rounded border border-emerald-300 dark:border-emerald-800 text-[10px] uppercase">
                CLASS AX (High Value + Constant Demand)
              </span>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">Top 80% revenue drivers with predictable sales velocity. Maintain buffer stock.</p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold pt-2 border-t border-slate-200 dark:border-slate-900">
                Count: {biProducts.filter(p => p.abcClass === 'A' && p.xyzClass === 'X').length} SKUs
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-blue-300 dark:border-blue-500/40 space-y-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold rounded border border-blue-300 dark:border-blue-800 text-[10px] uppercase">
                CLASS BY (Moderate Value + Fluctuating Demand)
              </span>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">Secondary 15% revenue drivers. Reorder based on seasonal lead times.</p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold pt-2 border-t border-slate-200 dark:border-slate-900">
                Count: {biProducts.filter(p => p.abcClass === 'B' && p.xyzClass === 'Y').length} SKUs
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-amber-300 dark:border-amber-500/40 space-y-2">
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold rounded border border-amber-300 dark:border-amber-800 text-[10px] uppercase">
                CLASS CZ (Low Value + Sporadic Demand)
              </span>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">Bottom 5% revenue drivers with unpredictable demand. Minimize safety stock.</p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold pt-2 border-t border-slate-200 dark:border-slate-900">
                Count: {biProducts.filter(p => p.abcClass === 'C' && p.xyzClass === 'Z').length} SKUs
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER CLV & CHURN RADAR */}
      {activeTab === 'clv_churn' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100">Customer Lifetime Value (CLV) &amp; Churn Risk Radar</h3>
          <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] uppercase bg-slate-100 dark:bg-slate-900">
                  <th className="p-3">Client Account</th>
                  <th className="p-3">Organization</th>
                  <th className="p-3">12-Month Predictive CLV</th>
                  <th className="p-3">Churn Risk Score</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {biCustomers.map(c => (
                  <tr key={c.customerId}>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{c.customerName}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{c.companyName}</td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">${c.predictive12MoCLV.toLocaleString()} AUD</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 font-bold rounded text-[10px] border ${
                        c.churnRiskScore === 'High Risk' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                      }`}>
                        {c.churnRiskScore}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleLaunchCampaign(c.customerName)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        Launch Re-Engagement Campaign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DYNAMIC PRICING */}
      {activeTab === 'dynamic_pricing' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100">AI Dynamic Pricing &amp; Price Optimization Suggestions</h3>
          <div className="space-y-3 font-mono text-xs">
            {biProducts.map(prod => (
              <div key={prod.productId} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{prod.productName}</span>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Current: <strong className="text-slate-700 dark:text-slate-200">${prod.currentPrice.toFixed(2)}</strong> &bull; Reason: <strong className="text-purple-600 dark:text-purple-300">{prod.priceActionReason}</strong></span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">${prod.suggestedPrice.toFixed(2)} AUD</span>
                  <button
                    onClick={() => handleApplyDynamicPrice(prod.productName, prod.suggestedPrice)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Apply Price Adjustment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: GEOGRAPHIC HEATMAP */}
      {activeTab === 'heatmap' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100">Geographic Regional Revenue &amp; Margin Heatmap</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
            {geoHeatmap.map(geo => (
              <div key={geo.regionCode} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">{geo.regionCode}</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Margin: {geo.grossMarginPercent}%</span>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{geo.regionName}</h4>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] space-y-0.5 pt-2 border-t border-slate-200 dark:border-slate-900">
                  <div>Orders: <strong className="text-slate-800 dark:text-slate-200">{geo.orderCount} Orders</strong></div>
                  <div>Total Revenue: <strong className="text-emerald-600 dark:text-emerald-400">${geo.totalRevenue.toLocaleString()} AUD</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
