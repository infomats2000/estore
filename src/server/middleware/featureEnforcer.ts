import { Response, NextFunction } from 'express';
import { prismaRaw } from '../prismaClient';
import { getActiveTenantId } from '../tenantContext';
import { AuthenticatedRequest } from './authMiddleware';
import { normalizeStaffFeatureIds, resolvePlanFeatureIds } from '../../constants/features';

const ENTITLED_STATUSES = new Set(['active', 'trialing']);

export function parsePlanFeatures(featuresJson: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(featuresJson || '[]');
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export function requirePlanFeature(featureId: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const tenant = await prismaRaw.tenant.findUnique({
        where: { id: getActiveTenantId() },
        select: {
          subscriptionStatus: true,
          currentPeriodEnd: true,
          plan: { select: { name: true, code: true, featuresJson: true } },
        },
      });

      const status = String(tenant?.subscriptionStatus || '').toLowerCase();
      if (!tenant?.plan || !ENTITLED_STATUSES.has(status)) {
        return res.status(402).json({
          error: 'Subscription Inactive',
          message: 'An active or trialing subscription is required for this module.',
        });
      }

      if (tenant.currentPeriodEnd && tenant.currentPeriodEnd.getTime() < Date.now() && status !== 'trialing') {
        return res.status(402).json({ error: 'Subscription Expired', message: 'The subscription billing period has ended.' });
      }

      const features = resolvePlanFeatureIds(tenant.plan.code, parsePlanFeatures(tenant.plan.featuresJson));
      if (featureId !== 'pos' && !features.includes(featureId)) {
        return res.status(403).json({
          error: 'Feature Not Included',
          message: `${featureId} is not included in the ${tenant.plan.name} plan.`,
          featureId,
        });
      }

      if (req.user?.role === 'TENANT_STAFF') {
        const userId = req.user.userId || req.user.sub || '';
        const membership = await prismaRaw.tenantUser.findUnique({
          where: { tenantId_userId: { tenantId: getActiveTenantId(), userId } },
          select: { isActive: true, allowedFeaturesJson: true },
        });
        const staffFeatures = normalizeStaffFeatureIds(parsePlanFeatures(membership?.allowedFeaturesJson));
        if (!membership?.isActive || !staffFeatures.includes(featureId)) {
          return res.status(403).json({
            error: 'Staff Permission Required',
            message: 'Your staff account has not been granted access to this module.',
            featureId,
          });
        }
      }

      next();
    } catch (error) {
      console.error('Feature Enforcement Error:', error);
      return res.status(503).json({ error: 'Unable to verify plan entitlement.' });
    }
  };
}
