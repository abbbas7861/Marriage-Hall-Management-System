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
import { bookingsApi, hallsApi } from '../../api/client';
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

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return bookings.filter((b) => {
      // Date filter
      if (dateFilter === 'today' && b.date !== todayStr) return false;
      if (dateFilter === 'tomorrow' && b.date !== tomorrowStr) return false;
      if (dateFilter === 'week') {
        const bDate = new Date(b.date);
        const now = new Date();
        const diffDays = (bDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      }

      // Hall filter
      if (hallFilter !== 'All Halls' && b.hallName.toLowerCase() !== hallFilter.toLowerCase()) {
        return false;
      }

      // Stage filter
      if (stageFilter !== 'All Stages') {
        const opStatus = b.operationalStatus || 'Setup in Progress';
        if (opStatus.toLowerCase() !== stageFilter.toLowerCase()) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCustomer = b.customerName?.toLowerCase().includes(q);
        const matchRef = b.bookingRef?.toLowerCase().includes(q);
        const matchHall = b.hallName?.toLowerCase().includes(q);
        const matchEvent = b.eventType?.toLowerCase().includes(q);
        if (!matchCustomer && !matchRef && !matchHall && !matchEvent) return false;
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
      showToast(err?.message || 'Error updating status', 'error' as any);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-teal-900 text-white rounded-xl shadow-xl text-xs font-semibold animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Impersonation Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[11px] font-bold uppercase tracking-wider">
              👔 Event Manager Command
            </span>
            <span className="text-xs text-slate-400 font-medium">Floor Operations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
            Assigned Events &amp; Live Hall Execution
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervise active floor setup, guest arrivals, catering coordination, and handover curfews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadEvents}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Events */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Today's Scheduled
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {todayEventsCount}
            </div>
            <span className="text-[11px] text-teal-700 font-medium mt-0.5 block">
              {todayEventsCount > 0 ? 'Active on floor today' : 'No bookings today'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>

        {/* Live Active Service */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Live Serving Halls
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {activeFloorCount}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">
              Guests seated / Food active
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <Utensils className="w-6 h-6" />
          </div>
        </div>

        {/* Total Upcoming Events */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total In Ledger
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {bookings.length}
            </div>
            <span className="text-[11px] text-sky-700 font-medium mt-0.5 block">
              Registered events
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Held Security Deposits */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Held Security Deposits
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
              Rs. {totalHeldDeposit.toLocaleString('en-PK')}
            </div>
            <span className="text-[11px] text-amber-700 font-medium mt-0.5 block">
              Deposit held for today
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
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
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
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
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-teal-700"
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
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-teal-700"
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
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700"
            />
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            <CalendarDays className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Events Found</h3>
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
                className={`p-5 sm:p-6 bg-white rounded-2xl border transition-all shadow-2xs ${
                  isToday
                    ? 'border-teal-400/80 ring-1 ring-teal-500/20 shadow-md'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Event Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-900 text-white">
                      {booking.bookingRef}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                      <span>{booking.customerName}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800">
                        {booking.eventType}
                      </span>
                    </h2>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        LIVE TODAY
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Building2 className="w-4 h-4 text-teal-700" />
                      <strong className="text-slate-900">{booking.hallName}</strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Clock className="w-4 h-4 text-sky-600" />
                      <span className="font-mono font-semibold text-slate-900">
                        {booking.date} • {formatTo12Hour(booking.time || booking.slot)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Details Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs border-b border-slate-100 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Expected Headcount:</span>
                    <strong className="text-slate-800 font-mono">
                      {booking.guestCount || 350} Guests
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact &amp; Phone:</span>
                    <strong className="text-slate-800 font-mono">
                      {booking.contactRef || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Menu Package:</span>
                    <strong className="text-slate-800 truncate block">
                      {booking.menuPackage || 'Standard Royal Buffet'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Security Deposit:</span>
                    <strong className="text-amber-700 font-mono font-bold">
                      Rs. {(booking.securityDeposit || 50000).toLocaleString('en-PK')} (Held)
                    </strong>
                  </div>
                </div>

                {/* 4-Step Interactive Operational Progression */}
                <div className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <PlayCircle className="w-3.5 h-3.5 text-teal-700" />
                      <span>Live Event Operational Lifecycle</span>
                    </span>
                    <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
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
                              ? 'bg-teal-700 text-white border-teal-800 shadow-md ring-2 ring-teal-500/30'
                              : isPast
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs flex items-center gap-1.5">
                              <StepIcon className="w-3.5 h-3.5" />
                              <span>{step.label}</span>
                            </span>
                            {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {isCurrent && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            )}
                          </div>
                          <p
                            className={`text-[10px] leading-tight ${
                              isCurrent ? 'text-teal-100' : isPast ? 'text-emerald-700' : 'text-slate-400'
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
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateToTab?.('manager-roster', booking)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 text-sky-600" />
                      <span>Duty Roster</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateToTab?.('manager-readiness', booking)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Live Checklist</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateToTab?.('manager-decor', booking)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      <span>Asset Requisitions</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateToTab?.('manager-assets', booking)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
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

