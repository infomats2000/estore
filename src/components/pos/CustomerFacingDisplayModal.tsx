import React, { useEffect, useState } from 'react';
import { ShoppingCart, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { CartItem, StoreSettings } from '../../types';

interface DisplayState {
  cart: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  customerName?: string;
  paymentMethod?: string;
  changeDue?: number;
  saleCompleted?: boolean;
  orderNumber?: string;
}

export default function CustomerFacingDisplayModal() {
  const [state, setState] = useState<DisplayState>({
    cart: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    discount: 0
  });

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('pos_customer_display');
      channel.onmessage = (event) => {
        if (event.data) {
          setState(event.data);
        }
      };
    } catch (err) {
      console.log('BroadcastChannel API not active');
    }

    return () => {
      channel?.close();
    };
  }, []);

  const isCartEmpty = state.cart.length === 0 && !state.saleCompleted;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between p-6 select-none">
      {/* Top Banner */}
      <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center font-mono font-black text-xl text-white shadow-lg shadow-blue-600/30">
            IN
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight uppercase">INFOMAT Retail Register</h1>
            <p className="text-xs text-slate-400">Welcome! Official Hardware &amp; Enterprise Solutions</p>
          </div>
        </div>
        {state.customerName && (
          <div className="px-3 py-1.5 bg-blue-950 border border-blue-800 text-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Valued Client: {state.customerName}</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="my-6 flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* Left 2 Cols: Cart items or Promo Banner */}
        <div className="md:col-span-2 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
          {state.saleCompleted ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-fade-in py-12">
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-3xl text-emerald-400">
                <CheckCircle2 className="w-16 h-16" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white">Thank You for Your Business!</h2>
              <p className="text-sm text-slate-300 font-mono">Order Reference #{state.orderNumber || 'POS-SETTLED'}</p>
              {state.changeDue !== undefined && state.changeDue > 0 && (
                <div className="bg-emerald-950/60 p-4 rounded-2xl border border-emerald-800 text-emerald-300 font-mono text-xl font-black">
                  CHANGE DUE: ${state.changeDue.toFixed(2)}
                </div>
              )}
            </div>
          ) : isCartEmpty ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16">
              <div className="p-5 bg-blue-600/10 border border-blue-500/20 rounded-3xl text-blue-400">
                <Sparkles className="w-16 h-16" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-200">Welcome to INFOMAT</h2>
              <p className="text-xs text-slate-400 max-w-sm">
                Ask about our B2B Trade Credit Accounts, Extended Warranties, and Same-Day Express Dispatch!
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">YOUR TICKET ITEMS ({state.cart.length})</span>
                <span className="text-xs font-mono text-blue-400 font-bold">LIVE REGISTER STREAM</span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 pr-2 my-2 space-y-2">
                {state.cart.map(item => (
                  <div key={item.id} className="pt-2 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {item.product.image && (
                        <img src={item.product.image} alt="" className="w-10 h-10 object-contain rounded-lg bg-slate-950 p-1 border border-slate-800" />
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{item.product.name}</h4>
                        <span className="text-[11px] font-mono text-slate-400">${(item.product.discountPrice || item.product.price).toFixed(2)} x {item.quantity}</span>
                      </div>
                    </div>

                    <span className="text-sm font-mono font-black text-white">
                      ${((item.product.discountPrice || item.product.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Big Financial Summary Card */}
        <div className="bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 p-6 rounded-3xl border border-blue-900/50 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">AMOUNT DUE SUMMARY</span>
            
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Subtotal (excl. GST):</span>
                <span className="font-mono font-bold">${(state.subtotal / 1.1).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs text-slate-300">
                <span>GST Tax (10%):</span>
                <span className="font-mono font-bold">${(state.total - (state.total / 1.1)).toFixed(2)}</span>
              </div>

              {state.discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-400 font-bold">
                  <span>Special Discount:</span>
                  <span className="font-mono">-${state.discount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-blue-900/40">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">TOTAL AMOUNT DUE</span>
            <div className="text-4xl font-black text-white font-mono tracking-tight">
              ${state.total.toFixed(2)}
            </div>
            <p className="text-[10px] text-blue-300/70 mt-1 font-mono">AUD (GST INCLUSIVE)</p>
          </div>
        </div>
      </div>

      {/* Bottom Footer Bar */}
      <div className="text-center font-mono text-[10px] text-slate-500 uppercase tracking-widest">
        INFOMAT ENTERPRISE POS &bull; TERMINAL #01 &bull; SYDNEY HUB
      </div>
    </div>
  );
}
