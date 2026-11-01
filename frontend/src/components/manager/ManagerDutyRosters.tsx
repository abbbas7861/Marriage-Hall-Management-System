import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Utensils,
  Search,
  Filter,
  CalendarDays,
  Building2,
  Clock,
  Printer,
  Trash2,
  Edit2,
  AlertCircle,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { Booking } from '../../types';
import { bookingsApi, workforceApi, rostersApi, DutyRosterItem } from '../../api/client';
import { formatTo12Hour } from '../../utils/timeFormat';

const TEAM_ROLES = [
  { id: 'All', label: 'All Teams' },
  { id: 'Waiters', label: 'Waiters', icon: Users, color: 'sky' },
  { id: 'Kitchen Team', label: 'Kitchen Team', icon: Utensils, color: 'emerald' },
  { id: 'Decoration Crew', label: 'Decoration Crew', icon: Sparkles, color: 'amber' },
  { id: 'Cleaners', label: 'Cleaners', icon: RotateCcw, color: 'teal' },
  { id: 'Helpers', label: 'Helpers', icon: Users, color: 'slate' },
  { id: 'Stage & Sound', label: 'Stage & Sound', icon: Sparkles, color: 'purple' },
];

const STANDARD_CREW_TEMPLATES = [
  { role: 'Waiters', name: 'Kashif Ali', notes: 'Head Floor Captain' },
  { role: 'Waiters', name: 'Muhammad Bilal', notes: 'Buffet line supervisor' },
  { role: 'Waiters', name: 'Zeeshan Tariq', notes: 'VIP Table service' },
  { role: 'Waiters', name: 'Danish Rao', notes: 'Family section steward' },
  { role: 'Kitchen Team', name: 'Chef Rashid Mehmood', notes: 'Chafing dish heating & live BBQ' },
  { role: 'Kitchen Team', name: 'Amir Sohail', notes: 'Rice & naan dispatch station' },
  { role: 'Decoration Crew', name: 'Noman Shah', notes: 'Stage lighting & ambient LED check' },
  { role: 'Cleaners', name: 'Ghulam Abbas', notes: 'Restroom sanitization & table clearing' },
  { role: 'Cleaners', name: 'Imran Jameel', notes: 'Rapid spill response' },
  { role: 'Helpers', name: 'Farhan Akhtar', notes: 'Water bottle & glassware replenishment' },
];

interface ManagerDutyRostersProps {
  initialBooking?: Booking | null;
}

export const ManagerDutyRosters: React.FC<ManagerDutyRostersProps> = ({ initialBooking }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingRef, setSelectedBookingRef] = useState<string>(initialBooking?.bookingRef || '');
  const [rosterItems, setRosterItems] = useState<DutyRosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter state
  const [selectedTeam, setSelectedTeam] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formStaffName, setFormStaffName] = useState('');
  const [formTeamRole, setFormTeamRole] = useState('Waiters');
  const [formShiftStatus, setFormShiftStatus] = useState<'Present' | 'Absent' | 'Replaced'>('Present');
  const [formReplacementName, setFormReplacementName] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Bookings for dropdown
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const data = await bookingsApi.list();
        const activeList = Array.isArray(data) ? data : [];
        setBookings(activeList);

        if (!selectedBookingRef && activeList.length > 0) {
          setSelectedBookingRef(activeList[0].bookingRef);
        }
      } catch (err) {
        console.error('Failed to load bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Load Roster for selected event
  const loadRoster = async (ref: string) => {
    if (!ref) return;
    try {
      setLoading(true);
      const items = await rostersApi.list(ref);
      setRosterItems(items);
    } catch (err) {
      console.error('Failed to load roster:', err);
      setRosterItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBookingRef) {
      loadRoster(selectedBookingRef);
    }
  }, [selectedBookingRef]);

  const activeBooking = useMemo(() => {
    return bookings.find((b) => b.bookingRef === selectedBookingRef) || null;
  }, [bookings, selectedBookingRef]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return rosterItems.filter((item) => {
      if (selectedTeam !== 'All' && item.teamRole !== selectedTeam) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.staffName.toLowerCase().includes(q);
        const matchNotes = item.notes?.toLowerCase().includes(q);
        const matchRep = item.replacementName?.toLowerCase().includes(q);
        if (!matchName && !matchNotes && !matchRep) return false;
      }
      return true;
    });
  }, [rosterItems, selectedTeam, searchQuery]);

  // Metrics
  const totalCount = rosterItems.length;
  const presentCount = rosterItems.filter((r) => r.shiftStatus === 'Present').length;
  const absentCount = rosterItems.filter((r) => r.shiftStatus === 'Absent').length;
  const replacedCount = rosterItems.filter((r) => r.shiftStatus === 'Replaced').length;
  const readinessPercentage = totalCount > 0 ? Math.round(((presentCount + replacedCount) / totalCount) * 100) : 0;

  // Toggle Attendance
  const handleUpdateStatus = async (item: DutyRosterItem, newStatus: 'Present' | 'Absent' | 'Replaced') => {
    let repName = item.replacementName || '';
    if (newStatus === 'Replaced' && !repName) {
      const prompted = window.prompt(`Enter replacement personnel name for ${item.staffName}:`);
      if (prompted) repName = prompted;
    }

    try {
      const updated = await rostersApi.update(item.id, {
        shiftStatus: newStatus,
        replacementName: newStatus === 'Replaced' ? repName : '',
      });
      setRosterItems((prev) => prev.map((r) => (r.id === item.id ? updated : r)));
      showToast(`${item.staffName} marked as ${newStatus}.`);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      showToast(err?.message || 'Error updating attendance');
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this event duty roster?`)) return;
    try {
      await rostersApi.delete(id);
      setRosterItems((prev) => prev.filter((r) => r.id !== id));
      showToast(`${name} removed from roster.`);
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleSaveStaffAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStaffName.trim()) {
      alert('Please enter staff personnel name.');
      return;
    }
    if (!selectedBookingRef) {
      alert('Please select an active event first.');
      return;
    }

    try {
      const created = await rostersApi.create({
        eventRef: selectedBookingRef,
        staffName: formStaffName.trim(),
        teamRole: formTeamRole,
        shiftStatus: formShiftStatus,
        replacementName: formShiftStatus === 'Replaced' ? formReplacementName.trim() : '',
        notes: formNotes.trim(),
      });
      setRosterItems((prev) => [...prev, created]);
      setIsModalOpen(false);
      setFormStaffName('');
      setFormNotes('');
      setFormReplacementName('');
      showToast(`Assigned ${created.staffName} to ${created.teamRole}.`);
    } catch (err: any) {
      console.error('Failed to save duty roster item:', err);
      alert(err?.message || 'Failed to assign personnel');
    }
  };

  // Quick Auto-Deploy
  const handleAutoDeployCrew = async () => {
    if (!selectedBookingRef) return;
    if (rosterItems.length > 0) {
      if (!window.confirm('This event already has roster personnel. Append standard 10-person banquet crew?')) {
        return;
      }
    }

    try {
      setLoading(true);
      const promises = STANDARD_CREW_TEMPLATES.map((t) =>
        rostersApi.create({
          eventRef: selectedBookingRef,
          staffName: t.name,
          teamRole: t.role,
          shiftStatus: 'Present',
          notes: t.notes,
        })
      );
      const createdItems = await Promise.all(promises);
      setRosterItems((prev) => [...prev, ...createdItems]);
      showToast(`Auto-deployed ${createdItems.length} crew personnel for [${selectedBookingRef}].`);
    } catch (err: any) {
      console.error('Failed to auto-deploy crew:', err);
      showToast(err?.message || 'Error deploying crew');
    } finally {
      setLoading(false);
    }
  };

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
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[11px] font-bold uppercase tracking-wider">
              Task 3.2
            </span>
            <span className="text-xs text-slate-400 font-medium">Floor Staff Operations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
            Team Coordination &amp; Duty Rosters
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Allocate service crews, track real-time shift attendance, and dispatch emergency personnel replacements.
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
                  [{b.bookingRef}] {b.customerName} • {b.hallName} ({b.date})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleAutoDeployCrew}
              disabled={loading || !selectedBookingRef}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-700" />
              <span>Auto-Deploy Crew</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={!selectedBookingRef}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Assign Staff</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selected Event Context Pill */}
      {activeBooking && (
        <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-teal-700" />
              <strong className="text-slate-900">{activeBooking.hallName}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-teal-700" />
              <span className="font-mono text-slate-800 font-semibold">{activeBooking.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-700" />
              <span className="font-mono text-slate-800 font-semibold">{formatTo12Hour(activeBooking.time || activeBooking.slot)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-700" />
              <span className="text-slate-700 font-medium">{activeBooking.guestCount || 350} Expected Guests</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Function:</span>
            <span className="px-2 py-0.5 rounded-full bg-white border border-teal-200 text-teal-900 font-bold text-[11px]">
              {activeBooking.eventType}
            </span>
          </div>
        </div>
      )}

      {/* Roster Attendance KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Crew
          </span>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {totalCount}
          </div>
          <span className="text-[10px] text-slate-500">Personnel scheduled</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Present
          </span>
          <div className="text-xl font-bold text-emerald-700 mt-1 font-mono">
            {presentCount}
          </div>
          <span className="text-[10px] text-emerald-600">On duty checked-in</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">
            Absent
          </span>
          <div className="text-xl font-bold text-rose-600 mt-1 font-mono">
            {absentCount}
          </div>
          <span className="text-[10px] text-rose-500">Unaccounted</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            Replaced
          </span>
          <div className="text-xl font-bold text-amber-700 mt-1 font-mono">
            {replacedCount}
          </div>
          <span className="text-[10px] text-amber-600">Relief dispatched</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
            Floor Readiness
          </span>
          <div className="text-xl font-bold text-teal-800 mt-1 font-mono">
            {readinessPercentage}%
          </div>
          <span className="text-[10px] text-teal-700">Staffing adequacy</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Team Role Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {TEAM_ROLES.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => setSelectedTeam(team.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedTeam === team.id
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {team.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff, notes..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Personnel Name</th>
                <th className="py-3 px-4">Assigned Team Role</th>
                <th className="py-3 px-4">Shift Attendance</th>
                <th className="py-3 px-4">Shift Notes / Station</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No Crew Assigned</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click 'Auto-Deploy Crew' or 'Assign Staff' to schedule team rosters for this event.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRoster.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-[11px]">
                            {item.staffName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div>{item.staffName}</div>
                            {item.replacementName && (
                              <div className="text-[10px] text-amber-700 font-normal">
                                Replaced by: <strong>{item.replacementName}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {item.teamRole}
                        </span>
                      </td>

                      {/* 1-Click Attendance Segmented Controller */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item, 'Present')}
                            className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                              item.shiftStatus === 'Present'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-emerald-700'
                            }`}
                          >
                            Present
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item, 'Absent')}
                            className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                              item.shiftStatus === 'Absent'
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-rose-700'
                            }`}
                          >
                            Absent
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item, 'Replaced')}
                            className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                              item.shiftStatus === 'Replaced'
                                ? 'bg-amber-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-amber-700'
                            }`}
                          >
                            Replaced
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {item.notes || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.staffName)}
                          title="Remove from roster"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                  Assign Staff to Event Roster
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Schedule personnel for [{selectedBookingRef}]
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

            <form onSubmit={handleSaveStaffAssignment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Personnel Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formStaffName}
                  onChange={(e) => setFormStaffName(e.target.value)}
                  placeholder="e.g., Kashif Ali"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Team Role
                </label>
                <select
                  value={formTeamRole}
                  onChange={(e) => setFormTeamRole(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700"
                >
                  <option value="Waiters">Waiters</option>
                  <option value="Kitchen Team">Kitchen Team</option>
                  <option value="Decoration Crew">Decoration Crew</option>
                  <option value="Cleaners">Cleaners</option>
                  <option value="Helpers">Helpers</option>
                  <option value="Stage & Sound">Stage &amp; Sound</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Attendance Status
                </label>
                <select
                  value={formShiftStatus}
                  onChange={(e) => setFormShiftStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Replaced">Replaced</option>
                </select>
              </div>

              {formShiftStatus === 'Replaced' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Replacement Staff Name
                  </label>
                  <input
                    type="text"
                    value={formReplacementName}
                    onChange={(e) => setFormReplacementName(e.target.value)}
                    placeholder="e.g., Danish Rao"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Station / Shift Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g., Head Table VIP service, Live Karahi supervision"
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

