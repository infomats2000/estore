import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextStore {
  tenantId: string;
  tenantSlug?: string;
  customDomain?: string;
  userId?: string;
  userRole?: string;
  isSuperAdmin?: boolean;
}

export const tenantLocalStorage = new AsyncLocalStorage<TenantContextStore>();

export function getTenantContext(): TenantContextStore | undefined {
  return tenantLocalStorage.getStore();
}

export function getActiveTenantId(): string {
  const store = tenantLocalStorage.getStore();
  return store?.tenantId || 'default-tenant';
}
