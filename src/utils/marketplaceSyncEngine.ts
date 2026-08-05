import { ChannelAccount, ChannelListing, Product } from '../types';

export const DEFAULT_MARKETPLACE_ACCOUNTS: ChannelAccount[] = [
  {
    id: 'ACC-EBAY-AU',
    channel: 'eBay',
    marketplace: 'EBAY_AU',
    sellerId: 'techseller_au_store',
    storeName: 'Tech Seller Australia Official eBay Store',
    status: 'Connected',
    accessTokenEncrypted: 'v^1.1#encrypted_oauth_token_ebay',
    refreshTokenEncrypted: 'r^1.1#encrypted_refresh_token_ebay',
    tokenExpiresAt: new Date(Date.now() + 7200 * 1000).toISOString(),
    syncFrequencyMinutes: 15,
    lastSyncAt: new Date().toISOString(),
    nextSyncAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    createdAt: '2025-01-10T00:00:00Z'
  },
  {
    id: 'ACC-AMAZON-AU',
    channel: 'Amazon',
    marketplace: 'AMAZON_AU',
    sellerId: 'A389283748291',
    storeName: 'Tech Seller Australia Amazon Storefront',
    status: 'Connected',
    accessTokenEncrypted: 'amzn1.application-oa2-client.encrypted',
    refreshTokenEncrypted: 'amzn1.oa2-refresh-token.encrypted',
    tokenExpiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
    syncFrequencyMinutes: 10,
    lastSyncAt: new Date().toISOString(),
    nextSyncAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    createdAt: '2025-02-01T00:00:00Z'
  },
  {
    id: 'ACC-META-SHOP',
    channel: 'Facebook',
    marketplace: 'META_SHOP',
    sellerId: 'meta_comm_9928172',
    storeName: 'Tech Seller Facebook Marketplace & Instagram Shop',
    status: 'Connected',
    accessTokenEncrypted: 'EAAB9928172#encrypted_meta_token',
    refreshTokenEncrypted: 'EAAB9928172#encrypted_meta_refresh',
    tokenExpiresAt: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
    syncFrequencyMinutes: 30,
    lastSyncAt: new Date().toISOString(),
    nextSyncAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    createdAt: '2025-03-15T00:00:00Z'
  },
  {
    id: 'ACC-GOOGLE-MC',
    channel: 'GoogleShopping',
    marketplace: 'GOOGLE_MERCHANT',
    sellerId: 'mc_account_881920',
    storeName: 'Tech Seller Google Merchant Center Feed',
    status: 'Connected',
    accessTokenEncrypted: 'ya29.a0AfH6SM#encrypted_google_token',
    refreshTokenEncrypted: '1//0e9817#encrypted_google_refresh',
    tokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    syncFrequencyMinutes: 60,
    lastSyncAt: new Date().toISOString(),
    nextSyncAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    createdAt: '2025-04-01T00:00:00Z'
  }
];

export const INITIAL_MARKETPLACE_LISTINGS: ChannelListing[] = [
  {
    id: 'LST-EBAY-01',
    accountId: 'ACC-EBAY-AU',
    productId: 'P-001',
    externalListingId: '125988172039',
    channel: 'eBay',
    title: 'Dell Latitude 5420 Enterprise Laptop i7 16GB 512GB SSD',
    sku: 'DELL-5420-I7',
    price: 649.00,
    quantity: 15,
    status: 'Active',
    itemSpecifics: { 'Brand': 'Dell', 'Processor': 'Intel Core i7', 'RAM Size': '16 GB', 'SSD Capacity': '512 GB' },
    listingUrl: 'https://www.ebay.com.au/itm/125988172039',
    lastSyncAt: new Date().toISOString()
  },
  {
    id: 'LST-AMAZON-01',
    accountId: 'ACC-AMAZON-AU',
    productId: 'P-001',
    externalListingId: 'B089283749',
    channel: 'Amazon',
    title: 'Dell Latitude 5420 14-inch Enterprise Laptop',
    sku: 'DELL-5420-I7',
    price: 669.00,
    quantity: 15,
    status: 'Active',
    itemSpecifics: { 'ASIN': 'B089283749', 'Brand': 'Dell' },
    listingUrl: 'https://www.amazon.com.au/dp/B089283749',
    lastSyncAt: new Date().toISOString()
  },
  {
    id: 'LST-META-01',
    accountId: 'ACC-META-SHOP',
    productId: 'P-001',
    externalListingId: 'FB-PROD-9921',
    channel: 'Facebook',
    title: 'Dell Latitude 5420 Enterprise Laptop',
    sku: 'DELL-5420-I7',
    price: 649.00,
    quantity: 15,
    status: 'Active',
    itemSpecifics: { 'Condition': 'Refurbished Grade A' },
    listingUrl: 'https://www.facebook.com/marketplace/item/FB-PROD-9921',
    lastSyncAt: new Date().toISOString()
  },
  {
    id: 'LST-GOOGLE-01',
    accountId: 'ACC-GOOGLE-MC',
    productId: 'P-001',
    externalListingId: 'GMC-88192-01',
    channel: 'GoogleShopping',
    title: 'Dell Latitude 5420 Enterprise Laptop',
    sku: 'DELL-5420-I7',
    price: 649.00,
    quantity: 15,
    status: 'Active',
    itemSpecifics: { 'Google Category': 'Electronics > Computers > Laptops' },
    listingUrl: 'https://www.google.com/shopping/product/GMC-88192-01',
    lastSyncAt: new Date().toISOString()
  }
];

export function broadcastSingleInventoryToMarketplaces(
  product: Product, 
  newStock: number, 
  listings: ChannelListing[]
): ChannelListing[] {
  console.log(`[SINGLE INVENTORY ENGINE] Broadcasting new stock count (${newStock}) for product "${product.name}" across connected Amazon, eBay, Facebook, and Google Shopping channels...`);

  return listings.map(lst => {
    if (lst.productId === product.id) {
      return {
        ...lst,
        quantity: newStock,
        status: newStock > 0 ? 'Active' : 'Out of Stock',
        lastSyncAt: new Date().toISOString()
      };
    }
    return lst;
  });
}

export function generateGoogleMerchantXmlFeed(products: Product[]): string {
  const itemsXml = products.map(p => `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${p.description || p.name}]]></g:description>
      <g:link>https://techseller.app/product/${p.id}</g:link>
      <g:image_link>${p.image || 'https://techseller.app/placeholder.jpg'}</g:image_link>
      <g:availability>${p.stock > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${(p.discountPrice || p.price).toFixed(2)} AUD</g:price>
      <g:condition>refurbished</g:condition>
      <g:brand>${p.name.split(' ')[0]}</g:brand>
      <g:gtin>${p.specs?.UPC || p.specs?.EAN || '9312345678901'}</g:gtin>
      <g:mpn>${p.specs?.MPN || p.specs?.sku || p.id}</g:mpn>
      <g:google_product_category>Electronics &gt; Computers &gt; Laptops</g:google_product_category>
    </item>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Tech Seller Australia Product Feed</title>
    <link>https://techseller.app</link>
    <description>Google Merchant Center Single Inventory Product Feed</description>
    ${itemsXml}
  </channel>
</rss>`;
}

export function generateFacebookCommerceCsvFeed(products: Product[]): string {
  const headers = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand', 'mpn'];
  const rows = products.map(p => [
    p.id,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${(p.description || p.name).replace(/"/g, '""')}"`,
    p.stock > 0 ? 'in stock' : 'out of stock',
    'refurbished',
    `${(p.discountPrice || p.price).toFixed(2)} AUD`,
    `https://techseller.app/product/${p.id}`,
    p.image || 'https://techseller.app/placeholder.jpg',
    p.name.split(' ')[0],
    p.specs?.MPN || p.id
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
