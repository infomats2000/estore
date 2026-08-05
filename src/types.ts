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

export interface BundleComponent {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface ConsignmentPayoutRecord {
  id: string;
  vendorName: string;
  productId: string;
  productName: string;
  serialNumber?: string;
  saleOrderId: string;
  saleAmount: number;
  vendorPayoutAmount: number;
  storeCommissionAmount: number;
  status: 'Unpaid' | 'Paid' | 'Processing';
  dateSold: string;
  paidDate?: string;
  payoutReference?: string;
}

export interface PaymentSplitLine {
  id: string;
  method: 'Cash' | 'EFTPOS Card' | 'Store Credit / Wallet' | 'Trade Credit' | 'Gift Card';
  amount: number;
  reference?: string;
}

export interface LaybyDeposit {
  id: string;
  date: string;
  amount: number;
  paymentMethod: string;
  receiptNumber: string;
}

export interface LaybyOrder {
  id: string;
  laybyNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  items: CartItem[];
  totalAmount: number;
  depositPaid: number;
  remainingBalance: number;
  status: 'Active' | 'Completed' | 'Cancelled' | 'Forfeited';
  createdAt: string;
  expiryDate: string;
  deposits: LaybyDeposit[];
}

export type SalesChannel = 'eBay' | 'Amazon' | 'Facebook' | 'GoogleShopping' | 'Shopify' | 'WooCommerce';
export type MarketplaceCode = 'EBAY_AU' | 'EBAY_US' | 'EBAY_GB' | 'EBAY_CA' | 'EBAY_DE' | 'AMAZON_AU' | 'AMAZON_US' | 'META_SHOP' | 'GOOGLE_MERCHANT';

export interface ChannelAccount {
  id: string;
  channel: SalesChannel;
  marketplace: MarketplaceCode;
  sellerId: string;
  storeName: string;
  status: 'Connected' | 'Disconnected' | 'Token Expired' | 'Syncing';
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  tokenExpiresAt: string;
  syncFrequencyMinutes: number;
  lastSyncAt: string;
  nextSyncAt: string;
  createdAt: string;
}

export interface ChannelListing {
  id: string;
  accountId: string;
  productId: string;
  externalListingId: string;
  channel: SalesChannel;
  title: string;
  subtitle?: string;
  sku: string;
  mpn?: string;
  brand?: string;
  upc?: string;
  ean?: string;
  price: number;
  quantity: number;
  status: 'Active' | 'Draft' | 'Scheduled' | 'Ended' | 'Out of Stock';
  itemSpecifics: Record<string, string>;
  listingUrl: string;
  lastSyncAt: string;
}

export interface ChannelSyncJob {
  id: string;
  accountId: string;
  jobType: 'IMPORT_LISTINGS' | 'EXPORT_PRODUCTS' | 'REALTIME_INVENTORY_SYNC' | 'IMPORT_ORDERS' | 'END_OUT_OF_STOCK';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Failed';
  progressPercent: number;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

export type PCComponentCategory = 'CPU' | 'Motherboard' | 'RAM' | 'GPU' | 'PSU' | 'SSD' | 'Case' | 'Cooler';

export interface PCBuildSelection {
  cpu?: Product;
  motherboard?: Product;
  ram?: Product;
  gpu?: Product;
  psu?: Product;
  ssd?: Product;
  case?: Product;
  cooler?: Product;
}

export interface CompatibilityWarning {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export interface FPSEstimate {
  game: string;
  fps1080p: number;
  fps1440p: number;
  fps4k: number;
}

export interface PCBuildMetrics {
  totalCost: number;
  estimatedWattage: number;
  recommendedWattage: number;
  psuSufficient: boolean;
  performanceScore: number;
  bottleneckRating: string;
  fpsEstimates: FPSEstimate[];
  aiRecommendations: string[];
}

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface ChartOfAccount {
  code: string;
  name: string;
  type: AccountType;
  category: string;
  balance: number;
}

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  lines: JournalLine[];
  postedBy: string;
}

export interface FixedAsset {
  id: string;
  assetName: string;
  assetTag: string;
  category: 'IT Equipment' | 'Vehicles' | 'Machinery' | 'Furniture';
  purchaseDate: string;
  costPrice: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: 'Straight-Line' | 'Diminishing';
  accumulatedDepreciation: number;
  bookValue: number;
}

export interface BankReconcileItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Deposit' | 'Withdrawal';
  matched: boolean;
}

export interface LoanAccount {
  id: string;
  lenderName: string;
  accountNumber: string;
  principalAmount: number;
  interestRatePercent: number;
  monthlyPayment: number;
  remainingBalance: number;
  startDate: string;
}

export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Casual';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Sales Executive' | 'Technician' | 'Warehouse Staff' | 'Store Manager';
  department: 'Sales' | 'Service' | 'Fulfillment' | 'Management';
  employmentType: EmploymentType;
  baseHourlyRate: number;
  annualSalary?: number;
  superRatePercent: number;
  taxFileNumber: string;
  bankAccount: string;
  commissionRatePercent: number;
  annualLeaveBalanceHours: number;
  sickLeaveBalanceHours: number;
  performanceScore: number;
  startDate: string;
}

export interface PayrollLineItem {
  staffId: string;
  staffName: string;
  hoursWorked: number;
  grossPay: number;
  paygTax: number;
  superannuation: number;
  commission: number;
  netPay: number;
}

export interface PayrollRun {
  id: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  status: 'Draft' | 'Approved' | 'Paid';
  totalGross: number;
  totalPAYG: number;
  totalSuper: number;
  totalNet: number;
  lineItems: PayrollLineItem[];
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  leaveType: 'Annual' | 'Sick' | 'Unpaid' | 'Maternity';
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
}

export interface TimesheetEntry {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  breakMinutes: number;
  totalHours: number;
  approved: boolean;
}

export interface StoreBranch {
  id: string;
  storeName: string;
  code: string;
  region: 'Australia - NSW' | 'Australia - VIC' | 'Australia - QLD' | 'New Zealand' | 'United States';
  currencySymbol: string;
  currencyCode: 'AUD' | 'NZD' | 'USD' | 'GBP' | 'EUR';
  currencyRateToAUD: number;
  localTaxRatePercent: number;
  defaultWarehouseId: string;
  address: string;
  phone: string;
  active: boolean;
}

export interface RegionalPriceOverride {
  productId: string;
  storeId: string;
  regionalPrice: number;
  regionalDiscountPrice?: number;
}

export interface StockTransferOrder {
  id: string;
  transferNumber: string;
  sourceStoreId: string;
  sourceStoreName: string;
  destinationStoreId: string;
  destinationStoreName: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  status: 'Draft' | 'In Transit' | 'Completed' | 'Cancelled';
  createdDate: string;
  dispatchedDate?: string;
  receivedDate?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
}

export interface SupplierPortalOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  status: 'Sent' | 'Confirmed' | 'In Production' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: {
    lineItemId: string;
    productName: string;
    orderedQty: number;
    unitCost: number;
    totalCost: number;
  }[];
  totalAmount: number;
  createdDate: string;
  expectedDelivery: string;
  carrierName?: string;
  trackingNumber?: string;
  supplierInvoiceNumber?: string;
  invoiceAttachmentUrl?: string;
  shipmentNotes?: string;
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
  isBundle?: boolean;
  kitType?: 'Standalone' | 'Bundle' | 'Kit' | 'Configurable';
  bundleComponents?: BundleComponent[];
  bundleSavings?: number;
  isConsignment?: boolean;
  consignmentVendorName?: string;
  consignmentCommissionPercent?: number;
  consignmentPayoutCost?: number;
  isDropship?: boolean;
  dropshipVendorName?: string;
  dropshipSKU?: string;
  dropshipLeadTimeDays?: number;
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
  refurbSession?: RefurbInspectionSession;
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

// ============================================================
// ERP PHASE 4 — REFURBISHMENT GRADING & COSTING WORKFLOW
// ============================================================

export type RefurbGrade = 'A+' | 'A' | 'B' | 'C' | 'D';
export type RefurbChecklistCategory = 'Cosmetic' | 'Display' | 'Core Hardware' | 'Power' | 'Connectivity';

export interface RefurbPartUsed {
  partName: string;
  cost: number;
}

export interface RefurbInspectionSession {
  inspectedAt: string;
  inspectedBy: string;
  passedChecks: string[]; // List of passed checkpoint IDs (out of 50)
  batteryHealth: number; // Battery health % (1-100)
  calculatedGrade: RefurbGrade;
  purchaseCost: number;
  partsUsed: RefurbPartUsed[];
  laborHours: number;
  laborRate: number;
  refurbPartsCost: number;
  refurbLaborCost: number;
  trueCOGS: number;
  notes?: string;
}

// ============================================================
// ERP REPORTS & ANALYTICS MODULE TYPES
// ============================================================

export type ERPReportCategory = 'Financial' | 'Sales' | 'Inventory' | 'Trade' | 'Services' | 'Suppliers' | 'HR';

export type ERPReportType =
  | 'pnl'
  | 'gst-tax'
  | 'cash-flow'
  | 'sales-velocity'
  | 'channel-breakdown'
  | 'inventory-valuation'
  | 'reorder-alerts'
  | 'shrinkage-audit'
  | 'ar-aging'
  | 'customer-clv'
  | 'repair-throughput'
  | 'refurb-margins'
  | 'customer-wise'
  | 'supplier-wise'
  | 'warehouse-wise'
  | 'brand-wise'
  | 'payment-method-wise'
  | 'staff-wise'
  | 'product-profitability'
  | 'category-profitability'
  | 'dead-stock'
  | 'fast-moving'
  | 'slow-moving'
  | 'customer-profitability'
  | 'supplier-performance'
  | 'warranty-claims'
  | 'technician-performance'
  | 'gross-margin'
  | 'payroll-summary'
  | 'commission-report';

export type ReportDatePreset = 'today' | 'this-week' | 'this-month' | 'this-quarter' | 'ytd' | 'custom';

export type WorkflowTriggerType = 
  | 'STOCK_MINIMUM' 
  | 'HIGH_VALUE_SALE' 
  | 'WARRANTY_EXPIRING' 
  | 'NEW_ONLINE_ORDER' 
  | 'REPAIR_COMPLETED' 
  | 'SHIPMENT_RECEIVED';

export type WorkflowActionType = 
  | 'CREATE_PO_DRAFT' 
  | 'REQUIRE_MANAGER_APPROVAL' 
  | 'NOTIFY_CUSTOMER_EMAIL' 
  | 'ALLOCATE_STOCK_WAREHOUSE' 
  | 'GENERATE_INVOICE_SMS' 
  | 'NOTIFY_SALES_TEAM';

export interface AutomationRule {
  id: string;
  name: string;
  trigger: WorkflowTriggerType;
  triggerThreshold?: number;
  action: WorkflowActionType;
  active: boolean;
  lastTriggeredAt?: string;
  executionCount: number;
  description: string;
}

export interface AutomationExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: string;
  status: 'Success' | 'Failed' | 'Pending Approval';
  payloadSummary: string;
}

export type ABCClass = 'A' | 'B' | 'C';
export type XYZClass = 'X' | 'Y' | 'Z';

export interface ProductBIInsight {
  productId: string;
  productName: string;
  category: string;
  abcClass: ABCClass;
  xyzClass: XYZClass;
  daysOfStockRemaining: number;
  stockDepletionDate: string;
  recommendedReorderQty: number;
  currentPrice: number;
  suggestedPrice: number;
  priceActionReason: string;
}

export interface CustomerBIInsight {
  customerId: string;
  customerName: string;
  companyName: string;
  predictive12MoCLV: number;
  churnRiskScore: 'Low Risk' | 'Medium Risk' | 'High Risk';
  lastOrderDate: string;
  recommendedAction: string;
}

export interface GeographicSalesPoint {
  regionCode: string;
  regionName: string;
  orderCount: number;
  totalRevenue: number;
  grossMarginPercent: number;
}

export type TargetDistributorSector = 
  | 'IT Wholesaler' 
  | 'Hardware Importer' 
  | 'Networking Distributor' 
  | 'MSP Supplier' 
  | 'System Integrator' 
  | 'Laptop Wholesaler';

export interface CustomerPriceMatrixRule {
  id: string;
  tierName: string;
  discountPercent: number;
  minOrderQty: number;
  applicableCategory: string;
}

export interface ContainerShipmentPO {
  id: string;
  containerNumber: string;
  palletsCount: number;
  customsClearanceCode: string;
  dutyTaxAmount: number;
  freightCost: number;
  etaPortDate: string;
  status: 'In Transit Sea' | 'Customs Hold' | 'Cleared Port' | 'Unloaded Warehouse';
}

export interface ResellerPartnerProfile {
  id: string;
  businessName: string;
  abn: string;
  sector: TargetDistributorSector;
  priceTier: string;
  creditLimit: number;
  availableCredit: number;
  paymentTerms: 'Net 14' | 'Net 30' | 'Net 60';
  monthlyTarget: number;
  currentMonthSpend: number;
  assignedAccountManager: string;
}

export type CommercialOrderType = 
  | 'Sales Order' 
  | 'Quotation' 
  | 'Proforma Invoice' 
  | 'Blanket Order' 
  | 'Standing Order' 
  | 'Drop Ship Order';

export type CommercialPaymentCategory = 
  | 'Credit Sale (Net 14)' 
  | 'Credit Sale (Net 30)' 
  | 'Credit Sale (Net 60)' 
  | 'Cash / Pre-Paid';

export type CommercialFulfillmentMode = 
  | 'Standard Single Shipment' 
  | 'Partial Shipment' 
  | 'Split Warehouse Shipment' 
  | 'Backorder Hold' 
  | 'Direct Vendor Drop Ship';

export interface CommercialSalesOrder {
  id: string;
  orderType: CommercialOrderType;
  paymentCategory: CommercialPaymentCategory;
  fulfillmentMode: CommercialFulfillmentMode;
  customerId: string;
  customerName: string;
  companyName?: string;
  contractPriceTier?: string;
  blanketCommitmentUnits?: number;
  blanketRemainingUnits?: number;
  standingFrequency?: string;
  dropShipClientAddress?: string;
  items: {
    productId: string;
    productName: string;
    orderedQty: number;
    shippedQty: number;
    backorderQty: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'Quotation Draft' | 'Proforma Sent' | 'Approved Order' | 'Partially Shipped' | 'Backordered' | 'Completed';
  date: string;
}

export type PricingTierType = 
  | 'Individual Custom Price'
  | 'Tier Pricing'
  | 'Volume Break Pricing'
  | 'Contract Pricing'
  | 'Promotional Pricing'
  | 'Brand Discount'
  | 'Category Discount'
  | 'Customer Group Pricing'
  | 'Customer Margin Target'
  | 'Special Project Deal'
  | 'Government Pricing'
  | 'Education Pricing'
  | 'Dealer Pricing'
  | 'VIP Reseller';

export interface CustomerPriceRule {
  id: string;
  customerId: string;
  customerName: string;
  productId?: string;
  productName?: string;
  brand?: string;
  category?: string;
  tierType: PricingTierType;
  overridePrice?: number;
  discountPercent?: number;
  targetMarginPercent?: number;
  volumeThreshold?: number;
  specialProjectCode?: string;
  expiryDate?: string;
}

export interface CustomerPricingCalculationResult {
  baseMSRP: number;
  finalPrice: number;
  savingsAmount: number;
  effectiveDiscountPercent: number;
  appliedRuleType: PricingTierType;
  appliedRuleDescription: string;
}

export interface MassiveStockSKU {
  id: string;
  skuCode: string;
  productName: string;
  category: string;
  warehouseId: string;
  warehouseName: string;
  binLocation: string;
  palletId?: string;
  cartonBarcode?: string;
  containerNumber?: string;
  batchLotNumber?: string;
  serialNumbers?: string[];
  rfidTag?: string;
  barcode: string;
  qrCode: string;
  expiryDate?: string;
  onHandStock: number;
  reservedStock: number;
  transitStock: number;
  incomingStock: number;
  availableStock: number;
  isVMI: boolean;
  vmiVendorName?: string;
}

export type ProcurementStage = 
  | 'RFQ Pending' 
  | 'Quotes Received' 
  | 'Comparison' 
  | 'Pending Manager Approval' 
  | 'Contract Approved' 
  | 'PO Dispatched' 
  | 'Partially Received' 
  | 'Container Received' 
  | 'Completed';

export interface SupplierQuoteBid {
  supplierId: string;
  supplierName: string;
  quotedUnitPrice: number;
  currency: 'USD' | 'EUR' | 'TWD' | 'HKD' | 'AUD';
  fxRate: number;
  unitPriceAUD: number;
  leadTimeDays: number;
  paymentTerms: string;
  qualityScore: number;
}

export interface EnterpriseProcurementRFQ {
  id: string;
  title: string;
  targetSKU: string;
  requestedQty: number;
  targetDeliveryDate: string;
  status: ProcurementStage;
  quotes: SupplierQuoteBid[];
  winningSupplierId?: string;
  poTotalAUD: number;
  freightCostAUD: number;
  dutyTaxAUD: number;
  customsChargesAUD: number;
  allocatedLandedCostPerUnit: number;
}

export type WMSPickingStrategy = 
  | 'Standard Item Picking' 
  | 'Wave Picking' 
  | 'Zone Picking' 
  | 'Batch Picking';

export type WMSTaskStatus = 
  | 'Pending' 
  | 'In Progress' 
  | 'Packed' 
  | 'Dispatched' 
  | 'Completed';

export interface WMSWarehouseZone {
  zoneId: string;
  zoneName: string;
  aislesCount: number;
  totalBins: number;
  usedBins: number;
  capacityUtilizationPercent: number;
  primaryCategory: string;
}

export interface WMSShipmentPickTask {
  id: string;
  orderId: string;
  customerName: string;
  strategy: WMSPickingStrategy;
  targetZone: string;
  items: {
    sku: string;
    productName: string;
    binLocation: string;
    requestedQty: number;
    pickedQty: number;
    barcode: string;
  }[];
  status: WMSTaskStatus;
  assignedPicker: string;
  createdAt: string;
}

export interface WMSCycleCountAudit {
  id: string;
  warehouseName: string;
  binLocation: string;
  skuCode: string;
  systemQty: number;
  countedQty: number;
  varianceQty: number;
  auditorName: string;
  status: 'Pending Audit' | 'Variance Approved' | 'Reconciled';
}

export type LogisticsCarrier = 
  | 'Toll Priority' 
  | 'Mainfreight Express' 
  | 'DHL Express' 
  | 'FedEx Enterprise' 
  | 'StarTrack Direct';

export type ShipmentStatus = 
  | 'Planning' 
  | 'Scheduled' 
  | 'In Transit' 
  | 'Out for Delivery' 
  | 'Delivered';

export interface LogisticsDispatchPlan {
  id: string;
  orderId: string;
  customerName: string;
  deliveryAddress: string;
  carrier: LogisticsCarrier;
  trackingNumber: string;
  scheduledDeliveryTime: string;
  weightKg: number;
  volumeCbm: number;
  distanceKm: number;
  routeSequenceIndex: number;
  freightCostAUD: number;
  podSignatureName?: string;
  podTimestamp?: string;
  status: ShipmentStatus;
}

export interface SupplierContract {
  contractId: string;
  title: string;
  startDate: string;
  expiryDate: string;
  minimumSpendAUD: number;
  currentSpendAUD: number;
  discountTier: string;
  status: 'Active Agreement' | 'Expired' | 'Under Negotiation';
}

export interface SupplierPriceHistoryRecord {
  id: string;
  sku: string;
  productName: string;
  date: string;
  priceAUD: number;
  changePercent: number;
}

export interface EnterpriseSupplierScorecard {
  id: string;
  supplierName: string;
  code: string;
  contracts: SupplierContract[];
  priceHistory: SupplierPriceHistoryRecord[];
  avgLeadTimeDays: number;
  overallPerformanceScore: number;
  defectRatePercent: number;
  deliveryAccuracyPercent: number;
  onTimeDeliveryRatePercent: number;
  assignedAccountManager: string;
}

export type StaffUserRole = 
  | 'Admin' 
  | 'Sales Executive' 
  | 'Warehouse Manager' 
  | 'Procurement Officer' 
  | 'Accountant' 
  | 'Custom Staff';

export interface ERPFeaturePermission {
  featureKey: string;
  category: string;
  label: string;
  description: string;
}

export interface StaffUserProfile {
  id: string;
  name: string;
  email: string;
  role: StaffUserRole;
  active: boolean;
  allowedFeatures: string[];
  createdAt: string;
  lastLogin: string;
}

export interface ReportFilterParams {
  preset: ReportDatePreset;
  startDate: string;
  endDate: string;
  categoryFilter?: string;
  warehouseFilter?: string;
  customerFilter?: string;
  supplierFilter?: string;
  brandFilter?: string;
  paymentMethodFilter?: string;
  staffFilter?: string;
  searchQuery?: string;
}

export interface ReportKPI {
  label: string;
  value: number | string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  format: 'currency' | 'number' | 'percent' | 'text';
  subtext?: string;
}

export interface ReportColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: 'currency' | 'number' | 'percent' | 'date' | 'text' | 'badge';
  badgeStyleMap?: Record<string, string>;
}

export interface ERPReportData {
  id: string;
  type: ERPReportType;
  category: ERPReportCategory;
  title: string;
  subtitle: string;
  dateGenerated: string;
  periodLabel: string;
  kpis: ReportKPI[];
  columns: ReportColumn[];
  rows: Record<string, any>[];
  summaryRow?: Record<string, any>;
  chartData?: any[];
}

export interface EmailReportPayload {
  recipientEmail: string;
  ccEmail?: string;
  subject: string;
  reportTitle: string;
  reportType: ERPReportType;
  format: 'pdf' | 'csv' | 'html';
  customNotes?: string;
}

