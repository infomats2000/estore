import { test } from 'node:test';
import assert from 'node:assert';
import { calculatePAYGWithholding, calculateSuperannuation, calculateStaffWorkedHours, calculateStaffCommission, INITIAL_STAFF_MEMBERS } from '../utils/payrollEngine';
import { Order } from '../types';

test('calculatePAYGWithholding accurately calculates Australian ATO tax brackets', () => {
  assert.strictEqual(calculatePAYGWithholding(300), 0);
  assert.strictEqual(calculatePAYGWithholding(500), 23); // (500 - 359) * 0.16 = 22.56 -> 23
  assert.strictEqual(calculatePAYGWithholding(1200), 181); // 80.96 + (1200 - 865) * 0.30 = 181.46 -> 181
  assert.strictEqual(calculatePAYGWithholding(2000), 440); // 340.46 + (2000 - 1730) * 0.37 = 440.36 -> 440
  assert.strictEqual(calculatePAYGWithholding(4000), 1215); // 1051.97 + (4000 - 3653) * 0.47 = 1215.06 -> 1215
});

test('calculateSuperannuation calculates correct statutory SG contribution', () => {
  assert.strictEqual(calculateSuperannuation(1000, 11.5), 115.00);
  assert.strictEqual(calculateSuperannuation(1500, 11.5), 172.50);
  assert.strictEqual(calculateSuperannuation(0, 11.5), 0);
});

test('calculateStaffWorkedHours accurately sums approved timesheets or defaults to 38 hrs', () => {
  const timesheets = [
    { id: 'TS-1', staffId: 'EMP-1001', staffName: 'John', date: '2026-08-01', clockIn: '08:00', clockOut: '17:00', breakMinutes: 60, totalHours: 8, approved: true },
    { id: 'TS-2', staffId: 'EMP-1001', staffName: 'John', date: '2026-08-02', clockIn: '08:00', clockOut: '17:00', breakMinutes: 60, totalHours: 8, approved: true },
    { id: 'TS-3', staffId: 'EMP-1001', staffName: 'John', date: '2026-08-03', clockIn: '08:00', clockOut: '17:00', breakMinutes: 60, totalHours: 8, approved: false }
  ];

  assert.strictEqual(calculateStaffWorkedHours('EMP-1001', timesheets, '2026-08-01', '2026-08-05'), 16);
  assert.strictEqual(calculateStaffWorkedHours('EMP-9999', [], '2026-08-01', '2026-08-05'), 38);
});

test('calculateStaffCommission computes sales commissions from completed orders', () => {
  const staff = INITIAL_STAFF_MEMBERS[0]; // John Smith, 2.5% commission
  const orders: Order[] = [
    {
      id: 'ORD-1',
      items: [],
      subtotal: 10000,
      tax: 1000,
      shipping: 0,
      discount: 0,
      total: 11000,
      status: 'Delivered',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerAddress: '123 Test St',
      customerCity: 'Sydney',
      date: '2026-08-02',
      paymentMethod: 'Credit Card'
    }
  ];

  const commission = calculateStaffCommission(staff, orders, '2026-08-01', '2026-08-05');
  assert.strictEqual(commission, 100); // 10,000 * 0.4 allocated * 2.5% = 100
});
