import React, { useState } from 'react';
import { Product } from '../../types';
import { Globe, Plus, Trash2, Search, ArrowRight, Sparkles, Package, DollarSign } from 'lucide-react';

interface CollectionsManagerProps {
  collections: string[];
  products: Product[];
  onAddCollection: (collection: string) => void;
  onDeleteCollection: (collection: string) => void;
  onFilterByCollection?: (collection: string) => void;
}

export default function CollectionsManager({
  collections,
  products,
  onAddCollection,
  onDeleteCollection,
  onFilterByCollection
}: CollectionsManagerProps) {
  const [newCollName, setNewCollName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate stats per collection
  const collectionStats = collections.map((coll) => {
    const collProducts = products.filter((p) => p.collection === coll);
    const totalUnits = collProducts.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = collProducts.reduce((sum, p) => sum + p.stock * p.price, 0);
    return {
      name: coll,
      itemCount: collProducts.length,
      totalUnits,
      totalValue,
    };
  });

  const filteredCollections = collectionStats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCollName.trim();
    if (!name) return;
    if (collections.includes(name)) {
      setErrorMsg(`Collection "${name}" already exists.`);
      return;
    }
    onAddCollection(name);
    setNewCollName('');
    setErrorMsg('');
  };

  const handleDelete = (coll: string) => {
    const collProducts = products.filter((p) => p.collection === coll);
    const confirmMsg =
      collProducts.length > 0
        ? `Are you sure you want to delete campaign "${coll}"? ${collProducts.length} items will have their collection tag removed.`
        : `Delete collection campaign "${coll}"?`;

    if (window.confirm(confirmMsg)) {
      onDeleteCollection(coll);
    }
  };

  const totalCampaignValue = collectionStats.reduce((acc, c) => acc + c.totalValue, 0);
  const totalCampaignUnits = collectionStats.reduce((acc, c) => acc + c.totalUnits, 0);

  return (
    <div className="space-y-6 animate-fade-in" id="inventory-collections-manager">
      {/* KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-3 bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 rounded-lg">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-500">
              Featured Campaigns
            </div>
            <div className="font-sans text-xl font-black text-neutral-900 dark:text-neutral-100">
              {collections.length} Collections
            </div>
          </div>
        </div>

        <div className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-500">
              Total Featured Stock
            </div>
            <div className="font-sans text-xl font-black text-neutral-900 dark:text-neutral-100">
              {totalCampaignUnits.toLocaleString()} Units
            </div>
          </div>
        </div>

        <div className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-500">
              Campaigns Retail Value
            </div>
            <div className="font-sans text-xl font-black text-neutral-900 dark:text-neutral-100">
              ${totalCampaignValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add new collection form */}
        <div className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 rounded-xl shadow-xs h-fit space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <h4 className="font-sans text-sm font-black uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              Create Curated Collection
            </h4>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-3">
            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest text-neutral-600 dark:text-neutral-400 block mb-1 font-bold">
                Collection Campaign Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. WORKSTATION DEALS, AUTUMN DROP..."
                value={newCollName}
                onChange={(e) => {
                  setNewCollName(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-2.5 font-sans text-xs uppercase tracking-wider text-neutral-900 dark:text-neutral-100 outline-none focus:border-cyan-600"
              />
            </div>

            {errorMsg && (
              <p className="font-mono text-[10px] text-rose-500 font-bold">
                ⚠ {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white p-2.5 font-sans text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Launch Campaign</span>
            </button>
          </form>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
            <strong>Tip:</strong> Collections appear as featured badges and filters on storefront pages, allowing customers to easily browse seasonal or corporate tech bundles.
          </div>
        </div>

        {/* Collections table */}
        <div className="lg:col-span-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-950/50">
            <h4 className="font-sans text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              Active Campaigns & Bundles ({filteredCollections.length})
            </h4>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 pl-8 pr-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 outline-none focus:border-cyan-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full border-collapse font-sans text-xs text-left">
              <thead className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-300 dark:border-neutral-700 font-mono text-[9px] uppercase tracking-widest text-neutral-600 dark:text-neutral-300 font-bold">
                <tr>
                  <th className="p-3.5 pl-5">Collection Name</th>
                  <th className="p-3.5 text-center">Assigned Items</th>
                  <th className="p-3.5 text-center">Stock Units</th>
                  <th className="p-3.5 text-right">Retail Value</th>
                  <th className="p-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredCollections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center font-mono text-[10px] text-neutral-400 uppercase">
                      No collections found
                    </td>
                  </tr>
                ) : (
                  filteredCollections.map((coll) => (
                    <tr key={coll.name} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="p-3.5 pl-5 font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span className="uppercase tracking-wide">{coll.name}</span>
                      </td>

                      <td className="p-3.5 text-center font-mono font-bold text-neutral-800 dark:text-neutral-200">
                        <span className="bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full text-[10px]">
                          {coll.itemCount} items
                        </span>
                      </td>

                      <td className="p-3.5 text-center font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                        {coll.totalUnits}
                      </td>

                      <td className="p-3.5 text-right font-mono font-black text-cyan-600 dark:text-cyan-400">
                        ${coll.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="p-3.5 text-right pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          {onFilterByCollection && (
                            <button
                              onClick={() => onFilterByCollection(coll.name)}
                              className="p-1.5 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 rounded transition-colors"
                              title="Filter catalog by this collection"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(coll.name)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-400 hover:text-rose-500 rounded transition-colors"
                            title="Delete collection"
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
