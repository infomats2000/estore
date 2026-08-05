import { EnterpriseSupplierScorecard } from '../types';

export const DEFAULT_ENTERPRISE_SUPPLIERS: EnterpriseSupplierScorecard[] = [
  {
    id: 'SUP-DELL-US',
    supplierName: 'Dell Technologies Global (USA Direct)',
    code: 'DELL-US-001',
    avgLeadTimeDays: 14,
    overallPerformanceScore: 98,
    defectRatePercent: 0.4,
    deliveryAccuracyPercent: 98.5,
    onTimeDeliveryRatePercent: 97.2,
    assignedAccountManager: 'Robert Vance (VP Global Channels)',
    contracts: [
      {
        contractId: 'CON-DELL-2026',
        title: 'Master Supply & OEM Hardware Agreement 2026',
        startDate: '2026-01-01',
        expiryDate: '2027-12-31',
        minimumSpendAUD: 500000.00,
        currentSpendAUD: 342000.00,
        discountTier: 'Diamond Tier (28% Wholesale Discount)',
        status: 'Active Agreement'
      }
    ],
    priceHistory: [
      { id: 'PH-101', sku: 'SKU-100042', productName: 'Dell Latitude 5420 Laptop i7', date: '2026-08-01', priceAUD: 1415.38, changePercent: -1.2 },
      { id: 'PH-102', sku: 'SKU-100042', productName: 'Dell Latitude 5420 Laptop i7', date: '2026-05-15', priceAUD: 1432.00, changePercent: 0.0 }
    ]
  },
  {
    id: 'SUP-CISCO-SG',
    supplierName: 'Cisco Systems Asia Pacific (Singapore)',
    code: 'CISCO-AP-002',
    avgLeadTimeDays: 10,
    overallPerformanceScore: 96,
    defectRatePercent: 0.2,
    deliveryAccuracyPercent: 99.1,
    onTimeDeliveryRatePercent: 98.0,
    assignedAccountManager: 'Jennifer Tan (APAC Distribution Lead)',
    contracts: [
      {
        contractId: 'CON-CISCO-2026',
        title: 'Networking & Enterprise Security Master Agreement',
        startDate: '2026-02-15',
        expiryDate: '2028-02-14',
        minimumSpendAUD: 350000.00,
        currentSpendAUD: 210000.00,
        discountTier: 'Gold Partner (25% Wholesale Discount)',
        status: 'Active Agreement'
      }
    ],
    priceHistory: [
      { id: 'PH-201', sku: 'SKU-200088', productName: 'Cisco Catalyst 9300 Switch', date: '2026-07-20', priceAUD: 3230.77, changePercent: -2.5 }
    ]
  }
];

export function calculateWeightedSupplierScore(
  deliveryAccuracyPercent: number,
  defectRatePercent: number,
  avgLeadTimeDays: number
): number {
  // Score formula:
  // Delivery Accuracy (40% weight) -> max 40
  // Defect Rate (30% weight) -> 0% defect = 30 pts, -5 pts per 1% defect
  // Lead Time Adherence (30% weight) -> <=7 days = 30 pts, <=14 days = 25 pts, >14 days = 20 pts
  
  const accuracyPts = (deliveryAccuracyPercent / 100) * 40;
  const defectPts = Math.max(0, 30 - (defectRatePercent * 5));
  const leadTimePts = avgLeadTimeDays <= 7 ? 30 : avgLeadTimeDays <= 14 ? 25 : 20;

  return Math.min(100, Math.round(accuracyPts + defectPts + leadTimePts));
}
