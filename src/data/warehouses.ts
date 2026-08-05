import { WarehouseLocation } from '../types';

export const INITIAL_WAREHOUSES: WarehouseLocation[] = [
  {
    id: 'wh-main',
    code: 'WH-MAIN',
    name: 'Main Logistics Hub',
    address: 'Building 4, 100 Logistics Way, Sydney NSW 2000',
    contactPerson: 'Dave Miller',
    phone: '02 9876 5432',
    email: 'warehouse@techseller.com.au',
    isDefault: true,
    bins: [
      { id: 'bin-a01-01', code: 'A-01-01', zone: 'Zone A', rack: 'Rack 1', shelf: 'Shelf 1', binNumber: '01', notes: 'High-value laptops' },
      { id: 'bin-a01-02', code: 'A-01-02', zone: 'Zone A', rack: 'Rack 1', shelf: 'Shelf 1', binNumber: '02', notes: 'Refurbished desktops' },
      { id: 'bin-b02-10', code: 'B-02-10', zone: 'Zone B', rack: 'Rack 2', shelf: 'Shelf 2', binNumber: '10', notes: 'Monitors & Displays' },
    ]
  },
  {
    id: 'wh-showroom',
    code: 'WH-SHOWROOM',
    name: 'Sydney Retail Showroom',
    address: '456 Velvet Boulevard, Sydney NSW 2000',
    contactPerson: 'Sarah Jenkins',
    phone: '02 9123 4567',
    email: 'showroom@techseller.com.au',
    isDefault: false,
    bins: [
      { id: 'bin-sr-front', code: 'SR-FRONT-01', zone: 'Showroom Front', rack: 'Display 1', shelf: 'Shelf A', binNumber: '01', notes: 'Display stock' },
      { id: 'bin-sr-back', code: 'SR-BACK-02', zone: 'Showroom Store', rack: 'Rack S1', shelf: 'Shelf 1', binNumber: '02', notes: 'Retail reserve' },
    ]
  },
  {
    id: 'wh-repair',
    code: 'WH-REPAIR',
    name: 'Service & Repair Bay',
    address: 'Tech Seller Service Centre, Unit 2, Sydney NSW 2000',
    contactPerson: 'Alex Chen',
    phone: '02 9555 8899',
    email: 'repairs@techseller.com.au',
    isDefault: false,
    bins: [
      { id: 'bin-rep-in', code: 'REP-INTAKE', zone: 'Intake Bay', rack: 'Rack R1', shelf: 'Shelf A', binNumber: '01', notes: 'Awaiting diagnosis' },
      { id: 'bin-rep-parts', code: 'REP-PARTS', zone: 'Parts Storage', rack: 'Rack R2', shelf: 'Shelf B', binNumber: '05', notes: 'Spare components' },
    ]
  }
];
