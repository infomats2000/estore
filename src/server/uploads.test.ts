import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { saveImageFromBase64 } from './uploads';

test('saveImageFromBase64 writes a validated image to disk', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'techseller-upload-'));
  const base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQABAAU8mNQAAAAAElFTkSuQmCC';

  const result = await saveImageFromBase64(base64, { folder: 'test', outputDir: tempDir });

  assert.match(result.path, /^\/uploads\/test\//);
  assert.equal(result.extension, 'png');

  const fullPath = path.join(tempDir, 'test', result.filename);
  const exists = await fs.stat(fullPath).then(() => true).catch(() => false);
  assert.equal(exists, true);

  await fs.rm(tempDir, { recursive: true, force: true });
});
