import { Router } from 'express';
import { prismaRaw } from '../prismaClient';
import { getActiveTenantId } from '../tenantContext';
import { authMiddleware, AuthenticatedRequest, requireTenantRole } from '../middleware/authMiddleware';
import { hashPassword } from '../auth';

const router = Router();
router.use(authMiddleware, requireTenantRole(['TENANT_OWNER', 'TENANT_ADMIN']));

const staffRoles = new Set(['Admin', 'Sales Executive', 'Warehouse Manager', 'Procurement Officer', 'Accountant', 'Custom Staff']);

function parseFeatures(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((feature): feature is string => typeof feature === 'string') : [];
  } catch {
    return [];
  }
}

function serializeStaff(member: any) {
  return {
    id: member.user.id,
    membershipId: member.id,
    name: member.user.name,
    email: member.user.email,
    role: member.staffRole,
    active: member.isActive,
    allowedFeatures: parseFeatures(member.allowedFeaturesJson),
    createdAt: member.createdAt.toISOString().split('T')[0],
    lastLogin: 'Not recorded',
  };
}

router.get('/', async (_req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getActiveTenantId();
    const staff = await prismaRaw.tenantUser.findMany({
      where: { tenantId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ staff: staff.map(serializeStaff) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Unable to load tenant staff.' });
  }
});

router.post('/', async (_req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getActiveTenantId();
    const { name, email, password, role = 'Custom Staff', allowedFeatures = [] } = _req.body;
    if (!name?.trim() || !email?.trim() || typeof password !== 'string') {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 8) return res.status(400).json({ error: 'Password must contain at least 8 characters.' });
    if (!staffRoles.has(role)) return res.status(400).json({ error: 'Invalid staff role.' });
    if (!Array.isArray(allowedFeatures) || allowedFeatures.some((feature) => typeof feature !== 'string')) {
      return res.status(400).json({ error: 'Feature permissions must be a list of feature identifiers.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prismaRaw.user.findUnique({ where: { email: cleanEmail } });
    if (existing) return res.status(409).json({ error: 'An account already exists for this email address.' });

    const staff = await prismaRaw.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: name.trim(), email: cleanEmail, password: await hashPassword(password), isSuperAdmin: false },
      });
      return tx.tenantUser.create({
        data: { tenantId, userId: user.id, role: 'TENANT_STAFF', staffRole: role, allowedFeaturesJson: JSON.stringify([...new Set(allowedFeatures)]) },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    });
    res.status(201).json({ staff: serializeStaff(staff) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Unable to create staff account.' });
  }
});

router.patch('/:userId', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getActiveTenantId();
    const { active, role, allowedFeatures } = req.body;
    if (role !== undefined && !staffRoles.has(role)) return res.status(400).json({ error: 'Invalid staff role.' });
    if (allowedFeatures !== undefined && (!Array.isArray(allowedFeatures) || allowedFeatures.some((feature) => typeof feature !== 'string'))) {
      return res.status(400).json({ error: 'Feature permissions must be a list of feature identifiers.' });
    }
    const existing = await prismaRaw.tenantUser.findUnique({ where: { tenantId_userId: { tenantId, userId: req.params.userId } } });
    if (!existing) return res.status(404).json({ error: 'Staff account not found for this tenant.' });
    const staff = await prismaRaw.tenantUser.update({
      where: { id: existing.id },
      data: {
        isActive: typeof active === 'boolean' ? active : undefined,
        staffRole: role ?? undefined,
        allowedFeaturesJson: allowedFeatures === undefined ? undefined : JSON.stringify([...new Set(allowedFeatures)]),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json({ staff: serializeStaff(staff) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Unable to update staff account.' });
  }
});

export default router;