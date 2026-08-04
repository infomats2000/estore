import { Order, Invoice, StoreSettings, DEFAULT_STORE_SETTINGS } from '../types';

export const COMPANY_DETAILS = {
  name: DEFAULT_STORE_SETTINGS.storeName,
  legalName: DEFAULT_STORE_SETTINGS.legalName,
  abn: DEFAULT_STORE_SETTINGS.businessNumber,
  address: DEFAULT_STORE_SETTINGS.address,
  cityStateZip: DEFAULT_STORE_SETTINGS.cityStateZip,
  phone: DEFAULT_STORE_SETTINGS.phone,
  email: DEFAULT_STORE_SETTINGS.email,
  website: DEFAULT_STORE_SETTINGS.website,
  bank: {
    bankName: DEFAULT_STORE_SETTINGS.bankName,
    accountName: DEFAULT_STORE_SETTINGS.accountName,
    bsb: DEFAULT_STORE_SETTINGS.bsb,
    accountNumber: DEFAULT_STORE_SETTINGS.accountNumber,
    swift: DEFAULT_STORE_SETTINGS.swift
  }
};

export function convertOrderToInvoice(order: Order, settings?: StoreSettings): Invoice {
  const s = settings || DEFAULT_STORE_SETTINGS;
  const invoiceNum = order.invoiceNumber || `INV-${new Date(order.date || Date.now()).getFullYear()}-${order.id.replace(/[^0-9]/g, '').slice(-5) || Math.floor(10000 + Math.random() * 90000)}`;
  
  return {
    id: `INV-${order.id}`,
    orderId: order.id,
    invoiceNumber: invoiceNum,
    issueDate: order.date ? new Date(order.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: order.date ? new Date(order.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    poNumber: order.poNumber || `PO-${order.id.substring(0, 6).toUpperCase()}`,
    status: 'Paid',
    type: 'Tax Invoice',
    customerName: order.customerName || 'Valued Customer',
    customerEmail: order.customerEmail || 'customer@example.com',
    customerPhone: order.customerPhone || 'N/A',
    customerAddress: order.customerAddress || 'Direct Pickup / On-file',
    customerCity: order.customerCity || 'Sydney NSW',
    items: order.items.map(item => ({
      productId: item.productId,
      description: `${item.name}${item.color ? ` - Color: ${item.color}` : ''}${item.size ? ` - Config: ${item.size}` : ''}`,
      quantity: item.quantity,
      unitPrice: item.price,
      amount: item.price * item.quantity,
      taxRate: s.taxRatePercent
    })),
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    paymentMethod: order.paymentMethod || 'Credit Card / EFTPOS',
    paymentTerms: `Paid in Full (${s.taxName} Included)`,
    notes: order.notes || `Thank you for choosing ${s.storeName}. All items include our ${s.invoiceWarrantyText}.`
  };
}

export function generateInvoiceHtml(invoice: Invoice, settings?: StoreSettings): string {
  const s = settings || DEFAULT_STORE_SETTINGS;
  const isPaid = invoice.status === 'Paid';
  const isQuote = invoice.type === 'Quote' || invoice.status === 'Quote';
  const paddingVal = s.invoiceCompactness === 'compact' ? '20px' : s.invoiceCompactness === 'spacious' ? '48px' : '36px';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${invoice.type} - ${invoice.invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      color: #111827;
      background: #f8fafc;
      padding: 24px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .invoice-wrapper {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
      padding: 40px;
      position: relative;
    }

    /* Watermark */
    .watermark {
      position: absolute;
      top: 35%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-25deg);
      font-family: 'JetBrains Mono', monospace;
      font-size: 84px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 12px;
      pointer-events: none;
      user-select: none;
      z-index: 1;
      opacity: 0.08;
      color: ${isPaid ? '#059669' : isQuote ? '#2563eb' : '#dc2626'};
    }

    .header-table {
      width: 100%;
      margin-bottom: 32px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 24px;
    }

    .brand-title {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #002B49;
      text-transform: uppercase;
      display: flex;
      items-center;
      gap: 10px;
    }

    .brand-tag {
      background: #f59e0b;
      color: #002B49;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      vertical-align: middle;
    }

    .company-info {
      font-size: 11px;
      color: #475569;
      line-height: 1.6;
      margin-top: 6px;
    }

    .invoice-title-block {
      text-align: right;
    }

    .doc-type {
      font-size: 24px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
      letter-spacing: 1px;
    }

    .inv-number {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 700;
      color: #2563eb;
      margin-top: 4px;
    }

    .status-badge {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-radius: 9999px;
      font-family: 'JetBrains Mono', monospace;
      background: ${isPaid ? '#ecfdf5' : isQuote ? '#eff6ff' : '#fef2f2'};
      color: ${isPaid ? '#047857' : isQuote ? '#1d4ed8' : '#b91c1c'};
      border: 1px solid ${isPaid ? '#a7f3d0' : isQuote ? '#bfdbfe' : '#fecaca'};
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #f1f5f9;
    }

    .section-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .party-name {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }

    .party-meta {
      font-size: 12px;
      color: #334155;
      line-height: 1.6;
      margin-top: 4px;
    }

    .meta-list {
      font-size: 12px;
      line-height: 1.8;
      color: #334155;
    }

    .meta-list strong {
      color: #0f172a;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }

    .items-table th {
      background: #0f172a;
      color: #ffffff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 14px;
      text-align: left;
    }

    .items-table th.text-right { text-align: right; }
    .items-table th.text-center { text-align: center; }

    .items-table td {
      padding: 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
      color: #1e293b;
    }

    .items-table tr:nth-child(even) td {
      background: #fafafa;
    }

    .item-desc {
      font-weight: 600;
      color: #0f172a;
    }

    .item-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }

    .mono {
      font-family: 'JetBrains Mono', monospace;
    }

    .summary-section {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 24px;
      margin-bottom: 32px;
    }

    .payment-box {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 16px;
      font-size: 11px;
      color: #334155;
      line-height: 1.6;
    }

    .payment-box h5 {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
      margin-bottom: 8px;
    }

    .totals-table {
      width: 100%;
      border-collapse: collapse;
    }

    .totals-table td {
      padding: 6px 0;
      font-size: 13px;
      color: #475569;
    }

    .totals-table td.val {
      text-align: right;
      font-weight: 600;
      color: #0f172a;
    }

    .totals-table tr.grand-total td {
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      padding: 12px 0;
      font-size: 16px;
      font-weight: 800;
      color: #002B49;
    }

    .totals-table tr.grand-total td.val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 18px;
      color: #2563eb;
    }

    .footer-section {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      margin-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }

    .footer-guarantee {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      background: #fef3c7;
      color: #92400e;
      font-size: 10px;
      font-weight: 700;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      text-transform: uppercase;
    }

    .print-controls {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 20px;
    }

    .btn-print {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
      transition: all 0.2s ease;
    }

    .btn-print:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }

    /* Print Specific Media Query */
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .invoice-wrapper {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
      .print-controls {
        display: none !important;
      }
      @page {
        size: A4 portrait;
        margin: 15mm;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <div class="watermark">${invoice.status}</div>

    <div class="print-controls">
      <button class="btn-print" onclick="window.print()">
        🖨️ Print / Save PDF Invoice
      </button>
    </div>

    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div style="width: 48px; height: 48px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
              <img src="/images/app_logo.jpg" alt="Logo" style="height: 100%; width: 100%; object-fit: contain;" />
            </div>
            <div class="brand-title">
              ${s.storeName} <span class="brand-tag">${s.currencySymbol} STORE</span>
            </div>
          </div>
          <div class="company-info">
            <strong>${s.legalName}</strong><br />
            Business ID / ABN: ${s.businessNumber}<br />
            ${s.address}, ${s.cityStateZip}<br />
            Phone: ${s.phone} | Email: ${s.email}
            ${s.website ? `<br />Website: ${s.website}` : ''}
          </div>
        </td>
        <td style="vertical-align: top;" class="invoice-title-block">
          <div class="doc-type">${invoice.type}</div>
          <div class="inv-number">${invoice.invoiceNumber}</div>
          <div class="status-badge">${invoice.status}</div>
          ${s.invoiceHeaderSubtitle ? `<div style="font-size: 9px; color: #64748b; margin-top: 4px; font-weight: 600;">${s.invoiceHeaderSubtitle}</div>` : ''}
        </td>
      </tr>
    </table>

    <!-- Billing and Dates Grid -->
    <div class="details-grid">
      <div>
        <div class="section-label">Billed To (Customer)</div>
        <div class="party-name">${invoice.customerName}</div>
        ${invoice.customerCompany ? `<div style="font-weight: 600; color: #475569; font-size: 11px;">${invoice.customerCompany}</div>` : ''}
        <div class="party-meta">
          ${invoice.customerAddress}<br />
          ${invoice.customerCity}<br />
          Email: ${invoice.customerEmail}<br />
          Phone: ${invoice.customerPhone}
          ${invoice.customerABN ? `<br />Tax Reg / ABN: ${invoice.customerABN}` : ''}
        </div>
      </div>

      <div>
        <div class="section-label">Invoice Reference</div>
        <div class="meta-list">
          <strong>Issue Date:</strong> <span class="mono">${invoice.issueDate}</span><br />
          <strong>Due Date:</strong> <span class="mono">${invoice.dueDate || invoice.issueDate}</span><br />
          <strong>PO Reference:</strong> <span class="mono">${invoice.poNumber || 'N/A'}</span><br />
          <strong>Payment Method:</strong> <span>${invoice.paymentMethod}</span><br />
          <strong>Payment Terms:</strong> <span>${invoice.paymentTerms || 'Due on Receipt'}</span>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th style="width: 50%;">Item Description &amp; Specification</th>
          <th class="text-center" style="width: 10%;">Qty</th>
          <th class="text-right" style="width: 17%;">Unit Price</th>
          <th class="text-right" style="width: 18%;">Amount (${s.currencySymbol})</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map((item, idx) => `
          <tr>
            <td class="mono text-center" style="color: #64748b;">${idx + 1}</td>
            <td>
              <div class="item-desc">${item.description}</div>
              <div class="item-sub">Certified Item • ${s.taxRatePercent}% ${s.taxName} Included</div>
            </td>
            <td class="text-center mono" style="font-weight: 700;">${item.quantity}</td>
            <td class="text-right mono">${s.currencySymbol}${item.unitPrice.toFixed(2)}</td>
            <td class="text-right mono" style="font-weight: 700;">${s.currencySymbol}${item.amount.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Summary / Payment info -->
    <div class="summary-section">
      ${s.showBankOnInvoice ? `
        <div class="payment-box">
          <h5>Direct Bank Deposit Details</h5>
          <strong>Bank:</strong> ${s.bankName}<br />
          <strong>Account Name:</strong> ${s.accountName}<br />
          <strong>BSB / Code:</strong> <span class="mono">${s.bsb}</span> | <strong>Acc #:</strong> <span class="mono">${s.accountNumber}</span><br />
          ${s.swift ? `<strong>SWIFT:</strong> <span class="mono">${s.swift}</span><br />` : ''}
          <strong>Ref:</strong> <span class="mono" style="font-weight: 700; color: #2563eb;">${invoice.invoiceNumber}</span>
          ${s.paymentTermsNote ? `<div style="margin-top: 6px; font-size: 10px; color: #64748b;">${s.paymentTermsNote}</div>` : ''}
          ${invoice.notes ? `<div style="margin-top: 6px; border-top: 1px dashed #cbd5e1; padding-top: 4px; font-style: italic;">Note: ${invoice.notes}</div>` : ''}
        </div>
      ` : `
        <div class="payment-box">
          <h5>Customer Notes</h5>
          <div>${invoice.notes || s.paymentTermsNote}</div>
        </div>
      `}

      <div>
        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td class="val mono">${s.currencySymbol}${invoice.subtotal.toFixed(2)}</td>
          </tr>
          ${invoice.discount > 0 ? `
            <tr>
              <td style="color: #059669;">Discount:</td>
              <td class="val mono" style="color: #059669;">-${s.currencySymbol}${invoice.discount.toFixed(2)}</td>
            </tr>
          ` : ''}
          <tr>
            <td>Shipping &amp; Logistics:</td>
            <td class="val mono">${invoice.shipping === 0 ? 'FREE' : `${s.currencySymbol}${invoice.shipping.toFixed(2)}`}</td>
          </tr>
          <tr>
            <td>Tax (${s.taxRatePercent}% ${s.taxName}):</td>
            <td class="val mono">${s.currencySymbol}${invoice.tax.toFixed(2)}</td>
          </tr>
          <tr class="grand-total">
            <td>TOTAL (${s.currencySymbol}):</td>
            <td class="val">${s.currencySymbol}${invoice.total.toFixed(2)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-section">
      <div>Thank you for choosing <strong>${s.storeName}</strong>.</div>
      ${s.invoiceWarrantyText ? `<div class="footer-guarantee">🛡️ ${s.invoiceWarrantyText}</div>` : ''}
      <div style="font-size: 9px; color: #94a3b8; margin-top: 6px;">${s.invoiceFooterNote}</div>
    </div>
  </div>
</body>
</html>
  `;
}


export function printHtmlContent(htmlContent: string): void {
  // 1. Clean up any previous print iframe
  const existingIframe = document.getElementById('global-print-iframe');
  if (existingIframe) {
    try {
      existingIframe.remove();
    } catch (e) {
      // Ignore cleanup error
    }
  }

  // 2. Create offscreen printable iframe with explicit dimensions for full layout calculation
  const iframe = document.createElement('iframe');
  iframe.id = 'global-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';
  iframe.style.width = '1000px';
  iframe.style.height = '1000px';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    console.error('Failed to access print iframe document');
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // 3. Trigger printing on iframe window after styles and fonts render
  setTimeout(() => {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } else {
        throw new Error('No contentWindow available');
      }
    } catch (err) {
      console.warn('Iframe print failed, trying window.open popup fallback:', err);
      try {
        const printWin = window.open('', '_blank');
        if (printWin) {
          printWin.document.write(htmlContent);
          printWin.document.close();
          printWin.focus();
          printWin.print();
        }
      } catch (popupErr) {
        console.error('All print methods failed:', popupErr);
      }
    } finally {
      // Clean up iframe after print dialog completes or closes
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 2000);
    }
  }, 300);
}

export function printInvoiceDirect(invoice: Invoice, settings?: StoreSettings): void {
  const htmlContent = generateInvoiceHtml(invoice, settings);
  printHtmlContent(htmlContent);
}

export function downloadInvoiceHtmlFile(invoice: Invoice, settings?: StoreSettings): void {
  const htmlContent = generateInvoiceHtml(invoice, settings);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Invoice_${invoice.invoiceNumber}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
