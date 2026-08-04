import React, { useState } from 'react';
import { 
  X, Printer, Download, Mail, Check, Copy, Edit2, FileText, 
  Building2, Calendar, ShieldCheck, CreditCard, DollarSign, RefreshCw, Eye
} from 'lucide-react';
import { Order, Invoice, InvoiceItem, StoreSettings, DEFAULT_STORE_SETTINGS } from '../types';
import { 
  COMPANY_DETAILS, 
  convertOrderToInvoice, 
  generateInvoiceHtml, 
  printInvoiceDirect, 
  downloadInvoiceHtmlFile 
} from '../utils/invoicePrinter';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | null;
  invoiceData?: Invoice | null;
  storeSettings?: StoreSettings;
  onSaveInvoice?: (invoice: Invoice) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
  invoiceData,
  storeSettings,
  onSaveInvoice
}) => {
  if (!isOpen) return null;

  const currentSettings = storeSettings || DEFAULT_STORE_SETTINGS;

  // Derive initial invoice object
  const initialInvoice: Invoice = React.useMemo(() => {
    if (invoiceData) return invoiceData;
    if (order) return convertOrderToInvoice(order, currentSettings);
    return {
      id: `INV-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      poNumber: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Paid',
      type: 'Tax Invoice',
      customerName: 'Valued Customer',
      customerEmail: 'customer@example.com',
      customerPhone: '1300 000 000',
      customerAddress: '123 Enterprise Way',
      customerCity: 'Sydney NSW 2000',
      customerABN: '',
      items: [
        {
          description: 'Enterprise IT Refurbished Laptop',
          quantity: 1,
          unitPrice: 1200,
          amount: 1200,
          taxRate: currentSettings.taxRatePercent
        }
      ],
      subtotal: 1200,
      tax: (1200 * currentSettings.taxRatePercent) / 100,
      shipping: 0,
      discount: 0,
      total: 1200,
      paymentMethod: 'Credit Card',
      paymentTerms: 'Due on Receipt',
      notes: `Thank you for choosing ${currentSettings.storeName}.`
    };
  }, [order, invoiceData, currentSettings]);

  const [activeTab, setActiveTab] = useState<'preview' | 'thermal' | 'edit'>('preview');
  const [invoice, setInvoice] = useState<Invoice>(initialInvoice);
  const [isCopied, setIsCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handlePrint = () => {
    printInvoiceDirect(invoice, currentSettings);
  };

  const handleDownload = () => {
    downloadInvoiceHtmlFile(invoice, currentSettings);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + `#invoice-${invoice.invoiceNumber}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendEmail = () => {
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  const handleFieldChange = (field: keyof Invoice, value: any) => {
    setInvoice(prev => {
      const updated = { ...prev, [field]: value };
      if (onSaveInvoice) onSaveInvoice(updated);
      return updated;
    });
  };

  const isPaid = invoice.status === 'Paid';
  const isQuote = invoice.type === 'Quote' || invoice.status === 'Quote';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="relative flex h-full max-h-[94vh] w-full max-w-5xl flex-col bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Top Header Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-amber-400 text-slate-950 font-black rounded-xl shadow-md">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans text-base font-black uppercase tracking-wide text-white">
                  {invoice.type} <span className="text-amber-400 font-mono">#{invoice.invoiceNumber}</span>
                </h3>
                <span className={`px-2.5 py-0.5 font-mono text-[10px] font-extrabold uppercase rounded-full border ${
                  isPaid ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80' :
                  isQuote ? 'bg-blue-950/80 text-blue-400 border-blue-800/80' :
                  'bg-rose-950/80 text-rose-400 border-rose-800/80'
                }`}>
                  {invoice.status}
                </span>
              </div>
              <p className="font-mono text-xs text-slate-400">
                Issued: {invoice.issueDate} • Customer: <span className="text-slate-200 font-semibold">{invoice.customerName}</span>
              </p>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
                activeTab === 'preview' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" /> A4 Invoice
            </button>
            <button
              onClick={() => setActiveTab('thermal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
                activeTab === 'thermal' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Printer className="h-3.5 w-3.5" /> Thermal POS
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
                activeTab === 'edit' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit Data
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase font-extrabold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
              title="Print Tax Invoice (A4 / PDF)"
            >
              <Printer className="h-4 w-4" /> Print / Save PDF
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs uppercase font-bold px-3 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer"
              title="Download HTML File"
            >
              <Download className="h-4 w-4" /> Download
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/80">
          
          {/* TAB 1: A4 Printable Document View */}
          {activeTab === 'preview' && (
            <div className="mx-auto max-w-3xl bg-white text-slate-900 rounded-lg p-8 shadow-2xl border border-slate-200 relative select-text my-2">
              
              {/* Decorative Stamp Watermark */}
              <div className={`absolute top-36 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 font-mono text-6xl font-black uppercase tracking-widest pointer-events-none opacity-10 select-none ${
                isPaid ? 'text-emerald-600' : isQuote ? 'text-blue-600' : 'text-rose-600'
              }`}>
                {invoice.status}
              </div>

              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-white rounded border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
                      <img 
                        src="/images/app_logo.jpg" 
                        alt="Logo" 
                        className="h-full w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <span className="block font-extrabold text-xl tracking-tight uppercase text-slate-950 font-sans leading-tight">
                        {currentSettings.storeName}
                      </span>
                      <span className="bg-amber-400 text-slate-950 font-mono text-[9px] font-black px-2 py-0.5 rounded">
                        OFFICIAL STORE
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                    <p className="font-semibold text-slate-800">{currentSettings.legalName}</p>
                    <p>Business ID / ABN: <span className="font-mono">{currentSettings.businessNumber}</span></p>
                    <p>{currentSettings.address}, {currentSettings.cityStateZip}</p>
                    <p>Phone: {currentSettings.phone} | Email: {currentSettings.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  <h2 className="font-sans text-2xl font-black uppercase tracking-wider text-slate-900">
                    {invoice.type}
                  </h2>
                  <p className="font-mono text-sm font-bold text-blue-600 mt-1">{invoice.invoiceNumber}</p>
                  <span className={`inline-block mt-2 px-3 py-1 font-mono text-xs font-black uppercase rounded-full border ${
                    isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                    isQuote ? 'bg-blue-50 text-blue-700 border-blue-300' :
                    'bg-rose-50 text-rose-700 border-rose-300'
                  }`}>
                    {invoice.status}
                  </span>
                  <div className="text-[10px] text-slate-500 font-semibold mt-1">{currentSettings.invoiceHeaderSubtitle}</div>
                </div>
              </div>

              {/* Customer & Order Metadata Grid */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 text-left">
                <div>
                  <span className="font-mono text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">
                    BILLED TO (CUSTOMER)
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{invoice.customerName}</p>
                  {invoice.customerCompany && <p className="text-xs font-semibold text-slate-700">{invoice.customerCompany}</p>}
                  <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                    <p>{invoice.customerAddress}</p>
                    <p>{invoice.customerCity}</p>
                    <p>Email: {invoice.customerEmail}</p>
                    <p>Phone: {invoice.customerPhone}</p>
                    {invoice.customerABN && <p className="font-mono text-[11px] text-slate-700">ABN: {invoice.customerABN}</p>}
                  </div>
                </div>

                <div className="text-left font-mono text-xs space-y-1.5 text-slate-700">
                  <span className="font-mono text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1 font-sans">
                    INVOICE METADATA
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Issue Date:</span>
                    <span className="font-bold text-slate-900">{invoice.issueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Due Date:</span>
                    <span className="font-bold text-slate-900">{invoice.dueDate || invoice.issueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PO Number:</span>
                    <span className="font-bold text-blue-600">{invoice.poNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between font-sans">
                    <span className="text-slate-500">Payment Method:</span>
                    <span className="font-bold text-slate-900">{invoice.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse mb-6">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono text-xs font-bold uppercase">
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">Item Description</th>
                    <th className="p-3 w-16 text-center">Qty</th>
                    <th className="p-3 w-28 text-right">Unit Price</th>
                    <th className="p-3 w-28 text-right">Amount AUD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                      <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.description}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Grade A Enterprise Certified • 10% GST Included
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800">{item.quantity}</td>
                      <td className="p-3 text-right font-mono text-slate-700">${item.unitPrice.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals & Bank Transfer Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                
                {/* Bank Details */}
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 text-xs space-y-1.5 text-left">
                  <h5 className="font-mono text-[11px] uppercase font-black text-slate-900 flex items-center gap-1.5 mb-2">
                    <Building2 className="h-3.5 w-3.5 text-blue-600" /> Direct Bank Transfer Details
                  </h5>
                  <p><span className="text-slate-500">Bank:</span> <strong>{currentSettings.bankName}</strong></p>
                  <p><span className="text-slate-500">Account:</span> <strong>{currentSettings.accountName}</strong></p>
                  <p><span className="text-slate-500">BSB:</span> <span className="font-mono font-bold">{currentSettings.bsb}</span> | <span className="text-slate-500">Acc #:</span> <span className="font-mono font-bold">{currentSettings.accountNumber}</span></p>
                  <p><span className="text-slate-500">Ref:</span> <span className="font-mono font-bold text-blue-600">{invoice.invoiceNumber}</span></p>
                </div>

                {/* Totals Table */}
                <div className="space-y-2 text-xs font-mono text-slate-700">
                  <div className="flex justify-between py-1">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-900">{currentSettings.currencySymbol}{invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between py-1 text-emerald-700">
                      <span>Discount Applied:</span>
                      <span className="font-bold">-{currentSettings.currencySymbol}{invoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span>Shipping &amp; Delivery:</span>
                    <span className="font-bold text-slate-900">{invoice.shipping === 0 ? 'FREE' : `${currentSettings.currencySymbol}${invoice.shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-500">
                    <span>Tax ({currentSettings.taxRatePercent}% {currentSettings.taxName} Inc.):</span>
                    <span className="font-bold">{currentSettings.currencySymbol}{invoice.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-b-2 border-slate-900 text-sm font-sans font-black text-slate-950">
                    <span>TOTAL ({currentSettings.currencySymbol}):</span>
                    <span className="font-mono text-base text-blue-600">{currentSettings.currencySymbol}{invoice.total.toFixed(2)}</span>
                  </div>
                </div>

              </div>

              {/* Warranty Guarantee Footer */}
              <div className="border-t border-slate-200 pt-4 text-center text-xs text-slate-500 space-y-1">
                <p>Thank you for choosing <strong>{currentSettings.storeName}</strong>.</p>
                {currentSettings.invoiceWarrantyText && (
                  <div className="inline-block bg-amber-100 text-amber-900 font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    🛡️ {currentSettings.invoiceWarrantyText}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: Thermal POS Receipt View */}
          {activeTab === 'thermal' && (
            <div className="mx-auto max-w-sm bg-white text-slate-900 font-mono text-xs p-6 shadow-xl border border-slate-300 rounded-none select-text my-4 text-left">
              <div className="text-center border-b border-dashed border-slate-400 pb-4 mb-4">
                <h4 className="font-black text-lg text-slate-950 uppercase">{currentSettings.storeName}</h4>
                <p className="text-[10px] text-slate-600 font-bold uppercase">{currentSettings.legalName}</p>
                <p className="text-[10px] text-slate-500">Business ID / ABN: {currentSettings.businessNumber}</p>
                <p className="text-[10px] text-slate-500">{currentSettings.phone}</p>
                <div className="mt-2 text-xs font-bold bg-slate-900 text-white py-1 uppercase">
                  RETAIL TAX RECEIPT
                </div>
              </div>

              <div className="space-y-1 mb-4 text-[11px] border-b border-dashed border-slate-300 pb-3">
                <p>Receipt #: <span className="font-bold">{invoice.invoiceNumber}</span></p>
                <p>Date: {invoice.issueDate}</p>
                <p>Customer: {invoice.customerName}</p>
                <p>Payment: {invoice.paymentMethod}</p>
              </div>

              <table className="w-full text-left mb-4 text-[11px]">
                <thead>
                  <tr className="border-b border-slate-400 font-bold">
                    <th className="pb-1">QTY ITEM</th>
                    <th className="pb-1 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-1.5">
                        <span className="font-bold">{item.quantity}x</span> {item.description}
                      </td>
                      <td className="py-1.5 text-right font-bold">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t-2 border-slate-900 pt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-${invoice.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                  <span>TOTAL:</span>
                  <span>${invoice.total.toFixed(2)}</span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1">
                  GST Included (10%): ${(invoice.total * 0.1).toFixed(2)}
                </div>
              </div>

              <div className="text-center border-t border-dashed border-slate-400 pt-4 mt-4 text-[10px] text-slate-600 space-y-1">
                <p className="font-bold uppercase">*** THANK YOU FOR YOUR BUSINESS ***</p>
                <p>12 Months Warranty Included</p>
                <p>{COMPANY_DETAILS.website}</p>
              </div>
            </div>
          )}

          {/* TAB 3: Quick Edit Form View */}
          {activeTab === 'edit' && (
            <div className="mx-auto max-w-2xl bg-slate-900 p-6 rounded-2xl border border-slate-800 text-left space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-mono text-sm font-bold uppercase text-amber-400 flex items-center gap-2">
                  <Edit2 className="h-4 w-4" /> Edit Invoice Metadata &amp; B2B Details
                </h4>
                <span className="text-xs text-slate-400">Updates live in preview</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs uppercase text-slate-400 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={invoice.invoiceNumber}
                    onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase text-slate-400 mb-1">Document Type</label>
                  <select
                    value={invoice.type}
                    onChange={(e) => handleFieldChange('type', e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Tax Invoice">Tax Invoice</option>
                    <option value="Pro Forma">Pro Forma Invoice</option>
                    <option value="Quote">Official Quote</option>
                    <option value="Credit Note">Credit Note</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase text-slate-400 mb-1">Payment Status</label>
                  <select
                    value={invoice.status}
                    onChange={(e) => handleFieldChange('status', e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Quote">Quote</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase text-slate-400 mb-1">PO Reference Number</label>
                  <input
                    type="text"
                    value={invoice.poNumber || ''}
                    onChange={(e) => handleFieldChange('poNumber', e.target.value)}
                    placeholder="e.g. PO-89201"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase text-slate-400 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={invoice.customerName}
                    onChange={(e) => handleFieldChange('customerName', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase text-slate-400 mb-1">Customer Company (Optional)</label>
                  <input
                    type="text"
                    value={invoice.customerCompany || ''}
                    onChange={(e) => handleFieldChange('customerCompany', e.target.value)}
                    placeholder="e.g. Acme Logistics Corp"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase text-slate-400 mb-1">Customer ABN / Tax ID</label>
                  <input
                    type="text"
                    value={invoice.customerABN || ''}
                    onChange={(e) => handleFieldChange('customerABN', e.target.value)}
                    placeholder="e.g. 12 345 678 910"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase text-slate-400 mb-1">Customer Email</label>
                  <input
                    type="email"
                    value={invoice.customerEmail}
                    onChange={(e) => handleFieldChange('customerEmail', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase text-slate-400 mb-1">Invoice Notes / Special Instructions</label>
                <textarea
                  rows={3}
                  value={invoice.notes || ''}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveTab('preview')}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono text-xs font-black uppercase px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Apply &amp; Return to Preview
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Share / Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950 px-6 py-3 font-mono text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{isCopied ? 'Link Copied!' : 'Copy Direct Link'}</span>
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={handleSendEmail}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Mail className="h-4 w-4 text-blue-400" />
              <span>{emailSent ? 'Invoice Emailed to Customer!' : 'Send Invoice Email'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-[11px]">TECH SELLER Invoicing Engine v2.4</span>
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
