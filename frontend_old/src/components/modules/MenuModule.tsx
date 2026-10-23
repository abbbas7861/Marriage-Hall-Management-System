import React, { useState, useEffect } from 'react';
import {
  Utensils,
  ChefHat,
  Plus,
  DollarSign,
  Tag,
  Check,
  X,
  Edit2,
  Trash2,
  RotateCcw,
  SlidersHorizontal,
  Search,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MenuPackage } from '../../types';
import { menuPackagesApi } from '../../api/client';

// Suggested popular dishes for quick selection in the tag input
const QUICK_DISH_SUGGESTIONS = [
  'Chicken Biryani',
  'Mutton Karahi',
  'Seekh Kabab',
  'Chicken Tikka',
  'Roghnai Naan',
  'Fresh Salad & Raita',
  'Gulab Jamun',
  'Kheer / Firni',
  'Mint Lemonade',
];

export const MenuModule: React.FC = () => {
  // STRICT DATA RULE: DO NOT hardcode any dummy data.
  // Must start as empty array []
  const [packages, setPackages] = useState<MenuPackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const data = await menuPackagesApi.list();
      setPackages(data);
    } catch (err: any) {
      console.error('Failed to load menu packages from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<MenuPackage | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPricePerHead, setFormPricePerHead] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDishes, setFormDishes] = useState<string[]>([]);
  const [dishInput, setDishInput] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openCreateModal = () => {
    setEditingPackage(null);
    setFormName('');
    setFormPricePerHead('');
    setFormDescription('');
    setFormDishes([]);
    setDishInput('');
    setFormStatus('Active');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: MenuPackage) => {
    setEditingPackage(pkg);
    setFormName(pkg.name);
    setFormPricePerHead(String(pkg.pricePerHead));
    setFormDescription(pkg.description);
    setFormDishes(pkg.includedItems || []);
    setDishInput('');
    setFormStatus(pkg.status);
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
    setFormError('');
  };

  const handleAddDish = (dishName: string) => {
    const trimmed = dishName.trim();
    if (!trimmed) return;
    if (formDishes.includes(trimmed)) {
      setDishInput('');
      return;
    }
    setFormDishes((prev) => [...prev, trimmed]);
    setDishInput('');
  };

  const handleRemoveDish = (indexToRemove: number) => {
    setFormDishes((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDownDish = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDish(dishInput);
    }
  };

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      setFormError('Please enter a valid package name.');
      return;
    }

    const priceNum = parseFloat(formPricePerHead);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Please enter a valid price per head.');
      return;
    }

    if (editingPackage) {
      // Update
      menuPackagesApi.update(editingPackage.id, {
        name: formName.trim(),
        pricePerHead: priceNum,
        description: formDescription.trim(),
        includedItems: formDishes,
        status: formStatus,
      }).then((updated) => {
        setPackages((prev) =>
          prev.map((p) => (p.id === editingPackage.id ? updated : p))
        );
        showToast(`Menu package "${formName.trim()}" updated successfully.`);
      }).catch((err: any) => {
        setFormError(err.message || 'Failed to update menu package.');
      });
    } else {
      // Create new
      menuPackagesApi.create({
        name: formName.trim(),
        pricePerHead: priceNum,
        description: formDescription.trim(),
        includedItems: formDishes,
        status: formStatus,
      }).then((newPackage) => {
        setPackages((prev) => [...prev, newPackage]);
        showToast(`New menu package "${formName.trim()}" created successfully.`);
      }).catch((err: any) => {
        setFormError(err.message || 'Failed to create menu package.');
      });
    }

    closeModal();
  };

  const handleDeletePackage = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete package "${name}"?`)) {
      menuPackagesApi.delete(id).then(() => {
        setPackages((prev) => prev.filter((p) => p.id !== id));
        showToast(`Package "${name}" removed.`);
      }).catch((err: any) => {
        alert(err.message || 'Failed to delete package.');
      });
    }
  };

  const handleResetToEmpty = () => {
    setPackages([]);
    setSearchQuery('');
    setStatusFilter('All');
    showToast('Menu packages reset to initial empty state.');
  };

  // Calculations for Metrics Bar
  const totalPackagesCount = packages.length;
  const totalUniqueDishes = new Set(packages.flatMap((p) => p.includedItems)).size;
  const avgPricePerHead =
    totalPackagesCount > 0
      ? Math.round(packages.reduce((sum, p) => sum + p.pricePerHead, 0) / totalPackagesCount)
      : null;

  // Filtered packages
  const filteredPackages = packages.filter((pkg) => {
    if (statusFilter !== 'All' && pkg.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = pkg.name.toLowerCase().includes(q);
      const matchDesc = pkg.description.toLowerCase().includes(q);
      const matchItem = pkg.includedItems.some((item) => item.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchItem) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col w-full gap-6 pb-12 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-teal-900 text-white shadow-xl flex items-center gap-2.5 text-xs font-medium animate-in slide-in-from-top-2 border border-teal-700">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Section (Header) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
              Menu &amp; Catering Management
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00685f]"></span>
              CULINARY SERVICES
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure food packages, per-head pricing, and dish catalogs.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {packages.length > 0 && (
            <button
              type="button"
              onClick={handleResetToEmpty}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Empty</span>
            </button>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00685f] hover:bg-[#00524b] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Create Menu Package</span>
          </button>
        </div>
      </div>

      {/* Small Metrics Bar with placeholders [--] */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Packages */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Packages
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight mt-1 font-['Plus_Jakarta_Sans']">
              {totalPackagesCount === 0 ? '[--]' : totalPackagesCount}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              [Configured Menus]
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#00685f]">
            <Utensils className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Total Dishes */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Dishes
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight mt-1 font-['Plus_Jakarta_Sans']">
              {totalPackagesCount === 0 ? '[--]' : totalUniqueDishes}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              [Cataloged Recipes]
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <ChefHat className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Avg Price / Head */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Avg Price / Head
            </span>
            <div className="text-2xl font-bold font-mono text-[#00685f] tracking-tight mt-1 font-['Plus_Jakarta_Sans']">
              {avgPricePerHead === null ? '[--]' : `$${avgPricePerHead}`}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              [Per-Guest Baseline]
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Active when packages > 0) */}
      {packages.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by package name, dish, or item..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Packages</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Section: Data Grid for Packages OR Large Centered Empty State */}
      {packages.length === 0 ? (
        /* Large Centered Empty State */
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs py-20 px-6 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#00685f] shadow-sm mb-4">
            <ChefHat className="w-10 h-10 stroke-[1.5]" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
            No menu packages found. Create a package to start serving your guests.
          </h2>

          <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
            Create custom culinary packages, establish per-head plate tariffs, and catalog dishes for wedding receptions, banquets, and corporate dinners.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00685f] hover:bg-[#00524b] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Create Menu Package</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3 text-slate-400 text-xs font-mono">
            <span>packages: []</span>
            <span>•</span>
            <span>[Status: Empty Menu Catalog]</span>
          </div>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-12 text-center flex flex-col items-center justify-center gap-2">
          <Utensils className="w-8 h-8 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">No matching menu packages</h3>
          <p className="text-xs text-slate-400">Try modifying your search or status filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('All');
            }}
            className="mt-2 text-xs font-semibold text-[#00685f] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        /* Data Grid for Packages */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => {
            const isActive = pkg.status === 'Active';

            return (
              <div
                key={pkg.id}
                className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-teal-200 transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Card Top Banner */}
                <div className="p-5 pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-teal-50/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      [{pkg.packageCode || 'PKG-01'}]
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-emerald-600' : 'bg-slate-400'
                        }`}
                      ></span>
                      <span>{pkg.status}</span>
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-2 mt-1">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans'] group-hover:text-teal-800 transition-colors">
                      {pkg.name}
                    </h3>
                    <div className="text-right">
                      <span className="text-lg font-mono font-bold text-[#00685f]">
                        ${pkg.pricePerHead}
                      </span>
                      <span className="text-[11px] text-slate-500 font-sans"> / head</span>
                    </div>
                  </div>

                  {pkg.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                      {pkg.description}
                    </p>
                  )}
                </div>

                {/* Card Body: Included Items / Dishes Tags */}
                <div className="p-5 flex flex-col gap-3 flex-1 justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Tag className="w-3 h-3 text-[#00685f]" />
                        Included Dishes ({pkg.includedItems.length})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 min-h-[60px]">
                      {pkg.includedItems && pkg.includedItems.length > 0 ? (
                        pkg.includedItems.map((dish, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200/80 text-[11px] font-medium text-teal-900"
                          >
                            <ChefHat className="w-3 h-3 text-[#00685f]" />
                            <span>{dish}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          No specific dishes listed.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {pkg.id.slice(-6)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(pkg)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        title="Edit Package"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        title="Delete Package"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* "Create Menu Package" / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#00685f]">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                    {editingPackage ? 'Edit Menu Package' : 'Create Menu Package'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Define food package name, per-head rate, and cataloged dishes.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSavePackage} className="overflow-y-auto p-6 flex flex-col gap-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Package Name */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">
                  Package Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="[Enter Package Name e.g., Royal Dinner]"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f]"
                  required
                />
              </div>

              {/* Price Per Head */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">
                  Price Per Head ($) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={formPricePerHead}
                    onChange={(e) => setFormPricePerHead(e.target.value)}
                    placeholder="[Enter Price Per Head]"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f]"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="[Enter brief description e.g., Traditional 5-course Mughlai dinner with live BBQ and seasonal desserts]"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] resize-none"
                />
              </div>

              {/* Included Items / Dishes (Tag-input field) */}
              <div className="flex flex-col gap-2 pt-1">
                <label className="font-semibold text-slate-700">
                  Included Items / Dishes
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <ChefHat className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={dishInput}
                      onChange={(e) => setDishInput(e.target.value)}
                      onKeyDown={handleKeyDownDish}
                      placeholder="[Add dishes e.g., Chicken Biryani, Mutton Karahi]"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddDish(dishInput)}
                    className="px-3.5 py-2 rounded-lg bg-teal-50 border border-teal-200 text-[#00685f] hover:bg-teal-100 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
                  >
                    + Add Dish
                  </button>
                </div>

                {/* Tag Chips Container */}
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-lg bg-slate-50 border border-slate-200">
                  {formDishes.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">
                      No dishes added yet. Type a dish above and press Enter, or pick suggestions below.
                    </span>
                  ) : (
                    formDishes.map((dish, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 text-xs shadow-2xs"
                      >
                        <span>{dish}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDish(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Quick Suggestion Pills */}
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Quick Suggestion Chips
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_DISH_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddDish(sug)}
                        disabled={formDishes.includes(sug)}
                        className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                          formDishes.includes(sug)
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white hover:bg-teal-50 text-slate-700 hover:text-[#00685f] border-slate-200 hover:border-teal-200'
                        }`}
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status (Dropdown: Active, Inactive) */}
              <div className="flex flex-col gap-1.5 pt-1">
                <label className="font-semibold text-slate-700">
                  Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00685f] cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 mt-2 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00685f] hover:bg-[#00524b] text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{editingPackage ? 'Save Changes' : 'Save Package'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
