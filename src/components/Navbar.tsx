import React, { useState } from 'react';
import { ShoppingCart, ShieldCheck, Search, Phone, Mail, Truck, Shield, Laptop, LogIn, Headphones, Cpu, User, Globe } from 'lucide-react';

import { Product, StoreSettings } from '../types';
import { UserAccountDropdown } from './UserAccountDropdown';
import { ChangePasswordModal } from './ChangePasswordModal';
import { useTenantFeatures } from '../context/TenantFeatureContext';


interface NavbarProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onOpenSettings?: () => void;
  onPrefetchAdmin?: () => void;
  onPrefetchAccount?: () => void;
  onPrefetchCheckout?: () => void;
  onPrefetchSettings?: () => void;
  storeSettings?: StoreSettings;
  isAdminMode: boolean;
  setIsAdminMode: (admin: boolean) => void;
  customerPoints: number;
  customerWallet: number;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  categories: string[];
  onOpenTrackOrder?: () => void;
  onOpenCompare?: () => void;
  compareCount?: number;
  onOpenPCBuilder?: () => void;
  onOpenCustomerPortal?: () => void;
  currentUser?: any;
  onLogoutAccount?: () => void;
}


export default function Navbar({
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  cartCount,
  onOpenCart,
  onOpenAccount,
  onOpenSettings,
  onPrefetchAdmin,
  onPrefetchAccount,
  onPrefetchCheckout,
  onPrefetchSettings,
  storeSettings,
  isAdminMode,
  setIsAdminMode,
  customerPoints,
  customerWallet,
  products,
  onSelectProduct,
  isDarkMode,
  onToggleDarkMode,
  categories,
  onOpenTrackOrder,
  onOpenCompare,
  compareCount = 0,
  onOpenPCBuilder,
  onOpenCustomerPortal,
  currentUser,
  onLogoutAccount,
}: NavbarProps) {
  const { hasFeature } = useTenantFeatures();
  const allCategories = ['All', ...categories];
  const [showSearchMobile, setShowSearchMobile] = useState(false);

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);


  const matchingProducts = searchQuery.trim()
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-40 w-full shadow-md" id="app-header">
      {/* Top Announcement Bar */}
      {!isAdminMode && storeSettings?.showAnnouncementBar !== false && (
        <div className="bg-blue-900 text-white text-[10px] py-1.5 px-4 font-sans border-b border-black/10" id="storefront-announcement-bar">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-1">
            <div className="flex items-center gap-3 text-white/90">
              <span className="flex items-center gap-1 font-bold text-white">
                <Phone className="h-2.5 w-2.5 text-white" />
                {storeSettings?.phone || '1300 000 228'}
              </span>
              <span className="hidden md:inline-block text-slate-300 dark:text-slate-700">|</span>
              <span className="hidden md:flex items-center gap-1">
                <Mail className="h-2.5 w-2.5 text-white/70" />
                {storeSettings?.email || 'billing@techseller.com.au'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-center">
              <span className="flex items-center gap-1 font-semibold text-white">
                <Truck className="h-3 w-3 text-white/80" />
                {storeSettings?.announcementText || 'FREE Express Shipping Over $100'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 font-mono text-[9px] text-white/60 uppercase tracking-wider font-bold">
              <span>🇦🇺 {storeSettings?.storeName || 'INFOMAT'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Branding & Action Header */}
      <div className={`bg-[#2f2f2f] border-b border-black/10 text-white transition-colors ${!isAdminMode && storeSettings?.showStorefrontHeader === false ? 'hidden' : ''}`} id="storefront-main-header">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
          
          <div className="flex shrink-0 items-center gap-3">
          {/* Logo and Brand */}
          <button 
            onClick={() => {
              setIsAdminMode(false);
              setActiveCategory('All');
            }} 
            className="flex items-center gap-3 group text-left flex-shrink-0"
            id="nav-logo-btn"
          >
            <div className="flex h-12 w-12 items-center justify-center bg-white rounded-lg p-1 shadow-sm transition-transform group-hover:scale-105 overflow-hidden">
              <img 
                src={storeSettings?.logoUrl || '/images/app_logo.jpg'}
                alt={`${storeSettings?.storeName || 'Store'} logo`}
                className="h-full w-full object-contain"
                decoding="async"
                fetchPriority="high"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="hidden sm:block">
              <span className="block font-sans text-lg font-black tracking-tight text-white uppercase leading-none">
                {isAdminMode ? (currentUser?.tenantName || storeSettings?.storeName || 'Tenant Store') : (storeSettings?.storeName || 'INFOMAT')}
              </span>
            </div>
          </button>

          </div>

          {/* Middle Search Bar (hidden in admin mode) */}
          {!isAdminMode && storeSettings?.showStorefrontSearch !== false ? (
            <div className="hidden md:block flex-1 min-w-[260px] max-w-lg mx-4" id="desktop-search-container">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400 dark:text-neutral-500">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="SEARCH DELL, THINKPAD, CORE i7, MACBOOK, MONITORS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-none border-2 border-neutral-900 dark:border-amber-400/80 bg-white dark:bg-neutral-950 py-2 pl-10 pr-12 font-sans text-[10px] uppercase tracking-wider outline-none transition-all placeholder:text-neutral-700 dark:placeholder:text-neutral-300 focus:bg-white text-neutral-900 dark:text-neutral-100"
                  id="search-input-desktop"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 font-mono text-[10px] text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-bold"
                  >
                    CLEAR
                  </button>
                )}

                {/* Live search results dropdown */}
                {matchingProducts.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 border-2 border-neutral-900 dark:border-neutral-700 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl" id="desktop-search-dropdown">
                    <div className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-900 dark:bg-neutral-900 text-white px-3 py-1.5 flex justify-between items-center">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-blue-300 font-bold">Matching Hardware</span>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="font-mono text-[9px] uppercase tracking-widest text-neutral-300 hover:text-white font-bold"
                      >
                        Close
                      </button>
                    </div>
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[340px] overflow-y-auto">
                      {matchingProducts.map((prod) => {
                        const hasDiscount = prod.discountPrice !== undefined && prod.discountPrice < prod.price;
                        return (
                          <button
                            key={prod.id}
                            onClick={() => {
                              onSelectProduct(prod);
                              setSearchQuery('');
                            }}
                            className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/80"
                            id={`search-suggestion-${prod.id}`}
                          >
                            <img
                              src={prod.image || null}
                              alt={prod.name}
                              className="h-12 w-12 flex-shrink-0 bg-neutral-100 dark:bg-neutral-950 object-cover border border-neutral-400 dark:border-neutral-700"
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="block font-mono text-[9px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">{prod.category}</span>
                              <span className="block font-sans text-xs font-bold uppercase tracking-wider text-neutral-950 dark:text-neutral-50 truncate">{prod.name}</span>
                            </div>
                            <div className="text-right flex-shrink-0 font-mono text-xs font-bold text-neutral-950 dark:text-neutral-50">
                              {hasDiscount ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">${prod.discountPrice?.toFixed(2)} AUD</span>
                                  <span className="text-[9px] text-neutral-400 dark:text-neutral-500 line-through font-normal">${prod.price.toFixed(2)}</span>
                                </div>
                              ) : (
                                <span>${prod.price.toFixed(2)} AUD</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3" id="admin-badge-container">
              <h2 className="text-xl sm:text-2xl font-black tracking-tighter bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-300 bg-clip-text text-transparent drop-shadow-[0_1px_6px_rgba(125,211,252,0.45)] whitespace-nowrap">
                Infomat ERP
              </h2>
            </div>
          )}

          {/* Right Nav Options */}
          <div className="flex min-w-0 items-center gap-2 lg:gap-3" id="nav-actions">
            
            {/* Mobile search toggle */}
            {!isAdminMode && storeSettings?.showStorefrontSearch !== false && (
              <button
                onClick={() => setShowSearchMobile(!showSearchMobile)}
                className="flex md:hidden h-10 w-10 items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Search Store"
                id="mobile-search-toggle"
              >
                <Search className="h-5 w-5" />
              </button>
            )}

            {/* Account / Customer Portal */}
            {isAdminMode && (
              <button
                onClick={onOpenAccount}
                onMouseEnter={onPrefetchAccount}
                onFocus={onPrefetchAccount}
                className="text-[10px] font-bold uppercase tracking-wider text-sky-200 dark:text-sky-200 hover:text-white dark:hover:text-white transition-colors"
                title="My Account & Wallet"
                id="account-drawer-btn"
              >
                <span>My Account (${customerWallet.toFixed(2)})</span>
              </button>
            )}

            {/* Customer Portal Button */}
            {!isAdminMode && storeSettings?.showStorefrontAccount !== false && onOpenCustomerPortal && (
              <a
                href="#customer-portal"
                onClick={(event) => { event.preventDefault(); onOpenCustomerPortal(); }}
                className="hidden xl:inline-flex shrink-0 items-center gap-1 text-purple-200 hover:text-white font-mono text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors"
                title="View your orders, track shipments & manage account"
                id="customer-portal-btn"
              >
                <User className="h-3.5 w-3.5 text-purple-300" />
                <span>MY ACCOUNT &amp; ORDERS</span>
              </a>
            )}
            {!isAdminMode && storeSettings?.showStorefrontCart !== false && (
              <a
                href="#cart"
                onClick={(event) => { event.preventDefault(); onOpenCart(); }}
                onMouseEnter={onPrefetchCheckout}
                onFocus={onPrefetchCheckout}
                className="relative flex h-9 w-10 shrink-0 items-center justify-center text-white/80 transition-colors hover:text-white"
                title="View Cart"
                aria-label={`View cart${cartCount > 0 ? `, ${cartCount} item${cartCount === 1 ? '' : 's'}` : ''}`}
                id="cart-drawer-btn"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center px-1 bg-blue-500 text-white dark:text-neutral-900 font-mono text-[9px] font-black">
                    {cartCount}
                  </span>
                )}
              </a>
            )}

            {/* Compare Button */}
            {!isAdminMode && storeSettings?.showStorefrontCompare !== false && onOpenCompare && (
              <a
                href="#compare"
                onClick={(event) => { event.preventDefault(); onOpenCompare(); }}
                className="relative hidden lg:inline-flex shrink-0 items-center gap-1 text-neutral-200 hover:text-white font-mono text-[9px] xl:text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors"
                title="Compare product specifications side-by-side"
              >
                <span>COMPARE SPECS</span>
                {compareCount > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center px-1 bg-blue-600 text-white font-mono text-[9px] font-black">
                    {compareCount}
                  </span>
                )}
              </a>
            )}

            {/* Custom PC Builder Button */}
            {!isAdminMode && storeSettings?.showStorefrontPcBuilder !== false && onOpenPCBuilder && (
              <a
                href="#pc-builder"
                onClick={(event) => { event.preventDefault(); onOpenPCBuilder(); }}
                className="relative hidden lg:inline-flex shrink-0 items-center gap-1 text-blue-200 hover:text-white font-mono text-[9px] xl:text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-colors cursor-pointer"
                title="Interactively select compatible PC parts & build your computer"
              >
                <Cpu className="h-3.5 w-3.5 text-blue-200" />
                <span>CUSTOM PC BUILDER</span>
              </a>
            )}

            {/* Track Order Button */}
            {!isAdminMode && storeSettings?.showStorefrontTracking !== false && onOpenTrackOrder && (
              <a
                href="#track-order"
                onClick={(event) => { event.preventDefault(); onOpenTrackOrder(); }}
                className="hidden xl:inline-flex shrink-0 items-center gap-1 text-neutral-200 hover:text-white font-mono text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors"
                title="Track live courier delivery status"
              >
                <Truck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>TRACK SHIPMENT</span>
              </a>
            )}

            {/* View Public Storefront Button in Store Admin Navbar */}
            {isAdminMode && hasFeature('storefront') && (
              <a
                href="/?mode=store&view=public"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-200 transition-colors hover:text-white"
                title="Open the public storefront in a new tab"
                id="view-public-storefront-btn"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>View Storefront</span>
              </a>
            )}

            {/* Store Settings Button */}
            {isAdminMode && onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                onMouseEnter={onPrefetchSettings}
                onFocus={onPrefetchSettings}
                className="text-[10px] font-bold uppercase tracking-wider text-sky-200 dark:text-sky-200 hover:text-white dark:hover:text-white transition-colors"
                title="Store Control & Settings"
                id="store-settings-btn"
              >
                <span>Store Settings</span>
              </button>
            )}


            {/* Theme Toggle Button */}
            {isAdminMode && (
              <button
                onClick={onToggleDarkMode}
                className="text-[10px] font-bold uppercase tracking-wider text-sky-200 dark:text-sky-200 hover:text-white dark:hover:text-white transition-colors"
                title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                id="theme-toggle-btn"
              >
                <span>{isDarkMode ? 'Light Theme' : 'Dark Theme'}</span>
              </button>
            )}

            {/* User Account & Security Dropdown or Staff Login */}
            {isAdminMode ? (
              <div className="pl-2 border-l border-neutral-700/60 flex items-center">
                <UserAccountDropdown
                  userName={currentUser?.name || 'Store Admin'}
                  userEmail={currentUser?.email || 'owner@infomat.com'}
                  roleBadge="Store Owner"
                  isSuperAdmin={false}
                  onChangePassword={() => setShowChangePasswordModal(true)}
                  onLogout={() => {
                    localStorage.removeItem('authToken');
                    if (onLogoutAccount) onLogoutAccount();
                    else window.location.href = '/?mode=login';
                  }}
                />
              </div>
            ) : storeSettings?.showStorefrontAdminLogin !== false ? (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setIsAdminMode(true);
                }}
                onMouseEnter={onPrefetchAdmin}
                onFocus={onPrefetchAdmin}
                className="inline-flex shrink-0 items-center gap-1 text-neutral-200 hover:text-white font-mono text-[9px] lg:text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-colors"
                id="login-btn"
              >
                <LogIn className="h-3 w-3" />
                <span className="hidden sm:inline">STAFF / ADMIN LOGIN</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>


      {/* Main Categories Navigation Bar (ACT Deep Navy Blue Menu) */}
      {!isAdminMode && storeSettings?.showStorefrontCategoryNav !== false && (
        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800" id="desktop-category-nav">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <nav className="flex flex-1 items-center gap-1 overflow-x-auto py-1 scrollbar-none">
              {allCategories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 font-sans text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#706d6d] text-white font-black shadow-sm'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500 border-emerald-500 shadow-sm'
                    }`}
                    id={`cat-nav-${cat.toLowerCase().replace(/[^a-z0-0]/g, '-')}`}
                  >
                    {cat}
                  </button>
                );
              })}
            </nav>

            {storeSettings?.showServiceHighlights && <div className="hidden xl:flex items-center gap-4 py-1" id="nav-service-highlights">
              <div className="flex items-center gap-2 group">
                <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <Truck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="font-mono text-[9px] font-black uppercase text-neutral-900 dark:text-white leading-tight">{storeSettings.shippingHighlightTitle}</h4>
                  <p className="font-sans text-[8px] text-neutral-500 uppercase font-bold tracking-tight leading-tight">{storeSettings.shippingHighlightText}</p>
                </div>
              </div>

              <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />

              <div className="flex items-center gap-2 group">
                <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                  <Headphones className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-mono text-[9px] font-black uppercase text-neutral-900 dark:text-white leading-tight">{storeSettings.supportHighlightTitle}</h4>
                  <p className="font-sans text-[8px] text-neutral-500 uppercase font-bold tracking-tight leading-tight">{storeSettings.supportHighlightText}</p>
                </div>
              </div>
            </div>}
          </div>
        </div>
      )}

      {/* Mobile Search Expandable (hidden in admin mode) */}
      {!isAdminMode && storeSettings?.showStorefrontSearch !== false && showSearchMobile && (
        <div className="md:hidden border-t border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3" id="mobile-search-bar">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="SEARCH CATALOG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-2 border-neutral-900 dark:border-neutral-700 dark:border-amber-400 bg-neutral-50 dark:bg-neutral-950 py-2 pl-10 pr-4 font-sans text-xs uppercase tracking-wider outline-none text-neutral-900 dark:text-neutral-100"
              id="search-input-mobile"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 font-mono text-[10px] text-neutral-400 font-bold"
              >
                CLEAR
              </button>
            )}

            {/* Live search results dropdown (Mobile) */}
            {matchingProducts.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 border-2 border-neutral-900 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl" id="mobile-search-dropdown">
                <div className="border-b border-neutral-100 bg-neutral-900 dark:bg-neutral-900 text-white px-3 py-1.5 flex justify-between items-center">
                  <span className="font-mono text-[8px] uppercase tracking-widest text-blue-300 font-bold">Suggestions</span>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="font-mono text-[8px] uppercase tracking-widest text-neutral-300 font-bold"
                  >
                    Close
                  </button>
                </div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[280px] overflow-y-auto">
                  {matchingProducts.map((prod) => {
                    const hasDiscount = prod.discountPrice !== undefined && prod.discountPrice < prod.price;
                    return (
                      <button
                        key={prod.id}
                        onClick={() => {
                          onSelectProduct(prod);
                          setSearchQuery('');
                          setShowSearchMobile(false);
                        }}
                        className="flex w-full items-center gap-3 p-2.5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                        id={`mobile-search-suggestion-${prod.id}`}
                      >
                        <img
                          src={prod.image || null}
                          alt={prod.name}
                          className="h-9 w-9 flex-shrink-0 bg-neutral-50 dark:bg-neutral-950 object-cover border border-neutral-400 dark:border-neutral-700"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="block font-mono text-[8px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">{prod.category}</span>
                          <span className="block font-sans text-[11px] font-bold uppercase tracking-wider text-neutral-950 dark:text-neutral-50 truncate">{prod.name}</span>
                        </div>
                        <div className="text-right flex-shrink-0 font-mono text-[11px] font-bold text-neutral-950 dark:text-neutral-50">
                          {hasDiscount ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">${prod.discountPrice?.toFixed(2)}</span>
                          ) : (
                            <span>${prod.price.toFixed(2)}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}
    </header>
  );
}
