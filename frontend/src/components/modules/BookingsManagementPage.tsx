import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ArrowLeft,
  X,
} from 'lucide-react';

interface BookingItem {
  id: string;
  bookingId: string;
  customerName: string;
  phone: string;
  cnic: string;
  eventType: string;
  hallName: string;
  eventDate: string;
  guestCount: string;
  seatingArrangement: string;
  menuPackage: string;
  dietaryInstructions: string;
  startTime: string;
  endTime: string;
  extraHours: number;
  ratePerHour: number;
  totalAmount: number;
  advancePayment: number;
  remainingBalance: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
}

export const BookingsManagementPage: React.FC = () => {
  // Strictly empty initial state — no hardcoded dummy data
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingBooking, setViewingBooking] = useState<BookingItem | null>(null);

  // Filter bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHall, setSelectedHall] = useState('All Halls');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [eventType, setEventType] = useState('');
  const [hallName, setHallName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [seatingArrangement, setSeatingArrangement] = useState('');
  const [menuPackage, setMenuPackage] = useState('');
  const [dietaryInstructions, setDietaryInstructions] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [extraHours, setExtraHours] = useState('');
  const [ratePerHour, setRatePerHour] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [advancePayment, setAdvancePayment] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setFullName('');
    setPhone('');
    setCnic('');
    setEventType('');
    setHallName('');
    setEventDate('');
    setGuestCount('');
    setSeatingArrangement('');
    setMenuPackage('');
    setDietaryInstructions('');
    setStartTime('');
    setEndTime('');
    setExtraHours('');
    setRatePerHour('');
    setTotalAmount('');
    setAdvancePayment('');
    setFormError(null);
  };

  const openCreateForm = () => {
    resetForm();
    setViewMode('form');
  };

  const openEditForm = (item: BookingItem) => {
    setEditingId(item.id);
    setFullName(item.customerName);
    setPhone(item.phone);
    setCnic(item.cnic);
    setEventType(item.eventType);
    setHallName(item.hallName);
    setEventDate(item.eventDate);
    setGuestCount(item.guestCount);
    setSeatingArrangement(item.seatingArrangement);
    setMenuPackage(item.menuPackage);
    setDietaryInstructions(item.dietaryInstructions);
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setExtraHours(item.extraHours ? String(item.extraHours) : '');
    setRatePerHour(item.ratePerHour ? String(item.ratePerHour) : '');
    setTotalAmount(item.totalAmount ? String(item.totalAmount) : '');
    setAdvancePayment(item.advancePayment ? String(item.advancePayment) : '');
    setFormError(null);
    setViewMode('form');
  };

  const parsedTotal = Number(totalAmount) || 0;
  const parsedAdvance = Number(advancePayment) || 0;
  const parsedExtraHours = Number(extraHours) || 0;
  const parsedRatePerHour = Number(ratePerHour) || 0;
  const extraCharges = parsedExtraHours * parsedRatePerHour;
  const grandTotal = parsedTotal + extraCharges;
  const remainingBalance = Math.max(0, grandTotal - parsedAdvance);

  const hasAmountInput =
    totalAmount.trim() !== '' ||
    advancePayment.trim() !== '' ||
    (extraHours.trim() !== '' && ratePerHour.trim() !== '');

  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Customer Full Name is required.');
      return;
    }

    const derivedPaymentStatus: BookingItem['paymentStatus'] =
      grandTotal > 0 && remainingBalance === 0
        ? 'Paid'
        : parsedAdvance > 0
        ? 'Partial'
        : 'Unpaid';

    if (editingId) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === editingId
            ? {
                ...b,
                customerName: fullName.trim(),
                phone: phone.trim() || '[--]',
                cnic: cnic.trim() || '[--]',
                eventType: eventType || '[--]',
                hallName: hallName || '[--]',
                eventDate: eventDate || '[--]',
                guestCount: guestCount || '[--]',
                seatingArrangement: seatingArrangement.trim() || '[--]',
                menuPackage: menuPackage || '[--]',
                dietaryInstructions: dietaryInstructions.trim(),
                startTime: startTime || '[--]',
                endTime: endTime || '[--]',
                extraHours: parsedExtraHours,
                ratePerHour: parsedRatePerHour,
                totalAmount: grandTotal,
                advancePayment: parsedAdvance,
                remainingBalance,
                paymentStatus: derivedPaymentStatus,
              }
            : b
        )
      );
    } else {
      const nextIndex = bookings.length + 1;
      const newBooking: BookingItem = {
        id: `bk-${Date.now()}`,
        bookingId: `BK-${String(nextIndex).padStart(4, '0')}`,
        customerName: fullName.trim(),
        phone: phone.trim() || '[--]',
        cnic: cnic.trim() || '[--]',
        eventType: eventType || '[--]',
        hallName: hallName || '[--]',
        eventDate: eventDate || '[--]',
        guestCount: guestCount || '[--]',
        seatingArrangement: seatingArrangement.trim() || '[--]',
        menuPackage: menuPackage || '[--]',
        dietaryInstructions: dietaryInstructions.trim(),
        startTime: startTime || '[--]',
        endTime: endTime || '[--]',
        extraHours: parsedExtraHours,
        ratePerHour: parsedRatePerHour,
        totalAmount: grandTotal,
        advancePayment: parsedAdvance,
        remainingBalance,
        status: 'Pending',
        paymentStatus: derivedPaymentStatus,
      };
      setBookings((prev) => [newBooking, ...prev]);
    }

    resetForm();
    setViewMode('list');
  };

  const handleDeleteBooking = (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    if (viewingBooking?.id === id) setViewingBooking(null);
  };

  const filteredBookings = bookings.filter((b) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        b.customerName.toLowerCase().includes(q) ||
        b.bookingId.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedHall !== 'All Halls' && b.hallName !== selectedHall) {
      return false;
    }
    if (selectedStatus !== 'All' && b.status !== selectedStatus) {
      return false;
    }
    if (startDate && b.eventDate !== '[--]' && b.eventDate < startDate) {
      return false;
    }
    if (endDate && b.eventDate !== '[--]' && b.eventDate > endDate) {
      return false;
    }
    return true;
  });

  const getStatusClass = (status: BookingItem['status']) => {
    if (status === 'Confirmed') return 'bg-teal-50 text-teal-800 border-teal-200';
    if (status === 'Cancelled') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  const getPaymentClass = (status: BookingItem['paymentStatus']) => {
    if (status === 'Paid') return 'bg-teal-50 text-teal-800 border-teal-200';
    if (status === 'Partial') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (viewMode === 'form') {
    return (
      <div className="space-y-6">
        {/* Form Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setViewMode('list');
              }}
              aria-label="Back to bookings list"
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-['Plus_Jakarta_Sans']">
                {editingId ? 'Edit Booking' : 'Create New Booking'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Complete the sections below to record a hall reservation.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveBooking} className="space-y-6">
          {formError && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {formError}
            </div>
          )}

          {/* Section 1: Customer Information */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 pb-4 border-b border-gray-100">
              1. Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div>
                <label
                  htmlFor="booking-fullname"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="booking-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="[--]"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-phone"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Phone
                </label>
                <input
                  id="booking-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="[--]"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-cnic"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  CNIC
                </label>
                <input
                  id="booking-cnic"
                  type="text"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  placeholder="[--]"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Event & Venue Details */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 pb-4 border-b border-gray-100">
              2. Event &amp; Venue Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div>
                <label
                  htmlFor="booking-event-type"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Event Type
                </label>
                <select
                  id="booking-event-type"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer"
                >
                  <option value="">[--]</option>
                  <option value="Mehndi">Mehndi</option>
                  <option value="Barat">Barat</option>
                  <option value="Walima">Walima</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="booking-hall"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Hall Selection
                </label>
                <select
                  id="booking-hall"
                  value={hallName}
                  onChange={(e) => setHallName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer"
                >
                  <option value="">[--]</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="booking-date"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Event Date
                </label>
                <input
                  id="booking-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-guests"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Guest Count
                </label>
                <input
                  id="booking-guests"
                  type="number"
                  min="1"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  placeholder="[--]"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="booking-seating"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Seating Arrangement
                </label>
                <input
                  id="booking-seating"
                  type="text"
                  value={seatingArrangement}
                  onChange={(e) => setSeatingArrangement(e.target.value)}
                  placeholder="[--]"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Menu & Catering */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 pb-4 border-b border-gray-100">
              3. Menu &amp; Catering
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div>
                <label
                  htmlFor="booking-menu"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Menu Package
                </label>
                <select
                  id="booking-menu"
                  value={menuPackage}
                  onChange={(e) => setMenuPackage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer"
                >
                  <option value="">[--]</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="booking-dietary"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Special Dietary Instructions
                </label>
                <textarea
                  id="booking-dietary"
                  rows={3}
                  value={dietaryInstructions}
                  onChange={(e) => setDietaryInstructions(e.target.value)}
                  placeholder="[--]"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 resize-none"
                />
              </div>
            </div>
          </section>

          {/* Section 4: Timing & Extra Time */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 pb-4 border-b border-gray-100">
              4. Timing &amp; Extra Time
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div>
                <label
                  htmlFor="booking-start-time"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Start Time
                </label>
                <input
                  id="booking-start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-end-time"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  End Time
                </label>
                <input
                  id="booking-end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-extra-hours"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Extra Hours
                </label>
                <input
                  id="booking-extra-hours"
                  type="number"
                  min="0"
                  value={extraHours}
                  onChange={(e) => setExtraHours(e.target.value)}
                  placeholder="[--]"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-rate-hour"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Rate per Hour
                </label>
                <input
                  id="booking-rate-hour"
                  type="number"
                  min="0"
                  value={ratePerHour}
                  onChange={(e) => setRatePerHour(e.target.value)}
                  placeholder="[--]"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>
            </div>
          </section>

          {/* Section 5: Payment Summary */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 pb-4 border-b border-gray-100">
              5. Payment Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div>
                <label
                  htmlFor="booking-total-amount"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Total Booking Amount
                </label>
                <input
                  id="booking-total-amount"
                  type="number"
                  min="0"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="[--]"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-mono tabular-nums"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-advance"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Advance Payment
                </label>
                <input
                  id="booking-advance"
                  type="number"
                  min="0"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(e.target.value)}
                  placeholder="[--]"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-mono tabular-nums"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="booking-remaining"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Remaining Balance (Read-only)
                </label>
                <input
                  id="booking-remaining"
                  type="text"
                  readOnly
                  value={
                    hasAmountInput
                      ? `Rs. ${remainingBalance.toLocaleString('en-PK')}`
                      : '[--]'
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900 font-mono tabular-nums cursor-default focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setViewMode('list');
              }}
              className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Save Booking
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Section: Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-['Plus_Jakarta_Sans']">
            Bookings &amp; Reservations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage hall availability, customer contracts, and event schedules.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Booking</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="relative lg:col-span-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer or booking ID..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
          />
        </div>

        {/* Select Hall Dropdown */}
        <div className="lg:col-span-2">
          <select
            aria-label="Select Hall"
            value={selectedHall}
            onChange={(e) => setSelectedHall(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer"
          >
            <option value="All Halls">All Halls</option>
          </select>
        </div>

        {/* Select Status Dropdown */}
        <div className="lg:col-span-2">
          <select
            aria-label="Select Status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Date Range Picker */}
        <div className="lg:col-span-4 flex items-center gap-2">
          <input
            type="date"
            aria-label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-1/2 px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
          />
          <span className="text-gray-400 text-xs shrink-0">to</span>
          <input
            type="date"
            aria-label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-1/2 px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
          />
        </div>
      </div>

      {/* Main Section: Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/90 border-b border-gray-200 text-gray-500 font-medium">
                <th className="py-3.5 px-4">Booking ID</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">Hall / Venue</th>
                <th className="py-3.5 px-4">Event Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 px-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center mb-4">
                        <Calendar className="w-7 h-7 stroke-[1.5]" />
                      </div>
                      <p className="text-base font-semibold text-gray-900">
                        No bookings found. Create your first booking to get started.
                      </p>
                      <button
                        type="button"
                        onClick={openCreateForm}
                        className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create New Booking</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-gray-900 whitespace-nowrap">
                      {booking.bookingId || '[--]'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                      {booking.customerName || '[--]'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                      {booking.eventType || '[--]'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                      {booking.hallName || '[--]'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-600 whitespace-nowrap">
                      {booking.eventDate || '[--]'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border ${getStatusClass(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border ${getPaymentClass(
                          booking.paymentStatus
                        )}`}
                      >
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingBooking(booking)}
                          aria-label="View booking"
                          className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-teal-700 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditForm(booking)}
                          aria-label="Edit booking"
                          className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-teal-700 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBooking(booking.id)}
                          aria-label="Delete booking"
                          className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 text-gray-600 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Booking Modal */}
      {viewingBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                Booking Details · {viewingBooking.bookingId}
              </h2>
              <button
                type="button"
                onClick={() => setViewingBooking(null)}
                aria-label="Close details"
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-400">Customer Name</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {viewingBooking.customerName}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Phone</p>
                <p className="font-mono text-gray-900 mt-0.5">{viewingBooking.phone}</p>
              </div>
              <div>
                <p className="text-gray-400">Event Type</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {viewingBooking.eventType}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Event Date</p>
                <p className="font-mono text-gray-900 mt-0.5">
                  {viewingBooking.eventDate}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Total Amount</p>
                <p className="font-mono font-semibold text-gray-900 mt-0.5">
                  Rs. {viewingBooking.totalAmount.toLocaleString('en-PK')}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Remaining Balance</p>
                <p className="font-mono font-semibold text-gray-900 mt-0.5">
                  Rs. {viewingBooking.remainingBalance.toLocaleString('en-PK')}
                </p>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingBooking(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
