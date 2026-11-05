import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Sparkles,
  Utensils,
  ChevronRight,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Phone,
  UserCheck,
  ClipboardList,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Booking, OperationalStatus } from '../../types';
import { bookingsApi } from '../../api/client';
import { formatTo12Hour } from '../../utils/timeFormat';
import { CANONICAL_HALLS } from '../../constants/halls';

const OPERATIONAL_STEPS: Array<{
  key: OperationalStatus;
  label: string;
  icon: any;
  color: string;
  desc: string;
}> = [
  {
    key: 'Setup in Progress',
    label: '1. Setup in Progress',
    icon: Sparkles,
    color: 'amber',
    desc: 'HVAC cooling, decor rigging, table settings, buffet fueling',
  },
  {
    key: 'Guests Arrived',
    label: '2. Guests Arrived',
    icon: Users,
    color: 'blue',
    desc: 'Welcoming guests, bridal suite open, photography underway',
  },
  {
    key: 'Food Service Active',
    label: '3. Food Service Active',
    icon: Utensils,
    color: 'emerald',
    desc: 'Buffet lines open, chafing dishes serving, live waiter refills',
  },
  {
    key: 'Event Concluded',
    label: '4. Event Concluded',
    icon: CheckCircle2,
    color: 'slate',
    desc: 'Guest departure, damage inspection, handover for sanitization',
  },
];

interface ManagerEventsOverviewProps {
  onNavigateToTab?: (tabId: string, eventBooking?: Booking) => void;
}

export const ManagerEventsOverview: React.FC<ManagerEventsOverviewProps> = ({
  onNavigateToTab,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'week' | 'all'>('all');
  const [hallFilter, setHallFilter] = useState<string>('All Halls');
  const [stageFilter, setStageFilter] = useState<string>('All Stages');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await bookingsApi.list();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load manager bookings:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const filteredEvents = useMemo(() => {
    return bookings.filter((b) => {
      if (b.status === 'Cancelled') return false;

      if (dateFilter === 'today' && b.date !== todayStr) return false;
      if (dateFilter === 'tomorrow' && b.date !== tomorrowStr) return false;
      if (dateFilter === 'week') {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        const nextWeekStr = d.toISOString().split('T')[0];
        if (b.date < todayStr || b.date > nextWeekStr) return false;
      }

      if (hallFilter !== 'All Halls' && b.hallName !== hallFilter) return false;

      const currentStage = b.operationalStatus || 'Setup in Progress';
      if (stageFilter !== 'All Stages' && currentStage !== stageFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = b.bookingRef?.toLowerCase().includes(q);
        const matchesCust = b.customerName?.toLowerCase().includes(q);
        const matchesHall = b.hallName?.toLowerCase().includes(q);
        if (!matchesRef && !matchesCust && !matchesHall) return false;
      }

      return true;
    });
  }, [bookings, dateFilter, hallFilter, stageFilter, searchQuery, todayStr, tomorrowStr]);

  // KPIs
  const todayEventsCount = useMemo(() => {
    return bookings.filter((b) => b.date === todayStr && b.status !== 'Cancelled').length;
  }, [bookings, todayStr]);

  const activeFloorCount = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.date === todayStr &&
        (b.operationalStatus === 'Guests Arrived' || b.operationalStatus === 'Food Service Active')
    ).length;
  }, [bookings, todayStr]);

  const totalHeldDeposit = useMemo(() => {
    return bookings
      .filter((b) => b.date === todayStr && b.status !== 'Cancelled')
      .reduce((sum, b) => sum + (b.securityDeposit || 50000), 0);
  }, [bookings, todayStr]);

  // Operational Status Advance
  const handleAdvanceStatus = async (booking: Booking, targetStatus: OperationalStatus) => {
    try {
      setUpdatingId(booking.id);
      await bookingsApi.updateOperationalStatus(booking.id, targetStatus);
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, operationalStatus: targetStatus } : b))
      );
      showToast(`Event [${booking.bookingRef}] advanced to '${targetStatus}'.`);
    } catch (err: any) {
      console.error('Failed to advance operational status:', err);
      showToast(err?.message || 'Error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150 text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-800 text-teal-300 rounded-xl shadow-2xl text-xs font-semibold border border-teal-500/40 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Impersonation Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-950/60 border border-sky-800/60 text-sky-400 text-[11px] font-bold uppercase tracking-wider">
              👔 Event Manager Command
            </span>

          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans']">
            Assigned Events &amp; Live Hall Execution
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Supervise active floor setup, guest arrivals, catering coordination, and handover curfews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadEvents}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : 'text-teal-400'}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Today's Events */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 sm:p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
              Today's Scheduled
            </span>
            <div className="text-white text-3xl sm:text-4xl font-bold mt-2 font-mono">
              {todayEventsCount}
            </div>
            <span className="text-slate-500 text-sm mt-1.5 block">
              {todayEventsCount > 0 ? 'Active on floor today' : 'No bookings today'}
            </span>
          </div>
          <div className="bg-slate-700/50 p-2.5 rounded-lg text-teal-400">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>

        {/* Live Active Service */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 sm:p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
              Live Serving Halls
            </span>
            <div className="text-white text-3xl sm:text-4xl font-bold mt-2 font-mono">
              {activeFloorCount}
            </div>
            <span className="text-emerald-400 text-sm mt-1.5 block">
              Guests seated / Food active
            </span>
          </div>
          <div className="bg-slate-700/50 p-2.5 rounded-lg text-emerald-400">
            <Utensils className="w-6 h-6" />
          </div>
        </div>

        {/* Total Upcoming Events */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 sm:p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
              Total In Ledger
            </span>
            <div className="text-white text-3xl sm:text-4xl font-bold mt-2 font-mono">
              {bookings.length}
            </div>
            <span className="text-sky-400 text-sm mt-1.5 block">
              Registered events
            </span>
          </div>
          <div className="bg-slate-700/50 p-2.5 rounded-lg text-sky-400">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Held Security Deposits */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 sm:p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
              Held Security Deposits
            </span>
            <div className="text-white text-2xl sm:text-3xl font-bold mt-2 font-mono">
              Rs. {totalHeldDeposit.toLocaleString('en-PK')}
            </div>
            <span className="text-amber-400 text-sm mt-1.5 block">
              Deposit held for today
            </span>
          </div>
          <div className="bg-slate-700/50 p-2.5 rounded-lg text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Date Filters */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { key: 'today', label: "Today's Events" },
            { key: 'tomorrow', label: 'Tomorrow' },
            { key: 'week', label: 'Next 7 Days' },
            { key: 'all', label: 'All Upcoming' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setDateFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                dateFilter === tab.key
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                  : 'bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Hall & Stage Dropdowns & Search */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Hall Filter */}
          <select
            value={hallFilter}
            onChange={(e) => setHallFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-medium focus:outline-none focus:border-teal-500"
          >
            <option value="All Halls">All Halls</option>
            {CANONICAL_HALLS.map((h) => (
              <option key={h.name} value={h.name}>
                {h.name}
              </option>
            ))}
          </select>

          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-medium focus:outline-none focus:border-teal-500"
          >
            <option value="All Stages">All Operational Stages</option>
            <option value="Setup in Progress">Setup in Progress</option>
            <option value="Guests Arrived">Guests Arrived</option>
            <option value="Food Service Active">Food Service Active</option>
            <option value="Event Concluded">Event Concluded</option>
          </select>

          {/* Search box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, ref..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 text-slate-400">
            <CalendarDays className="w-12 h-12 mx-auto text-slate-500 mb-3" />
            <h3 className="text-sm font-bold text-slate-200">No Events Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              There are no assigned events matching your current filter criteria.
            </p>
          </div>
        ) : (
          filteredEvents.map((booking) => {
            const currentOpStatus: OperationalStatus =
              booking.operationalStatus || 'Setup in Progress';

            const activeStepIndex = OPERATIONAL_STEPS.findIndex(
              (s) => s.key === currentOpStatus
            );

            const isToday = booking.date === todayStr;

            return (
              <div
                key={booking.id}
                className={`p-5 sm:p-6 bg-slate-800 border rounded-2xl transition-all shadow-xl ${
                  isToday
                    ? 'border-teal-500/80 ring-1 ring-teal-500/30'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* Event Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/60">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-900 text-teal-300 border border-slate-700">
                      {booking.bookingRef}
                    </span>
                    <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                      <span>{booking.customerName}</span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300">
                        {booking.eventType}
                      </span>
                    </h2>
                    {isToday && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        LIVE TODAY
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-teal-400" />
                      <strong className="text-white">{booking.hallName}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-sky-400" />
                      <span className="font-mono font-semibold text-slate-200">
                        {booking.date} • {formatTo12Hour(booking.time || booking.slot)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Details Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs border-b border-slate-700/60 text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Expected Headcount:</span>
                    <strong className="text-white font-mono">
                      {booking.guestCount || 350} Guests
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact &amp; Phone:</span>
                    <strong className="text-white font-mono">
                      {booking.contactRef || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Menu Package:</span>
                    <strong className="text-slate-200 truncate block">
                      {booking.menuPackage || 'Standard Royal Buffet'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Security Deposit:</span>
                    <strong className="text-amber-400 font-mono font-bold">
                      Rs. {(booking.securityDeposit || 50000).toLocaleString('en-PK')} (Held)
                    </strong>
                  </div>
                </div>

                {/* 4-Step Interactive Operational Progression */}
                <div className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <PlayCircle className="w-3.5 h-3.5 text-teal-400" />
                      <span>Live Event Operational Lifecycle</span>
                    </span>
                    <span className="text-[11px] font-semibold text-teal-300 bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-700">
                      Current Stage: {currentOpStatus}
                    </span>
                  </div>

                  {/* Visual Step Tracker */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                    {OPERATIONAL_STEPS.map((step, idx) => {
                      const StepIcon = step.icon;
                      const isPast = idx < activeStepIndex;
                      const isCurrent = idx === activeStepIndex;
                      const isFuture = idx > activeStepIndex;

                      return (
                        <button
                          key={step.key}
                          type="button"
                          disabled={updatingId === booking.id}
                          onClick={() => handleAdvanceStatus(booking, step.key)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                            isCurrent
                              ? 'bg-teal-600 text-white border-teal-500 shadow-md ring-2 ring-teal-400/40'
                              : isPast
                              ? 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800'
                              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs flex items-center gap-1.5">
                              <StepIcon className="w-3.5 h-3.5" />
                              <span>{step.label}</span>
                            </span>
                            {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                            {isCurrent && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            )}
                          </div>
                          <p
                            className={`text-[10px] leading-tight ${
                              isCurrent ? 'text-teal-100' : isPast ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {step.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Action Navigation Hub */}
                <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onNavigateToTab?.('manager-roster', booking)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 text-sky-400" />
                      <span>Duty Roster</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateToTab?.('manager-readiness', booking)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Live Checklist</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateToTab?.('manager-decor', booking)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>Asset Requisitions</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateToTab?.('manager-assets', booking)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Security Settlement</span>
                    </button>
                  </div>

                  {activeStepIndex < OPERATIONAL_STEPS.length - 1 && (
                    <button
                      type="button"
                      disabled={updatingId === booking.id}
                      onClick={() =>
                        handleAdvanceStatus(booking, OPERATIONAL_STEPS[activeStepIndex + 1].key)
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 active:scale-95 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                    >
                      <span>Advance to Next Stage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
