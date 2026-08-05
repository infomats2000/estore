import { StockTransfer, StoreSettings } from '../types';

export function printStockTransferNote(transfer: StockTransfer, storeSettings?: StoreSettings): void {
  const printWindow = window.open('', '_blank', 'width=850,height=1100');
  if (!printWindow) return;

  const logoUrl = storeSettings?.logoUrl || '';
  const storeName = storeSettings?.storeName || 'TECH SELLER';
  const legalName = storeSettings?.legalName || 'Tech Seller Australia Pty Ltd';

  const itemsRows = transfer.items.map((item, idx) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 12px; color: #4b5563;">${idx + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">${item.productName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 700; text-align: center; color: #0d6efd;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; font-family: monospace; color: #6b7280;">${item.stockUnitIds?.join(', ') || 'Bulk / Standard'}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Stock Transfer Note - ${transfer.id}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111827; margin: 0; padding: 20px; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #111827; margin-bottom: 20px; }
        .logo-section { display: flex; align-items: center; gap: 15px; }
        .logo-img { max-height: 50px; max-width: 180px; object-fit: contain; }
        .title-block { text-align: right; }
        .title-block h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: #111827; }
        .title-block .badge { display: inline-block; background: #0d6efd; color: #fff; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 9999px; margin-top: 5px; text-transform: uppercase; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
        .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
        .card-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; }
        .card-content { font-size: 14px; font-weight: 700; color: #111827; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .table th { background: #111827; color: #fff; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 10px; text-align: left; }
        .signature-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 50px; padding-top: 20px; border-top: 1px dashed #d1d5db; }
        .sig-box { text-align: center; }
        .sig-line { border-bottom: 1px solid #9ca3af; height: 40px; margin-bottom: 8px; }
        .sig-label { font-size: 10px; font-weight: 700; uppercase; color: #6b7280; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 15px; text-align: right;">
        <button onclick="window.print()" style="background: #0d6efd; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer;">🖨️ Print Transfer Note</button>
      </div>

      <div class="header">
        <div class="logo-section">
          ${logoUrl ? `<img src="${logoUrl}" class="logo-img" alt="Logo" />` : ''}
          <div>
            <div style="font-size: 18px; font-weight: 900; letter-spacing: 0.5px;">${storeName}</div>
            <div style="font-size: 11px; color: #6b7280;">${legalName}</div>
          </div>
        </div>
        <div class="title-block">
          <h1>STOCK TRANSFER NOTE</h1>
          <div style="font-family: monospace; font-size: 14px; font-weight: 800; color: #374151;">${transfer.id}</div>
          <div class="badge">${transfer.status}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="card" style="border-left: 4px solid #dc3545;">
          <div class="card-title">DISPATCH FROM (ORIGIN)</div>
          <div class="card-content">${transfer.fromLocationName}</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">Transfer Date: ${transfer.transferDate}</div>
        </div>
        <div class="card" style="border-left: 4px solid #198754;">
          <div class="card-title">DELIVER TO (DESTINATION)</div>
          <div class="card-content">${transfer.toLocationName}</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">Requested By: ${transfer.requestedBy || 'Logistics Team'}</div>
        </div>
      </div>

      ${transfer.reason ? `<div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 15px; font-size: 12px; color: #1e40af; margin-bottom: 20px;"><strong>Reason / Purpose:</strong> ${transfer.reason}</div>` : ''}

      <table class="table">
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th>Item Description</th>
            <th style="text-align: center; width: 80px;">Qty</th>
            <th>Serialized Units / Notes</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      ${transfer.notes ? `<div style="font-size: 12px; color: #4b5563; margin-bottom: 20px;"><strong>Special Instructions:</strong> ${transfer.notes}</div>` : ''}

      <div class="signature-grid">
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-label">Dispatched By (Signature & Date)</div>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-label">Driver / Courier Signature</div>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-label">Received At Destination (Signature & Date)</div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
