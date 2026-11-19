import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  ChefHat,
  Clock,
  Minus,
  Plus,
  RefreshCw,
  Utensils,
  X,
} from 'lucide-react';
import {
  SEED_KDS_REQUESTS,
  SEED_PANTRY_INGREDIENTS,
} from '../../data/seedData';

export type KdsOrderStatus = 'new' | 'preparing' | 'ready';

export interface KdsRequest {
  id: string;
  location: string; // Table Number or Hall Name
  itemName: string;
  quantity: number;
  unit: string;
  requestedAt: string;
  status: KdsOrderStatus;
  notes?: string;
}

export interface PantryIngredient {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minThreshold: number;
  pendingDelivery: boolean;
}

interface KitchenPortalPageProps {
  view: 'kds' | 'pantry';
}

const INGREDIENT_CATEGORIES = [
  'Grains & Rice',
  'Meat & Poultry',
  'Spices & Dry Goods',
  'Dairy & Oils',
  'Produce & Vegetables',
  'Beverages',
  'Other',
];

const INGREDIENT_UNITS = ['kg', 'g', 'liters', 'ml', 'pcs', 'packs', 'boxes'];

export const KitchenPortalPage: React.FC<KitchenPortalPageProps> = ({ view }) => {
  const [requests, setRequests] = useState<KdsRequest[]>(SEED_KDS_REQUESTS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [ingredients, setIngredients] = useState<PantryIngredient[]>(SEED_PANTRY_INGREDIENTS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [usageTarget, setUsageTarget] = useState<PantryIngredient | null>(null);
  const [usageAmount, setUsageAmount] = useState('');

  // Add Ingredient form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState(INGREDIENT_CATEGORIES[0]);
  const [newStock, setNewStock] = useState('');
  const [newUnit, setNewUnit] = useState(INGREDIENT_UNITS[0]);
  const [newThreshold, setNewThreshold] = useState('');
  const [newPendingDelivery, setNewPendingDelivery] = useState(false);

  const handleRefreshBoard = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 350);
  };

  const handleAdvanceStatus = (id: string, nextStatus: KdsOrderStatus) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: nextStatus } : req))
    );
  };

  const handleCompletePickup = (id: string) => {
    setRequests((prev) => prev.filter((req) => req.id !== id));
  };

  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    const parsedStock = parseFloat(newStock);
    const parsedThreshold = parseFloat(newThreshold);

    const created: PantryIngredient = {
      id: `ING-${Date.now().toString().slice(-5)}`,
      name: trimmedName,
      category: newCategory,
      currentStock: Number.isNaN(parsedStock) ? 0 : Math.max(0, parsedStock),
      unit: newUnit,
      minThreshold: Number.isNaN(parsedThreshold) ? 0 : Math.max(0, parsedThreshold),
      pendingDelivery: newPendingDelivery,
    };

    setIngredients((prev) => [created, ...prev]);
    setNewName('');
    setNewCategory(INGREDIENT_CATEGORIES[0]);
    setNewStock('');
    setNewUnit(INGREDIENT_UNITS[0]);
    setNewThreshold('');
    setNewPendingDelivery(false);
    setIsAddModalOpen(false);
  };

  const handleLogUsage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usageTarget) return;
    const qty = parseFloat(usageAmount);
    if (Number.isNaN(qty) || qty <= 0) return;

    setIngredients((prev) =>
      prev.map((item) =>
        item.id === usageTarget.id
          ? {
              ...item,
              currentStock: Math.max(0, Number((item.currentStock - qty).toFixed(2))),
            }
          : item
      )
    );
    setUsageTarget(null);
    setUsageAmount('');
  };

  const kdsColumns = useMemo(
    () => [
      {
        key: 'new' as KdsOrderStatus,
        title: 'New Requests',
        subtitle: 'Incoming waiter floor tickets',
        accentBar: 'bg-amber-500',
        countStyle: 'bg-amber-50 text-amber-800 border-amber-200',
        items: requests.filter((r) => r.status === 'new'),
      },
      {
        key: 'preparing' as KdsOrderStatus,
        title: 'In Preparation',
        subtitle: 'Active cooking stations',
        accentBar: 'bg-teal-700',
        countStyle: 'bg-teal-50 text-teal-800 border-teal-200',
        items: requests.filter((r) => r.status === 'preparing'),
      },
      {
        key: 'ready' as KdsOrderStatus,
        title: 'Ready to Serve',
        subtitle: 'Awaiting waiter pickup',
        accentBar: 'bg-emerald-600',
        countStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        items: requests.filter((r) => r.status === 'ready'),
      },
    ],
    [requests]
  );

  const pantryStats = useMemo(() => {
    if (ingredients.length === 0) {
      return {
        totalItems: '[--]',
        lowStockAlerts: '[--]',
        pendingDeliveries: '[--]',
      };
    }
    const lowStockCount = ingredients.filter(
      (item) => item.currentStock <= item.minThreshold
    ).length;
    const pendingCount = ingredients.filter((item) => item.pendingDelivery).length;

    return {
      totalItems: String(ingredients.length),
      lowStockAlerts: String(lowStockCount),
      pendingDeliveries: String(pendingCount),
    };
  }, [ingredients]);

  if (view === 'kds') {
    return (
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-gray-900 tracking-tight">
              Kitchen Display System (KDS)
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage live floor requests and raw ingredient stock.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefreshBoard}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-xs hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 text-teal-700 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh Board
          </button>
        </div>

        {/* 3-Column High-Contrast Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {kdsColumns.map((column) => (
            <section
              key={column.key}
              className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[480px]"
            >
              {/* Top Color Bar for rapid kitchen scannability */}
              <div className={`h-1.5 w-full ${column.accentBar}`} />

              {/* Column Header */}
              <div className="px-4 py-3.5 border-b border-gray-200 flex items-center justify-between gap-2 bg-gray-50/70">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                    {column.title}{' '}
                    <span className="font-mono tabular-nums text-gray-600">
                      ({column.items.length})
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{column.subtitle}</p>
                </div>
                <span
                  className={`inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-md border text-xs font-mono font-semibold tabular-nums ${column.countStyle}`}
                >
                  {column.items.length}
                </span>
              </div>

              {/* Column Body */}
              <div className="p-4 flex-1 flex flex-col gap-3">
                {column.items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center mb-3">
                      <ChefHat className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">
                      No active requests.
                    </p>
                  </div>
                ) : (
                  column.items.map((req) => (
                    <article
                      key={req.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                          <Utensils className="w-3 h-3" />
                          {req.location}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-mono tabular-nums text-gray-500">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {req.requestedAt}
                        </span>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between gap-3">
                        <h4 className="text-base font-bold text-gray-900 leading-snug">
                          {req.itemName}
                        </h4>
                        <span className="shrink-0 font-mono tabular-nums text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                          ×{req.quantity} {req.unit}
                        </span>
                      </div>

                      {req.notes && (
                        <p className="mt-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded px-2.5 py-1.5">
                          {req.notes}
                        </p>
                      )}

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                        {req.status === 'new' && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceStatus(req.id, 'preparing')}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition-colors cursor-pointer"
                          >
                            Start Prep
                          </button>
                        )}
                        {req.status === 'preparing' && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceStatus(req.id, 'ready')}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Ready
                          </button>
                        )}
                        {req.status === 'ready' && (
                          <button
                            type="button"
                            onClick={() => handleCompletePickup(req.id)}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            Confirm Pickup
                          </button>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  // Tab 2: Pantry Inventory
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900 tracking-tight">
            Pantry Inventory
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Track raw ingredient stock levels, low-stock thresholds, and daily kitchen usage.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-teal-800 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Ingredient
        </button>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Items
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <Box className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-gray-900">
            {pantryStats.totalItems}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Low Stock Alerts
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-gray-900">
            {pantryStats.lowStockAlerts}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Pending Deliveries
            </span>
            <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Clock className="w-4 h-4 text-gray-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-gray-900">
            {pantryStats.pendingDeliveries}
          </p>
        </div>
      </div>

      {/* Inventory Data Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Ingredient Name
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Current Stock
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Min Threshold
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ingredients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 px-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-3">
                        <Box className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">
                        No inventory records found.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Click &ldquo;+ Add Ingredient&rdquo; to register kitchen stock items.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                ingredients.map((item) => {
                  const isLowStock = item.currentStock <= item.minThreshold;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-5 text-sm font-semibold text-gray-900">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-5 text-sm text-gray-600">
                        {item.category}
                      </td>
                      <td className="py-3.5 px-5 text-sm font-mono tabular-nums font-semibold text-gray-900">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="py-3.5 px-5 text-sm font-mono tabular-nums text-gray-600">
                        {item.minThreshold} {item.unit}
                      </td>
                      <td className="py-3.5 px-5">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setUsageTarget(item);
                            setUsageAmount('');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5 text-teal-700" />
                          Log Usage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Ingredient Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-ingredient-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-gray-200 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3
                id="add-ingredient-title"
                className="text-base font-bold text-gray-900"
              >
                Add Ingredient
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddIngredient} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Ingredient Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Basmati Rice"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  >
                    {INGREDIENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Unit
                  </label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  >
                    {INGREDIENT_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono tabular-nums text-gray-900 placeholder:text-gray-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Min Threshold
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono tabular-nums text-gray-900 placeholder:text-gray-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newPendingDelivery}
                  onChange={(e) => setNewPendingDelivery(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-teal-700 focus:ring-teal-700"
                />
                <span>Mark as pending supplier delivery</span>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 transition-colors cursor-pointer"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Usage Modal */}
      {usageTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="log-usage-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white border border-gray-200 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3
                id="log-usage-title"
                className="text-base font-bold text-gray-900"
              >
                Log Kitchen Usage
              </h3>
              <button
                type="button"
                onClick={() => setUsageTarget(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogUsage} className="p-5 space-y-4">
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Ingredient</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {usageTarget.name}
                </p>
                <p className="text-xs text-gray-600 mt-1 font-mono tabular-nums">
                  Available: {usageTarget.currentStock} {usageTarget.unit}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Quantity Used ({usageTarget.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={usageAmount}
                  onChange={(e) => setUsageAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono tabular-nums text-gray-900 placeholder:text-gray-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUsageTarget(null)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 transition-colors cursor-pointer"
                >
                  Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
