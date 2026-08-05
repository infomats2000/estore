import { StoreBranch, Product, RegionalPriceOverride, StockTransferOrder } from '../types';

export const DEFAULT_STORE_BRANCHES: StoreBranch[] = [
  {
    id: 'STORE-SYD-01',
    storeName: 'Sydney Flagship Store & HQ',
    code: 'SYD-01',
    region: 'Australia - NSW',
    currencySymbol: '$',
    currencyCode: 'AUD',
    currencyRateToAUD: 1.0,
    localTaxRatePercent: 10.0,
    defaultWarehouseId: 'WH-001',
    address: '100 George Street, Sydney NSW 2000',
    phone: '(02) 9876 5432',
    active: true
  },
  {
    id: 'STORE-MEL-02',
    storeName: 'Melbourne CBD Hardware Hub',
    code: 'MEL-02',
    region: 'Australia - VIC',
    currencySymbol: '$',
    currencyCode: 'AUD',
    currencyRateToAUD: 1.0,
    localTaxRatePercent: 10.0,
    defaultWarehouseId: 'WH-002',
    address: '350 Collins Street, Melbourne VIC 3000',
    phone: '(03) 8765 4321',
    active: true
  },
  {
    id: 'STORE-BNE-03',
    storeName: 'Brisbane Commercial B2B Center',
    code: 'BNE-03',
    region: 'Australia - QLD',
    currencySymbol: '$',
    currencyCode: 'AUD',
    currencyRateToAUD: 1.0,
    localTaxRatePercent: 10.0,
    defaultWarehouseId: 'WH-003',
    address: '120 Queen Street, Brisbane QLD 4000',
    phone: '(07) 7654 3210',
    active: true
  },
  {
    id: 'STORE-AKL-01',
    storeName: 'Auckland Direct New Zealand',
    code: 'AKL-01',
    region: 'New Zealand',
    currencySymbol: 'NZ$',
    currencyCode: 'NZD',
    currencyRateToAUD: 1.08,
    localTaxRatePercent: 15.0,
    defaultWarehouseId: 'WH-001',
    address: '45 Queen Street, Auckland 1010 NZ',
    phone: '+64 9 300 1234',
    active: true
  },
  {
    id: 'STORE-USA-01',
    storeName: 'United States Enterprise Hub',
    code: 'USA-01',
    region: 'United States',
    currencySymbol: 'US$',
    currencyCode: 'USD',
    currencyRateToAUD: 0.65,
    localTaxRatePercent: 8.25,
    defaultWarehouseId: 'WH-001',
    address: '500 Market Street, San Francisco CA 94105',
    phone: '+1 415 555 0199',
    active: true
  }
];

export function calculateRegionalPrice(
  product: Product, 
  store: StoreBranch, 
  overrides: RegionalPriceOverride[] = []
): { price: number; discountPrice?: number; formatted: string } {
  const override = overrides.find(o => o.productId === product.id && o.storeId === store.id);

  if (override) {
    return {
      price: override.regionalPrice,
      discountPrice: override.regionalDiscountPrice,
      formatted: `${store.currencySymbol}${override.regionalPrice.toFixed(2)} ${store.currencyCode}`
    };
  }

  // Convert AUD price to local currency using rate
  const basePrice = product.price * store.currencyRateToAUD;
  const baseDiscount = product.discountPrice ? product.discountPrice * store.currencyRateToAUD : undefined;

  return {
    price: Math.round(basePrice * 100) / 100,
    discountPrice: baseDiscount ? Math.round(baseDiscount * 100) / 100 : undefined,
    formatted: `${store.currencySymbol}${(baseDiscount || basePrice).toFixed(2)} ${store.currencyCode}`
  };
}

export function calculateLocalTax(subtotal: number, store: StoreBranch): { taxAmount: number; totalWithTax: number } {
  const taxAmount = Math.round(subtotal * (store.localTaxRatePercent / 100) * 100) / 100;
  return {
    taxAmount,
    totalWithTax: subtotal + taxAmount
  };
}
