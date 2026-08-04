import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  categoryId: z.string().optional().nullable(),
  price: z.number().nonnegative(),
  discountPrice: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative(),
  rating: z.number().optional(),
  reviewsCount: z.number().optional(),
  specs: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()).optional(),
  image: z.string().optional(),
  additionalImages: z.array(z.string()).optional(),
  collection: z.string().optional(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  serialNumbers: z.array(z.string()).optional(),
  costPrice: z.number().nonnegative().optional()
});

export const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().default('')
});

export const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  city: z.string().optional().default(''),
  type: z.enum(['Retail', 'Wholesale']).optional().default('Retail'),
  company: z.string().optional().default(''),
  abn: z.string().optional().default(''),
  walletBalance: z.number().optional().default(0),
  points: z.number().optional().default(0),
  wishlist: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default('')
});

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const settingsSchema = z.object({
  storeName: z.string().optional(),
  storeTagline: z.string().optional(),
  legalName: z.string().optional(),
  businessNumber: z.string().optional(),
  currencySymbol: z.string().optional(),
  taxRatePercent: z.number().optional(),
  taxName: z.string().optional(),
  address: z.string().optional(),
  cityStateZip: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  businessHours: z.string().optional(),
  whyShopHeadingTop: z.string().optional(),
  whyShopHeadingHighlight: z.string().optional(),
  whyShopHeadingBottom: z.string().optional(),
  whyShopBodyText: z.string().optional(),
  whyShopBulletPoints: z.array(z.string()).optional()
});
