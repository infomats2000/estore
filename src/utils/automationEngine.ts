import { AutomationRule, AutomationExecutionLog, WorkflowTriggerType } from '../types';

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'RULE-101',
    name: 'Stock Minimum Auto-Replenishment',
    trigger: 'STOCK_MINIMUM',
    triggerThreshold: 5,
    action: 'CREATE_PO_DRAFT',
    active: true,
    lastTriggeredAt: '2026-08-04T14:30:00Z',
    executionCount: 14,
    description: 'When stock on hand reaches minimum safety threshold (<= 5 units), automatically create a Purchase Order draft.'
  },
  {
    id: 'RULE-102',
    name: 'High-Value Sale Manager Approval',
    trigger: 'HIGH_VALUE_SALE',
    triggerThreshold: 5000,
    action: 'REQUIRE_MANAGER_APPROVAL',
    active: true,
    lastTriggeredAt: '2026-08-05T09:15:00Z',
    executionCount: 8,
    description: 'When a transaction exceeds $5,000 AUD, flag order for Manager Approval prior to dispatch.'
  },
  {
    id: 'RULE-103',
    name: 'Warranty Expiry 30-Day Customer Renewal',
    trigger: 'WARRANTY_EXPIRING',
    triggerThreshold: 30,
    action: 'NOTIFY_CUSTOMER_EMAIL',
    active: true,
    lastTriggeredAt: '2026-08-01T08:00:00Z',
    executionCount: 42,
    description: 'When customer 12-month hardware warranty expires in 30 days, send automated Email & SMS extended warranty notice.'
  },
  {
    id: 'RULE-104',
    name: 'New E-Commerce Order Warehouse Allocation',
    trigger: 'NEW_ONLINE_ORDER',
    action: 'ALLOCATE_STOCK_WAREHOUSE',
    active: true,
    lastTriggeredAt: '2026-08-05T11:45:00Z',
    executionCount: 156,
    description: 'When a new storefront or marketplace order is placed, allocate stock from primary warehouse and alert dispatch.'
  },
  {
    id: 'RULE-105',
    name: 'Repair Job Completed Notification & Invoice',
    trigger: 'REPAIR_COMPLETED',
    action: 'GENERATE_INVOICE_SMS',
    active: true,
    lastTriggeredAt: '2026-08-04T16:20:00Z',
    executionCount: 29,
    description: 'When a workshop repair ticket status is marked Ready/Completed, generate Tax Invoice and send SMS/Email pick-up notice.'
  },
  {
    id: 'RULE-106',
    name: 'Supplier GRN Receipt Sales Broadcast',
    trigger: 'SHIPMENT_RECEIVED',
    action: 'NOTIFY_SALES_TEAM',
    active: true,
    lastTriggeredAt: '2026-08-03T13:10:00Z',
    executionCount: 19,
    description: 'When a supplier GRN shipment is received into inventory, update stock counts and broadcast alert to B2B Sales Team.'
  }
];

export const INITIAL_AUTOMATION_LOGS: AutomationExecutionLog[] = [
  {
    id: 'LOG-9001',
    ruleId: 'RULE-104',
    ruleName: 'New E-Commerce Order Warehouse Allocation',
    triggeredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'Success',
    payloadSummary: 'Allocated 2x Dell Latitude 5420 from Sydney Central WH-001 for Order #10042'
  },
  {
    id: 'LOG-9002',
    ruleId: 'RULE-102',
    ruleName: 'High-Value Sale Manager Approval',
    triggeredAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: 'Pending Approval',
    payloadSummary: 'Order #10045 total $6,850.00 flagged for Manager Approval'
  },
  {
    id: 'LOG-9003',
    ruleId: 'RULE-101',
    ruleName: 'Stock Minimum Auto-Replenishment',
    triggeredAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    status: 'Success',
    payloadSummary: 'Created PO Draft #PO-10049 for 10x Lenovo ThinkPad T14 (Dell Australia)'
  }
];

export function evaluateAutomationTrigger(
  trigger: WorkflowTriggerType,
  payload: any,
  rules: AutomationRule[]
): { triggeredRules: AutomationRule[]; executionLogs: AutomationExecutionLog[] } {
  const activeRules = rules.filter(r => r.active && r.trigger === trigger);
  const executionLogs: AutomationExecutionLog[] = [];

  activeRules.forEach(rule => {
    executionLogs.push({
      id: 'LOG-' + Math.floor(Math.random() * 90000 + 10000),
      ruleId: rule.id,
      ruleName: rule.name,
      triggeredAt: new Date().toISOString(),
      status: rule.action === 'REQUIRE_MANAGER_APPROVAL' ? 'Pending Approval' : 'Success',
      payloadSummary: `Trigger ${trigger} evaluated payload. Action ${rule.action} executed.`
    });
  });

  return {
    triggeredRules: activeRules,
    executionLogs
  };
}
