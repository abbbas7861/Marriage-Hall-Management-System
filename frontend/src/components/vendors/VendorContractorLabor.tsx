import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Printer,
  ChevronRight,
  Building2,
  Shield,
  Layers,
  X,
  Send,
} from 'lucide-react';
import { ContractorLaborShift, Booking, VendorPartner } from '../../types';
import { contractorLaborApi, bookingsApi, workforceApi } from '../../api/client';
import { formatTo12Hour } from '../../utils/timeFormat';

interface VendorContractorLaborProps {
  onNavigateToTab?: (tabId: string) => void;
}

export const VendorContractorLabor: React.FC<VendorContractorLaborProps> = ({
  onNavigateToTab,
}) => {
  const [shifts, setShifts] = useState<ContractorLaborShift[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [contractorVendors, setContractorVendors] = useState<VendorPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherShift, setVoucherShift] = useState<ContractorLaborShift | null>(null);

  // Form State
  const [formBookingRef, setFormBookingRef] = useState('');
  const [formEventDate, setFormEventDate] = useState('');
  const [formContractorName, setFormContractorName] = useState('Al-Karam Hospitality Workforce');
  const [formMaleCount, setFormMaleCount] = useState(12);
  const [formFemaleCount, setFormFemaleCount] = useState(6);
  const [formMaleRate, setFormMaleRate] = useState(2500);
  const [formFemaleRate, setFormFemaleRate] = useState(2500);
  const [formOvertimeHours, setFormOvertimeHours] = useState(1.0);
  const [formOvertimeRate, setFormOvertimeRate] = useState(400);
  const [formSupervisorName, setFormSupervisorName] = useState('Master Rashid');
  const [formShiftType, setFormShiftType] = useState('Evening (05:00 PM – 12:00 AM)');
  const [formNotes, setFormNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [shiftsData, bookingsData, vendorsData] = await Promise.all([
        contractorLaborApi.list(),
        bookingsApi.list(),
        workforceApi.listVendors(),
      ]);
      setShifts(shiftsData);
      setBookings(bookingsData);
      const laborVendors = vendorsData.filter(
        (v) => v.category === 'Outsourced Labor' || v.category === 'Valet & Security'
      );
      setContractorVendors(laborVendors);

      if (bookingsData.length > 0) {
        setFormBookingRef(bookingsData[0].bookingRef);
        setFormEventDate(bookingsData[0].date);
      }
    } catch (err) {
      console.error('Failed to load contractor data:', err);
      showToast('Error loading contractor shifts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Form computed values
  const formTotalHeadcount = formMaleCount + formFemaleCount;
  const formBaseMale = formMaleCount * formMaleRate;
  const formBaseFemale = formFemaleCount * formFemaleRate;
  const formOvertimeTotal = formTotalHeadcount * formOvertimeHours * formOvertimeRate;
  const formComputedTotal = formBaseMale + formBaseFemale + formOvertimeTotal;

  const handleBookingChange = (ref: string) => {
    setFormBookingRef(ref);
    const b = bookings.find((item) => item.bookingRef === ref);
    if (b) {
      setFormEventDate(b.date);
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await contractorLaborApi.create({
        bookingRef: formBookingRef,
        eventDate: formEventDate,
        contractorName: formContractorName,
        maleCount: formMaleCount,
        femaleCount: formFemaleCount,
        maleRatePerShift: formMaleRate,
        femaleRatePerShift: formFemaleRate,
        overtimeHours: formOvertimeHours,
        overtimeRatePerHour: formOvertimeRate,
        supervisorName: formSupervisorName,
        shiftType: formShiftType,
        notes: formNotes,
        status: 'Scheduled',
      });
      setShifts((prev) => [created, ...prev]);
      setIsModalOpen(false);
      showToast(`Labor shift for ${created.contractorName} (${created.totalHeadcount} staff) scheduled!`);
    } catch (err) {
      console.error('Failed to create shift:', err);
      showToast('Error recording contractor shift.');
    }
  };

  const handlePostToExpenses = async (shift: ContractorLaborShift) => {
    try {
      const res = await contractorLaborApi.postToExpenses(shift.id);
      setShifts((prev) =>
        prev.map((s) => (s.id === shift.id ? { ...s, expenseRef: res.expenseRef, status: 'Completed' } : s))
      );
      showToast(`Wage of Rs. ${Number(shift.totalCost || 0).toLocaleString()} posted to Expense Ledger (${res.expenseRef})!`);
    } catch (err) {
      console.error('Failed to post expense:', err);
      showToast('Error posting labor cost to expenses.');
    }
  };

  const handlePrintVoucher = (shift: ContractorLaborShift) => {
    setVoucherShift(shift);
    setIsVoucherModalOpen(true);
  };

  // Filter shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = s.bookingRef.toLowerCase().includes(q);
        const matchesContractor = s.contractorName.toLowerCase().includes(q);
        const matchesSup = s.supervisorName?.toLowerCase().includes(q);
        return matchesRef || matchesContractor || matchesSup;
      }
      return true;
    });
  }, [shifts, statusFilter, searchQuery]);

  // Aggregates
  const stats = useMemo(() => {
    const totalShifts = shifts.length;
    const totalStaff = shifts.reduce((acc, s) => acc + (s.totalHeadcount || 0), 0);
    const totalWages = shifts.reduce((acc, s) => acc + (s.totalCost || 0), 0);
    const completedWages = shifts
      .filter((s) => s.status === 'Completed' || s.status === 'Settled')
      .reduce((acc, s) => acc + (s.totalCost || 0), 0);
    return { totalShifts, totalStaff, totalWages, completedWages };
  }, [shifts]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 select-none animate-in fade-in duration-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900 border border-teal-500/40 text-white rounded-2xl shadow-2xl animate-in slide-in-from-top-3">
          <Sparkles className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-[#131b2e] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-700/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-teal-500/15 via-emerald-500/10 to-transparent rounded-full blur-3xl -z-10" />

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Shift Attendance &amp; Headcount</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans'] text-white">
            Outside Labor &amp; Contractor Management
          </h1>
          <p className="text-sm text-slate-300">
            Track external staffing contractors per event: male count, female count, shift rates, overtime hours, and automated wage bill posting to event expense ledger.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-600 active:scale-95 text-slate-950 font-extrabold text-sm shadow-lg shadow-teal-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Schedule Labor Shift</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-5 border border-slate-700/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Contractor Shifts</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{stats.totalShifts} Shifts</span>
            <span className="text-[11px] text-teal-400 font-semibold mt-0.5 block">Tagged to Events</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-5 border border-slate-700/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Outside Staff</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{stats.totalStaff} Headcount</span>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">Male &amp; Female Crew</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-5 border border-slate-700/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Wage Bill</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">
              Rs. {Math.round(Number(stats.totalWages || 0)).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">Calculated Payroll</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-5 border border-slate-700/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Expense Posted</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              Rs. {Math.round(Number(stats.completedWages || 0)).toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold mt-0.5 block">Ledger Integrated</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-700/50 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event booking ref, contractor or supervisor..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">All Statuses</option>
              <option value="Scheduled" className="bg-slate-900 text-white">Scheduled</option>
              <option value="In Progress" className="bg-slate-900 text-white">In Progress</option>
              <option value="Completed" className="bg-slate-900 text-white">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shifts Ledger Cards */}
      {loading ? (
        <div className="p-12 text-center bg-slate-800/60 backdrop-blur-md rounded-3xl border border-slate-700/50">
          <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-medium">Loading contractor labor shifts...</p>
        </div>
      ) : filteredShifts.length === 0 ? (
        <div className="p-12 text-center bg-slate-800/60 backdrop-blur-md rounded-3xl border border-dashed border-slate-700 flex flex-col items-center justify-center gap-2">
          <Users className="w-10 h-10 text-slate-500" />
          <span className="text-base font-bold text-white">No contractor shifts found</span>
          <span className="text-xs text-slate-400">Click "Schedule Labor Shift" to record contractor attendance.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredShifts.map((shift) => (
            <div
              key={shift.id}
              className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 shadow-xs hover:border-slate-600 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              {/* Left Column: Event & Contractor Info */}
              <div className="space-y-2 lg:w-1/3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30">
                    {shift.bookingRef}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    {shift.eventDate}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      shift.status === 'Completed' || shift.status === 'Settled'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : shift.status === 'In Progress'
                        ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {shift.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white">{shift.contractorName}</h3>
                <div className="text-xs text-slate-400 space-y-0.5">
                  <p>Shift: <strong className="text-slate-200">{shift.shiftType}</strong></p>
                  <p>Supervisor: <strong className="text-slate-200">{shift.supervisorName || 'Floor Captain'}</strong></p>
                  {shift.expenseRef && (
                    <p className="text-emerald-400 font-mono font-bold">
                      Linked Expense: {shift.expenseRef}
                    </p>
                  )}
                </div>
              </div>

              {/* Middle Column: Staff Counts & Headcount Breakdown */}
              <div className="grid grid-cols-3 gap-3 text-center bg-slate-900/60 p-4 rounded-2xl border border-slate-700/40 lg:w-1/3">
                <div className="p-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase block">Male Crew</span>
                  <span className="text-lg font-black text-white font-mono">{shift.maleCount}</span>
                  <span className="text-[10px] text-slate-400 block">@ Rs. {Number(shift.maleRatePerShift || 0).toLocaleString()}</span>
                </div>
                <div className="p-2 border-x border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase block">Female Crew</span>
                  <span className="text-lg font-black text-white font-mono">{shift.femaleCount}</span>
                  <span className="text-[10px] text-slate-400 block">@ Rs. {Number(shift.femaleRatePerShift || 0).toLocaleString()}</span>
                </div>
                <div className="p-2">
                  <span className="text-[11px] font-bold text-teal-400 uppercase block">Total Staff</span>
                  <span className="text-lg font-black text-teal-300 font-mono">{shift.totalHeadcount}</span>
                  <span className="text-[10px] text-amber-400 block">+{shift.overtimeHours}h OT</span>
                </div>
              </div>

              {/* Right Column: Total Cost & Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 lg:w-1/4">
                <div>
                  <span className="text-xs text-slate-400 block text-right">Computed Shift Wage</span>
                  <span className="text-2xl font-black text-white font-mono block text-right">
                    Rs. {Math.round(Number(shift.totalCost || 0)).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={() => handlePrintVoucher(shift)}
                    className="flex-1 lg:flex-none p-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Print Labor Slip"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Slip</span>
                  </button>

                  {!shift.expenseRef ? (
                    <button
                      type="button"
                      onClick={() => handlePostToExpenses(shift)}
                      className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Post to Expense</span>
                    </button>
                  ) : (
                    <span className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Posted</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Labor Shift Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                    Schedule Outside Labor Shift
                  </h3>
                  <span className="text-xs text-slate-400">Tag outside contractor staff to event with rate calculation</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="p-6 space-y-4">
              {/* Event & Contractor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Target Event Booking <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formBookingRef}
                    onChange={(e) => handleBookingChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-teal-500 transition"
                  >
                    {bookings.map((b) => (
                      <option key={b.bookingRef} value={b.bookingRef} className="bg-slate-900 text-white">
                        {b.bookingRef} • {b.hallName} ({b.customerName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Event Date</label>
                  <input
                    type="date"
                    required
                    value={formEventDate}
                    onChange={(e) => setFormEventDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Contractor Agency Name</label>
                  <input
                    type="text"
                    required
                    value={formContractorName}
                    onChange={(e) => setFormContractorName(e.target.value)}
                    placeholder="e.g. Apex Event Hospitality Crew"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Supervisor / Lead Name</label>
                  <input
                    type="text"
                    value={formSupervisorName}
                    onChange={(e) => setFormSupervisorName(e.target.value)}
                    placeholder="e.g. Master Usman"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>

              {/* Headcount Steppers */}
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700 space-y-4">
                <span className="text-xs font-extrabold text-white uppercase tracking-wider block">
                  Staff Headcount &amp; Shift Rates
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Male Count</label>
                    <input
                      type="number"
                      min="0"
                      value={formMaleCount}
                      onChange={(e) => setFormMaleCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-bold font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Male Rate/Shift</label>
                    <input
                      type="number"
                      step="100"
                      value={formMaleRate}
                      onChange={(e) => setFormMaleRate(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-bold font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Female Count</label>
                    <input
                      type="number"
                      min="0"
                      value={formFemaleCount}
                      onChange={(e) => setFormFemaleCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-bold font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Female Rate/Shift</label>
                    <input
                      type="number"
                      step="100"
                      value={formFemaleRate}
                      onChange={(e) => setFormFemaleRate(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-bold font-mono text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-700">
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Overtime (Hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={formOvertimeHours}
                      onChange={(e) => setFormOvertimeHours(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-bold font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">OT Rate / Staff / Hour</label>
                    <input
                      type="number"
                      step="50"
                      value={formOvertimeRate}
                      onChange={(e) => setFormOvertimeRate(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-bold font-mono text-white"
                    />
                  </div>
                </div>

                {/* Calculation Summary Pill */}
                <div className="p-3 bg-teal-500/10 rounded-xl border border-teal-500/30 flex items-center justify-between text-xs">
                  <span className="font-semibold text-teal-300">
                    Total Headcount: <strong className="text-white">{formTotalHeadcount} Staff</strong>
                  </span>
                  <span className="font-black text-teal-300 font-mono text-sm">
                    Calculated Wage: Rs. {Number(formComputedTotal || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Shift Notes / Duties Assigned</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. 10 waiters assigned to buffet station, 8 stewards on VIP table rotation..."
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-extrabold shadow-md transition cursor-pointer"
                >
                  Confirm &amp; Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Labor Wage Slip Printable Voucher Modal */}
      {isVoucherModalOpen && voucherShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/80 text-white">
              <div>
                <span className="text-[11px] font-mono text-teal-400 uppercase tracking-widest block">
                  MARRIAGE HALL MANAGEMENT SYSTEM
                </span>
                <h3 className="text-lg font-bold">Outside Labor Wage Slip</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800/60 rounded-2xl border border-slate-700">
                <div>
                  <span className="text-slate-400 block">Event Booking:</span>
                  <strong className="text-white text-sm font-mono">{voucherShift.bookingRef}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Event Date:</span>
                  <strong className="text-white">{voucherShift.eventDate}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Contractor:</span>
                  <strong className="text-white">{voucherShift.contractorName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Supervisor:</span>
                  <strong className="text-white">{voucherShift.supervisorName || 'Floor Captain'}</strong>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 font-semibold">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-center">Headcount</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
                  <tr>
                    <td className="py-2 font-sans text-white">Male Waiters / Crew</td>
                    <td className="py-2 text-center">{voucherShift.maleCount}</td>
                    <td className="py-2 text-right">Rs. {Number(voucherShift.maleRatePerShift || 0).toLocaleString()}</td>
                    <td className="py-2 text-right font-bold text-white">
                      Rs. {(voucherShift.maleCount * voucherShift.maleRatePerShift).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-sans text-white">Female Waitresses / Hostesses</td>
                    <td className="py-2 text-center">{voucherShift.femaleCount}</td>
                    <td className="py-2 text-right">Rs. {Number(voucherShift.femaleRatePerShift || 0).toLocaleString()}</td>
                    <td className="py-2 text-right font-bold text-white">
                      Rs. {(voucherShift.femaleCount * voucherShift.femaleRatePerShift).toLocaleString()}
                    </td>
                  </tr>
                  {voucherShift.overtimeHours > 0 && (
                    <tr>
                      <td className="py-2 font-sans text-white">Overtime ({voucherShift.overtimeHours} hrs)</td>
                      <td className="py-2 text-center">{voucherShift.totalHeadcount}</td>
                      <td className="py-2 text-right">Rs. {Number(voucherShift.overtimeRatePerHour || 0).toLocaleString()}/hr</td>
                      <td className="py-2 text-right font-bold text-amber-400">
                        Rs. {(voucherShift.totalHeadcount * voucherShift.overtimeHours * voucherShift.overtimeRatePerHour).toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-700 font-bold text-sm">
                    <td colSpan={3} className="py-3 font-sans text-white">TOTAL NET PAYABLE:</td>
                    <td className="py-3 text-right font-mono text-teal-400">
                      Rs. {Math.round(Number(voucherShift.totalCost || 0)).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-[11px] text-slate-400">
                <div className="border-t border-slate-700 pt-1">
                  <span>Contractor Representative</span>
                </div>
                <div className="border-t border-slate-700 pt-1">
                  <span>Hall General Manager</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer border border-slate-700"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
