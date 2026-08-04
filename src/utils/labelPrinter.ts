import { Product } from '../types';

export interface LabelPrintOptions {
  labelCount: number; // Number of stickers to print (e.g. 1 label or 50 labels for 1 lot)
  layout: 'thermal_roll_50x25' | 'a4_sheet_21up' | 'a4_sheet_24up';
  showStoreLogo: boolean;
  showPrice: boolean;
  showSpecs: boolean;
  showCondition: boolean;
  showBarcodeNumber: boolean;
  showQRCode: boolean;
}

/**
 * Generates an SVG string representation of a 1D Code128-style Barcode.
 */
export function generateBarcodeSVG(text: string, width = 220, height = 50): string {
  const clean = text.replace(/[^0-9A-Za-z-]/g, '') || '930000000000';
  let binaryString = '11010010000'; // Start code B

  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    // Convert character code into pseudo-binary bar pattern
    const pattern = ((charCode * 17 + i * 31) % 128).toString(2).padStart(7, '0');
    binaryString += pattern.split('').map(b => (b === '1' ? '110' : '10')).join('');
  }
  binaryString += '1100011101011'; // Stop code

  const barWidth = width / binaryString.length;
  let svgBars = '';

  for (let i = 0; i < binaryString.length; i++) {
    if (binaryString[i] === '1') {
      const x = (i * barWidth).toFixed(2);
      const w = (barWidth + 0.1).toFixed(2);
      svgBars += `<rect x="${x}" y="0" width="${w}" height="${height}" fill="#000000" />`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${svgBars}</svg>`;
}

/**
 * Generates an SVG string representation of a 2D QR Code.
 */
export function generateQRCodeSVG(text: string, size = 100): string {
  const gridSize = 21;
  const cellSize = size / gridSize;
  let rects = '';

  // Finder pattern helper
  const drawFinder = (startX: number, startY: number) => {
    rects += `<rect x="${startX * cellSize}" y="${startY * cellSize}" width="${7 * cellSize}" height="${7 * cellSize}" fill="#000" />`;
    rects += `<rect x="${(startX + 1) * cellSize}" y="${(startY + 1) * cellSize}" width="${5 * cellSize}" height="${5 * cellSize}" fill="#fff" />`;
    rects += `<rect x="${(startX + 2) * cellSize}" y="${(startY + 2) * cellSize}" width="${3 * cellSize}" height="${3 * cellSize}" fill="#000" />`;
  };

  drawFinder(0, 0); // Top-Left
  drawFinder(14, 0); // Top-Right
  drawFinder(0, 14); // Bottom-Left

  // Pseudo data grid based on text hash
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Avoid finder patterns
      if ((r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8)) continue;

      const hash = (text.charCodeAt((r + c) % text.length) * (r + 1) + c * 37) % 7;
      if (hash > 3) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${rects}</svg>`;
}

/**
 * Triggers batch print layout generation and opens browser print dialog.
 */
export function printProductLabelsBatch(product: Product, options: LabelPrintOptions, storeName = 'TECH SELLER') {
  const barcodeNumber = product.specs?.Barcode || product.id || '931234567890';
  const barcodeSVG = generateBarcodeSVG(barcodeNumber, 200, 45);
  const qrSVG = generateQRCodeSVG(`${product.name} | ${product.id} | ${barcodeNumber}`, 80);

  const condition = product.specs?.Condition || 'Refurbished Grade A';
  const cpu = product.specs?.Processor || '';
  const ram = product.specs?.RAM || '';
  const storage = product.specs?.Storage || '';
  const specsLine = [cpu, ram, storage].filter(Boolean).join(' • ');

  const priceText = `$${product.price.toFixed(2)}`;

  // Generate label HTML card
  const labelCardHTML = `
    <div class="label-card">
      ${options.showStoreLogo ? `<div class="store-brand">${storeName}</div>` : ''}
      <div class="product-title">${product.name}</div>
      ${options.showCondition ? `<div class="condition-badge">${condition}</div>` : ''}
      ${options.showSpecs && specsLine ? `<div class="specs-line">${specsLine}</div>` : ''}
      
      <div class="code-container">
        ${options.showQRCode ? `<div class="qr-box">${qrSVG}</div>` : ''}
        <div class="barcode-box">
          ${barcodeSVG}
          ${options.showBarcodeNumber ? `<div class="barcode-num">${barcodeNumber}</div>` : ''}
        </div>
      </div>

      ${options.showPrice ? `<div class="price-tag">${priceText} <span class="tax-note">inc. GST</span></div>` : ''}
    </div>
  `;

  // Repeat labelCardHTML for options.labelCount
  const totalLabels = Math.max(1, options.labelCount || 1);
  const labelsGridHTML = Array(totalLabels).fill(labelCardHTML).join('');

  const isThermal = options.layout === 'thermal_roll_50x25';
  const isA4_21up = options.layout === 'a4_sheet_21up';

  const styleCSS = `
    @page {
      size: ${isThermal ? '50mm 25mm' : 'A4'};
      margin: ${isThermal ? '0' : '10mm'};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fff;
      color: #000;
      -webkit-print-color-adjust: exact;
    }
    .print-grid {
      display: ${isThermal ? 'block' : 'grid'};
      ${!isThermal ? `grid-template-columns: repeat(${isA4_21up ? 3 : 3}, 1fr); gap: 4mm;` : ''}
    }
    .label-card {
      width: ${isThermal ? '50mm' : '100%'};
      height: ${isThermal ? '25mm' : '36mm'};
      padding: 1.5mm 2mm;
      border: ${isThermal ? 'none' : '1px dashed #ccc'};
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      background: #fff;
    }
    .store-brand {
      font-size: 7px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #000;
    }
    .product-title {
      font-size: 8px;
      font-weight: 800;
      line-height: 1.1;
      max-height: 18px;
      overflow: hidden;
      text-transform: uppercase;
    }
    .condition-badge {
      font-size: 6px;
      font-weight: 800;
      text-transform: uppercase;
      background: #000;
      color: #fff;
      padding: 0.5px 3px;
      border-radius: 2px;
      align-self: flex-start;
      margin-top: 1px;
    }
    .specs-line {
      font-size: 6.5px;
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .code-container {
      display: flex;
      align-items: center;
      gap: 2mm;
      margin-top: 1px;
    }
    .qr-box svg {
      width: 14mm;
      height: 14mm;
    }
    .barcode-box {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .barcode-box svg {
      width: 100%;
      height: 7mm;
    }
    .barcode-num {
      font-family: monospace;
      font-size: 6px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .price-tag {
      font-size: 9px;
      font-weight: 900;
      text-align: right;
      margin-top: 1px;
    }
    .tax-note {
      font-size: 5px;
      font-weight: 400;
      color: #555;
    }
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Batch Label Print - ${product.name}</title>
        <style>${styleCSS}</style>
      </head>
      <body>
        <div class="print-grid">
          ${labelsGridHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
