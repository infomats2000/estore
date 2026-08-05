import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Mail, 
  FileSpreadsheet, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Users, 
  Wrench,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  FileText,
  Truck,
  Building2,
  Tag,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { 
  Product, 
  Order, 
  CustomerProfile, 
  FinanceTransaction, 
  PurchaseOrder, 
  RepairJob, 
  StockUnit, 
  WarehouseLocation, 
  ShrinkageRecord,
  StoreSettings,
  ERPReportCategory,
  ERPReportType,
  ReportFilterParams
} from '../../types';
import { generateERPReport } from '../../utils/reports/reportAggregator';
import { exportReportToCSV } from '../../utils/reports/csvExporter';
import { downloadReportHtmlFile } from '../../utils/reports/pdfReportGenerator';
import { printERPReportDirect } from '../../utils/reports/printReportHelper';
import ReportFilterBar from './ReportFilterBar';
import ReportViewerTable from './ReportViewerTable';
import ReportCharts from './ReportCharts';
import EmailReportModal from './EmailReportModal';

interface ERPReportsManagerProps {
  products: Product[];
  orders: Order[];
  customers: CustomerProfile[];
  financeTransactions: FinanceTransaction[];
  purchaseOrders?: PurchaseOrder[];
  repairJobs?: RepairJob[];
  stockUnits?: StockUnit[];
  warehouses?: WarehouseLocation[];
  shrinkageRecords?: ShrinkageRecord[];
  categories: string[];
  storeSettings?: StoreSettings;
  onShowAlert?: (title: string, message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function ERPReportsManager({
  products,
  orders,
  customers,
  financeTransactions,
  purchaseOrders = [],
  repairJobs = [],
  stockUnits = [],
  warehouses = [],
  shrinkageRecords = [],
  categories,
  storeSettings,
  onShowAlert
}: ERPReportsManagerProps) {
  const [activeCategory, setActiveCategory] = useState<ERPReportCategory>('Financial');
  const [activeReportType, setActiveReportType] = useState<ERPReportType>('pnl');

  const [filters, setFilters] = useState<ReportFilterParams>({
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
  });

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Available report types grouped by category
  const reportCatalog: { id: ERPReportType; category: ERPReportCategory; title: string; desc: string; icon: any }[] = [
    { id: 'pnl', category: 'Financial', title: 'Profit & Loss (P&L)', desc: 'Net Revenue, COGS, Expenses & Net Profit', icon: DollarSign },
    { id: 'gst-tax', category: 'Financial', title: 'GST & Sales Tax Audit', desc: 'ATO BAS Output vs Input Tax Liability', icon: ShieldCheck },
    { id: 'payment-method-wise', category: 'Financial', title: 'Payment Gateway Analytics', desc: 'Settlements & GST grouped by Payment Method', icon: CreditCard },
    
    { id: 'sales-velocity', category: 'Sales', title: 'Sales Velocity & Margins', desc: 'Itemized Units, ASP and SKU Gross Margins', icon: TrendingUp },
    { id: 'product-profitability', category: 'Sales', title: 'Product Profitability & Unit Margins', desc: 'Item-level Revenue, COGS, Dollar Profit & Margin %', icon: Tag },
    { id: 'category-profitability', category: 'Sales', title: 'Category Profitability Matrix', desc: 'Hardware Category Gross Revenue & Margin %', icon: Tag },
    { id: 'brand-wise', category: 'Sales', title: 'Hardware Brand Performance', desc: 'Dell, Lenovo, Apple, HP Sales & Stock Value', icon: Tag },
    
    { id: 'inventory-valuation', category: 'Inventory', title: 'Stock Asset Valuation', desc: 'Inventory Value at Cost & Retail Prices', icon: Package },
    { id: 'dead-stock', category: 'Inventory', title: 'Dead Stock Audit (>90 Days)', desc: 'Inventory Untouched >90 Days & Capital Tied Up', icon: AlertTriangle },
    { id: 'fast-moving', category: 'Inventory', title: 'Fast Moving Hardware Items', desc: 'High Velocity SKUs Turnover & Reorder Alerts', icon: TrendingUp },
    { id: 'slow-moving', category: 'Inventory', title: 'Slow Moving Hardware Items', desc: 'Low Velocity SKUs & Inventory Optimization', icon: AlertTriangle },
    { id: 'reorder-alerts', category: 'Inventory', title: 'Reorder & Restock Alerts', desc: 'Low Stock Safety Threshold Warnings', icon: AlertTriangle },
    { id: 'shrinkage-audit', category: 'Inventory', title: 'Shrinkage & Write-Offs', desc: 'Audit Discrepancies & Damage Losses', icon: FileText },
    { id: 'warehouse-wise', category: 'Inventory', title: 'Warehouse Stock Distribution', desc: 'Stock Units & Valuation grouped by Facility', icon: Building2 },

    { id: 'ar-aging', category: 'Trade', title: 'Accounts Receivable Aging', desc: 'B2B Credit Balances Overdue Buckets', icon: Users },
    { id: 'customer-profitability', category: 'Trade', title: 'Customer Account Profitability', desc: 'Lifetime Spend, Margin & Net Profit per Account', icon: UserCheck },
    { id: 'customer-wise', category: 'Trade', title: 'Customer Sales & Margins', desc: 'Spend, AOV, Gross Margins grouped by Client', icon: UserCheck },

    { id: 'supplier-performance', category: 'Suppliers', title: 'Supplier Performance & Delivery', desc: 'PO Execution, On-Time Delivery Rate & Quality', icon: Truck },
    { id: 'supplier-wise', category: 'Suppliers', title: 'Supplier Sourcing & PO Spend', desc: 'PO Spend, Duties & Freight grouped by Vendor', icon: Truck },

    { id: 'repair-throughput', category: 'Services', title: 'Service Repair Throughput', desc: 'Technician Labor & Replacement Parts COGS', icon: Wrench },
    { id: 'technician-performance', category: 'Services', title: 'Technician Labour Efficiency', desc: 'Completed Repairs, Billable Hours & Tech Throughput', icon: Wrench },
    { id: 'warranty-claims', category: 'Services', title: 'Warranty Claims & DOA Audit', desc: 'Claim Rates by Brand, Model & Root Cause', icon: ShieldCheck },
    { id: 'staff-wise', category: 'Services', title: 'Technician & Staff Ledger', desc: 'Billed Revenue & Profit per Staff Member', icon: Wrench }
  ];

  const categoryReports = reportCatalog.filter(r => r.category === activeCategory);

  const handleCategoryChange = (cat: ERPReportCategory) => {
    setActiveCategory(cat);
    const firstReport = reportCatalog.find(r => r.category === cat);
    if (firstReport) {
      setActiveReportType(firstReport.id);
    }
  };

  const reportData = useMemo(() => {
    return generateERPReport(activeReportType, filters, {
      products,
      orders,
      customers,
      financeTransactions,
      purchaseOrders,
      repairJobs,
      stockUnits,
      warehouses,
      shrinkageRecords
    });
  }, [activeReportType, filters, products, orders, customers, financeTransactions, purchaseOrders, repairJobs, stockUnits, warehouses, shrinkageRecords]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-blue-900/40">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/30 border border-blue-400/30 rounded-xl backdrop-blur-md">
            <BarChart3 className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 rounded-md border border-blue-500/30">
              ERP ENTERPRISE SUITE
            </span>
            <h2 className="text-xl font-black tracking-tight mt-1">ERP Reports &amp; Intelligence Module</h2>
            <p className="text-xs text-slate-300">Customer-Wise, Supplier-Wise, Warehouse-Wise, Brand-Wise, and Payment-Wise Custom Analytics</p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportReportToCSV(reportData)}
            className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            title="Export Tabular CSV File"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => downloadReportHtmlFile(reportData, storeSettings)}
            className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            title="Download PDF Document"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>

          <button
            type="button"
            onClick={() => printERPReportDirect(reportData, storeSettings)}
            className="px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
            title="Print Report Document"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>

          <button
            type="button"
            onClick={() => setIsEmailModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            title="Dispatch Report via Email"
          >
            <Mail className="w-4 h-4" />
            Email Report
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Categories & Report Selection */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2">MODULE CATEGORIES</span>
            {(['Financial', 'Sales', 'Inventory', 'Trade', 'Services'] as ERPReportCategory[]).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`w-full px-3 py-2 text-xs font-bold rounded-xl flex items-center justify-between transition-all ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat} Reports</span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeCategory === cat ? 'text-white' : 'text-slate-400'}`} />
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2">AVAILABLE REPORTS</span>
            {categoryReports.map(rpt => {
              const Icon = rpt.icon;
              return (
                <button
                  key={rpt.id}
                  type="button"
                  onClick={() => setActiveReportType(rpt.id)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all ${
                    activeReportType === rpt.id
                      ? 'bg-slate-900 text-white shadow-md border-l-4 border-blue-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${activeReportType === rpt.id ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span className="font-bold text-xs">{rpt.title}</span>
                  </div>
                  <p className={`text-[10px] mt-0.5 line-clamp-1 ${activeReportType === rpt.id ? 'text-slate-400' : 'text-slate-500'}`}>
                    {rpt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Workspace */}
        <div className="lg:col-span-3 space-y-6">
          <ReportFilterBar
            filters={filters}
            onFilterChange={setFilters}
            categories={categories}
            customers={customers}
            purchaseOrders={purchaseOrders}
            warehouses={warehouses}
            repairJobs={repairJobs}
          />

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">{reportData.title}</h3>
              <p className="text-xs text-slate-500">{reportData.subtitle}</p>
            </div>
            <div className="text-right font-mono text-xs text-slate-500">
              <div>Period: <strong className="text-blue-600 dark:text-blue-400">{reportData.periodLabel}</strong></div>
              <div className="text-[10px]">Generated: {reportData.dateGenerated}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {reportData.kpis.map((kpi, idx) => {
              let valFormatted = kpi.value;
              if (kpi.format === 'currency' && typeof kpi.value === 'number') {
                valFormatted = '$' + kpi.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              } else if (kpi.format === 'percent' && typeof kpi.value === 'number') {
                valFormatted = kpi.value.toFixed(1) + '%';
              } else if (typeof kpi.value === 'number') {
                valFormatted = kpi.value.toLocaleString();
              }

              return (
                <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 line-clamp-1">
                    {kpi.label}
                  </span>
                  <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                    {valFormatted}
                  </div>
                  {kpi.subtext && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {kpi.subtext}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <ReportCharts report={reportData} />

          <ReportViewerTable
            report={reportData}
            searchQuery={filters.searchQuery}
          />
        </div>
      </div>

      <EmailReportModal
        report={reportData}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onShowAlert={onShowAlert}
      />
    </div>
  );
}
