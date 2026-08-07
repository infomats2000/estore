import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prismaRaw } from '../prismaClient';
import { getActiveTenantId } from '../tenantContext';
import { verifyPassword } from '../auth';
import { authMiddleware, AuthenticatedRequest, requireTenantRole } from '../middleware/authMiddleware';
import { requirePlanFeature } from '../middleware/featureEnforcer';
import { calculateLaybyBalance, calculatePosTotals, money, parseSerialInventory } from '../posCheckout';

const router = Router();
router.use(authMiddleware, requirePlanFeature('pos'));
const userId = (req: AuthenticatedRequest) => req.user?.userId || req.user?.sub || 'unknown';

const laybyItem = z.object({ productId: z.string().min(1), quantity: z.number().int().positive(), serialNumbers: z.array(z.string().min(1)).default([]) });
const createLayby = z.object({
  customerId: z.string().min(1), shiftId: z.string().min(1), expiryDays: z.number().int().min(7).max(365).default(90), notes: z.string().max(1000).default(''),
  items: z.array(laybyItem).min(1), deposit: z.object({ amount: z.number().positive(), method: z.enum(['CASH', 'EFTPOS', 'CARD', 'BANK_TRANSFER']), reference: z.string().optional() }),
}).superRefine((value, ctx) => { if (value.deposit.method !== 'CASH' && !value.deposit.reference?.trim()) ctx.addIssue({ code: 'custom', path: ['deposit', 'reference'], message: 'Non-cash deposits require a terminal or bank reference' }); });
const installment = z.object({ shiftId: z.string().optional(), amount: z.number().positive(), method: z.enum(['CASH', 'EFTPOS', 'CARD', 'BANK_TRANSFER']), reference: z.string().optional() })
  .superRefine((value, ctx) => { if (value.method !== 'CASH' && !value.reference?.trim()) ctx.addIssue({ code: 'custom', path: ['reference'], message: 'Non-cash installments require a terminal or bank reference' }); });

router.get('/laybys', async (req, res) => {
  const tenantId = getActiveTenantId();
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const laybys = await prismaRaw.posLayby.findMany({ where: { tenantId, ...(status ? { status } : {}) }, include: { items: true, payments: { orderBy: { createdAt: 'desc' } } }, orderBy: { createdAt: 'desc' } });
  res.json({ laybys });
});

router.post('/laybys', requireTenantRole(['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_STAFF']), async (req: AuthenticatedRequest, res) => {
  const parsed = createLayby.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid lay-by request', details: parsed.error.flatten() });
  const tenantId = getActiveTenantId();
  try {
    const result = await prismaRaw.$transaction(async (tx) => {
      const shift = await tx.posRegisterShift.findFirst({ where: { id: parsed.data.shiftId, tenantId, status: 'OPEN' } });
      if (!shift) throw new Error('An open register shift is required');
      const customer = await tx.customer.findFirst({ where: { id: parsed.data.customerId, tenantId } });
      if (!customer) throw new Error('A registered customer is required for lay-by');
      const productIds = [...new Set(parsed.data.items.map(item => item.productId))];
      const products = await tx.product.findMany({ where: { tenantId, id: { in: productIds } } });
      if (products.length !== productIds.length) throw new Error('One or more products were not found');
      const lines = parsed.data.items.map(item => {
        const product = products.find(candidate => candidate.id === item.productId)!;
        if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
        if (new Set(item.serialNumbers).size !== item.serialNumbers.length || item.serialNumbers.length > item.quantity) throw new Error(`Invalid serial allocation for ${product.name}`);
        const available = parseSerialInventory(product.serialNumbers);
        item.serialNumbers.forEach(serial => { if (!available.includes(serial)) throw new Error(`Serial ${serial} is unavailable`); });
        return { product, ...item, unitPrice: product.discountPrice ?? product.price };
      });
      const settings = await tx.storeSettings.findUnique({ where: { tenantId } });
      const totals = calculatePosTotals(lines, 0, 0, settings?.taxRatePercent ?? 10, true);
      if (parsed.data.deposit.amount > totals.total) throw new Error('Deposit cannot exceed the lay-by total');
      if (parsed.data.deposit.amount >= totals.total) throw new Error('Use a normal sale when the full balance is being paid');
      for (const line of lines) {
        const updated = await tx.product.updateMany({ where: { id: line.product.id, tenantId, stock: { gte: line.quantity } }, data: { stock: { decrement: line.quantity } } });
        if (updated.count !== 1) throw new Error(`Stock changed for ${line.product.name}; retry`);
        if (line.serialNumbers.length) await tx.product.update({ where: { id: line.product.id }, data: { serialNumbers: JSON.stringify(parseSerialInventory(line.product.serialNumbers).filter(serial => !line.serialNumbers.includes(serial))) } });
      }
      const suffix = `${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 90 + 10)}`;
      const layby = await tx.posLayby.create({ data: {
        tenantId, laybyNumber: `LAY-${suffix}`, customerId: customer.id, customerName: customer.name, shiftId: shift.id,
        subtotal: totals.subtotal, tax: totals.tax, totalAmount: totals.total, paidAmount: parsed.data.deposit.amount,
        remainingBalance: money(totals.total - parsed.data.deposit.amount), expiryDate: new Date(Date.now() + parsed.data.expiryDays * 86400000),
        notes: parsed.data.notes, createdByUserId: userId(req), status: parsed.data.deposit.amount === totals.total ? 'COMPLETED' : 'ACTIVE',
        items: { create: lines.map(line => ({ tenantId, productId: line.product.id, productName: line.product.name, quantity: line.quantity, unitPrice: line.unitPrice, serialNumbers: JSON.stringify(line.serialNumbers) })) },
        payments: { create: { tenantId, shiftId: shift.id, amount: parsed.data.deposit.amount, method: parsed.data.deposit.method, reference: parsed.data.deposit.reference, receiptNumber: `LR-${suffix}`, receivedByUserId: userId(req) } },
      }, include: { items: true, payments: true } });
      await tx.posPayment.create({ data: { tenantId, shiftId: shift.id, orderId: layby.id, method: parsed.data.deposit.method, amount: parsed.data.deposit.amount, reference: parsed.data.deposit.reference, status: 'CAPTURED', idempotencyKey: `layby-${layby.id}` } });
      await tx.activityLog.create({ data: { tenantId, action: 'POS_LAYBY_CREATED', entity: 'PosLayby', details: JSON.stringify({ laybyId: layby.id, laybyNumber: layby.laybyNumber, total: layby.totalAmount, deposit: layby.paidAmount }) } });
      return layby;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 10000 });
    res.status(201).json({ layby: result });
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.post('/laybys/:id/payments', requireTenantRole(['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_STAFF']), async (req: AuthenticatedRequest, res) => {
  const parsed = installment.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid installment' });
  const tenantId = getActiveTenantId();
  try {
    const result = await prismaRaw.$transaction(async (tx) => {
      const layby = await tx.posLayby.findFirst({ where: { id: req.params.id, tenantId, status: 'ACTIVE' }, include: { items: true } });
      if (!layby) throw new Error('Active lay-by not found');
      if (parsed.data.amount > layby.remainingBalance) throw new Error('Installment exceeds the remaining balance');
      if (parsed.data.method === 'CASH') {
        const shift = parsed.data.shiftId && await tx.posRegisterShift.findFirst({ where: { id: parsed.data.shiftId, tenantId, status: 'OPEN' } });
        if (!shift) throw new Error('Cash installments require an open register shift');
      }
      const suffix = `${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 90 + 10)}`;
      const balance = calculateLaybyBalance(layby.totalAmount, layby.paidAmount, parsed.data.amount);
      const { paidAmount, remainingBalance, completed } = balance;
      const payment = await tx.posLaybyPayment.create({ data: { tenantId, laybyId: layby.id, shiftId: parsed.data.shiftId, amount: parsed.data.amount, method: parsed.data.method, reference: parsed.data.reference, receiptNumber: `LR-${suffix}`, receivedByUserId: userId(req) } });
      let completedOrderId: string | undefined;
      if (completed) {
        const order = await tx.order.create({ data: { tenantId, customerId: layby.customerId, orderNumber: `POS-LAYBY-${suffix}`, status: 'Delivered', subtotal: layby.subtotal, tax: layby.tax, total: layby.totalAmount, paymentMethod: 'LAYBY', paymentStatus: 'Paid', notes: `Completed lay-by ${layby.laybyNumber}`, items: { create: layby.items.flatMap(item => {
          const serials = parseSerialInventory(item.serialNumbers);
          const serialLines = serials.map(serialNumber => ({ tenantId, productId: item.productId, name: item.productName, price: item.unitPrice, quantity: 1, serialNumber }));
          return item.quantity > serials.length ? [...serialLines, { tenantId, productId: item.productId, name: item.productName, price: item.unitPrice, quantity: item.quantity - serials.length }] : serialLines;
        }) } } });
        completedOrderId = order.id;
      }
      const updated = await tx.posLayby.update({ where: { id: layby.id }, data: { paidAmount, remainingBalance, status: completed ? 'COMPLETED' : 'ACTIVE', completedOrderId } });
      await tx.posPayment.create({ data: { tenantId, shiftId: parsed.data.shiftId, orderId: completedOrderId || layby.id, method: parsed.data.method, amount: parsed.data.amount, reference: parsed.data.reference, status: 'CAPTURED', idempotencyKey: `layby-payment-${payment.id}` } });
      return { layby: updated, payment, completedOrderId };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    res.status(201).json(result);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.post('/laybys/:id/cancel', requireTenantRole(['TENANT_OWNER', 'TENANT_ADMIN']), async (req: AuthenticatedRequest, res) => {
  const tenantId = getActiveTenantId();
  try {
    const layby = await prismaRaw.$transaction(async tx => {
      const current = await tx.posLayby.findFirst({ where: { id: req.params.id, tenantId, status: 'ACTIVE' }, include: { items: true } });
      if (!current) throw new Error('Active lay-by not found');
      for (const item of current.items) {
        const product = await tx.product.findFirst({ where: { id: item.productId, tenantId } });
        if (!product) continue;
        const serials = [...new Set([...parseSerialInventory(product.serialNumbers), ...parseSerialInventory(item.serialNumbers)])];
        await tx.product.update({ where: { id: product.id }, data: { stock: { increment: item.quantity }, serialNumbers: JSON.stringify(serials) } });
      }
      return tx.posLayby.update({ where: { id: current.id }, data: { status: 'CANCELLED', notes: `${current.notes}\nCancelled: ${String(req.body?.reason || 'Manager cancellation')}`.trim() } });
    });
    res.json({ layby });
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

const approvalSchema = z.object({ managerEmail: z.string().email(), managerPassword: z.string().min(1), action: z.enum(['DISCOUNT', 'REFUND', 'VOID', 'OPEN_DRAWER']), amount: z.number().nonnegative().optional(), reason: z.string().min(3).max(250) });
router.post('/approvals', async (req: AuthenticatedRequest, res) => {
  const parsed = approvalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Manager credentials, action and reason are required' });
  const tenantId = getActiveTenantId();
  const manager = await prismaRaw.user.findUnique({ where: { email: parsed.data.managerEmail }, include: { tenantUsers: { where: { tenantId } } } });
  if (!manager || !(await verifyPassword(parsed.data.managerPassword, manager.password)) || !manager.tenantUsers.some(member => ['TENANT_OWNER', 'TENANT_ADMIN'].includes(member.role))) return res.status(403).json({ error: 'Valid owner or manager credentials are required' });
  const approval = await prismaRaw.posManagerApproval.create({ data: { tenantId, action: parsed.data.action, amount: parsed.data.amount, reason: parsed.data.reason, requestedByUserId: userId(req), approvedByUserId: manager.id, expiresAt: new Date(Date.now() + 5 * 60000) } });
  res.status(201).json({ approval: { id: approval.id, action: approval.action, expiresAt: approval.expiresAt } });
});

const authorizationSchema = z.object({ shiftId: z.string().min(1), amount: z.number().positive(), method: z.enum(['EFTPOS', 'CARD', 'TAP']), provider: z.string().min(2).max(60) });
router.post('/payment-authorizations', async (req: AuthenticatedRequest, res) => {
  const parsed = authorizationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payment authorization request' });
  const tenantId = getActiveTenantId();
  const shift = await prismaRaw.posRegisterShift.findFirst({ where: { id: parsed.data.shiftId, tenantId, status: 'OPEN' } });
  if (!shift) return res.status(400).json({ error: 'Open shift not found' });
  const authorization = await prismaRaw.posPaymentAuthorization.create({ data: { tenantId, ...parsed.data, requestedByUserId: userId(req), expiresAt: new Date(Date.now() + 5 * 60000) } });
  res.status(201).json({ authorization });
});

router.post('/payment-authorizations/:id/confirm', requireTenantRole(['TENANT_OWNER', 'TENANT_ADMIN']), async (req: AuthenticatedRequest, res) => {
  const parsed = z.object({ status: z.enum(['AUTHORIZED', 'DECLINED', 'CANCELLED']), providerReference: z.string().min(3).max(120) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Provider result and reference are required' });
  const tenantId = getActiveTenantId();
  const existing = await prismaRaw.posPaymentAuthorization.findFirst({ where: { id: req.params.id, tenantId, status: 'PENDING', expiresAt: { gt: new Date() } } });
  if (!existing) return res.status(404).json({ error: 'Pending authorization not found or expired' });
  const authorization = await prismaRaw.posPaymentAuthorization.update({ where: { id: existing.id }, data: { ...parsed.data, confirmedByUserId: userId(req) } });
  res.json({ authorization });
});

router.get('/reports/summary', requireTenantRole(['TENANT_OWNER', 'TENANT_ADMIN']), async (req, res) => {
  const tenantId = getActiveTenantId();
  const from = req.query.from ? new Date(String(req.query.from)) : new Date(new Date().setHours(0, 0, 0, 0));
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return res.status(400).json({ error: 'Invalid report date range' });
  const [orders, payments, returns, shifts, laybys] = await Promise.all([
    prismaRaw.order.findMany({ where: { tenantId, createdAt: { gte: from, lte: to }, paymentStatus: 'Paid', orderNumber: { startsWith: 'POS-' } }, include: { items: true } }),
    prismaRaw.posPayment.findMany({ where: { tenantId, createdAt: { gte: from, lte: to } } }),
    prismaRaw.posReturn.findMany({ where: { tenantId, createdAt: { gte: from, lte: to } } }),
    prismaRaw.posRegisterShift.findMany({ where: { tenantId, openedAt: { gte: from, lte: to } } }),
    prismaRaw.posLayby.findMany({ where: { tenantId, createdAt: { gte: from, lte: to } } }),
  ]);
  const byTender = Object.entries(payments.reduce<Record<string, number>>((acc, payment) => { acc[payment.method] = money((acc[payment.method] || 0) + payment.amount); return acc; }, {})).map(([method, amount]) => ({ method, amount }));
  const productSales = new Map<string, { productId: string; name: string; quantity: number; revenue: number }>();
  orders.flatMap(order => order.items).forEach(item => { const row = productSales.get(item.productId) || { productId: item.productId, name: item.name, quantity: 0, revenue: 0 }; row.quantity += item.quantity; row.revenue = money(row.revenue + item.price * item.quantity); productSales.set(item.productId, row); });
  res.json({ from, to, sales: { count: orders.length, subtotal: money(orders.reduce((sum, order) => sum + order.subtotal, 0)), tax: money(orders.reduce((sum, order) => sum + order.tax, 0)), total: money(orders.reduce((sum, order) => sum + order.total, 0)) }, refunds: { count: returns.length, total: money(returns.reduce((sum, item) => sum + item.refundAmount, 0)) }, tenders: byTender, shifts: { count: shifts.length, variance: money(shifts.reduce((sum, shift) => sum + (shift.variance || 0), 0)) }, laybys: { created: laybys.length, outstanding: money(laybys.filter(item => item.status === 'ACTIVE').reduce((sum, item) => sum + item.remainingBalance, 0)) }, topProducts: [...productSales.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10) });
});

export default router;
