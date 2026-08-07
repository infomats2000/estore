import { z } from 'zod';

export const posTenderSchema = z.object({
  method: z.enum(['CASH', 'EFTPOS', 'CARD', 'TAP', 'WALLET', 'STORE_CREDIT', 'TRADE_CREDIT']),
  amount: z.number().positive(),
  reference: z.string().trim().max(120).optional(),
  status: z.enum(['APPROVED', 'CAPTURED']).default('CAPTURED'),
}).superRefine((value, ctx) => {
  if (['EFTPOS', 'CARD', 'TAP'].includes(value.method) && !value.reference?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['reference'], message: 'Card and EFTPOS tenders require an approved provider reference' });
  }
});

export const posCheckoutSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(120),
  registerId: z.string().trim().min(1).max(60).default('REGISTER-01'),
  shiftId: z.string().trim().min(1),
  customerId: z.string().trim().optional(),
  taxInclusive: z.boolean().default(true),
  discount: z.number().nonnegative().default(0),
  shipping: z.number().nonnegative().default(0),
  notes: z.string().max(1000).default(''),
  approvalId: z.string().trim().optional(),
  items: z.array(z.object({
    productId: z.string().trim().min(1),
    quantity: z.number().int().positive(),
    serialNumbers: z.array(z.string().trim().min(1)).default([]),
  })).min(1),
  tenders: z.array(posTenderSchema).min(1),
});

export type PosCheckoutInput = z.infer<typeof posCheckoutSchema>;

export function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function inclusiveTax(totalBeforeTax: number, ratePercent: number): number {
  if (ratePercent <= 0) return 0;
  return money(totalBeforeTax - totalBeforeTax / (1 + ratePercent / 100));
}

export function calculatePosTotals(
  lines: Array<{ unitPrice: number; quantity: number }>,
  discount: number,
  shipping: number,
  taxRatePercent: number,
  taxInclusive: boolean,
) {
  const rawSubtotal = money(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));
  const appliedDiscount = money(Math.min(rawSubtotal, Math.max(0, discount)));
  const taxableAmount = money(rawSubtotal - appliedDiscount);
  const tax = taxInclusive
    ? inclusiveTax(taxableAmount, taxRatePercent)
    : money(taxableAmount * (taxRatePercent / 100));
  const total = money(taxableAmount + shipping + (taxInclusive ? 0 : tax));
  return { rawSubtotal, subtotal: taxableAmount, discount: appliedDiscount, shipping: money(shipping), tax, total };
}

export function assertTenderCoverage(tenders: Array<{ amount: number }>, total: number): number {
  const tendered = money(tenders.reduce((sum, tender) => sum + tender.amount, 0));
  if (tendered < total) throw new Error(`Insufficient tender: ${tendered.toFixed(2)} supplied for ${total.toFixed(2)} due`);
  return money(tendered - total);
}

export function parseSerialInventory(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function calculateExpectedCash(openingFloat: number, cashPayments: number, movements: Array<{ type: string; amount: number }>): number {
  const movementTotal = movements.reduce((sum, movement) => {
    if (movement.type === 'CASH_IN') return sum + movement.amount;
    if (movement.type === 'NO_SALE') return sum;
    return sum - movement.amount;
  }, 0);
  return money(openingFloat + cashPayments + movementTotal);
}

export function calculateProportionalRefund(grossReturned: number, orderGross: number, orderTotal: number, shipping: number): number {
  if (orderGross <= 0) return 0;
  return money(grossReturned * (Math.max(0, orderTotal - shipping) / orderGross));
}

export function calculateLaybyBalance(total: number, paid: number, installment: number): { paidAmount: number; remainingBalance: number; completed: boolean } {
  const nextPaid = money(paid + installment);
  if (installment <= 0 || nextPaid > money(total)) throw new Error('Installment must be positive and cannot exceed the remaining balance');
  const remainingBalance = money(total - nextPaid);
  return { paidAmount: nextPaid, remainingBalance, completed: remainingBalance === 0 };
}
