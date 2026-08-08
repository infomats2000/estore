import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_FEATURES, DASHBOARD_TAB_FEATURE_MAP, DEFAULT_PLAN_FEATURES, STANDARD_TENANT_FEATURES, normalizeStaffFeatureIds, resolvePlanFeatureIds } from '../constants/features';
import { parsePlanFeatures } from './middleware/featureEnforcer';

test('every dashboard module maps to a known plan feature', () => {
  const knownFeatures = new Set(ALL_FEATURES.map((feature) => feature.id));
  const expectedTabs = [
    'metrics', 'products', 'orders', 'customers', 'invoices', 'inventory',
    'purchase-orders', 'inbound-jobs', 'suppliers', 'warehouses', 'bi', 'reports', 'payroll',
    'shipping', 'finance', 'master-data', 'ebay', 'commercial-sales',
    'massive-inventory', 'wms', 'procurement', 'pricing-matrix',
    'logistics-dispatch', 'automation', 'users', 'repairs', 'returns',
    'analytics', 'stock-units', 'trade-accounts', 'refurb', 'distribution',
    'coupons', 'segments', 'upsells', 'categories', 'collections', 'reviews', 'stores',
  ];

  assert.deepEqual(Object.keys(DASHBOARD_TAB_FEATURE_MAP).sort(), expectedTabs.sort());
  for (const featureId of Object.values(DASHBOARD_TAB_FEATURE_MAP)) {
    assert.equal(knownFeatures.has(featureId), true, `Unknown feature mapping: ${featureId}`);
  }
});

test('default plans contain only known features and always include POS', () => {
  const knownFeatures = new Set(ALL_FEATURES.map((feature) => feature.id));
  for (const features of Object.values(DEFAULT_PLAN_FEATURES)) {
    assert.equal(features.includes('pos'), true);
    assert.equal(features.every((featureId) => knownFeatures.has(featureId)), true);
  }
});

test('stored feature JSON is parsed fail-closed', () => {
  assert.deepEqual(parsePlanFeatures('["pos","procurement"]'), ['pos', 'procurement']);
  assert.deepEqual(parsePlanFeatures('invalid'), []);
  assert.deepEqual(parsePlanFeatures('{"pos":true}'), []);
});

test('legacy staff permissions normalize to subscription feature identifiers', () => {
  assert.deepEqual(normalizeStaffFeatureIds(['commercial-sales', 'pricing-matrix', 'wms', 'finance']), ['trade_accounts', 'wms_inventory', 'finance_ledger']);
});

test('standard plans receive the core ERP workspace while custom plans remain explicit', () => {
  assert.deepEqual(resolvePlanFeatureIds('FREE', ['pos']).sort(), [...STANDARD_TENANT_FEATURES].sort());
  assert.deepEqual(resolvePlanFeatureIds('CUSTOM_CLIENT', ['pos', 'storefront']), ['pos', 'storefront']);
});
