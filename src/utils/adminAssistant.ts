export interface AssistantModule {
  id: string;
  label: string;
  group: string;
  summary: string;
  action: string;
  keywords?: string[];
}

export interface AssistantAnswer {
  text: string;
  moduleId?: string;
  moduleLabel?: string;
  confidence: 'high' | 'medium' | 'low';
}

const WORKFLOWS: Array<{ terms: string[]; moduleId: string; answer: string }> = [
  { terms: ['receive goods', 'goods receiving', 'delivery arrived', 'received stock', 'grn', 'inbound'], moduleId: 'inbound-jobs', answer: 'Open Receive Goods, record the delivery and supplier documents, then complete identification, inspection and any required testing steps in order. Approved items are costed, quality-approved, put away and finally released into sellable inventory.' },
  { terms: ['purchase order', 'order from supplier', 'buy stock', 'reorder stock'], moduleId: 'purchase-orders', answer: 'Use Purchase Orders to select a supplier, add the required products and quantities, approve the order and track delivery. When it arrives, continue in Receive Goods so the inspection and inventory trail is recorded.' },
  { terms: ['add product', 'edit product', 'delete product', 'product image', 'barcode label', 'catalogue'], moduleId: 'products', answer: 'Use Products to create or find the item. The product form manages its description, pricing, images and catalogue details; the row actions provide editing, deletion and barcode-label printing where your role permits it.' },
  { terms: ['stock count', 'stocktake', 'inventory count', 'wrong stock'], moduleId: 'inventory', answer: 'Open Inventory and choose Stocktake. Create a count session, record the physical quantities, investigate variances and approve the adjustment so the audit history remains complete.' },
  { terms: ['low stock', 'stock level', 'inventory level', 'serial number'], moduleId: 'inventory', answer: 'Open Inventory to review stock levels and alerts. For individually tracked hardware, use Stock Units to search serial numbers, condition and location.' },
  { terms: ['make sale', 'cash sale', 'pos', 'cash register', 'checkout customer'], moduleId: 'pos', answer: 'Open POS, add products to the receipt cart, select or add the customer when required, choose the payment method and complete the charge. The system records the order, payment, receipt and stock reduction together.' },
  { terms: ['return', 'refund', 'exchange'], moduleId: 'returns', answer: 'Open Returns to find the original sale, verify the item and return reason, then approve the correct refund or resolution. Serialized hardware should be checked before it is returned to available stock.' },
  { terms: ['invoice', 'tax invoice', 'customer bill'], moduleId: 'invoices', answer: 'Open Invoicing to create an invoice from an existing order or build a custom invoice. Confirm customer and line details, save it, then print or issue it and track payment status.' },
  { terms: ['add staff', 'add a staff', 'staff user', 'staff password', 'user permission', 'employee login', 'suspend user'], moduleId: 'users', answer: 'Open Staff Accounts to create the login and password, then grant only modules already available to this tenant. User limits and the protected tenant-owner account are enforced automatically.' },
  { terms: ['customer', 'crm', 'buyer history'], moduleId: 'customers', answer: 'Open Customers to search profiles, contact information, order history and account value. Business credit customers can also be managed under Wholesale & Business Accounts.' },
  { terms: ['report', 'sales report', 'inventory report', 'business performance'], moduleId: 'reports', answer: 'Open ERP Reports, select the report family and date range, apply filters, then view or export the result. Business Reports provides forecasts and higher-level trends.' },
  { terms: ['repair', 'warranty job', 'service job'], moduleId: 'repairs', answer: 'Open Repairs to create or find the job, then record intake, diagnosis, parts, labour and progress until completion and customer collection.' },
  { terms: ['warehouse', 'bin', 'pick', 'pack', 'put away'], moduleId: 'wms', answer: 'Open Warehouses and Stock to manage zones, stock locations, put-away, picking, packing and cycle counts. Use Warehouses for the physical location definitions.' },
  { terms: ['settings', 'store setting', 'storefront setting', 'custom domain'], moduleId: 'settings', answer: 'Open Settings to manage tenant and store configuration. Storefront and custom-domain controls only appear when the storefront feature is permitted.' },
];

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

export function answerAdminQuestion(question: string, modules: AssistantModule[], currentModuleId?: string): AssistantAnswer {
  const query = normalize(question);
  if (!query) return { text: 'Ask me how to complete a task, or tell me which page you want to open.', confidence: 'low' };
  const allowed = new Map(modules.map(module => [module.id, module]));

  if (/^(help|what can i do|how do i use this|explain this page)/.test(query) && currentModuleId) {
    const current = allowed.get(currentModuleId);
    if (current) return { text: `${current.summary} ${current.action}`, moduleId: current.id, moduleLabel: current.label, confidence: 'high' };
  }

  const workflow = WORKFLOWS
    .map(item => ({ item, score: item.terms.reduce((score, term) => score + (query.includes(term) ? term.split(' ').length + 2 : 0), 0) }))
    .sort((a, b) => b.score - a.score)[0];
  if (workflow?.score > 0) {
    const destination = allowed.get(workflow.item.moduleId);
    if (!destination) return { text: `${workflow.item.answer} That destination is not available with your current tenant or staff permissions, so I cannot open it for you.`, confidence: 'medium' };
    return { text: workflow.item.answer, moduleId: destination.id, moduleLabel: destination.label, confidence: 'high' };
  }

  const words = query.split(' ').filter(word => word.length > 2);
  const ranked = modules.map(module => {
    const haystack = normalize(`${module.label} ${module.group} ${module.summary} ${module.action} ${(module.keywords || []).join(' ')}`);
    return { module, score: words.reduce((score, word) => score + (haystack.includes(word) ? 1 : 0), 0) + (query.includes(normalize(module.label)) ? 4 : 0) };
  }).sort((a, b) => b.score - a.score);
  if (ranked[0]?.score > 0) {
    const match = ranked[0].module;
    return { text: `${match.summary} ${match.action}`, moduleId: match.id, moduleLabel: match.label, confidence: ranked[0].score > 2 ? 'high' : 'medium' };
  }

  return { text: 'I could not match that question to an available module. Try describing the result you want, such as “receive a delivery”, “create an invoice”, “count stock” or “add a staff user”.', confidence: 'low' };
}

export const ASSISTANT_SUGGESTIONS = ['How do I receive goods?', 'How do I add a product?', 'How do I create an invoice?', 'Where do I add staff?'];
