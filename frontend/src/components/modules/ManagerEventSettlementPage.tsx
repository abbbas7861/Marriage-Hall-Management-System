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
} from 'lucide-react';

interface AssignedEvent {
  id: string;
  customerName: string;
  hallName: string;
  eventDate: string;
  eventTime: string;
  status: 'Setup' | 'Live' | 'Concluded';
  totalGuests: number;
  menuPackage: string;
  baseHallRent: number;
}

interface ManagerEventSettlementPageProps {
  initialView?: 'list' | 'settlement';
}

export const ManagerEventSettlementPage: React.FC<ManagerEventSettlementPageProps> = ({
  initialView = 'list',
}) => {
  // Strictly empty initial arrays — no hardcoded fake data
  const [events] = useState<AssignedEvent[]>([]);
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

  useEffect(() => {
    setViewMode(initialView);
    if (initialView === 'list') {
      setSelectedEvent(null);
    }
  }, [initialView]);

  const activeEvents = events.filter((e) => e.status !== 'Concluded');
  const completedEvents = events.filter((e) => e.status === 'Concluded');
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

  const handleFinalizeInvoice = () => {
    setStatusFeedback('Settlement finalized and invoice generated.');
    setTimeout(() => setStatusFeedback(null), 3500);
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
        <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Customer Name</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {selectedEvent?.customerName || '[--]'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Hall Name</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {selectedEvent?.hallName || '[--]'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Event Date</p>
            <p className="text-sm font-semibold text-gray-900 mt-1 font-mono tabular-nums">
              {selectedEvent?.eventDate || '[--]'}
            </p>
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
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Finalize &amp; Generate Invoice</span>
            </button>
          </div>
        </section>
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

        {/* Segmented Tabs */}
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
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
