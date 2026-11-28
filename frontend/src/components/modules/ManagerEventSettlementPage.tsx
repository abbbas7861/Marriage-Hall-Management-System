import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Calculator,
  ShieldAlert,
  FileText,
  CheckCircle,
  ArrowLeft,
  Clock,
  Building2,
  Users,
  UserCheck,
  Printer,
  X,
} from 'lucide-react';
import { SEED_ASSIGNED_EVENTS } from '../../data/seedData';
import { bookingsApi, invoicesApi, authApi } from '../../api/client';
import { formatTo12Hour } from '../../utils/timeFormat';

interface AssignedEvent {
  id: string;
  bookingRef?: string;
  customerName: string;
  hallName: string;
  eventDate: string;
  eventTime: string;
  status: 'Setup' | 'Live' | 'Concluded';
  totalGuests: number;
  menuPackage: string;
  baseHallRent: number;
  assignedManager?: string;
}

interface ManagerEventSettlementPageProps {
  initialView?: 'list' | 'settlement';
}

export const ManagerEventSettlementPage: React.FC<ManagerEventSettlementPageProps> = ({
  initialView = 'list',
}) => {
  const [events, setEvents] = useState<AssignedEvent[]>([]);
  const [availableManagers, setAvailableManagers] = useState<string[]>(['Manager', 'ali', 'Operational Manager']);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [viewMode, setViewMode] = useState<'list' | 'settlement'>(initialView);
  const [selectedEvent, setSelectedEvent] = useState<AssignedEvent | null>(null);

  // Settlement Inputs
  const [damagesCharge, setDamagesCharge] = useState('');
  const [damagesNotes, setDamagesNotes] = useState('');
  const [extraTimeCharge, setExtraTimeCharge] = useState('');
  const [extraTimeNotes, setExtraTimeNotes] = useState('');
  const [otherCharge, setOtherCharge] = useState('');
  const [otherNotes, setOtherNotes] = useState('');
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalInvoiceModal, setFinalInvoiceModal] = useState<{
    invoiceId: string;
    bookingRef: string;
    customerName: string;
    hallName: string;
    eventDate: string;
    date: string;
    baseAmount: number;
    damagesCharge: number;
    damagesNotes: string;
    extraTimeCharge: number;
    extraTimeNotes: string;
    otherCharge: number;
    otherNotes: string;
    totalAdditional: number;
    totalAmount: number;
    paidAmount: number;
    remainingBalance: number;
  } | null>(null);

  useEffect(() => {
    bookingsApi
      .list()
      .then((data) => {
        if (data && data.length > 0) {
          const mapped: AssignedEvent[] = data.map((b: any) => ({
            id: String(b.id),
            bookingRef: b.bookingRef,
            customerName: b.customerName || b.bookingRef || 'Valued Client',
            hallName: b.hallName || 'Main Hall',
            eventDate: b.date || '',
            eventTime: formatTo12Hour(b.time || b.slot) || '12:00 PM – 04:00 PM',
            status:
              b.operationalStatus === 'Concluded' || b.status === 'Completed'
                ? 'Concluded'
                : b.status === 'Confirmed'
                ? 'Live'
                : 'Setup',
            totalGuests: Number(b.guestCount) || 100,
            menuPackage: b.menuPackage || 'Standard Menu',
            baseHallRent: Number(b.amount) || 0,
            assignedManager: b.assignedManager || 'Manager',
          }));
          setEvents(mapped);
        } else {
          setEvents(SEED_ASSIGNED_EVENTS);
        }
      })
      .catch(() => setEvents(SEED_ASSIGNED_EVENTS));

    authApi
      .listUsers()
      .then((users) => {
        if (users && users.length > 0) {
          const mgrs = users
            .filter(
              (u: any) =>
                (u.role || '').toLowerCase() === 'manager' ||
                (u.role || '').toLowerCase() === 'admin'
            )
            .map((u: any) => u.fullName || u.username);
          if (mgrs.length > 0) {
            setAvailableManagers(Array.from(new Set(['Manager', ...mgrs])));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleAssignManager = async (eventId: string, newManager: string) => {
    try {
      await bookingsApi.update(eventId, { assignedManager: newManager });
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, assignedManager: newManager } : e))
      );
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent((prev) => (prev ? { ...prev, assignedManager: newManager } : null));
      }
      setStatusFeedback(`Successfully assigned ${newManager} to event.`);
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (err) {
      console.warn('Assign manager error:', err);
    }
  };

  useEffect(() => {
    setViewMode(initialView);
    if (initialView === 'list') {
      setSelectedEvent(null);
    }
  }, [initialView]);

  const [filterManager, setFilterManager] = useState<string>('All');

  const filteredByManager =
    filterManager === 'All'
      ? events
      : events.filter((e) => (e.assignedManager || 'Manager').toLowerCase() === filterManager.toLowerCase());
  const activeEvents = filteredByManager.filter((e) => e.status !== 'Concluded');
  const completedEvents = filteredByManager.filter((e) => e.status === 'Concluded');
  const displayedEvents = activeTab === 'active' ? activeEvents : completedEvents;

  const baseAmount = selectedEvent?.baseHallRent ?? 0;
  const parsedDamages = Number(damagesCharge) || 0;
  const parsedExtraTime = Number(extraTimeCharge) || 0;
  const parsedOther = Number(otherCharge) || 0;
  const totalAdditional = parsedDamages + parsedExtraTime + parsedOther;
  const hasAdditionalInput =
    damagesCharge.trim() !== '' ||
    extraTimeCharge.trim() !== '' ||
    otherCharge.trim() !== '';
  const hasAnyAmount = selectedEvent !== null || hasAdditionalInput;
  const finalPayable = baseAmount + totalAdditional;

  const handleOpenEvent = (event: AssignedEvent) => {
    setSelectedEvent(event);
    setViewMode('settlement');
    setStatusFeedback(null);
  };

  const handleSaveDraft = () => {
    setStatusFeedback('Draft settlement saved.');
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  const handleFinalizeInvoice = async () => {
    if (!selectedEvent || isFinalizing) return;
    setIsFinalizing(true);
    setStatusFeedback(null);
    try {
      const extraServices: Array<{ title: string; price: number; category?: string; notes?: string }> = [];
      if (parsedExtraTime > 0) {
        extraServices.push({
          title: extraTimeNotes.trim() || 'Extra Time Charges',
          price: parsedExtraTime,
          category: 'Extra Time',
          notes: extraTimeNotes.trim(),
        });
      }
      if (parsedOther > 0) {
        extraServices.push({
          title: otherNotes.trim() || 'Other Charges',
          price: parsedOther,
          category: 'Other',
          notes: otherNotes.trim(),
        });
      }

      const damages: Array<{ item: string; amount: number; deductionType?: 'invoice' | 'security_deposit'; notes?: string }> = [];
      if (parsedDamages > 0) {
        damages.push({
          item: damagesNotes.trim() || 'Event Damages',
          amount: parsedDamages,
          deductionType: 'invoice',
          notes: damagesNotes.trim(),
        });
      }

      const closingNote = `Final event settlement for ${selectedEvent.customerName}. Base: Rs. ${baseAmount}, Damages: Rs. ${parsedDamages}, Extra Time: Rs. ${parsedExtraTime}, Other: Rs. ${parsedOther}`;

      let resInvoice: any = null;
      if (!String(selectedEvent.id).startsWith('seed-')) {
        const res = await bookingsApi.closeEvent(selectedEvent.id, {
          extraServices,
          damages,
          notes: closingNote,
        });
        resInvoice = res?.invoice || null;
      } else {
        resInvoice = await invoicesApi.create({
          bookingId: selectedEvent.bookingRef || selectedEvent.id,
          customerName: selectedEvent.customerName,
          date: new Date().toISOString().slice(0, 10),
          totalAmount: finalPayable,
          paidAmount: 0,
          remainingBalance: finalPayable,
          status: 'Active',
          notes: closingNote,
        });
      }

      setEvents((prev) =>
        prev.map((e) => (e.id === selectedEvent.id ? { ...e, status: 'Concluded' } : e))
      );
      setSelectedEvent((prev) => (prev ? { ...prev, status: 'Concluded' } : null));
      setStatusFeedback('Settlement finalized, booking marked Completed, and invoice generated.');

      const totalAmt = Number(resInvoice?.totalAmount ?? finalPayable);
      const paidAmt = Number(resInvoice?.paidAmount ?? 0);
      const remAmt = Number(resInvoice?.remainingBalance ?? Math.max(0, totalAmt - paidAmt));

      setFinalInvoiceModal({
        invoiceId: resInvoice?.invoiceId || `INV-${(selectedEvent.bookingRef || selectedEvent.id).replace('BK-', '')}`,
        bookingRef: selectedEvent.bookingRef || selectedEvent.id,
        customerName: selectedEvent.customerName,
        hallName: selectedEvent.hallName,
        eventDate: selectedEvent.eventDate,
        date: new Date().toISOString().slice(0, 10),
        baseAmount,
        damagesCharge: parsedDamages,
        damagesNotes: damagesNotes.trim(),
        extraTimeCharge: parsedExtraTime,
        extraTimeNotes: extraTimeNotes.trim(),
        otherCharge: parsedOther,
        otherNotes: otherNotes.trim(),
        totalAdditional,
        totalAmount: totalAmt,
        paidAmount: paidAmt,
        remainingBalance: remAmt,
      });
    } catch (err: any) {
      console.error('Failed to finalize settlement & generate invoice:', err);
      setStatusFeedback(`Failed to finalize invoice: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsFinalizing(false);
    }
  };

  if (viewMode === 'settlement') {
    return (
      <div className="space-y-6">
        {/* Top Navigation & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedEvent(null);
                setViewMode('list');
              }}
              aria-label="Back to assigned events"
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-['Plus_Jakarta_Sans']">
                Event Execution &amp; Settlement
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Record post-event charges, deductions, and generate the final settlement.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium w-fit">
            <CheckCircle className="w-3.5 h-3.5 text-teal-700" />
            <span>Event Concluded</span>
          </span>
        </div>

        {statusFeedback && (
          <div className="px-4 py-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-teal-700 shrink-0" />
            <span>{statusFeedback}</span>
          </div>
        )}

        {/* Header Summary Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Customer Name</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {selectedEvent?.customerName || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Hall Name</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {selectedEvent?.hallName || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Event Date</p>
            <p className="text-sm font-semibold text-gray-900 mt-1 font-mono tabular-nums">
              {selectedEvent?.eventDate || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Supervising Manager</p>
            <select
              aria-label="Supervising Manager"
              value={selectedEvent?.assignedManager || 'Manager'}
              onChange={(e) => selectedEvent && handleAssignManager(selectedEvent.id, e.target.value)}
              className="mt-1 text-xs py-1 px-2 rounded-md border border-teal-200 bg-teal-50 text-teal-800 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 cursor-pointer"
            >
              {availableManagers.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 1: Base Booking Details (Read-only) */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
            <FileText className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-semibold text-gray-900">
              1. Base Booking Details (Read-only)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200/80">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <span>Total Guests</span>
              </div>
              <p className="text-base font-semibold text-gray-900 mt-1.5 font-mono tabular-nums">
                {selectedEvent ? selectedEvent.totalGuests.toLocaleString('en-PK') : '[--]'}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200/80">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <span>Menu Package Selected</span>
              </div>
              <p className="text-base font-semibold text-gray-900 mt-1.5">
                {selectedEvent?.menuPackage || '[--]'}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200/80">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                <span>Base Hall Rent</span>
              </div>
              <p className="text-base font-semibold text-gray-900 mt-1.5 font-mono tabular-nums">
                {selectedEvent
                  ? `Rs. ${selectedEvent.baseHallRent.toLocaleString('en-PK')}`
                  : '[--]'}
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Additional Charges & Deductions */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              2. Additional Charges &amp; Deductions
            </h2>
          </div>

          <div className="space-y-5 mt-5">
            {/* Damages / Breakage Charge */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label
                  htmlFor="settlement-damages"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Damages / Breakage Charge (Rs.)
                </label>
                <input
                  id="settlement-damages"
                  type="number"
                  min="0"
                  value={damagesCharge}
                  onChange={(e) => setDamagesCharge(e.target.value)}
                  placeholder="[--]"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>
              <div className="md:col-span-8">
                <label
                  htmlFor="settlement-damages-notes"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Damages Notes
                </label>
                <textarea
                  id="settlement-damages-notes"
                  rows={2}
                  value={damagesNotes}
                  onChange={(e) => setDamagesNotes(e.target.value)}
                  placeholder="Enter breakage or damage details..."
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 resize-none"
                />
              </div>
            </div>

            {/* Extra Time Charges */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 border-t border-gray-100">
              <div className="md:col-span-4">
                <label
                  htmlFor="settlement-extratime"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Extra Time Charges (Rs.)
                </label>
                <input
                  id="settlement-extratime"
                  type="number"
                  min="0"
                  value={extraTimeCharge}
                  onChange={(e) => setExtraTimeCharge(e.target.value)}
                  placeholder="[--]"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>
              <div className="md:col-span-8">
                <label
                  htmlFor="settlement-extratime-notes"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Extra Time Notes
                </label>
                <input
                  id="settlement-extratime-notes"
                  type="text"
                  value={extraTimeNotes}
                  onChange={(e) => setExtraTimeNotes(e.target.value)}
                  placeholder="Enter overtime duration or notes..."
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>
            </div>

            {/* Other Charges */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 border-t border-gray-100">
              <div className="md:col-span-4">
                <label
                  htmlFor="settlement-other"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Other Charges (Rs.)
                </label>
                <input
                  id="settlement-other"
                  type="number"
                  min="0"
                  value={otherCharge}
                  onChange={(e) => setOtherCharge(e.target.value)}
                  placeholder="[--]"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>
              <div className="md:col-span-8">
                <label
                  htmlFor="settlement-other-notes"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Other Charges Notes
                </label>
                <input
                  id="settlement-other-notes"
                  type="text"
                  value={otherNotes}
                  onChange={(e) => setOtherNotes(e.target.value)}
                  placeholder="Enter miscellaneous charges or deductions..."
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Final Settlement Summary */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
            <Calculator className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-semibold text-gray-900">
              3. Final Settlement Summary
            </h2>
          </div>

          <div className="mt-5 space-y-3 max-w-md ml-auto">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total Base Amount</span>
              <span className="font-mono font-medium text-gray-900 tabular-nums">
                {selectedEvent
                  ? `Rs. ${baseAmount.toLocaleString('en-PK')}`
                  : '[--]'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total Additional Charges</span>
              <span className="font-mono font-medium text-gray-900 tabular-nums">
                {hasAdditionalInput
                  ? `Rs. ${totalAdditional.toLocaleString('en-PK')}`
                  : '[--]'}
              </span>
            </div>

            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">
                Final Payable Amount
              </span>
              <span className="text-xl font-bold text-gray-900 font-mono tabular-nums">
                {hasAnyAmount
                  ? `Rs. ${finalPayable.toLocaleString('en-PK')}`
                  : '[--]'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors cursor-pointer"
            >
              Save Draft Settlement
            </button>
            <button
              type="button"
              onClick={handleFinalizeInvoice}
              disabled={isFinalizing}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isFinalizing ? 'Finalizing...' : 'Finalize & Generate Invoice'}</span>
            </button>
          </div>
        </section>

        {/* Printable Final Settlement Invoice Modal */}
        {finalInvoiceModal && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto print:static print:bg-white print:p-0 print:block"
            role="dialog"
            aria-modal="true"
            aria-label="Final Settlement Invoice"
          >
            <div className="w-full max-w-2xl bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden my-auto print:border-none print:shadow-none print:max-w-none print:rounded-none">
              {/* Top Action Bar (Hidden in Print) */}
              <div className="no-print px-6 py-3.5 bg-slate-50 border-b border-gray-200 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Final Settlement Invoice
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinalInvoiceModal(null)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Close</span>
                  </button>
                </div>
              </div>

              {/* Printable Sheet */}
              <div id="printable-receipt" className="bg-white text-black p-6 sm:p-8 text-xs space-y-5">
                <div className="flex items-center justify-between gap-4 pb-4 border-b-2 border-teal-900/40">
                  <img src="/logo.png" alt="Logo Left" className="h-16 w-16 object-contain shrink-0" />
                  <div className="text-center flex-1">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase font-['Playfair_Display','Cormorant_Garamond',serif]">
                      Mehar Palace Marquee
                    </h2>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Main Canal Road, near PSO Petrol Pump, Fateh Garh Mughalpura, Lahore, 54000
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Phone: <strong className="text-slate-800">0321 1000806</strong> &bull; Final Settlement Invoice
                    </p>
                  </div>
                  <img src="/logo.png" alt="Logo Right" className="h-16 w-16 object-contain shrink-0" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Invoice #</span>
                    <span className="font-mono font-bold text-slate-900">{finalInvoiceModal.invoiceId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Booking Ref</span>
                    <span className="font-mono font-bold text-slate-900">{finalInvoiceModal.bookingRef}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Customer</span>
                    <span className="font-semibold text-slate-900">{finalInvoiceModal.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Hall &amp; Event Date</span>
                    <span className="font-semibold text-slate-900">
                      {finalInvoiceModal.hallName} ({finalInvoiceModal.eventDate || finalInvoiceModal.date})
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-200 text-[11px] uppercase text-slate-600">
                      <tr>
                        <th className="py-2.5 px-4">Description</th>
                        <th className="py-2.5 px-4">Notes</th>
                        <th className="py-2.5 px-4 text-right font-mono">Amount (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">Base Contract / Hall &amp; Package</td>
                        <td className="py-2.5 px-4 text-slate-500">Original Booking Value</td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                          Rs. {finalInvoiceModal.baseAmount.toLocaleString('en-PK')}
                        </td>
                      </tr>
                      {finalInvoiceModal.damagesCharge > 0 && (
                        <tr>
                          <td className="py-2.5 px-4 font-medium text-slate-800">Damages &amp; Breakage Charges</td>
                          <td className="py-2.5 px-4 text-slate-500">{finalInvoiceModal.damagesNotes || '—'}</td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-900">
                            Rs. {finalInvoiceModal.damagesCharge.toLocaleString('en-PK')}
                          </td>
                        </tr>
                      )}
                      {finalInvoiceModal.extraTimeCharge > 0 && (
                        <tr>
                          <td className="py-2.5 px-4 font-medium text-slate-800">Extra Time / Overtime Charges</td>
                          <td className="py-2.5 px-4 text-slate-500">{finalInvoiceModal.extraTimeNotes || '—'}</td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-900">
                            Rs. {finalInvoiceModal.extraTimeCharge.toLocaleString('en-PK')}
                          </td>
                        </tr>
                      )}
                      {finalInvoiceModal.otherCharge > 0 && (
                        <tr>
                          <td className="py-2.5 px-4 font-medium text-slate-800">Other Miscellaneous Charges</td>
                          <td className="py-2.5 px-4 text-slate-500">{finalInvoiceModal.otherNotes || '—'}</td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-900">
                            Rs. {finalInvoiceModal.otherCharge.toLocaleString('en-PK')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 max-w-sm ml-auto">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Additional Charges</span>
                    <span className="font-mono font-medium">Rs. {finalInvoiceModal.totalAdditional.toLocaleString('en-PK')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-2">
                    <span>Gross Final Amount</span>
                    <span className="font-mono">Rs. {finalInvoiceModal.totalAmount.toLocaleString('en-PK')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Paid So Far</span>
                    <span className="font-mono">- Rs. {finalInvoiceModal.paidAmount.toLocaleString('en-PK')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-300 pt-2">
                    <span>Remaining Payable Balance</span>
                    <span className="font-mono">Rs. {finalInvoiceModal.remainingBalance.toLocaleString('en-PK')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center text-[11px] text-slate-500">
                  <div>
                    <div className="border-t border-dashed border-slate-400 pt-2 mt-6 font-semibold text-slate-700">
                      Manager Signature
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-dashed border-slate-400 pt-2 mt-6 font-semibold text-slate-700">
                      Client Signature
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-['Plus_Jakarta_Sans']">
            Assigned Events &amp; Live Execution
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage event setup, live operations, and final billing settlements.
          </p>
        </div>

        {/* Filters & Segmented Tabs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filter by Manager"
            value={filterManager}
            onChange={(e) => setFilterManager(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700 cursor-pointer"
          >
            <option value="All">All Supervising Managers</option>
            {availableManagers.map((m) => (
              <option key={m} value={m}>
                Manager: {m}
              </option>
            ))}
          </select>

          <div className="inline-flex p-1 rounded-lg bg-gray-200/70 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active Events
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed Events
            </button>
          </div>
        </div>
      </div>

      {/* Event List or Empty State */}
      {displayedEvents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 px-6 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center mb-4">
            <Calendar className="w-7 h-7 stroke-[1.5]" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">
            {activeTab === 'active'
              ? 'No active events assigned. Awaiting Admin booking.'
              : 'No completed events recorded yet.'}
          </h2>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            Assigned hall events will appear here for live execution tracking and final settlement.
          </p>
          <button
            type="button"
            onClick={() => setViewMode('settlement')}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-teal-700" />
            <span>Open Settlement Workspace</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedEvents.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => handleOpenEvent(ev)}
              className="bg-white rounded-xl border border-gray-200 hover:border-teal-600/40 p-5 text-left transition-colors cursor-pointer flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {ev.customerName}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{ev.hallName}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
                  {ev.status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {ev.eventDate}
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {ev.eventTime}
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono ml-auto text-gray-700 font-semibold">
                  Rs. {ev.baseHallRent.toLocaleString('en-PK')}
                </span>
              </div>

              <div
                className="flex items-center justify-between text-xs pt-2 border-t border-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1.5 text-gray-600">
                  <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                  <span className="font-medium">Supervising Manager:</span>
                </div>
                <select
                  aria-label="Assign Supervising Manager"
                  value={ev.assignedManager || 'Manager'}
                  onChange={(e) => handleAssignManager(ev.id, e.target.value)}
                  className="py-1 px-2.5 rounded-md border border-teal-200 bg-teal-50 text-teal-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 cursor-pointer"
                  title="Assign or reassign supervising manager to this event"
                >
                  {availableManagers.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
