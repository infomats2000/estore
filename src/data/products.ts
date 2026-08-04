import { Product, Review, Coupon } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-dell-latitude-7490',
    name: 'Dell Latitude 7490',
    description: 'Business-class 14-inch laptop with Intel Core i5, 16GB RAM and 256GB SSD.',
    category: 'Laptops',
    collection: 'Laptops',
    price: 649,
    discountPrice: 499,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
    additionalImages: [],
    rating: 4.7,
    reviewsCount: 18,
    stock: 7,
    sales: 42,
    specs: { CPU: 'Intel Core i5', RAM: '16GB', Storage: '256GB SSD', Warranty: '12 Months' },
    tags: ['Grade A', 'Business', 'Refurbished', 'Ex-Corporate'],
    colors: ['Black'],
    sizes: ['14-inch']
  },
  {
    id: 'prod-thinkpad-t480',
    name: 'Lenovo ThinkPad T480',
    description: 'Reliable 14-inch workstation with robust keyboard and solid security features.',
    category: 'Laptops',
    collection: 'Laptops',
    price: 699,
    discountPrice: 549,
    image: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    additionalImages: [],
    rating: 4.8,
    reviewsCount: 24,
    stock: 5,
    sales: 63,
    specs: { CPU: 'Intel Core i5', RAM: '8GB', Storage: '512GB SSD', Warranty: '12 Months' },
    tags: ['Grade A', 'Keyboard', 'Refurbished'],
    colors: ['Black'],
    sizes: ['14-inch']
  },
  {
    id: 'prod-hp-elitebook-840',
    name: 'HP EliteBook 840 G6',
    description: 'Slim premium business laptop built for comfort, security and everyday performance.',
    category: 'Laptops',
    collection: 'Laptops',
    price: 799,
    discountPrice: 599,
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80',
    additionalImages: [],
    rating: 4.6,
    reviewsCount: 15,
    stock: 4,
    sales: 31,
    specs: { CPU: 'Intel Core i7', RAM: '16GB', Storage: '512GB SSD', Warranty: '12 Months' },
    tags: ['Grade A', 'Premium', 'Refurbished'],
    colors: ['Silver'],
    sizes: ['14-inch']
  },
  {
    id: 'prod-macbook-pro-13',
    name: 'Apple MacBook Pro 13',
    description: 'Portable Apple workstation with excellent battery life and fast SSD storage.',
    category: 'Apple Mac',
    collection: 'Apple Mac',
    price: 1299,
    discountPrice: 999,
    image: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    additionalImages: [],
    rating: 4.9,
    reviewsCount: 29,
    stock: 3,
    sales: 48,
    specs: { CPU: 'Intel Core i5', RAM: '16GB', Storage: '512GB SSD', Warranty: '12 Months' },
    tags: ['Apple', 'Grade A', 'Refurbished'],
    colors: ['Space Grey'],
    sizes: ['13-inch']
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'review-1',
    productId: 'prod-dell-latitude-7490',
    userName: 'Alicia',
    rating: 5,
    comment: 'Fast delivery and the device looks like new.',
    date: '2026-07-19'
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    active: true,
    minPurchase: 500
  }
];

