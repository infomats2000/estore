import React, { useState } from 'react';
import { 
  Building2, CreditCard, AlertTriangle, ShieldAlert, CheckCircle2, Clock, 
  Search, SlidersHorizontal, Plus, Edit3, DollarSign, FileText, Printer, 
  ArrowUpRight, RefreshCw, Send, Lock, Unlock, Eye, Sparkles, TrendingUp, Users, Tag
} from 'lucide-react';
import { CustomerProfile, Product, TradeAccount, TradeLedgerEntry, PriceTierType, CreditTermType, TradeAccountStatus, StoreSettings } from '../../types';
import { printStatementDirect, downloadStatementHtmlFile, calculateAgingSummary } from '../../utils/statementPrinter';
import { TIER_DISCOUNT_PERCENTAGES } from '../../utils/pricing';

interface B2BTradeManagerProps {
  customers: CustomerProfile[];
  products: Product[];
  storeSettings: StoreSettings;
  onUpdateCustomer: (updatedCustomer: CustomerProfile) => void;
  onUpdateProduct: (updatedProduct: Product) => void;
}

export default function B2BTradeManager({
  customers,
  products,
  storeSettings,
  onUpdateCustomer,
  onUpdateProduct
}: B2BTradeManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'overdue' | 'ledger' | 'pricing'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [tierFilter, setTierFilter] = useState<string>('All');

  // Modals state
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);

  // Approve / Edit Form State
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formAbn, setFormAbn] = useState('');
  const [formCreditLimit, setFormCreditLimit] = useState('10000');
  const [formCreditTerms, setFormCreditTerms] = useState<CreditTermType>('Net 30');
  const [formPriceTier, setFormPriceTier] = useState<PriceTierType>('Wholesale');
  const [formCustomDiscount, setFormCustomDiscount] = useState('0');
  const [formPoRequired, setFormPoRequired] = useState(false);
  const [formTaxExempt, setFormTaxExempt] = useState(false);
  const [formStatus, setFormStatus] = useState<TradeAccountStatus>('Active');

  // Payment Entry Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('EFT Bank Transfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('Trade Account Balance Payment');
  const [paymentType, setPaymentType] = useState<'Payment Received' | 'Credit Adjustment'>('Payment Received');

  // Product Tier Pricing State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [prodResellerPrice, setProdResellerPrice] = useState('');
  const [prodWholesalePrice, setProdWholesalePrice] = useState('');
  const [prodGovPrice, setProdGovPrice] = useState('');
  const [volumeQtyBreak, setVolumeQtyBreak] = useState('5');
  const [volumeDiscountPercent, setVolumeDiscountPercent] = useState('5');

  // Notification Toast state
  const [actionSuccess, setActionSuccess] = useState('');

  const triggerSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  // Filter B2B customers
  const b2bCustomers = customers.filter(c => {
    const isTrade = c.type === 'Trade' || c.tradeAccount || c.company || c.type === 'Wholesale';
    if (!isTrade) return false;

    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.tradeAccount && c.tradeAccount.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const status = c.tradeAccount?.status || (c.type === 'Wholesale' ? 'Active' : 'None');
    const matchesStatus = statusFilter === 'All' || status === statusFilter;

    const tier = c.tradeAccount?.priceTier || (c.type === 'Wholesale' ? 'Wholesale' : 'Retail');
    const matchesTier = tierFilter === 'All' || tier === tierFilter;

    return matchesSearch && matchesStatus && matchesTier;
  });

  // Calculate Metrics
  const totalReceivables = customers.reduce((acc, c) => acc + (c.tradeAccount?.creditBalance || 0), 0);
  const totalCreditLimit = customers.reduce((acc, c) => acc + (c.tradeAccount?.creditLimit || 0), 0);
  const creditHoldCount = customers.filter(c => c.tradeAccount?.status === 'Credit Hold').length;
  const pendingCount = customers.filter(c => c.tradeAccount?.status === 'Pending').length;

  const overdueCustomers = customers.filter(c => {
    if (!c.tradeAccount || c.tradeAccount.creditBalance <= 0) return false;
    const ledger = c.tradeLedger || [];
    return ledger.some(e => e.status === 'Overdue');
  });

  const totalOverdueAmount = overdueCustomers.reduce((acc, c) => acc + (c.tradeAccount?.creditBalance || 0), 0);

  // Open Approval / Edit Modal
  const handleOpenApproveModal = (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    const t = customer.tradeAccount;
    setFormCompanyName(t?.companyName || customer.company || customer.name);
    setFormAbn(t?.abn || customer.abn || '');
    setFormCreditLimit(t?.creditLimit ? t.creditLimit.toString() : '10000');
    setFormCreditTerms(t?.creditTerms || 'Net 30');
    setFormPriceTier(t?.priceTier || (customer.type === 'Wholesale' ? 'Wholesale' : 'Reseller'));
    setFormCustomDiscount(t?.customDiscountPercent ? t.customDiscountPercent.toString() : '0');
    setFormPoRequired(t?.poRequired ?? true);
    setFormTaxExempt(t?.taxExempt ?? false);
    setFormStatus(t?.status === 'Pending' ? 'Active' : (t?.status || 'Active'));
    setIsApproveModalOpen(true);
  };

  // Submit Approval / Update Trade Account
  const handleSaveTradeAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const limit = parseFloat(formCreditLimit) || 0;
    const customDiscount = parseFloat(formCustomDiscount) || 0;

    const existingAccount = selectedCustomer.tradeAccount;
    const accountNum = existingAccount?.accountNumber || `TRD-${Math.floor(10000 + Math.random() * 90000)}`;

    const updatedAccount: TradeAccount = {
      accountNumber: accountNum,
      companyName: formCompanyName,
      abn: formAbn,
      contactPerson: selectedCustomer.name,
      phone: selectedCustomer.phone,
      email: selectedCustomer.email,
      status: formStatus,
      creditLimit: limit,
      creditBalance: existingAccount?.creditBalance || 0,
      creditTerms: formCreditTerms,
      priceTier: formPriceTier,
      customDiscountPercent: customDiscount,
      poRequired: formPoRequired,
      taxExempt: formTaxExempt,
      appliedDate: existingAccount?.appliedDate || new Date().toISOString().split('T')[0],
      approvedDate: new Date().toISOString().split('T')[0],
      notes: existingAccount?.notes || 'B2B Trade Account Configured'
    };

    const updatedCust: CustomerProfile = {
      ...selectedCustomer,
      type: 'Trade',
      company: formCompanyName,
      abn: formAbn,
      tradeAccount: updatedAccount,
      tradeLedger: selectedCustomer.tradeLedger || [
        {
          id: `LEDG-INIT-${Date.now()}`,
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          companyName: formCompanyName,
          date: new Date().toISOString().split('T')[0],
          type: 'Credit Adjustment',
          amount: 0,
          runningBalance: 0,
          reference: 'ACC-INIT',
          description: `Account approved with $${limit.toLocaleString()} credit limit on ${formCreditTerms}`,
          status: 'Current'
        }
      ]
    };

    onUpdateCustomer(updatedCust);
    setIsApproveModalOpen(false);
    triggerSuccess(`Trade Account ${accountNum} for ${formCompanyName} saved successfully!`);
  };

  // Toggle Credit Hold
  const handleToggleCreditHold = (customer: CustomerProfile) => {
    if (!customer.tradeAccount) return;
    const currentStatus = customer.tradeAccount.status;
    const newStatus: TradeAccountStatus = currentStatus === 'Credit Hold' ? 'Active' : 'Credit Hold';

    const updatedCust: CustomerProfile = {
      ...customer,
      tradeAccount: {
        ...customer.tradeAccount,
        status: newStatus
      }
    };

    onUpdateCustomer(updatedCust);
    triggerSuccess(`Account ${customer.tradeAccount.companyName} set to ${newStatus}`);
  };

  // Record Payment / Ledger Entry
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedCustomer.tradeAccount) return;

    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) return;

    const currentBal = selectedCustomer.tradeAccount.creditBalance;
    const isPayment = paymentType === 'Payment Received';
    const changeAmount = isPayment ? -amt : amt;
    const newBal = Math.max(0, currentBal + changeAmount);

    const newLedgerEntry: TradeLedgerEntry = {
      id: `LEDG-${Date.now()}`,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      companyName: selectedCustomer.tradeAccount.companyName,
      date: new Date().toISOString().split('T')[0],
      type: paymentType,
      amount: changeAmount,
      runningBalance: newBal,
      reference: paymentRef || `PMT-${Math.floor(1000 + Math.random() * 9000)}`,
      description: `${paymentNotes} (${paymentMethod})`,
      status: 'Paid',
      paymentMethod
    };

    const updatedCust: CustomerProfile = {
      ...selectedCustomer,
      tradeAccount: {
        ...selectedCustomer.tradeAccount,
        creditBalance: newBal,
        // Auto lift credit hold if balance cleared
        status: (newBal === 0 && selectedCustomer.tradeAccount.status === 'Credit Hold')
          ? 'Active'
          : selectedCustomer.tradeAccount.status
      },
      tradeLedger: [newLedgerEntry, ...(selectedCustomer.tradeLedger || [])]
    };

    onUpdateCustomer(updatedCust);
    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    setPaymentRef('');
    triggerSuccess(`Recorded $${amt.toFixed(2)} ${paymentType} for ${selectedCustomer.tradeAccount.companyName}`);
  };

  // Send Overdue Reminder Email Simulation
  const handleSendReminder = (customer: CustomerProfile) => {
    if (!customer.tradeAccount) return;
    const updatedCust: CustomerProfile = {
      ...customer,
      tradeAccount: {
        ...customer.tradeAccount,
        lastReminderSent: new Date().toISOString().split('T')[0]
      }
    };
    onUpdateCustomer(updatedCust);
    triggerSuccess(`Overdue payment reminder dispatched to ${customer.email} (${customer.tradeAccount.companyName})`);
  };

  // Save Product Tier Prices
  const handleSaveProductTierPrices = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const resPrice = parseFloat(prodResellerPrice) || undefined;
    const wsPrice = parseFloat(prodWholesalePrice) || undefined;
    const govPrice = parseFloat(prodGovPrice) || undefined;

    const qtyBreak = parseInt(volumeQtyBreak, 10) || 5;
    const discPercent = parseFloat(volumeDiscountPercent) || 5;

    const updatedProd: Product = {
      ...selectedProduct,
      tierPrices: {
        Reseller: resPrice,
        Wholesale: wsPrice,
        Government: govPrice
      },
      volumeDiscounts: [
        { minQty: qtyBreak, discountPercent: discPercent }
      ]
    };

    onUpdateProduct(updatedProd);
    setIsTierModalOpen(false);
    triggerSuccess(`Updated B2B Tier & Volume pricing for ${selectedProduct.name}`);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in" id="b2b-trade-manager-view">
      
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-950 text-emerald-100 border border-emerald-500/50 px-5 py-3 shadow-2xl font-sans text-xs uppercase tracking-wider font-bold">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700/60 pb-5">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase font-bold text-indigo-400 tracking-wider">
            <Building2 className="h-4 w-4" /> B2B Commercial Enterprise Suite
          </div>
          <h2 className="font-sans text-2xl font-black uppercase tracking-tight text-white mt-1">
            Trade Accounts, Credit Terms & Tiered Pricing
          </h2>
          <p className="font-sans text-xs text-slate-400 uppercase tracking-wide mt-1">
            Manage Commercial Credit Limits, Net 30 Terms, Custom Price Tiers, Automatic Credit Holds & Monthly Statements.
          </p>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="border border-slate-700 bg-slate-800 p-4 rounded-xl">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-300 font-bold">
            <DollarSign className="h-3.5 w-3.5 text-indigo-400" /> Accounts Receivable
          </span>
          <div className="mt-1 font-mono text-xl font-bold text-white">
            ${totalReceivables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="font-mono text-[9px] text-slate-300 uppercase tracking-wider mt-1 block">
            Outstanding Trade Credit
          </span>
        </div>

        <div className="border border-slate-700 bg-slate-800 p-4 rounded-xl">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-300 font-bold">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" /> Overdue Balances
          </span>
          <div className="mt-1 font-mono text-xl font-bold text-rose-400">
            ${totalOverdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="font-mono text-[9px] text-slate-300 uppercase tracking-wider mt-1 block">
            {overdueCustomers.length} Overdue Accounts
          </span>
        </div>

        <div className="border border-slate-700 bg-slate-800 p-4 rounded-xl">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-300 font-bold">
            <CreditCard className="h-3.5 w-3.5 text-emerald-400" /> Total Credit Extended
          </span>
          <div className="mt-1 font-mono text-xl font-bold text-emerald-400">
            ${totalCreditLimit.toLocaleString()}
          </div>
          <span className="font-mono text-[9px] text-slate-300 uppercase tracking-wider mt-1 block">
            Approved Credit Lines
          </span>
        </div>

        <div className="border border-slate-700 bg-slate-800 p-4 rounded-xl">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-300 font-bold">
            <Lock className="h-3.5 w-3.5 text-amber-400" /> Credit Holds
          </span>
          <div className="mt-1 font-mono text-xl font-bold text-amber-400">
            {creditHoldCount} <span className="font-sans text-[9px] text-slate-300 uppercase font-bold">accounts</span>
          </div>
          <span className="font-mono text-[9px] text-slate-300 uppercase tracking-wider mt-1 block">
            Blocked from Credit Orders
          </span>
        </div>

        <div className="border border-slate-700 bg-slate-800 p-4 rounded-xl">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-300 font-bold">
            <Clock className="h-3.5 w-3.5 text-blue-400" /> Pending Applications
          </span>
          <div className="mt-1 font-mono text-xl font-bold text-blue-400">
            {pendingCount} <span className="font-sans text-[9px] text-slate-300 uppercase font-bold">requests</span>
          </div>
          <span className="font-mono text-[9px] text-slate-300 uppercase tracking-wider mt-1 block">
            Awaiting Admin Review
          </span>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex border-b border-slate-700/60 font-sans text-xs uppercase tracking-wider">
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`border-b-2 py-3 px-5 font-bold tracking-widest transition-colors flex items-center gap-2 ${
            activeSubTab === 'directory' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="h-4 w-4" /> B2B Trade Directory ({b2bCustomers.length})
        </button>

        <button
          onClick={() => setActiveSubTab('overdue')}
          className={`border-b-2 py-3 px-5 font-bold tracking-widest transition-colors flex items-center gap-2 ${
            activeSubTab === 'overdue' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="h-4 w-4" /> Overdue & Credit Holds ({overdueCustomers.length})
        </button>

        <button
          onClick={() => setActiveSubTab('ledger')}
          className={`border-b-2 py-3 px-5 font-bold tracking-widest transition-colors flex items-center gap-2 ${
            activeSubTab === 'ledger' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="h-4 w-4" /> Statements & Ledger
        </button>

        <button
          onClick={() => setActiveSubTab('pricing')}
          className={`border-b-2 py-3 px-5 font-bold tracking-widest transition-colors flex items-center gap-2 ${
            activeSubTab === 'pricing' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tag className="h-4 w-4" /> Tiered Pricing Matrix
        </button>
      </div>

      {/* TAB 1: B2B TRADE DIRECTORY */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          
          {/* SEARCH & FILTERS */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 border border-slate-200">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[260px] flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Company, ABN, Account #, or Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-none border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 font-sans text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-none border border-slate-700 bg-slate-950 py-2 px-3 font-sans text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Accounts</option>
                <option value="Pending">Pending Applications</option>
                <option value="Credit Hold">Credit Hold</option>
                <option value="Suspended">Suspended</option>
              </select>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="rounded-none border border-slate-700 bg-slate-950 py-2 px-3 font-sans text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="All">All Price Tiers</option>
                <option value="Reseller">Reseller (10% off)</option>
                <option value="Wholesale">Wholesale (15% off)</option>
                <option value="Government">Government (18% off)</option>
                <option value="Retail">Retail</option>
              </select>
            </div>
          </div>

          {/* CUSTOMERS TABLE */}
          <div className="border border-slate-200 overflow-x-auto bg-white">
            <table className="w-full text-left font-sans text-xs">
              <thead className="border-b border-slate-200 bg-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-700">
                <tr>
                  <th className="py-3 px-4">Account / Company</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Price Tier</th>
                  <th className="py-3 px-4">Credit Usage (Used / Limit)</th>
                  <th className="py-3 px-4">Terms</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {b2bCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-sans text-xs uppercase tracking-wider">
                      No B2B trade accounts match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  b2bCustomers.map(cust => {
                    const trade = cust.tradeAccount;
                    const limit = trade?.creditLimit || 0;
                    const balance = trade?.creditBalance || 0;
                    const avail = Math.max(0, limit - balance);
                    const percentUsed = limit > 0 ? Math.min(100, Math.round((balance / limit) * 100)) : 0;
                    const status = trade?.status || 'Pending';
                    const tier = trade?.priceTier || 'Reseller';

                    return (
                      <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 uppercase text-xs">
                            {trade?.companyName || cust.company || cust.name}
                          </div>
                          <div className="font-mono text-[10px] text-indigo-400">
                            {trade?.accountNumber || 'PENDING'} {trade?.abn ? `| ABN: ${trade.abn}` : ''}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-slate-800">{cust.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{cust.email}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] uppercase font-bold border ${
                            tier === 'Government' ? 'bg-purple-950/60 text-purple-300 border-purple-800' :
                            tier === 'Wholesale' ? 'bg-blue-950/60 text-blue-300 border-blue-800' :
                            tier === 'Reseller' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' :
                            'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            <Tag className="h-2.5 w-2.5" /> {tier}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 min-w-[200px]">
                          <div className="flex justify-between font-mono text-[10px] mb-1 font-bold">
                            <span className={balance > 0 ? 'text-rose-400' : 'text-slate-400'}>
                              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-slate-400">${limit.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                percentUsed >= 90 ? 'bg-rose-500' :
                                percentUsed >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                          <div className="font-mono text-[9px] text-slate-400 mt-1">
                            Avail: ${avail.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[10px] font-bold text-slate-300">
                          {trade?.creditTerms || 'Net 30'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 font-mono text-[9px] uppercase font-bold border ${
                            status === 'Active' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700' :
                            status === 'Credit Hold' ? 'bg-rose-950/80 text-rose-300 border-rose-700' :
                            status === 'Pending' ? 'bg-amber-950/80 text-amber-300 border-amber-700' :
                            'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1">
                          <button
                            onClick={() => handleOpenApproveModal(cust)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] uppercase font-bold px-2.5 py-1 transition-colors"
                          >
                            {status === 'Pending' ? 'Approve' : 'Configure'}
                          </button>

                          {trade && (
                            <button
                              onClick={() => handleToggleCreditHold(cust)}
                              className={`font-mono text-[10px] uppercase font-bold px-2.5 py-1 border transition-colors ${
                                status === 'Credit Hold'
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                                  : 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900'
                              }`}
                              title={status === 'Credit Hold' ? 'Lift Credit Hold' : 'Place on Credit Hold'}
                            >
                              {status === 'Credit Hold' ? <Unlock className="h-3 w-3 inline" /> : <Lock className="h-3 w-3 inline" />}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: OVERDUE INVOICES & AUTOMATIC CREDIT HOLDS */}
      {activeSubTab === 'overdue' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 border border-slate-200">
            <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Overdue Debt Safeguards & Credit Holds
            </h3>
            <p className="font-sans text-xs text-slate-400 mt-1">
              Accounts with past-due balances trigger automatic credit holds to prevent new credit orders at POS & Checkout until payments are recorded.
            </p>
          </div>

          <div className="border border-slate-200 overflow-x-auto bg-white">
            <table className="w-full text-left font-sans text-xs">
              <thead className="border-b border-slate-200 bg-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-700">
                <tr>
                  <th className="py-3 px-4">Customer / Company</th>
                  <th className="py-3 px-4">Current Balance</th>
                  <th className="py-3 px-4">Aging Risk</th>
                  <th className="py-3 px-4">Last Reminder Sent</th>
                  <th className="py-3 px-4">Credit Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {overdueCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-sans text-xs uppercase tracking-wider">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      All accounts are in good standing! No overdue commercial debt detected.
                    </td>
                  </tr>
                ) : (
                  overdueCustomers.map(cust => {
                    const trade = cust.tradeAccount;
                    const aging = calculateAgingSummary(cust.tradeLedger || []);

                    return (
                      <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 uppercase text-xs">
                            {trade?.companyName || cust.company || cust.name}
                          </div>
                          <div className="font-mono text-[10px] text-indigo-400">
                            {trade?.accountNumber} &bull; {cust.email}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-rose-400">
                          ${(trade?.creditBalance || 0).toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[10px]">
                          <div className="space-y-0.5">
                            {aging.thirtyDays > 0 && <div className="text-amber-400 font-bold">30 Days: ${aging.thirtyDays.toFixed(2)}</div>}
                            {aging.sixtyDays > 0 && <div className="text-orange-400 font-bold">60 Days: ${aging.sixtyDays.toFixed(2)}</div>}
                            {aging.ninetyDaysPlus > 0 && <div className="text-rose-500 font-bold">90+ Days: ${aging.ninetyDaysPlus.toFixed(2)}</div>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                          {trade?.lastReminderSent || 'Never Sent'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 font-mono text-[9px] uppercase font-bold border ${
                            trade?.status === 'Credit Hold' ? 'bg-rose-950 text-rose-300 border-rose-700' : 'bg-amber-950 text-amber-300 border-amber-700'
                          }`}>
                            {trade?.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleSendReminder(cust)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] uppercase font-bold px-2.5 py-1 transition-colors inline-flex items-center gap-1"
                          >
                            <Send className="h-3 w-3" /> Send Reminder
                          </button>

                          <button
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setIsPaymentModalOpen(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] uppercase font-bold px-2.5 py-1 transition-colors inline-flex items-center gap-1"
                          >
                            <DollarSign className="h-3 w-3" /> Record Payment
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STATEMENTS & ACCOUNT LEDGER */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 border border-slate-200">
            <div className="flex items-center gap-3 min-w-[300px]">
              <label className="font-mono text-xs uppercase font-bold text-slate-700">Select B2B Account:</label>
              <select
                value={selectedCustomer?.id || ''}
                onChange={(e) => {
                  const found = customers.find(c => c.id === e.target.value);
                  setSelectedCustomer(found || null);
                }}
                className="flex-1 rounded-none border border-slate-700 bg-slate-950 py-2 px-3 font-sans text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- Choose Account --</option>
                {b2bCustomers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.tradeAccount?.companyName || c.company || c.name} ({c.tradeAccount?.accountNumber || 'PENDING'})
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomer && selectedCustomer.tradeAccount && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs uppercase font-bold px-3 py-2 transition-colors flex items-center gap-1.5"
                >
                  <DollarSign className="h-4 w-4" /> Record Payment / Credit Adj.
                </button>

                <button
                  onClick={() => printStatementDirect(selectedCustomer, storeSettings)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs uppercase font-bold px-3 py-2 transition-colors flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" /> Print Statement
                </button>

                <button
                  onClick={() => downloadStatementHtmlFile(selectedCustomer, storeSettings)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs uppercase font-bold px-3 py-2 transition-colors flex items-center gap-1.5"
                >
                  <FileText className="h-4 w-4" /> Export HTML
                </button>
              </div>
            )}
          </div>

          {selectedCustomer && selectedCustomer.tradeAccount ? (
            <div className="space-y-6">
              
              {/* Account Summary Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 border border-slate-200">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-slate-300 font-bold block">Company / Account</span>
                  <div className="font-bold text-white text-sm mt-0.5">{selectedCustomer.tradeAccount.companyName}</div>
                  <span className="font-mono text-[10px] text-indigo-400">{selectedCustomer.tradeAccount.accountNumber} &bull; ABN: {selectedCustomer.tradeAccount.abn || 'N/A'}</span>
                </div>

                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-slate-300 font-bold block">Credit Position</span>
                  <div className="font-mono text-sm font-bold text-white mt-0.5">
                    Limit: ${selectedCustomer.tradeAccount.creditLimit.toLocaleString()}
                  </div>
                  <span className="font-mono text-[10px] text-emerald-400">
                    Avail: ${(selectedCustomer.tradeAccount.creditLimit - selectedCustomer.tradeAccount.creditBalance).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-slate-300 font-bold block">Current Owing Balance</span>
                  <div className="font-mono text-lg font-bold text-rose-400 mt-0.5">
                    ${selectedCustomer.tradeAccount.creditBalance.toFixed(2)}
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">Terms: {selectedCustomer.tradeAccount.creditTerms}</span>
                </div>

                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-slate-300 font-bold block">Assigned Price Tier</span>
                  <div className="font-mono text-sm font-bold text-indigo-300 mt-0.5">
                    {selectedCustomer.tradeAccount.priceTier} ({TIER_DISCOUNT_PERCENTAGES[selectedCustomer.tradeAccount.priceTier]}% off base)
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">Status: {selectedCustomer.tradeAccount.status}</span>
                </div>
              </div>

              {/* Ledger Entries Table */}
              <div className="border border-slate-200 bg-white">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                  <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-200">
                    Trade Ledger Activity History
                  </h4>
                  <span className="font-mono text-[10px] text-slate-400">
                    Total Transactions: {(selectedCustomer.tradeLedger || []).length}
                  </span>
                </div>

                <table className="w-full text-left font-sans text-xs">
                  <thead className="border-b border-slate-200 bg-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-700">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Reference #</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Charge (+)</th>
                      <th className="py-3 px-4 text-right">Payment (-)</th>
                      <th className="py-3 px-4 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(!selectedCustomer.tradeLedger || selectedCustomer.tradeLedger.length === 0) ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-mono text-xs">
                          No ledger history recorded for this account.
                        </td>
                      </tr>
                    ) : (
                      selectedCustomer.tradeLedger.map(entry => {
                        const isCharge = entry.amount > 0;
                        return (
                          <tr key={entry.id} className="hover:bg-slate-50 font-mono text-xs">
                            <td className="py-3 px-4 text-slate-300">{entry.date}</td>
                            <td className="py-3 px-4 font-bold text-indigo-300">{entry.reference}</td>
                            <td className="py-3 px-4 font-sans text-slate-200">
                              {entry.description}
                              {entry.paymentMethod && <span className="text-slate-400 text-[10px] block font-mono">{entry.paymentMethod}</span>}
                            </td>
                            <td className={`py-3 px-4 text-right font-bold ${isCharge ? 'text-white' : 'text-slate-600'}`}>
                              {isCharge ? `$${entry.amount.toFixed(2)}` : '-'}
                            </td>
                            <td className={`py-3 px-4 text-right font-bold ${!isCharge ? 'text-emerald-400' : 'text-slate-600'}`}>
                              {!isCharge ? `$${Math.abs(entry.amount).toFixed(2)}` : '-'}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-white">
                              ${entry.runningBalance.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            <div className="border border-slate-200 p-12 text-center bg-slate-50">
              <Building2 className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <h4 className="font-sans text-sm font-bold uppercase tracking-wider text-slate-300">
                No Account Selected
              </h4>
              <p className="font-sans text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Select a commercial customer from the dropdown above to view their statement of account, ledger history, or record a balance payment.
              </p>
            </div>
          )}

        </div>
      )}

      {/* TAB 4: TIERED PRICING MATRIX & VOLUME BREAKS */}
      {activeSubTab === 'pricing' && (
        <div className="space-y-6">
          
          {/* TIER DISCOUNT RULES SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['Retail', 'Reseller', 'Wholesale', 'Government'] as PriceTierType[]).map(tier => {
              const disc = TIER_DISCOUNT_PERCENTAGES[tier];
              return (
                <div key={tier} className="border border-slate-800 bg-slate-900/80 p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs uppercase font-bold text-indigo-400">{tier} Tier</span>
                    <span className="font-mono text-xs font-bold text-emerald-400">{disc}% OFF</span>
                  </div>
                  <p className="font-sans text-[11px] text-slate-300 mt-2">
                    {tier === 'Retail' && 'Standard storefront retail pricing.'}
                    {tier === 'Reseller' && 'IT Resellers & System Integrators (10% discount off base).'}
                    {tier === 'Wholesale' && 'Corporate & Institutional Bulk Buyers (15% discount off base).'}
                    {tier === 'Government' && 'Government, Education & Healthcare (18% discount off base).'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* PER-PRODUCT TIER PRICING CONFIGURATION */}
          <div className="border border-slate-200 bg-white p-5">
            <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-white mb-4">
              Per-Product Tier Override & Volume Discounts
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {products.map(prod => {
                const resPrice = prod.tierPrices?.Reseller || (prod.price * 0.9);
                const wsPrice = prod.tierPrices?.Wholesale || (prod.price * 0.85);
                const govPrice = prod.tierPrices?.Government || (prod.price * 0.82);

                return (
                  <div key={prod.id} className="border border-slate-800 bg-slate-950 p-4 flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-sans text-xs font-bold uppercase text-white">{prod.name}</h4>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">Base Price: ${prod.price.toFixed(2)}</div>

                      <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[10px]">
                        <div className="bg-slate-900 p-2 border border-slate-800">
                          <span className="text-slate-400 block font-bold">Reseller</span>
                          <span className="text-emerald-400 font-bold">${resPrice.toFixed(2)}</span>
                        </div>
                        <div className="bg-slate-900 p-2 border border-slate-800">
                          <span className="text-slate-400 block font-bold">Wholesale</span>
                          <span className="text-blue-400 font-bold">${wsPrice.toFixed(2)}</span>
                        </div>
                        <div className="bg-slate-900 p-2 border border-slate-800">
                          <span className="text-slate-400 block font-bold">Government</span>
                          <span className="text-purple-400 font-bold">${govPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      {prod.volumeDiscounts && prod.volumeDiscounts.length > 0 && (
                        <div className="mt-2 font-mono text-[10px] text-amber-400 font-bold">
                          Volume Break: Buy {prod.volumeDiscounts[0].minQty}+ get {prod.volumeDiscounts[0].discountPercent}% off
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedProduct(prod);
                        setProdResellerPrice(prod.tierPrices?.Reseller ? prod.tierPrices.Reseller.toString() : '');
                        setProdWholesalePrice(prod.tierPrices?.Wholesale ? prod.tierPrices.Wholesale.toString() : '');
                        setProdGovPrice(prod.tierPrices?.Government ? prod.tierPrices.Government.toString() : '');
                        setVolumeQtyBreak(prod.volumeDiscounts?.[0]?.minQty.toString() || '5');
                        setVolumeDiscountPercent(prod.volumeDiscounts?.[0]?.discountPercent?.toString() || '5');
                        setIsTierModalOpen(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] uppercase font-bold px-3 py-1.5 transition-colors shrink-0"
                    >
                      Edit Tiers
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* APPROVE / EDIT TRADE ACCOUNT MODAL */}
      {isApproveModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-fade-in text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-white">
                Configure B2B Trade Account - {selectedCustomer.name}
              </h3>
              <button onClick={() => setIsApproveModalOpen(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveTradeAccount} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-slate-300 mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  required
                  value={formCompanyName}
                  onChange={(e) => setFormCompanyName(e.target.value)}
                  className="w-full rounded-none border border-slate-700 bg-slate-950 p-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-slate-300 mb-1">ABN / Business Tax ID</label>
                  <input
                    type="text"
                    value={formAbn}
                    onChange={(e) => setFormAbn(e.target.value)}
                    placeholder="e.g. 45 123 456 789"
                    className="w-full rounded-none border border-slate-700 bg-slate-950 p-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-slate-300 mb-1">Approved Credit Limit ($)</label>
                  <input
                    type="number"
                    required
                    step="500"
                    value={formCreditLimit}
                    onChange={(e) => setFormCreditLimit(e.target.value)}
                    className="w-full rounded-none border border-slate-700 bg-slate-950 p-2 text-white focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-slate-300 mb-1">Payment Credit Terms</label>
                  <select
                    value={formCreditTerms}
                    onChange={(e) => setFormCreditTerms(e.target.value as CreditTermType)}
                    className="w-full rounded-none border border-slate-700 bg-slate-950 p-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Net 7">Net 7 Days</option>
                    <option value="Net 14">Net 14 Days</option>
                    <option value="Net 30">Net 30 Days (Standard)</option>
                    <option value="Net 60">Net 60 Days</option>
                    <option value="Prepaid / COD">Prepaid / COD</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-slate-300 mb-1">Price Tier</label>
                  <select
                    value={formPriceTier}
                    onChange={(e) => setFormPriceTier(e.target.value as PriceTierType)}
                    className="w-full rounded-none border border-slate-700 bg-slate-950 p-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Reseller">Reseller (10% off)</option>
                    <option value="Wholesale">Wholesale (15% off)</option>
                    <option value="Government">Government (18% off)</option>
                    <option value="Retail">Retail (0% off)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-slate-300 mb-1">Custom Discount (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formCustomDiscount}
                    onChange={(e) => setFormCustomDiscount(e.target.value)}
                    className="w-full rounded-none border border-slate-700 bg-slate-950 p-2 text-white focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-slate-300 mb-1">Account Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TradeAccountStatus)}
                    className="w-full rounded-none border border-slate-700 bg-slate-950 p-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Active">Active (Approved)</option>
                    <option value="Credit Hold">Credit Hold</option>
                    <option value="Pending">Pending Approval</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPoRequired}
                    onChange={(e) => setFormPoRequired(e.target.checked)}
                    className="rounded-none border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                  />
                  <span className="font-mono text-[11px] text-slate-200">Require Purchase Order (PO) Number</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formTaxExempt}
                    onChange={(e) => setFormTaxExempt(e.target.checked)}
                    className="rounded-none border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                  />
                  <span className="font-mono text-[11px] text-slate-200">GST / Tax Exempt</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs uppercase px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs uppercase font-bold px-5 py-2"
                >
                  Save Trade Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && selectedCustomer && selectedCustomer.tradeAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-fade-in text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-white">
                Record Payment - {selectedCustomer.tradeAccount.companyName}
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="bg-slate-950 p-3 border border-slate-800 font-mono text-xs flex justify-between">
              <span className="text-slate-400">Current Balance Owing:</span>
              <span className="text-rose-400 font-bold">${selectedCustomer.tradeAccount.creditBalance.toFixed(2)}</span>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-slate-300 mb-1">Transaction Type</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full rounded-none border border-slate-700 bg-slate-950 p-2 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Payment Received">Payment Received (Reduces Balance)</option>
                  <option value="Credit Adjustment">Credit Adjustment (Increases Balance)</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-slate-300 mb-1">Amount ($)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full rounded-none border border-slate-700 bg-slate-950 p-2 text-white focus:border-indigo-500 focus:outline-none font-mono font-bold text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-none border border-slate-700 bg-slate-950 p-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="EFT Bank Transfer">EFT Direct Deposit</option>
                    <option value="Credit Card">Credit Card clearing</option>
                    <option value="Cheque">Company Cheque</option>
                    <option value="Cash / POS">Cash / POS Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-slate-300 mb-1">Reference / Receipt #</label>
                  <input
                    type="text"
                    placeholder="e.g. EFT-98210"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full rounded-none border border-slate-700 bg-slate-950 p-2 text-white focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-slate-300 mb-1">Notes / Description</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full rounded-none border border-slate-700 bg-slate-950 p-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs uppercase px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs uppercase font-bold px-5 py-2"
                >
                  Post Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT TIER PRICING MODAL */}
      {isTierModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-fade-in text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-white">
                Edit Product Tier Prices - {selectedProduct.name}
              </h3>
              <button onClick={() => setIsTierModalOpen(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="bg-slate-950 p-3 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400">Standard Base Price:</span> <strong className="text-white">${selectedProduct.price.toFixed(2)}</strong>
            </div>

            <form onSubmit={handleSaveProductTierPrices} className="space-y-3 font-sans text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-slate-300 mb-1">Reseller ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={(selectedProduct.price * 0.9).toFixed(2)}
                    value={prodResellerPrice}
                    onChange={(e) => setProdResellerPrice(e.target.value)}
                    className="w-full rounded-none border border-slate-700 bg-slate-950 p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-slate-300 mb-1">Wholesale ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={(selectedProduct.price * 0.85).toFixed(2)}
                    value={prodWholesalePrice}
                    onChange={(e) => setProdWholesalePrice(e.target.value)}
                    className="w-full rounded-none border border-slate-700 bg-slate-950 p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-slate-300 mb-1">Government ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={(selectedProduct.price * 0.82).toFixed(2)}
                    value={prodGovPrice}
                    onChange={(e) => setProdGovPrice(e.target.value)}
                    className="w-full rounded-none border border-slate-700 bg-slate-950 p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="block font-mono text-[10px] uppercase font-bold text-amber-400 mb-2">Volume Break Schedule</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[9px] uppercase text-slate-400 mb-1">Min Quantity Break</label>
                    <input
                      type="number"
                      value={volumeQtyBreak}
                      onChange={(e) => setVolumeQtyBreak(e.target.value)}
                      className="w-full rounded-none border border-slate-700 bg-slate-950 p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] uppercase text-slate-400 mb-1">Discount % at Break</label>
                    <input
                      type="number"
                      step="0.5"
                      value={volumeDiscountPercent}
                      onChange={(e) => setVolumeDiscountPercent(e.target.value)}
                      className="w-full rounded-none border border-slate-700 bg-slate-950 p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTierModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs uppercase px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs uppercase font-bold px-5 py-2"
                >
                  Save Tier Prices
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
