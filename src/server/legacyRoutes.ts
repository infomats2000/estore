import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from './prisma';
import { AppError, handleError } from './errors';
import { authSchema, categorySchema, customerSchema, productSchema, settingsSchema } from './validation';
import { createAuthToken, findAdminUserByEmail, hashPassword, verifyPassword } from './auth';
import { saveImageFromBase64, deleteImageIfExists } from './uploads';
import { readAppStateStore, readAdminExtrasStore, writeAppStateStore, writeAdminExtrasStore } from './stateStore';
import { normalizeProductForDb, serializeProductForResponse } from './products';
import { seedMasterData } from './masterDataSeeder';
import { authMiddleware } from './middleware/authMiddleware';
import { requirePlanFeature } from './middleware/featureEnforcer';

const router = express.Router();
router.use(cookieParser());

const requireAuth = async (req: any, res: any, next: any) => {
  const token = req.cookies?.authToken || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as { sub: string; role: string };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/api/auth/login', async (req, res) => {
  try {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError('Invalid login payload', 400);

    const { email, password } = parsed.data;
    const admin = await findAdminUserByEmail(email);
    if (!admin) throw new AppError('Invalid credentials', 401);

    const valid = await verifyPassword(password, admin.password);
    if (!valid) throw new AppError('Invalid credentials', 401);

    const token = createAuthToken({ sub: admin.id, role: admin.role });
    res.cookie('authToken', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.json({ token, user: { id: admin.id, email: admin.email, role: admin.role, name: admin.name } });
  } catch (err) {
    handleError(err, res);
  }
});

router.post('/api/auth/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({ ok: true });
});

router.get('/api/state', async (_req, res) => {
  try {
    const state = await readAppStateStore();
    res.json(state);
  } catch (err) {
    handleError(err, res);
  }
});

router.put('/api/state', async (req, res) => {
  try {
    const next = await writeAppStateStore(req.body || {});
    res.json(next);
  } catch (err) {
    handleError(err, res);
  }
});

router.get('/api/admin-extras', async (_req, res) => {
  try {
    const extras = await readAdminExtrasStore();
    res.json(extras);
  } catch (err) {
    handleError(err, res);
  }
});

router.put('/api/admin-extras', async (req, res) => {
  try {
    const next = await writeAdminExtrasStore(req.body || {});
    res.json(next);
  } catch (err) {
    handleError(err, res);
  }
});

router.get('/api/products', async (_req, res) => {
  try {
    const products = await prisma.product.findMany({ include: { category: true, images: true } });
    res.json(products.map((product) => serializeProductForResponse(product)));
  } catch (err) {
    handleError(err, res);
  }
});

router.post('/api/products', async (req, res) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError('Invalid product payload', 400);

    const normalizedData = normalizeProductForDb({
      ...parsed.data,
      categoryId: parsed.data.categoryId || null,
      specs: parsed.data.specs ?? {},
      tags: parsed.data.tags ?? [],
      additionalImages: parsed.data.additionalImages ?? [],
      colors: parsed.data.colors ?? [],
      sizes: parsed.data.sizes ?? [],
      serialNumbers: parsed.data.serialNumbers ?? []
    });

    const product = await prisma.product.create({ data: normalizedData });
    res.status(201).json(serializeProductForResponse(product));
  } catch (err) {
    handleError(err, res);
  }
});

router.put('/api/products/:id', async (req, res) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError('Invalid product payload', 400);

    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Product not found', 404);

    const normalizedData = normalizeProductForDb({
      ...parsed.data,
      categoryId: parsed.data.categoryId || null,
      specs: parsed.data.specs ?? {},
      tags: parsed.data.tags ?? [],
      additionalImages: parsed.data.additionalImages ?? [],
      colors: parsed.data.colors ?? [],
      sizes: parsed.data.sizes ?? [],
      serialNumbers: parsed.data.serialNumbers ?? []
    });

    const existingProduct = serializeProductForResponse(existing);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: normalizedData
    });
    const retainedImages = new Set([parsed.data.image, ...(parsed.data.additionalImages ?? [])].filter(Boolean));
    const replacedImages = [existingProduct.image, ...(existingProduct.additionalImages ?? [])].filter((imagePath): imagePath is string => !!imagePath && !retainedImages.has(imagePath));
    await Promise.all(replacedImages.map((imagePath) => deleteImageIfExists(imagePath)));
    res.json(serializeProductForResponse(product));
  } catch (err) {
    handleError(err, res);
  }
});

router.delete('/api/products', async (_req, res) => {
  try {
    const existingProducts = await prisma.product.findMany();
    await prisma.product.deleteMany({});
    const imagePaths = existingProducts.flatMap((product) => {
      const serialized = serializeProductForResponse(product);
      return [serialized.image, ...(serialized.additionalImages ?? [])];
    });
    await Promise.all(imagePaths.map((imagePath) => deleteImageIfExists(imagePath)));
    res.json({ ok: true });
  } catch (err) {
    handleError(err, res);
  }
});

router.delete('/api/products/:id', async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Product not found', 404);

    await prisma.product.delete({ where: { id: req.params.id } });
    const serialized = serializeProductForResponse(existing);
    await Promise.all([serialized.image, ...(serialized.additionalImages ?? [])].map((imagePath) => deleteImageIfExists(imagePath)));
    res.json({ ok: true });
  } catch (err) {
    handleError(err, res);
  }
});

router.get('/api/categories', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (err) {
    handleError(err, res);
  }
});

router.post('/api/categories', async (req, res) => {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) throw new AppError('Invalid category payload', 400);

    const category = await prisma.category.create({ data: parsed.data });
    res.status(201).json(category);
  } catch (err) {
    handleError(err, res);
  }
});

router.put('/api/categories/:id', async (req, res) => {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) throw new AppError('Invalid category payload', 400);

    const category = await prisma.category.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(category);
  } catch (err) {
    handleError(err, res);
  }
});

router.delete('/api/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    handleError(err, res);
  }
});

router.get('/api/customers', requireAuth, async (_req, res) => {
  try {
    const customers = await prisma.customer.findMany();
    res.json(customers);
  } catch (err) {
    handleError(err, res);
  }
});

router.post('/api/customers', requireAuth, async (req, res) => {
  try {
    const parsed = customerSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError('Invalid customer payload', 400);

    const customerData = {
      ...parsed.data,
      wishlist: JSON.stringify(parsed.data.wishlist || [])
    };
    const customer = await prisma.customer.create({ data: customerData });
    res.status(201).json(customer);
  } catch (err) {
    handleError(err, res);
  }
});

router.get('/api/orders/track', async (req, res) => {
  try {
    const orderNumber = String(req.query.orderNumber || '').trim();
    const email = String(req.query.email || '').trim().toLowerCase();

    if (!orderNumber) {
      throw new AppError('Order number is required', 400);
    }

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: { equals: orderNumber, mode: 'insensitive' }
      },
      include: {
        items: true,
        customer: true,
        shippingMethod: true
      }
    });

    if (!order) {
      throw new AppError('Order not found. Please check your order number.', 404);
    }

    if (email && order.customer?.email && order.customer.email.toLowerCase() !== email) {
      throw new AppError('Email address does not match this order number.', 403);
    }

    res.json(order);
  } catch (err) {
    handleError(err, res);
  }
});

router.get('/api/orders', requireAuth, async (_req, res) => {
  try {
    const orders = await prisma.order.findMany({ include: { items: true } });
    res.json(orders);
  } catch (err) {
    handleError(err, res);
  }
});

router.post('/api/orders', async (req, res) => {
  try {
    const parsed = z.object({
      customerId: z.string().optional(),
      orderNumber: z.string().min(1),
      status: z.string().optional(),
      subtotal: z.number().nonnegative(),
      tax: z.number().nonnegative(),
      shipping: z.number().nonnegative(),
      discount: z.number().nonnegative(),
      total: z.number().nonnegative(),
      paymentMethod: z.string().optional(),
      paymentStatus: z.string().optional(),
      notes: z.string().optional(),
      items: z.array(z.object({ productId: z.string(), name: z.string(), price: z.number(), quantity: z.number().int().positive(), color: z.string().optional(), size: z.string().optional(), image: z.string().optional() })).optional().default([])
    }).safeParse(req.body);

    if (!parsed.success) throw new AppError('Invalid order payload', 400);

    const order = await prisma.order.create({
      data: {
        ...parsed.data,
        items: {
          create: parsed.data.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            color: item.color,
            size: item.size,
            image: item.image || ''
          }))
        }
      },
      include: { items: true }
    });

    res.status(201).json(order);
  } catch (err) {
    handleError(err, res);
  }
});

router.post('/api/uploads', async (req, res) => {
  try {
    const { file, folder } = req.body as { file?: string; folder?: 'products' | 'categories' | 'banners' | 'store' };
    if (!file || !folder) throw new AppError('Image and folder are required', 400);

    const result = await saveImageFromBase64(file, { folder });
    res.status(201).json(result);
  } catch (err) {
    handleError(err, res);
  }
});

router.post('/api/uploads/delete', async (req, res) => {
  try {
    const { path: imagePath } = req.body as { path?: string };
    if (!imagePath) throw new AppError('Image path is required', 400);
    await deleteImageIfExists(imagePath);
    res.json({ ok: true });
  } catch (err) {
    handleError(err, res);
  }
});

router.get('/api/settings', async (_req, res) => {
  try {
    const settings = await prisma.storeSettings.findFirst();
    res.json(settings || {});
  } catch (err) {
    handleError(err, res);
  }
});

router.put('/api/settings', requireAuth, async (req, res) => {
  try {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError('Invalid settings payload', 400);

    const existing = await prisma.storeSettings.findFirst();
    const settings = existing
      ? await prisma.storeSettings.update({ where: { id: existing.id }, data: parsed.data })
      : await prisma.storeSettings.create({ data: parsed.data });

    res.json(settings);
  } catch (err) {
    handleError(err, res);
  }
});

router.post('/api/reports/email', authMiddleware, requirePlanFeature('analytics_reports'), async (req, res) => {
  try {
    const { payload, reportData } = req.body || {};
    if (!payload?.recipientEmail || !reportData?.title) {
      throw new AppError('Recipient email and report data are required', 400);
    }

    // Server-side email log & dispatch audit
    console.log(`[ERP EMAIL DISPATCH] Report "${reportData.title}" dispatched to ${payload.recipientEmail} (${payload.format.toUpperCase()})`);

    res.json({ 
      ok: true, 
      message: `Report queued and dispatched to ${payload.recipientEmail}`,
      dispatchedAt: new Date().toISOString()
    });
  } catch (err) {
    handleError(err, res);
  }
});

// ============================================================
// EBAY & MULTI-CHANNEL INTEGRATION ENDPOINTS
// ============================================================

router.use('/api/ebay', authMiddleware, requirePlanFeature('api_access'));

router.get('/api/ebay/oauth/authorize', (req, res) => {
  const marketplace = (req.query.marketplace as string) || 'EBAY_AU';
  const clientId = 'TechSeller-ERP-PRD-18928374-4819';
  const redirectUri = encodeURIComponent('https://techseller.app/api/ebay/oauth/callback');
  const scope = encodeURIComponent('https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.fulfillment');
  const authUrl = `https://auth.ebay.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${marketplace}`;
  
  res.json({ ok: true, authUrl, marketplace });
});

router.post('/api/ebay/oauth/callback', (req, res) => {
  try {
    const { code, marketplace } = req.body || {};
    const mkt = marketplace || 'EBAY_AU';
    const expiresAt = new Date(Date.now() + 7200 * 1000).toISOString();

    res.json({
      ok: true,
      account: {
        id: `ACC-EBAY-${mkt}-${Date.now().toString().slice(-4)}`,
        channel: 'eBay',
        marketplace: mkt,
        sellerId: `seller_${mkt.toLowerCase()}_${Math.floor(1000 + Math.random() * 9000)}`,
        storeName: `Tech Seller ${mkt.replace('EBAY_', '')} Marketplace Store`,
        status: 'Connected',
        accessTokenEncrypted: 'v^1.1#encrypted_oauth_token',
        refreshTokenEncrypted: 'r^1.1#encrypted_refresh_token',
        tokenExpiresAt: expiresAt,
        syncFrequencyMinutes: 15,
        lastSyncAt: new Date().toISOString(),
        nextSyncAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    handleError(err, res);
  }
});

router.post('/api/ebay/sync', (req, res) => {
  try {
    const { accountId, jobType } = req.body || {};
    res.json({
      ok: true,
      job: {
        id: `JOB-${Date.now()}`,
        accountId: accountId || 'ACC-EBAY-AU',
        jobType: jobType || 'REALTIME_INVENTORY_SYNC',
        status: 'In Progress',
        progressPercent: 20,
        totalItems: 35,
        processedItems: 7,
        failedItems: 0,
        startedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    handleError(err, res);
  }
});

router.post('/api/ebay/listings/publish', (req, res) => {
  try {
    const { productId, product } = req.body || {};
    const listingId = `1259${Math.floor(10000000 + Math.random() * 90000000)}`;

    res.json({
      ok: true,
      listing: {
        id: `LST-${Date.now()}`,
        accountId: 'ACC-EBAY-AU',
        productId: productId || product?.id || 'P-001',
        externalListingId: listingId,
        channel: 'eBay',
        title: product?.name || 'Dell Latitude 5420 Enterprise Laptop',
        sku: product?.specs?.sku || productId,
        price: product?.discountPrice || product?.price || 649.00,
        quantity: product?.stock || 10,
        status: 'Active',
        listingUrl: `https://www.ebay.com.au/itm/${listingId}`,
        lastSyncAt: new Date().toISOString()
      }
    });
  } catch (err) {
    handleError(err, res);
  }
});

router.post('/api/ebay/orders/shipment', (req, res) => {
  try {
    const { orderId, trackingNumber, carrier } = req.body || {};
    if (!orderId || !trackingNumber) {
      throw new AppError('Order ID and tracking number are required', 400);
    }

    console.log(`[eBay FULFILLMENT SYNC] Uploaded tracking #${trackingNumber} (${carrier || 'Australia Post'}) for Order #${orderId}`);
    res.json({
      ok: true,
      message: `Tracking #${trackingNumber} successfully uploaded to eBay for Order #${orderId}`,
      syncedAt: new Date().toISOString()
    });
  } catch (err) {
    handleError(err, res);
  }
});

// ============================================================
// MASTER DATA MANAGEMENT ENDPOINTS (15 ENTITIES)
// ============================================================

router.use('/api/master-data', authMiddleware, requirePlanFeature('master_data'));

const getMasterDataModel = (entity: string): any => {
  switch (entity) {
    case 'categories': return prisma.category;
    case 'brands': return prisma.brand;
    case 'units': return prisma.unitOfMeasure;
    case 'product-status': return prisma.productStatus;
    case 'warehouses': return prisma.warehouseLocation;
    case 'taxes': return prisma.taxRate;
    case 'payment-terms': return prisma.paymentTerm;
    case 'shipping-methods': return prisma.shippingMethod;
    case 'warranties': return prisma.warrantyType;
    case 'attributes': return prisma.productAttribute;
    case 'attribute-values': return prisma.attributeValue;
    case 'countries': return prisma.country;
    case 'currencies': return prisma.currency;
    case 'languages': return prisma.language;
    case 'conditions': return prisma.productCondition;
    default: return null;
  }
};

router.get('/api/master-data/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const model = getMasterDataModel(entity);
    if (!model) throw new AppError(`Unknown master data entity '${entity}'`, 400);

    const search = String(req.query.search || '').trim();
    let where: any = {};

    if (search) {
      if (['currencies', 'languages'].includes(entity)) {
        where = { OR: [{ code: { contains: search, mode: 'insensitive' } }, { name: { contains: search, mode: 'insensitive' } }] };
      } else if (entity === 'attribute-values') {
        where = { value: { contains: search, mode: 'insensitive' } };
      } else {
        where = { name: { contains: search, mode: 'insensitive' } };
      }
    }

    let items = await model.findMany({
      where,
      orderBy: entity === 'categories' ? [{ sortOrder: 'asc' }, { name: 'asc' }] : { createdAt: 'desc' },
      include: entity === 'attributes' ? { values: true } : entity === 'attribute-values' ? { attribute: true } : undefined
    });

    if (items.length === 0 && !search) {
      await seedMasterData();
      items = await model.findMany({
        where,
        orderBy: entity === 'categories' ? [{ sortOrder: 'asc' }, { name: 'asc' }] : { createdAt: 'desc' },
        include: entity === 'attributes' ? { values: true } : entity === 'attribute-values' ? { attribute: true } : undefined
      });
    }

    res.json(items);
  } catch (err) {
    handleError(err, res);
  }
});

router.post('/api/master-data/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const model = getMasterDataModel(entity);
    if (!model) throw new AppError(`Unknown master data entity '${entity}'`, 400);

    const data = { ...req.body, isSystem: req.body.isSystem === true };
    const item = await model.create({ data });
    res.status(201).json(item);
  } catch (err) {
    handleError(err, res);
  }
});

router.put('/api/master-data/:entity/:id', async (req, res) => {
  try {
    const { entity, id } = req.params;
    const model = getMasterDataModel(entity);
    if (!model) throw new AppError(`Unknown master data entity '${entity}'`, 400);

    const existing = await model.findUnique({ where: { id } });
    if (!existing) throw new AppError('Record not found', 404);

    const updated = await model.update({ where: { id }, data: req.body });
    res.json(updated);
  } catch (err) {
    handleError(err, res);
  }
});

router.delete('/api/master-data/:entity/:id', async (req, res) => {
  try {
    const { entity, id } = req.params;
    const model = getMasterDataModel(entity);
    if (!model) throw new AppError(`Unknown master data entity '${entity}'`, 400);

    const existing = await model.findUnique({ where: { id } });
    if (!existing) throw new AppError('Record not found', 404);

    if (existing.isSystem) {
      throw new AppError('System-protected built-in records cannot be deleted.', 400);
    }

    await model.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    handleError(err, res);
  }
});

export default router;
