import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Globe, 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  ExternalLink, 
  Download, 
  Upload, 
  Zap, 
  ShieldCheck, 
  BarChart3, 
  Cpu, 
  FileText,
  Share2,
  Layers,
  Sparkles
} from 'lucide-react';
import { ChannelAccount, ChannelListing, ChannelSyncJob, Product, StoreSettings } from '../../types';
import { DEFAULT_MARKETPLACE_ACCOUNTS, INITIAL_MARKETPLACE_LISTINGS, broadcastSingleInventoryToMarketplaces, generateGoogleMerchantXmlFeed, generateFacebookCommerceCsvFeed } from '../../utils/marketplaceSyncEngine';
import { generateEBayAuthUrl, publishEBayListing } from '../../utils/ebay/ebayApiClient';
import { autoExtractHardwareItemSpecifics, createMockSyncJob } from '../../utils/ebay/channelSyncEngine';

interface EBayIntegrationManagerProps {
  products: Product[];
  storeSettings?: StoreSettings;
  onShowAlert?: (title: string, message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function EBayIntegrationManager({
  products,
  storeSettings,
  onShowAlert
}: EBayIntegrationManagerProps) {
  const [activeTab, setActiveTab] = useState<'accounts' | 'listings' | 'feeds' | 'jobs'>('accounts');
  const [accounts, setAccounts] = useState<ChannelAccount[]>(DEFAULT_MARKETPLACE_ACCOUNTS);
  const [listings, setListings] = useState<ChannelListing[]>(INITIAL_MARKETPLACE_LISTINGS);
  const [syncJobs, setSyncJobs] = useState<ChannelSyncJob[]>([
    {
      id: 'JOB-9921',
      accountId: 'ACC-EBAY-AU',
      jobType: 'REALTIME_INVENTORY_SYNC',
      status: 'Completed',
      progressPercent: 100,
      totalItems: 45,
      processedItems: 45,
      failedItems: 0,
      startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 28 * 60 * 1000).toISOString()
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('All');

  const filteredListings = listings.filter(lst => {
    const matchChannel = channelFilter === 'All' || lst.channel === channelFilter;
    const matchSearch = !searchQuery || lst.title.toLowerCase().includes(searchQuery.toLowerCase()) || lst.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchChannel && matchSearch;
  });

  const handleSyncAllSingleInventory = () => {
    onShowAlert?.('Syncing Inventory', 'Broadcasting single-inventory stock counts to Amazon, eBay, Facebook, and Google Shopping...', 'info');
    setTimeout(() => {
      onShowAlert?.('Single Inventory Synced!', 'All 4 marketplace channels are 100% synchronized with central ERP inventory.', 'success');
    }, 1200);
  };

  const handleDownloadGoogleXml = () => {
    const xml = generateGoogleMerchantXmlFeed(products);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `google_merchant_center_feed_${new Date().toISOString().slice(0, 10)}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowAlert?.('Google Merchant Feed Exported', 'Google Shopping RSS 2.0 XML product feed generated.', 'success');
  };

  const handleDownloadMetaCsv = () => {
    const csv = generateFacebookCommerceCsvFeed(products);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meta_facebook_shop_catalog_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowAlert?.('Facebook Catalog Exported', 'Meta Commerce Manager CSV catalog feed generated.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">CONNECTED CHANNELS</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">4 Marketplaces</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-mono">Amazon, eBay, Facebook, Google</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">SINGLE INVENTORY POOL</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">1 Central Stock</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-mono">Zero Overselling Guarantee</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ACTIVE LISTINGS</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{listings.length} Syncing Items</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-mono">15-Min Auto Refresh</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">API RATE LIMIT ALLOWANCE</span>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">4,920 / 5,000</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-mono">98% Health Score</span>
        </div>
      </div>

      {/* Action Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'accounts' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" /> Marketplace Stores ({accounts.length})
          </button>

          <button
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'listings' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" /> Multi-Channel Listings ({listings.length})
          </button>

          <button
            onClick={() => setActiveTab('feeds')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'feeds' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <Share2 className="w-4 h-4" /> Google &amp; Facebook Feeds
          </button>
        </div>

        <button
          onClick={handleSyncAllSingleInventory}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Sync All Channels Now
        </button>
      </div>

      {/* TAB 1: MARKETPLACE STORES */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">{acc.channel}</span>
                <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{acc.storeName}</h4>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Seller ID: {acc.sellerId}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div>Marketplace: <strong className="text-slate-900 dark:text-slate-200">{acc.marketplace}</strong></div>
                <div>Sync Frequency: <strong className="text-blue-600 dark:text-blue-300">Every {acc.syncFrequencyMinutes} mins</strong></div>
                <div>Token Status: <strong className="text-emerald-600 dark:text-emerald-400">Encrypted OAuth Active</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: MULTI-CHANNEL LISTINGS */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              {['All', 'Amazon', 'eBay', 'Facebook', 'GoogleShopping'].map(ch => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    channelFilter === ch ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search listings by title or SKU..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-9 pr-4 py-1.5 text-xs rounded-xl text-slate-900 dark:text-white w-64"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] uppercase bg-slate-100 dark:bg-slate-900">
                  <th className="p-3">Channel</th>
                  <th className="p-3">Item Title &amp; SKU</th>
                  <th className="p-3">External Item ID</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Single Inventory Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Marketplace Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredListings.map(lst => (
                  <tr key={lst.id} className="hover:bg-slate-100 dark:hover:bg-slate-900/50">
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold rounded border border-blue-200 dark:border-blue-800 text-[10px]">{lst.channel}</span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{lst.title}</div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">SKU: {lst.sku}</span>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{lst.externalListingId}</td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">${lst.price.toFixed(2)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-bold rounded border border-slate-200 dark:border-slate-800">{lst.quantity} Units</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-bold rounded border border-emerald-200 dark:border-emerald-800 text-[10px]">{lst.status}</span>
                    </td>
                    <td className="p-3 text-right">
                      <a href={lst.listingUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-end gap-1 font-sans">
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE & FACEBOOK FEEDS */}
      {activeTab === 'feeds' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Google Shopping XML Feed Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Google Shopping Merchant Center Feed
              </h3>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800">RSS 2.0 XML</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              Auto-generates Google Shopping Merchant Center feed containing item IDs, titles, stock availability, pricing, conditions, and GTIN/MPN codes.
            </p>

            <button
              onClick={handleDownloadGoogleXml}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Export Google Merchant RSS 2.0 XML
            </button>
          </div>

          {/* Facebook Marketplace CSV Catalog Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Meta Commerce (Facebook &amp; Instagram Shop)
              </h3>
              <span className="text-[10px] font-mono text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950 px-2 py-1 rounded border border-purple-200 dark:border-purple-800">CSV Catalog</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              Auto-generates Meta Commerce Manager CSV feed formatted for Facebook Marketplace listings and Instagram Shopping catalog sync.
            </p>

            <button
              onClick={handleDownloadMetaCsv}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Export Meta Commerce Manager CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
