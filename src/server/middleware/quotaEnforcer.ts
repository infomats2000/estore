import { Request, Response, NextFunction } from 'express';
import { prismaRaw } from '../prismaClient';
import { getActiveTenantId } from '../tenantContext';

export function checkProductLimit() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = getActiveTenantId();
      const tenant = await prismaRaw.tenant.findUnique({
        where: { id: tenantId },
        include: { plan: true },
      });

      if (!tenant || !tenant.plan) {
        return next();
      }

      const productCount = await prismaRaw.product.count({
        where: { tenantId },
      });

      if (productCount >= tenant.plan.maxProducts) {
        return res.status(402).json({
          error: 'Plan Limit Exceeded',
          message: `Your store plan (${tenant.plan.name}) allows up to ${tenant.plan.maxProducts} products. Upgrade your plan to list more items.`,
          maxProducts: tenant.plan.maxProducts,
          currentCount: productCount,
        });
      }

      next();
    } catch (error) {
      console.error('Quota Enforcement Error:', error);
      next();
    }
  };
}

export function checkCustomDomainAllowed() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = getActiveTenantId();
      const tenant = await prismaRaw.tenant.findUnique({
        where: { id: tenantId },
        include: { plan: true },
      });

      if (!tenant || !tenant.plan) {
        return next();
      }

      if (!tenant.plan.customDomainAllowed) {
        return res.status(402).json({
          error: 'Feature Not Available On Current Plan',
          message: `Custom Top-Level Domains are only available on Growth or Enterprise plans. Please upgrade your plan.`,
        });
      }

      next();
    } catch (error) {
      console.error('Quota Enforcement Error:', error);
      next();
    }
  };
}
