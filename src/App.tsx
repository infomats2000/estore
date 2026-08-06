import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Sparkles, TrendingUp, Compass, ChevronRight, 
  ArrowRight, ArrowLeft, ShieldCheck, Heart, HeartOff, Star, AlertCircle, RefreshCw,
  Award, Cpu, DollarSign, Building2, Tag, X, SlidersHorizontal, Check,
  Laptop, Monitor, Mouse, Clock, Zap, CheckCircle2, Package
} from 'lucide-react';
import ProductCompareModal from './components/ProductCompareModal';
import ExitIntentModal from './components/ExitIntentModal';
import OrderTrackingModal from './components/OrderTrackingModal';
import POSRegisterView from './components/POSRegisterView';
import CustomerFacingDisplayModal from './components/pos/CustomerFacingDisplayModal';
import PCBuilderModal from './components/pcbuilder/PCBuilderModal';
import CustomerPortalModal from './components/customer/CustomerPortalModal';

import { Product, CartItem, Order, Coupon, CustomerProfile, Review, ReturnRequest, CustomerSegment, UpsellRule, FinanceTransaction, User, StoreSettings, DEFAULT_STORE_SETTINGS, PurchaseOrder, RepairJob, StockUnit, WarehouseLocation, StockTransfer, StocktakeSession, ShrinkageRecord } from './types';
import { INITIAL_PRODUCTS, INITIAL_REVIEWS, INITIAL_COUPONS } from './data/products';
import { INITIAL_WAREHOUSES } from './data/warehouses';

import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import NewsletterSection from './components/NewsletterSection';
import FlashSaleBanner from './components/FlashSaleBanner';
import DashboardView from './components/DashboardView';
import OfflineStatusBanner from './components/OfflineStatusBanner';
import { saveOfflineAppState, getOfflineCachedState, enqueueOfflineTransaction } from './utils/offlineSyncEngine';
import { SaaSLandingPage } from './components/SaaSLandingPage';
import { SaaSOnboardingModal } from './components/SaaSOnboardingModal';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { SaaSLoginPage } from './components/SaaSLoginPage';
import { TenantProvider } from './context/TenantContext';
import { TenantFeatureProvider } from './context/TenantFeatureContext';
import { ShopByCategoryGrid } from './components/ShopByCategoryGrid';




const loadCheckoutModal = () => import('./components/CheckoutModal');
const loadAccountDrawer = () => import('./components/AccountDrawer');
const loadSettingsModal = () => import('./components/SettingsModal');

const CheckoutModal = lazy(loadCheckoutModal);
const AccountDrawer = lazy(loadAccountDrawer);
const SettingsModal = lazy(loadSettingsModal);

const INITIAL_CUSTOMERS: CustomerProfile[] = [
  {
    id: 'cust-apex-b2b',
    name: 'Sarah Connor',
    email: 'procurement@apextech.com.au',
    phone: '+61 2 9876 5432',
    address: 'Suite 400, 100 Miller Street',
    city: 'North Sydney NSW 2060',
    type: 'Trade',
    registrationDate: '2026-01-15',
    company: 'Apex Technology Solutions Pty Ltd',
    abn: '45 123 456 789',
    walletBalance: 500,
    points: 1250,
    wishlist: [],
    priceDropNotifications: [],
    tradeAccount: {
      accountNumber: 'TRD-10042',
      companyName: 'Apex Technology Solutions Pty Ltd',
      abn: '45 123 456 789',
      contactPerson: 'Sarah Connor',
      phone: '+61 2 9876 5432',
      email: 'procurement@apextech.com.au',
      status: 'Active',
      creditLimit: 25000,
      creditBalance: 3450,
      creditTerms: 'Net 30',
      priceTier: 'Wholesale',
      customDiscountPercent: 0,
      poRequired: true,
      taxExempt: false,
      appliedDate: '2026-01-15',
      approvedDate: '2026-01-16'
    },
    tradeLedger: [
      {
        id: 'LEDG-101',
        customerId: 'cust-apex-b2b',
        customerName: 'Sarah Connor',
        companyName: 'Apex Technology Solutions Pty Ltd',
        date: '2026-07-10',
        dueDate: '2026-08-09',
        type: 'Invoice Charge',
        amount: 3450,
        runningBalance: 3450,
        reference: 'ORD-9821',
        description: 'Bulk Dell Latitude & ThinkPad Procurement (PO #PO-APEX-901)',
        status: 'Current'
      },
      {
        id: 'LEDG-100',
        customerId: 'cust-apex-b2b',
        customerName: 'Sarah Connor',
        companyName: 'Apex Technology Solutions Pty Ltd',
        date: '2026-06-01',
        type: 'Payment Received',
        amount: -5000,
        runningBalance: 0,
        reference: 'EFT-7712',
        description: 'EFT Bank Deposit Clearance (cba-ref-9812)',
        status: 'Paid',
        paymentMethod: 'EFT Bank Transfer'
      }
    ]
  },
  {
    id: 'cust-govtech-b2b',
    name: 'Arthur Pendelton',
    email: 'contracts@govtech.gov.au',
    phone: '+61 2 6100 0000',
    address: 'Level 12, Treasury Building, Parkes',
    city: 'Canberra ACT 2600',
    type: 'Trade',
    registrationDate: '2026-02-01',
    company: 'GovTech Australia Department',
    abn: '99 888 777 666',
    walletBalance: 0,
    points: 4000,
    wishlist: [],
    priceDropNotifications: [],
    tradeAccount: {
      accountNumber: 'TRD-90001',
      companyName: 'GovTech Australia Department',
      abn: '99 888 777 666',
      contactPerson: 'Arthur Pendelton',
      phone: '+61 2 6100 0000',
      email: 'contracts@govtech.gov.au',
      status: 'Active',
      creditLimit: 50000,
      creditBalance: 0,
      creditTerms: 'Net 60',
      priceTier: 'Government',
      customDiscountPercent: 2,
      poRequired: true,
      taxExempt: true,
      appliedDate: '2026-02-01',
      approvedDate: '2026-02-02'
    },
    tradeLedger: [
      {
        id: 'LEDG-201',
        customerId: 'cust-govtech-b2b',
        customerName: 'Arthur Pendelton',
        companyName: 'GovTech Australia Department',
        date: '2026-05-15',
        type: 'Payment Received',
        amount: -12500,
        runningBalance: 0,
        reference: 'EFT-GOV-901',
        description: 'Federal Treasury EFT Settlement',
        status: 'Paid',
        paymentMethod: 'EFT Bank Transfer'
      }
    ]
  },
  {
    id: 'cust-nextgen-b2b',
    name: 'Marcus Brody',
    email: 'accounts@nextgenresellers.com.au',
    phone: '+61 3 9555 1234',
    address: '88 Innovation Way',
    city: 'Melbourne VIC 3000',
    type: 'Trade',
    registrationDate: '2026-03-10',
    company: 'NextGen IT Resellers Ltd',
    abn: '12 345 678 901',
    walletBalance: 0,
    points: 100,
    wishlist: [],
    priceDropNotifications: [],
    tradeAccount: {
      accountNumber: 'TRD-44012',
      companyName: 'NextGen IT Resellers Ltd',
      abn: '12 345 678 901',
      contactPerson: 'Marcus Brody',
      phone: '+61 3 9555 1234',
      email: 'accounts@nextgenresellers.com.au',
      status: 'Credit Hold',
      creditLimit: 15000,
      creditBalance: 4200,
      creditTerms: 'Net 14',
      priceTier: 'Reseller',
      customDiscountPercent: 0,
      poRequired: true,
      taxExempt: false,
      appliedDate: '2026-03-10',
      approvedDate: '2026-03-11',
      lastReminderSent: '2026-07-28'
    },
    tradeLedger: [
      {
        id: 'LEDG-301',
        customerId: 'cust-nextgen-b2b',
        customerName: 'Marcus Brody',
        companyName: 'NextGen IT Resellers Ltd',
        date: '2026-05-10',
        dueDate: '2026-05-24',
        type: 'Invoice Charge',
        amount: 4200,
        runningBalance: 4200,
        reference: 'ORD-7712',
        description: 'Server & Workstation Stock Order (OVERDUE 60+ DAYS)',
        status: 'Overdue'
      }
    ]
  }
];

const EMPTY_PROFILE: CustomerProfile = {
  id: 'GUEST',
  name: 'Guest User',
  email: '',
  phone: '',
  address: '',
  city: '',
  type: 'Retail',
  registrationDate: new Date().toISOString().split('T')[0],
  walletBalance: 0,
  points: 0,
  wishlist: [],
  priceDropNotifications: []
};

const DEFAULT_PROFILE: CustomerProfile = EMPTY_PROFILE;

export default function App() {
  const stateHydratedRef = useRef(false);
  const stateSyncTimeoutRef = useRef<number | null>(null);
  const [isHydratingState, setIsHydratingState] = useState(true);

  // SaaS Platform States
  const [saasMode, setSaasMode] = useState<'store' | 'landing' | 'login' | 'superadmin'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      if (modeParam === 'store' || modeParam === 'landing' || modeParam === 'login' || modeParam === 'superadmin') {
        return modeParam;
      }
    } catch (e) {}
    return 'landing';
  });
  const [loginRole, setLoginRole] = useState<'superadmin' | 'storeadmin'>('superadmin');
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  const [onboardingPlanCode, setOnboardingPlanCode] = useState('GROWTH');
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
          }
        })
        .catch((err) => console.error(err));
    }
  }, [saasMode]);





  const prefetchAdminWorkspace = () => {
    void loadSettingsModal();
  };

  const prefetchAccountWorkspace = () => {
    void loadAccountDrawer();
  };

  const prefetchCheckoutWorkspace = () => {
    void loadCheckoutModal();
  };

  // STORE SETTINGS STATE
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('techseller_store_settings_v4');
      const settings = saved ? { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(saved) } : DEFAULT_STORE_SETTINGS;
      
      // Auto-apply new logo if none exists or is default
      if (!settings.logoUrl || settings.logoUrl === '') {
        settings.logoUrl = DEFAULT_STORE_SETTINGS.logoUrl;
      }
      return settings;
    } catch (e) {
      console.error('Error loading store settings from localStorage:', e);
      return DEFAULT_STORE_SETTINGS;
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showCustomerPortalModal, setShowCustomerPortalModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('techseller_store_settings_v4', JSON.stringify(storeSettings));
  }, [storeSettings]);

  // GLOBAL PERSISTED STATES
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_products_v4');
      if (saved === null) return INITIAL_PRODUCTS;

      const data = JSON.parse(saved);
      if (!Array.isArray(data)) return INITIAL_PRODUCTS;

      return data.map((p: any) => ({
        ...p,
        additionalImages: p.additionalImages || [],
        tags: p.tags || [],
        colors: p.colors || [],
        sizes: p.sizes || []
      }));
    } catch (e) {
      console.error('Error loading products from localStorage:', e);
      return INITIAL_PRODUCTS;
    }
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_reviews_v4');
      if (saved === null) return INITIAL_REVIEWS;

      const data = JSON.parse(saved);
      return Array.isArray(data) ? data : INITIAL_REVIEWS;
    } catch (e) {
      console.error('Error loading reviews from localStorage:', e);
      return INITIAL_REVIEWS;
    }
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_coupons_v4');
      if (saved === null) return INITIAL_COUPONS;

      const data = JSON.parse(saved);
      return Array.isArray(data) ? data : INITIAL_COUPONS;
    } catch (e) {
      console.error('Error loading coupons from localStorage:', e);
      return INITIAL_COUPONS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_orders_v4');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading orders from localStorage:', e);
      return [];
    }
  });

  const [customers, setCustomers] = useState<CustomerProfile[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_customers_v4');
      if (saved === null) return INITIAL_CUSTOMERS;

      const data = JSON.parse(saved);
      return Array.isArray(data) ? data : INITIAL_CUSTOMERS;
    } catch (e) {
      console.error('Error loading customers from localStorage:', e);
      return INITIAL_CUSTOMERS;
    }
  });

  const handleAddCustomer = (customer: CustomerProfile) => {
    setCustomers(prev => [...prev, customer]);
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateCustomer = (customer: CustomerProfile) => {
    setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
  };

  useEffect(() => {
    localStorage.setItem('techseller_customers_v4', JSON.stringify(customers));
  }, [customers]);

  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_finance_transactions_v4');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading finance transactions:', e);
      return [];
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_users_v4');
      return saved ? JSON.parse(saved) : [{
        id: 'U-001',
        name: 'Admin',
        email: 'admin@techseller.app',
        permissions: ['POS', 'Finance', 'Inventory', 'Orders', 'Customers']
      }];
    } catch (e) {
      console.error('Error loading users:', e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('techseller_finance_transactions_v4', JSON.stringify(financeTransactions));
  }, [financeTransactions]);

  useEffect(() => {
    localStorage.setItem('techseller_users_v4', JSON.stringify(users));
  }, [users]);

  // ── ERP PHASE 1 STATE ─────────────────────────────────────────────────────
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_purchase_orders_v4');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [repairJobs, setRepairJobs] = useState<RepairJob[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_repair_jobs_v4');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const INITIAL_STOCK_UNITS: StockUnit[] = [
    {
      id: 'SU-001',
      serialNumber: 'SN-THINK-X1-88902',
      productId: 'P-001',
      productName: 'Refurbished Enterprise ThinkPad - i5 / 16GB / 256GB SSD',
      purchaseOrderId: 'PO-2026-001',
      status: 'In Repair',
      costPrice: 220.00,
      receivedDate: '2026-07-28',
      locationId: 'WH-MAIN',
      locationName: 'Main Logistics Hub',
      binLocation: 'BIN-A1-02',
      auditLog: [
        { date: '2026-07-28', action: 'Received via GRN Intake', performedBy: 'Receiving Officer' }
      ]
    },
    {
      id: 'SU-002',
      serialNumber: 'SN-POWER-LPT-99301',
      productId: 'P-002',
      productName: 'Powerhouse Developer Laptop - i7 / 32GB / 1TB NVMe',
      purchaseOrderId: 'PO-2026-001',
      status: 'In Repair',
      costPrice: 380.00,
      receivedDate: '2026-07-28',
      locationId: 'WH-MAIN',
      locationName: 'Main Logistics Hub',
      binLocation: 'BIN-B1-04',
      auditLog: [
        { date: '2026-07-28', action: 'Received via GRN Intake', performedBy: 'Receiving Officer' }
      ]
    },
    {
      id: 'SU-003',
      serialNumber: 'SN-DESK-PRO-10022',
      productId: 'P-003',
      productName: 'Refurbished Enterprise Workstation Rig - i9 / 64GB RAM / 2TB NVMe',
      purchaseOrderId: 'PO-2026-002',
      status: 'In Stock',
      grade: 'A',
      costPrice: 870.00,
      receivedDate: '2026-07-15',
      locationId: 'WH-MAIN',
      locationName: 'Main Logistics Hub',
      binLocation: 'BIN-C2-01',
      refurbSession: {
        inspectedAt: '2026-07-16',
        inspectedBy: 'Senior Refurb Tech',
        passedChecks: ['cos-01', 'cos-03', 'cos-04', 'cos-05', 'cos-06', 'cos-07', 'cos-08', 'cos-10', 'dsp-01', 'dsp-02', 'dsp-03', 'dsp-04', 'dsp-05', 'dsp-07', 'dsp-08', 'dsp-09', 'dsp-10', 'hw-01', 'hw-02', 'hw-03', 'hw-04', 'hw-05', 'hw-06', 'hw-07', 'hw-08', 'hw-09', 'hw-10', 'pwr-01', 'pwr-02', 'pwr-03', 'pwr-04', 'pwr-05', 'pwr-06', 'pwr-07', 'pwr-08', 'pwr-09', 'pwr-10', 'con-01', 'con-02', 'con-03', 'con-04', 'con-05', 'con-06', 'con-07', 'con-08', 'con-09', 'con-10'],
        batteryHealth: 88,
        calculatedGrade: 'A',
        purchaseCost: 650.00,
        partsUsed: [
          { partName: 'Replacement DDR4 32GB RAM module', cost: 120.00 }
        ],
        laborHours: 2.0,
        laborRate: 50.0,
        refurbPartsCost: 120.00,
        refurbLaborCost: 100.00,
        trueCOGS: 870.00
      },
      auditLog: [
        { date: '2026-07-16', action: 'Graded Refurbished A', performedBy: 'Senior Refurb Tech', notes: 'Replaced faulty RAM module. System stable.' },
        { date: '2026-07-15', action: 'Received via GRN Intake', performedBy: 'Receiving Officer' }
      ]
    }
  ];

  const [stockUnits, setStockUnits] = useState<StockUnit[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_stock_units_v4');
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data) && data.length > 0) return data;
      }
      return INITIAL_STOCK_UNITS;
    } catch { return INITIAL_STOCK_UNITS; }
  });

  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_warehouses_v4');
      return saved ? JSON.parse(saved) : INITIAL_WAREHOUSES;
    } catch { return INITIAL_WAREHOUSES; }
  });

  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_stock_transfers_v4');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => { localStorage.setItem('techseller_purchase_orders_v4', JSON.stringify(purchaseOrders)); }, [purchaseOrders]);
  useEffect(() => { localStorage.setItem('techseller_repair_jobs_v4', JSON.stringify(repairJobs)); }, [repairJobs]);
  useEffect(() => { localStorage.setItem('techseller_stock_units_v4', JSON.stringify(stockUnits)); }, [stockUnits]);
  useEffect(() => { localStorage.setItem('techseller_warehouses_v4', JSON.stringify(warehouses)); }, [warehouses]);
  useEffect(() => { localStorage.setItem('techseller_stock_transfers_v4', JSON.stringify(stockTransfers)); }, [stockTransfers]);

  // ── ERP PHASE 3 STOCKTAKE STATE & HANDLERS ────────────────────────────────
  const [stocktakes, setStocktakes] = useState<StocktakeSession[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_stocktakes_v4');
      if (saved) return JSON.parse(saved);
    } catch {}
    
    return [
      {
        id: 'STK-2026-001',
        title: 'Q1 Accessories & Docks Spot Audit',
        type: 'Spot Audit',
        status: 'Completed',
        startDate: '2026-03-10',
        completedDate: '2026-03-10',
        conductedBy: 'Auditor Dave',
        locationName: 'Sydney Showroom',
        items: [
          {
            productId: 'P-004',
            productName: 'Dual-Protocol NVMe Enclosure',
            sku: 'P-004',
            barcode: 'P-004',
            category: 'Accessories',
            expectedQty: 25,
            countedQty: 25,
            variance: 0,
            unitCost: 28.00,
            varianceValue: 0.00,
            status: 'Matched'
          },
          {
            productId: 'P-006',
            productName: 'USB-C Multi-Port Hub',
            sku: 'P-006',
            barcode: 'P-006',
            category: 'Accessories',
            expectedQty: 30,
            countedQty: 27,
            variance: -3,
            unitCost: 19.50,
            varianceValue: -58.50,
            status: 'Adjusted'
          }
        ],
        totalExpectedUnits: 55,
        totalCountedUnits: 52,
        netVarianceUnits: -3,
        netVarianceValue: -58.50,
        shrinkageUnits: 3,
        shrinkageValue: 58.50
      },
      {
        id: 'STK-2026-002',
        title: 'Laptops & Workstations Rolling Cycle Count',
        type: 'Category Cycle Count',
        status: 'In Progress',
        categoryFilter: 'Laptops',
        startDate: '2026-08-04',
        conductedBy: 'Auditor Dave',
        locationName: 'Main Logistics Hub',
        items: [
          {
            productId: 'P-001',
            productName: 'Refurbished Enterprise ThinkPad - i5 / 16GB / 256GB SSD',
            sku: 'P-001',
            barcode: 'P-001',
            category: 'Laptops',
            expectedQty: 18,
            countedQty: 0,
            variance: -18,
            unitCost: 280.00,
            varianceValue: -5040.00,
            status: 'Pending'
          },
          {
            productId: 'P-002',
            productName: 'Powerhouse Developer Laptop - i7 / 32GB / 1TB NVMe',
            sku: 'P-002',
            barcode: 'P-002',
            category: 'Laptops',
            expectedQty: 12,
            countedQty: 0,
            variance: -12,
            unitCost: 450.00,
            varianceValue: -5400.00,
            status: 'Pending'
          }
        ],
        totalExpectedUnits: 30,
        totalCountedUnits: 0,
        netVarianceUnits: -30,
        netVarianceValue: -10440.00,
        shrinkageUnits: 0,
        shrinkageValue: 0
      }
    ];
  });

  const [shrinkageRecords, setShrinkageRecords] = useState<ShrinkageRecord[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_shrinkage_records_v4');
      if (saved) return JSON.parse(saved);
    } catch {}
    
    return [
      {
        id: 'SHR-2026-001',
        stocktakeId: 'STK-2026-001',
        productId: 'P-006',
        productName: 'USB-C Multi-Port Hub',
        category: 'Accessories',
        locationName: 'Sydney Showroom',
        quantity: 3,
        unitCost: 19.50,
        totalCostValue: 58.50,
        reason: 'Shrinkage / Theft',
        date: '2026-03-10',
        reportedBy: 'Auditor Dave',
        actionTaken: 'Stock Adjusted'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('techseller_stocktakes_v4', JSON.stringify(stocktakes));
  }, [stocktakes]);

  useEffect(() => {
    localStorage.setItem('techseller_shrinkage_records_v4', JSON.stringify(shrinkageRecords));
  }, [shrinkageRecords]);

  const handleAddStocktake = (session: StocktakeSession) => {
    setStocktakes(prev => [session, ...prev]);
  };

  const handleUpdateStocktake = (session: StocktakeSession) => {
    setStocktakes(prev => prev.map(s => s.id === session.id ? session : s));
  };

  const handleAddShrinkageRecord = (record: ShrinkageRecord) => {
    setShrinkageRecords(prev => [record, ...prev]);
  };

  const handleUpdateProductStock = (productId: string, newStock: number, reason: string, notes?: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          stock: newStock
        };
      }
      return p;
    }));
  };


  const [returns, setReturns] = useState<ReturnRequest[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_returns_v4');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading returns from localStorage:', e);
    }

    return [];
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_cart_v4');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading cart from localStorage:', e);
      return [];
    }
  });

  const [customerProfile, setCustomerProfile] = useState<CustomerProfile>(() => {
    try {
      const saved = localStorage.getItem('techseller_profile_v4');
      const profile = saved ? JSON.parse(saved) : DEFAULT_PROFILE;
      return {
        ...profile,
        wishlist: profile.wishlist || [],
        priceDropNotifications: profile.priceDropNotifications || []
      };
    } catch (e) {
      console.error('Error loading profile from localStorage:', e);
      return DEFAULT_PROFILE;
    }
  });

  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_recently_viewed_v4');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading recently viewed from localStorage:', e);
      return [];
    }
  });

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_categories_v4');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading categories from localStorage:', e);
      return [];
    }
  });

  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_customer_segments_v4');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading customer segments:', e);
    }
    return [];
  });

  const [upsellRules, setUpsellRules] = useState<UpsellRule[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_upsell_rules_v4');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading upsell rules:', e);
    }
    return [];
  });

  const [collections, setCollections] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('techseller_collections_v4');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading collections from localStorage:', e);
      return [];
    }
  });

  useEffect(() => {
    let cancelled = false;

    const hydrateFromServer = async () => {
      try {
        const response = await fetch('/api/state');
        let payload: any = null;

        if (response.ok) {
          payload = await response.json();
          saveOfflineAppState(payload);
        } else {
          payload = getOfflineCachedState();
        }

        if (cancelled || !payload) return;

        if (payload.storeSettings) setStoreSettings((prev) => ({ ...prev, ...payload.storeSettings }));
        if (Array.isArray(payload.products)) setProducts(payload.products);
        if (Array.isArray(payload.reviews)) setReviews(payload.reviews);
        if (Array.isArray(payload.coupons)) setCoupons(payload.coupons);
        if (Array.isArray(payload.orders)) setOrders(payload.orders);
        if (Array.isArray(payload.customers)) setCustomers(payload.customers);
        if (Array.isArray(payload.financeTransactions)) setFinanceTransactions(payload.financeTransactions);
        if (Array.isArray(payload.purchaseOrders)) setPurchaseOrders(payload.purchaseOrders);
        if (Array.isArray(payload.repairJobs)) setRepairJobs(payload.repairJobs);
        if (Array.isArray(payload.stockUnits)) setStockUnits(payload.stockUnits);
        if (Array.isArray(payload.users)) setUsers(payload.users);
        if (Array.isArray(payload.returns)) setReturns(payload.returns);
        if (Array.isArray(payload.categories)) setCategories(payload.categories);
        if (Array.isArray(payload.customerSegments)) setCustomerSegments(payload.customerSegments);
        if (Array.isArray(payload.upsellRules)) setUpsellRules(payload.upsellRules);
        if (Array.isArray(payload.collections)) setCollections(payload.collections);
      } catch (err) {
        console.warn('Could not hydrate app state from server, attempting offline local cache:', err);
        const cached = getOfflineCachedState();
        if (cached && !cancelled) {
          if (cached.storeSettings) setStoreSettings((prev) => ({ ...prev, ...cached.storeSettings }));
          if (Array.isArray(cached.products)) setProducts(cached.products);
          if (Array.isArray(cached.reviews)) setReviews(cached.reviews);
          if (Array.isArray(cached.coupons)) setCoupons(cached.coupons);
          if (Array.isArray(cached.orders)) setOrders(cached.orders);
          if (Array.isArray(cached.customers)) setCustomers(cached.customers);
          if (Array.isArray(cached.financeTransactions)) setFinanceTransactions(cached.financeTransactions);
          if (Array.isArray(cached.purchaseOrders)) setPurchaseOrders(cached.purchaseOrders);
          if (Array.isArray(cached.repairJobs)) setRepairJobs(cached.repairJobs);
          if (Array.isArray(cached.stockUnits)) setStockUnits(cached.stockUnits);
          if (Array.isArray(cached.users)) setUsers(cached.users);
          if (Array.isArray(cached.returns)) setReturns(cached.returns);
          if (Array.isArray(cached.categories)) setCategories(cached.categories);
          if (Array.isArray(cached.customerSegments)) setCustomerSegments(cached.customerSegments);
          if (Array.isArray(cached.upsellRules)) setUpsellRules(cached.upsellRules);
          if (Array.isArray(cached.collections)) setCollections(cached.collections);
        }
      } finally {
        stateHydratedRef.current = true;
        setIsHydratingState(false);
      }
    };

    void hydrateFromServer();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!stateHydratedRef.current) return;

    if (stateSyncTimeoutRef.current) {
      window.clearTimeout(stateSyncTimeoutRef.current);
    }

    stateSyncTimeoutRef.current = window.setTimeout(() => {
      const payload = {
        storeSettings,
        products,
        reviews,
        coupons,
        orders,
        customers,
        financeTransactions,
        users,
        returns,
        categories,
        customerSegments,
        upsellRules,
        collections,
        purchaseOrders,
        repairJobs,
        stockUnits
      };

      saveOfflineAppState(payload);

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueOfflineTransaction({ type: 'STATE_UPDATE', endpoint: '/api/state', payload });
        return;
      }

      void fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {
        enqueueOfflineTransaction({ type: 'STATE_UPDATE', endpoint: '/api/state', payload });
      });
    }, 500);

    return () => {
      if (stateSyncTimeoutRef.current) {
        window.clearTimeout(stateSyncTimeoutRef.current);
      }
    };
  }, [
    storeSettings,
    products,
    reviews,
    coupons,
    orders,
    customers,
    financeTransactions,
    users,
    returns,
    categories,
    customerSegments,
    upsellRules,
    collections,
    purchaseOrders,
    repairJobs,
    stockUnits
  ]);

  // STOREFRONT UI STATES
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'rating'>('default');
  
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) return true;

      const hash = window.location.hash.replace('#', '');
      const validAdminTabs = [
        'metrics', 'analytics', 'inventory', 'categories', 'collections', 'orders', 'invoices',
        'customers', 'returns', 'coupons', 'segments', 'upsells', 'reviews',
        'suppliers', 'shipping', 'pos', 'finance', 'users', 'admin'
      ];
      if (hash && validAdminTabs.includes(hash)) {
        return true;
      }
      const saved = localStorage.getItem('techseller_admin_mode_v4');
      return saved === 'true';
    } catch (e) {
      console.error('Error loading admin mode state:', e);
      return false;
    }
  });


  useEffect(() => {
    try {
      localStorage.setItem('techseller_admin_mode_v4', isAdminMode ? 'true' : 'false');
    } catch (e) {
      console.error('Error saving admin mode state:', e);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [isAdminMode]);

  // DRAWERS & MODALS STATE
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'general' | 'invoice' | 'tax_bank' | 'storefront' | 'marketing' | 'users' | 'system' | 'master_data' | 'domain' | 'billing'>('general');

  const [directCheckoutItem, setDirectCheckoutItem] = useState<CartItem | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [systemAlert, setSystemAlert] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const [compareList, setCompareList] = useState<Product[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showTrackOrderModal, setShowTrackOrderModal] = useState(false);
  const [showPOSView, setShowPOSView] = useState(false);
  const [showPCBuilderModal, setShowPCBuilderModal] = useState(false);

  // Handle URL route params (Stripe success/cancel, share product links)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const sessionId = searchParams.get('session_id');
      const productIdParam = searchParams.get('product') || (window.location.hash.startsWith('#product-') ? window.location.hash.replace('#product-', '') : null);

      if (sessionId) {
        setCart([]);
        setAppliedCoupon(null);
        setSystemAlert({ message: 'Stripe Payment Successful! Your order has been placed and confirmed.', type: 'success' });
        window.history.replaceState({}, '', window.location.pathname);
      }

      if (productIdParam && products.length > 0) {
        const found = products.find(p => p.id === productIdParam);
        if (found) {
          setSelectedProduct(found);
        }
      }
    } catch (e) {
      console.error('Error handling URL route parameters:', e);
    }
  }, [products]);

  const handleAddToCartBatch = (items: { product: Product; quantity: number }[]) => {
    setCart(prev => {
      let updated = [...prev];
      items.forEach(item => {
        const existingIndex = updated.findIndex(i => i.product.id === item.product.id);
        if (existingIndex > -1) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + item.quantity
          };
        } else {
          updated.push({
            id: `${item.product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            product: item.product,
            quantity: item.quantity
          });
        }
      });
      return updated;
    });
    setIsCartOpen(true);
  };

  const handleToggleCompare = (product: Product) => {
    setCompareList(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) return prev.filter(p => p.id !== product.id);
      if (prev.length >= 4) {
        triggerAlert('You can compare up to 4 products at a time', 'error');
        return prev;
      }
      return [...prev, product];
    });
  };

  const handleRemoveFromCompare = (productId: string) => {
    setCompareList(prev => prev.filter(p => p.id !== productId));
  };

  // THEME TOGGLE STATE (LIGHT / DARK)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('techseller_theme_v4') === 'dark';
    } catch (e) {
      console.error('Error loading theme from localStorage:', e);
      return false;
    }
  });

  useEffect(() => {
    // Persist admin theme preference without mutating global html classes.
    if (isAdminMode) {
      localStorage.setItem('techseller_theme_v4', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode, isAdminMode]);

  // SAVE STATES TO LOCAL STORAGE ON UPDATE
  useEffect(() => {
    localStorage.setItem('techseller_products_v4', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('techseller_reviews_v4', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('techseller_coupons_v4', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('techseller_orders_v4', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('techseller_returns_v4', JSON.stringify(returns));
  }, [returns]);

  useEffect(() => {
    localStorage.setItem('techseller_cart_v4', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('techseller_profile_v4', JSON.stringify(customerProfile));
  }, [customerProfile]);

  useEffect(() => {
    localStorage.setItem('techseller_recently_viewed_v4', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  useEffect(() => {
    localStorage.setItem('techseller_categories_v4', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('techseller_customer_segments_v4', JSON.stringify(customerSegments));
  }, [customerSegments]);

  useEffect(() => {
    localStorage.setItem('techseller_upsell_rules_v4', JSON.stringify(upsellRules));
  }, [upsellRules]);

  useEffect(() => {
    localStorage.setItem('techseller_collections_v4', JSON.stringify(collections));
  }, [collections]);

  // Real-time order status simulation interval
  useEffect(() => {
    const interval = setInterval(() => {
      let hasUpdates = false;
      const updatedOrders = orders.map(order => {
        if (order.status === 'Pending') {
          hasUpdates = true;
          return { ...order, status: 'Processing' as const };
        } else if (order.status === 'Processing') {
          hasUpdates = true;
          return { ...order, status: 'Shipped' as const };
        } else if (order.status === 'Shipped') {
          hasUpdates = true;
          return { ...order, status: 'Delivered' as const };
        }
        return order;
      });

      if (hasUpdates) {
        setOrders(updatedOrders);
      }
    }, 20000); // Transitions status every 20 seconds for the current session

    return () => clearInterval(interval);
  }, [orders]);

  // SYSTEM ALERT HELPER
  const triggerAlert = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setSystemAlert({ message, type });
    setTimeout(() => setSystemAlert(null), 4000);
  };

  // HANDLERS: CART OPERATIONS
  const handleAddToCart = (product: Product, quantity = 1, color?: string, size?: string) => {
    if (product.stock <= 0) {
      triggerAlert('This product is currently out of stock', 'error');
      return;
    }

    // Generate unique ID based on product + variants
    const colorLabel = color || (product.colors && product.colors.length > 0 ? product.colors[0] : '');
    const sizeLabel = size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : '');
    const itemUniqueId = `${product.id}-${colorLabel}-${sizeLabel}`;

    const existingIndex = cart.findIndex(item => item.id === itemUniqueId);

    if (existingIndex > -1) {
      const existingItem = cart[existingIndex];
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        triggerAlert(`Cannot add more. Only ${product.stock} units available in stock.`, 'error');
        return;
      }

      const updatedCart = [...cart];
      updatedCart[existingIndex] = { ...existingItem, quantity: newQuantity };
      setCart(updatedCart);
    } else {
      if (quantity > product.stock) {
        triggerAlert(`Cannot add. Only ${product.stock} units in stock.`, 'error');
        return;
      }
      const newItem: CartItem = {
        id: itemUniqueId,
        product,
        quantity,
        selectedColor: colorLabel,
        selectedSize: sizeLabel
      };
      setCart([...cart, newItem]);
    }

    triggerAlert(`Added ${quantity}x ${product.name} to shopping bag`, 'success');
  };

  const handleUpdateCartQuantity = (itemId: string, quantity: number) => {
    const updated = cart.map(item => {
      if (item.id === itemId) {
        if (quantity > item.product.stock) {
          triggerAlert(`Only ${item.product.stock} units available in stock.`, 'error');
          return item;
        }
        return { ...item, quantity };
      }
      return item;
    });
    setCart(updated);
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
    triggerAlert('Item removed from shopping bag', 'info');
  };

  const handleMoveToWishlist = (itemId: string, productId: string) => {
    const list = [...customerProfile.wishlist];
    if (!list.includes(productId)) {
      list.push(productId);
      setCustomerProfile({ ...customerProfile, wishlist: list });
    }
    setCart(cart.filter(item => item.id !== itemId));
    triggerAlert('Moved item to wishlist', 'success');
  };

  // HANDLERS: COUPON CODES
  const handleApplyCoupon = (code: string): string | null => {
    const cleanCode = code.trim().toUpperCase();
    let coupon = coupons.find(c => c.code === cleanCode);

    // Special case for Flash Sale coupon if it's missing from state
    if (!coupon && cleanCode === 'FLASH10') {
      const flashCoupon: Coupon = {
        code: 'FLASH10',
        type: 'percent',
        value: 10,
        active: true
      };
      setCoupons(prev => [flashCoupon, ...prev]);
      coupon = flashCoupon;
    }

    if (!coupon) return 'Invalid coupon code. Try WELCOME10';
    if (!coupon.active) return 'This coupon code has expired';

    const subtotal = cart.reduce((sum, item) => {
      const p = item.product.discountPrice || item.product.price;
      return sum + (p * item.quantity);
    }, 0);

    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
      return `This coupon requires a minimum purchase of $${coupon.minPurchase}`;
    }

    setAppliedCoupon(coupon);
    triggerAlert(`Coupon code "${cleanCode}" applied successfully!`, 'success');
    return null; // success
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    triggerAlert('Coupon removed', 'info');
  };

  // HANDLERS: WISHLIST BOOKMARKS
  const handleToggleWishlist = (productId: string) => {
    const list = [...customerProfile.wishlist];
    const index = list.indexOf(productId);
    
    if (index > -1) {
      list.splice(index, 1);
      triggerAlert('Removed from wishlist', 'info');
    } else {
      list.push(productId);
      triggerAlert('Saved to wishlist', 'success');
    }

    setCustomerProfile({ ...customerProfile, wishlist: list });
  };

  const handleTogglePriceDropNotification = (productId: string) => {
    const list = [...(customerProfile.priceDropNotifications || [])];
    const index = list.indexOf(productId);
    
    if (index > -1) {
      list.splice(index, 1);
      triggerAlert('Price drop notification removed', 'info');
    } else {
      list.push(productId);
      triggerAlert('Notification set for price drop!', 'success');
    }

    setCustomerProfile({ ...customerProfile, priceDropNotifications: list });
  };

  const handleMoveAllWishlistToCart = (wishlistProducts: Product[]) => {
    if (wishlistProducts.length === 0) return;

    let updatedCart = [...cart];
    let addedCount = 0;
    let failedCount = 0;

    wishlistProducts.forEach((product) => {
      if (product.stock <= 0) {
        failedCount++;
        return;
      }

      const colorLabel = product.colors && product.colors.length > 0 ? product.colors[0] : '';
      const sizeLabel = product.sizes && product.sizes.length > 0 ? product.sizes[0] : '';
      const itemUniqueId = `${product.id}-${colorLabel}-${sizeLabel}`;

      const existingIndex = updatedCart.findIndex(item => item.id === itemUniqueId);

      if (existingIndex > -1) {
        const existingItem = updatedCart[existingIndex];
        const newQuantity = existingItem.quantity + 1;

        if (newQuantity <= product.stock) {
          updatedCart[existingIndex] = { ...existingItem, quantity: newQuantity };
          addedCount++;
        } else {
          failedCount++;
        }
      } else {
        const newItem: CartItem = {
          id: itemUniqueId,
          product,
          quantity: 1,
          selectedColor: colorLabel,
          selectedSize: sizeLabel
        };
        updatedCart.push(newItem);
        addedCount++;
      }
    });

    setCart(updatedCart);

    // Remove successfully added items from wishlist
    const remainingWishlist = customerProfile.wishlist.filter(
      productId => !wishlistProducts.some(wp => wp.id === productId && wp.stock > 0)
    );
    setCustomerProfile(prev => ({ ...prev, wishlist: remainingWishlist }));

    if (addedCount > 0) {
      triggerAlert(`Added ${addedCount} wishlist items to your shopping bag!`, 'success');
    }
    if (failedCount > 0) {
      triggerAlert(`${failedCount} items could not be added (out of stock).`, 'error');
    }
  };

  // HANDLERS: WALLET & LOYALTY STATE
  const handleTopUpWallet = (amount: number) => {
    setCustomerProfile(prev => ({
      ...prev,
      walletBalance: prev.walletBalance + amount
    }));
    triggerAlert(`Successfully deposited $${amount.toFixed(2)} into your wallet.`, 'success');
  };

  const handleRedeemPoints = (pointsCost: number, discountAmount: number, generatedCode: string) => {
    // Register custom coupon
    const newCoup: Coupon = {
      code: generatedCode,
      type: 'fixed',
      value: discountAmount,
      active: true,
      minPurchase: discountAmount * 3 // reasonable min spend rule
    };

    setCoupons([newCoup, ...coupons]);
    setCustomerProfile(prev => ({
      ...prev,
      points: prev.points - pointsCost
    }));
    triggerAlert(`Redeemed ${pointsCost} points for coupon code ${generatedCode}!`, 'success');
  };

  // HANDLERS: ORDER & CHECKOUT COMPLETED
  const handleCompletePurchase = (order: Order, pointsEarned: number, totalCost: number) => {
    // 1. Add order to order state list
    setOrders(prev => [order, ...prev]);

    // 2. Adjust products stock levels and increment sales
    setProducts(prev => prev.map(p => {
      const purchasedItem = order.items.find(item => item.productId === p.id);
      if (purchasedItem) {
        return {
          ...p,
          stock: Math.max(0, p.stock - purchasedItem.quantity),
          sales: (p.sales || 0) + purchasedItem.quantity
        };
      }
      return p;
    }));

    // 3. Update customer profile wallet & loyalty points (only deduct wallet if paid via wallet)
    const isWalletPayment = (order.paymentMethod || '').toLowerCase().includes('wallet');
    setCustomerProfile(prev => ({
      ...prev,
      walletBalance: isWalletPayment ? Math.max(0, prev.walletBalance - totalCost) : prev.walletBalance,
      points: prev.points + pointsEarned
    }));

    // 4. Clear shopping cart and coupon
    if (directCheckoutItem) {
      setDirectCheckoutItem(null);
    } else {
      setCart([]);
    }
    setAppliedCoupon(null);

    // 5. Record Finance Transaction
    const totalCOGS = order.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return sum;
      const cost = product.costPrice || (product.price * 0.6);
      return sum + (cost * item.quantity);
    }, 0);
    
    handleAddTransaction({
      id: 'TX-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'Income',
      category: 'Sales',
      amount: order.total,
      description: `Online Order ${order.id} Revenue`,
      reference: order.id
    });
    
    handleAddTransaction({
      id: 'TX-' + (Date.now() + 1),
      date: new Date().toISOString().split('T')[0],
      type: 'Expense',
      category: 'COGS',
      amount: totalCOGS,
      description: `COGS for ${order.id}`,
      reference: order.id
    });
  };

  // ADMIN UPDATER OPERATIONS
  const handleAddPOSOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
    setProducts(prev => prev.map(p => {
      const purchasedItem = order.items.find(item => item.productId === p.id);
      if (purchasedItem) {
        return {
          ...p,
          stock: Math.max(0, p.stock - purchasedItem.quantity),
          sales: (p.sales || 0) + purchasedItem.quantity
        };
      }
      return p;
    }));
    triggerAlert(`POS checkout registered successfully under receipt ID ${order.id}`, 'success');

    // NOTE: Finance transactions for POS orders are now handled by DashboardView/POS module 
    // to preserve granular tax/shipping/discount breakdown.
  };

  const handleAddTransaction = (tx: FinanceTransaction) => {
    setFinanceTransactions(prev => [tx, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setFinanceTransactions(prev => prev.filter(t => t.id !== id));
  };

  // ── ERP: PURCHASE ORDERS ──────────────────────────────────────────────────
  const handleAddPurchaseOrder = (po: PurchaseOrder) => {
    setPurchaseOrders(prev => [po, ...prev]);
  };

  const handleUpdatePurchaseOrder = (po: PurchaseOrder) => {
    setPurchaseOrders(prev => prev.map(p => p.id === po.id ? po : p));
  };

  const handleDeletePurchaseOrder = (id: string) => {
    setPurchaseOrders(prev => prev.filter(p => p.id !== id));
  };

  const handleReceiveGRN = (poId: string, receivedItems: { lineItemId: string; receivedQty: number }[]) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id !== poId) return po;
      const updatedItems = po.items.map(item => {
        const recv = receivedItems.find(r => r.lineItemId === item.id);
        return recv ? { ...item, receivedQty: item.receivedQty + recv.receivedQty } : item;
      });
      const allReceived = updatedItems.every(i => i.receivedQty >= i.orderedQty);
      const anyReceived = updatedItems.some(i => i.receivedQty > 0);
      return {
        ...po,
        items: updatedItems,
        status: allReceived ? 'Received' : anyReceived ? 'Partially Received' : po.status,
        receivedDate: allReceived ? new Date().toISOString().split('T')[0] : po.receivedDate,
      };
    }));

    // Auto-update product stock counts
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      receivedItems.forEach(recv => {
        const lineItem = po.items.find(i => i.id === recv.lineItemId);
        if (lineItem?.productId && recv.receivedQty > 0) {
          setProducts(prev => prev.map(p =>
            p.id === lineItem.productId ? { ...p, stock: p.stock + recv.receivedQty } : p
          ));
        }
      });
    }
  };

  // ── ERP: REPAIR JOBS ──────────────────────────────────────────────────────
  const handleAddRepairJob = (job: RepairJob) => {
    setRepairJobs(prev => [job, ...prev]);
  };

  const handleUpdateRepairJob = (job: RepairJob) => {
    setRepairJobs(prev => prev.map(j => j.id === job.id ? job : j));
  };

  const handleDeleteRepairJob = (id: string) => {
    setRepairJobs(prev => prev.filter(j => j.id !== id));
  };

  const handleDeductPartsFromStock = (productId: string, qty: number) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, stock: Math.max(0, p.stock - qty) } : p
    ));
  };

  // ── ERP: STOCK UNITS ──────────────────────────────────────────────────────
  const handleAddStockUnit = (unit: StockUnit) => {
    setStockUnits(prev => [unit, ...prev]);
  };

  const handleUpdateStockUnit = (unit: StockUnit) => {
    setStockUnits(prev => prev.map(u => u.id === unit.id ? unit : u));
  };

  // ── ERP PHASE 2: WAREHOUSES & TRANSFERS ──────────────────────────────────
  const handleAddWarehouse = (wh: WarehouseLocation) => {
    setWarehouses(prev => [wh, ...prev]);
  };

  const handleUpdateWarehouse = (wh: WarehouseLocation) => {
    setWarehouses(prev => prev.map(w => w.id === wh.id ? wh : w));
  };

  const handleDeleteWarehouse = (id: string) => {
    setWarehouses(prev => prev.filter(w => w.id !== id));
  };

  const handleAddStockTransfer = (transfer: StockTransfer) => {
    setStockTransfers(prev => [transfer, ...prev]);
  };

  const handleUpdateStockTransfer = (transfer: StockTransfer) => {
    setStockTransfers(prev => prev.map(t => t.id === transfer.id ? transfer : t));
  };

  const handleCompleteStockTransfer = (transferId: string) => {
    setStockTransfers(prev => prev.map(st => {
      if (st.id !== transferId) return st;
      return {
        ...st,
        status: 'Completed',
        completedDate: new Date().toISOString().split('T')[0],
      };
    }));

    const st = stockTransfers.find(t => t.id === transferId);
    if (st) {
      const destWh = warehouses.find(w => w.id === st.toLocationId);
      setStockUnits(prev => prev.map(u => {
        const itemMatch = st.items.find(i => i.productId === u.productId);
        if (itemMatch && u.status === 'In Stock') {
          return {
            ...u,
            locationId: st.toLocationId,
            locationName: destWh?.name || st.toLocationName,
            auditLog: [
              {
                date: new Date().toISOString(),
                action: 'Transferred Location',
                notes: `Transferred from ${st.fromLocationName} to ${st.toLocationName} via ${st.id}`,
              },
              ...u.auditLog,
            ],
          };
        }
        return u;
      }));
    }
  };

  const handleAddUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    const updated = orders.map(ord => {
      if (ord.id === orderId) {
        return { ...ord, status };
      }
      return ord;
    });
    setOrders(updated);
    triggerAlert(`Order status updated to "${status}"`, 'success');
  };

  const handleUpdateReturnStatus = (returnId: string, status: ReturnRequest['status'], adminNote?: string) => {
    const returnReq = returns.find(r => r.id === returnId);
    
    const updated = returns.map(ret => {
      if (ret.id === returnId) {
        return { 
          ...ret, 
          status, 
          adminNote: adminNote || ret.adminNote,
          resolutionDate: status !== 'Pending' ? new Date().toISOString() : ret.resolutionDate
        };
      }
      return ret;
    });
    setReturns(updated);

    // If status is changed to Completed (Refunded), record finance transaction
    if (status === 'Completed' && returnReq && returnReq.status !== 'Completed') {
      handleAddTransaction({
        id: 'TX-REFUND-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: 'Expense',
        category: 'Refunds',
        amount: returnReq.totalAmount || 0,
        description: `Refund for Return Request ${returnId}`,
        reference: returnId,
        tags: ['refund', 'return']
      });
      triggerAlert(`Return ${returnId} completed and refund transaction recorded.`, 'success');
    } else {
      triggerAlert(`Return ${returnId} marked as ${status}`, 'success');
    }
  };

  const handleAddReview = (productId: string, rating: number, comment: string) => {
    const newRev: Review = {
      id: 'rev-' + Date.now(),
      productId,
      userName: customerProfile.name,
      rating,
      comment,
      date: new Date().toISOString().split('T')[0],
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&h=50&q=80`
    };

    // Update reviews
    const updatedReviews = [newRev, ...reviews];
    setReviews(updatedReviews);

    // Recalculate average product rating in product catalog
    const prodReviews = updatedReviews.filter(r => r.productId === productId);
    const avgRating = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;

    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          rating: parseFloat(avgRating.toFixed(1)),
          reviewsCount: prodReviews.length
        };
      }
      return p;
    }));
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    triggerAlert(`ITEM ${updated.id} inventory metrics updated`, 'success');
  };

  const handleAddProduct = (newProd: Product) => {
    setProducts(prev => [newProd, ...prev]);
    triggerAlert(`New ITEM added to active store catalog`, 'success');
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => String(p.id) !== String(id)));
    triggerAlert(`ITEM ${id} has been removed from the catalog`, 'info');
  };

  const handleClearAllProducts = async () => {
    setProducts([]);
    try {
      localStorage.setItem('techseller_products_v4', JSON.stringify([]));
      await fetch('/api/products', { method: 'DELETE' });
    } catch (e) {
      console.warn('Failed to sync empty products to server API:', e);
    }
    triggerAlert('All products have been deleted from the catalog', 'info');
  };

  const handleAddCoupon = (newCoup: Coupon) => {
    setCoupons(prev => [newCoup, ...prev]);
    triggerAlert(`Campaign coupon "${newCoup.code}" registered`, 'success');
  };

  const handleToggleCoupon = (code: string) => {
    setCoupons(prev => prev.map(c => c.code === code ? { ...c, active: !c.active } : c));
    triggerAlert('Coupon activity toggled', 'info');
  };

  const handleAddCategory = (newCat: string) => {
    const formatted = newCat.trim();
    if (!formatted) return;
    if (categories.some(c => c.toLowerCase() === formatted.toLowerCase())) {
      triggerAlert('Category already exists', 'error');
      return;
    }
    setCategories([...categories, formatted]);
    triggerAlert(`Category "${formatted}" added`, 'success');
  };

  const handleEditCategory = (oldCat: string, newCat: string) => {
    const formatted = newCat.trim();
    if (!formatted) return;
    if (oldCat === formatted) return;
    if (categories.some(c => c.toLowerCase() === formatted.toLowerCase() && c.toLowerCase() !== oldCat.toLowerCase())) {
      triggerAlert('A category with that name already exists', 'error');
      return;
    }

    // 1. Update categories array
    setCategories(categories.map(c => c === oldCat ? formatted : c));

    // 2. Update all products in this category
    setProducts(prev => prev.map(p => p.category === oldCat ? { ...p, category: formatted } : p));

    // 3. Update activeCategory if it was this one
    if (activeCategory === oldCat) {
      setActiveCategory(formatted);
    }

    triggerAlert(`Category renamed from "${oldCat}" to "${formatted}"`, 'success');
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (categories.length <= 1) {
      triggerAlert('You must keep at least one category', 'error');
      return;
    }

    // 1. Filter out the category
    const remainingCats = categories.filter(c => c !== catToDelete);
    setCategories(remainingCats);

    // 2. Move any products in this category to the first remaining category
    const fallbackCategory = remainingCats[0] || 'Uncategorized';
    setProducts(prev => prev.map(p => p.category === catToDelete ? { ...p, category: fallbackCategory } : p));

    // 3. Reset activeCategory if needed
    if (activeCategory === catToDelete) {
      setActiveCategory('All');
    }

    triggerAlert(`Category "${catToDelete}" deleted. Products moved to "${fallbackCategory}".`, 'success');
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    triggerAlert('Review moderated and deleted successfully.', 'success');
  };

  const handleAddSegment = (segment: CustomerSegment) => {
    setCustomerSegments(prev => [segment, ...prev]);
    triggerAlert('New customer segment created.', 'success');
  };

  const handleDeleteSegment = (id: string) => {
    setCustomerSegments(prev => prev.filter(s => s.id !== id));
    triggerAlert('Customer segment deleted.', 'info');
  };

  const handleAddUpsellRule = (rule: UpsellRule) => {
    setUpsellRules(prev => [rule, ...prev]);
    triggerAlert('New upsell rule configured.', 'success');
  };

  const handleToggleUpsellRule = (id: string) => {
    setUpsellRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
    triggerAlert('Upsell rule active status toggled.', 'success');
  };

  const handleDeleteUpsellRule = (id: string) => {
    setUpsellRules(prev => prev.filter(r => r.id !== id));
    triggerAlert('Upsell rule removed.', 'info');
  };

  const handleAddCollection = (newColl: string) => {
    const formatted = newColl.trim();
    if (!formatted) return;
    if (collections.some(c => c.toLowerCase() === formatted.toLowerCase())) {
      triggerAlert('Collection already exists', 'error');
      return;
    }
    setCollections(prev => [...prev, formatted]);
    triggerAlert(`Collection "${formatted}" added`, 'success');
  };

  const handleDeleteCollection = (collToDelete: string) => {
    setCollections(prev => prev.filter(c => c !== collToDelete));
    // Reset product collections that match
    setProducts(prev => prev.map(p => p.collection === collToDelete ? { ...p, collection: undefined } : p));
    triggerAlert(`Collection "${collToDelete}" deleted`, 'success');
  };

  const handleResetCatalog = async () => {
    if (!confirm('Are you sure you want to restore the default store catalog and states? Your current custom edits will be cleared.')) {
      return;
    }

    const legacyKeys = [
      'techseller_products',
      'techseller_reviews',
      'techseller_coupons',
      'techseller_orders',
      'techseller_cart',
      'techseller_profile',
      'techseller_recently_viewed',
      'techseller_categories',
      'techseller_finance_transactions',
      'techseller_users',
      'techseller_returns',
      'techseller_customer_segments',
      'techseller_upsell_rules',
      'techseller_collections',
      'techseller_store_settings'
    ];

    const currentKeys = [
      'techseller_products_v4',
      'techseller_reviews_v4',
      'techseller_coupons_v4',
      'techseller_orders_v4',
      'techseller_customers_v4',
      'techseller_finance_transactions_v4',
      'techseller_users_v4',
      'techseller_returns_v4',
      'techseller_cart_v4',
      'techseller_profile_v4',
      'techseller_recently_viewed_v4',
      'techseller_categories_v4',
      'techseller_customer_segments_v4',
      'techseller_upsell_rules_v4',
      'techseller_collections_v4',
      'techseller_store_settings_v4',
      'techseller_theme_v4',
      'techseller_admin_mode_v4'
    ];

    [...legacyKeys, ...currentKeys].forEach((key) => localStorage.removeItem(key));

    const resetPayload = {
      storeSettings: DEFAULT_STORE_SETTINGS,
      products: INITIAL_PRODUCTS,
      reviews: INITIAL_REVIEWS,
      coupons: INITIAL_COUPONS,
      orders: [],
      customers: INITIAL_CUSTOMERS,
      financeTransactions: [],
      users: [],
      returns: [],
      categories: ['Laptops', 'Desktops', 'Monitors', 'Workstations', 'Apple Mac', 'Parts'],
      customerSegments: [],
      upsellRules: [],
      collections: ['Laptops', 'Apple Mac'],
      purchaseOrders: [],
      repairJobs: [],
      stockUnits: [],
      warehouses: INITIAL_WAREHOUSES,
      stockTransfers: []
    };

    try {
      await Promise.all([
        fetch('/api/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resetPayload)
        }),
        fetch('/api/admin-extras', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ suppliers: [], supplierOrders: [], shipments: [], inventoryLogs: [] })
        })
      ]);
    } catch (error) {
      console.warn('Could not fully reset server state:', error);
    }

    window.location.href = window.location.origin + window.location.pathname;
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setRecentlyViewed(prev => {
      const filtered = prev.filter(id => id !== product.id);
      return [product.id, ...filtered].slice(0, 5);
    });
  };

  const recentlyViewedProducts = recentlyViewed
    .map(id => products.find(p => p.id === id))
    .filter((p): p is Product => !!p);

  // FILTER PILLS CONFIGURATION & COUNTS
  const FILTER_PILLS = [
    { id: 'Grade A', label: 'Grade A', icon: Award },
    { id: 'Intel Core i7', label: 'Intel Core i7', icon: Cpu },
    { id: 'Under $500', label: 'Under $500', icon: DollarSign },
    { id: 'New Arrival', label: 'New Arrival', icon: Sparkles },
    { id: 'Ex-Corporate', label: 'Ex-Corporate', icon: Building2 },
    { id: '12M Warranty', label: '12M Warranty', icon: ShieldCheck },
  ];

  const getPillCount = (pillId: string) => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch = !searchQuery || 
                            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesCategory || !matchesSearch) return false;

      if (pillId === 'Grade A') {
        return p.tags.some(t => t.toLowerCase().includes('grade a')) || 
               (p.specs && p.specs['Grade'] && p.specs['Grade'].toLowerCase().includes('grade a'));
      }
      if (pillId === 'Intel Core i7') {
        return p.tags.some(t => t.toLowerCase().includes('i7')) || 
               p.name.toLowerCase().includes('i7') || 
               (p.specs && p.specs['CPU'] && p.specs['CPU'].toLowerCase().includes('i7'));
      }
      if (pillId === 'Under $500') {
        const price = p.discountPrice || p.price;
        return price <= 500;
      }
      if (pillId === 'New Arrival') {
        return p.tags.some(t => t.toLowerCase().includes('new') || t.toLowerCase().includes('arrival')) || 
               p.id === 'act-prod-1' || p.id === 'act-prod-2' ||
               (p.rating >= 4.8 && p.reviewsCount > 50);
      }
      if (pillId === 'Ex-Corporate') {
        return p.tags.some(t => t.toLowerCase().includes('corporate') || t.toLowerCase().includes('ex-')) ||
               p.description.toLowerCase().includes('corporate') ||
               p.description.toLowerCase().includes('ex-');
      }
      if (pillId === '12M Warranty') {
        return p.tags.some(t => t.toLowerCase().includes('warranty')) ||
               (p.specs && p.specs['Warranty'] && p.specs['Warranty'].includes('12'));
      }
      return p.tags.some(t => t.toLowerCase().includes(pillId.toLowerCase())) ||
             p.name.toLowerCase().includes(pillId.toLowerCase());
    }).length;
  };

  // FILTERED & SORTED PRODUCTS
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesTagFilter = true;
    if (activeTagFilter === 'Grade A') {
      matchesTagFilter = p.tags.some(t => t.toLowerCase().includes('grade a')) || 
                        (p.specs && p.specs['Grade'] && p.specs['Grade'].toLowerCase().includes('grade a'));
    } else if (activeTagFilter === 'Intel Core i7') {
      matchesTagFilter = p.tags.some(t => t.toLowerCase().includes('i7')) || 
                        p.name.toLowerCase().includes('i7') || 
                        (p.specs && p.specs['CPU'] && p.specs['CPU'].toLowerCase().includes('i7'));
    } else if (activeTagFilter === 'Under $500') {
      const price = p.discountPrice || p.price;
      matchesTagFilter = price <= 500;
    } else if (activeTagFilter === 'New Arrival') {
      matchesTagFilter = p.tags.some(t => t.toLowerCase().includes('new') || t.toLowerCase().includes('arrival')) || 
                        p.id === 'act-prod-1' || p.id === 'act-prod-2' ||
                        (p.rating >= 4.8 && p.reviewsCount > 50);
    } else if (activeTagFilter === 'Ex-Corporate') {
      matchesTagFilter = p.tags.some(t => t.toLowerCase().includes('corporate') || t.toLowerCase().includes('ex-')) ||
                        p.description.toLowerCase().includes('corporate') ||
                        p.description.toLowerCase().includes('ex-');
    } else if (activeTagFilter === '12M Warranty') {
      matchesTagFilter = p.tags.some(t => t.toLowerCase().includes('warranty')) ||
                        (p.specs && p.specs['Warranty'] && p.specs['Warranty'].includes('12'));
    } else if (activeTagFilter) {
      matchesTagFilter = p.tags.some(t => t.toLowerCase().includes(activeTagFilter.toLowerCase())) ||
                        p.name.toLowerCase().includes(activeTagFilter.toLowerCase());
    }

    return matchesCategory && matchesSearch && matchesTagFilter;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') {
      const priceA = a.discountPrice || a.price;
      const priceB = b.discountPrice || b.price;
      return priceA - priceB;
    }
    if (sortBy === 'price-desc') {
      const priceA = a.discountPrice || a.price;
      const priceB = b.discountPrice || b.price;
      return priceB - priceA;
    }
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    return 0; // default
  });

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Billing calculation for checkout forwarding
  const cartSubtotal = cart.reduce((sum, item) => {
    const price = item.product.discountPrice || item.product.price;
    return sum + (price * item.quantity);
  }, 0);
  const cartIsFreeShip = cartSubtotal >= 150 || (appliedCoupon && appliedCoupon.code === 'FREESHIP');
  const cartShipping = cartSubtotal === 0 ? 0 : (cartIsFreeShip ? 0 : 9.99);
  const cartTax = cartSubtotal * 0.08;
  let cartDiscount = 0;
  if (appliedCoupon && cartSubtotal > 0) {
    if (appliedCoupon.type === 'percent') {
      cartDiscount = cartSubtotal * (appliedCoupon.value / 100);
    } else if (appliedCoupon.type === 'fixed') {
      cartDiscount = appliedCoupon.value;
    }
  }
  const cartTotal = Math.max(0, cartSubtotal + cartTax + cartShipping - cartDiscount);

  // Billing calculation for direct checkout (Buy Now) forwarding
  const directSubtotal = directCheckoutItem
    ? (directCheckoutItem.product.discountPrice || directCheckoutItem.product.price) * directCheckoutItem.quantity
    : 0;
  const directIsFreeShip = directSubtotal >= 150 || (appliedCoupon && appliedCoupon.code === 'FREESHIP');
  const directShipping = directSubtotal === 0 ? 0 : (directIsFreeShip ? 0 : 9.99);
  const directTax = directSubtotal * 0.08;
  let directDiscount = 0;
  if (appliedCoupon && directSubtotal > 0) {
    if (appliedCoupon.type === 'percent') {
      directDiscount = directSubtotal * (appliedCoupon.value / 100);
    } else if (appliedCoupon.type === 'fixed') {
      directDiscount = appliedCoupon.value;
    }
  }
  const directTotal = Math.max(0, directSubtotal + directTax + directShipping - directDiscount);

  const handleHardReset = async () => {
    setProducts([]);
    setOrders([]);
    setReviews([]);
    setCoupons([]);

    const keysToClear = [
      'techseller_products_v4',
      'techseller_reviews_v4',
      'techseller_coupons_v4',
      'techseller_orders_v4',
      'techseller_customers_v4',
      'techseller_finance_transactions_v4',
      'techseller_cart_v4',
      'techseller_profile_v4',
      'techseller_recently_viewed_v4',
      'techseller_categories_v4',
      'techseller_customer_segments_v4',
      'techseller_upsell_rules_v4',
      'techseller_collections_v4',
      'techseller_admin_mode_v4',
      'techseller_store_settings_v4',
      'techseller_returns_v4',
      'techseller_theme_v4'
    ];
    keysToClear.forEach(key => localStorage.removeItem(key));
    localStorage.setItem('techseller_products_v4', JSON.stringify([]));
    localStorage.setItem('techseller_reviews_v4', JSON.stringify([]));
    localStorage.setItem('techseller_coupons_v4', JSON.stringify([]));
    localStorage.setItem('techseller_orders_v4', JSON.stringify([]));

    try {
      await fetch('/api/products', { method: 'DELETE' });
      await fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSettings: DEFAULT_STORE_SETTINGS,
          products: [],
          reviews: [],
          coupons: [],
          orders: [],
          customers: [],
          financeTransactions: [],
          users: [],
          returns: [],
          categories: [],
          customerSegments: [],
          upsellRules: [],
          collections: []
        })
      });
    } catch (e) {
      console.warn('Could not reset server database state:', e);
    }

    // Hard reload to base URL to clear any memory states
    window.location.href = window.location.origin + window.location.pathname;
  };

  const handleAddReturnRequest = (req: ReturnRequest) => {
    triggerAlert(`Return request ${req.id} submitted successfully!`, 'success');
  };

  if (saasMode === 'landing') {
    return (
      <TenantProvider>
        <SaaSLandingPage
          onOpenOnboarding={(code) => {
            if (code) setOnboardingPlanCode(code);
            setShowOnboardingModal(true);
          }}
          onOpenSuperAdmin={() => {
            setLoginRole('superadmin');
            setSaasMode('login');
          }}
          onOpenLogin={() => {
            setLoginRole('storeadmin');
            setSaasMode('login');
          }}
          onOpenStoreERP={() => setSaasMode('store')}
        />
        <SaaSOnboardingModal
          isOpen={showOnboardingModal}
          onClose={() => setShowOnboardingModal(false)}
          initialPlanCode={onboardingPlanCode}
          onSuccess={(data) => {
            triggerAlert(`Store '${data.tenant.name}' provisioned successfully!`, 'success');
            setSaasMode('store');
          }}
        />
      </TenantProvider>
    );
  }

  if (saasMode === 'login') {
    return (
      <TenantProvider>
        <SaaSLoginPage
          onBackToLanding={() => setSaasMode('landing')}
          onLoginSuccess={(data) => {
            if (data.user) {
              setCurrentUser(data.user);
              localStorage.setItem('currentUser', JSON.stringify(data.user));
            }
            if (data.token) {
              localStorage.setItem('authToken', data.token);
            }
            setIsAdminMode(true);
            try {
              localStorage.setItem('techseller_admin_mode_v4', 'true');
            } catch (e) {}

            if (data.isSuperAdmin) {
              triggerAlert(`Super Admin authenticated successfully!`, 'success');
              setSaasMode('superadmin');
            } else {
              triggerAlert(`Logged into store '${data.tenant?.name || 'Workspace'}'`, 'success');
              setSaasMode('store');
            }
          }}

        />
      </TenantProvider>
    );
  }


  if (saasMode === 'superadmin') {


    return (
      <TenantProvider>
        <SuperAdminDashboard
          onBackToApp={() => {
            setIsAdminMode(true);
            setSaasMode('store');
          }}
          onLogout={() => {
            setIsImpersonating(false);
            setCurrentUser(null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            setSaasMode('login');
          }}
          onImpersonateStore={(tenant) => {
            setIsImpersonating(true);
            setIsAdminMode(true);
            setSaasMode('store');
            triggerAlert(`Super Admin now impersonating '${tenant.name}' with ALL feature modules unlocked!`, 'info');
          }}
          currentUser={currentUser}
        />
      </TenantProvider>
    );
  }


  return (
    <TenantProvider>
      <TenantFeatureProvider
        isImpersonating={isImpersonating}
        onOpenUpgradeModal={() => {
          setSettingsInitialTab('billing');
          setIsSettingsOpen(true);
        }}
      >
      <div
        className={`min-h-screen flex flex-col selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-950 ${
          isAdminMode ? 'admin-theme' : 'storefront-theme'
        } ${isAdminMode && isDarkMode ? 'dark' : ''}`}
        id="store-app-root"
      >

        {/* IMPERSONATION CONTROL BANNER */}
        {isImpersonating && (
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-purple-600 text-white px-4 py-2 flex items-center justify-between shadow-md z-50 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="text-base">🎭</span>
              <span>SUPER ADMIN IMPERSONATION ACTIVE:</span>
              <span className="bg-white/20 px-2 py-0.5 rounded font-extrabold uppercase">All Feature Modules Unlocked (Bypassing Tier Gate)</span>
            </div>
            <button
              onClick={() => {
                setIsImpersonating(false);
                setSaasMode('superadmin');
                triggerAlert('Exited impersonation mode. Returned to Super Admin Dashboard.', 'success');
              }}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-amber-950 rounded-lg font-black shadow-xs transition flex items-center gap-1"
            >
              ✕ Exit Impersonation Mode
            </button>
          </div>
        )}

        {/* SAAS PLATFORM CONTROL BAR */}
        <div className="bg-slate-950 text-slate-200 border-b border-indigo-500/30 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white uppercase tracking-wider">StoreERP SaaS Platform</span>
            <span className="text-slate-400">|</span>
            <span className="text-indigo-300 font-mono">Store: {storeSettings.storeName}</span>
          </div>
          <div className="flex items-center gap-2">
            {isImpersonating ? (
              <button
                onClick={() => setSaasMode('superadmin')}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-extrabold transition flex items-center gap-1"
              >
                ⚙️ Return to Super Admin Panel
              </button>
            ) : (
              <button
                onClick={() => setSaasMode('login')}
                className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold transition flex items-center gap-1"
              >
                🔑 Sign In
              </button>
            )}

            <button
              onClick={() => setSaasMode('landing')}
              className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold transition"
            >
              🌐 SaaS Landing &amp; Pricing
            </button>
            <button
              onClick={() => setShowOnboardingModal(true)}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
            >
              + Launch New Store
            </button>
          </div>
        </div>




      
      {/* GLOBAL SYSTEM ALERTS */}
      <AnimatePresence>
        {systemAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-none px-6 py-4 shadow-2xl backdrop-blur-md text-[11px] font-bold uppercase tracking-widest border transition-all ${
              systemAlert.type === 'success' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 border-neutral-400 dark:border-neutral-700' :
              systemAlert.type === 'error' ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900' :
              'bg-[#1a1a1a] text-white border-neutral-800'
            }`}
            id="system-alert-banner"
          >
            {systemAlert.type === 'success' ? <ShieldCheck className="h-4 w-4 text-neutral-950 dark:text-neutral-50" /> : <AlertCircle className="h-4 w-4" />}
            <span>{systemAlert.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REAL-TIME OFFLINE STATUS & AUTO-SYNC BANNER */}
      <OfflineStatusBanner />

      {/* STICKY NAVIGATION HEADER */}
      <Navbar
        currentUser={currentUser}
        onLogoutAccount={async () => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
          } catch (e) {}
          setCurrentUser(null);
          setIsAdminMode(false);
          setSaasMode('login');
          triggerAlert('Logged out successfully.', 'info');
        }}

        activeCategory={activeCategory}
        setActiveCategory={(cat) => {
          setIsAdminMode(false);
          setActiveCategory(cat);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartCount={cartCount}
        onOpenCart={() => {
          prefetchCheckoutWorkspace();
          setIsCartOpen(true);
        }}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenSettings={() => {
          setSettingsInitialTab('general');
          setIsSettingsOpen(true);
        }}
        onPrefetchAdmin={prefetchAdminWorkspace}
        onPrefetchAccount={prefetchAccountWorkspace}
        onPrefetchCheckout={prefetchCheckoutWorkspace}
        onPrefetchSettings={() => {
          void loadSettingsModal();
        }}
        storeSettings={storeSettings}
        isAdminMode={isAdminMode}
        setIsAdminMode={setIsAdminMode}
        customerPoints={customerProfile.points}
        customerWallet={customerProfile.walletBalance}
        products={products}
        onSelectProduct={handleViewProduct}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => {
          setIsDarkMode(!isDarkMode);
          triggerAlert(`Theme switched to ${!isDarkMode ? 'Dark' : 'Light'} Mode`, 'success');
        }}
        categories={categories}
        onOpenTrackOrder={() => setShowTrackOrderModal(true)}
        onOpenCompare={() => setShowCompareModal(true)}
        compareCount={compareList.length}
        onOpenPOS={() => setShowPOSView(true)}
        onOpenPCBuilder={() => setShowPCBuilderModal(true)}
        onOpenCustomerPortal={() => setShowCustomerPortalModal(true)}
      />




      {/* CORE ROUTING SWITCH: CUSTOMER VIEW vs ADMIN VIEW */}
      <main className="flex-1">
        {!isAdminMode ? (
          /* ================= CUSTOMER STOREFRONT ================= */
          <div id="customer-storefront-view" className="storefront-scope">
            {!searchQuery && activeCategory === 'All' && (
              <div className="w-full pt-3 pr-0 pl-0 flex justify-end">
                <FlashSaleBanner onApplyCoupon={handleApplyCoupon} couponCode="FLASH10" />
              </div>
            )}

            <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 lg:px-8 flex justify-end">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 font-bold">Sort</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="rounded-none border border-neutral-400 bg-white px-2 py-1 font-sans text-[10px] uppercase tracking-wider text-neutral-700 outline-none focus:border-neutral-950 cursor-pointer"
                    id="product-catalog-sort-select"
                  >
                    <option value="default">Default</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>
                <div className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                  Showing <span className="text-neutral-950 dark:text-neutral-100">{filteredProducts.length}</span> Products
                </div>
              </div>
            </div>

            {/* DYNAMIC REAL-PHOTO SHOP BY CATEGORY SECTION */}
            {!searchQuery && activeCategory === 'All' && (
              <ShopByCategoryGrid
                products={products}
                activeCategory={activeCategory}
                onSelectCategory={(catName) => setActiveCategory(catName)}
              />
            )}

            
            {/* PRODUCT CATALOG GRID SECTION */}
            <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" id="product-catalog-grid">
              
              {/* PUBLIC BACK BUTTON */}
              {(activeCategory !== 'All' || searchQuery || activeTagFilter) && (
                <div className="mb-8 animate-fade-in flex">
                  <button
                    onClick={() => {
                      setActiveCategory('All');
                      setSearchQuery('');
                      setActiveTagFilter(null);
                    }}
                    className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-mono text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200 dark:border-slate-800 shadow-sm group"
                    id="public-back-btn"
                  >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                  </button>
                </div>
              )}

              {/* Category indicator / heading */}
              <div className="mb-8 flex flex-wrap items-end gap-4 border-b border-neutral-400 pb-6">
                <div className="text-left">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-1 block">Collection</span>
                  <h2 className="font-sans text-xl font-extrabold uppercase tracking-widest text-neutral-900 dark:text-white">
                    {searchQuery ? `Search Results for "${searchQuery}"` : `${activeCategory} Collection`}
                  </h2>
                </div>
              </div>

              {/* HORIZONTAL INTERACTIVE FILTER PILLS ROW */}
              <div className="mb-8 flex flex-col space-y-2.5 bg-slate-50/70 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800" id="interactive-filter-pills-row">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Quick Specs & Attribute Filters</span>
                    {activeTagFilter && (
                      <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider flex items-center gap-1 border border-blue-200 dark:border-blue-800">
                        active: <strong className="text-blue-800 dark:text-blue-200">{activeTagFilter}</strong>
                      </span>
                    )}
                  </div>

                  {activeTagFilter && (
                    <button
                      onClick={() => setActiveTagFilter(null)}
                      className="font-mono text-[10px] uppercase font-black text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900 transition-all"
                    >
                      <X className="h-3 w-3" /> Clear Filter
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none">
                  <button
                    onClick={() => setActiveTagFilter(null)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-mono uppercase font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm ${
                      activeTagFilter === null
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 scale-105 ring-2 ring-slate-900/20'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Tag className="h-3.5 w-3.5" />
                    <span>All Items</span>
                  </button>

                  {FILTER_PILLS.map((pill) => {
                    const IconComp = pill.icon;
                    const count = getPillCount(pill.id);
                    const isActive = activeTagFilter === pill.id;

                    return (
                      <button
                        key={pill.id}
                        onClick={() => setActiveTagFilter(isActive ? null : pill.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-mono uppercase font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border shadow-sm ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/25 font-black scale-105 ring-2 ring-blue-500/30'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-blue-50/60 dark:hover:bg-slate-800'
                        }`}
                      >
                        <IconComp className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                        <span>{pill.label}</span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-full font-mono ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid or empty state */}
              {filteredProducts.length === 0 ? (
                <div className="rounded-none border border-dashed border-neutral-400 py-16 text-center bg-white">
                  <Compass className="h-10 w-10 text-neutral-300 mx-auto mb-3 animate-spin-slow" />
                  <h4 className="font-sans text-xs font-bold text-neutral-900 uppercase tracking-wider">No essentials match your filter</h4>
                  <p className="font-sans text-[10px] text-neutral-500 uppercase tracking-wider max-w-xs mx-auto mt-1 leading-relaxed">
                    Try broadening your search query, or select another collection category from the header navigation.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('All');
                      setActiveTagFilter(null);
                    }}
                    className="mt-5 rounded-none bg-[#1a1a1a] px-4 py-2 font-sans text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <motion.div 
                  layout
                  className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((prod) => (
                      <motion.div
                        key={prod.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 250,
                          damping: 25,
                          mass: 0.8
                        }}
                        className="h-full"
                      >
                        <ProductCard
                          product={prod}
                          onQuickAdd={(p) => handleAddToCart(p)}
                          onOpenDetails={handleViewProduct}
                          isWishlisted={customerProfile.wishlist.includes(prod.id)}
                          onToggleWishlist={handleToggleWishlist}
                          onToggleCompare={handleToggleCompare}
                          isCompared={compareList.some(p => p.id === prod.id)}
                          onBuyNow={(p) => {
                            const item: CartItem = {
                              id: 'direct-buy-' + Date.now(),
                              product: p,
                              quantity: 1,
                              selectedColor: p.colors?.[0] || 'Default',
                              selectedSize: p.sizes?.[0] || 'One Size'
                            };
                            setDirectCheckoutItem(item);
                          }}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </section>

            {/* BRAND STRIP SECTION */}
            {!searchQuery && activeCategory === 'All' && (
              <section className="bg-neutral-50 dark:bg-neutral-950/50 py-12 border-y border-neutral-100 dark:border-neutral-900" id="brand-strip">
                <div className="mx-auto max-w-7xl px-4 text-center">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 font-black mb-6 block">Major Brands We Carry</span>
                  <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all">
                    {['DELL', 'HP', 'LENOVO', 'APPLE', 'CISCO', 'SAMSUNG'].map(brand => (
                      <span key={brand} className="text-xl md:text-2xl font-black text-neutral-400 dark:text-neutral-600 tracking-tighter">
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* RECENTLY VIEWED SECTION */}
            {recentlyViewedProducts.length > 0 && !searchQuery && activeCategory === 'All' && (
              <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-neutral-400" id="recently-viewed-section">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div className="text-left">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 font-bold">History</span>
                    <h2 className="font-sans text-lg font-extrabold uppercase tracking-widest text-neutral-900">
                      Recently Viewed
                    </h2>
                  </div>
                  <button
                    onClick={() => setRecentlyViewed([])}
                    className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 hover:text-neutral-950 transition-colors font-bold"
                  >
                    Clear History
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
                  {recentlyViewedProducts.map((prod) => (
                    <ProductCard
                      key={`recent-${prod.id}`}
                      product={prod}
                      onQuickAdd={(p) => handleAddToCart(p)}
                      onOpenDetails={handleViewProduct}
                      isWishlisted={customerProfile.wishlist.includes(prod.id)}
                      onToggleWishlist={handleToggleWishlist}
                      onBuyNow={(p) => {
                        const item: CartItem = {
                          id: 'direct-buy-' + Date.now(),
                          product: p,
                          quantity: 1,
                          selectedColor: p.colors?.[0] || 'Default',
                          selectedSize: p.sizes?.[0] || 'One Size'
                        };
                        setDirectCheckoutItem(item);
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* SEO / WHY SHOP SECTION */}
            {!searchQuery && activeCategory === 'All' && (
              <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" id="why-shop-content">
                <div className="grid grid-cols-1 gap-16 items-center">
                  <div className="space-y-6">
                    <h2 className="font-sans text-3xl font-black uppercase tracking-tight text-neutral-900 dark:text-white leading-tight">
                      {storeSettings.whyShopHeadingTop} <br />
                      <span className="text-blue-600">{storeSettings.whyShopHeadingHighlight}</span> {storeSettings.whyShopHeadingBottom}
                    </h2>
                    <p className="font-sans text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed uppercase font-bold">
                      {storeSettings.whyShopBodyText}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(storeSettings.whyShopBulletPoints || []).map(item => (
                        <div key={item} className="flex items-center gap-2 text-[10px] font-mono font-black text-neutral-900 dark:text-white uppercase tracking-wider">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* HERO BANNER SECTION (moved to bottom) */}
            {!searchQuery && activeCategory === 'All' && (
              <section className="relative overflow-hidden bg-slate-50 dark:bg-neutral-950" id="storefront-hero">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20 flex flex-col md:flex-row items-center gap-12">
                  
                  {/* Hero Right Media panel */}
                  <div className="w-full md:w-1/2 relative">
                    {/* Decorative elements */}
                    <div className="absolute -top-6 -right-6 h-32 w-32 bg-blue-400 rounded-full blur-3xl opacity-20 animate-pulse" />
                    <div className="absolute -bottom-10 -left-10 h-48 w-48 bg-blue-600 rounded-full blur-3xl opacity-20 animate-pulse delay-700" />
                  </div>
                </div>
              </section>
            )}

            {/* VALUE PROPOSITION BAR (moved to bottom) */}
          </div>
        ) : (
          /* ================= ADMIN COMMAND SYSTEM VIEW ================= */
          <div id="admin-control-view" className="admin-scope bg-gray-50/20">
            <Suspense
              fallback={
                <div className="flex min-h-[50vh] items-center justify-center px-4 py-20 text-center">
                  <div className="space-y-3">
                    <div className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Loading Admin Workspace</div>
                    <div className="h-1 w-40 overflow-hidden rounded-full bg-slate-200 mx-auto">
                      <div className="h-full w-1/2 animate-pulse bg-slate-900" />
                    </div>
                  </div>
                </div>
              }
            >
              {isHydratingState && (
                <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">
                  Syncing local admin state…
                </div>
              )}
              <DashboardView
                onOpenStorefront={() => setIsAdminMode(false)}
                products={products}
                onUpdateProduct={handleUpdateProduct}

                onAddProduct={handleAddProduct}
                onDeleteProduct={handleDeleteProduct}
                onClearAllProducts={handleClearAllProducts}
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                coupons={coupons}
                onAddCoupon={handleAddCoupon}
                onToggleCoupon={handleToggleCoupon}
                categories={categories}
                onAddCategory={handleAddCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
                returns={returns}
                onUpdateReturnStatus={handleUpdateReturnStatus}
                reviews={reviews}
                onDeleteReview={handleDeleteReview}
                customerSegments={customerSegments}
                onAddSegment={handleAddSegment}
                onDeleteSegment={handleDeleteSegment}
                upsellRules={upsellRules}
                onAddUpsellRule={handleAddUpsellRule}
                onToggleUpsellRule={handleToggleUpsellRule}
                onDeleteUpsellRule={handleDeleteUpsellRule}
                collections={collections}
                onAddCollection={handleAddCollection}
                onDeleteCollection={handleDeleteCollection}
                onAddPOSOrder={handleAddPOSOrder}
                financeTransactions={financeTransactions}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                users={users}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
                customers={customers}
                onAddCustomer={handleAddCustomer}
                onDeleteCustomer={handleDeleteCustomer}
                onUpdateCustomer={handleUpdateCustomer}
                onOpenSettings={(tab) => {
                  setSettingsInitialTab(tab || 'general');
                  setIsSettingsOpen(true);
                }}
                onUpdateStoreSettings={setStoreSettings}
                onShowAlert={triggerAlert}
                storeSettings={storeSettings}
                purchaseOrders={purchaseOrders}
                onAddPurchaseOrder={handleAddPurchaseOrder}
                onUpdatePurchaseOrder={handleUpdatePurchaseOrder}
                onDeletePurchaseOrder={handleDeletePurchaseOrder}
                onReceiveGRN={handleReceiveGRN}
                repairJobs={repairJobs}
                onAddRepairJob={handleAddRepairJob}
                onUpdateRepairJob={handleUpdateRepairJob}
                onDeleteRepairJob={handleDeleteRepairJob}
                onDeductPartsFromStock={handleDeductPartsFromStock}
                stockUnits={stockUnits}
                onAddStockUnit={handleAddStockUnit}
                onUpdateStockUnit={handleUpdateStockUnit}
                warehouses={warehouses}
                onAddWarehouse={handleAddWarehouse}
                onUpdateWarehouse={handleUpdateWarehouse}
                onDeleteWarehouse={handleDeleteWarehouse}
                stockTransfers={stockTransfers}
                onAddStockTransfer={handleAddStockTransfer}
                onUpdateStockTransfer={handleUpdateStockTransfer}
                onCompleteStockTransfer={handleCompleteStockTransfer}
                stocktakes={stocktakes}
                shrinkageRecords={shrinkageRecords}
                onAddStocktake={handleAddStocktake}
                onUpdateStocktake={handleUpdateStocktake}
                onAddShrinkageRecord={handleAddShrinkageRecord}
                onUpdateProductStock={handleUpdateProductStock}
              />
            </Suspense>
          </div>
        )}
      </main>

      {/* NEWSLETTER SUBSCRIPTION FOOTER (public storefront only) */}
      {!isAdminMode && <NewsletterSection onSubscribeSuccess={triggerAlert} />}

      {/* FOOTER SECTION - Australian Computer Traders */}
      <footer className="border-t border-black/10 bg-[#2f2f2f] dark:bg-[#2f2f2f] text-white py-12" id="store-footer">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-neutral-300 text-xs text-left">
            {/* Column 1: Brand Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center bg-white border border-neutral-700 rounded-lg overflow-hidden p-1 shadow-sm shadow-blue-500/10">
                  <img src="/images/app_logo.jpg" alt="Logo" className="h-full w-full object-contain" />
                </div>
                <div>
                  <span className="font-extrabold text-white tracking-tight text-sm uppercase block">{storeSettings.storeName || 'INFOMAT'}</span>
                  <span className="block text-[9px] uppercase text-blue-400 font-mono font-bold">{storeSettings.legalName || 'Refurbished IT Hardware'}</span>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-neutral-300">
                {storeSettings.address ? `${storeSettings.address}, ${storeSettings.cityStateZip}` : '456 Velvet Boulevard, Sydney NSW 2000'}
              </p>
              <div className="font-mono text-[10px] text-blue-400 font-bold space-y-0.5">
                <div>Phone: {storeSettings.phone || '1300 000 228'}</div>
                <div>Email: {storeSettings.email || 'billing@techseller.com.au'}</div>
              </div>
            </div>

            {/* Column 2: Categories */}
            <div className="space-y-2">
              <h4 className="font-mono text-xs font-black uppercase text-blue-400 tracking-wider">Hardware Categories</h4>
              <ul className="space-y-1.5 font-sans text-xs">
                <li><button onClick={() => { setIsAdminMode(false); setActiveCategory('Laptops'); }} className="hover:text-blue-400">Laptops</button></li>
                <li><button onClick={() => { setIsAdminMode(false); setActiveCategory('Desktops'); }} className="hover:text-blue-400">Enterprise Desktops</button></li>
                <li><button onClick={() => { setIsAdminMode(false); setActiveCategory('Monitors'); }} className="hover:text-blue-400">Monitors & Displays</button></li>
                <li><button onClick={() => { setIsAdminMode(false); setActiveCategory('Apple Mac'); }} className="hover:text-blue-400">MacBook & iMacs</button></li>
                <li><button onClick={() => { setIsAdminMode(false); setActiveCategory('Workstations'); }} className="hover:text-blue-400">Heavy Duty Workstations</button></li>
              </ul>
            </div>

            {/* Column 3: Customer Care */}
            <div className="space-y-2">
              <h4 className="font-mono text-xs font-black uppercase text-blue-400 tracking-wider">Customer Care</h4>
              <ul className="space-y-1.5 font-sans text-xs">
                <li><button onClick={() => setIsAccountOpen(true)} className="hover:text-blue-400">My Account & Orders</button></li>
                <li><button onClick={() => setIsCartOpen(true)} className="hover:text-blue-400">Shopping Cart</button></li>
                <li><span className="text-neutral-400">12 Month Express Warranty</span></li>
                <li><span className="text-neutral-400">30 Day Returns Policy</span></li>
                <li><span className="text-neutral-400">Free Express Shipping Over $100</span></li>
              </ul>
            </div>

            {/* Column 4: Admin & Controls */}
            {isAdminMode && (
              <div className="space-y-3">
                <h4 className="font-mono text-xs font-black uppercase text-blue-400 tracking-wider">Store Controls</h4>
                <div className="flex flex-col gap-2 font-mono text-[10px] font-bold uppercase">
                  <button 
                    onClick={() => setIsAdminMode(false)} 
                    className="bg-blue-600 text-neutral-900 px-3 py-2 text-center font-black hover:bg-blue-500 transition-colors"
                  >
                    Exit Admin Mode
                  </button>
                  <button 
                    onClick={handleResetCatalog} 
                    className="border border-rose-500/50 text-rose-300 hover:bg-rose-950/40 px-3 py-2 text-center flex items-center justify-center gap-2 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" /> Reset Store Catalog
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[#003C66] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
            <div>
              © 2026 INFOMAT. ALL RIGHTS RESERVED.
            </div>
            <div className="flex items-center gap-4 text-neutral-300 font-bold">
              <span>🇦🇺 100% AUSTRALIAN OWNED</span>
              <span>•</span>
              <span>PAYMENTS: VISA / MC / AMEX / PAYPAL</span>
            </div>
          </div>
        </div>
      </footer>

      {/* RENDER DYNAMIC DRAWERS & MODALS BACKED BY ANIMATION PRESENCE */}
      
       {/* Shopping Cart Drawer Sidepanel */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onMoveToWishlist={handleMoveToWishlist}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
        customerWallet={customerProfile.walletBalance}
        onOpenCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onOpenAccount={() => {
          setIsCartOpen(false);
          setIsAccountOpen(true);
        }}
        isAdminMode={isAdminMode}
      />

      {/* Customer Hub Account Drawer Sidepanel */}
      {isAccountOpen && (
        <Suspense fallback={null}>
          <AccountDrawer
            isOpen={isAccountOpen}
            onClose={() => setIsAccountOpen(false)}
            customerProfile={customerProfile}
            onTopUpWallet={handleTopUpWallet}
            onRedeemPoints={handleRedeemPoints}
            orders={orders}
            wishlistProducts={products.filter(p => customerProfile.wishlist.includes(p.id))}
            onOpenProductDetails={handleViewProduct}
            onMoveToCart={(prod) => {
              handleAddToCart(prod);
              if (customerProfile.wishlist.includes(prod.id)) {
                handleToggleWishlist(prod.id);
              }
            }}
            onRemoveFromWishlist={handleToggleWishlist}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onMoveAllToCart={handleMoveAllWishlistToCart}
          />
        </Suspense>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={(p, qty, col, sz) => {
          setSelectedProduct(null);
          const item: CartItem = {
            id: 'direct-buy-' + Date.now(),
            product: p,
            quantity: qty || 1,
            selectedColor: col || p.colors?.[0] || 'Default',
            selectedSize: sz || p.sizes?.[0] || 'One Size'
          };
          setDirectCheckoutItem(item);
        }}
        reviews={reviews}
        onAddReview={handleAddReview}
        isWishlisted={selectedProduct ? customerProfile.wishlist.includes(selectedProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        isNotifiedPriceDrop={selectedProduct ? (customerProfile.priceDropNotifications || []).includes(selectedProduct.id) : false}
        onTogglePriceDropNotification={handleTogglePriceDropNotification}
        products={products}
        onSelectProduct={handleViewProduct}
      />

      {/* Checkout Multi-Step Modal */}
      {(isCheckoutOpen || !!directCheckoutItem) && (
        <Suspense fallback={null}>
          <CheckoutModal
            isOpen={isCheckoutOpen || !!directCheckoutItem}
            onClose={() => {
              setIsCheckoutOpen(false);
              setDirectCheckoutItem(null);
            }}
            cartItems={directCheckoutItem ? [directCheckoutItem] : cart}
            appliedCoupon={appliedCoupon}
            subtotal={directCheckoutItem ? directSubtotal : cartSubtotal}
            tax={directCheckoutItem ? directTax : cartTax}
            shipping={directCheckoutItem ? directShipping : cartShipping}
            discount={directCheckoutItem ? directDiscount : cartDiscount}
            total={directCheckoutItem ? directTotal : cartTotal}
            customerProfile={customerProfile}
            onCompletePurchase={handleCompletePurchase}
          />
        </Suspense>
      )}

      {/* Store Settings & Control System Modal */}
      {isSettingsOpen && (
        <Suspense fallback={null}>
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            initialTab={settingsInitialTab}
            settings={storeSettings}
            onSaveSettings={(newSettings) => {
              setStoreSettings(newSettings);
              triggerAlert('App & store settings updated successfully!', 'success');
            }}
            coupons={coupons}
            onAddCoupon={handleAddCoupon}
            onToggleCoupon={handleToggleCoupon}
            customerSegments={customerSegments}
            onAddSegment={handleAddSegment}
            onDeleteSegment={handleDeleteSegment}
            upsellRules={upsellRules}
            onAddUpsellRule={handleAddUpsellRule}
            onToggleUpsellRule={handleToggleUpsellRule}
            onDeleteUpsellRule={handleDeleteUpsellRule}
            reviews={reviews}
            onDeleteReview={handleDeleteReview}
            products={products}
            users={users}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            onHardReset={handleHardReset}
          />
        </Suspense>
      )}

      {/* Product Compare Modal */}
      {showCompareModal && compareList.length > 0 && (
        <ProductCompareModal
          compareList={compareList}
          onClose={() => setShowCompareModal(false)}
          onRemoveFromCompare={handleRemoveFromCompare}
          onAddToCart={(p) => handleAddToCart(p)}
          onClearCompare={() => setCompareList([])}
        />
      )}

      {/* Abandoned Cart Exit Intent Modal */}
      {!isAdminMode && (
        <ExitIntentModal
          cart={cart}
          onApplyCoupon={handleApplyCoupon}
          onOpenCart={() => setIsCartOpen(true)}
        />
      )}

      {/* Order Tracking Modal */}
      {showTrackOrderModal && (
        <OrderTrackingModal
          onClose={() => setShowTrackOrderModal(false)}
          storeSettings={storeSettings}
        />
      )}

      {/* POS Register Full-Screen Overlay */}
      {showPOSView && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-neutral-950 overflow-auto" id="pos-register-overlay">
          <POSRegisterView
            onClose={() => setShowPOSView(false)}
            products={products}
            categories={categories}
            storeSettings={storeSettings}
            onCompleteSale={(items, total, method, notes) => {
              handleAddPOSOrder({
                id: 'POS-' + Date.now(),
                customerName: 'Walk-in Customer',
                customerEmail: '',
                customerAddress: 'Counter POS Purchase',
                customerCity: 'Sydney NSW',
                date: new Date().toISOString().split('T')[0],
                status: 'Delivered',
                paymentMethod: method,
                items: items.map(i => ({
                  productId: i.product.id,
                  name: i.product.name,
                  quantity: i.quantity,
                  price: i.product.discountPrice || i.product.price,
                  color: i.selectedColor,
                  size: i.selectedSize,
                  image: i.product.image || ''
                })),
                subtotal: total,
                tax: total * 0.08,
                shipping: 0,
                discount: 0,
                total: total,
                notes
              });
            }}
          />
        </div>
      )}

      {/* Customer Facing Secondary Display Window */}
      {window.location.hash.includes('customer-display') && (
        <div className="fixed inset-0 z-[100] bg-slate-950">
          <CustomerFacingDisplayModal />
        </div>
      )}

      {/* Interactive Custom PC Builder Modal */}
      <PCBuilderModal
        isOpen={showPCBuilderModal}
        onClose={() => setShowPCBuilderModal(false)}
        products={products}
        onAddToCartBatch={handleAddToCartBatch}
        onShowAlert={(title, msg, type) => triggerAlert(`${title}: ${msg}`, type === 'error' ? 'error' : 'success')}
      />

      {/* Customer Self-Service Portal Hub Modal */}
      <CustomerPortalModal
        isOpen={showCustomerPortalModal}
        onClose={() => setShowCustomerPortalModal(false)}
        orders={orders}
        customerProfile={customerProfile}
        products={products}
        storeSettings={storeSettings}
        onAddReturnRequest={handleAddReturnRequest}
        onAddRepairJob={handleAddRepairJob}
        onShowAlert={(msg, type) => triggerAlert(msg, type === 'error' ? 'error' : 'success')}
      />

      <SaaSOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        initialPlanCode={onboardingPlanCode}
        onSuccess={(data) => {
          triggerAlert(`Store '${data.tenant.name}' provisioned successfully!`, 'success');
        }}
      />
    </div>
    </TenantFeatureProvider>
  </TenantProvider>
  );
}


