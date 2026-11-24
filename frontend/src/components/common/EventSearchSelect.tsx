import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, Calendar, User, CreditCard, Hash, AlertCircle } from 'lucide-react';

export interface BookingEventOption {
  ref: string;
  id: string;
  customerName: string;
  contactRef?: string;
  cnic?: string;
  eventType?: string;
  hallName?: string;
  date?: string;
  remainingBalance: number;
  totalAmount: number;
}

interface EventSearchSelectProps {
  bookings: BookingEventOption[];
  selectedRef: string;
  onSelect: (ref: string) => void;
  invoices?: Array<{ bookingRef: string; id: string }>;
  allowClear?: boolean;
  clearLabel?: string;
  placeholder?: string;
}

export const EventSearchSelect: React.FC<EventSearchSelectProps> = ({
  bookings,
  selectedRef,
  onSelect,
  invoices = [],
  allowClear = false,
  clearLabel = '-- General Hall Facility Expense (Not Tied to Single Event) --',
  placeholder = 'Search by Name, CNIC, Booking Ref, or Invoice ID...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedBooking = useMemo(
    () => bookings.find((b) => b.ref === selectedRef),
    [bookings, selectedRef]
  );

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Filter bookings by Booking Ref, Invoice ID, Customer Name, CNIC, Phone or Hall
  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return bookings;

    return bookings.filter((b) => {
      const matchRef = (b.ref || '').toLowerCase().includes(q);
      const matchName = (b.customerName || '').toLowerCase().includes(q);
      const matchCnic = (b.cnic || '').toLowerCase().includes(q);
      const matchPhone = (b.contactRef || '').toLowerCase().includes(q);
      const matchHall = (b.hallName || '').toLowerCase().includes(q);
      const matchDate = (b.date || '').toLowerCase().includes(q);
      
      // Also match invoice IDs linked to this booking
      const linkedInvoices = invoices.filter((inv) => inv.bookingRef === b.ref);
      const matchInvoice = linkedInvoices.some((inv) => inv.id.toLowerCase().includes(q));

      return matchRef || matchName || matchCnic || matchPhone || matchHall || matchDate || matchInvoice;
    });
  }, [bookings, searchQuery, invoices]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Display button / search trigger */}
      <div
        onClick={() => {
          setIsOpen((prev) => !prev);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={`w-full px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-left ${
          isOpen
            ? 'border-teal-700 ring-2 ring-teal-700/15 bg-white'
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        <div className="flex-1 min-w-0 pr-2">
          {selectedBooking ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {selectedBooking.ref}
                </span>
                <span className="text-sm font-semibold text-slate-900 truncate">
                  {selectedBooking.customerName}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                {selectedBooking.cnic && <span>CNIC: {selectedBooking.cnic} •</span>}
                <span>{selectedBooking.hallName || 'Hall'} •</span>
                <span className={selectedBooking.remainingBalance > 0 ? 'text-amber-700 font-medium' : 'text-emerald-700 font-medium'}>
                  {selectedBooking.remainingBalance > 0 ? `Pending Rs. ${selectedBooking.remainingBalance.toLocaleString()}` : 'Settled'}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-sm text-slate-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown with live search input and result items */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search box inside dropdown */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type Name, CNIC, Booking ID, or Invoice #..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700/20"
              />
            </div>
            {searchQuery.trim() && (
              <p className="text-[10px] text-slate-400 mt-1 pl-1">
                Showing {filteredBookings.length} matching event(s)
              </p>
            )}
          </div>

          {/* List of events */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            {allowClear && (
              <button
                type="button"
                onClick={() => {
                  onSelect('');
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className={`w-full px-4 py-2 text-left text-xs transition-colors cursor-pointer flex items-center justify-between italic ${
                  !selectedRef ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span>{clearLabel}</span>
                {!selectedRef && <Check className="w-4 h-4 text-teal-700 shrink-0" />}
              </button>
            )}
            {filteredBookings.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-slate-500">
                <AlertCircle className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                No matching events found for &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredBookings.map((b) => {
                const isSelected = b.ref === selectedRef;
                return (
                  <button
                    key={b.ref}
                    type="button"
                    onClick={() => {
                      onSelect(b.ref);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full px-4 py-2.5 text-left text-xs transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected ? 'bg-teal-50/90 text-teal-950 font-medium' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[11px] text-teal-800 bg-teal-100/60 px-1.5 py-0.5 rounded">
                          {b.ref}
                        </span>
                        <span className="font-semibold text-slate-900 truncate">
                          {b.customerName}
                        </span>
                        {b.cnic && (
                          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                            [{b.cnic}]
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{b.hallName || 'Hall'}</span>
                        <span>•</span>
                        <span>{b.date || 'Date N/A'}</span>
                        <span>•</span>
                        <span className={b.remainingBalance > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                          {b.remainingBalance > 0 ? `Pending: Rs. ${b.remainingBalance.toLocaleString()}` : 'Settled'}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-teal-700 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
