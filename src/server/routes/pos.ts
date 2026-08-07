import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prismaRaw } from '../prismaClient';
import { getActiveTenantId } from '../tenantContext';
import { authMiddleware, AuthenticatedRequest, requireTenantRole } from '../middleware/authMiddleware';
import { requirePlanFeature } from '../middleware/featureEnforcer';
import { assertTenderCoverage, calculateExpectedCash, calculatePosTotals, calculateProportionalRefund, money, parseSerialInventory, posCheckoutSchema } from '../posCheckout';

const router = Router();
router.use(authMiddleware, requirePlanFeature('pos'));

const openShiftSchema = z.object({ registerId: z.string().trim().min(1).max(60), openingFloat: z.number().nonnegative() });
const cashMovementSchema = z.object({ type: z.enum(['CASH_IN', 'CASH_OUT', 'SAFE_DROP', 'NO_SALE']), amount: z.number().nonnegative(), reason: z.string().trim().min(3).max(250), approvalId: z.string().optional() });
const closeShiftSchema = z.object({ countedCash: z.number().nonnegative(), varianceReason: z.string().trim().max(250).default('') });
const returnSchema = z.object({
  orderNumber: z.string().trim().min(1), shiftId: z.string().trim().optional(),
  approvalId: z.string().trim().optional(),
  refundMethod: z.enum(['CASH', 'EFTPOS', 'CARD', 'TAP', 'STORE_CREDIT']), reason: z.string().trim().min(3).max(500),
  items: z.array(z.object({ orderItemId: z.string().trim().min(1), quantity: z.number().int().positive(), disposition: z.enum(['RESTOCK', 'QUARANTINE', 'RETURN_TO_SUPPLIER', 'WRITE_OFF']) })).min(1),
});

router.get('/shifts/current', async (req, res) => {
  const tenantId = getActiveTenantId();
  const registerId = String(req.query.registerId || 'REGISTER-01');
  const shift = await prismaRaw.posRegisterShift.findFirst({ where: { tenantId, registerId, status: 'OPEN' }, include: { cashMovements: true }, orderBy: { openedAt: 'desc' } });
  res.json({ shift });
});

router.post('/shifts/open', requireTenantRole(['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_STAFF']), async (req: AuthenticatedRequest, res) => {
  const parsed = openShiftSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid opening float or register' });
  const tenantId = getActiveTenantId();
  const existing = await prismaRaw.posRegisterShift.findFirst({ where: { tenantId, registerId: parsed.data.registerId, status: 'OPEN' } });
  if (existing) return res.status(409).json({ error: 'This register already has an open shift', shift: existing });
  const shift = await prismaRaw.posRegisterShift.create({ data: { tenantId, ...parsed.data, expectedCash: parsed.data.openingFloat, openedByUserId: req.user?.userId || req.user?.sub || 'unknown' } });
  await prismaRaw.activityLog.create({ data: { tenantId, action: 'POS_SHIFT_OPENED', entity: 'PosRegisterShift', details: JSON.stringify({ shiftId: shift.id, registerId: shift.registerId, openingFloat: shift.openingFloat }) } });
  res.status(201).json({ shift });
});

router.post('/shifts/:shiftId/cash-movements', requireTenantRole(['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_STAFF']), async (req: AuthenticatedRequest, res) => {
  const parsed = cashMovementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'A valid cash movement and reason are required' });
  const tenantId = getActiveTenantId();
  const shift = await prismaRaw.posRegisterShift.findFirst({ where: { id: req.params.shiftId, tenantId, status: 'OPEN' } });
  if (!shift) return res.status(404).json({ error: 'Open shift not found' });
  if (parsed.data.type === 'NO_SALE') {
    const approval = parsed.data.approvalId && await prismaRaw.posManagerApproval.findFirst({ where: { id: parsed.data.approvalId, tenantId, action: 'OPEN_DRAWER', usedAt: null, expiresAt: { gt: new Date() } } });
    if (!approval) return res.status(403).json({ error: 'A valid manager drawer approval is required' });
    await prismaRaw.posManagerApproval.update({ where: { id: approval.id }, data: { usedAt: new Date(), entityId: shift.id } });
  }
  const { approvalId: _approvalId, ...movementData } = parsed.data;
  const movement = await prismaRaw.posCashMovement.create({ data: { tenantId, shiftId: shift.id, ...movementData, userId: req.user?.userId || req.user?.sub || 'unknown' } });
  res.status(201).json({ movement });
});

router.post('/shifts/:shiftId/close', requireTenantRole(['TENANT_OWNER', 'TENANT_ADMIN']), async (req: AuthenticatedRequest, res) => {
  const parsed = closeShiftSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'A valid counted cash amount is required' });
  const tenantId = getActiveTenantId();
  try {
    const shift = await prismaRaw.$transaction(async (tx) => {
      const current = await tx.posRegisterShift.findFirst({ where: { id: req.params.shiftId, tenantId, status: 'OPEN' } });
      if (!current) throw new Error('Open shift not found');
      const cashPayments = await tx.posPayment.aggregate({ where: { tenantId, shiftId: current.id, method: 'CASH' }, _sum: { amount: true } });
      const movements = await tx.posCashMovement.findMany({ where: { tenantId, shiftId: current.id } });
      const expectedCash = calculateExpectedCash(current.openingFloat, cashPayments._sum.amount || 0, movements);
      const variance = money(parsed.data.countedCash - expectedCash);
      if (Math.abs(variance) >= 0.01 && !parsed.data.varianceReason) throw new Error('A variance reason is required when counted cash differs from expected cash');
      return tx.posRegisterShift.update({ where: { id: current.id }, data: { status: 'CLOSED', closedAt: new Date(), closedByUserId: req.user?.userId || req.user?.sub || 'unknown', expectedCash, countedCash: parsed.data.countedCash, variance, varianceReason: parsed.data.varianceReason } });
    });
    await prismaRaw.activityLog.create({ data: { tenantId, action: 'POS_SHIFT_CLOSED', entity: 'PosRegisterShift', details: JSON.stringify(shift) } });
    res.json({ shift });
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.get('/receipts/:orderNumber', async (req, res) => {
  const tenantId = getActiveTenantId();
  const order = await prismaRaw.order.findFirst({ where: { tenantId, orderNumber: req.params.orderNumber }, include: { items: true } });
  if (!order) return res.status(404).json({ error: 'Receipt not found' });
  const returned = await prismaRaw.posReturnItem.groupBy({ where: { tenantId, posReturn: { orderId: order.id } }, by: ['orderItemId'], _sum: { quantity: true } });
  res.json({ order, returnedQuantities: Object.fromEntries(returned.map((item) => [item.orderItemId, item._sum.quantity || 0])) });
});

router.post('/returns', requireTenantRole(['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_STAFF']), async (req: AuthenticatedRequest, res) => {
  const parsed = returnSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid return request', details: parsed.error.flatten() });
  const tenantId = getActiveTenantId();
  const userId = req.user?.userId || req.user?.sub || 'unknown';
  try {
    const result = await prismaRaw.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { tenantId, orderNumber: parsed.data.orderNumber }, include: { items: true } });
      if (!order || order.paymentStatus !== 'Paid') throw new Error('A paid POS receipt is required');
      if (parsed.data.shiftId) {
        const shift = await tx.posRegisterShift.findFirst({ where: { id: parsed.data.shiftId, tenantId, status: 'OPEN' } });
        if (!shift) throw new Error('The selected register shift is not open');
      }
      const previous = await tx.posReturnItem.groupBy({ where: { tenantId, posReturn: { orderId: order.id } }, by: ['orderItemId'], _sum: { quantity: true } });
      const previouslyReturned = new Map(previous.map((item) => [item.orderItemId, item._sum.quantity || 0]));
      const requestedIds = new Set(parsed.data.items.map((item) => item.orderItemId));
      if (requestedIds.size !== parsed.data.items.length) throw new Error('Each receipt line may only appear once in a return');
      let grossRefund = 0;
      const returnLines = parsed.data.items.map((requested) => {
        const original = order.items.find((item) => item.id === requested.orderItemId);
        if (!original) throw new Error('A selected item does not belong to this receipt');
        const remaining = original.quantity - (previouslyReturned.get(original.id) || 0);
        if (requested.quantity > remaining) throw new Error(`Only ${remaining} unit(s) of ${original.name} remain returnable`);
        grossRefund += original.price * requested.quantity;
        return { requested, original };
      });
      const orderGross = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const refundAmount = calculateProportionalRefund(grossRefund, orderGross, order.total, order.shipping);
      if (refundAmount > 250) {
        const approval = parsed.data.approvalId && await tx.posManagerApproval.findFirst({ where: { id: parsed.data.approvalId, tenantId, action: 'REFUND', usedAt: null, expiresAt: { gt: new Date() }, amount: { gte: refundAmount } } });
        if (!approval) throw new Error(`Manager approval is required for refunds above $250. Refund amount: $${refundAmount.toFixed(2)}`);
        await tx.posManagerApproval.update({ where: { id: approval.id }, data: { usedAt: new Date(), entityId: order.id } });
      }
      const refundFactor = orderGross > 0 ? Math.max(0, order.total - order.shipping) / orderGross : 0;
      const returnNumber = `RET-${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 90 + 10)}`;
      const posReturn = await tx.posReturn.create({
        data: {
          tenantId, returnNumber, orderId: order.id, shiftId: parsed.data.shiftId, refundMethod: parsed.data.refundMethod,
          refundAmount, reason: parsed.data.reason, processedByUserId: userId,
          items: { create: returnLines.map(({ requested, original }) => ({
            tenantId, orderItemId: original.id, productId: original.productId, quantity: requested.quantity,
            serialNumber: original.serialNumber, unitRefund: money(original.price * refundFactor),
            disposition: requested.disposition, restocked: requested.disposition === 'RESTOCK',
          })) },
        }, include: { items: true },
      });
      for (const { requested, original } of returnLines) {
        if (requested.disposition !== 'RESTOCK') continue;
        const product = await tx.product.findFirst({ where: { id: original.productId, tenantId } });
        if (!product) throw new Error(`Product ${original.productId} no longer exists`);
        const serials = parseSerialInventory(product.serialNumbers);
        if (original.serialNumber && !serials.includes(original.serialNumber)) serials.push(original.serialNumber);
        await tx.product.update({ where: { id: product.id }, data: { stock: { increment: requested.quantity }, sales: { decrement: requested.quantity }, serialNumbers: JSON.stringify(serials) } });
      }
      await tx.posPayment.create({ data: { tenantId, shiftId: parsed.data.shiftId, orderId: order.id, method: parsed.data.refundMethod, amount: -refundAmount, status: 'REFUNDED', idempotencyKey: posReturn.id } });
      await tx.activityLog.create({ data: { tenantId, action: 'POS_RETURN_COMPLETED', entity: 'PosReturn', details: JSON.stringify({ returnId: posReturn.id, returnNumber, orderId: order.id, refundAmount, reason: parsed.data.reason }) } });
      return posReturn;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 10000 });
    res.status(201).json({ return: result });
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.post('/checkout', requireTenantRole(['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_STAFF']), async (req: AuthenticatedRequest, res) => {
  const parsed = posCheckoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid POS checkout', details: parsed.error.flatten() });

  const tenantId = getActiveTenantId();
  const cashierId = req.user?.userId || req.user?.sub || 'unknown';
      const input = parsed.data;

  try {
    const result = await prismaRaw.$transaction(async (tx) => {
      const duplicate = await tx.activityLog.findFirst({
        where: { tenantId, action: 'POS_SALE_COMPLETED', details: { contains: `\"idempotencyKey\":\"${input.idempotencyKey}\"` } },
      });
      if (duplicate) {
        const details = JSON.parse(duplicate.details);
        const existing = await tx.order.findFirst({ where: { tenantId, id: details.orderId }, include: { items: true } });
        if (existing) return { order: existing, changeDue: details.changeDue || 0, duplicate: true };
      }
      const shift = await tx.posRegisterShift.findFirst({ where: { id: input.shiftId, tenantId, registerId: input.registerId, status: 'OPEN' } });
      if (!shift) throw new Error('Open register shift not found');

      const requested = new Map<string, { quantity: number; serialNumbers: string[] }>();
      for (const line of input.items) {
        const current = requested.get(line.productId) || { quantity: 0, serialNumbers: [] };
        current.quantity += line.quantity;
        current.serialNumbers.push(...line.serialNumbers);
        requested.set(line.productId, current);
      }

      const products = await tx.product.findMany({ where: { tenantId, id: { in: [...requested.keys()] } } });
      if (products.length !== requested.size) throw new Error('One or more products do not exist for this tenant');

      const orderLines: Array<{ product: typeof products[number]; quantity: number; serialNumbers: string[]; unitPrice: number }> = [];
      for (const product of products) {
        const line = requested.get(product.id)!;
        if (product.stock < line.quantity) throw new Error(`Insufficient stock for ${product.name}: ${product.stock} available`);
        if (new Set(line.serialNumbers).size !== line.serialNumbers.length) throw new Error(`Duplicate serial number supplied for ${product.name}`);
        if (line.serialNumbers.length > line.quantity) throw new Error(`Too many serial numbers supplied for ${product.name}`);
        const availableSerials = parseSerialInventory(product.serialNumbers);
        for (const serial of line.serialNumbers) {
          if (!availableSerials.includes(serial)) throw new Error(`Serial ${serial} is not available for ${product.name}`);
        }
        orderLines.push({ product, quantity: line.quantity, serialNumbers: line.serialNumbers, unitPrice: product.discountPrice ?? product.price });
      }

      const settings = await tx.storeSettings.findUnique({ where: { tenantId } });
      const totals = calculatePosTotals(orderLines, input.discount, input.shipping, settings?.taxRatePercent ?? 10, input.taxInclusive);
      if (totals.rawSubtotal > 0 && totals.discount / totals.rawSubtotal > 0.10) {
        const approval = input.approvalId && await tx.posManagerApproval.findFirst({ where: { id: input.approvalId, tenantId, action: 'DISCOUNT', usedAt: null, expiresAt: { gt: new Date() }, amount: { gte: totals.discount } } });
        if (!approval) throw new Error(`Manager approval is required for discounts above 10%. Discount amount: $${totals.discount.toFixed(2)}`);
        await tx.posManagerApproval.update({ where: { id: approval.id }, data: { usedAt: new Date(), entityId: input.idempotencyKey } });
      }
      const changeDue = assertTenderCoverage(input.tenders, totals.total);
      const receiptSuffix = `${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 90 + 10)}`;
      const orderNumber = `POS-${input.registerId}-${receiptSuffix}`;

      for (const line of orderLines) {
        const updated = await tx.product.updateMany({
          where: { id: line.product.id, tenantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity }, sales: { increment: line.quantity } },
        });
        if (updated.count !== 1) throw new Error(`Stock changed during checkout for ${line.product.name}; retry the sale`);
        if (line.serialNumbers.length) {
          const remaining = parseSerialInventory(line.product.serialNumbers).filter((serial) => !line.serialNumbers.includes(serial));
          await tx.product.update({ where: { id: line.product.id }, data: { serialNumbers: JSON.stringify(remaining) } });
        }
      }

      const order = await tx.order.create({
        data: {
          tenantId, customerId: input.customerId, orderNumber, status: 'Delivered', subtotal: totals.subtotal,
          tax: totals.tax, shipping: totals.shipping, discount: totals.discount, total: totals.total,
          paymentMethod: input.tenders.map((t) => t.method).join(' + '), paymentStatus: 'Paid',
          notes: [input.notes, `Register: ${input.registerId}`, `Cashier: ${cashierId}`].filter(Boolean).join('\n'),
          items: {
            create: orderLines.flatMap((line) => {
              const serialized = line.serialNumbers.map((serialNumber) => ({
                tenantId, productId: line.product.id, name: line.product.name, price: line.unitPrice,
                quantity: 1, serialNumber, image: line.product.image,
              }));
              const unallocated = line.quantity - line.serialNumbers.length;
              return unallocated > 0 ? [...serialized, {
                tenantId, productId: line.product.id, name: line.product.name, price: line.unitPrice,
                quantity: unallocated, image: line.product.image,
              }] : serialized;
            }),
          },
        },
        include: { items: true },
      });

      await tx.activityLog.createMany({ data: [
        {
          tenantId, action: 'POS_SALE_COMPLETED', entity: 'Order',
          details: JSON.stringify({ idempotencyKey: input.idempotencyKey, orderId: order.id, orderNumber, registerId: input.registerId, cashierId, totals, changeDue }),
        },
        ...input.tenders.map((tender) => ({
          tenantId, action: 'POS_PAYMENT_CAPTURED', entity: 'Order',
          details: JSON.stringify({ orderId: order.id, method: tender.method, amount: tender.amount, reference: tender.reference, status: tender.status }),
        })),
      ] });

      await tx.posPayment.createMany({ data: input.tenders.map((tender) => ({
        tenantId, shiftId: shift.id, orderId: order.id, method: tender.method, amount: tender.amount,
        reference: tender.reference, status: tender.status, idempotencyKey: input.idempotencyKey,
      })) });

      return { order, changeDue, duplicate: false };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 10000 });

    return res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error: any) {
    const message = error?.message || 'POS checkout failed';
    const conflict = /stock|serial|retry/i.test(message);
    return res.status(conflict ? 409 : 400).json({ error: message });
  }
});

export default router;
