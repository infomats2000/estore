import { Router } from 'express';
import { prismaRaw } from '../prismaClient';
import { findUserByEmail, verifyPassword, createAuthToken } from '../auth';

const router = Router();

// POST /api/auth/saas-login - Standard Universal Login (Auto-recognizes Super Admin vs Store User)
router.post('/saas-login', async (req, res) => {
  try {
    const { email, password, storeSlug } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User account not found.' });
    }

    const validPassword = await verifyPassword(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    // Auto-recognize Super Admin vs Store User
    if (user.isSuperAdmin) {
      const token = createAuthToken({
        userId: user.id,
        email: user.email,
        isSuperAdmin: true,
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        isSuperAdmin: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isSuperAdmin: true,
          role: 'SUPER_ADMIN',
        },
      });
    }

    // Resolve Store Tenant User
    const tenantUsers = user.tenantUsers || [];
    if (tenantUsers.length === 0) {
      return res.status(403).json({
        error: 'No Associated Stores',
        message: 'This account is not associated with any active store ERP. Please contact your administrator or register a new store.',
      });
    }

    let selectedTenantUser = tenantUsers[0];
    if (storeSlug) {
      const matched = tenantUsers.find((tu: any) => tu.tenant?.slug === storeSlug || tu.tenant?.customDomain === storeSlug);
      if (matched) selectedTenantUser = matched;
    }

    const tenantId = selectedTenantUser ? selectedTenantUser.tenantId : 'default-tenant';
    const role = selectedTenantUser ? selectedTenantUser.role : 'TENANT_OWNER';
    const tenant = selectedTenantUser ? selectedTenantUser.tenant : null;

    const token = createAuthToken({
      userId: user.id,
      email: user.email,
      isSuperAdmin: false,
      tenantId,
      role,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      isSuperAdmin: false,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isSuperAdmin: false,
        role,
      },
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        customDomain: tenant.customDomain,
      } : null,
    });
  } catch (error: any) {
    console.error('SaaS Login Error:', error);
    const msg = error?.message || 'Authentication server error';
    return res.status(500).json({ error: `Login Error: ${msg}` });
  }
});


// POST /api/auth/login - Universal Login Alias
router.post('/login', (req, res, next) => {
  req.url = '/saas-login';
  next();
});


// POST /api/auth/logout - Clear Auth Cookies & Invalidate Session
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.clearCookie('authToken');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me - Fetch active user session

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;
    const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.substring(7) : cookieToken;

    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const decoded = jwt.default.verify(token, secret) as any;

    const user = await prismaRaw.user.findUnique({
      where: { id: decoded.userId },
      include: {
        tenantUsers: {
          include: { tenant: { include: { plan: true } } },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        role: decoded.role,
        tenantId: decoded.tenantId,
      },
      stores: user.tenantUsers.map((tu) => tu.tenant),
    });
  } catch (error) {
    res.status(401).json({ authenticated: false });
  }
});

// POST /api/auth/change-password - Update user password
router.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;
    const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.substring(7) : cookieToken;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in again.' });
    }

    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const decoded = jwt.default.verify(token, secret) as any;

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = await prismaRaw.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const { verifyPassword, hashPassword } = await import('../auth');
    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Incorrect current password. Please try again.' });
    }

    const newHashedPassword = await hashPassword(newPassword);
    await prismaRaw.user.update({
      where: { id: user.id },
      data: { password: newHashedPassword },
    });

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update password.' });
  }
});

export default router;
