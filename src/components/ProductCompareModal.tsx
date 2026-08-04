import React, { useState } from 'react';
import { X, Check, ShoppingBag, ArrowRightLeft, Star, ShieldCheck, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface ProductCompareModalProps {
  compareList: Product[];
  onClose: () => void;
  onRemoveFromCompare: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onClearCompare: () => void;
}

export default function ProductCompareModal({
  compareList,
  onClose,
  onRemoveFromCompare,
  onAddToCart,
  onClearCompare
}: ProductCompareModalProps) {
  const [highlightDifferences, setHighlightDifferences] = useState(false);

  if (compareList.length === 0) return null;

  // Extract all unique spec keys across compared products
  const allSpecKeys = Array.from(
    new Set(
      compareList.flatMap(p => Object.keys(p.specs || {}))
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="compare-modal-overlay">
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
        id="compare-modal-backdrop" 
      />

      <div className="relative flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden bg-white border border-neutral-400 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-300 bg-neutral-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-blue-600">
              <ArrowRightLeft className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">
                Product Specification Comparison ({compareList.length}/4)
              </h3>
              <p className="font-sans text-xs text-neutral-400">
                Compare technical specs side-by-side to make the right buying decision
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-neutral-300 font-mono uppercase cursor-pointer select-none">
              <input
                type="checkbox"
                checked={highlightDifferences}
                onChange={(e) => setHighlightDifferences(e.target.checked)}
                className="h-4 w-4 rounded-none accent-blue-600 cursor-pointer"
              />
              Highlight Spec Differences
            </label>

            <button
              onClick={onClearCompare}
              className="text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white underline transition-colors"
            >
              Clear All
            </button>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center border border-neutral-700 bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Table Container */}
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="w-48 bg-neutral-100 p-4 border border-neutral-300 font-mono text-xs uppercase font-bold text-neutral-700">
                  Feature / Spec
                </th>
                {compareList.map(product => (
                  <th key={product.id} className="min-w-[220px] bg-white p-4 border border-neutral-300 align-top">
                    <div className="relative group">
                      <button
                        onClick={() => onRemoveFromCompare(product.id)}
                        className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-colors"
                        title="Remove product"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      <div className="h-36 w-full overflow-hidden bg-neutral-50 border border-neutral-200 flex items-center justify-center mb-3">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="h-full w-full object-contain p-2"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <span className="inline-block px-2 py-0.5 text-[9px] font-mono uppercase font-bold bg-neutral-200 text-neutral-800 mb-1">
                        {product.category}
                      </span>
                      <h4 className="font-sans text-sm font-bold text-neutral-900 line-clamp-2 mb-2">
                        {product.name}
                      </h4>

                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="font-mono text-base font-black text-neutral-900">
                          ${product.discountPrice || product.price}
                        </span>
                        {product.discountPrice && (
                          <span className="font-mono text-xs text-neutral-400 line-through">
                            ${product.price}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => onAddToCart(product)}
                        className="w-full flex items-center justify-center gap-2 bg-neutral-900 text-white px-3 py-2 font-mono text-xs uppercase font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Add To Cart
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-sans text-xs">
              {/* Rating Row */}
              <tr>
                <td className="bg-neutral-50 p-4 font-mono font-bold text-neutral-700 border border-neutral-300">
                  Rating
                </td>
                {compareList.map(p => (
                  <td key={p.id} className="p-4 border border-neutral-300">
                    <div className="flex items-center gap-1 font-bold text-neutral-900">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span>{p.rating}</span>
                      <span className="text-neutral-400 font-normal">({p.reviewsCount} reviews)</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Stock Status Row */}
              <tr>
                <td className="bg-neutral-50 p-4 font-mono font-bold text-neutral-700 border border-neutral-300">
                  Availability
                </td>
                {compareList.map(p => (
                  <td key={p.id} className="p-4 border border-neutral-300">
                    {p.stock > 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-1 border border-emerald-200">
                        <Check className="h-3.5 w-3.5" /> In Stock ({p.stock} units)
                      </span>
                    ) : (
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-1 border border-rose-200">
                        Out of Stock
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Dynamic Specs Rows */}
              {allSpecKeys.map(specKey => {
                const values = compareList.map(p => p.specs[specKey] || '-');
                const isDifferent = new Set(values).size > 1;

                return (
                  <tr 
                    key={specKey}
                    className={highlightDifferences && isDifferent ? 'bg-amber-50/70' : ''}
                  >
                    <td className="bg-neutral-50 p-4 font-mono font-bold text-neutral-700 border border-neutral-300">
                      {specKey}
                    </td>
                    {compareList.map(p => (
                      <td key={p.id} className="p-4 border border-neutral-300 font-medium text-neutral-800">
                        {p.specs[specKey] || <span className="text-neutral-400">-</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}

              {/* Tags / Badges Row */}
              <tr>
                <td className="bg-neutral-50 p-4 font-mono font-bold text-neutral-700 border border-neutral-300">
                  Condition / Tags
                </td>
                {compareList.map(p => (
                  <td key={p.id} className="p-4 border border-neutral-300">
                    <div className="flex flex-wrap gap-1">
                      {p.tags.map(t => (
                        <span key={t} className="bg-neutral-100 text-neutral-800 border border-neutral-300 text-[10px] font-mono px-1.5 py-0.5">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
