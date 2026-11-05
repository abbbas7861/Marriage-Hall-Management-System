import React, { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Building2,
  Utensils,
  Clock,
  CreditCard,
  ArrowLeft,
  Save,
  X,
  Plus,
  AlertCircle,
  AlertTriangle,
  Calculator,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Booking } from '../../types';
import { formatTo12Hour } from '../../utils/timeFormat';
import { hallsApi, bookingsApi } from '../../api/client';
import { CANONICAL_HALLS } from '../../constants/halls';

interface CreateBookingFormProps {
  onCancel: () => void;
  onSave: (booking: Booking) => void;
  initialBooking?: Booking | null;
  initialHall?: string;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
}

export const CreateBookingForm: React.FC<CreateBookingFormProps> = ({
  onCancel,
  onSave,
  initialBooking,
  initialHall,
  initialDate,
  initialStartTime,
  initialEndTime,
}) => {
  const [fullName, setFullName] = useState(initialBooking?.customerName || '');
  const [phone, setPhone] = useState(initialBooking?.contactRef || '');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');

  const [eventType, setEventType] = useState(initialBooking?.eventType || '');
  const [hallVenue, setHallVenue] = useState(initialBooking?.hallName || initialHall || '');
  const [eventDate, setEventDate] = useState(initialBooking?.date || initialDate || '');
  const [expectedGuests, setExpectedGuests] = useState(
    initialBooking?.guestCount ? String(initialBooking.guestCount) : ''
  );
  const [seatingArrangement, setSeatingArrangement] = useState('');

  const [menuPackage, setMenuPackage] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const [startTime, setStartTime] = useState(initialStartTime || '');
  const [endTime, setEndTime] = useState(initialEndTime || '');
  const [extraHours, setExtraHours] = useState('');
  const [ratePerHour, setRatePerHour] = useState('');

  const [totalBookingAmount, setTotalBookingAmount] = useState(
    initialBooking?.amount ? String(initialBooking.amount) : ''
  );
  const [advancePayment, setAdvancePayment] = useState('');

  const [validationError, setValidationError] = useState('');
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [conflictDetails, setConflictDetails] = useState<any | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [toastNotification, setToastNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification(null);
    }, 7000);
  };

  const [hallsList, setHallsList] = useState<Array<{ id?: string; code?: string; name: string; capacity?: number }>>(CANONICAL_HALLS);

  // Load backend halls dynamically with canonical fallback
  useEffect(() => {
    let isMounted = true;
    hallsApi.list().then((data) => {
      if (!isMounted) return;
      if (Array.isArray(data) && data.length > 0) {
        setHallsList(data);
      }
    }).catch(() => {
      // Keep CANONICAL_HALLS fallback
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time conflict validation against backend
  useEffect(() => {
    let isCancelled = false;

    if (!hallVenue || !eventDate) {
      setConflictError(null);
      setConflictDetails(null);
      return;
    }

    const checkCollision = async () => {
      setIsCheckingConflict(true);
      try {
        const result = await bookingsApi.checkAvailability({
          hall: hallVenue,
          date: eventDate,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          excludeId: initialBooking?.id,
        });

        if (isCancelled) return;

        if (!result.available) {
          const conflictMsg = result.conflict || result.details || `Collision Detected: Hall '${hallVenue}' is unavailable on ${eventDate}.`;
          setConflictError(conflictMsg);
          setConflictDetails(result);
        } else {
          setConflictError(null);
          setConflictDetails(null);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Availability check error:', err);
        }
      } finally {
        if (!isCancelled) {
          setIsCheckingConflict(false);
        }
      }
    };

    const timer = setTimeout(() => {
      checkCollision();
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [hallVenue, eventDate, startTime, endTime, initialBooking?.id]);

  const calculatedExtraCharges = React.useMemo(() => {
    const hours = parseFloat(extraHours);
    const rate = parseFloat(ratePerHour);
    if (!isNaN(hours) && !isNaN(rate) && hours > 0 && rate > 0) {
      return hours * rate;
    }
    return null;
  }, [extraHours, ratePerHour]);

  const calculatedRemainingBalance = React.useMemo(() => {
    const total = parseFloat(totalBookingAmount);
    const advance = parseFloat(advancePayment);
    if (!isNaN(total)) {
      const adv = isNaN(advance) ? 0 : advance;
      return total - adv;
    }
    return null;
  }, [totalBookingAmount, advancePayment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setValidationError('Please enter Customer Full Name.');
      showToast('Please enter Customer Full Name.', 'error');
      return;
    }
    if (!eventDate) {
      setValidationError('Please select an Event Date.');
      showToast('Please select an Event Date.', 'error');
      return;
    }
    if (!hallVenue) {
      setValidationError('Please select a Venue Hall.');
      showToast('Please select a Venue Hall.', 'error');
      return;
    }

    if (conflictError) {
      setValidationError(conflictError);
      showToast(`Cannot submit booking: ${conflictError}`, 'error');
      return;
    }

    setIsCheckingConflict(true);
    try {
      const liveCheck = await bookingsApi.checkAvailability({
        hall: hallVenue,
        date: eventDate,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        excludeId: initialBooking?.id,
      });

      if (!liveCheck.available) {
        const conflictMsg = liveCheck.conflict || liveCheck.details || `Collision Detected: Hall '${hallVenue}' is unavailable on ${eventDate}.`;
        setConflictError(conflictMsg);
        setConflictDetails(liveCheck);
        setValidationError(conflictMsg);
        showToast(`Submission Blocked: ${conflictMsg}`, 'error');
        setIsCheckingConflict(false);
        return;
      }
    } catch (err: any) {
      console.error('Pre-submit verification error:', err);
    } finally {
      setIsCheckingConflict(false);
    }

    setValidationError('');
    setConflictError(null);

    const formatted12Slot = startTime && endTime ? `${formatTo12Hour(startTime)} – ${formatTo12Hour(endTime)}` : (initialBooking?.slot || 'Scheduled Time');

    const newBooking: Booking = {
      id: initialBooking?.id || `bk-${Date.now()}`,
      bookingRef: initialBooking?.bookingRef || `BK-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: fullName.trim(),
      contactRef: phone ? phone.trim() : (initialBooking?.contactRef || `CNIC-${cnic ? cnic.slice(-4) : '0000'}`),
      eventType: eventType || 'Other Event',
      hallName: hallVenue,
      date: eventDate,
      time: formatted12Slot,
      slot: formatted12Slot,
      status: initialBooking?.status || 'Confirmed',
      paymentStatus:
        calculatedRemainingBalance !== null && calculatedRemainingBalance <= 0
          ? 'Paid'
          : parseFloat(advancePayment) > 0
          ? 'Partial'
          : (initialBooking?.paymentStatus || 'Unpaid'),
      amount: totalBookingAmount ? parseFloat(totalBookingAmount) : undefined,
      guestCount: expectedGuests ? parseInt(expectedGuests, 10) : undefined,
    };

    onSave(newBooking);
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-12 animate-in fade-in duration-150 text-slate-100">
      {/* Layout & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 bg-slate-800/60 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-700/50 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            title="Go Back"
            className="p-2.5 rounded-xl border border-slate-700 hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans']">
              Create New Booking
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Enter customer details, event specifications, and payment information.
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-700/60 text-slate-300 hover:text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-semibold shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Booking</span>
          </button>
        </div>
      </div>

      {validationError && (
        <div className="mb-5 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center gap-2.5 text-xs text-rose-300 shadow-md">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Section 1: Customer Information */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-5 sm:p-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-700/60 mb-4">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                1. Customer Information
              </h2>
              <p className="text-[11px] text-slate-400">
                Primary client contact details and national identification.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name <span className="text-rose-400 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="[Enter Full Name]"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-all"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phone Number <span className="text-rose-400 font-bold">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="[Enter Phone Number]"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-all"
              />
            </div>

            {/* CNIC / ID Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                CNIC / ID Number
              </label>
              <input
                type="text"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                placeholder="[Enter CNIC / ID Number]"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-all"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Address
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="[Enter Complete Address]"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Event & Venue Details */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-5 sm:p-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-700/60 mb-4">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                2. Event &amp; Venue Details
              </h2>
              <p className="text-[11px] text-slate-400">
                Reservation timing, hall selection, guest capacity, and table layouts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Event Type <span className="text-rose-400 font-bold">*</span>
              </label>
              <select
                required
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500 transition-all cursor-pointer"
              >
                <option value="">[Select Event Type]</option>
                <option value="Mehndi">Mehndi</option>
                <option value="Barat">Barat</option>
                <option value="Walima">Walima</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Hall / Venue */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hall / Venue <span className="text-rose-400 font-bold">*</span>
              </label>
              <select
                required
                value={hallVenue}
                onChange={(e) => setHallVenue(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500 transition-all cursor-pointer font-medium"
              >
                <option value="">[Select Venue Hall]</option>
                {hallVenue && !hallsList.some((h) => h.name.toLowerCase() === hallVenue.toLowerCase()) && (
                  <option value={hallVenue}>{hallVenue}</option>
                )}
                {hallsList.map((h) => (
                  <option key={h.id || h.name} value={h.name}>
                    {h.name} {h.code ? `(${h.code})` : ''} {h.capacity ? `• Cap: ${h.capacity}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Event Date <span className="text-rose-400 font-bold">*</span>
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                  conflictError
                    ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-200 focus:border-rose-400 focus:outline-none ring-2 ring-rose-500/20'
                    : 'bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500'
                }`}
              />
            </div>

            {/* Real-time Conflict Alert */}
            {conflictError && (
              <div className="md:col-span-2 p-4 rounded-xl bg-rose-950/40 border-2 border-rose-500 text-rose-200 shadow-md animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-rose-300 text-xs uppercase tracking-wider">
                        🚨 Scheduling Collision &amp; 1-Hour Turnover Violation
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-900 border border-rose-700 text-rose-200 font-bold text-[10px]">
                        BOOKING BLOCKED
                      </span>
                    </div>
                    <p className="font-semibold text-rose-200 leading-snug">
                      {conflictError}
                    </p>
                    <p className="text-[11px] text-rose-300 mt-1.5 font-medium">
                      ⚠️ <strong>Turnover Protocol:</strong> 1 hour before and 1 hour after each booking is strictly reserved for hall cleaning, sanitation, and staging. No new booking can overlap or fit within this buffer.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Expected Guests */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Expected Guests
              </label>
              <input
                type="number"
                min="1"
                value={expectedGuests}
                onChange={(e) => setExpectedGuests(e.target.value)}
                placeholder="[Enter Expected Headcount]"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-all"
              />
            </div>

            {/* Seating Arrangement */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Seating Arrangement
              </label>
              <select
                value={seatingArrangement}
                onChange={(e) => setSeatingArrangement(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500 transition-all cursor-pointer"
              >
                <option value="">[Select Seating Arrangement]</option>
                <option value="Theater">Theater</option>
                <option value="Round Tables">Round Tables</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Menu & Catering */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-5 sm:p-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-700/60 mb-4">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                3. Menu &amp; Catering
              </h2>
              <p className="text-[11px] text-slate-400">
                Culinary package tier selection and dietary accommodations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Menu Package Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Menu Package Selection
              </label>
              <select
                value={menuPackage}
                onChange={(e) => setMenuPackage(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500 transition-all cursor-pointer"
              >
                <option value="">[Select Menu Package]</option>
                <option value="Package A - Standard Royal Buffet">
                  Package A - Standard Royal Buffet (3 Main, 2 Rice, Desserts)
                </option>
                <option value="Package B - Imperial Banquet Tier">
                  Package B - Imperial Banquet Tier (5 Main, Live BBQ, Kashmiri Chai)
                </option>
                <option value="Package C - Grand Executive Feast">
                  Package C - Grand Executive Feast (Full 7-Course Live Stalls)
                </option>
                <option value="Custom Catering / Hall Only">Custom Catering / Hall Only</option>
              </select>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Special Instructions
              </label>
              <textarea
                rows={2}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="[Enter Special Instructions (e.g. food allergies, spice levels, sugar-free desserts)]"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Timing & Extra Time */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-5 sm:p-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-700/60 mb-4">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                4. Timing &amp; Extra Time
              </h2>
              <p className="text-[11px] text-slate-400">
                Slot duration limits, hall handover time, and overtime surcharges.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Time */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Start Time
                </label>
                {startTime && (
                  <span className="text-[11px] font-mono font-bold text-teal-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {formatTo12Hour(startTime)}
                  </span>
                )}
              </div>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-lg text-xs transition-all ${
                  conflictError
                    ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-200 focus:border-rose-400 focus:outline-none ring-2 ring-rose-500/20'
                    : 'bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500'
                }`}
              />
            </div>

            {/* End Time */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  End Time
                </label>
                {endTime && (
                  <span className="text-[11px] font-mono font-bold text-teal-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {formatTo12Hour(endTime)}
                  </span>
                )}
              </div>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-lg text-xs transition-all ${
                  conflictError
                    ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-200 focus:border-rose-400 focus:outline-none ring-2 ring-rose-500/20'
                    : 'bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500'
                }`}
              />
            </div>

            {/* Cleaning Turnover Notice */}
            {conflictError ? (
              <div className="md:col-span-2 p-3.5 rounded-xl bg-rose-950/40 border-2 border-rose-500 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <strong className="text-rose-200 font-bold block mb-0.5">Time Collision / Turnover Conflict:</strong>
                  {conflictError}
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Turnover Guarantee:</strong> 1 hour before and 1 hour after this event is automatically reserved for sanitation, carpet cleaning, and hall maintenance. Other bookings on this day must respect this buffer.
                </div>
              </div>
            )}

            {/* Extra Time Add-on Box */}
            <div className="md:col-span-2 p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 mt-1">
              <span className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                Extra Time Add-on
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Extra Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={extraHours}
                    onChange={(e) => setExtraHours(e.target.value)}
                    placeholder="[Enter Extra Hours]"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Rate Per Hour
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={ratePerHour}
                    onChange={(e) => setRatePerHour(e.target.value)}
                    placeholder="[Enter Rate Per Hour]"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Total Extra Charges
                  </label>
                  <div className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-teal-300 flex items-center justify-between">
                    <span>
                      {calculatedExtraCharges !== null
                        ? `Rs. ${calculatedExtraCharges.toLocaleString('en-PK', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : '--'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans font-normal">
                      [Read-only]
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Payment Summary (Admin Only) */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-5 sm:p-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-700/60 mb-4">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                  5. Payment Summary
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-teal-400 border border-slate-700">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Financial contract value, advance tranches, and outstanding balance calculation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Booking Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Total Booking Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={totalBookingAmount}
                  onChange={(e) => setTotalBookingAmount(e.target.value)}
                  placeholder="[Enter Total Amount]"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Advance Payment Received */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Advance Payment Received
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(e.target.value)}
                  placeholder="[Enter Advance Received]"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Remaining Balance (Read-only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Remaining Balance
              </label>
              <div className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white flex items-center justify-between">
                <span
                  className={
                    calculatedRemainingBalance !== null && calculatedRemainingBalance > 0
                      ? 'text-amber-400 font-bold'
                      : 'text-slate-300'
                  }
                >
                  {calculatedRemainingBalance !== null
                    ? `Rs. ${calculatedRemainingBalance.toLocaleString('en-PK', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : '--'}
                </span>
                <span className="text-[10px] text-slate-500 font-sans font-normal">
                  [Read-only]
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {toastNotification && (
          <div className="fixed top-5 right-5 z-50 max-w-md p-4 rounded-xl shadow-2xl border-2 border-rose-500 bg-rose-950 text-white animate-in slide-in-from-top-4 duration-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-white text-sm mb-0.5">Booking Alert</p>
                <p className="text-rose-200 leading-relaxed font-medium">{toastNotification.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToastNotification(null)}
                className="text-rose-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={Boolean(conflictError) || isCheckingConflict}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
              conflictError
                ? 'bg-rose-600 text-white cursor-not-allowed opacity-90 shadow-rose-900/20'
                : isCheckingConflict
                ? 'bg-teal-600 text-white cursor-wait opacity-80'
                : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white cursor-pointer active:scale-95'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>
              {conflictError ? 'Save Blocked (Conflict)' : isCheckingConflict ? 'Checking Conflict...' : 'Save Booking'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
