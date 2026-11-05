import React, { useState } from 'react';
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

export const FloorStaffTabletView: React.FC = () => {
  // Modal State for Extra Time Request
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [extraHours, setExtraHours] = useState('');
  const [reason, setReason] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraHours) return;

    setRequestSent(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setExtraHours('');
      setReason('');
      setTimeout(() => setRequestSent(false), 4000);
    }, 1200);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 select-none animate-in fade-in duration-200 text-slate-100">
      {/* Top Bar (Tablet-Optimized) */}
      <div className="w-full bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Operational Badges & Live Status */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold text-xs uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <span>FLOOR STAFF - READ ONLY</span>
          </span>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="tracking-wide uppercase font-mono font-bold">Live Event</span>
          </div>
        </div>

        {/* Right: Hall Name & Event Date with structural placeholders */}
        <div className="flex items-center gap-4 text-xs sm:text-sm font-medium flex-wrap">
          <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700">
            <Building2 className="w-4 h-4 text-teal-400" />
            <span className="text-slate-400 font-sans">Hall:</span>
            <span className="font-bold text-white font-mono">[Hall Name]</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700">
            <Calendar className="w-4 h-4 text-teal-400" />
            <span className="text-slate-400 font-sans">Date:</span>
            <span className="font-bold text-white font-mono">[--/--/----]</span>
          </div>
        </div>
      </div>

      {/* Temporary Success Toast when Extra Time is requested */}
      {requestSent && (
        <div className="p-4 rounded-xl bg-slate-800 border border-teal-500/40 text-teal-300 flex items-center justify-between gap-3 shadow-2xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-xs sm:text-sm text-white">Extra Time Request Dispatched</span>
              <span className="text-xs text-teal-300">
                Notice forwarded to Operations Console / Admin for review and approval.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 font-mono text-[11px] font-bold border border-teal-500/30">
            STATUS: QUEUED
          </span>
        </div>
      )}

      {/* Main Content Sections (2-Column Tablet Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Column: Event & Timing */}
        <div className="flex flex-col gap-6">
          {/* 1. Event Details Card */}
          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white font-['Plus_Jakarta_Sans']">
                  Event Details
                </h3>
              </div>
              <span className="text-[11px] font-mono text-teal-400 font-bold bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">SESSION: ACTIVE</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Customer Name */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/60 flex flex-col">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Customer Name
                </span>
                <span className="text-sm font-bold text-white font-mono truncate">
                  [Customer Name]
                </span>
              </div>

              {/* Event Type */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/60 flex flex-col">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Event Type
                </span>
                <span className="text-sm font-bold text-white font-mono truncate">
                  [Event Type]
                </span>
              </div>

              {/* Expected Guests */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/60 flex flex-col">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Expected Guests
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold font-mono text-teal-300">[--]</span>
                  <span className="text-[11px] text-slate-400">Seats</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Timing Card */}
          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white font-['Plus_Jakarta_Sans']">
                  Timing Schedule
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">HALL SLOT</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/60 flex flex-col">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Start Time
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                  [--:--]
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/60 flex flex-col">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  End Time
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                  [--:--]
                </span>
              </div>
            </div>
          </div>

          {/* 3. Seating Card */}
          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white font-['Plus_Jakarta_Sans']">
                  Seating Architecture
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">FLOOR LAYOUT</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/60 flex flex-col">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Arrangement Style
                </span>
                <span className="text-sm sm:text-base font-bold text-white font-mono truncate">
                  [Theater/Round Tables]
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/60 flex flex-col">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Total Tables
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                  [--]
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Menu & Actions */}
        <div className="flex flex-col gap-6 justify-between">
          {/* Menu Details Card */}
          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-5 sm:p-6 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Utensils className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white font-['Plus_Jakarta_Sans']">
                  Menu &amp; Catering Specifications
                </h3>
              </div>
              <span className="text-[11px] font-mono text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">KITCHEN SYNC</span>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              {/* Menu Package */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/60 flex flex-col">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Menu Package
                </span>
                <span className="text-base font-bold text-white font-mono">
                  [Package Name]
                </span>
              </div>

              {/* Special Instructions */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/60 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Special Instructions (Allergies / Dietary)
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Caution</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs sm:text-sm font-mono text-slate-300 min-h-[70px]">
                  [None]
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTON: Request Extra Time */}
          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-5 sm:p-6 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Venue Overtime Escalation
              </span>
              <span className="text-[11px] text-teal-400 font-mono">HEAD OFFICE LINK</span>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full min-h-[64px] sm:min-h-[72px] px-6 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 active:scale-[0.99] text-white shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                <Clock4 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-base sm:text-lg font-bold tracking-tight leading-snug font-['Plus_Jakarta_Sans']">
                  Request Extra Time
                </span>
                <span className="text-[11px] sm:text-xs text-white/90 font-medium">
                  Dispatch operational delay notice to Head Office for extension authorization
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Extra Time Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 text-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Clock4 className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                  Request Extra Time Approval
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendRequest} className="p-6 flex flex-col gap-4">
              {/* Extra Hours Required */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
                  Extra Hours Required <span className="text-rose-400 font-bold">*</span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={extraHours}
                  onChange={(e) => setExtraHours(e.target.value)}
                  placeholder="[Enter Extra Hours, e.g. 1.5]"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-all"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
                  Reason
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="[Reason for delay]"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-all resize-none"
                />
              </div>

              {/* Info Text */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300 leading-relaxed font-medium">
                  This request will be sent to Head Office for approval. Charges will be applied upon approval.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 mt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer"
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
