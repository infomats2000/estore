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
  X
} from 'lucide-react';
import { StaffMember, PayrollRun, LeaveRequest, TimesheetEntry, Order } from '../../types';
import { INITIAL_STAFF_MEMBERS, calculatePAYGWithholding, calculateSuperannuation, generatePaySlipHTML } from '../../utils/payrollEngine';

interface HRStaffPayrollManagerProps {
  orders: Order[];
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function HRStaffPayrollManager({ orders, onShowAlert }: HRStaffPayrollManagerProps) {
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
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Sales Executive' | 'Technician' | 'Warehouse Staff' | 'Store Manager'>('Sales Executive');
  const [newStaffRate, setNewStaffRate] = useState('32.00');

  const handleRunPayroll = () => {
    const lineItems = staffList.map(emp => {
      const hoursWorked = 38;
      const baseGross = hoursWorked * emp.baseHourlyRate;
      const commission = (emp.role === 'Sales Executive' || emp.role === 'Store Manager') ? 150 : 0;
      const grossPay = baseGross + commission;
      const paygTax = calculatePAYGWithholding(grossPay);
      const superannuation = calculateSuperannuation(grossPay, emp.superRatePercent);
      const netPay = grossPay - paygTax;

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
      payPeriodStart: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
      payPeriodEnd: new Date().toISOString().split('T')[0],
      payDate: new Date().toISOString().split('T')[0],
      status: 'Paid',
      totalGross,
      totalPAYG,
      totalSuper,
      totalNet,
      lineItems
    };

    setPayRuns(prev => [newPayRun, ...prev]);
    onShowAlert?.(`Pay Run ${newPayRun.id} executed successfully! Distributed $${totalNet.toFixed(2)} Net Pay.`, 'success');
  };

  const handlePrintPaySlip = (staff: StaffMember, line: PayrollRun['lineItems'][0]) => {
    const html = generatePaySlipHTML(staff, line, 'Current Pay Period');
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const handleAddStaff = () => {
    if (!newStaffName.trim()) {
      onShowAlert?.('Staff name is required.', 'error');
      return;
    }

    const emp: StaffMember = {
      id: 'EMP-' + String(Date.now()).slice(-4),
      name: newStaffName,
      email: `${newStaffName.toLowerCase().replace(/\s+/g, '.')}@techseller.com.au`,
      phone: '0499 000 111',
      role: newStaffRole,
      department: newStaffRole === 'Technician' ? 'Service' : newStaffRole === 'Warehouse Staff' ? 'Fulfillment' : 'Sales',
      employmentType: 'Full-Time',
      baseHourlyRate: parseFloat(newStaffRate) || 32.00,
      annualSalary: (parseFloat(newStaffRate) || 32.00) * 38 * 52,
      superRatePercent: 11.5,
      taxFileNumber: '***-***-100',
      bankAccount: 'CBA **** 9900',
      commissionRatePercent: 2.0,
      annualLeaveBalanceHours: 152.0,
      sickLeaveBalanceHours: 76.0,
      performanceScore: 90,
      startDate: new Date().toISOString().split('T')[0]
    };

    setStaffList(prev => [...prev, emp]);
    setShowAddStaffModal(false);
    setNewStaffName('');
    onShowAlert?.(`New employee ${emp.name} added to HR directory.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top HR & Payroll HUD Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ACTIVE EMPLOYEES</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{staffList.length} Headcount</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-mono">100% Australian TFN Compliant</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">LAST PAY RUN NET DISBURSED</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">${payRuns[0]?.totalNet.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Gross: ${payRuns[0]?.totalGross.toLocaleString('en-AU')}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ATO PAYG TAX WITHHELD</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">${payRuns[0]?.totalPAYG.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Super (11.5%): ${payRuns[0]?.totalSuper.toLocaleString('en-AU')}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">LEAVE REQUESTS PENDING</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{leaveRequests.filter(l => l.status === 'Pending').length} Action Required</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-mono">Avg Team Score: 93 / 100</span>
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200">Australian ATO Compliant Pay Runs</h3>
            <button
              onClick={handleRunPayroll}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" /> Execute New Pay Run
            </button>
          </div>

          <div className="space-y-4">
            {payRuns.map(run => (
              <div key={run.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-mono font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">{run.id}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Period: {run.payPeriodStart} to {run.payPeriodEnd}</span>
                  </div>
                  <div className="font-mono text-xs text-slate-600 dark:text-slate-400">
                    Disbursed Net Pay: <strong className="text-emerald-600 dark:text-emerald-400">${run.totalNet.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] uppercase bg-slate-100 dark:bg-slate-900">
                        <th className="p-3">Staff Name</th>
                        <th className="p-3">Hours</th>
                        <th className="p-3">Gross Pay</th>
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
                            <td className="p-3 text-rose-600 dark:text-rose-400">-${item.paygTax.toFixed(2)}</td>
                            <td className="p-3 text-purple-600 dark:text-purple-400">${item.superannuation.toFixed(2)}</td>
                            <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">${item.netPay.toFixed(2)}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handlePrintPaySlip(staff, item)}
                                className="px-2.5 py-1 text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900"
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
              onClick={() => setShowAddStaffModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2"
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
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">Score: {emp.performanceScore}/100</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 font-mono text-xs grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                  <div>Base Rate: <strong className="text-slate-900 dark:text-slate-200">${emp.baseHourlyRate.toFixed(2)}/hr</strong></div>
                  <div>Type: <strong className="text-blue-600 dark:text-blue-300">{emp.employmentType}</strong></div>
                  <div>Annual Leave: <strong className="text-emerald-600 dark:text-emerald-400">{emp.annualLeaveBalanceHours} hrs</strong></div>
                  <div>Sick Leave: <strong className="text-purple-600 dark:text-purple-400">{emp.sickLeaveBalanceHours} hrs</strong></div>
                  <div>TFN: <strong className="text-slate-700 dark:text-slate-300">{emp.taxFileNumber}</strong></div>
                  <div>Super: <strong className="text-slate-700 dark:text-slate-300">{emp.superRatePercent}% SG</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LEAVE MANAGEMENT */}
      {activeTab === 'leave' && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200">Staff Leave Requests &amp; Accrual Balances</h3>

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
                        onClick={() => {
                          setLeaveRequests(prev => prev.map(l => l.id === req.id ? { ...l, status: 'Approved' } : l));
                          onShowAlert?.(`Leave Request ${req.id} Approved.`, 'success');
                        }}
                        className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setLeaveRequests(prev => prev.map(l => l.id === req.id ? { ...l, status: 'Rejected' } : l));
                          onShowAlert?.(`Leave Request ${req.id} Rejected.`, 'info');
                        }}
                        className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg"
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
          <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200">Attendance Clock-In Logs &amp; Weekly Timesheets</h3>

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
                      onShowAlert?.('Timesheet status updated.', 'success');
                    }}
                    className={`px-3 py-1.5 font-bold rounded-xl border ${
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

      {/* Add Staff Modal Sub-Overlay */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-slate-900 dark:text-white shadow-2xl">
            <h3 className="font-black text-sm uppercase text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3">Add Employee to HR Directory</h3>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Employee Full Name"
                value={newStaffName}
                onChange={e => setNewStaffName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl text-slate-900 dark:text-white"
              />

              <select
                value={newStaffRole}
                onChange={e => setNewStaffRole(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl text-slate-900 dark:text-slate-200"
              >
                <option value="Sales Executive">Sales Executive</option>
                <option value="Technician">Technician</option>
                <option value="Warehouse Staff">Warehouse Staff</option>
                <option value="Store Manager">Store Manager</option>
              </select>

              <input
                type="number"
                placeholder="Base Hourly Rate ($/hr)"
                value={newStaffRate}
                onChange={e => setNewStaffRate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl text-emerald-600 dark:text-emerald-400 font-bold"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={handleAddStaff}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase"
              >
                Add Staff Member
              </button>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
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
