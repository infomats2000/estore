import fs from 'node:fs/promises';
import path from 'node:path';

export const writeLog = async (entry: string, fileName = 'app.log') => {
  const logPath = path.resolve(process.cwd(), 'logs', fileName);
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.appendFile(logPath, `${new Date().toISOString()} ${entry}\n`);
};
