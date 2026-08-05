import React, { useState } from 'react';
import { 
  Truck, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Upload, 
  Search, 
  Package, 
  Printer, 
  X, 
  ExternalLink, 
  Building2,
  DollarSign,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { PurchaseOrder, Supplier } from '../../types';

interface SupplierPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  onUpdatePurchaseOrder: (po: PurchaseOrder) => void;
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function SupplierPortalModal({
  isOpen,
  onClose,
  purchaseOrders,
  suppliers,
  onUpdatePurchaseOrder,
  onShowAlert
}: SupplierPortalModalProps) {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.name || 'Dell Australia');
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);

  // Form states
  const [status, setStatus] = useState<string>('Sent');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [shipmentNotes, setShipmentNotes] = useState('');

  if (!isOpen) return null;

  const vendorOrders = purchaseOrders.filter(po => 
    !selectedSupplierId || po.supplierName.toLowerCase().includes(selectedSupplierId.toLowerCase())
  );

  const handleSelectPO = (po: PurchaseOrder) => {
    setSelectedPo(po);
    setStatus(po.status);
    setCarrier(po.notes?.split('Carrier: ')[1]?.split(' ')[0] || 'DHL Express');
    setTrackingNumber(po.notes?.split('Tracking #: ')[1]?.split(' ')[0] || '');
    setInvoiceNumber(po.supplierInvoiceNumber || '');
    setShipmentNotes(po.notes || '');
  };

  const handleSaveSupplierUpdates = () => {
    if (!selectedPo) return;

    const updatedNotes = `Carrier: ${carrier || 'Standard Freight'} Tracking #: ${trackingNumber || 'N/A'} Notes: ${shipmentNotes}`;

    const updatedPO: PurchaseOrder = {
      ...selectedPo,
      status: status as any,
      supplierInvoiceNumber: invoiceNumber || selectedPo.supplierInvoiceNumber,
      notes: updatedNotes
    };

    onUpdatePurchaseOrder(updatedPO);
    setSelectedPo(updatedPO);
    onShowAlert?.(`Supplier updates saved for ${selectedPo.id}! Status set to ${status}.`, 'success');
  };

  const handleConfirmOrder = (po: PurchaseOrder) => {
    const updatedPO: PurchaseOrder = { ...po, status: 'Sent' };
    onUpdatePurchaseOrder(updatedPO);
    onShowAlert?.(`Purchase Order ${po.id} Confirmed & Accepted by Vendor!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-5xl rounded-3xl border border-slate-800 text-white flex flex-col max-h-[92vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600/20 border border-purple-500/30 rounded-2xl">
              <Building2 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                B2B SUPPLIER SELF-SERVICE PORTAL
              </span>
              <h2 className="text-lg font-black tracking-tight mt-0.5">Vendor Fulfillment &amp; Dispatch Workspace</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedSupplierId}
              onChange={e => setSelectedSupplierId(e.target.value)}
              className="bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-mono rounded-xl text-slate-200"
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
              <option value="">All Suppliers</option>
            </select>

            <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2-Col Content Area */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 1-Col: Issued POs List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Issued Purchase Orders ({vendorOrders.length})</h3>

            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {vendorOrders.map(po => (
                <div
                  key={po.id}
                  onClick={() => handleSelectPO(po)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedPo?.id === po.id
                      ? 'bg-slate-950 border-purple-500/50 shadow-md'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-purple-950 text-purple-300 rounded border border-purple-800">{po.id}</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">${po.total.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-100 mt-2 line-clamp-1">{po.supplierName}</h4>
                  <div className="text-[11px] font-mono text-slate-400 mt-1 flex justify-between">
                    <span>Expected: {po.expectedDelivery || 'TBD'}</span>
                    <span className="text-amber-400 font-bold">{po.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 2-Cols: Selected PO Fulfillment Workspace */}
          <div className="lg:col-span-2 space-y-4">
            {selectedPo ? (
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-5">
                <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-3 gap-2">
                  <div>
                    <span className="px-2.5 py-1 text-xs font-mono font-bold bg-purple-950 text-purple-300 rounded-lg border border-purple-800">{selectedPo.id}</span>
                    <h3 className="text-sm font-bold text-slate-100 mt-1">{selectedPo.supplierName}</h3>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConfirmOrder(selectedPo)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirm PO Acceptance
                    </button>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Ordered Qty</th>
                        <th className="p-3">Agreed Cost</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {selectedPo.items.map(item => (
                        <tr key={item.id}>
                          <td className="p-3 font-bold text-slate-100">{item.productName}</td>
                          <td className="p-3">{item.orderedQty} units</td>
                          <td className="p-3">${item.unitCost.toFixed(2)}</td>
                          <td className="p-3 text-right font-bold text-emerald-400">${item.totalCost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Vendor Form: Shipment Milestones, Tracking, and Invoices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800 font-mono text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase text-[10px] font-bold block">Fulfillment Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-slate-200 font-bold"
                    >
                      <option value="Sent">Sent (Pending Vendor)</option>
                      <option value="Confirmed">Confirmed &amp; Accepted</option>
                      <option value="In Production">In Production / Assembly</option>
                      <option value="Partially Received">Shipped (Partially Received)</option>
                      <option value="Received">Delivered / Received</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase text-[10px] font-bold block">Carrier Freight Company</label>
                    <input
                      type="text"
                      placeholder="e.g. DHL Express, Australia Post, Toll"
                      value={carrier}
                      onChange={e => setCarrier(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase text-[10px] font-bold block">Upload Tracking Reference Number</label>
                    <input
                      type="text"
                      placeholder="e.g. DHL-8819203912"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-emerald-400 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase text-[10px] font-bold block">Supplier Tax Invoice Number</label>
                    <input
                      type="text"
                      placeholder="e.g. DELL-INV-9921"
                      value={invoiceNumber}
                      onChange={e => setInvoiceNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-blue-300 font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleSaveSupplierUpdates}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/20"
                  >
                    Save &amp; Transmit Vendor Updates to ERP
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-12 rounded-3xl border border-slate-800 text-center space-y-3 text-slate-400">
                <Truck className="w-10 h-10 mx-auto text-purple-400 opacity-60" />
                <h4 className="font-bold text-sm text-slate-200">Select a Purchase Order</h4>
                <p className="text-xs max-w-sm mx-auto">Select an issued PO from the left panel to update fulfillment status, upload tracking numbers, and submit tax invoices.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
