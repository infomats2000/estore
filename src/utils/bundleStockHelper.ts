import { Product } from '../types';

export function calculateBundleStock(bundle: Product, catalog: Product[]): number {
  if (!bundle.isBundle || !bundle.bundleComponents || bundle.bundleComponents.length === 0) {
    return bundle.stock || 0;
  }

  const componentAvailableCounts = bundle.bundleComponents.map(comp => {
    const componentProd = catalog.find(p => p.id === comp.productId || p.name === comp.productName);
    if (!componentProd) return 0;
    const qtyPerBundle = comp.quantity || 1;
    return Math.floor((componentProd.stock || 0) / qtyPerBundle);
  });

  return Math.min(...componentAvailableCounts);
}

export function calculateBundleRetailTotal(components: { unitPrice: number; quantity: number }[]): number {
  return components.reduce((acc, c) => acc + (c.unitPrice * c.quantity), 0);
}

export function deductBundleComponentStock(
  bundle: Product, 
  quantityPurchased: number, 
  products: Product[]
): Product[] {
  if (!bundle.isBundle || !bundle.bundleComponents || bundle.bundleComponents.length === 0) {
    return products.map(p => p.id === bundle.id ? { ...p, stock: Math.max(0, p.stock - quantityPurchased) } : p);
  }

  const componentDeductionsMap: Record<string, number> = {};
  bundle.bundleComponents.forEach(comp => {
    const id = comp.productId;
    componentDeductionsMap[id] = (componentDeductionsMap[id] || 0) + (comp.quantity * quantityPurchased);
  });

  return products.map(p => {
    if (componentDeductionsMap[p.id]) {
      const newStock = Math.max(0, p.stock - componentDeductionsMap[p.id]);
      return { ...p, stock: newStock };
    }
    if (p.id === bundle.id) {
      const newBundleStock = Math.max(0, p.stock - quantityPurchased);
      return { ...p, stock: newBundleStock };
    }
    return p;
  });
}
