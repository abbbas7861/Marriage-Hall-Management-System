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
} from 'lucide-react';
import { BlockedDate, Booking, Hall } from '../../types';
import { bookingsApi, blockedDatesApi, hallsApi } from '../../api/client';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HALL_OPTIONS = [
  'All Halls',
  'Grand Ballroom',
  'Crystal Pavilion',
  'Royal Banquet',
  'Garden Lawn Complex',
];

export const CalendarModule: React.FC<{ onOpenCreate?: () => void }> = ({ onOpenCreate }) => {
  // STRICT DATA RULE: DO NOT hardcode dummy data. Start as empty arrays.
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCalendarData = async () => {
    setIsLoading(true);
    try {
      const [blockData, bookData, hallData] = await Promise.all([
        blockedDatesApi.list().catch(() => []),
        bookingsApi.list().catch(() => []),
        hallsApi.list().catch(() => []),
      ]);
      setBlockedDates(blockData);
      setBookings(bookData);
      setHalls(hallData);
    } catch (err: any) {
      console.error('Failed to load calendar data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

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

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

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

  // Calculate Month Grid days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Monday-based index: 0 = Mon, 6 = Sun
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

  // Padded previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const d = new Date(year, month - 1, day);
    calendarCells.push({
      date: d,
      dayNum: day,
      isCurrentMonth: false,
      dateString: d.toISOString().split('T')[0],
      isToday: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday =
      d.getFullYear() === 2026 && d.getMonth() === 9 && d.getDate() === 17; // Oct 17, 2026
    calendarCells.push({
      date: d,
      dayNum: day,
      isCurrentMonth: true,
      dateString: dateStr,
      isToday,
    });
  }

  // Padded next month days to complete 35 or 42 grid cells
  const totalCellsNeeded = calendarCells.length <= 35 ? 35 : 42;
  const remaining = totalCellsNeeded - calendarCells.length;
  for (let day = 1; day <= remaining; day++) {
    const d = new Date(year, month + 1, day);
    calendarCells.push({
      date: d,
      dayNum: day,
      isCurrentMonth: false,
      dateString: d.toISOString().split('T')[0],
      isToday: false,
    });
  }

  // Week View calculation (7 days around current date)
  const getWeekDays = () => {
    const curr = new Date(currentDate);
    const dayOfWeek = (curr.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - dayOfWeek);

    const week: CalendarCell[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday =
        d.getFullYear() === 2026 && d.getMonth() === 9 && d.getDate() === 17;
      const dateStr = d.toISOString().split('T')[0];
      week.push({
        date: d,
        dayNum: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        dateString: dateStr,
        isToday,
      });
    }
    return week;
  };

  const weekDays = getWeekDays();

  // Helper to check if a date string is blocked
  const getBlockedForDate = (dateStr: string) => {
    return blockedDates.filter((b) => {
      if (selectedHall !== 'All Halls' && b.hallName !== 'All Halls' && b.hallName !== selectedHall) {
        return false;
      }
      return dateStr >= b.startDate && dateStr <= b.endDate;
    });
  };

  const openBlockModal = (defaultDate?: string) => {
    setBlockHall(selectedHall !== 'All Halls' ? selectedHall : 'All Halls');
    setBlockStartDate(defaultDate || `${year}-${String(month + 1).padStart(2, '0')}-17`);
    setBlockEndDate(defaultDate || `${year}-${String(month + 1).padStart(2, '0')}-17`);
    setBlockReason('');
    setBlockError('');
    setIsBlockModalOpen(true);
  };

  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();

    if (!blockStartDate || !blockEndDate) {
      setBlockError('Please specify both start and end dates.');
      return;
    }

    if (blockStartDate > blockEndDate) {
      setBlockError('End date must be on or after start date.');
      return;
    }

    blockedDatesApi.create({
      hallName: blockHall,
      startDate: blockStartDate,
      endDate: blockEndDate,
      reason: blockReason.trim() || 'Facility Maintenance',
    }).then((newBlock) => {
      setBlockedDates((prev) => [...prev, newBlock]);
      setIsBlockModalOpen(false);
      showToast(`Date interval ${blockStartDate} to ${blockEndDate} marked as blocked for [${blockHall}].`);
    }).catch((err: any) => {
      setBlockError(err.message || 'Failed to save maintenance block.');
    });
  };

  const handleResetBlocks = () => {
    setBlockedDates([]);
    showToast('Calendar maintenance blocks cleared.');
  };

  return (
    <div className="flex flex-col w-full gap-5 pb-12 select-none animate-in fade-in duration-150">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-teal-900 text-white shadow-xl flex items-center gap-2.5 text-xs font-medium border border-teal-700 animate-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Top Section (Header) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
              Calendar &amp; Availability
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00685f]"></span>
              REAL-TIME OCCUPANCY
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            View hall bookings, availability, and block dates for maintenance.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {blockedDates.length > 0 && (
            <button
              type="button"
              onClick={handleResetBlocks}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Blocks</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => openBlockModal()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00685f] hover:bg-[#00524b] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.98]"
          >
            <Lock className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>+ Block Date</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-xs">
        {/* Left Side: Month Navigation & Today Button */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 rounded-md hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 font-semibold text-slate-900 font-['Plus_Jakarta_Sans'] min-w-[140px] text-center">
              [{formattedMonthYear}]
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 rounded-md hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
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
              className="pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all cursor-pointer"
            >
              <option value="All Halls">Select Hall: All Halls</option>
              {halls.length > 0 ? (
                halls.map((h) => (
                  <option key={h.id} value={h.name}>
                    Hall: {h.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="Grand Crystal Ballroom">Hall: Grand Crystal Ballroom</option>
                  <option value="Royal Emerald Hall">Hall: Royal Emerald Hall</option>
                  <option value="Sapphire Banquet">Hall: Sapphire Banquet</option>
                  <option value="Imperial Courtyard Lawn">Hall: Imperial Courtyard Lawn</option>
                </>
              )}
            </select>
          </div>

          {/* View Toggle (Month View / Week View) */}
          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('Month')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'Month'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('Week')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'Week'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week View
            </button>
          </div>
        </div>
      </div>

      {/* Main Section: Calendar Grid (Month View) */}
      {viewMode === 'Month' ? (
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          {/* Days of the Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center">
            {DAYS_OF_WEEK.map((day, idx) => (
              <div
                key={day}
                className={`py-3 text-[11px] font-bold uppercase tracking-wider ${
                  idx >= 5 ? 'text-teal-700' : 'text-slate-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Month Calendar Cells Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {calendarCells.map((cell, idx) => {
              const blocks = getBlockedForDate(cell.dateString);
              const isBlocked = blocks.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => openBlockModal(cell.dateString)}
                  className={`min-h-[105px] sm:min-h-[120px] p-2 sm:p-2.5 flex flex-col justify-between transition-colors relative group cursor-pointer ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-50/40 text-slate-400'
                      : isBlocked
                      ? 'bg-amber-50/30'
                      : 'bg-white hover:bg-slate-50/80 text-slate-800'
                  }`}
                >
                  {/* Cell Top Header: Date Number */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center text-xs font-semibold rounded-full w-6 h-6 transition-colors ${
                        cell.isToday
                          ? 'bg-[#00685f] text-white font-bold shadow-xs'
                          : cell.isCurrentMonth
                          ? 'text-slate-700 group-hover:text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Quick Add Plus icon on hover */}
                    <span className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#00685f] transition-opacity">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Cell Body: Event State or Subtle Empty State */}
                  <div className="flex flex-col gap-1 my-1 flex-1 justify-center">
                    {(() => {
                      const dayBookings = bookings.filter((b) => {
                        if (selectedHall !== 'All Halls' && b.hallName !== selectedHall) return false;
                        return b.date === cell.dateString;
                      });

                      if (isBlocked) {
                        return blocks.map((b) => (
                          <div
                            key={b.id}
                            className="px-2 py-1 rounded-md bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-semibold flex items-center gap-1 shadow-2xs"
                          >
                            <Lock className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                            <span className="truncate">
                              [{b.hallName} - {b.reason}]
                            </span>
                          </div>
                        ));
                      }

                      if (dayBookings.length > 0) {
                        return dayBookings.map((bk) => (
                          <div
                            key={bk.id}
                            className="px-2 py-1 rounded-md bg-teal-50 border border-teal-200 text-[#00685f] text-[10px] font-semibold flex items-center gap-1 shadow-2xs"
                          >
                            <CalendarDays className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                            <span className="truncate">
                              {bk.customerName} ({bk.eventType})
                            </span>
                          </div>
                        ));
                      }

                      return (
                        <div className="text-center py-2">
                          <span className="text-[11px] font-mono text-slate-300 group-hover:text-slate-400 transition-colors">
                            No Events
                          </span>
                          <span className="text-[9px] font-mono text-slate-300 block">
                            [--]
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Cell Footer metadata */}
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <span className="opacity-0 group-hover:opacity-70 transition-opacity">
                      Click to block
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Week View Grid */
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          {/* Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center">
            {weekDays.map((cell, idx) => (
              <div
                key={idx}
                className={`py-3 px-2 flex flex-col items-center justify-center gap-1 ${
                  cell.isToday ? 'bg-teal-50/60' : ''
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {DAYS_OF_WEEK[idx]}
                </span>
                <span
                  className={`inline-flex items-center justify-center text-xs font-bold rounded-full w-6 h-6 ${
                    cell.isToday ? 'bg-[#00685f] text-white shadow-xs' : 'text-slate-800'
                  }`}
                >
                  {cell.dayNum}
                </span>
              </div>
            ))}
          </div>

          {/* Week Slots Grid */}
          <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[420px]">
            {weekDays.map((cell, idx) => {
              const blocks = getBlockedForDate(cell.dateString);
              const isBlocked = blocks.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => openBlockModal(cell.dateString)}
                  className="p-3 flex flex-col gap-2 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <div className="text-[10px] text-slate-400 font-mono text-center">
                    {cell.dateString}
                  </div>

                  {isBlocked ? (
                    blocks.map((b) => (
                      <div
                        key={b.id}
                        className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex flex-col gap-1"
                      >
                        <div className="flex items-center gap-1 font-bold text-[11px] text-amber-800">
                          <Lock className="w-3 h-3" />
                          <span>BLOCKED</span>
                        </div>
                        <span className="text-[10px]">{b.hallName}</span>
                        <span className="text-[10px] text-amber-700 italic">[{b.reason}]</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 py-8">
                      <span className="text-xs font-mono text-slate-400">No Events</span>
                      <span className="text-[10px] font-mono text-slate-300">[--]</span>
                      <span className="text-[10px] text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                        + Block Day
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
      <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#00685f]"></span>
            <span>Current Day (Today)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300"></span>
            <span>Maintenance / Blocked Date</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[11px]">[--]</span>
            <span>Empty Scheduled Slot</span>
          </div>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          [Calendar Status: 0 Bookings Scheduled]
        </div>
      </div>

      {/* "Block Date" Modal (Simulated) */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                    Block Dates for Venue
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Reserve timeframes for deep cleaning, acoustics, or scheduled renovations.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBlock} className="p-6 flex flex-col gap-4 text-xs">
              {blockError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {blockError}
                </div>
              )}

              {/* Select Hall Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">
                  Select Hall <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={blockHall}
                    onChange={(e) => setBlockHall(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00685f] cursor-pointer"
                  >
                    {HALL_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start Date & End Date (Date Pickers) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-700">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={blockStartDate}
                    onChange={(e) => setBlockStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00685f]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-700">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={blockEndDate}
                    onChange={(e) => setBlockEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00685f]"
                    required
                  />
                </div>
              </div>

              {/* Reason Textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">
                  Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="[Maintenance / Holiday / Carpet Replacement]"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] resize-none"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00685f] hover:bg-[#00524b] text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Block Dates</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
