import React, { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Clock,
  CreditCard,
  Search,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { salaryApi, staffApi } from '../../api/client';
import { StaffSalaryDisbursement } from '../../types';

interface StaffPayrollRow {
  id: string;
  employeeId: string;
  fullName: string;
  role: string;
  baseSalary: number;
  currentAdvance: number;
  netPayable: number;
  status: 'Paid' | 'Pending';
}

const formatCurrency = (amount: number): string => {
  return `Rs. ${Number(amount || 0).toLocaleString()}`;
};

export const StaffPayrollPage: React.FC<{ onNavigateToExpenses?: () => void }> = () => {
  const [staffRows, setStaffRows] = useState<StaffPayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Process Salary Modal state
  const [salaryTarget, setSalaryTarget] = useState<StaffPayrollRow | null>(null);
  const [baseSalaryInput, setBaseSalaryInput] = useState('');
  const [advanceDeductionInput, setAdvanceDeductionInput] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank' | 'Cheque'>('Cash');
  const [salaryError, setSalaryError] = useState<string | null>(null);
  const [submittingSalary, setSubmittingSalary] = useState(false);

  // Give Advance Modal state
  const [advanceTarget, setAdvanceTarget] = useState<StaffPayrollRow | null>(null);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDate, setAdvanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [advanceReason, setAdvanceReason] = useState('');
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [submittingAdvance, setSubmittingAdvance] = useState(false);

  const currentMonthLabel = useMemo(() => {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffData, salariesData] = await Promise.all([
        staffApi.list().catch(() => []),
        salaryApi.list({ month: currentMonthLabel }).catch(() => []),
      ]);

      const paidSet = new Set<string>();
      (salariesData || []).forEach((sal: StaffSalaryDisbursement) => {
        if (sal.status === 'Released') {
          if (sal.staffId) paidSet.add(String(sal.staffId));
          if (sal.staffName) paidSet.add(sal.staffName.toLowerCase());
        }
      });

      const rows: StaffPayrollRow[] = (staffData || []).map((s: any) => {
        const base = Number(s.salary) || 0;
        const adv = Number(s.currentAdvance) || 0;
        const isPaid = paidSet.has(String(s.id)) || paidSet.has((s.fullName || '').toLowerCase());
        return {
          id: String(s.id),
          employeeId: s.employeeId || '',
          fullName: s.fullName || '[--]',
          role: s.role || 'Staff',
          baseSalary: base,
          currentAdvance: adv,
          netPayable: Math.max(0, base - adv),
          status: isPaid ? 'Paid' : 'Pending',
        };
      });

      setStaffRows(rows);
    } catch (err) {
      console.error('Failed to load staff payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openProcessSalaryModal = (staff: StaffPayrollRow) => {
    setSalaryTarget(staff);
    setBaseSalaryInput(String(staff.baseSalary));
    setAdvanceDeductionInput(String(staff.currentAdvance));
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMode('Cash');
    setSalaryError(null);
  };

  const openGiveAdvanceModal = (staff: StaffPayrollRow) => {
    setAdvanceTarget(staff);
    setAdvanceAmount('');
    setAdvanceDate(new Date().toISOString().slice(0, 10));
    setAdvanceReason('');
    setAdvanceError(null);
  };

  const netAmountToPay = useMemo(() => {
    const base = parseFloat(baseSalaryInput) || 0;
    const ded = parseFloat(advanceDeductionInput) || 0;
    return Math.max(0, base - ded);
  }, [baseSalaryInput, advanceDeductionInput]);

  const handleProcessSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryTarget || submittingSalary) return;

    const base = parseFloat(baseSalaryInput);
    const ded = parseFloat(advanceDeductionInput) || 0;
    if (Number.isNaN(base) || base <= 0) {
      setSalaryError('Base salary must be greater than 0.');
      return;
    }

    setSubmittingSalary(true);
    setSalaryError(null);
    try {
      await staffApi.processSalary(salaryTarget.id, {
        baseSalary: base,
        advanceDeduction: ded,
        paymentDate,
        paymentMode,
        month: currentMonthLabel,
      });
      await loadData();
      setSalaryTarget(null);
    } catch (err: any) {
      setSalaryError(err?.message || 'Failed to process salary.');
    } finally {
      setSubmittingSalary(false);
    }
  };

  const handleGiveAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceTarget || submittingAdvance) return;

    const amt = parseFloat(advanceAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      setAdvanceError('Advance amount must be greater than 0.');
      return;
    }

    setSubmittingAdvance(true);
    setAdvanceError(null);
    try {
      await staffApi.giveAdvance(advanceTarget.id, {
        amount: amt,
        date: advanceDate,
        reason: advanceReason.trim(),
      });
      await loadData();
      setAdvanceTarget(null);
    } catch (err: any) {
      setAdvanceError(err?.message || 'Failed to record advance.');
    } finally {
      setSubmittingAdvance(false);
    }
  };

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return staffRows;
    return staffRows.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.employeeId.toLowerCase().includes(q)
    );
  }, [staffRows, searchQuery]);

  const kpis = useMemo(() => {
    if (staffRows.length === 0) {
      return {
        totalPayroll: '[--]',
        totalAdvances: '[--]',
        pendingPayouts: '[--]',
      };
    }
    const totalPayroll = staffRows.reduce((acc, s) => acc + s.baseSalary, 0);
    const totalAdvances = staffRows.reduce((acc, s) => acc + s.currentAdvance, 0);
    const pendingPayouts = staffRows
      .filter((s) => s.status === 'Pending')
      .reduce((acc, s) => acc + s.netPayable, 0);

    return {
      totalPayroll: formatCurrency(totalPayroll),
      totalAdvances: formatCurrency(totalAdvances),
      pendingPayouts: formatCurrency(pendingPayouts),
    };
  }, [staffRows]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
            Staff Payroll &amp; Advance Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage monthly salaries, track advances, and process payouts.
          </p>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Monthly Payroll
            </p>
            <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
              {kpis.totalPayroll}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Advances Given
            </p>
            <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-amber-700">
              {kpis.totalAdvances}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Payouts
            </p>
            <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
              {kpis.pendingPayouts}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name or role..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
          />
        </div>
        <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {currentMonthLabel}
        </span>
      </div>

      {/* Staff Payroll Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Staff Name</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4 text-right">Base Salary</th>
                <th className="py-3.5 px-4 text-right">Current Advance</th>
                <th className="py-3.5 px-4 text-right">Net Payable</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading staff payroll records...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No staff records found.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{staff.fullName}</p>
                      {staff.employeeId && (
                        <p className="text-xs font-mono text-slate-500 mt-0.5">{staff.employeeId}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {formatCurrency(staff.baseSalary)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-amber-700 font-medium">
                      {formatCurrency(staff.currentAdvance)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatCurrency(staff.netPayable)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                          staff.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {staff.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openProcessSalaryModal(staff)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Pay Salary
                        </button>
                        <button
                          type="button"
                          onClick={() => openGiveAdvanceModal(staff)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-teal-300 hover:text-teal-700 transition-colors cursor-pointer"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          Give Advance
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

      {/* Process Salary Modal */}
      {salaryTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900">
                  Process Salary
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{currentMonthLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setSalaryTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessSalary} className="p-6 space-y-4">
              {salaryError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {salaryError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Staff Name
                </label>
                <input
                  type="text"
                  readOnly
                  value={salaryTarget.fullName}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Base Salary (Rs.)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={baseSalaryInput}
                    onChange={(e) => setBaseSalaryInput(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3.5 text-sm font-mono tabular-nums text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Advance Deduction (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={advanceDeductionInput}
                    onChange={(e) => setAdvanceDeductionInput(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3.5 text-sm font-mono tabular-nums text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Net Amount to Pay
                </label>
                <input
                  type="text"
                  readOnly
                  value={formatCurrency(netAmountToPay)}
                  className="w-full h-10 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 text-sm font-bold font-mono tabular-nums text-emerald-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as 'Cash' | 'Bank' | 'Cheque')}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSalaryTarget(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSalary}
                  className="px-4 py-2 rounded-lg bg-teal-700 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submittingSalary ? 'Processing...' : 'Confirm & Pay Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Give Advance Modal */}
      {advanceTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900">
                  Give Advance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Current Advance: {formatCurrency(advanceTarget.currentAdvance)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdvanceTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGiveAdvance} className="p-6 space-y-4">
              {advanceError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {advanceError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Staff Name
                </label>
                <input
                  type="text"
                  readOnly
                  value={advanceTarget.fullName}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Advance Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full h-10 rounded-lg border border-slate-300 px-3.5 text-sm font-mono tabular-nums text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={advanceDate}
                    onChange={(e) => setAdvanceDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reason
                </label>
                <textarea
                  rows={2}
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  placeholder="Reason for advance..."
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAdvanceTarget(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdvance}
                  className="px-4 py-2 rounded-lg bg-teal-700 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submittingAdvance ? 'Saving...' : 'Save Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
