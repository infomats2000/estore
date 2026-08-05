import React, { useState } from 'react';
import { X, Package, Plus, Trash2, Layers, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { Product, BundleComponent } from '../../types';
import { calculateBundleRetailTotal } from '../../utils/bundleStockHelper';

interface BundleBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveBundle: (bundleProduct: Product) => void;
  onShowAlert?: (title: string, message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function BundleBuilderModal({
  isOpen,
  onClose,
  products,
  onSaveBundle,
  onShowAlert
}: BundleBuilderModalProps) {
  const [bundleName, setBundleName] = useState('');
  const [category, setCategory] = useState('Laptops');
  const [price, setPrice] = useState<number>(1499);
  const [description, setDescription] = useState('');
  const [components, setComponents] = useState<BundleComponent[]>([]);

  if (!isOpen) return null;

  const nonBundleProducts = products.filter(p => !p.isBundle);

  const handleAddComponent = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    if (components.some(c => c.productId === productId)) {
      onShowAlert?.('Already Added', `${prod.name} is already in this bundle. Adjust quantity instead.`, 'warning');
      return;
    }

    setComponents(prev => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: 1,
        unitPrice: prod.price
      }
    ]);
  };

  const handleRemoveComponent = (productId: string) => {
    setComponents(prev => prev.filter(c => c.productId !== productId));
  };

  const handleUpdateQuantity = (productId: string, qty: number) => {
    setComponents(prev => prev.map(c => c.productId === productId ? { ...c, quantity: Math.max(1, qty) } : c));
  };

  const retailTotal = calculateBundleRetailTotal(components);
  const savings = Math.max(0, retailTotal - price);
  const savingsPercent = retailTotal > 0 ? (savings / retailTotal) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundleName.trim()) {
      onShowAlert?.('Missing Name', 'Please enter a name for the Bundle / Kit SKU.', 'error');
      return;
    }
    if (components.length === 0) {
      onShowAlert?.('No Components', 'Please add at least 1 child component product to the bundle.', 'error');
      return;
    }

    const newBundle: Product = {
      id: `P-KIT-${Date.now().toString().slice(-4)}`,
      name: bundleName,
      description: description || `Complete hardware kit bundle featuring ${components.map(c => c.productName).join(', ')}.`,
      category,
      price,
      discountPrice: price,
      image: products.find(p => p.id === components[0]?.productId)?.image || '/images/app_logo.jpg',
      additionalImages: [],
      rating: 5.0,
      reviewsCount: 1,
      stock: 10,
      costPrice: components.reduce((acc, c) => {
        const prod = products.find(p => p.id === c.productId);
        return acc + ((prod?.costPrice || (c.unitPrice * 0.6)) * c.quantity);
      }, 0),
      specs: {
        'Kit Type': 'Composite Bundle',
        'Included Items': `${components.length} Component Products`,
        'Total Retail Value': `$${retailTotal.toFixed(2)}`
      },
      tags: ['Kit Bundle', 'Special Combo', 'Value Pack'],
      isBundle: true,
      kitType: 'Bundle',
      bundleComponents: components,
      bundleSavings: savings
    };

    onSaveBundle(newBundle);
    onShowAlert?.('Bundle Created', `Product Kit "${bundleName}" created with ${components.length} components.`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm">Product Bundle &amp; Kit Builder</h3>
              <p className="text-[11px] text-slate-400">Link child component SKUs and configure composite bundle pricing</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Bundle Title & Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Bundle / Kit Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Executive Workstation Starter Kit"
                value={bundleName}
                onChange={e => setBundleName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Bundle Price ($ AUD) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-mono font-bold"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Kit Description</label>
            <input
              type="text"
              placeholder="e.g. Includes ThinkPad Laptop + USB-C Dock + 27'' Monitor"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Component Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Add Child Component Products ({components.length})
              </label>
              <select
                onChange={e => {
                  if (e.target.value) {
                    handleAddComponent(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-3 py-1.5 text-xs rounded-xl border border-blue-500 bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300 font-bold"
              >
                <option value="">+ Select Catalog Component...</option>
                {nonBundleProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.price.toFixed(2)}) — Stock: {p.stock}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Components Table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              {components.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  No components selected yet. Select products above to build your bundle.
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-900 font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5">Component Product</th>
                      <th className="p-2.5 text-center">Qty / Kit</th>
                      <th className="p-2.5 text-right">Retail Unit</th>
                      <th className="p-2.5 text-right">Total</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {components.map(comp => (
                      <tr key={comp.productId} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                        <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{comp.productName}</td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min={1}
                            value={comp.quantity}
                            onChange={e => handleUpdateQuantity(comp.productId, Number(e.target.value))}
                            className="w-14 text-center px-1 py-0.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 font-bold"
                          />
                        </td>
                        <td className="p-2.5 text-right font-mono">${comp.unitPrice.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono font-bold">${(comp.unitPrice * comp.quantity).toFixed(2)}</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveComponent(comp.productId)}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Pricing & Savings Summary Card */}
          {components.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Bundle Financial Summary</span>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Retail Value: <strong className="font-mono">${retailTotal.toFixed(2)}</strong> | Bundle Price: <strong className="font-mono text-emerald-600 dark:text-emerald-400">${price.toFixed(2)}</strong>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider bg-emerald-600 text-white rounded-lg shadow-sm">
                  Save ${savings.toFixed(2)} ({savingsPercent.toFixed(0)}% OFF)
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Package className="w-4 h-4" />
              Save Bundle SKU
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
