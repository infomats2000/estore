import { Router } from 'express';
import { prismaRaw } from '../prismaClient';
import { getActiveTenantId } from '../tenantContext';
import { authMiddleware, AuthenticatedRequest, requireTenantRole } from '../middleware/authMiddleware';
import { hashPassword } from '../auth';
import { normalizeStaffFeatureIds, resolvePlanFeatureIds } from '../../constants/features';
import { getTenantUserCapacity } from '../tenantUserCapacity';

const router = Router();
router.use(authMiddleware, requireTenantRole(['TENANT_OWNER', 'TENANT_ADMIN']));

const staffRoles = new Set(['Admin', 'Sales Executive', 'Warehouse Manager', 'Procurement Officer', 'Accountant', 'Custom Staff']);

function parseFeatures(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? normalizeStaffFeatureIds(parsed.filter((feature): feature is string => typeof feature === 'string')) : [];
  } catch {
    return [];
  }
}

async function tenantPermittedFeatures(tenantId: string): Promise<Set<string>> {
  const tenant = await prismaRaw.tenant.findUnique({
    where: { id: tenantId },
    select: { subscriptionStatus: true, currentPeriodEnd: true, plan: { select: { code: true, featuresJson: true } } },
  });
  if (!tenant || !['active', 'trialing'].includes(tenant.subscriptionStatus.toLowerCase())) return new Set();
  if (tenant.currentPeriodEnd && tenant.subscriptionStatus.toLowerCase() !== 'trialing' && tenant.currentPeriodEnd.getTime() < Date.now()) return new Set();
  return new Set(resolvePlanFeatureIds(tenant.plan?.code, parseFeatures(tenant.plan?.featuresJson || '[]')));
}

function validatePermittedFeatures(requested: unknown, permitted: Set<string>): string[] {
  if (!Array.isArray(requested) || requested.some((feature) => typeof feature !== 'string')) throw new Error('Feature permissions must be a list of feature identifiers.');
  const normalized = [...new Set(requested as string[])];
  if (normalized.some((feature) => !permitted.has(feature))) throw new Error('One or more selected modules are not included in this tenant subscription.');
  return normalized;
}

function serializeStaff(member: any, permitted?: Set<string>) {
  return {
    id: member.user.id,
    membershipId: member.id,
    name: member.user.name,
    email: member.user.email,
    role: member.role === 'TENANT_STAFF' ? member.staffRole : 'Admin',
    membershipRole: member.role,
    canManage: member.role === 'TENANT_STAFF',
    active: member.isActive,
    allowedFeatures: parseFeatures(member.allowedFeaturesJson).filter((feature) => !permitted || permitted.has(feature)),
    createdAt: member.createdAt.toISOString().split('T')[0],
    lastLogin: 'Not recorded',
  };
}

router.get('/', async (_req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getActiveTenantId();
    const permitted = await tenantPermittedFeatures(tenantId);
    const capacity = await getTenantUserCapacity(tenantId);
    const staff = await prismaRaw.tenantUser.findMany({
      where: { tenantId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ staff: staff.map((member) => serializeStaff(member, permitted)), capacity });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Unable to load tenant staff.' });
  }
});

router.post('/', async (_req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getActiveTenantId();
    const permitted = await tenantPermittedFeatures(tenantId);
    const capacity = await getTenantUserCapacity(tenantId);
    if (capacity.used >= capacity.limit) {
      return res.status(409).json({ error: `This billing tier allows ${capacity.limit} total user account${capacity.limit === 1 ? '' : 's'}, including the tenant administrator. Upgrade the plan or remove another staff user first.`, capacity });
    }
    const { name, email, password, role = 'Custom Staff', allowedFeatures = [] } = _req.body;
    if (!name?.trim() || !email?.trim() || typeof password !== 'string') {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 8) return res.status(400).json({ error: 'Password must contain at least 8 characters.' });
    if (!staffRoles.has(role)) return res.status(400).json({ error: 'Invalid staff role.' });
    let validatedFeatures: string[];
    try { validatedFeatures = validatePermittedFeatures(allowedFeatures, permitted); }
    catch (error: any) { return res.status(400).json({ error: error.message }); }
    if (role === 'Admin') validatedFeatures = [...permitted];

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prismaRaw.user.findUnique({ where: { email: cleanEmail } });
    if (existing) return res.status(409).json({ error: 'An account already exists for this email address.' });

    const staff = await prismaRaw.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: name.trim(), email: cleanEmail, password: await hashPassword(password), isSuperAdmin: false },
      });
      return tx.tenantUser.create({
        data: { tenantId, userId: user.id, role: 'TENANT_STAFF', staffRole: role, allowedFeaturesJson: JSON.stringify(validatedFeatures) },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    });
    res.status(201).json({ staff: serializeStaff(staff, permitted) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Unable to create staff account.' });
  }
});

router.patch('/:userId', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getActiveTenantId();
    const permitted = await tenantPermittedFeatures(tenantId);
    const { active, role, allowedFeatures } = req.body;
    if (role !== undefined && !staffRoles.has(role)) return res.status(400).json({ error: 'Invalid staff role.' });
    let validatedFeatures: string[] | undefined;
    if (allowedFeatures !== undefined) {
      try { validatedFeatures = validatePermittedFeatures(allowedFeatures, permitted); }
      catch (error: any) { return res.status(400).json({ error: error.message }); }
    }
    const existing = await prismaRaw.tenantUser.findUnique({ where: { tenantId_userId: { tenantId, userId: req.params.userId } } });
    if (!existing) return res.status(404).json({ error: 'Staff account not found for this tenant.' });
    if (existing.role !== 'TENANT_STAFF') return res.status(403).json({ error: 'Tenant owner and administrator accounts cannot be suspended or edited here.' });
    const staff = await prismaRaw.tenantUser.update({
      where: { id: existing.id },
      data: {
        isActive: typeof active === 'boolean' ? active : undefined,
        staffRole: role ?? undefined,
        allowedFeaturesJson: role === 'Admin' ? JSON.stringify([...permitted]) : validatedFeatures === undefined ? undefined : JSON.stringify(validatedFeatures),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json({ staff: serializeStaff(staff, permitted) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Unable to update staff account.' });
  }
});

router.delete('/:userId', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getActiveTenantId();
    const userId = req.params.userId;
    if (userId === (req.user?.userId || req.user?.sub)) {
      return res.status(400).json({ error: 'You cannot delete your own signed-in account.' });
    }
    const membership = await prismaRaw.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      select: { id: true, role: true },
    });
    if (!membership) return res.status(404).json({ error: 'Staff account not found for this tenant.' });
    if (membership.role !== 'TENANT_STAFF') {
      return res.status(403).json({ error: 'Store owner and tenant administrator accounts cannot be deleted here.' });
    }

    await prismaRaw.$transaction(async (tx) => {
      await tx.tenantUser.delete({ where: { id: membership.id } });
      const remainingMemberships = await tx.tenantUser.count({ where: { userId } });
      if (remainingMemberships === 0) await tx.user.delete({ where: { id: userId } });
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Unable to delete staff account.' });
  }
});

export default router;
