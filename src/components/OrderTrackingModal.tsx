import React, { useState } from 'react';
import { X, Search, Package, CheckCircle2, Truck, Clock, AlertCircle, FileText, ExternalLink, ShieldCheck } from 'lucide-react';
import { Order, StoreSettings } from '../types';
import { printWarrantyCertificate } from '../utils/warrantyPrinter';
import { printCustomerInvoice } from '../utils/invoicePrinter';

interface OrderTrackingModalProps {
  onClose: () => void;
  storeSettings?: StoreSettings;
}

export default function OrderTrackingModal({
  onClose,
  storeSettings
}: OrderTrackingModalProps) {
  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<any | null>(null);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumberInput.trim()) return;

    setLoading(true);
    setError(null);
    setTrackedOrder(null);

    try {
      const query = new URLSearchParams({
        orderNumber: orderNumberInput.trim(),
        email: emailInput.trim()
      });
      const res = await fetch(`/api/orders/track?${query.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to track order');
      }

      setTrackedOrder(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate order milestone status steps
  const getMilestones = (status: string) => {
    const s = (status || '').toLowerCase();

    const steps = [
      { key: 'placed', title: 'Order Placed', desc: 'Order details confirmed', done: true },
      { key: 'verified', title: 'Payment & Testing', desc: 'Hardware diagnostics passed', done: s !== 'cancelled' },
      { key: 'shipped', title: 'Dispatch & Courier', desc: 'Package handed to courier', done: s === 'shipped' || s === 'completed' || s === 'delivered' },
      { key: 'delivered', title: 'Delivered', desc: 'Signed & received', done: s === 'completed' || s === 'delivered' }
    ];

    return steps;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="tracking-modal-overlay">
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm"
        id="tracking-modal-backdrop" 
      />

      <div className="relative flex h-full max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden bg-white border border-neutral-400 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-300 bg-neutral-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-blue-600">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">
                Live Order Tracking Portal
              </h3>
              <p className="font-sans text-xs text-neutral-400">
                Track your package, courier milestones, and warranty details in real-time
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border border-neutral-700 bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Tracking Search Form */}
          <form onSubmit={handleTrackOrder} className="bg-neutral-50 p-5 border border-neutral-300 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest font-bold text-neutral-700 mb-1">
                  Order Reference # (e.g. ORD-1001) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ORD-1001"
                  value={orderNumberInput}
                  onChange={(e) => setOrderNumberInput(e.target.value)}
                  className="w-full rounded-none border border-neutral-400 p-2.5 font-mono text-xs outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest font-bold text-neutral-700 mb-1">
                  Billing Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full rounded-none border border-neutral-400 p-2.5 font-sans text-xs outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs uppercase font-bold py-2.5 px-6 transition-colors cursor-pointer"
            >
              {loading ? (
                <span>Locating Order...</span>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Track Package Status</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 p-4 font-mono text-xs">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tracked Order Result */}
          {trackedOrder && (
            <div className="space-y-6 animate-fade-in">
              {/* Order Meta Bar */}
              <div className="flex flex-wrap items-center justify-between border-b border-neutral-200 pb-4 gap-4">
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-neutral-500 block">Order Reference</span>
                  <span className="font-mono text-lg font-black text-neutral-900">#{trackedOrder.orderNumber}</span>
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-neutral-500 block">Status</span>
                  <span className="inline-block bg-blue-100 text-blue-800 border border-blue-300 px-3 py-1 font-mono text-xs font-bold uppercase">
                    {trackedOrder.status}
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-neutral-500 block">Total Amount</span>
                  <span className="font-mono text-lg font-black text-neutral-900">${trackedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Milestones Progress */}
              <div className="bg-neutral-50 p-6 border border-neutral-300">
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-700 mb-6">
                  Delivery Progress Timeline
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                  {getMilestones(trackedOrder.status).map((step, idx) => (
                    <div key={step.key} className="flex md:flex-col items-start gap-3 relative">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-none font-mono text-xs font-bold ${
                        step.done ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'
                      }`}>
                        {step.done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                      </div>

                      <div>
                        <h5 className="font-sans text-xs font-bold text-neutral-900">{step.title}</h5>
                        <p className="font-sans text-[11px] text-neutral-500">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Items Table */}
              <div>
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3">
                  Package Contents ({trackedOrder.items.length} items)
                </h4>
                <div className="border border-neutral-300 divide-y divide-neutral-200">
                  {trackedOrder.items.map((item: any) => (
                    <div key={item.id} className="p-4 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="h-12 w-12 object-cover border border-neutral-200" />
                        )}
                        <div>
                          <h5 className="font-sans text-xs font-bold text-neutral-900">{item.name}</h5>
                          <span className="font-mono text-[10px] text-neutral-500">Qty: {item.quantity} &bull; ${item.price.toFixed(2)} each</span>
                        </div>
                      </div>

                      {/* Print Warranty Certificate Button for item */}
                      <button
                        onClick={() => printWarrantyCertificate({
                          orderNumber: trackedOrder.orderNumber,
                          customerName: trackedOrder.customer?.name || 'Valued Customer',
                          customerEmail: trackedOrder.customer?.email,
                          purchaseDate: new Date(trackedOrder.createdAt).toLocaleDateString(),
                          productName: item.name,
                          serialNumber: item.serialNumber || `SN-${trackedOrder.orderNumber}`,
                          warrantyPeriod: '12 Months Commercial Warranty',
                          storeSettings
                        })}
                        className="flex items-center gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 px-3 py-1.5 font-mono text-[10px] uppercase font-bold transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                        <span>Warranty Certificate</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
