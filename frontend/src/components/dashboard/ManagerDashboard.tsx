import React from 'react';
import {
  ArrowRight,
  Calendar,
  CalendarPlus,
  ChefHat,
  FileText,
  Grid,
  UserPlus,
  Users,
} from 'lucide-react';
import { SEED_ASSIGNED_EVENTS } from '../../data/seedData';

interface LiveEventItem {
  id: string;
  eventName: string;
  hall: string;
  status: 'Setup' | 'Live' | 'Concluded';
}

interface ManagerDashboardProps {
  onNavigate: (navId: string) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  onNavigate,
}) => {
  const todaysEvents: LiveEventItem[] = SEED_ASSIGNED_EVENTS.map((e) => ({
    id: e.id,
    eventName: e.customerName,
    hall: e.hallName,
    status: e.status,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
          Manager Executive Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Live operational oversight for today&apos;s events, floor staff allocation, and billing settlements.
        </p>
      </div>

      {/* Top Row: 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Today&apos;s Events
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            3
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Settlements
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            2
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Unassigned Staff
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            4
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Table Occupancy
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Grid className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            75%
          </p>
        </div>
      </div>

      {/* Middle Section: Today's Live Events + Quick Actions Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left: Today's Live Events */}
        <section className="lg:col-span-2 bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
                Today&apos;s Live Events
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Active hall functions scheduled for execution today
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              ({todaysEvents.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Event Name
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Hall
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todaysEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 px-6 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                          <Calendar className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">
                          No live events scheduled for today.
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Confirmed bookings for today will appear here for live execution.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  todaysEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 text-sm font-semibold text-slate-900">
                        {ev.eventName}
                      </td>
                      <td className="py-3.5 px-5 text-sm text-slate-700">
                        {ev.hall}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center rounded-md border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                          {ev.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => onNavigate('assigned-events')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right: Quick Actions Side Panel */}
        <aside className="lg:col-span-1 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
              Quick Actions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Jump directly to key operational workflows
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onNavigate('bookings')}
              className="w-full flex items-center justify-between gap-3 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-3 text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center gap-2.5">
                <CalendarPlus className="w-4 h-4" />
                New Booking
              </span>
              <ArrowRight className="w-4 h-4 opacity-80" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('staff-rosters')}
              className="w-full flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center gap-2.5">
                <UserPlus className="w-4 h-4 text-teal-700" />
                Assign Staff
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('refill-dispatcher')}
              className="w-full flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center gap-2.5">
                <ChefHat className="w-4 h-4 text-teal-700" />
                Open KDS
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
