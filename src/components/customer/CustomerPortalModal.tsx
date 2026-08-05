import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  FileText, 
  ShieldCheck, 
  RotateCcw, 
  Wrench, 
  MessageSquare, 
  Search, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Download, 
  Printer, 
  Send, 
  User, 
  Sparkles, 
  AlertCircle,
  Package
} from 'lucide-react';
import { Order, CustomerProfile, ReturnRequest, RepairJob, Product, StoreSettings } from '../../types';
import { printInvoiceDirect } from '../../utils/invoicePrinter';
import { generateWarrantyCertificateHTML } from '../../utils/warrantyPrinter';

interface CustomerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  customerProfile: CustomerProfile;
  products: Product[];
  storeSettings?: StoreSettings;
  onAddReturnRequest?: (req: ReturnRequest) => void;
  onAddRepairJob?: (job: RepairJob) => void;
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function CustomerPortalModal({
  isOpen,
  onClose,
  orders,
  customerProfile,
  products,
  storeSettings,
  onAddReturnRequest,
  onAddRepairJob,
  onShowAlert
}: CustomerPortalModalProps) {
  const [activeTab, setActiveTab] = useState<'tracking' | 'invoices' | 'warranties' | 'rma' | 'repairs' | 'chat'>('tracking');
  const [searchOrderQuery, setSearchOrderQuery] = useState('');

  // RMA Form State
  const [rmaOrderId, setRmaOrderId] = useState(orders[0]?.id || '');
  const [rmaReason, setRmaReason] = useState('DOA - Dead on Arrival');
  const [rmaNotes, setRmaNotes] = useState('');

  // Repair Booking Form State
  const [repairDeviceType, setRepairDeviceType] = useState('Laptop');
  const [repairBrand, setRepairBrand] = useState('');
  const [repairModel, setRepairModel] = useState('');
  const [repairSerial, setRepairSerial] = useState('');
  const [repairFault, setRepairFault] = useState('');

  // Chat State
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'support'; text: string; time: string }[]>([
    { sender: 'support', text: `Hello ${customerProfile.name || 'Valued Customer'}! Welcome to Tech Seller Customer Support. How can we help you today?`, time: 'Just now' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  if (!isOpen) return null;

  const filteredOrders = orders.filter(o => 
    !searchOrderQuery || 
    o.id.toLowerCase().includes(searchOrderQuery.toLowerCase()) || 
    o.items.some(i => i.name.toLowerCase().includes(searchOrderQuery.toLowerCase()))
  );

  const handlePrintInvoice = (order: Order) => {
    printInvoiceDirect({
      id: `INV-${order.id}`,
      orderId: order.id,
      invoiceNumber: order.invoiceNumber || `INV-2026-${order.id.slice(-5)}`,
      issueDate: order.date,
      status: 'Paid',
      type: 'Tax Invoice',
      customerName: order.customerName || customerProfile.name,
      customerEmail: order.customerEmail || customerProfile.email,
      customerAddress: order.customerAddress || customerProfile.address,
      customerCity: order.customerCity || customerProfile.city,
      items: order.items.map(i => ({
        description: i.name,
        quantity: i.quantity,
        unitPrice: i.price,
        amount: i.price * i.quantity
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      paymentMethod: order.paymentMethod
    }, storeSettings);
    onShowAlert?.('Invoice opening in print dialog...', 'info');
  };

  const handlePrintWarrantyCert = (order: Order, item: Order['items'][0]) => {
    const html = generateWarrantyCertificateHTML({
      orderNumber: order.id,
      customerName: order.customerName || customerProfile.name,
      customerEmail: order.customerEmail || customerProfile.email,
      purchaseDate: order.date,
      productName: item.name,
      serialNumber: `SN-${item.productId.toUpperCase()}-88912`,
      warrantyPeriod: '12 Months Express Warranty',
      storeSettings
    });

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
    onShowAlert?.('Warranty Certificate generated!', 'success');
  };

  const handleSubmitRMA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rmaOrderId) {
      onShowAlert?.('Please select an order for RMA submission.', 'error');
      return;
    }

    const order = orders.find(o => o.id === rmaOrderId);
    const newRma: ReturnRequest = {
      id: 'RMA-' + String(Date.now()).slice(-6),
      orderId: rmaOrderId,
      customerName: customerProfile.name || 'Customer',
      customerEmail: customerProfile.email || 'customer@example.com',
      items: order ? order.items.map(i => ({ productId: i.productId, name: i.name, quantity: i.quantity, reason: rmaReason })) : [],
      status: 'Pending',
      requestDate: new Date().toISOString().split('T')[0],
      adminNote: rmaNotes
    };

    onAddReturnRequest?.(newRma);
    onShowAlert?.(`RMA Request ${newRma.id} submitted! Our support team will review within 24 hours.`, 'success');
    setRmaNotes('');
  };

  const handleBookRepair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairBrand.trim() || !repairFault.trim()) {
      onShowAlert?.('Device brand and fault description are required.', 'error');
      return;
    }

    const newJob: RepairJob = {
      id: 'JOB-' + String(Date.now()).slice(-6),
      status: 'Intake',
      customerName: customerProfile.name || 'Customer',
      customerEmail: customerProfile.email || 'customer@example.com',
      customerPhone: customerProfile.phone || 'N/A',
      deviceType: repairDeviceType,
      deviceBrand: repairBrand,
      deviceModel: repairModel || 'Generic',
      serialNumber: repairSerial || 'SN-PENDING',
      fault: repairFault,
      technicianName: 'Unassigned',
      partsUsed: [],
      labourHours: 1,
      labourRatePerHour: 85,
      estimatedCost: 85.00,
      isWarrantyJob: false,
      intakeDate: new Date().toISOString().split('T')[0]
    };

    onAddRepairJob?.(newJob);
    onShowAlert?.(`Repair Ticket ${newJob.id} booked! Please drop off your device at our Sydney Workshop.`, 'success');
    setRepairBrand('');
    setRepairModel('');
    setRepairSerial('');
    setRepairFault('');
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => [
      ...prev,
      { sender: 'user', text: userText, time: nowTime }
    ]);
    setInputMessage('');

    // Simulated Smart Support Bot Response
    setTimeout(() => {
      let botReply = "Thank you for reaching out! A technical support agent has received your message and will assist you shortly.";
      const lower = userText.toLowerCase();

      if (lower.includes('order') || lower.includes('track') || lower.includes('shipping')) {
        botReply = `Your recent orders are currently in transit with Australia Post & DHL. You can view live tracking progress in the "Track Orders" tab.`;
      } else if (lower.includes('invoice') || lower.includes('tax') || lower.includes('receipt')) {
        botReply = `Tax invoices can be printed directly from the "Download Invoices" tab.`;
      } else if (lower.includes('warranty') || lower.includes('repair')) {
        botReply = `All Tech Seller hardware includes a 12-Month Warranty. You can submit warranty claims under the "Submit RMAs" tab or book workshop repairs under "Book Repairs".`;
      }

      setChatMessages(prev => [
        ...prev,
        { sender: 'support', text: botReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-5xl rounded-3xl border border-slate-800 text-white flex flex-col max-h-[92vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-blue-300 uppercase tracking-widest bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                CUSTOMER SELF-SERVICE PORTAL HUB
              </span>
              <h2 className="text-lg font-black tracking-tight mt-0.5">Welcome, {customerProfile.name || 'Valued Customer'}</h2>
            </div>
          </div>

          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 Tabs Navigation Bar */}
        <div className="bg-slate-950 p-2 border-b border-slate-800 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'tracking' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" /> Track Orders
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'invoices' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Download Invoices
          </button>

          <button
            onClick={() => setActiveTab('warranties')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'warranties' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> View Warranties
          </button>

          <button
            onClick={() => setActiveTab('rma')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'rma' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Submit RMAs
          </button>

          <button
            onClick={() => setActiveTab('repairs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'repairs' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> Book Repairs
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'chat' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Live Support Chat
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: TRACK ORDERS */}
          {activeTab === 'tracking' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black uppercase text-slate-200">My Orders &amp; Live Tracking</h3>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchOrderQuery}
                    onChange={e => setSearchOrderQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-800 pl-8 pr-3 py-1.5 text-xs rounded-xl text-white w-56"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredOrders.map(order => (
                  <div key={order.id} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4">
                    <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-blue-950 text-blue-300 rounded border border-blue-800">{order.id}</span>
                        <span className="text-xs font-mono text-slate-400 ml-3">Placed {order.date}</span>
                      </div>
                      <span className="text-sm font-mono font-black text-emerald-400">${order.total.toFixed(2)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] font-mono text-slate-400">
                        <span>Fulfillment Milestone</span>
                        <strong className="text-blue-400">{order.status}</strong>
                      </div>
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: order.status === 'Delivered' ? '100%' : order.status === 'Shipped' ? '75%' : '40%' }}
                        />
                      </div>
                    </div>

                    {/* Item list */}
                    <div className="space-y-1 text-xs font-mono text-slate-300">
                      {order.items.map(item => (
                        <div key={item.productId} className="flex justify-between py-1 border-b border-slate-900">
                          <span>{item.quantity}x {item.name}</span>
                          <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: DOWNLOAD INVOICES */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-200">ATO Compliant Tax Invoices</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-950 text-blue-300 rounded border border-blue-800">INV-{order.id}</span>
                        <h4 className="font-bold text-xs text-slate-100 mt-1">{order.customerName || customerProfile.name}</h4>
                        <span className="text-[11px] font-mono text-slate-400">{order.date}</span>
                      </div>
                      <span className="text-sm font-mono font-black text-emerald-400">${order.total.toFixed(2)}</span>
                    </div>

                    <button
                      onClick={() => handlePrintInvoice(order)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" /> Download / Print Tax Invoice
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: VIEW WARRANTIES */}
          {activeTab === 'warranties' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-200">Active 12-Month Hardware Warranties</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.flatMap(order => order.items.map(item => ({ order, item }))).map(({ order, item }, idx) => (
                  <div key={idx} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 rounded border border-emerald-800">12M EXPRESS WARRANTY</span>
                        <h4 className="font-bold text-xs text-slate-100 mt-1">{item.name}</h4>
                        <span className="text-[11px] font-mono text-slate-400">Serial #: SN-{item.productId.toUpperCase()}-88912</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePrintWarrantyCert(order, item)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" /> Print Warranty Certificate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SUBMIT RMAs */}
          {activeTab === 'rma' && (
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-100 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-purple-400" /> Submit Online Return Authorization (RMA)
              </h3>

              <form onSubmit={handleSubmitRMA} className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase text-[10px] font-bold block">Select Order</label>
                  <select
                    value={rmaOrderId}
                    onChange={e => setRmaOrderId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-slate-200"
                  >
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>{o.id} - ${o.total.toFixed(2)} ({o.date})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase text-[10px] font-bold block">Return Reason</label>
                  <select
                    value={rmaReason}
                    onChange={e => setRmaReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-slate-200"
                  >
                    <option value="DOA - Dead on Arrival">DOA - Dead on Arrival</option>
                    <option value="Factory Defect / Faulty">Factory Defect / Faulty Component</option>
                    <option value="Incompatible Spec">Incompatible Spec</option>
                    <option value="Change of Mind">Change of Mind (30-Day Policy)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase text-[10px] font-bold block">Detailed Notes &amp; Symptoms</label>
                  <textarea
                    rows={3}
                    placeholder="Describe the issue or defect..."
                    value={rmaNotes}
                    onChange={e => setRmaNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/20"
                >
                  Submit RMA Ticket to Support
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: BOOK REPAIRS */}
          {activeTab === 'repairs' && (
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-100 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-400" /> Book Workshop Repair Service
              </h3>

              <form onSubmit={handleBookRepair} className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase text-[10px] font-bold block">Device Type</label>
                  <select
                    value={repairDeviceType}
                    onChange={e => setRepairDeviceType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-slate-200"
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="Desktop">Desktop PC</option>
                    <option value="Monitor">Monitor / Display</option>
                    <option value="Server">Enterprise Server</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase text-[10px] font-bold block">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dell, Lenovo, Apple, ASUS"
                    value={repairBrand}
                    onChange={e => setRepairBrand(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase text-[10px] font-bold block">Model Number</label>
                  <input
                    type="text"
                    placeholder="e.g. Latitude 5420"
                    value={repairModel}
                    onChange={e => setRepairModel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase text-[10px] font-bold block">Serial Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-8891203"
                    value={repairSerial}
                    onChange={e => setRepairSerial(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-white"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-400 uppercase text-[10px] font-bold block">Reported Fault Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe symptoms (e.g. Screen flickering, no power, battery health)..."
                    value={repairFault}
                    onChange={e => setRepairFault(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/20"
                  >
                    Reserve Workshop Repair Intake Ticket
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: LIVE SUPPORT CHAT */}
          {activeTab === 'chat' && (
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col h-[55vh]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase text-slate-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" /> Real-time Support Chat Assistant
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Online &bull; Instant Replies
                </span>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto space-y-3 p-2 font-mono text-xs">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md p-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
                    }`}>
                      <p className="leading-relaxed">{msg.text}</p>
                      <span className="text-[9px] opacity-70 block text-right mt-1">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t border-slate-800 pt-3">
                <input
                  type="text"
                  placeholder="Ask about orders, warranties, or technical support..."
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs rounded-xl text-white outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
