import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface UploadResult {
  path: string;
  filename: string;
  extension: string;
  size: number;
}

export interface SaveImageOptions {
  folder: 'products' | 'categories' | 'banners' | 'store' | 'test';
  outputDir?: string;
}

export const saveImageFromBase64 = async (dataUrl: string, options: SaveImageOptions): Promise<UploadResult> => {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image data');
  }

  const mimeType = match[1];
  const base64Data = match[2];
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error('Unsupported image type');
  }

  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error('Image exceeds 10MB limit');
  }

  const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`;
  const relativeDir = path.posix.join('/uploads', options.folder);
  const outputDir = options.outputDir ? path.resolve(options.outputDir, options.folder) : path.resolve(process.cwd(), 'public', 'uploads', options.folder);

  await fs.mkdir(outputDir, { recursive: true });
  const fullPath = path.join(outputDir, filename);
  await fs.writeFile(fullPath, buffer);

  return {
    path: path.posix.join(relativeDir, filename),
    filename,
    extension,
    size: buffer.length,
  };
};

export const deleteImageIfExists = async (imagePath?: string | null) => {
  if (!imagePath) return;
  const absolutePath = path.resolve(process.cwd(), 'public', imagePath.replace(/^\//, ''));
  await fs.rm(absolutePath, { force: true });
};
