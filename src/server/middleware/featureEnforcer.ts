import { Request, Response, NextFunction } from 'express';
import { prismaRaw } from '../prismaClient';
import { getActiveTenantId } from '../tenantContext';

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
  return async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await prismaRaw.tenant.findUnique({
        where: { id: getActiveTenantId() },
        select: {
          subscriptionStatus: true,
          currentPeriodEnd: true,
          plan: { select: { name: true, featuresJson: true } },
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

      const features = parsePlanFeatures(tenant.plan.featuresJson);
      if (featureId !== 'pos' && !features.includes(featureId)) {
        return res.status(403).json({
          error: 'Feature Not Included',
          message: `${featureId} is not included in the ${tenant.plan.name} plan.`,
          featureId,
        });
      }

      next();
    } catch (error) {
      console.error('Feature Enforcement Error:', error);
      return res.status(503).json({ error: 'Unable to verify plan entitlement.' });
    }
  };
}
