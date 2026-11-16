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
  Trash2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Booking, MenuPackage } from '../../types';
import { formatTo12Hour } from '../../utils/timeFormat';
import { hallsApi, bookingsApi, menuPackagesApi } from '../../api/client';
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
  const [cnic, setCnic] = useState(initialBooking?.cnic || '');
  const [address, setAddress] = useState(initialBooking?.address || '');

  const [eventType, setEventType] = useState(initialBooking?.eventType || '');
  const [hallVenue, setHallVenue] = useState(initialBooking?.hallName || initialHall || '');
  const [eventDate, setEventDate] = useState(initialBooking?.date || initialDate || '');
  const [expectedGuests, setExpectedGuests] = useState(
    initialBooking?.guestCount ? String(initialBooking.guestCount) : ''
  );
  const [seatingArrangement, setSeatingArrangement] = useState(initialBooking?.seatingArrangement || '');

  // Menu Packages & Customization State
  const [menuPackage, setMenuPackage] = useState(initialBooking?.menuPackage || '');
  const [availablePackages, setAvailablePackages] = useState<MenuPackage[]>([]);
  const [selectedDishes, setSelectedDishes] = useState<string[]>(initialBooking?.customMenuItems || []);
  const [newDishInput, setNewDishInput] = useState('');
  const [customMenuNotes, setCustomMenuNotes] = useState('');

  // Live Extra Services / Add-ons State
  const [extraServicesList, setExtraServicesList] = useState<Array<{ title: string; price: number; category?: string; notes?: string }>>(
    (initialBooking?.extraServices as any[]) || []
  );
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('Entrance Pyro / Effects');

  const [specialInstructions, setSpecialInstructions] = useState(initialBooking?.specialInstructions || '');

  const [startTime, setStartTime] = useState(initialStartTime || '');
  const [endTime, setEndTime] = useState(initialEndTime || '');
  const [extraHours, setExtraHours] = useState(initialBooking?.extraHours ? String(initialBooking.extraHours) : '');
  const [ratePerHour, setRatePerHour] = useState(initialBooking?.ratePerHour ? String(initialBooking.ratePerHour) : '');

  const [totalBookingAmount, setTotalBookingAmount] = useState(
    initialBooking?.amount ? String(initialBooking.amount) : ''
  );
  const [advancePayment, setAdvancePayment] = useState(
    initialBooking?.advancePayment ? String(initialBooking.advancePayment) : ''
  );

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

    menuPackagesApi.list().then((data) => {
      if (!isMounted) return;
      if (Array.isArray(data)) {
        setAvailablePackages(data);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectPackage = (pkgName: string) => {
    setMenuPackage(pkgName);
    const found = availablePackages.find((p) => p.name === pkgName);
    if (found && Array.isArray(found.includedItems) && found.includedItems.length > 0) {
      setSelectedDishes([...found.includedItems]);
    }
  };

  const handleAddDish = () => {
    const trimmed = newDishInput.trim();
    if (!trimmed) return;
    if (!selectedDishes.includes(trimmed)) {
      setSelectedDishes((prev) => [...prev, trimmed]);
    }
    setNewDishInput('');
  };

  const handleRemoveDish = (index: number) => {
    setSelectedDishes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddService = () => {
    const title = newServiceTitle.trim();
    const priceNum = parseFloat(newServicePrice);
    if (!title || isNaN(priceNum) || priceNum <= 0) {
      showToast('Please enter a valid extra service title and price.', 'error');
      return;
    }
    setExtraServicesList((prev) => [
      ...prev,
      {
        title,
        price: priceNum,
        category: newServiceCategory,
      },
    ]);
    // Also automatically add to total booking amount
    setTotalBookingAmount((prev) => {
      const cur = parseFloat(prev) || 0;
      return String(cur + priceNum);
    });
    setNewServiceTitle('');
    setNewServicePrice('');
    showToast(`Extra Service "${title}" added (+Rs. ${priceNum.toLocaleString('en-PK')}).`, 'success');
  };

  const handleRemoveService = (index: number) => {
    const s = extraServicesList[index];
    if (s) {
      setTotalBookingAmount((prev) => {
        const cur = parseFloat(prev) || 0;
        return String(Math.max(0, cur - (s.price || 0)));
      });
    }
    setExtraServicesList((prev) => prev.filter((_, idx) => idx !== index));
  };

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

    const combinedNotes = customMenuNotes
      ? `${specialInstructions}${specialInstructions ? '\n' : ''}[Custom Menu / Dietary Notes]: ${customMenuNotes}`.trim()
      : specialInstructions;

    const newBooking: Booking = {
      id: initialBooking?.id || `bk-${Date.now()}`,
      bookingRef: initialBooking?.bookingRef || `BK-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: fullName.trim(),
      contactRef: phone ? phone.trim() : (initialBooking?.contactRef || ''),
      cnic: cnic.trim(),
      address: address.trim(),
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
      amount: totalBookingAmount ? parseFloat(totalBookingAmount) : 0,
      advancePayment: advancePayment ? parseFloat(advancePayment) : 0,
      guestCount: expectedGuests ? parseInt(expectedGuests, 10) : undefined,
      seatingArrangement: seatingArrangement,
      menuPackage: menuPackage,
      customMenuItems: selectedDishes,
      extraServices: extraServicesList,
      damagesRecord: initialBooking?.damagesRecord || [],
      specialInstructions: combinedNotes,
      extraHours: extraHours ? parseFloat(extraHours) : 0,
      ratePerHour: ratePerHour ? parseFloat(ratePerHour) : 0,
      securityDeposit: initialBooking?.securityDeposit || 50000,
      operationalStatus: initialBooking?.operationalStatus || 'Setup in Progress',
      assignedManager: initialBooking?.assignedManager || 'Manager',
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
                    <AlertTriangle className="w-4 h-4" />
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Menu Package Tier
                </label>
                {menuPackage && (
                  <span className="text-[10px] font-mono text-teal-400 font-semibold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                    Live Menu Connected
                  </span>
                )}
              </div>
              <select
                value={menuPackage}
                onChange={(e) => handleSelectPackage(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500 transition-all cursor-pointer font-semibold"
              >
                <option value="">[Select Menu Package from Culinary Registry]</option>
                {availablePackages.map((pkg) => (
                  <option key={pkg.id || pkg.name} value={pkg.name}>
                    {pkg.name} — Rs. {Number(pkg.pricePerHead || 0).toLocaleString('en-PK')}/head ({pkg.tier || 'Standard'})
                  </option>
                ))}
                {availablePackages.length === 0 && (
                  <>
                    <option value="Royal Shadi Buffet (Beef & Chicken)">
                      Royal Shadi Buffet (Beef &amp; Chicken) — Rs. 2,450/head (Royal)
                    </option>
                    <option value="Executive Mutton & Chicken Banquet">
                      Executive Mutton &amp; Chicken Banquet — Rs. 2,850/head (Executive)
                    </option>
                    <option value="Traditional Economy Feast">
                      Traditional Economy Feast — Rs. 1,850/head (Budget)
                    </option>
                  </>
                )}
                <option value="Custom Catering / Hall Only">Custom Catering / Hall Only</option>
              </select>
            </div>

            {/* Included & Substituted Dishes Area */}
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-amber-400" />
                  <span>Menu Dishes &amp; Custom Substitutions (e.g. Swap Chicken for Beef)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedDishes.length} Items Selected
                </span>
              </div>

              {/* Dishes Chips */}
              <div className="flex flex-wrap gap-1.5 mb-3 min-h-[36px] p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                {selectedDishes.length === 0 ? (
                  <span className="text-slate-500 text-xs italic py-1">
                    Select a menu package above or type dishes below (e.g. Beef Biryani, Mutton Karahi, Roghnai Naan)...
                  </span>
                ) : (
                  selectedDishes.map((dish, idx) => (
                    <span
                      key={`${dish}-${idx}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-500/15 border border-teal-500/30 text-teal-200 text-xs font-medium"
                    >
                      <span>{dish}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDish(idx)}
                        className="p-0.5 rounded hover:bg-rose-500/20 hover:text-rose-300 text-teal-400 cursor-pointer"
                        title="Remove or swap this dish"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add / Substitute Dish Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newDishInput}
                  onChange={(e) => setNewDishInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDish();
                    }
                  }}
                  placeholder="Type dish to add/substitute (e.g. Special Beef Biryani, Dumba Karahi) and click Add..."
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={handleAddDish}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Add Dish
                </button>
              </div>

              {/* Quick Suggestions for fast substitution */}
              <div className="flex items-center gap-1.5 flex-wrap mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-400">Quick Swap:</span>
                {['Special Beef Biryani', 'Mutton Karahi', 'Beef Seekh Kabab', 'Chicken Tikka', 'Roghnai Naan', 'Shahi Kheer'].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => {
                      if (!selectedDishes.includes(quick)) {
                        setSelectedDishes((prev) => [...prev, quick]);
                      }
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer text-[10px]"
                  >
                    + {quick}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Menu & Dietary Accommodation Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Custom Menu &amp; Chef Accommodations Area
              </label>
              <textarea
                rows={2}
                value={customMenuNotes}
                onChange={(e) => setCustomMenuNotes(e.target.value)}
                placeholder="Enter client's custom menu requests (e.g. 50 plates beef biryani for VIP table, low spice mutton karahi, sugar-free firni)..."
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-all resize-none"
              />
            </div>

            {/* General Special Instructions */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                General Special Instructions &amp; Hall Setup Notes
              </label>
              <textarea
                rows={2}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Enter hall setup requests, stage backdrop preferences, or special arrangements..."
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section: Live Extra Services & Entrance Effects (Bill Additions) */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-5 sm:p-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-700/60 mb-4">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                Live Extra Services &amp; Special Effects
              </h2>
              <p className="text-[11px] text-slate-400">
                Entrance pyrotechnics, cold fire, heavy smoke, extra lighting, and add-on services billed to client.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Added Services List */}
            {extraServicesList.length > 0 && (
              <div className="space-y-2 mb-3">
                {extraServicesList.map((srv, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-bold">
                        {srv.category || 'Service'}
                      </span>
                      <span className="font-semibold text-white">{srv.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-teal-300">
                        + PKR {Number(srv.price || 0).toLocaleString('en-PK')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(idx)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Service Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={newServiceTitle}
                  onChange={(e) => setNewServiceTitle(e.target.value)}
                  placeholder="e.g. Grand Cold Fire Entrance Effect"
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <input
                  type="number"
                  min="0"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  placeholder="Price (PKR)"
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleAddService}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Bill</span>
              </button>
            </div>

            {/* Quick Service Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px] text-slate-400">
              <span className="font-semibold text-slate-400">Quick Add:</span>
              {[
                { title: 'Cold Fire Entrance Pyro (4 Fountains)', price: 25000, cat: 'Entrance Pyro' },
                { title: 'Heavy Fog Stage Cloud Machine', price: 15000, cat: 'Stage Effects' },
                { title: 'Rose Petal Air Cannon Shot', price: 10000, cat: 'Entrance Effects' },
                { title: 'Extra AC Chiller Duct Units', price: 30000, cat: 'Climate' },
              ].map((q) => (
                <button
                  key={q.title}
                  type="button"
                  onClick={() => {
                    setNewServiceTitle(q.title);
                    setNewServicePrice(String(q.price));
                    setNewServiceCategory(q.cat);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  + {q.title} (Rs. {q.price.toLocaleString('en-PK')})
                </button>
              ))}
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
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
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
