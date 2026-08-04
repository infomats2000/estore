import { FinanceTransaction, Invoice, Order, Product } from '../types';

export interface CustomInvoiceSyncPayload {
  order: Order;
  transactions: FinanceTransaction[];
  inventoryLogs: Array<{
    id: string;
    timestamp: string;
    productName: string;
    item: string;
    type: 'sale' | 'restock' | 'adjustment';
    qty: number;
    user: string;
  }>;
  updatedProducts: Product[];
}

interface BuildCustomInvoiceSyncPayloadInput {
  invoice: Invoice;
  products: Product[];
  orderId: string;
  date: string;
  userLabel?: string;
}

export const buildCustomInvoiceSyncPayload = ({
  invoice,
  products,
  orderId,
  date,
  userLabel = 'Custom Invoice'
}: BuildCustomInvoiceSyncPayloadInput): CustomInvoiceSyncPayload => {
  const order: Order = {
    id: orderId,
    items: invoice.items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId as string,
        name: item.description,
        price: item.unitPrice,
        quantity: item.quantity,
        image: ''
      })),
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    shipping: invoice.shipping,
    discount: invoice.discount,
    total: invoice.total,
    status: 'Delivered',
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    customerAddress: invoice.customerAddress,
    customerCity: invoice.customerCity,
    customerPhone: invoice.customerPhone,
    date,
    paymentMethod: invoice.paymentMethod,
    invoiceNumber: invoice.invoiceNumber,
    poNumber: invoice.poNumber,
    notes: invoice.notes
  };

  const updatedProducts = products.map((product) => {
    const purchasedItem = invoice.items.find((item) => item.productId === product.id);
    if (!purchasedItem) return product;
    return {
      ...product,
      stock: Math.max(0, product.stock - purchasedItem.quantity),
      sales: (product.sales || 0) + purchasedItem.quantity
    };
  });

  const calculatedCogs = invoice.items.reduce((sum, item) => {
    if (!item.productId) return sum;
    const product = products.find((p) => p.id === item.productId);
    if (!product) return sum;
    const cost = product.costPrice || (product.price * 0.6);
    return sum + (cost * item.quantity);
  }, 0);

  const transactions: FinanceTransaction[] = [
    {
      id: `TX-CUST-SALES-${Date.now()}`,
      date,
      type: 'Income',
      category: 'Sales',
      amount: parseFloat((invoice.subtotal + invoice.tax).toFixed(2)),
      description: `Custom invoice ${invoice.invoiceNumber}`,
      reference: orderId
    }
  ];

  if (invoice.discount > 0) {
    transactions.push({
      id: `TX-CUST-DISC-${Date.now() + 1}`,
      date,
      type: 'Expense',
      category: 'Discounts Given',
      amount: parseFloat(invoice.discount.toFixed(2)),
      description: `Custom invoice discount ${invoice.invoiceNumber}`,
      reference: orderId
    });
  }

  if (invoice.shipping > 0) {
    transactions.push({
      id: `TX-CUST-SHIP-${Date.now() + 2}`,
      date,
      type: 'Income',
      category: 'Shipping Collected',
      amount: parseFloat(invoice.shipping.toFixed(2)),
      description: `Custom invoice shipping ${invoice.invoiceNumber}`,
      reference: orderId
    });
  }

  if (calculatedCogs > 0) {
    transactions.push({
      id: `TX-CUST-COGS-${Date.now() + 3}`,
      date,
      type: 'Expense',
      category: 'Cost of Goods Sold (COGS)',
      amount: parseFloat(calculatedCogs.toFixed(2)),
      description: `Custom invoice COGS ${invoice.invoiceNumber}`,
      reference: orderId
    });
  }

  const inventoryLogs = invoice.items
    .filter((item) => item.productId)
    .map((item, index) => ({
      id: `log-custom-${Date.now()}-${index}`,
      timestamp: `${date} 00:00`,
      productName: item.description,
      item: item.productId as string,
      type: 'sale' as const,
      qty: -item.quantity,
      user: `${userLabel} (${orderId})`
    }));

  return {
    order,
    transactions,
    inventoryLogs,
    updatedProducts
  };
};
