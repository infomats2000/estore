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
  Filter, 
  Layers, 
  ExternalLink, 
  Download, 
  Upload, 
  Zap, 
  ShieldCheck, 
  BarChart3, 
  TrendingUp, 
  Cpu, 
  Tag, 
  Trash2,
  Lock,
  Play
} from 'lucide-react';
import { ChannelAccount, ChannelListing, ChannelSyncJob, MarketplaceCode, Product, StoreSettings } from '../../types';
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
  const [activeTab, setActiveTab] = useState<'accounts' | 'listings' | 'jobs' | 'hardware' | 'analytics'>('accounts');

  // Accounts state
  const [accounts, setAccounts] = useState<ChannelAccount[]>([
    {
      id: 'ACC-EBAY-AU',
      channel: 'eBay',
      marketplace: 'EBAY_AU',
      sellerId: 'techseller_official_au',
      storeName: 'Tech Seller Australia Hardware Hub',
      status: 'Connected',
      accessTokenEncrypted: 'v^1.1#encrypted_token_au_9821',
      refreshTokenEncrypted: 'r^1.1#encrypted_refresh_au_192',
      tokenExpiresAt: new Date(Date.now() + 7200 * 1000).toISOString(),
      syncFrequencyMinutes: 15,
      lastSyncAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      nextSyncAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      createdAt: '2026-01-15T08:00:00Z'
    },
    {
      id: 'ACC-EBAY-US',
      channel: 'eBay',
      marketplace: 'EBAY_US',
      sellerId: 'techseller_global_us',
      storeName: 'Tech Seller US Server & Enterprise Store',
      status: 'Connected',
      accessTokenEncrypted: 'v^1.1#encrypted_token_us_4421',
      refreshTokenEncrypted: 'r^1.1#encrypted_refresh_us_992',
      tokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      syncFrequencyMinutes: 30,
      lastSyncAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      nextSyncAt: new Date(Date.now() + 18 * 60 * 1000).toISOString(),
      createdAt: '2026-03-01T10:00:00Z'
    }
  ]);

  // Listings state
  const [listings, setListings] = useState<ChannelListing[]>([
    {
      id: 'LST-001',
      accountId: 'ACC-EBAY-AU',
      productId: products[0]?.id || 'P-001',
      externalListingId: '125983741920',
      channel: 'eBay',
      title: 'Dell Latitude 5420 Laptop i5-1145G7 16GB 256GB NVMe Win11 Pro',
      sku: 'DELL-LAT-5420-I5',
      mpn: '5420-I5-16GB',
      brand: 'Dell',
      price: 649.00,
      quantity: 12,
      status: 'Active',
      itemSpecifics: {
        'Processor': 'Intel Core i5 11th Gen',
        'RAM Size': '16 GB',
        'SSD Capacity': '256 GB',
        'CPU Socket': 'LGA 1700',
        'Warranty': '1 Year Direct Warranty'
      },
      listingUrl: 'https://www.ebay.com.au/itm/125983741920',
      lastSyncAt: new Date().toISOString()
    },
    {
      id: 'LST-002',
      accountId: 'ACC-EBAY-AU',
      productId: products[1]?.id || 'P-002',
      externalListingId: '125983741921',
      channel: 'eBay',
      title: 'Lenovo ThinkPad X1 Carbon Gen 9 i7-1185G7 16GB 512GB SSD',
      sku: 'LEN-X1C-G9-I7',
      mpn: '20XW004GAU',
      brand: 'Lenovo',
      price: 1299.00,
      quantity: 5,
      status: 'Active',
      itemSpecifics: {
        'Processor': 'Intel Core i7 11th Gen',
        'RAM Size': '16 GB',
        'SSD Capacity': '512 GB'
      },
      listingUrl: 'https://www.ebay.com.au/itm/125983741921',
      lastSyncAt: new Date().toISOString()
    }
  ]);

  // Sync Jobs state
  const [syncJobs, setSyncJobs] = useState<ChannelSyncJob[]>([
    {
      id: 'JOB-9821',
      accountId: 'ACC-EBAY-AU',
      jobType: 'REALTIME_INVENTORY_SYNC',
      status: 'Completed',
      progressPercent: 100,
      totalItems: 48,
      processedItems: 48,
      failedItems: 0,
      startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString()
    },
    {
      id: 'JOB-9822',
      accountId: 'ACC-EBAY-US',
      jobType: 'IMPORT_ORDERS',
      status: 'In Progress',
      progressPercent: 65,
      totalItems: 20,
      processedItems: 13,
      failedItems: 0,
      startedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString()
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceCode>('EBAY_AU');
  const [isOAuthConnecting, setIsOAuthConnecting] = useState(false);

  const handleConnectAccount = (mkt: MarketplaceCode) => {
    const authUrl = generateEBayAuthUrl(mkt);
    onShowAlert?.('OAuth Initiated', `Redirecting to eBay OAuth Consent portal for ${mkt}...`, 'info');
    
    // Simulate OAuth callback success
    setTimeout(() => {
      const newAcc: ChannelAccount = {
        id: `ACC-EBAY-${mkt}-${Date.now().toString().slice(-4)}`,
        channel: 'eBay',
        marketplace: mkt,
        sellerId: `seller_${mkt.toLowerCase()}_${Math.floor(1000 + Math.random() * 9000)}`,
        storeName: `Tech Seller ${mkt.replace('EBAY_', '')} Marketplace Store`,
        status: 'Connected',
        accessTokenEncrypted: 'v^1.1#encrypted_oauth_token',
        refreshTokenEncrypted: 'r^1.1#encrypted_refresh_token',
        tokenExpiresAt: new Date(Date.now() + 7200 * 1000).toISOString(),
        syncFrequencyMinutes: 15,
        lastSyncAt: new Date().toISOString(),
        nextSyncAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      };
      setAccounts(prev => [...prev, newAcc]);
      onShowAlert?.('Account Connected', `Successfully connected eBay Store (${mkt})! OAuth tokens encrypted & stored.`, 'success');
    }, 800);
  };

  const handleTriggerSync = (jobType: ChannelSyncJob['jobType'], accountId: string) => {
    const job = createMockSyncJob(accountId, jobType);
    setSyncJobs(prev => [job, ...prev]);
    onShowAlert?.('Sync Started', `Background worker job ${jobType} started for store ${accountId}.`, 'info');
  };

  const handlePublishProductToEBay = async (product: Product) => {
    if (accounts.length === 0) {
      onShowAlert?.('No Account', 'Please connect an eBay account before publishing listings.', 'error');
      return;
    }
    const acc = accounts[0];
    const newListing = await publishEBayListing(acc, product);
    setListings(prev => [newListing, ...prev]);
    onShowAlert?.('Product Published', `Published "${product.name}" to eBay (Item #${newListing.externalListingId})!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-6 rounded-2xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-blue-900/40">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 border border-amber-400/30 rounded-xl backdrop-blur-md">
            <Globe className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/30">
              GENERIC CHANNEL MANAGER ARCHITECTURE
            </span>
            <h2 className="text-xl font-black tracking-tight mt-1">eBay Integration &amp; Multi-Channel Suite</h2>
            <p className="text-xs text-slate-300">Single Source of Truth for Catalog, Real-Time Inventory &amp; Order Sync</p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleConnectAccount('EBAY_AU')}
            className="px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Connect eBay Store
          </button>

          <button
            type="button"
            onClick={() => handleTriggerSync('REALTIME_INVENTORY_SYNC', accounts[0]?.id || 'ACC-EBAY-AU')}
            className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Trigger Real-Time Inventory Sync
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
        {[
          { id: 'accounts', label: 'Connected Stores', icon: Globe },
          { id: 'listings', label: 'Listings Workspace', icon: ShoppingBag },
          { id: 'jobs', label: 'Sync Queue & Rate Limits', icon: Zap },
          { id: 'hardware', label: 'Hardware Attributes Mapper', icon: Cpu },
          { id: 'analytics', label: 'Marketplace Reports', icon: BarChart3 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Connected Stores */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(acc => (
              <div key={acc.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {acc.marketplace.replace('EBAY_', '')} MARKETPLACE
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> OAuth Active
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{acc.storeName}</h4>
                  <p className="text-xs text-slate-500 font-mono">Seller ID: {acc.sellerId}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-xs space-y-1 font-mono text-slate-500">
                  <div className="flex justify-between"><span>Sync Frequency:</span><strong className="text-slate-700 dark:text-slate-200">Every {acc.syncFrequencyMinutes} mins</strong></div>
                  <div className="flex justify-between"><span>Last Sync:</span><strong className="text-slate-700 dark:text-slate-200">{new Date(acc.lastSyncAt).toLocaleTimeString()}</strong></div>
                  <div className="flex justify-between"><span>Token Expiry:</span><strong className="text-emerald-600 dark:text-emerald-400">2 Hours Remaining</strong></div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleTriggerSync('IMPORT_LISTINGS', acc.id)}
                    className="flex-1 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Import Catalog
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerSync('IMPORT_ORDERS', acc.id)}
                    className="flex-1 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center justify-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" /> Pull Orders
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Listings Workspace */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search eBay listings by Title, SKU, MPN..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold">Publish Product to eBay:</span>
              <select
                onChange={e => {
                  const p = products.find(prod => prod.id === e.target.value);
                  if (p) {
                    handlePublishProductToEBay(p);
                    e.target.value = '';
                  }
                }}
                className="px-3 py-1.5 text-xs rounded-lg border border-blue-500 bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300 font-bold"
              >
                <option value="">+ Select ERP Product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-mono uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">eBay Listing Details</th>
                  <th className="p-3">SKU / MPN</th>
                  <th className="p-3 text-right">Price ($)</th>
                  <th className="p-3 text-center">Stock</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {listings.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                    <td className="p-3">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{l.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <span>Item ID: {l.externalListingId}</span> &bull; <a href={l.listingUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-0.5">View on eBay <ExternalLink className="w-3 h-3" /></a>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                      <div>{l.sku}</div>
                      <div className="text-[10px] text-slate-400">MPN: {l.mpn}</div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">${l.price.toFixed(2)}</td>
                    <td className="p-3 text-center font-mono font-bold">{l.quantity}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => onShowAlert?.('Sync Triggered', `Re-syncing listing #${l.externalListingId} with ERP stock...`, 'info')}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Re-sync listing with ERP stock"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Sync Queue & Rate Limits */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">API Usage &amp; Rate Limit Monitor</h4>
              <p className="text-xs text-slate-500">eBay Inventory &amp; Trading API Call Allowance (5,000 calls / day limit)</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-sm font-black text-emerald-600">4,812 Calls Remaining</span>
              <div className="text-[10px] text-slate-400">Resets in 6 hours</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-mono uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Job ID</th>
                  <th className="p-3">Sync Type</th>
                  <th className="p-3">Progress</th>
                  <th className="p-3 text-center">Items Processed</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {syncJobs.map(job => (
                  <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 font-mono">
                    <td className="p-3 font-bold text-blue-600">{job.id}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{job.jobType}</td>
                    <td className="p-3">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full transition-all" style={{ width: `${job.progressPercent}%` }} />
                      </div>
                    </td>
                    <td className="p-3 text-center">{job.processedItems} / {job.totalItems}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                        job.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
