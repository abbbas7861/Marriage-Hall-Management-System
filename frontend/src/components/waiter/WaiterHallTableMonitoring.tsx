import React, { useState, useEffect, useMemo } from 'react';
import {
  Tablet,
  Users,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Utensils,
  Coffee,
  RotateCcw,
  CalendarDays,
  Shield,
  Layers,
  ChevronRight,
  Flame,
  Check,
  Search,
  Filter,
  UserCheck,
} from 'lucide-react';
import { Booking } from '../../types';
import {
  bookingsApi,
  tablesApi,
  HallTableStatusItem,
} from '../../api/client';
import { formatTo12Hour } from '../../utils/timeFormat';

interface WaiterHallTableMonitoringProps {
  onNavigateToTab?: (tabId: string) => void;
}

export const WaiterHallTableMonitoring: React.FC<WaiterHallTableMonitoringProps> = ({
  onNavigateToTab,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingRef, setSelectedBookingRef] = useState<string>('');
  const [tables, setTables] = useState<HallTableStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live ticking clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const loadData = async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      const fetchedBookings = await bookingsApi.list();
      setBookings(fetchedBookings);

      let currentRef = selectedBookingRef;
      if (!currentRef && fetchedBookings.length > 0) {
        currentRef = fetchedBookings[0].bookingRef;
        setSelectedBookingRef(currentRef);
      }

      if (currentRef) {
        let fetchedTables = await tablesApi.list({ eventRef: currentRef });
        if (fetchedTables.length === 0) {
          const found = fetchedBookings.find((b) => b.bookingRef === currentRef);
          fetchedTables = await tablesApi.initTables(
            currentRef,
            found?.hallName || 'Grand Crystal Ballroom'
          );
        }
        setTables(fetchedTables);
      }
    } catch (err) {
      console.error('Failed to load table monitoring data:', err);
      if (!isPolling) showToast('Error loading live table data.');
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-poll table states every 4 seconds for live multi-tablet responsiveness
    const pollInterval = setInterval(() => {
      loadData(true);
    }, 4000);

    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(clockInterval);
    };
  }, [selectedBookingRef]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selectedBooking = useMemo(() => {
    return bookings.find((b) => b.bookingRef === selectedBookingRef) || null;
  }, [bookings, selectedBookingRef]);

  // 1-Touch Cycle Status
  const handleToggleTable = async (table: HallTableStatusItem) => {
    try {
      const updated = await tablesApi.toggleStatus(table.id);
      setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showToast(`Table ${table.tableNumber} is now "${updated.status}"`);
    } catch (err) {
      console.error('Failed to update table:', err);
      showToast('Failed to change table status.');
    }
  };

  // KPIs
  const tableKPIs = useMemo(() => {
    const total = tables.length;
    const served = tables.filter((t) => t.status === 'Served').length;
    const seated = tables.filter((t) => t.status === 'Seated').length;
    const ready = tables.filter((t) => t.status === 'Ready').length;
    const needsClearing = tables.filter((t) => t.status === 'Needs Clearing').length;
    const seatedCount = (served + seated) * 10;
    const totalCapacity = total * 10;
    const occupancyPct = totalCapacity > 0 ? Math.round((seatedCount / totalCapacity) * 100) : 0;

    return {
      total,
      served,
      seated,
      ready,
      needsClearing,
      seatedCount,
      totalCapacity,
      occupancyPct,
    };
  }, [tables]);

  // Filtered Tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      if (sectorFilter !== 'All' && t.sector !== sectorFilter) return false;
      return true;
    });
  }, [tables, sectorFilter]);

  // Operational schedule milestones
  const eventTimeFormatted = useMemo(() => {
    return formatTo12Hour(selectedBooking?.time || '18:00 - 23:00');
  }, [selectedBooking]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 select-none animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-violet-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-violet-400/40 animate-slide-up">
          <Sparkles className="w-5 h-5 text-violet-200 animate-pulse" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Top Tablet Header Bar */}
      <div className="w-full bg-slate-900/90 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-500/10 via-sky-500/10 to-transparent rounded-full blur-3xl -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                <Tablet className="w-3.5 h-3.5" />
                <span>Phase 5 — Task 5.1: Floor Staff & Table Kiosk</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>LIVE SERVICE ACTIVE</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Live Hall & Table Floor Monitoring</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              High-contrast tablet view for floor captains and stewards to monitor table occupancy, food serving progression, and rapid busser turnover.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToTab?.('waiter-refills')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-orange-500/20 transition cursor-pointer"
            >
              <Flame className="w-4 h-4 text-slate-950" />
              <span>Call Urgent Dish Refill</span>
            </button>

            <button
              onClick={() => onNavigateToTab?.('waiter-overtime')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Overtime Request</span>
            </button>

            {/* Live Ticking Time Card */}
            <div className="flex items-center gap-2 bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-700">
              <Clock className="w-4 h-4 text-sky-400 animate-pulse" />
              <span className="font-mono text-sm font-bold text-white">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Active Event Selector Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
          {/* Active Event Dropdown */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Active Banquet Event:</span>
            <select
              value={selectedBookingRef}
              onChange={(e) => setSelectedBookingRef(e.target.value)}
              className="w-full bg-transparent font-bold text-white focus:outline-none cursor-pointer truncate"
            >
              {bookings.map((b) => (
                <option key={b.bookingRef} value={b.bookingRef} className="bg-slate-900 text-white">
                  [{b.bookingRef}] {b.customerName} ({b.eventType})
                </option>
              ))}
            </select>
          </div>

          {/* Banquet Hall */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Assigned Hall:</span>
            <span className="font-bold text-white text-sm flex items-center gap-1.5 truncate">
              <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              {selectedBooking?.hallName || 'Grand Crystal Ballroom'}
            </span>
          </div>

          {/* Timing Window */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Contract Slot & Timing:</span>
            <span className="font-bold text-amber-300 font-mono text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              {eventTimeFormatted}
            </span>
          </div>

          {/* Expected Guests */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Expected Guests:</span>
            <span className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {selectedBooking?.guestCount || 500} Confirmed Seats
            </span>
          </div>
        </div>
      </div>

      {/* Real-Time Operational Schedule Milestones */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Real-Time Event Service Milestones
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Strict Curfew adherence enforced with 1-hour turnover buffer
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Milestone 1 */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start justify-between">
            <div>
              <span className="font-mono text-[11px] font-bold text-emerald-400 block">07:00 PM – 07:45 PM</span>
              <span className="font-bold text-white text-sm block mt-0.5">Guest Reception</span>
              <span className="text-[11px] text-emerald-300/80">Drinks & Appetizers active</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>

          {/* Milestone 2 */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between">
            <div>
              <span className="font-mono text-[11px] font-bold text-amber-400 block">08:30 PM – 10:15 PM</span>
              <span className="font-bold text-white text-sm block mt-0.5">Buffet Dinner Service</span>
              <span className="text-[11px] text-amber-300/80">Active refill watch</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
          </div>

          {/* Milestone 3 */}
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start justify-between">
            <div>
              <span className="font-mono text-[11px] font-bold text-slate-400 block">10:15 PM – 10:45 PM</span>
              <span className="font-bold text-slate-200 text-sm block mt-0.5">Stage & Desserts</span>
              <span className="text-[11px] text-slate-500">Green tea & cake cutting</span>
            </div>
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
          </div>

          {/* Milestone 4 */}
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between">
            <div>
              <span className="font-mono text-[11px] font-bold text-rose-400 block">11:30 PM Sharp</span>
              <span className="font-bold text-white text-sm block mt-0.5">Sound Curfew Cutoff</span>
              <span className="text-[11px] text-rose-300/80">1-hr turnover sanitization</span>
            </div>
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* Sector Seating KPIs Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
            Floor Occupancy
          </span>
          <p className="text-xl font-black text-white mt-0.5">{tableKPIs.occupancyPct}%</p>
          <span className="text-[10px] text-slate-500">{tableKPIs.seatedCount} / {tableKPIs.totalCapacity} Seated</span>
        </div>

        <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/30 text-center">
          <span className="text-[11px] text-emerald-400 uppercase tracking-wider block font-semibold">
            Served & Dining
          </span>
          <p className="text-xl font-black text-emerald-400 mt-0.5">{tableKPIs.served} Tables</p>
          <span className="text-[10px] text-emerald-300/70">Main food served</span>
        </div>

        <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/30 text-center">
          <span className="text-[11px] text-amber-400 uppercase tracking-wider block font-semibold">
            Seated (Awaiting Food)
          </span>
          <p className="text-xl font-black text-amber-400 mt-0.5">{tableKPIs.seated} Tables</p>
          <span className="text-[10px] text-amber-300/70">Drinks served</span>
        </div>

        <div className="bg-sky-500/10 p-3.5 rounded-xl border border-sky-500/30 text-center">
          <span className="text-[11px] text-sky-400 uppercase tracking-wider block font-semibold">
            Ready & Set
          </span>
          <p className="text-xl font-black text-sky-400 mt-0.5">{tableKPIs.ready} Tables</p>
          <span className="text-[10px] text-sky-300/70">Linen & cutlery set</span>
        </div>

        <div className="bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/30 text-center col-span-2 md:col-span-1">
          <span className="text-[11px] text-rose-400 uppercase tracking-wider block font-semibold">
            Needs Clearing
          </span>
          <p className="text-xl font-black text-rose-400 mt-0.5">{tableKPIs.needsClearing} Tables</p>
          <span className="text-[10px] text-rose-300/70">Busser required</span>
        </div>
      </div>

      {/* Main Floor Matrix / Interactive Table Board */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              <span>Interactive Hall Table Floor Plan (Tap any table to cycle status)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cycle pipeline:{' '}
              <span className="text-sky-300 font-semibold">Ready</span> →{' '}
              <span className="text-amber-300 font-semibold">Seated</span> →{' '}
              <span className="text-emerald-300 font-semibold">Served</span> →{' '}
              <span className="text-rose-300 font-semibold">Needs Clearing</span>
            </p>
          </div>

          {/* Sector Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', 'VIP Stage', 'Family Sector A', 'General Sector B'].map((sec) => (
              <button
                key={sec}
                onClick={() => setSectorFilter(sec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  sectorFilter === sec
                    ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Table Grid (Tablet High-Contrast Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredTables.map((table) => {
            const isVIP = table.sector === 'VIP Stage';
            const statusConfig = {
              Served: {
                bg: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300',
                pill: 'bg-emerald-500 text-slate-950',
                icon: CheckCircle2,
                label: 'Served',
              },
              Seated: {
                bg: 'bg-amber-500/10 border-amber-500/50 text-amber-300',
                pill: 'bg-amber-500 text-slate-950',
                icon: Users,
                label: 'Seated',
              },
              Ready: {
                bg: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
                pill: 'bg-sky-500 text-slate-950',
                icon: Check,
                label: 'Ready / Set',
              },
              'Needs Clearing': {
                bg: 'bg-rose-500/10 border-rose-500/50 text-rose-300',
                pill: 'bg-rose-500 text-white animate-pulse',
                icon: AlertTriangle,
                label: 'Needs Busser',
              },
              Cleaned: {
                bg: 'bg-slate-800/80 border-slate-700 text-slate-300',
                pill: 'bg-slate-700 text-white',
                icon: RotateCcw,
                label: 'Cleaned',
              },
            }[table.status] || {
              bg: 'bg-slate-800/80 border-slate-700 text-slate-300',
              pill: 'bg-slate-700 text-white',
              icon: Check,
              label: table.status,
            };

            const StatusIcon = statusConfig.icon;

            return (
              <button
                key={table.id}
                type="button"
                onClick={() => handleToggleTable(table)}
                className={`p-4 rounded-2xl border text-left transition-all shadow-sm active:scale-95 cursor-pointer flex flex-col justify-between min-h-[145px] hover:shadow-md ${statusConfig.bg} ${
                  isVIP ? 'ring-1 ring-amber-400/40' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-lg font-mono text-white tracking-tight">
                      {table.tableNumber}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${statusConfig.pill}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-300 block truncate">
                    {table.sector}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {table.capacity} Seater Table
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 truncate max-w-[100px]">
                    {table.assignedWaiter || 'Crew Assigned'}
                  </span>
                  <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

