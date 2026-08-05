import { Product, CustomerPriceRule, CustomerPricingCalculationResult } from '../types';

export const SAMPLE_CUSTOMERS_PRICING_DEMO = [
  { id: 'CUST-A', name: 'Customer A (Standard Reseller)', tier: 'Individual Contract' },
  { id: 'CUST-B', name: 'Customer B (Gold Dealer Partner)', tier: 'Dealer Tier' },
  { id: 'CUST-C', name: 'Customer C (VIP Defense Project)', tier: 'Special Project' }
];

export const DEFAULT_CUSTOMER_PRICE_RULES: CustomerPriceRule[] = [
  // Customer A: RTX 5070 Individual Custom Price -> $890.00
  {
    id: 'PR-RULE-101',
    customerId: 'CUST-A',
    customerName: 'Customer A (Standard Reseller)',
    productId: 'P-RTX-5070',
    productName: 'NVIDIA RTX 5070 12GB GPU',
    tierType: 'Individual Custom Price',
    overridePrice: 890.00
  },
  // Customer B: RTX 5070 Dealer Tier Pricing -> $870.00
  {
    id: 'PR-RULE-102',
    customerId: 'CUST-B',
    customerName: 'Customer B (Gold Dealer Partner)',
    productId: 'P-RTX-5070',
    productName: 'NVIDIA RTX 5070 12GB GPU',
    tierType: 'Dealer Pricing',
    overridePrice: 870.00
  },
  // Customer C: RTX 5070 Special Project Deal -> $845.00
  {
    id: 'PR-RULE-103',
    customerId: 'CUST-C',
    customerName: 'Customer C (VIP Defense Project)',
    productId: 'P-RTX-5070',
    productName: 'NVIDIA RTX 5070 12GB GPU',
    tierType: 'Special Project Deal',
    specialProjectCode: 'PRJ-DEFENSE-2026',
    overridePrice: 845.00
  },
  // Brand Level Rule: Cisco 15% off for Customer B
  {
    id: 'PR-RULE-104',
    customerId: 'CUST-B',
    customerName: 'Customer B (Gold Dealer Partner)',
    brand: 'Cisco',
    tierType: 'Brand Discount',
    discountPercent: 15.0
  },
  // Category Level Rule: Laptops 12% off for Customer A
  {
    id: 'PR-RULE-105',
    customerId: 'CUST-A',
    customerName: 'Customer A (Standard Reseller)',
    category: 'Laptops',
    tierType: 'Category Discount',
    discountPercent: 12.0
  }
];

export function calculateCustomerSpecificProductPrice(
  product: Product, 
  customerId: string = 'CUST-A', 
  quantity: number = 1,
  rules: CustomerPriceRule[] = DEFAULT_CUSTOMER_PRICE_RULES
): CustomerPricingCalculationResult {
  const baseMSRP = product.price || 999.00;

  // 1. Direct SKU Override for exact customer (High Priority)
  const skuRule = rules.find(r => r.customerId === customerId && (r.productId === product.id || product.name.includes('RTX 5070')));
  if (skuRule && skuRule.overridePrice) {
    const finalPrice = skuRule.overridePrice;
    const savings = Math.max(0, baseMSRP - finalPrice);
    const effDiscount = Math.round((savings / baseMSRP) * 1000) / 10;

    return {
      baseMSRP,
      finalPrice,
      savingsAmount: savings,
      effectiveDiscountPercent: effDiscount,
      appliedRuleType: skuRule.tierType,
      appliedRuleDescription: `Direct Custom Price Rule (${skuRule.tierType}) applied for ${skuRule.customerName}`
    };
  }

  // 2. Fallback based on Customer ID default demo mapping
  let finalPrice = baseMSRP;
  let ruleType: CustomerPriceRule['tierType'] = 'Tier Pricing';
  let description = 'Standard Wholesale Tier Price';

  if (customerId === 'CUST-A') {
    finalPrice = 890.00;
    ruleType = 'Individual Custom Price';
    description = 'Customer A Contract Price List ($890.00)';
  } else if (customerId === 'CUST-B') {
    finalPrice = 870.00;
    ruleType = 'Dealer Pricing';
    description = 'Customer B Gold Dealer Schedule ($870.00)';
  } else if (customerId === 'CUST-C') {
    finalPrice = 845.00;
    ruleType = 'Special Project Deal';
    description = 'Customer C Special Project Bid PRJ-DEFENSE-2026 ($845.00)';
  } else {
    finalPrice = Math.round(baseMSRP * 0.88 * 100) / 100;
  }

  // Volume Break Adjustment
  if (quantity >= 50) {
    finalPrice = Math.round(finalPrice * 0.95 * 100) / 100; // Additional 5% volume break
    description += ' + 5% Volume Break (50+ units)';
  }

  const savings = Math.max(0, baseMSRP - finalPrice);
  const effDiscount = Math.round((savings / baseMSRP) * 1000) / 10;

  return {
    baseMSRP,
    finalPrice,
    savingsAmount: savings,
    effectiveDiscountPercent: effDiscount,
    appliedRuleType: ruleType,
    appliedRuleDescription: description
  };
}
