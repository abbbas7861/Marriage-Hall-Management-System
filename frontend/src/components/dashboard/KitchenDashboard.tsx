import React from 'react';
import {
  AlertTriangle,
  Box,
  ChefHat,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface PendingKdsItem {
  id: string;
  tableNo: string;
  item: string;
  time: string;
  status: 'New' | 'Preparing' | 'Ready';
}

interface LowStockIngredient {
  id: string;
  name: string;
  currentStock: string;
}

interface KitchenDashboardProps {
  onNavigate: (navId: string) => void;
}

export const KitchenDashboard: React.FC<KitchenDashboardProps> = ({
  onNavigate,
}) => {
  // Strictly empty arrays — zero hardcoded dummy data
  const pendingRequests: PendingKdsItem[] = [];
  const lowStockItems: LowStockIngredient[] = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
          Kitchen Executive Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor active cooking queues, floor refill tickets, and critical pantry stock levels.
        </p>
      </div>

      {/* Top Row: 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Prep Orders
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            [--]
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Low Stock Alerts
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            [--]
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Ingredients
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Box className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            [--]
          </p>
        </div>
      </div>

      {/* Main Section: Pending KDS Requests + Low Stock Ingredients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left: Pending KDS Requests */}
        <section className="lg:col-span-2 bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
                Pending KDS Requests
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Incoming floor tickets awaiting preparation
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('kitchen-display')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
            >
              Open KDS Board
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Table No
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Item
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Time
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 px-6 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                          <Clock className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">
                          No pending KDS requests.
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Live floor refill orders will stream into this queue automatically.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 text-sm font-semibold text-slate-900">
                        {req.tableNo}
                      </td>
                      <td className="py-3.5 px-5 text-sm text-slate-700">
                        {req.item}
                      </td>
                      <td className="py-3.5 px-5 text-sm font-mono tabular-nums text-slate-500">
                        {req.time}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right: Low Stock Ingredients Side Panel */}
        <aside className="lg:col-span-1 bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
                Low Stock Ingredients
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Items below minimum threshold
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('pantry-inventory')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
            >
              Pantry
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="py-12 px-5 text-center flex flex-col items-center justify-center">
              <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                No low stock alerts.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Ingredients running low will appear here with quick reorder actions.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lowStockItems.map((item) => (
                <li
                  key={item.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs font-mono tabular-nums text-rose-600 mt-0.5">
                      Stock: {item.currentStock}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('pantry-inventory')}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 text-teal-700" />
                    Reorder
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
};
