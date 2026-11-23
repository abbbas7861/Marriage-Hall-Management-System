import React from 'react';
import {
  Printer,
  X,
  Building2,
  Calendar,
  Clock,
  User,
  CreditCard,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MapPin,
} from 'lucide-react';
import { Booking } from '../../types';
import { formatTo12Hour } from '../../utils/timeFormat';

interface BookingContractModalProps {
  booking: Booking;
  venueName?: string;
  onClose: () => void;
}

export const BookingContractModal: React.FC<BookingContractModalProps> = ({
  booking,
  venueName = 'Royal Palace Banquet Hall',
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const advancePaid = Number(booking.advancePayment || 0);
  const totalAmount = Number(booking.amount || 0);
  const balanceDue = Math.max(0, totalAmount - advancePaid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      {/* Container */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto print:m-0 print:border-none print:shadow-none print:w-full">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs uppercase tracking-wider font-mono">
              Official Booking Contract &amp; Guarantee
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Contract Sheet */}
        <div id="printable-contract" className="p-8 sm:p-10 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900">
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b-2 border-slate-900 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-teal-800 font-extrabold text-xl tracking-tight uppercase">
                <Building2 className="w-6 h-6 text-teal-700" />
                <span>{venueName}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Luxury Banquets, Wedding Complex &amp; Event Management Suite
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-2 font-mono">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> +92 (300) 123-4567
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> Main Boulevard, Gulberg III, Lahore
                </span>
              </div>
            </div>

            <div className="sm:text-right flex flex-col sm:items-end">
              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 text-xs font-mono font-bold uppercase border border-slate-300">
                REF #{booking.bookingRef}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 font-mono">
                Contract Date: {booking.date || new Date().toISOString().split('T')[0]}
              </span>
              <span className="text-[11px] font-bold text-teal-800 mt-0.5">
                Status: {booking.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Section: Reservation Tranche */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-2">
                1. Customer &amp; Client Particulars
              </h4>
              <div className="text-xs space-y-1">
                <div>
                  <strong className="text-slate-700">Full Name:</strong>{' '}
                  <span className="font-semibold text-slate-900">{booking.customerName}</span>
                </div>
                <div>
                  <strong className="text-slate-700">Contact Number:</strong>{' '}
                  <span className="font-mono text-slate-800">{booking.contactRef || 'N/A'}</span>
                </div>
                <div>
                  <strong className="text-slate-700">CNIC / Passport:</strong>{' '}
                  <span className="font-mono text-slate-800">
                    {(booking as any).cnic || '35201-XXXXXXX-X (Verified)'}
                  </span>
                </div>
                <div>
                  <strong className="text-slate-700">Residential Address:</strong>{' '}
                  <span className="text-slate-800">{(booking as any).address || 'On File'}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-2">
                2. Venue &amp; Event Specification
              </h4>
              <div className="text-xs space-y-1">
                <div>
                  <strong className="text-slate-700">Reserved Hall:</strong>{' '}
                  <span className="font-bold text-teal-800">{booking.hallName}</span>
                </div>
                <div>
                  <strong className="text-slate-700">Event Function:</strong>{' '}
                  <span className="font-semibold text-slate-800">{booking.eventType}</span>
                </div>
                <div>
                  <strong className="text-slate-700">Slot &amp; Timing:</strong>{' '}
                  <span className="font-mono text-slate-800">
                    {formatTo12Hour(booking.time || booking.slot || '19:00 - 23:30')}
                  </span>
                </div>
                <div>
                  <strong className="text-slate-700">Expected Attendance:</strong>{' '}
                  <span className="font-bold text-slate-900 font-mono">
                    {booking.guestCount || 350} Guests
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Financial Consideration */}
          <div className="my-6">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-2.5">
              3. Financial Consideration &amp; Payment Schedule
            </h4>
            <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 text-left">Description</th>
                  <th className="py-2 px-3 text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-2.5 px-3">Base Hall Rental &amp; Staging Fee</td>
                  <td className="py-2.5 px-3 text-right">
                    PKR {totalAmount.toLocaleString('en-PK')}
                  </td>
                </tr>
                <tr className="bg-emerald-50/50">
                  <td className="py-2.5 px-3 font-semibold text-emerald-900">
                    Advance Deposit Received (Tranche 1)
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                    - PKR {advancePaid.toLocaleString('en-PK')}
                  </td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="py-2.5 px-3 text-slate-900">
                    Net Balance Payable (Due 48 Hours Prior to Event)
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-700 text-sm">
                    PKR {balanceDue.toLocaleString('en-PK')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section: Standard Terms & Hall Guidelines */}
          <div className="my-6 p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-[10px] text-slate-600 leading-relaxed space-y-1.5">
            <h5 className="font-bold uppercase tracking-wider text-slate-800 text-[11px] mb-1">
              4. Standard Banquet Terms &amp; Curfew Regulations
            </h5>
            <p>
              1. <strong>Sound &amp; Music Curfew:</strong> In compliance with Government &amp; Municipal regulations, high-decibel music systems and external amplifiers must cease strictly by 10:30 PM.
            </p>
            <p>
              2. <strong>Damage Guarantee:</strong> The client assumes full liability for any physical damage to fixtures, stage rigging, carpets, or chandeliers caused by event attendees or outside decorators.
            </p>
            <p>
              3. <strong>Settlement Protocol:</strong> The full remaining balance must be settled in clear funds at least 48 hours before the event commencement. Overtime hours are billed at standard hourly rates.
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 pt-10 mt-6 border-t border-slate-200">
            <div className="flex flex-col items-center">
              <div className="w-full border-b border-slate-900 mb-2 h-10" />
              <span className="text-xs font-bold text-slate-900">{booking.customerName}</span>
              <span className="text-[10px] text-slate-500 font-mono">Client / Authorized Representative</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-full border-b border-slate-900 mb-2 h-10" />
              <span className="text-xs font-bold text-slate-900">General Manager / Owner</span>
              <span className="text-[10px] text-slate-500 font-mono">{venueName}</span>
            </div>
          </div>

          {/* Verified Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>MHMS Enterprise Electronic Signature Verification</span>
            </div>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};

