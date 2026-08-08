import assert from 'node:assert/strict';
import test from 'node:test';
import { answerAdminQuestion, AssistantModule } from '../utils/adminAssistant';

const modules: AssistantModule[] = [
  { id: 'products', label: 'Products', group: 'Core', summary: 'Manage catalogue products.', action: 'Add or edit an item.' },
  { id: 'inbound-jobs', label: 'Receive Goods', group: 'Procurement', summary: 'Process delivered stock.', action: 'Complete inspection steps.' },
  { id: 'invoices', label: 'Invoicing', group: 'Core', summary: 'Create invoices.', action: 'Select an order.' },
];

test('assistant maps workflow questions to permitted navigation destinations', () => {
  const result = answerAdminQuestion('A supplier delivery arrived, how do I receive goods?', modules, 'products');
  assert.equal(result.moduleId, 'inbound-jobs');
  assert.equal(result.confidence, 'high');
  assert.match(result.text, /inspection/i);
});

test('assistant never exposes a navigation action for an unavailable module', () => {
  const result = answerAdminQuestion('Where do I add a staff user?', modules, 'products');
  assert.equal(result.moduleId, undefined);
  assert.match(result.text, /not available/i);
});

test('assistant explains the current permitted page', () => {
  const result = answerAdminQuestion('How do I use this page?', modules, 'products');
  assert.equal(result.moduleId, 'products');
  assert.match(result.text, /Manage catalogue products/);
});
