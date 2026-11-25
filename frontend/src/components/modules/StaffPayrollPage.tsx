import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Play,
  Trash2,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  DollarSign,
  X,
  Lock,
  UserCheck,
} from 'lucide-react';
import { salaryApi, staffApi, authApi } from '../../api/client';
import { StaffMember, StaffSalaryDisbursement } from '../../types';

interface StaffPayrollPageProps {
  onNavigateToExpenses?: () => void;
}

export const StaffPayrollPage: React.FC<StaffPayrollPageProps> = ({ onNavigateToExpenses }) => {
  const [salaries, setSalaries] = useState<StaffSalaryDisbursement[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [formStaffName, setFormStaffName] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formRole, setFormRole] = useState('Floor Staff');
  const [formMonth, setFormMonth] = useState(() => {
    const d = new Date();
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  });
  const [formBaseSalary, setFormBaseSalary] = useState('');
  const [formLeavesTaken, setFormLeavesTaken] = useState('0');
  const [formLeaveDeduction, setFormLeaveDeduction] = useState('0');
  const [formBonus, setFormBonus] = useState('0');
  const [formDeductions, setFormDeductions] = useState('0');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Bank Transfer');
  const [formPaymentDate, setFormPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<'Released' | 'Held'>('Released');
  const [formNotes, setFormNotes] = useState('');

  // Load permanent staff and existing disbursements
  const loadData = async () => {
    setLoading(true);
    try {
      const [salData, stData, usrData] = await Promise.all([
        salaryApi.list().catch(() => []),
        staffApi.list().catch(() => []),
        authApi.listUsers().catch(() => []),
      ]);

      setSalaries(salData || []);

      // Merge internal permanent staff and user profiles into unified selection
      const combinedStaff: StaffMember[] = [...(stData || [])];
      if (usrData && Array.isArray(usrData)) {
        usrData.forEach((u: any) => {
          if (!combinedStaff.some((cs) => cs.fullName.toLowerCase() === (u.fullName || u.username).toLowerCase())) {
            combinedStaff.push({
              id: `USR-${u.id}`,
              employeeId: `EMP-${u.id}`,
              fullName: u.fullName || u.username,
              role: u.role?.toUpperCase() || 'Staff',
              contactNumber: u.phone || '',
              shiftTiming: 'Full Day',
              salary: Number(u.salary) || 0,
              status: u.isActive !== false ? 'Active' : 'Inactive',
            });
          }
        });
      }
      setStaffList(combinedStaff);
    } catch (err) {
      console.warn('Payroll load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When staff selection changes, autofill details and compute leave deduction
  const handleSelectStaff = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedStaffId(val);
    const found = staffList.find((s) => String(s.id) === val);
    if (found) {
      setFormStaffName(found.fullName);
      setFormEmployeeId(found.employeeId || '');
      setFormRole(found.role || 'Staff');
      if (found.salary && Number(found.salary) > 0) {
        setFormBaseSalary(String(found.salary));
        // Auto calculate daily wage for leaves (Base / 30)
        const dailyRate = Math.round(Number(found.salary) / 30);
        const leaves = parseInt(formLeavesTaken, 10) || 0;
        setFormLeaveDeduction(String(leaves * dailyRate));
      }
    }
  };

  const handleLeavesChange = (val: string) => {
    setFormLeavesTaken(val);
    const leaves = parseInt(val, 10) || 0;
    const base = parseFloat(formBaseSalary) || 0;
    const dailyRate = base > 0 ? Math.round(base / 30) : 0;
    setFormLeaveDeduction(String(leaves * dailyRate));
  };

  const handleBaseSalaryChange = (val: string) => {
    setFormBaseSalary(val);
    const base = parseFloat(val) || 0;
    const leaves = parseInt(formLeavesTaken, 10) || 0;
    const dailyRate = base > 0 ? Math.round(base / 30) : 0;
    setFormLeaveDeduction(String(leaves * dailyRate));
  };

  const netCalculation = useMemo(() => {
    const base = parseFloat(formBaseSalary) || 0;
    const bonus = parseFloat(formBonus) || 0;
    const ded = parseFloat(formDeductions) || 0;
    const leaveDed = parseFloat(formLeaveDeduction) || 0;
    return Math.max(0, base + bonus - ded - leaveDed);
  }, [formBaseSalary, formBonus, formDeductions, formLeaveDeduction]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStaffName.trim()) {
      setError('Please enter or select a staff member name.');
      return;
    }
    if (!formBaseSalary || parseFloat(formBaseSalary) <= 0) {
      setError('Please provide a valid base salary amount.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const payload: Partial<StaffSalaryDisbursement> = {
        staffId: selectedStaffId ? Number(selectedStaffId.replace(/\D/g, '')) || null : null,
        staffName: formStaffName.trim(),
        employeeId: formEmployeeId.trim(),
        role: formRole,
        month: formMonth,
        baseSalary: parseFloat(formBaseSalary) || 0,
        leavesTaken: parseInt(formLeavesTaken, 10) || 0,
        leaveDeduction: parseFloat(formLeaveDeduction) || 0,
        bonus: parseFloat(formBonus) || 0,
        deductions: parseFloat(formDeductions) || 0,
        netPaid: netCalculation,
        status: formStatus,
        paymentMethod: formPaymentMethod,
        paymentDate: formPaymentDate,
        notes: formNotes.trim(),
      };

      const res = await salaryApi.create(payload);
      setSalaries((prev) => [res, ...prev]);
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err?.message || 'Failed to process salary disbursement.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedStaffId('');
    setFormStaffName('');
    setFormEmployeeId('');
    setFormRole('Floor Staff');
    setFormBaseSalary('');
    setFormLeavesTaken('0');
    setFormLeaveDeduction('0');
    setFormBonus('0');
    setFormDeductions('0');
    setFormNotes('');
    setFormStatus('Released');
    setError(null);
  };

  // Release Held Salary
  const handleReleaseSalary = async (item: StaffSalaryDisbursement) => {
    try {
      const res = await salaryApi.release(item.id);
      setSalaries((prev) => prev.map((s) => (s.id === item.id ? res.salary : s)));
    } catch (err: any) {
      alert(err?.message || 'Failed to release salary.');
    }
  };

  // Delete Draft Record
  const handleDelete = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this salary record? Any posted accounting expense will be removed.')) {
      return;
    }
    try {
      await salaryApi.delete(id);
      setSalaries((prev) => prev.filter((s) => String(s.id) !== String(id)));
    } catch (err: any) {
      alert(err?.message || 'Salary deletion failed.');
    }
  };

  // KPI Computations
  const kpiStats = useMemo(() => {
    const totalDisbursed = salaries
      .filter((s) => s.status === 'Released')
      .reduce((sum, s) => sum + (Number(s.netPaid) || 0), 0);
    const totalOnHold = salaries
      .filter((s) => s.status === 'Held')
      .reduce((sum, s) => sum + (Number(s.netPaid) || 0), 0);
    const releasedCount = salaries.filter((s) => s.status === 'Released').length;
    const heldCount = salaries.filter((s) => s.status === 'Held').length;

    return {
      totalDisbursed: `Rs. ${totalDisbursed.toLocaleString()}`,
      totalOnHold: `Rs. ${totalOnHold.toLocaleString()}`,
      releasedCount,
      heldCount,
      totalCount: salaries.length,
    };
  }, [salaries]);

  // Filtered List
  const filteredSalaries = useMemo(() => {
    return salaries.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !q ||
        s.staffName.toLowerCase().includes(q) ||
        (s.employeeId && s.employeeId.toLowerCase().includes(q)) ||
        s.salaryRef.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q);

      const matchMonth = monthFilter === 'All' || s.month === monthFilter;
      const matchStatus = statusFilter === 'All' || s.status === statusFilter;

      return matchQuery && matchMonth && matchStatus;
    });
  }, [salaries, searchQuery, monthFilter, statusFilter]);

  const uniqueMonths = useMemo(() => {
    const months = new Set<string>();
    salaries.forEach((s) => {
      if (s.month) months.add(s.month);
    });
    return Array.from(months);
  }, [salaries]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
              Staff Payroll &amp; Salary Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
              Accounts Synced
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Disburse permanent staff salaries, calculate leave deductions, and auto-post expenses to the accounting cycle. Once paid, salaries cannot be held back.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigateToExpenses && (
            <button
              type="button"
              onClick={onNavigateToExpenses}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5 text-teal-700" />
              View in Accounting Expenses
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Release / Record Salary
          </button>
        </div>
      </div>

      {/* KPI Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Salaries Disbursed
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums text-emerald-950">
            {kpiStats.totalDisbursed}
          </p>
          <span className="text-xs text-emerald-700 mt-1 block">
            {kpiStats.releasedCount} staff salaries finalized
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Drafts / On Hold
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums text-amber-950">
            {kpiStats.totalOnHold}
          </p>
          <span className="text-xs text-amber-700 mt-1 block">
            {kpiStats.heldCount} salaries pending release
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Permanent Staff Enrolled
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {staffList.length}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Active workforce records</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Payroll Entries
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-indigo-700" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {kpiStats.totalCount}
          </p>
          <span className="text-xs text-indigo-700 mt-1 block">Across all months</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by staff name, employee ID, ref..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Month:</span>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            >
              <option value="All">All Months</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            >
              <option value="All">All Statuses</option>
              <option value="Released">Released (Paid)</option>
              <option value="Held">Held (Pending)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Salary Records Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Staff Member &amp; ID
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Month &amp; Date
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Base &amp; Leaves
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Net Disbursed
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Payment Status
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Accounts Expense Ref
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    Loading salary disbursements...
                  </td>
                </tr>
              ) : filteredSalaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                        <Wallet className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">No salary records found</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Use the &ldquo;Release / Record Salary&rdquo; button above to disburse staff salaries.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSalaries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">{item.staffName}</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                            {item.role}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5">
                          {item.salaryRef} {item.employeeId && `• ${item.employeeId}`}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-sm font-medium text-slate-700">
                      {item.month}
                      <span className="text-xs text-slate-400 block font-normal">{item.paymentDate}</span>
                    </td>

                    <td className="py-3.5 px-5 text-xs font-mono tabular-nums text-slate-600">
                      <div>Base: Rs. {Number(item.baseSalary).toLocaleString()}</div>
                      {Number(item.leavesTaken || 0) > 0 && (
                        <div className="text-amber-700 font-medium">
                          Leaves ({item.leavesTaken}d): -Rs. {Number(item.leaveDeduction || 0).toLocaleString()}
                        </div>
                      )}
                      {Number(item.bonus) > 0 && <div className="text-emerald-700">+ Bonus: Rs. {Number(item.bonus).toLocaleString()}</div>}
                      {Number(item.deductions) > 0 && <div className="text-rose-700">- Ded: Rs. {Number(item.deductions).toLocaleString()}</div>}
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="text-sm font-bold font-mono tabular-nums text-teal-800">
                        Rs. {Number(item.netPaid).toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-400 block">{item.paymentMethod}</span>
                    </td>

                    <td className="py-3.5 px-5">
                      {item.status === 'Released' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Paid &amp; Locked</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-800 border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Held / Pending</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5">
                      {item.expenseRef ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {item.expenseRef}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-medium">In Accounts</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None (On Hold)</span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {item.status === 'Released' ? (
                          // Paid salary rule: once paid it CANNOT be held back
                          <div
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-500 text-xs font-medium cursor-not-allowed"
                            title="Paid salaries are finalized and cannot be held back or reversed."
                          >
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Locked</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReleaseSalary(item)}
                            title="Release Salary to Accounts"
                            className="p-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Release</span>
                          </button>
                        )}

                        {item.status !== 'Released' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            title="Delete Draft"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Release / Record Staff Salary */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900">
                  Disburse Staff Salary
                </h3>
                <p className="text-xs text-slate-500">
                  Manage leaves, deductions, and post salary expense to Accounts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs font-medium text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Staff Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Permanent Staff Member
                </label>
                <select
                  value={selectedStaffId}
                  onChange={handleSelectStaff}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                >
                  <option value="">-- Choose from Permanent Staff List --</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.role}) {s.salary ? `- Rs. ${Number(s.salary).toLocaleString()}/mo` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Staff Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formStaffName}
                    onChange={(e) => setFormStaffName(e.target.value)}
                    placeholder="e.g. Aslam Chef"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Staff Role / Dept
                  </label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="Floor Staff / Waiter"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Payroll Month *
                  </label>
                  <input
                    type="text"
                    required
                    value={formMonth}
                    onChange={(e) => setFormMonth(e.target.value)}
                    placeholder="e.g. November 2026"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formPaymentDate}
                    onChange={(e) => setFormPaymentDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>
              </div>

              {/* Base Salary & Leaves Management */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Salary &amp; Leaves Tracking
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Base Salary (PKR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="500"
                      value={formBaseSalary}
                      onChange={(e) => handleBaseSalaryChange(e.target.value)}
                      placeholder="e.g. 45000"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Leaves Taken (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="31"
                      value={formLeavesTaken}
                      onChange={(e) => handleLeavesChange(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Leave Deduction (PKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formLeaveDeduction}
                      onChange={(e) => setFormLeaveDeduction(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bonus / Shift Overtime (PKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={formBonus}
                      onChange={(e) => setFormBonus(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Other Deductions (PKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={formDeductions}
                      onChange={(e) => setFormDeductions(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                    />
                  </div>
                </div>
              </div>

              {/* Net Payable Highlight Card */}
              <div className="p-3.5 rounded-lg bg-teal-50/80 border border-teal-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
                    Total Net Disbursed Salary
                  </span>
                  <p className="text-[11px] text-teal-600">
                    Base + Bonus - Other Deductions - Leave Deduction
                  </p>
                </div>
                <span className="text-2xl font-bold font-mono text-teal-900">
                  Rs. {netCalculation.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Disbursement Action
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'Released' | 'Held')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  >
                    <option value="Released">Release Immediately (Locks &amp; Deducts from Accounts)</option>
                    <option value="Held">Hold as Draft (Not Deducted yet)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash Disbursement</option>
                    <option value="Cheque">Company Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notes / Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Regular monthly stipend with 2 days unexcused leave deduction"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
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
                  disabled={submitting}
                  className="rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  {submitting ? 'Processing...' : 'Confirm & Post to Accounts'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
