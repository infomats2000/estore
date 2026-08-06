export interface HardwareCategoryItem {
  id: string;
  label: string;
  image: string;
  description: string;
}

export const HARDWARE_CATEGORY_CATALOG: Record<string, HardwareCategoryItem> = {
  'Laptops': {
    id: 'Laptops',
    label: 'Laptops',
    image: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    description: 'Business laptops, ultrabooks & portable workstations',
  },
  'Desktops': {
    id: 'Desktops',
    label: 'Desktops',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80',
    description: 'Pre-built gaming PCs & office desktop computers',
  },
  'Monitors': {
    id: 'Monitors',
    label: 'Monitors',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    description: '4K UHD, Ultrawide & 144Hz+ Gaming Displays',
  },
  'Workstations': {
    id: 'Workstations',
    label: 'Workstations',
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80',
    description: 'Heavy-duty rendering, CAD & AI computing rigs',
  },
  'Apple Mac': {
    id: 'Apple Mac',
    label: 'Apple Mac',
    image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80',
    description: 'MacBook Pro, MacBook Air & Mac Studio systems',
  },
  'CPUs / Processors': {
    id: 'CPUs / Processors',
    label: 'CPUs / Processors',
    image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80',
    description: 'Intel Core & AMD Ryzen processors',
  },
  'Graphics Cards': {
    id: 'Graphics Cards',
    label: 'Graphics Cards',
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80',
    description: 'NVIDIA GeForce RTX & AMD Radeon GPUs',
  },
  'RAM / Memory': {
    id: 'RAM / Memory',
    label: 'RAM / Memory',
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=800&q=80',
    description: 'High-speed DDR4 & DDR5 RAM memory kits',
  },
  'Storage & SSDs': {
    id: 'Storage & SSDs',
    label: 'Storage & SSDs',
    image: 'https://images.unsplash.com/photo-1597872250970-45d06e2e5c8e?auto=format&fit=crop&w=800&q=80',
    description: 'NVMe M.2 SSDs, SATA drives & external hard drives',
  },
  'Motherboards': {
    id: 'Motherboards',
    label: 'Motherboards',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    description: 'Intel & AMD gaming & workstation motherboards',
  },
  'Power Supplies': {
    id: 'Power Supplies',
    label: 'Power Supplies',
    image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=800&q=80',
    description: '80+ Gold modular PSUs & power units',
  },
  'PC Cases': {
    id: 'PC Cases',
    label: 'PC Cases',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80',
    description: 'Glass side panel mid-tower & RGB chassis',
  },
  'Cooling & Fans': {
    id: 'Cooling & Fans',
    label: 'Cooling & Fans',
    image: 'https://images.unsplash.com/photo-1587202372583-49330a15584d?auto=format&fit=crop&w=800&q=80',
    description: 'AIO Liquid coolers, thermal paste & RGB fans',
  },
  'Keyboards & Mice': {
    id: 'Keyboards & Mice',
    label: 'Keyboards & Mice',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    description: 'Mechanical gaming keyboards & wireless mice',
  },
  'Audio & Headsets': {
    id: 'Audio & Headsets',
    label: 'Audio & Headsets',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
    description: 'Surround sound headsets, microphones & speakers',
  },
  'Networking': {
    id: 'Networking',
    label: 'Networking',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    description: 'Wi-Fi 6 Routers, network adapters & switches',
  },
  'Parts': {
    id: 'Parts',
    label: 'Parts & Accessories',
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80',
    description: 'Replacement parts, cables, mounting & adapters',
  },
};

/**
 * Returns image and info for a category string.
 */
export const getCategoryHardwareInfo = (catName: string): HardwareCategoryItem => {
  if (HARDWARE_CATEGORY_CATALOG[catName]) {
    return HARDWARE_CATEGORY_CATALOG[catName];
  }

  // Case-insensitive / partial match
  const lower = catName.toLowerCase();
  for (const key of Object.keys(HARDWARE_CATEGORY_CATALOG)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return HARDWARE_CATEGORY_CATALOG[key];
    }
  }

  // Fallback image
  return {
    id: catName,
    label: catName,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    description: `Browse all products in ${catName}`,
  };
};
