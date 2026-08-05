import { CustomerProfile, StoreSettings, DEFAULT_STORE_SETTINGS, TradeLedgerEntry } from '../types';

export interface AgingSummary {
  current: number;
  thirtyDays: number;
  sixtyDays: number;
  ninetyDaysPlus: number;
  totalBalance: number;
}

export function calculateAgingSummary(ledger: TradeLedgerEntry[] = []): AgingSummary {
  const now = new Date();
  let current = 0;
  let thirtyDays = 0;
  let sixtyDays = 0;
  let ninetyDaysPlus = 0;

  ledger.forEach(entry => {
    if (entry.type === 'Invoice Charge' && entry.amount > 0) {
      const entryDate = new Date(entry.date);
      const diffTime = Math.abs(now.getTime() - entryDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        current += entry.amount;
      } else if (diffDays <= 60) {
        thirtyDays += entry.amount;
      } else if (diffDays <= 90) {
        sixtyDays += entry.amount;
      } else {
        ninetyDaysPlus += entry.amount;
      }
    }
  });

  const totalBalance = current + thirtyDays + sixtyDays + ninetyDaysPlus;

  return {
    current: Math.round(current * 100) / 100,
    thirtyDays: Math.round(thirtyDays * 100) / 100,
    sixtyDays: Math.round(sixtyDays * 100) / 100,
    ninetyDaysPlus: Math.round(ninetyDaysPlus * 100) / 100,
    totalBalance: Math.round(totalBalance * 100) / 100
  };
}

export function generateStatementHtml(
  customer: CustomerProfile,
  settings?: StoreSettings,
  monthName: string = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
): string {
  const s = settings || DEFAULT_STORE_SETTINGS;
  const trade = customer.tradeAccount;
  const ledger = customer.tradeLedger || [];
  const aging = calculateAgingSummary(ledger);

  const accountNum = trade?.accountNumber || `TRD-${customer.id.slice(-5).toUpperCase()}`;
  const companyName = trade?.companyName || customer.company || customer.name;
  const abn = trade?.abn || customer.abn || 'N/A';
  const creditLimit = trade?.creditLimit || 0;
  const creditBalance = trade?.creditBalance || aging.totalBalance;
  const availableCredit = Math.max(0, creditLimit - creditBalance);
  const terms = trade?.creditTerms || 'Net 30';

  const todayStr = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });

  const ledgerRowsHtml = ledger.length === 0
    ? `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 24px;">No ledger transactions recorded for this period.</td></tr>`
    : ledger.map(entry => {
        const isCharge = entry.amount > 0;
        const chargeStr = isCharge ? `$${entry.amount.toFixed(2)}` : '-';
        const paymentStr = !isCharge ? `$${Math.abs(entry.amount).toFixed(2)}` : '-';
        const isOverdue = entry.status === 'Overdue';

        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; font-family: monospace; font-size: 11px;">${entry.date}</td>
            <td style="padding: 10px 12px; font-family: monospace; font-size: 11px; font-weight: bold;">${entry.reference}</td>
            <td style="padding: 10px 12px; font-size: 12px;">
              ${entry.description}
              ${isOverdue ? `<span style="background: #fee2e2; color: #991b1b; font-size: 9px; padding: 2px 6px; border-radius: 2px; margin-left: 6px; font-weight: bold;">OVERDUE</span>` : ''}
            </td>
            <td style="padding: 10px 12px; font-family: monospace; text-align: right; color: ${isCharge ? '#0f172a' : '#94a3b8'}; font-weight: ${isCharge ? 'bold' : 'normal'};">${chargeStr}</td>
            <td style="padding: 10px 12px; font-family: monospace; text-align: right; color: ${!isCharge ? '#166534' : '#94a3b8'}; font-weight: ${!isCharge ? 'bold' : 'normal'};">${paymentStr}</td>
            <td style="padding: 10px 12px; font-family: monospace; text-align: right; font-weight: bold; color: #0f172a;">$${entry.runningBalance.toFixed(2)}</td>
          </tr>
        `;
      }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>B2B Account Statement - ${companyName}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; background: #fff; }
      .no-print { display: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      padding: 40px 20px;
      line-height: 1.5;
    }
    .statement-card {
      max-width: 850px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      padding: 40px;
    }
    .flex-between { display: flex; justify-content: space-between; align-items: flex-start; }
    .header-title { font-size: 24px; font-weight: 800; text-transform: uppercase; tracking: 0.1em; color: #0f172a; margin: 0; }
    .subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #64748b; font-weight: 700; }
    .meta-box { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 16px; width: 280px; }
    .meta-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px; }
    .meta-row strong { color: #0f172a; }
    .table-custom { width: 100%; border-collapse: collapse; margin-top: 20px; text-align: left; }
    .table-custom th { background: #0f172a; color: #ffffff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 10px 12px; }
    .aging-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 24px; }
    .aging-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; text-align: center; }
    .aging-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; }
    .aging-val { font-family: monospace; font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 4px; }
    .remittance-slip { border-top: 2px dashed #94a3b8; margin-top: 40px; padding-top: 24px; background: #fafafa; padding: 20px; }
  </style>
</head>
<body>
  <div class="statement-card">
    
    <!-- Top Print Bar -->
    <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: white; padding: 12px 20px;">
      <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">B2B Commercial Statement Engine</span>
      <div>
        <button onclick="window.print()" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 11px;">Print / Save PDF</button>
      </div>
    </div>

    <!-- HEADER -->
    <div class="flex-between">
      <div>
        <h1 class="header-title">${s.storeName}</h1>
        <p class="subtitle">${s.legalName} &bull; ${s.businessNumber}</p>
        <p style="font-size: 11px; color: #475569; margin-top: 6px;">
          ${s.address}, ${s.cityStateZip}<br>
          Phone: ${s.phone} | Email: ${s.email}<br>
          Web: ${s.website}
        </p>
      </div>
      <div class="meta-box">
        <div style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 10px; color: #0f172a;">
          STATEMENT OF ACCOUNT
        </div>
        <div class="meta-row"><span>Statement Date:</span> <strong>${todayStr}</strong></div>
        <div class="meta-row"><span>Period:</span> <strong>${monthName}</strong></div>
        <div class="meta-row"><span>Account No:</span> <strong>${accountNum}</strong></div>
        <div class="meta-row"><span>Credit Terms:</span> <strong>${terms}</strong></div>
      </div>
    </div>

    <!-- CUSTOMER BILL TO -->
    <div style="margin-top: 28px; padding: 16px; background: #f8fafc; border-left: 4px solid #0f172a;">
      <div class="subtitle" style="margin-bottom: 4px;">Statement Recipient</div>
      <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase;">${companyName}</h3>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">
        Attn: ${customer.name} ${trade?.contactPerson ? `(${trade.contactPerson})` : ''}<br>
        ABN / Tax ID: <strong>${abn}</strong> &bull; Email: ${customer.email}<br>
        ${customer.address}, ${customer.city}
      </p>
    </div>

    <!-- CREDIT POSITION SUMMARY -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 24px;">
      <div style="border: 1px solid #cbd5e1; padding: 14px; background: #ffffff;">
        <span class="subtitle">Approved Credit Limit</span>
        <div style="font-family: monospace; font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px;">$${creditLimit.toFixed(2)}</div>
      </div>
      <div style="border: 1px solid #cbd5e1; padding: 14px; background: #ffffff;">
        <span class="subtitle">Total Balance Owing</span>
        <div style="font-family: monospace; font-size: 18px; font-weight: 800; color: ${creditBalance > 0 ? '#b91c1c' : '#0f172a'}; margin-top: 4px;">$${creditBalance.toFixed(2)}</div>
      </div>
      <div style="border: 1px solid #cbd5e1; padding: 14px; background: #ffffff;">
        <span class="subtitle">Available Credit</span>
        <div style="font-family: monospace; font-size: 18px; font-weight: 800; color: #15803d; margin-top: 4px;">$${availableCredit.toFixed(2)}</div>
      </div>
    </div>

    <!-- AGING ANALYSIS TABLE -->
    <div style="margin-top: 28px;">
      <div class="subtitle" style="margin-bottom: 8px;">Ageing Analysis Breakdown</div>
      <div class="aging-grid">
        <div class="aging-box">
          <div class="aging-label">Current</div>
          <div class="aging-val">$${aging.current.toFixed(2)}</div>
        </div>
        <div class="aging-box">
          <div class="aging-label">30 Days</div>
          <div class="aging-val" style="color: ${aging.thirtyDays > 0 ? '#d97706' : '#0f172a'};">$${aging.thirtyDays.toFixed(2)}</div>
        </div>
        <div class="aging-box">
          <div class="aging-label">60 Days</div>
          <div class="aging-val" style="color: ${aging.sixtyDays > 0 ? '#c2410c' : '#0f172a'};">$${aging.sixtyDays.toFixed(2)}</div>
        </div>
        <div class="aging-box">
          <div class="aging-label">90+ Days</div>
          <div class="aging-val" style="color: ${aging.ninetyDaysPlus > 0 ? '#dc2626' : '#0f172a'};">$${aging.ninetyDaysPlus.toFixed(2)}</div>
        </div>
        <div class="aging-box" style="background: #0f172a; color: white;">
          <div class="aging-label" style="color: #94a3b8;">Amount Due</div>
          <div class="aging-val" style="color: white;">$${aging.totalBalance.toFixed(2)}</div>
        </div>
      </div>
    </div>

    <!-- LEDGER TRANSACTIONS -->
    <div style="margin-top: 32px;">
      <div class="subtitle">Itemized Ledger Activity</div>
      <table class="table-custom">
        <thead>
          <tr>
            <th>Date</th>
            <th>Reference #</th>
            <th>Description</th>
            <th style="text-align: right;">Charges (+)</th>
            <th style="text-align: right;">Payments (-)</th>
            <th style="text-align: right;">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${ledgerRowsHtml}
        </tbody>
      </table>
    </div>

    <!-- REMITTANCE SLIP -->
    <div class="remittance-slip">
      <div class="flex-between">
        <div>
          <h4 style="margin: 0; font-size: 14px; font-weight: 800; text-transform: uppercase; color: #0f172a;">REMITTANCE ADVICE</h4>
          <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Please attach this slip with your Electronic Funds Transfer (EFT) payment.</p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; color: #64748b;">Total Amount Due:</div>
          <div style="font-family: monospace; font-size: 18px; font-weight: 800; color: #0f172a;">$${creditBalance.toFixed(2)}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 16px; font-size: 11px; border-top: 1px solid #cbd5e1; padding-top: 12px;">
        <div>
          <strong>Bank Transfer (EFT) Details:</strong><br>
          Bank Name: ${s.bankName}<br>
          Account Name: ${s.accountName}<br>
          BSB: <strong>${s.bsb}</strong> | Account No: <strong>${s.accountNumber}</strong><br>
          SWIFT / BIC: ${s.swift}
        </div>
        <div>
          <strong>Payment Reference Instructions:</strong><br>
          Please quote your Account Number <strong>${accountNum}</strong> or Invoice Reference when initiating bank deposit.<br>
          Remittance Advice Email: <strong>${s.email}</strong>
        </div>
      </div>
    </div>

  </div>
</body>
</html>
  `;
}

export function printStatementDirect(customer: CustomerProfile, settings?: StoreSettings): void {
  const html = generateStatementHtml(customer, settings);
  const printWindow = window.open('', '_blank', 'width=950,height=1000');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }
}

export function downloadStatementHtmlFile(customer: CustomerProfile, settings?: StoreSettings): void {
  const html = generateStatementHtml(customer, settings);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Statement_${(customer.tradeAccount?.companyName || customer.name).replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
