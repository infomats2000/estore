export type PriceTierType = 'Retail' | 'Reseller' | 'Wholesale' | 'Government';
export type CreditTermType = 'Net 7' | 'Net 14' | 'Net 30' | 'Net 60' | 'Prepaid / COD';
export type TradeAccountStatus = 'Pending' | 'Active' | 'Credit Hold' | 'Suspended' | 'Rejected';

export interface VolumeDiscount {
  minQty: number;
  discountPercent?: number;
  unitPrice?: number;
}

export interface ProductTierPrices {
  Reseller?: number;
  Wholesale?: number;
  Government?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  collection?: string;
  price: number;
  discountPrice?: number;
  image: string;
  additionalImages: string[];
  rating: number;
  reviewsCount: number;
  stock: number;
  sales?: number;
  costPrice?: number;
  specs: Record<string, string>;
  tags: string[];
  colors?: string[];
  sizes?: string[];
  serialNumbers?: string[];
  locationStock?: Record<string, number>;
  tierPrices?: ProductTierPrices;
  volumeDiscounts?: VolumeDiscount[];
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  change: number;
  newStock: number;
  reason: 'Supplier Shipment' | 'Damaged in Transit' | 'Store Demo Unit' | 'Customer Return' | 'Audit Discrepancy' | 'Physical Stocktake' | 'Manual Refill' | 'POS Sale';
  date: string;
  notes?: string;
}

export interface CartItem {
  id: string; // unique ID combining product ID + color + size
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string;
}

export interface Order {
  id: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    color?: string;
    size?: string;
    image: string;
  }[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered';
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerCity: string;
  customerPhone?: string;
  date: string;
  paymentMethod: string;
  invoiceNumber?: string;
  poNumber?: string;
  notes?: string;
}

export interface InvoiceItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
}

export interface Invoice {
  id: string;
  orderId?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  poNumber?: string;
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Partially Paid' | 'Cancelled' | 'Quote';
  type: 'Tax Invoice' | 'Pro Forma' | 'Quote' | 'Credit Note';
  customerName: string;
  customerCompany?: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress: string;
  customerCity: string;
  customerABN?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentTerms?: string;
  notes?: string;
}

export interface Coupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  active: boolean;
  minPurchase?: number;
}

export interface TradeLedgerEntry {
  id: string;
  customerId: string;
  customerName: string;
  companyName?: string;
  date: string;
  dueDate?: string;
  type: 'Invoice Charge' | 'Payment Received' | 'Credit Adjustment' | 'Refund';
  amount: number; // positive for charge, negative for payment
  runningBalance: number;
  reference: string; // Order # or Invoice # or Receipt #
  description: string;
  status?: 'Current' | 'Overdue' | 'Paid';
  paymentMethod?: string;
}

export interface TradeAccount {
  accountNumber: string; // e.g. TRD-10042
  companyName: string;
  abn: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  status: TradeAccountStatus;
  creditLimit: number;
  creditBalance: number; // current owing balance
  creditTerms: CreditTermType;
  priceTier: PriceTierType;
  customDiscountPercent?: number;
  poRequired: boolean;
  taxExempt: boolean;
  appliedDate: string;
  approvedDate?: string;
  lastReminderSent?: string;
  notes?: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  type: 'Retail' | 'Wholesale' | 'Trade';
  registrationDate: string;
  company?: string;
  abn?: string;
  walletBalance: number;
  points: number;
  wishlist: string[]; // array of product IDs
  priceDropNotifications?: string[]; // array of product IDs for price drop alerts
  notes?: string;
  tradeAccount?: TradeAccount;
  tradeLedger?: TradeLedgerEntry[];
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    reason: string;
  }[];
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  requestDate: string;
  resolutionDate?: string;
  adminNote?: string;
  totalAmount?: number;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: string;
  memberCount: number;
}

export interface UpsellRule {
  id: string;
  triggerProductId: string;
  upsellProductId: string;
  discountPercent: number;
  active: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  status: 'Active' | 'Inactive';
  suppliedCategories: string[];
  performanceRating: number;
  leadTimeDays: number;
  paymentTerms: string;
  reliabilityScore: number;
}

export interface SupplierOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  quantity: number;
  totalCost: number;
  orderDate: string;
  expectedDeliveryDate: string;
  status: 'Pending' | 'Shipped' | 'Received';
}

export interface ShipmentHistory {
  status: 'Label Created' | 'Package Received' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Returned';
  timestamp: string;
  location: string;
  note: string;
}

export interface Shipment {
  id: string; // e.g., SHP-10023
  orderId: string;
  customerName: string;
  carrier: 'FedEx' | 'DHL' | 'USPS' | 'UPS' | 'DHL Express';
  trackingNumber: string;
  shippingMethod: 'Standard' | 'Express' | 'Overnight';
  shippingCost: number;
  status: 'Label Created' | 'Package Received' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Returned';
  origin: string;
  destination: string;
  weightKg: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  shipDate: string;
  estimatedDeliveryDate: string;
  history: ShipmentHistory[];
}

export interface FinanceTransaction {
  id: string;
  date: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  description: string;
  reference: string;
  tags?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  permissions: string[];
  lastLogin?: string;
}

export interface StoreSettings {
  // General Branding
  storeName: string;
  storeTagline: string;
  legalName: string;
  businessNumber: string; // ABN / Tax ID / Tax Reg
  logoUrl?: string;
  currencySymbol: string;
  taxRatePercent: number; // e.g. 10 for 10%
  taxName: string; // e.g. 'GST', 'VAT', 'Sales Tax'
  
  // Contact & Address Details
  address: string;
  cityStateZip: string;
  phone: string;
  email: string;
  website: string;
  businessHours: string;

  // Banking & Payments
  bankName: string;
  accountName: string;
  bsb: string;
  accountNumber: string;
  swift: string;
  paymentTermsNote: string;

  // Printable Invoice & Font Settings
  invoiceHeaderSubtitle: string;
  invoiceFooterNote: string;
  invoiceWarrantyText: string;
  invoiceBodyFontSize: string; // e.g. '12px'
  invoiceHeadingFontSize: string; // e.g. '22px'
  invoiceItemFontSize: string; // e.g. '11px'
  posReceiptFontSize: string; // e.g. '11px'
  invoiceCompactness: 'standard' | 'compact' | 'spacious';
  showBankOnInvoice: boolean;

  // Website & Storefront Rules
  announcementText: string;
  showAnnouncementBar: boolean;
  themePrimaryColor: string;
  themeAccentColor: string;
  freeShippingThreshold: number;
  whyShopHeadingTop: string;
  whyShopHeadingHighlight: string;
  whyShopHeadingBottom: string;
  whyShopBodyText: string;
  whyShopBulletPoints: string[];
  productConditions?: string[];
  productCpus?: string[];
  productRams?: string[];
  productStorages?: string[];
  productWarranties?: string[];
  productScreenSizes?: string[];
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'TECH SELLER',
  storeTagline: 'Quality Refurbished Enterprise Hardware',
  legalName: 'Tech Seller Australia Pty Ltd',
  businessNumber: 'ABN 45 123 456 789',
  logoUrl: '/images/app_logo.jpg',
  currencySymbol: '$',
  taxRatePercent: 10,
  taxName: 'GST',
  
  address: '456 Velvet Boulevard',
  cityStateZip: 'Sydney NSW 2000',
  phone: '1300 000 228',
  email: 'billing@techseller.com.au',
  website: 'www.techseller.com.au',
  businessHours: 'Open 24/7',

  bankName: 'Commonwealth Bank',
  accountName: 'Tech Seller Australia Pty Ltd',
  bsb: '062-000',
  accountNumber: '12345678',
  swift: 'CTBAAU2S',
  paymentTermsNote: 'Payment due on receipt.',

  invoiceHeaderSubtitle: 'Invoice',
  invoiceFooterNote: 'Thank you for your business.',
  invoiceWarrantyText: 'Standard Return Policy',
  invoiceBodyFontSize: '12px',
  invoiceHeadingFontSize: '22px',
  invoiceItemFontSize: '11px',
  posReceiptFontSize: '11px',
  invoiceCompactness: 'standard',
  showBankOnInvoice: true,

  announcementText: 'Welcome to our new store!',
  showAnnouncementBar: true,
  themePrimaryColor: '#0f172a',
  themeAccentColor: '#3b82f6',
  freeShippingThreshold: 0,
  whyShopHeadingTop: "Australia's Leader in",
  whyShopHeadingHighlight: 'Premium Refurbished',
  whyShopHeadingBottom: 'Hardware',
  whyShopBodyText: 'At TECH SELLER, we bridge the gap between high-performance technology and affordability. Our refurbished units are sourced from top-tier corporate environments and undergo rigorous testing by our certified Australian technicians.',
  whyShopBulletPoints: [
    'Professional 50-Point Inspection',
    '12 Month Express Warranty',
    'Eco-Friendly Sustainable Choice',
    'Australia-Wide Fast Delivery',
    'Certified Refurbished Grade A',
    'Genuine Windows Licenses'
  ],
  productConditions: ['Brand New', 'Like New', 'Refurbished - Grade A', 'Refurbished - Grade B', 'Refurbished - Grade C', 'Open Box', 'For Parts / Repair'],
  productCpus: ['Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'Apple M1', 'Apple M2', 'Apple M3', 'AMD Ryzen 5', 'AMD Ryzen 7'],
  productRams: ['8GB DDR4', '16GB DDR4', '32GB DDR4', '64GB DDR4', '16GB Unified', '32GB Unified'],
  productStorages: ['256GB NVMe SSD', '512GB NVMe SSD', '1TB NVMe SSD', '2TB NVMe SSD'],
  productWarranties: ['3 Months', '6 Months', '12 Months Commercial', '24 Months Extended'],
  productScreenSizes: ['13.3"', '14.0"', '15.6"', '16.0"', '27" 4K Monitor']
};

// ============================================================
// ERP PHASE 1 — PURCHASE ORDERS
// ============================================================

export interface POLineItem {
  id: string;
  productId?: string;
  productName: string;
  sku?: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId?: string;
  supplierName: string;
  status: 'Draft' | 'Sent' | 'Partially Received' | 'Received' | 'Cancelled';
  items: POLineItem[];
  subtotal: number;
  freight: number;
  duties: number;
  total: number;
  expectedDelivery: string;
  notes?: string;
  createdDate: string;
  receivedDate?: string;
  supplierInvoiceNumber?: string;
  paymentStatus: 'Unpaid' | 'Paid' | 'Partial';
  paymentDueDate?: string;
}

// ============================================================
// ERP PHASE 1 — REPAIR / SERVICE JOB CARDS
// ============================================================

export interface RepairJobPart {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
}

export interface RepairJob {
  id: string;
  status: 'Intake' | 'Diagnosed' | 'Awaiting Parts' | 'In Progress' | 'QC' | 'Ready' | 'Collected' | 'Cancelled';
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  serialNumber?: string;
  fault: string;
  diagnosis?: string;
  technicianName?: string;
  partsUsed: RepairJobPart[];
  labourHours: number;
  labourRatePerHour: number;
  estimatedCost: number;
  finalCost?: number;
  isWarrantyJob: boolean;
  intakeDate: string;
  completedDate?: string;
  collectedDate?: string;
  notes?: string;
  internalNotes?: string;
}

// ============================================================
// ERP PHASE 1 — STOCK UNIT LIFECYCLE
// ============================================================

export interface StockUnitAuditEntry {
  date: string;
  action: string;
  performedBy?: string;
  notes?: string;
}

export interface StockUnit {
  id: string;
  serialNumber: string;
  productId: string;
  productName: string;
  purchaseOrderId?: string;
  status: 'In Stock' | 'Reserved' | 'Sold' | 'In Repair' | 'Returned' | 'Scrapped' | 'Write-Off';
  grade?: 'A+' | 'A' | 'B' | 'C' | 'D';
  costPrice: number;
  saleOrderId?: string;
  repairJobId?: string;
  warrantyExpiryDate?: string;
  notes?: string;
  auditLog: StockUnitAuditEntry[];
  receivedDate: string;
  locationId?: string;
  locationName?: string;
  binLocation?: string;
}

// ============================================================
// ERP PHASE 2 — MULTI-LOCATION WAREHOUSE & BIN MANAGEMENT
// ============================================================

export interface WarehouseBin {
  id: string;
  code: string; // e.g. "A-01-12"
  zone?: string;
  rack?: string;
  shelf?: string;
  binNumber?: string;
  notes?: string;
}

export interface WarehouseLocation {
  id: string;
  code: string; // e.g. "WH-MAIN", "WH-SHOWROOM", "WH-REPAIR"
  name: string; // e.g. "Main Logistics Hub", "Sydney Showroom", "Repair Bay"
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isDefault?: boolean;
  bins: WarehouseBin[];
}

export interface StockTransferItem {
  productId: string;
  productName: string;
  quantity: number;
  stockUnitIds?: string[];
}

export interface StockTransfer {
  id: string;
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;
  status: 'Draft' | 'Pending' | 'In Transit' | 'Completed' | 'Cancelled';
  transferDate: string;
  completedDate?: string;
  requestedBy?: string;
  reason?: string;
  items: StockTransferItem[];
  notes?: string;
}

// ============================================================
// ERP PHASE 3 — STOCKTAKE & CYCLE COUNTING
// ============================================================

export type StocktakeType = 'Full Stocktake' | 'Category Cycle Count' | 'Location Cycle Count' | 'Spot Audit';
export type StocktakeStatus = 'Draft' | 'In Progress' | 'Under Review' | 'Completed' | 'Cancelled';

export interface StocktakeItem {
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  category: string;
  locationId?: string;
  expectedQty: number;
  countedQty: number;
  variance: number;
  unitCost: number;
  varianceValue: number;
  notes?: string;
  status: 'Pending' | 'Matched' | 'Discrepancy' | 'Adjusted' | 'Written Off';
  scannedAt?: string;
}

export interface StocktakeSession {
  id: string;
  title: string;
  type: StocktakeType;
  status: StocktakeStatus;
  categoryFilter?: string;
  locationId?: string;
  locationName?: string;
  startDate: string;
  completedDate?: string;
  conductedBy: string;
  items: StocktakeItem[];
  totalExpectedUnits: number;
  totalCountedUnits: number;
  netVarianceUnits: number;
  netVarianceValue: number;
  shrinkageUnits: number;
  shrinkageValue: number;
  notes?: string;
}

export interface ShrinkageRecord {
  id: string;
  stocktakeId?: string;
  productId: string;
  productName: string;
  category: string;
  locationName?: string;
  quantity: number;
  unitCost: number;
  totalCostValue: number;
  reason: 'Shrinkage / Theft' | 'Damaged / Broken' | 'Expired / Obsolete' | 'Sample / Demo Usage' | 'Data Entry Error';
  date: string;
  reportedBy: string;
  actionTaken: 'Stock Adjusted' | 'Insurance Claim Filed' | 'Written Off';
  notes?: string;
}
