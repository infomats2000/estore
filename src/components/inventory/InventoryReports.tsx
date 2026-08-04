import React, { useState } from 'react';
import { Product, Supplier } from '../../types';
import { BarChart2, TrendingUp, AlertTriangle, Download, DollarSign, Package, PieChart } from 'lucide-react';

interface InventoryReportsProps {
  products: Product[];
  categories: string[];
  collections: string[];
  suppliers: Supplier[];
}

export default function InventoryReports({
  products,
  categories,
  collections,
  suppliers
}: InventoryReportsProps) {
  const [reportType, setReportType] = useState<'valuation' | 'low-stock' | 'performance'>('valuation');

  const totalValue = products.reduce((acc, p) => acc + (p.stock * p.price), 0);
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockThreshold = 5;
  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold);
  const outOfStockItems = products.filter(p => p.stock === 0);

  const exportReport = () => {
    // Generate CSV based on selected report
    let csv = '';
    if (reportType === 'valuation') {
      csv = 'Category,Item Count,Total Units,Total Value\n';
      categories.forEach(cat => {
        const catProds = products.filter(p => p.category === cat);
        const units = catProds.reduce((sum, p) => sum + p.stock, 0);
        const val = catProds.reduce((sum, p) => sum + p.stock * p.price, 0);
        csv += `"${cat}",${catProds.length},${units},${val}\n`;
      });
    } else if (reportType === 'low-stock') {
      csv = 'SKU,Name,Category,Current Stock,Unit Price\n';
      [...outOfStockItems, ...lowStockItems].forEach(p => {
        csv += `"${p.id}","${p.name}","${p.category}",${p.stock},${p.price}\n`;
      });
    } else if (reportType === 'performance') {
      csv = 'Product,Sales,Revenue,Rating\n';
      products.sort((a, b) => (b.sales || 0) - (a.sales || 0)).forEach(p => {
        csv += `"${p.name}",${p.sales || 0},${(p.sales || 0) * p.price},${p.rating}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `inventory_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="inventory-reports">
      {/* KPI banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-500">
              Total Capital Value
            </div>
            <div className="font-sans text-xl font-black text-neutral-900 dark:text-neutral-100">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-500">
              Total Units
            </div>
            <div className="font-sans text-xl font-black text-neutral-900 dark:text-neutral-100">
              {totalUnits.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-lg">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-500">
              Low / Out of Stock
            </div>
            <div className="font-sans text-xl font-black text-neutral-900 dark:text-neutral-100">
              {lowStockItems.length + outOfStockItems.length}
            </div>
          </div>
        </div>
        
        <div className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-lg">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-500">
              Top Selling Item
            </div>
            <div className="font-sans text-sm font-black text-neutral-900 dark:text-neutral-100 line-clamp-1">
              {products.length > 0 ? [...products].sort((a,b) => (b.sales || 0) - (a.sales || 0))[0].name : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50 dark:bg-neutral-950">
          <div className="flex gap-2">
            <button 
              onClick={() => setReportType('valuation')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${reportType === 'valuation' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
            >
              Valuation
            </button>
            <button 
              onClick={() => setReportType('low-stock')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${reportType === 'low-stock' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
            >
              Stock Alerts
            </button>
            <button 
              onClick={() => setReportType('performance')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${reportType === 'performance' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
            >
              Performance
            </button>
          </div>

          <button onClick={exportReport} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="p-6">
          {reportType === 'valuation' && (
            <div className="space-y-4">
              <h3 className="font-sans text-sm font-black uppercase text-neutral-800 dark:text-neutral-200">Category Valuation Breakdown</h3>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-mono uppercase">
                    <th className="py-2">Category</th>
                    <th className="py-2 text-right">Items</th>
                    <th className="py-2 text-right">Units</th>
                    <th className="py-2 text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  {categories.map(cat => {
                    const catProds = products.filter(p => p.category === cat);
                    const units = catProds.reduce((sum, p) => sum + p.stock, 0);
                    const val = catProds.reduce((sum, p) => sum + p.stock * p.price, 0);
                    return (
                      <tr key={cat}>
                        <td className="py-3 font-bold text-neutral-800 dark:text-neutral-200">{cat}</td>
                        <td className="py-3 text-right font-mono">{catProds.length}</td>
                        <td className="py-3 text-right font-mono">{units}</td>
                        <td className="py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'low-stock' && (
            <div className="space-y-4">
              <h3 className="font-sans text-sm font-black uppercase text-rose-600 dark:text-rose-400">Restock Action Required</h3>
              {outOfStockItems.length === 0 && lowStockItems.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 font-mono text-xs uppercase">All stock levels healthy.</div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-mono uppercase">
                      <th className="py-2">Product</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                    {[...outOfStockItems, ...lowStockItems].map(p => (
                      <tr key={p.id}>
                        <td className="py-3 font-bold text-neutral-800 dark:text-neutral-200">{p.name}</td>
                        <td className="py-3">
                          {p.stock === 0 ? (
                            <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">Out of Stock</span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">Low Stock</span>
                          )}
                        </td>
                        <td className="py-3 text-right font-mono text-rose-600 font-bold">{p.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {reportType === 'performance' && (
            <div className="space-y-4">
              <h3 className="font-sans text-sm font-black uppercase text-neutral-800 dark:text-neutral-200">Top Performing Items</h3>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-mono uppercase">
                    <th className="py-2">Product</th>
                    <th className="py-2 text-right">Units Sold</th>
                    <th className="py-2 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  {[...products].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 20).map(p => (
                    <tr key={p.id}>
                      <td className="py-3 font-bold text-neutral-800 dark:text-neutral-200">{p.name}</td>
                      <td className="py-3 text-right font-mono">{p.sales || 0}</td>
                      <td className="py-3 text-right font-mono text-emerald-600 font-bold">
                        ${((p.sales || 0) * p.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
