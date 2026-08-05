import { Product, CustomerProfile, PriceTierType } from '../types';

export interface CalculatedPrice {
  unitPrice: number;
  originalPrice: number;
  lineTotal: number;
  unitDiscount: number;
  discountLabel: string;
  tierApplied?: PriceTierType;
  isVolumeDiscount: boolean;
  volumeDiscountPercent?: number;
}

export const TIER_DISCOUNT_PERCENTAGES: Record<PriceTierType, number> = {
  Retail: 0,
  Reseller: 10,
  Wholesale: 15,
  Government: 18
};

/**
 * Calculates effective unit price for a product given a customer's trade tier, custom discount, and order quantity.
 */
export function calculateEffectivePrice(
  product: Product,
  customer?: CustomerProfile | null,
  quantity: number = 1
): CalculatedPrice {
  const basePrice = product.discountPrice && product.discountPrice < product.price 
    ? product.discountPrice 
    : product.price;

  let currentUnitPrice = basePrice;
  let tierApplied: PriceTierType | undefined = undefined;
  let discountLabel = '';
  let isVolumeDiscount = false;
  let volumeDiscountPercent = 0;

  // 1. Determine Tier Pricing
  const priceTier: PriceTierType | undefined = customer?.tradeAccount?.priceTier 
    || (customer?.type === 'Wholesale' ? 'Wholesale' : undefined);

  if (priceTier && priceTier !== 'Retail') {
    tierApplied = priceTier;
    // Check per-product tier price override first
    const overrideTierPrice = product.tierPrices?.[priceTier as keyof typeof product.tierPrices];
    if (typeof overrideTierPrice === 'number' && overrideTierPrice > 0) {
      currentUnitPrice = overrideTierPrice;
      discountLabel = `${priceTier} Tier Price`;
    } else {
      const tierPercent = TIER_DISCOUNT_PERCENTAGES[priceTier] || 0;
      currentUnitPrice = basePrice * (1 - tierPercent / 100);
      discountLabel = `${priceTier} Tier (${tierPercent}% off)`;
    }
  }

  // 2. Custom Trade Discount (if customer has specific custom discount %)
  if (customer?.tradeAccount?.customDiscountPercent && customer.tradeAccount.customDiscountPercent > 0) {
    const customPercent = customer.tradeAccount.customDiscountPercent;
    currentUnitPrice = currentUnitPrice * (1 - customPercent / 100);
    discountLabel += ` + Custom ${customPercent}%`;
  }

  // 3. Volume / Quantity Break Discounts
  if (product.volumeDiscounts && product.volumeDiscounts.length > 0 && quantity > 1) {
    // Sort descending by minQty to find the largest qualifying threshold
    const sortedBreaks = [...product.volumeDiscounts].sort((a, b) => b.minQty - a.minQty);
    const matchedBreak = sortedBreaks.find(b => quantity >= b.minQty);

    if (matchedBreak) {
      if (typeof matchedBreak.unitPrice === 'number' && matchedBreak.unitPrice > 0) {
        if (matchedBreak.unitPrice < currentUnitPrice) {
          currentUnitPrice = matchedBreak.unitPrice;
          isVolumeDiscount = true;
          discountLabel = `Volume Break (${matchedBreak.minQty}+ units)`;
        }
      } else if (typeof matchedBreak.discountPercent === 'number' && matchedBreak.discountPercent > 0) {
        const volumePrice = currentUnitPrice * (1 - matchedBreak.discountPercent / 100);
        if (volumePrice < currentUnitPrice) {
          currentUnitPrice = volumePrice;
          isVolumeDiscount = true;
          volumeDiscountPercent = matchedBreak.discountPercent;
          discountLabel = `Volume Break ${matchedBreak.minQty}+ (${matchedBreak.discountPercent}% off)`;
        }
      }
    }
  }

  // Ensure two decimal precision rounding
  currentUnitPrice = Math.round(currentUnitPrice * 100) / 100;
  const unitDiscount = Math.max(0, Math.round((product.price - currentUnitPrice) * 100) / 100);
  const lineTotal = Math.round(currentUnitPrice * quantity * 100) / 100;

  return {
    unitPrice: currentUnitPrice,
    originalPrice: product.price,
    lineTotal,
    unitDiscount,
    discountLabel: discountLabel || 'Standard Price',
    tierApplied,
    isVolumeDiscount,
    volumeDiscountPercent
  };
}

/**
 * Returns available credit limit for a customer trade account.
 */
export function getAvailableCredit(customer?: CustomerProfile | null): number {
  if (!customer?.tradeAccount) return 0;
  const limit = customer.tradeAccount.creditLimit || 0;
  const balance = customer.tradeAccount.creditBalance || 0;
  return Math.max(0, Math.round((limit - balance) * 100) / 100);
}

/**
 * Checks if a customer trade account is on credit hold or suspended.
 */
export function isCreditHold(customer?: CustomerProfile | null): boolean {
  if (!customer?.tradeAccount) return false;
  return customer.tradeAccount.status === 'Credit Hold' || customer.tradeAccount.status === 'Suspended';
}
