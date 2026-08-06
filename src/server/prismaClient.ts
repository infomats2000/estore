import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { getActiveTenantId } from './tenantContext';

// This module is imported before app.ts has a chance to call dotenv.config().
// Load it here so Prisma always receives the local development configuration.
dotenv.config();

// Auto-resolve Vercel Environment Variables (POSTGRES_URL / PRISMA_DATABASE_URL -> DATABASE_URL)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_URL ||
    process.env.PRISMA_DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
}

const configuredDbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.PRISMA_DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  '';

const resolvedDbHost = (() => {
  try {
    return new URL(configuredDbUrl).host;
  } catch {
    return '';
  }
})();

if (resolvedDbHost) {
  console.log(`[DB] Prisma connected via host: ${resolvedDbHost}`);
} else {
  console.warn('[DB] DATABASE_URL is not configured or invalid.');
}

// Base raw prisma instance for administrative or cross-tenant tasks
export const prismaRaw = new PrismaClient({
  datasources: {
    db: {
      url: configuredDbUrl,
    },
  },
});





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
