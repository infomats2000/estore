import { WMSWarehouseZone, WMSShipmentPickTask, WMSCycleCountAudit } from '../types';

export const DEFAULT_WMS_ZONES: WMSWarehouseZone[] = [
  {
    zoneId: 'ZONE-A',
    zoneName: 'Zone A - Heavy Bulk Pallet Racking',
    aislesCount: 6,
    totalBins: 240,
    usedBins: 204,
    capacityUtilizationPercent: 85.0,
    primaryCategory: 'Laptops & Desktop Towers'
  },
  {
    zoneId: 'ZONE-B',
    zoneName: 'Zone B - Fast-Moving High Velocity Shelving',
    aislesCount: 8,
    totalBins: 400,
    usedBins: 248,
    capacityUtilizationPercent: 62.0,
    primaryCategory: 'GPUs, RAM, SSDs & Components'
  },
  {
    zoneId: 'ZONE-C',
    zoneName: 'Zone C - High Security Vault & Networking',
    aislesCount: 4,
    totalBins: 120,
    usedBins: 108,
    capacityUtilizationPercent: 90.0,
    primaryCategory: 'Enterprise Switches & Firewalls'
  },
  {
    zoneId: 'ZONE-D',
    zoneName: 'Zone D - Inbound Container Receiving Dock',
    aislesCount: 2,
    totalBins: 50,
    usedBins: 12,
    capacityUtilizationPercent: 24.0,
    primaryCategory: 'Unprocessed Sea Freight GRNs'
  }
];

export const DEFAULT_PICKING_TASKS: WMSShipmentPickTask[] = [
  {
    id: 'PICK-9901',
    orderId: 'SO-2026-104',
    customerName: 'Apex Technology Solutions',
    strategy: 'Wave Picking',
    targetZone: 'Zone B - High Velocity',
    items: [
      { sku: 'SKU-100042', productName: 'Dell Latitude 5420 Laptop', binLocation: 'Aisle A4-Bay 12-Shelf 3', requestedQty: 10, pickedQty: 10, barcode: '9312345678901' },
      { sku: 'SKU-300150', productName: 'NVIDIA RTX 5070 12GB GPU', binLocation: 'Aisle C1-Bay 04-Shelf 2', requestedQty: 5, pickedQty: 5, barcode: '9314567890123' }
    ],
    status: 'In Progress',
    assignedPicker: 'Marcus Vance (Senior Floor Picker)',
    createdAt: '2026-08-05T09:30:00Z'
  },
  {
    id: 'PICK-8802',
    orderId: 'SO-2026-205',
    customerName: 'NextGen IT Resellers',
    strategy: 'Zone Picking',
    targetZone: 'Zone C - High Security Vault',
    items: [
      { sku: 'SKU-200088', productName: 'Cisco Catalyst 9300 Switch', binLocation: 'Aisle B2-Bay 08-Shelf 1', requestedQty: 2, pickedQty: 0, barcode: '9319876543210' }
    ],
    status: 'Pending',
    assignedPicker: 'Sarah Jenkins (Zone C Specialist)',
    createdAt: '2026-08-05T10:15:00Z'
  },
  {
    id: 'PICK-7703',
    orderId: 'BATCH-ORDER-MULTI-01',
    customerName: 'Consolidated B2B Batch Dispatch',
    strategy: 'Batch Picking',
    targetZone: 'Zone A & B Combined',
    items: [
      { sku: 'SKU-100042', productName: 'Dell Latitude 5420 Laptop', binLocation: 'Aisle A4-Bay 12-Shelf 3', requestedQty: 25, pickedQty: 25, barcode: '9312345678901' }
    ],
    status: 'Packed',
    assignedPicker: 'David Chen (Batch Runner)',
    createdAt: '2026-08-05T08:00:00Z'
  }
];

export const DEFAULT_CYCLE_AUDITS: WMSCycleCountAudit[] = [
  {
    id: 'AUDIT-901',
    warehouseName: 'Sydney Central WH-001',
    binLocation: 'Aisle A4-Bay 12-Shelf 3',
    skuCode: 'SKU-100042',
    systemQty: 50,
    countedQty: 52,
    varianceQty: +2,
    auditorName: 'Marcus Vance',
    status: 'Pending Audit'
  },
  {
    id: 'AUDIT-902',
    warehouseName: 'Melbourne CBD WH-002',
    binLocation: 'Aisle B2-Bay 08-Shelf 1',
    skuCode: 'SKU-200088',
    systemQty: 25,
    countedQty: 25,
    varianceQty: 0,
    auditorName: 'Sarah Jenkins',
    status: 'Reconciled'
  }
];
