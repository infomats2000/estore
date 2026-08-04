import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProductForDb, serializeProductForResponse } from './products';

test('normalizes arrays and objects for Prisma storage', () => {
  const input = {
    name: 'Test',
    description: 'Test',
    price: 99,
    stock: 2,
    specs: { cpu: 'i7' },
    tags: ['x'],
    additionalImages: ['a'],
    colors: ['black'],
    sizes: ['M']
  };

  const result = normalizeProductForDb(input);

  assert.equal(result.specs, '{"cpu":"i7"}');
  assert.equal(result.tags, '["x"]');
  assert.equal(result.additionalImages, '["a"]');
  assert.equal(result.colors, '["black"]');
  assert.equal(result.sizes, '["M"]');
});

test('serializes stored JSON strings back to objects and arrays', () => {
  const result = serializeProductForResponse({
    id: '1',
    name: 'Test',
    description: 'Test',
    price: 99,
    stock: 2,
    specs: '{"cpu":"i7"}',
    tags: '["x"]',
    additionalImages: '["a"]',
    colors: '["black"]',
    sizes: '["M"]',
    categoryId: null
  });

  assert.deepEqual(result.specs, { cpu: 'i7' });
  assert.deepEqual(result.tags, ['x']);
  assert.deepEqual(result.additionalImages, ['a']);
  assert.deepEqual(result.colors, ['black']);
  assert.deepEqual(result.sizes, ['M']);
});
