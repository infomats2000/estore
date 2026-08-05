import { CommercialSalesOrder } from '../types';

export const DEFAULT_COMMERCIAL_SALES_ORDERS: CommercialSalesOrder[] = [
  {
    id: 'QT-2026-9901',
    orderType: 'Quotation',
    paymentCategory: 'Credit Sale (Net 30)',
    fulfillmentMode: 'Standard Single Shipment',
    customerId: 'CUST-APEX-01',
    customerName: 'Apex Technology Solutions',
    companyName: 'Apex Technology Solutions Pty Ltd',
    contractPriceTier: 'Gold Reseller Tier (25% Off)',
    items: [
      { productId: 'P-101', productName: 'Dell Latitude 5420 Laptop i7', orderedQty: 20, shippedQty: 0, backorderQty: 0, unitPrice: 1425.00, totalPrice: 28500.00 },
      { productId: 'P-102', productName: 'Dell WD19TBS Thunderbolt Dock', orderedQty: 20, shippedQty: 0, backorderQty: 0, unitPrice: 280.00, totalPrice: 5600.00 }
    ],
    subtotal: 34100.00,
    tax: 3410.00,
    total: 37510.00,
    status: 'Quotation Draft',
    date: '2026-08-05'
  },
  {
    id: 'PI-2026-8802',
    orderType: 'Proforma Invoice',
    paymentCategory: 'Cash / Pre-Paid',
    fulfillmentMode: 'Split Warehouse Shipment',
    customerId: 'CUST-NEXTGEN-02',
    customerName: 'NextGen IT Resellers',
    companyName: 'NextGen IT Resellers Ltd',
    contractPriceTier: 'MSP Partner Tier (20% Off)',
    items: [
      { productId: 'P-103', productName: 'Cisco Catalyst 9300 48-Port Switch', orderedQty: 5, shippedQty: 3, backorderQty: 2, unitPrice: 3200.00, totalPrice: 16000.00 }
    ],
    subtotal: 16000.00,
    tax: 1600.00,
    total: 17600.00,
    status: 'Proforma Sent',
    date: '2026-08-04'
  },
  {
    id: 'BO-2026-7703',
    orderType: 'Blanket Order',
    paymentCategory: 'Credit Sale (Net 60)',
    fulfillmentMode: 'Partial Shipment',
    customerId: 'CUST-EDU-03',
    customerName: 'NSW Dept of Education',
    companyName: 'Government Education Procurement',
    contractPriceTier: 'Government / EDU Contract Tier (30% Off)',
    blanketCommitmentUnits: 200,
    blanketRemainingUnits: 120,
    items: [
      { productId: 'P-104', productName: 'Lenovo ThinkPad T14 Gen 4', orderedQty: 200, shippedQty: 80, backorderQty: 0, unitPrice: 1200.00, totalPrice: 240000.00 }
    ],
    subtotal: 240000.00,
    tax: 24000.00,
    total: 264000.00,
    status: 'Partially Shipped',
    date: '2026-07-15'
  },
  {
    id: 'DS-2026-6604',
    orderType: 'Drop Ship Order',
    paymentCategory: 'Credit Sale (Net 30)',
    fulfillmentMode: 'Direct Vendor Drop Ship',
    customerId: 'CUST-SYS-04',
    customerName: 'CyberCore Systems',
    companyName: 'CyberCore System Integrators',
    contractPriceTier: 'System Integrator Tier (22% Off)',
    dropShipClientAddress: 'Client Site: Level 12, 100 Miller St, North Sydney NSW 2060',
    items: [
      { productId: 'P-105', productName: 'HP ProLiant DL380 Gen10 Server', orderedQty: 2, shippedQty: 2, backorderQty: 0, unitPrice: 8500.00, totalPrice: 17000.00 }
    ],
    subtotal: 17000.00,
    tax: 1700.00,
    total: 18700.00,
    status: 'Approved Order',
    date: '2026-08-03'
  },
  {
    id: 'SO-2026-5505',
    orderType: 'Standing Order',
    paymentCategory: 'Credit Sale (Net 30)',
    fulfillmentMode: 'Standard Single Shipment',
    customerId: 'CUST-MSP-05',
    customerName: 'CloudNet Managed Services',
    companyName: 'CloudNet MSP Australia',
    contractPriceTier: 'MSP Partner Tier (20% Off)',
    standingFrequency: 'Monthly on 1st Business Day',
    items: [
      { productId: 'P-106', productName: 'Fortinet FortiGate 60F Firewall', orderedQty: 10, shippedQty: 10, backorderQty: 0, unitPrice: 950.00, totalPrice: 9500.00 }
    ],
    subtotal: 9500.00,
    tax: 950.00,
    total: 10450.00,
    status: 'Completed',
    date: '2026-08-01'
  }
];

export function convertQuoteToSalesOrder(quoteId: string, orders: CommercialSalesOrder[]): CommercialSalesOrder[] {
  return orders.map(o => {
    if (o.id === quoteId) {
      return {
        ...o,
        orderType: 'Sales Order',
        status: 'Approved Order',
        id: 'SO-' + o.id.replace('QT-', '')
      };
    }
    return o;
  });
}

export function duplicateRepeatOrder(order: CommercialSalesOrder): CommercialSalesOrder {
  return {
    ...order,
    id: 'SO-RPT-' + Math.floor(Math.random() * 9000 + 1000),
    orderType: 'Sales Order',
    status: 'Approved Order',
    date: new Date().toISOString().split('T')[0]
  };
}
