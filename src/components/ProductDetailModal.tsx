import React, { useState, useEffect } from 'react';
import { X, Star, Heart, ShoppingBag, Check, ShieldCheck, Truck, RotateCcw, Link, Facebook, Twitter, MessageCircle, Bell, BellOff, Tag, Layers } from 'lucide-react';
import { Product, Review, CustomerProfile } from '../types';
import { calculateEffectivePrice } from '../utils/pricing';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, color?: string, size?: string) => void;
  reviews: Review[];
  onAddReview: (productId: string, rating: number, comment: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  isNotifiedPriceDrop: boolean;
  onTogglePriceDropNotification: (productId: string) => void;
  onBuyNow?: (product: Product, quantity: number, color?: string, size?: string) => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  customerProfile?: CustomerProfile;
}

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  reviews,
  onAddReview,
  isWishlisted,
  onToggleWishlist,
  isNotifiedPriceDrop,
  onTogglePriceDropNotification,
  onBuyNow,
  products,
  onSelectProduct,
  customerProfile
}: ProductDetailModalProps) {
  
  const [selectedImage, setSelectedImage] = useState<string>(product?.image || '');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  
  // Review form state
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string>('');

  // Share states
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  // Zoom states
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  // Reset states when product changes
  useEffect(() => {
    if (product) {
      setSelectedImage(product.image);
      setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : '');
      setSelectedSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : '');
      setQuantity(1);
      setNewRating(5);
      setNewComment('');
      setReviewSuccessMsg('');
      setCopied(false);
      setShareStatus(null);
      setIsZooming(false);
    }
  }, [product]);

  // Calculate similarity scores for other products
  const similarProducts = React.useMemo(() => {
    if (!product || !products) return [];

    // Filter out current product and compute scores
    const scored = products
      .filter((p) => p.id !== product.id)
      .map((p) => {
        let score = 0;
        // Category match is highly relevant
        if (p.category === product.category) {
          score += 5;
        }
        // Match tags
        if (p.tags && product.tags) {
          const commonTags = p.tags.filter((t) => product.tags.includes(t));
          score += commonTags.length * 2;
        }
        return { product: p, score };
      });

    // Extract products with positive similarity scores, sorted descending
    let matched = scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating)
      .map((item) => item.product);

    // Backfill with top-rated products if fewer than 3 similar products exist
    if (matched.length < 3) {
      const matchedIds = new Set(matched.map((m) => m.id));
      const fallbacks = products
        .filter((p) => p.id !== product.id && !matchedIds.has(p.id))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3 - matched.length);
      matched = [...matched, ...fallbacks];
    }

    return matched.slice(0, 3);
  }, [product, products]);

  if (!product) return null;

  const productReviews = reviews.filter(r => r.productId === product.id);
  const averageRating = productReviews.length > 0
    ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
    : product.rating.toFixed(1);

  const isOutOfStock = product.stock <= 0;
  const imageList = [product.image, ...(product.additionalImages || [])];

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    onAddReview(product.id, newRating, newComment);
    setNewComment('');
    setReviewSuccessMsg('Thank you! Your verified review has been submitted.');
    setTimeout(() => setReviewSuccessMsg(''), 4000);
  };

  const handleCopyLink = () => {
    const fakeUrl = `${window.location.origin}/product/${product.id}`;
    navigator.clipboard.writeText(fakeUrl).then(() => {
      setCopied(true);
      setShareStatus('Product link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setShareStatus(null), 3000);
    }).catch(() => {
      setShareStatus('Failed to copy product link.');
      setTimeout(() => setShareStatus(null), 2000);
    });
  };

  const handleShareAction = (platform: string) => {
    setShareStatus(`Sharing to ${platform}...`);
    setTimeout(() => {
      setShareStatus(`Shared successfully to ${platform}!`);
      setTimeout(() => setShareStatus(null), 3000);
    }, 1200);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="detail-modal-overlay">
      {/* Dark overlay backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" 
        id="detail-modal-backdrop"
      />

      {/* Modal Container */}
      <div 
        className="relative flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-none bg-white border border-neutral-400 shadow-xl animate-fade-in md:flex-row"
        id="detail-modal-container"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-none border border-neutral-400 bg-white/95 text-neutral-500 hover:text-neutral-900 transition-colors"
          id="detail-modal-close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* LEFT COLUMN: Media Gallery */}
        <div className="w-full md:w-1/2 flex flex-col bg-neutral-50/50 p-6 md:p-8" id="modal-gallery-section">
          {/* Main Image Display */}
          <div 
            className="relative aspect-square w-full overflow-hidden rounded-none bg-white border border-neutral-400 flex items-center justify-center cursor-zoom-in"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            id="main-detail-image-container"
          >
            <img
              src={selectedImage || undefined}
              alt={product.name}
              className="max-h-full max-w-full object-contain p-2 select-none pointer-events-none"
              decoding="async"
              style={{
                transform: isZooming ? 'scale(2.2)' : 'scale(1)',
                transformOrigin: isZooming ? `${zoomPos.x}% ${zoomPos.y}%` : 'center',
                transition: isZooming ? 'none' : 'transform 0.25s ease-out',
              }}
              referrerPolicy="no-referrer"
              id="main-detail-image"
            />
          </div>

          {/* Thumbnail Strip */}
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1" id="thumbnail-gallery">
            {imageList.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`relative aspect-square w-16 flex-shrink-0 overflow-hidden rounded-none bg-white border-2 transition-all ${
                  selectedImage === img ? 'border-neutral-950 scale-102' : 'border-neutral-400 opacity-70 hover:opacity-100'
                }`}
                id={`thumbnail-btn-${idx}`}
              >
                <img
                  src={img || undefined}
                  alt={`view-${idx}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>

          {/* Guarantees Box */}
          <div className="mt-6 hidden md:grid grid-cols-3 gap-3 border-t border-neutral-400 pt-6 font-sans text-xs uppercase tracking-wider text-slate-600 font-bold">
            <div className="flex flex-col items-center text-center gap-1">
              <Truck className="h-5 w-5 text-slate-800" />
              <span>Free Delivery</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1 border-x border-neutral-400 px-2">
              <RotateCcw className="h-5 w-5 text-slate-800" />
              <span>30-Day Returns</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1">
              <ShieldCheck className="h-5 w-5 text-slate-800" />
              <span>Secure Warranty</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Options, Info & Reviews */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8" id="modal-info-section">
          {/* Header */}
          <div className="text-left">
            <span className="font-sans text-xs text-indigo-600 dark:text-indigo-400 tracking-wider uppercase font-extrabold">{product.category}</span>
            <h2 className="mt-1 font-sans text-xl md:text-2xl font-black text-neutral-900 tracking-tight uppercase leading-snug" id="modal-product-title">
              {product.name}
            </h2>

            {/* Ratings Summary */}
            <div className="mt-3 flex items-center gap-4 border-b border-neutral-400 pb-4">
              <div className="flex items-center gap-1.5">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(Number(averageRating)) ? 'fill-current' : 'text-neutral-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-sans text-sm font-black text-neutral-800">{averageRating}</span>
              </div>
              <span className="font-sans text-xs uppercase font-bold tracking-wider text-slate-500">{productReviews.length} Verified Customer Reviews</span>
            </div>
          </div>

          {/* Pricing & Stock Status */}
          {(() => {
            const b2bCalc = calculateEffectivePrice(product, customerProfile, quantity);
            return (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-left font-sans">
                    <span className="text-xs text-slate-400 uppercase tracking-wider block font-bold">
                      {b2bCalc.discountLabel ? b2bCalc.discountLabel : 'Price'}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-neutral-950">${b2bCalc.unitPrice.toFixed(2)}</span>
                      {b2bCalc.unitPrice < product.price && (
                        <span className="text-sm text-neutral-400 line-through font-semibold">${product.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right font-sans">
                    <span className="text-xs text-slate-400 uppercase tracking-wider block font-bold">Availability</span>
                    {isOutOfStock ? (
                      <span className="text-sm font-bold text-red-600 uppercase tracking-wider">Out of Stock</span>
                    ) : (
                      <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">
                        {product.stock} Units In Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Volume Discount Schedule Banner */}
                {product.volumeDiscounts && product.volumeDiscounts.length > 0 && (
                  <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 p-3 text-left">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300">
                      <Layers className="h-3.5 w-3.5 text-indigo-600" /> B2B Volume Pricing Schedule
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 font-mono text-[9px]">
                      {product.volumeDiscounts.map((vBreak, idx) => (
                        <span key={idx} className="bg-white dark:bg-indigo-900 px-2 py-1 border border-indigo-200 dark:border-indigo-700 font-bold text-indigo-900 dark:text-indigo-100">
                          Buy {vBreak.minQty}+: {vBreak.discountPercent}% OFF (${(b2bCalc.unitPrice * (1 - (vBreak.discountPercent || 0)/100)).toFixed(2)} ea)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Product Long Description */}
          <p className="mt-5 text-left font-sans text-sm leading-relaxed text-neutral-600">
            {product.description}
          </p>

          {/* Dynamic Variant Chooser */}
          <div className="mt-6 space-y-4 border-t border-neutral-400 pt-5">
            {/* Colors Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="text-left">
                <span className="font-sans text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Select Color: <span className="text-neutral-900 font-sans normal-case font-bold">{selectedColor}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`flex items-center gap-1 rounded-md border px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-wider transition-all ${
                        selectedColor === color
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-400 bg-white text-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      {selectedColor === color && <Check className="h-3.5 w-3.5" />}
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="text-left">
                <span className="font-sans text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Select Option / Size: <span className="text-neutral-900 font-sans normal-case font-bold">{selectedSize}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-md border px-3.5 py-1.5 font-sans text-xs font-bold uppercase tracking-wider transition-all ${
                        selectedSize === size
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-400 bg-white text-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quantity selector & Add to Cart Action */}
          <div className="mt-6 flex flex-wrap items-end gap-4 border-b border-neutral-400 pb-6" id="add-to-cart-section">
            <div className="text-left">
              <span className="font-sans text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Quantity</span>
              <div className="flex h-11 w-28 items-center justify-between rounded-lg border border-neutral-400 bg-white px-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-7 w-7 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors font-bold"
                  id="qty-minus"
                >
                  -
                </button>
                <span className="font-sans text-sm font-black text-neutral-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="h-7 w-7 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors font-bold"
                  disabled={quantity >= product.stock}
                  id="qty-plus"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex-1 min-w-[200px] flex gap-2">
              <button
                onClick={() => {
                  onAddToCart(product, quantity, selectedColor, selectedSize);
                  onClose();
                }}
                disabled={isOutOfStock}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-neutral-900 font-sans text-xs font-extrabold uppercase tracking-wider text-white transition-colors hover:bg-indigo-600 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed px-3 shadow-md"
                id="add-to-cart-confirm"
              >
                <ShoppingBag className="h-4 w-4" />
                ADD TO BAG
              </button>

              {onBuyNow && (
                <button
                  onClick={() => {
                    onBuyNow(product, quantity, selectedColor, selectedSize);
                  }}
                  disabled={isOutOfStock}
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 font-sans text-xs font-extrabold uppercase tracking-wider text-white transition-colors hover:bg-indigo-700 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed px-3 shadow-md"
                  id="buy-now-confirm"
                >
                  BUY NOW
                </button>
              )}

              <button
                onClick={() => onTogglePriceDropNotification(product.id)}
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border transition-colors ${
                  isNotifiedPriceDrop
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                    : 'border-neutral-400 text-neutral-400 hover:border-neutral-400 hover:text-neutral-600'
                }`}
                title={isNotifiedPriceDrop ? "Remove price drop notification" : "Notify me of price drop"}
              >
                {isNotifiedPriceDrop ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              </button>

              <button
                onClick={() => onToggleWishlist(product.id)}
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border transition-colors ${
                  isWishlisted
                    ? 'border-neutral-900 bg-neutral-100 text-neutral-950'
                    : 'border-neutral-400 text-neutral-400 hover:border-neutral-400 hover:text-neutral-600'
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current text-neutral-900' : ''}`} />
              </button>
            </div>
          </div>

          {/* Social Sharing Section */}
          <div className="mt-6 border-t border-b border-neutral-400 py-4 text-left" id="social-share-container">
            <span className="font-sans text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
              Share this product
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {/* Copy Link Button */}
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 rounded-md border border-neutral-400 bg-white px-3 py-2 font-sans text-xs font-bold uppercase tracking-wider text-neutral-800 transition-colors hover:bg-neutral-50"
                id="share-copy-link"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Link className="h-3.5 w-3.5 text-neutral-500" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              {/* Share to X */}
              <button
                onClick={() => handleShareAction('X')}
                className="flex items-center gap-1.5 rounded-md border border-neutral-400 bg-white px-3 py-2 font-sans text-xs font-bold uppercase tracking-wider text-neutral-800 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                id="share-platform-x"
                title="Share on X"
              >
                <Twitter className="h-3.5 w-3.5 text-[#1a1a1a]" />
                <span>Share on X</span>
              </button>

              {/* Share to Facebook */}
              <button
                onClick={() => handleShareAction('Facebook')}
                className="flex items-center gap-1.5 rounded-md border border-neutral-400 bg-white px-3 py-2 font-sans text-xs font-bold uppercase tracking-wider text-neutral-800 transition-colors hover:bg-neutral-50 hover:text-blue-600"
                id="share-platform-facebook"
                title="Share on Facebook"
              >
                <Facebook className="h-3.5 w-3.5 text-[#1877F2]" />
                <span>Facebook</span>
              </button>

              {/* Share to WhatsApp */}
              <button
                onClick={() => handleShareAction('WhatsApp')}
                className="flex items-center gap-1.5 rounded-md border border-neutral-400 bg-white px-3 py-2 font-sans text-xs font-bold uppercase tracking-wider text-neutral-800 transition-colors hover:bg-neutral-50 hover:text-emerald-600"
                id="share-platform-whatsapp"
                title="Share on WhatsApp"
              >
                <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                <span>WhatsApp</span>
              </button>
            </div>

            {/* Share Status Banner */}
            {shareStatus && (
              <div 
                className="mt-3 rounded-md bg-slate-900 px-3 py-2 font-sans text-xs font-bold uppercase tracking-wider text-white animate-pulse"
                id="share-status-banner"
              >
                {shareStatus}
              </div>
            )}
          </div>

          {/* Specifications Table */}
          <div className="mt-6 text-left">
            <h4 className="font-sans text-sm font-black tracking-wider text-neutral-900 uppercase mb-3">Specifications</h4>
            <div className="rounded-xl border border-neutral-400 bg-slate-50 p-4">
              <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-8 font-sans text-xs">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div key={key} className="flex justify-between sm:block border-b border-neutral-400 pb-2 sm:border-0 sm:pb-0">
                    <dt className="text-slate-500 font-sans text-xs uppercase tracking-wider block font-bold">{key}</dt>
                    <dd className="font-extrabold text-neutral-900 text-sm mt-0.5">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Reviews List & Write Review */}
          <div className="mt-8 space-y-6" id="reviews-portal">
            <div className="flex items-center justify-between border-b border-neutral-400 pb-3">
              <h4 className="font-sans text-sm font-black tracking-wider text-neutral-950 uppercase">Customer Reviews ({productReviews.length})</h4>
            </div>

            {/* Review List */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {productReviews.length === 0 ? (
                <p className="font-sans text-xs uppercase tracking-wider text-slate-400 italic text-left py-4">No reviews yet. Be the first to review this product!</p>
              ) : (
                productReviews.map((rev) => (
                  <div key={rev.id} className="rounded-xl border border-neutral-400 p-4 text-left hover:bg-neutral-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <img
                        src={rev.avatar || undefined || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&h=50&q=80`}
                        alt={rev.userName}
                        className="h-9 w-9 rounded-full bg-neutral-200 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="font-sans text-xs font-black uppercase text-neutral-950 truncate">{rev.userName}</h5>
                          <span className="font-sans text-xs text-slate-400 font-semibold">{rev.date}</span>
                        </div>
                        <div className="mt-1 flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < rev.rating ? 'fill-current' : 'text-gray-200'}`}
                            />
                          ))}
                        </div>
                        <p className="mt-2 font-sans text-xs leading-relaxed text-neutral-600 font-medium">{rev.comment}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Write a Review Section */}
            <div className="rounded-xl border border-dashed border-neutral-400 bg-slate-50/50 p-5 text-left">
              <h5 className="font-sans text-xs font-black tracking-wider text-slate-900 uppercase mb-3">Write a Verified Review</h5>
              
              {reviewSuccessMsg && (
                <div className="mb-4 rounded-lg bg-teal-50 border border-teal-200 p-3 text-xs font-bold text-teal-800 uppercase tracking-wider">
                  {reviewSuccessMsg}
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div>
                  <span className="font-sans text-xs uppercase tracking-wider text-slate-500 block mb-1 font-bold">Your Rating</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="text-amber-400 transition-transform hover:scale-105"
                      >
                        <Star className={`h-6 w-6 ${star <= newRating ? 'fill-current' : 'text-neutral-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-sans text-xs uppercase tracking-wider text-slate-500 block mb-1 font-bold">Your Review Comment</span>
                  <textarea
                    rows={3}
                    required
                    placeholder="SHARE YOUR HONEST FEEDBACK ABOUT SPECIFICATIONS, DESIGN, OR UTILITY..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 font-sans text-xs uppercase tracking-wider outline-none focus:border-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-5 py-2.5 font-sans text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-indigo-600 shadow-sm cursor-pointer"
                >
                  POST REVIEW
                </button>
              </form>
            </div>
          </div>

          {/* Recommended for You Section */}
          {similarProducts.length > 0 && (
            <div className="mt-12 border-t border-neutral-400 dark:border-neutral-700 pt-8" id="recommended-section">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-sans text-xs font-black tracking-wider text-neutral-900 dark:text-neutral-50 uppercase">
                  RECOMMENDED FOR YOU
                </h4>
                <span className="font-sans text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                  SIMILAR HARDWARE
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="recommended-products-grid">
                {similarProducts.map((simProd) => {
                  const hasDiscount = simProd.discountPrice !== undefined && simProd.discountPrice < simProd.price;
                  return (
                    <div 
                      key={simProd.id}
                      onClick={() => onSelectProduct(simProd)}
                      className="group cursor-pointer border border-neutral-400 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/50 p-3 rounded-xl transition-all hover:border-indigo-400 flex flex-col justify-between shadow-xs"
                      id={`recommended-card-${simProd.id}`}
                    >
                      <div>
                        {/* Product Image */}
                        <div className="relative aspect-square w-full overflow-hidden bg-white dark:bg-neutral-950 border border-neutral-400 dark:border-neutral-700 mb-3 flex items-center justify-center rounded-lg">
                          <img 
                            src={simProd.image || undefined} 
                            alt={simProd.name} 
                            className="max-h-[90%] max-w-[90%] object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          {hasDiscount && (
                            <span className="absolute top-2 left-2 bg-rose-600 dark:bg-rose-500 text-white font-sans text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase rounded-md">
                              SALE
                            </span>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="text-left">
                          <span className="block font-sans text-xs text-indigo-600 dark:text-indigo-400 uppercase font-bold mb-0.5">
                            {simProd.category}
                          </span>
                          <h5 className="font-sans text-xs font-bold text-neutral-900 dark:text-neutral-50 uppercase tracking-wide group-hover:text-indigo-600 line-clamp-1">
                            {simProd.name}
                          </h5>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-700/80 flex items-center justify-between">
                        {/* Price */}
                        <div className="font-sans text-xs font-black text-neutral-950 dark:text-neutral-50">
                          {hasDiscount ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-rose-600 dark:text-rose-400 font-bold">${simProd.discountPrice?.toFixed(2)}</span>
                              <span className="text-xs text-slate-400 line-through font-normal">${simProd.price.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span>${simProd.price.toFixed(2)}</span>
                          )}
                        </div>
                        
                        {/* Small Rating badge */}
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="font-sans text-xs font-bold text-neutral-800 dark:text-neutral-200">{simProd.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
