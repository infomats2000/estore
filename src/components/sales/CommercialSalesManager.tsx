import React, { useState } from 'react';
import { 
  FileText, 
  Receipt, 
  DollarSign, 
  Truck, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Copy, 
  Printer, 
  Search, 
  ChevronRight, 
  Building2, 
  Layers, 
  Repeat, 
  ShieldCheck, 
  Package, 
  Send,
  Boxes,
  Zap,
  ArrowRight
} from 'lucide-react';
import { CommercialSalesOrder, CommercialOrderType } from '../../types';
import { DEFAULT_COMMERCIAL_SALES_ORDERS, convertQuoteToSalesOrder, duplicateRepeatOrder } from '../../utils/commercialSalesEngine';

interface CommercialSalesManagerProps {
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function CommercialSalesManager({ onShowAlert }: CommercialSalesManagerProps) {
  const [orders, setOrders] = useState<CommercialSalesOrder[]>(DEFAULT_COMMERCIAL_SALES_ORDERS);
  const [activeTab, setActiveTab] = useState<'all' | 'quotes' | 'blanket_standing' | 'fulfillment'>('all');
  const [selectedOrder, setSelectedOrder] = useState<CommercialSalesOrder | null>(DEFAULT_COMMERCIAL_SALES_ORDERS[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleConvertQuote = (quoteId: string) => {
    setOrders(prev => convertQuoteToSalesOrder(quoteId, prev));
    onShowAlert?.(`Quotation ${quoteId} converted to Approved Sales Order!`, 'success');
  };

  const handleRepeatOrder = (order: CommercialSalesOrder) => {
    const newRepeat = duplicateRepeatOrder(order);
    setOrders(prev => [newRepeat, ...prev]);
    setSelectedOrder(newRepeat);
    onShowAlert?.(`Repeat order ${newRepeat.id} cloned and approved for ${order.customerName}!`, 'success');
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'quotes') return matchesSearch && (o.orderType === 'Quotation' || o.orderType === 'Proforma Invoice');
    if (activeTab === 'blanket_standing') return matchesSearch && (o.orderType === 'Blanket Order' || o.orderType === 'Standing Order');
    if (activeTab === 'fulfillment') return matchesSearch && (o.fulfillmentMode !== 'Standard Single Shipment' || o.orderType === 'Drop Ship Order');

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl text-slate-900 dark:text-white shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-600/30 border border-emerald-200 dark:border-emerald-400/30 rounded-2xl backdrop-blur-md">
            <Building2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 rounded border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
              COMMERCIAL B2B SALES ENGINE
            </span>
            <h2 className="text-xl font-black tracking-tight mt-1 text-slate-900 dark:text-white">Quotations, Blanket Orders, Contract Pricing &amp; Drop Shipping</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Enterprise Commercial Sales Management for IT Wholesalers &amp; Distributors</p>
          </div>
        </div>
      </div>

      {/* Feature Capabilities Ribbon */}
      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 font-mono text-[11px]">
        <span className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] mr-2">Commercial Capabilities:</span>
        {['Sales Quotations', 'Proforma Invoices', 'Tax Invoices', 'Credit Sales (Net 30/60)', 'Cash Sales', 'Contract Pricing', 'Blanket Orders', 'Standing Orders', 'Partial Shipments', 'Split Shipments', 'Backorders', 'Drop Shipping'].map(cap => (
          <span key={cap} className="px-2.5 py-1 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 rounded-lg border border-slate-200 dark:border-slate-800 font-bold shadow-2xs">
            {cap}
          </span>
        ))}
      </div>

      {/* Workspace Toolbar & Tabs */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'all' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> All Commercial Documents ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'quotes' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" /> Quotations &amp; Proformas
          </button>

          <button
            onClick={() => setActiveTab('blanket_standing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'blanket_standing' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <Repeat className="w-4 h-4" /> Blanket &amp; Standing Orders
          </button>

          <button
            onClick={() => setActiveTab('fulfillment')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'fulfillment' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" /> Partial, Split &amp; Drop Ship
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search B2B order or client..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-9 pr-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 w-56 font-mono"
          />
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Orders List */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Document Records</h3>
          <div className="space-y-3">
            {filteredOrders.map(ord => (
              <div
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                  selectedOrder?.id === ord.id 
                    ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-md' 
                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 rounded border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">{ord.id}</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-50 text-blue-700 rounded border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">{ord.orderType}</span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2">{ord.customerName}</h4>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                  <span>{ord.paymentCategory}</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">${ord.total.toLocaleString()} AUD</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2-Cols: Selected Document Detail Workspace */}
        <div className="lg:col-span-2 space-y-4">
          {selectedOrder ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      {selectedOrder.orderType}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                      {selectedOrder.fulfillmentMode}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">{selectedOrder.customerName}</h3>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{selectedOrder.companyName}</span>
                </div>

                <div className="flex gap-2">
                  {selectedOrder.orderType === 'Quotation' && (
                    <button
                      onClick={() => handleConvertQuote(selectedOrder.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" /> Convert Quote to Sales Order
                    </button>
                  )}

                  <button
                    onClick={() => handleRepeatOrder(selectedOrder)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <Repeat className="w-3.5 h-3.5" /> Repeat Order
                  </button>
                </div>
              </div>

              {/* Order Context Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block">Payment &amp; Trade Category</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 mt-1 block">{selectedOrder.paymentCategory}</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block">Contract Pricing Matrix</span>
                  <span className="font-bold text-purple-700 dark:text-purple-300 mt-1 block">{selectedOrder.contractPriceTier || 'Standard Commercial List'}</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block">Fulfillment Strategy</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">{selectedOrder.fulfillmentMode}</span>
                </div>
              </div>

              {/* Special Order Badges */}
              {selectedOrder.blanketCommitmentUnits && (
                <div className="bg-purple-50 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60 font-mono text-xs text-purple-800 dark:text-purple-300 flex justify-between items-center">
                  <span>BLANKET ORDER COMMITMENT: <strong>{selectedOrder.blanketCommitmentUnits} Units Total</strong></span>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 font-bold rounded-lg border border-purple-200 dark:border-purple-700">
                    Remaining Release: {selectedOrder.blanketRemainingUnits} Units
                  </span>
                </div>
              )}

              {selectedOrder.dropShipClientAddress && (
                <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/60 font-mono text-xs text-blue-800 dark:text-blue-300">
                  <span className="font-bold uppercase text-[10px] block text-blue-700 dark:text-blue-400">VENDOR DROP SHIP CLIENT DELIVERY ADDRESS:</span>
                  <p className="mt-1 font-bold">{selectedOrder.dropShipClientAddress}</p>
                </div>
              )}

              {/* Line Items Table */}
              <div className="space-y-2 font-mono text-xs">
                <h4 className="font-bold uppercase text-slate-500 dark:text-slate-400 text-[10px]">Order Line Items &amp; Partial Shipment Balances</h4>
                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] uppercase bg-slate-100 dark:bg-slate-900">
                        <th className="p-3">Item Description</th>
                        <th className="p-3 text-right">Ordered Qty</th>
                        <th className="p-3 text-right">Shipped Qty</th>
                        <th className="p-3 text-right">Backordered Qty</th>
                        <th className="p-3 text-right">Unit Contract Price</th>
                        <th className="p-3 text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{item.productName}</td>
                          <td className="p-3 text-right font-bold">{item.orderedQty}</td>
                          <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">{item.shippedQty}</td>
                          <td className="p-3 text-right text-amber-600 dark:text-amber-400 font-bold">{item.backorderQty}</td>
                          <td className="p-3 text-right">${item.unitPrice.toFixed(2)}</td>
                          <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">${item.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center font-mono text-xs">
                <span className="text-slate-600 dark:text-slate-400">Commercial Tax Invoice Total (incl. 10% AU GST):</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">${selectedOrder.total.toLocaleString()} AUD</span>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 text-slate-500 dark:text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-emerald-500 opacity-60" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-200">Select a Commercial Document Record</h4>
              <p className="text-xs max-w-sm mx-auto">Select an order from the left panel to inspect its line items, contract price tier, partial shipment status, and drop ship parameters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
