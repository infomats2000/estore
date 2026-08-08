import { prismaRaw } from './prismaClient';

export interface TenantUserCapacity {
  used: number;
  limit: number;
  remaining: number;
}

export async function getTenantUserCapacity(tenantId: string): Promise<TenantUserCapacity> {
  const [tenant, used] = await Promise.all([
    prismaRaw.tenant.findUnique({ where: { id: tenantId }, select: { plan: { select: { maxStaff: true } } } }),
    prismaRaw.tenantUser.count({ where: { tenantId } }),
  ]);
  const limit = Math.max(1, tenant?.plan?.maxStaff ?? 1);
  return { used, limit, remaining: Math.max(0, limit - used) };
}
