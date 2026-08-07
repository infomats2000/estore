import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

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

  let optimizedBuffer: Buffer;
  try {
    optimizedBuffer = await sharp(buffer, { failOn: 'error' })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78, effort: 4, smartSubsample: true })
      .toBuffer();
  } catch {
    throw new Error('Invalid or corrupt image data');
  }

  const extension = 'webp';
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`;
  const relativeDir = path.posix.join('/uploads', options.folder);
  const outputDir = options.outputDir ? path.resolve(options.outputDir, options.folder) : path.resolve(process.cwd(), 'public', 'uploads', options.folder);

  try {
    await fs.mkdir(outputDir, { recursive: true });
    const fullPath = path.join(outputDir, filename);
    await fs.writeFile(fullPath, optimizedBuffer);
  } catch (e) {
    // Preserve optimized WebP bytes when local disk is read-only.
    return {
      path: `data:image/webp;base64,${optimizedBuffer.toString('base64')}`,
      filename,
      extension,
      size: optimizedBuffer.length,
    };
  }

  return {
    path: path.posix.join(relativeDir, filename),
    filename,
    extension,
    size: optimizedBuffer.length,
  };
};

export const deleteImageIfExists = async (imagePath?: string | null, publicUploadsDirOverride?: string) => {
  if (!imagePath || imagePath.startsWith('data:') || !imagePath.startsWith('/uploads/')) return;
  try {
    const publicUploadsDir = publicUploadsDirOverride ? path.resolve(publicUploadsDirOverride) : path.resolve(process.cwd(), 'public', 'uploads');
    const uploadRelativePath = imagePath.replace(/^\/uploads\/?/, '');
    const absolutePath = path.resolve(publicUploadsDir, uploadRelativePath);

    const relativePath = path.relative(publicUploadsDir, absolutePath);
    if (relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          await fs.rm(absolutePath, { force: true });
          break;
        } catch (error: any) {
          if (!['EBUSY', 'EPERM'].includes(error?.code) || attempt === 3) throw error;
          await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
        }
      }
    }
  } catch (e) {
    if (publicUploadsDirOverride) throw e;
  }
};

