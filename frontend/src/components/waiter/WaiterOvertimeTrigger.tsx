import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  AlertTriangle,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Clock4,
  Send,
  Sparkles,
  ShieldAlert,
  DollarSign,
  Coffee,
  RotateCcw,
  Check,
  ChevronRight,
  Info,
  Calendar,
} from 'lucide-react';
import { Booking, ExtraTimeRequest, AuthUser } from '../../types';
import { bookingsApi, floorStaffApi } from '../../api/client';
import { formatTo12Hour } from '../../utils/timeFormat';

interface WaiterOvertimeTriggerProps {
  onNavigateToTab?: (tabId: string) => void;
  currentUser?: AuthUser | null;
}

const PRESET_REASONS = [
  'Extended Family Photography & Stage Rasm',
  'Guest Arrival Significantly Delayed',
  'VIP Bride & Groom Late Entry',
  'Delayed Dinner Service (Catering Extension)',
  'Client Direct Request (Host Will Pay Extension)',
  'Musical Performance / Baraat Delay',
];

export const WaiterOvertimeTrigger: React.FC<WaiterOvertimeTriggerProps> = ({
  onNavigateToTab,
  currentUser,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingRef, setSelectedBookingRef] = useState<string>('');
  const [requests, setRequests] = useState<ExtraTimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [requestedHours, setRequestedHours] = useState<number>(1.0);
  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');

  // Audio chime for emergency dispatch
  const playAlertSound = (type: 'dispatch' | 'approved') => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'dispatch') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.25); // G5
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // AudioContext not allowed before user interaction
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    try {
      const [bookingsData, requestsData] = await Promise.all([
        bookingsApi.list(),
        floorStaffApi.listExtraTimeRequests(),
      ]);
      setBookings(bookingsData);
      setRequests(requestsData);

      if (!selectedBookingRef && bookingsData.length > 0) {
        // Prefer one in progress or confirmed
        const active = bookingsData.find(
          (b) => b.operationalStatus === 'In Progress' || b.operationalStatus === 'Ready for Event'
        ) || bookingsData[0];
        setSelectedBookingRef(active.bookingRef);
      }
    } catch (err) {
      console.error('Failed to load overtime data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 5 seconds to track approval in real time
    const timer = setInterval(() => {
      floorStaffApi.listExtraTimeRequests().then(setRequests).catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const currentBooking = useMemo(() => {
    return bookings.find((b) => b.bookingRef === selectedBookingRef) || bookings[0];
  }, [bookings, selectedBookingRef]);

  // Hourly overtime rate
  const ratePerHour = currentBooking?.ratePerHour && currentBooking.ratePerHour > 0
    ? currentBooking.ratePerHour
    : 25000;

  const estimatedTotalCost = Math.round(requestedHours * ratePerHour);

  // Filter requests for current booking
  const bookingRequests = useMemo(() => {
    if (!currentBooking) return [];
    return requests.filter((r) => r.bookingRef === currentBooking.bookingRef);
  }, [requests, currentBooking]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBooking) return;
    setSubmitting(true);

    const finalReason = customReason.trim()
      ? `${selectedReason} - ${customReason.trim()}`
      : selectedReason;

    try {
      const newReq = await floorStaffApi.createExtraTimeRequest({
        hallName: currentBooking.hallName,
        bookingRef: currentBooking.bookingRef,
        requestedHours,
        reason: finalReason,
        estimatedCharges: estimatedTotalCost,
        status: 'Pending',
      });

      playAlertSound('dispatch');
      setRequests((prev) => [newReq, ...prev]);
      showToast(`⚡ Overtime extension for +${requestedHours} hr(s) sent to Admin/Manager!`);
      setCustomReason('');
    } catch (err) {
      console.error('Error submitting extra time request:', err);
      showToast('❌ Failed to dispatch extra time request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (reqId: string) => {
    try {
      await floorStaffApi.approveExtraTimeRequest(reqId);
      playAlertSound('approved');
      showToast('✅ Extra time request APPROVED. Booking hours and billing updated.');
      loadData();
    } catch (err) {
      console.error('Failed to approve:', err);
      showToast('❌ Failed to approve request.');
    }
  };

  const handleReject = async (reqId: string) => {
    try {
      await floorStaffApi.rejectExtraTimeRequest(reqId);
      showToast('⚠️ Extra time request REJECTED.');
      loadData();
    } catch (err) {
      console.error('Failed to reject:', err);
      showToast('❌ Failed to reject request.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-8">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Connecting to Operations Console & Overtime Hub...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900 border border-amber-500/40 text-white rounded-2xl shadow-2xl animate-in slide-in-from-top-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Tab Navigation */}
      <div className="bg-[#131b2e] text-white rounded-3xl p-6 shadow-xl border border-slate-700/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-300 font-bold text-xs tracking-wider">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>EMERGENCY OVERTIME TRIGGER</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans'] text-white">
            Floor Staff Overtime Extension Hub
          </h1>
          <p className="text-sm text-slate-300">
            Lead Floor Captain & Waiter dispatch interface for instant hall extension requests, turnover buffers, and direct manager approvals.
          </p>
        </div>

        {/* Tab switch pills */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 shrink-0 self-start lg:self-center">
          <button
            type="button"
            onClick={() => onNavigateToTab?.('waiter-tables')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Table Turnover</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab?.('waiter-refills')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all cursor-pointer"
          >
            <Coffee className="w-4 h-4 text-amber-400" />
            <span>Buffet Refills</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 shadow-md cursor-default"
          >
            <Clock className="w-4 h-4 text-white" />
            <span>Overtime Request</span>
          </button>
        </div>
      </div>

      {/* Active Event Selector & Key Timing Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Hall & Booking Selector */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Event Selection</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Floor
              </span>
            </div>

            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Hall & Booking Session
            </label>
            <select
              value={selectedBookingRef}
              onChange={(e) => setSelectedBookingRef(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            >
              {bookings.map((b) => (
                <option key={b.bookingRef} value={b.bookingRef} className="bg-slate-900 text-white">
                  {b.hallName} • {b.bookingRef} ({b.customerName})
                </option>
              ))}
            </select>
          </div>

          {currentBooking && (
            <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900/60 border border-slate-700/40 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-400 uppercase block">Host / Client</span>
                <span className="text-sm font-bold text-white truncate block">{currentBooking.customerName}</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-700/40 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-400 uppercase block">Expected Guests</span>
                <span className="text-sm font-bold text-white block">{currentBooking.guestCount || 350} Pax</span>
              </div>
            </div>
          )}
        </div>

        {/* Schedule & 1-Hour Turnover Buffer Monitor */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Timing Slot</span>
              <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900/80 border border-slate-700 px-2 py-0.5 rounded-lg">
                12-HR CLOCK
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-2xl border border-slate-700/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Session Slot</span>
                    <span className="text-sm font-bold text-white">
                      {currentBooking?.time || '07:00 PM – 11:00 PM'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg">
                  Scheduled
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-amber-300 font-bold block">Strict 1-Hour Buffer</span>
                    <span className="text-xs text-amber-200/80">
                      Mandatory sanitization & turnover window after event.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
            <span>Approved Overtime Logged:</span>
            <span className="font-bold text-white font-mono">
              +{currentBooking?.extraHours || 0} Hours
            </span>
          </div>
        </div>

        {/* Pricing & Billing Ledger Impact */}
        <div className="bg-gradient-to-br from-slate-900 to-[#131b2e] text-white rounded-3xl p-6 shadow-xl border border-slate-700/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hourly Overtime Tariff</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Standard Hall Overtime Rate</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-amber-400 font-mono">
                    Rs. {Number(ratePerHour || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-300">/ hour</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                <span className="text-xs text-slate-400 block mb-1">Selected Extension Calculation</span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white font-mono">+{requestedHours} hr(s)</span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono">
                    = Rs. {Number(estimatedTotalCost || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
            * Once approved by Manager/Admin, charges are automatically added to the customer's final invoice ledger.
          </p>
        </div>
      </div>

      {/* Main Grid: Extension Dispatch Form & Live Approvals Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Touch Form for Request Dispatch */}
        <div className="lg:col-span-7 bg-slate-800/60 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-slate-700/50 shadow-xs flex flex-col justify-between">
          <form onSubmit={handleSubmitRequest} className="space-y-6">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    <Clock4 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
                      Submit Overtime Extension Request
                    </h2>
                    <span className="text-xs text-slate-400">Touch-friendly rapid dispatch for floor captains</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-full">
                  STAGE: LIVE
                </span>
              </div>

              {/* 1. Hours Stepper & Quick Pills */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Extra Time Required (Hours)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[0.5, 1.0, 1.5, 2.0].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setRequestedHours(hrs)}
                      className={`min-h-[58px] p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        requestedHours === hrs
                          ? 'bg-amber-500 text-white border-amber-600 shadow-md font-bold scale-[1.02]'
                          : 'bg-slate-900/60 hover:bg-slate-900 text-slate-300 border-slate-700/60 font-medium'
                      }`}
                    >
                      <span className="text-base font-extrabold font-mono">+{hrs} hr</span>
                      <span className={`text-[11px] ${requestedHours === hrs ? 'text-amber-100' : 'text-slate-400'}`}>
                        {hrs * 60} mins
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom Fine Stepper */}
                <div className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-2xl border border-slate-700/50 mt-2">
                  <span className="text-xs font-semibold text-slate-400">Fine Adjust Hours</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setRequestedHours((prev) => Math.max(0.5, prev - 0.5))}
                      className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold hover:bg-slate-700 active:scale-95 transition-all cursor-pointer flex items-center justify-center text-lg"
                    >
                      -
                    </button>
                    <span className="text-lg font-extrabold text-white font-mono w-16 text-center">
                      {requestedHours} hr
                    </span>
                    <button
                      type="button"
                      onClick={() => setRequestedHours((prev) => Math.min(5.0, prev + 0.5))}
                      className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold hover:bg-slate-700 active:scale-95 transition-all cursor-pointer flex items-center justify-center text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Reason Category Chips */}
              <div className="space-y-3 mt-6">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Operational Reason for Extension
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setSelectedReason(reason)}
                      className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        selectedReason === reason
                          ? 'bg-amber-600 text-white border-amber-500 shadow-xs font-bold'
                          : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Additional Specific Note / Floor Details */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Floor Staff Note / Client Verbal Confirmation (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="e.g. Groom's father confirmed in person that they agree to the extra hourly charge..."
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-all resize-none"
                />
              </div>

              {/* Buffer Turnover Warning */}
              <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200 leading-relaxed">
                  <span className="font-bold text-amber-300 block mb-0.5">Automated Hall Buffer Check:</span>
                  Adding <span className="font-bold text-white">+{requestedHours} hour(s)</span> will shift the mandatory 1-hour sanitization buffer to finish later. Ensure the cleaning crew is alerted and that no subsequent morning booking has setup conflict.
                </div>
              </div>
            </div>

            {/* Giant Submit Touch Button */}
            <button
              type="submit"
              disabled={submitting || !currentBooking}
              className="w-full min-h-[64px] sm:min-h-[70px] px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 active:scale-[0.99] text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Send className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-extrabold tracking-tight">
                  {submitting ? 'DISPATCHING TO MANAGEMENT...' : `DISPATCH +${requestedHours} HR EXTENSION (Rs. ${Number(estimatedTotalCost || 0).toLocaleString()})`}
                </span>
                <span className="text-[11px] sm:text-xs text-amber-100 font-medium">
                  Instant ping forwarded to Event Manager & Admin approval consoles
                </span>
              </div>
            </button>
          </form>
        </div>

        {/* Right Column (5 cols): Live Escalation Stream & Manager Approval Pipeline */}
        <div className="lg:col-span-5 bg-slate-800/60 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-slate-700/50 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                    Live Escalation Stream
                  </h3>
                  <span className="text-xs text-slate-400">Real-time status synced with Admin/Manager</span>
                </div>
              </div>
              <button
                type="button"
                onClick={loadData}
                title="Refresh requests"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {bookingRequests.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-700 flex flex-col items-center justify-center gap-2">
                <Clock className="w-8 h-8 text-slate-500" />
                <span className="text-sm font-bold text-slate-300">No Overtime Requests for this Session</span>
                <span className="text-xs text-slate-500">
                  Event is currently operating within scheduled timetable.
                </span>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {bookingRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      req.status === 'Approved'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : req.status === 'Rejected'
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : 'bg-amber-500/10 border-amber-500/30 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-white font-mono">
                          +{req.requestedHours} hr(s)
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          (Rs. {Number(req.estimatedCharges || 0).toLocaleString()})
                        </span>
                      </div>

                      {/* Status Chip */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          req.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : req.status === 'Rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        }`}
                      >
                        {req.status === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {req.status === 'Rejected' && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                        {req.status === 'Pending' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                        {req.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {req.reason || 'Operational delay requested by floor team'}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/50 pt-2.5">
                      <span>Ref: {req.bookingRef}</span>
                      <span>
                        {req.timestamp ? new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Just now'}
                      </span>
                    </div>

                    {/* Manager / Admin Inline 1-Tap Action (Direct Approval Test) */}
                    {req.status === 'Pending' && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(req.id)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve (Add to Bill)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(req.id)}
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 border border-slate-700 font-bold text-xs transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Summary Footnote */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-700/50 text-xs text-slate-400 space-y-1">
            <div className="flex items-center justify-between font-bold text-slate-300">
              <span>Automatic Protocol:</span>
              <span className="text-emerald-400">Audit Logged</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every overtime request is permanently logged in the system audit trail with user timestamp, hall allocation, and calculated financial liability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
