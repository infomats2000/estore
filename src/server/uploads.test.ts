import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { saveImageFromBase64, deleteImageIfExists } from './uploads';
import sharp from 'sharp';

test('saveImageFromBase64 writes a validated image to disk', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'techseller-upload-'));
  const pngBuffer = await sharp({
    create: { width: 2, height: 2, channels: 4, background: { r: 35, g: 99, b: 235, alpha: 1 } }
  }).png().toBuffer();
  const base64 = `data:image/png;base64,${pngBuffer.toString('base64')}`;

  const result = await saveImageFromBase64(base64, { folder: 'test', outputDir: tempDir });

  assert.match(result.path, /^\/uploads\/test\//);
  assert.equal(result.extension, 'webp');
  assert.equal(result.assets.length, 3);
  assert.match(result.variants.thumbnail, /-thumb\.webp$/);
  assert.match(result.variants.catalog, /-catalog\.webp$/);
  assert.match(result.variants.detail, /-detail\.webp$/);
  assert.equal(result.size, result.assets.reduce((sum, asset) => sum + asset.size, 0));

  const fullPath = path.join(tempDir, 'test', result.filename);
  const exists = await fs.stat(fullPath).then(() => true).catch(() => false);
  assert.equal(exists, true);
  const savedBytes = await fs.readFile(fullPath);
  assert.equal(savedBytes.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(savedBytes.subarray(8, 12).toString('ascii'), 'WEBP');

  await deleteImageIfExists(result.path, tempDir);
  const existsAfterDelete = await fs.stat(fullPath).then(() => true).catch(() => false);
  assert.equal(existsAfterDelete, false);

  await fs.rm(tempDir, { recursive: true, force: true });
});
