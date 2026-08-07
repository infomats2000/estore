export interface EnvValidationResult {
  isValid: boolean;
  missingVars: string[];
  warnings: string[];
  config: {
    databaseUrl: string;
    jwtSecret: string;
    nodeEnv: string;
    appUrl: string;
    hasDirectUrl: boolean;
  };
}

const PLACEHOLDER_DB_HOSTS = new Set(['db.prisma.io', 'pooled.db.prisma.io', 'HOST']);

function getDbHost(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return '';
  }
}

function isPlaceholderDatabaseUrl(rawUrl: string): boolean {
  if (!rawUrl) return true;

  const host = getDbHost(rawUrl);
  if (PLACEHOLDER_DB_HOSTS.has(host)) return true;

  const lowered = rawUrl.toLowerCase();
  return (
    lowered.includes('user:password@host') ||
    lowered.includes('replace-with') ||
    lowered.includes('example.com/db_name')
  );
}

function isPlaceholderJwtSecret(secret: string): boolean {
  const trimmed = secret.trim();
  return !trimmed || trimmed === 'replace-with-a-long-random-string';
}

/**
 * Reusable environment validator for production, Vercel, and local runtime environments.
 * Auto-resolves Vercel Postgres aliases (POSTGRES_URL, PRISMA_DATABASE_URL) to DATABASE_URL.
 */
export function validateEnvironment(): EnvValidationResult {
  // 1. Auto-resolve DATABASE_URL & DIRECT_URL from Vercel Postgres aliases if missing
  if (!process.env.DATABASE_URL) {
    const resolvedUrl =
      process.env.POSTGRES_URL ||
      process.env.PRISMA_DATABASE_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING;
    if (resolvedUrl) {
      process.env.DATABASE_URL = resolvedUrl;
    }
  }

  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
  }


  const missingVars: string[] = [];
  const warnings: string[] = [];

  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

  // Validate DATABASE_URL
  if (!process.env.DATABASE_URL || isPlaceholderDatabaseUrl(process.env.DATABASE_URL)) {
    missingVars.push('DATABASE_URL (or Vercel POSTGRES_URL / PRISMA_DATABASE_URL)');
    const currentHost = process.env.DATABASE_URL ? getDbHost(process.env.DATABASE_URL) : '';
    if (currentHost) {
      warnings.push(`DATABASE_URL currently resolves to invalid/placeholder host: ${currentHost}`);
    }
  }

  // Validate JWT_SECRET
  if (!process.env.JWT_SECRET || isPlaceholderJwtSecret(process.env.JWT_SECRET)) {
    if (isProduction) {
      missingVars.push('JWT_SECRET');
    } else {
      warnings.push('JWT_SECRET is not set; using development fallback secret.');
    }
  }

  // Check DIRECT_URL recommendation
  if (!process.env.DIRECT_URL) {
    warnings.push('DIRECT_URL is not set. A direct connection URL is recommended for Prisma migrations if using PgBouncer/Neon connection pooling.');
  }

  const isValid = missingVars.length === 0;

  if (!isValid) {
    console.error(`❌ [ENVIRONMENT ERROR] Missing required environment variables:\n  - ${missingVars.join('\n  - ')}`);
  } else if (warnings.length > 0) {
    console.warn(`⚠️ [ENVIRONMENT WARNINGS]:\n  - ${warnings.join('\n  - ')}`);
  } else {
    console.log(`✅ [ENVIRONMENT SUCCESS] All required environment variables verified.`);
  }

  return {
    isValid,
    missingVars,
    warnings,
    config: {
      databaseUrl: process.env.DATABASE_URL || '',
      jwtSecret: process.env.JWT_SECRET || (isProduction ? '' : 'dev-secret'),
      nodeEnv: process.env.NODE_ENV || 'development',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      hasDirectUrl: !!process.env.DIRECT_URL,
    },
  };
}
