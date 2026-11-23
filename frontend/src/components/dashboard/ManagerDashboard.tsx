import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Calendar,
  CalendarPlus,
  ChefHat,
  FileText,
  Grid,
  LayoutGrid,
  UserPlus,
  Users,
} from 'lucide-react';
import { SEED_ASSIGNED_EVENTS } from '../../data/seedData';
import { bookingsApi } from '../../api/client';

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
  const [eventsList, setEventsList] = useState<LiveEventItem[]>(
    SEED_ASSIGNED_EVENTS.map((e) => ({
      id: e.id,
      eventName: e.customerName,
      hall: e.hallName,
      status: e.status,
    }))
  );

  useEffect(() => {
    bookingsApi
      .list()
      .then((data) => {
        if (data && data.length > 0) {
          setEventsList(
            data.slice(0, 5).map((b: any) => ({
              id: String(b.id),
              eventName: b.customerName || b.bookingRef || 'Event',
              hall: b.hallName || 'Main Hall',
              status:
                b.status === 'Confirmed'
                  ? 'Live'
                  : b.status === 'Completed'
                  ? 'Concluded'
                  : 'Setup',
            }))
          );
        }
      })
      .catch((err) => console.warn('Manager dashboard bookings API error:', err));
  }, []);

  const todaysEvents: LiveEventItem[] = eventsList;

  const kpiCards = [
    {
      label: "Today's Events",
      value: String(todaysEvents.length),
      caption: 'Scheduled functions on floor',
      icon: Calendar,
      iconBox:
        'bg-gradient-to-br from-teal-50 to-teal-100/90 border border-teal-200/70 text-teal-700',
    },
    {
      label: 'Pending Settlements',
      value: '2',
      caption: 'Events awaiting final closure',
      icon: FileText,
      iconBox:
        'bg-gradient-to-br from-amber-50 to-amber-100/90 border border-amber-200/70 text-amber-600',
    },
    {
      label: 'Unassigned Staff',
      value: '4',
      caption: 'Floor roles awaiting allocation',
      icon: Users,
      iconBox:
        'bg-gradient-to-br from-rose-50 to-rose-100/90 border border-rose-200/70 text-rose-600',
    },
    {
      label: 'Table Occupancy',
      value: '75%',
      caption: 'Live banquet hall seating',
      icon: Grid,
      iconBox:
        'bg-gradient-to-br from-blue-50 to-blue-100/90 border border-blue-200/70 text-blue-600',
    },
  ];

  const getEventStatusStyle = (status: LiveEventItem['status']) => {
    if (status === 'Live') {
      return 'border-teal-200/80 bg-teal-50 text-teal-800';
    }
    if (status === 'Setup') {
      return 'border-amber-200/80 bg-amber-50 text-amber-800';
    }
    return 'border-slate-200 bg-slate-100 text-slate-700';
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
                Manager Executive Overview
              </h1>
              <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                Live operational command for today&apos;s banquet execution, floor staff rosters, and final event settlements.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('event-control-center')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <LayoutGrid className="w-4 h-4 text-slate-200" />
              <span>Event Control Center</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('bookings')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>New Booking Intake</span>
            </button>
          </div>
        </div>
      </section>

      {/* Top Row: 4 Impactful KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* Middle Section: Today's Live Events + Quick Actions Side Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left: Today's Live Events */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl shadow-lg shadow-slate-200/40 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
                Today&apos;s Live Events
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Active hall functions scheduled for execution today
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {todaysEvents.length} active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80">
                  <th className="py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Event Name
                  </th>
                  <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Hall
                  </th>
                  <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
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
                      <td className="py-3.5 px-6 text-sm font-semibold text-slate-900">
                        {ev.eventName}
                      </td>
                      <td className="py-3.5 px-5 text-sm text-slate-700">
                        {ev.hall}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getEventStatusStyle(
                            ev.status
                          )}`}
                        >
                          {ev.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
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
        </div>

        {/* Right: Quick Actions Side Panel */}
        <aside className="lg:col-span-1 bg-white border border-slate-200/80 rounded-xl p-6 shadow-lg shadow-slate-200/40 space-y-4">
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
              className="w-full flex items-center justify-between gap-3 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-3 text-sm font-semibold text-white transition-colors cursor-pointer"
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
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors cursor-pointer"
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
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center gap-2.5">
                <ChefHat className="w-4 h-4 text-teal-700" />
                Open KDS
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
};
