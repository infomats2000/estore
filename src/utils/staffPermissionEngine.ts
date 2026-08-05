import { ERPFeaturePermission, StaffUserProfile, StaffUserRole } from '../types';

export const ALL_ERP_FEATURE_PERMISSIONS: ERPFeaturePermission[] = [
  { featureKey: 'commercial-sales', category: 'Sales & Orders', label: 'Commercial B2B Sales & Orders', description: 'Quotations, Proformas, Tax Invoices, Blanket Orders, Standing Orders, Drop Ship Orders' },
  { featureKey: 'pricing-matrix', category: 'Sales & Orders', label: '14-Dimension Customer Price Matrix', description: 'Tier pricing, volume breaks, brand discounts, contract price overrides' },
  { featureKey: 'distribution', category: 'Wholesale & Logistics', label: 'Wholesale & Reseller Operations', description: 'High-volume container tracking, reseller accounts, credit limits' },
  { featureKey: 'massive-inventory', category: 'Inventory & WMS', label: '100,000+ SKU Wholesale Catalog', description: 'Multi-warehouse stock pools, serial numbers, barcodes, RFID, VMI' },
  { featureKey: 'wms', category: 'Inventory & WMS', label: 'Warehouse Management System (WMS)', description: 'Receiving, AI put-away, wave/zone/batch picking, 2D visual maps, mobile scanner' },
  { featureKey: 'logistics-dispatch', category: 'Wholesale & Logistics', label: 'Logistics & Courier Freight Dispatch', description: 'Multi-carrier API bookings, route optimization, tracking, digital POD' },
  { featureKey: 'procurement', category: 'Purchasing & Vendors', label: 'Enterprise Global Procurement', description: 'RFQs, multi-currency bids, landed cost allocation (freight, duty, customs)' },
  { featureKey: 'suppliers', category: 'Purchasing & Vendors', label: 'Supplier Performance & Scorecards', description: 'Master contracts, SKU price history, lead times, defect rates %, scorecards' },
  { featureKey: 'bi', category: 'Analytics & Executive', label: 'Business Intelligence & Predictive Suite', description: 'Sales forecasting, stock depletion forecasts, ABC/XYZ grid, CLV churn radar' },
  { featureKey: 'reports', category: 'Analytics & Executive', label: '300+ ERP Analytics Reports', description: 'GST reports, margin analysis, technician performance, warranty claim logs' },
  { featureKey: 'finance', category: 'Financials & HR', label: 'Accounting & Commercial Finance', description: 'GL ledger, accounts receivable Net 30/60, accounts payable, P&L statements' },
  { featureKey: 'payroll', category: 'Financials & HR', label: 'HR, Staff Roster & Payroll', description: 'Employee rosters, STP tax reporting, commission payouts' },
  { featureKey: 'automation', category: 'System & Tools', label: 'Visual Automation Workflow Builder', description: 'Trigger-action automated workflows & SMS/email notifications' },
  { featureKey: 'ebay', category: 'Omnichannel & Stores', label: 'eBay Multi-Channel Integration', description: 'eBay sync, listing templates, order importing' },
  { featureKey: 'stores', category: 'Omnichannel & Stores', label: 'Multi-Store Branch Management', description: 'POS registers, store locations, inter-branch stock transfers' },
  { featureKey: 'users', category: 'System & Tools', label: 'Staff Management & RBAC Controls', description: 'Admin user creation, role assignments, feature permission matrix' }
];

export const DEFAULT_STAFF_PROFILES: StaffUserProfile[] = [
  {
    id: 'STAFF-ADMIN-01',
    name: 'System Administrator (Full Access)',
    email: 'admin@techseller.com.au',
    role: 'Admin',
    active: true,
    allowedFeatures: ALL_ERP_FEATURE_PERMISSIONS.map(f => f.featureKey),
    createdAt: '2026-01-01',
    lastLogin: '2026-08-05 18:30'
  },
  {
    id: 'STAFF-WH-02',
    name: 'Sarah Jenkins (Warehouse Manager)',
    email: 'sarah.j@techseller.com.au',
    role: 'Warehouse Manager',
    active: true,
    allowedFeatures: ['massive-inventory', 'wms', 'logistics-dispatch', 'procurement', 'suppliers'],
    createdAt: '2026-02-15',
    lastLogin: '2026-08-05 16:15'
  },
  {
    id: 'STAFF-SALES-03',
    name: 'David Chen (Channel Sales Executive)',
    email: 'david.c@techseller.com.au',
    role: 'Sales Executive',
    active: true,
    allowedFeatures: ['commercial-sales', 'pricing-matrix', 'distribution', 'bi'],
    createdAt: '2026-03-01',
    lastLogin: '2026-08-05 17:45'
  }
];

export function hasFeaturePermission(user: StaffUserProfile, featureKey: string): boolean {
  if (!user || !user.active) return false;
  if (user.role === 'Admin') return true; // Admin has full unrestricted rights
  return user.allowedFeatures.includes(featureKey);
}

export function getRoleTemplatePermissions(role: StaffUserRole): string[] {
  switch (role) {
    case 'Admin':
      return ALL_ERP_FEATURE_PERMISSIONS.map(f => f.featureKey);
    case 'Sales Executive':
      return ['commercial-sales', 'pricing-matrix', 'distribution', 'bi'];
    case 'Warehouse Manager':
      return ['massive-inventory', 'wms', 'logistics-dispatch', 'procurement', 'suppliers'];
    case 'Procurement Officer':
      return ['procurement', 'suppliers', 'massive-inventory', 'wms'];
    case 'Accountant':
      return ['finance', 'reports', 'payroll', 'commercial-sales'];
    default:
      return ['commercial-sales', 'massive-inventory'];
  }
}
