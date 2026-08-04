import React, { useState } from 'react';
import { ShoppingBag, User, ShieldCheck, Search, Store, Sun, Moon, Phone, Mail, Truck, Shield, Laptop, Sliders, LogIn, Headphones } from 'lucide-react';
import { Product, StoreSettings } from '../types';

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
  onOpenPOS?: () => void;
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
  onOpenPOS
}: NavbarProps) {
  const allCategories = ['All', ...categories];
  const [showSearchMobile, setShowSearchMobile] = useState(false);

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
      {storeSettings?.showAnnouncementBar !== false && (
        <div className="bg-emerald-600 text-white text-[10px] py-1.5 px-4 font-sans border-b border-black/10">
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
              <span>🇦🇺 {storeSettings?.storeName || 'TECH SELLER'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Branding & Action Header */}
      <div className="bg-[#212120] border-b border-black/10 text-white transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
          
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
                src="/images/app_logo.jpg" 
                alt="Tech Seller Logo" 
                className="h-full w-full object-contain"
                decoding="async"
                fetchPriority="high"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="hidden sm:block">
              <span className="block font-sans text-lg font-black tracking-tight text-white uppercase leading-none">
                {storeSettings?.storeName || 'TECH SELLER'}
              </span>
            </div>
          </button>

          {/* Middle Search Bar (hidden in admin mode) */}
          {!isAdminMode ? (
            <div className="hidden md:block flex-1 max-w-lg mx-4" id="desktop-search-container">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400 dark:text-neutral-500">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="SEARCH DELL, THINKPAD, CORE i7, MACBOOK, MONITORS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-none border-2 border-neutral-900 dark:border-neutral-700 dark:border-amber-400/80 bg-neutral-50 dark:bg-neutral-950 py-2 pl-10 pr-16 font-sans text-[10px] uppercase tracking-wider outline-none transition-all placeholder:text-neutral-500 dark:placeholder:text-neutral-500 focus:bg-white text-neutral-900 dark:text-neutral-100"
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
            <div className="hidden sm:block" id="admin-badge-container">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white">
                Store Manager
              </h2>
            </div>
          )}

          {/* Right Nav Options */}
          <div className="flex items-center gap-2.5" id="nav-actions">
            
            {/* Mobile search toggle */}
            {!isAdminMode && (
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
                className="flex items-center gap-2 border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-1.5 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all md:px-2.5"
                title="My Account & Wallet"
                id="account-drawer-btn"
              >
                <User className="h-3.5 w-3.5 text-white dark:text-neutral-900 dark:text-amber-400" />
                <div className="hidden lg:block text-left font-mono text-[9px] leading-tight uppercase tracking-wider">
                  <div className="text-neutral-500 dark:text-neutral-400 font-medium">ACCOUNT</div>
                  <div className="font-bold text-neutral-900 dark:text-neutral-50">${customerWallet.toFixed(2)}</div>
                </div>
              </button>
            )}

            {/* Shopping Cart Button */}
            {!isAdminMode && (
              <button
                onClick={onOpenCart}
                onMouseEnter={onPrefetchCheckout}
                onFocus={onPrefetchCheckout}
                className="relative flex items-center gap-2 border border-neutral-900 dark:border-neutral-700 dark:border-blue-400 bg-neutral-900 dark:bg-neutral-900 dark:bg-neutral-900 text-white dark:text-blue-400 px-2.5 py-1.5 transition-all hover:bg-[#001D33] shadow-sm"
                title="View Cart"
                id="cart-drawer-btn"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-blue-400" />
                <span className="hidden sm:inline font-mono text-[10px] font-bold tracking-wider">CART</span>
                {cartCount > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center px-1 bg-blue-500 text-white dark:text-neutral-900 font-mono text-[9px] font-black">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Compare Button */}
            {onOpenCompare && (
              <button
                type="button"
                onClick={onOpenCompare}
                className="relative flex items-center gap-1.5 border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Compare Products"
              >
                <span>COMPARE</span>
                {compareCount > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center px-1 bg-blue-600 text-white font-mono text-[9px] font-black">
                    {compareCount}
                  </span>
                )}
              </button>
            )}

            {/* Track Order Button */}
            {!isAdminMode && onOpenTrackOrder && (
              <button
                type="button"
                onClick={onOpenTrackOrder}
                className="hidden md:flex items-center gap-1.5 border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Live Order Tracking"
              >
                <Truck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>TRACK ORDER</span>
              </button>
            )}

            {/* POS Register Quick Button */}
            {isAdminMode && onOpenPOS && (
              <button
                type="button"
                onClick={onOpenPOS}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 font-mono text-[10px] font-black uppercase transition-all shadow-sm"
                title="POS Retail Cash Register"
              >
                <span>POS REGISTER</span>
              </button>
            )}

            {/* Store Settings Button */}
            {isAdminMode && onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                onMouseEnter={onPrefetchSettings}
                onFocus={onPrefetchSettings}
                className="flex h-8 w-8 items-center justify-center border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Store Control & Settings"
                id="store-settings-btn"
              >
                <Sliders className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </button>
            )}

            {/* Theme Toggle Button */}
            {isAdminMode && (
              <button
                onClick={onToggleDarkMode}
                className="flex h-8 w-8 items-center justify-center border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                id="theme-toggle-btn"
              >
                {isDarkMode ? (
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Moon className="h-3.5 w-3.5 text-white dark:text-neutral-900" />
                )}
              </button>
            )}

            <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />

            {/* Mode Switcher Button: Customer vs Admin Dashboard */}
            {isAdminMode ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsAdminMode(false);
                }}
                className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 px-3 py-2 text-[9px] font-black tracking-widest uppercase transition-all"
                id="dashboard-mode-toggle"
              >
                <Store className="h-3 w-3" />
                <span className="hidden sm:inline">EXIT ADMIN</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsAdminMode(true);
                }}
                onMouseEnter={onPrefetchAdmin}
                onFocus={onPrefetchAdmin}
                className="bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-700 flex items-center gap-2 px-3 py-2 text-[9px] font-black tracking-widest uppercase transition-all"
                id="login-btn"
              >
                <LogIn className="h-3 w-3" />
                <span className="hidden sm:inline">ADMIN LOGIN</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Categories Navigation Bar (ACT Deep Navy Blue Menu) */}
      {!isAdminMode && (
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

            <div className="hidden xl:flex items-center gap-4 py-1" id="nav-service-highlights">
              <div className="flex items-center gap-2 group">
                <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <Truck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="font-mono text-[9px] font-black uppercase text-neutral-900 dark:text-white leading-tight">Fast Shipping</h4>
                  <p className="font-sans text-[8px] text-neutral-500 uppercase font-bold tracking-tight leading-tight">Australia Wide Delivery</p>
                </div>
              </div>

              <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />

              <div className="flex items-center gap-2 group">
                <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                  <Headphones className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-mono text-[9px] font-black uppercase text-neutral-900 dark:text-white leading-tight">Expert Support</h4>
                  <p className="font-sans text-[8px] text-neutral-500 uppercase font-bold tracking-tight leading-tight">100% Local Tech Team</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Expandable (hidden in admin mode) */}
      {!isAdminMode && showSearchMobile && (
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
    </header>
  );
}

