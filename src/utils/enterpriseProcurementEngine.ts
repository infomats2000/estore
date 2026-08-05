import { EnterpriseProcurementRFQ } from '../types';

export const DEFAULT_PROCUREMENT_RFQS: EnterpriseProcurementRFQ[] = [
  {
    id: 'RFQ-2026-9901',
    title: '100x Enterprise Laptop Procurement',
    targetSKU: 'SKU-100042 (Dell Latitude 5420 i7)',
    requestedQty: 100,
    targetDeliveryDate: '2026-08-20',
    status: 'Comparison',
    winningSupplierId: 'SUP-DELL-US',
    quotes: [
      {
        supplierId: 'SUP-DELL-US',
        supplierName: 'Dell Technologies Global (USA Direct)',
        quotedUnitPrice: 920.00,
        currency: 'USD',
        fxRate: 0.65, // 1 AUD = 0.65 USD -> $920 / 0.65 = $1415.38 AUD
        unitPriceAUD: 1415.38,
        leadTimeDays: 14,
        paymentTerms: 'Net 30 Trade Credit',
        qualityScore: 98
      },
      {
        supplierId: 'SUP-SYNNEX-AU',
        supplierName: 'Synnex Australia Wholesale',
        quotedUnitPrice: 1440.00,
        currency: 'AUD',
        fxRate: 1.00,
        unitPriceAUD: 1440.00,
        leadTimeDays: 3,
        paymentTerms: 'Net 14 Direct Debit',
        qualityScore: 95
      },
      {
        supplierId: 'SUP-INGRAM-HK',
        supplierName: 'Ingram Micro Asia Pacific (HK)',
        quotedUnitPrice: 7200.00,
        currency: 'HKD',
        fxRate: 5.10, // $7200 / 5.10 = $1411.76 AUD
        unitPriceAUD: 1411.76,
        leadTimeDays: 21,
        paymentTerms: 'Letter of Credit (LC)',
        qualityScore: 92
      }
    ],
    poTotalAUD: 141538.00,
    freightCostAUD: 6200.00,
    dutyTaxAUD: 4850.00,
    customsChargesAUD: 1200.00,
    allocatedLandedCostPerUnit: 122.50 // (6200 + 4850 + 1200) / 100
  },
  {
    id: 'RFQ-2026-8802',
    title: '50x Cisco Catalyst 9300 Switches',
    targetSKU: 'SKU-200088 (Cisco Catalyst 9300 48-Port)',
    requestedQty: 50,
    targetDeliveryDate: '2026-09-01',
    status: 'Pending Manager Approval',
    winningSupplierId: 'SUP-CISCO-SG',
    quotes: [
      {
        supplierId: 'SUP-CISCO-SG',
        supplierName: 'Cisco Systems Asia Pacific (Singapore)',
        quotedUnitPrice: 2100.00,
        currency: 'USD',
        fxRate: 0.65,
        unitPriceAUD: 3230.77,
        leadTimeDays: 10,
        paymentTerms: 'Net 60 Master Contract',
        qualityScore: 99
      }
    ],
    poTotalAUD: 161538.50,
    freightCostAUD: 3100.00,
    dutyTaxAUD: 2400.00,
    customsChargesAUD: 850.00,
    allocatedLandedCostPerUnit: 127.00
  }
];

export function calculateLandedCostAllocation(
  baseTotalAUD: number,
  freightCostAUD: number,
  dutyTaxAUD: number,
  customsChargesAUD: number,
  totalUnits: number
): { totalLandedCostAUD: number; landedCostPerUnit: number; totalCostAUD: number; finalUnitCOGS: number } {
  const totalLandedCostAUD = freightCostAUD + dutyTaxAUD + customsChargesAUD;
  const landedCostPerUnit = totalUnits > 0 ? Math.round((totalLandedCostAUD / totalUnits) * 100) / 100 : 0;
  const totalCostAUD = baseTotalAUD + totalLandedCostAUD;
  const baseUnitCost = totalUnits > 0 ? baseTotalAUD / totalUnits : 0;
  const finalUnitCOGS = Math.round((baseUnitCost + landedCostPerUnit) * 100) / 100;

  return {
    totalLandedCostAUD,
    landedCostPerUnit,
    totalCostAUD,
    finalUnitCOGS
  };
}
