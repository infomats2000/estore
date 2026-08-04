import express from 'express';
import path from 'path';
import { createServer as createHttpServer } from 'node:http';
import net from 'node:net';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { doubleCsrf } from 'csrf-csrf';
import cookieParser from 'cookie-parser';
import routes from './src/server/routes';
import { writeLog } from './src/server/logging';
import { createPaymentAdapter, PaymentService } from './src/server/payments';
import { buildRobotsTxt, buildSitemapXml, buildSeoMetadata } from './src/server/seo';
import { seedDatabase } from './src/server/seed';

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const findAvailablePort = (startPort: number): Promise<number> => {
  const tryPort = (port: number, resolve: (port: number) => void, reject: (error: Error) => void) => {
    const tester = net.createServer();

    tester.once('error', (error: NodeJS.ErrnoException) => {
      tester.close();
      if (error.code === 'EADDRINUSE') {
        tryPort(port + 1, resolve, reject);
        return;
      }
      reject(error);
    });

    tester.once('listening', () => {
      tester.close(() => resolve(port));
    });

    tester.listen(port, '0.0.0.0');
  };

  return new Promise((resolve, reject) => {
    tryPort(startPort, resolve, reject);
  });
};

async function startServer() {
  const app = express();
  const requestedPort = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';
  const resolvedPort = isProd ? requestedPort : await findAvailablePort(requestedPort);
  const server = createHttpServer(app);

  // Base64 image uploads limit configured safely.
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Serve static files and uploads
  const publicDir = path.resolve(process.cwd(), 'public');
  app.use(express.static(publicDir));
  app.use('/uploads', express.static(path.resolve(publicDir, 'uploads')));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 300 : 5000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV !== 'production' && req.path.startsWith('/api/')
  });
  app.use('/api', limiter);

  app.use((req, _res, next) => {
    void writeLog(`${req.method} ${req.path}`);
    next();
  });

  const { doubleCsrfProtection } = doubleCsrf({
    getSecret: () => process.env.JWT_SECRET || 'secret-key-change-me',
    cookieName: 'x-csrf-token',
    cookieOptions: {
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    },
  });

  app.use((req, res, next) => {
    const skipCsrf = req.path.startsWith('/api/');
    if (skipCsrf) {
      return next();
    }
    return doubleCsrfProtection(req, res, next);
  });
  app.use(routes);

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
    const urls = [`${baseUrl}/`, `${baseUrl}/products`, `${baseUrl}/about`].map(u => u.replace(/([^:]\/)\/+/g, "$1"));
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
          unit_amount: Math.round(item.price * 100), // convert to cents
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

  try {
    await seedDatabase();
    console.log('Database seed initialized');
  } catch (error) {
    console.warn('Database seed skipped:', error);
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          clientPort: resolvedPort,
          server,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (resolvedPort !== requestedPort) {
    console.warn(`Port ${requestedPort} is busy. Trying ${resolvedPort} instead.`);
  }

  server.listen(resolvedPort, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${resolvedPort}`);
  });
}

startServer();
