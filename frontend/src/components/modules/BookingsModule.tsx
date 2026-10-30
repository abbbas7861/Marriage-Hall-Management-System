import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  Calendar,
  Building2,
  Tag,
  Filter,
  Eye,
  Pencil,
  Trash2,
  X,
  FileQuestion,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  RotateCcw,
} from 'lucide-react';
import { Booking } from '../../types';
import { CreateBookingForm } from '../bookings/CreateBookingForm';
import { BookingContractModal } from '../bookings/BookingContractModal';
import { bookingsApi, hallsApi } from '../../api/client';
import { CANONICAL_HALLS } from '../../constants/halls';
import { formatTo12Hour } from '../../utils/timeFormat';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

interface BookingsModuleProps {
  initialCreateData?: {
    hallName?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  } | null;
  initialMode?: 'table' | 'create';
}

export const BookingsModule: React.FC<BookingsModuleProps> = ({
  initialCreateData,
  initialMode = 'table',
}) => {
  // STRICT DATA RULE: DO NOT hardcode any dummy data. All data must start as an empty array.
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'create'>(initialMode);
  const [hallsList, setHallsList] = useState<Array<{ id?: string; name: string }>>(CANONICAL_HALLS);

  useEffect(() => {
    setViewMode(initialMode);
  }, [initialMode, initialCreateData]);

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

  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      try {
        setLoading(true);
        const data = await bookingsApi.list();
        if (!isMounted) return;
        setBookings(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!isMounted) return;
        setBookings([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBookings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter Bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHall, setSelectedHall] = useState('All Halls');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Details Modal & Edit State
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [contractBooking, setContractBooking] = useState<Booking | null>(null);

  const handleOpenEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setViewMode('create');
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      await bookingsApi.delete(id);
    } catch (err) {
      console.error('Failed to delete booking from backend:', err);
    }
    setBookings((prev) => prev.filter((b) => b.id !== id));
    if (viewBooking?.id === id) setViewBooking(null);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedHall('All Halls');
    setSelectedStatus('All Statuses');
    setStartDate('');
    setEndDate('');
  };

  // Filtered list
  const filteredBookings = bookings.filter((b) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        b.bookingRef.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.eventType.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedHall !== 'All Halls' && b.hallName !== selectedHall) {
      return false;
    }
    if (selectedStatus !== 'All Statuses' && b.status !== selectedStatus) {
      return false;
    }
    if (startDate && b.date < startDate) return false;
    if (endDate && b.date > endDate) return false;
    return true;
  });

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Confirmed</span>
          </span>
        );
      case 'Pending':
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Pending</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>[--]</span>
          </span>
        );
    }
  };

  const getPaymentBadge = (paymentStatus?: Booking['paymentStatus']) => {
    switch (paymentStatus) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 text-teal-800 border border-teal-200/60">
            <CheckCircle2 className="w-3 h-3 text-teal-600" />
            <span>Paid</span>
          </span>
        );
      case 'Partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Partial</span>
          </span>
        );
      case 'Unpaid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200/60">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Unpaid</span>
          </span>
        );
      default:
        return (
          <span className="font-mono text-xs text-slate-400">
            [--]
          </span>
        );
    }
  };

  if (viewMode === 'create') {
    return (
      <CreateBookingForm
        initialBooking={editingBooking}
        initialHall={initialCreateData?.hallName}
        initialDate={initialCreateData?.date}
        initialStartTime={initialCreateData?.startTime}
        initialEndTime={initialCreateData?.endTime}
        onCancel={() => {
          setEditingBooking(null);
          setViewMode('table');
        }}
        onSave={async (newBooking) => {
          try {
            if (editingBooking) {
              const updated = await bookingsApi.update(editingBooking.id, newBooking);
              setBookings((prev) =>
                prev.map((b) => (b.id === editingBooking.id ? updated : b))
              );
            } else {
              const created = await bookingsApi.create(newBooking);
              setBookings((prev) => [created, ...prev]);
            }
            setEditingBooking(null);
            setViewMode('table');
          } catch (err: any) {
            console.error('Error saving booking to API:', err);
            const errMsg = err?.message || 'A scheduling collision or turnover buffer conflict prevents saving this booking.';
            alert(`Booking Submission Blocked: ${errMsg}`);
          }
        }}
      />
    );
  }

  return (
    <div className="flex flex-col w-full gap-5">
      {/* Top Section (Header & Actions) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
              Bookings &amp; Reservations
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200/60 text-teal-800 text-[11px] font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
              MODULE ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Manage hall availability, customer contracts, and event schedules.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('create')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00685f] hover:bg-[#005049] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Booking</span>
          </button>
        </div>
      </div>

      {/* Filter Bar Panel */}
      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-xs">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#00685f]" />
          <span>Loading bookings...</span>
        </div>
      )}

      <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 flex-1">
            {/* Search Input */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bookings by reference, customer..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all"
              />
            </div>

            {/* Date Range Picker */}
            <div className="relative w-full flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Start Date"
                className="w-18 bg-transparent text-xs text-slate-700 focus:outline-none"
              />
              <span className="text-slate-300 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="End Date"
                className="w-18 bg-transparent text-xs text-slate-700 focus:outline-none"
              />
            </div>

            {/* Select Hall Dropdown */}
            <div className="relative w-full">
              <div className="relative flex items-center">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <select
                  value={selectedHall}
                  onChange={(e) => setSelectedHall(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all cursor-pointer font-medium"
                >
                  <option value="All Halls">Select Hall: All Halls</option>
                  {hallsList.map((h) => (
                    <option key={h.id || h.name} value={h.name}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Select Status Dropdown */}
            <div className="relative w-full">
              <div className="relative flex items-center">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all cursor-pointer"
                >
                  <option value="All Statuses">Select Status: All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center justify-end shrink-0">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Section: Comprehensive Data Table */}
      <div className="w-full bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                <th scope="col" className="py-3 px-4">Booking ID</th>
                <th scope="col" className="py-3 px-4">Customer Name</th>
                <th scope="col" className="py-3 px-4">Event Type</th>
                <th scope="col" className="py-3 px-4">Hall / Venue</th>
                <th scope="col" className="py-3 px-4">Event Date &amp; Time</th>
                <th scope="col" className="py-3 px-4">Status</th>
                <th scope="col" className="py-3 px-4">Payment Status</th>
                <th scope="col" className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {!loading && filteredBookings.length === 0 ? (
                /* Large, professional empty state in the middle of the table */
                <tr>
                  <td colSpan={8} className="py-20 px-6 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-3.5">
                      <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#00685f] shadow-xs">
                        <CalendarDays className="w-8 h-8 stroke-[1.6]" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                          No bookings found. Create your first booking to get started.
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                          Your reservations ledger is currently empty. Add venue reservations to track schedules, banquet tranches, and customer deposits.
                        </p>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewMode('create')}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00685f] hover:bg-[#005049] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Create New Booking</span>
                        </button>
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-mono mt-1">
                        <span>data: []</span>
                        <span>•</span>
                        <span>[Strict Empty Mode Active]</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-slate-50/80 transition-colors border-b border-slate-100"
                  >
                    {/* Booking ID */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      <span className="px-2 py-0.5 rounded bg-teal-50 border border-teal-200/60 text-teal-800 text-xs font-semibold">
                        [{booking.bookingRef}]
                      </span>
                    </td>

                    {/* Customer Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {booking.customerName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span>{booking.customerName}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-normal">
                            [{booking.contactRef}]
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Event Type */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                        [{booking.eventType}]
                      </span>
                    </td>

                    {/* Hall / Venue */}
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-teal-700" />
                        <span>{booking.hallName}</span>
                      </div>
                    </td>

                    {/* Event Date & Time (12-Hour AM/PM Format) */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-slate-800 font-semibold text-xs">
                          {booking.date}
                        </span>
                        <span className="text-[11px] text-teal-800 font-mono font-medium mt-0.5">
                          {formatTo12Hour(booking.time || booking.slot)}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(booking.status)}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4">
                      {getPaymentBadge(booking.paymentStatus)}
                    </td>

                    {/* Actions (Contract, View, Edit, Delete) */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => setContractBooking(booking)}
                          title="Generate Branded Contract PDF"
                          className="px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <FileQuestion className="w-3 h-3 text-amber-600" />
                          <span>PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewBooking(booking)}
                          title="View Details"
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-teal-700 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(booking)}
                          title="Edit Booking"
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBooking(booking.id)}
                          title="Delete Booking"
                          className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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

        {/* Footer info strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200 text-slate-500 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-medium text-slate-600">
              Showing <span className="font-mono">{filteredBookings.length > 0 ? 1 : 0}</span> -{' '}
              <span className="font-mono">{filteredBookings.length}</span> of{' '}
              <span className="font-mono">{filteredBookings.length}</span> total bookings
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Status: {filteredBookings.length === 0 ? '[Awaiting Ingest / New Entry]' : '[Synchronized]'}
          </div>
        </div>
      </div>

      {!loading && filteredBookings.length === 0 && (
        <div className="w-full rounded-xl border border-slate-200 bg-white p-6 text-center shadow-xs">
          <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3.5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-[#00685f] shadow-xs">
              <CalendarDays className="h-8 w-8 stroke-[1.6]" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                No bookings found. Create your first booking to get started.
              </h3>
              <p className="max-w-sm text-xs leading-relaxed text-slate-500">
                Your reservations ledger is currently empty. Add venue reservations to track schedules, banquet tranches, and customer deposits.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* View Details Dialog */}
      {viewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                  Booking Details [{viewBooking.bookingRef}]
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewBooking(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">{viewBooking.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Event Type:</span>
                <span className="font-medium text-slate-800">{viewBooking.eventType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Hall:</span>
                <span className="font-medium text-slate-800">{viewBooking.hallName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Date &amp; Time:</span>
                <span className="font-mono text-slate-800">{viewBooking.date} • {formatTo12Hour(viewBooking.time || viewBooking.slot)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Status:</span>
                <span>{getStatusBadge(viewBooking.status)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Status:</span>
                <span>{getPaymentBadge(viewBooking.paymentStatus)}</span>
              </div>
              {viewBooking.amount && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Agreed Amount:</span>
                  <span className="font-bold font-mono text-slate-900">Rs. {(viewBooking.amount || 0).toLocaleString('en-PK')}</span>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const b = viewBooking;
                  setViewBooking(null);
                  setContractBooking(b);
                }}
                className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
              >
                Print Contract PDF
              </button>
              <button
                type="button"
                onClick={() => setViewBooking(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Branded Contract PDF Modal */}
      {contractBooking && (
        <BookingContractModal
          booking={contractBooking}
          onClose={() => setContractBooking(null)}
        />
      )}

    </div>
  );
};
