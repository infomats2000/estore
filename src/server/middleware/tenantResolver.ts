import { Request, Response, NextFunction } from 'express';
import { prismaRaw } from '../prismaClient';
import { tenantLocalStorage } from '../tenantContext';

const MAIN_APP_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  'infomats.net',
  'app.infomats.net',
  'www.infomats.net',
  'storeerp.com',
  'app.storeerp.com',
  'www.storeerp.com',
]);


export async function tenantResolverMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let rawHost = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
    const host = rawHost.split(':')[0].toLowerCase();

    // 1. Explicit Header Override (useful for Mobile Apps or API integration)
    const headerTenantId = req.headers['x-tenant-id'] as string;
    const headerTenantSlug = req.headers['x-tenant-slug'] as string;

    let tenant: any = null;

    if (headerTenantId) {
      tenant = await prismaRaw.tenant.findUnique({
        where: { id: headerTenantId },
        include: { plan: true },
      });
    } else if (headerTenantSlug) {
      tenant = await prismaRaw.tenant.findUnique({
        where: { slug: headerTenantSlug },
        include: { plan: true },
      });
    }

    // 2. Custom Domain Resolution (e.g. acmestore.com)
    if (!tenant && host && !MAIN_APP_HOSTS.has(host)) {
      tenant = await prismaRaw.tenant.findFirst({
        where: {
          OR: [
            { customDomain: host },
            { customDomain: `www.${host}` },
            { customDomain: host.replace(/^www\./, '') },
          ],
        },
        include: { plan: true },
      });

      // 3. Subdomain Resolution (e.g. acme.infomats.net or acme.localhost)

      if (!tenant) {
        const parts = host.split('.');
        if (parts.length >= 2) {
          const possibleSlug = parts[0];
          if (possibleSlug !== 'www' && possibleSlug !== 'app' && possibleSlug !== 'api') {
            tenant = await prismaRaw.tenant.findUnique({
              where: { slug: possibleSlug },
              include: { plan: true },
            });
          }
        }
      }
    }

    // 4. Default / Fallback Tenant Lookup
    if (!tenant) {
      tenant = await prismaRaw.tenant.findFirst({
        where: { slug: 'default-tenant' },
        include: { plan: true },
      });
    }

    // If still no tenant exists in DB, construct fallback context
    const tenantId = tenant ? tenant.id : 'default-tenant';
    const tenantSlug = tenant ? tenant.slug : 'default-tenant';
    const customDomain = tenant ? tenant.customDomain || undefined : undefined;

    if (tenant && tenant.status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Tenant Account Suspended',
        message: 'This store account has been suspended. Please contact support or resolve billing.',
      });
    }

    res.locals.tenant = tenant;

    // Run the rest of the middleware stack inside the AsyncLocalStorage tenant context
    tenantLocalStorage.run(
      {
        tenantId,
        tenantSlug,
        customDomain,
      },
      () => {
        next();
      }
    );
  } catch (error) {
    console.error('Tenant Resolution Error:', error);
    next();
  }
}
