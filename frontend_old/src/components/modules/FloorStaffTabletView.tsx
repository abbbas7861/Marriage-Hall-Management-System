import React, { useState, useEffect } from 'react';
import {
  Tablet,
  Clock,
  Clock4,
  Users,
  Building2,
  Utensils,
  AlertTriangle,
  Send,
  X,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Shield,
  Sparkles,
  Info,
} from 'lucide-react';
import { Booking } from '../../types';
import { bookingsApi, floorStaffApi } from '../../api/client';

export const FloorStaffTabletView: React.FC = () => {
  // Modal State for Extra Time Request
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [extraHours, setExtraHours] = useState('');
  const [reason, setReason] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    bookingsApi.list()
      .then((bookings) => {
        if (bookings && bookings.length > 0) {
          // Pick the first active/confirmed or upcoming booking
          const active = bookings.find((b) => b.status === 'Confirmed') || bookings[0];
          setActiveBooking(active);
        }
      })
      .catch((err) => console.error('Failed to load active event for floor staff:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraHours) return;

    try {
      await floorStaffApi.createExtraTimeRequest({
        hallName: activeBooking?.hallName || 'Main Hall',
        bookingRef: activeBooking?.bookingRef || 'BK-LIVE',
        requestedHours: parseFloat(extraHours),
        reason: reason.trim() || 'Floor operational overtime requested',
        estimatedCharges: (parseFloat(extraHours) || 1) * (activeBooking?.ratePerHour || 25000),
      });

      setRequestSent(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setExtraHours('');
        setReason('');
        setTimeout(() => setRequestSent(false), 4000);
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to submit extra time request');
    }
  };

  const parsedStartTime = activeBooking?.time?.split('-')[0]?.trim() || '18:00';
  const parsedEndTime = activeBooking?.time?.split('-')[1]?.trim() || '23:30';

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-5 select-none animate-in fade-in duration-200">
      {/* Top Bar (Tablet-Optimized) */}
      <div className="w-full bg-[#131b2e] text-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Operational Badges & Live Status */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 border border-teal-400/40 text-teal-300 font-bold text-xs uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <span>FLOOR STAFF - READ ONLY</span>
          </span>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="tracking-wide uppercase font-mono font-bold">Live Event</span>
          </div>
        </div>

        {/* Right: Hall Name & Event Date with structural placeholders */}
        <div className="flex items-center gap-4 text-xs sm:text-sm font-medium flex-wrap">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700/50">
            <Building2 className="w-4 h-4 text-teal-400" />
            <span className="text-slate-300 font-sans">Hall:</span>
            <span className="font-bold text-white font-mono">{activeBooking?.hallName || '[Hall Name]'}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700/50">
            <Calendar className="w-4 h-4 text-teal-400" />
            <span className="text-slate-300 font-sans">Date:</span>
            <span className="font-bold text-white font-mono">{activeBooking?.date || '[--/--/----]'}</span>
          </div>
        </div>
      </div>

      {/* Temporary Success Toast when Extra Time is requested */}
      {requestSent && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center justify-between gap-3 shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-xs sm:text-sm">Extra Time Request Dispatched</span>
              <span className="text-xs text-teal-700">
                Notice forwarded to Operations Console / Admin for review and approval.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-md bg-teal-100 text-teal-800 font-mono text-[11px] font-bold">
            STATUS: QUEUED
          </span>
        </div>
      )}

      {/* Main Content Sections (2-Column Tablet Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Left Column: Event & Timing */}
        <div className="flex flex-col gap-5">
          {/* 1. Event Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-[#00685f]">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 font-['Plus_Jakarta_Sans']">
                  Event Details
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {activeBooking ? `REF: ${activeBooking.bookingRef}` : 'SESSION: ACTIVE'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Customer Name */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Customer Name
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono truncate">
                  {activeBooking?.customerName || '[Customer Name]'}
                </span>
              </div>

              {/* Event Type */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Event Type
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono truncate">
                  {activeBooking?.eventType || '[Event Type]'}
                </span>
              </div>

              {/* Expected Guests */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Expected Guests
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold font-mono text-[#00685f]">
                    {activeBooking?.guestCount || '[--]'}
                  </span>
                  <span className="text-[11px] text-slate-400">Seats</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Timing Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 font-['Plus_Jakarta_Sans']">
                  Timing Schedule
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {activeBooking?.slot || 'HALL SLOT'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Start Time
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                  {parsedStartTime}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  End Time
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                  {parsedEndTime}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Seating Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 font-['Plus_Jakarta_Sans']">
                  Seating Architecture
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">FLOOR LAYOUT</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Arrangement Style
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900 font-mono truncate">
                  {activeBooking?.seatingArrangement || '[Theater/Round Tables]'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Total Tables
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                  {activeBooking?.guestCount ? Math.ceil(activeBooking.guestCount / 8) : '[--]'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Menu & Actions */}
        <div className="flex flex-col gap-5 justify-between">
          {/* Menu Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-[#00685f]">
                  <Utensils className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 font-['Plus_Jakarta_Sans']">
                  Menu &amp; Catering Specifications
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">KITCHEN SYNC</span>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              {/* Menu Package */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Menu Package
                </span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {activeBooking?.menuPackage || '[Package Name]'}
                </span>
              </div>

              {/* Special Instructions */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Special Instructions (Allergies / Dietary)
                  </span>
                  <span className="text-[10px] text-amber-600 font-semibold uppercase">Caution</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200/80 text-xs sm:text-sm font-mono text-slate-800 min-h-[70px]">
                  {activeBooking?.specialInstructions || '[None recorded]'}
                </div>
              </div>
            </div>
          </div>

          {/* CRITICAL ACTION BUTTON: Request Extra Time */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Venue Overtime Escalation
              </span>
              <span className="text-[11px] text-slate-400 font-mono">HEAD OFFICE LINK</span>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full min-h-[64px] sm:min-h-[72px] px-6 py-4 rounded-xl bg-[#00685f] hover:bg-[#005049] active:scale-[0.99] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Clock4 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-base sm:text-lg font-bold tracking-tight leading-snug font-['Plus_Jakarta_Sans']">
                  Request Extra Time
                </span>
                <span className="text-[11px] sm:text-xs text-teal-100/90 font-medium">
                  Dispatch operational delay notice to Head Office for extension authorization
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Extra Time Request Modal (Simulated) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-[#00685f]">
                  <Clock4 className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                  Request Extra Time Approval
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendRequest} className="p-6 flex flex-col gap-4">
              {/* Extra Hours Required */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  Extra Hours Required <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={extraHours}
                  onChange={(e) => setExtraHours(e.target.value)}
                  placeholder="[Enter Extra Hours, e.g. 1.5]"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  Reason
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="[Reason for delay]"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all resize-none"
                />
              </div>

              {/* Small Info Text */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  This request will be sent to Head Office for approval. Charges will be applied upon approval.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 mt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00685f] hover:bg-[#005049] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Request to Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
