import { ERPReportData } from '../../types';

export function exportReportToCSV(report: ERPReportData) {
  const lines: string[] = [];

  // Metadata headers
  lines.push(`"Report Title: ${report.title.replace(/"/g, '""')}"`);
  lines.push(`"Subtitle: ${report.subtitle.replace(/"/g, '""')}"`);
  lines.push(`"Category: ${report.category}"`);
  lines.push(`"Period: ${report.periodLabel}"`);
  lines.push(`"Date Generated: ${report.dateGenerated}"`);
  lines.push('');

  // KPI Summary block
  lines.push('"--- KPI SUMMARY ---"');
  report.kpis.forEach(kpi => {
    let valStr = kpi.value;
    if (kpi.format === 'currency' && typeof kpi.value === 'number') {
      valStr = '$' + kpi.value.toFixed(2);
    } else if (kpi.format === 'percent' && typeof kpi.value === 'number') {
      valStr = kpi.value.toFixed(1) + '%';
    }
    lines.push(`"${kpi.label}","${valStr}","${kpi.subtext || ''}"`);
  });
  lines.push('');

  // Table Column Headers
  const headerRow = report.columns.map(col => `"${col.label.replace(/"/g, '""')}"`).join(',');
  lines.push(headerRow);

  // Table Rows
  report.rows.forEach(row => {
    const rowValues = report.columns.map(col => {
      const val = row[col.key];
      if (val === null || val === undefined) return '""';
      
      if (col.format === 'currency' && typeof val === 'number') {
        return `"$${val.toFixed(2)}"`;
      }
      if (col.format === 'percent' && typeof val === 'number') {
        return `"${val.toFixed(1)}%"`;
      }
      if (typeof val === 'number') {
        return `"${val}"`;
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    lines.push(rowValues.join(','));
  });

  // Summary Row (if present)
  if (report.summaryRow) {
    lines.push('');
    const summaryValues = report.columns.map((col, idx) => {
      const val = report.summaryRow?.[col.key];
      if (val === null || val === undefined) {
        return idx === 0 ? '"SUMMARY TOTALS"' : '""';
      }
      if (col.format === 'currency' && typeof val === 'number') {
        return `"$${val.toFixed(2)}"`;
      }
      if (col.format === 'percent' && typeof val === 'number') {
        return `"${val.toFixed(1)}%"`;
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    lines.push(summaryValues.join(','));
  }

  const csvContent = '\uFEFF' + lines.join('\n'); // Add UTF-8 BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeFilename = `${report.type}_${report.periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`;
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
