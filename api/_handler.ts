import { validateEnvironment } from '../src/server/envValidator';
import app from '../src/server/app';

export default async function handler(req: any, res: any) {
  try {
    const env = validateEnvironment();
    if (!env.isValid) {
      return res.status(500).json({
        success: false,
        error: 'Environment validation failed. Check Vercel DATABASE_URL and JWT_SECRET values.',
        missing: env.missingVars,
        warnings: env.warnings,
      });
    }
    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel Serverless Invocation Error]:', error);
    return res.status(500).json({
      success: false,
      error: `Serverless Invocation Failed: ${error?.message || error}`,
    });
  }
}
