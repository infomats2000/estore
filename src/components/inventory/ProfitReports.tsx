import React, { useState } from 'react';
import { Product, FinanceTransaction } from '../../types';
import { TrendingUp, DollarSign, PieChart, ArrowUpRight, ArrowDownRight, Tag, Layers, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ProfitReportsProps {
  products: Product[];
  categories: string[];
}

export default function ProfitReports({
  products,
  categories
}: ProfitReportsProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProducts = products.filter(p => selectedCategory === 'All' || p.category === selectedCategory);

  // Profit metrics calculations
  const totalStockCount = filteredProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalCostValue = filteredProducts.reduce((sum, p) => sum + (p.costPrice || (p.price * 0.6)) * (p.stock || 0), 0);
  const totalRetailValue = filteredProducts.reduce((sum, p) => sum + (p.discountPrice || p.price) * (p.stock || 0), 0);
  const totalPotentialProfit = totalRetailValue - totalCostValue;
  const overallMarginPercent = totalRetailValue > 0 ? (totalPotentialProfit / totalRetailValue) * 100 : 0;

  // Category breakdown metrics
  const categoryMetrics = categories.map(cat => {
    const catProducts = products.filter(p => p.category === cat);
    const catCost = catProducts.reduce((sum, p) => sum + (p.costPrice || (p.price * 0.6)) * (p.stock || 0), 0);
    const catRetail = catProducts.reduce((sum, p) => sum + (p.discountPrice || p.price) * (p.stock || 0), 0);
    const catProfit = catRetail - catCost;
    const catMargin = catRetail > 0 ? (catProfit / catRetail) * 100 : 0;

    return {
      category: cat,
      cost: catCost,
      retail: catRetail,
      profit: catProfit,
      margin: catMargin,
      count: catProducts.length
    };
  });

  // Top high margin and low margin products
  const productsWithMargin = filteredProducts.map(p => {
    const cost = p.costPrice || (p.price * 0.6);
    const price = p.discountPrice || p.price;
    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    return { ...p, unitCost: cost, unitPrice: price, unitProfit: profit, marginPercent: margin };
  });

  const sortedByMarginDesc = [...productsWithMargin].sort((a, b) => b.marginPercent - a.marginPercent);

  return (
    <div className="space-y-6 font-sans">
      {/* Category Filter */}
      <div className="flex items-center justify-between bg-white border border-neutral-300 p-4">
        <div>
          <h3 className="font-mono text-sm font-black uppercase text-neutral-900">Profit Margin & Inventory Cost Intelligence</h3>
          <p className="font-sans text-xs text-neutral-500">Real-time analysis of COGS (Cost of Goods Sold), potential gross profit, and high-margin SKUs</p>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-neutral-100 border border-neutral-400 p-2 font-mono text-xs font-bold outline-none"
        >
          <option value="All">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-300 p-5">
          <span className="font-mono text-[9px] uppercase font-bold text-neutral-500 block mb-1">Total Stock COGS Cost</span>
          <span className="font-mono text-2xl font-black text-neutral-900">${totalCostValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="font-mono text-[10px] text-neutral-500 block mt-1">Across {totalStockCount} units in stock</span>
        </div>

        <div className="bg-white border border-neutral-300 p-5">
          <span className="font-mono text-[9px] uppercase font-bold text-neutral-500 block mb-1">Total Retail Asset Value</span>
          <span className="font-mono text-2xl font-black text-neutral-900">${totalRetailValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="font-mono text-[10px] text-emerald-600 block mt-1 font-bold">Gross inventory asset value</span>
        </div>

        <div className="bg-white border border-neutral-300 p-5">
          <span className="font-mono text-[9px] uppercase font-bold text-neutral-500 block mb-1">Projected Gross Profit</span>
          <span className="font-mono text-2xl font-black text-emerald-600">${totalPotentialProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="font-mono text-[10px] text-emerald-600 block mt-1 font-bold">Potential gross profit</span>
        </div>

        <div className="bg-white border border-neutral-300 p-5">
          <span className="font-mono text-[9px] uppercase font-bold text-neutral-500 block mb-1">Average Profit Margin %</span>
          <span className="font-mono text-2xl font-black text-blue-600">{overallMarginPercent.toFixed(1)}%</span>
          <span className="font-mono text-[10px] text-blue-600 block mt-1 font-bold">Overall return on inventory</span>
        </div>
      </div>

      {/* Recharts Profit Bar Chart */}
      <div className="bg-white border border-neutral-300 p-6">
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-900 mb-4">
          Category Profit Breakdown ($)
        </h4>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryMetrics}>
              <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip 
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Profit']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
              />
              <Bar dataKey="profit" fill="#2563eb" radius={[0, 0, 0, 0]}>
                {categoryMetrics.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#0f172a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Highest Margin Product Table */}
      <div className="bg-white border border-neutral-300 p-6">
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-900 mb-4">
          Product Margin Ranking (Highest to Lowest)
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left font-sans text-xs">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-300 font-mono text-[10px] uppercase font-bold text-neutral-700">
                <th className="p-3">Product Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Cost Price</th>
                <th className="p-3">Retail Price</th>
                <th className="p-3">Unit Profit</th>
                <th className="p-3">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {sortedByMarginDesc.map(p => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="p-3 font-bold text-neutral-900">{p.name}</td>
                  <td className="p-3 font-mono text-neutral-500">{p.category}</td>
                  <td className="p-3 font-mono text-neutral-600">${p.unitCost.toFixed(2)}</td>
                  <td className="p-3 font-mono font-bold text-neutral-900">${p.unitPrice.toFixed(2)}</td>
                  <td className="p-3 font-mono font-bold text-emerald-700">+${p.unitProfit.toFixed(2)}</td>
                  <td className="p-3 font-mono font-black text-blue-600">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 border border-blue-200">
                      {p.marginPercent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
