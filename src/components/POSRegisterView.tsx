import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, Printer, Check, DollarSign, CreditCard, RotateCcw, X, Scan, Sparkles, Building2, Monitor, Clock, Layers, Eye } from 'lucide-react';
import { Product, StoreSettings, CartItem, Invoice, CustomerProfile, PaymentSplitLine, LaybyOrder } from '../types';
import { convertOrderToInvoice, printInvoiceDirect } from '../utils/invoicePrinter';
import { calculateEffectivePrice, getAvailableCredit, isCreditHold } from '../utils/pricing';
import { kickCashDrawerHardware } from '../utils/cashDrawerPrinter';
import LaybyManagerModal from './pos/LaybyManagerModal';
import POSReturnsModal from './pos/POSReturnsModal';
import POSReportsModal from './pos/POSReportsModal';

type POSPaymentMethod = 'Cash' | 'EFTPOS Card' | 'On Account / Trade Credit' | 'Split Payment' | 'Lay-by Deposit';

export interface POSSaleRequest {
  items: CartItem[];
  total: number;
  discount: number;
  paymentMethod: POSPaymentMethod;
  customerId?: string;
  purchaseOrder?: string;
  tenders: PaymentSplitLine[];
  notes: string;
  shiftId: string;
}

interface POSRegisterViewProps {
  products: Product[];
  categories: string[];
  storeSettings?: StoreSettings;
  customers?: CustomerProfile[];
  onCompleteSale: (sale: POSSaleRequest) => Promise<{ orderNumber?: string; changeDue?: number } | void>;
  onUpdateCustomerProfile?: (updated: CustomerProfile) => void;
  onClose?: () => void;
}

export default function POSRegisterView({
  products,
  categories,
  storeSettings,
  customers = [],
  onCompleteSale,
  onUpdateCustomerProfile,
  onClose
}: POSRegisterViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // B2B Customer Selection in POS
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [posPoNumber, setPosPoNumber] = useState<string>('');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<POSPaymentMethod>('Cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState('');
  const [saleCompleted, setSaleCompleted] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any | null>(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedSerials, setSelectedSerials] = useState<Record<string, string[]>>({});
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [shiftBusy, setShiftBusy] = useState(false);
  const [showReturns, setShowReturns] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  // Multi-Tender Split Payment State
  const [splitLines, setSplitLines] = useState<PaymentSplitLine[]>([]);

  // Lay-by State & Orders
  const [laybyOrders, setLaybyOrders] = useState<LaybyOrder[]>([]);
  const [isLaybyModalOpen, setIsLaybyModalOpen] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (!detailProduct) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDetailProduct(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [detailProduct]);

  // Auto-focus barcode input
  useEffect(() => {
    barcodeInputRef.current?.focus();
    try {
      broadcastChannelRef.current = new BroadcastChannel('pos_customer_display');
    } catch (e) {
      // BroadcastChannel unsupported or optional
    }
    return () => {
      broadcastChannelRef.current?.close();
      broadcastChannelRef.current = null;
    };
  }, []);

  const posAuthHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` });

  const loadActiveShift = async () => {
    const response = await fetch('/api/pos/shifts/current?registerId=REGISTER-01', { headers: posAuthHeaders() });
    if (response.ok) setActiveShift((await response.json()).shift);
  };

  useEffect(() => { void loadActiveShift(); }, []);

  const handleOpenShift = async () => {
    const value = window.prompt('Opening cash float:', '200.00');
    if (value === null) return;
    const openingFloat = Number(value);
    if (!Number.isFinite(openingFloat) || openingFloat < 0) return setCheckoutError('Enter a valid opening float.');
    setShiftBusy(true);
    try {
      const response = await fetch('/api/pos/shifts/open', { method: 'POST', headers: posAuthHeaders(), body: JSON.stringify({ registerId: 'REGISTER-01', openingFloat }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setActiveShift(result.shift);
      setCheckoutError('');
    } catch (error: any) { setCheckoutError(error.message || 'Unable to open the register.'); }
    finally { setShiftBusy(false); }
  };

  const ensureActiveShift = async () => {
    if (activeShift) return activeShift;
    const response = await fetch('/api/pos/shifts/open', {
      method: 'POST',
      headers: posAuthHeaders(),
      body: JSON.stringify({ registerId: 'REGISTER-01', openingFloat: 0 }),
    });
    const result = await response.json();
    const shift = result.shift;
    if (!shift || (!response.ok && response.status !== 409)) {
      throw new Error(result.error || 'Unable to initialize the register.');
    }
    setActiveShift(shift);
    return shift;
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    const value = window.prompt('Count all cash in the drawer:', String(activeShift.openingFloat || 0));
    if (value === null) return;
    const countedCash = Number(value);
    if (!Number.isFinite(countedCash) || countedCash < 0) return setCheckoutError('Enter a valid drawer count.');
    const varianceReason = window.prompt('Variance reason (required if the count differs):', '') || '';
    setShiftBusy(true);
    try {
      const response = await fetch(`/api/pos/shifts/${activeShift.id}/close`, { method: 'POST', headers: posAuthHeaders(), body: JSON.stringify({ countedCash, varianceReason }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setActiveShift(null);
      setCheckoutError(`Shift closed: expected $${result.shift.expectedCash.toFixed(2)}, counted $${result.shift.countedCash.toFixed(2)}, variance $${result.shift.variance.toFixed(2)}.`);
    } catch (error: any) { setCheckoutError(error.message || 'Unable to close the shift.'); }
    finally { setShiftBusy(false); }
  };

  const handleCreateLayby = async () => {
    if (!activeShift) return setCheckoutError('Open the register before creating a lay-by.');
    if (!selectedCustomerId) return setCheckoutError('Select a registered customer for the lay-by.');
    if (!cart.length) return setCheckoutError('Add at least one product to the lay-by.');
    for (const item of cart) {
      if ((item.product.serialNumbers || []).length && (selectedSerials[item.product.id] || []).length !== item.quantity) return setCheckoutError(`Select ${item.quantity} serial number(s) for ${item.product.name}.`);
    }
    const suggestedDeposit = Math.round(total * 20) / 100;
    const rawDeposit = window.prompt(`Lay-by deposit amount (total $${total.toFixed(2)}):`, Math.max(1, suggestedDeposit).toFixed(2));
    if (rawDeposit === null) return;
    const deposit = Number(rawDeposit);
    if (!Number.isFinite(deposit) || deposit <= 0 || deposit >= total) return setCheckoutError('Deposit must be greater than zero and less than the full total.');
    setIsCheckingOut(true); setCheckoutError('');
    try {
      const response = await fetch('/api/pos/laybys', { method: 'POST', headers: posAuthHeaders(), body: JSON.stringify({
        customerId: selectedCustomerId, shiftId: activeShift.id, expiryDays: 90,
        items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity, serialNumbers: selectedSerials[item.product.id] || [] })),
        deposit: { amount: deposit, method: 'CASH' }, notes: 'Created at POS register',
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      handleNewSale();
      setCheckoutError(`${result.layby.laybyNumber} created with $${deposit.toFixed(2)} deposit.`);
      setIsLaybyModalOpen(true);
    } catch (error: any) { setCheckoutError(error.message || 'Unable to create lay-by.'); }
    finally { setIsCheckingOut(false); }
  };

  const handleOpenDrawer = async () => {
    if (!activeShift) return setCheckoutError('Open a shift before opening the cash drawer.');
    const managerEmail = window.prompt('Manager email:');
    const managerPassword = managerEmail && window.prompt('Manager password:');
    const reason = managerPassword && window.prompt('Reason for opening drawer without a sale:');
    if (!managerEmail || !managerPassword || !reason) return;
    try {
      const approvalResponse = await fetch('/api/pos/approvals', { method: 'POST', headers: posAuthHeaders(), body: JSON.stringify({ managerEmail, managerPassword, action: 'OPEN_DRAWER', reason }) });
      const approval = await approvalResponse.json();
      if (!approvalResponse.ok) throw new Error(approval.error);
      const movementResponse = await fetch(`/api/pos/shifts/${activeShift.id}/cash-movements`, { method: 'POST', headers: posAuthHeaders(), body: JSON.stringify({ type: 'NO_SALE', amount: 0, reason, approvalId: approval.approval.id }) });
      if (!movementResponse.ok) throw new Error((await movementResponse.json()).error);
      kickCashDrawerHardware();
    } catch (error: any) { setCheckoutError(error.message || 'Drawer approval failed.'); }
  };

  // Sync to Dual-Monitor Customer Facing Display window via BroadcastChannel
  useEffect(() => {
    try {
      if (!broadcastChannelRef.current) return;
      const cust = customers.find(c => c.id === selectedCustomerId);
      const sub = cart.reduce((sum, item) => sum + calculateEffectivePrice(item.product, cust, item.quantity).lineTotal, 0);
      const cVal = parseFloat(cashTendered) || 0;
      const cDue = Math.max(0, cVal - sub);

      broadcastChannelRef.current.postMessage({
        cart,
        subtotal: sub,
        tax: sub - (sub / 1.1),
        total: sub,
        discount: 0,
        customerName: cust?.name,
        paymentMethod,
        changeDue: cDue,
        saleCompleted,
        orderNumber: lastCompletedOrder?.orderNumber
      });
    } catch (err) {
      // BroadcastChannel optional
    }
  }, [cart, selectedCustomerId, paymentMethod, cashTendered, saleCompleted, lastCompletedOrder, customers]);

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const sku = String(p.specs?.sku || p.specs?.SKU || '').toLowerCase();
    const barcode = String(p.specs?.barcode || p.specs?.Barcode || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query) || sku.includes(query) || barcode.includes(query);
    return matchesCat && matchesSearch;
  });

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      setCheckoutError(`${product.name} is out of stock.`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setCheckoutError(`Only ${product.stock} unit(s) of ${product.name} are available.`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { id: `${product.id}-default`, product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              setCheckoutError(`Only ${item.product.stock} unit(s) of ${item.product.name} are available.`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const term = barcodeInput.trim().toLowerCase();
    const found = products.find(p => {
      const sku = String(p.specs?.sku || p.specs?.SKU || '').toLowerCase();
      const barcode = String(p.specs?.barcode || p.specs?.Barcode || '').toLowerCase();
      return barcode === term || sku === term || p.id.toLowerCase() === term || p.name.toLowerCase() === term;
    });
    if (found) {
      handleAddToCart(found);
      setBarcodeInput('');
    } else {
      setCheckoutError(`No product found for "${barcodeInput.trim()}".`);
    }
  };

  const selectedCustomer = customers.find(customer => customer.id === selectedCustomerId);
  const subtotal = cart.reduce((sum, item) => sum + calculateEffectivePrice(item.product, selectedCustomer, item.quantity).lineTotal, 0);
  const standardSubtotal = cart.reduce((sum, item) => sum + (item.product.discountPrice || item.product.price) * item.quantity, 0);
  const discount = Math.max(0, Math.round((standardSubtotal - subtotal) * 100) / 100);
  const taxRate = (storeSettings?.taxRatePercent || 10) / 100;
  const tax = subtotal - (subtotal / (1 + taxRate));
  const total = subtotal; // Tax inclusive pricing

  const cashVal = parseFloat(cashTendered) || 0;
  const effectiveCashTendered = cashVal > 0 ? cashVal : total;
  const changeDue = Math.max(0, cashVal - total);
  const splitTenderTotal = splitLines.reduce((sum, line) => sum + line.amount, 0);

  const updateSplitTender = (method: PaymentSplitLine['method'], amount: string) => {
    const parsedAmount = Math.max(0, parseFloat(amount) || 0);
    setSplitLines(current => {
      const existing = current.find(line => line.method === method);
      if (existing) {
        return current.map(line => line.method === method ? { ...line, amount: parsedAmount } : line);
      }
      return [...current, { id: `split-${method}`, method, amount: parsedAmount }];
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'Cash' && cashVal > 0 && cashVal < total) {
      setCheckoutError(`Cash tendered is less than the $${total.toFixed(2)} total.`);
      return;
    }
    for (const item of cart) {
      const availableSerials = item.product.serialNumbers || [];
      if (availableSerials.length > 0 && (selectedSerials[item.product.id] || []).length !== item.quantity) {
        setCheckoutError(`Select ${item.quantity} serial number(s) for ${item.product.name}.`);
        return;
      }
    }

    if (paymentMethod === 'Split Payment' && Math.abs(splitTenderTotal - total) > 0.009) {
      setCheckoutError(`Split tenders must equal the $${total.toFixed(2)} total. $${splitTenderTotal.toFixed(2)} entered.`);
      return;
    }
    if (paymentMethod === 'EFTPOS Card' && !paymentReference.trim()) {
      setCheckoutError('Enter the approved EFTPOS terminal reference before completing the sale.');
      return;
    }

    if (paymentMethod === 'On Account / Trade Credit') {
      if (!selectedCustomer?.tradeAccount) {
        setCheckoutError('Select a customer with an active trade account before charging on account.');
        return;
      }
      if (isCreditHold(selectedCustomer)) {
        setCheckoutError('This account is on credit hold and cannot be charged.');
        return;
      }
      if (total > getAvailableCredit(selectedCustomer)) {
        setCheckoutError(`This sale exceeds the available trade credit of $${getAvailableCredit(selectedCustomer).toFixed(2)}.`);
        return;
      }
      if (selectedCustomer.tradeAccount.poRequired && !posPoNumber.trim()) {
        setCheckoutError('A PO number is required for this trade account.');
        return;
      }
    }

    setCheckoutError('');
    setIsCheckingOut(true);

    const checkoutItems = cart.map((item) => ({ ...item, selectedSerialNumbers: selectedSerials[item.product.id] || [] })) as CartItem[];
    try {
      const checkoutShift = await ensureActiveShift();
      const tenderMethod: PaymentSplitLine['method'] = paymentMethod === 'Cash'
        ? 'Cash'
        : paymentMethod === 'EFTPOS Card'
          ? 'EFTPOS Card'
          : 'Trade Credit';
      const completed = await onCompleteSale({
        items: checkoutItems,
        total,
        discount,
        paymentMethod,
        customerId: selectedCustomerId || undefined,
        purchaseOrder: posPoNumber.trim() || undefined,
        tenders: paymentMethod === 'Split Payment'
          ? splitLines.filter(line => line.amount > 0)
          : [{ id: `${tenderMethod}-${Date.now()}`, method: tenderMethod, amount: paymentMethod === 'Cash' ? effectiveCashTendered : total, reference: paymentReference.trim() || undefined }],
        notes: `POS Sale (${paymentMethod})`,
        shiftId: checkoutShift.id,
      });
      const orderNo = completed && 'orderNumber' in completed && completed.orderNumber ? completed.orderNumber : `POS-${Date.now()}`;
      const orderData = {
      orderNumber: orderNo,
      items: cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: calculateEffectivePrice(item.product, selectedCustomer, item.quantity).unitPrice,
        quantity: item.quantity
      })),
      total,
      paymentMethod,
      date: new Date().toLocaleDateString(),
      customerName: selectedCustomer?.name || 'Counter POS Customer'
      };

      if (paymentMethod === 'On Account / Trade Credit' && selectedCustomer?.tradeAccount && onUpdateCustomerProfile) {
        const currentBalance = selectedCustomer.tradeAccount.creditBalance || 0;
        onUpdateCustomerProfile({
          ...selectedCustomer,
          tradeAccount: { ...selectedCustomer.tradeAccount, creditBalance: currentBalance + total },
          tradeLedger: [{
            id: `LEDG-POS-${Date.now()}`,
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            companyName: selectedCustomer.tradeAccount.companyName,
            date: new Date().toISOString().split('T')[0],
            type: 'Invoice Charge',
            amount: total,
            runningBalance: currentBalance + total,
            reference: orderNo,
            description: `POS Counter Sale${posPoNumber.trim() ? ` (PO #${posPoNumber.trim()})` : ''}`,
            status: 'Current'
          }, ...(selectedCustomer.tradeLedger || [])]
        });
      }

      setLastCompletedOrder(orderData);
      setSaleCompleted(true);
    } catch (error: any) {
      setCheckoutError(error?.message || 'Checkout failed. No sale was recorded.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleNewSale = () => {
    setCart([]);
    setCashTendered('');
    setSaleCompleted(false);
    setLastCompletedOrder(null);
    setSelectedSerials({});
    setPaymentReference('');
    setSplitLines([]);
    setCheckoutError('');
    barcodeInputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-100 overflow-hidden font-sans">
      {/* Top POS Toolbar */}
      <div className="bg-neutral-900 text-white p-4 flex items-center justify-between border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 flex items-center justify-center font-mono font-black text-white text-lg">
            POS
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider">Retail Counter Cash Register</h2>
            <span className="text-[10px] font-mono text-neutral-400">Terminal #01 &bull; {activeShift ? `Open since ${new Date(activeShift.openedAt).toLocaleTimeString()}` : 'Register closed'}</span>
          </div>
        </div>

        {/* Barcode Quick Scanner Form */}
        <form onSubmit={handleBarcodeSubmit} className="flex-1 max-w-md mx-6">
          <div className="relative">
            <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan product barcode or SKU..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 pl-10 pr-4 py-2 font-mono text-xs text-white placeholder-neutral-500 outline-none focus:border-blue-500"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowReturns(true)} className="px-3 py-2 text-[10px] font-mono uppercase font-bold border border-neutral-600 text-neutral-200">
            Return / Refund
          </button>
          <button onClick={() => setShowReports(true)} className="px-3 py-2 text-[10px] font-mono uppercase font-bold border border-neutral-600 text-neutral-200">
            Reports
          </button>
          <button
            onClick={activeShift ? handleCloseShift : handleOpenShift}
            disabled={shiftBusy || cart.length > 0}
            className={`px-3 py-2 text-[10px] font-mono uppercase font-bold border disabled:opacity-40 ${activeShift ? 'border-amber-500 text-amber-300' : 'border-emerald-500 text-emerald-300'}`}
          >
            {shiftBusy ? 'Working…' : activeShift ? 'Close & Count Shift' : 'Open Register Shift'}
          </button>
          <button
            type="button"
            onClick={() => {
              window.open('#/customer-display', 'CustomerDisplay', 'width=1024,height=768');
            }}
            className="flex items-center gap-1.5 bg-blue-900/80 hover:bg-blue-800 border border-blue-700 text-blue-200 px-3 py-2 font-mono text-xs uppercase font-bold transition-colors cursor-pointer"
            title="Open Dual-Monitor Customer Facing Display window"
          >
            <Monitor className="h-4 w-4 text-blue-400" />
            <span>Customer Display</span>
          </button>

          <button
            type="button"
            onClick={() => void handleOpenDrawer()}
            className="flex items-center gap-1.5 bg-amber-900/80 hover:bg-amber-800 border border-amber-700 text-amber-200 px-3 py-2 font-mono text-xs uppercase font-bold transition-colors cursor-pointer"
            title="Trigger ESC/POS Hardware Cash Drawer Kick Signal"
          >
            <DollarSign className="h-4 w-4 text-amber-400" />
            <span>Open Drawer</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLaybyModalOpen(true)}
            className="flex items-center gap-1.5 bg-purple-900/80 hover:bg-purple-800 border border-purple-700 text-purple-200 px-3 py-2 font-mono text-xs uppercase font-bold transition-colors cursor-pointer"
            title="Manage Customer Lay-by Tickets & Installment Deposits"
          >
            <Clock className="h-4 w-4 text-purple-400" />
            <span>Lay-by Manager ({laybyOrders.filter(l => l.status === 'Active').length})</span>
          </button>

          <button
            onClick={() => {
              if (cart.length === 0 || window.confirm('Discard the current sale and start a new transaction?')) {
                handleNewSale();
              }
            }}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white px-4 py-2 font-mono text-xs uppercase font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>New Transaction</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-400 hover:text-white px-4 py-2 font-mono text-xs uppercase font-bold transition-colors cursor-pointer"
              id="pos-close-btn"
            >
              <X className="h-4 w-4" />
              <span>Close POS</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Product Touch Catalog */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden border-r border-neutral-300">
          {/* Category Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-3 flex-shrink-0">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2.5 font-mono text-xs uppercase font-bold whitespace-nowrap transition-colors ${
                selectedCategory === 'All' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 font-mono text-xs uppercase font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === cat ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative mb-3 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search products by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-neutral-300 pl-10 pr-4 py-2.5 font-sans text-xs outline-none focus:border-neutral-900"
            />
          </div>

          {/* Touch Grid */}
          <div className="flex-1 overflow-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-1">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className="bg-white border border-neutral-300 p-3 flex flex-col justify-between hover:border-neutral-900 hover:shadow-md transition-all cursor-pointer select-none group"
              >
                <div className="h-28 w-full bg-neutral-50 border border-neutral-200 overflow-hidden mb-2 flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-contain p-1 group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div>
                  <span className="font-mono text-[9px] uppercase font-bold text-neutral-500 block">
                    {product.category}
                  </span>
                  <h4 className="font-sans text-xs font-bold text-neutral-900 line-clamp-2">
                    {product.name}
                  </h4>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDetailProduct(product);
                    }}
                    className="mt-1 inline-flex items-center gap-1 font-mono text-[9px] font-black uppercase tracking-wider text-blue-700 hover:text-blue-900 hover:underline"
                    aria-label={`View full details for ${product.name}`}
                  >
                    <Eye className="h-3 w-3" /> Details
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between pt-2 border-t border-neutral-100">
                  <span className="font-mono text-sm font-black text-neutral-900">
                    ${product.discountPrice || product.price}
                  </span>
                  <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 ${
                    product.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    Qty: {product.stock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Register Cart & Payment Pad */}
        <div className="w-96 bg-white flex flex-col border-l border-neutral-300 text-left">
          {/* Customer Selector Header */}
          <div className="p-3 bg-neutral-100 border-b border-neutral-300">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-3.5 w-3.5 text-neutral-700" />
              <label className="font-mono text-[9px] uppercase font-bold text-neutral-600">Assign B2B / Retail Customer:</label>
            </div>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-white border border-neutral-300 p-1.5 font-sans text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
            >
              <option value="">-- Guest Retail Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.tradeAccount?.companyName || c.company || c.name} {c.tradeAccount?.priceTier ? `(${c.tradeAccount.priceTier} Tier)` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-neutral-50 border-b border-neutral-300 font-mono text-xs uppercase font-bold text-neutral-900 flex justify-between items-center">
            <span>Register Receipt Cart</span>
            <span className="bg-blue-600 text-white px-2 py-0.5 text-[10px]">{cart.length} ITEMS</span>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-auto divide-y divide-neutral-200 p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 space-y-2 py-12">
                <ShoppingCart className="h-10 w-10 text-neutral-300" />
                <p className="font-mono text-xs uppercase font-bold">Register Cart Empty</p>
                <p className="text-[11px]">Scan a barcode or tap products to add to current ticket</p>
              </div>
            ) : (
              cart.map(item => {
                const selectedCust = customers.find(c => c.id === selectedCustomerId);
                const calc = calculateEffectivePrice(item.product, selectedCust, item.quantity);
                const isDiscounted = calc.unitPrice < item.product.price;

                return (
                  <div key={item.id} className="pt-3 first:pt-0">
                    <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-sans text-xs font-bold text-neutral-900 truncate">{item.product.name}</h5>
                      <span className="font-mono text-[11px] text-neutral-600 font-bold block">
                        ${calc.unitPrice.toFixed(2)} each {isDiscounted && <span className="text-[9px] text-indigo-600">({calc.discountLabel})</span>}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                        className="h-7 w-7 bg-neutral-200 flex items-center justify-center font-bold text-neutral-700 hover:bg-neutral-300"
                        aria-label={`Decrease quantity of ${item.product.name}`}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono text-xs font-bold w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        className="h-7 w-7 bg-neutral-200 flex items-center justify-center font-bold text-neutral-700 hover:bg-neutral-300"
                        aria-label={`Increase quantity of ${item.product.name}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <span className="font-mono text-xs font-black text-neutral-900 w-16 text-right">
                      ${calc.lineTotal.toFixed(2)}
                    </span>
                    </div>
                    {(item.product.serialNumbers || []).length > 0 && (
                      <div className="mt-2 border-t border-neutral-200 pt-2">
                        <label className="block font-mono text-[9px] font-bold uppercase text-neutral-500 mb-1">
                          Select physical serials ({(selectedSerials[item.product.id] || []).length}/{item.quantity})
                        </label>
                        <select
                          multiple
                          value={selectedSerials[item.product.id] || []}
                          onChange={(event) => {
                            const values = Array.from(event.currentTarget.selectedOptions, option => option.value).slice(0, item.quantity);
                            setSelectedSerials(prev => ({ ...prev, [item.product.id]: values }));
                          }}
                          className="w-full min-h-14 border border-neutral-300 bg-white p-1 font-mono text-[10px]"
                        >
                          {(item.product.serialNumbers || []).map(serial => <option key={serial} value={serial}>{serial}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Payment & Checkout Control Panel */}
          {saleCompleted ? (
            <div className="p-6 bg-emerald-50 border-t border-emerald-300 text-center space-y-4 animate-fade-in">
              <div className="inline-flex h-12 w-12 items-center justify-center bg-emerald-600 text-white rounded-full">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-mono text-sm font-black uppercase text-emerald-900">Sale Completed!</h4>
                <p className="font-mono text-xs text-emerald-700">Order #{lastCompletedOrder?.orderNumber}</p>
              </div>

              {paymentMethod === 'Cash' && (
                <div className="bg-white p-3 border border-emerald-200 font-mono text-xs">
                  <div className="flex justify-between text-neutral-600"><span>Cash Tendered:</span><span>${cashVal.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-emerald-800 text-sm mt-1"><span>Change Due:</span><span>${changeDue.toFixed(2)}</span></div>
                </div>
              )}
              {paymentMethod === 'EFTPOS Card' && (
                <input
                  type="text"
                  placeholder="Approved terminal transaction reference"
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  className="w-full bg-white border border-neutral-300 p-2 font-mono text-xs outline-none focus:border-neutral-900"
                />
              )}

              <button
                onClick={() => {
                  const invoice: Invoice = {
                    id: `INV-${lastCompletedOrder.orderNumber}`,
                    invoiceNumber: lastCompletedOrder.orderNumber,
                    issueDate: new Date().toISOString().split('T')[0],
                    dueDate: new Date().toISOString().split('T')[0],
                    status: 'Paid',
                    type: 'Tax Invoice',
                    customerName: selectedCustomer?.name || 'POS Counter Customer',
                    customerEmail: selectedCustomer?.email || '',
                    customerAddress: selectedCustomer?.address || 'Counter POS Purchase',
                    customerCity: selectedCustomer?.city || storeSettings?.cityStateZip || 'Sydney NSW',
                    items: lastCompletedOrder.items.map((it: any) => ({
                      productId: it.id,
                      description: it.name,
                      quantity: it.quantity,
                      unitPrice: it.price,
                      taxRate: 10,
                      total: it.price * it.quantity
                    })),
                    discount: 0,
                    shipping: 0,
                    subtotal: lastCompletedOrder.total / 1.1,
                    tax: lastCompletedOrder.total - (lastCompletedOrder.total / 1.1),
                    total: lastCompletedOrder.total,
                    paymentMethod: lastCompletedOrder.paymentMethod,
                    notes: `POS Terminal Sale Reference: ${lastCompletedOrder.orderNumber}`
                  };
                  printInvoiceDirect(invoice, storeSettings);
                }}
                className="w-full bg-neutral-900 text-white hover:bg-neutral-800 font-mono text-xs uppercase font-bold py-2.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Receipt</span>
              </button>

              <button
                onClick={handleNewSale}
                className="w-full bg-emerald-700 text-white hover:bg-emerald-800 font-mono text-xs uppercase font-bold py-2.5 cursor-pointer"
              >
                Next Customer Sale
              </button>
            </div>
          ) : (
            <div className="p-4 bg-neutral-50 border-t border-neutral-300 space-y-3">
              {/* Payment Method Selector Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash')}
                  className={`py-2 font-mono text-[10px] font-bold uppercase border flex items-center justify-center gap-1 ${
                    paymentMethod === 'Cash' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-neutral-300 text-neutral-700'
                  }`}
                >
                  <DollarSign className="h-3.5 w-3.5" /> Cash
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('EFTPOS Card')}
                  className={`py-2 font-mono text-[10px] font-bold uppercase border flex items-center justify-center gap-1 ${
                    paymentMethod === 'EFTPOS Card' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-neutral-300 text-neutral-700'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" /> Card
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('On Account / Trade Credit')}
                  className={`py-2 font-mono text-[10px] font-bold uppercase border flex items-center justify-center gap-1 ${
                    paymentMethod === 'On Account / Trade Credit' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-neutral-300 text-neutral-700'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" /> Net 30
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('Split Payment');
                    setCheckoutError('');
                  }}
                  className={`py-2 font-mono text-[10px] font-bold uppercase border flex items-center justify-center gap-1 ${
                    paymentMethod === 'Split Payment' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-neutral-300 text-neutral-700'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" /> Split Pay
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateLayby()}
                  className="col-span-2 py-2 font-mono text-[10px] font-bold uppercase border bg-purple-50 border-purple-300 text-purple-800"
                >
                  <Clock className="inline h-3.5 w-3.5 mr-1" /> Reserve as Lay-by & Take Deposit
                </button>
              </div>

              {paymentMethod === 'Split Payment' && (
                <div className="space-y-2 border border-purple-200 bg-purple-50 p-2.5 font-mono text-[10px] text-neutral-800">
                  <div className="flex justify-between font-bold text-purple-900">
                    <span>Split tender entry</span>
                    <span>${splitTenderTotal.toFixed(2)} / ${total.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                      <span className="block font-bold text-neutral-600">Cash</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={splitLines.find(line => line.method === 'Cash')?.amount || ''}
                        onChange={(event) => updateSplitTender('Cash', event.target.value)}
                        className="w-full border border-purple-200 bg-white p-1.5 text-xs outline-none focus:border-purple-600"
                        aria-label="Cash portion of split payment"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="block font-bold text-neutral-600">EFTPOS card</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={splitLines.find(line => line.method === 'EFTPOS Card')?.amount || ''}
                        onChange={(event) => updateSplitTender('EFTPOS Card', event.target.value)}
                        className="w-full border border-purple-200 bg-white p-1.5 text-xs outline-none focus:border-purple-600"
                        aria-label="Card portion of split payment"
                      />
                    </label>
                  </div>
                  <div className={Math.abs(splitTenderTotal - total) < 0.009 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                    {Math.abs(splitTenderTotal - total) < 0.009 ? 'Tender balanced' : `Remaining: $${Math.max(0, total - splitTenderTotal).toFixed(2)}`}
                  </div>
                </div>
              )}

              {/* Trade Credit Fields & PO Number */}
              {paymentMethod === 'On Account / Trade Credit' && (() => {
                const selCust = customers.find(c => c.id === selectedCustomerId);
                const avail = getAvailableCredit(selCust);
                const hold = isCreditHold(selCust);

                return (
                  <div className="space-y-2 bg-indigo-50 border border-indigo-200 p-2.5 text-left font-mono text-[10px]">
                    {!selCust?.tradeAccount ? (
                      <span className="text-rose-600 font-bold block">⚠️ Please select a customer with an active B2B Trade Account above.</span>
                    ) : hold ? (
                      <span className="text-rose-600 font-bold block">⚠️ ACCOUNT ON CREDIT HOLD. Credit orders disabled.</span>
                    ) : (
                      <>
                        <div className="flex justify-between font-bold text-indigo-900">
                          <span>Avail Credit: ${avail.toFixed(2)}</span>
                          <span>Terms: {selCust.tradeAccount.creditTerms}</span>
                        </div>
                        <input
                          type="text"
                          placeholder="PO Number (Required for Net 30)..."
                          value={posPoNumber}
                          onChange={(e) => setPosPoNumber(e.target.value)}
                          className="w-full bg-white border border-indigo-300 p-1.5 text-xs text-neutral-900 outline-none"
                        />
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Cash Quick Buttons if Cash payment selected */}
              {paymentMethod === 'Cash' && (
                <div className="space-y-2">
                  <div className="flex gap-1.5">
                    {[20, 50, 100].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashTendered(String(amt))}
                        className="flex-1 bg-white border border-neutral-300 hover:border-neutral-900 py-1 font-mono text-xs font-bold text-neutral-800"
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    placeholder="Enter cash tendered amount..."
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full bg-white border border-neutral-300 p-2 font-mono text-xs outline-none focus:border-neutral-900"
                  />

                  {cashVal > 0 && (
                    <div className="flex justify-between font-mono text-xs font-bold text-emerald-700 bg-emerald-50 p-2 border border-emerald-200">
                      <span>Change Due:</span>
                      <span>${changeDue.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {checkoutError && (
                <div role="alert" className="border border-rose-300 bg-rose-50 p-2 font-mono text-[10px] font-bold text-rose-700">
                  {checkoutError}
                </div>
              )}

              {/* Total Display */}
              <div className="pt-2 border-t border-neutral-300 flex justify-between items-baseline">
                <span className="font-mono text-xs font-bold uppercase text-neutral-600">Total Due:</span>
                <span className="font-mono text-2xl font-black text-neutral-900">${total.toFixed(2)}</span>
              </div>

              {/* Charge / Complete Sale Button */}
              <button
                onClick={() => {
                  if (cart.length === 0) return;
                  const selCust = customers.find(c => c.id === selectedCustomerId);

                  if (paymentMethod === 'On Account / Trade Credit') {
                    if (!selCust?.tradeAccount) {
                      alert('Please select a customer with an active B2B Trade Account to charge on account.');
                      return;
                    }
                    if (isCreditHold(selCust)) {
                      alert('This account is on Credit Hold due to past-due invoices. Cannot complete sale on account.');
                      return;
                    }
                    const avail = getAvailableCredit(selCust);
                    if (total > avail) {
                      alert(`Sale total ($${total.toFixed(2)}) exceeds available trade credit limit ($${avail.toFixed(2)}).`);
                      return;
                    }
                    if (selCust.tradeAccount.poRequired && !posPoNumber.trim()) {
                      alert('PO Number is required for this trade account.');
                      return;
                    }

                    // Update customer credit balance & add trade ledger charge
                    const currentBal = selCust.tradeAccount.creditBalance || 0;
                    const newBal = currentBal + total;
                    const updatedCust: CustomerProfile = {
                      ...selCust,
                      tradeAccount: {
                        ...selCust.tradeAccount,
                        creditBalance: newBal
                      },
                      tradeLedger: [
                        {
                          id: `LEDG-POS-${Date.now()}`,
                          customerId: selCust.id,
                          customerName: selCust.name,
                          companyName: selCust.tradeAccount.companyName,
                          date: new Date().toISOString().split('T')[0],
                          type: 'Invoice Charge',
                          amount: total,
                          runningBalance: newBal,
                          reference: `POS-${Math.floor(1000 + Math.random() * 9000)}`,
                          description: `POS Counter Sale (PO #${posPoNumber || 'N/A'})`,
                          status: 'Current'
                        },
                        ...(selCust.tradeLedger || [])
                      ]
                    };

                    if (onUpdateCustomerProfile) {
                      onUpdateCustomerProfile(updatedCust);
                    }
                  }

                  handleCheckout();
                }}
                disabled={cart.length === 0 || isCheckingOut}
                className="w-full bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white font-mono text-sm font-black uppercase tracking-wider py-3.5 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <span>{isCheckingOut ? 'Processing…' : `Charge $${total.toFixed(2)}`}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <LaybyManagerModal
        isOpen={isLaybyModalOpen}
        onClose={() => setIsLaybyModalOpen(false)}
        laybyOrders={laybyOrders}
        onAddInstallment={(laybyNumber, amount, method) => {
          setLaybyOrders(prev => prev.map(l => {
            if (l.laybyNumber === laybyNumber) {
              const newPaid = l.depositPaid + amount;
              const newRem = Math.max(0, l.totalAmount - newPaid);
              const isDone = newRem <= 0;
              return {
                ...l,
                depositPaid: newPaid,
                remainingBalance: newRem,
                status: isDone ? 'Completed' : 'Active',
                deposits: [
                  ...l.deposits,
                  {
                    id: `DEP-${Date.now()}`,
                    date: new Date().toISOString().split('T')[0],
                    amount,
                    paymentMethod: method,
                    receiptNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`
                  }
                ]
              };
            }
            return l;
          }));
        }}
        storeSettings={storeSettings}
        shiftId={activeShift?.id}
      />
      <POSReturnsModal
        isOpen={showReturns}
        shiftId={activeShift?.id}
        onClose={() => setShowReturns(false)}
        onCompleted={(message) => { setCheckoutError(message); void loadActiveShift(); }}
      />
      <POSReportsModal isOpen={showReports} onClose={() => setShowReports(false)} />

      {detailProduct && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pos-product-detail-title"
          onMouseDown={(event) => event.target === event.currentTarget && setDetailProduct(null)}
        >
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-900 px-5 py-4 text-white">
              <div className="min-w-0">
                <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-neutral-400">POS Product Details</p>
                <h2 id="pos-product-detail-title" className="truncate text-lg font-black">{detailProduct.name}</h2>
              </div>
              <button type="button" onClick={() => setDetailProduct(null)} className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-700 hover:bg-neutral-800" aria-label="Close product details"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[280px_minmax(0,1fr)]">
              <div className="border-b border-neutral-200 bg-neutral-50 p-5 md:border-b-0 md:border-r">
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white p-4">
                  <img src={detailProduct.image} alt={detailProduct.name} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-neutral-200 bg-white p-3"><span className="block font-mono text-[9px] font-bold uppercase text-neutral-400">Selling Price</span><strong className="text-lg text-neutral-950">${(detailProduct.discountPrice ?? detailProduct.price).toFixed(2)}</strong>{detailProduct.discountPrice !== undefined && detailProduct.discountPrice < detailProduct.price && <span className="ml-2 text-xs text-neutral-400 line-through">${detailProduct.price.toFixed(2)}</span>}</div>
                  <div className="rounded-lg border border-neutral-200 bg-white p-3"><span className="block font-mono text-[9px] font-bold uppercase text-neutral-400">Available</span><strong className={detailProduct.stock > 0 ? 'text-lg text-emerald-700' : 'text-lg text-rose-700'}>{detailProduct.stock}</strong></div>
                </div>
                <button type="button" disabled={detailProduct.stock <= 0} onClick={() => { handleAddToCart(detailProduct); setDetailProduct(null); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-mono text-xs font-black uppercase text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-300"><Plus className="h-4 w-4" /> Add to Current Sale</button>
              </div>

              <div className="space-y-5 p-5 text-left">
                <div><span className="font-mono text-[9px] font-bold uppercase tracking-widest text-blue-700">{detailProduct.category}{detailProduct.collection ? ` / ${detailProduct.collection}` : ''}</span><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">{detailProduct.description || 'No product description has been provided.'}</p></div>

                <div><h3 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-neutral-900">Specifications</h3>{Object.keys(detailProduct.specs || {}).length > 0 ? <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-2">{Object.entries(detailProduct.specs).map(([label, value]) => <div key={label} className="min-w-0 bg-white p-3"><dt className="font-mono text-[9px] font-bold uppercase text-neutral-400">{label}</dt><dd className="mt-1 break-words text-xs font-semibold text-neutral-800">{value}</dd></div>)}</dl> : <p className="text-xs text-neutral-500">No specifications recorded.</p>}</div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div><h3 className="mb-2 font-mono text-[10px] font-black uppercase text-neutral-900">Inventory Information</h3><div className="space-y-1 rounded-lg border border-neutral-200 p-3 text-xs text-neutral-600"><p><strong>Product ID:</strong> {detailProduct.id}</p><p><strong>Serialised units:</strong> {(detailProduct.serialNumbers || []).length}</p>{Object.entries(detailProduct.locationStock || {}).map(([location, quantity]) => <p key={location}><strong>{location}:</strong> {quantity}</p>)}</div></div>
                  <div><h3 className="mb-2 font-mono text-[10px] font-black uppercase text-neutral-900">Tags &amp; Options</h3><div className="flex flex-wrap gap-1.5">{[...(detailProduct.tags || []), ...(detailProduct.colors || []), ...(detailProduct.sizes || [])].length > 0 ? [...(detailProduct.tags || []), ...(detailProduct.colors || []), ...(detailProduct.sizes || [])].map((item, index) => <span key={`${item}-${index}`} className="rounded-full bg-neutral-100 px-2.5 py-1 font-mono text-[9px] font-bold uppercase text-neutral-600">{item}</span>) : <span className="text-xs text-neutral-500">No tags or options recorded.</span>}</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
