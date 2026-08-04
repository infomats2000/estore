import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCustomInvoiceSyncPayload } from './customInvoice';

test('builds order, finance transactions, and inventory logs for custom invoices', () => {
  const invoice = {
    id: 'INV-TEST',
    invoiceNumber: 'INV-2026-10001',
    issueDate: '2026-08-03',
    dueDate: '2026-08-17',
    poNumber: 'PO-1001',
    status: 'Unpaid' as const,
    type: 'Tax Invoice' as const,
    customerName: 'Acme Corp',
    customerEmail: 'ops@acme.test',
    customerAddress: '1 Test St',
    customerCity: 'Sydney',
    items: [
      { productId: 'prod-1', description: 'Laptop', quantity: 2, unitPrice: 1000, amount: 2000, taxRate: 10 },
      { description: 'Service fee', quantity: 1, unitPrice: 150, amount: 150, taxRate: 10 }
    ],
    subtotal: 2150,
    tax: 215,
    shipping: 25,
    discount: 100,
    total: 2290,
    paymentMethod: 'EFT',
    paymentTerms: 'Net 14 Days',
    notes: 'Large order invoice'
  };

  const products = [
    { id: 'prod-1', name: 'Laptop', price: 1000, discountPrice: 1000, stock: 5, costPrice: 600, image: '', additionalImages: [], rating: 0, reviewsCount: 0, description: '', category: 'Electronics', specs: {}, tags: [] }
  ];

  const result = buildCustomInvoiceSyncPayload({
    invoice,
    products,
    orderId: 'ORD-CUSTOM-1',
    date: '2026-08-03'
  });

  assert.equal(result.order.customerName, 'Acme Corp');
  assert.equal(result.order.items[0].productId, 'prod-1');
  assert.equal(result.order.total, 2290);
  assert.equal(result.transactions[0].category, 'Sales');
  assert.equal(result.transactions[1].category, 'Discounts Given');
  assert.equal(result.transactions[2].category, 'Shipping Collected');
  assert.equal(result.transactions[3].category, 'Cost of Goods Sold (COGS)');
  assert.equal(result.inventoryLogs[0].qty, -2);
});
