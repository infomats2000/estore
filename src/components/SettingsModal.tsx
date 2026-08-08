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
import { CustomDomainSettings } from './CustomDomainSettings';
import { TenantBillingSettings } from './TenantBillingSettings';
import { ContextualHelp } from './ContextualHelp';
import { HARDWARE_CATEGORY_CATALOG } from '../constants/categoryImages';
import { useTenantFeatures } from '../context/TenantFeatureContext';
import { useAdminInteractions } from '../context/AdminInteractionContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'general' | 'invoice' | 'tax_bank' | 'storefront' | 'marketing' | 'users' | 'system' | 'master_data' | 'domain' | 'billing';
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
  onHardReset: () => Promise<void>;
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
  const interactions = useAdminInteractions();
  if (!isOpen) return null;

  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'invoice' | 'tax_bank' | 'storefront' | 'marketing' | 'users' | 'system' | 'master_data' | 'domain' | 'billing'>(initialTab || 'general');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [destructiveAction, setDestructiveAction] = useState<'defaults' | 'wipe' | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDestructiveActionRunning, setIsDestructiveActionRunning] = useState(false);
  const [destructiveActionError, setDestructiveActionError] = useState('');
  const [uploadingNavigationCategory, setUploadingNavigationCategory] = useState('');
  const [navigationImageError, setNavigationImageError] = useState('');
  const [pendingNavigationImagePaths, setPendingNavigationImagePaths] = useState<string[]>([]);
  const { hasFeature, loading: featuresLoading } = useTenantFeatures();
  const canAccessStorefront = !featuresLoading && hasFeature('storefront');
  const canAccessCustomDomain = canAccessStorefront && hasFeature('custom_domain');

  React.useEffect(() => {
    if (!featuresLoading && activeTab === 'storefront' && !canAccessStorefront) setActiveTab('general');
    if (!featuresLoading && activeTab === 'domain' && !canAccessCustomDomain) setActiveTab('general');
  }, [activeTab, canAccessCustomDomain, canAccessStorefront, featuresLoading]);

  const storefrontVisibilityControls = [
    ['showAnnouncementBar', 'Announcement bar'], ['showStorefrontHeader', 'Main header and branding'],
    ['showStorefrontSearch', 'Product search'], ['showStorefrontAccount', 'Customer account link'],
    ['showStorefrontCart', 'Shopping cart'], ['showStorefrontCompare', 'Compare products'],
    ['showStorefrontPcBuilder', 'Custom PC builder link'], ['showStorefrontTracking', 'Track shipment link'],
    ['showStorefrontAdminLogin', 'Staff/admin login'], ['showStorefrontCategoryNav', 'Top category navigation'],
    ['showHeroBanner', 'Hero banner'], ['showFlashSaleBanner', 'Flash sale banner'],
    ['showCategorySection', 'Quick Navigation images'], ['showCatalogSection', 'Product catalogue'],
    ['showCatalogToolbar', 'Catalogue sort and product count'], ['showCatalogFilters', 'Quick Specs filters'],
    ['showBrandSection', 'Brands section'], ['showRecentlyViewedSection', 'Recently viewed products'],
    ['showTrustSection', 'Shopping assurance section'], ['showWhyShopSection', 'Why Shop section'],
    ['showNewsletterSection', 'Newsletter section'], ['showServiceHighlights', 'Navigation service highlights'],
    ['showStorefrontFooter', 'Storefront footer'], ['showFooterBrandColumn', 'Footer store details'],
    ['showFooterCategoriesColumn', 'Footer categories'], ['showFooterCustomerCareColumn', 'Footer customer care'],
    ['showFooterLegalBar', 'Footer legal/payment bar'], ['showFooterPolicyLinks', 'Footer policy links'],
  ] as const satisfies ReadonlyArray<readonly [keyof StoreSettings, string]>;

  const setAllStorefrontVisibility = (visible: boolean) => {
    setFormData((current) => storefrontVisibilityControls.reduce((next, [field]) => ({ ...next, [field]: visible }), current));
  };



  const handleChange = (field: keyof StoreSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const navigationCategories = React.useMemo(() => Array.from(new Set([
    ...Object.keys(HARDWARE_CATEGORY_CATALOG),
    ...products.map((product) => product.category).filter(Boolean),
    ...(formData.categoryNavigationImages || []).map((item) => item.category),
  ])).sort((a, b) => a.localeCompare(b)), [products, formData.categoryNavigationImages]);

  const authenticatedJsonHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
  });

  const readImageAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose a PNG, JPG or WebP image.'));
    if (file.size > 10 * 1024 * 1024) return reject(new Error('The image must be 10 MB or smaller.'));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('The selected image could not be read.'));
    reader.readAsDataURL(file);
  });

  const deleteStoredNavigationImage = async (imageUrl: string) => {
    if (!imageUrl.startsWith('/uploads/')) return;
    const response = await fetch('/api/uploads/delete', {
      method: 'POST',
      headers: authenticatedJsonHeaders(),
      body: JSON.stringify({ path: imageUrl }),
    });
    if (!response.ok) throw new Error('The previous image could not be removed from storage.');
  };

  const handleNavigationImageUpload = async (category: string, file?: File) => {
    if (!file) return;
    setUploadingNavigationCategory(category);
    setNavigationImageError('');
    try {
      const fileData = await readImageAsDataUrl(file);
      const response = await fetch('/api/uploads', {
        method: 'POST',
        headers: authenticatedJsonHeaders(),
        body: JSON.stringify({ file: fileData, folder: 'categories' }),
      });
      const result = await response.json().catch(() => ({})) as { path?: string; error?: string };
      if (!response.ok || !result.path) throw new Error(result.error || 'The image could not be uploaded.');

      const existing = (formData.categoryNavigationImages || []).find((item) => item.category === category);
      if (existing?.imageUrl && pendingNavigationImagePaths.includes(existing.imageUrl)) {
        await deleteStoredNavigationImage(existing.imageUrl);
        setPendingNavigationImagePaths((paths) => paths.filter((path) => path !== existing.imageUrl));
      }
      setPendingNavigationImagePaths((paths) => [...paths, result.path!]);
      handleChange('categoryNavigationImages', [
        ...(formData.categoryNavigationImages || []).filter((item) => item.category !== category),
        { category, imageUrl: result.path, altText: `${category} category` },
      ]);
    } catch (error) {
      setNavigationImageError(error instanceof Error ? error.message : 'The image could not be uploaded.');
    } finally {
      setUploadingNavigationCategory('');
    }
  };

  const removeNavigationImage = async (category: string) => {
    const existing = (formData.categoryNavigationImages || []).find((item) => item.category === category);
    if (!existing) return;
    setUploadingNavigationCategory(category);
    setNavigationImageError('');
    try {
      if (pendingNavigationImagePaths.includes(existing.imageUrl)) {
        await deleteStoredNavigationImage(existing.imageUrl);
        setPendingNavigationImagePaths((paths) => paths.filter((path) => path !== existing.imageUrl));
      }
      handleChange('categoryNavigationImages', (formData.categoryNavigationImages || []).filter((item) => item.category !== category));
    } catch (error) {
      setNavigationImageError(error instanceof Error ? error.message : 'The image could not be removed.');
    } finally {
      setUploadingNavigationCategory('');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const retainedPaths = new Set((formData.categoryNavigationImages || []).map((item) => item.imageUrl));
    const replacedPaths = (settings.categoryNavigationImages || []).map((item) => item.imageUrl).filter((imageUrl) => !retainedPaths.has(imageUrl));
    onSaveSettings(formData);
    setPendingNavigationImagePaths([]);
    void Promise.allSettled(replacedPaths.map((imageUrl) => deleteStoredNavigationImage(imageUrl)));
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const closeWithoutSaving = () => {
    void Promise.allSettled(pendingNavigationImagePaths.map((imageUrl) => deleteStoredNavigationImage(imageUrl)));
    setPendingNavigationImagePaths([]);
    onClose();
  };

  const handleResetDefaults = () => {
    setConfirmationText('');
    setDestructiveActionError('');
    setDestructiveAction('defaults');
  };

  const completeDestructiveAction = async () => {
    if (confirmationText !== 'confirm' || !destructiveAction) return;
    setIsDestructiveActionRunning(true);
    setDestructiveActionError('');
    try {
      if (destructiveAction === 'defaults') {
        await Promise.allSettled((formData.categoryNavigationImages || []).map((item) => deleteStoredNavigationImage(item.imageUrl)));
        setPendingNavigationImagePaths([]);
        setFormData(DEFAULT_STORE_SETTINGS);
        onSaveSettings(DEFAULT_STORE_SETTINGS);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 1500);
        setDestructiveAction(null);
        setConfirmationText('');
      } else {
        await onHardReset();
      }
    } catch (error) {
      setDestructiveActionError(error instanceof Error ? error.message : 'The operation could not be completed.');
    } finally {
      setIsDestructiveActionRunning(false);
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
          void interactions.notify({ title: 'Settings Imported', message: 'Settings were successfully imported from the selected file. Review and save them when ready.' });
        } catch (err) {
          void interactions.notify({ title: 'Import Failed', message: 'The selected file is not a valid settings JSON file.' });
        }
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="settings-dialog bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
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
            onClick={closeWithoutSaving}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ContextualHelp className="mx-6 mt-4" compact line1="Configure tenant store operations, documents, billing and the separately scoped public storefront design." line2="Choose a settings tab, review its options, then save; storefront design controls do not restyle the tenant admin panel." />

        <nav aria-label="Settings breadcrumb" className="mx-6 mt-3 flex items-center gap-1 text-[10px] font-semibold text-slate-400">
          <span>Admin</span><span aria-hidden="true">›</span><span>Settings</span><span aria-hidden="true">›</span><span className="text-slate-600">{{ general: 'General', invoice: 'Invoices', tax_bank: 'Tax & Banking', storefront: 'Storefront', marketing: 'Marketing', users: 'Users', system: 'System', master_data: 'Master Data', domain: 'Custom Domain', billing: 'Billing' }[activeTab]}</span>
        </nav>

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

          {canAccessStorefront && <button
            onClick={() => setActiveTab('storefront')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'storefront'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="h-4 w-4" /> Website Storefront
          </button>}

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
            <Sliders className="h-4 w-4 text-blue-600" /> Store Lookup Tables &amp; Setup
          </button>

          {canAccessCustomDomain && <button
            onClick={() => setActiveTab('domain')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'domain'
                ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="h-4 w-4 text-indigo-600" /> Custom Domain (TLD)
          </button>}

          <button
            onClick={() => setActiveTab('billing')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'billing'
                ? 'border-purple-600 text-purple-600 bg-white shadow-sm font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="h-4 w-4 text-purple-600" /> Subscription &amp; Billing
          </button>
        </div>


        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

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
          {canAccessStorefront && activeTab === 'storefront' && (
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
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Storefront Element Visibility</h4>
                      <p className="mt-0.5 text-[11px] text-slate-600">Show or hide every major customer-facing element. Hidden content keeps its saved text and design settings.</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setAllStorefrontVisibility(true)} className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-[10px] font-bold text-emerald-700 hover:border-emerald-500">Show all</button>
                      <button type="button" onClick={() => setAllStorefrontVisibility(false)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-700 hover:border-slate-500">Hide all</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {storefrontVisibilityControls.map(([field, label]) => (
                      <label key={field} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700">
                        <span>{label}</span>
                        <input type="checkbox" checked={Boolean(formData[field])} onChange={(event) => handleChange(field, event.target.checked)} className="h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600" />
                      </label>
                    ))}
                  </div>
                </div>

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
                    <h4 className="text-sm font-bold text-slate-900">Storefront Section Order</h4>
                    <p className="mt-0.5 text-[11px] text-slate-500">Move homepage sections up or down. Hidden sections retain their position for when they are enabled again.</p>
                  </div>
                  <div className="space-y-2">
                    {(formData.storefrontSectionOrder || ['hero', 'flashSale', 'categories', 'catalog', 'brands', 'recentlyViewed', 'whyShop', 'newsletter']).map((sectionId, index, order) => {
                      const labels: Record<string, string> = {
                        hero: 'Hero Banner', flashSale: 'Flash Sale Banner', categories: 'Shop by Category', catalog: 'Product Catalogue',
                        brands: 'Brand Strip', recentlyViewed: 'Recently Viewed', whyShop: 'Why Shop', newsletter: 'Newsletter'
                      };
                      const moveSection = (direction: -1 | 1) => {
                        const targetIndex = index + direction;
                        if (targetIndex < 0 || targetIndex >= order.length) return;
                        const nextOrder = [...order];
                        [nextOrder[index], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[index]];
                        handleChange('storefrontSectionOrder', nextOrder);
                      };
                      return (
                        <div key={sectionId} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-500">{index + 1}</span>
                            <span className="truncate text-xs font-bold text-slate-800">{labels[sectionId] || sectionId}</span>
                          </div>
                          <div className="flex gap-1">
                            <button type="button" disabled={index === 0} onClick={() => moveSection(-1)} className="rounded border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30">Up</button>
                            <button type="button" disabled={index === order.length - 1} onClick={() => moveSection(1)} className="rounded border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30">Down</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div><h4 className="text-sm font-bold text-slate-900">Shopping Assurance</h4><p className="mt-0.5 text-[11px] text-slate-500">Communicate delivery, returns, payment security and support before customers reach checkout.</p></div>
                    <input type="checkbox" checked={formData.showTrustSection} onChange={(e) => handleChange('showTrustSection', e.target.checked)} className="h-5 w-5" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div><label className="mb-1 block text-xs font-bold text-slate-700">Eyebrow</label><input value={formData.trustSectionEyebrow} onChange={(e) => handleChange('trustSectionEyebrow', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-700">Section Heading</label><input value={formData.trustSectionTitle} onChange={(e) => handleChange('trustSectionTitle', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
                    {([['trustDeliveryTitle', 'trustDeliveryText', 'Delivery'], ['trustReturnsTitle', 'trustReturnsText', 'Returns & Warranty'], ['trustPaymentTitle', 'trustPaymentText', 'Payment Security'], ['trustSupportTitle', 'trustSupportText', 'Customer Support']] as const).map(([titleField, textField, label]) => (
                      <div key={titleField} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <label className="block text-xs font-bold text-slate-700">{label}</label>
                        <input value={formData[titleField]} onChange={(e) => handleChange(titleField, e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Title" />
                        <textarea value={formData[textField]} onChange={(e) => handleChange(textField, e.target.value)} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Customer-facing explanation" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div><h4 className="text-sm font-bold text-slate-900">Hero Banner</h4><p className="text-[11px] text-slate-500">Main promotional banner shown on the public storefront.</p></div>
                    <input type="checkbox" checked={formData.showHeroBanner} onChange={(e) => handleChange('showHeroBanner', e.target.checked)} className="h-5 w-5" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Eyebrow</label><input value={formData.heroEyebrow} onChange={(e) => handleChange('heroEyebrow', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Highlighted Text</label><input value={formData.heroHighlight} onChange={(e) => handleChange('heroHighlight', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1">Main Heading</label><input value={formData.heroTitle} onChange={(e) => handleChange('heroTitle', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1">Description</label><textarea value={formData.heroDescription} onChange={(e) => handleChange('heroDescription', e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1">Hero Image URL</label><input value={formData.heroImageUrl} onChange={(e) => handleChange('heroImageUrl', e.target.value)} placeholder="/images/banner.png or https://..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Primary Link Text</label><input value={formData.heroPrimaryButtonText} onChange={(e) => handleChange('heroPrimaryButtonText', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Primary Link URL</label><input value={formData.heroPrimaryButtonUrl} onChange={(e) => handleChange('heroPrimaryButtonUrl', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Secondary Link Text</label><input value={formData.heroSecondaryButtonText} onChange={(e) => handleChange('heroSecondaryButtonText', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Secondary Link URL</label><input value={formData.heroSecondaryButtonUrl} onChange={(e) => handleChange('heroSecondaryButtonUrl', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <div className="flex items-center justify-between"><div><h4 className="text-sm font-bold text-slate-900">Flash Sale Banner</h4><p className="text-[11px] text-slate-500">Promotion displayed above the product catalogue.</p></div><input type="checkbox" checked={formData.showFlashSaleBanner} onChange={(e) => handleChange('showFlashSaleBanner', e.target.checked)} className="h-5 w-5" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Label</label><input value={formData.flashSaleTitle} onChange={(e) => handleChange('flashSaleTitle', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Offer Text</label><input value={formData.flashSaleText} onChange={(e) => handleChange('flashSaleText', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Coupon Code</label><input value={formData.flashSaleCouponCode} onChange={(e) => handleChange('flashSaleCouponCode', e.target.value.toUpperCase())} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" /></div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <div className="flex items-center justify-between"><div><h4 className="text-sm font-bold text-slate-900">Category Navigation</h4><p className="text-[11px] text-slate-500">Heading above the visual category cards.</p></div><input type="checkbox" checked={formData.showCategorySection} onChange={(e) => handleChange('showCategorySection', e.target.checked)} className="h-5 w-5" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Eyebrow</label><input value={formData.categorySectionEyebrow} onChange={(e) => handleChange('categorySectionEyebrow', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Heading</label><input value={formData.categorySectionTitle} onChange={(e) => handleChange('categorySectionTitle', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1">Description</label><input value={formData.categorySectionDescription} onChange={(e) => handleChange('categorySectionDescription', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-bold text-slate-700">Quick Navigation Image Scrolling</label>
                      <select value={formData.categoryNavigationScrollStyle} onChange={(e) => handleChange('categoryNavigationScrollStyle', e.target.value as StoreSettings['categoryNavigationScrollStyle'])} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                        <option value="manual">Manual — arrows, touch or trackpad</option>
                        <option value="auto-left">Automatic — images move right to left</option>
                      </select>
                      <p className="mt-1 text-[11px] text-slate-500">Automatic movement pauses while a visitor hovers, focuses, or touches the image bar.</p>
                    </div>
                    <div className="md:col-span-2">
                      <div className="mb-2 flex items-end justify-between gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700">Custom Quick Navigation Images</label>
                          <p className="mt-1 text-[11px] text-slate-500">Replace any category picture. Images are optimised to WebP and remain linked to the selected category.</p>
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold text-slate-500">PNG, JPG or WebP · max 10 MB</span>
                      </div>
                      {navigationImageError && (
                        <div role="alert" className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{navigationImageError}</div>
                      )}
                      <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                        {navigationCategories.map((category) => {
                          const customImage = (formData.categoryNavigationImages || []).find((item) => item.category === category);
                          const fallbackImage = HARDWARE_CATEGORY_CATALOG[category]?.image;
                          const busy = uploadingNavigationCategory === category;
                          return (
                            <div key={category} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2">
                              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                                {(customImage?.imageUrl || fallbackImage) ? <img src={customImage?.imageUrl || fallbackImage} alt="" className="h-full w-full object-cover" /> : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-semibold text-slate-900">{category}</div>
                                <div className="text-[10px] text-slate-500">{customImage ? 'Custom tenant image' : 'Default category image'}</div>
                              </div>
                              <label className={`cursor-pointer rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-semibold text-blue-700 hover:border-blue-400 ${busy ? 'pointer-events-none opacity-50' : ''}`}>
                                <Upload className="mr-1 inline h-3.5 w-3.5" />{busy ? 'Working…' : customImage ? 'Replace' : 'Upload'}
                                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy} onChange={(event) => { void handleNavigationImageUpload(category, event.target.files?.[0]); event.currentTarget.value = ''; }} />
                              </label>
                              {customImage && (
                                <button type="button" disabled={busy} onClick={() => void removeNavigationImage(category)} className="rounded-lg border border-rose-200 bg-white p-2 text-rose-600 hover:border-rose-400 disabled:opacity-50" aria-label={`Restore default image for ${category}`} title="Remove custom image and restore default">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Catalogue Eyebrow</label><input value={formData.catalogSectionEyebrow} onChange={(e) => handleChange('catalogSectionEyebrow', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Catalogue Heading</label><input value={formData.catalogSectionTitle} onChange={(e) => handleChange('catalogSectionTitle', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-2">Catalogue Style</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                        {([
                          { id: 'classic', label: 'Classic Grid', description: 'Balanced retail cards' },
                          { id: 'compact', label: 'Compact Inventory', description: 'More products per row' },
                          { id: 'minimal', label: 'Minimal Showcase', description: 'Clean and spacious' },
                          { id: 'list', label: 'Horizontal List', description: 'Wide product rows' }
                        ] as const).map((style) => (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => handleChange('catalogStyle', style.id)}
                            className={`rounded-lg border p-3 text-left transition-colors ${
                              formData.catalogStyle === style.id
                                ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                : 'border-slate-200 bg-white hover:border-slate-400'
                            }`}
                          >
                            <span className="block text-xs font-bold text-slate-900">{style.label}</span>
                            <span className="mt-1 block text-[10px] text-slate-500">{style.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-2">Quick Specs &amp; Attribute Filters Position</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {([
                          { id: 'top', label: 'Above Catalogue', description: 'Display filters as a horizontal row above products' },
                          { id: 'left', label: 'Left Sidebar', description: 'Display filters vertically beside the product catalogue' }
                        ] as const).map((position) => (
                          <button
                            key={position.id}
                            type="button"
                            onClick={() => handleChange('catalogFilterPosition', position.id)}
                            className={`rounded-lg border p-3 text-left transition-colors ${
                              formData.catalogFilterPosition === position.id
                                ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                : 'border-slate-200 bg-white hover:border-slate-400'
                            }`}
                          >
                            <span className="block text-xs font-bold text-slate-900">{position.label}</span>
                            <span className="mt-1 block text-[10px] text-slate-500">{position.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div><h4 className="text-sm font-bold text-slate-900">Why Shop Section Content</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Edit heading, paragraph, and bullet points shown in the storefront "Why Shop" section.
                    </p></div>
                    <input type="checkbox" checked={formData.showWhyShopSection} onChange={(e) => handleChange('showWhyShopSection', e.target.checked)} className="h-5 w-5" />
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

                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <div className="flex items-center justify-between"><div><h4 className="text-sm font-bold text-slate-900">Newsletter Section</h4><p className="text-[11px] text-slate-500">Subscription call-to-action above the footer.</p></div><input type="checkbox" checked={formData.showNewsletterSection} onChange={(e) => handleChange('showNewsletterSection', e.target.checked)} className="h-5 w-5" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Eyebrow</label><input value={formData.newsletterEyebrow} onChange={(e) => handleChange('newsletterEyebrow', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Heading</label><input value={formData.newsletterTitle} onChange={(e) => handleChange('newsletterTitle', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1">Description</label><textarea value={formData.newsletterDescription} onChange={(e) => handleChange('newsletterDescription', e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Button Text</label><input value={formData.newsletterButtonText} onChange={(e) => handleChange('newsletterButtonText', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <div className="flex items-center justify-between"><div><h4 className="text-sm font-bold text-slate-900">Navigation Service Highlights</h4><p className="text-[11px] text-slate-500">Shipping and support messages beside the category navigation.</p></div><input type="checkbox" checked={formData.showServiceHighlights} onChange={(e) => handleChange('showServiceHighlights', e.target.checked)} className="h-5 w-5" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Shipping Title</label><input value={formData.shippingHighlightTitle} onChange={(e) => handleChange('shippingHighlightTitle', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Shipping Description</label><input value={formData.shippingHighlightText} onChange={(e) => handleChange('shippingHighlightText', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Support Title</label><input value={formData.supportHighlightTitle} onChange={(e) => handleChange('supportHighlightTitle', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Support Description</label><input value={formData.supportHighlightText} onChange={(e) => handleChange('supportHighlightText', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <div><h4 className="text-sm font-bold text-slate-900">Brands &amp; Browsing History</h4><p className="mt-0.5 text-[11px] text-slate-500">Customise supporting merchandising sections beneath the catalogue.</p></div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div><label className="mb-1 block text-xs font-bold text-slate-700">Brands Heading</label><input value={formData.brandSectionTitle} onChange={(e) => handleChange('brandSectionTitle', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-700">Brand Names</label><input value={(formData.storefrontBrands || []).join(', ')} onChange={(e) => handleChange('storefrontBrands', e.target.value.split(',').map((item) => item.trim()).filter(Boolean))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Dell, HP, Lenovo" /></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-700">Recently Viewed Eyebrow</label><input value={formData.recentlyViewedEyebrow} onChange={(e) => handleChange('recentlyViewedEyebrow', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-700">Recently Viewed Heading</label><input value={formData.recentlyViewedTitle} onChange={(e) => handleChange('recentlyViewedTitle', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <div className="flex items-center justify-between"><div><h4 className="text-sm font-bold text-slate-900">Storefront Footer</h4><p className="text-[11px] text-slate-500">Footer headings, service statements and legal/payment labels.</p></div><input type="checkbox" checked={formData.showStorefrontFooter} onChange={(e) => handleChange('showStorefrontFooter', e.target.checked)} className="h-5 w-5" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Categories Heading</label><input value={formData.footerCategoriesHeading} onChange={(e) => handleChange('footerCategoriesHeading', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Customer Care Heading</label><input value={formData.footerCustomerCareHeading} onChange={(e) => handleChange('footerCustomerCareHeading', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Warranty Text</label><input value={formData.footerWarrantyText} onChange={(e) => handleChange('footerWarrantyText', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Returns Text</label><input value={formData.footerReturnsText} onChange={(e) => handleChange('footerReturnsText', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1">Shipping Text</label><input value={formData.footerShippingText} onChange={(e) => handleChange('footerShippingText', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1">Copyright Text</label><input value={formData.footerCopyrightText} onChange={(e) => handleChange('footerCopyrightText', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Ownership Text</label><input value={formData.footerOwnershipText} onChange={(e) => handleChange('footerOwnershipText', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Payments Text</label><input value={formData.footerPaymentsText} onChange={(e) => handleChange('footerPaymentsText', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Privacy Policy URL</label><input value={formData.privacyPolicyUrl} onChange={(e) => handleChange('privacyPolicyUrl', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Terms &amp; Conditions URL</label><input value={formData.termsUrl} onChange={(e) => handleChange('termsUrl', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Returns Policy URL</label><input value={formData.returnsPolicyUrl} onChange={(e) => handleChange('returnsPolicyUrl', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Shipping Policy URL</label><input value={formData.shippingPolicyUrl} onChange={(e) => handleChange('shippingPolicyUrl', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <div><h4 className="text-sm font-bold text-slate-900">Storefront-Only Design Theme</h4><p className="mt-0.5 text-[11px] text-slate-500">These colours, fonts and corners apply only to the public storefront. They never alter the tenant admin dashboard.</p></div>
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {([
                      { name: 'Professional', colors: { themePrimaryColor: '#0f172a', themeAccentColor: '#2563eb', storefrontBackgroundColor: '#f8fafc', storefrontSurfaceColor: '#ffffff', storefrontTextColor: '#0f172a', storefrontMutedTextColor: '#64748b', storefrontHeaderColor: '#111827', storefrontHeaderTextColor: '#ffffff', storefrontFooterColor: '#111827', storefrontFooterTextColor: '#ffffff', storefrontBorderColor: '#cbd5e1', storefrontButtonTextColor: '#ffffff' } },
                      { name: 'Warm Retail', colors: { themePrimaryColor: '#7c2d12', themeAccentColor: '#ea580c', storefrontBackgroundColor: '#fff7ed', storefrontSurfaceColor: '#ffffff', storefrontTextColor: '#431407', storefrontMutedTextColor: '#9a3412', storefrontHeaderColor: '#431407', storefrontHeaderTextColor: '#fff7ed', storefrontFooterColor: '#431407', storefrontFooterTextColor: '#fff7ed', storefrontBorderColor: '#fed7aa', storefrontButtonTextColor: '#ffffff' } },
                      { name: 'Eco Green', colors: { themePrimaryColor: '#14532d', themeAccentColor: '#16a34a', storefrontBackgroundColor: '#f0fdf4', storefrontSurfaceColor: '#ffffff', storefrontTextColor: '#052e16', storefrontMutedTextColor: '#3f6212', storefrontHeaderColor: '#14532d', storefrontHeaderTextColor: '#ffffff', storefrontFooterColor: '#052e16', storefrontFooterTextColor: '#dcfce7', storefrontBorderColor: '#bbf7d0', storefrontButtonTextColor: '#ffffff' } },
                      { name: 'Premium Dark', colors: { themePrimaryColor: '#18181b', themeAccentColor: '#d97706', storefrontBackgroundColor: '#09090b', storefrontSurfaceColor: '#18181b', storefrontTextColor: '#fafafa', storefrontMutedTextColor: '#a1a1aa', storefrontHeaderColor: '#09090b', storefrontHeaderTextColor: '#fafafa', storefrontFooterColor: '#09090b', storefrontFooterTextColor: '#fafafa', storefrontBorderColor: '#3f3f46', storefrontButtonTextColor: '#ffffff' } }
                    ] as const).map((preset) => (
                      <button key={preset.name} type="button" onClick={() => Object.entries(preset.colors).forEach(([field, value]) => handleChange(field as keyof StoreSettings, value))} className="rounded-lg border border-slate-200 bg-white p-2 text-left hover:border-slate-400">
                        <span className="mb-2 flex gap-1">{[preset.colors.themePrimaryColor, preset.colors.themeAccentColor, preset.colors.storefrontBackgroundColor].map((color) => <span key={color} className="h-5 flex-1 rounded-sm border border-black/10" style={{ backgroundColor: color }} />)}</span>
                        <span className="text-[10px] font-bold text-slate-700">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {([
                      ['themePrimaryColor', 'Primary Colour'], ['themeAccentColor', 'Accent Colour'], ['storefrontBackgroundColor', 'Page Background'], ['storefrontSurfaceColor', 'Card/Surface'],
                      ['storefrontTextColor', 'Main Text'], ['storefrontMutedTextColor', 'Muted Text'], ['storefrontHeaderColor', 'Header Background'], ['storefrontHeaderTextColor', 'Header Text'],
                      ['storefrontFooterColor', 'Footer Background'], ['storefrontFooterTextColor', 'Footer Text'], ['storefrontBorderColor', 'Borders'], ['storefrontButtonTextColor', 'Button Text']
                    ] as const).map(([field, label]) => (
                      <div key={field}><label className="mb-1 block text-xs font-bold text-slate-700">{label}</label><div className="flex gap-2"><input type="color" value={formData[field]} onChange={(e) => handleChange(field, e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-slate-300 p-0.5" /><input value={formData[field]} onChange={(e) => handleChange(field, e.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm" /></div></div>
                    ))}
                    <div><label className="mb-1 block text-xs font-bold text-slate-700">Typography</label><select value={formData.storefrontFontStyle} onChange={(e) => handleChange('storefrontFontStyle', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="modern">Modern Sans</option><option value="classic">Classic Serif</option><option value="rounded">Rounded Contemporary</option></select></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-700">Corner Style</label><select value={formData.storefrontCornerStyle} onChange={(e) => handleChange('storefrontCornerStyle', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="square">Square</option><option value="soft">Soft</option><option value="rounded">Rounded</option></select></div>
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
                  onClick={() => { setConfirmationText(''); setDestructiveActionError(''); setDestructiveAction('wipe'); }}
                  className="py-2 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-rose-500/20 active:scale-95"
                >
                  <Trash2 className="h-4 w-4" /> Wipe All Store Data
                </button>
              </div>
            </div>
          )}

          {destructiveAction && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 p-4" role="dialog" aria-modal="true" aria-labelledby="destructive-confirmation-title">
              <div className="w-full max-w-md rounded-2xl border border-rose-300 bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-start gap-3">
                  <div className="rounded-full bg-rose-100 p-2 text-rose-700"><Trash2 className="h-5 w-5" /></div>
                  <div>
                    <h4 id="destructive-confirmation-title" className="font-bold text-rose-900">
                      {destructiveAction === 'wipe' ? 'Permanently wipe all store data?' : 'Reset all settings to factory defaults?'}
                    </h4>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      This action cannot be undone. Export a backup first if you may need to recover the current information.
                    </p>
                  </div>
                </div>
                <label className="block text-xs font-semibold text-slate-800" htmlFor="destructive-confirmation-input">
                  Please type <span className="font-mono font-black text-rose-700">confirm</span> to continue
                </label>
                <input
                  id="destructive-confirmation-input"
                  autoFocus
                  value={confirmationText}
                  onChange={(event) => setConfirmationText(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') void completeDestructiveAction(); }}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  placeholder="Type confirm"
                  autoComplete="off"
                />
                {destructiveActionError && <p role="alert" className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs font-semibold text-rose-700">{destructiveActionError}</p>}
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" disabled={isDestructiveActionRunning} onClick={() => { setDestructiveAction(null); setConfirmationText(''); setDestructiveActionError(''); }} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    Cancel
                  </button>
                  <button type="button" disabled={confirmationText !== 'confirm' || isDestructiveActionRunning} onClick={() => void completeDestructiveAction()} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40">
                    {isDestructiveActionRunning ? 'Processing…' : destructiveAction === 'wipe' ? 'Permanently Wipe Data' : 'Reset Defaults'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: Master Data System */}
          {activeTab === 'master_data' && (
            <div className="space-y-4">
              <MasterDataManager />
            </div>
          )}

          {/* TAB 9: Custom Domain Settings */}
          {canAccessCustomDomain && activeTab === 'domain' && (
            <div className="space-y-4">
              <CustomDomainSettings />
            </div>
          )}

          {/* TAB 10: Subscription & Billing Settings */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              <TenantBillingSettings />
            </div>
          )}
        </div>


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
              onClick={closeWithoutSaving}
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
