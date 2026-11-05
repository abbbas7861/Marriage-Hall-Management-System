import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Building2,
  Lock,
  Clock,
  Check,
  X,
  AlertCircle,
  RotateCcw,
  ShieldAlert,
  Info,
  CalendarDays,
  Sparkles,
  Sun,
  Moon,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { BlockedDate, Booking, Hall } from '../../types';
import { bookingsApi, blockedDatesApi, hallsApi } from '../../api/client';
import { formatTo12Hour, timeToMinutes, minutesTo12Hour, getCleaningWindows } from '../../utils/timeFormat';
import { CANONICAL_HALLS } from '../../constants/halls';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface BookingPreloadData {
  hallName?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}

export const CalendarModule: React.FC<{
  onOpenCreate?: (preload?: BookingPreloadData) => void;
}> = ({ onOpenCreate }) => {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Navigation state (Defaulting to current date)
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedHall, setSelectedHall] = useState<string>('All Halls');
  const [viewMode, setViewMode] = useState<'Month' | 'Week'>('Month');

  // Modal State for "Block Date"
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockHall, setBlockHall] = useState('All Halls');
  const [blockStartDate, setBlockStartDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockError, setBlockError] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Selected Day Details Drawer
  const [selectedDayDetails, setSelectedDayDetails] = useState<{ dateString: string; bookings: Booking[]; blocks: BlockedDate[] } | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const [hallsData, bookingsData, blocksData] = await Promise.all([
        hallsApi.list().catch(() => []),
        bookingsApi.list().catch(() => []),
        blockedDatesApi.list().catch(() => []),
      ]);
      setHalls(Array.isArray(hallsData) && hallsData.length > 0 ? hallsData : (CANONICAL_HALLS as unknown as Hall[]));
      setBookings(bookingsData);
      setBlockedDates(blocksData);
    } catch (err) {
      console.error('Error loading calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, []);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (viewMode === 'Month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
    }
  };

  const handleNextMonth = () => {
    if (viewMode === 'Month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formattedMonthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = lastDayOfMonth.getDate();
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  interface CalendarCell {
    date: Date;
    dayNum: number;
    isCurrentMonth: boolean;
    dateString: string;
    isToday: boolean;
  }

  const calendarCells: CalendarCell[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const d = new Date(year, month - 1, day);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    calendarCells.push({
      date: d,
      dayNum: day,
      isCurrentMonth: false,
      dateString: dStr,
      isToday: dStr === todayStr,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      date: d,
      dayNum: day,
      isCurrentMonth: true,
      dateString: dateStr,
      isToday: dateStr === todayStr,
    });
  }

  const totalCellsNeeded = calendarCells.length <= 35 ? 35 : 42;
  const remaining = totalCellsNeeded - calendarCells.length;
  for (let day = 1; day <= remaining; day++) {
    const d = new Date(year, month + 1, day);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    calendarCells.push({
      date: d,
      dayNum: day,
      isCurrentMonth: false,
      dateString: dStr,
      isToday: dStr === todayStr,
    });
  }

  // 7 days of the current week for Week View
  const startOfWeek = new Date(currentDate);
  const currentDayOfWeek = (startOfWeek.getDay() + 6) % 7; // Monday = 0
  startOfWeek.setDate(startOfWeek.getDate() - currentDayOfWeek);

  const weekDays: CalendarCell[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      date: d,
      dayNum: d.getDate(),
      isCurrentMonth: d.getMonth() === month,
      dateString: dStr,
      isToday: dStr === todayStr,
    };
  });

  // Filter Bookings & Blocks for a Date
  const getBookingsForDate = (dateStr: string) => {
    return bookings.filter((b) => {
      if (b.date !== dateStr) return false;
      if (selectedHall !== 'All Halls' && b.hallName.toLowerCase() !== selectedHall.toLowerCase()) {
        return false;
      }
      return b.status !== 'Cancelled';
    });
  };

  const getBlockedForDate = (dateStr: string) => {
    return blockedDates.filter((b) => {
      if (selectedHall !== 'All Halls' && b.hallName !== 'All Halls' && b.hallName.toLowerCase() !== selectedHall.toLowerCase()) {
        return false;
      }
      return dateStr >= b.startDate && dateStr <= b.endDate;
    });
  };

  const openBlockModal = (defaultDate?: string) => {
    setBlockHall(selectedHall !== 'All Halls' ? selectedHall : 'All Halls');
    setBlockStartDate(defaultDate || todayStr);
    setBlockEndDate(defaultDate || todayStr);
    setBlockReason('');
    setBlockError('');
    setIsBlockModalOpen(true);
  };

  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!blockStartDate || !blockEndDate) {
      setBlockError('Please specify both start and end dates.');
      return;
    }

    if (blockStartDate > blockEndDate) {
      setBlockError('End date must be on or after start date.');
      return;
    }

    try {
      const created = await blockedDatesApi.create({
        hallName: blockHall,
        startDate: blockStartDate,
        endDate: blockEndDate,
        reason: blockReason.trim() || 'Facility Maintenance',
      });
      setBlockedDates((prev) => [...prev, created]);
      setIsBlockModalOpen(false);
      showToast(`Date interval ${blockStartDate} to ${blockEndDate} marked as blocked.`);
    } catch (err: any) {
      setBlockError(err?.message || 'Failed to block dates');
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      await blockedDatesApi.delete(id);
      setBlockedDates((prev) => prev.filter((b) => b.id !== id));
      showToast('Maintenance block removed.');
      if (selectedDayDetails) {
        setSelectedDayDetails((prev) => prev ? { ...prev, blocks: prev.blocks.filter((b) => b.id !== id) } : null);
      }
    } catch (err) {
      showToast('Failed to delete block.');
    }
  };

  const handleResetBlocks = async () => {
    try {
      await Promise.all(blockedDates.map((b) => blockedDatesApi.delete(b.id)));
      setBlockedDates([]);
      showToast('All maintenance blocks cleared.');
    } catch (err) {
      console.error('Failed to reset blocks:', err);
      showToast('Failed to reset blocks.');
    }
  };

  const hallNames = ['All Halls', ...halls.map((h) => h.name)];

  return (
    <div className="flex flex-col w-full gap-6 pb-12 select-none animate-in fade-in duration-150 text-slate-100">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-slate-800 text-teal-300 shadow-2xl flex items-center gap-2.5 text-xs font-semibold border border-teal-500/40 animate-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Top Section (Header) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans']">
              Calendar &amp; Availability
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-teal-300 text-xs font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              REAL-TIME OCCUPANCY
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            View hall bookings, availability, and block dates for maintenance.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {blockedDates.length > 0 && (
            <button
              type="button"
              onClick={handleResetBlocks}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Blocks</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => openBlockModal()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-teal-500/20 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Lock className="w-4 h-4 stroke-[2.2]" />
            <span>Block Date</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl">
        {/* Left Side: Month Navigation & Today Button */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 font-semibold text-white font-['Plus_Jakarta_Sans'] min-w-[140px] text-center">
              [{formattedMonthYear}]
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold shadow-md transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* Right Side: Hall Selector & View Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Hall Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedHall}
              onChange={(e) => setSelectedHall(e.target.value)}
              className="pl-3 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:border-teal-500 transition-all cursor-pointer"
            >
              {hallNames.map((hall) => (
                <option key={hall} value={hall}>
                  {hall === 'All Halls' ? 'Select Hall: All Halls' : `Hall: ${hall}`}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle (Month View / Week View) */}
          <div className="inline-flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('Month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'Month'
                  ? 'bg-slate-800 text-teal-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Month View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('Week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'Week'
                  ? 'bg-slate-800 text-teal-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Week View
            </button>
          </div>
        </div>
      </div>

      {/* Main Section: Calendar Grid (Month View) */}
      {viewMode === 'Month' ? (
        <div className="w-full bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden flex flex-col">
          {/* Days of the Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-700/60 bg-slate-900/80 text-center">
            {DAYS_OF_WEEK.map((day, idx) => (
              <div
                key={day}
                className={`py-3 text-[11px] font-bold uppercase tracking-wider ${
                  idx >= 5 ? 'text-teal-400' : 'text-slate-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Month Calendar Cells Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-700/50">
            {calendarCells.map((cell, idx) => {
              const blocks = getBlockedForDate(cell.dateString);
              const dayBookings = getBookingsForDate(cell.dateString);
              const isBlocked = blocks.length > 0;
              const hasBookings = dayBookings.length > 0;

              const morningBooking = dayBookings.find((b) => b.slot?.toLowerCase().includes('morning') || b.slot?.toLowerCase().includes('lunch'));
              const eveningBooking = dayBookings.find((b) => b.slot?.toLowerCase().includes('evening') || b.slot?.toLowerCase().includes('dinner'));

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDayDetails({ dateString: cell.dateString, bookings: dayBookings, blocks })}
                  className={`min-h-[110px] sm:min-h-[125px] p-2 sm:p-2.5 flex flex-col justify-between transition-all relative group cursor-pointer ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-900/40 text-slate-600'
                      : isBlocked
                      ? 'bg-amber-950/20'
                      : hasBookings
                      ? 'bg-teal-950/20 hover:bg-teal-950/30'
                      : 'bg-slate-800/40 hover:bg-slate-800/80 text-slate-200'
                  }`}
                >
                  {/* Cell Top Header: Date Number */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center text-xs font-semibold rounded-full w-6 h-6 transition-colors ${
                        cell.isToday
                          ? 'bg-teal-600 text-white font-bold shadow-sm'
                          : cell.isCurrentMonth
                          ? 'text-slate-300 group-hover:text-white'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Dual Slot Pills Preview */}
                    <div className="flex items-center gap-1">
                      {morningBooking ? (
                        <span className="w-2 h-2 rounded-full bg-amber-400" title={`Morning: ${morningBooking.customerName}`} />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-700" title="Morning Slot Available" />
                      )}
                      {eveningBooking ? (
                        <span className="w-2 h-2 rounded-full bg-teal-400" title={`Evening: ${eveningBooking.customerName}`} />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-700" title="Evening Slot Available" />
                      )}
                    </div>
                  </div>

                  {/* Cell Body: Event State */}
                  <div className="flex flex-col gap-1 my-1 flex-1 justify-center">
                    {isBlocked ? (
                      blocks.map((b) => (
                        <div
                          key={b.id}
                          className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-semibold flex items-center gap-1 shadow-sm truncate"
                        >
                          <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          <span className="truncate">[{b.hallName}]</span>
                        </div>
                      ))
                    ) : hasBookings ? (
                      dayBookings.slice(0, 2).map((b) => (
                        <div
                          key={b.id}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 truncate border ${
                            b.slot?.toLowerCase().includes('morning')
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                          }`}
                        >
                          {b.slot?.toLowerCase().includes('morning') ? (
                            <Sun className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          ) : (
                            <Moon className="w-2.5 h-2.5 text-teal-400 shrink-0" />
                          )}
                          <span className="truncate">{b.customerName}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-1">
                        <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 transition-colors">
                          Open Slots
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Cell Footer */}
                  <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                    <span>{hasBookings ? `${dayBookings.length} Booked` : ''}</span>
                    <span className="opacity-0 group-hover:opacity-70 transition-opacity text-teal-400">Details &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Week View Grid */
        <div className="w-full bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden flex flex-col">
          {/* Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-700/60 bg-slate-900/80 text-center">
            {weekDays.map((cell, idx) => (
              <div
                key={idx}
                className={`py-3 px-2 flex flex-col items-center justify-center gap-1 ${
                  cell.isToday ? 'bg-teal-500/10' : ''
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {DAYS_OF_WEEK[idx]}
                </span>
                <span
                  className={`inline-flex items-center justify-center text-xs font-bold rounded-full w-6 h-6 ${
                    cell.isToday ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-200'
                  }`}
                >
                  {cell.dayNum}
                </span>
              </div>
            ))}
          </div>

          {/* Week Slots Grid */}
          <div className="grid grid-cols-7 divide-x divide-slate-700/50 min-h-[420px]">
            {weekDays.map((cell, idx) => {
              const blocks = getBlockedForDate(cell.dateString);
              const isBlocked = blocks.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => openBlockModal(cell.dateString)}
                  className="p-3 flex flex-col gap-2 hover:bg-slate-800/60 transition-colors cursor-pointer group"
                >
                  <div className="text-[10px] text-slate-400 font-mono text-center">
                    {cell.dateString}
                  </div>

                  {isBlocked ? (
                    blocks.map((b) => (
                      <div
                        key={b.id}
                        className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium flex flex-col gap-1"
                      >
                        <div className="flex items-center gap-1 font-bold text-[11px] text-amber-400">
                          <Lock className="w-3 h-3" />
                          <span>BLOCKED</span>
                        </div>
                        <span className="text-[10px]">{b.hallName}</span>
                        <span className="text-[10px] text-amber-400 italic">[{b.reason}]</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 py-8">
                      <span className="text-xs font-mono text-slate-500">No Events</span>
                      <span className="text-[10px] font-mono text-slate-600">[--]</span>
                      <span className="text-[10px] text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                        Block Day
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend & Guidance Footer */}
      <div className="p-4 rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-700/50 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-500"></span>
            <span>Current Day (Today)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-amber-500/30 border border-amber-400/40"></span>
            <span>Maintenance / Blocked Date</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-mono text-[11px]">[--]</span>
            <span>Empty Scheduled Slot</span>
          </div>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          [Calendar Status: {bookings.length} Bookings Scheduled]
        </div>
      </div>

      {/* "Block Date" Modal */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-h-[90vh] overflow-y-auto flex flex-col text-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                    Block Dates for Venue
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Reserve timeframes for deep cleaning, acoustics, or scheduled renovations.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBlock} className="p-6 flex flex-col gap-4 text-xs">
              {blockError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-medium">
                  {blockError}
                </div>
              )}

              {/* Select Hall Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-300">
                  Select Hall <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={blockHall}
                    onChange={(e) => setBlockHall(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    {hallNames.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-300">
                    Start Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={blockStartDate}
                    onChange={(e) => setBlockStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-300">
                    End Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={blockEndDate}
                    onChange={(e) => setBlockEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              {/* Reason Textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-300">
                  Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="[Maintenance / Holiday / Carpet Replacement]"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Block Dates</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Day Details Drawer */}
      {selectedDayDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-800 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-base text-white">
                  Hall Occupancy &amp; Availability: {selectedDayDetails.dateString}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDetails(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-5">
              {/* 1 Hour Cleaning Notice */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Turnover Protocol Active:</strong> 1 hour before and 1 hour after each booked event is strictly reserved for hall cleaning, sanitation, and staging. New bookings must fall outside of this blocked cleaning window.
                </div>
              </div>

              {/* Hall-by-Hall Status Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  All Venue Halls Status on {selectedDayDetails.dateString}:
                </h4>

                {halls.map((hall) => {
                  const hallBookings = selectedDayDetails.bookings.filter(
                    (b) => b.hallName?.toLowerCase() === hall.name.toLowerCase()
                  );
                  const isBlocked = selectedDayDetails.blocks.some(
                    (bl) => bl.hallName === 'All Halls' || bl.hallName.toLowerCase() === hall.name.toLowerCase()
                  );

                  return (
                    <div
                      key={hall.id}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-850 bg-slate-800/50 hover:bg-slate-800 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-teal-400" />
                          <span className="font-bold text-white text-sm">{hall.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">({hall.code || 'HL'}) • Cap: {hall.capacity}</span>
                        </div>
                        {isBlocked ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase border border-rose-500/30">
                            Maintenance Blocked
                          </span>
                        ) : hallBookings.length === 0 ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase border border-emerald-500/30">
                            All Day Available
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase border border-amber-500/30">
                            {hallBookings.length} Event(s) Booked
                          </span>
                        )}
                      </div>

                      {/* If Bookings Exist for this Hall */}
                      {hallBookings.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {hallBookings.map((b) => {
                            const rawTime = b.time || b.slot || '12:00 PM – 04:00 PM';
                            const formattedTime = formatTo12Hour(rawTime);

                            return (
                              <div
                                key={b.id}
                                className="p-3 rounded-lg bg-slate-900 border border-slate-700/60 text-xs space-y-1.5 shadow-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                    <span>Occupied by: {b.customerName}</span>
                                    <span className="text-slate-400 font-mono text-[10px]">[{b.bookingRef}]</span>
                                  </div>
                                  <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-mono text-[10px] font-semibold border border-slate-700">
                                    {b.eventType}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-slate-800">
                                  <div>
                                    <strong className="text-slate-400">Event Time (12h):</strong>{' '}
                                    <span className="text-teal-300 font-bold">{formattedTime}</span>
                                  </div>
                                  <div>
                                    <strong className="text-slate-400">Reserved Window:</strong>{' '}
                                    <span className="text-amber-300 font-bold">Incl. 1h Pre &amp; Post Cleaning</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Available Free Windows for Booking */}
                      <div className="pt-1.5 flex items-center justify-between text-xs text-slate-400">
                        <span className="text-[11px] font-semibold text-slate-400">
                          {isBlocked
                            ? 'No slots available (Maintenance active)'
                            : hallBookings.length === 0
                            ? 'Available for Full Day or Morning (12:00 PM – 04:00 PM) & Evening (07:00 PM – 11:30 PM)'
                            : hallBookings.some((b) => (b.slot || b.time || '').toLowerCase().includes('morning')) && !hallBookings.some((b) => (b.slot || b.time || '').toLowerCase().includes('evening'))
                            ? 'Available for Evening Slot (07:00 PM – 11:30 PM) [Morning cleaning completed by 05:00 PM]'
                            : !hallBookings.some((b) => (b.slot || b.time || '').toLowerCase().includes('morning')) && hallBookings.some((b) => (b.slot || b.time || '').toLowerCase().includes('evening'))
                            ? 'Available for Morning Slot (12:00 PM – 04:00 PM) [Next event setup begins at 06:00 PM]'
                            : 'Fully booked for both Morning & Evening shifts.'}
                        </span>

                        {!isBlocked && hallBookings.length < 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const d = selectedDayDetails.dateString;
                              const hasMorning = hallBookings.some((b) => (b.slot || b.time || '').toLowerCase().includes('morning'));
                              const suggestedStart = hasMorning ? '19:00' : '12:00';
                              const suggestedEnd = hasMorning ? '23:30' : '16:00';

                              setSelectedDayDetails(null);
                              if (onOpenCreate) {
                                onOpenCreate({
                                  hallName: hall.name,
                                  date: d,
                                  startTime: suggestedStart,
                                  endTime: suggestedEnd,
                                });
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>Book This Hall</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Maintenance blocks on this date */}
              {selectedDayDetails.blocks.length > 0 && (
                <div className="p-3.5 rounded-xl border border-rose-800/50 bg-rose-950/30">
                  <div className="text-xs font-bold text-rose-300 flex items-center gap-1 mb-2">
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    <span>Active Maintenance Blocks ({selectedDayDetails.blocks.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedDayDetails.blocks.map((b) => (
                      <div key={b.id} className="flex items-center justify-between text-xs bg-slate-900 p-2.5 rounded-lg border border-rose-900/40">
                        <div>
                          <span className="font-bold text-slate-200">[{b.hallName}]</span> {b.reason}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(b.id)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                          title="Remove block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const d = selectedDayDetails.dateString;
                  setSelectedDayDetails(null);
                  openBlockModal(d);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Block this Day</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const d = selectedDayDetails.dateString;
                  setSelectedDayDetails(null);
                  if (onOpenCreate) {
                    onOpenCreate({
                      date: d,
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Booking for this Date</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
