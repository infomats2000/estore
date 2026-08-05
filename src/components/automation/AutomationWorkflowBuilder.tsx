import React, { useState } from 'react';
import { 
  Zap, 
  Play, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Sliders, 
  Mail, 
  Truck, 
  DollarSign, 
  Wrench, 
  Package, 
  ShieldCheck,
  RefreshCw,
  Power,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { AutomationRule, AutomationExecutionLog, WorkflowTriggerType, WorkflowActionType } from '../../types';
import { DEFAULT_AUTOMATION_RULES, INITIAL_AUTOMATION_LOGS } from '../../utils/automationEngine';

interface AutomationWorkflowBuilderProps {
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function AutomationWorkflowBuilder({ onShowAlert }: AutomationWorkflowBuilderProps) {
  const [activeTab, setActiveTab] = useState<'canvas' | 'logs' | 'recipes'>('canvas');
  const [rules, setRules] = useState<AutomationRule[]>(DEFAULT_AUTOMATION_RULES);
  const [logs, setLogs] = useState<AutomationExecutionLog[]>(INITIAL_AUTOMATION_LOGS);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(DEFAULT_AUTOMATION_RULES[0]);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newTrigger, setNewTrigger] = useState<WorkflowTriggerType>('STOCK_MINIMUM');
  const [newThreshold, setNewThreshold] = useState('5');
  const [newAction, setNewAction] = useState<WorkflowActionType>('CREATE_PO_DRAFT');

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => {
      if (r.id === ruleId) {
        const updated = !r.active;
        onShowAlert?.(`Workflow "${r.name}" ${updated ? 'activated' : 'paused'}.`, updated ? 'success' : 'info');
        return { ...r, active: updated };
      }
      return r;
    }));
  };

  const handleTestTriggerRule = (rule: AutomationRule) => {
    const newLog: AutomationExecutionLog = {
      id: 'LOG-' + Math.floor(Math.random() * 90000 + 10000),
      ruleId: rule.id,
      ruleName: rule.name,
      triggeredAt: new Date().toISOString(),
      status: rule.action === 'REQUIRE_MANAGER_APPROVAL' ? 'Pending Approval' : 'Success',
      payloadSummary: `Test Trigger Executed for ${rule.name}. Action ${rule.action} completed successfully.`
    };

    setLogs(prev => [newLog, ...prev]);
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, executionCount: r.executionCount + 1, lastTriggeredAt: new Date().toISOString() } : r));
    onShowAlert?.(`Test Trigger Fired: ${rule.name}`, 'success');
  };

  const handleCreateWorkflow = () => {
    if (!newRuleName.trim()) {
      onShowAlert?.('Workflow rule name is required.', 'error');
      return;
    }

    const rule: AutomationRule = {
      id: 'RULE-' + Math.floor(Math.random() * 9000 + 1000),
      name: newRuleName,
      trigger: newTrigger,
      triggerThreshold: parseInt(newThreshold, 10) || 5,
      action: newAction,
      active: true,
      executionCount: 0,
      description: `Custom visual workflow executing ${newAction} when ${newTrigger} conditions are met.`
    };

    setRules(prev => [rule, ...prev]);
    setSelectedRule(rule);
    setShowAddModal(false);
    setNewRuleName('');
    onShowAlert?.(`Visual Workflow "${rule.name}" created and deployed!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ACTIVE WORKFLOW RULES</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{rules.filter(r => r.active).length} Rules Active</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-mono">100% Real-Time Trigger Coverage</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">TOTAL AUTOMATED EXECUTIONS</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {rules.reduce((acc, r) => acc + r.executionCount, 0)} Fired
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-mono">Zero Manual Intervention Needed</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">SYSTEM RESPONSE TIME</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">&lt; 150ms</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-mono">Instant Event Dispatch</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">EXECUTION HEALTH SCORE</span>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>99.9% Success Rate</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-mono">Automated Exception Recovery</span>
        </div>
      </div>

      {/* Toolbar & Tabs */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'canvas' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" /> Visual Workflow Canvas ({rules.length})
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'logs' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" /> Trigger Audit Logs ({logs.length})
          </button>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Build Visual Workflow
        </button>
      </div>

      {/* TAB 1: VISUAL CANVAS */}
      {activeTab === 'canvas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Rules List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Deployed Workflows</h3>
            <div className="space-y-3">
              {rules.map(rule => (
                <div
                  key={rule.id}
                  onClick={() => setSelectedRule(rule)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer shadow-xs ${
                    selectedRule?.id === rule.id 
                      ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-md ring-2 ring-blue-500/20' 
                      : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">{rule.id}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleRule(rule.id); }}
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                        rule.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {rule.active ? 'Active' : 'Paused'}
                    </button>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2">{rule.name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{rule.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right 2-Cols: Interactive Visual Node Flow Canvas */}
          <div className="lg:col-span-2 space-y-4">
            {selectedRule ? (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      VISUAL WORKFLOW NODE DIAGRAM
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">{selectedRule.name}</h3>
                  </div>

                  <button
                    onClick={() => handleTestTriggerRule(selectedRule)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" /> Test Firing Trigger
                  </button>
                </div>

                {/* 3-Node Visual Flow Diagram */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center relative font-mono text-xs">
                  {/* Node 1: Trigger */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-amber-300 dark:border-amber-500/40 space-y-2 shadow-xs">
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800 block w-fit">
                      1. TRIGGER NODE
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{selectedRule.trigger}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Fires when {selectedRule.trigger} event is emitted.</p>
                  </div>

                  {/* Node 2: Condition / Threshold */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-blue-300 dark:border-blue-500/40 space-y-2 shadow-xs">
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 block w-fit">
                      2. CONDITION EVALUATOR
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {selectedRule.triggerThreshold ? `Threshold >= ${selectedRule.triggerThreshold}` : 'Always True'}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Evaluates rules against event payload context.</p>
                  </div>

                  {/* Node 3: Automated Action */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-emerald-300 dark:border-emerald-500/40 space-y-2 shadow-xs">
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800 block w-fit">
                      3. ACTION NODE
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{selectedRule.action}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Automated ERP action dispatch.</p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono text-xs space-y-1">
                  <div>Rule Status: <strong className="text-emerald-600 dark:text-emerald-400">{selectedRule.active ? 'Active & Monitoring' : 'Paused'}</strong></div>
                  <div>Total Executions: <strong className="text-blue-600 dark:text-blue-300">{selectedRule.executionCount} Times Fired</strong></div>
                  <div>Last Execution: <strong className="text-slate-800 dark:text-slate-200">{selectedRule.lastTriggeredAt || 'Never'}</strong></div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 text-slate-500 dark:text-slate-400 shadow-xs">
                <Layers className="w-10 h-10 mx-auto text-blue-600 dark:text-blue-400 opacity-60" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-200">Select a Workflow Rule</h4>
                <p className="text-xs max-w-sm mx-auto">Select a workflow from the left panel to inspect its visual node flow diagram, condition thresholds, and automated action nodes.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRIGGER AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] uppercase bg-slate-100 dark:bg-slate-900">
                <th className="p-3">Log ID</th>
                <th className="p-3">Rule Name</th>
                <th className="p-3">Triggered At</th>
                <th className="p-3">Status</th>
                <th className="p-3">Execution Payload Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-100 dark:hover:bg-slate-900/50">
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold rounded border border-blue-200 dark:border-blue-800 text-[10px]">{log.id}</span>
                  </td>
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{log.ruleName}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">{new Date(log.triggeredAt).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 font-bold rounded text-[10px] border ${
                      log.status === 'Success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">{log.payloadSummary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Workflow Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-slate-900 dark:text-white shadow-2xl">
            <h3 className="font-black text-sm uppercase text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3">Build Visual Workflow Rule</h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold block mb-1">Workflow Name</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Order Priority Dispatch"
                  value={newRuleName}
                  onChange={e => setNewRuleName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold block mb-1">Trigger Event</label>
                <select
                  value={newTrigger}
                  onChange={e => setNewTrigger(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-slate-900 dark:text-slate-200"
                >
                  <option value="STOCK_MINIMUM">Stock Reaches Minimum</option>
                  <option value="HIGH_VALUE_SALE">High-Value Sale Order</option>
                  <option value="WARRANTY_EXPIRING">Warranty Expires in 30 Days</option>
                  <option value="NEW_ONLINE_ORDER">New E-Commerce / Online Order</option>
                  <option value="REPAIR_COMPLETED">Workshop Repair Completed</option>
                  <option value="SHIPMENT_RECEIVED">Supplier GRN Shipment Received</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold block mb-1">Condition Threshold</label>
                <input
                  type="number"
                  placeholder="e.g. 5000 for $5k or 5 for stock"
                  value={newThreshold}
                  onChange={e => setNewThreshold(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold block mb-1">Automated ERP Action</label>
                <select
                  value={newAction}
                  onChange={e => setNewAction(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-slate-900 dark:text-slate-200"
                >
                  <option value="CREATE_PO_DRAFT">Create Purchase Order Draft</option>
                  <option value="REQUIRE_MANAGER_APPROVAL">Require Manager Approval Flag</option>
                  <option value="NOTIFY_CUSTOMER_EMAIL">Notify Customer via Email &amp; SMS</option>
                  <option value="ALLOCATE_STOCK_WAREHOUSE">Allocate Warehouse Stock</option>
                  <option value="GENERATE_INVOICE_SMS">Generate Tax Invoice &amp; Send SMS</option>
                  <option value="NOTIFY_SALES_TEAM">Notify Sales &amp; B2B Team</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={handleCreateWorkflow}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase shadow-lg shadow-blue-600/20"
              >
                Deploy Visual Workflow
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
