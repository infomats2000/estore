import React from 'react';
import { Heart, Plus, Tag } from 'lucide-react';
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
  variant?: 'classic' | 'compact' | 'minimal' | 'list';
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
  customerProfile,
  variant = 'classic'
}: ProductCardProps) {
  
  const hasDiscount = product.discountPrice !== undefined && product.discountPrice < product.price;
  const savings = hasDiscount ? product.price - (product.discountPrice || 0) : 0;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock < 5;
  const specList = Object.entries(product.specs || {}).slice(0, 3);

  return (
    <div 
      className={`group relative flex min-w-0 flex-col overflow-hidden bg-white dark:bg-neutral-900 transition-all hover:shadow-lg ${
        variant === 'list'
          ? 'rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700'
          : variant === 'minimal'
            ? 'border-0 bg-transparent dark:bg-transparent hover:shadow-none'
            : variant === 'compact'
              ? 'rounded-xl border border-slate-200 shadow-sm hover:-translate-y-1 dark:border-slate-800'
              : 'border border-neutral-400 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-amber-400'
      }`}
      id={`product-card-${product.id}`}
    >
      {/* Badges and card actions remain in normal flow so they never cover imagery. */}
      <div className={`flex min-w-0 flex-wrap items-start justify-between gap-2 ${
        variant === 'minimal'
          ? 'order-2 border-0 px-1 pb-2 pt-0'
          : variant === 'compact'
            ? 'border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950'
            : variant === 'list'
              ? 'border-b border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-neutral-900'
              : 'border-b border-neutral-100 p-3 dark:border-neutral-800'
      }`}>
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          {/* Grade Badge */}
          <span className={`${variant === 'minimal' || variant === 'compact' ? 'hidden' : ''} rounded-md bg-slate-900 px-2.5 py-1 font-sans text-xs font-bold tracking-wide text-amber-300 uppercase shadow-sm border border-amber-400/40`}>
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
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {onToggleCompare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(product);
              }}
              className={`flex items-center justify-center rounded-lg border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 transition-colors ${variant === 'compact' ? 'h-8 w-8' : 'h-9 w-9'} ${
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
            className={`flex items-center justify-center rounded-lg border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 transition-colors ${variant === 'compact' ? 'h-8 w-8' : 'h-9 w-9'} ${
              isWishlisted ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            id={`wishlist-btn-${product.id}`}
          >
            <Heart className={`h-4.5 w-4.5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div className={`flex min-h-0 min-w-0 flex-1 ${variant === 'list' ? 'order-1 flex-col md:flex-row' : variant === 'minimal' ? 'order-1 flex-col' : 'order-2 flex-col'}`}>
      {/* Main Product Image Container */}
      <div 
        onClick={() => onOpenDetails(product)}
        className={`relative cursor-pointer overflow-hidden bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center border-neutral-100 dark:border-neutral-700 ${
          variant === 'list'
            ? 'aspect-4/3 w-full p-5 md:aspect-auto md:min-h-64 md:w-72 md:shrink-0 md:border-r'
            : variant === 'compact'
              ? 'aspect-square w-full border-b p-3'
              : variant === 'minimal'
                ? 'aspect-square w-full rounded-2xl bg-slate-100 p-8 dark:bg-slate-950'
                : 'aspect-4/3 w-full border-b p-4'
        }`}
        id={`product-img-click-${product.id}`}
      >
        <img
          src={product.imageVariants?.catalog || product.image || undefined}
          srcSet={product.imageVariants ? `${product.imageVariants.thumbnail} 320w, ${product.imageVariants.catalog} 800w, ${product.imageVariants.detail} 1600w` : undefined}
          sizes={variant === 'list' ? '(min-width: 768px) 288px, 100vw' : '(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw'}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          id={`img-${product.id}`}
        />
      </div>

      {/* Product Information Body */}
      <div className={`flex flex-1 flex-col ${variant === 'minimal' ? 'bg-transparent px-1 pb-3 pt-4 dark:bg-transparent' : variant === 'compact' ? 'bg-white p-3 dark:bg-neutral-900' : variant === 'list' ? 'bg-white p-5 md:justify-center md:p-7 dark:bg-neutral-900' : 'bg-white p-4 dark:bg-neutral-900'}`}>
        {/* Product Title */}
        <h3 
          onClick={() => onOpenDetails(product)}
          className={`mb-2.5 cursor-pointer break-words text-left font-sans text-neutral-900 transition-colors hover:text-indigo-600 dark:text-neutral-100 dark:hover:text-indigo-400 ${
            variant === 'list'
              ? 'text-xl font-black leading-tight tracking-tight'
              : variant === 'compact'
                ? 'text-xs font-extrabold uppercase leading-snug tracking-tight'
                : variant === 'minimal'
                  ? 'text-base font-semibold leading-snug'
                  : 'text-sm font-extrabold uppercase leading-snug tracking-tight'
          }`}
          id={`title-${product.id}`}
        >
          {product.name}
        </h3>

        {variant === 'list' && specList.length > 0 && (
          <dl className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {specList.map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
                <dt className="truncate font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
                <dd className="mt-0.5 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* Price & Action button */}
        {(() => {
          const b2bCalc = calculateEffectivePrice(product, customerProfile, 1);

          return (
            <div className={`mt-auto flex gap-3 border-t border-slate-100 pt-3 dark:border-slate-800 ${variant === 'compact' ? 'flex-col items-stretch' : 'flex-wrap items-end justify-between'}`}>
              <div className="min-w-0 text-left font-sans" id={`price-${product.id}`}>
                {b2bCalc.tierApplied ? (
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className={`${variant === 'list' ? 'text-2xl' : variant === 'compact' ? 'text-base' : 'text-xl'} font-black text-indigo-600 dark:text-indigo-400`}>${b2bCalc.unitPrice.toFixed(2)}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 line-through font-semibold">${product.price.toFixed(2)}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 mt-1">
                      <Tag className="h-2.5 w-2.5" /> {b2bCalc.tierApplied} B2B Price
                    </span>
                  </div>
                ) : hasDiscount ? (
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className={`${variant === 'list' ? 'text-2xl' : variant === 'compact' ? 'text-base' : 'text-xl'} font-black text-emerald-600 dark:text-emerald-400`}>${product.discountPrice?.toFixed(2)}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 line-through font-semibold">${product.price.toFixed(2)}</span>
                  </div>
                ) : (
                  <span className={`${variant === 'list' ? 'text-2xl' : variant === 'compact' ? 'text-base' : 'text-xl'} font-black text-slate-900 dark:text-white`}>${product.price.toFixed(2)}</span>
                )}
              </div>

              {/* Action buttons group */}
              <div className={`flex shrink-0 items-center gap-2 ${variant === 'compact' ? 'justify-end' : ''}`}>
                {/* Buy Now Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onBuyNow) onBuyNow(product);
                  }}
                  disabled={isOutOfStock}
                  className={`flex items-center justify-center font-sans font-extrabold uppercase tracking-wider disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 ${variant === 'minimal' ? 'h-9 border-b-2 border-slate-900 bg-transparent px-0 text-[10px] text-slate-900 hover:border-indigo-600 hover:text-indigo-600 dark:border-white dark:text-white' : variant === 'compact' ? 'h-8 rounded-md bg-slate-900 px-2 text-[9px] text-white hover:bg-indigo-600 dark:bg-white dark:text-slate-900' : variant === 'list' ? 'h-10 rounded-full bg-indigo-600 px-5 text-xs text-white hover:bg-indigo-700' : 'h-9 rounded-lg bg-slate-900 px-3 text-xs text-white shadow-sm hover:bg-indigo-600 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'}`}
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
                  className={`flex items-center justify-center border border-slate-300 bg-white text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 ${variant === 'list' ? 'h-10 w-10 rounded-full' : variant === 'minimal' ? 'h-9 w-9 rounded-full shadow-none' : variant === 'compact' ? 'h-8 w-8 rounded-md shadow-sm' : 'h-9 w-9 rounded-lg shadow-sm'}`}
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
    </div>
  );
}
