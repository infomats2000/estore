import React from 'react';
import { Heart, Star, Plus, Eye, Shield, Check, Tag } from 'lucide-react';
import { Product, CustomerProfile } from '../types';
import { calculateEffectivePrice } from '../utils/pricing';

interface ProductCardProps {
  product: Product;
  onQuickAdd: (product: Product) => void;
  onOpenDetails: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onBuyNow?: (product: Product) => void;
  onToggleCompare?: (product: Product) => void;
  isCompared?: boolean;
  customerProfile?: CustomerProfile;
}

export default function ProductCard({
  product,
  onQuickAdd,
  onOpenDetails,
  isWishlisted,
  onToggleWishlist,
  onBuyNow,
  onToggleCompare,
  isCompared = false,
  customerProfile
}: ProductCardProps) {
  
  const hasDiscount = product.discountPrice !== undefined && product.discountPrice < product.price;
  const savings = hasDiscount ? product.price - (product.discountPrice || 0) : 0;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock < 5;

  // Extract key specs for display on card
  const specList = Object.entries(product.specs || {}).slice(0, 3);

  return (
    <div 
      className="group relative flex flex-col overflow-hidden border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 transition-all hover:shadow-lg hover:border-neutral-900 dark:hover:border-amber-400"
      id={`product-card-${product.id}`}
    >
      {/* Top Badges */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-start justify-between pointer-events-none">
        <div className="flex flex-col gap-1 items-start">
          {/* Grade Badge */}
          <span className="rounded-md bg-slate-900 px-2.5 py-1 font-sans text-xs font-bold tracking-wide text-amber-300 uppercase shadow-sm border border-amber-400/40">
            GRADE A REFURBISHED
          </span>

          {hasDiscount && (
            <span className="rounded-md bg-emerald-700 px-2.5 py-1 font-sans text-xs font-bold tracking-wide text-white uppercase shadow-sm">
              SAVE ${savings.toFixed(0)} AUD
            </span>
          )}

          {isOutOfStock && (
            <span className="rounded-md bg-slate-700 px-2.5 py-1 font-sans text-xs font-bold tracking-wide text-white uppercase">
              OUT OF STOCK
            </span>
          )}
          {isLowStock && (
            <span className="rounded-md bg-rose-600 px-2.5 py-1 font-sans text-xs font-bold tracking-wide text-white uppercase" id={`low-stock-badge-${product.id}`}>
              ONLY {product.stock} LEFT
            </span>
          )}
        </div>

        {/* Top Right Action Buttons: Wishlist & Compare */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          {onToggleCompare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(product);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-400 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 transition-colors ${
                isCompared ? 'bg-blue-600 text-white font-black' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
              title={isCompared ? "Remove from Comparison" : "Add to Compare"}
            >
              <span className="font-mono text-[10px] font-black">VS</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-400 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 transition-colors ${
              isWishlisted ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            id={`wishlist-btn-${product.id}`}
          >
            <Heart className={`h-4.5 w-4.5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Product Image Container */}
      <div 
        onClick={() => onOpenDetails(product)}
        className="relative aspect-4/3 w-full cursor-pointer overflow-hidden bg-neutral-50 dark:bg-neutral-950 p-4 flex items-center justify-center border-b border-neutral-100 dark:border-neutral-700"
        id={`product-img-click-${product.id}`}
      >
        <img
          src={product.image || null}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          id={`img-${product.id}`}
        />
        
        {/* Quick View Overlay Button */}
        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(product);
            }}
            className="flex items-center gap-2 bg-slate-900 text-white border border-slate-700 px-4 py-2.5 rounded-xl font-sans text-xs font-bold tracking-wider uppercase shadow-xl hover:bg-indigo-600 hover:border-indigo-500 transition-all"
            id={`quick-view-btn-${product.id}`}
          >
            <Eye className="h-4 w-4" />
            Specs & Quick View
          </button>
        </div>
      </div>

      {/* Product Information Body */}
      <div className="flex flex-1 flex-col p-4 bg-white dark:bg-neutral-900">
        {/* Product Title */}
        <h3 
          onClick={() => onOpenDetails(product)}
          className="mb-2.5 cursor-pointer text-left font-sans text-sm font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight transition-colors line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase leading-snug"
          id={`title-${product.id}`}
        >
          {product.name}
        </h3>

        {/* Price & Action button */}
        {(() => {
          const b2bCalc = calculateEffectivePrice(product, customerProfile, 1);

          return (
            <div className="mt-auto flex items-end justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-left font-sans" id={`price-${product.id}`}>
                {b2bCalc.tierApplied ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">${b2bCalc.unitPrice.toFixed(2)}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 line-through font-semibold">${product.price.toFixed(2)}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 mt-1">
                      <Tag className="h-2.5 w-2.5" /> {b2bCalc.tierApplied} B2B Price
                    </span>
                  </div>
                ) : hasDiscount ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">${product.discountPrice?.toFixed(2)}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 line-through font-semibold">${product.price.toFixed(2)}</span>
                  </div>
                ) : (
                  <span className="text-xl font-black text-slate-900 dark:text-white">${product.price.toFixed(2)}</span>
                )}
              </div>

              {/* Action buttons group */}
              <div className="flex items-center gap-2">
                {/* Buy Now Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onBuyNow) onBuyNow(product);
                  }}
                  disabled={isOutOfStock}
                  className="flex h-9 px-3 items-center justify-center rounded-lg bg-slate-900 dark:bg-white font-sans text-xs font-extrabold uppercase tracking-wider text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-slate-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors shadow-sm"
                  title="Buy Now (Instant Checkout)"
                  id={`buy-now-${product.id}`}
                >
                  Buy Now
                </button>
                {/* Add to Cart Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAdd(product);
                  }}
                  disabled={isOutOfStock}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-sm"
                  title="Add to Cart"
                  id={`quick-add-${product.id}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

