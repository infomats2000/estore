import { MassiveStockSKU } from '../types';

export const DEFAULT_MASSIVE_SKUS: MassiveStockSKU[] = [
  {
    id: 'MSKU-100042',
    skuCode: 'SKU-100042',
    productName: 'Dell Latitude 5420 Laptop i7 16GB',
    category: 'Laptops',
    warehouseId: 'WH-SYD-MAIN',
    warehouseName: 'Sydney Central Distribution Hub (WH-001)',
    binLocation: 'Aisle A4-Bay 12-Shelf 3',
    palletId: 'PAL-9901-SYD',
    cartonBarcode: 'CARTON-8802931',
    containerNumber: 'MSKU-889102-3 (40ft Container)',
    batchLotNumber: 'LOT-2026-B10',
    serialNumbers: ['DL-889102-01', 'DL-889102-02', 'DL-889102-03', 'DL-889102-04'],
    rfidTag: 'RFID-990812-PASSIVE',
    barcode: '9312345678901',
    qrCode: 'QR-ASSET-DELL-5420',
    expiryDate: '2028-12-31',
    onHandStock: 50,
    reservedStock: 10,
    transitStock: 5,
    incomingStock: 20,
    availableStock: 65, // 50 - 10 + 5 + 20
    isVMI: false
  },
  {
    id: 'MSKU-200088',
    skuCode: 'SKU-200088',
    productName: 'Cisco Catalyst 9300 48-Port PoE+ Switch',
    category: 'Networking',
    warehouseId: 'WH-MEL-DEPOT',
    warehouseName: 'Melbourne CBD Warehouse (WH-002)',
    binLocation: 'Aisle B2-Bay 08-Shelf 1',
    palletId: 'PAL-4402-MEL',
    cartonBarcode: 'CARTON-9912044',
    containerNumber: 'HLAG-441029-1 (20ft Container)',
    batchLotNumber: 'LOT-2026-C15',
    serialNumbers: ['CS-9300-8801', 'CS-9300-8802'],
    rfidTag: 'RFID-441209-ACTIVE',
    barcode: '9319876543210',
    qrCode: 'QR-ASSET-CISCO-9300',
    expiryDate: '2030-06-30',
    onHandStock: 25,
    reservedStock: 5,
    transitStock: 0,
    incomingStock: 15,
    availableStock: 35,
    isVMI: true,
    vmiVendorName: 'Cisco Systems Direct Consignment'
  },
  {
    id: 'MSKU-300150',
    skuCode: 'SKU-300150',
    productName: 'NVIDIA GeForce RTX 5070 12GB GPU',
    category: 'Graphics Cards',
    warehouseId: 'WH-SYD-MAIN',
    warehouseName: 'Sydney Central Distribution Hub (WH-001)',
    binLocation: 'Aisle C1-Bay 04-Shelf 2',
    palletId: 'PAL-8810-SYD',
    cartonBarcode: 'CARTON-1102938',
    batchLotNumber: 'LOT-2026-NVID50',
    serialNumbers: ['NV-5070-9901', 'NV-5070-9902', 'NV-5070-9903'],
    rfidTag: 'RFID-771204-PASSIVE',
    barcode: '9314567890123',
    qrCode: 'QR-ASSET-NV-5070',
    onHandStock: 45,
    reservedStock: 15,
    transitStock: 10,
    incomingStock: 30,
    availableStock: 70,
    isVMI: false
  }
];

export function searchMassiveSKUs(
  query: string,
  warehouseFilter: string = 'All',
  skus: MassiveStockSKU[] = DEFAULT_MASSIVE_SKUS
): MassiveStockSKU[] {
  return skus.filter(item => {
    const q = query.toLowerCase();
    const matchesSearch = !query || 
      item.skuCode.toLowerCase().includes(q) ||
      item.productName.toLowerCase().includes(q) ||
      item.barcode.includes(q) ||
      (item.rfidTag && item.rfidTag.toLowerCase().includes(q)) ||
      (item.palletId && item.palletId.toLowerCase().includes(q)) ||
      (item.binLocation && item.binLocation.toLowerCase().includes(q));

    const matchesWarehouse = warehouseFilter === 'All' || item.warehouseId === warehouseFilter;

    return matchesSearch && matchesWarehouse;
  });
}
