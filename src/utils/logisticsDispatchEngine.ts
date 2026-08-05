import { LogisticsDispatchPlan, LogisticsCarrier } from '../types';

export const DEFAULT_DISPATCH_PLANS: LogisticsDispatchPlan[] = [
  {
    id: 'DISP-2026-9901',
    orderId: 'SO-2026-104',
    customerName: 'Apex Technology Solutions',
    deliveryAddress: 'Level 12, 100 Miller St, North Sydney NSW 2060',
    carrier: 'Toll Priority',
    trackingNumber: 'TRK-AU-8891023',
    scheduledDeliveryTime: '2026-08-06T10:30:00Z',
    weightKg: 45.0,
    volumeCbm: 0.35,
    distanceKm: 18.5,
    routeSequenceIndex: 1, // Stop #1 on driver route
    freightCostAUD: 145.00,
    podSignatureName: 'David Miller',
    podTimestamp: '2026-08-05T14:20:00Z',
    status: 'Delivered'
  },
  {
    id: 'DISP-2026-8802',
    orderId: 'SO-2026-205',
    customerName: 'NextGen IT Resellers',
    deliveryAddress: 'Unit 4, 88 Collins St, Melbourne VIC 3000',
    carrier: 'Mainfreight Express',
    trackingNumber: 'TRK-AU-9912044',
    scheduledDeliveryTime: '2026-08-07T14:00:00Z',
    weightKg: 120.0,
    volumeCbm: 1.20,
    distanceKm: 875.0,
    routeSequenceIndex: 2,
    freightCostAUD: 380.00,
    status: 'In Transit'
  },
  {
    id: 'DISP-2026-7703',
    orderId: 'SO-2026-306',
    customerName: 'CyberCore Systems',
    deliveryAddress: 'Building 3, 200 Eagle St, Brisbane QLD 4000',
    carrier: 'DHL Express',
    trackingNumber: 'TRK-AU-7712044',
    scheduledDeliveryTime: '2026-08-08T09:00:00Z',
    weightKg: 85.0,
    volumeCbm: 0.80,
    distanceKm: 920.0,
    routeSequenceIndex: 3,
    freightCostAUD: 290.00,
    status: 'Scheduled'
  }
];

export function calculateFreightCost(
  weightKg: number,
  volumeCbm: number,
  carrier: LogisticsCarrier = 'Toll Priority',
  distanceKm: number = 20
): { cubicWeightKg: number; chargeableWeightKg: number; freightCostAUD: number } {
  // Cubic conversion standard: 1 CBM = 250 kg cubic weight
  const cubicWeightKg = Math.round(volumeCbm * 250 * 10) / 10;
  const chargeableWeightKg = Math.max(weightKg, cubicWeightKg);

  let baseRate = 35.00; // base callout fee
  let perKgRate = 1.20;

  if (carrier === 'Mainfreight Express') {
    baseRate = 60.00;
    perKgRate = 0.95;
  } else if (carrier === 'DHL Express') {
    baseRate = 75.00;
    perKgRate = 1.80;
  }

  const distanceFactor = distanceKm > 50 ? 1.5 : 1.0;
  const freightCostAUD = Math.round((baseRate + chargeableWeightKg * perKgRate * distanceFactor) * 100) / 100;

  return {
    cubicWeightKg,
    chargeableWeightKg,
    freightCostAUD
  };
}
