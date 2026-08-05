import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from './prisma';

const SEED_DATA_DIR = path.resolve(process.cwd(), 'prisma', 'seed-data');

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function parseCSVFile(fileName: string): Promise<Record<string, string>[]> {
  const filePath = path.join(SEED_DATA_DIR, fileName);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const lines = raw.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return [];

    const headers = parseCSVLine(lines[0]);
    const records: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] ?? '';
      });
      records.push(row);
    }
    return records;
  } catch (err) {
    console.warn(`[Master Data Seeder] Could not read CSV file ${fileName}:`, err);
    return [];
  }
}

export async function seedMasterData(): Promise<{ success: boolean; counts: Record<string, number> }> {
  const counts: Record<string, number> = {};

  try {
    // 1. Categories
    const categoriesData = await parseCSVFile('categories.csv');
    if (categoriesData.length > 0) {
      for (const row of categoriesData) {
        if (!row.name) continue;
        await prisma.category.upsert({
          where: { name: row.name },
          update: {
            parentId: row.parentId || null,
            slug: row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: row.description || '',
            sortOrder: parseInt(row.sortOrder || '0', 10),
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          },
          create: {
            id: row.id || undefined,
            parentId: row.parentId || null,
            name: row.name,
            slug: row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: row.description || '',
            sortOrder: parseInt(row.sortOrder || '0', 10),
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          }
        });
      }
      counts.categories = categoriesData.length;
    }

    // 2. Brands
    const brandsData = await parseCSVFile('brands.csv');
    if (brandsData.length > 0) {
      for (const row of brandsData) {
        if (!row.name) continue;
        await prisma.brand.upsert({
          where: { name: row.name },
          update: {
            logoUrl: row.logoUrl || '',
            website: row.website || '',
            country: row.country || '',
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          },
          create: {
            id: row.id || undefined,
            name: row.name,
            logoUrl: row.logoUrl || '',
            website: row.website || '',
            country: row.country || '',
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          }
        });
      }
      counts.brands = brandsData.length;
    }

    // 3. Units of Measure
    const unitsData = await parseCSVFile('units.csv');
    if (unitsData.length > 0) {
      for (const row of unitsData) {
        if (!row.name) continue;
        await prisma.unitOfMeasure.upsert({
          where: { name: row.name },
          update: {
            symbol: row.symbol || '',
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          },
          create: {
            id: row.id || undefined,
            name: row.name,
            symbol: row.symbol || '',
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          }
        });
      }
      counts.units = unitsData.length;
    }

    // 4. Product Statuses
    const statusData = await parseCSVFile('product-status.csv');
    if (statusData.length > 0) {
      for (const row of statusData) {
        if (!row.name) continue;
        await prisma.productStatus.upsert({
          where: { name: row.name },
          update: {
            code: row.code || row.name.toUpperCase().replace(/\s+/g, '_'),
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          },
          create: {
            id: row.id || undefined,
            name: row.name,
            code: row.code || row.name.toUpperCase().replace(/\s+/g, '_'),
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          }
        });
      }
      counts.productStatuses = statusData.length;
    }

    // 5. Warehouses
    const warehouseData = await parseCSVFile('warehouses.csv');
    if (warehouseData.length > 0) {
      for (const row of warehouseData) {
        if (!row.name) continue;
        await prisma.warehouseLocation.upsert({
          where: { name: row.name },
          update: {
            code: row.code || row.name.toUpperCase().replace(/\s+/g, '_'),
            address: row.address || '',
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          },
          create: {
            id: row.id || undefined,
            name: row.name,
            code: row.code || row.name.toUpperCase().replace(/\s+/g, '_'),
            address: row.address || '',
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          }
        });
      }
      counts.warehouses = warehouseData.length;
    }

    // 6. Tax Rates
    const taxData = await parseCSVFile('taxes.csv');
    if (taxData.length > 0) {
      for (const row of taxData) {
        if (!row.name) continue;
        await prisma.taxRate.upsert({
          where: { name: row.name },
          update: {
            country: row.country || '',
            ratePercent: parseFloat(row.ratePercent || '0'),
            code: row.code || '',
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          },
          create: {
            id: row.id || undefined,
            name: row.name,
            country: row.country || '',
            ratePercent: parseFloat(row.ratePercent || '0'),
            code: row.code || '',
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          }
        });
      }
      counts.taxRates = taxData.length;
    }

    // 7. Payment Terms
    const termData = await parseCSVFile('payment-terms.csv');
    if (termData.length > 0) {
      for (const row of termData) {
        if (!row.name) continue;
        await prisma.paymentTerm.upsert({
          where: { name: row.name },
          update: {
            days: parseInt(row.days || '0', 10),
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          },
          create: {
            id: row.id || undefined,
            name: row.name,
            days: parseInt(row.days || '0', 10),
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          }
        });
      }
      counts.paymentTerms = termData.length;
    }

    // 8. Shipping Methods
    const shippingData = await parseCSVFile('shipping-methods.csv');
    if (shippingData.length > 0) {
      for (const row of shippingData) {
        if (!row.name) continue;
        await prisma.shippingMethod.upsert({
          where: { name: row.name },
          update: {
            code: row.code || '',
            description: row.description || '',
            cost: parseFloat(row.cost || '0'),
            sortOrder: parseInt(row.sortOrder || '0', 10),
            isSystem: row.isSystem === 'true',
            active: row.active !== 'false'
          },
          create: {
            id: row.id || undefined,
            name: row.name,
            code: row.code || '',
            description: row.description || '',
            cost: parseFloat(row.cost || '0'),
            sortOrder: parseInt(row.sortOrder || '0', 10),
            isSystem: row.isSystem === 'true',
            active: row.active !== 'false'
          }
        });
      }
      counts.shippingMethods = shippingData.length;
    }

    // 9. Warranty Types
    const warrantyData = await parseCSVFile('warranty-types.csv');
    if (warrantyData.length > 0) {
      for (const row of warrantyData) {
        if (!row.name) continue;
        await prisma.warrantyType.upsert({
          where: { name: row.name },
          update: {
            durationMonths: parseInt(row.durationMonths || '12', 10),
            type: row.type || 'Return To Base',
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          },
          create: {
            id: row.id || undefined,
            name: row.name,
            durationMonths: parseInt(row.durationMonths || '12', 10),
            type: row.type || 'Return To Base',
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          }
        });
      }
      counts.warrantyTypes = warrantyData.length;
    }

    // 10. Attributes & Attribute Values
    const attrData = await parseCSVFile('attributes.csv');
    const attrMap = new Map<string, string>();
    if (attrData.length > 0) {
      for (const row of attrData) {
        if (!row.name) continue;
        const attr = await prisma.productAttribute.upsert({
          where: { name: row.name },
          update: {
            code: row.code || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          },
          create: {
            id: row.id || undefined,
            name: row.name,
            code: row.code || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          }
        });
        attrMap.set(row.id || attr.id, attr.id);
        attrMap.set(attr.name, attr.id);
      }
      counts.attributes = attrData.length;
    }

    const valData = await parseCSVFile('attribute-values.csv');
    if (valData.length > 0) {
      for (const row of valData) {
        if (!row.value || !row.attributeId) continue;
        const resolvedAttrId = attrMap.get(row.attributeId) || row.attributeId;

        await prisma.attributeValue.upsert({
          where: {
            attributeId_value: {
              attributeId: resolvedAttrId,
              value: row.value
            }
          },
          update: {
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          },
          create: {
            id: row.id || undefined,
            attributeId: resolvedAttrId,
            value: row.value,
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          }
        });
      }
      counts.attributeValues = valData.length;
    }

    // 11. Countries
    const countryData = await parseCSVFile('countries.csv');
    if (countryData.length > 0) {
      for (const row of countryData) {
        if (!row.name || !row.iso2) continue;
        await prisma.country.upsert({
          where: { iso2: row.iso2 },
          update: {
            name: row.name,
            iso3: row.iso3 || '',
            currency: row.currency || '',
            phoneCode: row.phoneCode || '',
            timeZone: row.timeZone || '',
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          },
          create: {
            id: row.id || undefined,
            name: row.name,
            iso2: row.iso2,
            iso3: row.iso3 || '',
            currency: row.currency || '',
            phoneCode: row.phoneCode || '',
            timeZone: row.timeZone || '',
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          }
        });
      }
      counts.countries = countryData.length;
    }

    // 12. Currencies
    const currencyData = await parseCSVFile('currencies.csv');
    if (currencyData.length > 0) {
      for (const row of currencyData) {
        if (!row.code) continue;
        await prisma.currency.upsert({
          where: { code: row.code },
          update: {
            name: row.name || row.code,
            symbol: row.symbol || '$',
            decimalPlaces: parseInt(row.decimalPlaces || '2', 10),
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          },
          create: {
            id: row.id || undefined,
            code: row.code,
            name: row.name || row.code,
            symbol: row.symbol || '$',
            decimalPlaces: parseInt(row.decimalPlaces || '2', 10),
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          }
        });
      }
      counts.currencies = currencyData.length;
    }

    // 13. Languages
    const languageData = await parseCSVFile('languages.csv');
    if (languageData.length > 0) {
      for (const row of languageData) {
        if (!row.code) continue;
        await prisma.language.upsert({
          where: { code: row.code },
          update: {
            name: row.name || row.code,
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          },
          create: {
            id: row.id || undefined,
            code: row.code,
            name: row.name || row.code,
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          }
        });
      }
      counts.languages = languageData.length;
    }

    // 14. Product Conditions
    const conditionData = await parseCSVFile('conditions.csv');
    if (conditionData.length > 0) {
      for (const row of conditionData) {
        if (!row.name) continue;
        await prisma.productCondition.upsert({
          where: { name: row.name },
          update: {
            code: row.code || row.name.toUpperCase().replace(/\s+/g, '_'),
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          },
          create: {
            id: row.id || undefined,
            name: row.name,
            code: row.code || row.name.toUpperCase().replace(/\s+/g, '_'),
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          }
        });
      }
      counts.conditions = conditionData.length;
    }

    console.log('[Master Data Seeder] Seeded Master Data Tables:', counts);
    return { success: true, counts };
  } catch (err) {
    console.error('[Master Data Seeder] Seeding error:', err);
    return { success: false, counts };
  }
}
