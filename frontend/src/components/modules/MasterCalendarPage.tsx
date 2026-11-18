import React, { useMemo, useState } from 'react';
import {
  Ban,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

export interface BlockedDateRange {
  id: string;
  hall: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HALL_OPTIONS = ['All Halls', 'Hall A', 'Hall B'];

function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export const MasterCalendarPage: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedHall, setSelectedHall] = useState<string>('All Halls');

  // Strictly empty initial state — zero hardcoded dummy data
  const [blockedRanges, setBlockedRanges] = useState<BlockedDateRange[]>([]);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  // Block Date modal form state
  const [blockHall, setBlockHall] = useState<string>('Hall A');
  const [blockStartDate, setBlockStartDate] = useState<string>('');
  const [blockEndDate, setBlockEndDate] = useState<string>('');
  const [blockReason, setBlockReason] = useState<string>('');

  const todayKey = formatDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const monthLabel = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const handleOpenBlockModal = (prefillDate?: string) => {
    setBlockHall(selectedHall === 'All Halls' ? 'Hall A' : selectedHall);
    setBlockStartDate(prefillDate ?? '');
    setBlockEndDate(prefillDate ?? '');
    setBlockReason('');
    setIsBlockModalOpen(true);
  };

  const handleBlockDates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockStartDate || !blockEndDate) return;

    const start = blockStartDate <= blockEndDate ? blockStartDate : blockEndDate;
    const end = blockEndDate >= blockStartDate ? blockEndDate : blockStartDate;

    const newRange: BlockedDateRange = {
      id: `BLK-${Date.now().toString().slice(-5)}`,
      hall: blockHall,
      startDate: start,
      endDate: end,
      reason: blockReason.trim() || 'Blocked',
    };

    setBlockedRanges((prev) => [newRange, ...prev]);
    setIsBlockModalOpen(false);
  };

  // Build Mon–Sun calendar grid cells
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // Convert JS Sunday=0..Saturday=6 to Monday=0..Sunday=6
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

    const cells: Array<{
      key: string;
      day: number | null;
      dateKey: string | null;
    }> = [];

    for (let i = 0; i < startOffset; i++) {
      cells.push({ key: `pad-start-${i}`, day: null, dateKey: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(currentYear, currentMonth, day);
      cells.push({ key: dateKey, day, dateKey });
    }

    const remainder = cells.length % 7;
    if (remainder !== 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        cells.push({ key: `pad-end-${i}`, day: null, dateKey: null });
      }
    }

    return cells;
  }, [currentYear, currentMonth]);

  const getBlocksForDate = (dateKey: string): BlockedDateRange[] => {
    return blockedRanges.filter((range) => {
      const matchesDate = dateKey >= range.startDate && dateKey <= range.endDate;
      const matchesHall =
        selectedHall === 'All Halls' ||
        range.hall === 'All Halls' ||
        range.hall === selectedHall;
      return matchesDate && matchesHall;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Header */}
      <div>
        <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
          Calendar &amp; Availability
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View hall bookings, availability, and block dates for maintenance.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Side: Month Navigation + Today */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-1.5 text-sm font-semibold text-slate-900 min-w-[152px] text-center border-x border-slate-200">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoToToday}
            className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* Right Side: Hall Selector + Block Date */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              aria-label="Select Hall"
              value={selectedHall}
              onChange={(e) => setSelectedHall(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            >
              {HALL_OPTIONS.map((hall) => (
                <option key={hall} value={hall}>
                  {hall}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => handleOpenBlockModal()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Ban className="w-4 h-4" />
            Block Date
          </button>
        </div>
      </div>

      {/* Main Section: Custom Month View Calendar Grid */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            {/* Weekday Header Row (Mon-Sun) */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
              {WEEKDAYS.map((dayName) => (
                <div
                  key={dayName}
                  className="py-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center border-r last:border-r-0 border-slate-200"
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7">
              {calendarCells.map((cell, index) => {
                const isLastCol = (index + 1) % 7 === 0;
                const isToday = cell.dateKey === todayKey;
                const blocks = cell.dateKey ? getBlocksForDate(cell.dateKey) : [];

                if (!cell.day || !cell.dateKey) {
                  return (
                    <div
                      key={cell.key}
                      className={`min-h-[110px] sm:min-h-[124px] bg-slate-50/40 border-b border-slate-200 ${
                        isLastCol ? '' : 'border-r'
                      }`}
                    />
                  );
                }

                return (
                  <div
                    key={cell.key}
                    onClick={() => handleOpenBlockModal(cell.dateKey ?? undefined)}
                    className={`min-h-[110px] sm:min-h-[124px] p-2.5 bg-white hover:bg-teal-50/35 transition-colors cursor-pointer flex flex-col justify-between border-b border-slate-200 ${
                      isLastCol ? '' : 'border-r'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-mono font-semibold tabular-nums ${
                          isToday
                            ? 'bg-teal-700 text-white'
                            : 'text-slate-700'
                        }`}
                      >
                        {cell.day}
                      </span>
                      {blocks.length === 0 && (
                        <span className="text-[10px] font-mono text-slate-300">
                          [--]
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1">
                      {blocks.length === 0 ? (
                        <p className="text-[11px] font-medium text-slate-400">
                          Open Slots
                        </p>
                      ) : (
                        blocks.slice(0, 2).map((blk) => (
                          <div
                            key={blk.id}
                            className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 truncate"
                            title={`${blk.hall}: ${blk.reason}`}
                          >
                            {blk.hall} &middot; {blk.reason}
                          </div>
                        ))
                      )}
                      {blocks.length > 2 && (
                        <p className="text-[10px] font-medium text-slate-500">
                          +{blocks.length - 2} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Block Date Modal */}
      {isBlockModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="block-date-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3
                id="block-date-modal-title"
                className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900"
              >
                Block Dates
              </h3>
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBlockDates} className="p-5 space-y-4">
              <div>
                <label
                  htmlFor="block-hall"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Select Hall
                </label>
                <select
                  id="block-hall"
                  value={blockHall}
                  onChange={(e) => setBlockHall(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                >
                  {HALL_OPTIONS.map((hall) => (
                    <option key={hall} value={hall}>
                      {hall}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="block-start"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Start Date
                  </label>
                  <input
                    id="block-start"
                    type="date"
                    required
                    value={blockStartDate}
                    onChange={(e) => setBlockStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="block-end"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    End Date
                  </label>
                  <input
                    id="block-end"
                    type="date"
                    required
                    value={blockEndDate}
                    onChange={(e) => setBlockEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="block-reason"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Reason
                </label>
                <textarea
                  id="block-reason"
                  rows={3}
                  required
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="[Maintenance / Holiday]"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  Block Dates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
