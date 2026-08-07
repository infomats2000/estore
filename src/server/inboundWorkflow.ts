export const INBOUND_STEP_LABELS: Record<string, string> = {
  IDENTIFICATION: 'Identification & serial capture',
  PHYSICAL_INSPECTION: 'Physical inspection',
  DATA_SANITIZATION: 'Data sanitization',
  DIAGNOSTICS: 'Hardware diagnostics',
  REPAIR: 'Repair / refurbishment',
  RETEST: 'Final retest',
  GRADING: 'Cosmetic & functional grading',
  COSTING: 'Costing & pricing',
  QC_APPROVAL: 'Independent QC approval',
  PUT_AWAY: 'Warehouse put-away',
  INVENTORY_RELEASE: 'Release to sellable inventory',
};

const NEW_STOCK_STEPS = ['IDENTIFICATION', 'PHYSICAL_INSPECTION', 'COSTING', 'QC_APPROVAL', 'PUT_AWAY', 'INVENTORY_RELEASE'];
const USED_DEVICE_STEPS = ['IDENTIFICATION', 'PHYSICAL_INSPECTION', 'DATA_SANITIZATION', 'DIAGNOSTICS', 'REPAIR', 'RETEST', 'GRADING', 'COSTING', 'QC_APPROVAL', 'PUT_AWAY', 'INVENTORY_RELEASE'];

export function workflowForItemType(itemType: string) {
  const keys = ['USED_DEVICE', 'DATA_BEARING_DEVICE', 'CUSTOMER_RETURN'].includes(itemType)
    ? USED_DEVICE_STEPS
    : NEW_STOCK_STEPS;
  return keys.map((stepKey, sequence) => ({
    stepKey,
    sequence,
    required: true,
    status: sequence === 0 ? 'READY' : 'PENDING',
  }));
}

export function firstIncompleteStep<T extends { stepKey: string; status: string; required: boolean; sequence: number }>(steps: T[]) {
  return [...steps]
    .sort((a, b) => a.sequence - b.sequence)
    .find((step) => step.required && !['COMPLETED', 'FAILED'].includes(step.status));
}

export function canCompleteStep<T extends { id: string; status: string; required: boolean; sequence: number }>(steps: T[], stepId: string) {
  const ordered = [...steps].sort((a, b) => a.sequence - b.sequence);
  const index = ordered.findIndex((step) => step.id === stepId);
  if (index < 0) return false;
  return ordered.slice(0, index).every((step) => !step.required || ['COMPLETED', 'FAILED'].includes(step.status));
}
