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
  imageVariants: z.object({
    thumbnail: z.string(),
    catalog: z.string(),
    detail: z.string()
  }).optional(),
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
  whyShopBulletPoints: z.array(z.string()).optional(),
  themePrimaryColor: z.string().optional(), themeAccentColor: z.string().optional(),
  showFlashSaleBanner: z.boolean().optional(), flashSaleTitle: z.string().optional(), flashSaleText: z.string().optional(), flashSaleCouponCode: z.string().optional(),
  storefrontBackgroundColor: z.string().optional(), storefrontSurfaceColor: z.string().optional(), storefrontTextColor: z.string().optional(), storefrontMutedTextColor: z.string().optional(),
  storefrontHeaderColor: z.string().optional(), storefrontHeaderTextColor: z.string().optional(), storefrontFooterColor: z.string().optional(), storefrontFooterTextColor: z.string().optional(),
  storefrontBorderColor: z.string().optional(), storefrontButtonTextColor: z.string().optional(), storefrontFontStyle: z.enum(['modern', 'classic', 'rounded']).optional(), storefrontCornerStyle: z.enum(['square', 'soft', 'rounded']).optional(),
  showCategorySection: z.boolean().optional(), categorySectionEyebrow: z.string().optional(), categorySectionTitle: z.string().optional(), categorySectionDescription: z.string().optional(),
  catalogSectionEyebrow: z.string().optional(), catalogSectionTitle: z.string().optional(), catalogStyle: z.enum(['classic', 'compact', 'minimal', 'list']).optional(), catalogFilterPosition: z.enum(['top', 'left']).optional(),
  storefrontSectionOrder: z.array(z.enum(['hero', 'flashSale', 'categories', 'catalog', 'brands', 'recentlyViewed', 'whyShop', 'newsletter'])).length(8).refine((items) => new Set(items).size === items.length, 'Section order must contain each section once').optional(), showWhyShopSection: z.boolean().optional(),
  showHeroBanner: z.boolean().optional(), heroEyebrow: z.string().optional(), heroTitle: z.string().optional(), heroHighlight: z.string().optional(), heroDescription: z.string().optional(), heroImageUrl: z.string().optional(),
  heroPrimaryButtonText: z.string().optional(), heroPrimaryButtonUrl: z.string().optional(), heroSecondaryButtonText: z.string().optional(), heroSecondaryButtonUrl: z.string().optional(),
  showNewsletterSection: z.boolean().optional(), newsletterEyebrow: z.string().optional(), newsletterTitle: z.string().optional(), newsletterDescription: z.string().optional(), newsletterButtonText: z.string().optional(),
  showServiceHighlights: z.boolean().optional(), shippingHighlightTitle: z.string().optional(), shippingHighlightText: z.string().optional(), supportHighlightTitle: z.string().optional(), supportHighlightText: z.string().optional(),
  showStorefrontFooter: z.boolean().optional(), footerCategoriesHeading: z.string().optional(), footerCustomerCareHeading: z.string().optional(), footerWarrantyText: z.string().optional(), footerReturnsText: z.string().optional(), footerShippingText: z.string().optional(), footerCopyrightText: z.string().optional(), footerOwnershipText: z.string().optional(), footerPaymentsText: z.string().optional()
});
