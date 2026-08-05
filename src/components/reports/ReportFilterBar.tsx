import React from 'react';
import { Calendar, Search, Filter, RotateCcw, Users, Truck, Building2, Tag, CreditCard, Wrench } from 'lucide-react';
import { ReportFilterParams, ReportDatePreset, CustomerProfile, PurchaseOrder, WarehouseLocation, RepairJob } from '../../types';

interface ReportFilterBarProps {
  filters: ReportFilterParams;
  onFilterChange: (filters: ReportFilterParams) => void;
  categories: string[];
  customers?: CustomerProfile[];
  purchaseOrders?: PurchaseOrder[];
  warehouses?: WarehouseLocation[];
  repairJobs?: RepairJob[];
}

export default function ReportFilterBar({
  filters,
  onFilterChange,
  categories,
  customers = [],
  purchaseOrders = [],
  warehouses = [],
  repairJobs = []
}: ReportFilterBarProps) {
  const presets: { key: ReportDatePreset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'this-week', label: 'This Week' },
    { key: 'this-month', label: 'This Month' },
    { key: 'this-quarter', label: 'This Quarter' },
    { key: 'ytd', label: 'Year To Date' },
    { key: 'custom', label: 'Custom Date Range' }
  ];

  // Derive unique options
  const customerNames = Array.from(new Set(customers.map(c => c.name))).filter(Boolean);
  const supplierNames = Array.from(new Set(purchaseOrders.map(p => p.supplierName))).filter(Boolean);
  const brands = ['Dell', 'Lenovo', 'HP', 'Apple', 'ASUS', 'Microsoft', 'Acer', 'Samsung'];
  const paymentMethods = ['Direct EFT Bank Transfer', 'Credit Card / Stripe', 'POS Cash Register', 'Purchase Order Credit'];
  const techNames = Array.from(new Set(repairJobs.map(j => j.technicianName).filter(Boolean))) as string[];

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
      {/* Top Bar: Date Preset & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            Period:
          </span>
          {presets.map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => onFilterChange({ ...filters, preset: p.key })}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                filters.preset === p.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onFilterChange({
            preset: 'this-month',
            startDate: '',
            endDate: '',
            categoryFilter: 'All',
            warehouseFilter: 'All',
            customerFilter: 'All',
            supplierFilter: 'All',
            brandFilter: 'All',
            paymentMethodFilter: 'All',
            staffFilter: 'All',
            searchQuery: ''
          })}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          title="Reset All Filters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All
        </button>
      </div>

      {/* Custom Date Inputs if Custom selected */}
      {filters.preset === 'custom' && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Start Date:</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={e => onFilterChange({ ...filters, startDate: e.target.value })}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
          />
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">End Date:</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={e => onFilterChange({ ...filters, endDate: e.target.value })}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
          />
        </div>
      )}

      {/* Multi-Dimensional Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
        {/* Category Filter */}
        <div className="flex items-center gap-1">
          <Filter className="w-3 h-3 text-slate-400" />
          <select
            value={filters.categoryFilter || 'All'}
            onChange={e => onFilterChange({ ...filters, categoryFilter: e.target.value })}
            className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Customer Filter */}
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-slate-400" />
          <select
            value={filters.customerFilter || 'All'}
            onChange={e => onFilterChange({ ...filters, customerFilter: e.target.value })}
            className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
          >
            <option value="All">All Customers</option>
            {customerNames.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Supplier Filter */}
        <div className="flex items-center gap-1">
          <Truck className="w-3 h-3 text-slate-400" />
          <select
            value={filters.supplierFilter || 'All'}
            onChange={e => onFilterChange({ ...filters, supplierFilter: e.target.value })}
            className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
          >
            <option value="All">All Suppliers</option>
            {supplierNames.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Warehouse Filter */}
        <div className="flex items-center gap-1">
          <Building2 className="w-3 h-3 text-slate-400" />
          <select
            value={filters.warehouseFilter || 'All'}
            onChange={e => onFilterChange({ ...filters, warehouseFilter: e.target.value })}
            className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
          >
            <option value="All">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Brand Filter */}
        <div className="flex items-center gap-1">
          <Tag className="w-3 h-3 text-slate-400" />
          <select
            value={filters.brandFilter || 'All'}
            onChange={e => onFilterChange({ ...filters, brandFilter: e.target.value })}
            className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
          >
            <option value="All">All Brands</option>
            {brands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Payment Method Filter */}
        <div className="flex items-center gap-1">
          <CreditCard className="w-3 h-3 text-slate-400" />
          <select
            value={filters.paymentMethodFilter || 'All'}
            onChange={e => onFilterChange({ ...filters, paymentMethodFilter: e.target.value })}
            className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
          >
            <option value="All">All Payment Options</option>
            {paymentMethods.map(pm => (
              <option key={pm} value={pm}>{pm}</option>
            ))}
          </select>
        </div>

        {/* Staff / Tech Filter */}
        {techNames.length > 0 && (
          <div className="flex items-center gap-1">
            <Wrench className="w-3 h-3 text-slate-400" />
            <select
              value={filters.staffFilter || 'All'}
              onChange={e => onFilterChange({ ...filters, staffFilter: e.target.value })}
              className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
            >
              <option value="All">All Staff / Techs</option>
              {techNames.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}

        {/* Substring Search Bar */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search report..."
            value={filters.searchQuery || ''}
            onChange={e => onFilterChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-7 pr-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
        </div>
      </div>
    </div>
  );
}
