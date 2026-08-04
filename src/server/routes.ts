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
      sizes: parsed.data.sizes ?? []
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
      sizes: parsed.data.sizes ?? []
    });

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: normalizedData
    });
    res.json(serializeProductForResponse(product));
  } catch (err) {
    handleError(err, res);
  }
});

router.delete('/api/products/:id', async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Product not found', 404);

    await prisma.product.delete({ where: { id: req.params.id } });
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

export default router;
