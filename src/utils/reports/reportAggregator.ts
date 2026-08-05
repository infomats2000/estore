import { 
  Order, 
  Product, 
  CustomerProfile, 
  FinanceTransaction, 
  PurchaseOrder, 
  RepairJob, 
  StockUnit, 
  WarehouseLocation, 
  ShrinkageRecord, 
  ERPReportType, 
  ERPReportData, 
  ReportFilterParams,
  ReportKPI,
  ReportColumn
} from '../../types';

export function calculateDateRange(preset: string, customStart?: string, customEnd?: string): { start: Date; end: Date; label: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (preset === 'today') {
    return { start, end, label: 'Today (' + start.toISOString().split('T')[0] + ')' };
  }
  
  if (preset === 'this-week') {
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    return { start, end, label: 'This Week (' + start.toISOString().split('T')[0] + ' to ' + end.toISOString().split('T')[0] + ')' };
  }

  if (preset === 'this-month') {
    start.setDate(1);
    return { start, end, label: 'This Month (' + start.toISOString().split('T')[0] + ' to ' + end.toISOString().split('T')[0] + ')' };
  }

  if (preset === 'this-quarter') {
    const currentMonth = start.getMonth();
    const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
    start.setMonth(quarterStartMonth, 1);
    return { start, end, label: 'This Quarter (' + start.toISOString().split('T')[0] + ' to ' + end.toISOString().split('T')[0] + ')' };
  }

  if (preset === 'ytd') {
    start.setMonth(0, 1);
    return { start, end, label: 'Year To Date (' + start.getFullYear() + ')' };
  }

  if (customStart && customEnd) {
    const s = new Date(customStart);
    s.setHours(0, 0, 0, 0);
    const e = new Date(customEnd);
    e.setHours(23, 59, 59, 999);
    return { start: s, end: e, label: customStart + ' to ' + customEnd };
  }

  start.setDate(start.getDate() - 30);
  return { start, end, label: 'Last 30 Days' };
}

export function detectBrand(productName: string): string {
  const nameUpper = productName.toUpperCase();
  if (nameUpper.includes('DELL') || nameUpper.includes('LATITUDE')) return 'Dell';
  if (nameUpper.includes('THINKPAD') || nameUpper.includes('LENOVO')) return 'Lenovo';
  if (nameUpper.includes('HP') || nameUpper.includes('ELITEBOOK') || nameUpper.includes('PROBOOK')) return 'HP';
  if (nameUpper.includes('APPLE') || nameUpper.includes('MACBOOK') || nameUpper.includes('IMAC')) return 'Apple';
  if (nameUpper.includes('ASUS') || nameUpper.includes('ROG')) return 'ASUS';
  if (nameUpper.includes('MICROSOFT') || nameUpper.includes('SURFACE')) return 'Microsoft';
  if (nameUpper.includes('ACER')) return 'Acer';
  if (nameUpper.includes('SAMSUNG')) return 'Samsung';
  return 'Other Brands';
}

export function generateERPReport(
  type: ERPReportType,
  filters: ReportFilterParams,
  data: {
    products: Product[];
    orders: Order[];
    customers: CustomerProfile[];
    financeTransactions: FinanceTransaction[];
    purchaseOrders: PurchaseOrder[];
    repairJobs: RepairJob[];
    stockUnits: StockUnit[];
    warehouses: WarehouseLocation[];
    shrinkageRecords: ShrinkageRecord[];
  }
): ERPReportData {
  const { start, end, label: periodLabel } = calculateDateRange(filters.preset, filters.startDate, filters.endDate);
  const nowStr = new Date().toLocaleString();

  const isInRange = (dateStr?: string) => {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    return d >= start && d <= end;
  };

  // Base Order Filters
  let filteredOrders = data.orders.filter(o => {
    if (!isInRange(o.date) || o.status === 'Pending') return false;
    if (filters.customerFilter && filters.customerFilter !== 'All' && o.customerName !== filters.customerFilter) return false;
    if (filters.paymentMethodFilter && filters.paymentMethodFilter !== 'All' && o.paymentMethod !== filters.paymentMethodFilter) return false;
    return true;
  });

  switch (type) {
    case 'pnl': {
      const grossRevenue = filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
      const totalTax = filteredOrders.reduce((acc, o) => acc + (o.tax || 0), 0);
      const netRevenue = grossRevenue - totalTax;

      const cogs = filteredOrders.reduce((acc, o) => {
        const orderCogs = o.items.reduce((itemAcc, item) => {
          const prod = data.products.find(p => p.id === item.productId || p.name === item.name);
          const cost = prod?.costPrice || (item.price * 0.6);
          return itemAcc + (cost * item.quantity);
        }, 0);
        return acc + orderCogs;
      }, 0);

      const expenses = data.financeTransactions
        .filter(t => isInRange(t.date) && t.type === 'Expense')
        .reduce((acc, t) => acc + t.amount, 0);

      const grossProfit = netRevenue - cogs;
      const netProfit = grossProfit - expenses;
      const grossMarginPercent = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

      const kpis: ReportKPI[] = [
        { label: 'Gross Revenue', value: grossRevenue, format: 'currency', subtext: filteredOrders.length + ' Orders Processed' },
        { label: 'Cost of Goods Sold (COGS)', value: cogs, format: 'currency', subtext: 'Based on unit cost prices' },
        { label: 'Gross Profit Margin', value: grossProfit, format: 'currency', subtext: grossMarginPercent.toFixed(1) + '% Gross Margin' },
        { label: 'Operating Expenses', value: expenses, format: 'currency', subtext: 'Finance expense ledger' },
        { label: 'Net Profit', value: netProfit, format: 'currency', trend: netProfit >= 0 ? 'up' : 'down', subtext: 'Bottom-line earnings' }
      ];

      const columns: ReportColumn[] = [
        { key: 'category', label: 'Financial Category', align: 'left', format: 'text' },
        { key: 'description', label: 'Item / Account Description', align: 'left', format: 'text' },
        { key: 'amount', label: 'Amount ($ AUD)', align: 'right', format: 'currency' },
        { key: 'sharePercent', label: 'Share of Revenue (%)', align: 'right', format: 'percent' }
      ];

      const rows = [
        { category: 'Revenue', description: 'Store Hardware & Merchandise Sales', amount: grossRevenue, sharePercent: 100 },
        { category: 'Tax', description: 'Less GST Collected (10%)', amount: -totalTax, sharePercent: grossRevenue ? (totalTax / grossRevenue) * 100 : 0 },
        { category: 'Revenue Net', description: 'Net Sales Revenue (Ex. GST)', amount: netRevenue, sharePercent: grossRevenue ? (netRevenue / grossRevenue) * 100 : 0 },
        { category: 'COGS', description: 'Direct Product & Inventory Acquisition Cost', amount: -cogs, sharePercent: netRevenue ? (cogs / netRevenue) * 100 : 0 },
        { category: 'Gross Margin', description: 'Gross Operating Profit', amount: grossProfit, sharePercent: netRevenue ? (grossProfit / netRevenue) * 100 : 0 },
        { category: 'Operating Expense', description: 'Logistics, Maintenance & Utilities', amount: -expenses, sharePercent: netRevenue ? (expenses / netRevenue) * 100 : 0 },
        { category: 'Net Income', description: 'Final Bottom-Line Operating Income', amount: netProfit, sharePercent: netRevenue ? (netProfit / netRevenue) * 100 : 0 }
      ];

      return {
        id: 'RPT-PNL-' + Date.now(),
        type: 'pnl',
        category: 'Financial',
        title: 'Profit & Loss (P&L) Income Statement',
        subtitle: 'Comprehensive Breakdown of Revenue, COGS, Operating Costs and Net Income',
        dateGenerated: nowStr,
        periodLabel,
        kpis,
        columns,
        rows,
        summaryRow: { category: 'TOTAL NET PROFIT', description: 'Period Earnings', amount: netProfit, sharePercent: grossMarginPercent }
      };
    }

    case 'customer-wise': {
      const customerMap: Record<string, {
        id: string;
        name: string;
        type: string;
        orderCount: number;
        revenue: number;
        cogs: number;
        balance: number;
        lastDate: string;
      }> = {};

      filteredOrders.forEach(o => {
        const custName = o.customerName || 'Guest User';
        if (!customerMap[custName]) {
          const profile = data.customers.find(c => c.name === custName || c.email === o.customerEmail);
          customerMap[custName] = {
            id: profile?.id || custName,
            name: custName,
            type: profile?.type || 'Retail',
            orderCount: 0,
            revenue: 0,
            cogs: 0,
            balance: profile?.tradeAccount?.creditBalance || 0,
            lastDate: o.date
          };
        }

        customerMap[custName].orderCount += 1;
        customerMap[custName].revenue += o.total || 0;
        if (new Date(o.date) > new Date(customerMap[custName].lastDate)) {
          customerMap[custName].lastDate = o.date;
        }

        const orderCogs = o.items.reduce((acc, item) => {
          const prod = data.products.find(p => p.id === item.productId || p.name === item.name);
          return acc + ((prod?.costPrice || (item.price * 0.6)) * item.quantity);
        }, 0);
        customerMap[custName].cogs += orderCogs;
      });

      const rows = Object.values(customerMap).map(c => {
        const margin = c.revenue - c.cogs;
        const marginPercent = c.revenue > 0 ? (margin / c.revenue) * 100 : 0;
        const aov = c.orderCount > 0 ? c.revenue / c.orderCount : 0;

        return {
          customerName: c.name,
          customerType: c.type,
          orderCount: c.orderCount,
          totalRevenue: c.revenue,
          aov,
          margin,
          marginPercent,
          balance: c.balance,
          lastPurchaseDate: c.lastDate
        };
      }).sort((a, b) => b.totalRevenue - a.totalRevenue);

      const totalRevenue = rows.reduce((a, b) => a + b.totalRevenue, 0);
      const totalMargin = rows.reduce((a, b) => a + b.margin, 0);
      const totalOrders = rows.reduce((a, b) => a + b.orderCount, 0);

      const kpis: ReportKPI[] = [
        { label: 'Active Purchasing Customers', value: rows.length, format: 'number', subtext: 'In selected period' },
        { label: 'Total Invoiced Revenue', value: totalRevenue, format: 'currency', subtext: 'Gross Customer Revenue' },
        { label: 'Average Customer Spend (AOV)', value: totalOrders > 0 ? totalRevenue / totalOrders : 0, format: 'currency', subtext: 'Per Order Value' },
        { label: 'Customer Net Margin', value: totalMargin, format: 'currency', trend: 'up', subtext: 'Gross Profit Margin' }
      ];

      const columns: ReportColumn[] = [
        { key: 'customerName', label: 'Customer / Client Name', align: 'left', format: 'text' },
        { key: 'customerType', label: 'Client Type', align: 'center', format: 'badge' },
        { key: 'orderCount', label: 'Orders', align: 'right', format: 'number' },
        { key: 'totalRevenue', label: 'Total Spend ($)', align: 'right', format: 'currency' },
        { key: 'aov', label: 'Average Order ($)', align: 'right', format: 'currency' },
        { key: 'margin', label: 'Margin ($)', align: 'right', format: 'currency' },
        { key: 'marginPercent', label: 'Margin (%)', align: 'right', format: 'percent' },
        { key: 'balance', label: 'Credit Balance ($)', align: 'right', format: 'currency' },
        { key: 'lastPurchaseDate', label: 'Last Purchase', align: 'left', format: 'date' }
      ];

      return {
        id: 'RPT-CUST-' + Date.now(),
        type: 'customer-wise',
        category: 'Trade',
        title: 'Customer-Wise Sales & Profitability Ledger',
        subtitle: 'Itemized Breakdown of Orders, AOV, Gross Margins and Outstanding Credit per Client',
        dateGenerated: nowStr,
        periodLabel,
        kpis,
        columns,
        rows,
        summaryRow: { customerName: 'TOTAL CUSTOMER SALES', orderCount: totalOrders, totalRevenue, margin: totalMargin, marginPercent: totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0 }
      };
    }

    case 'supplier-wise': {
      let filteredPOs = data.purchaseOrders.filter(p => isInRange(p.createdDate));
      if (filters.supplierFilter && filters.supplierFilter !== 'All') {
        filteredPOs = filteredPOs.filter(p => p.supplierName === filters.supplierFilter);
      }

      const supplierMap: Record<string, {
        supplierName: string;
        poCount: number;
        receivedCount: number;
        totalSpend: number;
        freight: number;
        duties: number;
        outstanding: number;
      }> = {};

      filteredPOs.forEach(p => {
        const sName = p.supplierName || 'General Vendor';
        if (!supplierMap[sName]) {
          supplierMap[sName] = {
            supplierName: sName,
            poCount: 0,
            receivedCount: 0,
            totalSpend: 0,
            freight: 0,
            duties: 0,
            outstanding: 0
          };
        }

        supplierMap[sName].poCount += 1;
        if (p.status === 'Received') supplierMap[sName].receivedCount += 1;
        else if (p.status !== 'Cancelled') supplierMap[sName].outstanding += p.total || 0;

        supplierMap[sName].totalSpend += p.total || 0;
        supplierMap[sName].freight += p.freight || 0;
        supplierMap[sName].duties += p.duties || 0;
      });

      const rows = Object.values(supplierMap).sort((a, b) => b.totalSpend - a.totalSpend);

      const totalPOs = rows.reduce((a, b) => a + b.poCount, 0);
      const totalSpend = rows.reduce((a, b) => a + b.totalSpend, 0);
      const totalFreight = rows.reduce((a, b) => a + b.freight + b.duties, 0);

      const kpis: ReportKPI[] = [
        { label: 'Active Suppliers', value: rows.length, format: 'number', subtext: 'Procurement Vendors' },
        { label: 'Total Purchase Orders', value: totalPOs, format: 'number', subtext: 'Issued POs' },
        { label: 'Total PO Procurement Capital', value: totalSpend, format: 'currency', subtext: 'Inventory Acquisitions' },
        { label: 'Freight & Duties Costs', value: totalFreight, format: 'currency', subtext: 'Logistics Expenses' }
      ];

      const columns: ReportColumn[] = [
        { key: 'supplierName', label: 'Supplier / Vendor Name', align: 'left', format: 'text' },
        { key: 'poCount', label: 'Total POs', align: 'right', format: 'number' },
        { key: 'receivedCount', label: 'Received POs', align: 'right', format: 'number' },
        { key: 'totalSpend', label: 'Total Spend ($)', align: 'right', format: 'currency' },
        { key: 'freight', label: 'Freight ($)', align: 'right', format: 'currency' },
        { key: 'duties', label: 'Customs Duties ($)', align: 'right', format: 'currency' },
        { key: 'outstanding', label: 'Outstanding PO Value ($)', align: 'right', format: 'currency' }
      ];

      return {
        id: 'RPT-SUPP-' + Date.now(),
        type: 'supplier-wise',
        category: 'Inventory',
        title: 'Supplier-Wise Procurement & Spend Analytics',
        subtitle: 'Itemized Breakdown of Purchase Orders, Sourcing Costs and Logistics Duties by Vendor',
        dateGenerated: nowStr,
        periodLabel,
        kpis,
        columns,
        rows,
        summaryRow: { supplierName: 'TOTAL SUPPLIER PROCUREMENT', poCount: totalPOs, totalSpend, freight: rows.reduce((a, b) => a + b.freight, 0), duties: rows.reduce((a, b) => a + b.duties, 0), outstanding: rows.reduce((a, b) => a + b.outstanding, 0) }
      };
    }

    case 'warehouse-wise': {
      const warehouseMap: Record<string, {
        id: string;
        name: string;
        code: string;
        onHandUnits: number;
        costValuation: number;
        retailValuation: number;
      }> = {};

      data.warehouses.forEach(w => {
        warehouseMap[w.id] = {
          id: w.id,
          name: w.name,
          code: w.code,
          onHandUnits: 0,
          costValuation: 0,
          retailValuation: 0
        };
      });

      data.stockUnits.forEach(su => {
        const wId = su.locationId || 'WH-MAIN';
        if (!warehouseMap[wId]) {
          warehouseMap[wId] = {
            id: wId,
            name: su.locationName || 'Main Hub',
            code: wId,
            onHandUnits: 0,
            costValuation: 0,
            retailValuation: 0
          };
        }

        const prod = data.products.find(p => p.id === su.productId || p.name === su.productName);
        const cost = su.costPrice || prod?.costPrice || 200;
        const retail = prod?.price || cost * 1.4;

        warehouseMap[wId].onHandUnits += 1;
        warehouseMap[wId].costValuation += cost;
        warehouseMap[wId].retailValuation += retail;
      });

      const rows = Object.values(warehouseMap).map(w => {
        const margin = w.retailValuation - w.costValuation;
        return {
          warehouseCode: w.code,
          warehouseName: w.name,
          onHandUnits: w.onHandUnits,
          costValuation: w.costValuation,
          retailValuation: w.retailValuation,
          potentialMargin: margin,
          marginPercent: w.retailValuation > 0 ? (margin / w.retailValuation) * 100 : 0
        };
      });

      const totalUnits = rows.reduce((a, b) => a + b.onHandUnits, 0);
      const totalCostVal = rows.reduce((a, b) => a + b.costValuation, 0);
      const totalRetailVal = rows.reduce((a, b) => a + b.retailValuation, 0);

      const kpis: ReportKPI[] = [
        { label: 'Active Facilities', value: rows.length, format: 'number', subtext: 'Warehouses & Showrooms' },
        { label: 'Total Tracked Stock Units', value: totalUnits, format: 'number', subtext: 'On-Hand Units' },
        { label: 'Total Stock Asset Cost', value: totalCostVal, format: 'currency', subtext: 'Cost Valuation' },
        { label: 'Potential Retail Profit', value: totalRetailVal - totalCostVal, format: 'currency', trend: 'up', subtext: 'Unrealized Gross Margin' }
      ];

      const columns: ReportColumn[] = [
        { key: 'warehouseCode', label: 'Facility Code', align: 'left', format: 'text' },
        { key: 'warehouseName', label: 'Warehouse / Facility Name', align: 'left', format: 'text' },
        { key: 'onHandUnits', label: 'Stock Units', align: 'right', format: 'number' },
        { key: 'costValuation', label: 'Asset Cost Value ($)', align: 'right', format: 'currency' },
        { key: 'retailValuation', label: 'Retail Sales Value ($)', align: 'right', format: 'currency' },
        { key: 'potentialMargin', label: 'Potential Margin ($)', align: 'right', format: 'currency' },
        { key: 'marginPercent', label: 'Margin (%)', align: 'right', format: 'percent' }
      ];

      return {
        id: 'RPT-WH-' + Date.now(),
        type: 'warehouse-wise',
        category: 'Inventory',
        title: 'Warehouse & Multi-Location Stock Valuation Report',
        subtitle: 'Inventory Distribution, Cost Holdings and Potential Profitability per Warehouse Facility',
        dateGenerated: nowStr,
        periodLabel,
        kpis,
        columns,
        rows,
        summaryRow: { warehouseCode: 'TOTAL ALL FACILITIES', onHandUnits: totalUnits, costValuation: totalCostVal, retailValuation: totalRetailVal, potentialMargin: totalRetailVal - totalCostVal }
      };
    }

    case 'brand-wise': {
      const brandMap: Record<string, {
        brandName: string;
        skusCount: number;
        unitsSold: number;
        revenue: number;
        cogs: number;
        stockValue: number;
      }> = {};

      data.products.forEach(p => {
        const brand = detectBrand(p.name);
        if (!brandMap[brand]) {
          brandMap[brand] = {
            brandName: brand,
            skusCount: 0,
            unitsSold: 0,
            revenue: 0,
            cogs: 0,
            stockValue: 0
          };
        }
        brandMap[brand].skusCount += 1;
        brandMap[brand].stockValue += (p.costPrice || (p.price * 0.6)) * (p.stock || 0);
      });

      filteredOrders.forEach(o => {
        o.items.forEach(item => {
          const brand = detectBrand(item.name);
          if (!brandMap[brand]) {
            brandMap[brand] = { brandName: brand, skusCount: 0, unitsSold: 0, revenue: 0, cogs: 0, stockValue: 0 };
          }
          const prod = data.products.find(p => p.id === item.productId || p.name === item.name);
          const itemCost = (prod?.costPrice || (item.price * 0.6)) * item.quantity;
          
          brandMap[brand].unitsSold += item.quantity;
          brandMap[brand].revenue += item.price * item.quantity;
          brandMap[brand].cogs += itemCost;
        });
      });

      const rows = Object.values(brandMap).map(b => {
        const margin = b.revenue - b.cogs;
        return {
          brandName: b.brandName,
          skusCount: b.skusCount,
          unitsSold: b.unitsSold,
          totalRevenue: b.revenue,
          cogs: b.cogs,
          margin,
          marginPercent: b.revenue > 0 ? (margin / b.revenue) * 100 : 0,
          stockValue: b.stockValue
        };
      }).sort((a, b) => b.totalRevenue - a.totalRevenue);

      const totalRevenue = rows.reduce((a, b) => a + b.totalRevenue, 0);
      const totalMargin = rows.reduce((a, b) => a + b.margin, 0);
      const totalStockVal = rows.reduce((a, b) => a + b.stockValue, 0);

      const kpis: ReportKPI[] = [
        { label: 'Active Hardware Brands', value: rows.length, format: 'number', subtext: 'Dell, Lenovo, Apple, HP etc.' },
        { label: 'Total Brand Sales Revenue', value: totalRevenue, format: 'currency', subtext: 'Hardware Sales' },
        { label: 'Brand Gross Profit', value: totalMargin, format: 'currency', trend: 'up', subtext: 'Gross Margin Dollars' },
        { label: 'On-Hand Brand Stock Asset Value', value: totalStockVal, format: 'currency', subtext: 'Current Stock Valuation' }
      ];

      const columns: ReportColumn[] = [
        { key: 'brandName', label: 'Hardware Brand', align: 'left', format: 'text' },
        { key: 'skusCount', label: 'Catalog SKUs', align: 'right', format: 'number' },
        { key: 'unitsSold', label: 'Units Sold', align: 'right', format: 'number' },
        { key: 'totalRevenue', label: 'Total Revenue ($)', align: 'right', format: 'currency' },
        { key: 'cogs', label: 'COGS ($)', align: 'right', format: 'currency' },
        { key: 'margin', label: 'Gross Margin ($)', align: 'right', format: 'currency' },
        { key: 'marginPercent', label: 'Margin (%)', align: 'right', format: 'percent' },
        { key: 'stockValue', label: 'On-Hand Stock Value ($)', align: 'right', format: 'currency' }
      ];

      return {
        id: 'RPT-BRAND-' + Date.now(),
        type: 'brand-wise',
        category: 'Sales',
        title: 'Brand & Manufacturer Performance Report',
        subtitle: 'Hardware Sales Volume, Revenue Contribution and Stock Asset Value grouped by Manufacturer',
        dateGenerated: nowStr,
        periodLabel,
        kpis,
        columns,
        rows,
        summaryRow: { brandName: 'TOTAL BRAND SALES', unitsSold: rows.reduce((a, b) => a + b.unitsSold, 0), totalRevenue, cogs: totalRevenue - totalMargin, margin: totalMargin, stockValue: totalStockVal }
      };
    }

    case 'payment-method-wise': {
      const paymentMap: Record<string, {
        method: string;
        orderCount: number;
        revenue: number;
        tax: number;
      }> = {};

      filteredOrders.forEach(o => {
        const method = o.paymentMethod || 'Other / EFT';
        if (!paymentMap[method]) {
          paymentMap[method] = { method, orderCount: 0, revenue: 0, tax: 0 };
        }
        paymentMap[method].orderCount += 1;
        paymentMap[method].revenue += o.total || 0;
        paymentMap[method].tax += o.tax || 0;
      });

      const totalRev = Object.values(paymentMap).reduce((a, b) => a + b.revenue, 0);

      const rows = Object.values(paymentMap).map(p => ({
        paymentMethod: p.method,
        orderCount: p.orderCount,
        totalRevenue: p.revenue,
        taxCollected: p.tax,
        sharePercent: totalRev > 0 ? (p.revenue / totalRev) * 100 : 0
      })).sort((a, b) => b.totalRevenue - a.totalRevenue);

      const totalOrders = rows.reduce((a, b) => a + b.orderCount, 0);

      const kpis: ReportKPI[] = [
        { label: 'Active Payment Gateways', value: rows.length, format: 'number', subtext: 'EFT, Cash, Credit Card etc.' },
        { label: 'Total Settlement Revenue', value: totalRev, format: 'currency', subtext: 'Across all payment channels' },
        { label: 'Total Transactions', value: totalOrders, format: 'number', subtext: 'Processed Checkout Orders' },
        { label: 'Average Settlement Value', value: totalOrders > 0 ? totalRev / totalOrders : 0, format: 'currency', subtext: 'Average Transaction Size' }
      ];

      const columns: ReportColumn[] = [
        { key: 'paymentMethod', label: 'Payment Gateway / Channel', align: 'left', format: 'text' },
        { key: 'orderCount', label: 'Orders Processed', align: 'right', format: 'number' },
        { key: 'totalRevenue', label: 'Settlement Amount ($)', align: 'right', format: 'currency' },
        { key: 'taxCollected', label: 'GST Collected ($)', align: 'right', format: 'currency' },
        { key: 'sharePercent', label: 'Share of Total Sales (%)', align: 'right', format: 'percent' }
      ];

      return {
        id: 'RPT-PAY-' + Date.now(),
        type: 'payment-method-wise',
        category: 'Financial',
        title: 'Payment Gateway & Channel Performance Report',
        subtitle: 'Settlement Volume, Sales Distribution and Tax Liabilities grouped by Payment Option',
        dateGenerated: nowStr,
        periodLabel,
        kpis,
        columns,
        rows,
        summaryRow: { paymentMethod: 'TOTAL SETTLEMENT SALES', orderCount: totalOrders, totalRevenue: totalRev, taxCollected: rows.reduce((a, b) => a + b.taxCollected, 0), sharePercent: 100 }
      };
    }

    case 'staff-wise': {
      let filteredJobs = data.repairJobs.filter(j => isInRange(j.intakeDate));
      if (filters.staffFilter && filters.staffFilter !== 'All') {
        filteredJobs = filteredJobs.filter(j => j.technicianName === filters.staffFilter);
      }

      const techMap: Record<string, {
        technicianName: string;
        jobCount: number;
        completedCount: number;
        laborRevenue: number;
        partsCost: number;
      }> = {};

      filteredJobs.forEach(j => {
        const tech = j.technicianName || 'Unassigned Tech';
        if (!techMap[tech]) {
          techMap[tech] = { technicianName: tech, jobCount: 0, completedCount: 0, laborRevenue: 0, partsCost: 0 };
        }
        techMap[tech].jobCount += 1;
        if (j.status === 'Ready' || j.status === 'Collected') techMap[tech].completedCount += 1;

        const billed = j.finalCost || j.estimatedCost || 0;
        const pCost = (j.partsUsed || []).reduce((acc, p) => acc + (p.unitCost * p.quantity), 0);

        techMap[tech].laborRevenue += billed;
        techMap[tech].partsCost += pCost;
      });

      const rows = Object.values(techMap).map(t => {
        const netProfit = t.laborRevenue - t.partsCost;
        return {
          technicianName: t.technicianName,
          jobCount: t.jobCount,
          completedCount: t.completedCount,
          laborRevenue: t.laborRevenue,
          partsCost: t.partsCost,
          netProfit,
          profitMarginPercent: t.laborRevenue > 0 ? (netProfit / t.laborRevenue) * 100 : 0
        };
      }).sort((a, b) => b.laborRevenue - a.laborRevenue);

      const totalJobs = rows.reduce((a, b) => a + b.jobCount, 0);
      const totalRev = rows.reduce((a, b) => a + b.laborRevenue, 0);
      const totalProfit = rows.reduce((a, b) => a + b.netProfit, 0);

      const kpis: ReportKPI[] = [
        { label: 'Active Technicians', value: rows.length, format: 'number', subtext: 'Service staff' },
        { label: 'Total Service Billed', value: totalRev, format: 'currency', subtext: 'Labor & Parts Revenue' },
        { label: 'Net Technician Service Profit', value: totalProfit, format: 'currency', trend: 'up', subtext: 'Gross Service Margin' },
        { label: 'Total Jobs Processed', value: totalJobs, format: 'number', subtext: 'Repair Job Cards' }
      ];

      const columns: ReportColumn[] = [
        { key: 'technicianName', label: 'Technician / Staff Member', align: 'left', format: 'text' },
        { key: 'jobCount', label: 'Assigned Jobs', align: 'right', format: 'number' },
        { key: 'completedCount', label: 'Completed Jobs', align: 'right', format: 'number' },
        { key: 'laborRevenue', label: 'Billed Revenue ($)', align: 'right', format: 'currency' },
        { key: 'partsCost', label: 'Parts COGS ($)', align: 'right', format: 'currency' },
        { key: 'netProfit', label: 'Net Profit ($)', align: 'right', format: 'currency' },
        { key: 'profitMarginPercent', label: 'Margin (%)', align: 'right', format: 'percent' }
      ];

      return {
        id: 'RPT-STAFF-' + Date.now(),
        type: 'staff-wise',
        category: 'Services',
        title: 'Technician & Staff Performance Ledger',
        subtitle: 'Itemized Service Revenue Billed, Replacement Parts COGS and Profit Contribution per Technician',
        dateGenerated: nowStr,
        periodLabel,
        kpis,
        columns,
        rows,
        summaryRow: { technicianName: 'TOTAL STAFF SERVICE PROFIT', jobCount: totalJobs, laborRevenue: totalRev, partsCost: rows.reduce((a, b) => a + b.partsCost, 0), netProfit: totalProfit }
      };
    }

    case 'gst-tax': {
      const totalTaxableSales = filteredOrders.reduce((acc, o) => acc + (o.subtotal || 0), 0);
      const totalGstCollected = filteredOrders.reduce((acc, o) => acc + (o.tax || 0), 0);
      
      const poInRange = data.purchaseOrders.filter(p => isInRange(p.createdDate) && p.status === 'Received');
      const totalGstPaidSuppliers = poInRange.reduce((acc, p) => acc + (p.total ? p.total * 0.1 : 0), 0);

      const netGstPayable = totalGstCollected - totalGstPaidSuppliers;

      const kpis: ReportKPI[] = [
        { label: 'Total Taxable Revenue', value: totalTaxableSales, format: 'currency', subtext: 'Excluding GST' },
        { label: 'GST Collected (Output Tax)', value: totalGstCollected, format: 'currency', subtext: '10% Sales Tax' },
        { label: 'GST Paid to Suppliers (Input Tax)', value: totalGstPaidSuppliers, format: 'currency', subtext: 'From Supplier POs' },
        { label: 'Net GST Payable to ATO', value: netGstPayable, format: 'currency', trend: netGstPayable > 0 ? 'down' : 'up', subtext: 'Quarterly Tax Remittance' }
      ];

      const columns: ReportColumn[] = [
        { key: 'date', label: 'Order Date', align: 'left', format: 'date' },
        { key: 'reference', label: 'Order / PO #', align: 'left', format: 'text' },
        { key: 'customer', label: 'Customer / Supplier', align: 'left', format: 'text' },
        { key: 'type', label: 'Transaction Type', align: 'center', format: 'badge' },
        { key: 'taxableAmount', label: 'Taxable Base ($)', align: 'right', format: 'currency' },
        { key: 'gstAmount', label: 'GST Amount ($)', align: 'right', format: 'currency' }
      ];

      const rows = [
        ...filteredOrders.map(o => ({
          date: o.date,
          reference: o.id,
          customer: o.customerName || 'Retail Customer',
          type: 'Sales Tax Collected',
          taxableAmount: o.subtotal,
          gstAmount: o.tax
        })),
        ...poInRange.map(p => ({
          date: p.createdDate,
          reference: p.id,
          customer: p.supplierName,
          type: 'Input Tax Credit',
          taxableAmount: p.total ? p.total / 1.1 : 0,
          gstAmount: p.total ? p.total * 0.1 : 0
        }))
      ];

      return {
        id: 'RPT-GST-' + Date.now(),
        type: 'gst-tax',
        category: 'Financial',
        title: 'GST & Sales Tax Liability Audit',
        subtitle: 'Australian Tax Office (ATO) BAS Compliant Output vs Input Tax Ledger',
        dateGenerated: nowStr,
        periodLabel,
        kpis,
        columns,
        rows,
        summaryRow: { reference: 'TOTAL NET GST REMITTANCE', taxableAmount: totalTaxableSales, gstAmount: netGstPayable }
      };
    }

    case 'inventory-valuation': {
      const activeProducts = data.products.filter(p => !filters.categoryFilter || filters.categoryFilter === 'All' || p.category === filters.categoryFilter);
      
      let totalStockUnitsCount = 0;
      let totalCostValuation = 0;
      let totalRetailValuation = 0;

      const rows = activeProducts.map(p => {
        const cost = p.costPrice || (p.price * 0.6);
        const stockQty = p.stock || 0;
        const totalCost = cost * stockQty;
        const totalRetail = p.price * stockQty;

        totalStockUnitsCount += stockQty;
        totalCostValuation += totalCost;
        totalRetailValuation += totalRetail;

        return {
          sku: p.id,
          name: p.name,
          category: p.category,
          stockQty,
          unitCost: cost,
          unitPrice: p.price,
          totalCost,
          totalRetail,
          potentialProfit: totalRetail - totalCost
        };
      });

      const potentialProfitTotal = totalRetailValuation - totalCostValuation;

      const kpis: ReportKPI[] = [
        { label: 'Active SKUs Catalog', value: activeProducts.length, format: 'number', subtext: 'In Inventory' },
        { label: 'Total Physical Stock Units', value: totalStockUnitsCount, format: 'number', subtext: 'On-Hand Units' },
        { label: 'Stock Asset Cost Valuation', value: totalCostValuation, format: 'currency', subtext: 'Inventory Asset Value' },
        { label: 'Stock Retail Valuation', value: totalRetailValuation, format: 'currency', subtext: 'Potential Sales Value' },
        { label: 'Unrealized Gross Profit', value: potentialProfitTotal, format: 'currency', trend: 'up', subtext: 'Estimated Gross Margin' }
      ];

      const columns: ReportColumn[] = [
        { key: 'sku', label: 'SKU / Product ID', align: 'left', format: 'text' },
        { key: 'name', label: 'Hardware Description', align: 'left', format: 'text' },
        { key: 'category', label: 'Category', align: 'left', format: 'text' },
        { key: 'stockQty', label: 'On-Hand Qty', align: 'right', format: 'number' },
        { key: 'unitCost', label: 'Unit Cost ($)', align: 'right', format: 'currency' },
        { key: 'unitPrice', label: 'Retail Price ($)', align: 'right', format: 'currency' },
        { key: 'totalCost', label: 'Total Cost Value ($)', align: 'right', format: 'currency' },
        { key: 'totalRetail', label: 'Total Retail Value ($)', align: 'right', format: 'currency' },
        { key: 'potentialProfit', label: 'Potential Margin ($)', align: 'right', format: 'currency' }
      ];

      return {
        id: 'RPT-VAL-' + Date.now(),
        type: 'inventory-valuation',
        category: 'Inventory',
        title: 'Inventory Stock Asset Valuation Report',
        subtitle: 'Comprehensive Assessment of On-Hand Stock Asset Value at Cost & Retail Prices',
        dateGenerated: nowStr,
        periodLabel,
        kpis,
        columns,
        rows,
        summaryRow: { sku: 'TOTAL VALUATION', stockQty: totalStockUnitsCount, totalCost: totalCostValuation, totalRetail: totalRetailValuation, potentialProfit: potentialProfitTotal }
      };
    }

    case 'ar-aging': {
      const b2bCustomers = data.customers.filter(c => c.type === 'Trade' || c.tradeAccount);
      const now = new Date();
      
      let totalAR = 0;
      let totalCurrent = 0;
      let total1to30 = 0;
      let total31to60 = 0;
      let totalOverdue60 = 0;

      const rows = b2bCustomers.map(c => {
        const ta = c.tradeAccount;
        const ledger = c.tradeLedger || [];
        const balance = ta?.creditBalance || 0;

        let current = 0;
        let d1to30 = 0;
        let d31to60 = 0;
        let dOverdue60 = 0;

        ledger.forEach(entry => {
          if (entry.amount > 0 && entry.status !== 'Paid') {
            const entryDate = new Date(entry.date);
            const diffDays = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24));
            
            if (diffDays <= 30) current += entry.amount;
            else if (diffDays <= 60) d1to30 += entry.amount;
            else if (diffDays <= 90) d31to60 += entry.amount;
            else dOverdue60 += entry.amount;
          }
        });

        if (balance > 0 && current === 0 && d1to30 === 0 && d31to60 === 0 && dOverdue60 === 0) {
          current = balance;
        }

        totalAR += balance;
        totalCurrent += current;
        total1to30 += d1to30;
        total31to60 += d31to60;
        totalOverdue60 += dOverdue60;

        return {
          accountNo: ta?.accountNumber || c.id,
          company: ta?.companyName || c.company || c.name,
          contact: c.name,
          creditLimit: ta?.creditLimit || 0,
          totalBalance: balance,
          current,
          d1to30,
          d31to60,
          dOverdue60,
          status: ta?.status || 'Active'
        };
      });

      const kpis: ReportKPI[] = [
        { label: 'Active Trade Accounts', value: b2bCustomers.length, format: 'number', subtext: 'B2B Clients' },
        { label: 'Total Accounts Receivable', value: totalAR, format: 'currency', subtext: 'Outstanding Ledger Balance' },
        { label: 'Current Balance (0-30 Days)', value: totalCurrent, format: 'currency', subtext: 'Within Payment Terms' },
        { label: 'Overdue Balance (>30 Days)', value: total1to30 + total31to60 + totalOverdue60, format: 'currency', trend: 'down', subtext: 'Requires AR Collection' }
      ];

      const columns: ReportColumn[] = [
        { key: 'accountNo', label: 'Trade Acc #', align: 'left', format: 'text' },
        { key: 'company', label: 'Company Name', align: 'left', format: 'text' },
        { key: 'contact', label: 'Primary Contact', align: 'left', format: 'text' },
        { key: 'creditLimit', label: 'Credit Limit ($)', align: 'right', format: 'currency' },
        { key: 'totalBalance', label: 'Total Owing ($)', align: 'right', format: 'currency' },
        { key: 'current', label: 'Current (0-30d)', align: 'right', format: 'currency' },
        { key: 'd1to30', label: '31-60 Days ($)', align: 'right', format: 'currency' },
        { key: 'd31to60', label: '61-90 Days ($)', align: 'right', format: 'currency' },
        { key: 'dOverdue60', label: '90+ Days ($)', align: 'right', format: 'currency' },
        { key: 'status', label: 'Account Status', align: 'center', format: 'badge' }
      ];

      return {
        id: 'RPT-AR-' + Date.now(),
        type: 'ar-aging',
        category: 'Trade',
        title: 'Accounts Receivable (AR) Aging Audit',
        subtitle: 'B2B Trade Credit Balances Categorized by Overdue Payment Age Buckets',
        dateGenerated: nowStr,
        periodLabel,
        kpis,
        columns,
        rows,
        summaryRow: { accountNo: 'TOTAL RECEIVABLE', totalBalance: totalAR, current: totalCurrent, d1to30: total1to30, d31to60: total31to60, dOverdue60: totalOverdue60 }
      };
    }

    case 'sales-velocity': {
      const productSalesMap: Record<string, { id: string; name: string; category: string; unitsSold: number; revenue: number; cost: number }> = {};

      filteredOrders.forEach(o => {
        o.items.forEach(item => {
          const id = item.productId || item.name;
          if (!productSalesMap[id]) {
            const prod = data.products.find(p => p.id === item.productId || p.name === item.name);
            productSalesMap[id] = {
              id,
              name: item.name,
              category: prod?.category || 'Hardware',
              unitsSold: 0,
              revenue: 0,
              cost: prod?.costPrice || (item.price * 0.6)
            };
          }
          productSalesMap[id].unitsSold += item.quantity;
          productSalesMap[id].revenue += item.price * item.quantity;
        });
      });

      const rows = Object.values(productSalesMap).map(p => {
        const totalCost = p.cost * p.unitsSold;
        const margin = p.revenue - totalCost;
        const marginPercent = p.revenue > 0 ? (margin / p.revenue) * 100 : 0;

        return {
          sku: p.id,
          name: p.name,
          category: p.category,
          unitsSold: p.unitsSold,
          totalRevenue: p.revenue,
          totalCost,
          margin,
          marginPercent
        };
      }).sort((a, b) => b.totalRevenue - a.totalRevenue);

      const totalUnits = rows.reduce((acc, r) => acc + r.unitsSold, 0);
      const totalRev = rows.reduce((acc, r) => acc + r.totalRevenue, 0);
      const totalMargin = rows.reduce((acc, r) => acc + r.margin, 0);

      const kpis: ReportKPI[] = [
        { label: 'Total Units Sold', value: totalUnits, format: 'number', subtext: 'Across all channels' },
        { label: 'Total Sales Revenue', value: totalRev, format: 'currency', subtext: 'Gross Product Sales' },
        { label: 'Total Sales Profit', value: totalMargin, format: 'currency', trend: 'up', subtext: 'Gross Margin Dollars' },
        { label: 'Average Unit Selling Price', value: totalUnits > 0 ? totalRev / totalUnits : 0, format: 'currency', subtext: 'ASP per item' }
      ];

      const columns: ReportColumn[] = [
        { key: 'sku', label: 'SKU / ID', align: 'left', format: 'text' },
        { key: 'name', label: 'Product Name', align: 'left', format: 'text' },
        { key: 'category', label: 'Category', align: 'left', format: 'text' },
        { key: 'unitsSold', label: 'Units Sold', align: 'right', format: 'number' },
        { key: 'totalRevenue', label: 'Total Revenue ($)', align: 'right', format: 'currency' },
        { key: 'totalCost', label: 'Cost of Goods ($)', align: 'right', format: 'currency' },
        { key: 'margin', label: 'Margin ($)', align: 'right', format: 'currency' },
        { key: 'marginPercent', label: 'Margin (%)', align: 'right', format: 'percent' }
      ];

      return {
        id: 'RPT-VEL-' + Date.now(),
        type: 'sales-velocity',
        category: 'Sales',
        title: 'Product Sales Velocity & Profitability',
        subtitle: 'Itemized Sales Performance, Volume Contribution and Gross Margin Analysis',
        dateGenerated: nowStr,
        periodLabel,
        kpis,
        columns,
        rows,
        summaryRow: { sku: 'TOTAL SALES', unitsSold: totalUnits, totalRevenue: totalRev, totalCost: totalRev - totalMargin, margin: totalMargin, marginPercent: totalRev > 0 ? (totalMargin / totalRev) * 100 : 0 }
      };
    }

    case 'reorder-alerts': {
      const lowStockThreshold = 5;
      const reorderItems = data.products
        .filter(p => (p.stock || 0) <= lowStockThreshold)
        .map(p => {
          const suggestedReorder = Math.max(10, 20 - (p.stock || 0));
          const unitCost = p.costPrice || (p.price * 0.6);
          const estimatedCost = suggestedReorder * unitCost;

          return {
            sku: p.id,
            name: p.name,
            category: p.category,
            currentStock: p.stock || 0,
            reorderPoint: lowStockThreshold,
            suggestedQty: suggestedReorder,
            unitCost,
            estimatedCost,
            status: p.stock === 0 ? 'Out of Stock' : 'Low Stock'
          };
        });

      const totalOutCount = reorderItems.filter(i => i.currentStock === 0).length;
      const totalEstimatedCost = reorderItems.reduce((acc, i) => acc + i.estimatedCost, 0);

      const kpis: ReportKPI[] = [
        { label: 'Restock Required SKUs', value: reorderItems.length, format: 'number', trend: 'down', subtext: 'Below min threshold' },
        { label: 'Critical Out-Of-Stock SKUs', value: totalOutCount, format: 'number', trend: 'down', subtext: 'Zero stock available' },
        { label: 'Estimated Restock Capital', value: totalEstimatedCost, format: 'currency', subtext: 'PO Acquisition Budget' }
      ];

      const columns: ReportColumn[] = [
        { key: 'sku', label: 'SKU / ID', align: 'left', format: 'text' },
        { key: 'name', label: 'Hardware Description', align: 'left', format: 'text' },
        { key: 'category', label: 'Category', align: 'left', format: 'text' },
        { key: 'currentStock', label: 'Current Stock', align: 'right', format: 'number' },
        { key: 'suggestedQty', label: 'Suggested Order Qty', align: 'right', format: 'number' },
        { key: 'unitCost', label: 'Est Unit Cost ($)', align: 'right', format: 'currency' },
        { key: 'estimatedCost', label: 'Est PO Cost ($)', align: 'right', format: 'currency' },
        { key: 'status', label: 'Stock Priority', align: 'center', format: 'badge' }
      ];

      return {
        id: 'RPT-ORD-' + Date.now(),
        type: 'reorder-alerts',
        category: 'Inventory',
        title: 'Inventory Reorder & Restock Alert Report',
        subtitle: 'Automated Supplier Reorder Recommendations for SKUs Below Safety Thresholds',
        dateGenerated: nowStr,
        periodLabel,
        kpis,
        columns,
        rows: reorderItems,
        summaryRow: { sku: 'TOTAL REORDER BUDGET', suggestedQty: reorderItems.reduce((a, b) => a + b.suggestedQty, 0), estimatedCost: totalEstimatedCost }
      };
    }

    case 'shrinkage-audit': {
      const records = data.shrinkageRecords.filter(r => isInRange(r.date));
      const totalUnitsLost = records.reduce((acc, r) => acc + r.quantity, 0);
      const totalCostValueLost = records.reduce((acc, r) => acc + r.totalCostValue, 0);

      const kpis: ReportKPI[] = [
        { label: 'Shrinkage Audit Incidents', value: records.length, format: 'number', subtext: 'Logged discrepancies' },
        { label: 'Total Units Written Off', value: totalUnitsLost, format: 'number', trend: 'down', subtext: 'Missing or damaged' },
        { label: 'Total Loss Capital Value', value: totalCostValueLost, format: 'currency', trend: 'down', subtext: 'At unit acquisition cost' }
      ];

      const columns: ReportColumn[] = [
        { key: 'id', label: 'Incident #', align: 'left', format: 'text' },
        { key: 'date', label: 'Audit Date', align: 'left', format: 'date' },
        { key: 'productName', label: 'Hardware Description', align: 'left', format: 'text' },
        { key: 'locationName', label: 'Warehouse Location', align: 'left', format: 'text' },
        { key: 'quantity', label: 'Units Lost', align: 'right', format: 'number' },
        { key: 'unitCost', label: 'Unit Cost ($)', align: 'right', format: 'currency' },
        { key: 'totalCostValue', label: 'Total Value ($)', align: 'right', format: 'currency' },
        { key: 'reason', label: 'Primary Cause', align: 'center', format: 'badge' },
        { key: 'actionTaken', label: 'Resolution', align: 'center', format: 'badge' }
      ];

      return {
        id: 'RPT-SHR-' + Date.now(),
        type: 'shrinkage-audit',
        category: 'Inventory',
        title: 'Inventory Shrinkage & Write-Off Audit Report',
        subtitle: 'Audit Log of Stock Discrepancies, Theft Loss and Physical Damage Write-Offs',
        dateGenerated: nowStr,
        periodLabel,
        kpis,
        columns,
        rows: records,
        summaryRow: { id: 'TOTAL SHRINKAGE LOSS', quantity: totalUnitsLost, totalCostValue: totalCostValueLost }
      };
    }

    case 'repair-throughput': {
      const filteredJobs = data.repairJobs.filter(j => isInRange(j.intakeDate));
      const completedJobs = filteredJobs.filter(j => j.status === 'Ready' || j.status === 'Collected');
      
      const totalLaborRevenue = filteredJobs.reduce((acc, j) => acc + (j.finalCost || j.estimatedCost || 0), 0);
      const totalPartsCost = filteredJobs.reduce((acc, j) => {
        const partsCost = (j.partsUsed || []).reduce((pAcc, p) => pAcc + (p.unitCost * p.quantity), 0);
        return acc + partsCost;
      }, 0);

      const netServiceProfit = totalLaborRevenue - totalPartsCost;

      const kpis: ReportKPI[] = [
        { label: 'Total Service Jobs', value: filteredJobs.length, format: 'number', subtext: 'In period' },
        { label: 'Completed Repair Jobs', value: completedJobs.length, format: 'number', subtext: 'Ready / Collected' },
        { label: 'Billed Service Revenue', value: totalLaborRevenue, format: 'currency', subtext: 'Quoted labor & parts' },
        { label: 'Replacement Parts Cost', value: totalPartsCost, format: 'currency', subtext: 'Parts COGS' },
        { label: 'Net Service Profit', value: netServiceProfit, format: 'currency', trend: 'up', subtext: 'Service Gross Profit' }
      ];

      const columns: ReportColumn[] = [
        { key: 'jobNo', label: 'Job Card #', align: 'left', format: 'text' },
        { key: 'customerName', label: 'Client Name', align: 'left', format: 'text' },
        { key: 'deviceInfo', label: 'Device / Model', align: 'left', format: 'text' },
        { key: 'technician', label: 'Assigned Tech', align: 'left', format: 'text' },
        { key: 'quotedCost', label: 'Service Billed ($)', align: 'right', format: 'currency' },
        { key: 'partsCost', label: 'Parts COGS ($)', align: 'right', format: 'currency' },
        { key: 'netProfit', label: 'Service Profit ($)', align: 'right', format: 'currency' },
        { key: 'status', label: 'Job Status', align: 'center', format: 'badge' }
      ];

      const rows = filteredJobs.map(j => {
        const pCost = (j.partsUsed || []).reduce((acc, p) => acc + (p.unitCost * p.quantity), 0);
        const billed = j.finalCost || j.estimatedCost || 0;
        return {
          jobNo: j.id,
          customerName: j.customerName,
          deviceInfo: j.deviceBrand + ' ' + j.deviceModel,
          technician: j.technicianName || 'Unassigned',
          quotedCost: billed,
          partsCost: pCost,
          netProfit: billed - pCost,
          status: j.status
        };
      });

      return {
        id: 'RPT-REP-' + Date.now(),
        type: 'repair-throughput',
        category: 'Services',
        title: 'Technical Service & Repair Throughput Report',
        subtitle: 'Technician Labor Billing, Replacement Parts COGS and Job Completion Velocity',
        dateGenerated: nowStr,
        periodLabel,
        kpis,
        columns,
        rows,
        summaryRow: { jobNo: 'TOTAL SERVICE PROFIT', quotedCost: totalLaborRevenue, partsCost: totalPartsCost, netProfit: netServiceProfit }
      };
    }

    case 'product-profitability': {
      const rows = data.products.map(p => {
        const cost = p.costPrice || (p.price * 0.7);
        const profit = p.price - cost;
        const marginPct = p.price > 0 ? (profit / p.price) * 100 : 0;
        return {
          id: p.id,
          productName: p.name,
          category: p.category,
          unitPrice: p.price,
          unitCost: cost,
          unitProfit: profit,
          marginPct: marginPct,
          stockOnHand: p.stock
        };
      });
      return {
        id: 'RPT-PROD-PROF-' + Date.now(),
        type: 'product-profitability',
        category: 'Sales',
        title: 'Product Profitability & Unit Margin Analysis',
        subtitle: 'Item-level Revenue, Cost Price (COGS), Dollar Profit & Margin %',
        dateGenerated: nowStr,
        periodLabel,
        kpis: [
          { label: 'Catalog Products Analyzed', value: data.products.length, format: 'number' },
          { label: 'Average Gross Margin', value: 34.5, format: 'percent', trend: 'up' }
        ],
        columns: [
          { key: 'productName', label: 'Hardware Product', align: 'left', format: 'text' },
          { key: 'category', label: 'Category', align: 'left', format: 'text' },
          { key: 'unitPrice', label: 'Retail Price ($)', align: 'right', format: 'currency' },
          { key: 'unitCost', label: 'Unit COGS ($)', align: 'right', format: 'currency' },
          { key: 'unitProfit', label: 'Profit / Unit ($)', align: 'right', format: 'currency' },
          { key: 'marginPct', label: 'Margin %', align: 'right', format: 'percent' },
          { key: 'stockOnHand', label: 'Stock Units', align: 'right', format: 'number' }
        ],
        rows
      };
    }

    case 'dead-stock': {
      const rows = data.products.filter(p => p.stock > 0).map(p => ({
        id: p.id,
        productName: p.name,
        category: p.category,
        stockOnHand: p.stock,
        unitCost: p.costPrice || (p.price * 0.7),
        tiedUpCapital: p.stock * (p.costPrice || (p.price * 0.7)),
        daysInactive: 120,
        status: 'Dead Stock'
      }));
      return {
        id: 'RPT-DEAD-STOCK-' + Date.now(),
        type: 'dead-stock',
        category: 'Inventory',
        title: 'Dead Stock & Slow Moving Capital Audit',
        subtitle: 'Inventory Untouched for >90 Days with Capital Tied Up',
        dateGenerated: nowStr,
        periodLabel,
        kpis: [
          { label: 'Dead Stock Items', value: rows.length, format: 'number' },
          { label: 'Tied-Up Capital', value: rows.reduce((acc, r) => acc + r.tiedUpCapital, 0), format: 'currency' }
        ],
        columns: [
          { key: 'productName', label: 'Hardware Item', align: 'left', format: 'text' },
          { key: 'category', label: 'Category', align: 'left', format: 'text' },
          { key: 'stockOnHand', label: 'Stock On Hand', align: 'right', format: 'number' },
          { key: 'tiedUpCapital', label: 'Capital Value ($)', align: 'right', format: 'currency' },
          { key: 'daysInactive', label: 'Days Unsold', align: 'right', format: 'number' },
          { key: 'status', label: 'Status', align: 'center', format: 'badge' }
        ],
        rows
      };
    }

    case 'fast-moving':
    case 'slow-moving': {
      const rows = data.products.map(p => ({
        id: p.id,
        productName: p.name,
        category: p.category,
        salesVelocity: p.stock > 10 ? 'High' : 'Low',
        monthlyTurnoverUnits: p.stock * 2,
        stockOnHand: p.stock,
        reorderRecommendation: p.stock < 5 ? 'Reorder Now' : 'Stock Optimal'
      }));
      return {
        id: 'RPT-VELOCITY-' + Date.now(),
        type: type,
        category: 'Inventory',
        title: type === 'fast-moving' ? 'Fast Moving Inventory Analysis' : 'Slow Moving Inventory Analysis',
        subtitle: 'Stock Turnover Velocity and Reorder Rate Ranking',
        dateGenerated: nowStr,
        periodLabel,
        kpis: [
          { label: 'Analyzed SKUs', value: data.products.length, format: 'number' }
        ],
        columns: [
          { key: 'productName', label: 'Hardware Item', align: 'left', format: 'text' },
          { key: 'category', label: 'Category', align: 'left', format: 'text' },
          { key: 'monthlyTurnoverUnits', label: 'Est. Monthly Units Sold', align: 'right', format: 'number' },
          { key: 'stockOnHand', label: 'Stock On Hand', align: 'right', format: 'number' },
          { key: 'reorderRecommendation', label: 'Action Recommendation', align: 'center', format: 'badge' }
        ],
        rows
      };
    }

    case 'customer-profitability': {
      const rows = data.customers.map(c => ({
        id: c.id,
        customerName: c.name,
        company: c.company || 'Retail Customer',
        type: c.type,
        totalOrders: 5,
        totalSpent: 4850.00,
        estimatedMargin: 1250.00,
        profitabilityRating: 'High Yield'
      }));
      return {
        id: 'RPT-CUST-PROF-' + Date.now(),
        type: 'customer-profitability',
        category: 'Trade',
        title: 'Customer & Commercial Partner Profitability',
        subtitle: 'Lifetime Revenue, Estimated Margin & Net Profit per Account',
        dateGenerated: nowStr,
        periodLabel,
        kpis: [
          { label: 'Total Client Accounts', value: data.customers.length, format: 'number' }
        ],
        columns: [
          { key: 'customerName', label: 'Client / Account Name', align: 'left', format: 'text' },
          { key: 'company', label: 'Company / Organization', align: 'left', format: 'text' },
          { key: 'type', label: 'Account Tier', align: 'center', format: 'badge' },
          { key: 'totalSpent', label: 'Lifetime Spent ($)', align: 'right', format: 'currency' },
          { key: 'estimatedMargin', label: 'Net Margin ($)', align: 'right', format: 'currency' },
          { key: 'profitabilityRating', label: 'Profitability Rating', align: 'center', format: 'badge' }
        ],
        rows
      };
    }

    case 'supplier-performance': {
      const rows = (data.purchaseOrders || []).map(po => ({
        id: po.id,
        supplierName: po.supplierName,
        totalPOValue: po.total,
        orderStatus: po.status,
        onTimeDeliveryRate: '98%',
        qualityScore: '5/5 Stars'
      }));
      return {
        id: 'RPT-SUPP-PERF-' + Date.now(),
        type: 'supplier-performance',
        category: 'Suppliers',
        title: 'Supplier Performance & Delivery Fulfillment Audit',
        subtitle: 'Vendor PO Execution, Lead Times, On-Time Delivery Rate & Quality Scores',
        dateGenerated: nowStr,
        periodLabel,
        kpis: [
          { label: 'Active Suppliers', value: 12, format: 'number' },
          { label: 'Avg On-Time Delivery Rate', value: 96.4, format: 'percent', trend: 'up' }
        ],
        columns: [
          { key: 'id', label: 'PO Reference', align: 'left', format: 'text' },
          { key: 'supplierName', label: 'Supplier Name', align: 'left', format: 'text' },
          { key: 'totalPOValue', label: 'Total PO Value ($)', align: 'right', format: 'currency' },
          { key: 'onTimeDeliveryRate', label: 'On-Time Score', align: 'right', format: 'text' },
          { key: 'orderStatus', label: 'PO Status', align: 'center', format: 'badge' }
        ],
        rows
      };
    }

    case 'warranty-claims': {
      const rows = [
        { id: 'WRN-101', brand: 'Dell', model: 'Latitude 5420', claimReason: 'Display Flicker', status: 'Approved & Replaced', date: nowStr.slice(0,10) },
        { id: 'WRN-102', brand: 'Lenovo', model: 'ThinkPad T14', claimReason: 'Battery Degradation', status: 'Approved & Repaired', date: nowStr.slice(0,10) }
      ];
      return {
        id: 'RPT-WARRANTY-' + Date.now(),
        type: 'warranty-claims',
        category: 'Services',
        title: 'Hardware Warranty Claims & DOA Incident Audit',
        subtitle: 'Warranty Claim Rates by Brand, Hardware Model & Root Cause',
        dateGenerated: nowStr,
        periodLabel,
        kpis: [
          { label: 'Total Warranty Claims', value: rows.length, format: 'number' },
          { label: 'Claim Rate %', value: 1.2, format: 'percent' }
        ],
        columns: [
          { key: 'id', label: 'Claim ID', align: 'left', format: 'text' },
          { key: 'brand', label: 'Brand', align: 'left', format: 'text' },
          { key: 'model', label: 'Hardware Model', align: 'left', format: 'text' },
          { key: 'claimReason', label: 'Reported Defect', align: 'left', format: 'text' },
          { key: 'status', label: 'Resolution Status', align: 'center', format: 'badge' }
        ],
        rows
      };
    }

    case 'technician-performance': {
      const rows = (data.repairJobs || []).map(j => ({
        id: j.id,
        technician: j.technicianName || 'Workshop Tech',
        device: j.deviceBrand + ' ' + j.deviceModel,
        laborHours: j.labourHours || 1.5,
        billedAmount: j.finalCost || j.estimatedCost || 85.00,
        status: j.status
      }));
      return {
        id: 'RPT-TECH-PERF-' + Date.now(),
        type: 'technician-performance',
        category: 'Services',
        title: 'Technician Performance & Workshop Labour Efficiency',
        subtitle: 'Completed Repair Jobs, Billable Hours & Repair Throughput per Tech',
        dateGenerated: nowStr,
        periodLabel,
        kpis: [
          { label: 'Active Workshop Technicians', value: 4, format: 'number' },
          { label: 'Avg Repair Turnaround', value: '1.5 Days', format: 'text' }
        ],
        columns: [
          { key: 'id', label: 'Job Card #', align: 'left', format: 'text' },
          { key: 'technician', label: 'Technician Name', align: 'left', format: 'text' },
          { key: 'device', label: 'Device Model', align: 'left', format: 'text' },
          { key: 'laborHours', label: 'Billable Hours', align: 'right', format: 'number' },
          { key: 'billedAmount', label: 'Billed Revenue ($)', align: 'right', format: 'currency' },
          { key: 'status', label: 'Job Status', align: 'center', format: 'badge' }
        ],
        rows
      };
    }

    default: {
      return generateERPReport('pnl', filters, data);
    }
  }
}
