import React, { useState } from 'react';
import { Product } from '../../types';
import { Tag, Plus, Edit2, Trash2, Search, ArrowRight, Layers, DollarSign, Package } from 'lucide-react';
import { useAdminInteractions } from '../../context/AdminInteractionContext';

interface CategoriesManagerProps {
  categories: string[];
  products: Product[];
  onAddCategory: (category: string) => void;
  onEditCategory: (oldCat: string, newCat: string) => void;
  onDeleteCategory: (category: string) => void;
  onFilterByCategory?: (category: string) => void;
}

export default function CategoriesManager({
  categories,
  products,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onFilterByCategory
}: CategoriesManagerProps) {
  const interactions = useAdminInteractions();
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate stats per category
  const categoryStats = categories.map((cat) => {
    const catProducts = products.filter((p) => p.category === cat);
    const totalUnits = catProducts.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = catProducts.reduce((sum, p) => sum + p.stock * p.price, 0);
    const outOfStockCount = catProducts.filter((p) => p.stock === 0).length;
    return {
      name: cat,
      itemCount: catProducts.length,
      totalUnits,
      totalValue,
      outOfStockCount,
    };
  });

  const filteredCategories = categoryStats.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;
    if (categories.includes(name)) {
      setErrorMsg(`Category "${name}" already exists.`);
      return;
    }
    onAddCategory(name);
    setNewCatName('');
    setErrorMsg('');
  };

  const handleEditSubmit = (oldCat: string) => {
    const name = editName.trim();
    if (!name || name === oldCat) {
      setEditingCat(null);
      return;
    }
    if (categories.includes(name) && name !== oldCat) {
      setErrorMsg(`Category "${name}" already exists.`);
      return;
    }
    onEditCategory(oldCat, name);
    setEditingCat(null);
  };

  const handleDelete = async (cat: string) => {
    if (categories.length <= 1) {
      await interactions.notify({ title: 'Category Required', message: 'You must keep at least one category in the catalogue.' });
      return;
    }
    const catProducts = products.filter((p) => p.category === cat);
    const confirmMessage =
      catProducts.length > 0
        ? `Are you sure you want to delete category "${cat}"? ${catProducts.length} items will be reassigned to the default category.`
        : `Delete category "${cat}"?`;

    if (await interactions.confirm({ title: 'Delete Category?', message: confirmMessage, confirmLabel: 'Delete Category', destructive: true })) {
      onDeleteCategory(cat);
    }
  };

  const totalCatalogValue = categoryStats.reduce((acc, c) => acc + c.totalValue, 0);
  const totalCatalogUnits = categoryStats.reduce((acc, c) => acc + c.totalUnits, 0);

  return (
    <div className="space-y-6 animate-fade-in" id="inventory-categories-manager">
      {/* Category summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-500">
              Active Departments
            </div>
            <div className="font-sans text-xl font-black text-neutral-900 dark:text-neutral-100">
              {categories.length} Categories
            </div>
          </div>
        </div>

        <div className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-500">
              Total Catalog Stock
            </div>
            <div className="font-sans text-xl font-black text-neutral-900 dark:text-neutral-100">
              {totalCatalogUnits.toLocaleString()} Units
            </div>
          </div>
        </div>

        <div className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-lg">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-500">
              Total Category Value
            </div>
            <div className="font-sans text-xl font-black text-neutral-900 dark:text-neutral-100">
              ${totalCatalogValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Main categories dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add new category form */}
        <div className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 rounded-xl shadow-xs h-fit space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h4 className="font-sans text-sm font-black uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              Add New Department / Category
            </h4>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-3">
            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest text-neutral-600 dark:text-neutral-400 block mb-1 font-bold">
                Category Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. WORKSTATIONS, PRINTERS & INK..."
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-2.5 font-sans text-xs uppercase tracking-wider text-neutral-900 dark:text-neutral-100 outline-none focus:border-blue-600"
              />
            </div>

            {errorMsg && (
              <p className="font-mono text-[10px] text-rose-500 font-bold">
                ⚠ {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white p-2.5 font-sans text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Create Category</span>
            </button>
          </form>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
            <strong>Note:</strong> Deleting a category will safely reassign its items to the first available category so no inventory data is lost.
          </div>
        </div>

        {/* Categories list table */}
        <div className="lg:col-span-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl shadow-xs overflow-hidden flex flex-col">
          {/* Header & Search */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-950/50">
            <div className="flex items-center gap-2">
              <h4 className="font-sans text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                Department Hierarchy ({filteredCategories.length})
              </h4>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 pl-8 pr-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full border-collapse font-sans text-xs text-left">
              <thead className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-300 dark:border-neutral-700 font-mono text-[9px] uppercase tracking-widest text-neutral-600 dark:text-neutral-300 font-bold">
                <tr>
                  <th className="p-3.5 pl-5">Department Name</th>
                  <th className="p-3.5 text-center">Tech Items</th>
                  <th className="p-3.5 text-center">Stock Units</th>
                  <th className="p-3.5 text-right">Total Valuation</th>
                  <th className="p-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center font-mono text-[10px] text-neutral-400 uppercase">
                      No categories matching filter
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr key={cat.name} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="p-3.5 pl-5 font-bold text-neutral-900 dark:text-neutral-100">
                        {editingCat === cat.name ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="rounded border border-blue-500 bg-white dark:bg-neutral-950 px-2 py-1 text-xs uppercase outline-none font-bold"
                              autoFocus
                            />
                            <button
                              onClick={() => handleEditSubmit(cat.name)}
                              className="px-2 py-1 bg-blue-600 text-white rounded font-mono text-[9px] uppercase font-bold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCat(null)}
                              className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded font-mono text-[9px] uppercase"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span className="uppercase tracking-wide">{cat.name}</span>
                            {cat.outOfStockCount > 0 && (
                              <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[8px] font-mono px-1.5 py-0.5 rounded font-bold">
                                {cat.outOfStockCount} OOS
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-center font-mono font-bold text-neutral-800 dark:text-neutral-200">
                        <span className="bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full text-[10px]">
                          {cat.itemCount} items
                        </span>
                      </td>

                      <td className="p-3.5 text-center font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                        {cat.totalUnits}
                      </td>

                      <td className="p-3.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                        ${cat.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="p-3.5 text-right pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          {onFilterByCategory && (
                            <button
                              onClick={() => onFilterByCategory(cat.name)}
                              className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded transition-colors"
                              title="Filter catalog by this category"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingCat(cat.name);
                              setEditName(cat.name);
                            }}
                            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded transition-colors"
                            title="Rename category"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.name)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-400 hover:text-rose-500 rounded transition-colors"
                            title="Delete category"
                            aria-label="Delete category"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
