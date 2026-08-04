import { loadStripe } from '@stripe/stripe-js';

export interface CheckoutRedirectResult {
  url?: string;
  fallback?: boolean;
  message?: string;
}

export async function redirectToCheckout(items: any[], successUrl: string, cancelUrl: string): Promise<CheckoutRedirectResult> {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items,
      successUrl,
      cancelUrl,
    }),
  });

  const session = await response.json().catch(() => ({}));

  if (session.fallback) {
    return {
      fallback: true,
      message: session.message || 'Stripe is not configured. Completing your order locally.'
    };
  }

  if (session.error) {
    throw new Error(session.error);
  }

  if (session.url) {
    window.location.href = session.url;
    return { url: session.url };
  }

  throw new Error('Failed to get checkout session URL');
}
