import React, { useState, useEffect } from 'react';
import { 
  X, CreditCard, Ship, CheckCircle, ArrowRight, ShieldCheck, 
  FileText, Truck, Wallet, Smartphone, Landmark, Check, RefreshCw, AlertCircle
} from 'lucide-react';
import { CartItem, Coupon, Order, CustomerProfile } from '../types';
import { convertOrderToInvoice, printInvoiceDirect, downloadInvoiceHtmlFile } from '../utils/invoicePrinter';
import { redirectToCheckout } from '../lib/stripe';
import { buildCheckoutOrderPayload, submitCheckoutOrder } from '../utils/checkout';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  appliedCoupon: Coupon | null;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  customerProfile: CustomerProfile;
  onCompletePurchase: (order: Order, pointsEarned: number, totalCost: number) => void;
}

type ShippingMethod = 'standard' | 'express' | 'overnight';
type PaymentMethodType = 'card' | 'wallet' | 'paypal' | 'applepay' | 'stripe';

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  appliedCoupon,
  subtotal,
  tax,
  shipping,
  discount,
  total,
  customerProfile,
  onCompletePurchase
}: CheckoutModalProps) {
  
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Core configuration options
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('card');
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);

  // Form states - Shipping Address
  const [name, setName] = useState(customerProfile.name || 'Alex Morgan');
  const [email, setEmail] = useState(customerProfile.email || 'alex.m@example.com');
  const [phone, setPhone] = useState(customerProfile.phone || '+1 (555) 234-5678');
  const [address, setAddress] = useState(customerProfile.address || '123 Tech Avenue, Suite 400');
  const [city, setCity] = useState(customerProfile.city || 'San Francisco, CA 94105');

  // Form states - Billing Address
  const [billingName, setBillingName] = useState(customerProfile.name || 'Alex Morgan');
  const [billingAddress, setBillingAddress] = useState(customerProfile.address || '123 Tech Avenue, Suite 400');
  const [billingCity, setBillingCity] = useState(customerProfile.city || 'San Francisco, CA 94105');

  // Credit Card Form states
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('888');

  // Payment authorization states
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [authStep, setAuthStep] = useState('');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Calculate shipping cost and total locally based on selection
  const getShippingCost = (method: ShippingMethod) => {
    const isFree = subtotal >= 150 || (appliedCoupon && appliedCoupon.code === 'FREESHIP');
    if (method === 'standard') {
      return isFree ? 0 : 9.99;
    } else if (method === 'express') {
      return isFree ? 4.99 : 14.99;
    } else {
      return isFree ? 19.99 : 29.99;
    }
  };

  const localShippingCost = getShippingCost(shippingMethod);
  const localTotal = Math.max(0, subtotal + tax + localShippingCost - discount);
  const insufficientWalletFunds = paymentMethod === 'wallet' && localTotal > customerProfile.walletBalance;

  // Reset steps & set pre-filled defaults on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPlacedOrder(null);
      setIsProcessingAuth(false);
      setAuthStep('');
      if (!name) setName(customerProfile.name || 'Alex Morgan');
      if (!email) setEmail(customerProfile.email || 'alex.m@example.com');
      if (!phone) setPhone(customerProfile.phone || '+1 (555) 234-5678');
      if (!address) setAddress(customerProfile.address || '123 Tech Avenue, Suite 400');
      if (!city) setCity(customerProfile.city || 'San Francisco, CA 94105');
      if (!cardNumber) setCardNumber('4111 2222 3333 4444');
      if (!expiry) setExpiry('12/28');
      if (!cvv) setCvv('888');
    }
  }, [isOpen, customerProfile]);

  if (!isOpen) return null;

  // Format Card Number (xxxx xxxx xxxx xxxx)
  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = value.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(value);
    }
  };

  // Format Expiry Date (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/gi, '');
    if (value.length >= 2) {
      setExpiry(value.substring(0, 2) + '/' + value.substring(2, 4));
    } else {
      setExpiry(value);
    }
  };

  const handleShipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const finalizePurchase = async (paymentMethodText: string) => {
    const orderId = 'ORD-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
    const points = Math.floor(localTotal / 10);
    const shippingMethodText = 
      shippingMethod === 'standard' ? 'Standard Ground (3-5 Days)' :
      shippingMethod === 'express' ? 'Express Speed Saver (2 Days)' :
      'Priority Overnight Air (1 Day)';

    const order: Order = {
      id: orderId,
      items: cartItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.discountPrice || item.product.price,
        quantity: item.quantity,
        color: item.selectedColor,
        size: item.selectedSize,
        image: item.product.image
      })),
      subtotal,
      tax,
      shipping: localShippingCost,
      discount,
      total: localTotal,
      status: 'Pending',
      customerName: name,
      customerEmail: email,
      customerAddress: `${address} (${shippingMethodText})`,
      customerCity: city,
      customerPhone: phone,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethodText
    };

    setPlacedOrder(order);
    setEarnedPoints(points);
    setIsProcessingAuth(false);
    setStep(3);

    try {
      await submitCheckoutOrder(buildCheckoutOrderPayload({
        orderId: order.id,
        items: order.items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
          image: item.image
        })),
        subtotal,
        tax,
        shipping: localShippingCost,
        discount,
        total: localTotal,
        paymentMethod: paymentMethodText,
        customerName: name,
        customerEmail: email,
        customerAddress: address,
        customerCity: city,
        customerPhone: phone,
        shippingMethodText
      }));
    } catch (submitErr) {
      console.warn('Could not sync checkout order to server:', submitErr);
      setError('Order created locally, but the server sync failed.');
    }

    onCompletePurchase(order, points, localTotal);
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (paymentMethod === 'stripe') {
      setIsProcessingAuth(true);
      setAuthStep('Preparing checkout...');
      try {
        const items = cartItems.map(item => ({
          name: item.product.name,
          price: item.product.discountPrice || item.product.price,
          quantity: item.quantity,
          image: item.product.image
        }));
        
        if (localShippingCost > 0) {
          items.push({
            name: `Shipping (${shippingMethod})`,
            price: localShippingCost,
            quantity: 1,
            image: ''
          });
        }

        if (tax > 0) {
          items.push({
            name: 'Tax',
            price: tax,
            quantity: 1,
            image: ''
          });
        }

        if (discount > 0 && items.length > 0) {
          items[0].price = Math.max(0, items[0].price - discount);
        }

        const checkoutResult = await redirectToCheckout(
          items,
          `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          `${window.location.origin}/checkout-cancel`
        );

        if (checkoutResult.fallback) {
          await finalizePurchase('Card (Local fallback)');
          return;
        }
      } catch (err: any) {
        console.error('Checkout error:', err);
        if (err.message?.includes('Stripe is not configured')) {
          await finalizePurchase('Card (Local fallback)');
          return;
        }
        setError(err.message || 'Failed to initiate Stripe checkout');
        setIsProcessingAuth(false);
      }
      return;
    }
    
    // Auto-fill test card if card fields are blank
    let effectiveCardNumber = cardNumber;
    if (paymentMethod === 'card') {
      if (!cardNumber.trim()) {
        effectiveCardNumber = '4111 2222 3333 4444';
        setCardNumber(effectiveCardNumber);
      }
      if (!expiry.trim()) setExpiry('12/28');
      if (!cvv.trim()) setCvv('888');
    }

    if (paymentMethod === 'wallet' && localTotal > customerProfile.walletBalance) {
      setError('Insufficient wallet balance for this checkout. Please choose another payment method.');
      return;
    }

    // Start Secure Gateway Handshake Simulation
    setIsProcessingAuth(true);
    setAuthStep('Processing...');

    let paymentMethodText = '';
    if (paymentMethod === 'card') {
      paymentMethodText = `Credit Card ending in ${(effectiveCardNumber || cardNumber).slice(-4) || '4242'}`;
    } else if (paymentMethod === 'wallet') {
      paymentMethodText = 'Veloce Wallet';
    } else if (paymentMethod === 'paypal') {
      paymentMethodText = 'PayPal Secure Handshake';
    } else {
      paymentMethodText = 'Apple Pay Device Verified Signature';
    }

    await finalizePurchase(paymentMethodText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/45 backdrop-blur-sm" id="checkout-modal-overlay">
      
      {/* Payment Gateway Overlay */}
      {isProcessingAuth && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 dark:bg-neutral-950/95 p-6 text-center animate-fade-in" id="gateway-handshake">
          <div className="relative flex items-center justify-center h-16 w-16 mb-6">
            <RefreshCw className="h-10 w-10 text-neutral-900 dark:text-white animate-spin" />
            <ShieldCheck className="h-5 w-5 absolute text-emerald-500 animate-pulse" />
          </div>
          <h3 className="font-sans text-sm font-extrabold uppercase tracking-widest text-neutral-900 dark:text-white">Processing Secure Payment</h3>
          <p className="mt-2 font-sans text-xs uppercase tracking-wider text-neutral-400 max-w-sm">{authStep}</p>
          <div className="mt-8 flex items-center gap-1.5 font-sans text-[8px] uppercase tracking-widest text-neutral-400 border border-neutral-400 dark:border-neutral-700 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-900">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            <span>Protected by encrypted payment signatures</span>
          </div>
        </div>
      )}

      {/* Container */}
      <div 
        className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-none bg-white dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-700 shadow-2xl md:flex-row max-h-[92vh]"
        id="checkout-modal-container"
      >
        {/* Close Button */}
        {step !== 3 && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-none text-neutral-400 border border-transparent hover:border-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* LEFT COLUMN: Checkout Form */}
        <div className="w-full md:w-3/5 p-6 md:p-8 overflow-y-auto" id="checkout-form-column">
          
          {/* Custom Navigation / Steps */}
          <div className="mb-6 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest" id="checkout-progress">
            <span className={`font-bold ${step === 1 ? 'text-neutral-950 dark:text-white border-b border-neutral-950 dark:border-white pb-0.5' : 'text-neutral-400'}`}>1. Shipping</span>
            <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            <span className={`font-bold ${step === 2 ? 'text-neutral-950 dark:text-white border-b border-neutral-950 dark:border-white pb-0.5' : 'text-neutral-400'}`}>2. Payment & Billing</span>
            <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            <span className={`font-bold ${step === 3 ? 'text-neutral-950 dark:text-white border-b border-neutral-950 dark:border-white pb-0.5' : 'text-neutral-400'}`}>3. Invoice Receipt</span>
          </div>

          {/* STEP 1: Shipping details & method selection */}
          {step === 1 && (
            <div className="text-left">
              <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-700 pb-3">
                <Ship className="h-4 w-4 text-neutral-500" /> 
                <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-neutral-950 dark:text-white">Shipping Information</h3>
              </div>
              <p className="mt-1.5 font-sans text-[10px] uppercase tracking-wider text-neutral-400">Provide the physical delivery details for your order.</p>

              <form onSubmit={handleShipSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 font-sans text-xs uppercase tracking-wider text-neutral-900 dark:text-white outline-none focus:border-neutral-950 dark:focus:border-white"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 font-sans text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-950 dark:focus:border-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 font-sans text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-950 dark:focus:border-white"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Town / City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 font-sans text-xs uppercase tracking-wider text-neutral-900 dark:text-white outline-none focus:border-neutral-950 dark:focus:border-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Street Address</label>
                  <input
                    type="text"
                    required
                    value={address}
                    placeholder="456 VELVET BOULEVARD, APT 4C"
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 font-sans text-xs uppercase tracking-wider text-neutral-900 dark:text-white outline-none focus:border-neutral-950 dark:focus:border-white"
                  />
                </div>

                {/* Shipping Method Selector */}
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-700 space-y-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Truck className="h-4 w-4 text-neutral-500" />
                    <span className="font-sans text-xs font-bold uppercase tracking-widest text-neutral-950 dark:text-white">Select Shipping Speed</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Standard Card */}
                    <div 
                      onClick={() => setShippingMethod('standard')}
                      className={`cursor-pointer rounded-none border p-3 flex flex-col justify-between text-left transition-all ${
                        shippingMethod === 'standard' 
                          ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 dark:border-white' 
                          : 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white border-neutral-400 dark:border-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      <div>
                        <span className="font-mono text-[8px] tracking-widest uppercase block font-bold opacity-60">Ground Speed</span>
                        <h5 className="font-sans text-xs font-black uppercase mt-1">Standard Delivery</h5>
                        <p className="font-sans text-[9px] uppercase tracking-wider mt-0.5 opacity-80">3-5 Business Days</p>
                      </div>
                      <div className="mt-4 font-mono text-xs font-extrabold text-right">
                        {subtotal >= 150 ? 'FREE' : '$9.99'}
                      </div>
                    </div>

                    {/* Express Card */}
                    <div 
                      onClick={() => setShippingMethod('express')}
                      className={`cursor-pointer rounded-none border p-3 flex flex-col justify-between text-left transition-all ${
                        shippingMethod === 'express' 
                          ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 dark:border-white' 
                          : 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white border-neutral-400 dark:border-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      <div>
                        <span className="font-mono text-[8px] tracking-widest uppercase block font-bold opacity-60">Priority Speed</span>
                        <h5 className="font-sans text-xs font-black uppercase mt-1">Express Saver</h5>
                        <p className="font-sans text-[9px] uppercase tracking-wider mt-0.5 opacity-80">2 Business Days</p>
                      </div>
                      <div className="mt-4 font-mono text-xs font-extrabold text-right">
                        {subtotal >= 150 ? '$4.99' : '$14.99'}
                      </div>
                    </div>

                    {/* Overnight Card */}
                    <div 
                      onClick={() => setShippingMethod('overnight')}
                      className={`cursor-pointer rounded-none border p-3 flex flex-col justify-between text-left transition-all ${
                        shippingMethod === 'overnight' 
                          ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 dark:border-white' 
                          : 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white border-neutral-400 dark:border-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      <div>
                        <span className="font-mono text-[8px] tracking-widest uppercase block font-bold opacity-60">Express Air</span>
                        <h5 className="font-sans text-xs font-black uppercase mt-1">Priority Overnight</h5>
                        <p className="font-sans text-[9px] uppercase tracking-wider mt-0.5 opacity-80">Next Day Delivery</p>
                      </div>
                      <div className="mt-4 font-mono text-xs font-extrabold text-right">
                        {subtotal >= 150 ? '$19.99' : '$29.99'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Continue button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-none bg-neutral-900 dark:bg-neutral-100 py-3.5 font-sans text-xs font-bold uppercase tracking-widest text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all duration-300"
                  >
                    Continue to Payment & Billing
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: Payment and Billing Methods */}
          {step === 2 && (
            <div className="text-left space-y-6">
              
              {/* Select Payment Method Tabs */}
              <div>
                <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-700 pb-3 mb-3">
                  <CreditCard className="h-4 w-4 text-neutral-500" />
                  <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-neutral-950 dark:text-white">Secure Payment Gateway</h3>
                </div>
                <p className="font-sans text-[10px] uppercase tracking-wider text-neutral-400 mb-4">Choose your preferred gateway integration for secure checkout processing.</p>

                {/* Tab layout */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border border-neutral-400 dark:border-neutral-700 p-1 bg-neutral-50 dark:bg-neutral-950 font-mono text-[9px] uppercase tracking-wider font-bold">
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('stripe')}
                    className={`py-2 px-1 text-center transition-all ${paymentMethod === 'stripe' ? 'bg-blue-600 text-white shadow-xs border border-blue-700' : 'text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-100'}`}
                  >
                    Card (Stripe)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-1 text-center transition-all ${paymentMethod === 'card' ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs border border-neutral-400 dark:border-neutral-700' : 'text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-100'}`}
                  >
                    Card
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`py-2 px-1 text-center transition-all ${paymentMethod === 'wallet' ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs border border-neutral-400 dark:border-neutral-700' : 'text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-100'}`}
                  >
                    Veloce Wallet
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`py-2 px-1 text-center transition-all ${paymentMethod === 'paypal' ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs border border-neutral-400 dark:border-neutral-700' : 'text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-100'}`}
                  >
                    PayPal Express
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('applepay')}
                    className={`py-2 px-1 text-center transition-all ${paymentMethod === 'applepay' ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs border border-neutral-400 dark:border-neutral-700' : 'text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-100'}`}
                  >
                    Apple Pay
                  </button>
                </div>
              </div>

              {/* PAYMENT FORMS CONTAINER */}
              <form onSubmit={handlePurchaseSubmit} className="space-y-6">
                
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-mono text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                {/* 0. STRIPE PAYMENT INFO */}
                {paymentMethod === 'stripe' && (
                  <div className="space-y-4 animate-fade-in text-center p-6 border border-blue-400 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-950/20 rounded-none">
                    <div className="flex justify-center mb-1">
                      <CreditCard className="h-8 w-8 text-blue-600" />
                    </div>
                    <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Stripe Online Payment</h5>
                    <p className="font-sans text-[10px] uppercase tracking-wider text-neutral-400 max-w-sm mx-auto leading-relaxed">
                      You will be redirected to Stripe's secure hosted payment page to complete your transaction with a credit or debit card.
                    </p>
                    <div className="rounded-none bg-blue-600 text-white p-2.5 font-mono text-[8px] uppercase tracking-widest font-bold inline-flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5" /> 
                      SECURE STRIPE GATEWAY
                    </div>
                  </div>
                )}
                
                {/* 1. CREDIT CARD FORM */}
                {paymentMethod === 'card' && (
                  <div className="space-y-5 animate-fade-in">
                    
                    {/* Card preview */}
                    <div className="relative aspect-[1.586/1] w-full max-w-[340px] rounded-none bg-neutral-950 dark:bg-neutral-900 border border-neutral-800 p-5 text-white shadow-xl mx-auto flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-[7px] tracking-widest uppercase block opacity-60 font-bold">Veloce Merchant</span>
                          <span className="font-sans text-[10px] font-black uppercase tracking-widest mt-1 block">DEBIT CARD</span>
                        </div>
                        <CreditCard className="h-5 w-5 opacity-80 text-white" />
                      </div>
                      
                      <div className="font-mono text-base tracking-widest font-bold my-4 text-center">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </div>
                      
                      <div className="flex justify-between items-end font-mono text-[9px] uppercase tracking-wider">
                        <div>
                          <span className="block text-[6px] tracking-widest opacity-50 font-bold">Card Holder</span>
                          <span className="truncate max-w-[150px] block font-bold">{name || 'Your Name'}</span>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <span className="block text-[6px] tracking-widest opacity-50 font-bold">Expires</span>
                            <span className="font-bold">{expiry || 'MM/YY'}</span>
                          </div>
                          <div>
                            <span className="block text-[6px] tracking-widest opacity-50 font-bold">CVV</span>
                            <span className="font-bold">{cvv || '•••'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 font-sans text-xs uppercase tracking-wider text-neutral-900 dark:text-white outline-none focus:border-neutral-950 dark:focus:border-white"
                        />
                      </div>

                      <div>
                        <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Card Number</label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          placeholder="4111 2222 3333 4444"
                          value={cardNumber}
                          onChange={handleCardChange}
                          className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 font-mono text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-950 dark:focus:border-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Expiration Date</label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            placeholder="MM/YY"
                            value={expiry}
                            onChange={handleExpiryChange}
                            className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 font-mono text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-950 dark:focus:border-white"
                          />
                        </div>
                        <div>
                          <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">CVV Security Code</label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            placeholder="•••"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/gi, ''))}
                            className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 font-mono text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-950 dark:focus:border-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. VELOCE WALLET INTEGRATION */}
                {paymentMethod === 'wallet' && (
                  <div className="space-y-4 animate-fade-in bg-neutral-50 dark:bg-neutral-950 border border-neutral-400 dark:border-neutral-700 p-4 rounded-none">
                    <div className="flex items-center gap-2 text-neutral-950 dark:text-white font-sans text-xs font-black uppercase tracking-widest">
                      <Wallet className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                      Veloce Account Wallet
                    </div>
                    
                    <div className="space-y-2 font-mono text-[10px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      <div className="flex justify-between items-center">
                        <span>Preloaded Balance</span>
                        <span className="font-extrabold text-neutral-900 dark:text-white">${customerProfile.walletBalance.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-red-600 font-bold">
                        <span>Cart Total deduction</span>
                        <span>-${localTotal.toFixed(2)}</span>
                      </div>
                      <div className="h-px bg-neutral-200 dark:bg-neutral-800" />
                      <div className="flex justify-between items-center text-neutral-950 dark:text-white font-bold">
                        <span>Remaining Balance</span>
                        <span>${(customerProfile.walletBalance - localTotal).toFixed(2)}</span>
                      </div>
                    </div>

                    {insufficientWalletFunds && (
                      <div className="rounded-none bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3 flex flex-col gap-2 text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold leading-normal">
                        <div className="flex gap-2.5 items-center">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          <span>Insufficient wallet funds. Use another payment method or add funds from the customer account area first.</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. PAYPAL EXPRESS GATEWAY */}
                {paymentMethod === 'paypal' && (
                  <div className="space-y-4 animate-fade-in text-center p-6 border border-neutral-400 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 rounded-none">
                    <div className="flex justify-center mb-1">
                      <Landmark className="h-8 w-8 text-blue-600" />
                    </div>
                    <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">PayPal Secure Smart-Checkout</h5>
                    <p className="font-sans text-[10px] uppercase tracking-wider text-neutral-400 max-w-sm mx-auto leading-relaxed">
                      Proceeding will connect to our secure PayPal checkout flow. Authorize payment to complete your order.
                    </p>
                    <div className="rounded-none bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 p-2.5 font-mono text-[8px] uppercase tracking-widest text-blue-600 dark:text-blue-400 font-bold">
                      🔐 Client token: PAYPAL-TOKEN-SECURE-{Math.floor(Math.random() * 9999)}
                    </div>
                  </div>
                )}

                {/* 4. APPLE PAY INTELLIGENT WALLET */}
                {paymentMethod === 'applepay' && (
                  <div className="space-y-4 animate-fade-in text-center p-6 border border-neutral-400 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 rounded-none">
                    <div className="flex justify-center mb-1">
                      <Smartphone className="h-8 w-8 text-neutral-950 dark:text-white" />
                    </div>
                    <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Apple Pay Smart-Sensor</h5>
                    <p className="font-sans text-[10px] uppercase tracking-wider text-neutral-400 max-w-sm mx-auto leading-relaxed">
                      Click buy to confirm with Face ID or Touch ID. Encrypted credential tokens process instantly.
                    </p>
                    <div className="inline-flex items-center gap-1.5 rounded-none bg-neutral-900 text-white px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-widest">
                      <Smartphone className="h-3.5 w-3.5" /> Express Touch ID / Face ID
                    </div>
                  </div>
                )}

                {/* BILLING ADDRESS SECTION WITH COLLAPSIBLE DRAWER */}
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-700 space-y-3 text-left">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={billingSameAsShipping}
                      onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                      className="rounded-none border-neutral-400 dark:border-neutral-700 text-neutral-950 focus:ring-0 cursor-pointer h-4 w-4"
                    />
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                      Billing Address is same as Shipping Address
                    </span>
                  </label>

                  {!billingSameAsShipping && (
                    <div className="pt-3 space-y-4 animate-fade-in border-l-2 border-neutral-400 dark:border-neutral-700 pl-4">
                      <span className="font-sans text-[10px] font-black uppercase tracking-widest text-neutral-950 dark:text-white block mb-1">Billing Details</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Billing Name</label>
                          <input
                            type="text"
                            required
                            value={billingName}
                            onChange={(e) => setBillingName(e.target.value)}
                            className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-2.5 font-sans text-xs uppercase tracking-wider text-neutral-900 dark:text-white outline-none focus:border-neutral-950 dark:focus:border-white"
                          />
                        </div>
                        <div>
                          <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Billing City</label>
                          <input
                            type="text"
                            required
                            value={billingCity}
                            onChange={(e) => setBillingCity(e.target.value)}
                            className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-2.5 font-sans text-xs uppercase tracking-wider text-neutral-900 dark:text-white outline-none focus:border-neutral-950 dark:focus:border-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 block mb-1 font-bold">Billing Street Address</label>
                        <input
                          type="text"
                          required
                          value={billingAddress}
                          onChange={(e) => setBillingAddress(e.target.value)}
                          className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-2.5 font-sans text-xs uppercase tracking-wider text-neutral-900 dark:text-white outline-none focus:border-neutral-950 dark:focus:border-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 2 ACTIONS */}
                <div className="flex gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-none border border-neutral-400 dark:border-neutral-700 px-5 py-3.5 font-sans text-xs font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 rounded-none bg-neutral-900 dark:bg-neutral-100 py-3.5 font-sans text-xs font-bold uppercase tracking-widest text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    {paymentMethod === 'stripe' && 'Proceed to Online Payment'}
                    {paymentMethod === 'card' && 'Authorise Card Checkout'}
                    {paymentMethod === 'wallet' && `Pay $${localTotal.toFixed(2)} with Wallet`}
                    {paymentMethod === 'paypal' && 'Continue with PayPal'}
                    {paymentMethod === 'applepay' && 'Confirm Apple Pay Authorization'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Complete Success / Invoice printed on retro ledger */}
          {step === 3 && placedOrder && (
            <div className="text-center py-4 space-y-5 animate-fade-in" id="checkout-success-view text-left">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-none bg-neutral-100 border border-neutral-400 dark:bg-neutral-800 dark:border-neutral-700 text-neutral-950 dark:text-neutral-50 mb-1 animate-bounce">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="font-sans text-xs font-extrabold uppercase tracking-widest text-neutral-950 dark:text-white">Order Authenticated Successfully</h3>
              <p className="mt-1 font-sans text-[10px] uppercase tracking-wider text-neutral-400 max-w-sm mx-auto leading-relaxed">
                Thank you! Your transaction completed successfully. The merchant panel has registered your order for fulfillment.
              </p>

              {/* Dynamic printed invoice receipt */}
              <div className="mt-5 rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-5 text-left space-y-4 font-mono text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                <div className="flex justify-between items-center border-b border-dashed border-neutral-400 dark:border-neutral-700 pb-3 text-neutral-950 dark:text-white font-bold text-[10px] tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" /> SECURE OFFICIAL INVOICE
                  </span>
                  <span>{placedOrder.id}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[9px] font-bold text-neutral-500 dark:text-neutral-400">
                  <div className="space-y-1">
                    <div>Date Issued: {placedOrder.date}</div>
                    <div>Customer: {placedOrder.customerName}</div>
                    <div>Email Address: {placedOrder.customerEmail}</div>
                    <div>Contact: {placedOrder.customerPhone || 'Not specified'}</div>
                  </div>
                  <div className="space-y-1 sm:text-right">
                    <div>Shipping Address:</div>
                    <div className="text-neutral-900 dark:text-white">{placedOrder.customerAddress}</div>
                    <div>Town / City: {placedOrder.customerCity}</div>
                    <div>Gate Protocol: {placedOrder.paymentMethod}</div>
                  </div>
                </div>

                {/* Table items list */}
                <div className="border-y border-dashed border-neutral-400 dark:border-neutral-700 py-3 space-y-1">
                  <span className="font-bold text-neutral-900 dark:text-white block mb-1.5 text-[9px] tracking-widest">Specification Manifest:</span>
                  {placedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-[9px] font-bold text-neutral-600 dark:text-neutral-400">
                      <span>{item.quantity}x {item.name.slice(0, 32)} ({item.color || 'Default'} / {item.size || 'One Size'})</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Invoice Totals */}
                <div className="space-y-1.5 text-[9px] font-bold text-neutral-500 dark:text-neutral-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${placedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {placedOrder.discount > 0 && (
                    <div className="flex justify-between text-neutral-900 dark:text-white">
                      <span>Campaign Promo Code Discount</span>
                      <span>-${placedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Sales Tax (8%)</span>
                    <span>${placedOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Speed cost</span>
                    <span>${placedOrder.shipping === 0 ? '0.00 (FREE)' : `${placedOrder.shipping.toFixed(2)}`}</span>
                  </div>
                  
                  <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />
                  
                  <div className="flex justify-between font-bold text-neutral-950 dark:text-white text-xs border-t border-dashed border-neutral-400 dark:border-neutral-700 pt-2.5 tracking-widest">
                    <span>Charged Total</span>
                    <span>${placedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Loyalty point alert block */}
                <div className="rounded-none bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 p-2.5 text-center text-[8px] font-bold text-emerald-700 dark:text-emerald-400 tracking-widest">
                  🎁 Loyalist Points Added: +{earnedPoints} loyalty points successfully credited to your account!
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    if (placedOrder) {
                      const inv = convertOrderToInvoice(placedOrder);
                      printInvoiceDirect(inv);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 font-mono text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <FileText className="h-4 w-4" /> Print Tax Invoice (PDF)
                </button>
                <button
                  onClick={() => {
                    if (placedOrder) {
                      const inv = convertOrderToInvoice(placedOrder);
                      downloadInvoiceHtmlFile(inv);
                    }
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-5 py-3.5 font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Download Invoice
                </button>
                <button
                  onClick={onClose}
                  className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 px-6 py-3.5 font-sans text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors rounded-xl cursor-pointer"
                >
                  Close &amp; Keep Browsing
                </button>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Order Summary (Hidden on Step 3 success receipt screen) */}
        {step !== 3 && (
          <div className="hidden md:block w-2/5 border-l border-neutral-400 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-950/30 p-6 md:p-8" id="checkout-summary-column text-left">
            <h4 className="font-sans text-xs font-bold tracking-widest text-neutral-950 dark:text-white uppercase mb-4 text-left">Order Summary</h4>
            
            {/* Scrollable products list */}
            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 text-left">
              {cartItems.map((item) => {
                const itemPrice = item.product.discountPrice || item.product.price;
                return (
                  <div key={item.id} className="flex gap-3 text-left">
                    <img
                      src={item.product.image || undefined}
                      alt={item.product.name}
                      className="h-12 w-12 rounded-none bg-white border border-neutral-400 dark:border-neutral-700 object-cover flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-sans text-xs font-bold uppercase text-neutral-950 dark:text-white truncate">{item.product.name}</h5>
                      <span className="font-mono text-[8px] text-neutral-400 block uppercase tracking-widest font-bold mt-0.5">
                        Qty: {item.quantity} {item.selectedColor ? `• Color: ${item.selectedColor}` : ''} {item.selectedSize ? `• Spec: ${item.selectedSize}` : ''}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-neutral-950 dark:text-white flex-shrink-0">
                      ${(itemPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-4" />

            {/* Price lines */}
            <div className="space-y-2 text-xs text-left text-neutral-500 dark:text-neutral-400 font-sans uppercase tracking-wider">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-neutral-900 dark:text-white font-bold">${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-neutral-950 dark:text-white font-bold">
                  <span>Promo Campaign Discount</span>
                  <span className="font-mono">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Sales Tax (8%)</span>
                <span className="font-mono text-neutral-900 dark:text-white font-bold">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping ({shippingMethod})</span>
                <span className="font-mono text-neutral-900 dark:text-white font-bold">
                  {localShippingCost === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `$${localShippingCost.toFixed(2)}`}
                </span>
              </div>
              
              <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-2" />
              
              <div className="flex justify-between text-xs font-bold text-neutral-950 dark:text-white tracking-widest">
                <span>Total Due</span>
                <span className="font-mono text-neutral-950 dark:text-white text-sm font-black">${localTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Safe badges */}
            <div className="mt-6 rounded-none bg-white dark:bg-neutral-950 border border-neutral-400 dark:border-neutral-700 p-4 space-y-3 text-left">
              <div className="flex items-center gap-2 font-sans text-[8px] uppercase tracking-widest text-neutral-400">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-left leading-normal font-bold">Encrypted via secure SSL signatures. Your payment details are protected.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
