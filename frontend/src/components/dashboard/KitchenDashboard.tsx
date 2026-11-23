import React from 'react';
import {
  AlertTriangle,
  Box,
  ChefHat,
  ClipboardCheck,
  Clock,
  RefreshCw,
} from 'lucide-react';
import {
  SEED_KDS_REQUESTS,
  SEED_PANTRY_INGREDIENTS,
} from '../../data/seedData';

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
  const pendingRequests: PendingKdsItem[] = SEED_KDS_REQUESTS.map((r) => ({
    id: r.id,
    tableNo: r.location,
    item: `${r.itemName} (×${r.quantity})`,
    time: r.requestedAt,
    status: r.status === 'new' ? 'New' : r.status === 'preparing' ? 'Preparing' : 'Ready',
  }));

  const lowStockItems: LowStockIngredient[] = SEED_PANTRY_INGREDIENTS.filter(
    (item) => item.currentStock <= item.minThreshold
  ).map((item) => ({
    id: item.id,
    name: item.name,
    currentStock: `${item.currentStock} ${item.unit}`,
  }));

  const kpiCards = [
    {
      label: 'Active Prep Orders',
      value: String(pendingRequests.length),
      caption: 'Live kitchen refill & buffet tickets',
      icon: ChefHat,
      iconBox:
        'bg-gradient-to-br from-teal-50 to-teal-100/90 border border-teal-200/70 text-teal-700',
    },
    {
      label: 'Low Stock Alerts',
      value: String(lowStockItems.length),
      caption: 'Ingredients below minimum threshold',
      icon: AlertTriangle,
      iconBox:
        'bg-gradient-to-br from-rose-50 to-rose-100/90 border border-rose-200/70 text-rose-600',
    },
    {
      label: 'Total Ingredients',
      value: String(SEED_PANTRY_INGREDIENTS.length),
      caption: 'Tracked pantry inventory SKUs',
      icon: Box,
      iconBox:
        'bg-gradient-to-br from-blue-50 to-blue-100/90 border border-blue-200/70 text-blue-600',
    },
  ];

  const getTicketStatusBadge = (status: PendingKdsItem['status']) => {
    if (status === 'Ready') {
      return 'border-emerald-200/80 bg-emerald-50 text-emerald-800';
    }
    if (status === 'Preparing') {
      return 'border-amber-200/80 bg-amber-50 text-amber-800';
    }
    return 'border-teal-200/80 bg-teal-50 text-teal-800';
  };

  return (
    <div className="space-y-7">
      {/* Hero Banner Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-6 sm:p-8 text-white shadow-lg shadow-slate-900/10 border border-slate-800">
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-300 text-xs font-medium shadow-[0_0_16px_rgba(20,184,166,0.2)]">
              <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
              <span>Live System Active</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
                Kitchen Operations Overview
              </h1>
              <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                Monitor live kitchen display tickets, event ingredient requisitions, and critical pantry inventory thresholds.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('event-requisitions')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ClipboardCheck className="w-4 h-4 text-slate-200" />
              <span>Event Requisitions</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('kitchen-display')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ChefHat className="w-4 h-4" />
              <span>Open KDS Board</span>
            </button>
          </div>
        </div>
      </section>

      {/* Top Row: 3 Impactful KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-shadow flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.label}
                </span>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBox}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums">
                  {card.value}
                </p>
                <p className="text-xs text-slate-400 mt-1.5">{card.caption}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Section: Pending KDS Requests + Low Stock Ingredients */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left: Pending KDS Requests */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl shadow-lg shadow-slate-200/40 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
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
                <tr className="border-b border-slate-200/80 bg-slate-50/80">
                  <th className="py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Table No
                  </th>
                  <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Item
                  </th>
                  <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Time
                  </th>
                  <th className="py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
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
                      <td className="py-3.5 px-6 text-sm font-semibold text-slate-900">
                        {req.tableNo}
                      </td>
                      <td className="py-3.5 px-5 text-sm text-slate-700">
                        {req.item}
                      </td>
                      <td className="py-3.5 px-5 text-sm font-mono tabular-nums text-slate-500">
                        {req.time}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span
                          className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getTicketStatusBadge(
                            req.status
                          )}`}
                        >
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Low Stock Ingredients Side Panel */}
        <aside className="lg:col-span-1 bg-white border border-slate-200/80 rounded-xl shadow-lg shadow-slate-200/40 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
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
                  className="px-6 py-3.5 flex items-center justify-between gap-3"
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
      </section>
    </div>
  );
};
