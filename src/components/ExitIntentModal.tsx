import React, { useEffect, useState } from 'react';
import { X, ShoppingBag, Tag, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { CartItem } from '../types';

interface ExitIntentModalProps {
  cart: CartItem[];
  onApplyCoupon: (code: string) => void;
  onOpenCart: () => void;
}

export default function ExitIntentModal({
  cart,
  onApplyCoupon,
  onOpenCart
}: ExitIntentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    // Only trigger if cart has items and modal hasn't been shown in this session
    if (cart.length === 0) return;
    const hasBeenShown = sessionStorage.getItem('exit_intent_shown');
    if (hasBeenShown) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10) {
        setIsOpen(true);
        sessionStorage.setItem('exit_intent_shown', 'true');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [cart]);

  if (!isOpen || cart.length === 0) return null;

  const handleClaimOffer = () => {
    onApplyCoupon('WELCOME10');
    setApplied(true);
    setTimeout(() => {
      setIsOpen(false);
      onOpenCart();
    }, 1200);
  };

  const totalValue = cart.reduce((sum, item) => sum + (item.product.discountPrice || item.product.price) * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="exit-modal-overlay">
      <div 
        onClick={() => setIsOpen(false)} 
        className="absolute inset-0 bg-neutral-950/70 backdrop-blur-md" 
      />

      <div className="relative flex w-full max-w-lg flex-col overflow-hidden bg-white border-2 border-neutral-900 shadow-2xl animate-fade-in">
        {/* Top Header Banner */}
        <div className="bg-neutral-950 p-6 text-white text-center relative">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="inline-flex h-12 w-12 items-center justify-center bg-blue-600 mb-3">
            <Tag className="h-6 w-6 text-white" />
          </div>

          <h3 className="font-mono text-lg font-black uppercase tracking-wider text-white">
            Wait! Don't Leave Your Cart Behind
          </h3>
          <p className="font-sans text-xs text-neutral-400 mt-1">
            Complete your order right now and get an instant 10% discount!
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Cart Summary Snippet */}
          <div className="bg-neutral-50 p-4 border border-neutral-200">
            <div className="flex justify-between items-center mb-2 font-mono text-xs uppercase font-bold text-neutral-700">
              <span>Items in your cart ({cart.length})</span>
              <span className="text-neutral-900 font-black">${totalValue.toFixed(2)}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto py-1">
              {cart.map(item => (
                <img
                  key={item.id}
                  src={item.product.image}
                  alt={item.product.name}
                  className="h-12 w-12 object-cover border border-neutral-300 bg-white p-1"
                />
              ))}
            </div>
          </div>

          {/* Promo Offer Card */}
          <div className="border border-blue-200 bg-blue-50/70 p-4 flex items-center justify-between">
            <div>
              <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-blue-700 block">
                Exclusive Exit Offer
              </span>
              <span className="font-mono text-base font-black text-neutral-900">
                10% OFF CODE: <span className="text-blue-600">WELCOME10</span>
              </span>
            </div>
            <Sparkles className="h-6 w-6 text-blue-600 animate-pulse" />
          </div>

          {/* Actions */}
          <button
            onClick={handleClaimOffer}
            disabled={applied}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs uppercase font-black py-3 px-4 shadow-lg transition-colors cursor-pointer"
          >
            {applied ? (
              <span>✓ Coupon WELCOME10 Applied! Opening Cart...</span>
            ) : (
              <>
                <span>Claim 10% Discount & Checkout Now</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full text-center font-mono text-[10px] uppercase tracking-wider text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            No thanks, I'll pay full price later
          </button>
        </div>
      </div>
    </div>
  );
}
