import { validateEnvironment } from '../src/server/envValidator';
import app from '../src/server/app';

// Validate environment on serverless invocation
validateEnvironment();

export default app;


