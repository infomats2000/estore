import React, { useState } from 'react';
import { Product, StoreSettings, DEFAULT_STORE_SETTINGS } from '../../types';
import { Package, Plus, Trash2, Search, Filter, ArrowUpDown, ChevronDown, Check, Download, AlertCircle, Edit2, Tag } from 'lucide-react';
import { PlusCircle, X, Upload, Coins, Boxes, AlertTriangle, CheckCircle, SlidersHorizontal, Edit3, History, FileSpreadsheet, RefreshCw, Printer, QrCode, Layers, Sparkles } from 'lucide-react';
import { parseCSVContent, autoMapCSVColumns, processCSVImportData, CSVParseResult, CSVColumnMapping } from '../../utils/csvImporter';
import { printProductLabelsBatch, generateBarcodeSVG, generateQRCodeSVG } from '../../utils/labelPrinter';


interface InventoryProductsProps {
  products: Product[];
  
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onClearAllProducts: () => void;
  onUpdateStoreSettings?: (settings: StoreSettings) => void;
  storeSettings?: StoreSettings;

  categories: string[];
  collections: string[];
}

export default function InventoryProducts({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onClearAllProducts,
  onUpdateStoreSettings,
  storeSettings,
  categories,
  collections
}: InventoryProductsProps) {
  const parseJsonResponse = async <T,>(response: Response): Promise<T> => {
    const raw = await response.text();
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = raw && isJson ? JSON.parse(raw) : null;

    if (!response.ok) {
      const serverMessage = data && typeof data === 'object' && 'error' in data ? String((data as { error?: unknown }).error) : '';
      if (serverMessage) throw new Error(serverMessage);
      if (response.status === 401) throw new Error('Authentication required. Please sign in to upload images.');
      throw new Error(`Request failed (${response.status}).`);
    }

    if (!data) {
      throw new Error('Server returned an empty response. Please try again.');
    }

    return data as T;
  };

  const lowStockThreshold = 5;
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('All');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'All' | 'InStock' | 'LowStock' | 'OutOfStock'>('All');
  const [inventorySortBy, setInventorySortBy] = useState<'id' | 'name' | 'stock-asc' | 'stock-desc' | 'price-asc' | 'price-desc'>('stock-asc');

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCat, setNewProdCat] = useState(categories[0] || 'Electronics');
  const [newProdCollection, setNewProdCollection] = useState(collections[0] || '');
  const [newProdStock, setNewProdStock] = useState('15');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdAdditionalImages, setNewProdAdditionalImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState('');
  const [newProdCondition, setNewProdCondition] = useState('New');
  const [newProdCpu, setNewProdCpu] = useState('');
  const [newProdRam, setNewProdRam] = useState('');
  const [newProdStorage, setNewProdStorage] = useState('');
  const [newProdWarranty, setNewProdWarranty] = useState('12 Months');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  
  const [showAddNewCondition, setShowAddNewCondition] = useState(false);
  const [tempNewCondition, setTempNewCondition] = useState('');
  const [showAddNewCpu, setShowAddNewCpu] = useState(false);
  const [tempNewCpu, setTempNewCpu] = useState('');
  const [showAddNewRam, setShowAddNewRam] = useState(false);
  const [tempNewRam, setTempNewRam] = useState('');
  const [showAddNewStorage, setShowAddNewStorage] = useState(false);
  const [tempNewStorage, setTempNewStorage] = useState('');
  const [showAddNewWarranty, setShowAddNewWarranty] = useState(false);
  const [tempNewWarranty, setTempNewWarranty] = useState('');

  const productConditions = storeSettings?.productConditions || DEFAULT_STORE_SETTINGS.productConditions || ['Brand New', 'Like New', 'Refurbished - Grade A', 'Refurbished - Grade B', 'Refurbished - Grade C', 'Open Box', 'For Parts / Repair'];
  const productCpus = storeSettings?.productCpus || DEFAULT_STORE_SETTINGS.productCpus || ['Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'Apple M1', 'Apple M2', 'Apple M3', 'AMD Ryzen 5', 'AMD Ryzen 7'];
  const productRams = storeSettings?.productRams || DEFAULT_STORE_SETTINGS.productRams || ['8GB DDR4', '16GB DDR4', '32GB DDR4', '64GB DDR4', '16GB Unified', '32GB Unified'];
  const productStorages = storeSettings?.productStorages || DEFAULT_STORE_SETTINGS.productStorages || ['256GB NVMe SSD', '512GB NVMe SSD', '1TB NVMe SSD', '2TB NVMe SSD'];
  const productWarranties = storeSettings?.productWarranties || DEFAULT_STORE_SETTINGS.productWarranties || ['3 Months', '6 Months', '12 Months Commercial', '24 Months Extended'];

  // CSV Importer State
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [csvParseResult, setCsvParseResult] = useState<CSVParseResult | null>(null);
  const [csvMapping, setCsvMapping] = useState<CSVColumnMapping>({
    name: '', price: '', stock: '', category: '', costPrice: '', discountPrice: '', description: '', condition: '', cpu: '', ram: '', storage: '', barcode: '', image: ''
  });

  // Barcode / QR Label Printer State
  const [showLabelPrintModal, setShowLabelPrintModal] = useState(false);
  const [labelPrintProduct, setLabelPrintProduct] = useState<Product | null>(null);
  const [labelPrintCount, setLabelPrintCount] = useState<number>(1);
  const [labelLayout, setLabelLayout] = useState<'thermal_roll_50x25' | 'a4_sheet_21up' | 'a4_sheet_24up'>('thermal_roll_50x25');
  const [labelShowLogo, setLabelShowLogo] = useState(true);
  const [labelShowPrice, setLabelShowPrice] = useState(true);
  const [labelShowSpecs, setLabelShowSpecs] = useState(true);
  const [labelShowCondition, setLabelShowCondition] = useState(true);
  const [labelShowBarcodeNum, setLabelShowBarcodeNum] = useState(true);
  const [labelShowQR, setLabelShowQR] = useState(true);

  // Multi-Select & Bulk Action State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [bulkNewCategory, setBulkNewCategory] = useState('');
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [bulkPriceType, setBulkPriceType] = useState<'percent' | 'fixed'>('percent');
  const [bulkPriceVal, setBulkPriceVal] = useState('');
  const [showBulkRefillModal, setShowBulkRefillModal] = useState(false);
  const [bulkRefillQty, setBulkRefillQty] = useState('10');

  // Audit Shrinkage & Reason Log Modal State
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [stockAdjustDelta, setStockAdjustDelta] = useState<number>(0);
  const [stockAdjustReason, setStockAdjustReason] = useState<'Supplier Shipment' | 'Damaged in Transit' | 'Store Demo Unit' | 'Customer Return' | 'Audit Discrepancy' | 'Physical Stocktake' | 'Manual Refill'>('Manual Refill');

  // Barcode Scanner Quick Lookup Modal (F2) State
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerQuery, setScannerQuery] = useState('');

  // Serialized Unit (S/N) Tracking State
  const [newProdSerialNumbers, setNewProdSerialNumbers] = useState<string[]>([]);
  const [tempSerialNumInput, setTempSerialNumInput] = useState('');

  const [isConvertingImage, setIsConvertingImage] = useState(false);
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
  const [supplierSelectedProductId, setSupplierSelectedProductId] = useState('');
  const [supplierOrderQty, setSupplierOrderQty] = useState('');
  const [supplierStatusMsg, setSupplierStatusMsg] = useState('');
  const [supplierIsOrdering, setSupplierIsOrdering] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  
  const setLowStockThreshold = (val: number) => {};

  const convertImageFileToDataUrl = async (file: File) => {
    if (!file) return '';

    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file (PNG, JPG, etc)');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit');
    }

    const reader = new FileReader();
    const imageData: string = await new Promise((resolve, reject) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageData;
    });

    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    const MAX_DIM = 1200;
    if (width > MAX_DIM || height > MAX_DIM) {
      if (width > height) {
        height = Math.round((height * MAX_DIM) / width);
        width = MAX_DIM;
      } else {
        width = Math.round((width * MAX_DIM) / height);
        height = MAX_DIM;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/webp', 0.85);
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setIsConvertingImage(true);
    setImageError('');

    try {
      const webpData = await convertImageFileToDataUrl(file);
      let imagePath = webpData;

      try {
        const uploadResponse = await fetch('/api/uploads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: webpData, folder: 'products' })
        });
        const uploadResult = await parseJsonResponse<{ path?: string }>(uploadResponse);
        if (uploadResult.path) imagePath = uploadResult.path;
      } catch (uploadErr) {
        console.warn('Upload API unavailable, storing image locally in product data.', uploadErr);
        setImageError('Upload service unavailable. Image kept locally and will still save with the product.');
      }

      setNewProdImage(imagePath);
      setIsConvertingImage(false);
    } catch (err) {
      console.error('Image conversion error:', err);
      setImageError(err instanceof Error ? err.message : 'Failed to process image. Please try another file.');
      setIsConvertingImage(false);
    }
  };

  const handleAdditionalImagesSelect = async (files: FileList | null) => {
    if (!files?.length) return;

    setIsConvertingImage(true);
    setImageError('');

    try {
      const convertedImages: string[] = [];
      for (const file of Array.from(files)) {
        const webpData = await convertImageFileToDataUrl(file);
        let imagePath = webpData;

        try {
          const uploadResponse = await fetch('/api/uploads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: webpData, folder: 'products' })
          });
          const uploadResult = await parseJsonResponse<{ path?: string }>(uploadResponse);
          if (uploadResult.path) imagePath = uploadResult.path;
        } catch (uploadErr) {
          console.warn('Additional image upload unavailable, storing locally.', uploadErr);
          setImageError('Upload service unavailable. Additional images were kept locally.');
        }

        convertedImages.push(imagePath);
      }

      if (convertedImages.length > 0) {
        setNewProdAdditionalImages(prev => [...prev, ...convertedImages]);
      }
      setIsConvertingImage(false);
    } catch (err) {
      console.error('Additional image conversion error:', err);
      setImageError(err instanceof Error ? err.message : 'Failed to process one or more images.');
      setIsConvertingImage(false);
    }
  };

  const handleQuickAdjustStock = (id: string, qty: number) => {
    const prod = products.find(p => p.id === id);
    if(prod) {
      onUpdateProduct({...prod, stock: Math.max(0, prod.stock + qty)});
    }
  };

  const handleStartEditing = (prod: any) => {
    setEditingProduct(prod);
    setShowAddProduct(true);
    setNewProdName(prod.name);
    setNewProdPrice(prod.price.toString());
    setNewProdStock(prod.stock.toString());
    setNewProdCat(prod.category);
    setNewProdCollection(prod.collection || '');
    setNewProdDesc(prod.description);
    setNewProdImage(prod.image);
    setNewProdAdditionalImages(prod.additionalImages || []);
    setNewProdCpu(prod.specs?.cpu || prod.specs?.CPU || prod.specs?.Processor || '');
    setNewProdRam(prod.specs?.ram || prod.specs?.RAM || '');
    setNewProdStorage(prod.specs?.storage || prod.specs?.Storage || '');
    setNewProdWarranty(prod.specs?.warranty || prod.specs?.Warranty || '');
    setNewProdCondition(prod.specs?.condition || prod.specs?.Condition || prod.specs?.Grade || '');
    setNewProdBarcode(prod.specs?.barcode || prod.specs?.Barcode || '');
    setNewProdSerialNumbers(prod.serialNumbers || []);
  };

  const handleCSVFileSelect = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setCsvRawText(text);
        const { headers, dataRows } = parseCSVContent(text);
        const autoMapping = autoMapCSVColumns(headers);
        setCsvMapping(autoMapping);
        const parsed = processCSVImportData(headers, dataRows, autoMapping, categories[0] || 'Laptops & Hardware');
        setCsvParseResult(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleCSVBatchCommit = () => {
    if (!csvParseResult) return;
    const validRows = csvParseResult.rows.filter(r => r.product && r.errors.length === 0);
    validRows.forEach(row => {
      if (row.product) {
        onAddProduct(row.product);
      }
    });
    alert(`Successfully imported ${validRows.length} catalog products into inventory!`);
    setShowCSVImportModal(false);
    setCsvRawText('');
    setCsvParseResult(null);
  };

  const handleTriggerPrint = () => {
    if (!labelPrintProduct) return;
    printProductLabelsBatch(
      labelPrintProduct,
      {
        labelCount: labelPrintCount || 1,
        layout: labelLayout,
        showStoreLogo: labelShowLogo,
        showPrice: labelShowPrice,
        showSpecs: labelShowSpecs,
        showCondition: labelShowCondition,
        showBarcodeNumber: labelShowBarcodeNum,
        showQRCode: labelShowQR
      },
      storeSettings?.storeName || 'TECH SELLER'
    );
    setShowLabelPrintModal(false);
  };

  const handleDownloadLedgerCSV = () => {};
  const handleClearLedger = () => {};
  const handleSupplierOrderSubmit = (e: any) => { e.preventDefault(); };

  // Replace History icon component usage with a regular div since History is conflicting with DOM History
  const HistoryIcon = History as any;

  

  
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice.trim() || !newProdStock.trim()) return;

    try {
      const payload = {
        name: newProdName,
        description: newProdDesc,
        categoryId: undefined,
        price: parseFloat(newProdPrice),
        stock: parseInt(newProdStock, 10),
        image: newProdImage.startsWith('/') ? newProdImage : '',
        additionalImages: newProdAdditionalImages,
        specs: {
          cpu: newProdCpu,
          ram: newProdRam,
          storage: newProdStorage,
          warranty: newProdWarranty,
          condition: newProdCondition,
          barcode: newProdBarcode,
        },
        tags: [],
        collection: newProdCollection || undefined,
        colors: [],
        sizes: []
      };

      let productData: any = null;
      try {
        const response = editingProduct
          ? await fetch(`/api/products/${editingProduct.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            })
          : await fetch('/api/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

        productData = await parseJsonResponse<any>(response);
      } catch (saveErr) {
        console.warn('Product API unavailable, saving product locally only.', saveErr);
      }

      const product: Product = {
        id: productData?.id || editingProduct?.id || `PROD-${Date.now()}`,
        name: productData?.name || newProdName,
        description: productData?.description || newProdDesc || '',
        category: newProdCat,
        collection: productData?.collection || newProdCollection || undefined,
        price: typeof productData?.price === 'number' ? productData.price : parseFloat(newProdPrice),
        discountPrice: productData?.discountPrice,
        image: productData?.image || newProdImage || '',
        additionalImages: productData?.additionalImages || newProdAdditionalImages || [],
        rating: productData?.rating || 0,
        reviewsCount: productData?.reviewsCount || 0,
        stock: typeof productData?.stock === 'number' ? productData.stock : parseInt(newProdStock, 10),
        sales: productData?.sales || 0,
        costPrice: productData?.costPrice,
        specs: productData?.specs || payload.specs || {},
        tags: productData?.tags || [],
        serialNumbers: newProdSerialNumbers
      };

      if (editingProduct) {
        onUpdateProduct(product);
      } else {
        onAddProduct(product);
      }
    } catch (err) {
      console.error('Product save error', err);
      setImageError(err instanceof Error ? err.message : 'Failed to save product');
      return;
    }

    setShowAddProduct(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    onDeleteProduct(id);
  };

  const exportInventory = () => {

    alert("Export feature coming soon.");
  };

  const totalValuation = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const lowStockCountLocal = products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold).length;

  const q = inventorySearchQuery.toLowerCase().trim();
  let filteredProds = products.filter(p => {
    const matchesSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.specs?.Barcode && p.specs.Barcode.toLowerCase().includes(q)) ||
      (p.serialNumbers && p.serialNumbers.some(sn => sn.toLowerCase().includes(q)));
    const matchesCategory = inventoryCategoryFilter === 'All' || p.category === inventoryCategoryFilter;
    
    let matchesStock = true;
    if (inventoryStockFilter === 'InStock') matchesStock = p.stock > 0;
    else if (inventoryStockFilter === 'OutOfStock') matchesStock = p.stock === 0;
    else if (inventoryStockFilter === 'LowStock') matchesStock = p.stock <= lowStockThreshold;
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  filteredProds = [...filteredProds].sort((a, b) => {
    if (inventorySortBy === 'id') return a.id.localeCompare(b.id);
    if (inventorySortBy === 'name') return a.name.localeCompare(b.name);
    if (inventorySortBy === 'stock-asc') return a.stock - b.stock;
    if (inventorySortBy === 'stock-desc') return b.stock - a.stock;
    if (inventorySortBy === 'price-asc') return a.price - b.price;
    if (inventorySortBy === 'price-desc') return b.price - a.price;
    return 0;
  });

  return (
          <div className="space-y-6 animate-fade-in" id="dashboard-tab-inventory">
            
            {/* Header banner with vibrant gradient and buttons */}
            <div className="bg-transparent text-neutral-900 dark:text-neutral-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/30 text-white shrink-0">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-mono text-[9px] uppercase font-bold tracking-widest text-blue-600 dark:text-blue-400">
                    <span className="bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      CATALOG DATABASE
                    </span>
                    <span className="text-neutral-500 dark:text-slate-400">• HARDWARE & COMPONENT AUDIT</span>
                  </div>
                  <h4 className="font-sans text-xl font-black uppercase tracking-tight text-neutral-900 dark:text-white mt-1 flex items-center gap-2">
                    Store Inventory & Stock Management
                  </h4>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setShowScannerModal(true)}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-sans text-xs uppercase tracking-wider font-black bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
                  title="Hands-free barcode scanner quick lookup overlay (Shortcut: F2)"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Scan Barcode (F2)</span>
                </button>

                <button
                  onClick={() => setShowCSVImportModal(true)}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-sans text-xs uppercase tracking-wider font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  title="Upload CSV or Excel spreadsheets to import products in bulk"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Import CSV / Excel</span>
                </button>

                <button
                  onClick={() => {
                    setLabelPrintProduct(products[0] || null);
                    setLabelPrintCount(1);
                    setShowLabelPrintModal(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-sans text-xs uppercase tracking-wider font-black bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                  title="Batch print QR Code and Barcode sticker labels for POS and stock stickers"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Barcode Labels</span>
                </button>

                {products.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('CRITICAL: Are you absolutely sure you want to delete ALL products from the catalog? This will completely empty the active store database and cannot be undone.')) {
                        onClearAllProducts();
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-sans text-xs uppercase tracking-wider font-black border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 bg-rose-50 dark:bg-rose-950/30 transition-all cursor-pointer shadow-md"
                    id="delete-all-products-btn"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Clear All ITEMs</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    if (showAddProduct && !editingProduct) {
                      setShowAddProduct(false);
                    } else {
                      setEditingProduct(null);
                      setNewProdName('');
                      setNewProdPrice('');
                      setNewProdStock('15');
                      setNewProdDesc('');
                      setNewProdImage('');
                      setNewProdAdditionalImages([]);
                      setImageError('');
                      setNewProdCondition('New');
                      setNewProdCpu('');
                      setNewProdRam('');
                      setNewProdStorage('');
                      setNewProdWarranty('12 Months');
                      setNewProdBarcode('');


                      setShowAddProduct(true);
                    }
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-sans text-xs uppercase tracking-wider font-black transition-all cursor-pointer shadow-md ${
                    showAddProduct && !editingProduct
                      ? 'bg-slate-700 text-white border border-slate-600' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/30'
                  }`}
                  id="toggle-create-item-btn"
                >
                  <PlusCircle className="h-4 w-4" /> 
                  <span>{showAddProduct && !editingProduct ? 'Close Form' : '+ Add New ITEM'}</span>
                </button>
              </div>
            </div>

            {/* Create ITEM Collapsible Form */}
            {showAddProduct && (
              <div className="rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-6 animate-fade-in" id="create-item-form-panel">
                <h5 className="font-sans text-[10px] font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-1.5 border-b border-neutral-400/60 dark:border-neutral-700/60 pb-2">
                  <Plus className="h-3.5 w-3.5" />
                  {editingProduct ? `Edit ITEM: ${editingProduct.id}` : 'Initialize Catalog ITEM Record'}
                </h5>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">Product Title</label>
                      <input
                        type="text"
                        required
                        placeholder="LUNAR LEATHER CROSSBODY BAG"
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs uppercase tracking-wider outline-none text-neutral-900 dark:text-neutral-100 focus:border-neutral-900 dark:focus:border-neutral-100"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">Category</label>
                      <select
                        value={newProdCat}
                        onChange={(e) => setNewProdCat(e.target.value)}
                        className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs outline-none text-neutral-900 dark:text-neutral-100 focus:border-neutral-900 dark:focus:border-neutral-100"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">Collection</label>
                      <select
                        value={newProdCollection}
                        onChange={(e) => setNewProdCollection(e.target.value)}
                        className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs outline-none text-neutral-900 dark:text-neutral-100 focus:border-neutral-900 dark:focus:border-neutral-100"
                      >
                        <option value="">None / Basic</option>
                        {collections.map((coll) => (
                          <option key={coll} value={coll}>{coll}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-neutral-300 dark:border-neutral-700 pt-4 mt-2">
                    <div>
                      <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">Condition / Grade</label>
                      <div className="flex gap-1">
                        <select 
                          value={newProdCondition} 
                          onChange={(e) => {
                            if (e.target.value === 'ADD_NEW') {
                              setShowAddNewCondition(true);
                            } else {
                              setNewProdCondition(e.target.value);
                            }
                          }}
                          className="flex-1 rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs outline-none text-neutral-900 dark:text-neutral-100 focus:border-neutral-900 dark:focus:border-neutral-100"
                        >
                          {productConditions.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value="ADD_NEW" className="text-blue-600 font-bold">+ Add New Condition</option>
                        </select>
                      </div>

                      {showAddNewCondition && (
                        <div className="mt-2 flex gap-1 animate-fade-in">
                          <input 
                            type="text" 
                            placeholder="New Condition Name..."
                            value={tempNewCondition}
                            onChange={(e) => setTempNewCondition(e.target.value)}
                            className="flex-1 rounded-none border border-blue-500 dark:border-blue-400 bg-white dark:bg-neutral-950 p-2 font-sans text-[10px] outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (tempNewCondition.trim() && onUpdateStoreSettings && storeSettings) {
                                const updatedConditions = [...productConditions, tempNewCondition.trim()];
                                onUpdateStoreSettings({
                                  ...storeSettings,
                                  productConditions: updatedConditions
                                });
                                setNewProdCondition(tempNewCondition.trim());
                                setTempNewCondition('');
                                setShowAddNewCondition(false);
                              }
                            }}
                            className="bg-blue-600 text-white px-2 py-1 text-[9px] font-black uppercase"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddNewCondition(false)}
                            className="bg-neutral-200 dark:bg-neutral-800 text-neutral-500 px-2 py-1 text-[9px] font-black uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Processor / CPU Dropdown with Add Custom Option */}
                    <div>
                      <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">Processor / CPU</label>
                      <select
                        value={newProdCpu}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW_CPU') {
                            setShowAddNewCpu(true);
                          } else {
                            setNewProdCpu(e.target.value);
                          }
                        }}
                        className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-2.5 font-sans text-xs outline-none text-neutral-900 dark:text-neutral-100"
                      >
                        <option value="">Select CPU...</option>
                        {productCpus.map(cpu => (
                          <option key={cpu} value={cpu}>{cpu}</option>
                        ))}
                        {newProdCpu && !productCpus.includes(newProdCpu) && (
                          <option value={newProdCpu}>{newProdCpu}</option>
                        )}
                        <option value="ADD_NEW_CPU" className="text-blue-600 font-bold">+ Add Custom CPU</option>
                      </select>

                      {showAddNewCpu && (
                        <div className="mt-1.5 flex gap-1 animate-fade-in">
                          <input
                            type="text"
                            placeholder="e.g. Apple M4 Max, i9-14900KS..."
                            value={tempNewCpu}
                            onChange={(e) => setTempNewCpu(e.target.value)}
                            className="flex-1 rounded-none border border-blue-500 bg-white dark:bg-neutral-950 p-1.5 text-[10px] outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (tempNewCpu.trim()) {
                                const val = tempNewCpu.trim();
                                if (onUpdateStoreSettings && storeSettings) {
                                  onUpdateStoreSettings({ ...storeSettings, productCpus: [...productCpus, val] });
                                }
                                setNewProdCpu(val);
                                setTempNewCpu('');
                                setShowAddNewCpu(false);
                              }
                            }}
                            className="bg-blue-600 text-white px-2 py-1 text-[9px] font-black uppercase"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddNewCpu(false)}
                            className="bg-neutral-200 dark:bg-neutral-800 text-neutral-500 px-2 py-1 text-[9px] font-black uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Memory / RAM Dropdown with Add Custom Option */}
                    <div>
                      <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">Memory / RAM</label>
                      <select
                        value={newProdRam}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW_RAM') {
                            setShowAddNewRam(true);
                          } else {
                            setNewProdRam(e.target.value);
                          }
                        }}
                        className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-2.5 font-sans text-xs outline-none text-neutral-900 dark:text-neutral-100"
                      >
                        <option value="">Select RAM...</option>
                        {productRams.map(ram => (
                          <option key={ram} value={ram}>{ram}</option>
                        ))}
                        {newProdRam && !productRams.includes(newProdRam) && (
                          <option value={newProdRam}>{newProdRam}</option>
                        )}
                        <option value="ADD_NEW_RAM" className="text-blue-600 font-bold">+ Add Custom RAM</option>
                      </select>

                      {showAddNewRam && (
                        <div className="mt-1.5 flex gap-1 animate-fade-in">
                          <input
                            type="text"
                            placeholder="e.g. 128GB DDR5, 48GB Unified..."
                            value={tempNewRam}
                            onChange={(e) => setTempNewRam(e.target.value)}
                            className="flex-1 rounded-none border border-blue-500 bg-white dark:bg-neutral-950 p-1.5 text-[10px] outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (tempNewRam.trim()) {
                                const val = tempNewRam.trim();
                                if (onUpdateStoreSettings && storeSettings) {
                                  onUpdateStoreSettings({ ...storeSettings, productRams: [...productRams, val] });
                                }
                                setNewProdRam(val);
                                setTempNewRam('');
                                setShowAddNewRam(false);
                              }
                            }}
                            className="bg-blue-600 text-white px-2 py-1 text-[9px] font-black uppercase"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddNewRam(false)}
                            className="bg-neutral-200 dark:bg-neutral-800 text-neutral-500 px-2 py-1 text-[9px] font-black uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Storage Dropdown with Add Custom Option */}
                    <div>
                      <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">Storage</label>
                      <select
                        value={newProdStorage}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW_STORAGE') {
                            setShowAddNewStorage(true);
                          } else {
                            setNewProdStorage(e.target.value);
                          }
                        }}
                        className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-2.5 font-sans text-xs outline-none text-neutral-900 dark:text-neutral-100"
                      >
                        <option value="">Select Storage...</option>
                        {productStorages.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                        {newProdStorage && !productStorages.includes(newProdStorage) && (
                          <option value={newProdStorage}>{newProdStorage}</option>
                        )}
                        <option value="ADD_NEW_STORAGE" className="text-blue-600 font-bold">+ Add Custom Storage</option>
                      </select>

                      {showAddNewStorage && (
                        <div className="mt-1.5 flex gap-1 animate-fade-in">
                          <input
                            type="text"
                            placeholder="e.g. 4TB Gen4 NVMe, 8TB Enterprise..."
                            value={tempNewStorage}
                            onChange={(e) => setTempNewStorage(e.target.value)}
                            className="flex-1 rounded-none border border-blue-500 bg-white dark:bg-neutral-950 p-1.5 text-[10px] outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (tempNewStorage.trim()) {
                                const val = tempNewStorage.trim();
                                if (onUpdateStoreSettings && storeSettings) {
                                  onUpdateStoreSettings({ ...storeSettings, productStorages: [...productStorages, val] });
                                }
                                setNewProdStorage(val);
                                setTempNewStorage('');
                                setShowAddNewStorage(false);
                              }
                            }}
                            className="bg-blue-600 text-white px-2 py-1 text-[9px] font-black uppercase"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddNewStorage(false)}
                            className="bg-neutral-200 dark:bg-neutral-800 text-neutral-500 px-2 py-1 text-[9px] font-black uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Warranty Dropdown with Add Custom Option */}
                    <div>
                      <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">Warranty</label>
                      <select
                        value={newProdWarranty}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW_WARRANTY') {
                            setShowAddNewWarranty(true);
                          } else {
                            setNewProdWarranty(e.target.value);
                          }
                        }}
                        className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-2.5 font-sans text-xs outline-none text-neutral-900 dark:text-neutral-100"
                      >
                        {productWarranties.map(w => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                        {newProdWarranty && !productWarranties.includes(newProdWarranty) && (
                          <option value={newProdWarranty}>{newProdWarranty}</option>
                        )}
                        <option value="ADD_NEW_WARRANTY" className="text-blue-600 font-bold">+ Add Custom Warranty</option>
                      </select>

                      {showAddNewWarranty && (
                        <div className="mt-1.5 flex gap-1 animate-fade-in">
                          <input
                            type="text"
                            placeholder="e.g. 3 Years On-Site..."
                            value={tempNewWarranty}
                            onChange={(e) => setTempNewWarranty(e.target.value)}
                            className="flex-1 rounded-none border border-blue-500 bg-white dark:bg-neutral-950 p-1.5 text-[10px] outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (tempNewWarranty.trim()) {
                                const val = tempNewWarranty.trim();
                                if (onUpdateStoreSettings && storeSettings) {
                                  onUpdateStoreSettings({ ...storeSettings, productWarranties: [...productWarranties, val] });
                                }
                                setNewProdWarranty(val);
                                setTempNewWarranty('');
                                setShowAddNewWarranty(false);
                              }
                            }}
                            className="bg-blue-600 text-white px-2 py-1 text-[9px] font-black uppercase"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddNewWarranty(false)}
                            className="bg-neutral-200 dark:bg-neutral-800 text-neutral-500 px-2 py-1 text-[9px] font-black uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Barcode / Serial Number Input */}
                    <div>
                      <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">Barcode / Serial #</label>
                      <input type="text" placeholder="Scan barcode or auto-assign..." value={newProdBarcode} onChange={(e) => setNewProdBarcode(e.target.value)} className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-2.5 font-sans text-xs outline-none text-neutral-900 dark:text-neutral-100" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">Base Price ($)</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        placeholder="99.00"
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(e.target.value)}
                        className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs outline-none text-neutral-900 dark:text-neutral-100 focus:border-neutral-900 dark:focus:border-neutral-100"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">Starting Stock</label>
                      <input
                        type="number"
                        required
                        placeholder="15"
                        value={newProdStock}
                        onChange={(e) => setNewProdStock(e.target.value)}
                        className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs outline-none text-neutral-900 dark:text-neutral-100 focus:border-neutral-900 dark:focus:border-neutral-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">
                      Product Image (Upload & Auto-optimized to WebP)
                    </label>
                    <div className="space-y-3">
                      {newProdImage ? (
                        <div className="relative border border-neutral-400 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 p-3 flex items-center gap-4 group">
                          <div className="h-16 w-16 bg-neutral-100 dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img 
                              src={newProdImage} 
                              alt="Product Preview" 
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-800 dark:text-neutral-200 font-bold truncate">
                              Image ready
                            </p>
                            <p className="font-mono text-[8px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">
                              ✓ Auto-converted to high-efficiency WebP format
                            </p>
                            {newProdImage.startsWith('data:') && (
                              <p className="font-mono text-[8px] text-neutral-400 mt-0.5">
                                Size: {Math.round((newProdImage.length * 3) / 4 / 1024)} KB
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNewProdImage('');
                              setImageError('');
                            }}
                            className="absolute top-2 right-2 p-1 bg-white hover:bg-rose-50 border border-neutral-400 hover:border-rose-300 dark:bg-neutral-900 dark:hover:bg-rose-950/20 dark:border-neutral-700 dark:hover:border-rose-900 text-neutral-400 hover:text-rose-500 transition-all cursor-pointer"
                            title="Remove image"
                            id="remove-uploaded-image-btn"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className={`relative border-2 border-dashed rounded-none p-6 text-center transition-all ${
                            isConvertingImage 
                              ? 'border-neutral-400 bg-neutral-50/50 dark:border-neutral-700 dark:bg-neutral-900/50' 
                              : 'border-neutral-400 hover:border-neutral-400 bg-white dark:border-neutral-700 dark:bg-neutral-950 dark:hover:border-neutral-700'
                          }`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const files = e.dataTransfer.files;
                            if (files && files[0]) {
                              await handleFileSelect(files[0]);
                            }
                          }}
                          id="image-dropzone"
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (files && files[0]) {
                                await handleFileSelect(files[0]);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            id="image-file-input"
                          />
                          {isConvertingImage ? (
                            <div className="space-y-2 py-2">
                              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-neutral-900 dark:border-neutral-100 border-r-transparent align-[-0.125em]" />
                              <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-bold">
                                Optimizing & converting to WebP...
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1.5 py-1">
                              <div className="flex justify-center text-neutral-400 dark:text-neutral-600">
                                <Upload className="h-6 w-6" />
                              </div>
                              <p className="font-sans text-xs text-neutral-600 dark:text-neutral-300">
                                <span className="font-bold underline">Click to upload</span> or drag and drop
                              </p>
                              <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 font-bold">
                                PNG, JPG, GIF, WebP up to 10MB
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {imageError && (
                        <p className="font-mono text-[9px] text-rose-500 font-bold mt-1">
                          ⚠ {imageError}
                        </p>
                      )}
                      
                      <span className="text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mt-1 font-bold">
                        If left empty, an elegant leather graphic is generated.
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">
                      Additional Product Images
                    </label>
                    <div className="space-y-3">
                      {newProdAdditionalImages.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {newProdAdditionalImages.map((img, idx) => (
                            <div key={`${img}-${idx}`} className="relative border border-neutral-400 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 p-2">
                              <img src={img} alt={`Additional product ${idx + 1}`} className="h-24 w-full object-cover" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={() => {
                                  setNewProdAdditionalImages(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="absolute top-1.5 right-1.5 p-1 bg-white hover:bg-rose-50 border border-neutral-400 hover:border-rose-300 dark:bg-neutral-900 dark:hover:bg-rose-950/20 dark:border-neutral-700 dark:hover:border-rose-900 text-neutral-400 hover:text-rose-500 transition-all cursor-pointer"
                                title="Remove image"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-4 text-center">
                          <p className="font-sans text-xs text-neutral-600 dark:text-neutral-300">
                            Add more gallery images for this product.
                          </p>
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={async (e) => {
                          await handleAdditionalImagesSelect(e.target.files);
                          e.target.value = '';
                        }}
                        className="block w-full text-sm text-neutral-700 dark:text-neutral-300 file:mr-3 file:rounded-none file:border file:border-neutral-400 file:bg-neutral-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-neutral-900 hover:file:bg-neutral-200 dark:file:bg-neutral-800 dark:file:text-neutral-100 dark:hover:file:bg-neutral-700"
                      />
                      <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 font-bold">
                        Upload several images to save them as the product gallery.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">Description</label>
                    <textarea
                      rows={3}
                      placeholder="ENTER SHORT HIGHLIGHTS, MATERIALS USED..."
                      value={newProdDesc}
                      onChange={(e) => setNewProdDesc(e.target.value)}
                      className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs uppercase tracking-wider outline-none text-neutral-900 dark:text-neutral-100 focus:border-neutral-900 dark:focus:border-neutral-100"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="rounded-none bg-neutral-950 dark:bg-neutral-100 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      {editingProduct ? 'Save Changes' : 'Add to Catalog'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddProduct(false);
                        setEditingProduct(null);
                        setNewProdName('');
                        setNewProdPrice('');
                        setNewProdStock('15');
                        setNewProdDesc('');
                        setNewProdImage('');
                        setImageError('');
                        setNewProdCondition('New');
                        setNewProdCpu('');
                        setNewProdRam('');
                        setNewProdStorage('');
                        setNewProdWarranty('12 Months');
                        setNewProdBarcode('');
                      }}
                      className="rounded-none border border-neutral-400 dark:border-neutral-700 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors cursor-pointer"
                    >
                      {editingProduct ? 'Cancel Edit' : 'Cancel'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="inventory-metrics-scoreboard">
              {/* Card 1: Total Valuation */}
              <div className="border-2 border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                <div className="h-12 w-12 shrink-0 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                  <Coins className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md block w-fit">
                    Capital Assets Value
                  </span>
                  <div className="font-mono text-xl font-black text-slate-900 dark:text-white mt-1">
                    ${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="font-sans text-[9px] uppercase text-slate-500 dark:text-slate-400 font-extrabold block mt-0.5">
                    Weighted Price × Stock
                  </span>
                </div>
              </div>

              {/* Card 2: Total Units */}
              <div className="border-2 border-blue-200 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                <div className="h-12 w-12 shrink-0 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center">
                  <Boxes className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-md block w-fit">
                    Total Units Stocked
                  </span>
                  <div className="font-mono text-xl font-black text-slate-900 dark:text-white mt-1">
                    {totalUnits.toLocaleString()} <span className="text-xs text-slate-500">units</span>
                  </div>
                  <span className="font-sans text-[9px] uppercase text-slate-500 dark:text-slate-400 font-extrabold block mt-0.5">
                    Across {products.length} catalog items
                  </span>
                </div>
              </div>

              {/* Card 3: Low Stock Alerts */}
              <div className="border-2 border-amber-200 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/60 via-white to-yellow-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                <div className={`h-12 w-12 shrink-0 rounded-2xl shadow-lg flex items-center justify-center ${
                  lowStockCountLocal > 0 
                    ? 'bg-amber-500 text-white shadow-amber-500/30 animate-pulse' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 shadow-none'
                }`}>
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md block w-fit">
                    Low Stock Warnings
                  </span>
                  <div className="font-mono text-xl font-black text-slate-900 dark:text-white mt-1">
                    {lowStockCountLocal} <span className="text-xs text-slate-500">Alerts</span>
                  </div>
                  <div className="font-sans text-[9px] uppercase text-slate-500 dark:text-slate-400 font-extrabold flex items-center gap-1 mt-0.5">
                    Threshold &lt;= 
                    <input 
                      type="number" 
                      value={lowStockThreshold} 
                      onChange={e => setLowStockThreshold(Math.max(1, parseInt(e.target.value) || 1))} 
                      className="w-10 font-bold text-center border-b-2 border-amber-400 bg-amber-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Out of Stock */}
              <div className="border-2 border-rose-200 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/60 via-white to-pink-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/20 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                <div className={`h-12 w-12 shrink-0 rounded-2xl shadow-lg flex items-center justify-center ${
                  outOfStockCount > 0 
                    ? 'bg-rose-600 text-white shadow-rose-500/30' 
                    : 'bg-emerald-600 text-white shadow-emerald-500/30'
                }`}>
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <span className={`font-mono text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md block w-fit ${
                    outOfStockCount > 0 ? 'text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950' : 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950'
                  }`}>
                    Out of Stock ITEMs
                  </span>
                  <div className={`font-mono text-xl font-black mt-1 ${outOfStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                    {outOfStockCount} <span className="text-xs text-slate-500">ITEMs</span>
                  </div>
                  <span className="font-sans text-[9px] uppercase text-slate-500 dark:text-slate-400 font-extrabold block mt-0.5">
                    {outOfStockCount > 0 ? 'Immediate refill required' : 'Inventory Healthy'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pristine Filters & Audit Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-neutral-50 dark:bg-neutral-900 p-4 border border-neutral-400 dark:border-neutral-700">
              
              {/* Search Box */}
              <div className="relative flex-1 max-w-sm">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="SEARCH PRODUCTS BY NAME OR ITEM..."
                  value={inventorySearchQuery}
                  onChange={(e) => setInventorySearchQuery(e.target.value)}
                  className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 pl-9 pr-14 py-2.5 font-sans text-[10px] uppercase tracking-widest outline-none text-neutral-900 dark:text-neutral-100 focus:border-neutral-900 dark:focus:border-neutral-100 placeholder:text-neutral-500"
                />
                {inventorySearchQuery && (
                  <button 
                    onClick={() => setInventorySearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 font-mono text-[8px] uppercase tracking-widest font-black text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-wrap items-center">
                
                {/* Category Filter */}
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[8px] uppercase text-neutral-400 font-black">Cat:</span>
                  <select
                    value={inventoryCategoryFilter}
                    onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                    className="flex-1 rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-2 font-sans text-[9px] uppercase tracking-widest font-bold outline-none text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="All">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Stock Level Filter */}
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[8px] uppercase text-neutral-400 font-black">Stock:</span>
                  <select
                    value={inventoryStockFilter}
                    onChange={(e) => setInventoryStockFilter(e.target.value as any)}
                    className="flex-1 rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-955 p-2 font-sans text-[9px] uppercase tracking-widest font-bold outline-none text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="All">All Levels</option>
                    <option value="InStock">In Stock (&gt;0)</option>
                    <option value="LowStock">Low Stock (&lt;={lowStockThreshold})</option>
                    <option value="OutOfStock">Out of Stock (0)</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[8px] uppercase text-neutral-400 font-black">Sort:</span>
                  <select
                    value={inventorySortBy}
                    onChange={(e) => setInventorySortBy(e.target.value as any)}
                    className="flex-1 rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-955 p-2 font-sans text-[9px] uppercase tracking-widest font-bold outline-none text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="stock-asc">Stock (Low → High)</option>
                    <option value="stock-desc">Stock (High → Low)</option>
                    <option value="name">Product Name (A-Z)</option>
                    <option value="price-asc">Price (Low → High)</option>
                    <option value="price-desc">Price (High → Low)</option>
                    <option value="id">ITEM Identifier</option>
                  </select>
                </div>

              </div>

            </div>

            {/* Main Interactive Product ITEM Table */}
            {filteredProds.length === 0 ? (
              <div className="rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-12 text-center shadow-none text-neutral-950 dark:text-neutral-50">
                <SlidersHorizontal className="h-8 w-8 text-neutral-350 dark:text-neutral-600 mx-auto mb-4" />
                <h5 className="font-sans text-xs font-bold uppercase tracking-widest text-neutral-800 dark:text-neutral-200">No Matching ITEMs Found</h5>
                <p className="font-sans text-[10px] uppercase tracking-wider text-neutral-700 dark:text-neutral-300 max-w-sm mx-auto mt-2 leading-relaxed">
                  No active catalog products match the specified criteria. Try removing some filters or search words.
                </p>
                <button
                  onClick={() => {
                    setInventorySearchQuery('');
                    setInventoryCategoryFilter('All');
                    setInventoryStockFilter('All');
                    setInventorySortBy('stock-asc');
                  }}
                  className="mt-4 px-4 py-2 font-sans text-[9px] font-black uppercase tracking-widest bg-neutral-950 text-white dark:bg-neutral-100 dark:text-neutral-955 hover:opacity-90 cursor-pointer"
                >
                  Reset Toolbar
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-none border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-none">
                <table className="w-full border-collapse font-sans text-xs text-left">
                  <thead className="bg-neutral-300 dark:bg-neutral-800 border-b border-neutral-500 dark:border-neutral-600 font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 font-bold">
                    <tr>
                      <th className="p-4 pl-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={filteredProds.length > 0 && selectedProductIds.length === filteredProds.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds(filteredProds.map(p => p.id));
                            } else {
                              setSelectedProductIds([]);
                            }
                          }}
                          className="rounded accent-blue-600 cursor-pointer"
                          title="Select All Filtered Products"
                        />
                      </th>
                      <th className="p-4 pl-2">Catalog Product</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Unit Price</th>
                      <th className="p-4">Inventory Stock Level</th>
                      <th className="p-4">Interactive Quick Refill</th>
                      <th className="p-4 text-right pr-6">ITEM Adjust / Save</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {filteredProds.map((prod) => {
                      const isEditing = editingProduct?.id === prod.id;
                      const isLowStock = prod.stock > 0 && prod.stock <= lowStockThreshold;
                      const isOutOfStock = prod.stock === 0;

                      return (
                        <tr key={prod.id} className={`hover:bg-neutral-50 dark:hover:bg-neutral-850/50 transition-colors ${
                          selectedProductIds.includes(prod.id) ? 'bg-blue-500/10 dark:bg-blue-950/20' : ''
                        }`}>
                          
                          {/* Checkbox Column */}
                          <td className="p-4 pl-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.includes(prod.id)}
                              onChange={() => {
                                setSelectedProductIds(prev =>
                                  prev.includes(prod.id) ? prev.filter(id => id !== prod.id) : [...prev, prod.id]
                                );
                              }}
                              className="rounded accent-blue-600 cursor-pointer"
                            />
                          </td>

                          {/* Image & Title Column */}
                          <td className="p-4 pl-2">
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.image || null}
                                alt={prod.name}
                                className="h-10 w-10 rounded-none object-cover bg-neutral-100 dark:bg-neutral-950 border border-neutral-400 dark:border-neutral-700 flex-shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0 max-w-[150px] md:max-w-[220px]">
                                <h5 className="font-bold text-neutral-955 dark:text-neutral-100 uppercase tracking-wider truncate" title={prod.name}>
                                  {prod.name}
                                </h5>
                                <span className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block font-bold mt-0.5">{prod.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="p-4">
                            <span className="rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-2.5 py-0.5 font-mono text-[9px] text-neutral-600 dark:text-neutral-400 font-bold uppercase tracking-widest">
                              {prod.category}
                            </span>
                          </td>

                          {/* Price Column */}
                          <td className="p-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                            <span>${prod.price.toFixed(2)}</span>
                          </td>

                          {/* Stock Level Column */}
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-black ${
                                isOutOfStock ? 'text-rose-600 dark:text-rose-400' :
                                isLowStock ? 'text-amber-600 dark:text-amber-400' :
                                'text-neutral-900 dark:text-neutral-100'
                              }`}>
                                {prod.stock} pcs
                              </span>
                              {isOutOfStock ? (
                                <span className="text-[8px] uppercase tracking-widest bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-none px-2 py-0.5 font-bold font-mono">Sold Out</span>
                              ) : isLowStock ? (
                                <span className="text-[8px] uppercase tracking-widest bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 rounded-none px-2 py-0.5 font-bold font-mono animate-pulse">Low</span>
                              ) : (
                                <span className="text-[8px] uppercase tracking-widest bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-none px-1.5 py-0.5 font-bold font-mono">Good</span>
                              )}
                            </div>
                          </td>

                          {/* Interactive Quick Refill Column */}
                          <td className="p-4">
                            <div className="flex items-center gap-1 font-mono text-[8px] font-bold">
                              <button
                                onClick={() => handleQuickAdjustStock(prod.id, -5)}
                                className="border border-neutral-400 hover:border-neutral-950 bg-white hover:bg-neutral-50 dark:border-neutral-850 dark:bg-neutral-950 dark:hover:bg-neutral-850 px-2 py-1 transition-all duration-300 cursor-pointer"
                                title="Subtract 5 units"
                                id={`quick-minus-5-${prod.id}`}
                              >
                                -5
                              </button>
                              <button
                                onClick={() => handleQuickAdjustStock(prod.id, 10)}
                                className="border border-neutral-400 hover:border-neutral-950 bg-white hover:bg-neutral-50 dark:border-neutral-850 dark:bg-neutral-950 dark:hover:bg-neutral-850 px-2 py-1 transition-all duration-300 cursor-pointer"
                                title="Add 10 units"
                                id={`quick-plus-10-${prod.id}`}
                              >
                                +10
                              </button>
                              <button
                                onClick={() => handleQuickAdjustStock(prod.id, 25)}
                                className="border border-neutral-400 hover:border-neutral-950 bg-white hover:bg-neutral-50 dark:border-neutral-850 dark:bg-neutral-950 dark:hover:bg-neutral-850 px-2 py-1 transition-all duration-300 cursor-pointer"
                                title="Add 25 units"
                                id={`quick-plus-25-${prod.id}`}
                              >
                                +25
                              </button>
                              <button
                                onClick={() => handleQuickAdjustStock(prod.id, -prod.stock)}
                                className="border border-neutral-400 hover:border-rose-500 bg-white hover:bg-rose-50 dark:border-neutral-850 dark:bg-neutral-950 dark:hover:bg-rose-900/30 px-2 py-1 transition-all duration-300 text-neutral-400 hover:text-rose-600 cursor-pointer"
                                title="Reset stock to zero"
                                id={`quick-clear-${prod.id}`}
                              >
                                Clear
                              </button>
                            </div>
                          </td>

                          {/* Action Buttons Column */}
                          <td className="p-4 text-right pr-6">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setLabelPrintProduct(prod);
                                  setLabelPrintCount(prod.stock || 1);
                                  setShowLabelPrintModal(true);
                                }}
                                className="rounded-none border border-neutral-400 dark:border-neutral-700 p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                title="Print QR & Barcode sticker labels for this item"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleStartEditing(prod)}
                                className={`rounded-none border border-neutral-400 dark:border-neutral-700 p-1.5 transition-colors cursor-pointer ${
                                  editingProduct?.id === prod.id 
                                    ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100' 
                                    : 'text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                                }`}
                                title="Edit product details"
                                id={`edit-stock-btn-${prod.id}`}
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setProductToDelete(prod.id)}
                                className="rounded-none border border-neutral-400 dark:border-neutral-700 p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors cursor-pointer"
                                title="Delete from catalog"
                                id={`delete-product-btn-${prod.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Custom Multi-Column Bento Grid for Audit Trail Ledger & Supplier PO Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="inventory-bottom-bento">
              
              {/* Column 1: Inventory Movements Ledger Audit Trail (Left, 7 columns) */}
              <div className="lg:col-span-7 border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 rounded-none text-left flex flex-col justify-between" id="bento-audit-ledger">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-850 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <HistoryIcon className="h-4 w-4 text-neutral-400" />
                      <h5 className="font-sans text-xs font-bold uppercase tracking-widest text-neutral-955 dark:text-neutral-50">
                        Stock Movement Audit Trail
                      </h5>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleDownloadLedgerCSV}
                        disabled={inventoryLogs.length === 0}
                        className="flex items-center gap-1 border border-neutral-400 dark:border-neutral-850 hover:border-neutral-950 dark:hover:border-neutral-400 bg-white dark:bg-neutral-950 px-2 py-1 text-[8px] font-mono font-bold uppercase tracking-wider text-neutral-650 dark:text-neutral-300 disabled:opacity-50 cursor-pointer"
                        title="Download CSV Ledger"
                        id="download-ledger-csv-btn"
                      >
                        <FileSpreadsheet className="h-2.5 w-2.5" />
                        <span>CSV Export</span>
                      </button>
                      <button
                        onClick={handleClearLedger}
                        disabled={inventoryLogs.length === 0}
                        className="flex items-center gap-1 border border-neutral-400 dark:border-neutral-850 hover:border-rose-500 bg-white dark:bg-neutral-950 px-2 py-1 text-[8px] font-mono font-bold uppercase tracking-wider text-neutral-450 hover:text-rose-600 disabled:opacity-50 cursor-pointer"
                        title="Purge logs"
                        id="purge-ledger-btn"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>

                  {inventoryLogs.length === 0 ? (
                    <div className="p-8 text-center text-neutral-700 dark:text-neutral-300">
                      <HistoryIcon className="h-6 w-6 mx-auto mb-2 opacity-40" />
                      <span className="font-mono text-[9px] uppercase tracking-widest block font-bold">Ledger Is Clear</span>
                      <p className="font-sans text-[9px] mt-1 uppercase tracking-wider">No stock actions recorded in this session yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-y-auto max-h-72 divide-y divide-neutral-150 dark:divide-neutral-700 border border-neutral-150 dark:border-neutral-850">
                      {inventoryLogs.map((log) => {
                        const isRestock = log.type === 'restock';
                        const isSale = log.type === 'sale';
                        return (
                          <div key={log.id} className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-850/20 transition-colors flex items-center justify-between text-xs gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] text-neutral-700 dark:text-neutral-300 font-bold">
                                  {log.timestamp}
                                </span>
                                <span className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
                                  ITEM: {log.item}
                                </span>
                              </div>
                              <div className="font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide text-[9.5px] truncate mt-0.5">
                                {log.productName}
                              </div>
                              <div className="text-[9px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mt-0.5 font-mono">
                                Trigger: <strong className="text-neutral-800 dark:text-neutral-200">{log.user}</strong>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 font-mono text-[10px] font-black border ${
                                isRestock ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' :
                                isSale ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30' :
                                'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30'
                              }`}>
                                <span>{log.qty > 0 ? `+${log.qty}` : log.qty}</span>
                                <span className="text-[7px] uppercase font-bold tracking-widest opacity-80">{log.type}</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-700 dark:text-neutral-300 mt-4 leading-relaxed">
                  * Stock tracking registers manual adjustments, quick refuels, supplier PO fulfillment, and real customer checkouts.
                </p>
              </div>

              {/* Column 2: Supplier Reorder Transmission PO Simulator (Right, 5 columns) */}
              <div className="lg:col-span-5 border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 rounded-none text-left flex flex-col justify-between" id="bento-supplier-po">
                <div>
                  <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-850 pb-3 mb-4">
                    <RefreshCw className="h-4 w-4 text-neutral-400" />
                    <h5 className="font-sans text-xs font-bold uppercase tracking-widest text-neutral-955 dark:text-neutral-50">
                      Supplier Reorder PO Transmission
                    </h5>
                  </div>
                  
                  <p className="font-sans text-[10px] text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-4 leading-relaxed">
                    Instantly authorize external manufacturing supply runs to automatically add direct stock of selected ITEMs.
                  </p>

                  <form onSubmit={handleSupplierOrderSubmit} className="space-y-4">
                    {/* Selected product to restock */}
                    <div>
                      <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">Refill Target Product ITEM</label>
                      <select
                        value={supplierSelectedProductId}
                        onChange={(e) => setSupplierSelectedProductId(e.target.value)}
                        className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs outline-none text-neutral-900 dark:text-neutral-100 focus:border-neutral-900 dark:focus:border-neutral-100"
                        id="supplier-product-item-select"
                      >
                        <option value="" disabled>-- SELECT ITEM FROM CATALOG --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            [{p.id.toUpperCase()}] {p.name.toUpperCase()} ({p.stock} pcs left)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* PO refill count */}
                    <div>
                      <label className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block mb-1 font-bold">PO Refill Volume (Units)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="50"
                        value={supplierOrderQty}
                        onChange={(e) => setSupplierOrderQty(e.target.value)}
                        className="w-full rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-600 p-2.5 font-sans text-xs outline-none text-neutral-900 dark:text-neutral-100 focus:border-neutral-900 dark:focus:border-neutral-100"
                        id="supplier-qty-input"
                      />
                    </div>

                    {/* Status Logger / Feed response */}
                    {supplierStatusMsg && (
                      <div className="rounded-none bg-neutral-50 dark:bg-neutral-950 border border-neutral-400 dark:border-neutral-850 p-3 animate-fade-in">
                        <div className="flex items-center gap-2">
                          {supplierIsOrdering ? (
                            <RefreshCw className="h-3 w-3 text-neutral-500 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          )}
                          <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-bold block">
                            System Response Log:
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-neutral-900 dark:text-neutral-200 mt-1 leading-relaxed">
                          &gt; {supplierStatusMsg}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={supplierIsOrdering || products.length === 0}
                      className="w-full rounded-none bg-neutral-950 dark:bg-neutral-100 px-4 py-2.5 font-sans text-[10px] uppercase tracking-widest font-bold text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      id="supplier-po-submit-btn"
                    >
                      {supplierIsOrdering ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Authorising PO...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Authorize Supply PO</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-150 dark:border-neutral-855 flex items-center justify-between text-[8px] font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-widest">
                  <span>Factory Ingress: Ready</span>
                  <span>SSL encrypted</span>
                </div>
              </div>

            {/* CSV / EXCEL BULK PRODUCT IMPORTER MODAL */}
            {showCSVImportModal && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 max-w-4xl w-full shadow-2xl space-y-6">
                  
                  {/* Modal Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500 text-slate-950 rounded-xl font-black shadow-md">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-sans text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          CSV &amp; Excel Bulk Inventory Importer
                        </h4>
                        <p className="font-mono text-[10px] text-slate-500">
                          Upload spreadsheet files to batch import hundreds of products into catalog database
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowCSVImportModal(false);
                        setCsvRawText('');
                        setCsvParseResult(null);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Dropzone & File Select */}
                  {!csvParseResult ? (
                    <div className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-emerald-500/5 rounded-2xl p-10 text-center space-y-4 transition-all">
                      <FileSpreadsheet className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
                      <div>
                        <h5 className="font-sans text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Upload Inventory Spreadsheet (.csv / .tsv)
                        </h5>
                        <p className="font-mono text-xs text-slate-500 max-w-md mx-auto mt-1">
                          Supports columns: Title, Price, Stock, Category, Cost Price, CPU, RAM, Storage, Condition, Barcode.
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black uppercase px-6 py-3 rounded-xl shadow-lg cursor-pointer transition-all active:scale-95">
                        <Upload className="h-4 w-4" /> Select CSV File
                        <input
                          type="file"
                          accept=".csv,.tsv,.txt"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCSVFileSelect(file);
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary Badges */}
                      <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/60 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono text-xs font-bold px-3 py-1 rounded-lg">
                            ✓ {csvParseResult.validCount} Valid Items Ready
                          </span>
                          {csvParseResult.invalidCount > 0 && (
                            <span className="bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-mono text-xs font-bold px-3 py-1 rounded-lg">
                              ⚠ {csvParseResult.invalidCount} Invalid Rows
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setCsvParseResult(null);
                            setCsvRawText('');
                          }}
                          className="font-mono text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white underline"
                        >
                          Upload Different File
                        </button>
                      </div>

                      {/* Preview Data Grid */}
                      <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left font-sans text-xs">
                          <thead className="bg-slate-200 dark:bg-slate-800 font-mono text-[9px] uppercase tracking-wider text-slate-600 dark:text-slate-400 sticky top-0">
                            <tr>
                              <th className="p-3">#</th>
                              <th className="p-3">Title / Name</th>
                              <th className="p-3">Category</th>
                              <th className="p-3">Price</th>
                              <th className="p-3">Stock</th>
                              <th className="p-3">Barcode</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-xs">
                            {csvParseResult.rows.map((r, i) => (
                              <tr key={i} className={r.errors.length > 0 ? 'bg-rose-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}>
                                <td className="p-3 text-slate-400">{r.rowIndex}</td>
                                <td className="p-3 font-bold text-slate-900 dark:text-white max-w-[180px] truncate">{r.product?.name || 'Invalid'}</td>
                                <td className="p-3 text-slate-500">{r.product?.category || '-'}</td>
                                <td className="p-3 font-bold text-slate-900 dark:text-white">${r.product?.price.toFixed(2) || '0.00'}</td>
                                <td className="p-3 text-slate-500">{r.product?.stock || 0} pcs</td>
                                <td className="p-3 text-slate-400">{r.product?.specs?.Barcode || '-'}</td>
                                <td className="p-3">
                                  {r.errors.length > 0 ? (
                                    <span className="text-rose-500 font-bold">{r.errors.join(', ')}</span>
                                  ) : (
                                    <span className="text-emerald-500 font-bold">Ready</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Modal Footer Controls */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                          onClick={() => {
                            setShowCSVImportModal(false);
                            setCsvParseResult(null);
                          }}
                          className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCSVBatchCommit}
                          disabled={csvParseResult.validCount === 0}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black uppercase px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Check className="h-4 w-4" /> Import {csvParseResult.validCount} Products Now
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* AUTOMATED BARCODE & QR CODE LABEL PRINTER MODAL */}
            {showLabelPrintModal && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 max-w-3xl w-full shadow-2xl space-y-6">
                  
                  {/* Modal Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-600 text-white rounded-xl font-black shadow-md">
                        <Printer className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-sans text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          QR Code &amp; Barcode Label Printer
                        </h4>
                        <p className="font-mono text-[10px] text-slate-500">
                          Batch print physical stickers for POS scanning &amp; warehouse inventory tagging
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowLabelPrintModal(false)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Control Settings */}
                    <div className="space-y-4">
                      <div>
                        <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                          Select Product
                        </label>
                        <select
                          value={labelPrintProduct?.id || ''}
                          onChange={(e) => {
                            const p = products.find(prod => prod.id === e.target.value);
                            if (p) {
                              setLabelPrintProduct(p);
                              setLabelPrintCount(p.stock || 1);
                            }
                          }}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 font-sans text-xs font-bold text-slate-900 dark:text-white outline-none"
                        >
                          {products.map(prod => (
                            <option key={prod.id} value={prod.id}>{prod.name} (${prod.price.toFixed(2)})</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                            Copy Count (Lot Batch)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={labelPrintCount}
                            onChange={(e) => setLabelPrintCount(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 font-mono text-xs font-bold text-slate-900 dark:text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                            Sticker Layout Format
                          </label>
                          <select
                            value={labelLayout}
                            onChange={(e) => setLabelLayout(e.target.value as any)}
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 font-sans text-xs font-bold text-slate-900 dark:text-white outline-none"
                          >
                            <option value="thermal_roll_50x25">Thermal Roll (50x25mm)</option>
                            <option value="a4_sheet_21up">A4 Sheet (21 Labels)</option>
                            <option value="a4_sheet_24up">A4 Sheet (24 Labels)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                          Toggle Label Elements
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                            <input type="checkbox" checked={labelShowLogo} onChange={e => setLabelShowLogo(e.target.checked)} className="rounded accent-blue-600" /> Store Logo
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                            <input type="checkbox" checked={labelShowPrice} onChange={e => setLabelShowPrice(e.target.checked)} className="rounded accent-blue-600" /> Price Tag
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                            <input type="checkbox" checked={labelShowSpecs} onChange={e => setLabelShowSpecs(e.target.checked)} className="rounded accent-blue-600" /> Key Specs
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                            <input type="checkbox" checked={labelShowCondition} onChange={e => setLabelShowCondition(e.target.checked)} className="rounded accent-blue-600" /> Refurb Grade
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                            <input type="checkbox" checked={labelShowQR} onChange={e => setLabelShowQR(e.target.checked)} className="rounded accent-blue-600" /> QR Code
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                            <input type="checkbox" checked={labelShowBarcodeNum} onChange={e => setLabelShowBarcodeNum(e.target.checked)} className="rounded accent-blue-600" /> Barcode Text
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Real-time SVG Label Preview Box */}
                    {labelPrintProduct && (
                      <div className="space-y-2">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                          Live Sticker Label Preview
                        </span>
                        <div className="border-2 border-dashed border-blue-500/40 bg-white dark:bg-slate-950 p-4 rounded-xl shadow-inner space-y-2 text-slate-950">
                          {labelShowLogo && (
                            <div className="font-mono text-[9px] font-black uppercase text-slate-900 tracking-wider">
                              {storeSettings?.storeName || 'TECH SELLER'}
                            </div>
                          )}
                          <div className="font-sans text-xs font-extrabold uppercase text-slate-900 leading-tight truncate">
                            {labelPrintProduct.name}
                          </div>
                          {labelShowCondition && (
                            <span className="inline-block bg-slate-900 text-white font-mono text-[8px] font-black uppercase px-2 py-0.5 rounded">
                              {labelPrintProduct.specs?.Condition || 'Refurbished Grade A'}
                            </span>
                          )}
                          {labelShowSpecs && (
                            <div className="font-mono text-[9px] text-slate-600 truncate">
                              {[labelPrintProduct.specs?.Processor, labelPrintProduct.specs?.RAM, labelPrintProduct.specs?.Storage].filter(Boolean).join(' • ')}
                            </div>
                          )}

                          <div className="flex items-center gap-3 pt-2">
                            {labelShowQR && (
                              <div
                                className="w-12 h-12 shrink-0 border border-slate-300 p-0.5 bg-white"
                                dangerouslySetInnerHTML={{ __html: generateQRCodeSVG(labelPrintProduct.id, 44) }}
                              />
                            )}
                            <div className="flex-1 overflow-hidden">
                              <div
                                className="w-full h-8"
                                dangerouslySetInnerHTML={{ __html: generateBarcodeSVG(labelPrintProduct.specs?.Barcode || labelPrintProduct.id, 160, 30) }}
                              />
                              {labelShowBarcodeNum && (
                                <div className="font-mono text-[8px] font-bold text-center tracking-widest text-slate-700">
                                  {labelPrintProduct.specs?.Barcode || labelPrintProduct.id}
                                </div>
                              )}
                            </div>
                          </div>

                          {labelShowPrice && (
                            <div className="text-right font-mono text-sm font-black text-slate-900 pt-1">
                              ${labelPrintProduct.price.toFixed(2)} <span className="text-[8px] font-normal text-slate-500">inc GST</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer Controls */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setShowLabelPrintModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleTriggerPrint}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-black uppercase px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Printer className="h-4 w-4" /> Print {labelPrintCount} Barcode Labels Batch
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* FLOATING STICKY BULK ACTION TOOLBAR */}
            {selectedProductIds.length > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white border border-slate-700 p-3 px-6 rounded-2xl shadow-2xl flex items-center gap-4 animate-fade-in">
                <span className="font-mono text-xs font-black text-amber-400 bg-slate-800 px-3 py-1 rounded-lg">
                  {selectedProductIds.length} Selected
                </span>
                <div className="h-4 w-px bg-slate-700" />
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-bold">
                  <button
                    onClick={() => {
                      const selected = products.filter(p => selectedProductIds.includes(p.id));
                      if (selected.length > 0) {
                        setLabelPrintProduct(selected[0]);
                        setLabelPrintCount(selected.length);
                        setShowLabelPrintModal(true);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Printer className="h-3.5 w-3.5" /> Bulk Print Labels
                  </button>
                  <button
                    onClick={() => setShowBulkCategoryModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <Tag className="h-3.5 w-3.5" /> Reassign Category
                  </button>
                  <button
                    onClick={() => setShowBulkPriceModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Coins className="h-3.5 w-3.5" /> Adjust Price
                  </button>
                  <button
                    onClick={() => setShowBulkRefillModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Boxes className="h-3.5 w-3.5" /> Refill Stock
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${selectedProductIds.length} selected products from catalog?`)) {
                        selectedProductIds.forEach(id => onDeleteProduct(id));
                        setSelectedProductIds([]);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Selected
                  </button>
                </div>
                <button
                  onClick={() => setSelectedProductIds([])}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Deselect All"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* HANDS-FREE BARCODE SCANNER LOOKUP MODAL (F2) */}
            {showScannerModal && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-600 text-white rounded-xl font-black shadow-md">
                        <QrCode className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-sans text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          Barcode Scanner Overlay
                        </h4>
                        <p className="font-mono text-[10px] text-slate-500">
                          Scan physical item barcode or type SKU (Shortcut: F2)
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setShowScannerModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-purple-500" />
                      <input
                        type="text"
                        placeholder="Ready for scan input..."
                        value={scannerQuery}
                        onChange={(e) => setScannerQuery(e.target.value)}
                        className="w-full rounded-xl border-2 border-purple-500/50 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-3 font-mono text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-purple-500"
                        autoFocus
                      />
                    </div>

                    {(() => {
                      const sq = scannerQuery.toLowerCase().trim();
                      const match = sq ? products.find(p => p.id.toLowerCase() === sq || p.specs?.Barcode?.toLowerCase() === sq || p.name.toLowerCase().includes(sq)) : null;

                      if (!sq) {
                        return (
                          <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl space-y-2">
                            <QrCode className="h-8 w-8 text-purple-400 mx-auto animate-pulse" />
                            <p className="font-mono text-xs text-slate-500">Scan product sticker barcode on counter scanner...</p>
                          </div>
                        );
                      }

                      if (!match) {
                        return (
                          <div className="p-4 text-center bg-rose-500/10 border border-rose-500/30 rounded-xl">
                            <p className="font-mono text-xs font-bold text-rose-500">No product found matching "{scannerQuery}"</p>
                          </div>
                        );
                      }

                      return (
                        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-xl space-y-3">
                          <div className="flex items-center gap-3">
                            <img src={match.image} alt={match.name} className="h-12 w-12 object-cover rounded-lg bg-slate-200 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h5 className="font-sans text-xs font-black uppercase text-slate-900 dark:text-white truncate">{match.name}</h5>
                              <p className="font-mono text-[10px] text-slate-500">{match.category} • Barcode: {match.specs?.Barcode || match.id}</p>
                              <div className="font-mono text-xs font-extrabold text-emerald-500 mt-0.5">${match.price.toFixed(2)} | Stock: {match.stock} pcs</div>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <button
                              onClick={() => {
                                handleQuickAdjustStock(match.id, 10);
                                setScannerQuery('');
                              }}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold py-2 rounded-lg"
                            >
                              +10 Refill Stock
                            </button>
                            <button
                              onClick={() => {
                                setLabelPrintProduct(match);
                                setLabelPrintCount(match.stock || 1);
                                setShowScannerModal(false);
                                setShowLabelPrintModal(true);
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1"
                            >
                              <Printer className="h-3.5 w-3.5" /> Print Label
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* BULK CATEGORY REASSIGN MODAL */}
            {showBulkCategoryModal && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                  <h4 className="font-sans text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Tag className="h-4 w-4 text-blue-500" /> Reassign Category for {selectedProductIds.length} Products
                  </h4>
                  <select
                    value={bulkNewCategory}
                    onChange={e => setBulkNewCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 font-sans text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="">Select Target Category...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setShowBulkCategoryModal(false)} className="px-4 py-2 font-mono text-xs border rounded-xl">Cancel</button>
                    <button
                      onClick={() => {
                        if (bulkNewCategory) {
                          products.filter(p => selectedProductIds.includes(p.id)).forEach(p => {
                            onUpdateProduct({ ...p, category: bulkNewCategory });
                          });
                          setShowBulkCategoryModal(false);
                          setSelectedProductIds([]);
                        }
                      }}
                      className="px-5 py-2 font-mono text-xs font-black uppercase bg-blue-600 text-white rounded-xl"
                    >
                      Apply Category
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BULK PRICE ADJUSTMENT MODAL */}
            {showBulkPriceModal && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                  <h4 className="font-sans text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Coins className="h-4 w-4 text-emerald-500" /> Adjust Price for {selectedProductIds.length} Products
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBulkPriceType('percent')}
                      className={`flex-1 py-2 font-mono text-xs font-bold rounded-xl border ${bulkPriceType === 'percent' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
                    >
                      Percentage (%)
                    </button>
                    <button
                      onClick={() => setBulkPriceType('fixed')}
                      className={`flex-1 py-2 font-mono text-xs font-bold rounded-xl border ${bulkPriceType === 'fixed' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
                    >
                      Fixed Amount ($)
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder={bulkPriceType === 'percent' ? 'e.g. 10 for +10%, -5 for -5%' : 'e.g. 50 for +$50, -20 for -$20'}
                    value={bulkPriceVal}
                    onChange={e => setBulkPriceVal(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 font-mono text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setShowBulkPriceModal(false)} className="px-4 py-2 font-mono text-xs border rounded-xl">Cancel</button>
                    <button
                      onClick={() => {
                        const val = parseFloat(bulkPriceVal);
                        if (!isNaN(val)) {
                          products.filter(p => selectedProductIds.includes(p.id)).forEach(p => {
                            let newPrice = p.price;
                            if (bulkPriceType === 'percent') {
                              newPrice = Math.max(1, p.price * (1 + val / 100));
                            } else {
                              newPrice = Math.max(1, p.price + val);
                            }
                            onUpdateProduct({ ...p, price: Math.round(newPrice * 100) / 100 });
                          });
                          setShowBulkPriceModal(false);
                          setSelectedProductIds([]);
                          setBulkPriceVal('');
                        }
                      }}
                      className="px-5 py-2 font-mono text-xs font-black uppercase bg-emerald-600 text-white rounded-xl"
                    >
                      Update Prices
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BULK STOCK REFILL MODAL */}
            {showBulkRefillModal && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                  <h4 className="font-sans text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-amber-500" /> Refill Stock for {selectedProductIds.length} Products
                  </h4>
                  <div>
                    <label className="font-mono text-[10px] font-bold uppercase text-slate-500 block mb-1">Add Units to Stock</label>
                    <input
                      type="number"
                      value={bulkRefillQty}
                      onChange={e => setBulkRefillQty(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 font-mono text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setShowBulkRefillModal(false)} className="px-4 py-2 font-mono text-xs border rounded-xl">Cancel</button>
                    <button
                      onClick={() => {
                        const qty = parseInt(bulkRefillQty, 10);
                        if (!isNaN(qty) && qty > 0) {
                          products.filter(p => selectedProductIds.includes(p.id)).forEach(p => {
                            onUpdateProduct({ ...p, stock: p.stock + qty });
                          });
                          setShowBulkRefillModal(false);
                          setSelectedProductIds([]);
                        }
                      }}
                      className="px-5 py-2 font-mono text-xs font-black uppercase bg-amber-500 text-slate-950 rounded-xl"
                    >
                      Add Units Now
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
  );
}
