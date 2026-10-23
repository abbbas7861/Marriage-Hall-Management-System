import React, { useState } from 'react';
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
  Calculator,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Booking } from '../../types';

interface CreateBookingFormProps {
  onCancel: () => void;
  onSave: (booking: Booking) => void;
  initialBooking?: Booking | null;
}

export const CreateBookingForm: React.FC<CreateBookingFormProps> = ({
  onCancel,
  onSave,
  initialBooking,
}) => {
  // STRICT DATA RULE: ALL inputs must be completely empty by default.
  // No prefilled dummy numbers, names, or dates.
  const [fullName, setFullName] = useState(initialBooking?.customerName || '');
  const [phone, setPhone] = useState(initialBooking?.contactRef || '');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');

  const [eventType, setEventType] = useState(initialBooking?.eventType || '');
  const [hallVenue, setHallVenue] = useState(initialBooking?.hallName || '');
  const [eventDate, setEventDate] = useState(initialBooking?.date || '');
  const [expectedGuests, setExpectedGuests] = useState(
    initialBooking?.guestCount ? String(initialBooking.guestCount) : ''
  );
  const [seatingArrangement, setSeatingArrangement] = useState('');

  const [menuPackage, setMenuPackage] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [extraHours, setExtraHours] = useState('');
  const [ratePerHour, setRatePerHour] = useState('');

  const [totalBookingAmount, setTotalBookingAmount] = useState(
    initialBooking?.amount ? String(initialBooking.amount) : ''
  );
  const [advancePayment, setAdvancePayment] = useState('');

  const [validationError, setValidationError] = useState('');

  // Calculations
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Required field validation visual cues
    if (!fullName.trim()) {
      setValidationError('Please enter Customer Full Name.');
      return;
    }
    if (!eventDate) {
      setValidationError('Please select an Event Date.');
      return;
    }
    if (!hallVenue) {
      setValidationError('Please select a Venue Hall.');
      return;
    }

    setValidationError('');

    const newBooking: Booking = {
      id: initialBooking?.id || `bk-${Date.now()}`,
      bookingRef: initialBooking?.bookingRef || `BK-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: fullName.trim(),
      contactRef: phone ? phone.trim() : (initialBooking?.contactRef || `CNIC-${cnic ? cnic.slice(-4) : '0000'}`),
      eventType: eventType || 'Other Event',
      hallName: hallVenue,
      date: eventDate,
      time: startTime && endTime ? `${startTime} - ${endTime}` : initialBooking?.time,
      slot: startTime && endTime ? `${startTime} - ${endTime}` : (initialBooking?.slot || 'Scheduled Time'),
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
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Layout & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6 bg-white p-4 sm:p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            title="Go Back"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
              Create New Booking
            </h1>
            <p className="text-xs text-slate-500">
              Enter customer details, event specifications, and payment information.
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00685f] hover:bg-[#005049] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Booking</span>
          </button>
        </div>
      </div>

      {validationError && (
        <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Section 1: Customer Information */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-[#00685f]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="[Enter Full Name]"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="[Enter Phone Number]"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all"
              />
            </div>

            {/* CNIC / ID Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CNIC / ID Number
              </label>
              <input
                type="text"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                placeholder="[Enter CNIC / ID Number]"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="[Enter Complete Address]"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Event & Venue Details */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-[#00685f]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Event Type <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                required
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all cursor-pointer"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hall / Venue <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                required
                value={hallVenue}
                onChange={(e) => setHallVenue(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all cursor-pointer"
              >
                <option value="">[Select Venue Hall]</option>
                <option value="Hall 1">Hall 1 (Executive Ballroom)</option>
                <option value="Hall 2">Hall 2 (Crystal Pavilion)</option>
                <option value="Hall 3">Hall 3 (Royal Banquet Hall)</option>
                <option value="Garden Lawn">Garden Lawn Complex</option>
              </select>
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Event Date <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all cursor-pointer"
              />
            </div>

            {/* Expected Guests */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected Guests
              </label>
              <input
                type="number"
                min="1"
                value={expectedGuests}
                onChange={(e) => setExpectedGuests(e.target.value)}
                placeholder="[Enter Expected Headcount]"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all"
              />
            </div>

            {/* Seating Arrangement */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seating Arrangement
              </label>
              <select
                value={seatingArrangement}
                onChange={(e) => setSeatingArrangement(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all cursor-pointer"
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
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-[#00685f]">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Menu Package Selection
              </label>
              <select
                value={menuPackage}
                onChange={(e) => setMenuPackage(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all cursor-pointer"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Special Instructions
              </label>
              <textarea
                rows={2}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="[Enter Special Instructions (e.g. food allergies, spice levels, sugar-free desserts)]"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Timing & Extra Time (Crucial Section) */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-[#00685f]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                4. Timing &amp; Extra Time (Crucial Section)
              </h2>
              <p className="text-[11px] text-slate-400">
                Slot duration limits, hall handover time, and overtime surcharges.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all"
              />
            </div>

            {/* Extra Time Add-on Box */}
            <div className="md:col-span-2 p-4 rounded-xl bg-slate-50/80 border border-slate-200 mt-1">
              <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Extra Time Add-on
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Extra Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={extraHours}
                    onChange={(e) => setExtraHours(e.target.value)}
                    placeholder="[Enter Extra Hours]"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00685f]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Rate Per Hour
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={ratePerHour}
                    onChange={(e) => setRatePerHour(e.target.value)}
                    placeholder="[Enter Rate Per Hour]"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00685f]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Total Extra Charges
                  </label>
                  <div className="w-full px-3 py-1.5 bg-slate-100/90 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 flex items-center justify-between">
                    <span>
                      {calculatedExtraCharges !== null
                        ? `Rs. ${calculatedExtraCharges.toLocaleString('en-PK', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : '--'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans font-normal">
                      [Read-only]
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Payment Summary (Admin Only) */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-[#00685f]">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                  5. Payment Summary
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all font-mono"
                />
              </div>
            </div>

            {/* Advance Payment Received */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all font-mono"
                />
              </div>
            </div>

            {/* Remaining Balance (Read-only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Remaining Balance
              </label>
              <div className="w-full px-3.5 py-2 bg-slate-100/90 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 flex items-center justify-between">
                <span
                  className={
                    calculatedRemainingBalance !== null && calculatedRemainingBalance > 0
                      ? 'text-amber-700 font-bold'
                      : 'text-slate-800'
                  }
                >
                  {calculatedRemainingBalance !== null
                    ? `Rs. ${calculatedRemainingBalance.toLocaleString('en-PK', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : '--'}
                </span>
                <span className="text-[10px] text-slate-400 font-sans font-normal">
                  [Read-only]
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#00685f] hover:bg-[#005049] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Booking</span>
          </button>
        </div>
      </form>
    </div>
  );
};
