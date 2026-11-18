import React, { useMemo, useState } from 'react';
import {
  ChefHat,
  DollarSign,
  Pencil,
  Plus,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';

export type PackageTier = 'Royal' | 'Executive' | 'Budget';

export interface MenuPackage {
  id: string;
  name: string;
  pricePerHead: number;
  tier: PackageTier;
  dishes: string[];
}

const PACKAGE_TIERS: PackageTier[] = ['Royal', 'Executive', 'Budget'];

const TIER_BADGE_STYLES: Record<PackageTier, string> = {
  Royal: 'bg-amber-50 text-amber-800 border-amber-200',
  Executive: 'bg-teal-50 text-teal-800 border-teal-200',
  Budget: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const MenuPackagesPage: React.FC = () => {
  // Strictly empty initial state — zero hardcoded dummy data
  const [packages, setPackages] = useState<MenuPackage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [packageName, setPackageName] = useState('');
  const [pricePerHead, setPricePerHead] = useState('');
  const [tier, setTier] = useState<PackageTier>('Royal');
  const [dishesInput, setDishesInput] = useState('');

  const kpiMetrics = useMemo(() => {
    if (packages.length === 0) {
      return {
        totalPackages: '[--]',
        totalDishes: '[--]',
        avgPrice: '[--]',
      };
    }

    const totalDishesCount = packages.reduce((sum, pkg) => sum + pkg.dishes.length, 0);
    const avg =
      packages.reduce((sum, pkg) => sum + pkg.pricePerHead, 0) / packages.length;

    return {
      totalPackages: String(packages.length),
      totalDishes: String(totalDishesCount),
      avgPrice: `Rs. ${Math.round(avg).toLocaleString()}`,
    };
  }, [packages]);

  const openCreateModal = () => {
    setEditingId(null);
    setPackageName('');
    setPricePerHead('');
    setTier('Royal');
    setDishesInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: MenuPackage) => {
    setEditingId(pkg.id);
    setPackageName(pkg.name);
    setPricePerHead(String(pkg.pricePerHead));
    setTier(pkg.tier);
    setDishesInput(pkg.dishes.join(', '));
    setIsModalOpen(true);
  };

  const handleDeletePackage = (id: string) => {
    setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
  };

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = packageName.trim();
    const parsedPrice = parseFloat(pricePerHead);
    if (!trimmedName || Number.isNaN(parsedPrice) || parsedPrice < 0) return;

    const parsedDishes = dishesInput
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    if (editingId) {
      setPackages((prev) =>
        prev.map((pkg) =>
          pkg.id === editingId
            ? {
                ...pkg,
                name: trimmedName,
                pricePerHead: parsedPrice,
                tier,
                dishes: parsedDishes,
              }
            : pkg
        )
      );
    } else {
      const created: MenuPackage = {
        id: `PKG-${Date.now().toString().slice(-5)}`,
        name: trimmedName,
        pricePerHead: parsedPrice,
        tier,
        dishes: parsedDishes,
      };
      setPackages((prev) => [created, ...prev]);
    }

    setIsModalOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
            Menu &amp; Catering Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure food packages, per-head pricing, and dish catalogs.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Menu Package
        </button>
      </div>

      {/* KPI Metrics Bar (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Packages
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.totalPackages}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Dishes
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <Utensils className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.totalDishes}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg Price / Head
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.avgPrice}
          </p>
        </div>
      </div>

      {/* Main Section: Grid Layout or Empty State */}
      {packages.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-xl py-20 px-6 text-center shadow-2xs flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-4">
            <ChefHat className="w-7 h-7 text-teal-700" />
          </div>
          <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold text-slate-900">
            No menu packages found.
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 max-w-sm">
            Create a package to start serving your guests.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Menu Package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {packages.map((pkg) => (
            <article
              key={pkg.id}
              className="bg-white border border-slate-200/90 rounded-xl shadow-2xs flex flex-col justify-between overflow-hidden hover:border-slate-300 transition-colors"
            >
              <div className="p-5 space-y-4">
                {/* Tier Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${TIER_BADGE_STYLES[pkg.tier]}`}
                  >
                    {pkg.tier}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {pkg.id}
                  </span>
                </div>

                {/* Package Name & Price */}
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-900 leading-snug">
                    {pkg.name}
                  </h3>
                  <p className="mt-1.5 text-base font-bold font-mono tabular-nums text-teal-700">
                    Rs. {pkg.pricePerHead.toLocaleString()} / head
                  </p>
                </div>

                {/* Included Dishes Chips */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Included Dishes ({pkg.dishes.length})
                  </p>
                  {pkg.dishes.length === 0 ? (
                    <p className="text-xs text-slate-400">No dishes listed.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.dishes.map((dish, idx) => (
                        <span
                          key={`${pkg.id}-dish-${idx}`}
                          className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-xs font-medium text-slate-700"
                        >
                          {dish}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(pkg)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-500" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePackage(pkg.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create / Edit Menu Package Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="menu-package-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3
                id="menu-package-modal-title"
                className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900"
              >
                {editingId ? 'Edit Menu Package' : 'Create Menu Package'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="p-5 space-y-4">
              <div>
                <label
                  htmlFor="pkg-name"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Package Name
                </label>
                <input
                  id="pkg-name"
                  type="text"
                  required
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="[--]"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="pkg-price"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Price Per Head (Rs.)
                  </label>
                  <input
                    id="pkg-price"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={pricePerHead}
                    onChange={(e) => setPricePerHead(e.target.value)}
                    placeholder="[--]"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pkg-tier"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Tier
                  </label>
                  <select
                    id="pkg-tier"
                    value={tier}
                    onChange={(e) => setTier(e.target.value as PackageTier)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  >
                    {PACKAGE_TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="pkg-dishes"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Included Dishes (comma-separated)
                </label>
                <textarea
                  id="pkg-dishes"
                  rows={3}
                  value={dishesInput}
                  onChange={(e) => setDishesInput(e.target.value)}
                  placeholder="[--]"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
