import { Router } from 'express';
import { z } from 'zod';
import { prismaRaw } from '../prismaClient';
import { getActiveTenantId } from '../tenantContext';
import { authMiddleware, AuthenticatedRequest, requireTenantRole } from '../middleware/authMiddleware';
import { requirePlanFeature } from '../middleware/featureEnforcer';
import { canCompleteStep, firstIncompleteStep, workflowForItemType } from '../inboundWorkflow';

const router = Router();
router.use(authMiddleware, requirePlanFeature('procurement'));

const itemSchema = z.object({
  purchaseOrderLineRef: z.string().optional(), productId: z.string().optional(),
  productName: z.string().min(1), itemType: z.string().default('NEW_STOCK'),
  manufacturerSerial: z.string().trim().optional(), serviceTag: z.string().trim().optional(), imei: z.string().trim().optional(),
  expectedQuantity: z.number().int().positive().default(1), deliveredQuantity: z.number().int().nonnegative().default(1),
  acceptedQuantity: z.number().int().nonnegative().default(1), rejectedQuantity: z.number().int().nonnegative().default(0),
  purchaseCost: z.number().nonnegative().default(0),
}).refine((item) => item.acceptedQuantity + item.rejectedQuantity <= item.deliveredQuantity, 'Accepted and rejected quantities exceed delivered quantity');

const createJobSchema = z.object({
  jobType: z.string().default('SUPPLIER_RECEIPT'), priority: z.string().default('NORMAL'),
  purchaseOrderRef: z.string().optional(), supplierName: z.string().min(1), warehouseId: z.string().optional(),
  supplierInvoiceNumber: z.string().optional(), deliveryDocketNumber: z.string().optional(),
  carrier: z.string().optional(), trackingNumber: z.string().optional(), notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

const includeJob = { items: { include: { steps: { orderBy: { sequence: 'asc' as const } } } }, receipts: true };

router.get('/', async (req, res) => {
  try {
    const tenantId = getActiveTenantId();
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const jobs = await prismaRaw.inboundJob.findMany({
      where: { tenantId, ...(status && status !== 'ALL' ? { status } : {}) },
      include: includeJob,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ jobs });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post('/', requireTenantRole(['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_STAFF']), async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = createJobSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid inbound job', details: parsed.error.flatten() });
    const tenantId = getActiveTenantId();
    const receivedByUserId = req.user?.userId || req.user?.sub;
    const suffix = `${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
    const jobNumber = `INB-${suffix}`;
    const grnNumber = `GRN-${suffix}`;

    const job = await prismaRaw.$transaction(async (tx) => {
      const created = await tx.inboundJob.create({
        data: {
          tenantId, jobNumber, jobType: parsed.data.jobType, priority: parsed.data.priority,
          purchaseOrderRef: parsed.data.purchaseOrderRef, supplierName: parsed.data.supplierName,
          warehouseId: parsed.data.warehouseId, supplierInvoiceNumber: parsed.data.supplierInvoiceNumber,
          deliveryDocketNumber: parsed.data.deliveryDocketNumber, carrier: parsed.data.carrier,
          trackingNumber: parsed.data.trackingNumber, notes: parsed.data.notes || '', receivedByUserId,
        },
      });
      for (let index = 0; index < parsed.data.items.length; index += 1) {
        const item = parsed.data.items[index];
        const assetNumber = item.manufacturerSerial ? `AST-${suffix}-${index + 1}` : undefined;
        await tx.inboundJobItem.create({
          data: {
            tenantId, inboundJobId: created.id, ...item,
            manufacturerSerial: item.manufacturerSerial || null, serviceTag: item.serviceTag || null, imei: item.imei || null,
            internalAssetNumber: assetNumber, landedCost: item.purchaseCost,
            steps: { create: workflowForItemType(item.itemType).map((step) => ({ tenantId, ...step })) },
          },
        });
      }
      await tx.goodsReceipt.create({
        data: {
          tenantId, inboundJobId: created.id, grnNumber, purchaseOrderRef: parsed.data.purchaseOrderRef,
          supplierInvoiceNumber: parsed.data.supplierInvoiceNumber, deliveryDocketNumber: parsed.data.deliveryDocketNumber,
          receivedByUserId, quantitiesJson: JSON.stringify(parsed.data.items.map((item) => ({ productId: item.productId, productName: item.productName, delivered: item.deliveredQuantity, accepted: item.acceptedQuantity, rejected: item.rejectedQuantity }))),
        },
      });
      return tx.inboundJob.findUniqueOrThrow({ where: { id: created.id }, include: includeJob });
    });
    res.status(201).json({ job });
  } catch (error: any) {
    const duplicate = error?.code === 'P2002';
    res.status(duplicate ? 409 : 500).json({ error: duplicate ? 'Duplicate serial or asset number.' : error.message });
  }
});

router.patch('/:jobId/items/:itemId/steps/:stepId', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getActiveTenantId();
    const input = z.object({ result: z.enum(['PASSED', 'FAILED', 'COMPLETED']), notes: z.string().optional(), data: z.record(z.string(), z.unknown()).optional() }).parse(req.body);
    const item = await prismaRaw.inboundJobItem.findFirst({
      where: { id: req.params.itemId, inboundJobId: req.params.jobId, tenantId },
      include: { steps: true },
    });
    if (!item) return res.status(404).json({ error: 'Inbound item not found.' });
    const step = item.steps.find((candidate) => candidate.id === req.params.stepId);
    if (!step) return res.status(404).json({ error: 'Workflow step not found.' });
    if (!canCompleteStep(item.steps, step.id)) return res.status(409).json({ error: 'Complete the preceding required steps first.' });
    if (step.stepKey === 'QC_APPROVAL' && input.result !== 'PASSED') return res.status(400).json({ error: 'QC approval must pass before put-away.' });
    if (['PUT_AWAY', 'INVENTORY_RELEASE'].includes(step.stepKey)) return res.status(400).json({ error: 'Use the controlled put-away endpoint for this step.' });

    const updated = await prismaRaw.$transaction(async (tx) => {
      await tx.inboundJobStep.update({ where: { id: step.id }, data: {
        status: input.result === 'FAILED' ? 'FAILED' : 'COMPLETED', result: input.result,
        notes: input.notes || '', dataJson: JSON.stringify(input.data || {}),
        completedByUserId: req.user?.userId || req.user?.sub, completedAt: new Date(),
      } });
      const steps = await tx.inboundJobStep.findMany({ where: { inboundJobItemId: item.id }, orderBy: { sequence: 'asc' } });
      const next = firstIncompleteStep(steps);
      return tx.inboundJobItem.update({ where: { id: item.id }, data: {
        currentStep: next?.stepKey || step.stepKey,
        status: input.result === 'FAILED' ? 'ON_HOLD' : `AWAITING_${next?.stepKey || 'PUT_AWAY'}`,
        holdReason: input.result === 'FAILED' ? (input.notes || `${step.stepKey} failed`) : null,
      }, include: { steps: { orderBy: { sequence: 'asc' } } } });
    });
    res.json({ item: updated });
  } catch (error: any) { res.status(error instanceof z.ZodError ? 400 : 500).json({ error: error.message }); }
});

router.post('/:jobId/items/:itemId/put-away', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getActiveTenantId();
    const input = z.object({ warehouseId: z.string().min(1), bin: z.string().min(1) }).parse(req.body);
    const actor = req.user?.userId || req.user?.sub;
    const result = await prismaRaw.$transaction(async (tx) => {
      const item = await tx.inboundJobItem.findFirst({ where: { id: req.params.itemId, inboundJobId: req.params.jobId, tenantId }, include: { steps: true, inboundJob: true } });
      if (!item) throw new Error('Inbound item not found.');
      if (item.sellable) throw new Error('Item has already been released to inventory.');
      const qc = item.steps.find((step) => step.stepKey === 'QC_APPROVAL');
      if (!qc || qc.status !== 'COMPLETED' || qc.result !== 'PASSED') throw new Error('QC approval is required before put-away.');
      const unfinished = item.steps.filter((step) => step.required && step.sequence < (qc.sequence) && step.status !== 'COMPLETED');
      if (unfinished.length) throw new Error('Required processing steps are incomplete.');
      if (item.productId && item.acceptedQuantity > 0) {
        const product = await tx.product.findFirst({ where: { id: item.productId, tenantId } });
        if (!product) throw new Error('Linked inventory product no longer exists.');
        await tx.product.update({ where: { id: product.id }, data: { stock: { increment: item.acceptedQuantity }, costPrice: item.landedCost || item.purchaseCost } });
      }
      await tx.inboundJobStep.updateMany({ where: { inboundJobItemId: item.id, stepKey: { in: ['PUT_AWAY', 'INVENTORY_RELEASE'] } }, data: { status: 'COMPLETED', result: 'PASSED', completedByUserId: actor, completedAt: new Date() } });
      await tx.inventoryMovement.create({ data: {
        tenantId, inboundJobId: item.inboundJobId, inboundJobItemId: item.id, productId: item.productId,
        movementType: 'INBOUND_RELEASE', quantity: item.acceptedQuantity, fromStockType: 'INSPECTION', toStockType: 'SELLABLE',
        fromLocation: item.currentLocation, toLocation: `${input.warehouseId}/${input.bin}`,
        reference: item.inboundJob.jobNumber, performedByUserId: actor,
      } });
      const updatedItem = await tx.inboundJobItem.update({ where: { id: item.id }, data: {
        sellable: true, status: 'COMPLETED', currentStep: 'COMPLETED', finalDisposition: 'SELLABLE_INVENTORY',
        destinationWarehouseId: input.warehouseId, destinationBin: input.bin,
        currentLocation: `${input.warehouseId}/${input.bin}`, completedAt: new Date(),
      }, include: { steps: { orderBy: { sequence: 'asc' } } } });
      const remaining = await tx.inboundJobItem.count({ where: { inboundJobId: item.inboundJobId, status: { not: 'COMPLETED' } } });
      await tx.inboundJob.update({ where: { id: item.inboundJobId }, data: { status: remaining === 0 ? 'COMPLETED' : 'IN_PROGRESS', completedAt: remaining === 0 ? new Date() : null } });
      return updatedItem;
    });
    res.json({ item: result });
  } catch (error: any) { res.status(error instanceof z.ZodError ? 400 : 409).json({ error: error.message }); }
});

export default router;
