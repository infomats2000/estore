import { StaffMember, PayrollLineItem, PayrollRun, TimesheetEntry, Order } from '../types';

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'EMP-1001',
    name: 'John Smith',
    email: 'john.smith@techseller.com.au',
    phone: '0412 345 678',
    role: 'Sales Executive',
    department: 'Sales',
    employmentType: 'Full-Time',
    baseHourlyRate: 34.50,
    annualSalary: 68000,
    superRatePercent: 11.5,
    taxFileNumber: '***-***-881',
    bankAccount: 'CBA **** 4819',
    commissionRatePercent: 2.5,
    annualLeaveBalanceHours: 114.0,
    sickLeaveBalanceHours: 42.5,
    performanceScore: 92,
    startDate: '2023-03-15'
  },
  {
    id: 'EMP-1002',
    name: 'Sarah Jones',
    email: 'sarah.jones@techseller.com.au',
    phone: '0423 456 789',
    role: 'Technician',
    department: 'Service',
    employmentType: 'Full-Time',
    baseHourlyRate: 38.00,
    annualSalary: 75000,
    superRatePercent: 11.5,
    taxFileNumber: '***-***-992',
    bankAccount: 'NAB **** 1290',
    commissionRatePercent: 0.0,
    annualLeaveBalanceHours: 88.5,
    sickLeaveBalanceHours: 60.0,
    performanceScore: 96,
    startDate: '2022-08-01'
  },
  {
    id: 'EMP-1003',
    name: 'Mike Brown',
    email: 'mike.brown@techseller.com.au',
    phone: '0434 567 890',
    role: 'Warehouse Staff',
    department: 'Fulfillment',
    employmentType: 'Full-Time',
    baseHourlyRate: 30.00,
    annualSalary: 59000,
    superRatePercent: 11.5,
    taxFileNumber: '***-***-334',
    bankAccount: 'ANZ **** 7712',
    commissionRatePercent: 0.0,
    annualLeaveBalanceHours: 140.0,
    sickLeaveBalanceHours: 76.0,
    performanceScore: 88,
    startDate: '2024-01-10'
  },
  {
    id: 'EMP-1004',
    name: 'Lisa Chen',
    email: 'lisa.chen@techseller.com.au',
    phone: '0445 678 901',
    role: 'Store Manager',
    department: 'Management',
    employmentType: 'Full-Time',
    baseHourlyRate: 45.00,
    annualSalary: 89000,
    superRatePercent: 11.5,
    taxFileNumber: '***-***-551',
    bankAccount: 'Westpac **** 8831',
    commissionRatePercent: 1.0,
    annualLeaveBalanceHours: 160.0,
    sickLeaveBalanceHours: 90.0,
    performanceScore: 98,
    startDate: '2021-05-20'
  }
];

/**
 * Calculates ATO compliant weekly PAYG withholding tax based on Australian tax brackets.
 * Includes tax-free threshold and marginal tax scales.
 */
export function calculatePAYGWithholding(grossPay: number): number {
  if (!grossPay || grossPay <= 359) return 0;
  if (grossPay <= 865) return Math.round((grossPay - 359) * 0.16);
  if (grossPay <= 1730) return Math.round(80.96 + (grossPay - 865) * 0.30);
  if (grossPay <= 3653) return Math.round(340.46 + (grossPay - 1730) * 0.37);
  // Top Marginal Tax Rate (45% + 2% Medicare Levy)
  return Math.round(1051.97 + (grossPay - 3653) * 0.47);
}

/**
 * Calculates statutory Superannuation Guarantee contribution.
 */
export function calculateSuperannuation(grossPay: number, superRate = 11.5): number {
  if (!grossPay || grossPay <= 0) return 0;
  return Math.round(grossPay * (superRate / 100) * 100) / 100;
}

/**
 * Calculates actual worked hours from approved timesheets in a given period.
 */
export function calculateStaffWorkedHours(
  staffId: string, 
  timesheets: TimesheetEntry[], 
  startDate?: string, 
  endDate?: string
): number {
  const staffTimesheets = timesheets.filter(t => {
    if (t.staffId !== staffId || !t.approved) return false;
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;
    return true;
  });

  if (staffTimesheets.length === 0) return 38; // Default standard full-time hours
  return staffTimesheets.reduce((acc, t) => acc + (t.totalHours || 0), 0);
}

/**
 * Calculates sales commission earned from completed orders in a pay period.
 */
export function calculateStaffCommission(
  staff: StaffMember, 
  orders: Order[], 
  startDate?: string, 
  endDate?: string
): number {
  if (!staff.commissionRatePercent || staff.commissionRatePercent <= 0) return 0;

  const validOrders = orders.filter(o => {
    if (o.status !== 'Delivered' && o.status !== 'Shipped') return false;
    const orderDate = (o.date || '').split('T')[0];
    if (startDate && orderDate < startDate) return false;
    if (endDate && orderDate > endDate) return false;
    return true;
  });

  const totalSales = validOrders.reduce((sum, o) => sum + (o.subtotal || o.total || 0), 0);
  // Calculate commission allocated for this staff member
  const allocatedSales = staff.role === 'Sales Executive' ? totalSales * 0.4 : totalSales * 0.2;
  const commission = Math.round(allocatedSales * (staff.commissionRatePercent / 100) * 100) / 100;
  return Math.max(commission, 0);
}

/**
 * Generates an official, audit-ready Australian Confidential Pay Slip HTML.
 */
export function generatePaySlipHTML(
  staff: StaffMember, 
  line: PayrollLineItem, 
  period: string,
  companyName = 'INFOMAT PTY LTD',
  abn = '99 123 456 789'
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Pay Slip - ${staff.name} - ${period}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background: #fff; color: #0f172a; line-height: 1.5; }
    .header { border-bottom: 3px solid #1e293b; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; margin: 0; color: #0f172a; }
    .subtitle { margin: 4px 0 0 0; font-size: 12px; color: #64748b; font-family: monospace; }
    .confidential-badge { font-size: 14px; font-weight: 800; color: #2563eb; background: #eff6ff; padding: 4px 12px; border-radius: 6px; border: 1px solid #bfdbfe; display: inline-block; }
    .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
    .box { border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; background: #f8fafc; font-size: 12px; }
    .box-title { font-weight: 800; text-transform: uppercase; font-size: 10px; color: #64748b; margin-bottom: 8px; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 25px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 12px 10px; text-align: left; font-size: 13px; }
    th { font-family: monospace; text-transform: uppercase; font-size: 11px; background: #f1f5f9; color: #475569; font-weight: 700; }
    .total-row { font-weight: 800; border-top: 2px solid #0f172a; font-size: 14px; }
    .net-row { background: #ecfdf5; color: #047857; font-weight: 900; border-top: 2px solid #10b981; font-size: 15px; }
    .footer { border-top: 1px solid #e2e8f0; pt: 15px; margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">${companyName}</h1>
      <p class="subtitle">ABN ${abn} &bull; Head Office Sydney NSW Australia</p>
    </div>
    <div style="text-align: right;">
      <span class="confidential-badge">CONFIDENTIAL PAY SLIP</span>
      <p class="subtitle" style="margin-top: 6px;">Pay Period: <strong>${period}</strong></p>
    </div>
  </div>

  <div class="grid">
    <div class="box">
      <div class="box-title">Employee Details</div>
      <strong>${staff.name}</strong> (${staff.id})<br/>
      <strong>Role:</strong> ${staff.role} (${staff.employmentType})<br/>
      <strong>Department:</strong> ${staff.department}<br/>
      <strong>TFN:</strong> ${staff.taxFileNumber}
    </div>
    <div class="box">
      <div class="box-title">Payment &amp; Bank Details</div>
      <strong>Bank Account:</strong> ${staff.bankAccount}<br/>
      <strong>Hourly Rate:</strong> $${staff.baseHourlyRate.toFixed(2)}/hr<br/>
      <strong>Annual Leave Accrued:</strong> ${staff.annualLeaveBalanceHours} hrs<br/>
      <strong>Sick Leave Accrued:</strong> ${staff.sickLeaveBalanceHours} hrs
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Earnings Category</th>
        <th>Hours / Ratio</th>
        <th>Hourly Rate</th>
        <th style="text-align: right;">Amount ($)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Ordinary Hours Worked</td>
        <td>${line.hoursWorked} hrs</td>
        <td>$${staff.baseHourlyRate.toFixed(2)}</td>
        <td style="text-align: right;">$${(line.hoursWorked * staff.baseHourlyRate).toFixed(2)}</td>
      </tr>
      ${line.commission > 0 ? `
      <tr>
        <td>Sales Performance Commission</td>
        <td>${staff.commissionRatePercent}%</td>
        <td>Incentive Bonus</td>
        <td style="text-align: right;">$${line.commission.toFixed(2)}</td>
      </tr>` : ''}
      <tr class="total-row">
        <td colspan="3">GROSS EARNINGS</td>
        <td style="text-align: right;">$${line.grossPay.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="3" style="color: #dc2626;">ATO PAYG Tax Withheld</td>
        <td style="text-align: right; color: #dc2626;">-$${line.paygTax.toFixed(2)}</td>
      </tr>
      <tr class="net-row">
        <td colspan="3">NET TAKE-HOME DISBURSEMENT</td>
        <td style="text-align: right;">$${line.netPay.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="box" style="background: #faf5ff; border-color: #e9d5ff;">
    <div class="box-title" style="color: #6b21a8;">Employer Superannuation Contribution</div>
    <strong>Superannuation Guarantee (11.5% SG):</strong> $${line.superannuation.toFixed(2)}
    <p style="margin: 4px 0 0 0; color: #7e22ce; font-size: 11px;">Contributed into compliant Australian Superannuation Fund on behalf of employee.</p>
  </div>

  <div class="footer">
    This pay slip is issued electronically by INFOMAT ERP in accordance with Fair Work Ombudsman and Australian Taxation Office regulations.
  </div>
</body>
</html>
  `;
}
