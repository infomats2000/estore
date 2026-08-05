import React, { useState } from 'react';
import { 
  X, Save, RotateCcw, Building2, FileText, Type, Percent, CreditCard, 
  Globe, Megaphone, Sliders, Check, HelpCircle, Download, Upload, Shield,
  Sparkles, Users as UsersIcon, Trash2
} from 'lucide-react';
import { StoreSettings, DEFAULT_STORE_SETTINGS, Coupon, CustomerSegment, UpsellRule, Review, Product, User } from '../types';
import { MarketingModule } from './MarketingModule';
import UserManager from './UserManager';
import MasterDataManager from './masterdata/MasterDataManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'general' | 'invoice' | 'tax_bank' | 'storefront' | 'marketing' | 'users' | 'system' | 'master_data';
  settings: StoreSettings;
  onSaveSettings: (newSettings: StoreSettings) => void;
  // Marketing & Growth Props
  coupons: Coupon[];
  onAddCoupon: (c: Coupon) => void;
  onToggleCoupon: (code: string) => void;
  customerSegments: CustomerSegment[];
  onAddSegment: (s: CustomerSegment) => void;
  onDeleteSegment: (id: string) => void;
  upsellRules: UpsellRule[];
  onAddUpsellRule: (r: UpsellRule) => void;
  onToggleUpsellRule: (id: string) => void;
  onDeleteUpsellRule: (id: string) => void;
  reviews: Review[];
  onDeleteReview: (reviewId: string) => void;
  products: Product[];
  users: User[];
  onAddUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  onHardReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab,
  settings,
  onSaveSettings,
  coupons,
  onAddCoupon,
  onToggleCoupon,
  customerSegments,
  onAddSegment,
  onDeleteSegment,
  upsellRules,
  onAddUpsellRule,
  onToggleUpsellRule,
  onDeleteUpsellRule,
  reviews,
  onDeleteReview,
  products,
  users,
  onAddUser,
  onDeleteUser,
  onHardReset
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'invoice' | 'tax_bank' | 'storefront' | 'marketing' | 'users' | 'system' | 'master_data'>(initialTab || 'general');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (field: keyof StoreSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all store and invoice settings to factory defaults?')) {
      setFormData(DEFAULT_STORE_SETTINGS);
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `store_settings_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          setFormData({ ...DEFAULT_STORE_SETTINGS, ...parsed });
          alert('Settings successfully imported from file!');
        } catch (err) {
          alert('Invalid JSON settings file format.');
        }
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Store Control &amp; Settings System
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure global store branding, invoice typography, layout rules, and banking details
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-slate-200 bg-slate-50/80 px-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-4 w-4" /> Store Identity
          </button>

          <button
            onClick={() => setActiveTab('invoice')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'invoice'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-4 w-4" /> Invoice &amp; Print Typography
          </button>

          <button
            onClick={() => setActiveTab('tax_bank')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'tax_bank'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="h-4 w-4" /> Tax &amp; Banking Details
          </button>

          <button
            onClick={() => setActiveTab('storefront')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'storefront'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="h-4 w-4" /> Website Storefront
          </button>

          <button
            onClick={() => setActiveTab('marketing')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'marketing'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-4 w-4" /> Marketing &amp; Growth
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UsersIcon className="h-4 w-4" /> Staff Accounts
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'system'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="h-4 w-4" /> Backup &amp; Import/Export
          </button>

          <button
            onClick={() => setActiveTab('master_data')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'master_data'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="h-4 w-4 text-blue-600" /> Master Data System
          </button>
        </div>

        {/* Tab Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: General Store Identity */}
          {activeTab === 'general' && (
            <div className="space-y-6 text-left">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Store &amp; Organization Identity</p>
                  <p className="text-blue-700 mt-0.5">
                    These settings are used across the website navigation bar, footer notices, emails, customer profiles, and default invoice headers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Store Display Name</label>
                  <input 
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => handleChange('storeName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Legal Company Name</label>
                  <input 
                    type="text"
                    value={formData.legalName}
                    onChange={(e) => handleChange('legalName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Business Registration ID / ABN</label>
                  <input 
                    type="text"
                    value={formData.businessNumber}
                    onChange={(e) => handleChange('businessNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Contact Email</label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Support Phone</label>
                  <input 
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Website URL</label>
                  <input 
                    type="text"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
                  <input 
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">City, State, ZIP &amp; Country</label>
                  <input 
                    type="text"
                    value={formData.cityStateZip}
                    onChange={(e) => handleChange('cityStateZip', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Invoice & Print Typography */}
          {activeTab === 'invoice' && (
            <div className="space-y-6 text-left">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
                <Type className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Invoice Font Sizes &amp; Layout Spacing</p>
                  <p className="text-amber-800 mt-0.5">
                    Customize typography sizing and page layout density to format printed invoices and PDFs for standard A4 or thermal receipt printers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Body Text Font Size (px)</label>
                  <input 
                    type="number"
                    min="8"
                    max="20"
                    value={formData.invoiceBodyFontSize}
                    onChange={(e) => handleChange('invoiceBodyFontSize', parseInt(e.target.value) || 12)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Default: 12px</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Header/Title Font Size (px)</label>
                  <input 
                    type="number"
                    min="14"
                    max="36"
                    value={formData.invoiceHeadingFontSize}
                    onChange={(e) => handleChange('invoiceHeadingFontSize', parseInt(e.target.value) || 24)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Default: 24px</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Item Row Font Size (px)</label>
                  <input 
                    type="number"
                    min="8"
                    max="18"
                    value={formData.invoiceItemFontSize}
                    onChange={(e) => handleChange('invoiceItemFontSize', parseInt(e.target.value) || 11)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Default: 11px</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Layout Spacing</label>
                  <select
                    value={formData.invoiceCompactness}
                    onChange={(e) => handleChange('invoiceCompactness', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="compact">Compact (Saves paper, fits on 1 page)</option>
                    <option value="normal">Normal Standard (Balanced padding)</option>
                    <option value="spacious">Spacious (Large padding &amp; generous spacing)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Tagline / Subtitle</label>
                  <input 
                    type="text"
                    value={formData.invoiceHeaderSubtitle}
                    onChange={(e) => handleChange('invoiceHeaderSubtitle', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Official Australian Tax Invoice"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Warranty &amp; Guarantee Text</label>
                  <input 
                    type="text"
                    value={formData.invoiceWarrantyText}
                    onChange={(e) => handleChange('invoiceWarrantyText', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Footer Legal Notice</label>
                  <textarea 
                    rows={2}
                    value={formData.invoiceFooterNote}
                    onChange={(e) => handleChange('invoiceFooterNote', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Tax & Banking Details */}
          {activeTab === 'tax_bank' && (
            <div className="space-y-6 text-left">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Tax Rates &amp; EFT Bank Account Configuration</p>
                  <p className="text-emerald-800 mt-0.5">
                    Configure direct bank deposit details (BSB, Account, SWIFT) printed on customer invoices, along with sales tax percentages.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tax Label Name</label>
                  <input 
                    type="text"
                    value={formData.taxName}
                    onChange={(e) => handleChange('taxName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="GST, VAT, Sales Tax"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tax Rate Percentage (%)</label>
                  <input 
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={formData.taxRatePercent}
                    onChange={(e) => handleChange('taxRatePercent', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Currency Symbol</label>
                  <input 
                    type="text"
                    value={formData.currencySymbol}
                    onChange={(e) => handleChange('currencySymbol', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm text-slate-900">Direct Bank Deposit Details</h4>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.showBankOnInvoice}
                      onChange={(e) => handleChange('showBankOnInvoice', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="font-semibold">Print Bank Details on Invoices</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                    <input 
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => handleChange('bankName', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name</label>
                    <input 
                      type="text"
                      value={formData.accountName}
                      onChange={(e) => handleChange('accountName', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">BSB / Branch Code</label>
                    <input 
                      type="text"
                      value={formData.bsb}
                      onChange={(e) => handleChange('bsb', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                    <input 
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => handleChange('accountNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">SWIFT / BIC (Optional)</label>
                    <input 
                      type="text"
                      value={formData.swift}
                      onChange={(e) => handleChange('swift', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Instructions / Notes</label>
                    <input 
                      type="text"
                      value={formData.paymentTermsNote}
                      onChange={(e) => handleChange('paymentTermsNote', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Website Storefront */}
          {activeTab === 'storefront' && (
            <div className="space-y-6 text-left">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-xs text-purple-900 flex items-start gap-3">
                <Megaphone className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Website Storefront &amp; Announcement Bar</p>
                  <p className="text-purple-800 mt-0.5">
                    Control banner messaging and color accents across the website header and pages.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Display Top Announcement Bar</label>
                  <input 
                    type="checkbox"
                    checked={formData.showAnnouncementBar}
                    onChange={(e) => handleChange('showAnnouncementBar', e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Banner Text</label>
                  <input 
                    type="text"
                    value={formData.announcementText}
                    onChange={(e) => handleChange('announcementText', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Free Australia-Wide Express Shipping on Orders Over $500"
                  />
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Why Shop Section Content</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Edit heading, paragraph, and bullet points shown in the storefront "Why Shop" section.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Heading Line 1</label>
                      <input
                        type="text"
                        value={formData.whyShopHeadingTop}
                        onChange={(e) => handleChange('whyShopHeadingTop', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Heading Highlight</label>
                      <input
                        type="text"
                        value={formData.whyShopHeadingHighlight}
                        onChange={(e) => handleChange('whyShopHeadingHighlight', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Heading Line 2</label>
                      <input
                        type="text"
                        value={formData.whyShopHeadingBottom}
                        onChange={(e) => handleChange('whyShopHeadingBottom', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Description Paragraph</label>
                      <textarea
                        value={formData.whyShopBodyText}
                        onChange={(e) => handleChange('whyShopBodyText', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Bullet Points (one per line)</label>
                      <textarea
                        value={(formData.whyShopBulletPoints || []).join('\n')}
                        onChange={(e) =>
                          handleChange(
                            'whyShopBulletPoints',
                            e.target.value
                              .split('\n')
                              .map((line) => line.trim())
                              .filter((line) => line.length > 0)
                          )
                        }
                        rows={8}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder={'Professional 50-Point Inspection\n12 Month Express Warranty'}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary Theme Color Hex</label>
                    <div className="flex gap-2">
                      <input 
                        type="color"
                        value={formData.themePrimaryColor}
                        onChange={(e) => handleChange('themePrimaryColor', e.target.value)}
                        className="h-10 w-12 rounded border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input 
                        type="text"
                        value={formData.themePrimaryColor}
                        onChange={(e) => handleChange('themePrimaryColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Accent Badge Color Hex</label>
                    <div className="flex gap-2">
                      <input 
                        type="color"
                        value={formData.themeAccentColor}
                        onChange={(e) => handleChange('themeAccentColor', e.target.value)}
                        className="h-10 w-12 rounded border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input 
                        type="text"
                        value={formData.themeAccentColor}
                        onChange={(e) => handleChange('themeAccentColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Marketing & Growth */}
          {activeTab === 'marketing' && (
            <MarketingModule
              coupons={coupons}
              onAddCoupon={onAddCoupon}
              onToggleCoupon={onToggleCoupon}
              customerSegments={customerSegments}
              onAddSegment={onAddSegment}
              onDeleteSegment={onDeleteSegment}
              upsellRules={upsellRules}
              onAddUpsellRule={onAddUpsellRule}
              onToggleUpsellRule={onToggleUpsellRule}
              onDeleteUpsellRule={onDeleteUpsellRule}
              reviews={reviews}
              onDeleteReview={onDeleteReview}
              products={products}
            />
          )}

          {/* TAB 6: Staff Accounts */}
          {activeTab === 'users' && (
            <UserManager
              users={users}
              onAddUser={onAddUser}
              onDeleteUser={onDeleteUser}
            />
          )}

          {/* TAB 7: Backup & System */}
          {activeTab === 'system' && (
            <div className="space-y-6 text-left">
              <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 text-xs text-slate-800 flex items-start gap-3">
                <Shield className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Settings Management &amp; JSON Migration</p>
                  <p className="text-slate-600 mt-0.5">
                    Export your store configuration to a JSON file or restore settings from a backup file anytime.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                  <h5 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Download className="h-4 w-4 text-blue-600" /> Export Settings Backup
                  </h5>
                  <p className="text-xs text-slate-600">
                    Download a complete copy of all store contact details, tax rules, typography preferences, and bank information.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="h-4 w-4" /> Download Settings (.json)
                  </button>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                  <h5 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Upload className="h-4 w-4 text-blue-600" /> Import Settings Backup
                  </h5>
                  <p className="text-xs text-slate-600">
                    Upload a JSON configuration file to overwrite store settings immediately.
                  </p>
                  <label className="w-full py-2 px-4 bg-white border border-slate-300 hover:border-blue-500 text-slate-800 rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    <Upload className="h-4 w-4 text-blue-600" />
                    <span>Upload JSON Settings</span>
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                <div>
                  <h5 className="font-bold text-xs text-slate-900">Reset Factory Defaults</h5>
                  <p className="text-[11px] text-slate-500">Restore default Australian store details and font sizes</p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="py-2 px-4 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" /> Reset Factory Defaults
                </button>
              </div>

              <div className="border-t border-rose-100 pt-4 bg-rose-50/50 -mx-6 px-6 pb-6 mt-4 flex justify-between items-center rounded-b-xl">
                <div>
                  <h5 className="font-bold text-xs text-rose-900">Hard Data Wipe (Danger Zone)</h5>
                  <p className="text-[11px] text-rose-600">Permanently delete ALL products, orders, customers, and financial data. This cannot be undone.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('CRITICAL: Delete ALL store data, including every product, order, and customer? This will perform a complete factory reset.')) {
                      onHardReset();
                    }
                  }}
                  className="py-2 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-rose-500/20 active:scale-95"
                >
                  <Trash2 className="h-4 w-4" /> Wipe All Store Data
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: Master Data System */}
          {activeTab === 'master_data' && (
            <div className="space-y-4">
              <MasterDataManager />
            </div>
          )}

        </form>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            {savedSuccess ? (
              <span className="text-emerald-600 flex items-center gap-1 font-bold animate-pulse">
                <Check className="h-4 w-4" /> Settings updated successfully!
              </span>
            ) : (
              <span>Changes take effect across website and invoices immediately</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all transform active:scale-95"
            >
              <Save className="h-4 w-4" /> Save Store Settings
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
