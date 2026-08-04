import { Order, Product, StoreSettings, DEFAULT_STORE_SETTINGS } from '../types';

export interface WarrantyDetails {
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  purchaseDate: string;
  productName: string;
  serialNumber?: string;
  warrantyPeriod: string;
  storeSettings?: StoreSettings;
}

export function generateWarrantyCertificateHTML(details: WarrantyDetails): string {
  const store = details.storeSettings || DEFAULT_STORE_SETTINGS;
  const certId = `CERT-${details.orderNumber.replace(/[^a-zA-Z0-9]/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Warranty Certificate - ${details.orderNumber}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; background: #fff; }
      .no-print { display: none !important; }
      .certificate-container { border: 8px double #1e293b !important; box-shadow: none !important; }
    }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .no-print-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #0f172a;
      color: #fff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .print-btn {
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 8px 20px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: background 0.2s;
    }
    .print-btn:hover { background: #1d4ed8; }
    .certificate-container {
      background: #ffffff;
      width: 800px;
      padding: 50px 60px;
      border: 10px double #0f172a;
      box-shadow: 0 20px 40px rgba(0,0,0,0.08);
      position: relative;
      box-sizing: border-box;
      margin-top: 40px;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 80px;
      font-weight: 900;
      color: rgba(15, 23, 42, 0.03);
      text-transform: uppercase;
      letter-spacing: 0.2em;
      pointer-events: none;
      user-select: none;
      white-space: nowrap;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 24px;
      margin-bottom: 30px;
    }
    .store-name {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .cert-title {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #2563eb;
      margin: 12px 0 0 0;
    }
    .cert-id {
      font-family: monospace;
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }
    .cert-body {
      line-height: 1.6;
      font-size: 14px;
    }
    .statement {
      text-align: center;
      font-size: 15px;
      color: #334155;
      margin-bottom: 30px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 24px;
      margin-bottom: 30px;
    }
    .info-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #64748b;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }
    .terms-box {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      font-size: 11px;
      color: #64748b;
    }
    .terms-box h4 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #334155;
      margin: 0 0 8px 0;
    }
    .terms-box ul {
      margin: 0;
      padding-left: 18px;
    }
    .terms-box li {
      margin-bottom: 4px;
    }
    .footer-seal {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 2px dashed #cbd5e1;
      padding-top: 20px;
    }
    .seal-badge {
      border: 2px solid #0f172a;
      padding: 8px 16px;
      font-weight: 900;
      font-size: 11px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      background: #f1f5f9;
    }
    .signature-line {
      text-align: center;
      width: 200px;
    }
    .line {
      border-bottom: 1px solid #0f172a;
      margin-bottom: 4px;
      height: 30px;
    }
    .sig-text {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #64748b;
    }
  </style>
</head>
<body>

  <div class="no-print-bar no-print">
    <div><strong>Warranty Certificate Preview</strong> &bull; Order #${details.orderNumber}</div>
    <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
  </div>

  <div class="certificate-container">
    <div class="watermark">OFFICIAL WARRANTY</div>

    <div class="header">
      <div class="store-name">${store.storeName}</div>
      <div style="font-size: 12px; color: #64748b;">${store.address} &bull; ${store.phone} &bull; ${store.email}</div>
      <div class="cert-title">Certificate of Warranty Coverage</div>
      <div class="cert-id">SERIALIZED REF #${certId}</div>
    </div>

    <div class="cert-body">
      <div class="statement">
        This document certifies that the hardware item listed below is backed by <strong>${store.storeName}</strong> under the specified warranty coverage terms.
      </div>

      <div class="info-grid">
        <div>
          <div class="info-label">Customer Name</div>
          <div class="info-value">${details.customerName || 'Valued Customer'}</div>
        </div>
        <div>
          <div class="info-label">Order Reference</div>
          <div class="info-value">#${details.orderNumber}</div>
        </div>
        <div>
          <div class="info-label">Product Model</div>
          <div class="info-value">${details.productName}</div>
        </div>
        <div>
          <div class="info-label">Hardware Serial #</div>
          <div class="info-value" style="font-family: monospace;">${details.serialNumber || 'SN-REGISTERED-' + details.orderNumber}</div>
        </div>
        <div>
          <div class="info-label">Purchase Date</div>
          <div class="info-value">${details.purchaseDate}</div>
        </div>
        <div>
          <div class="info-label">Warranty Coverage</div>
          <div class="info-value" style="color: #2563eb;">${details.warrantyPeriod}</div>
        </div>
      </div>

      <div class="terms-box">
        <h4>Warranty Terms & Conditions</h4>
        <ul>
          <li>Covers hardware defect diagnostics, component replacement, and technical service.</li>
          <li>Does not cover accidental liquid damage, physical drop impact, or unauthorized tampering.</li>
          <li>Hardware serial number must match database records at time of warranty claim.</li>
        </ul>
      </div>

      <div class="footer-seal">
        <div class="seal-badge">
          ✓ AUTHENTIC GUARANTEE
        </div>
        <div class="signature-line">
          <div class="line"></div>
          <div class="sig-text">Authorized Signature</div>
        </div>
      </div>
    </div>
  </div>

</body>
</html>
  `;
}

export function printWarrantyCertificate(details: WarrantyDetails) {
  const html = generateWarrantyCertificateHTML(details);
  const win = window.open('', '_blank', 'width=900,height=800');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
  }
}
