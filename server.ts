import path from 'path';
import { createServer as createHttpServer } from 'node:http';
import net from 'node:net';
import { createServer as createViteServer } from 'vite';
import express from 'express';
import app from './src/server/app';
import { seedDatabase } from './src/server/seed';

// Process crash guards to keep local development server connected and resilient
process.on('uncaughtException', (err) => {
  console.warn('[Server Guard] Uncaught Exception:', err?.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.warn('[Server Guard] Unhandled Promise Rejection:', reason);
});

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
  const requestedPort = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';
  const resolvedPort = isProd ? requestedPort : await findAvailablePort(requestedPort);
  const server = createHttpServer(app);

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
