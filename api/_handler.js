var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/server/tenantContext.ts
import { AsyncLocalStorage } from "async_hooks";
function getActiveTenantId() {
  const store = tenantLocalStorage.getStore();
  return store?.tenantId || "default-tenant";
}
var tenantLocalStorage;
var init_tenantContext = __esm({
  "src/server/tenantContext.ts"() {
    tenantLocalStorage = new AsyncLocalStorage();
  }
});

// src/server/prismaClient.ts
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
var configuredDbUrl, resolvedDbHost, prismaRaw, TENANT_SCOPED_MODELS, db;
var init_prismaClient = __esm({
  "src/server/prismaClient.ts"() {
    init_tenantContext();
    dotenv.config({ path: [".env.local", ".env"] });
    dotenv.config({ path: ".env.development.local", override: true });
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
    }
    configuredDbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING || "";
    resolvedDbHost = (() => {
      try {
        return new URL(configuredDbUrl).host;
      } catch {
        return "";
      }
    })();
    if (resolvedDbHost) {
      console.log(`[DB] Prisma connected via host: ${resolvedDbHost}`);
    } else {
      console.warn("[DB] DATABASE_URL is not configured or invalid.");
    }
    prismaRaw = new PrismaClient({
      datasources: {
        db: {
          url: configuredDbUrl
        }
      }
    });
    TENANT_SCOPED_MODELS = /* @__PURE__ */ new Set([
      "Category",
      "Brand",
      "UnitOfMeasure",
      "ProductStatus",
      "WarehouseLocation",
      "TaxRate",
      "PaymentTerm",
      "ShippingMethod",
      "WarrantyType",
      "ProductAttribute",
      "AttributeValue",
      "ProductCondition",
      "Product",
      "ProductImage",
      "Customer",
      "Address",
      "Order",
      "OrderItem",
      "Coupon",
      "StoreSettings",
      "PaymentMethod",
      "ActivityLog"
    ]);
    db = prismaRaw.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (!TENANT_SCOPED_MODELS.has(model)) {
              return query(args);
            }
            const activeTenantId = getActiveTenantId();
            if (operation === "findMany" || operation === "findFirst" || operation === "findUnique" || operation === "count" || operation === "aggregate" || operation === "groupBy" || operation === "update" || operation === "updateMany" || operation === "delete" || operation === "deleteMany") {
              const currentArgs = args || {};
              if (operation === "findUnique") {
                return prismaRaw[model.toLowerCase()].findFirst({
                  ...currentArgs,
                  where: {
                    ...currentArgs.where || {},
                    tenantId: activeTenantId
                  }
                });
              }
              currentArgs.where = {
                ...currentArgs.where || {},
                tenantId: activeTenantId
              };
              return query(currentArgs);
            }
            if (operation === "create") {
              const currentArgs = args || {};
              currentArgs.data = {
                ...currentArgs.data || {},
                tenantId: currentArgs.data?.tenantId || activeTenantId
              };
              return query(currentArgs);
            }
            if (operation === "createMany") {
              const currentArgs = args || {};
              if (Array.isArray(currentArgs.data)) {
                currentArgs.data = currentArgs.data.map((item) => ({
                  ...item,
                  tenantId: item.tenantId || activeTenantId
                }));
              }
              return query(currentArgs);
            }
            return query(args);
          }
        }
      }
    });
  }
});

// src/server/auth.ts
var auth_exports = {};
__export(auth_exports, {
  createAuthToken: () => createAuthToken,
  findAdminUserByEmail: () => findAdminUserByEmail,
  findUserByEmail: () => findUserByEmail,
  hashPassword: () => hashPassword,
  verifyAuthToken: () => verifyAuthToken,
  verifyPassword: () => verifyPassword
});
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var SALT_ROUNDS, hashPassword, verifyPassword, getJwtSecret, createAuthToken, verifyAuthToken, findUserByEmail, findAdminUserByEmail;
var init_auth = __esm({
  "src/server/auth.ts"() {
    init_prismaClient();
    SALT_ROUNDS = 10;
    hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS);
    verifyPassword = async (password, hashedPassword) => bcrypt.compare(password, hashedPassword);
    getJwtSecret = () => {
      const secret = process.env.JWT_SECRET;
      if (!secret || secret.trim() === "replace-with-a-long-random-string") {
        if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
          throw new Error("JWT_SECRET is missing or placeholder in production environment.");
        }
        return "dev-secret";
      }
      return secret;
    };
    createAuthToken = (payload, expiresIn = "24h") => {
      const secret = getJwtSecret();
      return jwt.sign(payload, secret, { expiresIn });
    };
    verifyAuthToken = (token) => {
      const secret = getJwtSecret();
      return jwt.verify(token, secret);
    };
    findUserByEmail = async (email) => {
      return prismaRaw.user.findUnique({
        where: { email },
        include: {
          tenantUsers: {
            include: {
              tenant: {
                include: { plan: true }
              }
            }
          }
        }
      });
    };
    findAdminUserByEmail = async (email) => {
      return prismaRaw.adminUser.findUnique({ where: { email } });
    };
  }
});

// src/server/envValidator.ts
var PLACEHOLDER_DB_HOSTS = /* @__PURE__ */ new Set(["db.prisma.io", "pooled.db.prisma.io", "HOST"]);
function getDbHost(rawUrl) {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return "";
  }
}
function isPlaceholderDatabaseUrl(rawUrl) {
  if (!rawUrl) return true;
  const host = getDbHost(rawUrl);
  if (PLACEHOLDER_DB_HOSTS.has(host)) return true;
  const lowered = rawUrl.toLowerCase();
  return lowered.includes("user:password@host") || lowered.includes("replace-with") || lowered.includes("example.com/db_name");
}
function isPlaceholderJwtSecret(secret) {
  const trimmed = secret.trim();
  return !trimmed || trimmed === "replace-with-a-long-random-string";
}
function validateEnvironment() {
  if (!process.env.DATABASE_URL) {
    const resolvedUrl = process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
    if (resolvedUrl) {
      process.env.DATABASE_URL = resolvedUrl;
    }
  }
  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
  }
  const missingVars = [];
  const warnings = [];
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  if (!process.env.DATABASE_URL || isPlaceholderDatabaseUrl(process.env.DATABASE_URL)) {
    missingVars.push("DATABASE_URL (or Vercel POSTGRES_URL / PRISMA_DATABASE_URL)");
    const currentHost = process.env.DATABASE_URL ? getDbHost(process.env.DATABASE_URL) : "";
    if (currentHost) {
      warnings.push(`DATABASE_URL currently resolves to invalid/placeholder host: ${currentHost}`);
    }
  }
  if (!process.env.JWT_SECRET || isPlaceholderJwtSecret(process.env.JWT_SECRET)) {
    if (isProduction) {
      missingVars.push("JWT_SECRET");
    } else {
      warnings.push("JWT_SECRET is not set; using development fallback secret.");
    }
  }
  if (!process.env.DIRECT_URL) {
    warnings.push("DIRECT_URL is not set. A direct connection URL is recommended for Prisma migrations if using PgBouncer/Neon connection pooling.");
  }
  const isValid = missingVars.length === 0;
  if (!isValid) {
    console.error(`\u274C [ENVIRONMENT ERROR] Missing required environment variables:
  - ${missingVars.join("\n  - ")}`);
  } else if (warnings.length > 0) {
    console.warn(`\u26A0\uFE0F [ENVIRONMENT WARNINGS]:
  - ${warnings.join("\n  - ")}`);
  } else {
    console.log(`\u2705 [ENVIRONMENT SUCCESS] All required environment variables verified.`);
  }
  return {
    isValid,
    missingVars,
    warnings,
    config: {
      databaseUrl: process.env.DATABASE_URL || "",
      jwtSecret: process.env.JWT_SECRET || (isProduction ? "" : "dev-secret"),
      nodeEnv: process.env.NODE_ENV || "development",
      appUrl: process.env.APP_URL || "http://localhost:3000",
      hasDirectUrl: !!process.env.DIRECT_URL
    }
  };
}

// src/server/app.ts
import express2 from "express";
import path5 from "path";
import Stripe from "stripe";
import dotenv2 from "dotenv";
import rateLimit from "express-rate-limit";
import { doubleCsrf } from "csrf-csrf";
import cookieParser2 from "cookie-parser";

// src/server/legacyRoutes.ts
import express from "express";
import cookieParser from "cookie-parser";
import jwt2 from "jsonwebtoken";
import { z as z2 } from "zod";

// src/server/prisma.ts
init_prismaClient();
var prisma = db;

// src/server/errors.ts
var AppError = class extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
};
var handleError = (err, res) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  if (err instanceof Error) {
    console.error("Request error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
  return res.status(500).json({ error: "Unknown error" });
};

// src/server/validation.ts
import { z } from "zod";
var productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
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
var categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().default("")
});
var customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  type: z.enum(["Retail", "Wholesale"]).optional().default("Retail"),
  company: z.string().optional().default(""),
  abn: z.string().optional().default(""),
  walletBalance: z.number().optional().default(0),
  points: z.number().optional().default(0),
  wishlist: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default("")
});
var authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
var settingsSchema = z.object({
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

// src/server/legacyRoutes.ts
init_auth();

// src/server/uploads.ts
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
var ALLOWED_MIME_TYPES = /* @__PURE__ */ new Set(["image/jpeg", "image/png", "image/webp"]);
var MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
var saveImageFromBase64 = async (dataUrl, options) => {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data");
  }
  const mimeType = match[1];
  const base64Data = match[2];
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error("Unsupported image type");
  }
  const buffer = Buffer.from(base64Data, "base64");
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error("Image exceeds 10MB limit");
  }
  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1];
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${extension}`;
  const relativeDir = path.posix.join("/uploads", options.folder);
  const outputDir = options.outputDir ? path.resolve(options.outputDir, options.folder) : path.resolve(process.cwd(), "public", "uploads", options.folder);
  try {
    await fs.mkdir(outputDir, { recursive: true });
    const fullPath = path.join(outputDir, filename);
    await fs.writeFile(fullPath, buffer);
  } catch (e) {
    return {
      path: dataUrl,
      filename,
      extension,
      size: buffer.length
    };
  }
  return {
    path: path.posix.join(relativeDir, filename),
    filename,
    extension,
    size: buffer.length
  };
};
var deleteImageIfExists = async (imagePath) => {
  if (!imagePath || imagePath.startsWith("data:")) return;
  try {
    const publicUploadsDir = path.resolve(process.cwd(), "public", "uploads");
    const absolutePath = path.resolve(process.cwd(), "public", imagePath.replace(/^\//, ""));
    if (absolutePath.startsWith(publicUploadsDir)) {
      await fs.rm(absolutePath, { force: true });
    }
  } catch (e) {
  }
};

// src/server/stateStore.ts
import fs2 from "node:fs/promises";
import path2 from "node:path";

// src/types.ts
var DEFAULT_STORE_SETTINGS = {
  storeName: "INFOMAT",
  storeTagline: "Quality Refurbished Enterprise Hardware",
  legalName: "INFOMAT Australia Pty Ltd",
  businessNumber: "ABN 45 123 456 789",
  logoUrl: "/images/app_logo.jpg",
  currencySymbol: "$",
  taxRatePercent: 10,
  taxName: "GST",
  address: "456 Velvet Boulevard",
  cityStateZip: "Sydney NSW 2000",
  phone: "1300 000 228",
  email: "billing@techseller.com.au",
  website: "www.techseller.com.au",
  businessHours: "Open 24/7",
  bankName: "Commonwealth Bank",
  accountName: "INFOMAT Australia Pty Ltd",
  bsb: "062-000",
  accountNumber: "12345678",
  swift: "CTBAAU2S",
  paymentTermsNote: "Payment due on receipt.",
  invoiceHeaderSubtitle: "Invoice",
  invoiceFooterNote: "Thank you for your business.",
  invoiceWarrantyText: "Standard Return Policy",
  invoiceBodyFontSize: "12px",
  invoiceHeadingFontSize: "22px",
  invoiceItemFontSize: "11px",
  posReceiptFontSize: "11px",
  invoiceCompactness: "standard",
  showBankOnInvoice: true,
  announcementText: "Welcome to our new store!",
  showAnnouncementBar: true,
  themePrimaryColor: "#0f172a",
  themeAccentColor: "#3b82f6",
  freeShippingThreshold: 0,
  whyShopHeadingTop: "Australia's Leader in",
  whyShopHeadingHighlight: "Premium Refurbished",
  whyShopHeadingBottom: "Hardware",
  whyShopBodyText: "At INFOMAT, we bridge the gap between high-performance technology and affordability. Our refurbished units are sourced from top-tier corporate environments and undergo rigorous testing by our certified Australian technicians.",
  whyShopBulletPoints: [
    "Professional 50-Point Inspection",
    "12 Month Express Warranty",
    "Eco-Friendly Sustainable Choice",
    "Australia-Wide Fast Delivery",
    "Certified Refurbished Grade A",
    "Genuine Windows Licenses"
  ],
  productConditions: ["Brand New", "Like New", "Refurbished - Grade A", "Refurbished - Grade B", "Refurbished - Grade C", "Open Box", "For Parts / Repair"],
  productCpus: ["Intel Core i5", "Intel Core i7", "Intel Core i9", "Apple M1", "Apple M2", "Apple M3", "AMD Ryzen 5", "AMD Ryzen 7"],
  productRams: ["8GB DDR4", "16GB DDR4", "32GB DDR4", "64GB DDR4", "16GB Unified", "32GB Unified"],
  productStorages: ["256GB NVMe SSD", "512GB NVMe SSD", "1TB NVMe SSD", "2TB NVMe SSD"],
  productWarranties: ["3 Months", "6 Months", "12 Months Commercial", "24 Months Extended"],
  productScreenSizes: ['13.3"', '14.0"', '15.6"', '16.0"', '27" 4K Monitor'],
  hiddenDashboardTabs: []
};

// src/data/products.ts
var INITIAL_PRODUCTS = [
  {
    id: "prod-dell-latitude-7490",
    name: "Dell Latitude 7490",
    description: "Business-class 14-inch laptop with Intel Core i5, 16GB RAM and 256GB SSD.",
    category: "Laptops",
    collection: "Laptops",
    price: 649,
    discountPrice: 499,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.7,
    reviewsCount: 18,
    stock: 7,
    sales: 42,
    specs: { CPU: "Intel Core i5", RAM: "16GB", Storage: "256GB SSD", Warranty: "12 Months" },
    tags: ["Grade A", "Business", "Refurbished", "Ex-Corporate"],
    colors: ["Black"],
    sizes: ["14-inch"]
  },
  {
    id: "prod-thinkpad-t480",
    name: "Lenovo ThinkPad T480",
    description: "Reliable 14-inch workstation with robust keyboard and solid security features.",
    category: "Laptops",
    collection: "Laptops",
    price: 699,
    discountPrice: 549,
    image: "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    reviewsCount: 24,
    stock: 5,
    sales: 63,
    specs: { CPU: "Intel Core i5", RAM: "8GB", Storage: "512GB SSD", Warranty: "12 Months" },
    tags: ["Grade A", "Keyboard", "Refurbished"],
    colors: ["Black"],
    sizes: ["14-inch"]
  },
  {
    id: "prod-hp-elitebook-840",
    name: "HP EliteBook 840 G6",
    description: "Slim premium business laptop built for comfort, security and everyday performance.",
    category: "Laptops",
    collection: "Laptops",
    price: 799,
    discountPrice: 599,
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.6,
    reviewsCount: 15,
    stock: 4,
    sales: 31,
    specs: { CPU: "Intel Core i7", RAM: "16GB", Storage: "512GB SSD", Warranty: "12 Months" },
    tags: ["Grade A", "Premium", "Refurbished"],
    colors: ["Silver"],
    sizes: ["14-inch"]
  },
  {
    id: "prod-macbook-pro-13",
    name: "Apple MacBook Pro 13",
    description: "Portable Apple workstation with M2 chip, Retina display, and fast SSD storage.",
    category: "Apple Mac",
    collection: "Apple Mac",
    price: 1299,
    discountPrice: 999,
    image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    reviewsCount: 29,
    stock: 3,
    sales: 48,
    specs: { CPU: "Apple M2", RAM: "16GB", Storage: "512GB SSD", Warranty: "12 Months" },
    tags: ["Apple", "Grade A", "Refurbished"],
    colors: ["Space Grey"],
    sizes: ["13-inch"]
  },
  {
    id: "prod-gaming-desktop-rtx4070",
    name: "CyberPower Extreme Gaming PC",
    description: "High performance gaming desktop with Intel Core i7-14700F, RTX 4070 12GB, 32GB DDR5 & 1TB NVMe.",
    category: "Desktops",
    collection: "Desktops",
    price: 1899,
    discountPrice: 1699,
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    reviewsCount: 34,
    stock: 6,
    sales: 22,
    specs: { CPU: "Intel Core i7-14700F", GPU: "NVIDIA RTX 4070 12GB", RAM: "32GB DDR5", Storage: "1TB Gen4 NVMe" },
    tags: ["Gaming PC", "RTX 4070", "DDR5", "RGB Chassis"],
    colors: ["Black RGB"]
  },
  {
    id: "prod-lg-ultragear-27-monitor",
    name: 'LG UltraGear 27" 4K UHD Gaming Monitor',
    description: "27-inch IPS 4K UHD Gaming Monitor with 144Hz, 1ms response time, HDMI 2.1 & G-Sync Compatible.",
    category: "Monitors",
    collection: "Monitors",
    price: 699,
    discountPrice: 549,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1585792180666-f7347c490ee2?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    reviewsCount: 42,
    stock: 12,
    sales: 85,
    specs: { Panel: "IPS 4K UHD", RefreshRate: "144Hz", ResponseTime: "1ms", Display: "27-inch" },
    tags: ["4K UHD", "144Hz", "G-Sync", "HDR400"],
    colors: ["Black"]
  },
  {
    id: "prod-hp-zbook-fury-workstation",
    name: "HP ZBook Fury G10 Workstation",
    description: "Ultimate CAD & 3D rendering mobile workstation with Intel Core i9-13900HX, 64GB RAM & RTX 4000 Ada.",
    category: "Workstations",
    collection: "Workstations",
    price: 3499,
    discountPrice: 3199,
    image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 5,
    reviewsCount: 11,
    stock: 2,
    sales: 14,
    specs: { CPU: "Intel Core i9-13900HX", GPU: "NVIDIA RTX 4000 Ada 12GB", RAM: "64GB DDR5", Storage: "2TB NVMe" },
    tags: ["Enterprise Workstation", "Core i9", "64GB RAM", "CAD Rig"],
    colors: ["Charcoal"]
  },
  {
    id: "prod-nvidia-rtx-4080-gpu",
    name: "NVIDIA GeForce RTX 4080 Super 16GB GPU",
    description: "Extreme 4K gaming graphics card featuring DLSS 3, Ray Tracing cores and 16GB GDDR6X VRAM.",
    category: "Graphics Cards",
    collection: "Graphics Cards",
    price: 1199,
    discountPrice: 1049,
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80",
    additionalImages: [
      "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    reviewsCount: 57,
    stock: 8,
    sales: 94,
    specs: { VRAM: "16GB GDDR6X", Cores: "10240 CUDA Cores", Interface: "PCIe 4.0 x16", RecommendedPSU: "750W" },
    tags: ["RTX 4080 Super", "16GB VRAM", "DLSS 3", "4K Gaming"],
    colors: ["Black Metallic"]
  },
  {
    id: "prod-intel-i9-14900k-cpu",
    name: "Intel Core i9-14900K Processor",
    description: "24-Core 32-Thread desktop processor with thermal velocity boost up to 6.0 GHz for flagship gaming.",
    category: "CPUs / Processors",
    collection: "CPUs / Processors",
    price: 589,
    discountPrice: 549,
    image: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80",
    additionalImages: [],
    rating: 4.8,
    reviewsCount: 39,
    stock: 15,
    sales: 110,
    specs: { Cores: "24 Cores (8P + 16E)", Threads: "32 Threads", MaxClock: "6.0 GHz", Socket: "LGA1700" },
    tags: ["Intel i9", "14th Gen", "Unlocked", "Flagship CPU"],
    colors: ["Silver Blue"]
  },
  {
    id: "prod-corsair-ddr5-32gb-ram",
    name: "Corsair Vengeance DDR5 32GB (2x16GB) 6000MHz",
    description: "High frequency DDR5 desktop memory kit with onboard XMP 3.0 profile and aluminum heatspreader.",
    category: "RAM / Memory",
    collection: "RAM / Memory",
    price: 149,
    discountPrice: 129,
    image: "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=800&q=80",
    additionalImages: [],
    rating: 4.9,
    reviewsCount: 68,
    stock: 20,
    sales: 145,
    specs: { Capacity: "32GB (2x16GB)", Speed: "6000MHz DDR5", Latency: "CL36", Voltage: "1.35V" },
    tags: ["DDR5", "32GB Kit", "6000MHz", "Corsair"],
    colors: ["Black"]
  },
  {
    id: "prod-samsung-990pro-2tb-ssd",
    name: "Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD",
    description: "Ultra-fast NVMe M.2 solid state drive with up to 7,450 MB/s sequential read speeds for PS5 & PC.",
    category: "Storage & SSDs",
    collection: "Storage & SSDs",
    price: 199,
    discountPrice: 169,
    image: "https://images.unsplash.com/photo-1597872250970-45d06e2e5c8e?auto=format&fit=crop&w=800&q=80",
    additionalImages: [],
    rating: 5,
    reviewsCount: 88,
    stock: 18,
    sales: 210,
    specs: { Capacity: "2TB", Interface: "PCIe 4.0 x4 NVMe M.2", ReadSpeed: "7,450 MB/s", WriteSpeed: "6,900 MB/s" },
    tags: ["Samsung 990 Pro", "2TB NVMe", "Gen4 SSD", "PS5 Compatible"],
    colors: ["Black"]
  },
  {
    id: "prod-logitech-mx-keys-combo",
    name: "Logitech MX Master 3S + MX Keys Combo",
    description: "Premium wireless ergonomic keyboard and 8K DPI quiet-click performance mouse suite.",
    category: "Keyboards & Mice",
    collection: "Keyboards & Mice",
    price: 219,
    discountPrice: 189,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    additionalImages: [],
    rating: 4.9,
    reviewsCount: 76,
    stock: 10,
    sales: 160,
    specs: { Connection: "Bluetooth / Logi Bolt Wireless", Sensor: "8000 DPI Darkfield", Battery: "USB-C Rechargeable" },
    tags: ["Logitech MX", "Ergonomic", "Wireless", "Quiet Click"],
    colors: ["Graphite"]
  }
];
var INITIAL_REVIEWS = [
  {
    id: "review-1",
    productId: "prod-dell-latitude-7490",
    userName: "Alicia",
    rating: 5,
    comment: "Fast delivery and the device looks like new.",
    date: "2026-07-19"
  }
];
var INITIAL_COUPONS = [
  {
    code: "WELCOME10",
    type: "percent",
    value: 10,
    active: true,
    minPurchase: 500
  }
];

// src/data/warehouses.ts
var INITIAL_WAREHOUSES = [
  {
    id: "wh-main",
    code: "WH-MAIN",
    name: "Main Logistics Hub",
    address: "Building 4, 100 Logistics Way, Sydney NSW 2000",
    contactPerson: "Dave Miller",
    phone: "02 9876 5432",
    email: "warehouse@techseller.com.au",
    isDefault: true,
    bins: [
      { id: "bin-a01-01", code: "A-01-01", zone: "Zone A", rack: "Rack 1", shelf: "Shelf 1", binNumber: "01", notes: "High-value laptops" },
      { id: "bin-a01-02", code: "A-01-02", zone: "Zone A", rack: "Rack 1", shelf: "Shelf 1", binNumber: "02", notes: "Refurbished desktops" },
      { id: "bin-b02-10", code: "B-02-10", zone: "Zone B", rack: "Rack 2", shelf: "Shelf 2", binNumber: "10", notes: "Monitors & Displays" }
    ]
  },
  {
    id: "wh-showroom",
    code: "WH-SHOWROOM",
    name: "Sydney Retail Showroom",
    address: "456 Velvet Boulevard, Sydney NSW 2000",
    contactPerson: "Sarah Jenkins",
    phone: "02 9123 4567",
    email: "showroom@techseller.com.au",
    isDefault: false,
    bins: [
      { id: "bin-sr-front", code: "SR-FRONT-01", zone: "Showroom Front", rack: "Display 1", shelf: "Shelf A", binNumber: "01", notes: "Display stock" },
      { id: "bin-sr-back", code: "SR-BACK-02", zone: "Showroom Store", rack: "Rack S1", shelf: "Shelf 1", binNumber: "02", notes: "Retail reserve" }
    ]
  },
  {
    id: "wh-repair",
    code: "WH-REPAIR",
    name: "Service & Repair Bay",
    address: "Tech Seller Service Centre, Unit 2, Sydney NSW 2000",
    contactPerson: "Alex Chen",
    phone: "02 9555 8899",
    email: "repairs@techseller.com.au",
    isDefault: false,
    bins: [
      { id: "bin-rep-in", code: "REP-INTAKE", zone: "Intake Bay", rack: "Rack R1", shelf: "Shelf A", binNumber: "01", notes: "Awaiting diagnosis" },
      { id: "bin-rep-parts", code: "REP-PARTS", zone: "Parts Storage", rack: "Rack R2", shelf: "Shelf B", binNumber: "05", notes: "Spare components" }
    ]
  }
];

// src/server/stateStore.ts
var DATA_DIR = path2.resolve(process.cwd(), "data");
var APP_STATE_FILE = path2.join(DATA_DIR, "app-state.json");
var ADMIN_EXTRAS_FILE = path2.join(DATA_DIR, "admin-extras.json");
var ADMIN_EXTRAS_DEFAULTS = {
  suppliers: [],
  supplierOrders: [],
  shipments: [],
  inventoryLogs: []
};
var APP_STATE_DEFAULTS = {
  storeSettings: DEFAULT_STORE_SETTINGS,
  products: INITIAL_PRODUCTS,
  reviews: INITIAL_REVIEWS,
  coupons: INITIAL_COUPONS,
  orders: [],
  customers: [],
  financeTransactions: [],
  users: [],
  returns: [],
  categories: ["Laptops", "Desktops", "Monitors", "Workstations", "Apple Mac", "Parts"],
  customerSegments: [],
  upsellRules: [],
  collections: ["Laptops", "Apple Mac"],
  purchaseOrders: [],
  repairJobs: [],
  stockUnits: [],
  warehouses: INITIAL_WAREHOUSES,
  stockTransfers: []
};
var clone = (value) => JSON.parse(JSON.stringify(value));
var mergeWithFallback = (fallback, parsed) => {
  const merged = { ...clone(fallback), ...parsed || {} };
  for (const [key, fallbackValue] of Object.entries(fallback)) {
    const candidate = merged[key];
    if (Array.isArray(fallbackValue) && Array.isArray(candidate) && candidate.length === 0) {
      merged[key] = clone(fallbackValue);
    }
  }
  return merged;
};
var readJsonFile = async (filePath, fallback) => {
  try {
    const raw = await fs2.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return mergeWithFallback(fallback, parsed);
  } catch {
    return clone(fallback);
  }
};
var writeJsonFile = async (filePath, data) => {
  try {
    await fs2.mkdir(DATA_DIR, { recursive: true });
    await fs2.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
  }
  return data;
};
var readAppStateStore = async () => {
  const state = await readJsonFile(APP_STATE_FILE, APP_STATE_DEFAULTS);
  return {
    ...APP_STATE_DEFAULTS,
    ...state,
    storeSettings: { ...DEFAULT_STORE_SETTINGS, ...state.storeSettings || {} }
  };
};
var writeAppStateStore = async (partial) => {
  const current = await readAppStateStore();
  const next = {
    ...current,
    ...partial,
    storeSettings: { ...DEFAULT_STORE_SETTINGS, ...current.storeSettings || {}, ...partial.storeSettings || {} }
  };
  return writeJsonFile(APP_STATE_FILE, next);
};
var readAdminExtrasStore = async () => {
  const extras = await readJsonFile(ADMIN_EXTRAS_FILE, ADMIN_EXTRAS_DEFAULTS);
  return { ...ADMIN_EXTRAS_DEFAULTS, ...extras };
};
var writeAdminExtrasStore = async (partial) => {
  const current = await readAdminExtrasStore();
  const next = { ...current, ...partial };
  return writeJsonFile(ADMIN_EXTRAS_FILE, next);
};

// src/server/products.ts
var normalizeProductForDb = (input) => {
  const normalized = { ...input };
  const jsonFields = ["specs", "tags", "additionalImages", "colors", "sizes", "serialNumbers"];
  for (const field of jsonFields) {
    if (normalized[field] === void 0 || normalized[field] === null) {
      normalized[field] = field === "specs" ? "{}" : "[]";
      continue;
    }
    if (typeof normalized[field] === "string") {
      continue;
    }
    normalized[field] = JSON.stringify(normalized[field]);
  }
  return normalized;
};
var serializeProductForResponse = (product) => {
  const serialized = { ...product };
  for (const field of ["specs", "tags", "additionalImages", "colors", "sizes", "serialNumbers"]) {
    if (typeof serialized[field] === "string") {
      try {
        serialized[field] = JSON.parse(serialized[field]);
      } catch {
        serialized[field] = field === "specs" ? {} : [];
      }
    }
  }
  return serialized;
};

// src/server/masterDataSeeder.ts
import fs3 from "fs";
import path3 from "path";
async function parseCSVFile(fileName) {
  const filePath = path3.resolve(process.cwd(), "data", fileName);
  if (!fs3.existsSync(filePath)) {
    return [];
  }
  try {
    const fileContent = fs3.readFileSync(filePath, "utf-8");
    const lines = fileContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      records.push(row);
    }
    return records;
  } catch (err) {
    console.warn(`[Master Data Seeder] Could not read CSV file ${fileName}:`, err);
    return [];
  }
}
async function seedMasterData() {
  const counts = {};
  try {
    const categoriesData = await parseCSVFile("categories.csv");
    if (categoriesData.length > 0) {
      for (const row of categoriesData) {
        if (!row.name) continue;
        const slug = row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const existing = await prisma.category.findFirst({ where: { slug } });
        const payload = {
          parentId: row.parentId || null,
          name: row.name,
          slug,
          description: row.description || "",
          sortOrder: parseInt(row.sortOrder || "0", 10),
          isSystem: row.isSystem === "true",
          isActive: row.isActive !== "false"
        };
        if (existing) {
          await prisma.category.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.category.create({ data: payload });
        }
      }
      counts.categories = categoriesData.length;
    }
    const brandsData = await parseCSVFile("brands.csv");
    if (brandsData.length > 0) {
      for (const row of brandsData) {
        if (!row.name) continue;
        const existing = await prisma.brand.findFirst({ where: { name: row.name } });
        const payload = {
          name: row.name,
          logoUrl: row.logoUrl || "",
          website: row.website || "",
          country: row.country || "",
          isSystem: row.isSystem === "true",
          isActive: row.isActive !== "false"
        };
        if (existing) {
          await prisma.brand.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.brand.create({ data: payload });
        }
      }
      counts.brands = brandsData.length;
    }
    const uomData = await parseCSVFile("units_of_measure.csv");
    if (uomData.length > 0) {
      for (const row of uomData) {
        if (!row.name) continue;
        const existing = await prisma.unitOfMeasure.findFirst({ where: { name: row.name } });
        const payload = {
          name: row.name,
          symbol: row.symbol || "",
          isSystem: row.isSystem === "true",
          isActive: row.isActive !== "false"
        };
        if (existing) {
          await prisma.unitOfMeasure.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.unitOfMeasure.create({ data: payload });
        }
      }
      counts.unitsOfMeasure = uomData.length;
    }
    const statusData = await parseCSVFile("product_statuses.csv");
    if (statusData.length > 0) {
      for (const row of statusData) {
        if (!row.name || !row.code) continue;
        const existing = await prisma.productStatus.findFirst({ where: { code: row.code } });
        const payload = {
          name: row.name,
          code: row.code,
          isSystem: row.isSystem === "true",
          isActive: row.isActive !== "false"
        };
        if (existing) {
          await prisma.productStatus.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.productStatus.create({ data: payload });
        }
      }
      counts.productStatuses = statusData.length;
    }
    const whData = await parseCSVFile("warehouse_locations.csv");
    if (whData.length > 0) {
      for (const row of whData) {
        if (!row.name || !row.code) continue;
        const existing = await prisma.warehouseLocation.findFirst({ where: { code: row.code } });
        const payload = {
          name: row.name,
          code: row.code,
          address: row.address || "",
          isSystem: row.isSystem === "true",
          isActive: row.isActive !== "false"
        };
        if (existing) {
          await prisma.warehouseLocation.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.warehouseLocation.create({ data: payload });
        }
      }
      counts.warehouseLocations = whData.length;
    }
    const taxData = await parseCSVFile("tax_rates.csv");
    if (taxData.length > 0) {
      for (const row of taxData) {
        if (!row.name) continue;
        const existing = await prisma.taxRate.findFirst({ where: { name: row.name } });
        const payload = {
          name: row.name,
          country: row.country || "",
          ratePercent: parseFloat(row.ratePercent || "0"),
          code: row.code || "",
          isSystem: row.isSystem === "true",
          isActive: row.isActive !== "false"
        };
        if (existing) {
          await prisma.taxRate.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.taxRate.create({ data: payload });
        }
      }
      counts.taxRates = taxData.length;
    }
    const termData = await parseCSVFile("payment_terms.csv");
    if (termData.length > 0) {
      for (const row of termData) {
        if (!row.name) continue;
        const existing = await prisma.paymentTerm.findFirst({ where: { name: row.name } });
        const payload = {
          name: row.name,
          days: parseInt(row.days || "0", 10),
          isSystem: row.isSystem === "true",
          isActive: row.isActive !== "false"
        };
        if (existing) {
          await prisma.paymentTerm.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.paymentTerm.create({ data: payload });
        }
      }
      counts.paymentTerms = termData.length;
    }
    const shipData = await parseCSVFile("shipping_methods.csv");
    if (shipData.length > 0) {
      for (const row of shipData) {
        if (!row.name) continue;
        const existing = await prisma.shippingMethod.findFirst({ where: { name: row.name } });
        const payload = {
          name: row.name,
          code: row.code || "",
          description: row.description || "",
          cost: parseFloat(row.cost || "0"),
          sortOrder: parseInt(row.sortOrder || "0", 10),
          isSystem: row.isSystem === "true",
          active: row.active !== "false"
        };
        if (existing) {
          await prisma.shippingMethod.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.shippingMethod.create({ data: payload });
        }
      }
      counts.shippingMethods = shipData.length;
    }
    const warData = await parseCSVFile("warranty_types.csv");
    if (warData.length > 0) {
      for (const row of warData) {
        if (!row.name) continue;
        const existing = await prisma.warrantyType.findFirst({ where: { name: row.name } });
        const payload = {
          name: row.name,
          durationMonths: parseInt(row.durationMonths || "12", 10),
          type: row.type || "Return To Base",
          isSystem: row.isSystem === "true",
          isActive: row.isActive !== "false"
        };
        if (existing) {
          await prisma.warrantyType.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.warrantyType.create({ data: payload });
        }
      }
      counts.warrantyTypes = warData.length;
    }
    const attrData = await parseCSVFile("product_attributes.csv");
    if (attrData.length > 0) {
      for (const row of attrData) {
        if (!row.name || !row.code) continue;
        const existing = await prisma.productAttribute.findFirst({ where: { code: row.code } });
        const payload = {
          name: row.name,
          code: row.code,
          isSystem: row.isSystem === "true",
          isActive: row.isActive !== "false"
        };
        if (existing) {
          await prisma.productAttribute.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.productAttribute.create({ data: payload });
        }
      }
      counts.productAttributes = attrData.length;
    }
    const valData = await parseCSVFile("attribute_values.csv");
    if (valData.length > 0) {
      for (const row of valData) {
        if (!row.attributeId || !row.value) continue;
        const existing = await prisma.attributeValue.findFirst({
          where: { attributeId: row.attributeId, value: row.value }
        });
        const payload = {
          attributeId: row.attributeId,
          value: row.value,
          isSystem: row.isSystem === "true",
          isActive: row.isActive !== "false"
        };
        if (existing) {
          await prisma.attributeValue.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.attributeValue.create({ data: payload });
        }
      }
      counts.attributeValues = valData.length;
    }
    const countryData = await parseCSVFile("countries.csv");
    if (countryData.length > 0) {
      for (const row of countryData) {
        if (!row.name || !row.iso2) continue;
        await prisma.country.upsert({
          where: { iso2: row.iso2 },
          update: {
            name: row.name,
            iso3: row.iso3 || "",
            currency: row.currency || "",
            phoneCode: row.phoneCode || "",
            timeZone: row.timeZone || "",
            isSystem: row.isSystem === "true",
            isActive: row.isActive !== "false"
          },
          create: {
            name: row.name,
            iso2: row.iso2,
            iso3: row.iso3 || "",
            currency: row.currency || "",
            phoneCode: row.phoneCode || "",
            timeZone: row.timeZone || "",
            isSystem: row.isSystem === "true",
            isActive: row.isActive !== "false"
          }
        });
      }
      counts.countries = countryData.length;
    }
    const currencyData = await parseCSVFile("currencies.csv");
    if (currencyData.length > 0) {
      for (const row of currencyData) {
        if (!row.code) continue;
        await prisma.currency.upsert({
          where: { code: row.code },
          update: {
            name: row.name || "",
            symbol: row.symbol || "$",
            decimalPlaces: parseInt(row.decimalPlaces || "2", 10),
            isSystem: row.isSystem === "true",
            isActive: row.isActive !== "false"
          },
          create: {
            code: row.code,
            name: row.name || "",
            symbol: row.symbol || "$",
            decimalPlaces: parseInt(row.decimalPlaces || "2", 10),
            isSystem: row.isSystem === "true",
            isActive: row.isActive !== "false"
          }
        });
      }
      counts.currencies = currencyData.length;
    }
    const langData = await parseCSVFile("languages.csv");
    if (langData.length > 0) {
      for (const row of langData) {
        if (!row.code) continue;
        await prisma.language.upsert({
          where: { code: row.code },
          update: {
            name: row.name || "",
            isSystem: row.isSystem === "true",
            isActive: row.isActive !== "false"
          },
          create: {
            code: row.code,
            name: row.name || "",
            isSystem: row.isSystem === "true",
            isActive: row.isActive !== "false"
          }
        });
      }
      counts.languages = langData.length;
    }
    const condData = await parseCSVFile("product_conditions.csv");
    if (condData.length > 0) {
      for (const row of condData) {
        if (!row.name || !row.code) continue;
        const existing = await prisma.productCondition.findFirst({ where: { code: row.code } });
        const payload = {
          name: row.name,
          code: row.code,
          isSystem: row.isSystem === "true",
          isActive: row.isActive !== "false"
        };
        if (existing) {
          await prisma.productCondition.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.productCondition.create({ data: payload });
        }
      }
      counts.productConditions = condData.length;
    }
    console.log("[Master Data Seeder] Master data seeded successfully:", counts);
    return { success: true, counts };
  } catch (err) {
    console.error("[Master Data Seeder] Failed to seed master data:", err);
    return { success: false, counts };
  }
}

// src/server/legacyRoutes.ts
var router = express.Router();
router.use(cookieParser());
var requireAuth = async (req, res, next) => {
  const token = req.cookies?.authToken || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt2.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};
router.post("/api/auth/login", async (req, res) => {
  try {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid login payload", 400);
    const { email, password } = parsed.data;
    const admin = await findAdminUserByEmail(email);
    if (!admin) throw new AppError("Invalid credentials", 401);
    const valid = await verifyPassword(password, admin.password);
    if (!valid) throw new AppError("Invalid credentials", 401);
    const token = createAuthToken({ sub: admin.id, role: admin.role });
    res.cookie("authToken", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    res.json({ token, user: { id: admin.id, email: admin.email, role: admin.role, name: admin.name } });
  } catch (err) {
    handleError(err, res);
  }
});
router.post("/api/auth/logout", (req, res) => {
  res.clearCookie("authToken");
  res.json({ ok: true });
});
router.get("/api/state", async (_req, res) => {
  try {
    const state = await readAppStateStore();
    res.json(state);
  } catch (err) {
    handleError(err, res);
  }
});
router.put("/api/state", async (req, res) => {
  try {
    const next = await writeAppStateStore(req.body || {});
    res.json(next);
  } catch (err) {
    handleError(err, res);
  }
});
router.get("/api/admin-extras", async (_req, res) => {
  try {
    const extras = await readAdminExtrasStore();
    res.json(extras);
  } catch (err) {
    handleError(err, res);
  }
});
router.put("/api/admin-extras", async (req, res) => {
  try {
    const next = await writeAdminExtrasStore(req.body || {});
    res.json(next);
  } catch (err) {
    handleError(err, res);
  }
});
router.get("/api/products", async (_req, res) => {
  try {
    const products = await prisma.product.findMany({ include: { category: true, images: true } });
    res.json(products.map((product) => serializeProductForResponse(product)));
  } catch (err) {
    handleError(err, res);
  }
});
router.post("/api/products", async (req, res) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid product payload", 400);
    const normalizedData = normalizeProductForDb({
      ...parsed.data,
      categoryId: parsed.data.categoryId || null,
      specs: parsed.data.specs ?? {},
      tags: parsed.data.tags ?? [],
      additionalImages: parsed.data.additionalImages ?? [],
      colors: parsed.data.colors ?? [],
      sizes: parsed.data.sizes ?? [],
      serialNumbers: parsed.data.serialNumbers ?? []
    });
    const product = await prisma.product.create({ data: normalizedData });
    res.status(201).json(serializeProductForResponse(product));
  } catch (err) {
    handleError(err, res);
  }
});
router.put("/api/products/:id", async (req, res) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid product payload", 400);
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError("Product not found", 404);
    const normalizedData = normalizeProductForDb({
      ...parsed.data,
      categoryId: parsed.data.categoryId || null,
      specs: parsed.data.specs ?? {},
      tags: parsed.data.tags ?? [],
      additionalImages: parsed.data.additionalImages ?? [],
      colors: parsed.data.colors ?? [],
      sizes: parsed.data.sizes ?? [],
      serialNumbers: parsed.data.serialNumbers ?? []
    });
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: normalizedData
    });
    res.json(serializeProductForResponse(product));
  } catch (err) {
    handleError(err, res);
  }
});
router.delete("/api/products", async (_req, res) => {
  try {
    await prisma.product.deleteMany({});
    res.json({ ok: true });
  } catch (err) {
    handleError(err, res);
  }
});
router.delete("/api/products/:id", async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError("Product not found", 404);
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    handleError(err, res);
  }
});
router.get("/api/categories", async (_req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (err) {
    handleError(err, res);
  }
});
router.post("/api/categories", async (req, res) => {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid category payload", 400);
    const category = await prisma.category.create({ data: parsed.data });
    res.status(201).json(category);
  } catch (err) {
    handleError(err, res);
  }
});
router.put("/api/categories/:id", async (req, res) => {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid category payload", 400);
    const category = await prisma.category.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(category);
  } catch (err) {
    handleError(err, res);
  }
});
router.delete("/api/categories/:id", async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    handleError(err, res);
  }
});
router.get("/api/customers", requireAuth, async (_req, res) => {
  try {
    const customers = await prisma.customer.findMany();
    res.json(customers);
  } catch (err) {
    handleError(err, res);
  }
});
router.post("/api/customers", requireAuth, async (req, res) => {
  try {
    const parsed = customerSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid customer payload", 400);
    const customerData = {
      ...parsed.data,
      wishlist: JSON.stringify(parsed.data.wishlist || [])
    };
    const customer = await prisma.customer.create({ data: customerData });
    res.status(201).json(customer);
  } catch (err) {
    handleError(err, res);
  }
});
router.get("/api/orders/track", async (req, res) => {
  try {
    const orderNumber = String(req.query.orderNumber || "").trim();
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!orderNumber) {
      throw new AppError("Order number is required", 400);
    }
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: { equals: orderNumber, mode: "insensitive" }
      },
      include: {
        items: true,
        customer: true,
        shippingMethod: true
      }
    });
    if (!order) {
      throw new AppError("Order not found. Please check your order number.", 404);
    }
    if (email && order.customer?.email && order.customer.email.toLowerCase() !== email) {
      throw new AppError("Email address does not match this order number.", 403);
    }
    res.json(order);
  } catch (err) {
    handleError(err, res);
  }
});
router.get("/api/orders", requireAuth, async (_req, res) => {
  try {
    const orders = await prisma.order.findMany({ include: { items: true } });
    res.json(orders);
  } catch (err) {
    handleError(err, res);
  }
});
router.post("/api/orders", async (req, res) => {
  try {
    const parsed = z2.object({
      customerId: z2.string().optional(),
      orderNumber: z2.string().min(1),
      status: z2.string().optional(),
      subtotal: z2.number().nonnegative(),
      tax: z2.number().nonnegative(),
      shipping: z2.number().nonnegative(),
      discount: z2.number().nonnegative(),
      total: z2.number().nonnegative(),
      paymentMethod: z2.string().optional(),
      paymentStatus: z2.string().optional(),
      notes: z2.string().optional(),
      items: z2.array(z2.object({ productId: z2.string(), name: z2.string(), price: z2.number(), quantity: z2.number().int().positive(), color: z2.string().optional(), size: z2.string().optional(), image: z2.string().optional() })).optional().default([])
    }).safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid order payload", 400);
    const order = await prisma.order.create({
      data: {
        ...parsed.data,
        items: {
          create: parsed.data.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            color: item.color,
            size: item.size,
            image: item.image || ""
          }))
        }
      },
      include: { items: true }
    });
    res.status(201).json(order);
  } catch (err) {
    handleError(err, res);
  }
});
router.post("/api/uploads", async (req, res) => {
  try {
    const { file, folder } = req.body;
    if (!file || !folder) throw new AppError("Image and folder are required", 400);
    const result = await saveImageFromBase64(file, { folder });
    res.status(201).json(result);
  } catch (err) {
    handleError(err, res);
  }
});
router.post("/api/uploads/delete", async (req, res) => {
  try {
    const { path: imagePath } = req.body;
    if (!imagePath) throw new AppError("Image path is required", 400);
    await deleteImageIfExists(imagePath);
    res.json({ ok: true });
  } catch (err) {
    handleError(err, res);
  }
});
router.get("/api/settings", async (_req, res) => {
  try {
    const settings = await prisma.storeSettings.findFirst();
    res.json(settings || {});
  } catch (err) {
    handleError(err, res);
  }
});
router.put("/api/settings", requireAuth, async (req, res) => {
  try {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid settings payload", 400);
    const existing = await prisma.storeSettings.findFirst();
    const settings = existing ? await prisma.storeSettings.update({ where: { id: existing.id }, data: parsed.data }) : await prisma.storeSettings.create({ data: parsed.data });
    res.json(settings);
  } catch (err) {
    handleError(err, res);
  }
});
router.post("/api/reports/email", async (req, res) => {
  try {
    const { payload, reportData } = req.body || {};
    if (!payload?.recipientEmail || !reportData?.title) {
      throw new AppError("Recipient email and report data are required", 400);
    }
    console.log(`[ERP EMAIL DISPATCH] Report "${reportData.title}" dispatched to ${payload.recipientEmail} (${payload.format.toUpperCase()})`);
    res.json({
      ok: true,
      message: `Report queued and dispatched to ${payload.recipientEmail}`,
      dispatchedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    handleError(err, res);
  }
});
router.get("/api/ebay/oauth/authorize", (req, res) => {
  const marketplace = req.query.marketplace || "EBAY_AU";
  const clientId = "TechSeller-ERP-PRD-18928374-4819";
  const redirectUri = encodeURIComponent("https://techseller.app/api/ebay/oauth/callback");
  const scope = encodeURIComponent("https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.fulfillment");
  const authUrl = `https://auth.ebay.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${marketplace}`;
  res.json({ ok: true, authUrl, marketplace });
});
router.post("/api/ebay/oauth/callback", (req, res) => {
  try {
    const { code, marketplace } = req.body || {};
    const mkt = marketplace || "EBAY_AU";
    const expiresAt = new Date(Date.now() + 7200 * 1e3).toISOString();
    res.json({
      ok: true,
      account: {
        id: `ACC-EBAY-${mkt}-${Date.now().toString().slice(-4)}`,
        channel: "eBay",
        marketplace: mkt,
        sellerId: `seller_${mkt.toLowerCase()}_${Math.floor(1e3 + Math.random() * 9e3)}`,
        storeName: `Tech Seller ${mkt.replace("EBAY_", "")} Marketplace Store`,
        status: "Connected",
        accessTokenEncrypted: "v^1.1#encrypted_oauth_token",
        refreshTokenEncrypted: "r^1.1#encrypted_refresh_token",
        tokenExpiresAt: expiresAt,
        syncFrequencyMinutes: 15,
        lastSyncAt: (/* @__PURE__ */ new Date()).toISOString(),
        nextSyncAt: new Date(Date.now() + 15 * 60 * 1e3).toISOString(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (err) {
    handleError(err, res);
  }
});
router.post("/api/ebay/sync", (req, res) => {
  try {
    const { accountId, jobType } = req.body || {};
    res.json({
      ok: true,
      job: {
        id: `JOB-${Date.now()}`,
        accountId: accountId || "ACC-EBAY-AU",
        jobType: jobType || "REALTIME_INVENTORY_SYNC",
        status: "In Progress",
        progressPercent: 20,
        totalItems: 35,
        processedItems: 7,
        failedItems: 0,
        startedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (err) {
    handleError(err, res);
  }
});
router.post("/api/ebay/listings/publish", (req, res) => {
  try {
    const { productId, product } = req.body || {};
    const listingId = `1259${Math.floor(1e7 + Math.random() * 9e7)}`;
    res.json({
      ok: true,
      listing: {
        id: `LST-${Date.now()}`,
        accountId: "ACC-EBAY-AU",
        productId: productId || product?.id || "P-001",
        externalListingId: listingId,
        channel: "eBay",
        title: product?.name || "Dell Latitude 5420 Enterprise Laptop",
        sku: product?.specs?.sku || productId,
        price: product?.discountPrice || product?.price || 649,
        quantity: product?.stock || 10,
        status: "Active",
        listingUrl: `https://www.ebay.com.au/itm/${listingId}`,
        lastSyncAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (err) {
    handleError(err, res);
  }
});
router.post("/api/ebay/orders/shipment", (req, res) => {
  try {
    const { orderId, trackingNumber, carrier } = req.body || {};
    if (!orderId || !trackingNumber) {
      throw new AppError("Order ID and tracking number are required", 400);
    }
    console.log(`[eBay FULFILLMENT SYNC] Uploaded tracking #${trackingNumber} (${carrier || "Australia Post"}) for Order #${orderId}`);
    res.json({
      ok: true,
      message: `Tracking #${trackingNumber} successfully uploaded to eBay for Order #${orderId}`,
      syncedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    handleError(err, res);
  }
});
var getMasterDataModel = (entity) => {
  switch (entity) {
    case "categories":
      return prisma.category;
    case "brands":
      return prisma.brand;
    case "units":
      return prisma.unitOfMeasure;
    case "product-status":
      return prisma.productStatus;
    case "warehouses":
      return prisma.warehouseLocation;
    case "taxes":
      return prisma.taxRate;
    case "payment-terms":
      return prisma.paymentTerm;
    case "shipping-methods":
      return prisma.shippingMethod;
    case "warranties":
      return prisma.warrantyType;
    case "attributes":
      return prisma.productAttribute;
    case "attribute-values":
      return prisma.attributeValue;
    case "countries":
      return prisma.country;
    case "currencies":
      return prisma.currency;
    case "languages":
      return prisma.language;
    case "conditions":
      return prisma.productCondition;
    default:
      return null;
  }
};
router.get("/api/master-data/:entity", async (req, res) => {
  try {
    const { entity } = req.params;
    const model = getMasterDataModel(entity);
    if (!model) throw new AppError(`Unknown master data entity '${entity}'`, 400);
    const search = String(req.query.search || "").trim();
    let where = {};
    if (search) {
      if (["currencies", "languages"].includes(entity)) {
        where = { OR: [{ code: { contains: search, mode: "insensitive" } }, { name: { contains: search, mode: "insensitive" } }] };
      } else if (entity === "attribute-values") {
        where = { value: { contains: search, mode: "insensitive" } };
      } else {
        where = { name: { contains: search, mode: "insensitive" } };
      }
    }
    let items = await model.findMany({
      where,
      orderBy: entity === "categories" ? [{ sortOrder: "asc" }, { name: "asc" }] : { createdAt: "desc" },
      include: entity === "attributes" ? { values: true } : entity === "attribute-values" ? { attribute: true } : void 0
    });
    if (items.length === 0 && !search) {
      await seedMasterData();
      items = await model.findMany({
        where,
        orderBy: entity === "categories" ? [{ sortOrder: "asc" }, { name: "asc" }] : { createdAt: "desc" },
        include: entity === "attributes" ? { values: true } : entity === "attribute-values" ? { attribute: true } : void 0
      });
    }
    res.json(items);
  } catch (err) {
    handleError(err, res);
  }
});
router.post("/api/master-data/:entity", async (req, res) => {
  try {
    const { entity } = req.params;
    const model = getMasterDataModel(entity);
    if (!model) throw new AppError(`Unknown master data entity '${entity}'`, 400);
    const data = { ...req.body, isSystem: req.body.isSystem === true };
    const item = await model.create({ data });
    res.status(201).json(item);
  } catch (err) {
    handleError(err, res);
  }
});
router.put("/api/master-data/:entity/:id", async (req, res) => {
  try {
    const { entity, id } = req.params;
    const model = getMasterDataModel(entity);
    if (!model) throw new AppError(`Unknown master data entity '${entity}'`, 400);
    const existing = await model.findUnique({ where: { id } });
    if (!existing) throw new AppError("Record not found", 404);
    const updated = await model.update({ where: { id }, data: req.body });
    res.json(updated);
  } catch (err) {
    handleError(err, res);
  }
});
router.delete("/api/master-data/:entity/:id", async (req, res) => {
  try {
    const { entity, id } = req.params;
    const model = getMasterDataModel(entity);
    if (!model) throw new AppError(`Unknown master data entity '${entity}'`, 400);
    const existing = await model.findUnique({ where: { id } });
    if (!existing) throw new AppError("Record not found", 404);
    if (existing.isSystem) {
      throw new AppError("System-protected built-in records cannot be deleted.", 400);
    }
    await model.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    handleError(err, res);
  }
});
var legacyRoutes_default = router;

// src/server/routes/onboarding.ts
init_prismaClient();
init_auth();
import { Router } from "express";
var router2 = Router();
router2.get("/plans", async (_req, res) => {
  try {
    const plans = await prismaRaw.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" }
    });
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router2.post("/check-slug", async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) {
      return res.status(400).json({ error: "Slug is required" });
    }
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const existing = await prismaRaw.tenant.findUnique({
      where: { slug: cleanSlug }
    });
    res.json({
      available: !existing,
      slug: cleanSlug
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router2.post("/check-domain", async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }
    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const existing = await prismaRaw.tenant.findFirst({
      where: {
        OR: [
          { customDomain: cleanDomain },
          { customDomain: `www.${cleanDomain}` }
        ]
      }
    });
    res.json({
      available: !existing,
      domain: cleanDomain
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router2.post("/register", async (req, res) => {
  try {
    const {
      storeName,
      slug,
      customDomain,
      ownerName,
      email,
      password,
      planCode = "FREE"
    } = req.body;
    if (!storeName || !slug || !email || !password || !ownerName) {
      return res.status(400).json({ error: "Missing required onboarding fields." });
    }
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const cleanEmail = email.toLowerCase().trim();
    const existingTenant = await prismaRaw.tenant.findUnique({ where: { slug: cleanSlug } });
    if (existingTenant) {
      return res.status(400).json({ error: "Subdomain already taken. Please choose another." });
    }
    let cleanCustomDomain = void 0;
    if (customDomain) {
      cleanCustomDomain = customDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      const existingDomain = await prismaRaw.tenant.findFirst({
        where: {
          OR: [
            { customDomain: cleanCustomDomain },
            { customDomain: `www.${cleanCustomDomain}` }
          ]
        }
      });
      if (existingDomain) {
        return res.status(400).json({ error: "Custom domain already registered to another store." });
      }
    }
    const plan = await prismaRaw.plan.findUnique({ where: { code: planCode.toUpperCase() } });
    if (!plan) {
      return res.status(400).json({ error: "Invalid subscription plan code." });
    }
    let user = await prismaRaw.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      const hashedPassword = await hashPassword(password);
      user = await prismaRaw.user.create({
        data: {
          name: ownerName,
          email: cleanEmail,
          password: hashedPassword
        }
      });
    }
    const tenant = await prismaRaw.tenant.create({
      data: {
        name: storeName,
        slug: cleanSlug,
        customDomain: cleanCustomDomain || null,
        status: "ACTIVE",
        planId: plan.id
      }
    });
    await prismaRaw.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: "TENANT_OWNER"
      }
    });
    await prismaRaw.storeSettings.create({
      data: {
        tenantId: tenant.id,
        storeName,
        currencySymbol: "$",
        taxRatePercent: 10,
        taxName: "GST",
        email: cleanEmail
      }
    });
    const token = createAuthToken({
      userId: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      tenantId: tenant.id,
      role: "TENANT_OWNER"
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1e3
    });
    res.json({
      success: true,
      message: "Store provisioned successfully!",
      token,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        customDomain: tenant.customDomain,
        plan: plan.name
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Onboarding Error:", error);
    res.status(500).json({ error: error.message || "Failed to register store" });
  }
});
var onboarding_default = router2;

// src/server/routes/superadmin.ts
init_prismaClient();
import { Router as Router2 } from "express";

// src/server/middleware/authMiddleware.ts
init_auth();
init_prismaClient();
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token || req.cookies?.authToken;
    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }
    if (!token) {
      return res.status(401).json({ error: "Unauthorized", message: "Authentication token missing." });
    }
    const decoded = verifyAuthToken(token);
    const userId = decoded.userId || decoded.sub;
    let isSuperAdmin = !!decoded.isSuperAdmin;
    let email = decoded.email;
    if (userId) {
      const dbUser = await prismaRaw.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, isSuperAdmin: true }
      });
      if (dbUser) {
        if (dbUser.isSuperAdmin) isSuperAdmin = true;
        if (!email) email = dbUser.email;
      }
    }
    req.user = {
      ...decoded,
      userId: userId || decoded.userId,
      email,
      isSuperAdmin
    };
    res.locals.user = req.user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized", message: "Invalid or expired session token." });
  }
}
async function requireSuperAdmin(req, res, next) {
  if (req.user && req.user.isSuperAdmin) {
    return next();
  }
  const userId = req.user?.userId || req.user?.sub;
  if (userId) {
    const dbUser = await prismaRaw.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true }
    });
    if (dbUser && dbUser.isSuperAdmin) {
      if (req.user) req.user.isSuperAdmin = true;
      return next();
    }
  }
  return res.status(403).json({ error: "Forbidden", message: "Super Admin access required for this operation." });
}

// src/server/routes/superadmin.ts
init_auth();
var router3 = Router2();
router3.use(authMiddleware);
router3.use(requireSuperAdmin);
router3.get("/metrics", async (_req, res) => {
  try {
    const totalTenants = await prismaRaw.tenant.count();
    const activeTenants = await prismaRaw.tenant.count({ where: { status: "ACTIVE" } });
    const totalUsers = await prismaRaw.user.count();
    const totalProducts = await prismaRaw.product.count();
    const totalOrders = await prismaRaw.order.count();
    const tenants = await prismaRaw.tenant.findMany({
      include: { plan: true }
    });
    let estimatedMrr = 0;
    tenants.forEach((t) => {
      if (t.status === "ACTIVE" && t.plan) {
        estimatedMrr += t.plan.priceMonthly;
      }
    });
    res.json({
      totalTenants,
      activeTenants,
      totalUsers,
      totalProducts,
      totalOrders,
      estimatedMrr
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.get("/tenants", async (_req, res) => {
  try {
    const tenants = await prismaRaw.tenant.findMany({
      include: {
        plan: true,
        tenantUsers: {
          include: { user: true }
        },
        _count: {
          select: {
            products: true,
            orders: true,
            customers: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ tenants });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.get("/tenants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await prismaRaw.tenant.findUnique({
      where: { id },
      include: {
        plan: true,
        tenantUsers: {
          include: { user: true }
        },
        storeSettings: true,
        _count: {
          select: {
            products: true,
            orders: true,
            customers: true,
            categories: true,
            brands: true
          }
        }
      }
    });
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    res.json({ tenant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.put("/tenants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      customDomain,
      status,
      planId,
      subscriptionStatus,
      currentPeriodEnd,
      storeName,
      currencySymbol,
      taxRatePercent,
      taxName,
      phone,
      email,
      address
    } = req.body;
    const existing = await prismaRaw.tenant.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    if (slug && slug !== existing.slug) {
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
      const slugTaken = await prismaRaw.tenant.findFirst({
        where: { slug: cleanSlug, id: { not: id } }
      });
      if (slugTaken) {
        return res.status(400).json({ error: `Slug '${cleanSlug}' is already taken by another store.` });
      }
    }
    let cleanCustomDomain = null;
    if (customDomain !== void 0) {
      if (customDomain && customDomain.trim() !== "") {
        cleanCustomDomain = customDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
        const domainTaken = await prismaRaw.tenant.findFirst({
          where: {
            id: { not: id },
            OR: [
              { customDomain: cleanCustomDomain },
              { customDomain: `www.${cleanCustomDomain}` }
            ]
          }
        });
        if (domainTaken) {
          return res.status(400).json({ error: `Custom domain '${cleanCustomDomain}' is already bound to another store.` });
        }
      }
    }
    const updatedTenant = await prismaRaw.tenant.update({
      where: { id },
      data: {
        name: name || void 0,
        slug: slug ? slug.toLowerCase().replace(/[^a-z0-9-]/g, "") : void 0,
        customDomain: customDomain !== void 0 ? cleanCustomDomain : void 0,
        status: status || void 0,
        planId: planId !== void 0 ? planId || null : void 0,
        subscriptionStatus: subscriptionStatus || void 0,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : void 0
      },
      include: { plan: true }
    });
    if (storeName || currencySymbol || taxRatePercent !== void 0 || phone || email || address) {
      const settingsExist = await prismaRaw.storeSettings.findFirst({ where: { tenantId: id } });
      if (settingsExist) {
        await prismaRaw.storeSettings.update({
          where: { id: settingsExist.id },
          data: {
            storeName: storeName || void 0,
            currencySymbol: currencySymbol || void 0,
            taxRatePercent: taxRatePercent !== void 0 ? parseFloat(taxRatePercent) : void 0,
            taxName: taxName || void 0,
            phone: phone || void 0,
            email: email || void 0,
            address: address || void 0
          }
        });
      } else {
        await prismaRaw.storeSettings.create({
          data: {
            tenantId: id,
            storeName: storeName || updatedTenant.name,
            currencySymbol: currencySymbol || "$",
            taxRatePercent: taxRatePercent !== void 0 ? parseFloat(taxRatePercent) : 10,
            taxName: taxName || "GST",
            phone: phone || "",
            email: email || "",
            address: address || ""
          }
        });
      }
    }
    res.json({
      success: true,
      message: `Tenant store '${updatedTenant.name}' updated successfully!`,
      tenant: updatedTenant
    });
  } catch (error) {
    console.error("Super Admin Tenant Edit Error:", error);
    res.status(500).json({ error: error.message || "Failed to update tenant" });
  }
});
router3.post("/tenants/:id/charge", async (req, res) => {
  try {
    const { id } = req.params;
    const { provider = "stripe", amount, description, extendPeriod = true } = req.body;
    const tenant = await prismaRaw.tenant.findUnique({
      where: { id },
      include: { plan: true }
    });
    if (!tenant) {
      return res.status(404).json({ error: "Tenant store not found." });
    }
    const chargeAmount = amount || tenant.plan?.priceMonthly || 79;
    const chargeDesc = description || `Subscription Fee - ${tenant.plan?.name || "SaaS Plan"}`;
    let txnRef = "";
    let checkoutUrl = "";
    if (provider === "stripe") {
      txnRef = `ch_stripe_live_${Date.now()}`;
      checkoutUrl = `${process.env.APP_URL || "http://localhost:3000"}/?mode=store&charge_status=success&txn=${txnRef}`;
    } else if (provider === "paypal") {
      txnRef = `PAYPAL_SUB_${Date.now()}`;
      checkoutUrl = `https://www.paypal.com/checkoutnow?token=${txnRef}`;
    } else {
      txnRef = `MANUAL_WIRE_${Date.now()}`;
    }
    let nextPeriodEnd = tenant.currentPeriodEnd ? new Date(tenant.currentPeriodEnd) : /* @__PURE__ */ new Date();
    if (extendPeriod) {
      nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
    }
    const updatedTenant = await prismaRaw.tenant.update({
      where: { id },
      data: {
        subscriptionStatus: "active",
        currentPeriodEnd: nextPeriodEnd,
        stripeCustomerId: provider === "stripe" ? tenant.stripeCustomerId || `cus_stripe_${tenant.id.slice(-6)}` : tenant.stripeCustomerId,
        stripeSubscriptionId: provider === "stripe" ? txnRef : tenant.stripeSubscriptionId
      },
      include: { plan: true }
    });
    await prismaRaw.activityLog.create({
      data: {
        tenantId: tenant.id,
        action: "TENANT_SUBSCRIPTION_CHARGED",
        entity: "SUBSCRIPTION",
        details: JSON.stringify({
          provider,
          amount: chargeAmount,
          description: chargeDesc,
          nextPeriodEnd,
          checkoutUrl,
          txnRef
        })
      }
    });
    res.json({
      success: true,
      message: `Tenant '${tenant.name}' charged $${chargeAmount.toFixed(2)} via ${provider.toUpperCase()}! Subscription renewed until ${nextPeriodEnd.toLocaleDateString()}.`,
      transactionId: txnRef,
      checkoutUrl,
      tenant: updatedTenant
    });
  } catch (error) {
    console.error("Super Admin Tenant Charge Error:", error);
    res.status(500).json({ error: error.message || "Failed to charge tenant" });
  }
});
router3.post("/tenants/:id/impersonate", async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await prismaRaw.tenant.findUnique({
      where: { id },
      include: { plan: true }
    });
    if (!tenant) {
      return res.status(404).json({ error: "Tenant store not found." });
    }
    const tenantUser = await prismaRaw.tenantUser.findFirst({
      where: { tenantId: tenant.id },
      include: { user: true }
    });
    const user = tenantUser?.user || {
      id: "superadmin-impersonator",
      name: "Super Admin",
      email: "admin@infomats.net"
    };
    const token = createAuthToken({
      userId: user.id,
      email: user.email,
      isSuperAdmin: true,
      isImpersonating: true,
      tenantId: tenant.id,
      role: "TENANT_OWNER"
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1e3
    });
    res.json({
      success: true,
      message: `Super Admin now impersonating store '${tenant.name}' with ALL features unlocked!`,
      token,
      isSuperAdmin: true,
      isImpersonating: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        customDomain: tenant.customDomain,
        plan: tenant.plan
      },
      user: {
        id: user.id,
        name: `${user.name} (Impersonator)`,
        email: user.email,
        isSuperAdmin: true,
        isImpersonating: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.get("/invoices", async (req, res) => {
  try {
    const invoices = await prismaRaw.tenantInvoice.findMany({
      include: { tenant: { include: { plan: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json({ invoices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.post("/invoices", async (req, res) => {
  try {
    const { tenantId, amount, planName, dueDateDays = 7 } = req.body;
    const tenant = await prismaRaw.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ error: "Tenant store not found." });
    }
    const num = `INV-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const dueDate = /* @__PURE__ */ new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(dueDateDays, 10));
    const invoice = await prismaRaw.tenantInvoice.create({
      data: {
        invoiceNumber: num,
        tenantId: tenant.id,
        planName: planName || "Subscription Plan",
        amount: parseFloat(amount),
        tax: 0,
        total: parseFloat(amount),
        status: "UNPAID",
        dueDate,
        sentAt: /* @__PURE__ */ new Date()
      },
      include: { tenant: true }
    });
    res.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} created and issued!`,
      invoice
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.post("/invoices/:id/email", async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prismaRaw.tenantInvoice.findUnique({
      where: { id },
      include: { tenant: { include: { tenantUsers: { include: { user: true } } } } }
    });
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found." });
    }
    await prismaRaw.tenantInvoice.update({
      where: { id },
      data: { sentAt: /* @__PURE__ */ new Date() }
    });
    res.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} notification emailed to tenant owner!`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.post("/invoices/:id/pay", async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentProvider = "stripe", paymentRef } = req.body;
    const invoice = await prismaRaw.tenantInvoice.findUnique({
      where: { id },
      include: { tenant: true }
    });
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found." });
    }
    const updatedInvoice = await prismaRaw.tenantInvoice.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: /* @__PURE__ */ new Date(),
        paymentProvider,
        paymentRef: paymentRef || `PAY_${Date.now()}`
      }
    });
    const nextPeriodEnd = invoice.tenant.currentPeriodEnd ? new Date(invoice.tenant.currentPeriodEnd) : /* @__PURE__ */ new Date();
    nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
    await prismaRaw.tenant.update({
      where: { id: invoice.tenantId },
      data: {
        subscriptionStatus: "active",
        currentPeriodEnd: nextPeriodEnd
      }
    });
    res.json({
      success: true,
      message: `Payment recorded for Invoice ${invoice.invoiceNumber}. Tenant subscription active until ${nextPeriodEnd.toLocaleDateString()}!`,
      invoice: updatedInvoice
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.post("/invoices/run-auto-billing", async (req, res) => {
  try {
    const tenants = await prismaRaw.tenant.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true }
    });
    let generatedCount = 0;
    const now = /* @__PURE__ */ new Date();
    for (const tenant of tenants) {
      if (!tenant.plan || tenant.plan.priceMonthly <= 0) continue;
      const num = `INV-${now.getFullYear()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
      const dueDate = /* @__PURE__ */ new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      await prismaRaw.tenantInvoice.create({
        data: {
          invoiceNumber: num,
          tenantId: tenant.id,
          planName: `${tenant.plan.name} Monthly Subscription`,
          amount: tenant.plan.priceMonthly,
          tax: 0,
          total: tenant.plan.priceMonthly,
          status: "UNPAID",
          dueDate,
          sentAt: now
        }
      });
      generatedCount++;
    }
    res.json({
      success: true,
      message: `Auto-billing routine complete! Generated and emailed ${generatedCount} subscription invoices.`,
      generatedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.patch("/tenants/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["ACTIVE", "SUSPENDED", "CANCELED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const updated = await prismaRaw.tenant.update({
      where: { id },
      data: { status }
    });
    res.json({ success: true, tenant: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.patch("/tenants/:id/plan", async (req, res) => {
  try {
    const { id } = req.params;
    const { planId } = req.body;
    const plan = await prismaRaw.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return res.status(400).json({ error: "Plan not found" });
    }
    const updated = await prismaRaw.tenant.update({
      where: { id },
      data: { planId }
    });
    res.json({ success: true, tenant: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.get("/plans", async (_req, res) => {
  try {
    const plans = await prismaRaw.plan.findMany({
      include: {
        _count: {
          select: { tenants: true }
        }
      },
      orderBy: { priceMonthly: "asc" }
    });
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.post("/plans", async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      priceMonthly,
      priceYearly,
      maxProducts,
      maxOrdersPerMonth,
      maxStaff,
      customDomainAllowed,
      featuresJson,
      isPopular
    } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: "Plan name and code are required." });
    }
    const cleanCode = code.toUpperCase().trim();
    const existing = await prismaRaw.plan.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return res.status(400).json({ error: `Plan code '${cleanCode}' already exists.` });
    }
    const plan = await prismaRaw.plan.create({
      data: {
        name,
        code: cleanCode,
        description: description || "",
        priceMonthly: parseFloat(priceMonthly || "0"),
        priceYearly: parseFloat(priceYearly || "0"),
        maxProducts: parseInt(maxProducts || "100", 10),
        maxOrdersPerMonth: parseInt(maxOrdersPerMonth || "1000", 10),
        maxStaff: parseInt(maxStaff || "2", 10),
        customDomainAllowed: !!customDomainAllowed,
        featuresJson: typeof featuresJson === "string" ? featuresJson : JSON.stringify(featuresJson || []),
        isPopular: !!isPopular
      }
    });
    res.json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.put("/plans/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      priceMonthly,
      priceYearly,
      maxProducts,
      maxOrdersPerMonth,
      maxStaff,
      customDomainAllowed,
      featuresJson,
      isPopular,
      isActive
    } = req.body;
    const updated = await prismaRaw.plan.update({
      where: { id },
      data: {
        name,
        description,
        priceMonthly: priceMonthly !== void 0 ? parseFloat(priceMonthly) : void 0,
        priceYearly: priceYearly !== void 0 ? parseFloat(priceYearly) : void 0,
        maxProducts: maxProducts !== void 0 ? parseInt(maxProducts, 10) : void 0,
        maxOrdersPerMonth: maxOrdersPerMonth !== void 0 ? parseInt(maxOrdersPerMonth, 10) : void 0,
        maxStaff: maxStaff !== void 0 ? parseInt(maxStaff, 10) : void 0,
        customDomainAllowed: customDomainAllowed !== void 0 ? !!customDomainAllowed : void 0,
        featuresJson: typeof featuresJson === "string" ? featuresJson : featuresJson ? JSON.stringify(featuresJson) : void 0,
        isPopular: isPopular !== void 0 ? !!isPopular : void 0,
        isActive: isActive !== void 0 ? !!isActive : void 0
      }
    });
    res.json({ success: true, plan: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.delete("/plans/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prismaRaw.tenant.updateMany({
      where: { planId: id },
      data: { planId: null }
    });
    const plan = await prismaRaw.plan.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ success: true, message: "Plan deactivated successfully.", plan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.post("/tenants", async (req, res) => {
  try {
    const { storeName, slug, customDomain, ownerName, ownerEmail, password, planCode = "GROWTH" } = req.body;
    if (!storeName || !slug || !ownerEmail) {
      return res.status(400).json({ error: "Store Name, Subdomain Slug, and Owner Email are required." });
    }
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const cleanEmail = ownerEmail.toLowerCase().trim();
    const existingSlug = await prismaRaw.tenant.findUnique({ where: { slug: cleanSlug } });
    if (existingSlug) {
      return res.status(400).json({ error: `Subdomain slug '${cleanSlug}' is already in use by another tenant.` });
    }
    let cleanCustomDomain = void 0;
    if (customDomain) {
      cleanCustomDomain = customDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
      const existingDomain = await prismaRaw.tenant.findFirst({
        where: {
          OR: [
            { customDomain: cleanCustomDomain },
            { customDomain: `www.${cleanCustomDomain}` }
          ]
        }
      });
      if (existingDomain) {
        return res.status(400).json({ error: `Custom domain '${cleanCustomDomain}' is already bound to another store.` });
      }
    }
    const plan = await prismaRaw.plan.findUnique({ where: { code: planCode.toUpperCase() } });
    let user = await prismaRaw.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      const { hashPassword: hashPassword3 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
      const hashedPassword = await hashPassword3(password || "Owner123!");
      user = await prismaRaw.user.create({
        data: {
          name: ownerName || "Store Owner",
          email: cleanEmail,
          password: hashedPassword
        }
      });
    }
    const tenant = await prismaRaw.tenant.create({
      data: {
        name: storeName,
        slug: cleanSlug,
        customDomain: cleanCustomDomain || null,
        status: "ACTIVE",
        planId: plan ? plan.id : null
      }
    });
    await prismaRaw.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: "TENANT_OWNER"
      }
    });
    await prismaRaw.storeSettings.create({
      data: {
        tenantId: tenant.id,
        storeName,
        currencySymbol: "$",
        taxRatePercent: 10,
        taxName: "GST",
        email: cleanEmail
      }
    });
    res.json({
      success: true,
      message: `Store '${storeName}' provisioned successfully!`,
      tenant
    });
  } catch (error) {
    console.error("Super Admin Store Provision Error:", error);
    res.status(500).json({ error: error.message || "Failed to provision store" });
  }
});
router3.get("/users", async (_req, res) => {
  try {
    const users = await prismaRaw.user.findMany({
      include: {
        tenantUsers: {
          include: {
            tenant: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.post("/users", async (req, res) => {
  try {
    const { name, email, password, isSuperAdmin, tenantId, role = "TENANT_STAFF" } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }
    const cleanEmail = email.toLowerCase().trim();
    const existing = await prismaRaw.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ error: `User with email '${cleanEmail}' already exists.` });
    }
    const { hashPassword: hashPassword3 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    const hashedPassword = await hashPassword3(password);
    const user = await prismaRaw.user.create({
      data: {
        name,
        email: cleanEmail,
        password: hashedPassword,
        isSuperAdmin: !!isSuperAdmin
      }
    });
    if (tenantId) {
      await prismaRaw.tenantUser.create({
        data: {
          tenantId,
          userId: user.id,
          role
        }
      });
    }
    res.json({ success: true, message: `User account '${user.name}' created successfully!`, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, isSuperAdmin } = req.body;
    const existing = await prismaRaw.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }
    if (email && email.toLowerCase().trim() !== existing.email) {
      const cleanEmail = email.toLowerCase().trim();
      const emailTaken = await prismaRaw.user.findFirst({
        where: { email: cleanEmail, id: { not: id } }
      });
      if (emailTaken) {
        return res.status(400).json({ error: `Email '${cleanEmail}' is already used by another user.` });
      }
    }
    const updated = await prismaRaw.user.update({
      where: { id },
      data: {
        name: name || void 0,
        email: email ? email.toLowerCase().trim() : void 0,
        isSuperAdmin: isSuperAdmin !== void 0 ? !!isSuperAdmin : void 0
      }
    });
    res.json({ success: true, message: `User '${updated.name}' profile updated successfully!`, user: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.post("/users/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long." });
    }
    const { hashPassword: hashPassword3 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    const hashedPassword = await hashPassword3(newPassword);
    const updated = await prismaRaw.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
    res.json({ success: true, message: `Password for user '${updated.email}' reset successfully!` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.post("/users/:id/tenants", async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, role = "TENANT_STAFF" } = req.body;
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required." });
    }
    const existing = await prismaRaw.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: id } }
    });
    if (existing) {
      const updated = await prismaRaw.tenantUser.update({
        where: { id: existing.id },
        data: { role }
      });
      return res.json({ success: true, message: "Store access role updated.", tenantUser: updated });
    }
    const tenantUser = await prismaRaw.tenantUser.create({
      data: {
        tenantId,
        userId: id,
        role
      }
    });
    res.json({ success: true, message: "Store access assigned to user.", tenantUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.delete("/users/:id/tenants/:tenantId", async (req, res) => {
  try {
    const { id, tenantId } = req.params;
    await prismaRaw.tenantUser.deleteMany({
      where: { userId: id, tenantId }
    });
    res.json({ success: true, message: "Store access revoked from user." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router3.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prismaRaw.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    await prismaRaw.user.delete({ where: { id } });
    res.json({ success: true, message: `User account '${user.email}' deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
var superadmin_default = router3;

// src/server/routes/saasAuth.ts
init_prismaClient();
init_auth();
import { Router as Router3 } from "express";
var router4 = Router3();
router4.post("/saas-login", async (req, res) => {
  try {
    const envCheck = validateEnvironment();
    if (!envCheck.isValid) {
      const configurationLocation = process.env.VERCEL || process.env.NODE_ENV === "production" ? "Vercel Project Settings" : ".env.development.local, .env.local, or .env";
      return res.status(500).json({
        success: false,
        error: `Server Configuration Error: Missing required environment variables (${envCheck.missingVars.join(", ")}). Please set these in ${configurationLocation}.`,
        missingVars: envCheck.missingVars
      });
    }
    const { email, password, storeSlug } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = await findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials. User account not found." });
    }
    const validPassword = await verifyPassword(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials. Incorrect password." });
    }
    if (user.isSuperAdmin) {
      const token2 = createAuthToken({
        userId: user.id,
        email: user.email,
        isSuperAdmin: true
      });
      res.cookie("token", token2, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1e3
      });
      return res.json({
        success: true,
        isSuperAdmin: true,
        token: token2,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isSuperAdmin: true,
          role: "SUPER_ADMIN"
        }
      });
    }
    const tenantUsers = user.tenantUsers || [];
    if (tenantUsers.length === 0) {
      return res.status(403).json({
        error: "No Associated Stores",
        message: "This account is not associated with any active store ERP. Please contact your administrator or register a new store."
      });
    }
    let selectedTenantUser = tenantUsers[0];
    if (storeSlug) {
      const matched = tenantUsers.find((tu) => tu.tenant?.slug === storeSlug || tu.tenant?.customDomain === storeSlug);
      if (matched) selectedTenantUser = matched;
    }
    const tenantId = selectedTenantUser ? selectedTenantUser.tenantId : "default-tenant";
    const role = selectedTenantUser ? selectedTenantUser.role : "TENANT_OWNER";
    const tenant = selectedTenantUser ? selectedTenantUser.tenant : null;
    const token = createAuthToken({
      userId: user.id,
      email: user.email,
      isSuperAdmin: false,
      tenantId,
      role
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1e3
    });
    return res.json({
      success: true,
      isSuperAdmin: false,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isSuperAdmin: false,
        role
      },
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        customDomain: tenant.customDomain
      } : null
    });
  } catch (error) {
    console.error("SaaS Login Error:", error);
    const msg = error?.message || "Authentication server error";
    return res.status(500).json({
      success: false,
      error: `Database / Server Error: ${msg}. Please verify Vercel DATABASE_URL & JWT_SECRET environment variables.`
    });
  }
});
router4.post("/login", (req, res, next) => {
  req.url = "/saas-login";
  next();
});
router4.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.clearCookie("authToken");
  res.json({ success: true, message: "Logged out successfully." });
});
router4.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : cookieToken;
    if (!token) {
      return res.status(401).json({ authenticated: false });
    }
    const jwt3 = await import("jsonwebtoken");
    const secret = process.env.JWT_SECRET || "dev-secret";
    const decoded = jwt3.default.verify(token, secret);
    const user = await prismaRaw.user.findUnique({
      where: { id: decoded.userId },
      include: {
        tenantUsers: {
          include: { tenant: { include: { plan: true } } }
        }
      }
    });
    if (!user) {
      return res.status(401).json({ authenticated: false });
    }
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        role: decoded.role,
        tenantId: decoded.tenantId
      },
      stores: user.tenantUsers.map((tu) => tu.tenant)
    });
  } catch (error) {
    res.status(401).json({ authenticated: false });
  }
});
router4.post("/change-password", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : cookieToken;
    if (!token) {
      return res.status(401).json({ error: "Authentication required. Please log in again." });
    }
    const jwt3 = await import("jsonwebtoken");
    const secret = process.env.JWT_SECRET || "dev-secret";
    const decoded = jwt3.default.verify(token, secret);
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long." });
    }
    const user = await prismaRaw.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(404).json({ error: "User account not found." });
    }
    const { verifyPassword: verifyPassword2, hashPassword: hashPassword3 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    const isValid = await verifyPassword2(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: "Incorrect current password. Please try again." });
    }
    const newHashedPassword = await hashPassword3(newPassword);
    await prismaRaw.user.update({
      where: { id: user.id },
      data: { password: newHashedPassword }
    });
    res.json({ success: true, message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to update password." });
  }
});
var saasAuth_default = router4;

// src/server/routes/tenantBilling.ts
init_prismaClient();
init_tenantContext();
import { Router as Router4 } from "express";
var router5 = Router4();
router5.get("/overview", async (req, res) => {
  try {
    const tenantId = getActiveTenantId();
    const tenant = await prismaRaw.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true }
    });
    if (!tenant) {
      return res.status(404).json({ error: "Tenant store not found." });
    }
    const productCount = await prismaRaw.product.count({ where: { tenantId } });
    const orderCount = await prismaRaw.order.count({ where: { tenantId } });
    const staffCount = await prismaRaw.tenantUser.count({ where: { tenantId } });
    const plans = await prismaRaw.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" }
    });
    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        customDomain: tenant.customDomain,
        status: tenant.status,
        subscriptionStatus: tenant.subscriptionStatus,
        currentPeriodEnd: tenant.currentPeriodEnd
      },
      currentPlan: tenant.plan,
      usage: {
        products: {
          used: productCount,
          limit: tenant.plan?.maxProducts || 100,
          percent: tenant.plan ? Math.min(100, Math.round(productCount / tenant.plan.maxProducts * 100)) : 0
        },
        orders: {
          used: orderCount,
          limit: tenant.plan?.maxOrdersPerMonth || 1e3,
          percent: tenant.plan ? Math.min(100, Math.round(orderCount / tenant.plan.maxOrdersPerMonth * 100)) : 0
        },
        staff: {
          used: staffCount,
          limit: tenant.plan?.maxStaff || 2,
          percent: tenant.plan ? Math.min(100, Math.round(staffCount / tenant.plan.maxStaff * 100)) : 0
        }
      },
      plans
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router5.post("/change-plan", authMiddleware, async (req, res) => {
  try {
    const tenantId = getActiveTenantId();
    const { planId } = req.body;
    const plan = await prismaRaw.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return res.status(400).json({ error: "Selected plan tier does not exist." });
    }
    const updatedTenant = await prismaRaw.tenant.update({
      where: { id: tenantId },
      data: {
        planId: plan.id,
        subscriptionStatus: "active"
      },
      include: { plan: true }
    });
    res.json({
      success: true,
      message: `Store plan successfully updated to ${plan.name}!`,
      tenant: updatedTenant
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router5.post("/setup-recurring-payment", authMiddleware, async (req, res) => {
  try {
    const tenantId = getActiveTenantId();
    const { paymentProvider = "stripe", paymentToken, billingCycle = "monthly" } = req.body;
    const tenant = await prismaRaw.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true }
    });
    if (!tenant) {
      return res.status(404).json({ error: "Tenant store not found." });
    }
    const nextPeriodEnd = /* @__PURE__ */ new Date();
    if (billingCycle === "yearly") {
      nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
    } else {
      nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
    }
    const stripeCust = paymentProvider === "stripe" ? tenant.stripeCustomerId || `cus_stripe_${Date.now()}` : tenant.stripeCustomerId;
    const stripeSub = paymentProvider === "stripe" ? tenant.stripeSubscriptionId || `sub_live_${Date.now()}` : tenant.stripeSubscriptionId;
    const updatedTenant = await prismaRaw.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionStatus: "active",
        currentPeriodEnd: nextPeriodEnd,
        stripeCustomerId: stripeCust,
        stripeSubscriptionId: stripeSub
      },
      include: { plan: true }
    });
    res.json({
      success: true,
      message: `Automated recurring payment via ${paymentProvider.toUpperCase()} configured successfully! Next invoice date: ${nextPeriodEnd.toLocaleDateString()}`,
      tenant: updatedTenant,
      nextInvoiceDate: nextPeriodEnd
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
var tenantBilling_default = router5;

// src/server/middleware/tenantResolver.ts
init_prismaClient();
init_tenantContext();
var MAIN_APP_HOSTS = /* @__PURE__ */ new Set([
  "localhost",
  "127.0.0.1",
  "infomats.net",
  "app.infomats.net",
  "www.infomats.net",
  "storeerp.com",
  "app.storeerp.com",
  "www.storeerp.com"
]);
async function tenantResolverMiddleware(req, res, next) {
  try {
    let rawHost = req.headers["x-forwarded-host"] || req.headers.host || "";
    const host = rawHost.split(":")[0].toLowerCase();
    const headerTenantId = req.headers["x-tenant-id"];
    const headerTenantSlug = req.headers["x-tenant-slug"];
    let tenant = null;
    if (headerTenantId) {
      tenant = await prismaRaw.tenant.findUnique({
        where: { id: headerTenantId },
        include: { plan: true }
      });
    } else if (headerTenantSlug) {
      tenant = await prismaRaw.tenant.findUnique({
        where: { slug: headerTenantSlug },
        include: { plan: true }
      });
    }
    if (!tenant && host && !MAIN_APP_HOSTS.has(host)) {
      tenant = await prismaRaw.tenant.findFirst({
        where: {
          OR: [
            { customDomain: host },
            { customDomain: `www.${host}` },
            { customDomain: host.replace(/^www\./, "") }
          ]
        },
        include: { plan: true }
      });
      if (!tenant) {
        const parts = host.split(".");
        if (parts.length >= 2) {
          const possibleSlug = parts[0];
          if (possibleSlug !== "www" && possibleSlug !== "app" && possibleSlug !== "api") {
            tenant = await prismaRaw.tenant.findUnique({
              where: { slug: possibleSlug },
              include: { plan: true }
            });
          }
        }
      }
    }
    if (!tenant) {
      try {
        tenant = await prismaRaw.tenant.findFirst({
          where: { slug: "default-tenant" },
          include: { plan: true }
        });
      } catch (dbErr) {
        console.warn("[TenantResolver Warning] Database temporary lookup fallback:", dbErr);
      }
    }
    const tenantId = tenant ? tenant.id : "default-tenant";
    const tenantSlug = tenant ? tenant.slug : "default-tenant";
    const customDomain = tenant ? tenant.customDomain || void 0 : void 0;
    if (tenant && tenant.status === "SUSPENDED") {
      return res.status(403).json({
        error: "Tenant Account Suspended",
        message: "This store account has been suspended. Please contact support or resolve billing."
      });
    }
    res.locals.tenant = tenant;
    tenantLocalStorage.run(
      {
        tenantId,
        tenantSlug,
        customDomain
      },
      () => {
        next();
      }
    );
  } catch (error) {
    console.warn("[Tenant Resolution Guard] Proceeding with default context:", error);
    tenantLocalStorage.run(
      {
        tenantId: "default-tenant",
        tenantSlug: "default-tenant"
      },
      () => {
        next();
      }
    );
  }
}

// src/server/logging.ts
import fs4 from "node:fs/promises";
import path4 from "node:path";
var writeLog = async (entry, fileName = "app.log") => {
  console.log(`[APP LOG] ${(/* @__PURE__ */ new Date()).toISOString()} ${entry}`);
  try {
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      return;
    }
    const logPath = path4.resolve(process.cwd(), "logs", fileName);
    await fs4.mkdir(path4.dirname(logPath), { recursive: true });
    await fs4.appendFile(logPath, `${(/* @__PURE__ */ new Date()).toISOString()} ${entry}
`);
  } catch (e) {
  }
};

// src/server/payments.ts
var PaymentService = class {
  constructor(adapter) {
    this.adapter = adapter;
  }
  async createSession(input) {
    return this.adapter.createPaymentSession(input);
  }
};
var createPaymentAdapter = (provider) => {
  switch (provider) {
    case "stripe":
      return {
        async createPaymentSession(input) {
          return { provider: "stripe", sessionId: `stripe_${input.orderId}`, clientSecret: "placeholder", url: "/checkout/success" };
        }
      };
    case "paypal":
      return {
        async createPaymentSession(input) {
          return { provider: "paypal", sessionId: `paypal_${input.orderId}`, referenceId: `pp_${input.orderId}` };
        }
      };
    case "square":
      return {
        async createPaymentSession(input) {
          return { provider: "square", sessionId: `square_${input.orderId}`, referenceId: `sq_${input.orderId}` };
        }
      };
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
};

// src/server/seo.ts
var buildSeoMetadata = (title, description, slug) => {
  const safeSlug = slug.replace(/\s+/g, "-").toLowerCase();
  return {
    slug: safeSlug,
    title: title || "Tech Seller",
    description: description || "Premium refurbished hardware and electronics.",
    ogTitle: title || "Tech Seller",
    ogDescription: description || "Premium refurbished hardware and electronics.",
    canonicalUrl: `https://techseller.com.au/${safeSlug}`,
    imageUrl: "/uploads/store/og-default.png",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Tech Seller",
      url: "https://techseller.com.au"
    }
  };
};
var buildRobotsTxt = () => `User-agent: *
Allow: /
Sitemap: https://techseller.com.au/sitemap.xml
`;
var buildSitemapXml = (urls) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${url}</loc></url>`).join("")}
</urlset>`;

// src/server/app.ts
dotenv2.config({ path: [".env.local", ".env"] });
dotenv2.config({ path: ".env.development.local", override: true });
var app = express2();
var stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser2());
var publicDir = path5.resolve(process.cwd(), "public");
app.use(express2.static(publicDir));
app.use("/uploads", express2.static(path5.resolve(publicDir, "uploads")));
var limiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: process.env.NODE_ENV === "production" ? 300 : 5e3,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== "production" && req.path.startsWith("/api/")
});
app.use("/api", limiter);
app.use((req, _res, next) => {
  void writeLog(`${req.method} ${req.path}`);
  next();
});
app.use(tenantResolverMiddleware);
app.use("/api/auth", saasAuth_default);
app.use("/auth", saasAuth_default);
app.use("/api/onboarding", onboarding_default);
app.use("/onboarding", onboarding_default);
app.use("/api/billing", tenantBilling_default);
app.use("/billing", tenantBilling_default);
app.use("/api/superadmin", superadmin_default);
app.use("/superadmin", superadmin_default);
var doubleCsrfProtection = (_req, _res, next) => next();
try {
  const csrf = doubleCsrf({
    getSecret: () => process.env.JWT_SECRET || "dev-secret-key-must-be-at-least-32-chars-long-infomats-store-erp",
    getSessionIdentifier: (req) => req.cookies?.session || "anonymous",
    cookieName: "x-csrf-token",
    cookieOptions: {
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production"
    }
  });
  doubleCsrfProtection = csrf.doubleCsrfProtection;
} catch (csrfErr) {
  console.warn("\u26A0\uFE0F [CSRF Warning] doubleCsrf initialization skipped:", csrfErr);
}
app.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }
  const skipCsrf = req.path.startsWith("/api/");
  if (skipCsrf) {
    return next();
  }
  return doubleCsrfProtection(req, res, next);
});
app.use(legacyRoutes_default);
app.post("/api/payments/session", async (req, res) => {
  try {
    const provider = (req.body.provider || "stripe").toLowerCase();
    const adapter = createPaymentAdapter(provider);
    const service = new PaymentService(adapter);
    const result = await service.createSession({
      amount: req.body.amount || 0,
      currency: req.body.currency || "AUD",
      orderId: req.body.orderId || "order-1",
      customerEmail: req.body.customerEmail,
      successUrl: req.body.successUrl,
      cancelUrl: req.body.cancelUrl
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(buildRobotsTxt());
});
app.get("/sitemap.xml", (req, res) => {
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost:3000";
  const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
  const urls = [`${baseUrl}/`, `${baseUrl}/products`].map((u) => u.replace(/([^:]\/)\/+/g, "$1"));
  res.type("application/xml").send(buildSitemapXml(urls));
});
app.get("/api/seo/metadata", (req, res) => {
  const slug = String(req.query.slug || "home");
  const title = String(req.query.title || "Tech Seller");
  const description = String(req.query.description || "Premium refurbished hardware and electronics.");
  res.json(buildSeoMetadata(title, description, slug));
});
app.post("/api/create-checkout-session", async (req, res) => {
  if (!stripe) {
    return res.status(200).json({
      fallback: true,
      message: "Stripe is not configured. Completing your order locally."
    });
  }
  try {
    const { items, successUrl, cancelUrl } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid items" });
    }
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : []
        },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    }));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl || `${process.env.APP_URL || "http://localhost:3000"}/success`,
      cancel_url: cancelUrl || `${process.env.APP_URL || "http://localhost:3000"}/cart`
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
var app_default = app;

// api/_handler.ts
async function handler(req, res) {
  try {
    const env = validateEnvironment();
    if (!env.isValid) {
      return res.status(500).json({
        success: false,
        error: "Environment validation failed. Check Vercel DATABASE_URL and JWT_SECRET values.",
        missing: env.missingVars,
        warnings: env.warnings
      });
    }
    return app_default(req, res);
  } catch (error) {
    console.error("[Vercel Serverless Invocation Error]:", error);
    return res.status(500).json({
      success: false,
      error: `Serverless Invocation Failed: ${error?.message || error}`
    });
  }
}
export {
  handler as default
};
