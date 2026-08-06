import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken, TokenPayload } from '../auth';
import { prismaRaw } from '../prismaClient';

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
