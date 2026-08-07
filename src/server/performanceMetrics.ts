import type { NextFunction, Request, Response } from 'express';

interface RouteMetric {
  count: number;
  errors: number;
  totalDurationMs: number;
  maxDurationMs: number;
  responseBytes: number;
}

const startedAt = new Date().toISOString();
const routeMetrics = new Map<string, RouteMetric>();

const normalizePath = (path: string) => path
  .replace(/\b[a-z0-9]{20,30}\b/gi, ':id')
  .replace(/\/\d+(?=\/|$)/g, '/:id');

export function trackRequestPerformance(req: Request, res: Response, next: NextFunction) {
  const start = performance.now();
  res.on('finish', () => {
    const durationMs = performance.now() - start;
    const key = `${req.method} ${normalizePath(req.path)}`;
    const current = routeMetrics.get(key) || { count: 0, errors: 0, totalDurationMs: 0, maxDurationMs: 0, responseBytes: 0 };
    current.count += 1;
    current.errors += res.statusCode >= 500 ? 1 : 0;
    current.totalDurationMs += durationMs;
    current.maxDurationMs = Math.max(current.maxDurationMs, durationMs);
    current.responseBytes += Number(res.getHeader('content-length') || 0);
    routeMetrics.set(key, current);

    if (durationMs >= 1000) {
      console.warn(`[PERF] Slow request ${key} ${durationMs.toFixed(0)}ms status=${res.statusCode}`);
    }
    if (routeMetrics.size > 200) routeMetrics.delete(routeMetrics.keys().next().value as string);
  });
  next();
}

export function getPerformanceSnapshot() {
  return {
    startedAt,
    generatedAt: new Date().toISOString(),
    routes: [...routeMetrics.entries()].map(([route, value]) => ({
      route,
      count: value.count,
      errors: value.errors,
      averageDurationMs: Number((value.totalDurationMs / value.count).toFixed(2)),
      maxDurationMs: Number(value.maxDurationMs.toFixed(2)),
      responseBytes: value.responseBytes,
    })).sort((a, b) => b.averageDurationMs - a.averageDurationMs),
  };
}
