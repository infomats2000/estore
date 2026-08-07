import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { deleteObjectByPublicUrl, isObjectStorageConfigured, putObject } from './objectStorage';
import { getActiveTenantId } from './tenantContext';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface UploadResult {
  path: string;
  filename: string;
  extension: string;
  size: number;
  variants: { thumbnail: string; catalog: string; detail: string };
  assets: Array<{ path: string; size: number }>;
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

  let variantBuffers: { thumbnail: Buffer; catalog: Buffer; detail: Buffer };
  try {
    const createVariant = (size: number, quality: number) => sharp(buffer, { failOn: 'error' }).rotate()
      .resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })
      .webp({ quality, effort: 4, smartSubsample: true }).toBuffer();
    const [thumbnail, catalog, detail] = await Promise.all([
      createVariant(320, 72), createVariant(800, 76), createVariant(1600, 80),
    ]);
    variantBuffers = { thumbnail, catalog, detail };
  } catch {
    throw new Error('Invalid or corrupt image data');
  }

  const extension = 'webp';
  const basename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  const filenames = {
    thumbnail: `${basename}-thumb.${extension}`,
    catalog: `${basename}-catalog.${extension}`,
    detail: `${basename}-detail.${extension}`,
  };
  const filename = filenames.detail;
  const relativeDir = path.posix.join('/uploads', options.folder);
  const outputDir = options.outputDir ? path.resolve(options.outputDir, options.folder) : path.resolve(process.cwd(), 'public', 'uploads', options.folder);

  if (!options.outputDir && isObjectStorageConfigured()) {
    const stored: Array<readonly [keyof typeof filenames, string]> = [];
    try {
      for (const variant of Object.keys(filenames) as Array<keyof typeof filenames>) {
        const objectKey = path.posix.join('tenants', getActiveTenantId(), options.folder, filenames[variant]);
        stored.push([variant, await putObject(objectKey, variantBuffers[variant], 'image/webp')] as const);
      }
    } catch (error) {
      await Promise.allSettled(stored.map(([, publicUrl]) => deleteObjectByPublicUrl(publicUrl)));
      throw error;
    }
    const variants = Object.fromEntries(stored) as UploadResult['variants'];
    const assets = (Object.keys(variants) as Array<keyof typeof variants>).map((variant) => ({ path: variants[variant], size: variantBuffers[variant].length }));
    return { path: variants.detail, filename, extension, size: assets.reduce((sum, asset) => sum + asset.size, 0), variants, assets };
  }

  try {
    await fs.mkdir(outputDir, { recursive: true });
    await Promise.all((Object.keys(filenames) as Array<keyof typeof filenames>).map((variant) =>
      fs.writeFile(path.join(outputDir, filenames[variant]), variantBuffers[variant])));
  } catch (e) {
    if (process.env.NODE_ENV === 'production') throw new Error('Image storage is unavailable');
    const dataUrl = `data:image/webp;base64,${variantBuffers.detail.toString('base64')}`;
    return {
      path: dataUrl, filename, extension, size: variantBuffers.detail.length,
      variants: { thumbnail: dataUrl, catalog: dataUrl, detail: dataUrl },
      assets: [],
    };
  }

  const variants = Object.fromEntries((Object.keys(filenames) as Array<keyof typeof filenames>).map((variant) =>
    [variant, path.posix.join(relativeDir, filenames[variant])])) as UploadResult['variants'];
  const assets = (Object.keys(variants) as Array<keyof typeof variants>).map((variant) => ({ path: variants[variant], size: variantBuffers[variant].length }));
  return {
    path: variants.detail, filename, extension,
    size: assets.reduce((sum, asset) => sum + asset.size, 0), variants, assets,
  };
};

export const deleteImageIfExists = async (imagePath?: string | null, publicUploadsDirOverride?: string) => {
  if (!imagePath || imagePath.startsWith('data:')) return;
  if (/^https:\/\//i.test(imagePath)) {
    await deleteObjectByPublicUrl(imagePath);
    return;
  }
  if (!imagePath.startsWith('/uploads/')) return;
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

