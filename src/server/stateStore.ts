import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_STORE_SETTINGS } from '../types';
import { INITIAL_PRODUCTS, INITIAL_REVIEWS, INITIAL_COUPONS } from '../data/products';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const APP_STATE_FILE = path.join(DATA_DIR, 'app-state.json');
const ADMIN_EXTRAS_FILE = path.join(DATA_DIR, 'admin-extras.json');

export interface AppStateStore {
  storeSettings: Record<string, any>;
  products: any[];
  reviews: any[];
  coupons: any[];
  orders: any[];
  customers: any[];
  financeTransactions: any[];
  users: any[];
  returns: any[];
  categories: string[];
  customerSegments: any[];
  upsellRules: any[];
  collections: string[];
  purchaseOrders: any[];
  repairJobs: any[];
  stockUnits: any[];
}

export interface AdminExtrasStore {
  suppliers: any[];
  supplierOrders: any[];
  shipments: any[];
  inventoryLogs: any[];
}

const APP_STATE_DEFAULTS: AppStateStore = {
  storeSettings: DEFAULT_STORE_SETTINGS,
  products: INITIAL_PRODUCTS,
  reviews: INITIAL_REVIEWS,
  coupons: INITIAL_COUPONS,
  orders: [],
  customers: [],
  financeTransactions: [],
  users: [],
  returns: [],
  categories: ['Laptops', 'Desktops', 'Monitors', 'Workstations', 'Apple Mac', 'Parts'],
  customerSegments: [],
  upsellRules: [],
  collections: ['Laptops', 'Apple Mac'],
  purchaseOrders: [],
  repairJobs: [],
  stockUnits: []
};

const ADMIN_EXTRAS_DEFAULTS: AdminExtrasStore = {
  suppliers: [],
  supplierOrders: [],
  shipments: [],
  inventoryLogs: []
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const mergeWithFallback = <T extends Record<string, any>>(fallback: T, parsed: Partial<T> | null | undefined): T => {
  const merged = { ...clone(fallback), ...(parsed || {}) } as T;

  for (const [key, fallbackValue] of Object.entries(fallback) as [string, any][]) {
    const candidate = (merged as Record<string, any>)[key];
    if (Array.isArray(fallbackValue) && Array.isArray(candidate) && candidate.length === 0) {
      (merged as Record<string, any>)[key] = clone(fallbackValue);
    }
  }

  return merged;
};

const readJsonFile = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return mergeWithFallback(fallback as Record<string, any>, parsed as Partial<Record<string, any>>) as T;
  } catch {
    return clone(fallback);
  }
};

const writeJsonFile = async <T>(filePath: string, data: T): Promise<T> => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  return data;
};

export const readAppStateStore = async (): Promise<AppStateStore> => {
  const state = await readJsonFile<AppStateStore>(APP_STATE_FILE, APP_STATE_DEFAULTS);
  return {
    ...APP_STATE_DEFAULTS,
    ...state,
    storeSettings: { ...DEFAULT_STORE_SETTINGS, ...(state.storeSettings || {}) }
  };
};

export const writeAppStateStore = async (partial: Partial<AppStateStore>): Promise<AppStateStore> => {
  const current = await readAppStateStore();
  const next: AppStateStore = {
    ...current,
    ...partial,
    storeSettings: { ...DEFAULT_STORE_SETTINGS, ...(current.storeSettings || {}), ...(partial.storeSettings || {}) }
  };
  return writeJsonFile(APP_STATE_FILE, next);
};

export const readAdminExtrasStore = async (): Promise<AdminExtrasStore> => {
  const extras = await readJsonFile<AdminExtrasStore>(ADMIN_EXTRAS_FILE, ADMIN_EXTRAS_DEFAULTS);
  return { ...ADMIN_EXTRAS_DEFAULTS, ...extras };
};

export const writeAdminExtrasStore = async (partial: Partial<AdminExtrasStore>): Promise<AdminExtrasStore> => {
  const current = await readAdminExtrasStore();
  const next: AdminExtrasStore = { ...current, ...partial };
  return writeJsonFile(ADMIN_EXTRAS_FILE, next);
};
