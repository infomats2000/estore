import { Router } from 'express';
import { prismaRaw } from '../prismaClient';
import { hashPassword, createAuthToken } from '../auth';

const router = Router();

// GET /api/onboarding/plans - Get all active subscription plans
router.get('/plans', async (_req, res) => {
  try {
    const plans = await prismaRaw.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });
    res.json({ plans });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/onboarding/check-slug - Check subdomain/slug availability
router.post('/check-slug', async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) {
      return res.status(400).json({ error: 'Slug is required' });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const existing = await prismaRaw.tenant.findUnique({
      where: { slug: cleanSlug },
    });

    res.json({
      available: !existing,
      slug: cleanSlug,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/onboarding/check-domain - Check custom domain availability
router.post('/check-domain', async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const existing = await prismaRaw.tenant.findFirst({
      where: {
        OR: [
          { customDomain: cleanDomain },
          { customDomain: `www.${cleanDomain}` },
        ],
      },
    });

    res.json({
      available: !existing,
      domain: cleanDomain,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/onboarding/register - Self-serve store registration
router.post('/register', async (req, res) => {
  try {
    const {
      storeName,
      slug,
      customDomain,
      ownerName,
      email,
      password,
      planCode = 'FREE',
    } = req.body;

    if (!storeName || !slug || !email || !password || !ownerName) {
      return res.status(400).json({ error: 'Missing required onboarding fields.' });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const cleanEmail = email.toLowerCase().trim();

    // Check slug uniqueness
    const existingTenant = await prismaRaw.tenant.findUnique({ where: { slug: cleanSlug } });
    if (existingTenant) {
      return res.status(400).json({ error: 'Subdomain already taken. Please choose another.' });
    }

    // Check custom domain uniqueness if provided
    let cleanCustomDomain: string | undefined = undefined;
    if (customDomain) {
      cleanCustomDomain = customDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const existingDomain = await prismaRaw.tenant.findFirst({
        where: {
          OR: [
            { customDomain: cleanCustomDomain },
            { customDomain: `www.${cleanCustomDomain}` },
          ],
        },
      });
      if (existingDomain) {
        return res.status(400).json({ error: 'Custom domain already registered to another store.' });
      }
    }

    // Find requested Plan
    const plan = await prismaRaw.plan.findUnique({ where: { code: planCode.toUpperCase() } });
    if (!plan) {
      return res.status(400).json({ error: 'Invalid subscription plan code.' });
    }

    // Create or find user
    let user = await prismaRaw.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      const hashedPassword = await hashPassword(password);
      user = await prismaRaw.user.create({
        data: {
          name: ownerName,
          email: cleanEmail,
          password: hashedPassword,
        },
      });
    }

    // Provision new Tenant
    const tenant = await prismaRaw.tenant.create({
      data: {
        name: storeName,
        slug: cleanSlug,
        customDomain: cleanCustomDomain || null,
        status: 'ACTIVE',
        planId: plan.id,
      },
    });

    // Assign Tenant Owner role
    await prismaRaw.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: 'TENANT_OWNER',
      },
    });

    // Create default store settings for new tenant
    await prismaRaw.storeSettings.create({
      data: {
        tenantId: tenant.id,
        storeName,
        currencySymbol: '$',
        taxRatePercent: 10,
        taxName: 'GST',
        email: cleanEmail,
      },
    });

    // Generate Auth Token
    const token = createAuthToken({
      userId: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      tenantId: tenant.id,
      role: 'TENANT_OWNER',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Store provisioned successfully!',
      token,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        customDomain: tenant.customDomain,
        plan: plan.name,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('Onboarding Error:', error);
    res.status(500).json({ error: error.message || 'Failed to register store' });
  }
});

export default router;
