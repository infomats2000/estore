import React, { useState } from 'react';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Clock, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  Printer, 
  FileText, 
  ShieldCheck, 
  Sparkles,
  UserCheck,
  UserX,
  Trash2,
  Edit3,
  Download,
  X,
  Check
} from 'lucide-react';
import { StaffMember, PayrollRun, LeaveRequest, TimesheetEntry, Order } from '../../types';
import { useAdminInteractions } from '../../context/AdminInteractionContext';
import { 
  INITIAL_STAFF_MEMBERS, 
  calculatePAYGWithholding, 
  calculateSuperannuation, 
  calculateStaffWorkedHours,
  calculateStaffCommission,
  generatePaySlipHTML 
} from '../../utils/payrollEngine';

interface HRStaffPayrollManagerProps {
  orders: Order[];
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function HRStaffPayrollManager({ orders = [], onShowAlert }: HRStaffPayrollManagerProps) {
  const interactions = useAdminInteractions();
  const [activeTab, setActiveTab] = useState<'directory' | 'payroll' | 'leave' | 'timesheets' | 'commission' | 'performance'>('payroll');
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF_MEMBERS);

  // Pay Runs State
  const [payRuns, setPayRuns] = useState<PayrollRun[]>([
    {
      id: 'PAY-2026-W31',
      payPeriodStart: '2026-07-28',
      payPeriodEnd: '2026-08-03',
      payDate: '2026-08-04',
      status: 'Paid',
      totalGross: 5680.00,
      totalPAYG: 1140.00,
      totalSuper: 653.20,
      totalNet: 4540.00,
      lineItems: [
        { staffId: 'EMP-1001', staffName: 'John Smith', hoursWorked: 38, grossPay: 1461.00, paygTax: 295.00, superannuation: 168.02, commission: 150.00, netPay: 1166.00 },
        { staffId: 'EMP-1002', staffName: 'Sarah Jones', hoursWorked: 38, grossPay: 1444.00, paygTax: 290.00, superannuation: 166.06, commission: 0.00, netPay: 1154.00 },
        { staffId: 'EMP-1003', staffName: 'Mike Brown', hoursWorked: 38, grossPay: 1140.00, paygTax: 185.00, superannuation: 131.10, commission: 0.00, netPay: 955.00 },
        { staffId: 'EMP-1004', staffName: 'Lisa Chen', hoursWorked: 38, grossPay: 1635.00, paygTax: 370.00, superannuation: 188.02, commission: 125.00, netPay: 1265.00 }
      ]
    }
  ]);

  // Leave Requests State
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    {
      id: 'LR-101',
      staffId: 'EMP-1001',
      staffName: 'John Smith',
      leaveType: 'Annual',
      startDate: '2026-08-15',
      endDate: '2026-08-18',
      totalDays: 2,
      status: 'Pending',
      reason: 'Family Holiday'
    },
    {
      id: 'LR-102',
      staffId: 'EMP-1002',
      staffName: 'Sarah Jones',
      leaveType: 'Sick',
      startDate: '2026-07-20',
      endDate: '2026-07-20',
      totalDays: 1,
      status: 'Approved',
      reason: 'Medical Appointment'
    }
  ]);

  // Timesheets State
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([
    { id: 'TS-001', staffId: 'EMP-1001', staffName: 'John Smith', date: '2026-08-04', clockIn: '08:30', clockOut: '17:00', breakMinutes: 30, totalHours: 8.0, approved: true },
    { id: 'TS-002', staffId: 'EMP-1002', staffName: 'Sarah Jones', date: '2026-08-04', clockIn: '08:30', clockOut: '17:00', breakMinutes: 30, totalHours: 8.0, approved: true },
    { id: 'TS-003', staffId: 'EMP-1003', staffName: 'Mike Brown', date: '2026-08-05', clockIn: '09:00', clockOut: '17:30', breakMinutes: 30, totalHours: 8.0, approved: false }
  ]);

  // Modal / Form state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffFormData, setStaffFormData] = useState<Partial<StaffMember>>({});

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({
    staffId: '',
    leaveType: 'Annual' as 'Annual' | 'Sick' | 'Unpaid' | 'Maternity',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    totalDays: 1,
    reason: ''
  });

  const [showTimesheetModal, setShowTimesheetModal] = useState(false);
  const [timesheetFormData, setTimesheetFormData] = useState({
    staffId: '',
    date: new Date().toISOString().split('T')[0],
    clockIn: '08:30',
    clockOut: '17:00',
    breakMinutes: 30
  });

  // Dynamic Pay Run Calculation using actual Approved Timesheets & Completed Sales Orders
  const handleRunPayroll = () => {
    if (staffList.length === 0) {
      onShowAlert?.('No employees in HR directory to run payroll for.', 'error');
      return;
    }

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const lineItems = staffList.map(emp => {
      // 1. Calculate actual worked hours from approved timesheets
      const hoursWorked = calculateStaffWorkedHours(emp.id, timesheets, startDate, endDate);
      
      // 2. Calculate actual sales commission from completed sales orders
      const commission = calculateStaffCommission(emp, orders, startDate, endDate);

      // 3. Gross pay calculation
      const baseGross = hoursWorked * emp.baseHourlyRate;
      const grossPay = baseGross + commission;

      // 4. ATO PAYG withholding tax calculation
      const paygTax = calculatePAYGWithholding(grossPay);

      // 5. Superannuation Guarantee calculation (11.5%)
      const superannuation = calculateSuperannuation(grossPay, emp.superRatePercent || 11.5);

      // 6. Net Take-Home Pay
      const netPay = Math.max(grossPay - paygTax, 0);

      return {
        staffId: emp.id,
        staffName: emp.name,
        hoursWorked,
        grossPay,
        paygTax,
        superannuation,
        commission,
        netPay
      };
    });

    const totalGross = lineItems.reduce((s, i) => s + i.grossPay, 0);
    const totalPAYG = lineItems.reduce((s, i) => s + i.paygTax, 0);
    const totalSuper = lineItems.reduce((s, i) => s + i.superannuation, 0);
    const totalNet = lineItems.reduce((s, i) => s + i.netPay, 0);

    const newPayRun: PayrollRun = {
      id: 'PAY-2026-W' + (payRuns.length + 32),
      payPeriodStart: startDate,
      payPeriodEnd: endDate,
      payDate: new Date().toISOString().split('T')[0],
      status: 'Paid',
      totalGross,
      totalPAYG,
      totalSuper,
      totalNet,
      lineItems
    };

    setPayRuns(prev => [newPayRun, ...prev]);
    onShowAlert?.(`Pay Run ${newPayRun.id} generated! $${totalNet.toLocaleString('en-AU', { minimumFractionDigits: 2 })} Net Pay disbursed across ${staffList.length} staff.`, 'success');
  };

  const handlePrintPaySlip = (staff: StaffMember, line: PayrollRun['lineItems'][0]) => {
    const html = generatePaySlipHTML(staff, line, `${payRuns[0]?.payPeriodStart || '2026-07-28'} to ${payRuns[0]?.payPeriodEnd || '2026-08-03'}`);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const handleExportPayRunCSV = (run: PayrollRun) => {
    const headers = ['Staff ID', 'Employee Name', 'Hours Worked', 'Gross Pay ($)', 'PAYG Tax ($)', 'Superannuation ($)', 'Commission ($)', 'Net Pay ($)'];
    const rows = run.lineItems.map(item => [
      `"${item.staffId}"`,
      `"${item.staffName}"`,
      item.hoursWorked,
      item.grossPay.toFixed(2),
      item.paygTax.toFixed(2),
      item.superannuation.toFixed(2),
      item.commission.toFixed(2),
      item.netPay.toFixed(2)
    ]);

    const csvStr = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pay_run_${run.id}_disbursement.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowAlert?.(`Exported Pay Run ${run.id} disbursement CSV file.`, 'info');
  };

  const handleDeletePayRun = async (id: string) => {
    if (!(await interactions.confirm({ title: 'Delete Pay Run?', message: `Pay Run ${id} will be permanently removed.`, confirmLabel: 'Delete Pay Run', destructive: true }))) return;
    setPayRuns(prev => prev.filter(p => p.id !== id));
    onShowAlert?.(`Pay Run ${id} removed.`, 'info');
  };

  // Staff Member Add/Edit Handlers
  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    setStaffFormData({
      role: 'Sales Executive',
      department: 'Sales',
      employmentType: 'Full-Time',
      baseHourlyRate: 34.50,
      annualSalary: 68000,
      superRatePercent: 11.5,
      taxFileNumber: '***-***-800',
      bankAccount: 'CBA **** 1000',
      commissionRatePercent: 2.0,
      annualLeaveBalanceHours: 152.0,
      sickLeaveBalanceHours: 76.0,
      performanceScore: 90
    });
    setShowAddStaffModal(true);
  };

  const handleOpenEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setStaffFormData({ ...staff });
    setShowAddStaffModal(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFormData.name?.trim()) {
      onShowAlert?.('Employee name is required.', 'error');
      return;
    }

    if (editingStaff) {
      setStaffList(prev => prev.map(s => s.id === editingStaff.id ? { ...s, ...staffFormData } as StaffMember : s));
      onShowAlert?.(`Updated profile for ${staffFormData.name}.`, 'success');
    } else {
      const newStaff: StaffMember = {
        id: 'EMP-' + String(Date.now()).slice(-4),
        name: staffFormData.name!,
        email: staffFormData.email || `${staffFormData.name!.toLowerCase().replace(/\s+/g, '.')}@techseller.com.au`,
        phone: staffFormData.phone || '0499 000 111',
        role: staffFormData.role || 'Sales Executive',
        department: staffFormData.department || 'Sales',
        employmentType: staffFormData.employmentType || 'Full-Time',
        baseHourlyRate: Number(staffFormData.baseHourlyRate) || 32.00,
        annualSalary: Number(staffFormData.annualSalary) || (Number(staffFormData.baseHourlyRate) || 32) * 38 * 52,
        superRatePercent: Number(staffFormData.superRatePercent) || 11.5,
        taxFileNumber: staffFormData.taxFileNumber || '***-***-100',
        bankAccount: staffFormData.bankAccount || 'CBA **** 9900',
        commissionRatePercent: Number(staffFormData.commissionRatePercent) || 0,
        annualLeaveBalanceHours: Number(staffFormData.annualLeaveBalanceHours) || 152,
        sickLeaveBalanceHours: Number(staffFormData.sickLeaveBalanceHours) || 76,
        performanceScore: Number(staffFormData.performanceScore) || 90,
        startDate: staffFormData.startDate || new Date().toISOString().split('T')[0]
      };
      setStaffList(prev => [...prev, newStaff]);
      onShowAlert?.(`New employee ${newStaff.name} added to HR directory.`, 'success');
    }
    setShowAddStaffModal(false);
  };

  const handleDeleteStaff = async (id: string) => {
    if (!(await interactions.confirm({ title: 'Remove Employee Record?', message: 'This employee will be removed from the HR directory. This action cannot be undone.', confirmLabel: 'Remove Employee', destructive: true }))) return;
    setStaffList(prev => prev.filter(s => s.id !== id));
    onShowAlert?.('Employee record removed.', 'info');
  };

  // Leave Request Submission Handler
  const handleSaveLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find(s => s.id === leaveFormData.staffId) || staffList[0];
    if (!staff) {
      onShowAlert?.('Please select an employee for the leave request.', 'error');
      return;
    }

    const newReq: LeaveRequest = {
      id: 'LR-' + String(Date.now()).slice(-4),
      staffId: staff.id,
      staffName: staff.name,
      leaveType: leaveFormData.leaveType,
      startDate: leaveFormData.startDate,
      endDate: leaveFormData.endDate,
      totalDays: Number(leaveFormData.totalDays) || 1,
      status: 'Pending',
      reason: leaveFormData.reason || 'Personal / Leave'
    };

    setLeaveRequests(prev => [newReq, ...prev]);
    setShowLeaveModal(false);
    onShowAlert?.(`Leave request submitted for ${staff.name}.`, 'success');
  };

  const handleApproveLeave = (req: LeaveRequest) => {
    setLeaveRequests(prev => prev.map(l => l.id === req.id ? { ...l, status: 'Approved' } : l));
    // Deduct leave balance hours (1 day = 7.6 hours)
    const hoursDeducted = req.totalDays * 7.6;
    setStaffList(prev => prev.map(s => {
      if (s.id !== req.staffId) return s;
      if (req.leaveType === 'Annual') {
        return { ...s, annualLeaveBalanceHours: Math.max(s.annualLeaveBalanceHours - hoursDeducted, 0) };
      } else if (req.leaveType === 'Sick') {
        return { ...s, sickLeaveBalanceHours: Math.max(s.sickLeaveBalanceHours - hoursDeducted, 0) };
      }
      return s;
    }));
    onShowAlert?.(`Leave Request ${req.id} approved! Deducted ${hoursDeducted.toFixed(1)} hrs from leave balance.`, 'success');
  };

  // Timesheet Entry Handler
  const handleSaveTimesheet = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find(s => s.id === timesheetFormData.staffId) || staffList[0];
    if (!staff) {
      onShowAlert?.('Please select an employee for the timesheet entry.', 'error');
      return;
    }

    // Calculate worked hours from clock in/out
    const [inH, inM] = timesheetFormData.clockIn.split(':').map(Number);
    const [outH, outM] = timesheetFormData.clockOut.split(':').map(Number);
    const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM) - Number(timesheetFormData.breakMinutes || 0);
    const totalHours = Math.max(Math.round((totalMinutes / 60) * 10) / 10, 0);

    const newTs: TimesheetEntry = {
      id: 'TS-' + String(Date.now()).slice(-4),
      staffId: staff.id,
      staffName: staff.name,
      date: timesheetFormData.date,
      clockIn: timesheetFormData.clockIn,
      clockOut: timesheetFormData.clockOut,
      breakMinutes: Number(timesheetFormData.breakMinutes) || 0,
      totalHours,
      approved: true
    };

    setTimesheets(prev => [newTs, ...prev]);
    setShowTimesheetModal(false);
    onShowAlert?.(`Logged ${totalHours} worked hours for ${staff.name} on ${newTs.date}.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top HR & Payroll HUD Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ACTIVE HEADCOUNT</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{staffList.length} Employees</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-mono">100% ATO PAYG Compliant</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">LAST PAY RUN NET DISBURSED</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">${payRuns[0]?.totalNet.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Gross: ${payRuns[0]?.totalGross.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ATO PAYG TAX WITHHELD</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">${payRuns[0]?.totalPAYG.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Super (11.5% SG): ${payRuns[0]?.totalSuper.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">LEAVE REQUESTS PENDING</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{leaveRequests.filter(l => l.status === 'Pending').length} Action Required</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-mono">Approved Timesheets: {timesheets.filter(t => t.approved).length}</span>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 shadow-xs">
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'payroll' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Pay Run Processing &amp; Pay Slips
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'directory' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Staff Directory &amp; HR Records
        </button>

        <button
          onClick={() => setActiveTab('leave')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'leave' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" /> Leave Requests &amp; Accruals
        </button>

        <button
          onClick={() => setActiveTab('timesheets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'timesheets' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" /> Attendance &amp; Timesheets
        </button>

        <button
          onClick={() => setActiveTab('commission')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'commission' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Sales Commissions
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'performance' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" /> Performance &amp; Appraisals
        </button>
      </div>

      {/* TAB 1: PAYROLL PROCESSING */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200">Australian ATO Compliant Automated Pay Runs</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Calculates PAYG tax withholding, 11.5% superannuation, sales commissions from orders, and approved timesheet hours.</p>
            </div>
            <button
              onClick={handleRunPayroll}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <DollarSign className="w-4 h-4" /> Execute New Pay Run
            </button>
          </div>

          <div className="space-y-4">
            {payRuns.map(run => (
              <div key={run.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
                <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-mono font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">{run.id}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Period: {run.payPeriodStart} to {run.payPeriodEnd}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleExportPayRunCSV(run)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-500" /> Export ABA / CSV
                    </button>
                    <button
                      onClick={() => handleDeletePayRun(run.id)}
                      className="p-1.5 bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 hover:bg-rose-100 rounded-lg border border-rose-200 dark:border-rose-900 cursor-pointer"
                      title="Delete Pay Run"
                      aria-label="Delete pay run"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Summary Header */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 font-mono text-xs">
                  <div>Gross Earnings: <strong className="text-slate-900 dark:text-slate-100">${run.totalGross.toFixed(2)}</strong></div>
                  <div>PAYG Tax: <strong className="text-rose-600 dark:text-rose-400">-${run.totalPAYG.toFixed(2)}</strong></div>
                  <div>Super (11.5%): <strong className="text-purple-600 dark:text-purple-400">${run.totalSuper.toFixed(2)}</strong></div>
                  <div>Net Disbursed: <strong className="text-emerald-600 dark:text-emerald-400">${run.totalNet.toFixed(2)}</strong></div>
                </div>

                {/* Line Items Table */}
                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] uppercase bg-slate-100 dark:bg-slate-900">
                        <th className="p-3">Staff Name</th>
                        <th className="p-3">Hours</th>
                        <th className="p-3">Gross Pay</th>
                        <th className="p-3">Commission</th>
                        <th className="p-3">PAYG Tax</th>
                        <th className="p-3">Super (11.5%)</th>
                        <th className="p-3">Net Pay</th>
                        <th className="p-3 text-right">Pay Slip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                      {run.lineItems.map(item => {
                        const staff = staffList.find(s => s.id === item.staffId) || staffList[0];
                        return (
                          <tr key={item.staffId} className="hover:bg-slate-100 dark:hover:bg-slate-900/50">
                            <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{item.staffName}</td>
                            <td className="p-3">{item.hoursWorked} hrs</td>
                            <td className="p-3 text-slate-900 dark:text-slate-100">${item.grossPay.toFixed(2)}</td>
                            <td className="p-3 text-blue-600 dark:text-blue-400">${item.commission.toFixed(2)}</td>
                            <td className="p-3 text-rose-600 dark:text-rose-400">-${item.paygTax.toFixed(2)}</td>
                            <td className="p-3 text-purple-600 dark:text-purple-400">${item.superannuation.toFixed(2)}</td>
                            <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">${item.netPay.toFixed(2)}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handlePrintPaySlip(staff, item)}
                                className="px-2.5 py-1 text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer"
                              >
                                Print Slip
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: STAFF DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200">Staff Employee Profiles &amp; Employment Terms</h3>
            <button
              onClick={handleOpenAddStaff}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffList.map(emp => (
              <div key={emp.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-700 rounded border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">{emp.role}</span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">{emp.name}</h4>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{emp.email} &bull; {emp.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditStaff(emp)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 border border-slate-200 dark:border-slate-700 cursor-pointer"
                      title="Edit Staff Member"
                      aria-label="Edit staff member"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(emp.id)}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 cursor-pointer"
                      title="Remove Staff Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 font-mono text-xs grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                  <div>Hourly Rate: <strong className="text-slate-900 dark:text-slate-200">${emp.baseHourlyRate.toFixed(2)}/hr</strong></div>
                  <div>Salary: <strong className="text-emerald-600 dark:text-emerald-400">${(emp.annualSalary || 0).toLocaleString()}</strong></div>
                  <div>Annual Leave: <strong className="text-emerald-600 dark:text-emerald-400">{emp.annualLeaveBalanceHours} hrs</strong></div>
                  <div>Sick Leave: <strong className="text-purple-600 dark:text-purple-400">{emp.sickLeaveBalanceHours} hrs</strong></div>
                  <div>TFN: <strong className="text-slate-700 dark:text-slate-300">{emp.taxFileNumber}</strong></div>
                  <div>Bank Account: <strong className="text-slate-700 dark:text-slate-300">{emp.bankAccount}</strong></div>
                  <div>Super Rate: <strong className="text-purple-600 dark:text-purple-400">{emp.superRatePercent}% SG</strong></div>
                  <div>Commission: <strong className="text-blue-600 dark:text-blue-300">{emp.commissionRatePercent}%</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LEAVE MANAGEMENT */}
      {activeTab === 'leave' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200">Staff Leave Requests &amp; Accrual Balances</h3>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Request Leave
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 shadow-xs">
            {leaveRequests.map(req => (
              <div key={req.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">{req.leaveType} Leave</span>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-200">{req.staffName}</h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 block">Dates: {req.startDate} to {req.endDate} ({req.totalDays} Days) &bull; "{req.reason}"</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border ${
                    req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
                  }`}>
                    {req.status}
                  </span>

                  {req.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveLeave(req)}
                        className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setLeaveRequests(prev => prev.map(l => l.id === req.id ? { ...l, status: 'Rejected' } : l));
                          onShowAlert?.(`Leave Request ${req.id} Rejected.`, 'info');
                        }}
                        className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TIMESHEETS */}
      {activeTab === 'timesheets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200">Attendance Clock-In Logs &amp; Weekly Timesheets</h3>
            <button
              onClick={() => setShowTimesheetModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Timesheet Entry
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 font-mono text-xs shadow-xs">
            {timesheets.map(ts => (
              <div key={ts.id} className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{ts.staffName} &bull; {ts.date}</h4>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Clock-in: {ts.clockIn} | Clock-out: {ts.clockOut} (Break: {ts.breakMinutes}m)</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{ts.totalHours} Worked Hours</span>
                  <button
                    onClick={() => {
                      setTimesheets(prev => prev.map(t => t.id === ts.id ? { ...t, approved: !t.approved } : t));
                      onShowAlert?.('Timesheet approval updated.', 'success');
                    }}
                    className={`px-3 py-1.5 font-bold rounded-xl border cursor-pointer ${
                      ts.approved ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' : 'bg-amber-600 text-white border-amber-500'
                    }`}
                  >
                    {ts.approved ? '✓ Approved' : 'Approve Timesheet'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5 & 6: COMMISSIONS & PERFORMANCE */}
      {(activeTab === 'commission' || activeTab === 'performance') && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100">Staff Sales Commissions &amp; Performance Scorecards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffList.map(emp => (
              <div key={emp.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{emp.name} ({emp.role})</span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{emp.performanceScore} / 100 KPI</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Commission Rate: {emp.commissionRatePercent}% &bull; Dept: {emp.department}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal Sub-Overlay */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-slate-900 dark:text-white shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm uppercase text-slate-900 dark:text-slate-100">
                {editingStaff ? `Edit Employee Profile - ${editingStaff.name}` : 'Add Employee to HR Directory'}
              </h3>
              <button type="button" onClick={() => setShowAddStaffModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3 text-xs overflow-y-auto max-h-[500px] pr-1">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={staffFormData.name || ''}
                  onChange={e => setStaffFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Role</label>
                  <select
                    value={staffFormData.role || 'Sales Executive'}
                    onChange={e => setStaffFormData(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-slate-900 dark:text-slate-200"
                  >
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Technician">Technician</option>
                    <option value="Warehouse Staff">Warehouse Staff</option>
                    <option value="Store Manager">Store Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Employment Type</label>
                  <select
                    value={staffFormData.employmentType || 'Full-Time'}
                    onChange={e => setStaffFormData(prev => ({ ...prev, employmentType: e.target.value as any }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-slate-900 dark:text-slate-200"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Casual">Casual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Base Hourly Rate ($/hr)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={staffFormData.baseHourlyRate || ''}
                    onChange={e => setStaffFormData(prev => ({ ...prev, baseHourlyRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-emerald-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={staffFormData.commissionRatePercent ?? ''}
                    onChange={e => setStaffFormData(prev => ({ ...prev, commissionRatePercent: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-blue-600 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Tax File Number (TFN)</label>
                  <input
                    type="text"
                    value={staffFormData.taxFileNumber || ''}
                    onChange={e => setStaffFormData(prev => ({ ...prev, taxFileNumber: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Bank Account</label>
                  <input
                    type="text"
                    value={staffFormData.bankAccount || ''}
                    onChange={e => setStaffFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase shadow-lg shadow-blue-600/20"
                >
                  Save Employee Profile
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-slate-900 dark:text-white shadow-2xl">
            <h3 className="font-black text-sm uppercase border-b border-slate-200 dark:border-slate-800 pb-3">Submit Staff Leave Request</h3>

            <form onSubmit={handleSaveLeaveRequest} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Select Employee *</label>
                <select
                  required
                  value={leaveFormData.staffId}
                  onChange={e => setLeaveFormData(prev => ({ ...prev, staffId: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl"
                >
                  <option value="">-- Choose Employee --</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Leave Type</label>
                <select
                  value={leaveFormData.leaveType}
                  onChange={e => setLeaveFormData(prev => ({ ...prev, leaveType: e.target.value as any }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl"
                >
                  <option value="Annual">Annual Leave</option>
                  <option value="Sick">Sick / Personal Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                  <option value="Maternity">Maternity / Parental</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveFormData.startDate}
                    onChange={e => setLeaveFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveFormData.endDate}
                    onChange={e => setLeaveFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Total Days</label>
                <input
                  type="number"
                  min="1"
                  value={leaveFormData.totalDays}
                  onChange={e => setLeaveFormData(prev => ({ ...prev, totalDays: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="Reason for leave"
                  value={leaveFormData.reason}
                  onChange={e => setLeaveFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase shadow-lg shadow-blue-600/20"
                >
                  Submit Leave Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Timesheet Entry Modal */}
      {showTimesheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-slate-900 dark:text-white shadow-2xl">
            <h3 className="font-black text-sm uppercase border-b border-slate-200 dark:border-slate-800 pb-3">Log Timesheet Attendance Entry</h3>

            <form onSubmit={handleSaveTimesheet} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Select Employee *</label>
                <select
                  required
                  value={timesheetFormData.staffId}
                  onChange={e => setTimesheetFormData(prev => ({ ...prev, staffId: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl"
                >
                  <option value="">-- Choose Employee --</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={timesheetFormData.date}
                  onChange={e => setTimesheetFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Clock In Time</label>
                  <input
                    type="time"
                    required
                    value={timesheetFormData.clockIn}
                    onChange={e => setTimesheetFormData(prev => ({ ...prev, clockIn: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Clock Out Time</label>
                  <input
                    type="time"
                    required
                    value={timesheetFormData.clockOut}
                    onChange={e => setTimesheetFormData(prev => ({ ...prev, clockOut: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Unpaid Break (Minutes)</label>
                <input
                  type="number"
                  value={timesheetFormData.breakMinutes}
                  onChange={e => setTimesheetFormData(prev => ({ ...prev, breakMinutes: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl font-mono"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase shadow-lg shadow-blue-600/20"
                >
                  Save Timesheet Entry
                </button>
                <button
                  type="button"
                  onClick={() => setShowTimesheetModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
