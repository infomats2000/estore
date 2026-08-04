import { RepairJob, StoreSettings } from '../types';

export function generateJobCardHTML(job: RepairJob, settings?: StoreSettings): string {
  const storeName = settings?.storeName || 'TECH SELLER';
  const storeAddress = settings?.address ? `${settings.address}, ${settings.cityStateZip}` : '';
  const storePhone = settings?.phone || '';
  const storeEmail = settings?.email || '';

  const STATUS_COLORS: Record<string, string> = {
    'Intake': '#6366f1',
    'Diagnosed': '#0891b2',
    'Awaiting Parts': '#d97706',
    'In Progress': '#2563eb',
    'QC': '#7c3aed',
    'Ready': '#059669',
    'Collected': '#374151',
    'Cancelled': '#dc2626'
  };
  const statusColor = STATUS_COLORS[job.status] || '#374151';

  const partsTotal = job.partsUsed.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);
  const labourTotal = job.labourHours * job.labourRatePerHour;
  const grandTotal = job.finalCost ?? (partsTotal + labourTotal);

  const partsRows = job.partsUsed.length > 0
    ? job.partsUsed.map(p => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${p.productName}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center">${p.quantity}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">$${p.unitCost.toFixed(2)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">$${(p.quantity * p.unitCost).toFixed(2)}</td>
        </tr>`).join('')
    : `<tr><td colspan="4" style="padding:10px 8px;color:#9ca3af;text-align:center">No parts used</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Job Card ${job.id} — ${job.deviceBrand} ${job.deviceModel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #111827; background: #fff; }
    .page { max-width: 210mm; margin: 0 auto; padding: 20mm 18mm; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #111; padding-bottom: 16px; margin-bottom: 20px; }
    .store-name { font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; }
    .store-contact { font-size: 10px; color: #6b7280; margin-top: 4px; line-height: 1.6; }
    .job-badge { background: ${statusColor}; color: #fff; padding: 6px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .job-id { font-size: 28px; font-weight: 900; color: ${statusColor}; font-family: monospace; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
    .field label { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #9ca3af; display: block; margin-bottom: 2px; }
    .field span { font-size: 12px; font-weight: 600; color: #111827; }
    .fault-box { background: #fef2f2; border: 1px solid #fecaca; padding: 10px 12px; font-size: 12px; line-height: 1.6; color: #7f1d1d; }
    .diagnosis-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 12px; font-size: 12px; line-height: 1.6; color: #14532d; }
    .warranty-badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 2px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; border-radius: 999px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #111827; color: #fff; padding: 7px 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; }
    .totals-row td { padding: 6px 8px; font-weight: 700; border-top: 2px solid #111; }
    .grand-total td { background: #111827; color: #fff; padding: 8px; font-size: 14px; font-weight: 900; }
    .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; }
    .sig-box { border-top: 1px solid #374151; padding-top: 8px; }
    .sig-label { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #6b7280; }
    .footer { margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 9px; color: #9ca3af; text-align: center; }
    @media print {
      body { margin: 0; }
      .page { padding: 12mm 14mm; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <div>
        <div class="store-name">${storeName}</div>
        <div class="store-contact">
          ${storeAddress ? `${storeAddress}<br>` : ''}
          ${storePhone ? `Phone: ${storePhone}` : ''}${storePhone && storeEmail ? ' &nbsp;|&nbsp; ' : ''}${storeEmail ? `Email: ${storeEmail}` : ''}
        </div>
      </div>
      <div style="text-align:right">
        <div class="job-id">${job.id}</div>
        <div style="margin-top:6px"><span class="job-badge">${job.status}</span></div>
        ${job.isWarrantyJob ? '<div style="margin-top:6px"><span class="warranty-badge">⚡ Warranty Job</span></div>' : ''}
      </div>
    </div>

    <!-- DEVICE & CUSTOMER -->
    <div class="section">
      <div class="section-title">Device &amp; Customer Information</div>
      <div class="grid-2">
        <div class="field"><label>Customer Name</label><span>${job.customerName}</span></div>
        <div class="field"><label>Device Type</label><span>${job.deviceType}</span></div>
        <div class="field"><label>Phone</label><span>${job.customerPhone || '—'}</span></div>
        <div class="field"><label>Brand / Model</label><span>${job.deviceBrand} ${job.deviceModel}</span></div>
        <div class="field"><label>Email</label><span>${job.customerEmail || '—'}</span></div>
        <div class="field"><label>Serial Number</label><span style="font-family:monospace">${job.serialNumber || '—'}</span></div>
        <div class="field"><label>Intake Date</label><span>${job.intakeDate}</span></div>
        <div class="field"><label>Technician</label><span>${job.technicianName || 'Unassigned'}</span></div>
      </div>
    </div>

    <!-- REPORTED FAULT -->
    <div class="section">
      <div class="section-title">Reported Fault</div>
      <div class="fault-box">${job.fault || 'No fault description provided.'}</div>
    </div>

    ${job.diagnosis ? `
    <!-- DIAGNOSIS -->
    <div class="section">
      <div class="section-title">Technician Diagnosis</div>
      <div class="diagnosis-box">${job.diagnosis}</div>
    </div>` : ''}

    <!-- PARTS USED -->
    <div class="section">
      <div class="section-title">Parts Used</div>
      <table>
        <thead>
          <tr>
            <th>Part Description</th>
            <th style="text-align:center;width:60px">Qty</th>
            <th style="text-align:right;width:90px">Unit Cost</th>
            <th style="text-align:right;width:90px">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${partsRows}
          <tr class="totals-row">
            <td colspan="3">Parts Subtotal</td>
            <td style="text-align:right">$${partsTotal.toFixed(2)}</td>
          </tr>
          <tr class="totals-row">
            <td colspan="2">Labour</td>
            <td style="text-align:right">${job.labourHours}h × $${job.labourRatePerHour}/hr</td>
            <td style="text-align:right">$${labourTotal.toFixed(2)}</td>
          </tr>
          <tr class="grand-total">
            <td colspan="3">TOTAL${job.isWarrantyJob ? ' (WARRANTY — NO CHARGE)' : ''}</td>
            <td style="text-align:right">${job.isWarrantyJob ? '$0.00' : `$${grandTotal.toFixed(2)}`}</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${job.notes ? `
    <!-- CUSTOMER NOTES -->
    <div class="section">
      <div class="section-title">Notes for Customer</div>
      <p style="font-size:11px;line-height:1.6;color:#374151">${job.notes}</p>
    </div>` : ''}

    <!-- SIGNATURES -->
    <div class="sig-grid">
      <div class="sig-box">
        <div style="height:40px"></div>
        <div class="sig-label">Technician Signature &amp; Date</div>
      </div>
      <div class="sig-box">
        <div style="height:40px"></div>
        <div class="sig-label">Customer Signature &amp; Date (on collection)</div>
      </div>
    </div>

    <!-- PRINT BUTTON -->
    <div class="no-print" style="margin-top:24px;text-align:center">
      <button onclick="window.print()" style="background:#111827;color:#fff;border:none;padding:10px 28px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;cursor:pointer;">
        🖨 Print Job Card
      </button>
    </div>

    <div class="footer">
      This is an internal service document. Job ID: ${job.id} | Generated: ${new Date().toLocaleString()}
    </div>

  </div>
</body>
</html>`;
}

export function printJobCard(job: RepairJob, settings?: StoreSettings): void {
  const html = generateJobCardHTML(job, settings);
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { alert('Allow pop-ups to print the job card.'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 800);
}
