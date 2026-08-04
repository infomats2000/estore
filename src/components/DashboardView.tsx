import InventoryModule from './inventory/InventoryModule';
import React, { Suspense, lazy, useRef, useState } from 'react';
import { 
  BarChart as RechartsBarChart, Bar, LineChart as RechartsLineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie,
  AreaChart as RechartsAreaChart, Area
} from 'recharts';
import { 
  TrendingUp, ShoppingCart, DollarSign, Package, Tag, Plus, Trash2, Edit3, 
  CheckCircle, ArrowUpRight, PlusCircle, AlertTriangle, Award, ShieldCheck, Activity, Sparkles,
  Users, MousePointerClick, Globe, Percent, Calendar, ArrowDownRight, BarChart3, Clock, Undo2,
  MessageSquare, Star, Search, Printer, SlidersHorizontal, RefreshCw, FileSpreadsheet, History, Check,
  Coins, Boxes, Truck, Building2, MapPin, Mail, Phone, Barcode, Receipt, BookOpen, Calculator,
  PanelLeftClose, PanelLeftOpen, Upload, X, FileText, ArrowLeft, Wrench, ClipboardList
} from 'lucide-react';
import { InvoiceModal } from './InvoiceModal';
import { convertOrderToInvoice, printInvoiceDirect, downloadInvoiceHtmlFile, printHtmlContent } from '../utils/invoicePrinter';
import { buildCustomInvoiceSyncPayload } from '../utils/customInvoice';
import { Product, Order, Coupon, ReturnRequest, Review, CustomerSegment, UpsellRule, Supplier, SupplierOrder, Shipment, FinanceTransaction, User, Invoice, StoreSettings, CustomerProfile, PurchaseOrder, RepairJob, StockUnit } from '../types';
import RepairJobsManager from './repairs/RepairJobsManager';
import PurchaseOrdersManager from './purchases/PurchaseOrdersManager';
import StockUnitsManager from './stock/StockUnitsManager';

const FinanceManager = lazy(() => import('./FinanceManager'));
const UserManager = lazy(() => import('./UserManager'));

const convertToWebP = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const dataUrl = canvas.toDataURL('image/webp', 0.8);
            resolve(dataUrl);
          } catch (err) {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(dataUrl);
          }
        } else {
          reject(new Error('Canvas context could not be created'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image file.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
};

interface DashboardViewProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onClearAllProducts: () => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  coupons: Coupon[];
  onAddCoupon: (coupon: Coupon) => void;
  onToggleCoupon: (code: string) => void;
  categories: string[];
  onAddCategory: (category: string) => void;
  onEditCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (category: string) => void;
  returns: ReturnRequest[];
  onUpdateReturnStatus: (returnId: string, status: ReturnRequest['status'], adminNote?: string) => void;
  reviews: Review[];
  onDeleteReview: (reviewId: string) => void;
  customerSegments: CustomerSegment[];
  onAddSegment: (segment: CustomerSegment) => void;
  onDeleteSegment: (id: string) => void;
  upsellRules: UpsellRule[];
  onAddUpsellRule: (rule: UpsellRule) => void;
  onToggleUpsellRule: (id: string) => void;
  onDeleteUpsellRule: (id: string) => void;
  collections: string[];
  onAddCollection: (name: string) => void;
  onDeleteCollection: (name: string) => void;
  onAddPOSOrder: (order: Order) => void;
  financeTransactions: FinanceTransaction[];
  onAddTransaction: (tx: FinanceTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  users: User[];
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  customers: CustomerProfile[];
  onAddCustomer: (customer: CustomerProfile) => void;
  onDeleteCustomer: (id: string) => void;
  onUpdateCustomer: (customer: CustomerProfile) => void;
  onOpenSettings?: (tab?: 'general' | 'invoice' | 'tax_bank' | 'storefront' | 'marketing' | 'users' | 'system') => void;
  onUpdateStoreSettings?: (settings: StoreSettings) => void;
  onShowAlert?: (message: string, type?: 'success' | 'info' | 'error') => void;
  storeSettings?: StoreSettings;
  // ERP Phase 1
  purchaseOrders?: PurchaseOrder[];
  onAddPurchaseOrder?: (po: PurchaseOrder) => void;
  onUpdatePurchaseOrder?: (po: PurchaseOrder) => void;
  onDeletePurchaseOrder?: (id: string) => void;
  onReceiveGRN?: (poId: string, receivedItems: { lineItemId: string; receivedQty: number }[]) => void;
  repairJobs?: RepairJob[];
  onAddRepairJob?: (job: RepairJob) => void;
  onUpdateRepairJob?: (job: RepairJob) => void;
  onDeleteRepairJob?: (id: string) => void;
  onDeductPartsFromStock?: (productId: string, qty: number) => void;
  stockUnits?: StockUnit[];
  onAddStockUnit?: (unit: StockUnit) => void;
  onUpdateStockUnit?: (unit: StockUnit) => void;
}

const COLORS = ['#0d6efd', '#198754', '#0dcaf0', '#ffc107', '#dc3545', '#6610f2', '#fd7e14', '#20c997', '#6f42c1'];

export default function DashboardView({
  products,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
  onClearAllProducts,
  orders,
  onUpdateOrderStatus,
  coupons,
  onAddCoupon,
  onToggleCoupon,
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  returns,
  onUpdateReturnStatus,
  reviews,
  onDeleteReview,
  customerSegments,
  onAddSegment,
  onDeleteSegment,
  upsellRules,
  onAddUpsellRule,
  onToggleUpsellRule,
  onDeleteUpsellRule,
  collections,
  onAddCollection,
  onDeleteCollection,
  onAddPOSOrder,
  financeTransactions,
  onAddTransaction,
  onDeleteTransaction,
  users,
  onAddUser,
  onDeleteUser,
  customers,
  onAddCustomer,
  onDeleteCustomer,
  onUpdateCustomer,
  onOpenSettings,
  onUpdateStoreSettings,
  onShowAlert,
  storeSettings,
  purchaseOrders = [],
  onAddPurchaseOrder,
  onUpdatePurchaseOrder,
  onDeletePurchaseOrder,
  onReceiveGRN,
  repairJobs = [],
  onAddRepairJob,
  onUpdateRepairJob,
  onDeleteRepairJob,
  onDeductPartsFromStock,
  stockUnits = [],
  onAddStockUnit,
  onUpdateStockUnit,
}: DashboardViewProps) {
  
  const [activeTab, setActiveTab] = useState<'metrics' | 'analytics' | 'inventory' | 'categories' | 'collections' | 'orders' | 'invoices' | 'customers' | 'returns' | 'coupons' | 'segments' | 'upsells' | 'reviews' | 'suppliers' | 'shipping' | 'pos' | 'finance' | 'users' | 'repairs' | 'purchase-orders' | 'stock-units'>(() => {
    try {
      const hash = window.location.hash.replace('#', '');
      const validTabs = [
        'metrics', 'analytics', 'inventory', 'categories', 'collections', 'orders', 'invoices',
        'customers', 'returns', 'coupons', 'segments', 'upsells', 'reviews',
        'suppliers', 'shipping', 'pos', 'finance', 'users',
        'repairs', 'purchase-orders', 'stock-units'
      ];
      if (hash && validTabs.includes(hash)) {
        return hash as any;
      }
      const saved = localStorage.getItem('techseller_admin_active_tab');
      if (saved && validTabs.includes(saved)) {
        return saved as any;
      }
    } catch (e) {
      console.error('Error loading active tab:', e);
    }
    return 'metrics';
  });

  // INVOICING & PRINTING SYSTEM STATE
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<Invoice | null>(null);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('All');
  const [invoiceBuilderOpen, setInvoiceBuilderOpen] = useState(false);
  const [invoiceBuilderCustomerName, setInvoiceBuilderCustomerName] = useState('');
  const [invoiceBuilderCustomerCompany, setInvoiceBuilderCustomerCompany] = useState('');
  const [invoiceBuilderEmail, setInvoiceBuilderEmail] = useState('');
  const [invoiceBuilderPhone, setInvoiceBuilderPhone] = useState('');
  const [invoiceBuilderAddress, setInvoiceBuilderAddress] = useState('');
  const [invoiceBuilderCity, setInvoiceBuilderCity] = useState('');
  const [invoiceBuilderAbn, setInvoiceBuilderAbn] = useState('');
  const [invoiceBuilderPo, setInvoiceBuilderPo] = useState('');
  const [invoiceBuilderPaymentMethod, setInvoiceBuilderPaymentMethod] = useState('Direct EFT Bank Transfer');
  const [invoiceBuilderNotes, setInvoiceBuilderNotes] = useState('');
  const [invoiceBuilderItems, setInvoiceBuilderItems] = useState<Array<{ productId?: string; description: string; quantity: number; unitPrice: number; taxRate: number }>>([]);
  const [invoiceBuilderProductSearch, setInvoiceBuilderProductSearch] = useState('');
  const [invoiceBuilderProductFilter, setInvoiceBuilderProductFilter] = useState('All');
  const [invoiceBuilderDiscount, setInvoiceBuilderDiscount] = useState('0');
  const [invoiceBuilderShipping, setInvoiceBuilderShipping] = useState('0');
  const [invoiceBuilderStatus, setInvoiceBuilderStatus] = useState<'Paid' | 'Unpaid' | 'Overdue' | 'Partially Paid' | 'Cancelled' | 'Quote'>('Unpaid');
  const [invoiceBuilderType, setInvoiceBuilderType] = useState<'Tax Invoice' | 'Pro Forma' | 'Quote' | 'Credit Note'>('Tax Invoice');
  const invoiceBuilderSectionRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    try {
      localStorage.setItem('techseller_admin_active_tab', activeTab);
      if (window.location.hash !== `#${activeTab}`) {
        window.history.replaceState(null, '', `#${activeTab}`);
      }
    } catch (e) {
      console.error('Error saving active tab:', e);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = [
        'metrics', 'analytics', 'inventory', 'categories', 'collections', 'orders', 'invoices',
        'customers', 'returns', 'coupons', 'segments', 'upsells', 'reviews',
        'suppliers', 'shipping', 'pos', 'finance', 'users',
        'repairs', 'purchase-orders', 'stock-units'
      ];
      if (hash && validTabs.includes(hash)) {
        setActiveTab(hash as any);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  React.useEffect(() => {
    if (!invoiceBuilderOpen || activeTab !== 'invoices') return;

    requestAnimationFrame(() => {
      invoiceBuilderSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [invoiceBuilderOpen, activeTab]);
    // Sidebar toggle state removed for horizontal navigation
  
  // Forms state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCat, setNewProdCat] = useState(categories[0] || 'Electronics');
  const [newProdStock, setNewProdStock] = useState('15');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdCondition, setNewProdCondition] = useState('New');
  const [newProdCpu, setNewProdCpu] = useState('');
  const [newProdRam, setNewProdRam] = useState('');
  const [newProdStorage, setNewProdStorage] = useState('');
  const [newProdWarranty, setNewProdWarranty] = useState('12 Months');
  const [newProdBarcode, setNewProdBarcode] = useState('');

  const [isConvertingImage, setIsConvertingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('Selected file is not an image');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageError('Image size exceeds 10MB limit');
      return;
    }
    
    setIsConvertingImage(true);
    setImageError('');
                      setNewProdCondition('New');
                      setNewProdCpu('');
                      setNewProdRam('');
                      setNewProdStorage('');
                      setNewProdWarranty('12 Months');
                      setNewProdBarcode('');

    try {
      const webpDataUrl = await convertToWebP(file);
      setNewProdImage(webpDataUrl);
    } catch (err: any) {
      console.error('Error converting image to WebP:', err);
      setImageError(err.message || 'Failed to convert image to WebP');
    } finally {
      setIsConvertingImage(false);
    }
  };

  // Categories forms state
  const [newCatName, setNewCatName] = useState('');
  const [editingCatName, setEditingCatName] = useState<string | null>(null);
  const [editCatVal, setEditCatVal] = useState('');

  React.useEffect(() => {
    if (categories.length > 0 && !categories.includes(newProdCat)) {
      setNewProdCat(categories[0]);
    }
  }, [categories, newProdCat]);

  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percent' | 'fixed'>('percent');
  const [newCouponValue, setNewCouponValue] = useState('');
  const [newCouponMin, setNewCouponMin] = useState('');

  // Analytics states
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('all');

  // New Merchant Form States
  const [newProdCollection, setNewProdCollection] = useState(collections[0] || '');
  const [newCollName, setNewCollName] = useState('');
  
  // Segment state
  const [showAddSegment, setShowAddSegment] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState('');
  const [newSegmentDesc, setNewSegmentDesc] = useState('');
  const [newSegmentCriteria, setNewSegmentCriteria] = useState('Spent > $150');

  // Upsell state
  const [showAddUpsell, setShowAddUpsell] = useState(false);
  const [newUpsellTrigger, setNewUpsellTrigger] = useState(products[0]?.id || '');
  const [newUpsellOffer, setNewUpsellOffer] = useState(products[1]?.id || '');
  const [newUpsellDiscount, setNewUpsellDiscount] = useState('10');

  // Orders Filter and Search state
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');

  // POS TERMINAL STATES
  const [posCart, setPosCart] = useState<Array<{
    product: Product;
    quantity: number;
    color: string;
    size: string;
    customPrice?: number;
    discountPercent?: number;
  }>>([]);

  const [posSearchQuery, setPosSearchQuery] = useState('');
  const [posCategoryFilter, setPosCategoryFilter] = useState('All');
  
  const [posSelectedCustomerEmail, setPosSelectedCustomerEmail] = useState<string>('pos.walkin@example.com');
  const [showAddPosCustomer, setShowAddPosCustomer] = useState(false);
  const [newPosCustName, setNewPosCustName] = useState('');
  const [newPosCustEmail, setNewPosCustEmail] = useState('');
  const [newPosCustPhone, setNewPosCustPhone] = useState('');
  const [newPosCustAddress, setNewPosCustAddress] = useState('');
  const [newPosCustCity, setNewPosCustCity] = useState('');

  const posCustomers = React.useMemo(() => {
    const guestCustomer = {
      customerId: 'GUEST',
      name: 'Walk-in Customer (Guest)',
      email: 'pos.walkin@example.com',
      phone: '',
      address: 'In-Store POS',
      city: 'Point of Sale',
      points: 0,
      walletBalance: 0,
      isRegistered: false
    };

    const registeredCustomers = customers.map((customer) => ({
      customerId: customer.id,
      name: customer.name,
      email: customer.email.toLowerCase(),
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      points: customer.points,
      walletBalance: customer.walletBalance,
      isRegistered: true
    }));

    return [guestCustomer, ...registeredCustomers];
  }, [customers]);

  React.useEffect(() => {
    if (!posCustomers.some((customer) => customer.email === posSelectedCustomerEmail)) {
      setPosSelectedCustomerEmail('pos.walkin@example.com');
    }
  }, [posCustomers, posSelectedCustomerEmail]);

  const [posCouponCode, setPosCouponCode] = useState('');
  const [posCouponError, setPosCouponError] = useState('');
  const [posAppliedCoupon, setPosAppliedCoupon] = useState<Coupon | null>(null);
  const [posManualDiscount, setPosManualDiscount] = useState<string>('');

  const [posIsDelivery, setPosIsDelivery] = useState(false);

  const [posPaymentMethod, setPosPaymentMethod] = useState<'Cash' | 'Card' | 'Wallet' | 'Tap'>('Cash');
  const [posCashReceived, setPosCashReceived] = useState('');
  const [posCardStatus, setPosCardStatus] = useState<'Idle' | 'Processing' | 'Approved'>('Idle');
  const [posCardProgress, setPosCardProgress] = useState(0);

  const [latestPOSReceipt, setLatestPOSReceipt] = useState<Order | null>(null);
  const [showPOSReceiptModal, setShowPOSReceiptModal] = useState(false);

  // INVENTORY MODULE STATES
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('All');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'All' | 'InStock' | 'LowStock' | 'OutOfStock'>('All');
  const [inventorySortBy, setInventorySortBy] = useState<'id' | 'name' | 'stock-asc' | 'stock-desc' | 'price-asc' | 'price-desc'>('stock-asc');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  
  // Reorder from Supplier trigger state
  const [supplierSelectedProductId, setSupplierSelectedProductId] = useState('');
  const [supplierOrderQty, setSupplierOrderQty] = useState('50');
  const [supplierStatusMsg, setSupplierStatusMsg] = useState('');
  const [supplierIsOrdering, setSupplierIsOrdering] = useState(false);

  const [inventoryLogs, setInventoryLogs] = useState<Array<{
    id: string;
    timestamp: string;
    productName: string;
    item: string;
    type: 'sale' | 'restock' | 'adjustment';
    qty: number;
    user: string;
  }>>([]);
  const adminExtrasHydratedRef = useRef(false);
  const adminExtrasSyncTimeoutRef = useRef<number | null>(null);

  // SUPPLIERS MODULE STATE
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem('veloce_suppliers');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading suppliers:', e);
    }
    return [
      {
        id: 'sup-1',
        name: 'Aether Dynamics Ltd',
        contactName: 'Viktor Sterling',
        email: 'contact@aetherdynamics.com',
        phone: '+1 (555) 901-4432',
        address: '88 Industrial Way, Suite B, San Jose, CA',
        status: 'Active',
        suppliedCategories: ['Electronics'],
        performanceRating: 4.8,
        leadTimeDays: 5,
        paymentTerms: 'Net 30',
        reliabilityScore: 98
      },
      {
        id: 'sup-2',
        name: 'Atelier Nouveau Group',
        contactName: 'Genevieve Roche',
        email: 'operations@ateliernouveau.fr',
        phone: '+33 1 42 68 55 90',
        address: '14 Rue du Faubourg Saint-Honoré, Paris, France',
        status: 'Active',
        suppliedCategories: ['Fashion'],
        performanceRating: 4.5,
        leadTimeDays: 9,
        paymentTerms: 'Net 45',
        reliabilityScore: 94
      },
      {
        id: 'sup-3',
        name: 'Solstice Home Goods',
        contactName: 'Evelyn Finch',
        email: 'sales@solsticegoods.com',
        phone: '+1 (800) 511-9231',
        address: '404 Hearthside Lane, Portland, OR',
        status: 'Active',
        suppliedCategories: ['Home & Living'],
        performanceRating: 4.2,
        leadTimeDays: 7,
        paymentTerms: 'Due on Receipt',
        reliabilityScore: 91
      }
    ];
  });

  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>(() => {
    try {
      const saved = localStorage.getItem('veloce_supplier_orders');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading supplier orders:', e);
    }
    return [
      {
        id: 'SPO-8812',
        supplierId: 'sup-1',
        supplierName: 'Aether Dynamics Ltd',
        productId: 'prod-4',
        productName: 'Handcrafted Brass Watch',
        quantity: 15,
        totalCost: 1425.00,
        orderDate: '2026-07-10',
        expectedDeliveryDate: '2026-07-15',
        status: 'Received'
      },
      {
        id: 'SPO-8813',
        supplierId: 'sup-2',
        supplierName: 'Atelier Nouveau Group',
        productId: 'prod-3',
        productName: 'Premium Wool Scarf',
        quantity: 30,
        totalCost: 1800.00,
        orderDate: '2026-07-12',
        expectedDeliveryDate: '2026-07-21',
        status: 'Shipped'
      }
    ];
  });

  // Persist suppliers
  React.useEffect(() => {
    localStorage.setItem('veloce_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  // Persist supplier orders
  React.useEffect(() => {
    localStorage.setItem('veloce_supplier_orders', JSON.stringify(supplierOrders));
  }, [supplierOrders]);

  // Supplier forms states
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [supplierCategoryFilter, setSupplierCategoryFilter] = useState('All');

  // New Supplier fields
  const [newSupName, setNewSupName] = useState('');
  const [newSupContact, setNewSupContact] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupAddress, setNewSupAddress] = useState('');
  const [newSupStatus, setNewSupStatus] = useState<'Active' | 'Inactive'>('Active');
  const [newSupCategories, setNewSupCategories] = useState<string[]>([]);
  const [newSupRating, setNewSupRating] = useState('5.0');
  const [newSupLeadTime, setNewSupLeadTime] = useState('7');
  const [newSupPayTerms, setNewSupPayTerms] = useState('Net 30');
  const [newSupReliability, setNewSupReliability] = useState('95');

  // Supplier PO creation fields
  const [poSelectedSupplierId, setPoSelectedSupplierId] = useState('');
  
  // CUSTOMER MODULE STATES
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerLookupTarget, setCustomerLookupTarget] = useState<'invoiceCustomerName' | 'invoiceCustomerCompany' | 'invoiceCustomerEmail' | 'invoiceCustomerPhone' | 'newCustomerName' | 'newCustomerCompany' | 'newCustomerPhone' | null>(null);
  const [customerLookupQuery, setCustomerLookupQuery] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCity, setNewCustCity] = useState('');
  const [newCustType, setNewCustType] = useState<'Retail' | 'Wholesale'>('Retail');
  const [newCustCompany, setNewCustCompany] = useState('');
  const [newCustABN, setNewCustABN] = useState('');
   const [newCustNotes, setNewCustNotes] = useState('');
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState<CustomerProfile | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerProfile | null>(null);

  // SHIPPING MODULE STATE
  const [shipments, setShipments] = useState<Shipment[]>(() => {
    try {
      const saved = localStorage.getItem('veloce_shipments');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading shipments:', e);
    }
    return [
      {
        id: 'SHP-1001',
        orderId: 'ORD-8812',
        customerName: 'Marcus Aurelius',
        carrier: 'FedEx',
        trackingNumber: 'FX-98213840219',
        shippingMethod: 'Express',
        shippingCost: 15.50,
        status: 'In Transit',
        origin: 'Main Fulfillment Center, San Jose, CA',
        destination: '128 Rome Ave, Los Angeles, CA 90012',
        weightKg: 1.2,
        dimensions: { length: 20, width: 15, height: 10 },
        shipDate: '2026-07-13',
        estimatedDeliveryDate: '2026-07-16',
        history: [
          { status: 'In Transit', timestamp: '2026-07-14 09:30', location: 'FedEx Sorting Facility, Oakland, CA', note: 'Package departed facility.' },
          { status: 'Package Received', timestamp: '2026-07-13 14:15', location: 'FedEx Store, San Jose, CA', note: 'Shipment accepted by carrier.' },
          { status: 'Label Created', timestamp: '2026-07-13 11:00', location: 'Fulfillment Center, San Jose, CA', note: 'Shipping label created.' }
        ]
      },
      {
        id: 'SHP-1002',
        orderId: 'ORD-8813',
        customerName: 'Elena Rostova',
        carrier: 'DHL Express',
        trackingNumber: 'DHL-5541928310',
        shippingMethod: 'Overnight',
        shippingCost: 35.00,
        status: 'Delivered',
        origin: 'Main Fulfillment Center, San Jose, CA',
        destination: '742 Evergreen Terrace, Seattle, WA 98101',
        weightKg: 0.8,
        dimensions: { length: 15, width: 12, height: 8 },
        shipDate: '2026-07-14',
        estimatedDeliveryDate: '2026-07-15',
        history: [
          { status: 'Delivered', timestamp: '2026-07-15 11:20', location: 'Seattle, WA', note: 'Delivered, front porch.' },
          { status: 'Out for Delivery', timestamp: '2026-07-15 08:00', location: 'DHL Depot, Seattle, WA', note: 'Out for delivery with courier.' },
          { status: 'In Transit', timestamp: '2026-07-14 20:45', location: 'DHL Hub, Seattle, WA', note: 'Arrived at destination hub.' },
          { status: 'Label Created', timestamp: '2026-07-14 15:00', location: 'Fulfillment Center, San Jose, CA', note: 'Shipping label created.' }
        ]
      },
      {
        id: 'SHP-1003',
        orderId: 'ORD-8814',
        customerName: 'Siddhartha Gautama',
        carrier: 'USPS',
        trackingNumber: 'US-940011120256100',
        shippingMethod: 'Standard',
        shippingCost: 5.95,
        status: 'Label Created',
        origin: 'Main Fulfillment Center, San Jose, CA',
        destination: '108 Bodhi Path, San Francisco, CA 94103',
        weightKg: 2.4,
        dimensions: { length: 30, width: 25, height: 15 },
        shipDate: '2026-07-15',
        estimatedDeliveryDate: '2026-07-18',
        history: [
          { status: 'Label Created', timestamp: '2026-07-15 02:00', location: 'Fulfillment Center, San Jose, CA', note: 'Label printed. Package awaiting carrier pickup.' }
        ]
      }
    ] as Shipment[];
  });

  // Persist shipments
  React.useEffect(() => {
    localStorage.setItem('veloce_shipments', JSON.stringify(shipments));
  }, [shipments]);

  React.useEffect(() => {
    let cancelled = false;

    const hydrateAdminExtras = async () => {
      try {
        const response = await fetch('/api/admin-extras');
        if (!response.ok) return;
        const payload = await response.json();
        if (cancelled || !payload) return;

        if (Array.isArray(payload.suppliers) && payload.suppliers.length > 0) setSuppliers(payload.suppliers);
        if (Array.isArray(payload.supplierOrders) && payload.supplierOrders.length > 0) setSupplierOrders(payload.supplierOrders);
        if (Array.isArray(payload.shipments) && payload.shipments.length > 0) setShipments(payload.shipments);
        if (Array.isArray(payload.inventoryLogs)) setInventoryLogs(payload.inventoryLogs);
      } catch (err) {
        console.warn('Could not hydrate admin extras from server:', err);
      } finally {
        adminExtrasHydratedRef.current = true;
      }
    };

    void hydrateAdminExtras();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!adminExtrasHydratedRef.current) return;

    if (adminExtrasSyncTimeoutRef.current) {
      window.clearTimeout(adminExtrasSyncTimeoutRef.current);
    }

    adminExtrasSyncTimeoutRef.current = window.setTimeout(() => {
      const payload = {
        suppliers,
        supplierOrders,
        shipments,
        inventoryLogs
      };

      void fetch('/api/admin-extras', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {
        // Admin extras are also stored locally and do not need to block the UI when the server is unavailable.
      });
    }, 500);

    return () => {
      if (adminExtrasSyncTimeoutRef.current) {
        window.clearTimeout(adminExtrasSyncTimeoutRef.current);
      }
    };
  }, [suppliers, supplierOrders, shipments, inventoryLogs]);


  // SIMPLE FINANCE / BOOKKEEPING MODULE STATE
  // Managed in App.tsx

  const [newTxDate, setNewTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTxType, setNewTxType] = useState<'Income' | 'Expense'>('Income');
  const [newTxCategory, setNewTxCategory] = useState('Sales');
  const [newTxCustomCategory, setNewTxCustomCategory] = useState('');
  const [newTxAmount, setNewTxAmount] = useState('');
  const [newTxDescription, setNewTxDescription] = useState('');
  const [newTxReference, setNewTxReference] = useState('');

  const [financeSearchQuery, setFinanceSearchQuery] = useState('');

  const focusCustomerLookup = (target: 'invoiceCustomerName' | 'invoiceCustomerCompany' | 'invoiceCustomerEmail' | 'invoiceCustomerPhone' | 'newCustomerName' | 'newCustomerCompany' | 'newCustomerPhone', value: string) => {
    setCustomerLookupTarget(target);
    setCustomerLookupQuery(value);
  };

  const handleCustomerLookupInput = (
    target: 'invoiceCustomerName' | 'invoiceCustomerCompany' | 'invoiceCustomerEmail' | 'invoiceCustomerPhone' | 'newCustomerName' | 'newCustomerCompany' | 'newCustomerPhone',
    value: string,
    setter: (value: string) => void
  ) => {
    setter(value);
    setCustomerLookupTarget(target);
    setCustomerLookupQuery(value);
  };

  const applyCustomerLookupSelection = (
    target: 'invoiceCustomerName' | 'invoiceCustomerCompany' | 'invoiceCustomerEmail' | 'invoiceCustomerPhone' | 'newCustomerName' | 'newCustomerCompany' | 'newCustomerPhone',
    customer: CustomerProfile
  ) => {
    if (target === 'invoiceCustomerName' || target === 'invoiceCustomerCompany' || target === 'invoiceCustomerEmail' || target === 'invoiceCustomerPhone') {
      setInvoiceBuilderCustomerName(customer.name);
      setInvoiceBuilderCustomerCompany(customer.company || '');
      setInvoiceBuilderEmail(customer.email);
      setInvoiceBuilderPhone(customer.phone);
      setInvoiceBuilderAddress(customer.address);
      setInvoiceBuilderCity(customer.city);
      setInvoiceBuilderAbn(customer.abn || '');
    }

    if (target === 'newCustomerName' || target === 'newCustomerCompany' || target === 'newCustomerPhone') {
      setNewCustName(customer.name);
      setNewCustEmail(customer.email);
      setNewCustPhone(customer.phone);
      setNewCustAddress(customer.address);
      setNewCustCity(customer.city);
      setNewCustType(customer.type);
      setNewCustCompany(customer.company || '');
      setNewCustABN(customer.abn || '');
      setNewCustNotes(customer.notes || '');
    }

    setCustomerLookupTarget(null);
    setCustomerLookupQuery('');
  };

  const customerLookupSuggestions = React.useMemo(() => {
    const query = customerLookupQuery.trim().toLowerCase();
    if (!customerLookupTarget || !query) return [];

    return customers.filter((customer) => {
      const haystacks = [
        customer.name,
        customer.email,
        customer.company || '',
        customer.phone,
        customer.address,
        customer.city,
        customer.abn || ''
      ].filter(Boolean).map((value) => value.toLowerCase());

      return haystacks.some((value) => value.includes(query));
    }).slice(0, 6);
  }, [customerLookupTarget, customerLookupQuery, customers]);
  const [financeFilterType, setFinanceFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
  const [financeFilterCategory, setFinanceFilterCategory] = useState('All');

  // Shipping form fields and modal/detail state
  const [showAddShipment, setShowAddShipment] = useState(false);
  const [shippingSearchQuery, setShippingSearchQuery] = useState('');
  const [shippingCarrierFilter, setShippingCarrierFilter] = useState('All');
  const [shippingStatusFilter, setShippingStatusFilter] = useState('All');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // New Shipment Creation State
  const [shipOrderId, setShipOrderId] = useState('');
  const [shipCarrier, setShipCarrier] = useState<'FedEx' | 'DHL' | 'USPS' | 'UPS' | 'DHL Express'>('FedEx');
  const [shipMethod, setShipMethod] = useState<'Standard' | 'Express' | 'Overnight'>('Standard');
  const [shipCost, setShipCost] = useState('8.50');
  const [shipWeight, setShipWeight] = useState('1.5');
  const [shipDimLength, setShipDimLength] = useState('12');
  const [shipDimWidth, setShipDimWidth] = useState('10');
  const [shipDimHeight, setShipDimHeight] = useState('6');
  const [shipDestination, setShipDestination] = useState('');
  const [shipCustName, setShipCustName] = useState('');

  const handlePrintLabel = (order: Order) => {
    const itemsSummary = order.items.map(it => `${it.quantity}X ${it.name}`).join(', ');
    const trackingNumber = `US-${order.id.slice(0, 8).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Shipping Label - ${order.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 10px;
            color: #000;
            background-color: #fff;
          }
          .label-container {
            width: 380px;
            height: 560px;
            border: 4px solid #000;
            padding: 14px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background-color: #fff;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #000;
            padding-bottom: 8px;
          }
          .title {
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .carrier {
            font-size: 16px;
            font-weight: 900;
            border: 3px solid #000;
            padding: 2px 8px;
            text-transform: uppercase;
          }
          .section {
            padding: 8px 0;
            border-bottom: 1.5px solid #000;
          }
          .section-title {
            font-family: 'JetBrains Mono', monospace;
            font-size: 8px;
            text-transform: uppercase;
            font-weight: 700;
            color: #333;
            letter-spacing: 0.05em;
            margin-bottom: 3px;
          }
          .address-info {
            font-size: 11px;
            line-height: 1.3;
          }
          .address-info.to {
            font-size: 13px;
            font-weight: 700;
          }
          .barcode-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10px 0;
            border-bottom: 3px solid #000;
          }
          .barcode-lines {
            width: 95%;
            height: 55px;
            background: repeating-linear-gradient(
              90deg,
              #000,
              #000 2px,
              #fff 2px,
              #fff 5px
            );
          }
          .barcode-text {
            font-family: 'JetBrains Mono', monospace;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 2px;
            margin-top: 5px;
          }
          .footer-info {
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            font-family: 'JetBrains Mono', monospace;
            padding-top: 6px;
            font-weight: 700;
          }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            .label-container {
              border: 4px solid #000;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="header">
            <div class="title">STANDARD GROUND SHIPPING</div>
            <div class="carrier">POST</div>
          </div>
          
          <div class="section">
            <div class="section-title">SENDER:</div>
            <div class="address-info" style="text-transform: uppercase;">
              <strong>VELOCE MERCHANDISE CORP.</strong><br/>
              100 ENTERPRISE BLVD, STE 100<br/>
              SILICON VALLEY, CA 94025
            </div>
          </div>
          
          <div class="section" style="flex-grow: 1;">
            <div class="section-title">SHIP TO:</div>
            <div class="address-info to" style="text-transform: uppercase;">
              <strong>${order.customerName}</strong><br/>
              ${order.customerAddress}<br/>
              ${order.customerCity}<br/>
              ${order.customerPhone ? `TEL: ${order.customerPhone}` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">SHIPMENT DETAILS:</div>
            <div class="address-info" style="font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase;">
              ORDER ID: ${order.id}<br/>
              DATE: ${order.date}<br/>
              ITEMS: ${itemsSummary}
            </div>
          </div>
          
          <div class="barcode-placeholder">
            <div class="barcode-lines"></div>
            <div class="barcode-text">*${order.id.toUpperCase()}*</div>
          </div>
          
          <div class="footer-info">
            <div>TRACKING: ${trackingNumber}</div>
            <div>WT: 1.50 LBS</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printHtmlContent(htmlContent);
  };

  // CALCULATE METRICS
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalSalesCount = orders.length;
  const averageOrderValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
  const lowStockCount = products.filter(p => p.stock <= 5).length;

  // Dynamic Analytics variables based on selectedTimeRange
  const getTimeMultiplier = () => {
    switch (analyticsTimeRange) {
      case '24h': return 0.08;
      case '7d': return 0.35;
      case '30d': return 0.72;
      case 'all': default: return 1.0;
    }
  };
  const timeMultiplier = getTimeMultiplier();
  
  // Calculate dynamic filtered orders count and revenue
  const filteredOrdersCount = orders.length === 0 ? 0 : Math.max(
    Math.round(orders.length * timeMultiplier),
    analyticsTimeRange === '24h' && orders.length > 0 ? 1 : 0
  );
  
  const filteredRevenue = orders.length === 0 ? 0 : 
    (analyticsTimeRange === 'all' ? totalRevenue : totalRevenue * timeMultiplier * 0.95);

  const filteredAOV = filteredOrdersCount > 0 ? filteredRevenue / filteredOrdersCount : 0;
  
  // Calculate traffic metrics
  const uniqueVisitors = orders.length === 0 
    ? Math.round(180 * timeMultiplier)
    : Math.round((orders.length * 35 + 245) * timeMultiplier);
  
  const totalPageViews = Math.round(uniqueVisitors * (3.8 + (orders.length % 3) * 0.2));
  
  const conversionRate = uniqueVisitors > 0 ? (filteredOrdersCount / uniqueVisitors) * 100 : 0;
  
  // Growth comparing against a previous baseline
  const previousBaselineRevenue = 3200 * timeMultiplier;
  const netRevenue = filteredRevenue * 0.88; // 88% after operations and card fees
  const salesGrowthPercent = previousBaselineRevenue > 0 
    ? ((filteredRevenue - previousBaselineRevenue) / previousBaselineRevenue) * 100 
    : 0;

  // Let's create dynamic revenue weekly progression data for Area chart
  const getDynamicGrowthData = () => {
    const baseWeeks = [
      { name: 'Week 1', revenue: 420, visitors: 95, forecast: 460 },
      { name: 'Week 2', revenue: 680, visitors: 160, forecast: 710 },
      { name: 'Week 3', revenue: 1100, visitors: 240, forecast: 1150 },
      { name: 'Week 4', revenue: 1450, visitors: 310, forecast: 1380 },
    ];
    // Scale by filteredRevenue
    const scale = filteredRevenue > 0 ? filteredRevenue / 3650 : 0.6;
    return baseWeeks.map(w => ({
      ...w,
      revenue: parseFloat((w.revenue * scale).toFixed(2)),
      visitors: Math.round(w.visitors * scale),
      forecast: parseFloat((w.forecast * scale * 1.1).toFixed(2))
    }));
  };
  const dynamicGrowthData = getDynamicGrowthData();

  // DYNAMIC RECHARTS DATA PREPARATION
  // Category share distribution data
  const categoryCount: Record<string, number> = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      // Find item category from catalog
      const prod = products.find(p => p.id === item.productId);
      const cat = prod ? prod.category : 'General';
      categoryCount[cat] = (categoryCount[cat] || 0) + (item.price * item.quantity);
    });
  });

  const categoryShareData = Object.entries(categoryCount).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2))
  }));

  // Default fallback if no sales yet
  const displayCategoryData = categoryShareData.length > 0 ? categoryShareData : [
    { name: 'Electronics', value: 340 },
    { name: 'Fashion', value: 215 },
    { name: 'Home & Living', value: 180 },
  ];

  // Sales Trends (Preloaded static data combined with active live orders)
  const monthlyRevenueData = [
    { month: 'Jan', revenue: 1400 },
    { month: 'Feb', revenue: 2100 },
    { month: 'Mar', revenue: 1850 },
    { month: 'Apr', revenue: 3200 },
    { month: 'May', revenue: 2900 },
    { month: 'Jun', revenue: 4100 },
    { month: 'Current', revenue: Math.max(1200, totalRevenue) }
  ];

  // ADVANCED STORE PERFORMANCE METRICS
  const salesTarget = 10000;
  const targetProgress = Math.min(100, (totalRevenue / salesTarget) * 100);
  
  // Calculate best selling product and details
  const productSalesMap: Record<string, { qty: number; revenue: number; name: string }> = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { qty: 0, revenue: 0, name: item.name };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].revenue += item.price * item.quantity;
    });
  });
  const sortedProductSales = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);
  const bestSellingProduct = sortedProductSales[0]?.name || 'No Sales Yet';
  const bestSellingProductQty = sortedProductSales[0]?.qty || 0;
  const bestSellingProductRevenue = sortedProductSales[0]?.revenue || 0;

  // Best category
  const sortedCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
  const bestPerformingCategory = sortedCategories[0]?.[0] || 'No Sales Yet';
  const bestPerformingCategoryRev = sortedCategories[0]?.[1] || 0;

  // Order Fulfillment and Pipeline Rate
  const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
  const shippedCount = orders.filter(o => o.status === 'Shipped').length;
  const processingCount = orders.filter(o => o.status === 'Processing').length;
  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const fulfillmentRate = orders.length > 0 ? ((deliveredCount + shippedCount) / orders.length) * 100 : 100;

  // HANDLERS
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice || !newProdStock) return;

    // Use high-quality placeholders if no image provided
    const imgUrl = newProdImage.trim() || `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80`;

    const newSpecs: Record<string, string> = {
      'Condition': newProdCondition,
      'CPU': newProdCpu,
      'RAM': newProdRam,
      'Storage': newProdStorage,
      'Warranty': newProdWarranty,
      'Barcode': newProdBarcode,
      'Added On': new Date().toISOString().split('T')[0]
    };
    
    // Clean empty specs
    Object.keys(newSpecs).forEach(key => {
      if (!newSpecs[key]) delete newSpecs[key];
    });

    if (editingProduct) {
      const updatedProduct: Product = {
        ...editingProduct,
        name: newProdName.trim(),
        description: newProdDesc.trim(),
        category: newProdCat,
        collection: newProdCollection || undefined,
        price: parseFloat(newProdPrice),
        image: imgUrl,
        stock: parseInt(newProdStock),
        specs: { ...editingProduct.specs, ...newSpecs }
      };
      onUpdateProduct(updatedProduct);
    } else {
      const newProd: Product = {
        id: 'prod-' + Date.now(),
        name: newProdName.trim(),
        description: newProdDesc.trim() || 'No description provided.',
        category: newProdCat,
        collection: newProdCollection || undefined,
        price: parseFloat(newProdPrice),
        image: imgUrl,
        additionalImages: [],
        rating: 5.0,
        reviewsCount: 0,
        stock: parseInt(newProdStock),
        specs: newSpecs,
        tags: ['New Addition'],
        colors: [],
        sizes: []
      };
      onAddProduct(newProd);
    }

    setShowAddProduct(false);
    setEditingProduct(null);
    
    // Reset Form
    setNewProdName('');
    setNewProdPrice('');
    setNewProdStock('15');
    setNewProdDesc('');
    setNewProdImage('');
    setImageError('');

    setNewProdCondition('New');
    setNewProdCpu('');
    setNewProdRam('');
    setNewProdStorage('');
    setNewProdWarranty('12 Months');
    setNewProdBarcode('');
  };

  const handleAddCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim() || !newCouponValue) return;

    const newCoup: Coupon = {
      code: newCouponCode.trim().toUpperCase(),
      type: newCouponType,
      value: parseFloat(newCouponValue),
      active: true,
      minPurchase: newCouponMin ? parseFloat(newCouponMin) : undefined
    };

    onAddCoupon(newCoup);
    setNewCouponCode('');
    setNewCouponValue('');
    setNewCouponMin('');
  };

  const handleStartEditing = (prod: Product) => {
    setEditingProduct(prod);
    setNewProdName(prod.name);
    setNewProdPrice(prod.price.toString());
    setNewProdStock(prod.stock.toString());
    setNewProdDesc(prod.description);
    setNewProdCat(prod.category);
    setNewProdCollection(prod.collection || '');
    setNewProdImage(prod.image);
    setNewProdCondition(prod.specs?.['Condition'] || prod.specs?.['Grade'] || 'New');
    setNewProdCpu(prod.specs?.['CPU'] || prod.specs?.['Processor'] || '');
    setNewProdRam(prod.specs?.['RAM'] || prod.specs?.['Memory'] || '');
    setNewProdStorage(prod.specs?.['Storage'] || '');
    setNewProdWarranty(prod.specs?.['Warranty'] || '12 Months');
    setNewProdBarcode(prod.specs?.['Barcode'] || prod.specs?.['Serial'] || '');

    setShowAddProduct(true);
    
    // Scroll to form
    const formElement = document.getElementById('create-item-form-panel');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleQuickAdjustStock = (prod: Product, changeQty: number) => {
    const newStock = Math.max(0, prod.stock + changeQty);
    const actualChange = newStock - prod.stock;
    if (actualChange === 0) return;

    onUpdateProduct({
      ...prod,
      stock: newStock
    });

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setInventoryLogs(prev => [
      {
        id: 'log-' + Date.now(),
        timestamp,
        productName: prod.name,
        item: prod.id,
        type: actualChange > 0 ? 'restock' : 'adjustment',
        qty: actualChange,
        user: 'Quick Stock Adjust'
      },
      ...prev
    ]);
  };

  const handleSupplierOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prodId = supplierSelectedProductId || products[0]?.id;
    if (!prodId) {
      setSupplierStatusMsg('Error: No products in catalog.');
      return;
    }

    const prod = products.find(p => p.id === prodId);
    if (!prod) {
      setSupplierStatusMsg('Error: Selected product not found.');
      return;
    }

    const qty = parseInt(supplierOrderQty);
    if (isNaN(qty) || qty <= 0) {
      setSupplierStatusMsg('Error: Invalid purchase order quantity.');
      return;
    }

    setSupplierIsOrdering(true);
    setSupplierStatusMsg('Transmitting PO to external supply system...');

      onUpdateProduct({
        ...prod,
        stock: prod.stock + qty
      });

      const poNum = 'PO-' + Math.floor(1000 + Math.random() * 9000);
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

      setInventoryLogs(prev => [
        {
          id: 'log-' + Date.now(),
          timestamp,
          productName: prod.name,
          item: prod.id,
          type: 'restock',
          qty: qty,
          user: `Supplier Restock (${poNum})`
        },
        ...prev
      ]);

      setSupplierIsOrdering(false);
      setSupplierStatusMsg(`Success! Authorised ${qty} units for "${prod.name}" (${poNum}).`);

      // Record Finance Transaction for Inventory Purchase
      const totalCost = prod.price * 0.4 * qty; // Purchase price is 40% of retail
      onAddTransaction({
        id: 'TX-SUP-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: 'Expense',
        category: 'Inventory Purchase',
        amount: parseFloat(totalCost.toFixed(2)),
        description: `Restock of ${qty} units for "${prod.name}" via ${poNum}`,
        reference: poNum,
        tags: ['inventory', 'restock', 'purchase']
      });
      
      // Clear message after 4s
      setTimeout(() => {
        setSupplierStatusMsg('');
      }, 4000);
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCustName.trim();
    const normalizedEmail = newCustEmail.trim().toLowerCase();
    if (!trimmedName || !normalizedEmail) return;

    if (customers.some((customer) => customer.email.toLowerCase() === normalizedEmail)) {
      onShowAlert?.('A customer with this email already exists.', 'error');
      return;
    }

    const newCustomer: CustomerProfile = {
      id: 'CUST-' + Date.now(),
      name: trimmedName,
      email: normalizedEmail,
      phone: newCustPhone.trim(),
      address: newCustAddress.trim(),
      city: newCustCity.trim(),
      type: newCustType,
      registrationDate: new Date().toISOString().split('T')[0],
      company: newCustType === 'Wholesale' ? newCustCompany.trim() || undefined : undefined,
      abn: newCustType === 'Wholesale' ? newCustABN.trim() || undefined : undefined,
      walletBalance: 0,
      points: 0,
      wishlist: [],
      notes: newCustNotes.trim() || undefined
    };

    onAddCustomer(newCustomer);
    onShowAlert?.(`Customer ${newCustomer.name} added successfully.`, 'success');
    setShowAddCustomer(false);
    setNewCustName('');
    setNewCustEmail('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustCity('');
    setNewCustType('Retail');
    setNewCustCompany('');
    setNewCustABN('');
    setNewCustNotes('');
  };

  const startEditingCustomer = (cust: CustomerProfile) => {
    setEditingCustomer(cust);
  };

  const handleUpdateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    onUpdateCustomer(editingCustomer);
    setEditingCustomer(null);
  };

  const filteredCustomers = customers.filter((customer) => {
    const query = customerSearchQuery.trim().toLowerCase();
    if (!query) return true;

    return [
      customer.name,
      customer.email,
      customer.phone,
      customer.company || '',
      customer.city,
      customer.type
    ].some((value) => value.toLowerCase().includes(query));
  });

  // SUPPLIER CRUD OPERATIONS
  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim() || !newSupContact.trim() || !newSupEmail.trim()) return;

    const newSupplier: Supplier = {
      id: 'sup-' + Date.now(),
      name: newSupName.trim(),
      contactName: newSupContact.trim(),
      email: newSupEmail.trim(),
      phone: newSupPhone.trim() || '+1 (555) 000-0000',
      address: newSupAddress.trim() || 'No physical address listed',
      status: newSupStatus,
      suppliedCategories: newSupCategories.length > 0 ? newSupCategories : ['General'],
      performanceRating: parseFloat(newSupRating) || 5.0,
      leadTimeDays: parseInt(newSupLeadTime) || 7,
      paymentTerms: newSupPayTerms || 'Net 30',
      reliabilityScore: parseInt(newSupReliability) || 95
    };

    setSuppliers(prev => [newSupplier, ...prev]);
    setShowAddSupplier(false);

    // Clear fields
    setNewSupName('');
    setNewSupContact('');
    setNewSupEmail('');
    setNewSupPhone('');
    setNewSupAddress('');
    setNewSupStatus('Active');
    setNewSupCategories([]);
    setNewSupRating('5.0');
    setNewSupLeadTime('7');
    setNewSupPayTerms('Net 30');
    setNewSupReliability('95');
  };

  const handleEditSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplierId) return;

    setSuppliers(prev => prev.map(sup => {
      if (sup.id === editingSupplierId) {
        return {
          ...sup,
          name: newSupName.trim(),
          contactName: newSupContact.trim(),
          email: newSupEmail.trim(),
          phone: newSupPhone.trim(),
          address: newSupAddress.trim(),
          status: newSupStatus,
          suppliedCategories: newSupCategories.length > 0 ? newSupCategories : sup.suppliedCategories,
          performanceRating: parseFloat(newSupRating) || sup.performanceRating,
          leadTimeDays: parseInt(newSupLeadTime) || sup.leadTimeDays,
          paymentTerms: newSupPayTerms,
          reliabilityScore: parseInt(newSupReliability) || sup.reliabilityScore
        };
      }
      return sup;
    }));

    setEditingSupplierId(null);
    setShowAddSupplier(false);

    // Clear fields
    setNewSupName('');
    setNewSupContact('');
    setNewSupEmail('');
    setNewSupPhone('');
    setNewSupAddress('');
    setNewSupStatus('Active');
    setNewSupCategories([]);
    setNewSupRating('5.0');
    setNewSupLeadTime('7');
    setNewSupPayTerms('Net 30');
    setNewSupReliability('95');
  };

  const handleStartEditSupplier = (sup: Supplier) => {
    setEditingSupplierId(sup.id);
    setNewSupName(sup.name);
    setNewSupContact(sup.contactName);
    setNewSupEmail(sup.email);
    setNewSupPhone(sup.phone);
    setNewSupAddress(sup.address);
    setNewSupStatus(sup.status);
    setNewSupCategories(sup.suppliedCategories);
    setNewSupRating(sup.performanceRating.toString());
    setNewSupLeadTime(sup.leadTimeDays.toString());
    setNewSupPayTerms(sup.paymentTerms);
    setNewSupReliability(sup.reliabilityScore.toString());
    setShowAddSupplier(true);
  };

  const handleDeleteSupplier = (id: string) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      setSuppliers(prev => prev.filter(sup => sup.id !== id));
    }
  };

  // SUPPLIER PURCHASE ORDERS
  const handleCreatePurchaseOrder = (supplierId: string, productId: string, qty: number) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    const product = products.find(p => p.id === productId);

    if (!supplier || !product) return;

    const unitCost = product.price * 0.6; // Cost is 60% of retail price
    const totalCost = unitCost * qty;

    const orderDate = new Date().toISOString().split('T')[0];
    const deliveryDateObj = new Date();
    deliveryDateObj.setDate(deliveryDateObj.getDate() + supplier.leadTimeDays);
    const expectedDeliveryDate = deliveryDateObj.toISOString().split('T')[0];

    const newPO: SupplierOrder = {
      id: 'SPO-' + Math.floor(1000 + Math.random() * 9000),
      supplierId: supplier.id,
      supplierName: supplier.name,
      productId: product.id,
      productName: product.name,
      quantity: qty,
      totalCost: parseFloat(totalCost.toFixed(2)),
      orderDate,
      expectedDeliveryDate,
      status: 'Pending'
    };

    setSupplierOrders(prev => [newPO, ...prev]);

    // Log stock action
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setInventoryLogs(prev => [
      {
        id: 'log-' + Date.now(),
        timestamp,
        productName: product.name,
        item: product.id,
        type: 'adjustment',
        qty: 0,
        user: `Drafted PO (${newPO.id}) with ${supplier.name}`
      },
      ...prev
    ]);
  };

  const handleUpdateSupplierOrderStatus = (orderId: string, newStatus: 'Pending' | 'Shipped' | 'Received') => {
    const order = supplierOrders.find(o => o.id === orderId);
    if (!order) return;

    // If changing to Received, automatically restock!
    if (newStatus === 'Received' && order.status !== 'Received') {
      const prod = products.find(p => p.id === order.productId);
      if (prod) {
        onUpdateProduct({
          ...prod,
          stock: prod.stock + order.quantity
        });

        // Log to inventory ledger
        const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
        setInventoryLogs(prev => [
          {
            id: 'log-' + Date.now(),
            timestamp,
            productName: prod.name,
            item: prod.id,
            type: 'restock',
            qty: order.quantity,
            user: `Supplier PO Received (${order.id})`
          },
          ...prev
        ]);
        
        onAddTransaction({
            id: 'TX-' + Date.now(),
            date: new Date().toISOString().split('T')[0],
            type: 'Expense',
            category: 'Inventory Restock',
            amount: prod.price * 0.5 * order.quantity,
            description: `Restock PO ${order.id} for ${prod.name}`,
            reference: order.id
        });
      }
    }

    setSupplierOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: newStatus };
      }
      return o;
    }));
  };

  // SHIPPING OPERATIONS
  const handleCreateShipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipOrderId) {
      alert('Please select an order to ship');
      return;
    }

    const linkedOrder = orders.find(o => o.id === shipOrderId);
    const dest = shipDestination.trim() || (linkedOrder ? `${linkedOrder.customerAddress}, ${linkedOrder.customerCity}` : 'No address provided');
    const cust = shipCustName.trim() || (linkedOrder ? linkedOrder.customerName : 'Unknown Customer');

    // Generate tracking number
    const rand = Math.floor(1000000000 + Math.random() * 9000000000);
    let tracking = '';
    if (shipCarrier === 'FedEx') tracking = `FX-${rand}`;
    else if (shipCarrier === 'DHL' || shipCarrier === 'DHL Express') tracking = `DHL-${rand}`;
    else if (shipCarrier === 'USPS') tracking = `9400${Math.floor(10000000000 + Math.random() * 90000000000)}`;
    else if (shipCarrier === 'UPS') tracking = `1Z${Math.floor(100000 + Math.random() * 900000)}03${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newShipment: Shipment = {
      id: 'SHP-' + Math.floor(10000 + Math.random() * 90000),
      orderId: shipOrderId,
      customerName: cust,
      carrier: shipCarrier,
      trackingNumber: tracking,
      shippingMethod: shipMethod,
      shippingCost: parseFloat(shipCost) || 9.99,
      status: 'Label Created',
      origin: 'Main Fulfillment Center, San Jose, CA',
      destination: dest,
      weightKg: parseFloat(shipWeight) || 1.0,
      dimensions: {
        length: parseFloat(shipDimLength) || 12,
        width: parseFloat(shipDimWidth) || 10,
        height: parseFloat(shipDimHeight) || 6
      },
      shipDate: new Date().toISOString().split('T')[0],
      estimatedDeliveryDate: new Date(Date.now() + (shipMethod === 'Overnight' ? 86400000 : shipMethod === 'Express' ? 172800000 : 345600000)).toISOString().split('T')[0],
      history: [
        {
          status: 'Label Created',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          location: 'Fulfillment Center, San Jose, CA',
          note: 'Shipping label created. Package awaiting carrier pickup.'
        }
      ]
    };

    setShipments(prev => [newShipment, ...prev]);
    onUpdateOrderStatus(shipOrderId, 'Shipped');

    // Create corresponding simple finance transaction for logistics expense
    try {
      const parsedCost = parseFloat(shipCost) || 9.99;
      const shipmentTransaction: FinanceTransaction = {
        id: 'TX-SHIPEXP-' + Math.floor(10000 + Math.random() * 90000),
        date: new Date().toISOString().split('T')[0],
        type: 'Expense',
        category: 'Shipping Paid',
        amount: parsedCost,
        description: `Carrier Dispatch Expense - ${shipCarrier} (${newShipment.id})`,
        reference: newShipment.id
      };
      onAddTransaction(shipmentTransaction);
    } catch (err) {
      console.error('Error generating transaction entry for shipment:', err);
    }

    setShowAddShipment(false);

    // Reset Form
    setShipOrderId('');
    setShipCarrier('FedEx');
    setShipMethod('Standard');
    setShipCost('8.50');
    setShipWeight('1.5');
    setShipDimLength('12');
    setShipDimWidth('10');
    setShipDimHeight('6');
    setShipDestination('');
    setShipCustName('');
  };

  const handleUpdateShipmentStatus = (shipmentId: string, newStatus: Shipment['status'], note?: string) => {
    setShipments(prev => prev.map(shipment => {
      if (shipment.id === shipmentId) {
        // Create new history event
        const defaultNote = 
          newStatus === 'Package Received' ? 'Carrier accepted the package.' :
          newStatus === 'In Transit' ? 'Package is in transit between hubs.' :
          newStatus === 'Out for Delivery' ? 'Package is out for local delivery with courier.' :
          newStatus === 'Delivered' ? 'Delivered to recipient address.' :
          newStatus === 'Returned' ? 'Returned to shipper.' : 'Status updated.';

        const newHistoryEvent = {
          status: newStatus,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          location: newStatus === 'Delivered' ? shipment.destination : 'Carrier Facility',
          note: note || defaultNote
        };

        // If delivered, update order status to Delivered
        if (newStatus === 'Delivered') {
          onUpdateOrderStatus(shipment.orderId, 'Delivered');
        } else if (newStatus === 'In Transit' || newStatus === 'Package Received' || newStatus === 'Out for Delivery') {
          // Sync order status back to Shipped if it wasn't already
          onUpdateOrderStatus(shipment.orderId, 'Shipped');
        }

        return {
          ...shipment,
          status: newStatus,
          history: [newHistoryEvent, ...shipment.history]
        };
      }
      return shipment;
    }));
  };

  const handleDeleteShipment = (shipmentId: string) => {
    if (window.confirm('Are you sure you want to archive or delete this shipment tracking record?')) {
      setShipments(prev => prev.filter(s => s.id !== shipmentId));
    }
  };



  const handleDownloadLedgerCSV = () => {
    const headers = ['ID', 'Timestamp', 'Product Name', 'ITEM', 'Type', 'Qty Delta', 'Trigger / Source'];
    const rows = inventoryLogs.map(log => [
      log.id,
      log.timestamp,
      `"${log.productName.replace(/"/g, '""')}"`,
      log.item,
      log.type.toUpperCase(),
      log.qty > 0 ? `+${log.qty}` : log.qty,
      `"${log.user.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearLedger = () => {
    if (window.confirm('Are you sure you want to purge the local inventory adjustment audit log?')) {
      setInventoryLogs([]);
    }
  };

  const openInvoiceBuilder = () => {
    setActiveTab('invoices');
    setInvoiceBuilderCustomerName('Enterprise Client Pty Ltd');
    setInvoiceBuilderCustomerCompany('Enterprise IT Solutions');
    setInvoiceBuilderEmail('procurement@enterpriseclient.com.au');
    setInvoiceBuilderPhone('1300 990 011');
    setInvoiceBuilderAddress('500 Collins Street, Suite 1200');
    setInvoiceBuilderCity('Melbourne VIC 3000');
    setInvoiceBuilderAbn('45 901 234 567');
    setInvoiceBuilderPo(`PO-B2B-${Math.floor(1000 + Math.random() * 9000)}`);
    setInvoiceBuilderPaymentMethod('Direct EFT Bank Transfer');
    setInvoiceBuilderNotes('Official B2B Custom Invoice. All equipment backed by TECH SELLER 12-Month On-Site Commercial Warranty.');
    setInvoiceBuilderItems([
      { description: 'Refurbished Enterprise Workstation Rig - i9 / 64GB RAM / 2TB NVMe', quantity: 2, unitPrice: 1850, taxRate: 10 },
      { description: '27-inch 4K Color-Accurate Professional Monitor', quantity: 2, unitPrice: 450, taxRate: 10 }
    ]);
    setInvoiceBuilderProductSearch('');
    setInvoiceBuilderProductFilter('All');
    setInvoiceBuilderDiscount('100');
    setInvoiceBuilderShipping('0');
    setInvoiceBuilderStatus('Unpaid');
    setInvoiceBuilderType('Tax Invoice');
    setInvoiceBuilderOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 text-left" id="dashboard-view-main">
      
      {/* HORIZONTAL TOP NAVIGATION */}
      <div className="mb-8 space-y-4">
        {/* Store Operations Group */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[9px] uppercase font-black text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Store Operations
            </span>
            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[8px] px-2 py-0.5 rounded-full font-mono font-bold">10 MODULES</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pb-2">
            {[
              { id: 'metrics', label: 'Dashboard', count: null, icon: BarChart3, color: 'bg-[#706d6d] text-white shadow-black/10', activeBorder: 'border-[#706d6d]' },
              { id: 'pos', label: 'POS', count: null, icon: Calculator, color: 'bg-[#706d6d] text-white shadow-black/10', activeBorder: 'border-[#706d6d]' },
              { id: 'finance', label: 'Finance', count: financeTransactions.length, icon: DollarSign, color: 'bg-[#706d6d] text-white shadow-black/10', activeBorder: 'border-[#706d6d]' },
              { id: 'invoices', label: 'Invoices', count: orders.length, icon: FileText, color: 'bg-[#706d6d] text-white shadow-black/10', activeBorder: 'border-[#706d6d]' },
              { id: 'analytics', label: 'Analytics', count: null, icon: TrendingUp, color: 'bg-[#706d6d] text-white shadow-black/10', activeBorder: 'border-[#706d6d]' },
              { id: 'inventory', label: 'Inventory', count: products.length, icon: Package, color: 'bg-[#706d6d] text-white shadow-black/10', activeBorder: 'border-[#706d6d]' },
              { id: 'orders', label: 'Orders', count: orders.length, icon: ShoppingCart, color: 'bg-[#706d6d] text-white shadow-black/10', activeBorder: 'border-[#706d6d]' },
              { id: 'customers', label: 'Customers', count: customers.length, icon: Users, color: 'bg-[#706d6d] text-white shadow-black/10', activeBorder: 'border-[#706d6d]' },
              { id: 'returns', label: 'Returns', count: returns.length, icon: Undo2, color: 'bg-[#706d6d] text-white shadow-black/10', activeBorder: 'border-[#706d6d]' },
              { id: 'shipping', label: 'Shipping', count: shipments.length, icon: Truck, color: 'bg-[#706d6d] text-white shadow-black/10', activeBorder: 'border-[#706d6d]' },
              { id: 'repairs', label: 'Repairs', count: repairJobs.length, icon: Wrench, color: 'bg-[#0d6efd] text-white shadow-blue-500/10', activeBorder: 'border-[#0d6efd]' },
              { id: 'purchase-orders', label: 'Purchase Orders', count: purchaseOrders.length, icon: ClipboardList, color: 'bg-[#0d6efd] text-white shadow-blue-500/10', activeBorder: 'border-[#0d6efd]' },
              { id: 'stock-units', label: 'Stock Units', count: stockUnits.length, icon: Barcode, color: 'bg-[#0d6efd] text-white shadow-blue-500/10', activeBorder: 'border-[#0d6efd]' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(tab.id as any);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 transition-all duration-200 rounded-lg whitespace-nowrap flex-shrink-0 border ${
                    isActive 
                      ? `${tab.color} border-transparent font-black shadow-lg scale-[1.02] ring-2 ring-white/20` 
                      : 'bg-emerald-600 text-white hover:bg-emerald-500 border-emerald-500 shadow-sm'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-emerald-100'}`} />
                  <span className="tracking-wider text-[10px] uppercase font-bold">{tab.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => onOpenSettings?.('invoice')}
              className="flex items-center gap-2 px-4 py-2 transition-all duration-200 rounded-lg whitespace-nowrap flex-shrink-0 border bg-amber-400 text-slate-950 hover:bg-amber-300 border-amber-300 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span className="tracking-wider text-[10px] uppercase font-black">Settings</span>
            </button>
          </div>
        </div>

      </div>

      <div className="space-y-6" id="dashboard-main-content">


      {/* METRICS & CHARTS TAB - COLORFUL BOOTSTRAP CARDS */}
      {activeTab === 'metrics' && (
        <div className="space-y-8" id="dashboard-tab-metrics">
          {/* Top Scorecard Grid - Bootstrap Colorful Palettes */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Total Revenue card - Bootstrap Primary Blue */}
            <div className="rounded-2xl bg-gradient-to-br from-[#198754] via-[#15803d] to-[#166534] text-white p-5 shadow-lg shadow-emerald-500/20 border-b-4 border-emerald-900 transform transition-transform hover:-translate-y-1">
              <div className="flex justify-between items-start">
                <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-blue-100">Gross Revenue</span>
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="mt-3 font-mono text-2xl font-black text-white">
                ${totalRevenue.toFixed(2)}
              </div>
              <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-100">
                <span className="flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-emerald-300" /> Active Store
                </span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-white">LIVE</span>
              </div>
            </div>

            {/* Total Sales count card - Bootstrap Success Green */}
            <div className="rounded-2xl bg-gradient-to-br from-[#198754] via-[#15803d] to-[#166534] text-white p-5 shadow-lg shadow-emerald-500/20 border-b-4 border-emerald-900 transform transition-transform hover:-translate-y-1">
              <div className="flex justify-between items-start">
                <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-emerald-100">Checkouts</span>
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <ShoppingCart className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="mt-3 font-mono text-2xl font-black text-white">
                {totalSalesCount} <span className="font-sans text-xs uppercase text-emerald-200">Orders</span>
              </div>
              <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-100">
                <span>Realtime Pipeline</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-white">100% SUCCESS</span>
              </div>
            </div>

            {/* Average Order Value card - Bootstrap Info Cyan */}
            <div className="rounded-2xl bg-gradient-to-br from-[#198754] via-[#15803d] to-[#166534] text-white p-5 shadow-lg shadow-emerald-500/20 border-b-4 border-emerald-900 transform transition-transform hover:-translate-y-1">
              <div className="flex justify-between items-start">
                <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-emerald-100">Avg Order Value</span>
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="mt-3 font-mono text-2xl font-black text-white">
                ${averageOrderValue.toFixed(2)}
              </div>
              <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-100">
                <span>Cart Density</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-white">INDEX</span>
              </div>
            </div>

            {/* Catalog sizes - Bootstrap Indigo / Purple */}
            <div className="rounded-2xl bg-gradient-to-br from-[#198754] via-[#15803d] to-[#166534] text-white p-5 shadow-lg shadow-emerald-500/20 border-b-4 border-emerald-900 transform transition-transform hover:-translate-y-1">
              <div className="flex justify-between items-start">
                <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-emerald-100">Store Products</span>
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <Package className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="mt-3 font-mono text-2xl font-black text-white">
                {products.length} <span className="font-sans text-xs uppercase text-purple-200">ITEMs</span>
              </div>
              <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-100">
                <span>Active Catalog</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-white">READY</span>
              </div>
            </div>

            {/* Low stock alert box - Bootstrap Danger Red */}
            <div className="rounded-2xl bg-gradient-to-br from-[#198754] via-[#15803d] to-[#166534] text-white p-5 shadow-lg shadow-emerald-500/20 border-b-4 border-emerald-900 transform transition-transform hover:-translate-y-1">
              <div className="flex justify-between items-start">
                <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-rose-100">Low Stock Alerts</span>
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <AlertTriangle className={`h-4 w-4 text-white ${lowStockCount > 0 ? 'animate-bounce' : ''}`} />
                </div>
              </div>
              <div className="mt-3 font-mono text-2xl font-black text-white">
                {lowStockCount} <span className="font-sans text-xs uppercase text-rose-200">Alerts</span>
              </div>
              <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-wider text-rose-100">
                <span>Threshold &lt;= 5</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-white">{lowStockCount > 0 ? 'ATTN NEEDED' : 'HEALTHY'}</span>
              </div>
            </div>
          </div>

          {/* HIGH-LEVEL STORE PERFORMANCE OVERVIEW - BOOTSTRAP COLORFUL BENTO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="performance-overview-bento">
            {/* Sales Target Goal Card */}
            <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-slate-900 dark:to-blue-950/40 p-6 flex flex-col justify-between shadow-md" id="bento-target">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] uppercase font-black tracking-wider text-blue-700 dark:text-blue-300">Monthly Sales Goal Target</span>
                  <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                    <Activity className="h-4 w-4" />
                  </div>
                </div>
                <div className="font-mono text-3xl font-black text-blue-950 dark:text-blue-100">
                  {targetProgress.toFixed(0)}%
                </div>
                <p className="font-sans text-xs text-blue-800 dark:text-blue-300 mt-2 font-medium">
                  ${totalRevenue.toFixed(2)} achieved of ${salesTarget.toLocaleString()} target.
                </p>
              </div>
              <div className="mt-5">
                <div className="w-full bg-blue-200 dark:bg-blue-900 h-3 rounded-full overflow-hidden p-0.5 border border-blue-300 dark:border-blue-700">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500 shadow-sm" 
                    style={{ width: `${Math.min(targetProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Best Sellers Card */}
            <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 text-slate-950 p-6 flex flex-col justify-between shadow-md" id="bento-bestseller">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] uppercase font-black tracking-wider text-slate-950">Best Performing ITEM</span>
                  <div className="bg-slate-950 text-amber-400 p-1.5 rounded-lg shadow-sm">
                    <Award className="h-4 w-4" />
                  </div>
                </div>
                <div className="font-sans text-base font-black text-slate-950 uppercase truncate tracking-tight" title={bestSellingProduct}>
                  {bestSellingProduct}
                </div>
                {bestSellingProductQty > 0 ? (
                  <p className="font-sans text-xs text-slate-900 mt-2 font-bold">
                    Generated <span className="font-mono text-slate-950 text-sm font-black">${bestSellingProductRevenue.toFixed(2)}</span> ({bestSellingProductQty} units sold).
                  </p>
                ) : (
                  <p className="font-sans text-xs text-slate-800 mt-2 font-medium">
                    No checkout records yet.
                  </p>
                )}
              </div>
              <div className="mt-5 flex items-center gap-2 text-[10px] font-mono font-black text-slate-950 uppercase tracking-widest bg-white/40 px-3 py-1.5 rounded-lg w-fit">
                <Sparkles className="h-3.5 w-3.5 text-slate-950" /> TOP SELLING HARDWARE
              </div>
            </div>

            {/* Operational Pipeline / Fulfillment Card */}
            <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-slate-900 dark:to-emerald-950/40 p-6 flex flex-col justify-between shadow-md" id="bento-fulfillment">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] uppercase font-black tracking-wider text-emerald-700 dark:text-emerald-300">Fulfillment Efficiency</span>
                  <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>
                <div className="font-mono text-3xl font-black text-emerald-950 dark:text-emerald-100">
                  {fulfillmentRate.toFixed(0)}%
                </div>
                <div className="font-sans text-xs text-emerald-800 dark:text-emerald-300 mt-2 font-medium">
                  {pendingCount + processingCount > 0 ? (
                    <span>Requires action: <span className="font-mono font-bold text-emerald-950 dark:text-emerald-100">{pendingCount + processingCount}</span> active orders in process.</span>
                  ) : (
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">All orders fully processed & shipped</span>
                  )}
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between text-[9px] font-mono font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                <span className="bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">Pending: {pendingCount}</span>
                <span className="bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">Processing: {processingCount}</span>
                <span className="bg-emerald-200 dark:bg-emerald-800/80 text-emerald-950 dark:text-emerald-100 px-2 py-0.5 rounded-md">Shipped: {shippedCount + deliveredCount}</span>
              </div>
            </div>
          </div>

          {/* Graphical Analytics Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Sales Trends Chart (Line Graph) */}
            <div className="rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-none lg:col-span-2">
              <h4 className="font-sans text-xs font-bold tracking-widest text-neutral-950 dark:text-neutral-50 uppercase mb-6">Sales Performance ($)</h4>
              <div className="h-72 w-full font-mono text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={monthlyRevenueData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="0 0" vertical={false} stroke="#f5f5f5" className="dark:opacity-10" />
                    <XAxis dataKey="month" stroke="#a3a3a3" tickLine={false} />
                    <YAxis stroke="#a3a3a3" tickLine={false} />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} contentStyle={{ background: '#1a1a1a', borderRadius: '0px', border: '1px solid #404040', color: '#fff' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#1a1a1a" strokeWidth={2} activeDot={{ r: 5 }} dot={{ strokeWidth: 1.5, r: 3, fill: '#fff' }} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales Share by Category (Pie Chart) */}
            <div className="rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-none">
              <h4 className="font-sans text-xs font-bold tracking-widest text-neutral-950 dark:text-neutral-50 uppercase mb-6">Volume Share By Category</h4>
              <div className="h-72 w-full font-sans text-xs relative flex flex-col justify-between">
                <div className="flex-1 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={displayCategoryData}
                        cx="50%"
                        cy="45%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {displayCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={1} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value}`, 'Volume']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Labels Indicator */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-[8px] font-mono uppercase tracking-widest text-neutral-500 font-bold">
                  {displayCategoryData.map((entry, index) => (
                    <span key={index} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-none" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      {entry.name}: ${entry.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in" id="dashboard-tab-analytics">
          {/* Header & Controls Banner */}
          <div className="bg-transparent text-neutral-900 dark:text-neutral-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30 text-white shrink-0">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
                  <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    REAL-TIME STORE ANALYTICS
                  </span>
                </div>
                <h4 className="font-sans text-xl font-black uppercase tracking-tight text-neutral-900 dark:text-white mt-1">
                  Traffic, Funnel & Revenue Intelligence
                </h4>
              </div>
            </div>
            
            {/* Timeframe selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-300 dark:border-slate-700">
              {(['24h', '7d', '30d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setAnalyticsTimeRange(range)}
                  className={`px-3.5 py-1.5 font-mono text-xs uppercase font-black transition-all rounded-lg cursor-pointer ${
                    analyticsTimeRange === range
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Scorecard Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Gross & Net Sales */}
            <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                  Sales Income (Gross / Net)
                </span>
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                ${filteredRevenue.toFixed(2)}
              </div>
              <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold">
                Net (est): <span className="font-extrabold text-blue-600 dark:text-blue-400">${netRevenue.toFixed(2)}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-600 dark:text-slate-400 font-bold">
                <span>Orders: <strong className="text-slate-900 dark:text-white font-extrabold">{filteredOrdersCount}</strong></span>
                <span>AOV: <strong className="text-slate-900 dark:text-white font-extrabold">${filteredAOV.toFixed(2)}</strong></span>
              </div>
            </div>

            {/* Card 2: Store Traffic & Page Views */}
            <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                  Store Traffic (Visits)
                </span>
                <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/20">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                {uniqueVisitors.toLocaleString()}
              </div>
              <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold">
                Impressions: <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{totalPageViews.toLocaleString()}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-emerald-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-600 dark:text-slate-400 font-bold">
                <span>Avg Pages: <strong className="text-slate-900 dark:text-white font-extrabold">3.8</strong></span>
                <span>Bounce: <strong className="text-slate-900 dark:text-white font-extrabold">36.4%</strong></span>
              </div>
            </div>

            {/* Card 3: Conversion Rate */}
            <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/50 via-white to-yellow-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                  Sales Conversion Rate
                </span>
                <div className="p-2 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/20">
                  <Percent className="h-4 w-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                {conversionRate.toFixed(2)}%
              </div>
              <div className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold">
                Checkout Completion Rate
              </div>
              <div className="mt-3 pt-1">
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, conversionRate * 12)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 4: Projected Growth */}
            <div className="rounded-2xl border-2 border-purple-200 dark:border-purple-900/40 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/20 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-md">
                  Growth Index
                </span>
                <div className="p-2 bg-purple-600 text-white rounded-xl shadow-md shadow-purple-500/20">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className={`font-mono text-2xl font-black flex items-center gap-1 ${salesGrowthPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {salesGrowthPercent >= 0 ? '+' : ''}{salesGrowthPercent.toFixed(1)}%
                {salesGrowthPercent >= 0 ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : (
                  <ArrowDownRight className="h-5 w-5" />
                )}
              </div>
              <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold">
                Target vs Actual Pace
              </div>
              <div className="mt-3 pt-3 border-t border-purple-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-600 dark:text-slate-400 font-bold">
                <span>Target MoM: <strong className="text-purple-600 dark:text-purple-400 font-extrabold">+15%</strong></span>
                <span>Index: <strong className="text-emerald-600 font-extrabold">Excellent</strong></span>
              </div>
            </div>
          </div>

          {/* Charts & Funnels Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Sales Trends Chart (Area Graph with Gradient Fill) */}
            <div className="rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-none lg:col-span-2 text-left">
              <div className="flex items-center justify-between mb-6">
                <h5 className="font-sans text-xs font-bold tracking-widest text-neutral-950 dark:text-neutral-50 uppercase">Sales & Projection Trends ($)</h5>
                <span className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-1">
                  <span className="h-2 w-2 bg-neutral-950 dark:bg-neutral-50 rounded-none inline-block"></span> Actual 
                  <span className="h-0.5 w-3 border-t border-neutral-400 border-dashed inline-block ml-2"></span> Forecast
                </span>
              </div>
              <div className="h-72 w-full font-mono text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsAreaChart data={dynamicGrowthData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorAreaRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0 0" vertical={false} stroke="#f5f5f5" className="dark:opacity-5" />
                    <XAxis dataKey="name" stroke="#a3a3a3" tickLine={false} />
                    <YAxis stroke="#a3a3a3" tickLine={false} />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Revenue']} 
                      contentStyle={{ background: '#1a1a1a', borderRadius: '0px', border: '1px solid #404040', color: '#fff' }} 
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#1a1a1a" strokeWidth={2} fillOpacity={1} fill="url(#colorAreaRevenue)" />
                    <Line type="monotone" dataKey="forecast" stroke="#a3a3a3" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  </RechartsAreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Customer Conversion Funnel */}
            <div className="rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-none text-left flex flex-col justify-between">
              <div>
                <h5 className="font-sans text-xs font-bold tracking-widest text-neutral-950 dark:text-neutral-50 uppercase mb-5">Acquisition & Checkout Funnel</h5>
                
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div>
                    <div className="flex justify-between font-mono text-[8px] uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                      <span>1. Impressions / Visits</span>
                      <span className="text-neutral-900 dark:text-neutral-200 font-extrabold">{totalPageViews.toLocaleString()} views</span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-6 flex items-center px-3 relative">
                      <div className="absolute left-0 top-0 bottom-0 bg-neutral-950/5 dark:bg-white/5 w-full"></div>
                      <span className="font-mono text-[9px] font-bold text-neutral-800 dark:text-neutral-200 z-10">100% of Store Traffic</span>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div>
                    <div className="flex justify-between font-mono text-[8px] uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                      <span>2. Product Details Views</span>
                      <span className="text-neutral-900 dark:text-neutral-200 font-extrabold">{Math.round(uniqueVisitors * 0.82)} clicks</span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-6 flex items-center px-3 relative">
                      <div className="absolute left-0 top-0 bottom-0 bg-neutral-950/10 dark:bg-white/10 w-[82%]"></div>
                      <span className="font-mono text-[9px] font-bold text-neutral-800 dark:text-neutral-200 z-10">82.0% Interest Index</span>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div>
                    <div className="flex justify-between font-mono text-[8px] uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                      <span>3. Add to Basket</span>
                      <span className="text-neutral-900 dark:text-neutral-200 font-extrabold">{Math.round(uniqueVisitors * 0.32)} items</span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-6 flex items-center px-3 relative">
                      <div className="absolute left-0 top-0 bottom-0 bg-neutral-950/15 dark:bg-white/15 w-[32%]"></div>
                      <span className="font-mono text-[9px] font-bold text-neutral-800 dark:text-neutral-200 z-10">32.0% Conversion Path</span>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div>
                    <div className="flex justify-between font-mono text-[8px] uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                      <span>4. Checkout Purchases</span>
                      <span className="text-neutral-900 dark:text-neutral-200 font-extrabold">{filteredOrdersCount} Orders</span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-6 flex items-center px-3 relative">
                      <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/10 dark:bg-emerald-400/10" style={{ width: `${Math.min(100, Math.max(5, conversionRate * 8))}%` }}></div>
                      <span className="font-mono text-[9px] font-bold text-emerald-700 dark:text-emerald-400 z-10">{conversionRate.toFixed(1)}% Direct Yield</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="font-sans text-[9px] text-neutral-700 dark:text-neutral-300 mt-4 uppercase tracking-wider leading-relaxed">
                * Funnel indicators are computed dynamically from your active checkout activity.
              </p>
            </div>
          </div>

          {/* Traffic Breakdown & Real-Time Interaction Feed */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            
            {/* Traffic Channels Breakdown */}
            <div className="rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-none text-left">
              <h5 className="font-sans text-xs font-bold tracking-widest text-neutral-950 dark:text-neutral-50 uppercase mb-5">Traffic Channel Acquisition</h5>
              <div className="space-y-4 font-sans text-xs">
                
                {/* Channel 1 */}
                <div>
                  <div className="flex items-center justify-between mb-1 text-[11px]">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">Google Search Engine</span>
                    <span className="font-mono text-[10px] text-neutral-500">44% ({Math.round(uniqueVisitors * 0.44)})</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-none">
                    <div className="bg-neutral-950 dark:bg-neutral-400 h-1.5" style={{ width: '44%' }}></div>
                  </div>
                </div>

                {/* Channel 2 */}
                <div>
                  <div className="flex items-center justify-between mb-1 text-[11px]">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">Direct URL Input</span>
                    <span className="font-mono text-[10px] text-neutral-500">26% ({Math.round(uniqueVisitors * 0.26)})</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-none">
                    <div className="bg-neutral-950 dark:bg-neutral-400 h-1.5" style={{ width: '26%' }}></div>
                  </div>
                </div>

                {/* Channel 3 */}
                <div>
                  <div className="flex items-center justify-between mb-1 text-[11px]">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">Social Media (Instagram / X)</span>
                    <span className="font-mono text-[10px] text-neutral-500">18% ({Math.round(uniqueVisitors * 0.18)})</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-none">
                    <div className="bg-neutral-950 dark:bg-neutral-400 h-1.5" style={{ width: '18%' }}></div>
                  </div>
                </div>

                {/* Channel 4 */}
                <div>
                  <div className="flex items-center justify-between mb-1 text-[11px]">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">Newsletter / Referral Link</span>
                    <span className="font-mono text-[10px] text-neutral-500">12% ({Math.round(uniqueVisitors * 0.12)})</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-none">
                    <div className="bg-neutral-950 dark:bg-neutral-400 h-1.5" style={{ width: '12%' }}></div>
                  </div>
                </div>

              </div>
            </div>

            {/* Real-time Shoppers Stream */}
            <div className="rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-none md:col-span-2 text-left">
              <div className="flex items-center justify-between mb-5">
                <h5 className="font-sans text-xs font-bold tracking-widest text-neutral-950 dark:text-neutral-50 uppercase flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live Shoppers
                </h5>
                <span className="font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-0.5">
                  7 shoppers online
                </span>
              </div>

              {/* Shoppers Table / List */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse font-sans text-xs text-left">
                  <thead className="bg-neutral-300 dark:bg-neutral-800 border-b border-neutral-500 dark:border-neutral-600 font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 font-bold">
                    <tr>
                      <th className="p-3 pl-4">Visitor IP / ID</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Device</th>
                      <th className="p-3">Current Active Page</th>
                      <th className="p-3 text-right pr-4">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-300 dark:divide-neutral-700 text-neutral-700 dark:text-neutral-300">
                    {[
                      { ip: '142.250.31.25', country: '🇺🇸 United States', device: 'Mobile', page: 'Comparing Classic Leather Tote', duration: '2m 14s' },
                      { ip: '172.217.16.14', country: '🇬🇧 United Kingdom', device: 'Desktop', page: 'Reading Specs for Trench Coat', duration: '45s' },
                      { ip: '192.168.1.102', country: '🇫🇷 France', device: 'Mobile', page: 'Adding Wool Scarf to Basket', duration: '4m 12s' },
                      { ip: '203.0.113.195', country: '🇯🇵 Japan', device: 'Desktop', page: 'Browsing Sunglasses Collection', duration: '12s' },
                      { ip: '8.8.8.8', country: '🇨🇦 Canada', device: 'Mobile', page: 'Entering checkout coupon stage', duration: '5m 30s' },
                      { ip: '1.1.1.1', country: '🇦🇺 Australia', device: 'Desktop', page: 'Viewing Customer Review Ratings', duration: '1m 02s' },
                      { ip: '104.244.42.1', country: '🇩🇪 Germany', device: 'Mobile', page: 'Looking at Handcrafted Watch', duration: '3m 50s' },
                    ].map((shopper, i) => (
                      <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-850/30 transition-colors">
                        <td className="p-3 pl-4 font-mono text-[10px] text-neutral-700 dark:text-neutral-300 font-bold">
                          {shopper.ip}
                        </td>
                        <td className="p-3 font-medium uppercase tracking-wide text-neutral-800 dark:text-neutral-200 text-[10px]">
                          {shopper.country}
                        </td>
                        <td className="p-3">
                          <span className="rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-2 py-0.5 font-mono text-[8px] text-neutral-600 dark:text-neutral-400 uppercase tracking-widest font-bold">
                            {shopper.device}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider text-[9px] truncate max-w-[200px]">
                          {shopper.page}
                        </td>
                        <td className="p-3 text-right pr-4 font-mono text-[10px] text-neutral-500">
                          {shopper.duration}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* LIVE INVENTORY MANAGEMENT TAB */}
      {activeTab === 'inventory' && (
        <InventoryModule
  products={products}
  onAddProduct={onAddProduct}
  onUpdateProduct={onUpdateProduct}
  onDeleteProduct={onDeleteProduct}
  onClearAllProducts={onClearAllProducts}
  onUpdateStoreSettings={onUpdateStoreSettings}
  storeSettings={storeSettings}
  categories={categories}
  onAddCategory={onAddCategory}
  onEditCategory={onEditCategory}
  onDeleteCategory={onDeleteCategory}
  collections={collections}
  onAddCollection={onAddCollection}
  onDeleteCollection={onDeleteCollection}
  suppliers={suppliers}
  setSuppliers={setSuppliers}
/>
      )}
      {activeTab === 'orders' && (() => {
        const query = orderSearchQuery.toLowerCase().trim();
        const filteredOrders = orders.filter(ord => {
          const matchesSearch = 
            !query ||
            ord.customerName.toLowerCase().includes(query) ||
            ord.customerEmail.toLowerCase().includes(query) ||
            ord.id.toLowerCase().includes(query) ||
            ord.items.some(it => it.name.toLowerCase().includes(query));
          
          const matchesStatus = orderStatusFilter === 'All' || ord.status === orderStatusFilter;
          return matchesSearch && matchesStatus;
        });

        return (
          <div className="space-y-6 animate-fade-in" id="dashboard-tab-orders">
            {/* Header banner */}
            <div className="bg-transparent text-neutral-900 dark:text-neutral-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/30 text-white shrink-0">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-mono text-[9px] uppercase font-bold tracking-widest text-indigo-400">
                    <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      ORDER FULFILLMENT
                    </span>
                    <span className="text-slate-400">• TRANSACTION LOGS</span>
                  </div>
                  <h4 className="font-sans text-xl font-black uppercase tracking-tight text-white mt-1">
                    Store Checkout & Order Dispatch
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase">
                  Total Orders: <strong className="text-white">{orders.length}</strong>
                </span>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-2xl border-2 border-neutral-400 dark:border-neutral-700 bg-white dark:bg-slate-900 p-12 text-center shadow-sm text-slate-900 dark:text-white">
                <ShoppingCart className="h-10 w-10 text-indigo-500 mx-auto mb-4" />
                <h5 className="font-sans text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">No Checkouts Received Yet</h5>
                <p className="font-sans text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                  When buyers make a checkout purchase, transaction records with billing information and items will be registered here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-slate-50/80 dark:bg-slate-900 p-4 rounded-2xl border border-neutral-400 dark:border-neutral-700">
                  {/* Search Input */}
                  <div className="relative flex-1 max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="SEARCH BY BUYER NAME, EMAIL, ITEM OR ID..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-slate-950 pl-10 pr-14 py-2.5 font-sans text-xs uppercase tracking-wider outline-none text-slate-900 dark:text-slate-100 focus:border-indigo-500 placeholder:text-slate-400"
                    />
                    {orderSearchQuery && (
                      <button 
                        onClick={() => setOrderSearchQuery('')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 font-mono text-xs uppercase tracking-widest font-black text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Status Filters */}
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Pending', 'Processing', 'Shipped', 'Delivered'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setOrderStatusFilter(status)}
                        className={`px-3.5 py-2 font-sans text-xs font-black uppercase tracking-wider transition-all rounded-xl cursor-pointer shadow-sm ${
                          orderStatusFilter === status
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/25 scale-105'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="rounded-2xl border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-slate-900 p-12 text-center shadow-none text-slate-900 dark:text-slate-100">
                    <Search className="h-8 w-8 text-slate-400 mx-auto mb-4" />
                    <h5 className="font-sans text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">No Matching Checkouts</h5>
                    <p className="font-sans text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                      No orders match your search criteria. Try modifying your filter values.
                    </p>
                    <button
                      onClick={() => {
                        setOrderSearchQuery('');
                        setOrderStatusFilter('All');
                      }}
                      className="mt-4 px-4 py-2 font-sans text-xs font-black uppercase tracking-widest bg-slate-900 text-white rounded-xl hover:bg-slate-800 cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border-2 border-neutral-400 dark:border-neutral-700 bg-white dark:bg-slate-900 shadow-sm">
                    <table className="w-full border-collapse font-sans text-xs text-left">
                      <thead className="bg-neutral-300 dark:bg-neutral-800 border-b border-neutral-500 dark:border-neutral-600 font-mono text-[9px] uppercase tracking-widest text-neutral-900 dark:text-neutral-100 font-bold">
                        <tr>
                          <th className="p-4 pl-6">Order ID</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Purchase Items</th>
                          <th className="p-4">Total Price</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right pr-6">Status Flow</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-neutral-900 dark:text-neutral-100">
                        {filteredOrders.map((ord, idx) => (
                          <tr key={`${ord.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                            {/* ID */}
                            <td className="p-4 pl-6 font-mono font-black text-indigo-600 dark:text-indigo-400">
                              {ord.id}
                            </td>

                            {/* Buyer */}
                            <td className="p-4">
                              <div className="font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">{ord.customerName}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold">{ord.customerEmail}</div>
                            </td>

                            {/* Items */}
                            <td className="p-4">
                              <div className="max-w-[200px] truncate font-sans text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                {ord.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                              </div>
                            </td>

                            {/* Total */}
                            <td className="p-4 font-mono font-black text-slate-900 dark:text-white">
                              ${ord.total.toFixed(2)}
                            </td>

                            {/* Date */}
                            <td className="p-4 font-mono text-slate-500 dark:text-slate-400 text-xs font-bold">
                              {ord.date}
                            </td>

                            {/* Status */}
                            <td className="p-4">
                              <span className={`inline-flex rounded-lg px-2.5 py-1 text-[9px] font-black tracking-wider uppercase border shadow-xs ${
                                ord.status === 'Pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300' :
                                ord.status === 'Processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300' :
                                ord.status === 'Shipped' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300' :
                                'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                              }`}>
                                {ord.status}
                              </span>
                            </td>

                            {/* Control buttons */}
                            <td className="p-4 text-right pr-6">
                              <div className="flex justify-end gap-1 font-mono text-[8px] uppercase font-bold tracking-widest">
                                <button
                                  onClick={() => setSelectedInvoiceOrder(ord)}
                                  className="rounded-none bg-blue-600 text-white px-2 py-1 flex items-center gap-1 hover:bg-blue-500 transition-colors border border-transparent font-bold cursor-pointer"
                                  title="View & Print Official Tax Invoice"
                                >
                                  <FileText className="h-2.5 w-2.5" />
                                  Invoice
                                </button>
                                <button
                                  onClick={() => handlePrintLabel(ord)}
                                  className="rounded-none bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 px-2 py-1 flex items-center gap-1 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors border border-transparent"
                                  title="Print Shipping Label"
                                >
                                  <Printer className="h-2.5 w-2.5" />
                                  Label
                                </button>
                                <button
                                  onClick={() => onUpdateOrderStatus(ord.id, 'Processing')}
                                  disabled={ord.status !== 'Pending'}
                                  className="rounded-none bg-neutral-100 dark:bg-neutral-800 border border-neutral-400 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 px-2 py-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                  Process
                                </button>
                                <button
                                  onClick={() => onUpdateOrderStatus(ord.id, 'Shipped')}
                                  disabled={ord.status !== 'Processing'}
                                  className="rounded-none bg-neutral-100 dark:bg-neutral-800 border border-neutral-400 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 px-2 py-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                  Ship
                                </button>
                                <button
                                  onClick={() => onUpdateOrderStatus(ord.id, 'Delivered')}
                                  disabled={ord.status !== 'Shipped'}
                                  className="rounded-none bg-neutral-100 dark:bg-neutral-800 border border-neutral-400 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 px-2 py-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                  Deliver
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* INVOICES & BILLING CENTER TAB */}
      {activeTab === 'invoices' && (() => {
        const query = invoiceSearchQuery.toLowerCase().trim();
        
        // Convert all orders to invoice objects
        const allInvoices: Invoice[] = orders.map(ord => convertOrderToInvoice(ord));
        
        const filteredInvoices = allInvoices.filter(inv => {
          const matchesQuery = !query ||
            inv.invoiceNumber.toLowerCase().includes(query) ||
            inv.customerName.toLowerCase().includes(query) ||
            inv.customerEmail.toLowerCase().includes(query) ||
            (inv.poNumber && inv.poNumber.toLowerCase().includes(query)) ||
            (inv.customerCompany && inv.customerCompany.toLowerCase().includes(query));

          const matchesStatus = invoiceStatusFilter === 'All' || inv.status === invoiceStatusFilter;
          return matchesQuery && matchesStatus;
        });

        const totalInvoicedRevenue = allInvoices.reduce((acc, inv) => acc + inv.total, 0);
        const totalTaxCollected = allInvoices.reduce((acc, inv) => acc + inv.tax, 0);
        const paidCount = allInvoices.filter(inv => inv.status === 'Paid').length;
        const unpaidCount = allInvoices.filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue').length;

        const openInvoiceBuilder = () => {
          setInvoiceBuilderCustomerName('');
          setInvoiceBuilderCustomerCompany('');
          setInvoiceBuilderEmail('');
          setInvoiceBuilderPhone('');
          setInvoiceBuilderAddress('');
          setInvoiceBuilderCity('');
          setInvoiceBuilderAbn('');
          setInvoiceBuilderPo('');
          setInvoiceBuilderNotes('');
          setInvoiceBuilderDiscount('0');
          setInvoiceBuilderShipping('0');
          setInvoiceBuilderItems([]);
          setInvoiceBuilderOpen(true);
        };

        const handleInvoiceBuilderSave = () => {
          const subtotal = invoiceBuilderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
          const discount = parseFloat(invoiceBuilderDiscount) || 0;
          const shipping = parseFloat(invoiceBuilderShipping) || 0;
          const taxableSubtotal = Math.max(0, subtotal - discount + shipping);
          const tax = taxableSubtotal * (storeSettings?.taxRatePercent || 10) / 100;
          const total = taxableSubtotal + tax;

          const newCustomInv: Invoice = {
            id: `INV-CUSTOM-${Date.now()}`,
            invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            poNumber: invoiceBuilderPo || `PO-B2B-${Math.floor(1000 + Math.random() * 9000)}`,
            status: invoiceBuilderStatus,
            type: invoiceBuilderType,
            customerName: invoiceBuilderCustomerName || 'Valued Customer',
            customerCompany: invoiceBuilderCustomerCompany || undefined,
            customerEmail: invoiceBuilderEmail || 'customer@example.com',
            customerPhone: invoiceBuilderPhone || undefined,
            customerAddress: invoiceBuilderAddress || 'Address not provided',
            customerCity: invoiceBuilderCity || 'N/A',
            customerABN: invoiceBuilderAbn || undefined,
            items: invoiceBuilderItems.map(item => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.quantity * item.unitPrice,
              taxRate: item.taxRate
            })),
            subtotal,
            tax,
            shipping,
            discount,
            total,
            paymentMethod: invoiceBuilderPaymentMethod || 'Direct EFT Bank Transfer',
            paymentTerms: 'Net 14 Days',
            notes: invoiceBuilderNotes || 'Custom invoice generated from the internal billing console.'
          };

          const orderId = `ORD-CUSTOM-${Date.now()}`;
          const syncPayload = buildCustomInvoiceSyncPayload({
            invoice: newCustomInv,
            products,
            orderId,
            date: newCustomInv.issueDate,
            userLabel: 'Custom Invoice'
          });

          onAddPOSOrder(syncPayload.order);
          syncPayload.updatedProducts.forEach(updatedP => onUpdateProduct(updatedP));
          syncPayload.transactions.forEach(tx => onAddTransaction(tx));

          const matchingCustomer = customers.find((customer) => customer.email.toLowerCase() === newCustomInv.customerEmail.toLowerCase());
          if (matchingCustomer) {
            onUpdateCustomer({
              ...matchingCustomer,
              points: matchingCustomer.points + Math.round(newCustomInv.total / 10),
              walletBalance: matchingCustomer.walletBalance
            });
          }

          setSelectedInvoiceData(newCustomInv);
          setInvoiceBuilderOpen(false);
          onShowAlert?.(`Invoice ${newCustomInv.invoiceNumber} created and synced across finance, inventory, and POS records.`, 'success');
        };

        return (
          <div className="space-y-6 animate-fade-in" id="dashboard-tab-invoices">
            
            {/* Top Banner Header */}
            <div className="bg-transparent text-neutral-900 dark:text-neutral-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/30 text-slate-950 font-black shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-mono text-[9px] uppercase font-bold tracking-widest text-amber-400">
                    <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      TAX INVOICING &amp; BILLING
                    </span>
                    <span className="text-slate-400">• AUSTRALIAN GST &amp; B2B COMPLIANT</span>
                  </div>
                  <h4 className="font-sans text-xl font-black uppercase tracking-tight text-white mt-1">
                    Invoices, B2B Quotes &amp; Printing System
                  </h4>
                </div>
              </div>

            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-neutral-400 dark:border-neutral-700 shadow-sm">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Invoices Issued</span>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">{allInvoices.length}</div>
                <span className="text-[10px] text-slate-500 font-medium">Store checkouts + manual billing</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-neutral-400 dark:border-neutral-700 shadow-sm">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Revenue Invoiced</span>
                <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">${totalInvoicedRevenue.toFixed(2)}</div>
                <span className="text-[10px] text-emerald-600 font-bold">100% Tax Compliant</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-neutral-400 dark:border-neutral-700 shadow-sm">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block mb-1">Total GST Collected (10%)</span>
                <div className="text-2xl font-black font-mono text-amber-500">${totalTaxCollected.toFixed(2)}</div>
                <span className="text-[10px] text-slate-500 font-medium">Australian Tax Office ledger</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-neutral-400 dark:border-neutral-700 shadow-sm">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block mb-1">Payment Clearing Status</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600 font-mono">{paidCount} Paid</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-xs font-bold text-amber-500 font-mono">{unpaidCount} Pending</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">EFT Direct + Credit Card clearing</span>
              </div>
            </div>

            {/* Controls Bar: Search & Status Filters */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-slate-50/80 dark:bg-slate-900 p-4 rounded-2xl border border-neutral-400 dark:border-neutral-700">
              <div className="relative flex-1 max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="SEARCH INVOICE #, BUYER, EMAIL, OR PO..."
                  value={invoiceSearchQuery}
                  onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-slate-950 pl-10 pr-14 py-2.5 font-sans text-xs uppercase tracking-wider outline-none text-slate-900 dark:text-slate-100 focus:border-amber-500 placeholder:text-slate-400"
                />
                {invoiceSearchQuery && (
                  <button 
                    onClick={() => setInvoiceSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 font-mono text-xs uppercase tracking-widest font-black text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {['All', 'Paid', 'Unpaid', 'Overdue', 'Cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setInvoiceStatusFilter(status)}
                    className={`px-3.5 py-2 font-sans text-xs font-black uppercase tracking-wider transition-all rounded-xl cursor-pointer shadow-sm ${
                      invoiceStatusFilter === status
                        ? 'bg-amber-400 text-slate-950 shadow-amber-500/20 scale-105'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={openInvoiceBuilder}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono text-xs uppercase font-black px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="h-4 w-4" /> Create Large Order Invoice
              </button>
            </div>

            {invoiceBuilderOpen && (
              <div ref={invoiceBuilderSectionRef} className="rounded-2xl border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-6">
                
                {/* Modal Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl font-black shadow-md">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="font-sans text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Dynamic B2B Custom Invoice &amp; Quote Builder
                      </h5>
                      <p className="font-sans text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Live search customers, company records &amp; inventory. Auto-syncs POS, Inventory, Finance &amp; CRM.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Quick Preset Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px] uppercase font-bold text-slate-400">Preset Template:</span>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'enterprise') {
                            setInvoiceBuilderCustomerCompany('Aether Dynamics Corp');
                            setInvoiceBuilderCustomerName('Harrison Wells');
                            setInvoiceBuilderEmail('h.wells@aetherdynamics.com.au');
                            setInvoiceBuilderPhone('0412 889 001');
                            setInvoiceBuilderAddress('Suite 400, 100 Collins St');
                            setInvoiceBuilderCity('Melbourne');
                            setInvoiceBuilderAbn('98 123 456 789');
                            setInvoiceBuilderType('Tax Invoice');
                            setInvoiceBuilderStatus('Unpaid');
                            setInvoiceBuilderItems([
                              { description: 'Refurbished Enterprise Workstation Rig - i9 / 64GB RAM / 2TB NVMe', quantity: 3, unitPrice: 1850, taxRate: 10 },
                              { description: '27-inch 4K Color-Accurate Professional Monitor', quantity: 3, unitPrice: 450, taxRate: 10 },
                              { description: 'Commercial On-Site 12-Month Extended Hardware Warranty', quantity: 1, unitPrice: 350, taxRate: 10 }
                            ]);
                          } else if (val === 'school') {
                            setInvoiceBuilderCustomerCompany('St Jude Grammar School');
                            setInvoiceBuilderCustomerName('IT Procurement Manager');
                            setInvoiceBuilderEmail('procurement@stjude.edu.au');
                            setInvoiceBuilderPhone('03 9800 1200');
                            setInvoiceBuilderAddress('45 College Road');
                            setInvoiceBuilderCity('Sydney');
                            setInvoiceBuilderAbn('12 444 888 999');
                            setInvoiceBuilderType('Quote');
                            setInvoiceBuilderStatus('Quote');
                            setInvoiceBuilderItems([
                              { description: 'Refurbished Lenovo ThinkPad T480 - i5 / 16GB / 256GB SSD', quantity: 10, unitPrice: 480, taxRate: 10 },
                              { description: 'USB-C Universal Dual-Monitor Docking Station', quantity: 10, unitPrice: 85, taxRate: 10 }
                            ]);
                          } else if (val === 'blank') {
                            setInvoiceBuilderItems([]);
                          }
                        }}
                        className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 font-mono text-[10px] font-bold text-amber-900 dark:text-amber-300 outline-none cursor-pointer"
                      >
                        <option value="">-- Load Quick Template --</option>
                        <option value="enterprise">🏢 B2B Enterprise Order (Workstations + 4K Displays)</option>
                        <option value="school">🏫 Education Fleet Order (10x Laptops + Docks)</option>
                        <option value="blank">🧹 Blank Custom Invoice</option>
                      </select>
                    </div>

                    <button 
                      onClick={() => setInvoiceBuilderOpen(false)} 
                      className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Section 1: Customer Details & Live Auto-Complete */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase font-extrabold tracking-wider text-amber-500 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> 1. Customer &amp; Billing Details (Live Searchable)
                    </span>
                    <span className="font-mono text-[9px] text-slate-400">💡 Type Name, Company, Email, or Phone for instant auto-complete</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    
                    {/* Customer Name input with floating live search popover */}
                    <div className="relative">
                      <label className="font-mono text-[9px] uppercase font-bold text-slate-500 block mb-1">Customer Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Harrison Wells"
                        value={invoiceBuilderCustomerName}
                        onFocus={() => focusCustomerLookup('invoiceCustomerName', invoiceBuilderCustomerName)}
                        onChange={(e) => handleCustomerLookupInput('invoiceCustomerName', e.target.value, setInvoiceBuilderCustomerName)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-amber-400 focus:bg-white transition-colors"
                      />
                      {customerLookupTarget === 'invoiceCustomerName' && customerLookupSuggestions.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-amber-400 dark:border-amber-500/50 rounded-xl shadow-2xl p-2 space-y-1 max-h-56 overflow-y-auto">
                          <div className="font-mono text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 px-2 py-1 border-b border-slate-100 dark:border-slate-800">
                            Matching Customer Records ({customerLookupSuggestions.length})
                          </div>
                          {customerLookupSuggestions.map((cust) => (
                            <button
                              key={cust.id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyCustomerLookupSelection('invoiceCustomerName', cust)}
                              className="w-full text-left p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors flex items-center justify-between group cursor-pointer"
                            >
                              <div>
                                <span className="block font-bold text-xs text-slate-900 dark:text-white group-hover:text-amber-600">{cust.name}</span>
                                <span className="block font-mono text-[9px] text-slate-500">{cust.company || cust.email}</span>
                              </div>
                              <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {cust.type}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Company input with floating live search popover */}
                    <div className="relative">
                      <label className="font-mono text-[9px] uppercase font-bold text-slate-500 block mb-1">Company Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Aether Dynamics"
                        value={invoiceBuilderCustomerCompany}
                        onFocus={() => focusCustomerLookup('invoiceCustomerCompany', invoiceBuilderCustomerCompany)}
                        onChange={(e) => handleCustomerLookupInput('invoiceCustomerCompany', e.target.value, setInvoiceBuilderCustomerCompany)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-amber-400 focus:bg-white transition-colors"
                      />
                      {customerLookupTarget === 'invoiceCustomerCompany' && customerLookupSuggestions.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-amber-400 dark:border-amber-500/50 rounded-xl shadow-2xl p-2 space-y-1 max-h-56 overflow-y-auto">
                          <div className="font-mono text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 px-2 py-1 border-b border-slate-100 dark:border-slate-800">
                            Matching Companies ({customerLookupSuggestions.length})
                          </div>
                          {customerLookupSuggestions.map((cust) => (
                            <button
                              key={cust.id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyCustomerLookupSelection('invoiceCustomerCompany', cust)}
                              className="w-full text-left p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors flex items-center justify-between group cursor-pointer"
                            >
                              <div>
                                <span className="block font-bold text-xs text-slate-900 dark:text-white group-hover:text-amber-600">{cust.company || cust.name}</span>
                                <span className="block font-mono text-[9px] text-slate-500">Contact: {cust.name}</span>
                              </div>
                              <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                {cust.abn ? `ABN: ${cust.abn}` : cust.type}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Email input with floating live search popover */}
                    <div className="relative">
                      <label className="font-mono text-[9px] uppercase font-bold text-slate-500 block mb-1">Email Address *</label>
                      <input
                        type="email"
                        placeholder="billing@company.com"
                        value={invoiceBuilderEmail}
                        onFocus={() => focusCustomerLookup('invoiceCustomerEmail', invoiceBuilderEmail)}
                        onChange={(e) => handleCustomerLookupInput('invoiceCustomerEmail', e.target.value, setInvoiceBuilderEmail)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-amber-400 focus:bg-white transition-colors"
                      />
                      {customerLookupTarget === 'invoiceCustomerEmail' && customerLookupSuggestions.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-amber-400 dark:border-amber-500/50 rounded-xl shadow-2xl p-2 space-y-1 max-h-56 overflow-y-auto">
                          {customerLookupSuggestions.map((cust) => (
                            <button
                              key={cust.id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyCustomerLookupSelection('invoiceCustomerEmail', cust)}
                              className="w-full text-left p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors flex items-center justify-between cursor-pointer"
                            >
                              <div>
                                <span className="block font-bold text-xs text-slate-900 dark:text-white">{cust.email}</span>
                                <span className="block font-mono text-[9px] text-slate-500">{cust.name} ({cust.company || 'Retail'})</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Phone input with floating live search popover */}
                    <div className="relative">
                      <label className="font-mono text-[9px] uppercase font-bold text-slate-500 block mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="0412 000 000"
                        value={invoiceBuilderPhone}
                        onFocus={() => focusCustomerLookup('invoiceCustomerPhone', invoiceBuilderPhone)}
                        onChange={(e) => handleCustomerLookupInput('invoiceCustomerPhone', e.target.value, setInvoiceBuilderPhone)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-amber-400 focus:bg-white transition-colors"
                      />
                      {customerLookupTarget === 'invoiceCustomerPhone' && customerLookupSuggestions.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-amber-400 dark:border-amber-500/50 rounded-xl shadow-2xl p-2 space-y-1 max-h-56 overflow-y-auto">
                          {customerLookupSuggestions.map((cust) => (
                            <button
                              key={cust.id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyCustomerLookupSelection('invoiceCustomerPhone', cust)}
                              className="w-full text-left p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors flex items-center justify-between cursor-pointer"
                            >
                              <div>
                                <span className="block font-bold text-xs text-slate-900 dark:text-white">{cust.phone}</span>
                                <span className="block font-mono text-[9px] text-slate-500">{cust.name} - {cust.company || 'Retail'}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="font-mono text-[9px] uppercase font-bold text-slate-500 block mb-1">Street Address</label>
                      <input 
                        type="text"
                        placeholder="Suite / Street address"
                        value={invoiceBuilderAddress} 
                        onChange={(e) => setInvoiceBuilderAddress(e.target.value)} 
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none" 
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[9px] uppercase font-bold text-slate-500 block mb-1">City / State / Postcode</label>
                      <input 
                        type="text"
                        placeholder="Melbourne, VIC 3000"
                        value={invoiceBuilderCity} 
                        onChange={(e) => setInvoiceBuilderCity(e.target.value)} 
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none" 
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[9px] uppercase font-bold text-slate-500 block mb-1">ABN / Business Tax ID</label>
                      <input 
                        type="text"
                        placeholder="45 901 234 567"
                        value={invoiceBuilderAbn} 
                        onChange={(e) => setInvoiceBuilderAbn(e.target.value)} 
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none" 
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[9px] uppercase font-bold text-slate-500 block mb-1">PO / Reference #</label>
                      <input 
                        type="text"
                        value={invoiceBuilderPo} 
                        onChange={(e) => setInvoiceBuilderPo(e.target.value)} 
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-mono" 
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Invoice Metadata & Terms */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase font-extrabold tracking-wider text-amber-500 flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3.5 w-3.5" /> 2. Invoice Document Type &amp; Billing Terms
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="font-mono text-[9px] uppercase font-bold text-slate-500 block mb-1">Document Type</label>
                      <select 
                        value={invoiceBuilderType} 
                        onChange={(e) => setInvoiceBuilderType(e.target.value as any)} 
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="Tax Invoice">Tax Invoice (Official GST)</option>
                        <option value="Pro Forma">Pro Forma Invoice</option>
                        <option value="Quote">Official B2B Quote</option>
                        <option value="Credit Note">Credit Note</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-mono text-[9px] uppercase font-bold text-slate-500 block mb-1">Payment Status</label>
                      <select 
                        value={invoiceBuilderStatus} 
                        onChange={(e) => setInvoiceBuilderStatus(e.target.value as any)} 
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="Unpaid">Unpaid (Awaiting EFT / Credit)</option>
                        <option value="Paid">Paid (Clearing Completed)</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Quote">Quote / Draft</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-mono text-[9px] uppercase font-bold text-slate-500 block mb-1">Payment Method</label>
                      <select 
                        value={invoiceBuilderPaymentMethod} 
                        onChange={(e) => setInvoiceBuilderPaymentMethod(e.target.value)} 
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="Direct EFT Bank Transfer">Direct EFT Bank Transfer</option>
                        <option value="Credit Card / Stripe">Credit Card (Stripe)</option>
                        <option value="Cash / POS Counter">Cash (POS Counter)</option>
                        <option value="Net 30 Commercial Credit">Net 30 Commercial Credit</option>
                        <option value="PayPal">PayPal Business</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-mono text-[9px] uppercase font-bold text-slate-500 block mb-1">Payment Terms</label>
                      <div className="flex gap-1">
                        {['Due on Receipt', 'Net 7 Days', 'Net 14 Days', 'Net 30 Days'].map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => {
                              setInvoiceBuilderNotes(prev => `Payment Terms: ${term}. ` + prev.replace(/^Payment Terms: [^.]*\.\s*/, ''));
                            }}
                            className="flex-1 py-2 font-mono text-[8px] uppercase font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-amber-100 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            {term.replace(' Days', 'D')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-mono text-[9px] uppercase font-bold text-slate-500 block mb-1">Invoice Notes &amp; Terms &amp; Conditions</label>
                    <textarea 
                      value={invoiceBuilderNotes} 
                      onChange={(e) => setInvoiceBuilderNotes(e.target.value)} 
                      rows={2} 
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white outline-none" 
                    />
                  </div>
                </div>

                {/* Section 3: Live Catalog Search & Invoice Line Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase font-extrabold tracking-wider text-amber-500 flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" /> 3. Live Catalog Product Search &amp; Custom Line Items
                    </span>
                    <button 
                      onClick={() => setInvoiceBuilderItems(prev => [...prev, { description: 'Custom Service / Item', quantity: 1, unitPrice: 100, taxRate: storeSettings?.taxRatePercent || 10 }])} 
                      className="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 px-3 py-1 rounded-xl hover:bg-amber-100 cursor-pointer"
                    >
                      + Add Custom Non-Catalog Line
                    </button>
                  </div>

                  {/* Catalog Products Live Search Box */}
                  <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
                    <div className="flex flex-col lg:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={invoiceBuilderProductSearch}
                          onChange={(e) => {
                            setInvoiceBuilderProductSearch(e.target.value);
                          }}
                          placeholder="Search product catalog by name, category, or SKU..."
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-400"
                        />
                      </div>

                      <select 
                        value={invoiceBuilderProductFilter} 
                        onChange={(e) => setInvoiceBuilderProductFilter(e.target.value)} 
                        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="All">All Categories ({products.length})</option>
                        {Array.from(new Set(products.map(p => p.category))).filter(Boolean).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Catalog Results Grid */}
                    <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 space-y-1">
                      {products.filter(product => {
                        const query = invoiceBuilderProductSearch.toLowerCase();
                        const matchesQuery = !query || 
                          product.name.toLowerCase().includes(query) || 
                          product.category.toLowerCase().includes(query) || 
                          product.id.toLowerCase().includes(query);
                        const matchesCategory = invoiceBuilderProductFilter === 'All' || product.category === invoiceBuilderProductFilter;
                        return matchesQuery && matchesCategory;
                      }).map(product => {
                        const price = product.discountPrice ?? product.price;
                        const isLowStock = product.stock > 0 && product.stock <= 5;
                        const isOutOfStock = product.stock <= 0;

                        return (
                          <div
                            key={product.id}
                            className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 p-2 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 p-1 flex items-center justify-center shrink-0">
                                {product.image ? (
                                  <img src={product.image} alt="" className="h-full w-full object-contain" />
                                ) : (
                                  <Package className="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <span className="block font-bold text-xs text-slate-900 dark:text-white">{product.name}</span>
                                <div className="flex items-center gap-2 font-mono text-[9px]">
                                  <span className="text-slate-500">{product.category}</span>
                                  <span className="text-slate-400">•</span>
                                  <span className={`font-bold ${
                                    isOutOfStock ? 'text-rose-500' : isLowStock ? 'text-amber-500' : 'text-emerald-500'
                                  }`}>
                                    {isOutOfStock ? 'Out of stock (0)' : isLowStock ? `Low stock (${product.stock})` : `In stock (${product.stock})`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                                ${price.toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setInvoiceBuilderItems(prev => {
                                    const existing = prev.find(item => item.productId === product.id);
                                    if (existing) {
                                      return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
                                    }
                                    return [...prev, { 
                                      productId: product.id, 
                                      description: product.name, 
                                      quantity: 1, 
                                      unitPrice: price, 
                                      taxRate: storeSettings?.taxRatePercent || 10 
                                    }];
                                  });
                                  onShowAlert?.(`Added "${product.name}" to invoice cart.`, 'info');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono text-[10px] font-black uppercase cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" /> Add
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Invoice Line Items Table */}
                  <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse font-sans text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-mono text-[9px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                          <th className="p-3 font-extrabold">Item Description</th>
                          <th className="p-3 font-extrabold w-24">Qty</th>
                          <th className="p-3 font-extrabold w-32">Unit Price ($)</th>
                          <th className="p-3 font-extrabold w-24">GST Rate (%)</th>
                          <th className="p-3 font-extrabold w-32 text-right">Line Total ($)</th>
                          <th className="p-3 font-extrabold w-16 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {invoiceBuilderItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-mono text-xs uppercase">
                              No items in invoice cart. Search catalog above or click "+ Add Custom Non-Catalog Line".
                            </td>
                          </tr>
                        ) : (
                          invoiceBuilderItems.map((item, index) => {
                            const lineTotal = item.quantity * item.unitPrice;
                            return (
                              <tr key={`${item.description}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                                <td className="p-2">
                                  <input 
                                    type="text"
                                    value={item.description} 
                                    onChange={(e) => setInvoiceBuilderItems(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, description: e.target.value } : row))} 
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-medium outline-none" 
                                    placeholder="Description" 
                                  />
                                </td>
                                <td className="p-2">
                                  <input 
                                    type="number" 
                                    min="1" 
                                    value={item.quantity} 
                                    onChange={(e) => setInvoiceBuilderItems(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, quantity: Math.max(1, Number(e.target.value) || 1) } : row))} 
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono font-bold outline-none" 
                                  />
                                </td>
                                <td className="p-2">
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="0.01" 
                                    value={item.unitPrice} 
                                    onChange={(e) => setInvoiceBuilderItems(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, unitPrice: Number(e.target.value) || 0 } : row))} 
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono font-bold outline-none" 
                                  />
                                </td>
                                <td className="p-2">
                                  <input 
                                    type="number" 
                                    min="0" 
                                    max="100" 
                                    value={item.taxRate} 
                                    onChange={(e) => setInvoiceBuilderItems(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, taxRate: Number(e.target.value) || 0 } : row))} 
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono outline-none" 
                                  />
                                </td>
                                <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                                  ${lineTotal.toFixed(2)}
                                </td>
                                <td className="p-2 text-center">
                                  <button 
                                    type="button"
                                    onClick={() => setInvoiceBuilderItems(prev => prev.filter((_, rowIndex) => rowIndex !== index))} 
                                    className="p-1.5 text-rose-600 hover:text-rose-800 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                                    title="Remove Item"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 4: Totals & Final Submission */}
                {(() => {
                  const subtotal = invoiceBuilderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
                  const discount = parseFloat(invoiceBuilderDiscount) || 0;
                  const shipping = parseFloat(invoiceBuilderShipping) || 0;
                  const taxableSubtotal = Math.max(0, subtotal - discount + shipping);
                  const tax = taxableSubtotal * (storeSettings?.taxRatePercent || 10) / 100;
                  const total = taxableSubtotal + tax;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-mono text-[9px] uppercase font-bold text-slate-500 block mb-1">Discount Amount ($)</label>
                          <input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            value={invoiceBuilderDiscount} 
                            onChange={(e) => setInvoiceBuilderDiscount(e.target.value)} 
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none" 
                          />
                        </div>
                        <div>
                          <label className="font-mono text-[9px] uppercase font-bold text-slate-500 block mb-1">Shipping Fee ($)</label>
                          <input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            value={invoiceBuilderShipping} 
                            onChange={(e) => setInvoiceBuilderShipping(e.target.value)} 
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none" 
                          />
                        </div>
                      </div>

                      {/* Calculation Summary Box */}
                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2 font-mono text-xs">
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>Items Subtotal:</span>
                          <span className="font-bold">${subtotal.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-emerald-600 font-bold">
                            <span>Discount Applied:</span>
                            <span>-${discount.toFixed(2)}</span>
                          </div>
                        )}
                        {shipping > 0 && (
                          <div className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>Freight / Shipping:</span>
                            <span>+${shipping.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>GST Tax ({storeSettings?.taxRatePercent || 10}%):</span>
                          <span>+${tax.toFixed(2)}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-300 dark:border-slate-700 flex justify-between text-base font-black text-slate-900 dark:text-white">
                          <span>Final Total Payable:</span>
                          <span className="text-amber-500">${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Submit Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500">
                    ✅ Automatically updates POS orders, inventory stock, financial ledger, and customer rewards.
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setInvoiceBuilderOpen(false)} 
                      className="rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-2.5 font-mono text-xs font-bold uppercase text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleInvoiceBuilderSave} 
                      className="rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono text-xs font-black uppercase px-6 py-2.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" /> Create &amp; Sync Invoice
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Invoices List Table */}
            {filteredInvoices.length === 0 ? (
              <div className="rounded-2xl border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-slate-900 p-12 text-center shadow-none text-slate-900 dark:text-slate-100">
                <FileText className="h-8 w-8 text-amber-500 mx-auto mb-4" />
                <h5 className="font-sans text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">No Invoices Match Criteria</h5>
                <p className="font-sans text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                  No invoice records match your current search parameters. Try adjusting your query filters or create a custom invoice.
                </p>
                <button
                  onClick={() => {
                    setInvoiceSearchQuery('');
                    setInvoiceStatusFilter('All');
                  }}
                  className="mt-4 px-4 py-2 font-sans text-xs font-black uppercase tracking-widest bg-slate-900 text-white rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  Reset Invoice Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border-2 border-neutral-400 dark:border-neutral-700 bg-white dark:bg-slate-900 shadow-sm">
                <table className="w-full border-collapse font-sans text-xs text-left">
                  <thead className="bg-neutral-300 dark:bg-neutral-800 border-b border-neutral-500 dark:border-neutral-600 font-mono text-[9px] uppercase tracking-widest text-neutral-900 dark:text-neutral-100 font-bold">
                    <tr>
                      <th className="p-4 pl-6">Invoice #</th>
                      <th className="p-4">Doc Type</th>
                      <th className="p-4">Customer / B2B Entity</th>
                      <th className="p-4">Date Issued</th>
                      <th className="p-4 text-right">Tax (GST)</th>
                      <th className="p-4 text-right">Grand Total</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right pr-6">Invoicing Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-neutral-900 dark:text-neutral-100">
                    {filteredInvoices.map((inv, idx) => (
                      <tr key={`${inv.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                        
                        {/* Invoice Number */}
                        <td className="p-4 pl-6 font-mono font-black text-amber-500">
                          {inv.invoiceNumber}
                          <span className="block font-sans text-[10px] text-slate-400 font-normal">PO: {inv.poNumber || 'N/A'}</span>
                        </td>

                        {/* Document Type */}
                        <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {inv.type}
                        </td>

                        {/* Customer */}
                        <td className="p-4">
                          <div className="font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">{inv.customerName}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold">{inv.customerEmail}</div>
                        </td>

                        {/* Date */}
                        <td className="p-4 font-mono text-slate-500 dark:text-slate-400 text-xs font-bold">
                          {inv.issueDate}
                        </td>

                        {/* Tax */}
                        <td className="p-4 text-right font-mono text-slate-500 dark:text-slate-400">
                          ${inv.tax.toFixed(2)}
                        </td>

                        {/* Total */}
                        <td className="p-4 text-right font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                          ${inv.total.toFixed(2)}
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          <span className={`inline-flex rounded-full px-3 py-0.5 text-[9px] font-mono font-extrabold tracking-wider uppercase border ${
                            inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300' :
                            inv.status === 'Unpaid' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300' :
                            'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                          }`}>
                            {inv.status}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="p-4 text-right pr-6">
                          <div className="flex justify-end gap-1.5 font-mono text-[9px] uppercase font-bold">
                            <button
                              onClick={() => printInvoiceDirect(inv)}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                              title="Print A4 Tax Invoice / PDF"
                            >
                              <Printer className="h-3 w-3" /> Print
                            </button>
                            <button
                              onClick={() => setSelectedInvoiceData(inv)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                              title="View & Edit Invoice Modal"
                            >
                              <FileText className="h-3 w-3" /> View / Edit
                            </button>
                            <button
                              onClick={() => downloadInvoiceHtmlFile(inv)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2 py-1 rounded-lg transition-all cursor-pointer"
                              title="Download HTML File"
                            >
                              Download
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        );
      })()}

      {/* COUPONS & CAMPAIGN MANAGEMENT TAB */}
      {activeTab === 'coupons' && (
        <div className="space-y-6 animate-fade-in" id="dashboard-tab-coupons">
          {/* Header banner */}
          <div className="bg-transparent text-neutral-900 dark:text-neutral-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/30 text-white shrink-0">
                <Tag className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase font-bold tracking-widest text-amber-400">
                  <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    PROMOTIONS & DISCOUNTS
                  </span>
                  <span className="text-slate-400">• DISCOUNT CODES</span>
                </div>
                <h4 className="font-sans text-xl font-black uppercase tracking-tight text-white mt-1">
                  Promo Offers & Coupon Campaigns
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase">
                Active Codes: <strong className="text-amber-400">{coupons.filter(c => c.active).length} / {coupons.length}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Left panel: Add Coupon form */}
            <div className="rounded-2xl border-2 border-neutral-400 dark:border-neutral-700 bg-white dark:bg-slate-900 p-6 shadow-sm h-fit text-left">
              <h4 className="font-sans text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                <Tag className="h-4 w-4 text-amber-500" />
                Create Promo Offer
              </h4>
              
              <form onSubmit={handleAddCouponSubmit} className="space-y-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 font-bold">Coupon Code (Uppercase)</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. HARDWARE20"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-neutral-400 dark:border-neutral-700 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-xs font-bold outline-none text-slate-900 dark:text-white focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 font-bold">Coupon Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewCouponType('percent')}
                      className={`flex-1 rounded-xl py-2.5 text-center font-sans text-xs uppercase tracking-wider font-extrabold border transition-all cursor-pointer ${
                        newCouponType === 'percent'
                          ? 'border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'border-neutral-400 dark:border-neutral-700 bg-slate-50 dark:bg-slate-950 text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      Percent (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCouponType('fixed')}
                      className={`flex-1 rounded-xl py-2.5 text-center font-sans text-xs uppercase tracking-wider font-extrabold border transition-all cursor-pointer ${
                        newCouponType === 'fixed'
                          ? 'border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'border-neutral-400 dark:border-neutral-700 bg-slate-50 dark:bg-slate-950 text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      Fixed ($)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 font-bold">
                    Discount Value ({newCouponType === 'percent' ? '%' : '$'})
                  </label>
                  <input
                    type="number"
                    required
                    placeholder={newCouponType === 'percent' ? '15' : '20'}
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(e.target.value)}
                    className="w-full rounded-xl border border-neutral-400 dark:border-neutral-700 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-xs font-bold outline-none text-slate-900 dark:text-white focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 font-bold">Min Spend Required ($) (Optional)</label>
                  <input
                    type="number"
                    placeholder="NONE"
                    value={newCouponMin}
                    onChange={(e) => setNewCouponMin(e.target.value)}
                    className="w-full rounded-xl border border-neutral-400 dark:border-neutral-700 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-xs font-bold outline-none text-slate-900 dark:text-white focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 py-3 font-sans text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                >
                  <Tag className="h-4 w-4" /> Activate Code
                </button>
              </form>
            </div>

            {/* Right panel: Active Coupons Table */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="font-sans text-xs font-black tracking-widest text-slate-900 dark:text-white uppercase text-left">Active Campaigns</h4>
              
              <div className="overflow-x-auto rounded-2xl border-2 border-neutral-400 dark:border-neutral-700 bg-white dark:bg-slate-900 shadow-sm">
                <table className="w-full border-collapse font-sans text-xs text-left">
                  <thead className="bg-neutral-300 dark:bg-neutral-800 border-b border-neutral-500 dark:border-neutral-600 font-mono text-[9px] uppercase tracking-widest text-neutral-900 dark:text-neutral-100 font-bold">
                    <tr>
                      <th className="p-4 pl-6">Coupon Code</th>
                      <th className="p-4">Deduction Rule</th>
                      <th className="p-4">Min Spend</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right pr-6">Toggle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-neutral-900 dark:text-neutral-100">
                    {coupons.map((coup) => (
                      <tr key={coup.code} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="p-4 pl-6 font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                          {coup.code}
                        </td>
                        <td className="p-4 font-mono font-extrabold text-slate-900 dark:text-white">
                          {coup.code === 'FREESHIP' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-black uppercase text-xs">Free Shipping</span>
                          ) : coup.type === 'percent' ? (
                            <span className="text-slate-900 dark:text-white">{coup.value}% Off</span>
                          ) : (
                            <span className="text-slate-900 dark:text-white">${coup.value.toFixed(2)} Off</span>
                          )}
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-500">
                          {coup.minPurchase ? `$${coup.minPurchase.toFixed(2)}` : 'None'}
                        </td>
                        <td className="p-4">
                          <span className={`rounded-lg px-2.5 py-1 text-[9px] font-black tracking-wider uppercase border ${
                            coup.active 
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300'
                          }`}>
                            {coup.active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="p-4 text-right pr-6">
                          <button
                            onClick={() => onToggleCoupon(coup.code)}
                            className={`font-mono text-xs uppercase font-extrabold tracking-wider rounded-xl border px-3 py-1.5 transition-all cursor-pointer shadow-xs ${
                              coup.active
                                ? 'bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border-slate-300 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300'
                                : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                            }`}
                          >
                            {coup.active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CATEGORIES MANAGEMENT TAB */}
      {activeTab === 'returns' && (
        <div className="space-y-6 animate-fade-in" id="admin-returns-view">
          {/* Header banner */}
          <div className="bg-transparent text-neutral-900 dark:text-neutral-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl shadow-lg shadow-rose-500/30 text-white shrink-0">
                <Undo2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase font-bold tracking-widest text-rose-400">
                  <span className="bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    REFUNDS & DISPATCH
                  </span>
                  <span className="text-slate-400">• HARDWARE RMA CLAIMS</span>
                </div>
                <h4 className="font-sans text-xl font-black uppercase tracking-tight text-white mt-1">
                  Returns & RMA Resolution Center
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase">
                Active Requests: <strong className="text-rose-400">{returns.filter(r => r.status === 'Pending').length} Pending</strong>
              </span>
            </div>
          </div>

          <div className="border-2 border-neutral-400 dark:border-neutral-700 bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans">
                <thead>
                  <tr className="border-b border-neutral-400 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 font-mono text-[9px] uppercase tracking-widest text-neutral-900 dark:text-neutral-100 font-bold">
                    <th className="px-6 py-4">ID & Date</th>
                    <th className="px-6 py-4">Customer & Order</th>
                    <th className="px-6 py-4">Items & Reason</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {returns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Undo2 className="h-10 w-10 text-rose-500" />
                          <p className="font-sans text-xs font-black uppercase tracking-widest text-slate-500">No active return requests</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    returns.map((ret) => (
                      <tr key={ret.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs font-black text-rose-600 dark:text-rose-400">{ret.id}</div>
                          <div className="font-mono text-[10px] text-slate-500 mt-1 font-bold">{new Date(ret.requestDate).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-sans text-xs font-extrabold text-slate-900 dark:text-white uppercase">{ret.customerName}</div>
                          <div className="font-mono text-[10px] text-slate-500 mt-0.5 font-bold">Order #{ret.orderId}</div>
                        </td>
                        <td className="px-6 py-4">
                          {ret.items.map((item, idx) => (
                            <div key={idx} className="mb-2 last:mb-0">
                              <div className="font-sans text-xs font-bold text-slate-900 dark:text-white uppercase">
                                {item.name} <span className="text-slate-500 font-mono text-[10px]">x{item.quantity}</span>
                              </div>
                              <div className="font-sans text-[10px] italic text-slate-500 font-medium mt-0.5">
                                Reason: {item.reason}
                              </div>
                            </div>
                          ))}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border ${
                              ret.status === 'Pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300' :
                              ret.status === 'Approved' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300' :
                              ret.status === 'Rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300' :
                              'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                            }`}>
                              {ret.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {ret.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => onUpdateReturnStatus(ret.id, 'Approved')}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors rounded-xl border border-emerald-200 cursor-pointer"
                                  title="Approve Return"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => onUpdateReturnStatus(ret.id, 'Rejected')}
                                  className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors rounded-xl border border-rose-200 cursor-pointer"
                                  title="Reject Return"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {ret.status === 'Approved' && (
                              <button
                                onClick={() => onUpdateReturnStatus(ret.id, 'Completed')}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
                              >
                                Mark Completed
                              </button>
                            )}
                            {(ret.status === 'Completed' || ret.status === 'Rejected') && (
                              <div className="font-sans text-xs uppercase font-extrabold text-slate-400">
                                Resolved
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-slate-100 dark:bg-slate-900/80 border border-neutral-400 dark:border-neutral-700 p-4 rounded-2xl">
            <div className="flex items-start gap-3">
              <Activity className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-sans text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-0.5">
                  Returns Workflow Note
                </p>
                <p className="font-sans text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-relaxed font-bold">
                  Approving a return will notify the customer with shipping instructions. Marking as completed will trigger the refund process. All resolutions are final and logged in the customer history.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COLLECTIONS VIEW */}
      {activeTab === 'customers' && (
        <div className="space-y-6 text-left animate-fade-in" id="admin-customers-view">
          {/* Header banner */}
          <div className="bg-transparent text-neutral-900 dark:text-neutral-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30 text-white shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase font-bold tracking-widest text-indigo-400">
                  <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    CUSTOMER DIRECTORY
                  </span>
                  <span className="text-slate-400">• RETAIL & WHOLESALE CRM</span>
                </div>
                <h4 className="font-sans text-xl font-black uppercase tracking-tight text-white mt-1">
                  Customer Database & Order History
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddCustomer(!showAddCustomer)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" /> Add New Customer
              </button>
              <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase">
                Registered Clients: <strong className="text-indigo-400">{customers.length}</strong>
              </span>
            </div>
          </div>

          {showAddCustomer && (
            <div className="bg-white dark:bg-slate-900 border-2 border-indigo-600/20 rounded-2xl p-6 shadow-xl animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h5 className="font-sans text-lg font-black uppercase text-slate-900 dark:text-white">New Customer Registration</h5>
                <button onClick={() => setShowAddCustomer(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Customer Name</label>
                    <input 
                      type="text" 
                      required 
                      value={newCustName} 
                      onFocus={() => focusCustomerLookup('newCustomerName', newCustName)}
                      onChange={e => handleCustomerLookupInput('newCustomerName', e.target.value, setNewCustName)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all"
                      placeholder="Full Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={newCustEmail} 
                      onChange={e => setNewCustEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                    <input 
                      type="text" 
                      value={newCustPhone} 
                      onFocus={() => focusCustomerLookup('newCustomerPhone', newCustPhone)}
                      onChange={e => handleCustomerLookupInput('newCustomerPhone', e.target.value, setNewCustPhone)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all"
                      placeholder="+61 400 000 000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Street Address</label>
                    <input 
                      type="text" 
                      value={newCustAddress} 
                      onChange={e => setNewCustAddress(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all"
                      placeholder="123 Technology Way"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">City / State / Postcode</label>
                    <input 
                      type="text" 
                      value={newCustCity} 
                      onChange={e => setNewCustCity(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all"
                      placeholder="Sydney NSW 2000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Customer Type</label>
                    <select 
                      value={newCustType} 
                      onChange={e => setNewCustType(e.target.value as 'Retail' | 'Wholesale')}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="Retail">Retail Customer</option>
                      <option value="Wholesale">Wholesale / Business</option>
                    </select>
                  </div>
                  {newCustType === 'Wholesale' && (
                    <>
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Company Name</label>
                        <input 
                          type="text" 
                          value={newCustCompany} 
                          onFocus={() => focusCustomerLookup('newCustomerCompany', newCustCompany)}
                          onChange={e => handleCustomerLookupInput('newCustomerCompany', e.target.value, setNewCustCompany)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all"
                          placeholder="Business Name"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">ABN / Tax ID</label>
                        <input 
                          type="text" 
                          value={newCustABN} 
                          onChange={e => setNewCustABN(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all"
                          placeholder="ABN Number"
                        />
                      </div>
                    </>
                  )}
                </div>

                {customerLookupTarget && customerLookupTarget.startsWith('newCustomer') && customerLookupSuggestions.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
                    <div className="mb-2 font-mono text-[9px] uppercase font-bold tracking-wider text-slate-500">Matching customers</div>
                    <div className="space-y-1">
                      {customerLookupSuggestions.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyCustomerLookupSelection(customerLookupTarget, customer)}
                          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-800 hover:bg-indigo-50"
                        >
                          <span>
                            <span className="block font-semibold">{customer.name}</span>
                            <span className="block text-[10px] text-slate-500">{customer.company || customer.email}</span>
                          </span>
                          <span className="text-[10px] text-slate-500">{customer.phone}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">Internal Notes</label>
                  <textarea 
                    rows={2}
                    value={newCustNotes} 
                    onChange={e => setNewCustNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all"
                    placeholder="Relevant business info, preferences, or special terms..."
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl font-mono text-sm font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:translate-y-1 transition-all"
                  >
                    Register Customer
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="border-2 border-neutral-400 dark:border-neutral-700 bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden text-left">
            <div className="border-b border-neutral-200 dark:border-neutral-800 p-4">
              <div className="relative max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="SEARCH CUSTOMER, COMPANY, EMAIL OR PHONE..."
                  className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3 py-2.5 font-sans text-xs uppercase tracking-wider outline-none text-slate-900 dark:text-white focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-neutral-400 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 font-mono text-[9px] uppercase tracking-widest text-neutral-900 dark:text-neutral-100 font-bold">
                    <th className="px-6 py-4">Customer Name & Contact</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Orders Placed</th>
                    <th className="px-6 py-4">Total Spent</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-neutral-900 dark:text-neutral-100">
                  {filteredCustomers.map((cust) => {
                    const customerOrders = orders.filter(o => o.customerEmail === cust.email);
                    const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);
                    
                    return (
                      <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-black text-slate-900 dark:text-white uppercase tracking-wide text-xs">{cust.name}</div>
                          <div className="font-mono text-[10px] text-slate-500 font-bold mt-0.5">{cust.email}</div>
                          {cust.company && (
                            <div className="text-[9px] text-indigo-500 font-bold uppercase mt-1 italic">{cust.company}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border ${
                            cust.type === 'Wholesale' 
                              ? 'bg-blue-100 text-blue-700 border-blue-200' 
                              : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}>
                            {cust.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-extrabold text-slate-900 dark:text-white">
                          {customerOrders.length} {customerOrders.length === 1 ? 'order' : 'orders'}
                        </td>
                        <td className="px-6 py-4 font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          ${totalSpent.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right pr-6">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => startEditingCustomer(cust)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Edit Customer"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => setSelectedHistoryCustomer(cust)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              title="View Order History"
                            >
                              <History className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => onDeleteCustomer(cust.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-mono text-xs uppercase italic">
                        {customerSearchQuery ? 'No customers match the current search.' : 'No customers found in directory.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer History Sidepanel / Overlay */}
          {selectedHistoryCustomer && (
            <div className="fixed inset-0 z-[80] flex justify-end bg-black/60 backdrop-blur-sm overflow-hidden">
              <div className="h-full w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-slide-in-right border-l border-slate-200 dark:border-slate-800">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/20">
                      {selectedHistoryCustomer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-sans text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{selectedHistoryCustomer.name}</h3>
                      <p className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{selectedHistoryCustomer.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedHistoryCustomer(null)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Lifetime Value</div>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        ${orders.filter(o => o.customerEmail.toLowerCase() === selectedHistoryCustomer.email.toLowerCase()).reduce((sum, o) => sum + o.total, 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Total Orders</div>
                      <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                        {orders.filter(o => o.customerEmail.toLowerCase() === selectedHistoryCustomer.email.toLowerCase()).length}
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Reward Points</div>
                      <div className="text-lg font-black text-amber-500 font-mono">{selectedHistoryCustomer.points}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Wallet Balance</div>
                      <div className="text-lg font-black text-slate-900 dark:text-white font-mono">${selectedHistoryCustomer.walletBalance.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Order History Table */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-indigo-500" />
                      <h4 className="font-sans text-xs font-black uppercase text-slate-900 dark:text-white tracking-widest">Historical Transaction Log</h4>
                    </div>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 dark:bg-slate-950 font-mono text-[9px] uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Order ID</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Total</th>
                            <th className="px-4 py-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {orders
                            .filter(o => o.customerEmail.toLowerCase() === selectedHistoryCustomer.email.toLowerCase())
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(order => (
                              <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                                <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{order.id}</td>
                                <td className="px-4 py-3 text-slate-500">{order.date}</td>
                                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">${order.total.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right">
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                    order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                    order.status === 'Shipped' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          }
                          {orders.filter(o => o.customerEmail.toLowerCase() === selectedHistoryCustomer.email.toLowerCase()).length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-12 text-center text-slate-400 font-mono text-[10px] uppercase italic">
                                No purchase history found for this account.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Additional Info / Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-sans text-[10px] font-black uppercase text-slate-400 tracking-widest">Primary Contact & Shipping</h4>
                      <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                        {selectedHistoryCustomer.address}<br />
                        {selectedHistoryCustomer.city}<br />
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {selectedHistoryCustomer.phone}
                        </div>
                      </div>
                    </div>
                    {selectedHistoryCustomer.notes && (
                      <div className="space-y-2">
                        <h4 className="font-sans text-[10px] font-black uppercase text-slate-400 tracking-widest">Internal CRM Notes</h4>
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 italic leading-relaxed">
                          "{selectedHistoryCustomer.notes}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between gap-4">
                  <button 
                    onClick={() => {
                      startEditingCustomer(selectedHistoryCustomer);
                      setSelectedHistoryCustomer(null);
                    }}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl font-mono text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    Edit Profile
                  </button>
                  <button 
                    onClick={() => {/* Direct email logic */}}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-mono text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    Send Direct Email
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Customer Modal */}
          {editingCustomer && (
            <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto pt-10 pb-10">
              <div className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl rounded-3xl animate-scale-in border border-slate-200 dark:border-slate-800 my-auto">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                      <Edit3 className="h-5 w-5" />
                    </div>
                    <h3 className="font-sans text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Edit Customer Profile</h3>
                  </div>
                  <button 
                    onClick={() => setEditingCustomer(null)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleUpdateCustomerSubmit} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Customer Name</label>
                      <input 
                        type="text" 
                        required 
                        value={editingCustomer.name} 
                        onChange={e => setEditingCustomer({...editingCustomer, name: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Email Address (Primary Key)</label>
                      <input 
                        type="email" 
                        required 
                        value={editingCustomer.email} 
                        onChange={e => setEditingCustomer({...editingCustomer, email: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Phone Number</label>
                      <input 
                        type="text" 
                        value={editingCustomer.phone} 
                        onChange={e => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Customer Type</label>
                      <select 
                        value={editingCustomer.type} 
                        onChange={e => setEditingCustomer({...editingCustomer, type: e.target.value as 'Retail' | 'Wholesale'})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                      >
                        <option value="Retail">Retail</option>
                        <option value="Wholesale">Wholesale</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Street Address</label>
                      <input 
                        type="text" 
                        value={editingCustomer.address} 
                        onChange={e => setEditingCustomer({...editingCustomer, address: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">City / State / Postcode</label>
                      <input 
                        type="text" 
                        value={editingCustomer.city} 
                        onChange={e => setEditingCustomer({...editingCustomer, city: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {editingCustomer.type === 'Wholesale' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Company Name</label>
                        <input 
                          type="text" 
                          value={editingCustomer.company || ''} 
                          onChange={e => setEditingCustomer({...editingCustomer, company: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">ABN / Tax ID</label>
                        <input 
                          type="text" 
                          value={editingCustomer.abn || ''} 
                          onChange={e => setEditingCustomer({...editingCustomer, abn: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Reward Points</label>
                      <input 
                        type="number" 
                        value={editingCustomer.points} 
                        onChange={e => setEditingCustomer({...editingCustomer, points: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Wallet Balance ($)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={editingCustomer.walletBalance} 
                        onChange={e => setEditingCustomer({...editingCustomer, walletBalance: parseFloat(e.target.value) || 0})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">CRM Notes</label>
                    <textarea 
                      rows={3}
                      value={editingCustomer.notes} 
                      onChange={e => setEditingCustomer({...editingCustomer, notes: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all italic text-slate-900 dark:text-white"
                      placeholder="Add internal notes about this customer..."
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="submit" 
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-mono text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:translate-y-1 transition-all"
                    >
                      Update Customer Record
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditingCustomer(null)}
                      className="px-6 py-3 rounded-xl font-mono text-xs font-black uppercase border-2 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}



      {/* SEGMENTS TAB */}
      {activeTab === 'segments' && (
        <div className="space-y-6 text-left" id="admin-segments-view">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-sans text-xs font-black uppercase tracking-[0.2em] text-neutral-900 dark:text-neutral-100 mb-1">
                Customer Segments
              </h3>
              <p className="font-sans text-[10px] text-neutral-500 uppercase tracking-wider">
                Group customers based on behavioral criteria for targeted newsletter campaigns and discounts.
              </p>
            </div>
            <button
              onClick={() => setShowAddSegment(!showAddSegment)}
              className="flex items-center gap-1.5 rounded-none bg-neutral-955 dark:bg-neutral-100 px-4 py-2 font-sans text-[10px] uppercase tracking-widest font-bold text-white dark:text-neutral-950 hover:bg-neutral-800"
            >
              <PlusCircle className="h-4 w-4" /> Create Segment
            </button>
          </div>

          {showAddSegment && (
            <div className="rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-6 animate-fade-in max-w-2xl">
              <h5 className="font-sans text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100 mb-4">Define Customer Segment</h5>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newSegmentName || !newSegmentDesc) return;
                  const s: CustomerSegment = {
                    id: 'SEG-' + Math.floor(100 + Math.random() * 900),
                    name: newSegmentName,
                    description: newSegmentDesc,
                    criteria: newSegmentCriteria,
                    memberCount: Math.floor(1 + Math.random() * 8)
                  };
                  onAddSegment(s);
                  setShowAddSegment(false);
                  setNewSegmentName('');
                  setNewSegmentDesc('');
                  setNewSegmentCriteria('Spent > $150');
                }} 
                className="space-y-4"
              >
                <div>
                  <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">Segment Title</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Inactive Cart Abandoners"
                    value={newSegmentName}
                    onChange={(e) => setNewSegmentName(e.target.value)}
                    className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs uppercase outline-none text-neutral-900 focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">Behavioral Criteria Rules</label>
                  <select
                    value={newSegmentCriteria}
                    onChange={(e) => setNewSegmentCriteria(e.target.value)}
                    className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs outline-none text-neutral-900"
                  >
                    <option value="Spent > $150">Spent more than $150.00 total</option>
                    <option value="Orders = 0">Registered account with zero checkouts</option>
                    <option value="Purchased 2+ times">Repeat purchases (2+ checkout records)</option>
                    <option value="Cart abandoned">Items left in active bag</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">Marketing Purpose Description</label>
                  <textarea
                    rows={2}
                    placeholder="Targeting users who haven't finished purchase during summer sale..."
                    value={newSegmentDesc}
                    onChange={(e) => setNewSegmentDesc(e.target.value)}
                    className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs uppercase outline-none text-neutral-900 focus:border-neutral-900"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-none bg-neutral-955 dark:bg-neutral-100 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-white dark:text-neutral-950 hover:bg-neutral-800"
                  >
                    Activate Segment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddSegment(false)}
                    className="rounded-none border border-neutral-400 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-neutral-650"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {customerSegments.map((seg) => (
              <div key={seg.id} className="rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-[8px] uppercase font-bold tracking-widest text-neutral-400">{seg.id}</span>
                    <span className="font-mono text-[9px] uppercase tracking-widest bg-neutral-100 dark:bg-neutral-950 border border-neutral-400 dark:border-neutral-700 px-2.5 py-0.5 font-bold text-neutral-700 dark:text-neutral-300">
                      Rule: {seg.criteria}
                    </span>
                  </div>
                  <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 mb-1.5">{seg.name}</h4>
                  <p className="font-sans text-[10px] text-neutral-500 uppercase tracking-wide leading-relaxed">{seg.description}</p>
                </div>
                
                <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
                  <div className="font-sans text-[9px] uppercase tracking-widest text-neutral-450 font-bold">
                    Segment Density: <strong className="text-neutral-900 dark:text-neutral-100 font-extrabold font-mono">{seg.memberCount} Customers</strong>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Remove behavioral segment "${seg.name}"?`)) {
                        onDeleteSegment(seg.id);
                      }
                    }}
                    className="text-neutral-400 hover:text-rose-550 transition-colors p-1"
                    title="Delete segment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UPSELL RULES TAB */}
      {activeTab === 'upsells' && (
        <div className="space-y-6 text-left" id="admin-upsells-view">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-sans text-xs font-black uppercase tracking-[0.2em] text-neutral-900 dark:text-neutral-100 mb-1">
                Cross-Sell & Upsell Rules
              </h3>
              <p className="font-sans text-[10px] text-neutral-500 uppercase tracking-wider">
                Prompt complementary additions during checkout to boost your Average Order Value (AOV).
              </p>
            </div>
            <button
              onClick={() => setShowAddUpsell(!showAddUpsell)}
              className="flex items-center gap-1.5 rounded-none bg-neutral-955 dark:bg-neutral-100 px-4 py-2 font-sans text-[10px] uppercase tracking-widest font-bold text-white dark:text-neutral-950 hover:bg-neutral-800"
            >
              <PlusCircle className="h-4 w-4" /> Add Upsell Rule
            </button>
          </div>

          {showAddUpsell && (
            <div className="rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-6 animate-fade-in max-w-2xl">
              <h5 className="font-sans text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100 mb-4">New Cross-Sell Rule</h5>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newUpsellTrigger || !newUpsellOffer) return;
                  if (newUpsellTrigger === newUpsellOffer) {
                    alert('Trigger and Upsell products must be distinct!');
                    return;
                  }
                  const u: UpsellRule = {
                    id: 'UPS-' + Math.floor(100 + Math.random() * 900),
                    triggerProductId: newUpsellTrigger,
                    upsellProductId: newUpsellOffer,
                    discountPercent: parseFloat(newUpsellDiscount) || 10,
                    active: true
                  };
                  onAddUpsellRule(u);
                  setShowAddUpsell(false);
                }} 
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">When Customer Selects / Views</label>
                    <select
                      value={newUpsellTrigger}
                      onChange={(e) => setNewUpsellTrigger(e.target.value)}
                      className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs outline-none text-neutral-900"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">Recommend Complementary Product</label>
                    <select
                      value={newUpsellOffer}
                      onChange={(e) => setNewUpsellOffer(e.target.value)}
                      className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs outline-none text-neutral-900"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Discount Incentive Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="10"
                    value={newUpsellDiscount}
                    onChange={(e) => setNewUpsellDiscount(e.target.value)}
                    className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs outline-none text-neutral-900 focus:border-neutral-950"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-none bg-neutral-955 dark:bg-neutral-100 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-white dark:text-neutral-950 hover:bg-neutral-800"
                  >
                    Publish Rule
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddUpsell(false)}
                    className="rounded-none border border-neutral-400 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-neutral-650"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-neutral-400 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 font-bold">
                    <th className="px-6 py-4">Rule ID</th>
                    <th className="px-6 py-4">Trigger Catalog Item</th>
                    <th className="px-6 py-4">Upsell Recommended ITEM</th>
                    <th className="px-6 py-4">Promo Deal</th>
                    <th className="px-6 py-4 text-center">Rule State</th>
                    <th className="px-6 py-4 text-right pr-6">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-300 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {upsellRules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-neutral-400 uppercase tracking-widest font-mono text-[9px]">
                        No active cross-sell recommendations configured
                      </td>
                    </tr>
                  ) : (
                    upsellRules.map((r) => {
                      const triggerProd = products.find(p => p.id === r.triggerProductId);
                      const upsellProd = products.find(p => p.id === r.upsellProductId);
                      return (
                        <tr key={r.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                            {r.id}
                          </td>
                          <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                            {triggerProd ? triggerProd.name : `ITEM #${r.triggerProductId}`}
                          </td>
                          <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                            {upsellProd ? upsellProd.name : `ITEM #${r.upsellProductId}`}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {r.discountPercent}% OFF
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => onToggleUpsellRule(r.id)}
                              className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border transition-all ${
                                r.active 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-neutral-100 text-neutral-550 border-neutral-400 hover:bg-neutral-200'
                              }`}
                            >
                              {r.active ? '● Active' : '○ Paused'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right pr-6">
                            <button
                              onClick={() => onDeleteUpsellRule(r.id)}
                              className="text-neutral-400 hover:text-rose-550 transition-colors p-1"
                              title="Delete Upsell"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REVIEWS TAB */}
      {activeTab === 'reviews' && (
        <div className="space-y-6 text-left" id="admin-reviews-view">
          <div>
            <h3 className="font-sans text-xs font-black uppercase tracking-[0.2em] text-neutral-900 dark:text-neutral-100 mb-1">
              Feedback Moderation & Reviews
            </h3>
            <p className="font-sans text-[10px] text-neutral-500 uppercase tracking-wider">
              Monitor user reviews, filter spam, and review client satisfaction indices.
            </p>
          </div>

          <div className="border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-neutral-400 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 font-bold">
                    <th className="px-6 py-4">Review Details</th>
                    <th className="px-6 py-4">Target ITEM Item</th>
                    <th className="px-6 py-4">Score Index</th>
                    <th className="px-6 py-4">User Comment</th>
                    <th className="px-6 py-4 text-right pr-6">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-300 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 uppercase tracking-widest font-mono text-[9px]">
                        No catalog reviews registered yet.
                      </td>
                    </tr>
                  ) : (
                    reviews.map((rev) => {
                      const associatedProd = products.find(p => p.id === rev.productId);
                      return (
                        <tr key={rev.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-sans font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">{rev.userName}</div>
                            <div className="font-mono text-[9px] text-neutral-500 mt-1">{rev.date}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-sans font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider truncate max-w-[150px]">
                              {associatedProd ? associatedProd.name : `Product ITEM #${rev.productId}`}
                            </div>
                            <div className="font-mono text-[8px] text-neutral-700 dark:text-neutral-300">ID: {rev.productId}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 font-mono font-bold text-amber-500 text-[11px]">
                              <Star className="h-3.5 w-3.5 fill-amber-500" />
                              {rev.rating.toFixed(1)} / 5.0
                            </div>
                          </td>
                          <td className="px-6 py-4 font-sans text-neutral-600 dark:text-neutral-400 leading-relaxed text-[10px] max-w-xs break-words">
                            "{rev.comment}"
                          </td>
                          <td className="px-6 py-4 text-right pr-6">
                            <button
                              onClick={() => {
                                if (confirm(`Moderate and permanently delete this review?`)) {
                                  onDeleteReview(rev.id);
                                }
                              }}
                              className="px-3 py-1.5 border border-neutral-400 dark:border-neutral-700 text-rose-550 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-sans font-bold uppercase tracking-widest text-[9px] transition-colors"
                              title="Delete/moderate comment"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUPPLIERS TAB */}
      {activeTab === 'shipping' && (
        <div className="space-y-6 text-left" id="admin-shipping-view">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-sans text-xs font-black uppercase tracking-[0.2em] text-neutral-900 dark:text-neutral-100 mb-1">
                Global Order Shipment & Logistics Control
              </h3>
              <p className="font-sans text-[10px] text-neutral-500 uppercase tracking-wider">
                Assign premium logistics partners, print barcodes, manage packing lists, and update active tracking milestones.
              </p>
            </div>
            <button
              onClick={() => {
                // Pre-fill with the first available processing/pending order if none selected
                const unfulfilledOrder = orders.find(o => o.status === 'Pending' || o.status === 'Processing');
                if (unfulfilledOrder) {
                  setShipOrderId(unfulfilledOrder.id);
                  setShipDestination(`${unfulfilledOrder.customerAddress}, ${unfulfilledOrder.customerCity}`);
                  setShipCustName(unfulfilledOrder.customerName);
                }
                setShowAddShipment(!showAddShipment);
              }}
              className="flex items-center gap-1.5 rounded-none bg-neutral-955 dark:bg-neutral-100 px-4 py-2 font-sans text-[10px] uppercase tracking-widest font-bold text-white dark:text-neutral-950 hover:bg-neutral-800"
              id="add-shipment-toggle-btn"
            >
              <PlusCircle className="h-4 w-4" /> 
              <span>{showAddShipment ? 'Close Dispatch Form' : 'Dispatch New Shipment'}</span>
            </button>
          </div>

          {/* Shipping Metrics Scorecard */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" id="shipping-metrics-scorecard">
            <div className="border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-none">
              <span className="font-mono text-[8px] uppercase font-bold tracking-widest text-neutral-700 dark:text-neutral-300 block">Total Dispatches</span>
              <div className="font-mono text-base font-bold text-neutral-950 dark:text-neutral-50 mt-1">
                {shipments.length} Shipments
              </div>
              <span className="font-sans text-[8px] uppercase text-neutral-700 dark:text-neutral-300 font-bold block mt-1">Sourced from warehouse</span>
            </div>

            <div className="border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-none">
              <span className="font-mono text-[8px] uppercase font-bold tracking-widest text-neutral-700 dark:text-neutral-300 block">Pending Pickup</span>
              <div className="font-mono text-base font-bold text-amber-500 mt-1">
                {shipments.filter(s => s.status === 'Label Created' || s.status === 'Package Received').length} Packages
              </div>
              <span className="font-sans text-[8px] uppercase text-neutral-700 dark:text-neutral-300 font-bold block mt-1">Awaiting carrier transit</span>
            </div>

            <div className="border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-none">
              <span className="font-mono text-[8px] uppercase font-bold tracking-widest text-neutral-700 dark:text-neutral-300 block">Active In-Transit</span>
              <div className="font-mono text-base font-bold text-blue-550 dark:text-blue-400 mt-1">
                {shipments.filter(s => s.status === 'In Transit' || s.status === 'Out for Delivery').length} Shipments
              </div>
              <span className="font-sans text-[8px] uppercase text-neutral-700 dark:text-neutral-300 font-bold block mt-1">Real-time GPS updates active</span>
            </div>

            <div className="border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-none">
              <span className="font-mono text-[8px] uppercase font-bold tracking-widest text-neutral-700 dark:text-neutral-300 block">Successfully Delivered</span>
              <div className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {shipments.filter(s => s.status === 'Delivered').length} Packages
              </div>
              <span className="font-sans text-[8px] uppercase text-emerald-400 dark:text-emerald-500 font-bold block mt-1">100% SLA fulfillment rate</span>
            </div>
          </div>

          {/* Add Shipment Form */}
          {showAddShipment && (
            <div className="rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-6 animate-fade-in" id="shipment-generator-form">
              <h5 className="font-sans text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100 mb-4">
                Verify Address & Generate Logistics Shipment
              </h5>
              <form onSubmit={handleCreateShipmentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Select Order */}
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Target Customer Order ID</label>
                    <select
                      value={shipOrderId}
                      required
                      onChange={e => {
                        const orderId = e.target.value;
                        setShipOrderId(orderId);
                        const matched = orders.find(o => o.id === orderId);
                        if (matched) {
                          setShipDestination(`${matched.customerAddress}, ${matched.customerCity}`);
                          setShipCustName(matched.customerName);
                        }
                      }}
                      className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs outline-none text-neutral-900 focus:border-neutral-900"
                    >
                      <option value="">-- SELECT ACTIVE ORDER --</option>
                      {orders.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.id} - {o.customerName} (${o.total.toFixed(2)} - Status: {o.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Customer Name */}
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Recipient Customer Name</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. Marcus Aurelius"
                      value={shipCustName}
                      onChange={e => setShipCustName(e.target.value)}
                      className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs outline-none text-neutral-900 focus:border-neutral-900"
                    />
                  </div>

                  {/* Destination */}
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Delivery Destination Address</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. 128 Rome Ave, Los Angeles, CA 90012"
                      value={shipDestination}
                      onChange={e => setShipDestination(e.target.value)}
                      className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs outline-none text-neutral-900 focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Carrier */}
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Logistics Carrier Partner</label>
                    <select
                      value={shipCarrier}
                      onChange={e => setShipCarrier(e.target.value as any)}
                      className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs outline-none text-neutral-900"
                    >
                      <option value="FedEx">FedEx Corp</option>
                      <option value="DHL Express">DHL Express Global</option>
                      <option value="USPS">USPS First-Class</option>
                      <option value="UPS">UPS Worldwide</option>
                    </select>
                  </div>

                  {/* Shipping Method */}
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Dispatch Priority Speed</label>
                    <select
                      value={shipMethod}
                      onChange={e => {
                        const method = e.target.value as any;
                        setShipMethod(method);
                        // Autofill appropriate cost estimates
                        if (method === 'Overnight') setShipCost('35.00');
                        else if (method === 'Express') setShipCost('15.50');
                        else setShipCost('8.50');
                      }}
                      className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs outline-none text-neutral-900"
                    >
                      <option value="Standard">Standard Delivery (3-5 days)</option>
                      <option value="Express">Express Air (2 days)</option>
                      <option value="Overnight">Next-Day Overnight</option>
                    </select>
                  </div>

                  {/* Shipping Cost */}
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Calculated Rate / Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={shipCost}
                      onChange={e => setShipCost(e.target.value)}
                      className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-mono text-xs outline-none text-neutral-900 focus:border-neutral-900"
                    />
                  </div>

                  {/* Package Weight */}
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Physical Package Weight (KG)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={shipWeight}
                      onChange={e => setShipWeight(e.target.value)}
                      className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-mono text-xs outline-none text-neutral-900 focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Dimensions */}
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Package Length (Inches)</label>
                    <input
                      type="number"
                      required
                      value={shipDimLength}
                      onChange={e => setShipDimLength(e.target.value)}
                      className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-mono text-xs outline-none text-neutral-900 focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Package Width (Inches)</label>
                    <input
                      type="number"
                      required
                      value={shipDimWidth}
                      onChange={e => setShipDimWidth(e.target.value)}
                      className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-mono text-xs outline-none text-neutral-900 focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Package Height (Inches)</label>
                    <input
                      type="number"
                      required
                      value={shipDimHeight}
                      onChange={e => setShipDimHeight(e.target.value)}
                      className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-mono text-xs outline-none text-neutral-900 focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="rounded-none bg-neutral-955 dark:bg-neutral-100 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-white dark:text-neutral-950 hover:bg-neutral-800"
                    id="submit-shipment-btn"
                  >
                    Generate Air Waybill & Dispatch
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddShipment(false)}
                    className="rounded-none border border-neutral-400 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-neutral-650"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filters and Directories Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Shipments Directory (7 columns) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="SEARCH TRACKING # / ORDER / CUSTOMER..."
                    value={shippingSearchQuery}
                    onChange={e => setShippingSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-955 rounded-none font-mono text-[9px] uppercase tracking-wider outline-none text-neutral-950 focus:border-neutral-900"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={shippingCarrierFilter}
                    onChange={e => setShippingCarrierFilter(e.target.value)}
                    className="rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-955 p-2 font-mono text-[9px] uppercase tracking-wider outline-none text-neutral-900"
                  >
                    <option value="All">All Carriers</option>
                    <option value="FedEx">FedEx</option>
                    <option value="DHL Express">DHL Express</option>
                    <option value="USPS">USPS</option>
                    <option value="UPS">UPS</option>
                  </select>
                  <select
                    value={shippingStatusFilter}
                    onChange={e => setShippingStatusFilter(e.target.value)}
                    className="rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-955 p-2 font-mono text-[9px] uppercase tracking-wider outline-none text-neutral-900"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Label Created">Label Created</option>
                    <option value="Package Received">Package Received</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Returned">Returned</option>
                  </select>
                </div>
              </div>

              {/* Shipments List cards */}
              <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                {shipments.filter(s => {
                  const matchSearch = s.trackingNumber.toLowerCase().includes(shippingSearchQuery.toLowerCase()) || 
                                      s.customerName.toLowerCase().includes(shippingSearchQuery.toLowerCase()) ||
                                      s.orderId.toLowerCase().includes(shippingSearchQuery.toLowerCase());
                  const matchCarrier = shippingCarrierFilter === 'All' || s.carrier === shippingCarrierFilter;
                  const matchStatus = shippingStatusFilter === 'All' || s.status === shippingStatusFilter;
                  return matchSearch && matchCarrier && matchStatus;
                }).length === 0 ? (
                  <div className="border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-12 text-center text-neutral-400 uppercase tracking-widest font-mono text-[9px]">
                    <Truck className="h-6 w-6 mx-auto mb-2 opacity-40" />
                    No shipments found matching your search.
                  </div>
                ) : (
                  shipments.filter(s => {
                    const matchSearch = s.trackingNumber.toLowerCase().includes(shippingSearchQuery.toLowerCase()) || 
                                        s.customerName.toLowerCase().includes(shippingSearchQuery.toLowerCase()) ||
                                        s.orderId.toLowerCase().includes(shippingSearchQuery.toLowerCase());
                    const matchCarrier = shippingCarrierFilter === 'All' || s.carrier === shippingCarrierFilter;
                    const matchStatus = shippingStatusFilter === 'All' || s.status === shippingStatusFilter;
                    return matchSearch && matchCarrier && matchStatus;
                  }).map((ship, idx) => (
                    <div 
                      key={`${ship.id}-${idx}`} 
                      className={`border p-5 shadow-sm space-y-4 rounded-none text-left transition-all cursor-pointer ${
                        selectedShipment?.id === ship.id 
                          ? 'border-neutral-950 dark:border-neutral-100 bg-neutral-50/50 dark:bg-neutral-955/20' 
                          : 'border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-400'
                      }`}
                      onClick={() => setSelectedShipment(ship)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-neutral-100 dark:border-neutral-850 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-mono text-xs font-black uppercase tracking-wider text-neutral-950 dark:text-neutral-50">{ship.carrier.toUpperCase()} AIR WAYBILL</h4>
                            <span className={`px-2 py-0.5 rounded-none text-[8px] font-bold uppercase tracking-widest border ${
                              ship.status === 'Delivered' 
                                ? 'bg-emerald-50 text-emerald-750 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400' :
                              ship.status === 'In Transit' || ship.status === 'Out for Delivery'
                                ? 'bg-blue-50 text-blue-750 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400' :
                              ship.status === 'Package Received'
                                ? 'bg-amber-50 text-amber-750 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400'
                                : 'bg-neutral-100 text-neutral-450 border-neutral-400 dark:bg-neutral-950 dark:text-neutral-500'
                            }`}>
                              {ship.status}
                            </span>
                          </div>
                          <span className="font-mono text-[9px] font-bold text-neutral-500 mt-1 block">TRACKING: {ship.trackingNumber}</span>
                        </div>
                        <div className="flex gap-1.5 self-end sm:self-auto font-mono text-[8px] uppercase font-bold tracking-widest" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedShipment(ship)}
                            className="border border-neutral-400 dark:border-neutral-700 hover:border-neutral-950 p-1.5 text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-250 transition-all cursor-pointer"
                            title="Inspect & Generate Packing Label"
                          >
                            <Barcode className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteShipment(ship.id)}
                            className="border border-neutral-400 dark:border-neutral-700 hover:border-rose-550 p-1.5 text-neutral-400 hover:text-rose-600 transition-all cursor-pointer"
                            title="Delete Dispatch Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Shipment Meta Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                        {/* Recipient Details */}
                        <div className="space-y-1.5">
                          <span className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block font-bold">RECIPIENT & ROUTING</span>
                          <div className="font-sans text-[10px] text-neutral-800 dark:text-neutral-200 font-bold uppercase tracking-wider">
                            {ship.customerName}
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] text-neutral-500 uppercase tracking-wider">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate" title={ship.destination}>{ship.destination}</span>
                          </div>
                          <div className="font-mono text-[8px] text-neutral-400 uppercase tracking-wider mt-1">
                            LINKED ORDER: <strong className="text-neutral-900 dark:text-white">{ship.orderId}</strong>
                          </div>
                        </div>

                        {/* Dimensions and Costs */}
                        <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-neutral-100 dark:border-neutral-700 pt-2.5 sm:pt-0 sm:pl-4">
                          <span className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block font-bold">LOGISTICS SPECIFICATION</span>
                          <div className="font-mono text-[9px] uppercase tracking-wider font-bold text-neutral-700 dark:text-neutral-300">
                            SHIPPING SPEED: <span className="text-neutral-950 dark:text-white font-extrabold">{ship.shippingMethod.toUpperCase()}</span>
                          </div>
                          <div className="font-mono text-[9px] uppercase tracking-wider font-bold text-neutral-500">
                            DIM: <span className="text-neutral-950 dark:text-white">{ship.dimensions.length}x{ship.dimensions.width}x{ship.dimensions.height} IN</span> | WEIGHT: <span className="text-neutral-950 dark:text-white">{ship.weightKg} KG</span>
                          </div>
                          <div className="font-mono text-[9px] uppercase tracking-wider font-bold text-neutral-500">
                            FREIGHT COST: <span className="text-neutral-950 dark:text-white">${ship.shippingCost.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Milestone State Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 dark:border-neutral-700 pt-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 font-mono text-[8px] text-neutral-400 uppercase tracking-wider">
                          <Clock className="h-3 w-3" />
                          <span>SHIPPED: {ship.shipDate} | EST DELIVERY: {ship.estimatedDeliveryDate}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[8px] uppercase tracking-wider text-neutral-400 font-extrabold mr-1">PIPELINE:</span>
                          <select
                            value={ship.status}
                            onChange={e => handleUpdateShipmentStatus(ship.id, e.target.value as any)}
                            className="rounded-none border border-neutral-400 dark:border-neutral-750 bg-neutral-200 dark:bg-neutral-800 px-2 py-1 font-mono text-[8px] uppercase tracking-widest outline-none text-neutral-900 cursor-pointer hover:border-neutral-950"
                          >
                            <option value="Label Created">Label Created</option>
                            <option value="Package Received">Package Received</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered (Sync Order)</option>
                            <option value="Returned">Returned</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Live Visual Packing Label Preview (5 columns) */}
            <div className="lg:col-span-5 space-y-6">
              
              {!selectedShipment ? (
                <div className="border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-12 text-center rounded-none shadow-sm h-full flex flex-col justify-center items-center">
                  <Barcode className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mb-3" />
                  <h4 className="font-sans text-xs font-black uppercase tracking-wider text-neutral-950 dark:text-neutral-50 mb-1">
                    No Air Waybill Selected
                  </h4>
                  <p className="font-sans text-[10px] text-neutral-700 dark:text-neutral-300 uppercase tracking-wider max-w-xs leading-relaxed">
                    Click any shipment track card on the left to inspect its physical shipping manifest, calculate item weights, and render a high-fidelity printable logistics barcode label.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Physical shipping label container */}
                  <div className="border-4 border-black bg-white p-5 text-black space-y-4 rounded-none select-none relative shadow-md animate-fade-in" id="printable-shipping-label-preview">
                    
                    {/* Top stamp and priority bar */}
                    <div className="flex justify-between items-center border-b-4 border-black pb-3">
                      <div className="font-sans text-xl font-black uppercase tracking-tighter leading-none">
                        {selectedShipment.carrier === 'FedEx' ? 'FedEx Ground' :
                         selectedShipment.carrier === 'DHL Express' ? 'DHL Express' :
                         selectedShipment.carrier === 'UPS' ? 'UPS Next Day' : 'USPS Priority'}
                      </div>
                      <div className="border-4 border-black bg-black text-white px-3 py-1 font-sans text-base font-black uppercase tracking-widest">
                        {selectedShipment.shippingMethod === 'Overnight' ? 'PRIORITY 1' :
                         selectedShipment.shippingMethod === 'Express' ? 'EXPEDITE' : 'STANDARD'}
                      </div>
                    </div>

                    {/* Ship From / Ship To Grid */}
                    <div className="grid grid-cols-1 gap-4 text-[10px] uppercase font-mono border-b-2 border-black pb-4">
                      <div>
                        <strong className="block font-black text-[8px] text-neutral-500">SHIP FROM:</strong>
                        <div className="font-bold leading-tight">VELOCE CORE WAREHOUSE</div>
                        <div className="text-neutral-700 leading-tight">88 INDUSTRIAL WAY, SUITE B</div>
                        <div className="text-neutral-700 leading-tight">SAN JOSE, CA 95112</div>
                      </div>
                      <div>
                        <strong className="block font-black text-[8px] text-neutral-500">SHIP TO (DELIVERY ADDRESS):</strong>
                        <div className="font-bold text-[11px] leading-tight text-black">{selectedShipment.customerName.toUpperCase()}</div>
                        <div className="text-neutral-800 font-medium leading-tight whitespace-pre-wrap">{selectedShipment.destination.toUpperCase()}</div>
                      </div>
                    </div>

                    {/* Specifications weights and dimensions bar */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono border-b-4 border-black pb-3">
                      <div className="border-r border-black/30">
                        <strong className="block text-[8px] text-neutral-500 font-extrabold">WEIGHT</strong>
                        <span className="font-black text-xs text-black">{selectedShipment.weightKg} KG</span>
                      </div>
                      <div className="border-r border-black/30">
                        <strong className="block text-[8px] text-neutral-500 font-extrabold">DIMENSIONS</strong>
                        <span className="font-black text-xs text-black">{selectedShipment.dimensions.length}x{selectedShipment.dimensions.width}x{selectedShipment.dimensions.height} IN</span>
                      </div>
                      <div>
                        <strong className="block text-[8px] text-neutral-500 font-extrabold">DISPATCH DATE</strong>
                        <span className="font-black text-xs text-black">{selectedShipment.shipDate}</span>
                      </div>
                    </div>

                    {/* Barcode block */}
                    <div className="border-t-2 border-b-2 border-black py-3 flex flex-col items-center justify-center font-mono">
                      {/* High-fidelity barcode lines */}
                      <div className="flex items-stretch h-14 w-full gap-[2px] bg-white px-2">
                        {[4, 1, 3, 1, 5, 8, 2, 6, 2, 3, 5, 8, 4, 7, 9, 3, 2, 4, 8, 4, 6, 2, 3, 1, 5, 7, 2, 4, 3, 2, 5, 1, 4, 9, 2].map((w, i) => (
                          <div 
                            key={i} 
                            className="bg-black flex-1" 
                            style={{ 
                              height: '100%',
                              opacity: i % 7 === 0 ? 0.3 : 1
                            }} 
                          />
                        ))}
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.2em] font-black text-black mt-2">{selectedShipment.trackingNumber}</span>
                    </div>

                    {/* Footer manifest layout info */}
                    <div className="flex justify-between items-center text-[8px] font-mono uppercase tracking-wider text-neutral-500 pt-1">
                      <span>Ref ID: {selectedShipment.id}</span>
                      <span>Order linked: {selectedShipment.orderId}</span>
                      <span>Status Code: {selectedShipment.status.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Print and Trigger Action */}
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => {
                        const printContent = document.getElementById('printable-shipping-label-preview')?.outerHTML;
                        if (!printContent) return;
                        
                        const fullHtml = `
                          <html>
                            <head>
                              <title>Shipping Label - ${selectedShipment.trackingNumber}</title>
                              <style>
                                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Inter:wght@400;700;900&display=swap');
                                body { 
                                  font-family: 'Inter', sans-serif; 
                                  padding: 20px; 
                                  background: white; 
                                  color: black;
                                  display: flex;
                                  justify-content: center;
                                  align-items: center;
                                }
                                #printable-shipping-label-preview {
                                  width: 420px;
                                  border: 4px solid black;
                                  padding: 24px;
                                }
                                .font-mono { font-family: 'JetBrains Mono', monospace; }
                                .font-sans { font-family: 'Inter', sans-serif; }
                                .font-black { font-weight: 900; }
                                .font-bold { font-weight: 700; }
                                .border-b-4 { border-bottom: 4px solid black; }
                                .border-b-2 { border-bottom: 2px solid black; }
                                .border-t-2 { border-top: 2px solid black; }
                                .pb-3 { padding-bottom: 12px; }
                                .pb-4 { padding-bottom: 16px; }
                                .pt-1 { padding-top: 4px; }
                                .py-3 { padding-top: 12px; padding-bottom: 12px; }
                                .flex { display: flex; }
                                .justify-between { justify-content: space-between; }
                                .items-center { align-items: center; }
                                .grid { display: grid; }
                                .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                                .gap-4 { gap: 16px; }
                                .gap-2 { gap: 8px; }
                                .text-center { text-align: center; }
                                .text-neutral-500 { color: #6b7280; }
                                .text-neutral-700 { color: #374151; }
                                .text-xs { font-size: 12px; }
                                .text-xl { font-size: 20px; }
                                .font-extrabold { font-weight: 800; }
                                .tracking-tighter { letter-spacing: -0.05em; }
                                .tracking-widest { letter-spacing: 0.1em; }
                                .tracking-wider { letter-spacing: 0.05em; }
                                .bg-black { background-color: black; }
                                .text-white { color: white; }
                                .px-3 { padding-left: 12px; padding-right: 12px; }
                                .py-1 { padding-top: 4px; padding-bottom: 4px; }
                                .leading-none { line-height: 1; }
                                .leading-tight { line-height: 1.25; }
                                .h-14 { height: 56px; }
                                .w-full { width: 100%; }
                                .bg-white { background-color: white; }
                                .px-2 { padding-left: 8px; padding-right: 8px; }
                                .mt-2 { margin-top: 8px; }
                                .border-r { border-right: 1px solid black; }
                              </style>
                            </head>
                            <body>
                              ${printContent}
                            </body>
                          </html>
                        `;

                        printHtmlContent(fullHtml);
                      }}
                      className="flex-1 rounded-none bg-neutral-950 dark:bg-neutral-100 text-white dark:text-neutral-950 py-2.5 font-sans text-[10px] uppercase tracking-widest font-black hover:bg-neutral-800 transition-colors cursor-pointer text-center"
                    >
                      Print Shipping Label
                    </button>
                    <button
                      onClick={() => {
                        const linkedOrder = orders.find(o => o.id === selectedShipment.orderId);
                        if (!linkedOrder) {
                          alert('Linked customer order details are not available.');
                          return;
                        }
                        
                        alert(`MANIFEST DETAILS:\nRecipient: ${selectedShipment.customerName}\nOrder Total: $${linkedOrder.total.toFixed(2)}\nItems:\n${linkedOrder.items.map(item => `- ${item.name} (Qty: ${item.quantity})`).join('\n')}`);
                      }}
                      className="rounded-none border border-neutral-400 dark:border-neutral-700 hover:border-neutral-950 px-4 py-2.5 font-sans text-[10px] uppercase tracking-widest font-black transition-colors"
                    >
                      Inspect Packing Slip
                    </button>
                  </div>

                  {/* Packing manifest list for selected order */}
                  <div className="border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 rounded-none text-left shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-700 pb-2.5">
                      <FileSpreadsheet className="h-4 w-4 text-neutral-400" />
                      <h4 className="font-sans text-xs font-black uppercase tracking-wider text-neutral-955 dark:text-neutral-50">
                        Linked Order Packing List Manifest
                      </h4>
                    </div>

                    {(() => {
                      const linkedOrder = orders.find(o => o.id === selectedShipment.orderId);
                      if (!linkedOrder) {
                        return (
                          <div className="p-4 text-center text-rose-550 font-mono text-[9px] uppercase tracking-widest border border-dashed border-rose-200">
                            Warning: Linked customer order (${selectedShipment.orderId}) not found in active catalog.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          <div className="flex justify-between text-[10px] font-mono text-neutral-400 uppercase tracking-wider border-b border-dashed border-neutral-150 dark:border-neutral-850 pb-2">
                            <span>Order Date: {linkedOrder.date}</span>
                            <span>Payment: {linkedOrder.paymentMethod}</span>
                          </div>

                          <div className="divide-y divide-neutral-300 dark:divide-neutral-700">
                            {linkedOrder.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between py-2 text-xs">
                                <div className="flex items-center gap-3">
                                  {item.image && (
                                    <img 
                                      src={item.image} 
                                      alt={item.name} 
                                      referrerPolicy="no-referrer"
                                      className="h-8 w-8 object-cover rounded-none bg-neutral-100" 
                                    />
                                  )}
                                  <div>
                                    <div className="font-sans font-bold text-neutral-850 dark:text-neutral-200 uppercase tracking-wide">{item.name}</div>
                                    <div className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest">
                                      {item.color && `Color: ${item.color}`} {item.size && ` | Size: ${item.size}`}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right font-mono text-[10px]">
                                  <div className="font-bold text-neutral-800 dark:text-neutral-200">QTY: {item.quantity}</div>
                                  <div className="text-neutral-400">${item.price.toFixed(2)} ea</div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Shipment Audit Trail Timeline */}
                          <div className="space-y-3 pt-3 border-t border-neutral-150 dark:border-neutral-700">
                            <span className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block font-bold">SHIPMENT MILESTONE HISTORY</span>
                            <div className="relative border-l-2 border-neutral-400 dark:border-neutral-700 ml-2.5 pl-4 space-y-4 text-xs">
                              {selectedShipment.history.map((hist, idx) => (
                                <div key={idx} className="relative">
                                  {/* Dot */}
                                  <div className={`absolute -left-[23px] top-1 h-2.5 w-2.5 rounded-full border-2 bg-white dark:bg-neutral-900 ${
                                    idx === 0 ? 'border-neutral-950 dark:border-white scale-125' : 'border-neutral-350'
                                  }`} />
                                  <div className="flex justify-between items-baseline">
                                    <div className={`font-mono text-[9px] uppercase tracking-wider font-extrabold ${
                                      idx === 0 ? 'text-neutral-950 dark:text-white' : 'text-neutral-500'
                                    }`}>
                                      {hist.status}
                                    </div>
                                    <span className="font-mono text-[8px] text-neutral-400">{hist.timestamp}</span>
                                  </div>
                                  <div className="font-sans text-[10px] text-neutral-500 mt-0.5 leading-tight">{hist.note}</div>
                                  <div className="font-mono text-[8px] text-neutral-400 uppercase mt-0.5">{hist.location}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* REPAIR JOBS TAB */}
      {activeTab === 'repairs' && (
        <div className="space-y-6" id="dashboard-tab-repairs">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-black text-lg uppercase tracking-widest text-neutral-900">Service & Repair Jobs</h2>
              <p className="text-xs text-neutral-500">Manage all customer repair tickets, job cards, and technician workflow</p>
            </div>
          </div>
          <RepairJobsManager
            repairJobs={repairJobs}
            onAddRepairJob={onAddRepairJob || (() => {})}
            onUpdateRepairJob={onUpdateRepairJob || (() => {})}
            onDeleteRepairJob={onDeleteRepairJob || (() => {})}
            products={products}
            customers={customers}
            storeSettings={storeSettings}
            onShowAlert={onShowAlert}
            onDeductPartsFromStock={onDeductPartsFromStock}
          />
        </div>
      )}

      {/* PURCHASE ORDERS TAB */}
      {activeTab === 'purchase-orders' && (
        <div className="space-y-6" id="dashboard-tab-purchase-orders">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-black text-lg uppercase tracking-widest text-neutral-900">Purchase Orders & GRN</h2>
              <p className="text-xs text-neutral-500">Raise purchase orders, track deliveries, and reconcile supplier invoices</p>
            </div>
          </div>
          <PurchaseOrdersManager
            purchaseOrders={purchaseOrders}
            onAddPurchaseOrder={onAddPurchaseOrder || (() => {})}
            onUpdatePurchaseOrder={onUpdatePurchaseOrder || (() => {})}
            onDeletePurchaseOrder={onDeletePurchaseOrder || (() => {})}
            onReceiveGRN={onReceiveGRN || (() => {})}
            products={products}
            suppliers={suppliers}
            storeSettings={storeSettings}
            onShowAlert={onShowAlert}
          />
        </div>
      )}

      {/* STOCK UNITS TAB */}
      {activeTab === 'stock-units' && (
        <div className="space-y-6" id="dashboard-tab-stock-units">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg">
              <Barcode className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-black text-lg uppercase tracking-widest text-neutral-900">Stock Unit Tracker</h2>
              <p className="text-xs text-neutral-500">Full serialized unit lifecycle — from receipt to sale, repair, and write-off</p>
            </div>
          </div>
          <StockUnitsManager
            stockUnits={stockUnits}
            onAddStockUnit={onAddStockUnit || (() => {})}
            onUpdateStockUnit={onUpdateStockUnit || (() => {})}
            products={products}
            onShowAlert={onShowAlert}
          />
        </div>
      )}

      {/* FINANCE MANAGER MODULE */}
      {activeTab === 'finance' && (
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm">
          <h2 className="text-lg font-black uppercase tracking-wider text-neutral-900 dark:text-neutral-100 mb-4">Finance Manager</h2>
          <Suspense fallback={<div className="py-10 text-center font-mono text-xs uppercase tracking-[0.25em] text-slate-500">Loading Finance Module</div>}>
            <FinanceManager 
              transactions={financeTransactions} 
              onAddTransaction={onAddTransaction} 
              onDeleteTransaction={onDeleteTransaction}
            />
          </Suspense>
        </div>
      )}

      {/* USER MANAGEMENT MODULE */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm">
          <h2 className="text-lg font-black uppercase tracking-wider text-neutral-900 dark:text-neutral-100 mb-4">User Management</h2>
          <Suspense fallback={<div className="py-10 text-center font-mono text-xs uppercase tracking-[0.25em] text-slate-500">Loading User Module</div>}>
            <UserManager 
              users={users} 
              onAddUser={onAddUser} 
              onDeleteUser={onDeleteUser}
            />
          </Suspense>
        </div>
      )}

      {/* POS TERMINAL MODULE */}
      {activeTab === 'pos' && (() => {
        const filteredPOSProducts = products.filter(p => {
          const matchesSearch = p.name.toLowerCase().includes(posSearchQuery.toLowerCase()) || 
                                p.id.toLowerCase().includes(posSearchQuery.toLowerCase()) ||
                                p.category.toLowerCase().includes(posSearchQuery.toLowerCase());
          const matchesCategory = posCategoryFilter === 'All' || p.category === posCategoryFilter;
          return matchesSearch && matchesCategory;
        });

        // CALCULATE SUMMARY DETAILS
        const posSubtotal = posCart.reduce((sum, item) => {
          const price = item.customPrice !== undefined ? item.customPrice : (item.product.discountPrice || item.product.price);
          const discount = item.discountPercent ? (price * item.discountPercent / 100) : 0;
          return sum + ((price - discount) * item.quantity);
        }, 0);

        let posDiscount = 0;
        if (posAppliedCoupon) {
          if (posAppliedCoupon.type === 'percent') {
            posDiscount = posSubtotal * (posAppliedCoupon.value / 100);
          } else {
            posDiscount = posAppliedCoupon.value;
          }
        } else if (posManualDiscount) {
          const pDisc = parseFloat(posManualDiscount) || 0;
          posDiscount = posSubtotal * (pDisc / 100);
        }
        posDiscount = Math.min(posSubtotal, posDiscount);

        const posTax = (posSubtotal - posDiscount) * 0.0825;
        const posShipping = posIsDelivery ? 15.00 : 0;
        const posTotal = posSubtotal - posDiscount + posTax + posShipping;

        const handleRegisterPosCustomer = (e: React.FormEvent) => {
          e.preventDefault();
          const trimmedName = newPosCustName.trim();
          const normalizedEmail = newPosCustEmail.toLowerCase().trim();

          if (!trimmedName || !normalizedEmail) {
            alert('Please provide customer name and email.');
            return;
          }
          if (customers.some(c => c.email.toLowerCase() === normalizedEmail)) {
            alert('A customer with this email is already registered.');
            return;
          }

          const newCustomer: CustomerProfile = {
            id: 'CUST-POS-' + Date.now(),
            name: trimmedName,
            email: normalizedEmail,
            phone: newPosCustPhone.trim(),
            address: newPosCustAddress.trim() || 'In-store POS customer',
            city: newPosCustCity.trim() || 'Point of Sale',
            type: 'Retail',
            registrationDate: new Date().toISOString().split('T')[0],
            walletBalance: 0,
            points: 10,
            wishlist: []
          };

          onAddCustomer(newCustomer);
          setPosSelectedCustomerEmail(newCustomer.email);
          setShowAddPosCustomer(false);
          onShowAlert?.(`POS customer ${newCustomer.name} registered.`, 'success');
          
          setNewPosCustName('');
          setNewPosCustEmail('');
          setNewPosCustPhone('');
          setNewPosCustAddress('');
          setNewPosCustCity('');
        };

        const handlePOSCheckout = () => {
          if (posCart.length === 0) {
            alert('POS Cart is empty! Add products first.');
            return;
          }

          const activeCustomer = posCustomers.find(c => c.email === posSelectedCustomerEmail) || posCustomers[0];

          if (posPaymentMethod === 'Wallet') {
            if (!activeCustomer.isRegistered) {
              alert('Wallet checkout is only available for registered customers.');
              return;
            }
            if (activeCustomer.walletBalance < posTotal) {
              alert(`Insufficient wallet funds. Available balance is $${activeCustomer.walletBalance.toFixed(2)}.`);
              return;
            }
          }

          const totalToPay = posTotal;
          if (posPaymentMethod === 'Cash') {
            const cashVal = parseFloat(posCashReceived) || 0;
            if (cashVal < totalToPay) {
              alert(`Insufficient Cash! Amount received ($${cashVal.toFixed(2)}) is less than total due ($${totalToPay.toFixed(2)}).`);
              return;
            }
          }

          const orderId = 'ORD-POS-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);

          const performCheckoutFinalization = () => {
            const newOrder: Order = {
              id: orderId,
              items: posCart.map(item => ({
                productId: item.product.id,
                name: item.product.name,
                price: item.customPrice !== undefined ? item.customPrice : (item.product.discountPrice || item.product.price),
                quantity: item.quantity,
                color: item.color || 'Default',
                size: item.size || 'One Size',
                image: item.product.image
              })),
              subtotal: posSubtotal,
              tax: posTax,
              shipping: posShipping,
              discount: posDiscount,
              total: posTotal,
              status: 'Delivered',
              customerName: activeCustomer.name,
              customerEmail: activeCustomer.email,
              customerAddress: activeCustomer.address,
              customerCity: activeCustomer.city,
              customerPhone: activeCustomer.phone || undefined,
              date: new Date().toISOString().split('T')[0],
              paymentMethod: posPaymentMethod
            };

            const calculatedCogs = posCart.reduce((sum, item) => {
              const costPrice = item.product.costPrice || (item.product.price * 0.6);
              return sum + (costPrice * item.quantity);
            }, 0);

            const transactionsToAdd: FinanceTransaction[] = [
              {
                id: 'TX-SALES-' + Math.floor(10000 + Math.random() * 90000),
                date: new Date().toISOString().split('T')[0],
                type: 'Income',
                category: 'Sales',
                amount: parseFloat((posSubtotal + posTax).toFixed(2)),
                description: `Terminal sales receipt checkout ref: ${orderId}`,
                reference: orderId
              }
            ];

            if (posDiscount > 0) {
              transactionsToAdd.push({
                id: 'TX-DISC-' + Math.floor(10000 + Math.random() * 90000),
                date: new Date().toISOString().split('T')[0],
                type: 'Expense',
                category: 'Discounts Given',
                amount: parseFloat(posDiscount.toFixed(2)),
                description: `Coupon markdown discount ref: ${orderId}`,
                reference: orderId
              });
            }

            if (posShipping > 0) {
              transactionsToAdd.push({
                id: 'TX-SHIP-' + Math.floor(10000 + Math.random() * 90000),
                date: new Date().toISOString().split('T')[0],
                type: 'Income',
                category: 'Shipping Collected',
                amount: parseFloat(posShipping.toFixed(2)),
                description: `Shipping surcharge ref: ${orderId}`,
                reference: orderId
              });
            }

            // Record Cost of Goods Sold (COGS) as an Expense:
            if (calculatedCogs > 0) {
              transactionsToAdd.push({
                id: 'TX-COGS-' + Math.floor(10000 + Math.random() * 90000),
                date: new Date().toISOString().split('T')[0],
                type: 'Expense',
                category: 'Cost of Goods Sold (COGS)',
                amount: parseFloat(calculatedCogs.toFixed(2)),
                description: `Cost of goods sold depletion ref: ${orderId}`,
                reference: orderId
              });
            }

            transactionsToAdd.forEach(tx => onAddTransaction(tx));

            const timestampStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
            const newLogs = posCart.map((item, index) => ({
              id: 'log-pos-' + Date.now() + '-' + index,
              timestamp: timestampStr,
              productName: item.product.name,
              item: item.product.id,
              type: 'sale' as const,
              qty: -item.quantity,
              user: `In-Store Checkout (${orderId})`
            }));
            setInventoryLogs(prev => [...newLogs, ...prev]);

            if (activeCustomer.isRegistered && activeCustomer.customerId) {
              const pointsEarned = Math.round(posTotal / 10);
              const linkedCustomer = customers.find((customer) => customer.id === activeCustomer.customerId);
              if (linkedCustomer) {
                onUpdateCustomer({
                  ...linkedCustomer,
                  points: linkedCustomer.points + pointsEarned,
                  walletBalance: posPaymentMethod === 'Wallet'
                    ? Math.max(0, linkedCustomer.walletBalance - posTotal)
                    : linkedCustomer.walletBalance
                });
              }
            }

            onAddPOSOrder(newOrder);

            setLatestPOSReceipt(newOrder);
            setShowPOSReceiptModal(true);

            setPosCart([]);
            setPosAppliedCoupon(null);
            setPosCouponCode('');
            setPosManualDiscount('');
            setPosCashReceived('');
            setPosIsDelivery(false);
            setPosCardStatus('Idle');
          };

          if (posPaymentMethod === 'Card' || posPaymentMethod === 'Tap') {
            setPosCardStatus('Approved');
            setPosCardProgress(100);
            performCheckoutFinalization();
          } else {
            performCheckoutFinalization();
          }
        };

        return (
          <div className="space-y-6 text-left" id="dashboard-tab-pos">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Product Selection Catalog */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-md border border-neutral-400 dark:border-neutral-700 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Scan barcode or search ITEM, GPU, CPU, RAM, Parts ID..."
                        value={posSearchQuery}
                        onChange={e => setPosSearchQuery(e.target.value)}
                        className="w-full border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 font-sans text-xs outline-none text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white transition-all font-medium"
                      />
                      <Search className="absolute left-3.5 top-3 h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    {posSearchQuery && (
                      <button
                        onClick={() => setPosSearchQuery('')}
                        className="px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono text-xs uppercase font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Hardware Category Filters */}
                  <div className="flex flex-wrap gap-1.5 font-sans text-xs font-bold">
                    {['All', ...categories].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setPosCategoryFilter(cat)}
                        className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                          posCategoryFilter === cat
                            ? 'bg-[#706d6d] text-white shadow-md shadow-neutral-500/20 font-black scale-105'
                            : 'bg-emerald-600 text-white hover:bg-emerald-500 border-emerald-500 shadow-sm'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Hardware Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
                  {filteredPOSProducts.map(prod => {
                    const isOutOfStock = prod.stock <= 0;
                    const isLowStock = prod.stock > 0 && prod.stock <= 5;
                    const cartItemCount = posCart
                      .filter(item => item.product.id === prod.id)
                      .reduce((sum, item) => sum + item.quantity, 0);

                    return (
                      <div
                        key={prod.id}
                        onClick={() => {
                          if (isOutOfStock) return;
                          const defaultColor = prod.colors?.[0] || 'Default';
                          const defaultSize = prod.sizes?.[0] || 'One Size';
                          
                          if (cartItemCount >= prod.stock) {
                            alert(`Insufficient stock. Only ${prod.stock} units available.`);
                            return;
                          }

                          setPosCart(prev => {
                            const existingIdx = prev.findIndex(item => item.product.id === prod.id && item.color === defaultColor && item.size === defaultSize);
                            if (existingIdx > -1) {
                              const updated = [...prev];
                              updated[existingIdx].quantity += 1;
                              return updated;
                            } else {
                              return [...prev, { product: prod, quantity: 1, color: defaultColor, size: defaultSize }];
                            }
                          });
                        }}
                        className={`group rounded-2xl border-2 cursor-pointer transition-all duration-200 relative p-3 text-left flex flex-col justify-between shadow-sm hover:shadow-md ${
                          isOutOfStock 
                            ? 'border-neutral-400 dark:border-neutral-700 bg-slate-100/60 dark:bg-slate-900/40 opacity-50' 
                            : 'border-neutral-400 dark:border-neutral-700 bg-white dark:bg-slate-900 hover:border-blue-500 hover:scale-[1.02]'
                        }`}
                      >
                        {cartItemCount > 0 && (
                          <span className="absolute -top-2 -right-2 font-mono text-[9px] bg-emerald-600 text-white border-2 border-white dark:border-slate-900 px-2 py-0.5 rounded-full font-black shadow-md z-10">
                            +{cartItemCount} IN CART
                          </span>
                        )}

                        <div>
                          <div className="aspect-square w-full overflow-hidden bg-slate-50 dark:bg-slate-800 rounded-xl mb-2.5 relative border border-slate-100 dark:border-slate-800">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded">
                              {prod.id}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="font-mono text-[9px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider block">
                              {prod.category}
                            </span>
                            <h4 className="font-sans text-xs font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                              {prod.name}
                            </h4>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                          <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                            ${(prod.discountPrice || prod.price).toFixed(2)}
                          </span>

                          <span className={`font-mono text-[8px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            isOutOfStock 
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                              : isLowStock 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-black' 
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {isOutOfStock ? 'OUT' : isLowStock ? `LOW (${prod.stock})` : `STK: ${prod.stock}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Checkout Panel */}
              <div className="lg:col-span-5 space-y-4">
                <div className="border-2 border-neutral-400 dark:border-neutral-700 rounded-2xl bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xl">
                  
                  {/* Customer Selection */}
                  <div className="space-y-2 border-b border-neutral-400 dark:border-neutral-700 pb-4 text-left">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] uppercase font-black tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Customer Account Linkage
                      </span>
                      <button
                        onClick={() => setShowAddPosCustomer(true)}
                        className="font-sans text-[10px] uppercase font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800"
                      >
                        + Register New
                      </button>
                    </div>

                    <select
                      value={posSelectedCustomerEmail}
                      onChange={e => setPosSelectedCustomerEmail(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl font-mono text-xs outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {posCustomers.map(c => (
                        <option key={c.email} value={c.email}>
                          {c.name} {c.isRegistered ? `(VIP - ${c.points} PTS)` : '(Guest)'} - {c.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Basket List */}
                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-mono text-[9px] uppercase tracking-wider font-bold px-1">
                      <span>Hardware Line Item</span>
                      <span>Total</span>
                    </div>

                    {posCart.length === 0 ? (
                      <div className="py-10 text-center border-2 border-dashed border-neutral-400 dark:border-neutral-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
                        <Calculator className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="font-sans text-xs uppercase font-bold text-slate-400">Terminal Cart is empty</p>
                        <p className="font-sans text-[10px] text-slate-400 mt-0.5">Click any component or computer above to add</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {posCart.map((item, index) => {
                          const standardPrice = item.product.discountPrice || item.product.price;
                          const finalUnitPrice = item.customPrice !== undefined ? item.customPrice : standardPrice;
                          const lineSubtotal = finalUnitPrice * item.quantity;

                          return (
                            <div key={index} className="flex flex-col border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 space-y-2 bg-slate-50/80 dark:bg-slate-800/60 text-left shadow-sm">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <h5 className="font-sans text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                    {item.product.name}
                                  </h5>
                                  <div className="flex items-center gap-2 font-mono text-[9px] text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                                    <span className="bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.2 rounded font-bold">ITEM: {item.product.id}</span>
                                    <span>• 12M Warranty</span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    setPosCart(prev => prev.filter((_, i) => i !== index));
                                  }}
                                  className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer shrink-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (item.quantity <= 1) return;
                                      setPosCart(prev => {
                                        const u = [...prev];
                                        u[index].quantity -= 1;
                                        return u;
                                      });
                                    }}
                                    className="px-2.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-black cursor-pointer rounded-l-lg"
                                  >
                                    -
                                  </button>
                                  <span className="px-3 font-mono text-xs font-black">{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (item.quantity >= item.product.stock) {
                                        alert(`Only ${item.product.stock} units of stock available.`);
                                        return;
                                      }
                                      setPosCart(prev => {
                                        const u = [...prev];
                                        u[index].quantity += 1;
                                        return u;
                                      });
                                    }}
                                    className="px-2.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-black cursor-pointer rounded-r-lg"
                                  >
                                    +
                                  </button>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <label className="font-mono text-[9px] uppercase text-slate-500 font-bold">Override ($):</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder={standardPrice.toString()}
                                    value={item.customPrice !== undefined ? item.customPrice : ''}
                                    onChange={e => {
                                      const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                      setPosCart(prev => {
                                        const u = [...prev];
                                        u[index].customPrice = val;
                                        return u;
                                      });
                                    }}
                                    className="w-20 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg p-1 font-mono text-xs outline-none text-right font-bold"
                                  />
                                </div>

                                <span className="font-mono text-sm font-black text-slate-900 dark:text-white ml-auto">
                                  ${lineSubtotal.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Promo & Discounts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                    <div className="space-y-1">
                      <label className="font-mono text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Promo Code</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="CODE"
                          value={posCouponCode}
                          onChange={e => {
                            setPosCouponCode(e.target.value);
                            setPosCouponError('');
                          }}
                          className="flex-1 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2 font-mono text-xs outline-none text-slate-900 dark:text-white font-bold"
                        />
                        <button
                          onClick={() => {
                            const clean = posCouponCode.trim().toUpperCase();
                            const coupon = coupons.find(c => c.code === clean);
                            if (!coupon) {
                              setPosCouponError('Invalid');
                              return;
                            }
                            if (!coupon.active) {
                              setPosCouponError('Expired');
                              return;
                            }
                            setPosAppliedCoupon(coupon);
                            setPosManualDiscount('');
                            setPosCouponError('');
                          }}
                          className="px-3 bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs uppercase font-black rounded-xl cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                      {posCouponError && <span className="font-mono text-[9px] text-rose-500 font-bold uppercase block">{posCouponError}</span>}
                      {posAppliedCoupon && (
                        <span className="font-mono text-[9px] text-emerald-600 font-bold uppercase flex items-center justify-between mt-1 bg-emerald-50 dark:bg-emerald-950 p-1 rounded">
                          <span>Applied: {posAppliedCoupon.code}</span>
                          <button onClick={() => setPosAppliedCoupon(null)} className="text-[8px] text-slate-400 underline uppercase cursor-pointer">Remove</button>
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Trade-in / Disc (%)</label>
                      <input
                        type="number"
                        placeholder="e.g. 10%"
                        value={posManualDiscount}
                        onChange={e => {
                          setPosManualDiscount(e.target.value);
                          setPosAppliedCoupon(null);
                        }}
                        className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2 font-mono text-xs outline-none text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>

                  {/* Delivery Option */}
                  <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">Courier Shipping?</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">+$15.00</span>
                      <input
                        type="checkbox"
                        checked={posIsDelivery}
                        onChange={e => setPosIsDelivery(e.target.checked)}
                        className="h-4 w-4 rounded accent-blue-600 outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Summary Math */}
                  <div className="space-y-1.5 border-t border-neutral-400 dark:border-neutral-700 pt-3 text-left font-mono text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>SUBTOTAL</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">${posSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>DISCOUNT</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">-${posDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>TAX (GST 8.25%)</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">${posTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>COURIER SHIPPING</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">${posShipping.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-baseline border-t-2 border-slate-900 dark:border-slate-100 pt-2 text-sm bg-blue-50/50 dark:bg-blue-950/40 p-2.5 rounded-xl">
                      <span className="font-sans font-black uppercase tracking-wider text-slate-900 dark:text-white">GRAND TOTAL</span>
                      <span className="font-mono text-xl font-black text-blue-600 dark:text-blue-400">${posTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Terminal Selectors */}
                  <div className="space-y-2 text-left">
                    <label className="font-mono text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Payment Method</label>
                    <div className="grid grid-cols-4 gap-1.5 font-mono text-xs font-bold">
                      {(['Cash', 'Card', 'Wallet', 'Tap'] as const).map(method => (
                        <button
                          key={method}
                          onClick={() => setPosPaymentMethod(method)}
                          className={`py-2.5 text-center rounded-xl transition-all cursor-pointer ${
                            posPaymentMethod === method
                              ? method === 'Cash' 
                                ? 'bg-[#198754] text-white shadow-md shadow-emerald-500/20 font-black'
                                : method === 'Card'
                                ? 'bg-[#0d6efd] text-white shadow-md shadow-blue-500/20 font-black'
                                : method === 'Wallet'
                                ? 'bg-[#6610f2] text-white shadow-md shadow-purple-500/20 font-black'
                                : 'bg-[#0dcaf0] text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>

                    {posPaymentMethod === 'Cash' && (
                      <div className="space-y-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                        <div className="flex justify-between items-center">
                          <label className="font-mono text-xs text-emerald-900 dark:text-emerald-300 font-bold">Cash Tendering Received:</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder={posTotal.toFixed(2)}
                            value={posCashReceived}
                            onChange={e => setPosCashReceived(e.target.value)}
                            className="w-28 border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 p-1.5 rounded-lg font-mono text-sm outline-none text-right font-black text-slate-900 dark:text-white"
                          />
                        </div>
                        
                        {(() => {
                          const cashVal = parseFloat(posCashReceived) || 0;
                          const changeDue = cashVal - posTotal;
                          return (
                            <div className="flex justify-between items-baseline font-mono text-xs border-t border-emerald-200 dark:border-emerald-800 pt-2">
                              <span className="text-emerald-800 dark:text-emerald-400 font-bold">Change Due to Customer:</span>
                              <span className={`font-black text-sm ${changeDue >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400'}`}>
                                {changeDue >= 0 ? `$${changeDue.toFixed(2)}` : '$0.00 (Unpaid)'}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {posPaymentMethod === 'Wallet' && (
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl font-mono text-xs space-y-1">
                        {(() => {
                          const activeCustomer = posCustomers.find(c => c.email === posSelectedCustomerEmail) || posCustomers[0];
                          const hasFunds = activeCustomer.isRegistered && activeCustomer.walletBalance >= posTotal;
                          const bal = activeCustomer.walletBalance;

                          return (
                            <>
                              <div className="flex justify-between">
                                <span className="text-purple-800 dark:text-purple-300 font-bold">VIP Hardware Wallet:</span>
                                <span className="font-black text-purple-950 dark:text-purple-100">${activeCustomer.isRegistered ? bal.toFixed(2) : '0.00'}</span>
                              </div>
                              <div className="flex justify-between border-t border-purple-200 dark:border-purple-800 pt-1">
                                <span className="text-purple-700 dark:text-purple-400 font-bold">Balance Check:</span>
                                {activeCustomer.isRegistered ? (
                                  hasFunds ? (
                                    <span className="text-emerald-600 font-black">Sufficient Funds ✓</span>
                                  ) : (
                                    <span className="text-rose-600 font-black">Insufficient Funds</span>
                                  )
                                ) : (
                                  <span className="text-rose-600 font-black">Guest Account</span>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {(posPaymentMethod === 'Card' || posPaymentMethod === 'Tap') && posCardStatus === 'Processing' && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl font-mono text-xs space-y-2 text-slate-900">
                        <div className="flex justify-between items-baseline">
                          <span className="text-blue-700 dark:text-blue-300 font-bold">Connecting to EFTPOS Pinpad...</span>
                          <span className="font-black text-blue-900 dark:text-blue-100 animate-pulse">{posCardProgress}%</span>
                        </div>
                        <div className="w-full bg-blue-200 dark:bg-blue-900 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${posCardProgress}%` }}></div>
                        </div>
                        <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-bold">Please hold card near contact reader or tap chip.</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handlePOSCheckout}
                    disabled={posCart.length === 0 || posCardStatus === 'Processing'}
                    className="w-full bg-gradient-to-r from-[#198754] to-[#15803d] hover:from-[#157347] hover:to-[#166534] disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 text-white font-sans text-sm font-black uppercase tracking-wider py-4 rounded-xl shadow-lg border-b-4 border-emerald-950 cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 transform active:scale-95"
                  >
                    <Receipt className="h-5 w-5" />
                    {posCardStatus === 'Processing' ? 'Authorizing EFTPOS Payment...' : 'COMPLETE SALE & PRINT THERMAL RECEIPT'}
                  </button>
                </div>
              </div>
            </div>

            {/* MONOSPACE THERMAL RECEIPT MODAL */}
            {showPOSReceiptModal && latestPOSReceipt && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="w-full max-w-sm border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-950 p-4 space-y-4 shadow-2xl">
                  
                  <div className="flex items-center justify-between border-b border-dashed border-neutral-350 dark:border-neutral-700 pb-2">
                    <span className="font-mono text-[9px] uppercase font-bold text-neutral-400">Retail Invoice Receipts</span>
                    <button
                      onClick={() => setShowPOSReceiptModal(false)}
                      className="text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-100 font-mono text-[9px] uppercase font-bold cursor-pointer"
                    >
                      [CLOSE]
                    </button>
                  </div>

                  <div className="bg-white text-neutral-955 px-5 py-7 shadow-sm text-left border-t-8 border-neutral-950 select-text font-mono text-[10px]" id="pos-thermal-receipt-container">
                    <div className="text-center space-y-1 pb-5 border-b border-dashed border-neutral-350 flex flex-col items-center">
                      {storeSettings.logoUrl && (
                        <img 
                          src={storeSettings.logoUrl} 
                          alt={storeSettings.storeName} 
                          className="h-12 w-auto mb-3 object-contain grayscale" 
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <h4 className="font-sans text-xs font-black uppercase tracking-widest text-neutral-950">{storeSettings.storeName || 'TECH SELLER'}</h4>
                      <p className="text-[8px] uppercase tracking-wider text-neutral-500">
                        100 Hardware Drive, Suite 200<br />
                        Brisbane QLD 4000, Australia<br />
                        TEL: 1300 882 248
                      </p>
                      <p className="font-mono text-[8px] text-neutral-400 mt-2">
                        STATION: POS-TERMINAL-01<br />
                        OPERATOR: STORE ADMIN<br />
                        DATE: {latestPOSReceipt.date}
                      </p>
                    </div>

                    <div className="py-4 space-y-1 font-mono text-[8px] uppercase tracking-wider text-neutral-900">
                      <p><strong>RECEIPT ID:</strong> {latestPOSReceipt.id}</p>
                      <p><strong>CUSTOMER:</strong> {latestPOSReceipt.customerName}</p>
                      <p><strong>EMAIL:</strong> {latestPOSReceipt.customerEmail}</p>
                      <p><strong>FULFILLMENT:</strong> {latestPOSReceipt.shipping > 0 ? 'COURIER SHIPMENT' : 'CARRYOUT / IN-STORE'}</p>
                    </div>

                    <div className="border-t border-b border-dashed border-neutral-400 py-3 space-y-2 text-neutral-900">
                      <div className="flex justify-between font-black text-[9px]">
                        <span>ITEM DESCRIPTION</span>
                        <span>QTY/TOTAL</span>
                      </div>
                      
                      {latestPOSReceipt.items.map((it, idx) => (
                        <div key={idx} className="space-y-0.5 text-[9px]">
                          <div className="flex justify-between">
                            <span className="font-bold uppercase">{it.name}</span>
                            <span className="font-bold">${(it.price * it.quantity).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-neutral-550 text-[8px]">
                            <span>VARIANT: {it.color}/{it.size}</span>
                            <span>{it.quantity}x @ ${it.price.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="py-4 space-y-1 text-right text-[9px] text-neutral-900">
                      <div className="flex justify-between">
                        <span>SUBTOTAL</span>
                        <span>${latestPOSReceipt.subtotal.toFixed(2)}</span>
                      </div>
                      {latestPOSReceipt.discount > 0 && (
                        <div className="flex justify-between text-neutral-550">
                          <span>DISCOUNTS APPLIED</span>
                          <span>-${latestPOSReceipt.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>TAXES (8.25%)</span>
                        <span>${latestPOSReceipt.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SHIPPING FEE</span>
                        <span>${latestPOSReceipt.shipping.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-neutral-900 pt-1 text-xs font-black">
                        <span>GRAND TOTAL DUE</span>
                        <span>${latestPOSReceipt.total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-neutral-400 pt-4 pb-2 text-[9px] text-neutral-900">
                      <p className="uppercase"><strong>METHOD:</strong> {latestPOSReceipt.paymentMethod}</p>
                      <p className="uppercase mt-0.5"><strong>STATUS:</strong> PAID / AUTHORIZED</p>
                      
                      <p className="mt-2 text-neutral-500 uppercase text-[8px]">
                        LOYALTY REWARDS ADDED: +{Math.round(latestPOSReceipt.total / 10)} PTS<br />
                        EST. TOTAL POINTS BALANCE: {
                          (posCustomers.find(c => c.email === latestPOSReceipt.customerEmail)?.points || 0)
                        } PTS
                      </p>
                    </div>

                    <div className="text-center pt-5 space-y-1 border-t border-dashed border-neutral-400">
                      <div className="mx-auto w-40 h-8 bg-neutral-900 border-none relative flex flex-col justify-end">
                        <div className="h-6 w-full bg-[repeating-linear-gradient(90deg,#000,#000_1px,#fff_1px,#fff_3px)]"></div>
                      </div>
                      <span className="text-[8px] font-black uppercase text-neutral-450 font-mono tracking-widest block">*{latestPOSReceipt.id.toUpperCase()}*</span>
                      <p className="text-[8px] uppercase tracking-wider text-neutral-500 pt-2 font-bold font-sans">
                        THANK YOU FOR YOUR PATRONAGE<br />
                        VELOCE PREMIUM BRAND CO.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const itemsRows = latestPOSReceipt.items.map(it => `
                          <tr class="item-row">
                            <td class="desc">
                              <strong>${it.name.toUpperCase()}</strong><br/>
                              <span class="variant">VAR: ${it.color}/${it.size}</span>
                            </td>
                            <td class="qty">${it.quantity}</td>
                            <td class="price">$${it.price.toFixed(2)}</td>
                            <td class="total">$${(it.price * it.quantity).toFixed(2)}</td>
                          </tr>
                        `).join('');

                        const receiptHtml = `
                          <html>
                          <head>
                            <title>Thermal Sales Receipt</title>
                            <style>
                              @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
                              body {
                                font-family: 'JetBrains Mono', monospace;
                                font-size: 11px;
                                color: #000;
                                margin: 0 auto;
                                padding: 20px;
                                background: #fff;
                                width: 280px;
                              }
                              .text-center { text-align: center; }
                              .text-right { text-align: right; }
                              .header {
                                border-bottom: 1px dashed #000;
                                padding-bottom: 10px;
                                margin-bottom: 10px;
                              }
                              .title { font-weight: bold; font-size: 14px; margin-bottom: 4px; }
                              .meta { font-size: 9px; line-height: 1.3; }
                              .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                              .table th { border-bottom: 1px dashed #000; text-align: left; font-size: 9px; padding: 4px 0; }
                              .table td { padding: 4px 0; vertical-align: top; font-size: 10px; }
                              .item-row td { border-bottom: 1px dotted #ccc; }
                              .qty { text-align: center; }
                              .price, .total { text-align: right; }
                              .variant { font-size: 8px; color: #555; }
                              .summary-table { width: 100%; margin: 10px 0; font-size: 10px; }
                              .summary-table td { padding: 2px 0; }
                              .grand-total { font-weight: bold; border-top: 1px dashed #000; font-size: 11px; padding-top: 4px; }
                              .barcode-lines {
                                height: 35px;
                                background: repeating-linear-gradient(
                                  90deg,
                                  #000,
                                  #000 2px,
                                  #fff 2px,
                                  #fff 5px
                                );
                                margin: 15px auto 4px auto;
                                width: 80%;
                              }
                              .barcode-text { font-size: 8px; font-weight: bold; letter-spacing: 2px; }
                              @media print {
                                body { padding: 0; margin: 0 auto; }
                              }
                            </style>
                          </head>
                          <body>
                              <div style="margin-bottom: 10px;">
                                ${storeSettings?.logoUrl ? `<img src="${storeSettings.logoUrl}" style="height: 40px; width: auto; margin-bottom: 8px; filter: grayscale(100%);" />` : ''}
                                <div class="title">${(storeSettings?.storeName || 'VELOCE PREMIUM LTD').toUpperCase()}</div>
                              </div>
                              <div class="meta">
                                100 Enterprise Blvd, Suite 100<br/>
                                Silicon Valley, CA 94025<br/>
                                STATION: POS-TERMINAL-01<br/>
                                OPERATOR: STORE ADMIN<br/>
                                DATE: ${latestPOSReceipt.date}
                              </div>
                            </div>

                            <div class="meta" style="margin-bottom: 10px;">
                              <strong>RECEIPT ID:</strong> ${latestPOSReceipt.id}<br/>
                              <strong>CUSTOMER:</strong> ${latestPOSReceipt.customerName}<br/>
                              <strong>METHOD:</strong> ${latestPOSReceipt.paymentMethod} (PAID)
                            </div>

                            <table class="table">
                              <thead>
                                <tr>
                                  <th>DESCRIPTION</th>
                                  <th style="text-align: center;">QTY</th>
                                  <th style="text-align: right;">PRICE</th>
                                  <th style="text-align: right;">TOTAL</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${itemsRows}
                              </tbody>
                            </table>

                            <table class="summary-table">
                              <tr>
                                <td>SUBTOTAL</td>
                                <td class="text-right">$${latestPOSReceipt.subtotal.toFixed(2)}</td>
                              </tr>
                              ${latestPOSReceipt.discount > 0 ? `
                              <tr>
                                <td>DISCOUNT</td>
                                <td class="text-right">-$${latestPOSReceipt.discount.toFixed(2)}</td>
                              </tr>
                              ` : ''}
                              <tr>
                                <td>TAX (8.25%)</td>
                                <td class="text-right">$${latestPOSReceipt.tax.toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td>SHIPPING/DELIVERY</td>
                                <td class="text-right">$${latestPOSReceipt.shipping.toFixed(2)}</td>
                              </tr>
                              <tr class="grand-total">
                                <td><strong>GRAND TOTAL</strong></td>
                                <td class="text-right"><strong>$${latestPOSReceipt.total.toFixed(2)}</strong></td>
                              </tr>
                            </table>

                            <div class="text-center" style="margin-top: 15px;">
                              <div class="barcode-lines"></div>
                              <div class="barcode-text">*${latestPOSReceipt.id.toUpperCase()}*</div>
                              <p style="font-size: 8px; margin-top: 8px; font-weight: bold;">
                                THANK YOU FOR YOUR PATRONAGE<br/>
                                ${(storeSettings.storeName || 'VELOCE PREMIUM BRAND CO.').toUpperCase()}
                              </p>
                            </div>
                          </body>
                          </html>
                        `;

                        printHtmlContent(receiptHtml);
                      }}
                      className="bg-neutral-950 text-white font-mono text-[9px] uppercase font-bold py-2 hover:bg-neutral-800 cursor-pointer"
                    >
                      Print Receipt
                    </button>
                    <button
                      onClick={() => setShowPOSReceiptModal(false)}
                      className="bg-white text-neutral-950 border border-neutral-400 font-mono text-[9px] uppercase font-bold py-2 hover:bg-neutral-50 cursor-pointer"
                    >
                      New Sale
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* REGISTER CUSTOMER DRAWER OVERLAY */}
            {showAddPosCustomer && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="w-full max-w-md border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-6 space-y-4 shadow-xl text-left">
                  <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700 pb-2.5">
                    <div className="flex items-center gap-2 text-neutral-950 dark:text-white">
                      <Users className="h-4 w-4" />
                      <h4 className="font-sans text-xs font-black uppercase tracking-wider">
                        Register New Loyalty VIP Customer
                      </h4>
                    </div>
                    <button
                      onClick={() => setShowAddPosCustomer(false)}
                      className="text-neutral-400 hover:text-neutral-600 font-mono text-xs uppercase font-bold cursor-pointer"
                    >
                      [Close]
                    </button>
                  </div>

                  <form onSubmit={handleRegisterPosCustomer} className="space-y-3">
                    <div className="space-y-1">
                      <label className="font-mono text-[8px] uppercase font-bold tracking-widest text-neutral-400 block font-bold">Customer Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Robert Oppenheimer"
                        value={newPosCustName}
                        onChange={e => setNewPosCustName(e.target.value)}
                        className="w-full border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-955 p-2 font-sans text-xs outline-none focus:border-neutral-900 text-neutral-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[8px] uppercase font-bold tracking-widest text-neutral-400 block font-bold">Customer Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. oppenheimer@manhattan.gov"
                        value={newPosCustEmail}
                        onChange={e => setNewPosCustEmail(e.target.value)}
                        className="w-full border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-955 p-2 font-sans text-xs outline-none focus:border-neutral-900 text-neutral-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[8px] uppercase font-bold tracking-widest text-neutral-400 block font-bold">Phone Number</label>
                      <input
                        type="text"
                        placeholder="e.g. +1 (555) 101-1945"
                        value={newPosCustPhone}
                        onChange={e => setNewPosCustPhone(e.target.value)}
                        className="w-full border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-955 p-2 font-mono text-xs outline-none focus:border-neutral-900 text-neutral-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-mono text-[8px] uppercase font-bold tracking-widest text-neutral-400 block font-bold">Street Address</label>
                        <input
                          type="text"
                          placeholder="e.g. Los Alamos Lab"
                          value={newPosCustAddress}
                          onChange={e => setNewPosCustAddress(e.target.value)}
                          className="w-full border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-955 p-2 font-sans text-xs outline-none focus:border-neutral-900 text-neutral-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-[8px] uppercase font-bold tracking-widest text-neutral-400 block font-bold">City</label>
                        <input
                          type="text"
                          placeholder="e.g. Los Alamos"
                          value={newPosCustCity}
                          onChange={e => setNewPosCustCity(e.target.value)}
                          className="w-full border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-955 p-2 font-sans text-xs outline-none focus:border-neutral-900 text-neutral-900"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full bg-neutral-950 dark:bg-neutral-100 text-white dark:text-neutral-955 py-2.5 font-sans text-[10px] uppercase tracking-widest font-black hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        Register & Preselect
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })()}

        </div>

      {/* CUSTOM PRODUCT DELETE CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" id="delete-confirm-modal">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-700 p-6 rounded-none shadow-xl text-left">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-none bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex-shrink-0 animate-pulse">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-neutral-950 dark:text-neutral-50 mb-1">
                  Confirm Product Deletion
                </h3>
                <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                  Are you absolutely sure you want to delete <span className="font-semibold text-neutral-800 dark:text-neutral-200">"{productToDelete.name}"</span> (ITEM: <span className="font-mono text-[11px] font-bold">{productToDelete.id}</span>)? This action is permanent and cannot be undone.
                </p>
                <div className="flex justify-end gap-2 font-mono text-[9px] font-bold">
                  <button
                    onClick={() => setProductToDelete(null)}
                    className="border border-neutral-400 hover:border-neutral-950 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:bg-neutral-850 px-4 py-2 transition-all uppercase tracking-widest cursor-pointer text-neutral-700 dark:text-neutral-300"
                    id="cancel-delete-product-btn"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onDeleteProduct(productToDelete.id);
                      setProductToDelete(null);
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 transition-all uppercase tracking-widest cursor-pointer"
                    id="confirm-delete-product-btn"
                  >
                    Delete ITEM
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE & PRINTING MODAL */}
      <InvoiceModal
        isOpen={!!selectedInvoiceOrder || !!selectedInvoiceData}
        onClose={() => {
          setSelectedInvoiceOrder(null);
          setSelectedInvoiceData(null);
        }}
        order={selectedInvoiceOrder}
        invoiceData={selectedInvoiceData}
        storeSettings={storeSettings}
        onSaveInvoice={(updatedInv) => {
          setSelectedInvoiceData(updatedInv);
        }}
      />
    </div>
  );
}
