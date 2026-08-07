import React from 'react';
import { Product } from '../types';
import { getCategoryHardwareInfo, HARDWARE_CATEGORY_CATALOG } from '../constants/categoryImages';
import { ArrowLeft, ArrowRight, Layers } from 'lucide-react';

interface ShopByCategoryGridProps {
  products: Product[];
  onSelectCategory: (categoryName: string) => void;
  activeCategory: string;
  eyebrow?: string;
  title?: string;
  description?: string;
}

export const ShopByCategoryGrid: React.FC<ShopByCategoryGridProps> = ({
  products,
  onSelectCategory,
  activeCategory,
  eyebrow = 'Quick Navigation',
  title = 'Shop by Category',
  description = 'Real-time dynamic category catalog mapped to store inventory',
}) => {
  const categoryRailRef = React.useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = React.useState(false);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = React.useState(false);

  // Dynamically compute category counts from active tenant's inventory
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Combine categories present in tenant's inventory with catalog defaults
  const availableCategories = React.useMemo(() => {
    const presentCategoryNames = Object.keys(categoryCounts);

    // If tenant has inventory categories, prioritize those
    const allCatNames = Array.from(
      new Set([...presentCategoryNames, ...Object.keys(HARDWARE_CATEGORY_CATALOG)])
    );

    return allCatNames
      .map((catName) => {
        const info = getCategoryHardwareInfo(catName);
        const count = categoryCounts[catName] || 0;
        return {
          ...info,
          count,
        };
      })
      // Show only categories that are present in the tenant's inventory (or top hardware categories if loading)
      .filter((cat) => cat.count > 0 || presentCategoryNames.length === 0);
  }, [categoryCounts]);

  React.useEffect(() => {
    const rail = categoryRailRef.current;
    if (!rail) return;
    const updateOverflow = () => setHasOverflow(rail.scrollWidth > rail.clientWidth + 2);
    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(rail);
    Array.from(rail.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [availableCategories.length]);

  React.useEffect(() => {
    const rail = categoryRailRef.current;
    if (!rail || !hasOverflow || isAutoScrollPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let animationFrame = 0;
    let previousTime = performance.now();
    const moveRightToLeft = (time: number) => {
      const elapsed = Math.min(time - previousTime, 50);
      previousTime = time;
      const maximumScroll = rail.scrollWidth - rail.clientWidth;
      if (rail.scrollLeft >= maximumScroll - 1) {
        rail.scrollLeft = 0;
      } else {
        rail.scrollLeft += elapsed * 0.025;
      }
      animationFrame = requestAnimationFrame(moveRightToLeft);
    };
    animationFrame = requestAnimationFrame(moveRightToLeft);
    return () => cancelAnimationFrame(animationFrame);
  }, [hasOverflow, isAutoScrollPaused, availableCategories.length]);

  const scrollCategories = (direction: -1 | 1) => {
    categoryRailRef.current?.scrollBy({ left: direction * 420, behavior: 'smooth' });
  };

  if (availableCategories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" id="category-real-images-section">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-blue-600 font-extrabold mb-1 block">
            {eyebrow}
          </span>
          <h2 className="font-sans text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            {title}
          </h2>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>{availableCategories.length} Active Categories</span>
          </div>
          {hasOverflow && (
            <div className="flex items-center gap-1" aria-label="Category carousel controls">
              <button type="button" onClick={() => scrollCategories(-1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900 hover:text-black" aria-label="Show previous categories"><ArrowLeft className="h-4 w-4" /></button>
              <button type="button" onClick={() => scrollCategories(1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900 hover:text-black" aria-label="Show more categories"><ArrowRight className="h-4 w-4" /></button>
            </div>
          )}
        </div>
      </div>

      <div
        ref={categoryRailRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 scrollbar-none"
        onMouseEnter={() => setIsAutoScrollPaused(true)}
        onMouseLeave={() => setIsAutoScrollPaused(false)}
        onFocusCapture={() => setIsAutoScrollPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsAutoScrollPaused(false);
        }}
        onTouchStart={() => setIsAutoScrollPaused(true)}
        onTouchEnd={() => setIsAutoScrollPaused(false)}
        aria-label="Shop by category"
      >
        {availableCategories.map((cat) => {
          const isSelected = activeCategory === cat.label || activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.label)}
              className={`group relative h-48 w-[78vw] max-w-[210px] min-w-[170px] flex-none snap-start rounded-2xl overflow-hidden shadow-md border transition-all duration-300 text-left flex flex-col justify-end p-4 sm:w-[210px] ${
                isSelected
                  ? 'border-blue-600 ring-4 ring-blue-500/20 scale-[1.02]'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1'
              }`}
            >
              {/* Real Category Background Image */}
              <div className="absolute inset-0 bg-neutral-900 z-0">
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                {/* Gradient Vignette Overlay for High Contrast Text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95 transition-colors" />
              </div>

              {/* Top Item Count Badge */}
              <div className="absolute top-3 right-3 z-10">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-600/90 text-white font-mono text-[10px] font-extrabold shadow-sm backdrop-blur-xs">
                  {cat.count} {cat.count === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              {/* Bottom Content Area */}
              <div className="relative z-10 space-y-1">
                <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight leading-tight group-hover:text-blue-300 transition-colors flex items-center justify-between">
                  <span>{cat.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400" />
                </h3>
                <p className="text-[10px] text-neutral-300 line-clamp-1 font-medium hidden sm:block">
                  {cat.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
