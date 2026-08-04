import React, { useState } from 'react';
import { X, Trash2, Percent, ArrowRight, ShieldCheck, Wallet, Heart } from 'lucide-react';
import { CartItem, Coupon } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onMoveToWishlist: (itemId: string, productId: string) => void;
  appliedCoupon: Coupon | null;
  onApplyCoupon: (code: string) => string | null; // returns error string if invalid
  onRemoveCoupon: () => void;
  customerWallet: number;
  onOpenCheckout: () => void;
  onOpenAccount: () => void; // to allow wallet top up
  isAdminMode: boolean;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onMoveToWishlist,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  customerWallet,
  onOpenCheckout,
  onOpenAccount,
  isAdminMode
}: CartDrawerProps) {
  
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isOpen) return null;

  // Pricing calculations
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product.discountPrice || item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  // Free shipping over $150 or if coupon 'FREESHIP' applied
  const isFreeShipping = subtotal >= 150 || (appliedCoupon && appliedCoupon.code === 'FREESHIP');
  const shippingCost = subtotal === 0 ? 0 : (isFreeShipping ? 0 : 9.99);

  // Tax is estimated 8%
  const taxCost = subtotal * 0.08;

  // Coupon Discount
  let discountCost = 0;
  if (appliedCoupon && subtotal > 0) {
    if (appliedCoupon.type === 'percent') {
      discountCost = subtotal * (appliedCoupon.value / 100);
    } else if (appliedCoupon.type === 'fixed') {
      discountCost = appliedCoupon.value;
    }
  }

  const finalTotal = Math.max(0, subtotal + taxCost + shippingCost - discountCost);
  const insufficientFunds = finalTotal > customerWallet;

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!couponInput.trim()) return;

    const error = onApplyCoupon(couponInput.trim().toUpperCase());
    if (error) {
      setCouponError(error);
    } else {
      setCouponInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" id="cart-drawer-overlay">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-xs" 
        id="cart-drawer-backdrop"
      />

      {/* Drawer Body */}
      <div 
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl animate-slide-left border-l border-neutral-400"
        id="cart-drawer-container"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-400 px-6">
          <div className="flex items-center gap-2">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-neutral-950">Shopping Cart</h3>
            <span className="rounded-none bg-neutral-100 border border-neutral-400 px-2 py-0.5 font-mono text-[10px] font-bold text-neutral-700 uppercase">
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-none text-neutral-400 border border-transparent hover:border-neutral-400 hover:text-neutral-900 transition-colors"
            id="close-cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto px-6 py-4" id="cart-items-container">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-none border border-neutral-400 bg-neutral-50 text-neutral-400">
                <Trash2 className="h-6 w-6" />
              </div>
              <h4 className="mt-4 font-sans text-xs font-bold uppercase tracking-wider text-neutral-900">Your bag is empty</h4>
              <p className="mt-1.5 font-sans text-[10px] uppercase tracking-wider text-neutral-500 max-w-xs leading-relaxed">
                Browse our collections and discover premium products designed to elevate your lifestyle.
              </p>
              <button
                onClick={onClose}
                className="mt-6 rounded-none bg-[#1a1a1a] px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => {
                const itemPrice = item.product.discountPrice || item.product.price;
                return (
                  <div 
                    key={item.id} 
                    className="flex gap-4 rounded-none border border-neutral-400 bg-white p-3 hover:border-neutral-400 transition-colors"
                    id={`cart-item-${item.id}`}
                  >
                    {/* Item Image */}
                    <div className="aspect-square h-20 w-20 flex-shrink-0 overflow-hidden rounded-none border border-neutral-400 bg-neutral-50">
                      <img
                        src={item.product.image || null}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0 text-left flex flex-col justify-between">
                      <div>
                        <h4 className="font-sans text-xs font-bold uppercase text-neutral-950 truncate">{item.product.name}</h4>
                        {/* Selected Variants */}
                        <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 font-mono text-[8px] uppercase tracking-widest text-neutral-400">
                          {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                          {item.selectedSize && <span>Option: {item.selectedSize}</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Counter */}
                        <div className="flex h-7 w-20 items-center justify-between rounded-none border border-neutral-400 px-1 bg-white">
                          <button
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="h-5 w-5 font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-bold text-neutral-800">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, Math.min(item.product.stock, item.quantity + 1))}
                            className="h-5 w-5 font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
                            disabled={item.quantity >= item.product.stock}
                          >
                            +
                          </button>
                        </div>

                        {/* Price & Remove */}
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-neutral-950">
                            ${(itemPrice * item.quantity).toFixed(2)}
                          </span>
                          <button
                            onClick={() => onMoveToWishlist(item.id, item.product.id)}
                            className="text-neutral-400 hover:text-rose-600 transition-colors"
                            title="Move to Wishlist"
                            id={`move-to-wishlist-${item.id}`}
                          >
                            <Heart className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-neutral-400 hover:text-red-500 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Billing Section */}
        {cartItems.length > 0 && (
          <div className="border-t border-neutral-400 bg-neutral-50/50 p-6 space-y-4" id="cart-drawer-summary">
            
            {/* Promo Code Input */}
            <div className="space-y-1.5 text-left">
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 block font-bold">Have a Coupon?</span>
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-none bg-neutral-50 border border-neutral-400 p-2 text-xs font-bold text-neutral-800">
                  <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-[10px]">
                    <Percent className="h-3 w-3 text-neutral-600" />
                    {appliedCoupon.code} Applied (
                    {appliedCoupon.type === 'percent' ? `${appliedCoupon.value}% OFF` : `$${appliedCoupon.value} OFF`}
                    )
                  </span>
                  <button 
                    onClick={onRemoveCoupon} 
                    className="font-mono text-[9px] uppercase font-bold text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCouponSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="E.G. WELCOME10"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 rounded-none border border-neutral-400 bg-white px-3 py-1.5 font-mono text-xs outline-none uppercase placeholder:normal-case focus:border-neutral-900"
                  />
                  <button
                    type="submit"
                    className="rounded-none bg-[#1a1a1a] px-4 py-1.5 font-sans text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 transition-colors"
                  >
                    Apply
                  </button>
                </form>
              )}
              {couponError && (
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider block">{couponError}</span>
              )}
            </div>

            {/* Price breakdown */}
            <div className="space-y-2 text-xs uppercase tracking-wider font-sans text-left">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span className="font-mono text-neutral-900 font-bold">${subtotal.toFixed(2)}</span>
              </div>
              {discountCost > 0 && (
                <div className="flex justify-between text-neutral-800 font-bold">
                  <span>Discount</span>
                  <span className="font-mono">-${discountCost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-500">
                <span>Estimated Tax (8%)</span>
                <span className="font-mono text-neutral-900 font-bold">${taxCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Shipping</span>
                <span className="font-mono">
                  {shippingCost === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
              {shippingCost > 0 && (
                <span className="text-[8px] text-neutral-400 block tracking-widest uppercase font-bold">
                  Add ${(150 - subtotal).toFixed(2)} more to unlock free shipping!
                </span>
              )}

              <div className="h-px bg-neutral-200 my-2" />

              <div className="flex justify-between text-sm font-bold text-neutral-950">
                <span>Order Total</span>
                <span className="font-mono">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Wallet Info Check */}
            <div className="rounded-none bg-white border border-neutral-400 p-3 flex items-center justify-between" id="drawer-wallet-bar">
              <span className="flex items-center gap-2 font-sans text-xs text-neutral-500 uppercase tracking-wider">
                <Wallet className="h-4 w-4 text-neutral-400" />
                Wallet Balance: <strong className="font-mono text-neutral-900">${customerWallet.toFixed(2)}</strong>
              </span>
              {isAdminMode && (
                <button
                  onClick={onOpenAccount}
                  className="font-mono text-[9px] font-bold tracking-widest text-amber-600 uppercase hover:text-amber-700 underline cursor-pointer"
                >
                  Top Up
                </button>
              )}
            </div>

            {/* Checkout Button */}
            <button
              onClick={onOpenCheckout}
              className="flex w-full items-center justify-center gap-2 rounded-none bg-neutral-900 py-3.5 font-sans text-xs font-bold uppercase tracking-widest text-white shadow-none transition-colors hover:bg-neutral-800 cursor-pointer"
              id="cart-checkout-btn"
            >
              Proceed to Checkout
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center justify-center gap-1.5 font-sans text-[8px] uppercase tracking-widest text-neutral-400">
              <ShieldCheck className="h-3.5 w-3.5 text-neutral-700" />
              <span>Processed in a secure encrypted checkout environment.</span>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
