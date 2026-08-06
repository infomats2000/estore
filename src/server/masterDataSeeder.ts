import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

async function parseCSVFile(fileName: string): Promise<Record<string, string>[]> {
  const filePath = path.resolve(process.cwd(), 'data', fileName);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const records: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
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
        const slug = row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const existing = await prisma.category.findFirst({ where: { slug } });
        const payload = {
          parentId: row.parentId || null,
          name: row.name,
          slug,
          description: row.description || '',
          sortOrder: parseInt(row.sortOrder || '0', 10),
          isSystem: row.isSystem === 'true',
          isActive: row.isActive !== 'false'
        };

        if (existing) {
          await prisma.category.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.category.create({ data: payload });
        }
      }
      counts.categories = categoriesData.length;
    }

    // 2. Brands
    const brandsData = await parseCSVFile('brands.csv');
    if (brandsData.length > 0) {
      for (const row of brandsData) {
        if (!row.name) continue;
        const existing = await prisma.brand.findFirst({ where: { name: row.name } });
        const payload = {
          name: row.name,
          logoUrl: row.logoUrl || '',
          website: row.website || '',
          country: row.country || '',
          isSystem: row.isSystem === 'true',
          isActive: row.isActive !== 'false'
        };

        if (existing) {
          await prisma.brand.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.brand.create({ data: payload });
        }
      }
      counts.brands = brandsData.length;
    }

    // 3. Units of Measure
    const uomData = await parseCSVFile('units_of_measure.csv');
    if (uomData.length > 0) {
      for (const row of uomData) {
        if (!row.name) continue;
        const existing = await prisma.unitOfMeasure.findFirst({ where: { name: row.name } });
        const payload = {
          name: row.name,
          symbol: row.symbol || '',
          isSystem: row.isSystem === 'true',
          isActive: row.isActive !== 'false'
        };

        if (existing) {
          await prisma.unitOfMeasure.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.unitOfMeasure.create({ data: payload });
        }
      }
      counts.unitsOfMeasure = uomData.length;
    }

    // 4. Product Statuses
    const statusData = await parseCSVFile('product_statuses.csv');
    if (statusData.length > 0) {
      for (const row of statusData) {
        if (!row.name || !row.code) continue;
        const existing = await prisma.productStatus.findFirst({ where: { code: row.code } });
        const payload = {
          name: row.name,
          code: row.code,
          isSystem: row.isSystem === 'true',
          isActive: row.isActive !== 'false'
        };

        if (existing) {
          await prisma.productStatus.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.productStatus.create({ data: payload });
        }
      }
      counts.productStatuses = statusData.length;
    }

    // 5. Warehouse Locations
    const whData = await parseCSVFile('warehouse_locations.csv');
    if (whData.length > 0) {
      for (const row of whData) {
        if (!row.name || !row.code) continue;
        const existing = await prisma.warehouseLocation.findFirst({ where: { code: row.code } });
        const payload = {
          name: row.name,
          code: row.code,
          address: row.address || '',
          isSystem: row.isSystem === 'true',
          isActive: row.isActive !== 'false'
        };

        if (existing) {
          await prisma.warehouseLocation.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.warehouseLocation.create({ data: payload });
        }
      }
      counts.warehouseLocations = whData.length;
    }

    // 6. Tax Rates
    const taxData = await parseCSVFile('tax_rates.csv');
    if (taxData.length > 0) {
      for (const row of taxData) {
        if (!row.name) continue;
        const existing = await prisma.taxRate.findFirst({ where: { name: row.name } });
        const payload = {
          name: row.name,
          country: row.country || '',
          ratePercent: parseFloat(row.ratePercent || '0'),
          code: row.code || '',
          isSystem: row.isSystem === 'true',
          isActive: row.isActive !== 'false'
        };

        if (existing) {
          await prisma.taxRate.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.taxRate.create({ data: payload });
        }
      }
      counts.taxRates = taxData.length;
    }

    // 7. Payment Terms
    const termData = await parseCSVFile('payment_terms.csv');
    if (termData.length > 0) {
      for (const row of termData) {
        if (!row.name) continue;
        const existing = await prisma.paymentTerm.findFirst({ where: { name: row.name } });
        const payload = {
          name: row.name,
          days: parseInt(row.days || '0', 10),
          isSystem: row.isSystem === 'true',
          isActive: row.isActive !== 'false'
        };

        if (existing) {
          await prisma.paymentTerm.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.paymentTerm.create({ data: payload });
        }
      }
      counts.paymentTerms = termData.length;
    }

    // 8. Shipping Methods
    const shipData = await parseCSVFile('shipping_methods.csv');
    if (shipData.length > 0) {
      for (const row of shipData) {
        if (!row.name) continue;
        const existing = await prisma.shippingMethod.findFirst({ where: { name: row.name } });
        const payload = {
          name: row.name,
          code: row.code || '',
          description: row.description || '',
          cost: parseFloat(row.cost || '0'),
          sortOrder: parseInt(row.sortOrder || '0', 10),
          isSystem: row.isSystem === 'true',
          active: row.active !== 'false'
        };

        if (existing) {
          await prisma.shippingMethod.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.shippingMethod.create({ data: payload });
        }
      }
      counts.shippingMethods = shipData.length;
    }

    // 9. Warranty Types
    const warData = await parseCSVFile('warranty_types.csv');
    if (warData.length > 0) {
      for (const row of warData) {
        if (!row.name) continue;
        const existing = await prisma.warrantyType.findFirst({ where: { name: row.name } });
        const payload = {
          name: row.name,
          durationMonths: parseInt(row.durationMonths || '12', 10),
          type: row.type || 'Return To Base',
          isSystem: row.isSystem === 'true',
          isActive: row.isActive !== 'false'
        };

        if (existing) {
          await prisma.warrantyType.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.warrantyType.create({ data: payload });
        }
      }
      counts.warrantyTypes = warData.length;
    }

    // 10. Product Attributes & Attribute Values
    const attrData = await parseCSVFile('product_attributes.csv');
    if (attrData.length > 0) {
      for (const row of attrData) {
        if (!row.name || !row.code) continue;
        const existing = await prisma.productAttribute.findFirst({ where: { code: row.code } });
        const payload = {
          name: row.name,
          code: row.code,
          isSystem: row.isSystem === 'true',
          isActive: row.isActive !== 'false'
        };

        if (existing) {
          await prisma.productAttribute.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.productAttribute.create({ data: payload });
        }
      }
      counts.productAttributes = attrData.length;
    }

    const valData = await parseCSVFile('attribute_values.csv');
    if (valData.length > 0) {
      for (const row of valData) {
        if (!row.attributeId || !row.value) continue;
        const existing = await prisma.attributeValue.findFirst({
          where: { attributeId: row.attributeId, value: row.value }
        });
        const payload = {
          attributeId: row.attributeId,
          value: row.value,
          isSystem: row.isSystem === 'true',
          isActive: row.isActive !== 'false'
        };

        if (existing) {
          await prisma.attributeValue.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.attributeValue.create({ data: payload });
        }
      }
      counts.attributeValues = valData.length;
    }

    // 11. Reference Data: Countries, Currencies, Languages
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

    const currencyData = await parseCSVFile('currencies.csv');
    if (currencyData.length > 0) {
      for (const row of currencyData) {
        if (!row.code) continue;
        await prisma.currency.upsert({
          where: { code: row.code },
          update: {
            name: row.name || '',
            symbol: row.symbol || '$',
            decimalPlaces: parseInt(row.decimalPlaces || '2', 10),
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          },
          create: {
            code: row.code,
            name: row.name || '',
            symbol: row.symbol || '$',
            decimalPlaces: parseInt(row.decimalPlaces || '2', 10),
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          }
        });
      }
      counts.currencies = currencyData.length;
    }

    const langData = await parseCSVFile('languages.csv');
    if (langData.length > 0) {
      for (const row of langData) {
        if (!row.code) continue;
        await prisma.language.upsert({
          where: { code: row.code },
          update: {
            name: row.name || '',
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          },
          create: {
            code: row.code,
            name: row.name || '',
            isSystem: row.isSystem === 'true',
            isActive: row.isActive !== 'false'
          }
        });
      }
      counts.languages = langData.length;
    }

    // 12. Product Conditions
    const condData = await parseCSVFile('product_conditions.csv');
    if (condData.length > 0) {
      for (const row of condData) {
        if (!row.name || !row.code) continue;
        const existing = await prisma.productCondition.findFirst({ where: { code: row.code } });
        const payload = {
          name: row.name,
          code: row.code,
          isSystem: row.isSystem === 'true',
          isActive: row.isActive !== 'false'
        };

        if (existing) {
          await prisma.productCondition.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.productCondition.create({ data: payload });
        }
      }
      counts.productConditions = condData.length;
    }

    console.log('[Master Data Seeder] Master data seeded successfully:', counts);
    return { success: true, counts };
  } catch (err) {
    console.error('[Master Data Seeder] Failed to seed master data:', err);
    return { success: false, counts };
  }
}
