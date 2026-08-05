import React, { useState } from 'react';
import { 
  X, Wallet, Gift, ShoppingBag, Heart, Star, UserCheck, AlertCircle,
  Clock, Package, Truck, CheckCircle2, MapPin, RefreshCw, Activity, Calendar,
  FileDown, Building2, CreditCard, FileText, Lock, ShieldCheck, Printer
} from 'lucide-react';
import { CustomerProfile, Order, Product, TradeAccount } from '../types';
import { convertOrderToInvoice, printInvoiceDirect, downloadInvoiceHtmlFile } from '../utils/invoicePrinter';
import { printStatementDirect } from '../utils/statementPrinter';

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customerProfile: CustomerProfile;
  onTopUpWallet: (amount: number) => void;
  onRedeemPoints: (pointsCost: number, discountAmount: number, generatedCode: string) => void;
  orders: Order[];
  wishlistProducts: Product[];
  onOpenProductDetails: (product: Product) => void;
  onMoveToCart: (product: Product) => void;
  onRemoveFromWishlist: (productId: string) => void;
  onUpdateOrderStatus?: (orderId: string, status: Order['status']) => void;
  onMoveAllToCart?: (products: Product[]) => void;
  onUpdateCustomerProfile?: (updatedProfile: CustomerProfile) => void;
}

export default function AccountDrawer({
  isOpen,
  onClose,
  customerProfile,
  onTopUpWallet,
  onRedeemPoints,
  orders,
  wishlistProducts,
  onOpenProductDetails,
  onMoveToCart,
  onRemoveFromWishlist,
  onUpdateOrderStatus,
  onMoveAllToCart,
  onUpdateCustomerProfile
}: AccountDrawerProps) {
  
  const [activeTab, setActiveTab] = useState<'history' | 'wishlist' | 'loyalty' | 'trade'>('history');
  const [redeemSuccess, setRedeemSuccess] = useState('');
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);

  // Trade Application State
  const [appCompany, setAppCompany] = useState('');
  const [appAbn, setAppAbn] = useState('');
  const [appRequestedLimit, setAppRequestedLimit] = useState('10000');
  const [appSubmitted, setAppSubmitted] = useState(false);

  const handleDownloadInvoice = (order: Order) => {
    const inv = convertOrderToInvoice(order);
    printInvoiceDirect(inv);
  };

  if (!isOpen) return null;

  const handleRedemption = (pointsCost: number, value: number) => {
    if (customerProfile.points < pointsCost) return;

    // Generate custom code
    const generatedCode = `LOYALTY${value}_` + Math.floor(100 + Math.random() * 900);
    onRedeemPoints(pointsCost, value, generatedCode);

    setRedeemSuccess(`SUCCESS! Code ${generatedCode} generated. Copy to apply $${value} discount.`);
    setTimeout(() => setRedeemSuccess(''), 6000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" id="account-drawer-overlay">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-neutral-900/40 backdrop-blur-xs" />

      {/* Drawer Panel */}
      <div 
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl animate-slide-left border-l border-neutral-400"
        id="account-drawer-container"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-400 px-6">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-neutral-800" />
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-neutral-950">Customer Hub</h3>
          </div>
          <button 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-none text-neutral-400 border border-transparent hover:border-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Profile Stats Cards (Wallet & Loyalty Points) */}
        <div className="bg-neutral-50 p-6 border-b border-neutral-400 text-left space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-none bg-[#1a1a1a] text-white flex items-center justify-center font-sans font-bold uppercase tracking-widest text-xs">
              {customerProfile.name.charAt(0)}
            </div>
            <div>
              <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-950">{customerProfile.name}</h4>
              <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">{customerProfile.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Wallet Card */}
            <div className="rounded-none border border-neutral-400 bg-white p-3.5 shadow-none">
              <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest text-neutral-400 font-bold">
                <Wallet className="h-3.5 w-3.5 text-neutral-400" /> Wallet Balance
              </span>
              <div className="mt-1 font-mono text-base font-bold text-neutral-950">
                ${customerProfile.walletBalance.toFixed(2)}
              </div>
              <button
                onClick={() => onTopUpWallet(100)}
                className="mt-2 w-full rounded-none bg-[#1a1a1a] py-1 text-center font-mono text-[8px] font-bold tracking-widest text-white uppercase hover:bg-neutral-800 transition-colors"
              >
                Top Up $100
              </button>
            </div>

            {/* Loyalty Card */}
            <div className="rounded-none border border-neutral-400 bg-white p-3.5 shadow-none">
              <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest text-neutral-400 font-bold">
                <Gift className="h-3.5 w-3.5 text-neutral-400" /> Loyalty Points
              </span>
              <div className="mt-1 font-mono text-base font-bold text-neutral-900">
                {customerProfile.points} <span className="font-sans text-[8px] uppercase text-neutral-400 font-bold">pts</span>
              </div>
              <button
                onClick={() => setActiveTab('loyalty')}
                className="mt-2 w-full rounded-none bg-neutral-100 border border-neutral-400 py-1 text-center font-mono text-[8px] font-bold tracking-widest text-neutral-800 uppercase hover:bg-neutral-200 transition-colors"
              >
                Redeem Shop
              </button>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-neutral-400 px-6 font-sans text-[10px] uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('history')}
            className={`border-b-2 py-3 px-4 font-bold tracking-widest transition-colors ${
              activeTab === 'history' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`border-b-2 py-3 px-4 font-bold tracking-widest transition-colors ${
              activeTab === 'wishlist' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            Wishlist ({wishlistProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`border-b-2 py-3 px-3 font-bold tracking-widest transition-colors ${
              activeTab === 'loyalty' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            Rewards
          </button>
          <button
            onClick={() => setActiveTab('trade')}
            className={`border-b-2 py-3 px-3 font-bold tracking-widest transition-colors ${
              activeTab === 'trade' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            Trade Account
          </button>
        </div>

        {/* Drawer Scrollable Content Panel */}
        <div className="flex-1 overflow-y-auto p-6" id="account-drawer-content">
          
          {/* ORDERS HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
                  <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-700">No Orders Logged</h5>
                  <p className="font-sans text-[10px] uppercase tracking-wider text-neutral-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    Your shopping records will accumulate here as you place orders in the store.
                  </p>
                </div>
              ) : (
                orders.map((order, idx) => {
                  const STATUS_STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'] as const;
                  const currentStepIdx = STATUS_STEPS.indexOf(order.status);

                  return (
                    <div key={`${order.id}-${idx}`} className="rounded-none border border-neutral-400 bg-white p-4 text-left hover:border-neutral-400 transition-colors">
                      <div className="flex items-center justify-between font-mono text-[9px] uppercase font-bold tracking-widest">
                        <span className="text-neutral-950">{order.id}</span>
                        <span className={`rounded-none px-2 py-0.5 font-bold border ${
                          order.status === 'Pending' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          order.status === 'Processing' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          order.status === 'Shipped' ? 'bg-neutral-100 text-neutral-800 border-neutral-400' :
                          'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5 border-t border-dashed border-neutral-400 pt-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between font-sans text-xs text-neutral-600 uppercase tracking-wide">
                            <span className="truncate max-w-[200px]">{item.quantity}x {item.name}</span>
                            <span className="font-mono font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Visual Order Timeline Component */}
                      <div className="mt-4 border-t border-dashed border-neutral-400 pt-4" id={`order-timeline-${order.id}`}>
                        {(() => {
                          const trackingLogs: Record<Order['status'], { title: string; description: string; location: string }> = {
                            Pending: {
                              title: 'Order Confirmed',
                              description: 'Awaiting stock allocation and merchant custom seal registration.',
                              location: 'Central Server'
                            },
                            Processing: {
                              title: 'Item Processing & Handover',
                              description: 'Product specifications verified. Packaging secure serial signature tags.',
                              location: 'Depot Brooklyn'
                            },
                            Shipped: {
                              title: 'Dispatched with Carrier',
                              description: 'Ground courier in route. Real-time high-speed delivery pipeline active.',
                              location: 'Transit Network'
                            },
                            Delivered: {
                              title: 'Fulfillment Completed',
                              description: 'Package dropped safely at designated residence lockbox or door.',
                              location: 'Customer Porch'
                            }
                          };

                          const stepIcons = {
                            Pending: Clock,
                            Processing: Package,
                            Shipped: Truck,
                            Delivered: CheckCircle2
                          };

                          const activeLog = trackingLogs[order.status] || {
                            title: 'Status Update',
                            description: 'Processing order logistics updates.',
                            location: 'Fulfillment Center'
                          };

                          return (
                            <>
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1">
                                  <Activity className="h-3 w-3 text-neutral-400 animate-pulse" /> Live Tracking Status
                                </span>
                                {order.status !== 'Delivered' ? (
                                  <span className="font-mono text-[8px] text-blue-600 font-bold uppercase tracking-widest flex items-center gap-1 bg-blue-50/50 dark:bg-blue-950/20 px-2 py-0.5 border border-blue-200/40">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                                    </span>
                                    In Transit
                                  </span>
                                ) : (
                                  <span className="font-mono text-[8px] text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-1 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-0.5 border border-emerald-200/40">
                                    ✓ Received
                                  </span>
                                )}
                              </div>
                              
                              {/* Stepper with icons */}
                              <div className="relative mt-4 flex items-center justify-between px-1.5 mb-4">
                                {/* Background Connector line */}
                                <div className="absolute left-6 right-6 top-[13px] h-0.5 bg-neutral-100 dark:bg-neutral-800" />
                                {/* Active Connector line */}
                                <div 
                                  className="absolute left-6 top-[13px] h-0.5 bg-neutral-900 dark:bg-neutral-200 transition-all duration-500" 
                                  style={{ 
                                    width: `${currentStepIdx >= 0 ? (currentStepIdx / (STATUS_STEPS.length - 1)) * 90 : 0}%`,
                                    maxWidth: '90%'
                                  }} 
                                />

                                {/* Steps */}
                                {STATUS_STEPS.map((step, idx) => {
                                  const isCompleted = idx < currentStepIdx;
                                  const isActive = idx === currentStepIdx;
                                  const isFuture = idx > currentStepIdx;
                                  const StepIcon = stepIcons[step];

                                  return (
                                    <div key={step} className="relative z-10 flex flex-col items-center">
                                      <div 
                                        className={`flex h-7.5 w-7.5 items-center justify-center border font-mono transition-all duration-300 ${
                                          isCompleted 
                                            ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-950' 
                                            : isActive 
                                              ? 'border-neutral-950 bg-neutral-50 text-neutral-950 ring-3 ring-neutral-100 dark:border-white dark:bg-neutral-900 dark:text-white dark:ring-neutral-800 font-extrabold scale-110 animate-bounce-short' 
                                              : 'border-neutral-400 bg-white text-neutral-400 font-normal dark:border-neutral-700 dark:bg-neutral-950'
                                        }`}
                                        style={{ borderRadius: '0px' }}
                                        title={step}
                                      >
                                        <StepIcon className="h-3.5 w-3.5" />
                                      </div>
                                      <span className={`mt-2 font-mono text-[7px] uppercase tracking-wider font-bold ${
                                        isActive ? 'text-neutral-900 dark:text-white font-extrabold' : 'text-neutral-400'
                                      }`}>
                                        {step}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Interactive Status Detail Block */}
                              <div className="rounded-none border border-neutral-150 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-950/40 p-3 space-y-1.5 text-left">
                                <div className="flex items-center justify-between">
                                  <span className="font-sans text-[10px] font-black uppercase tracking-wider text-neutral-950 dark:text-white">
                                    {activeLog.title}
                                  </span>
                                  <span className="font-mono text-[7px] text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                    📍 {activeLog.location}
                                  </span>
                                </div>
                                <p className="font-sans text-[9px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 leading-normal">
                                  {activeLog.description}
                                </p>
                              </div>

                              {/* Fast forward delivery controls */}
                              {order.status !== 'Delivered' && onUpdateOrderStatus && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextStatusMap: Record<Order['status'], Order['status']> = {
                                      'Pending': 'Processing',
                                      'Processing': 'Shipped',
                                      'Shipped': 'Delivered',
                                      'Delivered': 'Delivered'
                                    };
                                    onUpdateOrderStatus(order.id, nextStatusMap[order.status]);
                                  }}
                                  className="mt-2.5 flex items-center justify-center gap-1.5 w-full border border-neutral-400 hover:border-neutral-900 bg-white hover:bg-neutral-950 hover:text-white dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-100 dark:hover:text-neutral-950 px-2 py-2 font-mono text-[8px] font-bold uppercase tracking-widest transition-all duration-300"
                                >
                                  <RefreshCw className="h-2.5 w-2.5 animate-spin-slow" />
                                  <span>Advance to Next Logistics Stage</span>
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      <div className="mt-4 flex justify-between items-center border-t border-neutral-400 pt-3 text-[10px] uppercase tracking-wider">
                        <span className="font-mono text-neutral-400 font-bold">{order.date}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-neutral-500 mr-1.5">
                            Paid: <strong className="font-mono text-neutral-950 font-bold">${order.total.toFixed(2)}</strong>
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadInvoice(order);
                            }}
                            className="border border-neutral-400 hover:border-neutral-900 bg-white hover:bg-neutral-950 hover:text-white dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-100 dark:hover:text-neutral-950 px-2 py-1 text-[8px] font-mono font-bold tracking-widest uppercase transition-all duration-300 flex items-center gap-1 cursor-pointer"
                            title="Download Official Receipt/Invoice"
                            id={`download-invoice-btn-${order.id}`}
                          >
                            <FileDown className="h-2.5 w-2.5" />
                            <span>Invoice</span>
                          </button>
                          {(order.status === 'Shipped' || order.status === 'Delivered') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTrackingOrder(order);
                              }}
                              className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200 px-2 py-1 text-[8px] font-mono font-bold tracking-widest uppercase transition-colors cursor-pointer"
                            >
                              View Tracking
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* WISHLIST TAB */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              {wishlistProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
                  <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-700">Wishlist is empty</h5>
                  <p className="font-sans text-[10px] uppercase tracking-wider text-neutral-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    Click the heart icon on any product catalog card to save it for later review.
                  </p>
                </div>
              ) : (
                <>
                  {onMoveAllToCart && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveAllToCart(wishlistProducts);
                      }}
                      className="w-full bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 py-3 px-4 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 rounded-none border border-transparent hover:border-neutral-400 dark:hover:border-neutral-800"
                      id="wishlist-add-all-btn"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Add All to Cart ({wishlistProducts.length})</span>
                    </button>
                  )}
                  {wishlistProducts.map((prod) => (
                    <div 
                      key={prod.id} 
                      onClick={() => {
                        onOpenProductDetails(prod);
                        onClose();
                      }}
                      className="group relative flex gap-4 rounded-none border border-neutral-400 bg-white p-3 hover:border-neutral-400 transition-all cursor-pointer text-left"
                    >
                    <img
                      src={prod.image || null}
                      alt={prod.name}
                      className="h-16 w-16 rounded-none border border-neutral-150 bg-neutral-50 object-cover flex-shrink-0"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 font-bold">{prod.category}</span>
                        <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-950 truncate">{prod.name}</h4>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-neutral-950">${(prod.discountPrice || prod.price).toFixed(2)}</span>
                          <div className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="font-mono text-[9px] font-bold text-neutral-600">{prod.rating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveToCart(prod);
                          }}
                          className="rounded-none bg-[#1a1a1a] px-3 py-1 font-mono text-[8px] font-bold tracking-widest text-white uppercase hover:bg-neutral-800 transition-colors flex items-center gap-1"
                        >
                          <ShoppingBag className="h-3 w-3" /> Move to Cart
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFromWishlist(prod.id);
                          }}
                          className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 hover:text-neutral-950 transition-colors font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
                }
                </>
              )}
            </div>
          )}

          {/* LOYALTY POINTS REDEMPTION TAB */}
          {activeTab === 'loyalty' && (
            <div className="space-y-4 text-left">
              <div className="rounded-none border border-neutral-400 bg-neutral-50 p-4">
                <span className="flex items-start gap-2 text-[10px] uppercase tracking-wider leading-relaxed text-neutral-800">
                  <AlertCircle className="h-5 w-5 text-neutral-700 flex-shrink-0" />
                  <span>
                    Redeem your accumulated loyalty points for store coupon codes! Copy and apply the code during checkout.
                  </span>
                </span>
              </div>

              {redeemSuccess && (
                <div className="rounded-none bg-neutral-950 text-white border border-neutral-800 p-3 text-xs font-bold uppercase tracking-widest break-all">
                  {redeemSuccess}
                </div>
              )}

              {/* Reward Options */}
              <div className="space-y-3 pt-2">
                {/* Reward Option 1 */}
                <div className="flex items-center justify-between rounded-none border border-neutral-400 bg-white p-4 transition-colors hover:border-neutral-400">
                  <div>
                    <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-950">$5.00 Off Coupon</h5>
                    <p className="font-sans text-[9px] uppercase tracking-widest text-neutral-400 mt-0.5">No minimum purchase rule</p>
                  </div>
                  <button
                    onClick={() => handleRedemption(50, 5)}
                    disabled={customerProfile.points < 50}
                    className="rounded-none bg-[#1a1a1a] px-4 py-2 font-mono text-[10px] font-bold tracking-widest text-white uppercase hover:bg-neutral-800 disabled:bg-neutral-100 disabled:border-neutral-400 disabled:text-neutral-400 disabled:cursor-not-allowed transition-colors"
                  >
                    50 pts
                  </button>
                </div>

                {/* Reward Option 2 */}
                <div className="flex items-center justify-between rounded-none border border-neutral-400 bg-white p-4 transition-colors hover:border-neutral-400">
                  <div>
                    <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-950">$15.00 Off Coupon</h5>
                    <p className="font-sans text-[9px] uppercase tracking-widest text-neutral-400 mt-0.5">Applies to orders over $50</p>
                  </div>
                  <button
                    onClick={() => handleRedemption(120, 15)}
                    disabled={customerProfile.points < 120}
                    className="rounded-none bg-[#1a1a1a] px-4 py-2 font-mono text-[10px] font-bold tracking-widest text-white uppercase hover:bg-neutral-800 disabled:bg-neutral-100 disabled:border-neutral-400 disabled:text-neutral-400 disabled:cursor-not-allowed transition-colors"
                  >
                    120 pts
                  </button>
                </div>

                {/* Reward Option 3 */}
                <div className="flex items-center justify-between rounded-none border border-neutral-400 bg-white p-4 transition-colors hover:border-neutral-400">
                  <div>
                    <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-950">$40.00 Deluxe Coupon</h5>
                    <p className="font-sans text-[9px] uppercase tracking-widest text-neutral-400 mt-0.5">Applies to orders over $150</p>
                  </div>
                  <button
                    onClick={() => handleRedemption(300, 40)}
                    disabled={customerProfile.points < 300}
                    className="rounded-none bg-[#1a1a1a] px-4 py-2 font-mono text-[10px] font-bold tracking-widest text-white uppercase hover:bg-neutral-800 disabled:bg-neutral-100 disabled:border-neutral-400 disabled:text-neutral-400 disabled:cursor-not-allowed transition-colors"
                  >
                    300 pts
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* B2B TRADE ACCOUNT TAB */}
          {activeTab === 'trade' && (
            <div className="space-y-4 text-left">
              {customerProfile.tradeAccount ? (
                <div className="space-y-4">
                  {/* Account Header Badge */}
                  <div className="border border-neutral-400 bg-neutral-50 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-neutral-800" />
                          <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-950">
                            {customerProfile.tradeAccount.companyName}
                          </h4>
                        </div>
                        <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 mt-1">
                          Account: {customerProfile.tradeAccount.accountNumber} &bull; ABN: {customerProfile.tradeAccount.abn || 'N/A'}
                        </p>
                      </div>

                      <span className={`px-2 py-0.5 font-mono text-[8px] uppercase font-bold border ${
                        customerProfile.tradeAccount.status === 'Active' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        customerProfile.tradeAccount.status === 'Credit Hold' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                        customerProfile.tradeAccount.status === 'Pending' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                        'bg-neutral-100 text-neutral-600 border-neutral-300'
                      }`}>
                        {customerProfile.tradeAccount.status}
                      </span>
                    </div>

                    {/* Credit Gauge */}
                    <div className="mt-4 pt-3 border-t border-neutral-300">
                      <div className="flex justify-between font-mono text-[9px] font-bold uppercase mb-1">
                        <span className="text-neutral-500">Credit Balance Owing: ${customerProfile.tradeAccount.creditBalance.toFixed(2)}</span>
                        <span className="text-neutral-900">Limit: ${customerProfile.tradeAccount.creditLimit.toLocaleString()}</span>
                      </div>
                      <div className="h-2 w-full bg-neutral-200 overflow-hidden">
                        <div 
                          className="h-full bg-neutral-950 transition-all"
                          style={{ width: `${Math.min(100, (customerProfile.tradeAccount.creditBalance / customerProfile.tradeAccount.creditLimit) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between font-mono text-[8px] uppercase tracking-wider text-neutral-500 mt-1 font-bold">
                        <span>Available: ${(customerProfile.tradeAccount.creditLimit - customerProfile.tradeAccount.creditBalance).toFixed(2)}</span>
                        <span>Terms: {customerProfile.tradeAccount.creditTerms}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Price Tier */}
                  <div className="flex items-center justify-between bg-white border border-neutral-400 p-3 font-sans text-xs">
                    <div>
                      <span className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 font-bold block">Assigned Tier</span>
                      <strong className="font-mono text-xs uppercase text-neutral-900">{customerProfile.tradeAccount.priceTier} Tier</strong>
                    </div>

                    <button
                      onClick={() => printStatementDirect(customerProfile)}
                      className="bg-neutral-950 hover:bg-neutral-800 text-white font-mono text-[9px] uppercase font-bold px-3 py-1.5 transition-colors flex items-center gap-1.5"
                    >
                      <Printer className="h-3 w-3" /> Print Statement
                    </button>
                  </div>

                  {/* Account Ledger Table */}
                  <div className="border border-neutral-400 bg-white">
                    <div className="p-3 border-b border-neutral-300 font-sans text-[10px] font-bold uppercase tracking-wider text-neutral-900">
                      Statement of Account Ledger
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-left font-sans text-[10px]">
                        <thead className="bg-neutral-100 font-mono text-[8px] uppercase font-bold text-neutral-500 border-b border-neutral-300">
                          <tr>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Ref</th>
                            <th className="py-2 px-3 text-right">Amt</th>
                            <th className="py-2 px-3 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 font-mono">
                          {(!customerProfile.tradeLedger || customerProfile.tradeLedger.length === 0) ? (
                            <tr>
                              <td colSpan={4} className="py-4 text-center text-neutral-400">
                                No ledger transactions logged.
                              </td>
                            </tr>
                          ) : (
                            customerProfile.tradeLedger.map(entry => (
                              <tr key={entry.id}>
                                <td className="py-2 px-3 text-neutral-600">{entry.date}</td>
                                <td className="py-2 px-3 font-bold text-neutral-900">{entry.reference}</td>
                                <td className={`py-2 px-3 text-right font-bold ${entry.amount > 0 ? 'text-neutral-900' : 'text-emerald-700'}`}>
                                  {entry.amount > 0 ? `$${entry.amount.toFixed(2)}` : `-$${Math.abs(entry.amount).toFixed(2)}`}
                                </td>
                                <td className="py-2 px-3 text-right font-bold text-neutral-950">
                                  ${entry.runningBalance.toFixed(2)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : appSubmitted ? (
                <div className="text-center py-8 bg-neutral-50 border border-neutral-400 p-6 space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                  <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-950">
                    B2B Trade Application Submitted!
                  </h4>
                  <p className="font-sans text-[10px] text-neutral-600 uppercase tracking-wide leading-relaxed">
                    Thank you for applying. Our commercial credit team will review your ABN and business reference details. You will be notified once Net 30 trade terms are activated.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-neutral-50 border border-neutral-400 p-4">
                    <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-950 flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Apply for B2B Trade Credit Account
                    </h4>
                    <p className="font-sans text-[9px] uppercase tracking-wide text-neutral-500 mt-1 leading-relaxed">
                      Unlock Net 30 payment terms, specialized Reseller & Wholesale pricing tiers, and priority dispatch on corporate purchase orders.
                    </p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!appCompany || !appAbn) return;

                      const requestedLimit = parseFloat(appRequestedLimit) || 10000;

                      const newTradeAcc: TradeAccount = {
                        accountNumber: `TRD-${Math.floor(10000 + Math.random() * 90000)}`,
                        companyName: appCompany,
                        abn: appAbn,
                        contactPerson: customerProfile.name,
                        phone: customerProfile.phone,
                        email: customerProfile.email,
                        status: 'Pending',
                        creditLimit: requestedLimit,
                        creditBalance: 0,
                        creditTerms: 'Net 30',
                        priceTier: 'Reseller',
                        poRequired: true,
                        taxExempt: false,
                        appliedDate: new Date().toISOString().split('T')[0],
                        notes: 'Trade Account Application Submitted by Client'
                      };

                      const updatedCust: CustomerProfile = {
                        ...customerProfile,
                        company: appCompany,
                        abn: appAbn,
                        type: 'Trade',
                        tradeAccount: newTradeAcc
                      };

                      if (onUpdateCustomerProfile) {
                        onUpdateCustomerProfile(updatedCust);
                      }
                      setAppSubmitted(true);
                    }}
                    className="space-y-3 font-sans text-xs text-left"
                  >
                    <div>
                      <label className="block font-mono text-[9px] uppercase font-bold text-neutral-700 mb-1">Company / Trading Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apex Technology Solutions Pty Ltd"
                        value={appCompany}
                        onChange={(e) => setAppCompany(e.target.value)}
                        className="w-full border border-neutral-400 bg-white p-2 font-sans text-xs outline-none focus:border-neutral-950"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[9px] uppercase font-bold text-neutral-700 mb-1">ABN / Business Tax Number</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 45 123 456 789"
                        value={appAbn}
                        onChange={(e) => setAppAbn(e.target.value)}
                        className="w-full border border-neutral-400 bg-white p-2 font-mono text-xs outline-none focus:border-neutral-950"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[9px] uppercase font-bold text-neutral-700 mb-1">Requested Credit Limit ($)</label>
                      <select
                        value={appRequestedLimit}
                        onChange={(e) => setAppRequestedLimit(e.target.value)}
                        className="w-full border border-neutral-400 bg-white p-2 font-mono text-xs outline-none focus:border-neutral-950"
                      >
                        <option value="5000">$5,000 Trade Credit Line</option>
                        <option value="10000">$10,000 Commercial Line</option>
                        <option value="25000">$25,000 Corporate Line</option>
                        <option value="50000">$50,000 Enterprise Line</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#1a1a1a] hover:bg-neutral-800 text-white font-mono text-[10px] uppercase font-bold tracking-widest py-3 transition-colors mt-2"
                    >
                      Submit Trade Account Application
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* TRACKING DETAIL MODAL OVERLAY */}
      {selectedTrackingOrder && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-neutral-950/65 backdrop-blur-sm animate-fade-in text-left" 
          id="tracking-modal-overlay"
          onClick={() => setSelectedTrackingOrder(null)}
        >
          <div 
            className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-700 p-6 shadow-2xl space-y-5 rounded-none max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            id="tracking-modal-container"
          >
            {/* Close */}
            <button
              onClick={() => setSelectedTrackingOrder(null)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-none text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-transparent hover:border-neutral-400 dark:hover:border-neutral-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="space-y-1.5 border-b border-neutral-100 dark:border-neutral-700 pb-4">
              <span className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1">
                <Truck className="h-3 w-3 text-neutral-400" /> Active Courier Route
              </span>
              <h3 className="font-sans text-sm font-black uppercase tracking-widest text-neutral-950 dark:text-white">
                Transit Ledger
              </h3>
              <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Order Ref: {selectedTrackingOrder.id} • Carrier: Veloce Premium Express Ground
              </p>
            </div>

            {/* Tracking Code Header Block */}
            <div className="rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-4 font-mono text-[9px] uppercase tracking-wider space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-400 font-bold">Tracking Code</span>
                <span className="text-neutral-950 dark:text-white font-extrabold">TRK-VELOCE-{selectedTrackingOrder.id.split('-')[1] || '548239'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 font-bold">Destination Delivery</span>
                <span className="text-neutral-950 dark:text-white font-extrabold truncate max-w-[200px]">
                  {selectedTrackingOrder.customerCity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 font-bold">Logistics Status</span>
                <span className={`font-bold ${selectedTrackingOrder.status === 'Delivered' ? 'text-emerald-600' : 'text-blue-600 animate-pulse'}`}>
                  {selectedTrackingOrder.status === 'Delivered' ? 'DELIVERED (SAFE DROP)' : 'IN TRANSIT TO PORT'}
                </span>
              </div>
            </div>

            {/* Map-style abstract routing diagram */}
            <div className="relative border border-neutral-150 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-950/20 p-4 flex flex-col justify-between rounded-none overflow-hidden h-28">
              {/* Background scan grid */}
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <div className="relative flex justify-between items-center z-10 w-full mt-2">
                {/* Horizontal flow line */}
                <div className="absolute left-4 right-4 top-[15px] h-0.5 bg-neutral-200 dark:bg-neutral-800" />
                {selectedTrackingOrder.status === 'Shipped' && (
                  <div className="absolute left-4 w-1/2 top-[15px] h-0.5 bg-blue-500 animate-pulse" />
                )}
                {selectedTrackingOrder.status === 'Delivered' && (
                  <div className="absolute left-4 right-4 top-[15px] h-0.5 bg-emerald-500" />
                )}

                {/* Node 1: NY Hub */}
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full border border-neutral-400 bg-white dark:bg-neutral-950 flex items-center justify-center font-mono text-[8px] font-bold text-neutral-800 dark:text-white z-10">
                    NY
                  </div>
                  <span className="mt-1.5 font-mono text-[7px] text-neutral-400 uppercase tracking-widest font-bold">Fulfillment</span>
                </div>

                {/* Node 2: NJ Hub */}
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full border flex items-center justify-center font-mono text-[8px] font-bold z-10 ${
                    selectedTrackingOrder.status === 'Delivered' 
                      ? 'border-emerald-500 bg-white dark:bg-neutral-950 text-emerald-600' 
                      : 'border-blue-500 bg-white dark:bg-neutral-950 text-blue-500 animate-pulse'
                  }`}>
                    NJ
                  </div>
                  <span className="mt-1.5 font-mono text-[7px] text-neutral-400 uppercase tracking-widest font-bold">Transit Center</span>
                </div>

                {/* Node 3: Customer porch */}
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full border flex items-center justify-center font-mono text-[8px] font-bold z-10 ${
                    selectedTrackingOrder.status === 'Delivered' 
                      ? 'border-emerald-500 bg-emerald-500 text-white' 
                      : 'border-neutral-400 bg-neutral-50 text-neutral-400'
                  }`}>
                    {selectedTrackingOrder.status === 'Delivered' ? '✓' : 'LOC'}
                  </div>
                  <span className="mt-1.5 font-mono text-[7px] text-neutral-400 uppercase tracking-widest font-bold truncate max-w-[60px]">
                    {selectedTrackingOrder.customerCity}
                  </span>
                </div>
              </div>
            </div>

            {/* History scan log */}
            <div className="space-y-4">
              <span className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 font-bold block mb-1">
                Detailed Scans & Telemetry Logs
              </span>

              <div className="relative border-l border-neutral-400 dark:border-neutral-700 pl-4 ml-1.5 space-y-5 text-left">
                {/* LOG 4: Delivered */}
                {selectedTrackingOrder.status === 'Delivered' && (
                  <div className="relative">
                    <div className="absolute -left-[20.5px] top-0.5 h-3 w-3 rounded-none border border-emerald-500 bg-emerald-500" />
                    <div>
                      <div className="font-mono text-[8px] uppercase tracking-widest text-emerald-600 font-extrabold flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3" /> Delivered & Signed
                      </div>
                      <h4 className="font-sans text-[11px] font-bold uppercase text-neutral-950 dark:text-white mt-0.5">
                        Delivered, Front Porch Mailbox Safe Drop
                      </h4>
                      <p className="font-sans text-[9px] uppercase tracking-wider text-neutral-400 mt-0.5">
                        Location: {selectedTrackingOrder.customerCity} • Sign-off Signature: "Jane Doe"
                      </p>
                      <span className="font-mono text-[7px] text-neutral-400 font-bold block mt-1">
                        Timestamp: {selectedTrackingOrder.date} at 02:45 PM
                      </span>
                    </div>
                  </div>
                )}

                {/* LOG 3: Shipped / Out for delivery */}
                <div className="relative">
                  <div className={`absolute -left-[20.5px] top-0.5 h-3 w-3 rounded-none border ${
                    selectedTrackingOrder.status === 'Delivered' 
                      ? 'border-neutral-400 bg-neutral-100' 
                      : 'border-blue-500 bg-blue-500'
                  }`} />
                  <div>
                    <div className={`font-mono text-[8px] uppercase tracking-widest font-extrabold flex items-center gap-1.5 ${
                      selectedTrackingOrder.status === 'Delivered' ? 'text-neutral-500' : 'text-blue-500'
                    }`}>
                      <Truck className="h-3 w-3 animate-bounce-short" /> Local Out For Delivery
                    </div>
                    <h4 className="font-sans text-[11px] font-bold uppercase text-neutral-900 dark:text-white mt-0.5">
                      Departed Delivery Annex with Local Courier
                    </h4>
                    <p className="font-sans text-[9px] uppercase tracking-wider text-neutral-400 mt-0.5">
                      Carrier assigned: Jane Carrier (Vehicle ID: #VEL-409)
                    </p>
                    <span className="font-mono text-[7px] text-neutral-400 font-bold block mt-1">
                      Timestamp: {selectedTrackingOrder.date} at 08:30 AM
                    </span>
                  </div>
                </div>

                {/* LOG 2: Processing / Handover */}
                <div className="relative">
                  <div className="absolute -left-[20.5px] top-0.5 h-3 w-3 rounded-none border border-neutral-400 bg-neutral-100" />
                  <div>
                    <div className="font-mono text-[8px] uppercase tracking-widest text-neutral-500 font-extrabold flex items-center gap-1.5">
                      <Package className="h-3 w-3" /> Transferred to Carrier
                    </div>
                    <h4 className="font-sans text-[11px] font-bold uppercase text-neutral-900 dark:text-white mt-0.5">
                      Interstate Logistics Interchange sorting completed
                    </h4>
                    <p className="font-sans text-[9px] uppercase tracking-wider text-neutral-400 mt-0.5">
                      Location: NJ Logistics Depot Hub 4
                    </p>
                    <span className="font-mono text-[7px] text-neutral-400 font-bold block mt-1">
                      Timestamp: {selectedTrackingOrder.date} at 04:15 AM
                    </span>
                  </div>
                </div>

                {/* LOG 1: Pending */}
                <div className="relative">
                  <div className="absolute -left-[20.5px] top-0.5 h-3 w-3 rounded-none border border-neutral-400 bg-neutral-100" />
                  <div>
                    <div className="font-mono text-[8px] uppercase tracking-widest text-neutral-500 font-extrabold flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> Electronic Billing Received
                    </div>
                    <h4 className="font-sans text-[11px] font-bold uppercase text-neutral-900 dark:text-white mt-0.5">
                      Parcel Registered & Packaged Secure Seal Signatures Created
                    </h4>
                    <p className="font-sans text-[9px] uppercase tracking-wider text-neutral-400 mt-0.5">
                      Origin facility: Brooklyn Central Fulfillment Annex
                    </p>
                    <span className="font-mono text-[7px] text-neutral-400 font-bold block mt-1">
                      Timestamp: {selectedTrackingOrder.date} at 01:10 AM
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-700">
              <button
                onClick={() => setSelectedTrackingOrder(null)}
                className="w-full bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 py-3 font-sans text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Close Transit Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
