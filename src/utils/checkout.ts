export type CheckoutPaymentMethod = 'card' | 'wallet' | 'paypal' | 'applepay' | 'stripe' | 'square';

export interface CheckoutOrderPayload {
  customerId?: string;
  orderNumber: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  notes?: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    color?: string;
    size?: string;
    image?: string;
  }>;
}

export const getPaymentProvider = (paymentMethod: CheckoutPaymentMethod) => {
  if (paymentMethod === 'paypal') return 'paypal';
  if (paymentMethod === 'square') return 'square';
  return 'stripe';
};

export const buildCheckoutOrderPayload = ({
  orderId,
  items,
  subtotal,
  tax,
  shipping,
  discount,
  total,
  paymentMethod,
  customerName,
  customerEmail,
  customerAddress,
  customerCity,
  customerPhone,
  shippingMethodText,
}: {
  orderId: string;
  items: Array<{ productId: string; name: string; price: number; quantity: number; color?: string; size?: string; image?: string }>;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerCity: string;
  customerPhone?: string;
  shippingMethodText: string;
}): CheckoutOrderPayload => ({
  orderNumber: orderId,
  subtotal,
  tax,
  shipping,
  discount,
  total,
  paymentMethod,
  paymentStatus: 'Pending',
  status: 'Pending',
  notes: `Customer: ${customerName}\nEmail: ${customerEmail}\nPhone: ${customerPhone || ''}\nAddress: ${customerAddress}\nCity: ${customerCity}\nShipping: ${shippingMethodText}`,
  items
});

export const submitCheckoutOrder = async (payload: CheckoutOrderPayload) => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Unable to save order');
  }

  return data;
};
