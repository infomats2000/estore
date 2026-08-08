import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken, TokenPayload } from '../auth';
import { prismaRaw } from '../prismaClient';
import { getTenantContext, tenantLocalStorage } from '../tenantContext';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token || req.cookies?.authToken;

    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication token missing.' });
    }

    const decoded = verifyAuthToken(token);
    const userId = decoded.userId || decoded.sub;

    let isSuperAdmin = !!decoded.isSuperAdmin;
    let email = decoded.email;

    if (userId) {
      const dbUser = await prismaRaw.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, isSuperAdmin: true },
      });
      if (dbUser) {
        if (dbUser.isSuperAdmin) isSuperAdmin = true;
        if (!email) email = dbUser.email;
      }
    }

    req.user = {
      ...decoded,
      userId: userId || decoded.userId,
      email,
      isSuperAdmin,
    };
    res.locals.user = req.user;

    const authenticatedTenantId = decoded.tenantId;
    if (authenticatedTenantId) {
      const tenant = await prismaRaw.tenant.findUnique({
        where: { id: authenticatedTenantId },
        select: { id: true, slug: true, customDomain: true, status: true },
      });
      if (!tenant) {
        return res.status(403).json({ error: 'Forbidden', message: 'Token tenant no longer exists.' });
      }
      if (!isSuperAdmin) {
        const membership = await prismaRaw.tenantUser.findUnique({
          where: { tenantId_userId: { tenantId: authenticatedTenantId, userId: userId || '' } },
          select: { role: true, isActive: true },
        });
        if (!membership) {
          return res.status(403).json({ error: 'Forbidden', message: 'User is no longer assigned to this tenant.' });
        }
        if (!membership.isActive) {
          return res.status(403).json({ error: 'Account Deactivated', message: 'This staff account has been suspended by the tenant administrator.' });
        }
        req.user.role = membership.role;
      }
      if (tenant.status === 'SUSPENDED' && !isSuperAdmin) {
        return res.status(403).json({ error: 'Tenant Account Suspended' });
      }

      const existingContext = getTenantContext();
      return tenantLocalStorage.run(
        {
          ...existingContext,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          customDomain: tenant.customDomain || undefined,
          userId,
          userRole: req.user.role,
          isSuperAdmin,
        },
        () => next(),
      );
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired session token.' });
  }
}

export async function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user && req.user.isSuperAdmin) {
    return next();
  }

  // Fallback: check database directly for super admin role
  const userId = req.user?.userId || req.user?.sub;
  if (userId) {
    const dbUser = await prismaRaw.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true },
    });
    if (dbUser && dbUser.isSuperAdmin) {
      if (req.user) req.user.isSuperAdmin = true;
      return next();
    }
  }

  return res.status(403).json({ error: 'Forbidden', message: 'Super Admin access required for this operation.' });
}

export function requireTenantRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    const currentRole = req.user.role || 'TENANT_STAFF';
    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({ error: 'Forbidden', message: 'Insufficient role permissions for this operation.' });
    }

    next();
  };
}

export function requireTenantOwner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.isSuperAdmin || req.user.role !== 'TENANT_OWNER') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only the tenant store owner can perform this operation.',
    });
  }

  next();
}
