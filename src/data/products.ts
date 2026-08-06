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
    additionalImages: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80'
    ],
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
    additionalImages: [
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80'
    ],
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
    additionalImages: [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80'
    ],
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
    description: 'Portable Apple workstation with M2 chip, Retina display, and fast SSD storage.',
    category: 'Apple Mac',
    collection: 'Apple Mac',
    price: 1299,
    discountPrice: 999,
    image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 4.9,
    reviewsCount: 29,
    stock: 3,
    sales: 48,
    specs: { CPU: 'Apple M2', RAM: '16GB', Storage: '512GB SSD', Warranty: '12 Months' },
    tags: ['Apple', 'Grade A', 'Refurbished'],
    colors: ['Space Grey'],
    sizes: ['13-inch']
  },
  {
    id: 'prod-gaming-desktop-rtx4070',
    name: 'CyberPower Extreme Gaming PC',
    description: 'High performance gaming desktop with Intel Core i7-14700F, RTX 4070 12GB, 32GB DDR5 & 1TB NVMe.',
    category: 'Desktops',
    collection: 'Desktops',
    price: 1899,
    discountPrice: 1699,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 4.9,
    reviewsCount: 34,
    stock: 6,
    sales: 22,
    specs: { CPU: 'Intel Core i7-14700F', GPU: 'NVIDIA RTX 4070 12GB', RAM: '32GB DDR5', Storage: '1TB Gen4 NVMe' },
    tags: ['Gaming PC', 'RTX 4070', 'DDR5', 'RGB Chassis'],
    colors: ['Black RGB']
  },
  {
    id: 'prod-lg-ultragear-27-monitor',
    name: 'LG UltraGear 27" 4K UHD Gaming Monitor',
    description: '27-inch IPS 4K UHD Gaming Monitor with 144Hz, 1ms response time, HDMI 2.1 & G-Sync Compatible.',
    category: 'Monitors',
    collection: 'Monitors',
    price: 699,
    discountPrice: 549,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 4.8,
    reviewsCount: 42,
    stock: 12,
    sales: 85,
    specs: { Panel: 'IPS 4K UHD', RefreshRate: '144Hz', ResponseTime: '1ms', Display: '27-inch' },
    tags: ['4K UHD', '144Hz', 'G-Sync', 'HDR400'],
    colors: ['Black']
  },
  {
    id: 'prod-hp-zbook-fury-workstation',
    name: 'HP ZBook Fury G10 Workstation',
    description: 'Ultimate CAD & 3D rendering mobile workstation with Intel Core i9-13900HX, 64GB RAM & RTX 4000 Ada.',
    category: 'Workstations',
    collection: 'Workstations',
    price: 3499,
    discountPrice: 3199,
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 5.0,
    reviewsCount: 11,
    stock: 2,
    sales: 14,
    specs: { CPU: 'Intel Core i9-13900HX', GPU: 'NVIDIA RTX 4000 Ada 12GB', RAM: '64GB DDR5', Storage: '2TB NVMe' },
    tags: ['Enterprise Workstation', 'Core i9', '64GB RAM', 'CAD Rig'],
    colors: ['Charcoal']
  },
  {
    id: 'prod-nvidia-rtx-4080-gpu',
    name: 'NVIDIA GeForce RTX 4080 Super 16GB GPU',
    description: 'Extreme 4K gaming graphics card featuring DLSS 3, Ray Tracing cores and 16GB GDDR6X VRAM.',
    category: 'Graphics Cards',
    collection: 'Graphics Cards',
    price: 1199,
    discountPrice: 1049,
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 4.9,
    reviewsCount: 57,
    stock: 8,
    sales: 94,
    specs: { VRAM: '16GB GDDR6X', Cores: '10240 CUDA Cores', Interface: 'PCIe 4.0 x16', RecommendedPSU: '750W' },
    tags: ['RTX 4080 Super', '16GB VRAM', 'DLSS 3', '4K Gaming'],
    colors: ['Black Metallic']
  },
  {
    id: 'prod-intel-i9-14900k-cpu',
    name: 'Intel Core i9-14900K Processor',
    description: '24-Core 32-Thread desktop processor with thermal velocity boost up to 6.0 GHz for flagship gaming.',
    category: 'CPUs / Processors',
    collection: 'CPUs / Processors',
    price: 589,
    discountPrice: 549,
    image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80',
    additionalImages: [],
    rating: 4.8,
    reviewsCount: 39,
    stock: 15,
    sales: 110,
    specs: { Cores: '24 Cores (8P + 16E)', Threads: '32 Threads', MaxClock: '6.0 GHz', Socket: 'LGA1700' },
    tags: ['Intel i9', '14th Gen', 'Unlocked', 'Flagship CPU'],
    colors: ['Silver Blue']
  },
  {
    id: 'prod-corsair-ddr5-32gb-ram',
    name: 'Corsair Vengeance DDR5 32GB (2x16GB) 6000MHz',
    description: 'High frequency DDR5 desktop memory kit with onboard XMP 3.0 profile and aluminum heatspreader.',
    category: 'RAM / Memory',
    collection: 'RAM / Memory',
    price: 149,
    discountPrice: 129,
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=800&q=80',
    additionalImages: [],
    rating: 4.9,
    reviewsCount: 68,
    stock: 20,
    sales: 145,
    specs: { Capacity: '32GB (2x16GB)', Speed: '6000MHz DDR5', Latency: 'CL36', Voltage: '1.35V' },
    tags: ['DDR5', '32GB Kit', '6000MHz', 'Corsair'],
    colors: ['Black']
  },
  {
    id: 'prod-samsung-990pro-2tb-ssd',
    name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD',
    description: 'Ultra-fast NVMe M.2 solid state drive with up to 7,450 MB/s sequential read speeds for PS5 & PC.',
    category: 'Storage & SSDs',
    collection: 'Storage & SSDs',
    price: 199,
    discountPrice: 169,
    image: 'https://images.unsplash.com/photo-1597872250970-45d06e2e5c8e?auto=format&fit=crop&w=800&q=80',
    additionalImages: [],
    rating: 5.0,
    reviewsCount: 88,
    stock: 18,
    sales: 210,
    specs: { Capacity: '2TB', Interface: 'PCIe 4.0 x4 NVMe M.2', ReadSpeed: '7,450 MB/s', WriteSpeed: '6,900 MB/s' },
    tags: ['Samsung 990 Pro', '2TB NVMe', 'Gen4 SSD', 'PS5 Compatible'],
    colors: ['Black']
  },
  {
    id: 'prod-logitech-mx-keys-combo',
    name: 'Logitech MX Master 3S + MX Keys Combo',
    description: 'Premium wireless ergonomic keyboard and 8K DPI quiet-click performance mouse suite.',
    category: 'Keyboards & Mice',
    collection: 'Keyboards & Mice',
    price: 219,
    discountPrice: 189,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    additionalImages: [],
    rating: 4.9,
    reviewsCount: 76,
    stock: 10,
    sales: 160,
    specs: { Connection: 'Bluetooth / Logi Bolt Wireless', Sensor: '8000 DPI Darkfield', Battery: 'USB-C Rechargeable' },
    tags: ['Logitech MX', 'Ergonomic', 'Wireless', 'Quiet Click'],
    colors: ['Graphite']
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
