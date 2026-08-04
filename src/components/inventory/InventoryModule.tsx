import React, { useState } from 'react';
import { Product, Supplier, StoreSettings } from '../../types';
import InventoryProducts from './InventoryProducts';
import CategoriesManager from './CategoriesManager';
import CollectionsManager from './CollectionsManager';
import SuppliersManager from './SuppliersManager';
import InventoryReports from './InventoryReports';
import { Package, Layers, Sparkles, Truck, BarChart2 } from 'lucide-react';

interface InventoryModuleProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onClearAllProducts: () => void;
  onUpdateStoreSettings?: (settings: StoreSettings) => void;
  storeSettings?: StoreSettings;

  categories: string[];
  onAddCategory: (category: string) => void;
  onEditCategory: (oldCat: string, newCat: string) => void;
  onDeleteCategory: (category: string) => void;

  collections: string[];
  onAddCollection: (collection: string) => void;
  onDeleteCollection: (collection: string) => void;

  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
}

export default function InventoryModule({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onClearAllProducts,
  onUpdateStoreSettings,
  storeSettings,
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  collections,
  onAddCollection,
  onDeleteCollection,
  suppliers,
  setSuppliers
}: InventoryModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'categories' | 'collections' | 'suppliers' | 'reports'>('products');

  const navItems = [
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'collections', label: 'Collections', icon: Sparkles },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sub-navigation */}
      <div className="bg-white dark:bg-neutral-900 p-2 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {activeSubTab === 'products' && (
          <InventoryProducts 
            products={products} 
            onAddProduct={onAddProduct}
            onUpdateProduct={onUpdateProduct}
            onDeleteProduct={onDeleteProduct}
            onClearAllProducts={onClearAllProducts}
            onUpdateStoreSettings={onUpdateStoreSettings}
            storeSettings={storeSettings}
            categories={categories} 
            collections={collections} 
          />
        )}
        {activeSubTab === 'categories' && (
          <CategoriesManager 
            categories={categories} 
            products={products} 
            onAddCategory={onAddCategory}
            onEditCategory={onEditCategory}
            onDeleteCategory={onDeleteCategory}
          />
        )}
        {activeSubTab === 'collections' && (
          <CollectionsManager 
            collections={collections} 
            products={products} 
            onAddCollection={onAddCollection}
            onDeleteCollection={onDeleteCollection}
          />
        )}
        {activeSubTab === 'suppliers' && (
          <SuppliersManager 
            suppliers={suppliers} 
            setSuppliers={setSuppliers} 
            categories={categories} 
          />
        )}
        {activeSubTab === 'reports' && (
          <InventoryReports 
            products={products}
            categories={categories}
            collections={collections}
            suppliers={suppliers}
          />
        )}
      </div>
    </div>
  );
}
