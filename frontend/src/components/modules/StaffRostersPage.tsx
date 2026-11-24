import React, { useMemo, useState, useEffect } from 'react';
import {
  AlertCircle,
  ClipboardList,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import { SEED_ASSIGNED_EVENTS, SEED_STAFF_ROSTER } from '../../data/seedData';
import { bookingsApi, staffApi } from '../../api/client';

export type StaffRole = 'Waiter' | 'Cleaner' | 'Helper' | 'Supervisor';
export type ShiftOption = 'Morning' | 'Evening' | 'Full Day';
export type AttendanceStatus = 'Present' | 'Absent' | 'Replaced';

export interface RosterAssignment {
  id: string;
  staffName: string;
  role: StaffRole;
  assignedArea: string;
  shift: ShiftOption;
  shiftTime: string;
  status: AttendanceStatus;
}

const ASSIGNABLE_ROLES: Array<Exclude<StaffRole, 'Supervisor'>> = [
  'Waiter',
  'Cleaner',
  'Helper',
];

const SHIFT_OPTIONS: ShiftOption[] = ['Morning', 'Evening', 'Full Day'];

const SHIFT_TIME_MAP: Record<ShiftOption, string> = {
  Morning: '08:00 AM - 04:00 PM',
  Evening: '04:00 PM - 12:00 AM',
  'Full Day': '09:00 AM - 11:00 PM',
};

const ROLE_BADGE_STYLES: Record<StaffRole, string> = {
  Waiter: 'bg-teal-50 text-teal-800 border-teal-200',
  Cleaner: 'bg-blue-50 text-blue-800 border-blue-200',
  Helper: 'bg-amber-50 text-amber-800 border-amber-200',
  Supervisor: 'bg-purple-50 text-purple-800 border-purple-200',
};

const STATUS_BADGE_STYLES: Record<AttendanceStatus, string> = {
  Present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Absent: 'bg-red-50 text-red-700 border-red-200',
  Replaced: 'bg-amber-50 text-amber-800 border-amber-200',
};

export const StaffRostersPage: React.FC = () => {
  const [activeEvents, setActiveEvents] = useState<string[]>([]);
  const [availableStaff, setAvailableStaff] = useState<string[]>([
    'Imran Ali',
    'Waqas Ahmed',
    'Nadeem Akram',
    'Sajid Hussain',
    'Faisal Raza',
    'Tariq Mehmood',
  ]);
  const [roster, setRoster] = useState<RosterAssignment[]>(SEED_STAFF_ROSTER);

  useEffect(() => {
    bookingsApi
      .list()
      .then((data) => {
        if (data && data.length > 0) {
          const activeOnly = data.filter((b: any) => {
            if (b.status === 'Cancelled' || b.status === 'Rejected' || b.status === 'Completed') return false;
            const op = (b.operationalStatus || b.operational_status || '').toLowerCase();
            if (op.includes('concluded') || op.includes('completed') || op.includes('closed')) return false;
            return true;
          });
          const mapped = activeOnly.map((b: any) => `${b.customerName || b.bookingRef} (${b.hallName})`);
          setActiveEvents(mapped);
        } else {
          setActiveEvents([]);
        }
      })
      .catch(() => {});

    staffApi
      .list()
      .then((data) => {
        if (data && data.length > 0) {
          const names = data.map((s: any) => s.name || s.fullName).filter(Boolean);
          if (names.length > 0) {
            setAvailableStaff(names);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Controls bar state
  const [selectedEvent, setSelectedEvent] = useState('');
  const [rosterDate, setRosterDate] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [staffMember, setStaffMember] = useState('');
  const [role, setRole] = useState<Exclude<StaffRole, 'Supervisor'>>('Waiter');
  const [assignedArea, setAssignedArea] = useState('');
  const [shift, setShift] = useState<ShiftOption>('Evening');

  const kpiMetrics = useMemo(() => {
    if (roster.length === 0) {
      return {
        totalOnDuty: '[--]',
        waitersAssigned: '[--]',
        helpersCleaners: '[--]',
        unassignedStaff: '[--]',
      };
    }

    const waiters = roster.filter((r) => r.role === 'Waiter').length;
    const helpersCleaners = roster.filter(
      (r) => r.role === 'Helper' || r.role === 'Cleaner'
    ).length;
    const unassigned = Math.max(0, availableStaff.length - roster.length);

    return {
      totalOnDuty: String(roster.length),
      waitersAssigned: String(waiters),
      helpersCleaners: String(helpersCleaners),
      unassignedStaff: availableStaff.length === 0 ? '[--]' : String(unassigned),
    };
  }, [roster, availableStaff]);

  const openAssignModal = () => {
    setEditingId(null);
    setStaffMember('');
    setRole('Waiter');
    setAssignedArea('');
    setShift('Evening');
    setIsModalOpen(true);
  };

  const openEditModal = (entry: RosterAssignment) => {
    setEditingId(entry.id);
    setStaffMember(entry.staffName);
    setRole(entry.role === 'Supervisor' ? 'Waiter' : entry.role);
    setAssignedArea(entry.assignedArea);
    setShift(entry.shift);
    setIsModalOpen(true);
  };

  const handleDeleteAssignment = (id: string) => {
    setRoster((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffMember || !assignedArea.trim()) return;

    if (editingId) {
      setRoster((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                staffName: staffMember,
                role,
                assignedArea: assignedArea.trim(),
                shift,
                shiftTime: SHIFT_TIME_MAP[shift],
              }
            : item
        )
      );
    } else {
      const created: RosterAssignment = {
        id: `RST-${Date.now().toString().slice(-5)}`,
        staffName: staffMember,
        role,
        assignedArea: assignedArea.trim(),
        shift,
        shiftTime: SHIFT_TIME_MAP[shift],
        status: 'Present',
      };
      setRoster((prev) => [created, ...prev]);
    }

    setIsModalOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Header */}
      <div>
        <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
          Staff Rosters &amp; Duty Allocation
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Assign waiters, cleaners, and helpers to active events.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <select
            aria-label="Select Active Event"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 sm:min-w-[220px]"
          >
            <option value="">Select Active Event</option>
            {activeEvents.map((ev) => (
              <option key={ev} value={ev}>
                {ev}
              </option>
            ))}
          </select>

          <input
            type="date"
            aria-label="Roster Date"
            value={rosterDate}
            onChange={(e) => setRosterDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-mono text-slate-700 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={availableStaff.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium text-slate-700 transition-colors cursor-pointer"
          >
            <Wand2 className="w-4 h-4 text-slate-500" />
            Auto-Allocate Staff
          </button>

          <button
            type="button"
            onClick={openAssignModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Assign Staff
          </button>
        </div>
      </div>

      {/* KPI Metrics Bar (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Staff On Duty
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.totalOnDuty}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Waiters Assigned
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.waitersAssigned}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Helpers/Cleaners
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.helpersCleaners}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Unassigned Staff
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.unassignedStaff}
          </p>
        </div>
      </div>

      {/* Main Section: Duty Roster Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Staff Name
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Role
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Assigned Area
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Shift Time
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roster.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 px-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-4">
                        <ClipboardList className="w-7 h-7 text-teal-700" />
                      </div>
                      <p className="text-base font-semibold text-slate-900">
                        No staff assigned to this event yet.
                      </p>
                      <button
                        type="button"
                        onClick={openAssignModal}
                        className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Assign Staff
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                roster.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-5 text-sm font-semibold text-slate-900">
                      {entry.staffName}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE_STYLES[entry.role]}`}
                      >
                        {entry.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-slate-700">
                      {entry.assignedArea}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-mono tabular-nums text-slate-600">
                      {entry.shiftTime}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_STYLES[entry.status]}`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(entry)}
                          aria-label={`Edit ${entry.staffName}`}
                          className="p-2 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAssignment(entry.id)}
                          aria-label={`Delete ${entry.staffName}`}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Assign Staff Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-staff-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3
                id="assign-staff-modal-title"
                className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900"
              >
                {editingId ? 'Edit Staff Assignment' : 'Assign Staff'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-5 space-y-4">
              <div>
                <label
                  htmlFor="roster-staff-member"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Select Staff Member
                </label>
                <select
                  id="roster-staff-member"
                  required
                  value={staffMember}
                  onChange={(e) => setStaffMember(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                >
                  <option value="">[--]</option>
                  {availableStaff.map((member) => (
                    <option key={member} value={member}>
                      {member}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="roster-role"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Select Role
                  </label>
                  <select
                    id="roster-role"
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as Exclude<StaffRole, 'Supervisor'>)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  >
                    {ASSIGNABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="roster-shift"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Shift
                  </label>
                  <select
                    id="roster-shift"
                    value={shift}
                    onChange={(e) => setShift(e.target.value as ShiftOption)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  >
                    {SHIFT_OPTIONS.map((sh) => (
                      <option key={sh} value={sh}>
                        {sh}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="roster-area"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Assigned Area
                </label>
                <input
                  id="roster-area"
                  type="text"
                  required
                  value={assignedArea}
                  onChange={(e) => setAssignedArea(e.target.value)}
                  placeholder="[--]"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
