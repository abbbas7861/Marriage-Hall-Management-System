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
  Flame,
  AlertTriangle,
  Plus,
  Pencil,
  X,
  DollarSign,
  Coffee,
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

  // Live Service Modal State
  const [activeLiveServiceBooking, setActiveLiveServiceBooking] = useState<Booking | null>(null);
  const [serviceTitle, setServiceTitle] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Entrance Pyro & Effects');
  const [serviceNotes, setServiceNotes] = useState('');

  // Damage Recording Modal State
  const [activeDamageBooking, setActiveDamageBooking] = useState<Booking | null>(null);
  const [damageItem, setDamageItem] = useState('');
  const [damageAmount, setDamageAmount] = useState('');
  const [damageDeductionType, setDamageDeductionType] = useState<'invoice' | 'deposit'>('invoice');
  const [damageNotes, setDamageNotes] = useState('');

  const [modalSubmitting, setModalSubmitting] = useState(false);

  const handleSaveLiveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLiveServiceBooking) return;
    const priceNum = parseFloat(servicePrice);
    if (!serviceTitle.trim() || isNaN(priceNum) || priceNum <= 0) {
      showToast('Please provide valid service title and price.');
      return;
    }

    setModalSubmitting(true);
    try {
      const res = await bookingsApi.addExtraService(activeLiveServiceBooking.id, {
        title: serviceTitle.trim(),
        price: priceNum,
        category: serviceCategory,
        notes: serviceNotes.trim(),
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === activeLiveServiceBooking.id ? res.booking : b))
      );
      showToast(`Added Live Service "${serviceTitle.trim()}" (PKR ${priceNum.toLocaleString('en-PK')}) to client's bill!`);
      setActiveLiveServiceBooking(null);
      setServiceTitle('');
      setServicePrice('');
      setServiceNotes('');
    } catch (err: any) {
      showToast(err?.message || 'Failed to add live extra service.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleSaveDamage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDamageBooking) return;
    const amountNum = parseFloat(damageAmount);
    if (!damageItem.trim() || isNaN(amountNum) || amountNum <= 0) {
      showToast('Please provide valid damage description and penalty amount.');
      return;
    }

    setModalSubmitting(true);
    try {
      const res = await bookingsApi.recordDamage(activeDamageBooking.id, {
        item: damageItem.trim(),
        amount: amountNum,
        deductionType: damageDeductionType,
        notes: damageNotes.trim(),
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === activeDamageBooking.id ? res.booking : b))
      );
      showToast(`Damage penalty of PKR ${amountNum.toLocaleString('en-PK')} logged (${damageDeductionType === 'invoice' ? 'Added to Client Invoice' : 'Deducted from Deposit'})!`);
      setActiveDamageBooking(null);
      setDamageItem('');
      setDamageAmount('');
      setDamageNotes('');
    } catch (err: any) {
      showToast(err?.message || 'Failed to record damage penalty.');
    } finally {
      setModalSubmitting(false);
    }
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
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider">
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

                {/* Live Add-ons & Damages Row if present */}
                {((booking.extraServices && booking.extraServices.length > 0) ||
                  (booking.damagesRecord && booking.damagesRecord.length > 0) ||
                  (booking.customMenuItems && booking.customMenuItems.length > 0) ||
                  (booking.additionalMenuItems && booking.additionalMenuItems.length > 0)) && (
                  <div className="py-2.5 px-3 my-2 bg-slate-900/80 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      {booking.extraServices && booking.extraServices.length > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300">
                          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                          <span className="font-semibold">Live Extras ({booking.extraServices.length}):</span>
                          <span className="font-mono font-bold text-white">
                            +PKR {booking.extraServices.reduce((sum, s) => sum + (s.price || 0), 0).toLocaleString('en-PK')}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-xs">
                            ({booking.extraServices.map((s) => s.title).join(', ')})
                          </span>
                        </div>
                      )}

                      {booking.damagesRecord && booking.damagesRecord.length > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          <span className="font-semibold">Damages ({booking.damagesRecord.length}):</span>
                          <span className="font-mono font-bold text-white">
                            PKR {booking.damagesRecord.reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString('en-PK')}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-xs">
                            ({booking.damagesRecord.map((d) => d.item).join(', ')})
                          </span>
                        </div>
                      )}

                      {booking.customMenuItems && booking.customMenuItems.length > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300">
                          <Utensils className="w-3.5 h-3.5 text-teal-400" />
                          <span className="font-semibold">Dishes:</span>
                          <span className="text-white truncate max-w-xs">{booking.customMenuItems.join(', ')}</span>
                        </div>
                      )}

                      {booking.additionalMenuItems && booking.additionalMenuItems.length > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
                          <Coffee className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-semibold">Add-on Menu:</span>
                          <span className="text-white truncate max-w-xs">
                            {booking.additionalMenuItems.map((item) => `${item.name} (${item.personCount}p)`).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
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
                      onClick={() => onNavigateToTab?.('manager-kitchen-refills', booking)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>Kitchen Orders &amp; Refills</span>
                    </button>

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
                      <Layers className="w-3.5 h-3.5 text-teal-400" />
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

                    <button
                      type="button"
                      onClick={() => setActiveLiveServiceBooking(booking)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 hover:text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                      <span>+ Live Service</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveDamageBooking(booking)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Record Damage</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateToTab?.('bookings', booking)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 hover:text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                    >
                      <Pencil className="w-3.5 h-3.5 text-teal-400" />
                      <span>Edit Booking</span>
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

      {/* Live Extra Service Modal */}
      {activeLiveServiceBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-700 animate-in fade-in-50">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Add Live Service to Client Bill</h3>
                  <p className="text-xs text-slate-400">
                    {activeLiveServiceBooking.customerName} • {activeLiveServiceBooking.bookingRef}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveLiveServiceBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLiveService} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Extra Service / Special Effect Title *
                </label>
                <input
                  type="text"
                  required
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  placeholder="e.g. Grand Cold Fire Entrance Pyro (4 Fountains)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Charge Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    placeholder="35000"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Entrance Pyro & Effects">Entrance Pyro &amp; Effects</option>
                    <option value="Stage Lighting & Smoke">Stage Lighting &amp; Smoke</option>
                    <option value="Catering & Extra Dishes">Catering &amp; Extra Dishes</option>
                    <option value="Audio / DJ / Sound">Audio / DJ / Sound</option>
                    <option value="Extra Seating & Lounges">Extra Seating &amp; Lounges</option>
                    <option value="Climate Control & AC">Climate Control &amp; AC</option>
                    <option value="Misc Special Request">Misc Special Request</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Notes / Staff Instructions
                </label>
                <textarea
                  rows={2}
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="e.g. Authorized by client on stage. Pyro crew deployed at 09:30 PM."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveLiveServiceBooking(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all cursor-pointer shadow-md shadow-purple-600/30 disabled:opacity-50"
                >
                  {modalSubmitting ? 'Adding...' : 'Add to Client Bill & Update Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Damage & Penalty Modal */}
      {activeDamageBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-700 animate-in fade-in-50">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Record Event Damage &amp; Penalty</h3>
                  <p className="text-xs text-slate-400">
                    {activeDamageBooking.customerName} • {activeDamageBooking.bookingRef}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDamageBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDamage} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Damaged Property / Item Description *
                </label>
                <input
                  type="text"
                  required
                  value={damageItem}
                  onChange={(e) => setDamageItem(e.target.value)}
                  placeholder="e.g. Broken Glass Table Top / Stained Velvet Bridal Sofa"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Penalty / Repair Cost (PKR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={damageAmount}
                    onChange={(e) => setDamageAmount(e.target.value)}
                    placeholder="15000"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Billing Target
                  </label>
                  <select
                    value={damageDeductionType}
                    onChange={(e) => setDamageDeductionType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="invoice">Add to Final Invoice Bill</option>
                    <option value="deposit">Deduct from Security Deposit Held</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Incident Report &amp; Notes
                </label>
                <textarea
                  rows={2}
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  placeholder="e.g. Buffet glassware dropped during dessert rush. Client acknowledged."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveDamageBooking(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all cursor-pointer shadow-md shadow-rose-600/30 disabled:opacity-50"
                >
                  {modalSubmitting ? 'Recording...' : 'Record Penalty & Apply to Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
