import { ERPReportData, StoreSettings, DEFAULT_STORE_SETTINGS } from '../../types';

export function generateReportHtml(report: ERPReportData, storeSettings: StoreSettings = DEFAULT_STORE_SETTINGS): string {
  const logoUrl = storeSettings.logoUrl || DEFAULT_STORE_SETTINGS.logoUrl;
  const storeName = storeSettings.storeName || 'TECH SELLER AUSTRALIA PTY LTD';

  const kpisHtml = report.kpis.map(kpi => {
    let formattedVal = kpi.value;
    if (kpi.format === 'currency' && typeof kpi.value === 'number') {
      formattedVal = '$' + kpi.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (kpi.format === 'percent' && typeof kpi.value === 'number') {
      formattedVal = kpi.value.toFixed(1) + '%';
    } else if (typeof kpi.value === 'number') {
      formattedVal = kpi.value.toLocaleString();
    }

    return `
      <div style="flex: 1; min-width: 140px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; margin: 4px;">
        <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">${kpi.label}</div>
        <div style="font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 4px; font-family: monospace;">${formattedVal}</div>
        ${kpi.subtext ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">${kpi.subtext}</div>` : ''}
      </div>
    `;
  }).join('');

  const tableHeadersHtml = report.columns.map(col => `
    <th style="padding: 10px 12px; text-align: ${col.align || 'left'}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; background: #0f172a; color: #ffffff; border: 1px solid #1e293b;">
      ${col.label}
    </th>
  `).join('');

  const tableRowsHtml = report.rows.map((row, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    const cellsHtml = report.columns.map(col => {
      const val = row[col.key];
      let formattedVal = val ?? '-';
      if (col.format === 'currency' && typeof val === 'number') {
        formattedVal = '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } else if (col.format === 'percent' && typeof val === 'number') {
        formattedVal = val.toFixed(1) + '%';
      } else if (col.format === 'number' && typeof val === 'number') {
        formattedVal = val.toLocaleString();
      }

      return `
        <td style="padding: 8px 12px; text-align: ${col.align || 'left'}; font-size: 11px; font-family: ${col.format === 'currency' || col.format === 'number' ? 'monospace' : 'inherit'}; border-bottom: 1px solid #e2e8f0; color: #334155;">
          ${formattedVal}
        </td>
      `;
    }).join('');

    return `<tr style="background: ${bg};">${cellsHtml}</tr>`;
  }).join('');

  let summaryRowHtml = '';
  if (report.summaryRow) {
    const summaryCellsHtml = report.columns.map((col, idx) => {
      const val = report.summaryRow?.[col.key];
      let formattedVal = val ?? '';
      if (idx === 0 && !val) formattedVal = 'SUMMARY TOTALS';

      if (col.format === 'currency' && typeof val === 'number') {
        formattedVal = '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } else if (col.format === 'percent' && typeof val === 'number') {
        formattedVal = val.toFixed(1) + '%';
      }

      return `
        <td style="padding: 10px 12px; text-align: ${col.align || 'left'}; font-size: 11px; font-weight: 800; font-family: monospace; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; background: #f1f5f9; color: #0f172a;">
          ${formattedVal}
        </td>
      `;
    }).join('');

    summaryRowHtml = `<tr>${summaryCellsHtml}</tr>`;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${report.title} - ${storeName}</title>
      <style>
        @page { size: A4 landscape; margin: 15mm; }
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #ffffff; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        .no-print { display: block; }
        @media print {
          .no-print { display: none !important; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f172a; padding-bottom: 15px; margin-bottom: 15px;">
        <div style="display: flex; align-items: center; gap: 15px;">
          ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height: 50px; max-width: 150px; object-fit: contain;">` : ''}
          <div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a;">${report.title}</h1>
            <div style="font-size: 12px; color: #475569; font-weight: 500; margin-top: 2px;">${report.subtitle}</div>
          </div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #475569;">
          <div style="font-weight: 800; color: #0f172a;">${storeName}</div>
          <div>${storeSettings.businessNumber || 'ABN 45 123 456 789'}</div>
          <div>Period: <strong>${report.periodLabel}</strong></div>
          <div>Generated: ${report.dateGenerated}</div>
        </div>
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
        ${kpisHtml}
      </div>

      <table>
        <thead>
          <tr>${tableHeadersHtml}</tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
          ${summaryRowHtml}
        </tbody>
      </table>

      <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8;">
        <div>CONFIDENTIAL — FOR INTERNAL ERP USE ONLY</div>
        <div>Page 1 of 1 • System Generated Report</div>
      </div>
    </body>
    </html>
  `;
}

export function downloadReportHtmlFile(report: ERPReportData, storeSettings: StoreSettings = DEFAULT_STORE_SETTINGS) {
  const htmlContent = generateReportHtml(report, storeSettings);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeFilename = `${report.type}_report_${Date.now()}.html`;
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
