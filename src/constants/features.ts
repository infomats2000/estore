export interface FeatureDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  iconName: string;
}

export const FEATURE_IDS = {
  POS: 'pos',
  CUSTOM_DOMAIN: 'custom_domain',
  MARKETING: 'marketing',
  TRADE_ACCOUNTS: 'trade_accounts',
  PROCUREMENT: 'procurement',
  WMS_INVENTORY: 'wms_inventory',
  REPAIR_JOBS: 'repair_jobs',
  PC_BUILDER: 'pc_builder',
  FINANCE_LEDGER: 'finance_ledger',
  API_ACCESS: 'api_access',
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
    name: 'Multi-Warehouse & WMS',
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
];

// Default Plan Feature Mappings
export const DEFAULT_PLAN_FEATURES: Record<string, string[]> = {
  FREE: ['pos'],
  STARTER: ['pos', 'marketing', 'pc_builder'],
  GROWTH: ['pos', 'custom_domain', 'marketing', 'trade_accounts', 'procurement', 'wms_inventory', 'pc_builder'],
  ENTERPRISE: ['pos', 'custom_domain', 'marketing', 'trade_accounts', 'procurement', 'wms_inventory', 'repair_jobs', 'pc_builder', 'finance_ledger', 'api_access'],
};
