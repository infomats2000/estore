import { Product } from '../types';

export interface CSVColumnMapping {
  name: string;
  price: string;
  stock: string;
  category: string;
  costPrice: string;
  discountPrice: string;
  description: string;
  condition: string;
  cpu: string;
  ram: string;
  storage: string;
  barcode: string;
  image: string;
}

export interface ParsedCSVRow {
  rowIndex: number;
  data: Record<string, string>;
  product?: Product;
  errors: string[];
  warnings: string[];
}

export interface CSVParseResult {
  headers: string[];
  rows: ParsedCSVRow[];
  validCount: number;
  invalidCount: number;
  mapping: CSVColumnMapping;
}

/**
 * Parses raw CSV or TSV string content into structured row records.
 */
export function parseCSVContent(text: string): { headers: string[]; dataRows: string[][] } {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      lines.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    lines.push(current);
  }

  if (lines.length === 0) {
    return { headers: [], dataRows: [] };
  }

  // Detect delimiter (comma, tab, or semicolon)
  const firstLine = lines[0];
  let delimiter = ',';
  if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = '\t';
  } else if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = ';';
  }

  const parseLine = (line: string): string[] => {
    const fields: string[] = [];
    let field = '';
    let inside = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inside = !inside;
      } else if (c === delimiter && !inside) {
        fields.push(field.trim());
        field = '';
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    return fields;
  };

  const headers = parseLine(lines[0]).map(h => h.replace(/^["']|["']$/g, ''));
  const dataRows = lines.slice(1).map(parseLine).filter(row => row.some(cell => cell.trim().length > 0));

  return { headers, dataRows };
}

/**
 * Intelligent auto-mapping of CSV headers to system fields.
 */
export function autoMapCSVColumns(headers: string[]): CSVColumnMapping {
  const findBestMatch = (keywords: string[]): string => {
    const lowerHeaders = headers.map(h => h.toLowerCase().trim());
    for (const kw of keywords) {
      const matchIndex = lowerHeaders.findIndex(h => h.includes(kw));
      if (matchIndex !== -1) {
        return headers[matchIndex];
      }
    }
    return '';
  };

  return {
    name: findBestMatch(['name', 'title', 'product', 'item', 'description']),
    price: findBestMatch(['price', 'unit price', 'retail', 'sell']),
    stock: findBestMatch(['stock', 'qty', 'quantity', 'count', 'units']),
    category: findBestMatch(['category', 'cat', 'type', 'group']),
    costPrice: findBestMatch(['cost', 'wholesale', 'buy price', 'cost price']),
    discountPrice: findBestMatch(['discount', 'sale price', 'offer price']),
    description: findBestMatch(['desc', 'details', 'specs overview', 'summary']),
    condition: findBestMatch(['condition', 'grade', 'quality', 'status']),
    cpu: findBestMatch(['cpu', 'processor', 'chip']),
    ram: findBestMatch(['ram', 'memory']),
    storage: findBestMatch(['storage', 'ssd', 'hdd', 'drive', 'capacity']),
    barcode: findBestMatch(['barcode', 'qr', 'upc', 'ean', 'sku', 'serial', 'code']),
    image: findBestMatch(['image', 'img', 'photo', 'picture', 'url'])
  };
}

/**
 * Converts parsed raw rows into validated Product objects.
 */
export function processCSVImportData(
  headers: string[],
  dataRows: string[][],
  mapping: CSVColumnMapping,
  defaultCategory: string = 'Laptops & Hardware'
): CSVParseResult {
  const getVal = (row: string[], colName: string): string => {
    if (!colName) return '';
    const idx = headers.indexOf(colName);
    return idx !== -1 && row[idx] ? row[idx].trim() : '';
  };

  const parsedRows: ParsedCSVRow[] = [];
  let validCount = 0;
  let invalidCount = 0;

  dataRows.forEach((row, index) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const name = getVal(row, mapping.name) || `Imported Item #${index + 1}`;
    const rawPrice = getVal(row, mapping.price);
    const rawStock = getVal(row, mapping.stock);
    const category = getVal(row, mapping.category) || defaultCategory;
    const costPriceVal = getVal(row, mapping.costPrice);
    const discountPriceVal = getVal(row, mapping.discountPrice);
    const description = getVal(row, mapping.description) || `${name} - Imported via CSV batch inventory.`;
    const condition = getVal(row, mapping.condition) || 'Refurbished - Grade A';
    const cpu = getVal(row, mapping.cpu);
    const ram = getVal(row, mapping.ram);
    const storage = getVal(row, mapping.storage);
    const rawBarcode = getVal(row, mapping.barcode);
    const image = getVal(row, mapping.image) || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=60';

    const price = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
    if (isNaN(price) || price <= 0) {
      errors.push('Invalid or missing retail price.');
    }

    const stock = parseInt(rawStock.replace(/[^0-9]/g, ''), 10);
    const validStock = isNaN(stock) ? 1 : Math.max(0, stock);

    let barcode = rawBarcode;
    if (!barcode) {
      barcode = `93${Math.floor(10000000000 + Math.random() * 90000000000)}`;
      warnings.push(`Auto-generated barcode ${barcode}`);
    }

    const specs: Record<string, string> = {
      'Condition': condition,
      'Warranty': '12 Months Commercial'
    };
    if (cpu) specs['Processor'] = cpu;
    if (ram) specs['RAM'] = ram;
    if (storage) specs['Storage'] = storage;

    const product: Product = {
      id: `PROD-CSV-${Date.now()}-${index}`,
      name,
      description,
      category,
      price: isNaN(price) ? 0 : price,
      discountPrice: discountPriceVal ? parseFloat(discountPriceVal.replace(/[^0-9.]/g, '')) : undefined,
      costPrice: costPriceVal ? parseFloat(costPriceVal.replace(/[^0-9.]/g, '')) : undefined,
      stock: validStock,
      image,
      additionalImages: [],
      rating: 5.0,
      reviewsCount: 1,
      specs: { ...specs, Barcode: barcode },
      tags: ['CSV Import', condition]
    };

    if (errors.length > 0) {
      invalidCount++;
    } else {
      validCount++;
    }

    parsedRows.push({
      rowIndex: index + 1,
      data: headers.reduce((acc, h, i) => ({ ...acc, [h]: row[i] || '' }), {}),
      product: errors.length === 0 ? product : undefined,
      errors,
      warnings
    });
  });

  return {
    headers,
    rows: parsedRows,
    validCount,
    invalidCount,
    mapping
  };
}
