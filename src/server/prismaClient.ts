import { PrismaClient } from '../generated/prisma/client';
import { getActiveTenantId } from './tenantContext';

// Base raw prisma instance for administrative or cross-tenant tasks
export const prismaRaw = new PrismaClient();

// Models that are scoped to a specific tenant
const TENANT_SCOPED_MODELS = new Set([
  'Category',
  'Brand',
  'UnitOfMeasure',
  'ProductStatus',
  'WarehouseLocation',
  'TaxRate',
  'PaymentTerm',
  'ShippingMethod',
  'WarrantyType',
  'ProductAttribute',
  'AttributeValue',
  'ProductCondition',
  'Product',
  'ProductImage',
  'Customer',
  'Address',
  'Order',
  'OrderItem',
  'Coupon',
  'StoreSettings',
  'PaymentMethod',
  'ActivityLog',
]);

/**
 * Extended Prisma Client that automatically injects tenantId into query where clauses and mutations
 * to guarantee strict multi-tenant data isolation.
 */
export const db = prismaRaw.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!TENANT_SCOPED_MODELS.has(model)) {
          return query(args);
        }

        const activeTenantId = getActiveTenantId();

        // 1. Injected where clause for read/update/delete operations
        if (
          operation === 'findMany' ||
          operation === 'findFirst' ||
          operation === 'findUnique' ||
          operation === 'count' ||
          operation === 'aggregate' ||
          operation === 'groupBy' ||
          operation === 'update' ||
          operation === 'updateMany' ||
          operation === 'delete' ||
          operation === 'deleteMany'
        ) {
          const currentArgs = (args || {}) as any;

          // For findUnique, map to findFirst with tenantId to support composite multi-tenant keys
          if (operation === 'findUnique') {
            return (prismaRaw as any)[model.toLowerCase()].findFirst({
              ...currentArgs,
              where: {
                ...(currentArgs.where || {}),
                tenantId: activeTenantId,
              },
            });
          }

          currentArgs.where = {
            ...(currentArgs.where || {}),
            tenantId: activeTenantId,
          };
          return query(currentArgs);
        }

        // 2. Injected data for creation operations
        if (operation === 'create') {
          const currentArgs = (args || {}) as any;
          currentArgs.data = {
            ...(currentArgs.data || {}),
            tenantId: currentArgs.data?.tenantId || activeTenantId,
          };
          return query(currentArgs);
        }

        if (operation === 'createMany') {
          const currentArgs = (args || {}) as any;
          if (Array.isArray(currentArgs.data)) {
            currentArgs.data = currentArgs.data.map((item: any) => ({
              ...item,
              tenantId: item.tenantId || activeTenantId,
            }));
          }
          return query(currentArgs);
        }

        return query(args);
      },
    },
  },
});

export default db;
