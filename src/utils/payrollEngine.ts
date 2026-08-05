import { StaffMember, PayrollLineItem, PayrollRun } from '../types';

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

export function calculatePAYGWithholding(grossPay: number): number {
  if (grossPay <= 350) return 0;
  if (grossPay <= 750) return Math.round((grossPay - 350) * 0.16);
  if (grossPay <= 1500) return Math.round(64 + (grossPay - 750) * 0.24);
  if (grossPay <= 2500) return Math.round(244 + (grossPay - 1500) * 0.32);
  return Math.round(564 + (grossPay - 2500) * 0.37);
}

export function calculateSuperannuation(grossPay: number, superRate = 11.5): number {
  return Math.round(grossPay * (superRate / 100) * 100) / 100;
}

export function generatePaySlipHTML(staff: StaffMember, line: PayrollLineItem, period: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Pay Slip - ${staff.name} - ${period}</title>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; background: #fff; color: #0f172a; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; }
    .box { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; background: #f8fafc; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 13px; }
    th { font-family: monospace; text-transform: uppercase; background: #f1f5f9; }
    .total-row { font-weight: bold; border-top: 2px solid #0f172a; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h2 style="margin:0; text-transform:uppercase;">TECH SELLER AUSTRALIA PTY LTD</h2>
      <p style="margin:4px 0; font-size:12px; color:#64748b;">ABN 99 123 456 789 &bull; Sydney NSW</p>
    </div>
    <div style="text-align:right;">
      <h3 style="margin:0; color:#2563eb;">CONFIDENTIAL PAY SLIP</h3>
      <p style="margin:4px 0; font-size:12px; font-family:monospace;">Pay Period: ${period}</p>
    </div>
  </div>

  <div class="box">
    <strong>Employee Details:</strong><br/>
    Name: ${staff.name} | Staff ID: ${staff.id} | Role: ${staff.role}<br/>
    TFN: ${staff.taxFileNumber} | Bank Account: ${staff.bankAccount}
  </div>

  <table>
    <thead>
      <tr>
        <th>Earnings Category</th>
        <th>Hours / Base</th>
        <th>Rate</th>
        <th>Amount ($)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Ordinary Hours</td>
        <td>${line.hoursWorked} hrs</td>
        <td>$${staff.baseHourlyRate.toFixed(2)}</td>
        <td>$${(line.hoursWorked * staff.baseHourlyRate).toFixed(2)}</td>
      </tr>
      ${line.commission > 0 ? `
      <tr>
        <td>Sales Commission</td>
        <td>100%</td>
        <td>Bonus</td>
        <td>$${line.commission.toFixed(2)}</td>
      </tr>` : ''}
      <tr class="total-row">
        <td colspan="3">GROSS EARNINGS</td>
        <td>$${line.grossPay.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="3" style="color:#dc2626;">ATO PAYG Tax Withheld</td>
        <td style="color:#dc2626;">-$${line.paygTax.toFixed(2)}</td>
      </tr>
      <tr class="total-row" style="background:#ecfdf5; color:#059669;">
        <td colspan="3">NET TAKE-HOME PAY</td>
        <td>$${line.netPay.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="box" style="margin-top:20px;">
    <strong>Employer Superannuation Guarantee (11.5% SG):</strong> $${line.superannuation.toFixed(2)} (Paid into Australian Super)
  </div>
</body>
</html>
  `;
}
