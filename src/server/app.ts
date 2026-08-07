import express from 'express';
import path from 'path';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { doubleCsrf } from 'csrf-csrf';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import legacyRoutes from './legacyRoutes';
import onboardingRoutes from './routes/onboarding';

import superadminRoutes from './routes/superadmin';
import saasAuthRoutes from './routes/saasAuth';
import tenantBillingRoutes from './routes/tenantBilling';
import inboundJobRoutes from './routes/inboundJobs';
import posRoutes from './routes/pos';
import posOperationsRoutes from './routes/posOperations';
import tenantStaffRoutes from './routes/tenantStaff';
import { tenantResolverMiddleware } from './middleware/tenantResolver';
import { writeLog } from './logging';
import { createPaymentAdapter, PaymentService } from './payments';
import { buildRobotsTxt, buildSitemapXml, buildSeoMetadata } from './seo';
import { trackRequestPerformance } from './performanceMetrics';

dotenv.config({ path: ['.env.local', '.env'] });
dotenv.config({ path: '.env.development.local', override: true });

const app = express();

app.use(compression({ threshold: 1024 }));

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Base64 image uploads limit configured safely.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(trackRequestPerformance);

// Serve static files and uploads
const publicDir = path.resolve(process.cwd(), 'public');
app.use(express.static(publicDir, { maxAge: '1h' }));
app.use('/uploads', express.static(path.resolve(publicDir, 'uploads'), {
  maxAge: '30d',
  immutable: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production' && req.path.startsWith('/api/')
});
app.use('/api', limiter);

app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'production' || process.env.LOG_REQUESTS === 'true') {
    void writeLog(`${req.method} ${req.path}`);
  }
  next();
});

// SaaS Multi-Tenant Resolution Middleware
app.use(tenantResolverMiddleware);

// SaaS Authentication, Public Onboarding, Billing & Super Admin Routers
app.use('/api/auth', saasAuthRoutes);
app.use('/auth', saasAuthRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/onboarding', onboardingRoutes);
app.use('/api/billing', tenantBillingRoutes);
app.use('/billing', tenantBillingRoutes);
app.use('/api/inbound-jobs', inboundJobRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/pos', posOperationsRoutes);
app.use('/api/tenant-staff', tenantStaffRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/superadmin', superadminRoutes);




let doubleCsrfProtection: any = (_req: any, _res: any, next: any) => next();
try {
  const csrf = doubleCsrf({
    getSecret: () => process.env.JWT_SECRET || 'dev-secret-key-must-be-at-least-32-chars-long-infomats-store-erp',
    getSessionIdentifier: (req) => (req as any).cookies?.session || 'anonymous',
    cookieName: 'x-csrf-token',
    cookieOptions: {
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    },
  });
  doubleCsrfProtection = csrf.doubleCsrfProtection;
} catch (csrfErr) {
  console.warn('⚠️ [CSRF Warning] doubleCsrf initialization skipped:', csrfErr);
}

app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  const skipCsrf = req.path.startsWith('/api/');
  if (skipCsrf) {
    return next();
  }
  return doubleCsrfProtection(req, res, next);
});


app.use(legacyRoutes);


app.post('/api/payments/session', async (req, res) => {
  try {
    const provider = (req.body.provider || 'stripe').toLowerCase();
    const adapter = createPaymentAdapter(provider as any);
    const service = new PaymentService(adapter);
    const result = await service.createSession({
      amount: req.body.amount || 0,
      currency: req.body.currency || 'AUD',
      orderId: req.body.orderId || 'order-1',
      customerEmail: req.body.customerEmail,
      successUrl: req.body.successUrl,
      cancelUrl: req.body.cancelUrl
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(buildRobotsTxt());
});

app.get('/sitemap.xml', (req, res) => {
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:3000';
  const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
  const urls = [`${baseUrl}/`, `${baseUrl}/products`].map(u => u.replace(/([^:]\/)\/+/g, "$1"));
  res.type('application/xml').send(buildSitemapXml(urls));
});

app.get('/api/seo/metadata', (req, res) => {
  const slug = String(req.query.slug || 'home');
  const title = String(req.query.title || 'Tech Seller');
  const description = String(req.query.description || 'Premium refurbished hardware and electronics.');
  res.json(buildSeoMetadata(title, description, slug));
});

// Stripe Checkout Endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(200).json({
      fallback: true,
      message: 'Stripe is not configured. Completing your order locally.'
    });
  }

  try {
    const { items, successUrl, cancelUrl } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid items' });
    }

    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl || `${process.env.APP_URL || 'http://localhost:3000'}/success`,
      cancel_url: cancelUrl || `${process.env.APP_URL || 'http://localhost:3000'}/cart`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
