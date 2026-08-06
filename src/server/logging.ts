import fs from 'node:fs/promises';
import path from 'node:path';

export const writeLog = async (entry: string, fileName = 'app.log') => {
  console.log(`[APP LOG] ${new Date().toISOString()} ${entry}`);
  try {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      return;
    }
    const logPath = path.resolve(process.cwd(), 'logs', fileName);
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    await fs.appendFile(logPath, `${new Date().toISOString()} ${entry}\n`);
  } catch (e) {
    // Ignore read-only filesystem errors in serverless environments
  }
};
