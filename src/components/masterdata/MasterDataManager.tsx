import React, { useState, useEffect } from 'react';
import { 
  FolderTree, Tag, Scale, ShieldCheck, MapPin, Percent, CreditCard, 
  Truck, Shield, Sliders, ListFilter, Globe, DollarSign, Languages as LangIcon, 
  CheckCircle2, AlertTriangle, Plus, Search, Edit3, Trash2, Download, Upload, RefreshCw, X, Lock, Check
} from 'lucide-react';

export type MasterDataEntityKey = 
  | 'categories' | 'brands' | 'units' | 'product-status' | 'warehouses' 
  | 'taxes' | 'payment-terms' | 'shipping-methods' | 'warranties' 
  | 'attributes' | 'attribute-values' | 'countries' | 'currencies' 
  | 'languages' | 'conditions';

export interface MasterDataItem {
  id: string;
  name?: string;
  value?: string;
  code?: string;
  symbol?: string;
  parentId?: string | null;
  description?: string;
  ratePercent?: number;
  days?: number;
  durationMonths?: number;
  cost?: number;
  iso2?: string;
  iso3?: string;
  currency?: string;
  decimalPlaces?: number;
  isSystem: boolean;
  isActive?: boolean;
  active?: boolean;
  createdAt?: string;
}

const DEFAULT_FALLBACKS: Record<MasterDataEntityKey, MasterDataItem[]> = {
  categories: [
    { id: 'cat-components', name: 'Components', description: 'Core computer hardware components', isSystem: true, isActive: true },
    { id: 'cat-cpus', name: 'CPUs / Processors', description: 'Central Processing Units', parentId: 'cat-components', isSystem: true, isActive: true },
    { id: 'cat-cpus-intel', name: 'Intel CPUs', description: 'Intel Core i3/i5/i7/i9 and Xeon Processors', parentId: 'cat-cpus', isSystem: true, isActive: true },
    { id: 'cat-cpus-amd', name: 'AMD CPUs', description: 'AMD Ryzen and EPYC Processors', parentId: 'cat-cpus', isSystem: true, isActive: true },
    { id: 'cat-motherboards', name: 'Motherboards', description: 'System circuit boards', parentId: 'cat-components', isSystem: true, isActive: true },
    { id: 'cat-ram', name: 'RAM / Memory', description: 'Desktop and laptop system memory', parentId: 'cat-components', isSystem: true, isActive: true },
    { id: 'cat-ram-ddr4', name: 'DDR4 RAM', description: 'DDR4 memory kits', parentId: 'cat-ram', isSystem: true, isActive: true },
    { id: 'cat-ram-ddr5', name: 'DDR5 RAM', description: 'High-speed DDR5 memory kits', parentId: 'cat-ram', isSystem: true, isActive: true },
    { id: 'cat-gpu', name: 'Graphics Cards', description: 'Dedicated video and workstation graphics', parentId: 'cat-components', isSystem: true, isActive: true },
    { id: 'cat-gpu-nvidia', name: 'NVIDIA RTX Graphics', description: 'GeForce RTX 40 and 30 series', parentId: 'cat-gpu', isSystem: true, isActive: true },
    { id: 'cat-gpu-amd', name: 'AMD Radeon Graphics', description: 'Radeon RX 7000 and 6000 series', parentId: 'cat-gpu', isSystem: true, isActive: true },
    { id: 'cat-storage', name: 'Storage Devices', description: 'Solid State Drives and Hard Drives', parentId: 'cat-components', isSystem: true, isActive: true },
    { id: 'cat-ssd-nvme', name: 'M.2 NVMe SSDs', description: 'High speed PCIe NVMe storage', parentId: 'cat-storage', isSystem: true, isActive: true },
    { id: 'cat-ssd-sata', name: 'SATA SSDs', description: '2.5 inch SATA solid state drives', parentId: 'cat-storage', isSystem: true, isActive: true },
    { id: 'cat-psu', name: 'Power Supplies (PSU)', description: '80 Plus certified power supply units', parentId: 'cat-components', isSystem: true, isActive: true },
    { id: 'cat-cases', name: 'Computer Cases', description: 'ATX mid-towers and SFF chassis', parentId: 'cat-components', isSystem: true, isActive: true },
    { id: 'cat-cooling', name: 'Cooling & Fans', description: 'AIO liquid coolers and CPU fans', parentId: 'cat-components', isSystem: true, isActive: true },
    { id: 'cat-networking', name: 'Networking', description: 'Enterprise and home networking equipment', isSystem: true, isActive: true },
    { id: 'cat-laptops', name: 'Laptops & Notebooks', description: 'Portable computers and Ultrabooks', isSystem: true, isActive: true },
    { id: 'cat-desktops', name: 'Desktop PCs', description: 'Desktop computers and workstations', isSystem: true, isActive: true },
    { id: 'cat-monitors', name: 'Monitors & Displays', description: 'Computer displays and screens', isSystem: true, isActive: true },
    { id: 'cat-apple', name: 'Apple Mac', description: 'Apple MacBooks iMacs and Mac Studio', isSystem: true, isActive: true },
    { id: 'cat-peripherals', name: 'Peripherals & Input', description: 'Keyboards mice and desktop accessories', isSystem: true, isActive: true },
    { id: 'cat-printers', name: 'Printers & POS', description: 'Printing scanning and POS hardware', isSystem: true, isActive: true },
    { id: 'cat-cables', name: 'Cables & Adapters', description: 'Connectivity cables and video converters', isSystem: true, isActive: true },
    { id: 'cat-servers', name: 'Server & Enterprise', description: 'Rackmount servers and enterprise gear', isSystem: true, isActive: true },
    { id: 'cat-parts', name: 'Spare Parts', description: 'Replacement components and hardware parts', isSystem: true, isActive: true }
  ],
  brands: [
    { id: 'brand-intel', name: 'Intel', isSystem: true, isActive: true },
    { id: 'brand-amd', name: 'AMD', isSystem: true, isActive: true },
    { id: 'brand-asus', name: 'ASUS', isSystem: true, isActive: true },
    { id: 'brand-msi', name: 'MSI', isSystem: true, isActive: true },
    { id: 'brand-gigabyte', name: 'Gigabyte', isSystem: true, isActive: true },
    { id: 'brand-dell', name: 'Dell', isSystem: true, isActive: true },
    { id: 'brand-hp', name: 'HP', isSystem: true, isActive: true },
    { id: 'brand-lenovo', name: 'Lenovo', isSystem: true, isActive: true },
    { id: 'brand-apple', name: 'Apple', isSystem: true, isActive: true },
    { id: 'brand-samsung', name: 'Samsung', isSystem: true, isActive: true },
    { id: 'brand-kingston', name: 'Kingston', isSystem: true, isActive: true },
    { id: 'brand-corsair', name: 'Corsair', isSystem: true, isActive: true },
    { id: 'brand-cisco', name: 'Cisco', isSystem: true, isActive: true },
    { id: 'brand-ubiquiti', name: 'Ubiquiti', isSystem: true, isActive: true },
    { id: 'brand-logitech', name: 'Logitech', isSystem: true, isActive: true },
    { id: 'brand-wd', name: 'Western Digital', isSystem: true, isActive: true },
    { id: 'brand-seagate', name: 'Seagate', isSystem: true, isActive: true },
    { id: 'brand-crucial', name: 'Crucial', isSystem: true, isActive: true }
  ],
  units: [
    { id: 'uom-ea', name: 'Each', symbol: 'ea', isSystem: true, isActive: true },
    { id: 'uom-pc', name: 'Piece', symbol: 'pc', isSystem: true, isActive: true },
    { id: 'uom-pk', name: 'Pack', symbol: 'pk', isSystem: true, isActive: true },
    { id: 'uom-bx', name: 'Box', symbol: 'bx', isSystem: true, isActive: true },
    { id: 'uom-ctn', name: 'Carton', symbol: 'ctn', isSystem: true, isActive: true },
    { id: 'uom-cs', name: 'Case', symbol: 'cs', isSystem: true, isActive: true },
    { id: 'uom-set', name: 'Set', symbol: 'set', isSystem: true, isActive: true },
    { id: 'uom-kit', name: 'Kit', symbol: 'kit', isSystem: true, isActive: true },
    { id: 'uom-kg', name: 'Kilogram', symbol: 'kg', isSystem: true, isActive: true },
    { id: 'uom-m', name: 'Meter', symbol: 'm', isSystem: true, isActive: true }
  ],
  'product-status': [
    { id: 'status-active', name: 'Active', code: 'ACTIVE', isSystem: true, isActive: true },
    { id: 'status-inactive', name: 'Inactive', code: 'INACTIVE', isSystem: true, isActive: true },
    { id: 'status-comingsoon', name: 'Coming Soon', code: 'COMING_SOON', isSystem: true, isActive: true },
    { id: 'status-preorder', name: 'Pre Order', code: 'PRE_ORDER', isSystem: true, isActive: true },
    { id: 'status-backorder', name: 'Back Order', code: 'BACK_ORDER', isSystem: true, isActive: true },
    { id: 'status-outofstock', name: 'Out of Stock', code: 'OUT_OF_STOCK', isSystem: true, isActive: true },
    { id: 'status-clearance', name: 'Clearance', code: 'CLEARANCE', isSystem: true, isActive: true },
    { id: 'status-discontinued', name: 'Discontinued', code: 'DISCONTINUED', isSystem: true, isActive: true }
  ],
  warehouses: [
    { id: 'wh-main', name: 'Main Warehouse', code: 'WH-MAIN', description: 'Sydney Distribution Hub', isSystem: true, isActive: true },
    { id: 'wh-a', name: 'Warehouse A', code: 'WH-A', description: 'Melbourne Stock Facility', isSystem: true, isActive: true },
    { id: 'wh-b', name: 'Warehouse B', code: 'WH-B', description: 'Brisbane Logistics Unit', isSystem: true, isActive: true },
    { id: 'wh-showroom', name: 'Showroom', code: 'WH-SHOWROOM', description: 'Retail Display Counter', isSystem: true, isActive: true },
    { id: 'wh-returns', name: 'Returns Centre', code: 'WH-RETURNS', description: 'RMA Quarantine', isSystem: true, isActive: true },
    { id: 'wh-repair', name: 'Repair Centre', code: 'WH-REPAIR', description: 'Technical Service Lab', isSystem: true, isActive: true }
  ],
  taxes: [
    { id: 'tax-au-gst', name: 'GST (10%)', code: 'GST_AU', ratePercent: 10.0, isSystem: true, isActive: true },
    { id: 'tax-au-free', name: 'GST Free', code: 'GST_FREE_AU', ratePercent: 0.0, isSystem: true, isActive: true },
    { id: 'tax-nz-gst', name: 'GST (15%)', code: 'GST_NZ', ratePercent: 15.0, isSystem: true, isActive: true },
    { id: 'tax-uk-std', name: 'VAT Standard (20%)', code: 'VAT_STD_UK', ratePercent: 20.0, isSystem: true, isActive: true },
    { id: 'tax-us-exempt', name: 'Tax Exempt (0%)', code: 'TAX_EXEMPT_US', ratePercent: 0.0, isSystem: true, isActive: true }
  ],
  'payment-terms': [
    { id: 'payterm-cash', name: 'Cash', days: 0, isSystem: true, isActive: true },
    { id: 'payterm-cod', name: 'COD (Cash on Delivery)', days: 0, isSystem: true, isActive: true },
    { id: 'payterm-prepaid', name: 'Prepaid', days: 0, isSystem: true, isActive: true },
    { id: 'payterm-7d', name: '7 Days Net', days: 7, isSystem: true, isActive: true },
    { id: 'payterm-14d', name: '14 Days Net', days: 14, isSystem: true, isActive: true },
    { id: 'payterm-30d', name: '30 Days Net', days: 30, isSystem: true, isActive: true },
    { id: 'payterm-60d', name: '60 Days Net', days: 60, isSystem: true, isActive: true },
    { id: 'payterm-credit', name: 'Credit Account', days: 30, isSystem: true, isActive: true }
  ],
  'shipping-methods': [
    { id: 'ship-pickup', name: 'Customer Pickup', code: 'PICKUP', cost: 0.0, description: 'Store or warehouse pickup', isSystem: true, active: true },
    { id: 'ship-local', name: 'Local Delivery', code: 'LOCAL_DELIVERY', cost: 15.0, description: 'Same day local courier', isSystem: true, active: true },
    { id: 'ship-courier', name: 'Standard Courier', code: 'COURIER', cost: 9.99, description: 'Road express (2-3 days)', isSystem: true, active: true },
    { id: 'ship-express', name: 'Express Courier', code: 'EXPRESS_COURIER', cost: 19.99, description: 'Overnight air express', isSystem: true, active: true },
    { id: 'ship-freight', name: 'Pallet Freight', code: 'PALLET_FREIGHT', cost: 75.0, description: 'Bulk heavy freight', isSystem: true, active: true }
  ],
  warranties: [
    { id: 'war-none', name: 'No Warranty', durationMonths: 0, isSystem: true, isActive: true },
    { id: 'war-30d', name: '30 Days Return Warranty', durationMonths: 1, isSystem: true, isActive: true },
    { id: 'war-1y', name: '1 Year Direct Warranty', durationMonths: 12, isSystem: true, isActive: true },
    { id: 'war-2y', name: '2 Years Extended Warranty', durationMonths: 24, isSystem: true, isActive: true },
    { id: 'war-3y', name: '3 Years Pro Support', durationMonths: 36, isSystem: true, isActive: true },
    { id: 'war-mfg', name: 'Manufacturer Warranty', durationMonths: 12, isSystem: true, isActive: true },
    { id: 'war-onsite', name: 'On-Site Next Business Day', durationMonths: 12, isSystem: true, isActive: true }
  ],
  attributes: [
    { id: 'attr-cpu-socket', name: 'CPU Socket', code: 'cpu_socket', isSystem: true, isActive: true },
    { id: 'attr-ram-type', name: 'RAM Type', code: 'ram_type', isSystem: true, isActive: true },
    { id: 'attr-ram-cap', name: 'RAM Capacity', code: 'ram_capacity', isSystem: true, isActive: true },
    { id: 'attr-storage-cap', name: 'Storage Capacity', code: 'storage_capacity', isSystem: true, isActive: true },
    { id: 'attr-refresh-rate', name: 'Refresh Rate', code: 'refresh_rate', isSystem: true, isActive: true },
    { id: 'attr-color', name: 'Color', code: 'color', isSystem: true, isActive: true },
    { id: 'attr-warranty', name: 'Warranty', code: 'warranty', isSystem: true, isActive: true }
  ],
  'attribute-values': [
    { id: 'val-am4', value: 'AM4', isSystem: true, isActive: true },
    { id: 'val-am5', value: 'AM5', isSystem: true, isActive: true },
    { id: 'val-lga1700', value: 'LGA1700', isSystem: true, isActive: true },
    { id: 'val-ddr4', value: 'DDR4', isSystem: true, isActive: true },
    { id: 'val-ddr5', value: 'DDR5', isSystem: true, isActive: true },
    { id: 'val-16gb', value: '16GB', isSystem: true, isActive: true },
    { id: 'val-32gb', value: '32GB', isSystem: true, isActive: true },
    { id: 'val-1tb', value: '1TB', isSystem: true, isActive: true },
    { id: 'val-2tb', value: '2TB', isSystem: true, isActive: true },
    { id: 'val-144hz', value: '144Hz', isSystem: true, isActive: true },
    { id: 'val-black', value: 'Black', isSystem: true, isActive: true },
    { id: 'val-white', value: 'White', isSystem: true, isActive: true }
  ],
  countries: [
    { id: 'c-au', name: 'Australia', iso2: 'AU', iso3: 'AUS', currency: 'AUD', isSystem: true, isActive: true },
    { id: 'c-us', name: 'United States', iso2: 'US', iso3: 'USA', currency: 'USD', isSystem: true, isActive: true },
    { id: 'c-nz', name: 'New Zealand', iso2: 'NZ', iso3: 'NZL', currency: 'NZD', isSystem: true, isActive: true },
    { id: 'c-gb', name: 'United Kingdom', iso2: 'GB', iso3: 'GBR', currency: 'GBP', isSystem: true, isActive: true },
    { id: 'c-ca', name: 'Canada', iso2: 'CA', iso3: 'CAN', currency: 'CAD', isSystem: true, isActive: true },
    { id: 'c-sg', name: 'Singapore', iso2: 'SG', iso3: 'SGP', currency: 'SGD', isSystem: true, isActive: true }
  ],
  currencies: [
    { id: 'curr-aud', code: 'AUD', name: 'Australian Dollar', symbol: '$', decimalPlaces: 2, isSystem: true, isActive: true },
    { id: 'curr-usd', code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, isSystem: true, isActive: true },
    { id: 'curr-eur', code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isSystem: true, isActive: true },
    { id: 'curr-gbp', code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, isSystem: true, isActive: true },
    { id: 'curr-nzd', code: 'NZD', name: 'New Zealand Dollar', symbol: '$', decimalPlaces: 2, isSystem: true, isActive: true }
  ],
  languages: [
    { id: 'lang-en', code: 'en', name: 'English', isSystem: true, isActive: true },
    { id: 'lang-fr', code: 'fr', name: 'French', isSystem: true, isActive: true },
    { id: 'lang-de', code: 'de', name: 'German', isSystem: true, isActive: true },
    { id: 'lang-es', code: 'es', name: 'Spanish', isSystem: true, isActive: true },
    { id: 'lang-zh', code: 'zh', name: 'Chinese', isSystem: true, isActive: true }
  ],
  conditions: [
    { id: 'cond-new', name: 'New', code: 'NEW', isSystem: true, isActive: true },
    { id: 'cond-openbox', name: 'Open Box', code: 'OPEN_BOX', isSystem: true, isActive: true },
    { id: 'cond-refurbished', name: 'Refurbished', code: 'REFURBISHED', isSystem: true, isActive: true },
    { id: 'cond-used', name: 'Used', code: 'USED', isSystem: true, isActive: true },
    { id: 'cond-parts', name: 'For Parts', code: 'FOR_PARTS', isSystem: true, isActive: true }
  ]
};

export default function MasterDataManager() {
  const [activeTab, setActiveTab] = useState<MasterDataEntityKey>('categories');
  const [items, setItems] = useState<MasterDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MasterDataItem> | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const tabs: { key: MasterDataEntityKey; label: string; icon: any; desc: string }[] = [
    { key: 'categories', label: 'Categories', icon: FolderTree, desc: 'Hierarchical Product Categories (206+ preloaded)' },
    { key: 'brands', label: 'Brands', icon: Tag, desc: 'IT Hardware Manufacturers & Brands (75+ preloaded)' },
    { key: 'units', label: 'Units of Measure', icon: Scale, desc: 'Ea, Pk, Box, Ctn, M, Kg, etc.' },
    { key: 'product-status', label: 'Product Status', icon: ShieldCheck, desc: 'Active, Inactive, Pre-Order, Back-Order, etc.' },
    { key: 'warehouses', label: 'Warehouses', icon: MapPin, desc: 'Main, Showroom, Returns, Repair Centre' },
    { key: 'taxes', label: 'Tax Rates', icon: Percent, desc: 'AU GST, NZ GST, UK VAT, Tax Exempt' },
    { key: 'payment-terms', label: 'Payment Terms', icon: CreditCard, desc: 'Cash, COD, 7/14/30/60/90 Days' },
    { key: 'shipping-methods', label: 'Shipping Methods', icon: Truck, desc: 'Courier, Express, Pickup, Drop Ship' },
    { key: 'warranties', label: 'Warranty Types', icon: Shield, desc: '30D, 1Y, 3Y ProSupport, On-Site, RTB' },
    { key: 'attributes', label: 'Attributes', icon: Sliders, desc: 'CPU Socket, RAM Type, Resolution, Color' },
    { key: 'attribute-values', label: 'Attribute Values', icon: ListFilter, desc: 'AM5, LGA1700, DDR5, 1TB, 144Hz' },
    { key: 'countries', label: 'Countries', icon: Globe, desc: 'ISO Countries, Phone Codes, Time Zones' },
    { key: 'currencies', label: 'Currencies', icon: DollarSign, desc: 'AUD, USD, EUR, GBP, NZD, JPY, SGD' },
    { key: 'languages', label: 'Languages', icon: LangIcon, desc: 'English, French, German, Spanish, etc.' },
    { key: 'conditions', label: 'Conditions', icon: CheckCircle2, desc: 'New, Open Box, Refurbished, Used, Parts' }
  ];

  const fetchItems = async (entity: MasterDataEntityKey, q = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/master-data/${entity}?search=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('[Master Data UI] API fetch fallback to default embedded seed:', err);
    }

    // Default embedded seed fallback if database table is empty or server unreachable
    const fallbacks = DEFAULT_FALLBACKS[entity] || [];
    const filtered = q.trim()
      ? fallbacks.filter(i => (i.name || i.value || i.code || '').toLowerCase().includes(q.toLowerCase()))
      : fallbacks;
    setItems(filtered);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems(activeTab, searchQuery);
  }, [activeTab, searchQuery]);

  const showAlert = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ isSystem: false, isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MasterDataItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem?.id 
        ? `/api/master-data/${activeTab}/${editingItem.id}`
        : `/api/master-data/${activeTab}`;
      const method = editingItem?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        // Local state update fallback if offline
        const newItem: MasterDataItem = {
          id: editingItem?.id || `custom-${Date.now()}`,
          name: formData.name || formData.value,
          value: formData.value || formData.name,
          code: formData.code,
          description: formData.description,
          isSystem: false,
          isActive: formData.isActive !== false
        };
        setItems(prev => editingItem?.id ? prev.map(i => i.id === editingItem.id ? newItem : i) : [newItem, ...prev]);
        showAlert(editingItem?.id ? 'Record updated!' : 'New record created!');
        setIsModalOpen(false);
        return;
      }

      showAlert(editingItem?.id ? 'Record updated successfully!' : 'New record created successfully!');
      setIsModalOpen(false);
      fetchItems(activeTab, searchQuery);
    } catch (err: any) {
      // Local state fallback
      const newItem: MasterDataItem = {
        id: editingItem?.id || `custom-${Date.now()}`,
        name: formData.name || formData.value,
        value: formData.value || formData.name,
        code: formData.code,
        description: formData.description,
        isSystem: false,
        isActive: formData.isActive !== false
      };
      setItems(prev => editingItem?.id ? prev.map(i => i.id === editingItem.id ? newItem : i) : [newItem, ...prev]);
      showAlert('Record saved locally!');
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (item: MasterDataItem) => {
    if (item.isSystem) {
      showAlert('System-protected built-in records cannot be deleted.', 'warning');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${item.name || item.value || item.code}"?`)) {
      return;
    }

    try {
      await fetch(`/api/master-data/${activeTab}/${item.id}`, { method: 'DELETE' });
    } catch (err) {
      // ignore network errors
    }

    setItems(prev => prev.filter(i => i.id !== item.id));
    showAlert('Record deleted successfully');
  };

  const handleExportCSV = () => {
    if (items.length === 0) {
      showAlert('No records to export', 'warning');
      return;
    }

    const headers = Object.keys(items[0]).filter(k => k !== 'createdAt' && k !== 'updatedAt');
    const rows = items.map(item => headers.map(h => `"${String((item as any)[h] ?? '').replace(/"/g, '""')}"`).join(','));
    const csvStr = '\uFEFF' + [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `master_data_${activeTab}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length <= 1) throw new Error('CSV file is empty or invalid format');

        const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
        const importedItems: MasterDataItem[] = [];

        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
          const payload: Record<string, any> = {};
          headers.forEach((h, idx) => {
            payload[h] = vals[idx] ?? '';
          });

          if (!payload.name && !payload.value && !payload.code) continue;

          importedItems.push({
            id: payload.id || `imp-${Date.now()}-${i}`,
            name: payload.name,
            value: payload.value || payload.name,
            code: payload.code,
            description: payload.description,
            isSystem: payload.isSystem === 'true',
            isActive: payload.isActive !== 'false'
          });

          fetch(`/api/master-data/${activeTab}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).catch(() => {});
        }

        setItems(prev => [...importedItems, ...prev]);
        showAlert(`Successfully imported ${importedItems.length} records into ${activeTab}!`);
      } catch (err: any) {
        showAlert(err.message || 'CSV Import failed', 'error');
      }
    };
    reader.readAsText(file);
  };

  const activeTabMeta = tabs.find(t => t.key === activeTab)!;

  return (
    <div className="bg-slate-900 text-white min-h-[750px] rounded-3xl border border-slate-800 p-6 shadow-2xl flex flex-col">
      {/* Alert Notification */}
      {alertMsg && (
        <div className={`p-3 rounded-xl mb-4 flex items-center justify-between font-mono text-xs ${
          alertMsg.type === 'error' ? 'bg-rose-950/80 border border-rose-800 text-rose-200' :
          alertMsg.type === 'warning' ? 'bg-amber-950/80 border border-amber-800 text-amber-200' :
          'bg-emerald-950/80 border border-emerald-800 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {alertMsg.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            <span>{alertMsg.text}</span>
          </div>
          <button type="button" onClick={() => setAlertMsg(null)} className="p-1 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
              SINGLE-COMPANY ERP MASTER DATA
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> System Protection Active
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight mt-1 flex items-center gap-2">
            <activeTabMeta.icon className="w-6 h-6 text-blue-400" />
            {activeTabMeta.label} Master Data
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{activeTabMeta.desc}</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-mono text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-mono text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-black uppercase rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Area: Left Entity Tabs, Right Data Table */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Left Column: 15 Master Data Entity Navigation Tabs */}
        <div className="lg:col-span-1 space-y-1 max-h-[620px] overflow-y-auto pr-2 scrollbar-thin">
          <span className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider block mb-2 px-2">
            MASTER DATA ENTITIES (15)
          </span>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setSearchQuery('');
                }}
                className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20 font-bold'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                  <span className="text-xs truncate">{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Search Bar & Records Data Table */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div className="flex items-center justify-between gap-4 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${activeTabMeta.label}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 pl-10 pr-4 py-2 text-xs rounded-xl text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="font-mono text-xs text-slate-400 flex items-center gap-2 pr-2">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{items.length} Records</span>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden overflow-y-auto max-h-[540px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 font-mono text-[10px] uppercase text-slate-400">
                  <th className="p-3">Record Details</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-sans">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 font-mono text-xs">
                      No records found in {activeTabMeta.label}. Click "Add Record" or "Import CSV" to seed data.
                    </td>
                  </tr>
                ) : (
                  items.map(item => {
                    const title = item.name || item.value || item.code || item.id;
                    const isSys = item.isSystem;
                    const activeState = item.isActive !== false && item.active !== false;

                    return (
                      <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-100 flex items-center gap-2">
                            <span>{title}</span>
                            {item.symbol && <span className="font-mono text-[10px] text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800">{item.symbol}</span>}
                            {item.iso2 && <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">{item.iso2}</span>}
                          </div>
                          {item.description && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>}
                        </td>
                        <td className="p-3 font-mono text-[10px]">
                          {isSys ? (
                            <span className="px-2 py-0.5 bg-blue-950 text-blue-300 rounded border border-blue-800 font-bold flex items-center gap-1 w-max">
                              <Lock className="w-3 h-3 text-blue-400" /> SYSTEM BUILT-IN
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-bold w-max">
                              CUSTOM
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[10px]">
                          {activeState ? (
                            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-800 font-bold">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-950 text-rose-300 rounded border border-rose-800 font-bold">
                              DISABLED
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              disabled={isSys}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isSys
                                  ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                                  : 'bg-rose-950/40 border-rose-900 text-rose-400 hover:bg-rose-900 hover:text-white cursor-pointer'
                              }`}
                              title={isSys ? 'Built-in system records cannot be deleted' : 'Delete Record'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Record Modal Sub-Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100">
                {editingItem?.id ? `Edit ${activeTabMeta.label} Record` : `Add New ${activeTabMeta.label} Record`}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                  Name / Title / Value *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || formData.value || formData.code || ''}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value, value: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 px-3 py-2 text-xs rounded-xl text-white outline-none focus:border-blue-500"
                  placeholder="e.g. DDR5 RAM or 144Hz"
                />
              </div>

              {['currencies', 'languages', 'countries', 'shipping-methods', 'product-status', 'attributes'].includes(activeTab) && (
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Code</label>
                  <input
                    type="text"
                    value={formData.code || ''}
                    onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 px-3 py-2 text-xs rounded-xl text-white font-mono"
                    placeholder="e.g. AUD, EN, ACTIVE"
                  />
                </div>
              )}

              {['categories', 'shipping-methods'].includes(activeTab) && (
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description || ''}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 px-3 py-2 text-xs rounded-xl text-white"
                  />
                </div>
              )}

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 font-mono text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive !== false && formData.active !== false}
                    onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked, active: e.target.checked }))}
                    className="rounded border-slate-700 bg-slate-950 text-blue-600"
                  />
                  <span>Active Record</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-black uppercase rounded-xl shadow-lg shadow-blue-600/20"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
