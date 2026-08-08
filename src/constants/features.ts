export interface FeatureDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  iconName: string;
}

export const FEATURE_IDS = {
  POS: 'pos',
  STOREFRONT: 'storefront',
  CUSTOM_DOMAIN: 'custom_domain',
  MARKETING: 'marketing',
  TRADE_ACCOUNTS: 'trade_accounts',
  PROCUREMENT: 'procurement',
  WMS_INVENTORY: 'wms_inventory',
  REPAIR_JOBS: 'repair_jobs',
  PC_BUILDER: 'pc_builder',
  FINANCE_LEDGER: 'finance_ledger',
  API_ACCESS: 'api_access',
  ANALYTICS_REPORTS: 'analytics_reports',
  PAYROLL_HR: 'payroll_hr',
  WORKFLOW_AUTOMATION: 'workflow_automation',
  STAFF_RBAC: 'staff_rbac',
  MULTI_STORE: 'multi_store',
  MASTER_DATA: 'master_data',
} as const;

export const ALL_FEATURES: FeatureDefinition[] = [
  {
    id: 'pos',
    name: 'POS Cash Register',
    category: 'Sales & In-Store',
    description: 'In-store retail counter cash register with barcode scanner support',
    iconName: 'ShoppingCart',
  },
  {
    id: 'storefront',
    name: 'Website Storefront',
    category: 'E-Commerce Tools',
    description: 'Public product catalogue, storefront design controls, shopping cart, and online customer experience',
    iconName: 'Store',
  },
  {
    id: 'custom_domain',
    name: 'Custom Top-Level Domain (TLD)',
    category: 'Branding & Domain',
    description: 'Bind your own top-level domain name (e.g. www.mybrandstore.com)',
    iconName: 'Globe',
  },
  {
    id: 'marketing',
    name: 'Marketing & Growth Suite',
    category: 'Sales & Growth',
    description: 'Coupons, promo codes, customer segmentation, and upsell rules',
    iconName: 'Sparkles',
  },
  {
    id: 'trade_accounts',
    name: 'B2B Trade Accounts & Credit',
    category: 'B2B Wholesale',
    description: 'Trade customer credit limits, payment terms (Net 30/60), and PO invoices',
    iconName: 'Building2',
  },
  {
    id: 'procurement',
    name: 'Procurement & Purchase Orders',
    category: 'Inventory & Supply Chain',
    description: 'Supplier PO creation, Goods Received Notes (GRN), and vendor management',
    iconName: 'Truck',
  },
  {
    id: 'wms_inventory',
    name: 'Warehouses and Stock',
    category: 'Inventory & Supply Chain',
    description: 'Multi-warehouse stock transfers, bin locations, and stocktakes',
    iconName: 'Package',
  },
  {
    id: 'repair_jobs',
    name: 'Repair & Service Ticketing',
    category: 'Service & Maintenance',
    description: 'Hardware repair job tracking, RMA returns, and service ticketing',
    iconName: 'Wrench',
  },
  {
    id: 'pc_builder',
    name: 'Custom PC Builder Engine',
    category: 'E-Commerce Tools',
    description: 'Interactive component compatibility builder for hardware stores',
    iconName: 'Cpu',
  },
  {
    id: 'finance_ledger',
    name: 'Financial Ledger & Expenses',
    category: 'Finance & Accounting',
    description: 'Double-entry bookkeeping, expense tracking, and P&L reports',
    iconName: 'DollarSign',
  },
  {
    id: 'api_access',
    name: 'REST API & Webhooks Integration',
    category: 'Developer & Integrations',
    description: 'Programmatic API keys, webhook notifications, and custom ERP integration',
    iconName: 'Code',
  },
  { id: 'analytics_reports', name: 'Analytics, BI & ERP Reports', category: 'Analytics & Executive', description: 'Business intelligence dashboards, analytics, and ERP reports', iconName: 'BarChart3' },
  { id: 'payroll_hr', name: 'Staff & Payroll', category: 'Finance & HR', description: 'Staff rostering, payroll, commissions, and HR operations', iconName: 'Coins' },
  { id: 'workflow_automation', name: 'Workflow Automation', category: 'Automation', description: 'Visual workflow automation, alerts, and scheduled actions', iconName: 'Zap' },
  { id: 'staff_rbac', name: 'Staff Accounts & RBAC', category: 'Administration', description: 'Staff accounts, roles, and granular access controls', iconName: 'ShieldCheck' },
  { id: 'multi_store', name: 'Multi-Store Branch Management', category: 'Omnichannel & Stores', description: 'Branch locations, registers, and inter-store operations', iconName: 'MapPin' },
  { id: 'master_data', name: 'Master Data & Lookup Tables', category: 'Catalog & Setup', description: 'Store lookup tables, catalog metadata, and operational setup', iconName: 'SlidersHorizontal' },
];

// Every dashboard module must resolve to a plan feature. Core commerce modules
// intentionally use `pos`, the baseline feature included in every plan.
export const DASHBOARD_TAB_FEATURE_MAP: Record<string, string> = {
  metrics: 'pos', products: 'pos', orders: 'pos', customers: 'pos', invoices: 'pos',
  inventory: 'pos', returns: 'pos', categories: 'pos', collections: 'pos',
  'purchase-orders': 'procurement', suppliers: 'procurement', procurement: 'procurement', shipping: 'procurement',
  'inbound-jobs': 'procurement',
  warehouses: 'wms_inventory', wms: 'wms_inventory', 'stock-units': 'wms_inventory',
  'logistics-dispatch': 'wms_inventory', 'massive-inventory': 'wms_inventory',
  'trade-accounts': 'trade_accounts', 'commercial-sales': 'trade_accounts',
  'pricing-matrix': 'trade_accounts', distribution: 'trade_accounts',
  repairs: 'repair_jobs', refurb: 'repair_jobs',
  coupons: 'marketing', segments: 'marketing', upsells: 'marketing', reviews: 'marketing',
  finance: 'finance_ledger', ebay: 'api_access',
  bi: 'analytics_reports', reports: 'analytics_reports', analytics: 'analytics_reports',
  payroll: 'payroll_hr', automation: 'workflow_automation', users: 'staff_rbac',
  stores: 'multi_store', 'master-data': 'master_data',
};

export const LEGACY_STAFF_FEATURE_MAP: Record<string, string> = {
  'commercial-sales': 'trade_accounts', 'pricing-matrix': 'trade_accounts', distribution: 'trade_accounts',
  'massive-inventory': 'wms_inventory', wms: 'wms_inventory', 'logistics-dispatch': 'wms_inventory',
  procurement: 'procurement', suppliers: 'procurement', bi: 'analytics_reports', reports: 'analytics_reports',
  finance: 'finance_ledger', payroll: 'payroll_hr', automation: 'workflow_automation', ebay: 'api_access',
  stores: 'multi_store', users: 'staff_rbac',
};

export const normalizeStaffFeatureIds = (features: string[]): string[] =>
  [...new Set(features.map((feature) => LEGACY_STAFF_FEATURE_MAP[feature] || feature))];

export const STANDARD_PLAN_CODES = ['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE'] as const;

// Core ERP workspace granted to every standard billing tier. Plans created by a
// platform administrator use their explicitly selected features instead.
export const STANDARD_TENANT_FEATURES = [
  'pos',
  'trade_accounts',
  'procurement',
  'wms_inventory',
  'repair_jobs',
  'finance_ledger',
  'analytics_reports',
  'payroll_hr',
  'staff_rbac',
  'master_data',
] as const;

export const isStandardBillingPlan = (planCode?: string | null): boolean =>
  STANDARD_PLAN_CODES.includes(String(planCode || '').toUpperCase() as typeof STANDARD_PLAN_CODES[number]);

export const resolvePlanFeatureIds = (planCode: string | null | undefined, storedFeatures: string[]): string[] =>
  [...new Set([
    ...storedFeatures,
    ...(isStandardBillingPlan(planCode) ? STANDARD_TENANT_FEATURES : []),
  ])];

// Default Plan Feature Mappings
export const DEFAULT_PLAN_FEATURES: Record<string, string[]> = {
  FREE: [...STANDARD_TENANT_FEATURES],
  STARTER: [...new Set([...STANDARD_TENANT_FEATURES, 'storefront', 'marketing', 'pc_builder'])],
  GROWTH: [...new Set([...STANDARD_TENANT_FEATURES, 'storefront', 'custom_domain', 'marketing', 'pc_builder'])],
  ENTERPRISE: ALL_FEATURES.map((feature) => feature.id),
};
