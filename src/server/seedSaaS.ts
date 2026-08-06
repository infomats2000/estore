import { prismaRaw } from './prismaClient';
import { hashPassword } from './auth';

export async function seedSaaS() {
  console.log('Seeding SaaS Plans & Master Tenant...');

  // 1. Create or Update Plans
  const plans = [
    {
      code: 'FREE',
      name: 'Free Starter',
      description: 'Ideal for small pop-up shops and new sellers.',
      priceMonthly: 0,
      priceYearly: 0,
      maxProducts: 25,
      maxOrdersPerMonth: 100,
      maxStaff: 1,
      customDomainAllowed: false,
      isPopular: false,
      featuresJson: JSON.stringify(['pos']),
    },
    {
      code: 'STARTER',
      name: 'Growth Store',
      description: 'For growing businesses expanding catalog & volume.',
      priceMonthly: 29,
      priceYearly: 290,
      maxProducts: 250,
      maxOrdersPerMonth: 2000,
      maxStaff: 3,
      customDomainAllowed: false,
      isPopular: true,
      featuresJson: JSON.stringify(['pos', 'marketing', 'pc_builder']),
    },
    {
      code: 'GROWTH',
      name: 'Pro Brand',
      description: 'Full white-label SaaS store with Custom Domain.',
      priceMonthly: 79,
      priceYearly: 790,
      maxProducts: 2500,
      maxOrdersPerMonth: 15000,
      maxStaff: 10,
      customDomainAllowed: true,
      isPopular: false,
      featuresJson: JSON.stringify(['pos', 'custom_domain', 'marketing', 'trade_accounts', 'procurement', 'wms_inventory', 'pc_builder']),
    },
    {
      code: 'ENTERPRISE',
      name: 'Enterprise ERP',
      description: 'Unlimited capacity for multi-location retail chains.',
      priceMonthly: 199,
      priceYearly: 1990,
      maxProducts: 100000,
      maxOrdersPerMonth: 1000000,
      maxStaff: 100,
      customDomainAllowed: true,
      isPopular: false,
      featuresJson: JSON.stringify(['pos', 'custom_domain', 'marketing', 'trade_accounts', 'procurement', 'wms_inventory', 'repair_jobs', 'pc_builder', 'finance_ledger', 'api_access']),
    },
  ];


  for (const planData of plans) {
    await prismaRaw.plan.upsert({
      where: { code: planData.code },
      update: planData,
      create: planData,
    });
  }

  const growthPlan = await prismaRaw.plan.findUnique({ where: { code: 'GROWTH' } });

  // 2. Create Default Primary Tenant
  const defaultTenant = await prismaRaw.tenant.upsert({
    where: { slug: 'default-tenant' },
    update: {
      name: 'INFOMAT Store ERP',
      status: 'ACTIVE',
      planId: growthPlan?.id,
    },
    create: {
      id: 'default-tenant',
      name: 'INFOMAT Store ERP',
      slug: 'default-tenant',
      customDomain: 'infomat.com',
      status: 'ACTIVE',
      planId: growthPlan?.id,
    },
  });

  // 3. Create SaaS Super Admin Users
  const superAdminPassword = await hashPassword('SuperAdmin123!');
  const superAdminEmails = ['admin@infomats.net', 'infomats.net@gmail.com'];

  for (const email of superAdminEmails) {
    await prismaRaw.user.upsert({
      where: { email },
      update: { isSuperAdmin: true },
      create: {
        name: 'SaaS Platform Admin',
        email,
        password: superAdminPassword,
        isSuperAdmin: true,
      },
    });
  }



  // 4. Create Default Store Owner
  const ownerPassword = await hashPassword('Owner123!');
  const tenantOwner = await prismaRaw.user.upsert({
    where: { email: 'owner@infomat.com' },
    update: {},
    create: {
      name: 'Store Owner',
      email: 'owner@infomat.com',
      password: ownerPassword,
      isSuperAdmin: false,
    },
  });

  // 5. Link Owner to Default Tenant
  await prismaRaw.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: defaultTenant.id,
        userId: tenantOwner.id,
      },
    },
    update: { role: 'TENANT_OWNER' },
    create: {
      tenantId: defaultTenant.id,
      userId: tenantOwner.id,
      role: 'TENANT_OWNER',
    },
  });

  // 6. Ensure StoreSettings exist for default tenant
  await prismaRaw.storeSettings.upsert({
    where: { tenantId: defaultTenant.id },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      storeName: 'INFOMAT Retail',
      storeTagline: 'Hardware & Electronics ERP',
      legalName: 'INFOMAT Retail Pty Ltd',
      currencySymbol: '$',
      taxRatePercent: 10,
      taxName: 'GST',
    },
  });

  console.log('SaaS Plans and Default Tenant initialized successfully.');
}

if (process.argv[1]?.includes('seedSaaS')) {
  seedSaaS()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

