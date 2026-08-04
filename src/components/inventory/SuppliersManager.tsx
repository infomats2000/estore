import React, { useState } from 'react';
import { Supplier } from '../../types';
import { Building2, Plus, Edit2, Trash2, Search, Phone, Mail, MapPin, CheckCircle, Clock, ShieldCheck, ShoppingCart } from 'lucide-react';

interface SuppliersManagerProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  categories: string[];
  onTriggerReorder?: (supplierName: string) => void;
}

export default function SuppliersManager({
  suppliers,
  setSuppliers,
  categories,
  onTriggerReorder
}: SuppliersManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [leadTime, setLeadTime] = useState('5');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [suppliedCats, setSuppliedCats] = useState<string[]>([]);
  const [reliabilityScore, setReliabilityScore] = useState('95');

  const openAddForm = () => {
    setEditingSupplier(null);
    setName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setLeadTime('5');
    setPaymentTerms('Net 30');
    setSuppliedCats(categories.slice(0, 1));
    setReliabilityScore('95');
    setShowAddModal(true);
  };

  const openEditForm = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setContactName(s.contactName);
    setEmail(s.email);
    setPhone(s.phone);
    setAddress(s.address);
    setLeadTime(s.leadTimeDays.toString());
    setPaymentTerms(s.paymentTerms);
    setSuppliedCats(s.suppliedCategories);
    setReliabilityScore(s.reliabilityScore.toString());
    setShowAddModal(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactName.trim() || !email.trim()) return;

    if (editingSupplier) {
      const updated = suppliers.map((sup) =>
        sup.id === editingSupplier.id
          ? {
              ...sup,
              name: name.trim(),
              contactName: contactName.trim(),
              email: email.trim(),
              phone: phone.trim(),
              address: address.trim(),
              leadTimeDays: parseInt(leadTime) || 5,
              paymentTerms,
              suppliedCategories: suppliedCats.length > 0 ? suppliedCats : ['Electronics'],
              reliabilityScore: parseInt(reliabilityScore) || 95,
            }
          : sup
      );
      setSuppliers(updated);
      try {
        localStorage.setItem('veloce_suppliers', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving suppliers:', err);
      }
    } else {
      const newSup: Supplier = {
        id: 'sup-' + Date.now(),
        name: name.trim(),
        contactName: contactName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim() || 'Headquarters Office',
        status: 'Active',
        suppliedCategories: suppliedCats.length > 0 ? suppliedCats : ['Electronics'],
        performanceRating: 4.8,
        leadTimeDays: parseInt(leadTime) || 5,
        paymentTerms,
        reliabilityScore: parseInt(reliabilityScore) || 95,
      };
      const updated = [newSup, ...suppliers];
      setSuppliers(updated);
      try {
        localStorage.setItem('veloce_suppliers', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving suppliers:', err);
      }
    }

    setShowAddModal(false);
    setEditingSupplier(null);
  };

  const handleDelete = (id: string) => {
    if (suppliers.length <= 1) {
      alert('You must have at least one supplier configured.');
      return;
    }
    if (window.confirm('Delete this supplier record?')) {
      const updated = suppliers.filter((s) => s.id !== id);
      setSuppliers(updated);
      try {
        localStorage.setItem('veloce_suppliers', JSON.stringify(updated));
      } catch (err) {
        console.error('Error deleting supplier:', err);
      }
    }
  };

  const toggleCategorySelection = (cat: string) => {
    if (suppliedCats.includes(cat)) {
      setSuppliedCats(suppliedCats.filter((c) => c !== cat));
    } else {
      setSuppliedCats([...suppliedCats, cat]);
    }
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.contactName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q);
    const matchesCat =
      selectedCategoryFilter === 'All' || s.suppliedCategories.includes(selectedCategoryFilter);
    return matchesQuery && matchesCat;
  });

  const avgReliability = Math.round(
    suppliers.reduce((acc, s) => acc + s.reliabilityScore, 0) / (suppliers.length || 1)
  );
  const avgLeadTime = Math.round(
    suppliers.reduce((acc, s) => acc + s.leadTimeDays, 0) / (suppliers.length || 1)
  );

  return (
    <div className="space-y-6 animate-fade-in" id="inventory-suppliers-manager">
      {/* KPI banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-lg">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-500">
              Active Vendors
            </div>
            <div className="font-sans text-xl font-black text-neutral-900 dark:text-neutral-100">
              {suppliers.length} Suppliers
            </div>
          </div>
        </div>

        <div className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-500">
              Avg Vendor Reliability
            </div>
            <div className="font-sans text-xl font-black text-neutral-900 dark:text-neutral-100">
              {avgReliability}% Score
            </div>
          </div>
        </div>

        <div className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-500">
              Avg PO Lead Time
            </div>
            <div className="font-sans text-xl font-black text-neutral-900 dark:text-neutral-100">
              ~{avgLeadTime} Business Days
            </div>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategoryFilter('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              selectedCategoryFilter === 'All'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                selectedCategoryFilter === cat
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-60 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 pl-8 pr-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 outline-none focus:border-purple-600"
            />
          </div>
          <button
            onClick={openAddForm}
            className="rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 font-sans text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((sup) => (
          <div
            key={sup.id}
            className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-base font-black text-neutral-900 dark:text-neutral-100">
                      {sup.name}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold">
                      {sup.status}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-neutral-500 font-medium mt-0.5">
                    Rep: {sup.contactName}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-xs font-black text-purple-600 dark:text-purple-400">
                    {sup.reliabilityScore}%
                  </div>
                  <div className="font-mono text-[8px] uppercase tracking-widest text-neutral-400">
                    Reliability
                  </div>
                </div>
              </div>

              <div className="space-y-2 py-3 border-y border-neutral-200 dark:border-neutral-800 font-sans text-xs text-neutral-600 dark:text-neutral-300">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">{sup.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                  <span>{sup.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{sup.address}</span>
                </div>
              </div>

              {/* Supplied categories badges */}
              <div className="py-3 flex flex-wrap gap-1.5">
                {sup.suppliedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* Lead time and terms */}
              <div className="grid grid-cols-2 gap-2 pb-4 text-center font-mono text-[10px]">
                <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded border border-neutral-200 dark:border-neutral-800">
                  <div className="text-neutral-400 uppercase text-[8px]">Lead Time</div>
                  <div className="font-bold text-neutral-900 dark:text-neutral-100">
                    {sup.leadTimeDays} Days
                  </div>
                </div>
                <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded border border-neutral-200 dark:border-neutral-800">
                  <div className="text-neutral-400 uppercase text-[8px]">Terms</div>
                  <div className="font-bold text-neutral-900 dark:text-neutral-100">
                    {sup.paymentTerms}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  if (onTriggerReorder) {
                    onTriggerReorder(sup.name);
                  } else {
                    alert(`Initiating Purchase Order workflow with ${sup.name}...`);
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded text-xs font-mono uppercase font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Order Stock</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditForm(sup)}
                  className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded transition-colors"
                  title="Edit supplier"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(sup.id)}
                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-400 hover:text-rose-500 rounded transition-colors"
                  title="Delete supplier"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-300 dark:border-neutral-700 max-w-lg w-full overflow-hidden">
            <div className="p-5 bg-neutral-900 text-white flex items-center justify-between">
              <h3 className="font-sans text-base font-black uppercase tracking-wider">
                {editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Register New Hardware Supplier'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 block mb-1 font-bold">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aether Dynamics"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-2.5 text-xs outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 block mb-1 font-bold">
                    Contact Representative *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Viktor Sterling"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-2.5 text-xs outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 block mb-1 font-bold">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contact@supplier.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-2.5 text-xs outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 block mb-1 font-bold">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-2.5 text-xs outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 block mb-1 font-bold">
                  Physical Address / Warehouse Location
                </label>
                <input
                  type="text"
                  placeholder="Street, City, Country"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-2.5 text-xs outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 block mb-1 font-bold">
                    Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={leadTime}
                    onChange={(e) => setLeadTime(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-2.5 text-xs outline-none focus:border-purple-600 font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 block mb-1 font-bold">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-2.5 text-xs outline-none focus:border-purple-600"
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 block mb-1 font-bold">
                    Reliability (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={reliabilityScore}
                    onChange={(e) => setReliabilityScore(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-2.5 text-xs outline-none focus:border-purple-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 block mb-2 font-bold">
                  Supplied Hardware Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isSelected = suppliedCats.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategorySelection(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white font-bold'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-mono text-xs uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs uppercase font-bold cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
