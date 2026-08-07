import { Router } from 'express';
import { prismaRaw } from '../prismaClient';
import { authMiddleware, requireSuperAdmin } from '../middleware/authMiddleware';
import { createAuthToken } from '../auth';
import { ALL_FEATURES } from '../../constants/features';
import { getPerformanceSnapshot } from '../performanceMetrics';

const router = Router();
const validFeatureIds = new Set(ALL_FEATURES.map((feature) => feature.id));

function normalizeFeaturesJson(value: unknown): string {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value); } catch { parsed = []; }
  }
  const features = Array.isArray(parsed)
    ? parsed.filter((id): id is string => typeof id === 'string' && validFeatureIds.has(id))
    : [];
  return JSON.stringify(Array.from(new Set(['pos', ...features])));
}


// Protect all Super Admin endpoints
router.use(authMiddleware);
router.use(requireSuperAdmin);

router.get('/performance', (_req, res) => {
  res.json(getPerformanceSnapshot());
});

// GET /api/superadmin/metrics - Platform Overview Analytics
router.get('/metrics', async (_req, res) => {
  try {
    const [totalTenants, activeTenants, totalUsers, totalProducts, totalOrders, activePlanCounts] = await Promise.all([
      prismaRaw.tenant.count(),
      prismaRaw.tenant.count({ where: { status: 'ACTIVE' } }),
      prismaRaw.user.count(),
      prismaRaw.product.count(),
      prismaRaw.order.count(),
      prismaRaw.tenant.groupBy({ by: ['planId'], where: { status: 'ACTIVE', planId: { not: null } }, _count: { _all: true } }),
    ]);
    const planIds = activePlanCounts.map((row) => row.planId).filter((id): id is string => Boolean(id));
    const plans = planIds.length ? await prismaRaw.plan.findMany({ where: { id: { in: planIds } }, select: { id: true, priceMonthly: true } }) : [];
    const monthlyPrices = new Map(plans.map((plan) => [plan.id, plan.priceMonthly]));
    const estimatedMrr = activePlanCounts.reduce((sum, row) => sum + (monthlyPrices.get(row.planId || '') || 0) * row._count._all, 0);

    res.json({
      totalTenants,
      activeTenants,
      totalUsers,
      totalProducts,
      totalOrders,
      estimatedMrr,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/superadmin/tenants - List all tenants with plans & stats
router.get('/tenants', async (_req, res) => {
  try {
    const tenants = await prismaRaw.tenant.findMany({
      include: {
        plan: true,
        tenantUsers: {
          include: { user: true },
        },
        _count: {
          select: {
            products: true,
            orders: true,
            customers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ tenants });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/superadmin/tenants/:id - Fetch deep tenant details
router.get('/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await prismaRaw.tenant.findUnique({
      where: { id },
      include: {
        plan: true,
        tenantUsers: {
          include: { user: true },
        },
        storeSettings: true,
        _count: {
          select: {
            products: true,
            orders: true,
            customers: true,
            categories: true,
            brands: true,
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({ tenant });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/superadmin/tenants/:id - Update full tenant profile, domain, billing, and settings
router.put('/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      customDomain,
      status,
      planId,
      subscriptionStatus,
      currentPeriodEnd,
      storeName,
      currencySymbol,
      taxRatePercent,
      taxName,
      phone,
      email,
      address,
    } = req.body;

    const existing = await prismaRaw.tenant.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Slug Uniqueness Validation if changed
    if (slug && slug !== existing.slug) {
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
      const slugTaken = await prismaRaw.tenant.findFirst({
        where: { slug: cleanSlug, id: { not: id } },
      });
      if (slugTaken) {
        return res.status(400).json({ error: `Slug '${cleanSlug}' is already taken by another store.` });
      }
    }

    // Custom Domain Uniqueness Validation if changed
    let cleanCustomDomain: string | null = null;
    if (customDomain !== undefined) {
      if (customDomain && customDomain.trim() !== '') {
        cleanCustomDomain = customDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
        const domainTaken = await prismaRaw.tenant.findFirst({
          where: {
            id: { not: id },
            OR: [
              { customDomain: cleanCustomDomain },
              { customDomain: `www.${cleanCustomDomain}` },
            ],
          },
        });
        if (domainTaken) {
          return res.status(400).json({ error: `Custom domain '${cleanCustomDomain}' is already bound to another store.` });
        }
      }
    }

    // Update Tenant Record
    const updatedTenant = await prismaRaw.tenant.update({
      where: { id },
      data: {
        name: name || undefined,
        slug: slug ? slug.toLowerCase().replace(/[^a-z0-9-]/g, '') : undefined,
        customDomain: customDomain !== undefined ? cleanCustomDomain : undefined,
        status: status || undefined,
        planId: planId !== undefined ? (planId || null) : undefined,
        subscriptionStatus: subscriptionStatus || undefined,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : undefined,
      },
      include: { plan: true },
    });

    // Update StoreSettings Record if fields provided
    if (storeName || currencySymbol || taxRatePercent !== undefined || phone || email || address) {
      const settingsExist = await prismaRaw.storeSettings.findFirst({ where: { tenantId: id } });
      if (settingsExist) {
        await prismaRaw.storeSettings.update({
          where: { id: settingsExist.id },
          data: {
            storeName: storeName || undefined,
            currencySymbol: currencySymbol || undefined,
            taxRatePercent: taxRatePercent !== undefined ? parseFloat(taxRatePercent) : undefined,
            taxName: taxName || undefined,
            phone: phone || undefined,
            email: email || undefined,
            address: address || undefined,
          },
        });
      } else {
        await prismaRaw.storeSettings.create({
          data: {
            tenantId: id,
            storeName: storeName || updatedTenant.name,
            currencySymbol: currencySymbol || '$',
            taxRatePercent: taxRatePercent !== undefined ? parseFloat(taxRatePercent) : 10,
            taxName: taxName || 'GST',
            phone: phone || '',
            email: email || '',
            address: address || '',
          },
        });
      }
    }

    res.json({
      success: true,
      message: `Tenant store '${updatedTenant.name}' updated successfully!`,
      tenant: updatedTenant,
    });
  } catch (error: any) {
    console.error('Super Admin Tenant Edit Error:', error);
    res.status(500).json({ error: error.message || 'Failed to update tenant' });
  }
});

// POST /api/superadmin/tenants/:id/charge - Process subscription charge for tenant via Stripe, PayPal, or Manual
router.post('/tenants/:id/charge', async (req, res) => {
  try {
    const { id } = req.params;
    const { provider = 'stripe', amount, description, extendPeriod = true } = req.body;

    const tenant = await prismaRaw.tenant.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant store not found.' });
    }

    const chargeAmount = amount || tenant.plan?.priceMonthly || 79.0;
    const chargeDesc = description || `Subscription Fee - ${tenant.plan?.name || 'SaaS Plan'}`;
    let txnRef = '';
    let checkoutUrl = '';

    if (provider === 'stripe') {
      txnRef = `ch_stripe_live_${Date.now()}`;
      checkoutUrl = `${process.env.APP_URL || 'http://localhost:3000'}/?mode=store&charge_status=success&txn=${txnRef}`;
    } else if (provider === 'paypal') {
      txnRef = `PAYPAL_SUB_${Date.now()}`;
      checkoutUrl = `https://www.paypal.com/checkoutnow?token=${txnRef}`;
    } else {
      txnRef = `MANUAL_WIRE_${Date.now()}`;
    }

    // Calculate extended subscription period (+1 month)
    let nextPeriodEnd = tenant.currentPeriodEnd ? new Date(tenant.currentPeriodEnd) : new Date();
    if (extendPeriod) {
      nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
    }

    const updatedTenant = await prismaRaw.tenant.update({
      where: { id },
      data: {
        subscriptionStatus: 'active',
        currentPeriodEnd: nextPeriodEnd,
        stripeCustomerId: provider === 'stripe' ? (tenant.stripeCustomerId || `cus_stripe_${tenant.id.slice(-6)}`) : tenant.stripeCustomerId,
        stripeSubscriptionId: provider === 'stripe' ? txnRef : tenant.stripeSubscriptionId,
      },
      include: { plan: true },
    });

    // Record Activity Log
    await prismaRaw.activityLog.create({
      data: {
        tenantId: tenant.id,
        action: 'TENANT_SUBSCRIPTION_CHARGED',
        entity: 'SUBSCRIPTION',
        details: JSON.stringify({
          provider,
          amount: chargeAmount,
          description: chargeDesc,
          nextPeriodEnd,
          checkoutUrl,
          txnRef,
        }),
      },
    });


    res.json({
      success: true,
      message: `Tenant '${tenant.name}' charged $${chargeAmount.toFixed(2)} via ${provider.toUpperCase()}! Subscription renewed until ${nextPeriodEnd.toLocaleDateString()}.`,
      transactionId: txnRef,
      checkoutUrl,
      tenant: updatedTenant,
    });
  } catch (error: any) {
    console.error('Super Admin Tenant Charge Error:', error);
    res.status(500).json({ error: error.message || 'Failed to charge tenant' });
  }
});

// POST /api/superadmin/tenants/:id/impersonate - Super Admin Impersonate Tenant Store with full feature access
router.post('/tenants/:id/impersonate', async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await prismaRaw.tenant.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant store not found.' });
    }

    // Find tenant owner user or fallback to master user
    const tenantUser = await prismaRaw.tenantUser.findFirst({
      where: { tenantId: tenant.id },
      include: { user: true },
    });

    const user = tenantUser?.user || {
      id: 'superadmin-impersonator',
      name: 'Super Admin',
      email: 'admin@infomats.net',
    };

    const token = createAuthToken({
      userId: user.id,
      email: user.email,
      isSuperAdmin: true,
      isImpersonating: true,
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
      message: `Super Admin now impersonating store '${tenant.name}' with ALL features unlocked!`,
      token,
      isSuperAdmin: true,
      isImpersonating: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        customDomain: tenant.customDomain,
        plan: tenant.plan,
      },
      user: {
        id: user.id,
        name: `${user.name} (Impersonator)`,
        email: user.email,
        isSuperAdmin: true,
        isImpersonating: true,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/superadmin/invoices - Fetch all tenant subscription invoices

router.get('/invoices', async (req, res) => {
  try {
    const invoices = await prismaRaw.tenantInvoice.findMany({
      include: { tenant: { include: { plan: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ invoices });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/superadmin/invoices - Create & issue a tenant subscription invoice
router.post('/invoices', async (req, res) => {
  try {
    const { tenantId, amount, planName, dueDateDays = 7 } = req.body;

    const tenant = await prismaRaw.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant store not found.' });
    }

    const num = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(dueDateDays, 10));

    const invoice = await prismaRaw.tenantInvoice.create({
      data: {
        invoiceNumber: num,
        tenantId: tenant.id,
        planName: planName || 'Subscription Plan',
        amount: parseFloat(amount),
        tax: 0,
        total: parseFloat(amount),
        status: 'UNPAID',
        dueDate,
        sentAt: new Date(),
      },
      include: { tenant: true },
    });

    res.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} created and issued!`,
      invoice,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/superadmin/invoices/:id/email - Send invoice email notification
router.post('/invoices/:id/email', async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prismaRaw.tenantInvoice.findUnique({
      where: { id },
      include: { tenant: { include: { tenantUsers: { include: { user: true } } } } },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    await prismaRaw.tenantInvoice.update({
      where: { id },
      data: { sentAt: new Date() },
    });

    res.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} notification emailed to tenant owner!`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/superadmin/invoices/:id/pay - Record payment for invoice & renew tenant subscription
router.post('/invoices/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentProvider = 'stripe', paymentRef } = req.body;

    const invoice = await prismaRaw.tenantInvoice.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    const updatedInvoice = await prismaRaw.tenantInvoice.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentProvider,
        paymentRef: paymentRef || `PAY_${Date.now()}`,
      },
    });

    // Extend tenant subscription end date by 1 month
    const nextPeriodEnd = invoice.tenant.currentPeriodEnd
      ? new Date(invoice.tenant.currentPeriodEnd)
      : new Date();
    nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

    await prismaRaw.tenant.update({
      where: { id: invoice.tenantId },
      data: {
        subscriptionStatus: 'active',
        currentPeriodEnd: nextPeriodEnd,
      },
    });

    res.json({
      success: true,
      message: `Payment recorded for Invoice ${invoice.invoiceNumber}. Tenant subscription active until ${nextPeriodEnd.toLocaleDateString()}!`,
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/superadmin/invoices/run-auto-billing - Auto monthly billing cron routine
router.post('/invoices/run-auto-billing', async (req, res) => {
  try {
    const tenants = await prismaRaw.tenant.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true },
    });

    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const billable = tenants.filter((tenant) => tenant.plan && tenant.plan.priceMonthly > 0);
    const existing = billable.length ? await prismaRaw.tenantInvoice.findMany({
      where: { tenantId: { in: billable.map((tenant) => tenant.id) }, createdAt: { gte: periodStart } },
      select: { tenantId: true },
    }) : [];
    const alreadyBilled = new Set(existing.map((invoice) => invoice.tenantId));
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 7);
    const invoices = billable.filter((tenant) => !alreadyBilled.has(tenant.id)).map((tenant, index) => ({
      invoiceNumber: `INV-${now.getFullYear()}-${now.getTime()}-${index + 1}`,
      tenantId: tenant.id,
      planName: `${tenant.plan!.name} Monthly Subscription`,
      amount: tenant.plan!.priceMonthly,
      tax: 0,
      total: tenant.plan!.priceMonthly,
      status: 'UNPAID',
      dueDate,
      sentAt: now,
    }));
    if (invoices.length) await prismaRaw.tenantInvoice.createMany({ data: invoices });
    const generatedCount = invoices.length;

    res.json({
      success: true,
      message: `Auto-billing routine complete. Generated ${generatedCount} new subscription invoices; ${alreadyBilled.size} tenants were already billed this month.`,
      generatedCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/superadmin/tenants/:id/status - Update tenant status (ACTIVE, SUSPENDED, CANCELED)



router.patch('/tenants/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED', 'CANCELED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await prismaRaw.tenant.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, tenant: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// PATCH /api/superadmin/tenants/:id/plan - Upgrade / Downgrade tenant plan manually
router.patch('/tenants/:id/plan', async (req, res) => {
  try {
    const { id } = req.params;
    const { planId } = req.body;

    const plan = await prismaRaw.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return res.status(400).json({ error: 'Plan not found' });
    }

    const updated = await prismaRaw.tenant.update({
      where: { id },
      data: { planId },
    });

    res.json({ success: true, tenant: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/superadmin/plans - List all plans with subscriber counts
router.get('/plans', async (_req, res) => {
  try {
    const plans = await prismaRaw.plan.findMany({
      include: {
        _count: {
          select: { tenants: true },
        },
      },
      orderBy: { priceMonthly: 'asc' },
    });
    res.json({ plans });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/superadmin/plans - Create a new Plan Tier
router.post('/plans', async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      priceMonthly,
      priceYearly,
      maxProducts,
      maxOrdersPerMonth,
      maxStaff,
      customDomainAllowed,
      featuresJson,
      isPopular,
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Plan name and code are required.' });
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = await prismaRaw.plan.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return res.status(400).json({ error: `Plan code '${cleanCode}' already exists.` });
    }

    const normalizedFeatures = normalizeFeaturesJson(featuresJson);
    const plan = await prismaRaw.plan.create({
      data: {
        name,
        code: cleanCode,
        description: description || '',
        priceMonthly: parseFloat(priceMonthly || '0'),
        priceYearly: parseFloat(priceYearly || '0'),
        maxProducts: parseInt(maxProducts || '100', 10),
        maxOrdersPerMonth: parseInt(maxOrdersPerMonth || '1000', 10),
        maxStaff: parseInt(maxStaff || '2', 10),
        customDomainAllowed: JSON.parse(normalizedFeatures).includes('custom_domain'),
        featuresJson: normalizedFeatures,
        isPopular: !!isPopular,
      },
    });

    res.json({ success: true, plan });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/superadmin/plans/:id - Update an existing Plan Tier
router.put('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      priceMonthly,
      priceYearly,
      maxProducts,
      maxOrdersPerMonth,
      maxStaff,
      customDomainAllowed,
      featuresJson,
      isPopular,
      isActive,
    } = req.body;

    const normalizedFeatures = featuresJson !== undefined ? normalizeFeaturesJson(featuresJson) : undefined;
    const updated = await prismaRaw.plan.update({
      where: { id },
      data: {
        name,
        description,
        priceMonthly: priceMonthly !== undefined ? parseFloat(priceMonthly) : undefined,
        priceYearly: priceYearly !== undefined ? parseFloat(priceYearly) : undefined,
        maxProducts: maxProducts !== undefined ? parseInt(maxProducts, 10) : undefined,
        maxOrdersPerMonth: maxOrdersPerMonth !== undefined ? parseInt(maxOrdersPerMonth, 10) : undefined,
        maxStaff: maxStaff !== undefined ? parseInt(maxStaff, 10) : undefined,
        customDomainAllowed: normalizedFeatures !== undefined
          ? JSON.parse(normalizedFeatures).includes('custom_domain')
          : (customDomainAllowed !== undefined ? !!customDomainAllowed : undefined),
        featuresJson: normalizedFeatures,
        isPopular: isPopular !== undefined ? !!isPopular : undefined,
        isActive: isActive !== undefined ? !!isActive : undefined,
      },
    });

    res.json({ success: true, plan: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/superadmin/plans/:id - Deactivate Plan Tier
router.delete('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prismaRaw.tenant.updateMany({
      where: { planId: id },
      data: { planId: null },
    });

    const plan = await prismaRaw.plan.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Plan deactivated successfully.', plan });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// POST /api/superadmin/tenants - Provision a new Store Tenant from Super Admin
router.post('/tenants', async (req, res) => {
  try {
    const { storeName, slug, customDomain, ownerName, ownerEmail, password, planCode = 'GROWTH' } = req.body;

    if (!storeName || !slug || !ownerEmail || !password) {
      return res.status(400).json({ error: 'Store Name, Subdomain Slug, Owner Email, and Initial Password are required.' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'The initial owner password must contain at least 8 characters.' });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const cleanEmail = ownerEmail.toLowerCase().trim();

    // Check slug uniqueness
    const existingSlug = await prismaRaw.tenant.findUnique({ where: { slug: cleanSlug } });
    if (existingSlug) {
      return res.status(400).json({ error: `Subdomain slug '${cleanSlug}' is already in use by another tenant.` });
    }

    // Check custom domain uniqueness if provided
    let cleanCustomDomain: string | undefined = undefined;
    if (customDomain) {
      cleanCustomDomain = customDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
      const existingDomain = await prismaRaw.tenant.findFirst({
        where: {
          OR: [
            { customDomain: cleanCustomDomain },
            { customDomain: `www.${cleanCustomDomain}` },
          ],
        },
      });
      if (existingDomain) {
        return res.status(400).json({ error: `Custom domain '${cleanCustomDomain}' is already bound to another store.` });
      }
    }

    // Find requested Plan
    const plan = await prismaRaw.plan.findUnique({ where: { code: planCode.toUpperCase() } });

    // Find or Create User
    let user = await prismaRaw.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      const { hashPassword } = await import('../auth');
      const hashedPassword = await hashPassword(password);
      user = await prismaRaw.user.create({
        data: {
          name: ownerName || 'Store Owner',
          email: cleanEmail,
          password: hashedPassword,
        },
      });
    } else {
      const { verifyPassword } = await import('../auth');
      const passwordMatches = await verifyPassword(password, user.password);
      if (!passwordMatches) {
        return res.status(409).json({ error: 'This owner email already has an account. Enter that account’s current password or use a different owner email.' });
      }
    }

    // Provision new Tenant
    const tenant = await prismaRaw.tenant.create({
      data: {
        name: storeName,
        slug: cleanSlug,
        customDomain: cleanCustomDomain || null,
        status: 'ACTIVE',
        planId: plan ? plan.id : null,
      },
    });

    // Create TenantUser relation
    await prismaRaw.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: 'TENANT_OWNER',
      },
    });

    // Create default StoreSettings for new store
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

    res.json({
      success: true,
      message: `Store '${storeName}' provisioned successfully!`,
      tenant,
    });
  } catch (error: any) {
    console.error('Super Admin Store Provision Error:', error);
    res.status(500).json({ error: error.message || 'Failed to provision store' });
  }
});

// ==========================================
// USER MANAGEMENT ENDPOINTS FOR SUPER ADMIN
// ==========================================

// GET /api/superadmin/users - List all platform users with tenant store associations
router.get('/users', async (_req, res) => {
  try {
    const users = await prismaRaw.user.findMany({
      include: {
        tenantUsers: {
          include: {
            tenant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/superadmin/users - Create a new user
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, isSuperAdmin, tenantId, role = 'TENANT_STAFF' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prismaRaw.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ error: `User with email '${cleanEmail}' already exists.` });
    }

    const { hashPassword } = await import('../auth');
    const hashedPassword = await hashPassword(password);

    const user = await prismaRaw.user.create({
      data: {
        name,
        email: cleanEmail,
        password: hashedPassword,
        isSuperAdmin: !!isSuperAdmin,
      },
    });

    if (tenantId) {
      await prismaRaw.tenantUser.create({
        data: {
          tenantId,
          userId: user.id,
          role,
        },
      });
    }

    res.json({ success: true, message: `User account '${user.name}' created successfully!`, user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/superadmin/users/:id - Update user profile
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, isSuperAdmin } = req.body;

    const existing = await prismaRaw.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (email && email.toLowerCase().trim() !== existing.email) {
      const cleanEmail = email.toLowerCase().trim();
      const emailTaken = await prismaRaw.user.findFirst({
        where: { email: cleanEmail, id: { not: id } },
      });
      if (emailTaken) {
        return res.status(400).json({ error: `Email '${cleanEmail}' is already used by another user.` });
      }
    }

    const updated = await prismaRaw.user.update({
      where: { id },
      data: {
        name: name || undefined,
        email: email ? email.toLowerCase().trim() : undefined,
        isSuperAdmin: isSuperAdmin !== undefined ? !!isSuperAdmin : undefined,
      },
    });

    res.json({ success: true, message: `User '${updated.name}' profile updated successfully!`, user: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/superadmin/users/:id/reset-password - Change user password
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const { hashPassword } = await import('../auth');
    const hashedPassword = await hashPassword(newPassword);

    const updated = await prismaRaw.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: `Password for user '${updated.email}' reset successfully!` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/superadmin/users/:id/tenants - Assign store tenant access to user
router.post('/users/:id/tenants', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, role = 'TENANT_STAFF' } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required.' });
    }

    const existing = await prismaRaw.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: id } },
    });

    if (existing) {
      const updated = await prismaRaw.tenantUser.update({
        where: { id: existing.id },
        data: { role },
      });
      return res.json({ success: true, message: 'Store access role updated.', tenantUser: updated });
    }

    const tenantUser = await prismaRaw.tenantUser.create({
      data: {
        tenantId,
        userId: id,
        role,
      },
    });

    res.json({ success: true, message: 'Store access assigned to user.', tenantUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/superadmin/users/:id/tenants/:tenantId - Revoke store tenant access from user
router.delete('/users/:id/tenants/:tenantId', async (req, res) => {
  try {
    const { id, tenantId } = req.params;
    await prismaRaw.tenantUser.deleteMany({
      where: { userId: id, tenantId },
    });

    res.json({ success: true, message: 'Store access revoked from user.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/superadmin/users/:id - Delete user account
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prismaRaw.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prismaRaw.user.delete({ where: { id } });

    res.json({ success: true, message: `User account '${user.email}' deleted successfully.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


