import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Utensils,
  Building2,
  CalendarDays,
  Plus,
  Trash2,
  AlertCircle,
  Timer,
  Check,
  Zap,
} from 'lucide-react';
import { Booking } from '../../types';
import { bookingsApi, checklistsApi, EventChecklistItem } from '../../api/client';
import { formatTo12Hour, timeToMinutes } from '../../utils/timeFormat';

const DEFAULT_MILESTONES = [
  { phase: 'Pre-Event Setup', text: 'Hall HVAC / Air Conditioning switched on and cooled to 21°C' },
  { phase: 'Pre-Event Setup', text: 'Stage acoustic sound system, cordless microphones & ambient wash lights tested' },
  { phase: 'Pre-Event Setup', text: 'Executive Bridal Suite unlocked, cleaned, and amenities stocked' },
  { phase: 'Pre-Event Setup', text: 'Buffet chafing dishes filled with hot water and sternos lit' },
  { phase: 'Pre-Event Setup', text: 'Welcome drinks / Mocktail counter arranged in entry foyer' },
  { phase: 'During Event', text: 'Floor captain stationed at VIP reception area' },
  { phase: 'During Event', text: 'Appetizers & finger food dispatched to seated guests' },
  { phase: 'During Event', text: 'Buffet lines opened and lead waiter refill signaling active' },
  { phase: 'During Event', text: 'Family group photography on main stage in progress' },
  { phase: 'Post-Event / Wrap-up', text: 'Sound curfew adhered to; audio amplifiers powered down by contract end time' },
  { phase: 'Post-Event / Wrap-up', text: 'Linen, crockery, and chafing dishes cleared to dishwashing zone' },
  { phase: 'Post-Event / Wrap-up', text: 'Post-event damage inspection conducted with client representative' },
  { phase: 'Post-Event / Wrap-up', text: 'Hall handed over to cleaning crew for mandatory 1-hour turnover sanitization' },
];

interface ManagerLiveChecklistProps {
  initialBooking?: Booking | null;
}

export const ManagerLiveChecklist: React.FC<ManagerLiveChecklistProps> = ({ initialBooking }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingRef, setSelectedBookingRef] = useState<string>(initialBooking?.bookingRef || '');
  const [checklistItems, setChecklistItems] = useState<EventChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New item modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formPhase, setFormPhase] = useState<'Pre-Event Setup' | 'During Event' | 'Post-Event / Wrap-up'>('Pre-Event Setup');
  const [formTaskName, setFormTaskName] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Live Clock Tick
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial Data
  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);
        const data = await bookingsApi.list();
        const activeList = Array.isArray(data) ? data : [];
        setBookings(activeList);

        if (!selectedBookingRef && activeList.length > 0) {
          setSelectedBookingRef(activeList[0].bookingRef);
        }
      } catch (err) {
        console.error('Failed to load bookings for checklist:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  // Load Checklist
  const loadChecklist = async (ref: string) => {
    if (!ref) return;
    try {
      setLoading(true);
      const data = await checklistsApi.list(ref);
      setChecklistItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load checklist:', err);
      setChecklistItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBookingRef) {
      loadChecklist(selectedBookingRef);
    }
  }, [selectedBookingRef]);

  const activeBooking = useMemo(() => {
    return bookings.find((b) => b.bookingRef === selectedBookingRef) || null;
  }, [bookings, selectedBookingRef]);

  // Overtime & Curfew Computation
  const curfewInfo = useMemo(() => {
    if (!activeBooking) return null;

    const timeStr = activeBooking.time || activeBooking.slot || '07:00 PM – 11:30 PM';
    // Extract end time string
    let endMinutes = 23 * 60 + 30; // default 11:30 PM
    if (timeStr.includes('–') || timeStr.includes('-')) {
      const parts = timeStr.split(/[–-]/);
      if (parts.length >= 2) {
        const parsed = timeToMinutes(parts[1].trim());
        if (parsed !== null) endMinutes = parsed;
      }
    }

    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes() + currentTime.getSeconds() / 60;
    const diffMinutes = endMinutes - currentMinutes;

    const isOvertime = diffMinutes < 0;
    const overtimeHours = isOvertime ? Math.abs(diffMinutes) / 60 : 0;
    const hourlyRate = Number(activeBooking.ratePerHour || 25000);
    const estimatedSurcharge = Math.round(overtimeHours * hourlyRate);

    // Format display
    const absSeconds = Math.floor(Math.abs(diffMinutes) * 60);
    const hh = String(Math.floor(absSeconds / 3600)).padStart(2, '0');
    const mm = String(Math.floor((absSeconds % 3600) / 60)).padStart(2, '0');
    const ss = String(absSeconds % 60).padStart(2, '0');
    const formattedTimer = `${hh}:${mm}:${ss}`;

    return {
      isOvertime,
      diffMinutes,
      formattedTimer,
      overtimeHours: overtimeHours.toFixed(1),
      estimatedSurcharge,
      hourlyRate,
      endMinutes,
    };
  }, [activeBooking, currentTime]);

  // Checklist Progress
  const totalTasks = checklistItems.length;
  const completedTasks = checklistItems.filter((t) => t.isCompleted).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Toggle Task
  const handleToggle = async (item: EventChecklistItem) => {
    try {
      const updated = await checklistsApi.toggle(item.id, 'Event Manager');
      setChecklistItems((prev) => prev.map((t) => (t.id === item.id ? updated : t)));
      showToast(updated.isCompleted ? `Marked '${item.taskName}' as complete.` : `Unmarked '${item.taskName}'.`);
    } catch (err: any) {
      console.error('Failed to toggle task:', err);
      showToast(err?.message || 'Error updating task');
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    try {
      await checklistsApi.delete(id);
      setChecklistItems((prev) => prev.filter((t) => t.id !== id));
      showToast('Milestone removed.');
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Add Custom Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTaskName.trim() || !selectedBookingRef) return;

    try {
      const created = await checklistsApi.create({
        eventRef: selectedBookingRef,
        phase: formPhase,
        taskName: formTaskName.trim(),
        notes: formNotes.trim(),
        isCompleted: false,
      });
      setChecklistItems((prev) => [...prev, created]);
      setIsModalOpen(false);
      setFormTaskName('');
      setFormNotes('');
      showToast(`Added '${created.taskName}' to ${created.phase}.`);
    } catch (err: any) {
      console.error('Failed to add milestone:', err);
      alert(err?.message || 'Failed to add milestone');
    }
  };

  // Seed standard milestones if empty
  const handlePopulateStandardMilestones = async () => {
    if (!selectedBookingRef) return;
    try {
      setLoading(true);
      const promises = DEFAULT_MILESTONES.map((m) =>
        checklistsApi.create({
          eventRef: selectedBookingRef,
          phase: m.phase as any,
          taskName: m.text,
          isCompleted: false,
        })
      );
      const created = await Promise.all(promises);
      setChecklistItems((prev) => [...prev, ...created]);
      showToast(`Initialized standard ${created.length} banquet milestones.`);
    } catch (err: any) {
      console.error('Failed to populate milestones:', err);
      showToast(err?.message || 'Error loading milestones');
    } finally {
      setLoading(false);
    }
  };

  const phases: Array<'Pre-Event Setup' | 'During Event' | 'Post-Event / Wrap-up'> = [
    'Pre-Event Setup',
    'During Event',
    'Post-Event / Wrap-up',
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-teal-900 text-white rounded-xl shadow-xl text-xs font-semibold animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Event Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
              Task 3.4
            </span>
            <span className="text-xs text-slate-400 font-medium">Live Execution &amp; Curfew Watch</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
            Service Readiness &amp; Overtime Curfew Watch
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Live step-by-step service checklists, HVAC climate verification, and real-time overtime countdown alerts.
          </p>
        </div>

        {/* Event Selector Box */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-slate-600 mb-1">
              Select Active Event:
            </label>
            <select
              value={selectedBookingRef}
              onChange={(e) => setSelectedBookingRef(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700 min-w-[260px]"
            >
              {bookings.map((b) => (
                <option key={b.bookingRef} value={b.bookingRef}>
                  [{b.bookingRef}] {b.customerName} • {b.hallName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            {checklistItems.length === 0 && (
              <button
                type="button"
                onClick={handlePopulateStandardMilestones}
                disabled={loading || !selectedBookingRef}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                <span>Load Standard Protocol</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={!selectedBookingRef}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Milestone</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Curfew Watch & Overtime Alarm Banner */}
      {curfewInfo && (
        <div
          className={`p-5 rounded-2xl border transition-all shadow-md ${
            curfewInfo.isOvertime
              ? 'bg-rose-50 border-rose-400 text-rose-950 animate-pulse'
              : curfewInfo.diffMinutes < 30
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  curfewInfo.isOvertime
                    ? 'bg-rose-600 text-white'
                    : curfewInfo.diffMinutes < 30
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-700 text-white'
                }`}
              >
                <Timer className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                      curfewInfo.isOvertime
                        ? 'bg-rose-200 text-rose-900'
                        : curfewInfo.diffMinutes < 30
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-emerald-200 text-emerald-900'
                    }`}
                  >
                    {curfewInfo.isOvertime ? '🚨 OVERTIME ACTIVE' : 'TIMING / CURFEW CLOCK'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Scheduled End: {formatTo12Hour(activeBooking?.time || activeBooking?.slot)}
                  </span>
                </div>

                <h3 className="text-lg font-bold mt-0.5 font-['Plus_Jakarta_Sans']">
                  {curfewInfo.isOvertime
                    ? 'Contract Curfew Exceeded - Overtime Penalty Accumulating'
                    : curfewInfo.diffMinutes < 30
                    ? 'Curfew Approaching - Stage & Audio Wrap-up Urged'
                    : 'Event Running on Schedule'}
                </h3>

                <p className="text-xs opacity-90 mt-1 max-w-2xl leading-relaxed">
                  {curfewInfo.isOvertime
                    ? `Hall curfew was reached. Overtime rate of Rs. ${curfewInfo.hourlyRate.toLocaleString('en-PK')}/hr is being applied. This surcharge will be automatically deducted from the Security Deposit.`
                    : 'Strict 1-hour pre/post cleaning turnover protocol is active. Hall handover must conclude punctually to enable turnaround sanitization.'}
                </p>
              </div>
            </div>

            {/* Countdown / Overtime Clock Digits */}
            <div className="flex flex-col items-end">
              <div
                className={`text-3xl sm:text-4xl font-mono font-black tracking-tight px-4 py-2 rounded-xl shadow-xs ${
                  curfewInfo.isOvertime
                    ? 'bg-rose-600 text-white'
                    : curfewInfo.diffMinutes < 30
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-700 text-white'
                }`}
              >
                {curfewInfo.isOvertime ? `+${curfewInfo.formattedTimer}` : curfewInfo.formattedTimer}
              </div>
              <span className="text-[11px] font-bold mt-1 opacity-80 uppercase tracking-wider">
                {curfewInfo.isOvertime ? 'Overtime Elapsed' : 'Time Remaining to Curfew'}
              </span>
              {curfewInfo.isOvertime && (
                <div className="text-xs font-mono font-bold text-rose-900 mt-1">
                  Est. Surcharge: Rs. {curfewInfo.estimatedSurcharge.toLocaleString('en-PK')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overall Milestone Progress Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Service Execution Progress
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-teal-800">
            {completedTasks} of {totalTasks} Milestones Verified ({progressPercent}%)
          </span>
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Categorized Milestone Lists */}
      <div className="space-y-6">
        {phases.map((phase) => {
          const phaseItems = checklistItems.filter((i) => i.phase === phase);
          const phaseDone = phaseItems.filter((i) => i.isCompleted).length;

          return (
            <div key={phase} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        phase === 'Pre-Event Setup'
                          ? 'bg-amber-500'
                          : phase === 'During Event'
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span>{phase}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {phase === 'Pre-Event Setup'
                      ? 'Climate control, audio-visual check, bridal room, and buffet heating'
                      : phase === 'During Event'
                      ? 'VIP reception, food dispatch, live replenishment, and photography'
                      : 'Curfew adherence, dish clearance, damage inspection, and sanitization'}
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-mono text-xs font-bold shadow-2xs">
                  {phaseDone} / {phaseItems.length} Verified
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {phaseItems.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No tasks configured for this phase.
                  </div>
                ) : (
                  phaseItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggle(item)}
                      className={`p-4 flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                        item.isCompleted ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            item.isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white hover:border-teal-600'
                          }`}
                        >
                          {item.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div>
                          <p
                            className={`text-xs font-semibold ${
                              item.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {item.taskName}
                          </p>
                          {item.notes && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{item.notes}</p>
                          )}
                          {item.completedBy && item.isCompleted && (
                            <span className="text-[10px] text-emerald-700 font-mono mt-1 block">
                              ✓ Verified by {item.completedBy}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(item.id);
                        }}
                        className="text-slate-300 hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                  Add Checklist Milestone
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Configure custom task for [{selectedBookingRef}]
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Phase
                </label>
                <select
                  value={formPhase}
                  onChange={(e) => setFormPhase(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700"
                >
                  <option value="Pre-Event Setup">Pre-Event Setup</option>
                  <option value="During Event">During Event</option>
                  <option value="Post-Event / Wrap-up">Post-Event / Wrap-up</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Milestone Task Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTaskName}
                  onChange={(e) => setFormTaskName(e.target.value)}
                  placeholder="e.g., Turn on VIP chandeliers, Test smoke machines"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Instructions / Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g., Coordinate with sound tech at 07:15 PM"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-xs cursor-pointer"
                >
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

