export type PaymentProvider = 'stripe' | 'paypal' | 'square';

export interface PaymentProviderAdapter {
  createPaymentSession(input: PaymentSessionInput): Promise<PaymentSessionResult>;
}

export interface PaymentSessionInput {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface PaymentSessionResult {
  provider: PaymentProvider;
  url?: string;
  sessionId?: string;
  clientSecret?: string;
  referenceId?: string;
}

export class PaymentService {
  constructor(private readonly adapter: PaymentProviderAdapter) {}

  async createSession(input: PaymentSessionInput): Promise<PaymentSessionResult> {
    return this.adapter.createPaymentSession(input);
  }
}

export const createPaymentAdapter = (provider: PaymentProvider): PaymentProviderAdapter => {
  switch (provider) {
    case 'stripe':
      return {
        async createPaymentSession(input) {
          return { provider: 'stripe', sessionId: `stripe_${input.orderId}`, clientSecret: 'placeholder', url: '/checkout/success' };
        }
      };
    case 'paypal':
      return {
        async createPaymentSession(input) {
          return { provider: 'paypal', sessionId: `paypal_${input.orderId}`, referenceId: `pp_${input.orderId}` };
        }
      };
    case 'square':
      return {
        async createPaymentSession(input) {
          return { provider: 'square', sessionId: `square_${input.orderId}`, referenceId: `sq_${input.orderId}` };
        }
      };
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
};
