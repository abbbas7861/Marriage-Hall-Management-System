import React, { useMemo, useState, useEffect } from 'react';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  X,
} from 'lucide-react';
import { bookingsApi, hallsApi } from '../../api/client';
import { SEED_HALLS } from '../../data/seedData';

export type EventSlot = 'Lunch/Afternoon' | 'Dinner/Evening';
export type BookingType =
  | 'Full Hall'
  | 'Half Hall (Section A)'
  | 'Half Hall (Section B)';

export interface CalendarBooking {
  id: string;
  date: string; // YYYY-MM-DD
  hall: string;
  slot: EventSlot;
  bookingType: BookingType;
  customerName: string;
  eventType: string;
  guestCount: string;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EVENT_SLOTS: EventSlot[] = ['Lunch/Afternoon', 'Dinner/Evening'];
const BOOKING_TYPES: BookingType[] = [
  'Full Hall',
  'Half Hall (Section A)',
  'Half Hall (Section B)',
];

export interface MasterCalendarPageProps {
  onProceedToBooking?: (prefill: {
    date: string;
    hall: string;
    slot: string;
    bookingType: string;
    customerName: string;
    eventType: string;
    guestCount: string;
  }) => void;
}

function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

type SlotAvailabilityState =
  | 'Open'
  | 'Half Booked (A)'
  | 'Half Booked (B)'
  | 'Fully Booked';

function getSlotState(
  bookings: CalendarBooking[],
  dateKey: string,
  hall: string,
  slot: EventSlot
): SlotAvailabilityState {
  const matching = bookings.filter(
    (b) => b.date === dateKey && b.hall === hall && b.slot === slot
  );
  if (matching.length === 0) return 'Open';

  const hasFull = matching.some((b) => b.bookingType === 'Full Hall');
  const hasA = matching.some((b) => b.bookingType === 'Half Hall (Section A)');
  const hasB = matching.some((b) => b.bookingType === 'Half Hall (Section B)');

  if (hasFull || (hasA && hasB)) return 'Fully Booked';
  if (hasA) return 'Half Booked (A)';
  if (hasB) return 'Half Booked (B)';
  return 'Open';
}

function isHallFullyBookedForDay(
  bookings: CalendarBooking[],
  dateKey: string,
  hall: string
): boolean {
  const slot1 = getSlotState(bookings, dateKey, hall, 'Lunch/Afternoon');
  const slot2 = getSlotState(bookings, dateKey, hall, 'Dinner/Evening');
  return slot1 === 'Fully Booked' && slot2 === 'Fully Booked';
}

export const MasterCalendarPage: React.FC<MasterCalendarPageProps> = ({
  onProceedToBooking,
}) => {
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedHall, setSelectedHall] = useState<string>('All Halls');

  // Dynamic Halls from backend
  const [availableHalls, setAvailableHalls] = useState<string[]>([]);

  // Load bookings from backend
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    hallsApi
      .list()
      .then((data) => {
        if (data && data.length > 0) {
          setAvailableHalls(data.map((h: any) => h.name));
        } else {
          setAvailableHalls(SEED_HALLS.map((h) => h.name));
        }
      })
      .catch(() => setAvailableHalls(SEED_HALLS.map((h) => h.name)));

    const fetchCalendarBookings = () => {
      bookingsApi
        .list()
        .then((data) => {
          if (Array.isArray(data)) {
            setBookings(
              data
                .filter((b: any) => {
                  if (b.status === 'Cancelled' || b.status === 'Rejected' || b.status === 'Completed') return false;
                  const op = (b.operationalStatus || b.operational_status || '').toLowerCase();
                  if (op.includes('concluded') || op.includes('completed') || op.includes('closed')) return false;
                  return true;
                })
                .map((b: any) => ({
                  id: String(b.id),
                  date: b.date || '',
                  hall: b.hallName || 'Royal Grand Hall',
                  slot:
                    b.slot && b.slot.toLowerCase().includes('lunch')
                      ? 'Lunch/Afternoon'
                      : 'Dinner/Evening',
                  bookingType: 'Full Hall',
                  customerName: b.customerName && b.customerName !== '[--]' ? b.customerName : '',
                  eventType: b.eventType && b.eventType !== '[--]' ? b.eventType : 'Barat',
                  guestCount: b.guestCount && b.guestCount !== '[--]' ? String(b.guestCount) : '',
                }))
            );
          }
        })
        .catch((err) => console.warn('Master calendar bookings API error:', err));
    };

    fetchCalendarBookings();

    const handleBookingCancelled = (e: any) => {
      if (e.detail?.bookingId) {
        setBookings((prev) => prev.filter((b) => b.id !== String(e.detail.bookingId)));
      } else {
        fetchCalendarBookings();
      }
    };
    const handleEventConcluded = (e: any) => {
      if (e.detail?.bookingId) {
        setBookings((prev) => prev.filter((b) => b.id !== String(e.detail.bookingId)));
      } else {
        fetchCalendarBookings();
      }
    };
    window.addEventListener('booking_cancelled', handleBookingCancelled);
    window.addEventListener('event_concluded', handleEventConcluded);
    window.addEventListener('booking_updated', fetchCalendarBookings);
    return () => {
      window.removeEventListener('booking_cancelled', handleBookingCancelled);
      window.removeEventListener('event_concluded', handleEventConcluded);
      window.removeEventListener('booking_updated', fetchCalendarBookings);
    };
  }, []);

  const bookableHalls = useMemo(() => {
    return availableHalls.length > 0 ? availableHalls : SEED_HALLS.map((h) => h.name);
  }, [availableHalls]);

  const hallOptions = useMemo(() => {
    return ['All Halls', ...bookableHalls];
  }, [bookableHalls]);

  // Create New Booking Modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingHall, setBookingHall] = useState<string>('');
  const [bookingSlot, setBookingSlot] = useState<EventSlot>('Lunch/Afternoon');
  const [bookingType, setBookingType] = useState<BookingType>('Full Hall');
  const [customerName, setCustomerName] = useState<string>('');
  const [eventType, setEventType] = useState<string>('Barat');
  const [guestCount, setGuestCount] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

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

  const handleDateCellClick = (dateKey: string) => {
    const targetHall = selectedHall === 'All Halls' ? (bookableHalls[0] || 'Royal Grand Hall') : selectedHall;

    // Enforce max 2 bookings (Lunch + Dinner) per day per hall
    if (isHallFullyBookedForDay(bookings, dateKey, targetHall)) {
      showToast('This hall is fully booked for the day.');
      return;
    }

    // Pick first available slot for that hall
    const slot1State = getSlotState(bookings, dateKey, targetHall, 'Lunch/Afternoon');
    const defaultSlot: EventSlot =
      slot1State !== 'Fully Booked' ? 'Lunch/Afternoon' : 'Dinner/Evening';

    // Pick first available booking type for that slot
    const defaultSlotState = getSlotState(bookings, dateKey, targetHall, defaultSlot);
    const defaultType: BookingType =
      defaultSlotState === 'Half Booked (A)'
        ? 'Half Hall (Section B)'
        : defaultSlotState === 'Half Booked (B)'
          ? 'Half Hall (Section A)'
          : 'Full Hall';

    setBookingDate(dateKey);
    setBookingHall(targetHall);
    setBookingSlot(defaultSlot);
    setBookingType(defaultType);
    setCustomerName('');
    setEventType('Barat');
    setGuestCount('');
    setFormError(null);
    setIsBookingModalOpen(true);
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isHallFullyBookedForDay(bookings, bookingDate, bookingHall)) {
      setFormError('This hall is fully booked for the day.');
      return;
    }

    const currentSlotState = getSlotState(
      bookings,
      bookingDate,
      bookingHall,
      bookingSlot
    );

    if (currentSlotState === 'Fully Booked') {
      setFormError(`Slot "${bookingSlot}" is already fully booked for ${bookingHall}.`);
      return;
    }

    if (
      currentSlotState === 'Half Booked (A)' &&
      (bookingType === 'Full Hall' || bookingType === 'Half Hall (Section A)')
    ) {
      setFormError(
        'Section A is already booked for this slot. Only Half Hall (Section B) is available.'
      );
      return;
    }

    if (
      currentSlotState === 'Half Booked (B)' &&
      (bookingType === 'Full Hall' || bookingType === 'Half Hall (Section B)')
    ) {
      setFormError(
        'Section B is already booked for this slot. Only Half Hall (Section A) is available.'
      );
      return;
    }

    if (onProceedToBooking) {
      onProceedToBooking({
        date: bookingDate,
        hall: bookingHall,
        slot: bookingSlot,
        bookingType,
        customerName: customerName.trim(),
        eventType,
        guestCount: guestCount.trim(),
      });
      setIsBookingModalOpen(false);
      return;
    }

    const tempId = `BK-${Date.now().toString().slice(-4)}`;
    const created: CalendarBooking = {
      id: tempId,
      date: bookingDate,
      hall: bookingHall,
      slot: bookingSlot,
      bookingType,
      customerName: customerName.trim() || 'Walk-in Client',
      eventType,
      guestCount: guestCount.trim() || '100',
    };

    setBookings((prev) => [...prev, created]);

    const apiPayload = {
      customerName: customerName.trim() || 'Walk-in Client',
      eventType,
      hallName: bookingHall,
      date: bookingDate,
      time: bookingSlot === 'Lunch/Afternoon' ? '12:00 PM – 04:00 PM' : '07:00 PM – 11:30 PM',
      slot: bookingSlot,
      guestCount: Number(guestCount) || 100,
      status: 'Confirmed',
    };

    bookingsApi
      .create(apiPayload)
      .then((res: any) => {
        if (res && res.id) {
          setBookings((prev) =>
            prev.map((b) => (b.id === tempId ? { ...b, id: String(res.id) } : b))
          );
        }
      })
      .catch((err) => console.warn('Master calendar API create error:', err));

    setIsBookingModalOpen(false);
  };

  // Build Mon–Sun calendar grid cells
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
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

  const getSlotBadgeStyle = (state: SlotAvailabilityState): string => {
    switch (state) {
      case 'Fully Booked':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Half Booked (A)':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Half Booked (B)':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const activeSlotStateInModal = useMemo(() => {
    if (!bookingDate) return 'Open' as SlotAvailabilityState;
    return getSlotState(bookings, bookingDate, bookingHall, bookingSlot);
  }, [bookings, bookingDate, bookingHall, bookingSlot]);

  return (
    <div className="space-y-6">
      {/* Toast / Alert Banner */}
      {toastMessage && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss alert"
            className="p-1 rounded-md text-rose-500 hover:bg-rose-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Section: Header */}
      <div>
        <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
          Calendar &amp; Availability
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Click any open date to schedule a booking. Maximum 2 slots per day per hall (Lunch &amp; Dinner) with Half-Hall support.
        </p>
      </div>

      {/* Controls Bar (Block Date removed) */}
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

        {/* Right Side: Legend + Hall Selector */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="hidden xl:flex items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Open
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Half (A)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Half (B)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Fully Booked
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              aria-label="Select Hall"
              value={selectedHall}
              onChange={(e) => setSelectedHall(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            >
              {hallOptions.map((hall) => (
                <option key={hall} value={hall}>
                  {hall}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Section: Custom Month View Calendar Grid */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
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

                if (!cell.day || !cell.dateKey) {
                  return (
                    <div
                      key={cell.key}
                      className={`min-h-[118px] sm:min-h-[132px] bg-slate-50/40 border-b border-slate-200 ${
                        isLastCol ? '' : 'border-r'
                      }`}
                    />
                  );
                }

                const dateKey = cell.dateKey;
                const activeHallForDisplay =
                  selectedHall === 'All Halls' ? (bookableHalls[0] || 'Royal Grand Hall') : selectedHall;
                const dayBookings = bookings.filter(
                  (b) =>
                    b.date === dateKey &&
                    (selectedHall === 'All Halls' || b.hall === selectedHall)
                );

                const slot1State = getSlotState(
                  bookings,
                  dateKey,
                  activeHallForDisplay,
                  'Lunch/Afternoon'
                );
                const slot2State = getSlotState(
                  bookings,
                  dateKey,
                  activeHallForDisplay,
                  'Dinner/Evening'
                );
                const isFullyBooked =
                  selectedHall !== 'All Halls' &&
                  slot1State === 'Fully Booked' &&
                  slot2State === 'Fully Booked';

                return (
                  <div
                    key={cell.key}
                    onClick={() => handleDateCellClick(dateKey)}
                    className={`min-h-[118px] sm:min-h-[132px] p-2.5 transition-colors cursor-pointer flex flex-col justify-between border-b border-slate-200 ${
                      isLastCol ? '' : 'border-r'
                    } ${
                      isFullyBooked
                        ? 'bg-rose-50/35 hover:bg-rose-50/60'
                        : 'bg-white hover:bg-teal-50/35'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-mono font-semibold tabular-nums ${
                          isToday ? 'bg-teal-700 text-white' : 'text-slate-700'
                        }`}
                      >
                        {cell.day}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1">
                      {dayBookings.length === 0 ? (
                        <p className="text-[11px] font-medium text-slate-400">
                          Open
                        </p>
                      ) : selectedHall !== 'All Halls' ? (
                        <>
                          <div
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold truncate ${getSlotBadgeStyle(
                              slot1State
                            )}`}
                          >
                            S1: {slot1State}
                          </div>
                          <div
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold truncate ${getSlotBadgeStyle(
                              slot2State
                            )}`}
                          >
                            S2: {slot2State}
                          </div>
                        </>
                      ) : (
                        dayBookings.slice(0, 2).map((b) => {
                          const badgeState: SlotAvailabilityState =
                            b.bookingType === 'Full Hall'
                              ? 'Fully Booked'
                              : b.bookingType === 'Half Hall (Section A)'
                                ? 'Half Booked (A)'
                                : 'Half Booked (B)';
                          return (
                            <div
                              key={b.id}
                              className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold truncate ${getSlotBadgeStyle(
                                badgeState
                              )}`}
                              title={`${b.hall} (${b.slot}) — ${b.bookingType}`}
                            >
                              {b.hall}: {badgeState}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Create New Booking Modal */}
      {isBookingModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-booking-modal-title"
        >
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h3
                  id="calendar-booking-modal-title"
                  className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900"
                >
                  Create New Booking
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  Selected Date: {bookingDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Venue Details Section */}
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Venue Details
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="bk-hall"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Hall / Venue
                    </label>
                    <select
                      id="bk-hall"
                      value={bookingHall}
                      onChange={(e) => {
                        setBookingHall(e.target.value);
                        setFormError(null);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                    >
                      {bookableHalls.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="bk-slot"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Event Slot (Max 2/day)
                    </label>
                    <select
                      id="bk-slot"
                      value={bookingSlot}
                      onChange={(e) => {
                        setBookingSlot(e.target.value as EventSlot);
                        setFormError(null);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                    >
                      {EVENT_SLOTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="bk-type"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Booking Type
                  </label>
                  <select
                    id="bk-type"
                    value={bookingType}
                    onChange={(e) => {
                      setBookingType(e.target.value as BookingType);
                      setFormError(null);
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  >
                    {BOOKING_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {activeSlotStateInModal === 'Half Booked (A)' && (
                    <p className="mt-1.5 text-xs font-medium text-amber-700">
                      Section A is booked for this slot &mdash; Half Hall (Section B) is available.
                    </p>
                  )}
                  {activeSlotStateInModal === 'Half Booked (B)' && (
                    <p className="mt-1.5 text-xs font-medium text-blue-700">
                      Section B is booked for this slot &mdash; Half Hall (Section A) is available.
                    </p>
                  )}
                </div>
              </div>

              {/* Customer & Event Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="bk-customer"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Customer Name
                  </label>
                  <input
                    id="bk-customer"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Usman Tariq"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="bk-guests"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Expected Guests
                  </label>
                  <input
                    id="bk-guests"
                    type="number"
                    min="1"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    placeholder="e.g. 450"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="bk-event-type"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Event Type
                </label>
                <select
                  id="bk-event-type"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                >
                  <option value="Mehndi">Mehndi</option>
                  <option value="Barat">Barat</option>
                  <option value="Walima">Walima</option>
                  <option value="Corporate / Other">Corporate / Other</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
