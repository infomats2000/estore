import { ERPReportData, StoreSettings, DEFAULT_STORE_SETTINGS } from '../../types';
import { generateReportHtml } from './pdfReportGenerator';

export function printERPReportDirect(report: ERPReportData, storeSettings: StoreSettings = DEFAULT_STORE_SETTINGS) {
  const html = generateReportHtml(report, storeSettings);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    console.error('Failed to open iframe for report printing');
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
}
