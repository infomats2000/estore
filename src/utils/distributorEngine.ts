import { CustomerPriceMatrixRule, ContainerShipmentPO, ResellerPartnerProfile, Product } from '../types';

export const DEFAULT_PRICE_MATRIX_RULES: CustomerPriceMatrixRule[] = [
  { id: 'TIER-GOLD', tierName: 'Gold Reseller Tier', discountPercent: 25.0, minOrderQty: 1, applicableCategory: 'All' },
  { id: 'TIER-SILVER', tierName: 'Silver Reseller Tier', discountPercent: 18.0, minOrderQty: 1, applicableCategory: 'All' },
  { id: 'TIER-MSP', tierName: 'MSP Partner Tier', discountPercent: 20.0, minOrderQty: 1, applicableCategory: 'All' },
  { id: 'TIER-SI', tierName: 'System Integrator Tier', discountPercent: 22.0, minOrderQty: 1, applicableCategory: 'All' },
  { id: 'TIER-BULK50', tierName: 'Bulk Volume Break (50+ Units)', discountPercent: 30.0, minOrderQty: 50, applicableCategory: 'All' }
];

export const DEFAULT_CONTAINER_SHIPMENTS: ContainerShipmentPO[] = [
  {
    id: 'PO-CONT-8891',
    containerNumber: 'MSKU-889102-3 (40ft High Cube)',
    palletsCount: 24,
    customsClearanceCode: 'CUST-AU-9982103',
    dutyTaxAmount: 4850.00,
    freightCost: 6200.00,
    etaPortDate: '2026-08-12',
    status: 'In Transit Sea'
  },
  {
    id: 'PO-CONT-9942',
    containerNumber: 'HLAG-441029-1 (20ft Standard)',
    palletsCount: 12,
    customsClearanceCode: 'CUST-AU-1102934',
    dutyTaxAmount: 2400.00,
    freightCost: 3100.00,
    etaPortDate: '2026-08-04',
    status: 'Cleared Port'
  }
];

export const DEFAULT_RESELLER_PARTNERS: ResellerPartnerProfile[] = [
  {
    id: 'RSL-APEX-01',
    businessName: 'Apex Technology Solutions Pty Ltd',
    abn: '45 123 456 789',
    sector: 'IT Wholesaler',
    priceTier: 'Gold Reseller Tier',
    creditLimit: 100000.00,
    availableCredit: 74200.00,
    paymentTerms: 'Net 30',
    monthlyTarget: 50000.00,
    currentMonthSpend: 25800.00,
    assignedAccountManager: 'Sarah Jenkins (Senior Distribution Manager)'
  },
  {
    id: 'RSL-NEXTGEN-02',
    businessName: 'NextGen IT Resellers Ltd',
    abn: '12 345 678 901',
    sector: 'MSP Supplier',
    priceTier: 'MSP Partner Tier',
    creditLimit: 50000.00,
    availableCredit: 38200.00,
    paymentTerms: 'Net 30',
    monthlyTarget: 25000.00,
    currentMonthSpend: 11800.00,
    assignedAccountManager: 'David Chen (Channel Sales Executive)'
  }
];

export function calculateContractPrice(
  product: Product, 
  priceTier: string = 'Gold Reseller Tier', 
  quantity: number = 1
): { unitPrice: number; discountPercent: number; formatted: string } {
  let discount = 15.0; // default 15% wholesale discount

  if (priceTier.includes('Gold')) discount = 25.0;
  else if (priceTier.includes('Silver')) discount = 18.0;
  else if (priceTier.includes('MSP')) discount = 20.0;
  else if (priceTier.includes('System Integrator')) discount = 22.0;

  // Additional Volume Break discount
  if (quantity >= 50) {
    discount += 5.0; // Extra 5% for bulk orders
  }

  const unitPrice = Math.round(product.price * (1 - discount / 100) * 100) / 100;

  return {
    unitPrice,
    discountPercent: discount,
    formatted: `$${unitPrice.toFixed(2)} AUD (${discount}% Wholesale Off)`
  };
}
