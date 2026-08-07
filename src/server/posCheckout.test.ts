import test from 'node:test';
import assert from 'node:assert/strict';
import { assertTenderCoverage, calculateExpectedCash, calculateLaybyBalance, calculatePosTotals, calculateProportionalRefund, inclusiveTax } from './posCheckout';

test('extracts GST from tax-inclusive Australian pricing', () => {
  assert.equal(inclusiveTax(110, 10), 10);
  assert.deepEqual(calculatePosTotals([{ unitPrice: 55, quantity: 2 }], 0, 0, 10, true), {
    rawSubtotal: 110, subtotal: 110, discount: 0, shipping: 0, tax: 10, total: 110,
  });
});

test('applies discounts before inclusive tax and keeps shipping in total', () => {
  assert.deepEqual(calculatePosTotals([{ unitPrice: 100, quantity: 2 }], 20, 15, 10, true), {
    rawSubtotal: 200, subtotal: 180, discount: 20, shipping: 15, tax: 16.36, total: 195,
  });
});

test('validates tender coverage and returns cash change', () => {
  assert.equal(assertTenderCoverage([{ amount: 60 }, { amount: 50 }], 105), 5);
  assert.throws(() => assertTenderCoverage([{ amount: 100 }], 105), /Insufficient tender/);
});

test('reconciles opening float, cash sales, paid-outs and safe drops', () => {
  assert.equal(calculateExpectedCash(200, 550, [
    { type: 'CASH_IN', amount: 20 }, { type: 'CASH_OUT', amount: 15 },
    { type: 'SAFE_DROP', amount: 300 }, { type: 'NO_SALE', amount: 0 },
  ]), 455);
});

test('refunds the proportional paid value after an order discount', () => {
  assert.equal(calculateProportionalRefund(100, 200, 190, 10), 90);
});

test('tracks lay-by installments without allowing overpayment', () => {
  assert.deepEqual(calculateLaybyBalance(500, 100, 150), { paidAmount: 250, remainingBalance: 250, completed: false });
  assert.deepEqual(calculateLaybyBalance(500, 400, 100), { paidAmount: 500, remainingBalance: 0, completed: true });
  assert.throws(() => calculateLaybyBalance(500, 450, 100), /cannot exceed/);
});
