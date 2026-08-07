import test from 'node:test';
import assert from 'node:assert/strict';
import { canCompleteStep, firstIncompleteStep, workflowForItemType } from './inboundWorkflow';

test('used devices receive the complete controlled processing workflow', () => {
  const steps = workflowForItemType('USED_DEVICE');
  assert.deepEqual(steps.map((step) => step.stepKey), [
    'IDENTIFICATION', 'PHYSICAL_INSPECTION', 'DATA_SANITIZATION', 'DIAGNOSTICS',
    'REPAIR', 'RETEST', 'GRADING', 'COSTING', 'QC_APPROVAL', 'PUT_AWAY', 'INVENTORY_RELEASE',
  ]);
  assert.equal(steps.every((step) => step.required), true);
});

test('new stock uses the shorter inspection route', () => {
  assert.deepEqual(workflowForItemType('NEW_STOCK').map((step) => step.stepKey), [
    'IDENTIFICATION', 'PHYSICAL_INSPECTION', 'COSTING', 'QC_APPROVAL', 'PUT_AWAY', 'INVENTORY_RELEASE',
  ]);
});

test('steps cannot be completed out of order but failures can route to the next work step', () => {
  const steps = workflowForItemType('USED_DEVICE').map((step, index) => ({ ...step, id: String(index) }));
  assert.equal(canCompleteStep(steps, '1'), false);
  steps[0].status = 'COMPLETED';
  assert.equal(canCompleteStep(steps, '1'), true);
  steps[1].status = 'FAILED';
  assert.equal(firstIncompleteStep(steps)?.stepKey, 'DATA_SANITIZATION');
});
