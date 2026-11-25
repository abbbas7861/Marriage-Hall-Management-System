import React, { useMemo, useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  X,
  XCircle,
  FileText,
  Printer,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { bookingsApi, expensesApi, fundRequestsApi, invoicesApi, FundRequestItem } from '../../api/client';
import { Booking } from '../../types';

export type TrackerExpenseCategory =
  | 'Food'
  | 'Decor'
  | 'Damage'
  | 'Outside Waiters'
  | 'Operational Funds'
  | 'Staff'
  | 'Other';

export type TrackerExpenseStatus = 'Approved' | 'Pending' | 'Paid';

export interface EventTrackerExpense {
  id: string;
  eventName: string;
  bookingRef: string;
  date: string;
  category: TrackerExpenseCategory;
  description: string;
  amount: number;
  status: TrackerExpenseStatus;
  paidTo?: string;
}

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  'Outside Waiters': 'bg-indigo-50 text-indigo-800 border-indigo-200 font-semibold',
  'Operational Funds': 'bg-cyan-50 text-cyan-800 border-cyan-200',
  Food: 'bg-teal-50 text-teal-800 border-teal-200',
  Decor: 'bg-teal-50 text-teal-800 border-teal-200',
  Damage: 'bg-rose-50 text-rose-700 border-rose-200',
  Staff: 'bg-blue-50 text-blue-800 border-blue-200',
  Other: 'bg-slate-100 text-slate-700 border-slate-200',
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
};

export const EventProfitabilityTrackerPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedEventRef, setSelectedEventRef] = useState<string>('All Events');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [fundRequests, setFundRequests] = useState<FundRequestItem[]>([]);
  const [expenses, setExpenses] = useState<EventTrackerExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal for adding outside waiters / event expense
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [modalBookingRef, setModalBookingRef] = useState('');
  const [modalCategory, setModalCategory] = useState<TrackerExpenseCategory>('Outside Waiters');
  const [modalDescription, setModalDescription] = useState('Outside Waiters for Event Service');
  const [modalVendor, setModalVendor] = useState('');
  const [modalAmount, setModalAmount] = useState('');
  const [modalDate, setModalDate] = useState(new Date().toISOString().slice(0, 10));

  // Cashflow & P&L Statement Modal
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedBookings, fetchedExpenses, fetchedFundReqs, fetchedInvoices] = await Promise.all([
        bookingsApi.list().catch(() => []),
        expensesApi.list().catch(() => []),
        fundRequestsApi.list({ status: 'Pending' }).catch(() => []),
        invoicesApi.list().catch(() => []),
      ]);

      setBookings(fetchedBookings || []);
      setInvoices(fetchedInvoices || []);

      if (fetchedExpenses && fetchedExpenses.length > 0) {
        setExpenses(
          fetchedExpenses.map((e: any) => ({
            id: String(e.id || e.expenseRef),
            eventName: e.bookingRef || 'General Hall',
            bookingRef: e.bookingRef || '',
            date: e.date || new Date().toISOString().slice(0, 10),
            category: (e.category || 'Other') as TrackerExpenseCategory,
            description: e.description || e.category || 'Expense',
            amount: Number(e.amount) || 0,
            status: (e.status || 'Paid') as TrackerExpenseStatus,
            paidTo: e.vendor || e.paidTo || '',
          }))
        );
      } else {
        setExpenses([]);
      }

      setFundRequests(fetchedFundReqs || []);
    } catch (err) {
      console.warn('Failed to load profitability tracker data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedBooking = useMemo(() => {
    if (selectedEventRef === 'All Events') return null;
    return bookings.find((b) => b.bookingRef === selectedEventRef) || null;
  }, [bookings, selectedEventRef]);

  const filteredRequests = useMemo(() => {
    return fundRequests.filter((req) => {
      if (req.status !== 'Pending') return false;
      if (selectedEventRef === 'All Events') return true;
      return req.bookingRef === selectedEventRef || req.eventName === selectedEventRef;
    });
  }, [fundRequests, selectedEventRef]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesEvent =
        selectedEventRef === 'All Events' ||
        exp.bookingRef === selectedEventRef ||
        exp.eventName === selectedEventRef;
      const matchesStart = !startDate || exp.date >= startDate;
      const matchesEnd = !endDate || exp.date <= endDate;
      return matchesEvent && matchesStart && matchesEnd;
    });
  }, [expenses, selectedEventRef, startDate, endDate]);

  const kpiMetrics = useMemo(() => {
    let totalRevenue = 0;
    let collectedRevenue = 0;
    let pendingReceivables = 0;
    let grossCashInflow = 0;
    let totalRefundsPaid = 0;

    const computeEventRevenue = (b: any, inv: any) => {
      const isCancelled = b?.status === 'Cancelled' || inv?.status === 'Cancelled' || inv?.paymentStatus === 'Cancelled' || b?.paymentStatus === 'Refunded';
      const cancRecord = b?.cancellationRecord || inv?.cancellationRecord || {};
      const originalAdvance = Number(cancRecord.advance_paid ?? cancRecord.paid_amount ?? b?.advancePayment ?? inv?.paidAmount ?? 0);
      const refunded = Number(cancRecord.refund_amount ?? cancRecord.net_amount ?? (isCancelled ? originalAdvance : 0));
      const retainedAmount = Number(cancRecord.deduction_amount ?? cancRecord.amount_used ?? 0);

      if (isCancelled) {
        grossCashInflow += originalAdvance;
        totalRefundsPaid += refunded;
        // P&L recognized revenue is strictly what the hall kept/earned
        return {
          total: retainedAmount,
          paid: retainedAmount,
          pending: 0,
        };
      }

      const bTotal = Number(inv?.totalAmount ?? b?.amount ?? b?.subtotal ?? 0);
      const bPaid = Number(inv?.paidAmount ?? b?.advancePayment ?? 0);
      grossCashInflow += bPaid;

      return {
        total: bTotal,
        paid: bPaid,
        pending: Math.max(0, bTotal - bPaid),
      };
    };

    if (selectedEventRef === 'All Events') {
      bookings.forEach((b: any) => {
        const inv = invoices.find((i: any) => (i.bookingId || i.bookingRef) === b.bookingRef);
        const { total, paid, pending } = computeEventRevenue(b, inv);
        totalRevenue += total;
        collectedRevenue += paid;
        pendingReceivables += pending;
      });
    } else if (selectedBooking) {
      const inv = invoices.find((i: any) => (i.bookingId || i.bookingRef) === selectedBooking.bookingRef);
      const { total, paid, pending } = computeEventRevenue(selectedBooking, inv);
      totalRevenue = total;
      collectedRevenue = paid;
      pendingReceivables = pending;
    }

    // Outside Waiters expense specifically for this event
    const outsideWaitersTotal = filteredExpenses
      .filter((e) => e.category === 'Outside Waiters')
      .reduce((sum, e) => sum + e.amount, 0);

    // Final total expenses (including outside waiters + other expenses)
    const finalTotalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - finalTotalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : (netProfit < 0 ? '-100.0' : '0.0');

    // Net Cashflow accounting for gross inflow minus refunds minus operational expenses
    const netCashFlow = grossCashInflow - totalRefundsPaid - finalTotalExpenses;

    return {
      totalRevenue,
      collectedRevenue,
      pendingReceivables,
      grossCashInflow,
      totalRefundsPaid,
      netCashFlow,
      revenueLabel: `Rs. ${totalRevenue.toLocaleString()}`,
      collectedLabel: `Rs. ${collectedRevenue.toLocaleString()}`,
      pendingLabel: `Rs. ${pendingReceivables.toLocaleString()}`,
      outsideWaitersLabel: `Rs. ${outsideWaitersTotal.toLocaleString()}`,
      outsideWaitersCount: filteredExpenses.filter((e) => e.category === 'Outside Waiters').length,
      finalTotalExpensesLabel: `Rs. ${finalTotalExpenses.toLocaleString()}`,
      netProfitLabel: `Rs. ${netProfit.toLocaleString()}`,
      netProfitNumeric: netProfit,
      profitMargin,
    };
  }, [bookings, selectedBooking, invoices, filteredExpenses, selectedEventRef]);

  const handleApproveRequest = async (req: FundRequestItem) => {
    try {
      await fundRequestsApi.approve(req.id);
      await loadData();
    } catch (err) {
      console.error('Failed to approve fund request:', err);
      alert('Error approving fund request. Please try again.');
    }
  };

  const handleRejectRequest = async (id: string | number) => {
    try {
      await fundRequestsApi.reject(id);
      await loadData();
    } catch (err) {
      console.error('Failed to reject fund request:', err);
      alert('Error rejecting fund request.');
    }
  };

  const handleOpenAddExpense = () => {
    setModalBookingRef(selectedEventRef !== 'All Events' ? selectedEventRef : (bookings[0]?.bookingRef || ''));
    setModalCategory('Outside Waiters');
    setModalDescription('Outside Waiters Service');
    setModalVendor('');
    setModalAmount('');
    setModalDate(new Date().toISOString().slice(0, 10));
    setIsAddExpenseOpen(true);
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(modalAmount);
    if (!modalDescription.trim() || !modalVendor.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please fill out all required fields with a valid amount.');
      return;
    }

    try {
      await expensesApi.create({
        bookingRef: modalBookingRef,
        description: modalDescription.trim(),
        category: modalCategory,
        vendor: modalVendor.trim(),
        amount: parsedAmount,
        date: modalDate,
        paymentMethod: 'Cash',
        status: 'Paid',
      });
      setIsAddExpenseOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to record event expense:', err);
      alert('Error recording expense.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
            Event Expense &amp; Profitability Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor event-level revenue, track Outside Waiters &amp; operations costs, approve manager funds, and track net margins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsStatementModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-700 bg-teal-50 hover:bg-teal-100 text-teal-800 px-3.5 py-2 text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-teal-700 shrink-0" />
            <span>P&amp;L Statement</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddExpense}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-3.5 py-2 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Add Event Expense / Waiters</span>
          </button>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
          <label
            htmlFor="tracker-event-filter"
            className="text-xs font-semibold uppercase tracking-wider text-slate-500 shrink-0"
          >
            Select Event:
          </label>
          <select
            id="tracker-event-filter"
            value={selectedEventRef}
            onChange={(e) => setSelectedEventRef(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 truncate"
          >
            <option value="All Events">All Events (Cumulative Hall Overview)</option>
            {bookings.map((b) => (
              <option key={b.id || b.bookingRef} value={b.bookingRef}>
                {b.bookingRef} — {b.customerName} ({b.hallName} • {b.date})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            type="date"
            aria-label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-700 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            aria-label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-700 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
          />
        </div>
      </div>

      {/* KPI Cards (4 Cards: Revenue, Outside Waiters Cost, Final Total Expenses, Net Profit) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Event Revenue */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Event Revenue
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.revenueLabel}
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
            <span className="text-emerald-700 font-bold" title="Collected advance & installments">
              Paid: {kpiMetrics.collectedLabel}
            </span>
            <span
              className={`font-bold ${kpiMetrics.pendingReceivables > 0 ? 'text-amber-800' : 'text-slate-400'}`}
              title="Pending balance uncollected"
            >
              Due: {kpiMetrics.pendingLabel}
            </span>
          </div>
        </div>

        {/* Card 2: Outside Waiters Expense (Requested Feature) */}
        <div className="bg-white border border-indigo-200/80 rounded-xl p-5 shadow-2xs bg-gradient-to-br from-indigo-50/20 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Outside Waiters Expense
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-700" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums text-indigo-900">
            {kpiMetrics.outsideWaitersLabel}
          </p>
          <span className="text-[11px] text-indigo-600/80 mt-1 block font-medium">
            Included in final total expenses ({kpiMetrics.outsideWaitersCount} record{kpiMetrics.outsideWaitersCount === 1 ? '' : 's'})
          </span>
        </div>

        {/* Card 3: Final Total Expenses */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Final Total Expenses
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums text-rose-600">
            {kpiMetrics.finalTotalExpensesLabel}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Waiters + Food + Decor + Funds</span>
        </div>

        {/* Card 4: Net Profitability */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Event Net Profit
            </span>
            <div
              className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                kpiMetrics.netProfitNumeric < 0
                  ? 'bg-rose-50 border-rose-100'
                  : 'bg-emerald-50 border-emerald-100'
              }`}
            >
              <DollarSign
                className={`w-4 h-4 ${
                  kpiMetrics.netProfitNumeric < 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              />
            </div>
          </div>
          <p
            className={`mt-3 text-2xl font-bold font-mono tabular-nums ${
              kpiMetrics.netProfitNumeric < 0 ? 'text-rose-600' : 'text-emerald-700'
            }`}
          >
            {kpiMetrics.netProfitLabel}
          </p>
          <span className="text-[11px] font-medium text-slate-500 mt-1 block">
            Net Margin: <span className="font-semibold">{kpiMetrics.profitMargin}%</span>
          </span>
        </div>
      </div>

      {/* Pending Fund Requests Section (Manager -> Accounts Flow) */}
      <section className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
              Manager Fund Requisitions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and disburse operational cash requests submitted by Managers from Event Control Center
            </p>
          </div>
          <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-mono font-semibold text-amber-800">
            {filteredRequests.length} Pending
          </span>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="py-10 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              No pending fund requests from managers.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              When a Manager requests emergency or operational cash in the Event Control Center, it appears here for Accounts review and disbursement.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredRequests.map((req) => (
              <li
                key={req.id}
                className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {req.requestedBy || 'Manager'} requested{' '}
                      <span className="font-mono tabular-nums text-teal-800 font-bold">
                        Rs. {Number(req.amount).toLocaleString()}
                      </span>{' '}
                      for: <span className="font-medium text-slate-800">{req.reason}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Event Ref: <span className="font-mono font-semibold text-slate-700">{req.bookingRef || 'General'}</span>{' '}
                    {req.eventName && <span>({req.eventName})</span>}
                    {req.notes && <span className="ml-2 italic text-slate-600">— &ldquo;{req.notes}&rdquo;</span>}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApproveRequest(req)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve &amp; Disburse
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectRequest(req.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Expense Table */}
      <section className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
              Event Expense Ledger (Itemized Costs)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Itemized list of Outside Waiters, operational funds, food, and venue expenses for this event
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {filteredExpenses.length} entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Date
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Category
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Event / Booking
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Description / Service
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Paid To / Vendor
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Amount
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 px-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                        <Receipt className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        No event expenses recorded yet.
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Use the &ldquo;Add Event Expense / Waiters&rdquo; button above to record Outside Waiters or event disbursements.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-mono text-slate-600">
                      {exp.date}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs ${
                          CATEGORY_BADGE_STYLES[exp.category] || CATEGORY_BADGE_STYLES.Other
                        }`}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-sm font-mono font-medium text-slate-800">
                      {exp.bookingRef || 'General'}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-medium text-slate-900">
                      {exp.description}
                    </td>
                    <td className="py-3.5 px-5 text-sm text-slate-600">
                      {exp.paidTo || '—'}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-mono tabular-nums font-semibold text-rose-600">
                      Rs. {exp.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                          STATUS_BADGE_STYLES[exp.status] || STATUS_BADGE_STYLES.Paid
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Expense / Outside Waiters Modal */}
      {isAddExpenseOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/70">
              <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-700" />
                Record Event Expense / Outside Waiters
              </h3>
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Associated Event / Booking *
                </label>
                <select
                  value={modalBookingRef}
                  onChange={(e) => setModalBookingRef(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                >
                  <option value="">Select an Event...</option>
                  {bookings.map((b) => (
                    <option key={b.bookingRef} value={b.bookingRef}>
                      {b.bookingRef} — {b.customerName} ({b.hallName} • {b.date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={modalCategory}
                    onChange={(e) => {
                      const cat = e.target.value as TrackerExpenseCategory;
                      setModalCategory(cat);
                      if (cat === 'Outside Waiters' && (!modalDescription || modalDescription.includes('Service'))) {
                        setModalDescription('Outside Waiters Service');
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  >
                    <option value="Outside Waiters">Outside Waiters</option>
                    <option value="Food">Food &amp; Catering</option>
                    <option value="Decor">Decor &amp; Stage</option>
                    <option value="Operational Funds">Operational Funds</option>
                    <option value="Damage">Damage / Repair</option>
                    <option value="Staff">Staff</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Amount (Rs.) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description / Service Details *
                </label>
                <input
                  type="text"
                  required
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="e.g. 15 Outside Waiters for Banquet Service"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Paid To / Vendor *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalVendor}
                    onChange={(e) => setModalVendor(e.target.value)}
                    placeholder="e.g. Royal Staffing Agency"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  Save &amp; Add to Event Total
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Event Cashflow & P&L Statement Modal */}
      {isStatementModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 text-white flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-teal-300 bg-teal-900/60 px-2.5 py-0.5 rounded-full border border-teal-500/30">
                  <Receipt className="w-3.5 h-3.5" /> Event Financial Statement &amp; Settlement
                </span>
                <h3 className="text-xl font-bold mt-2 font-['Plus_Jakarta_Sans']">
                  Mehar Palace Marquee &middot; Cashflow &amp; P&amp;L Analysis
                </h3>
                <p className="text-xs text-teal-200/80 mt-0.5">
                  {selectedEventRef === 'All Events'
                    ? 'Cumulative Financial Cash In/Out and Profit & Loss across all events'
                    : `Financial Statement for Event ${selectedEventRef} (${selectedBooking?.customerName || 'Client'} - ${selectedBooking?.hallName})`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStatementModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Statement Body */}
            <div className="p-6 space-y-6 text-sm max-h-[75vh] overflow-y-auto">
              {/* Event Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Scope / Event</span>
                  <span className="font-bold text-slate-800">{selectedEventRef}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Operational Status</span>
                  <span className="font-bold text-teal-800">
                    {selectedBooking?.operationalStatus || (selectedEventRef === 'All Events' ? 'All Operations' : 'Active')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Contract Revenue</span>
                  <span className="font-mono font-bold text-slate-900">{kpiMetrics.revenueLabel}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Statement Date</span>
                  <span className="font-medium text-slate-700">{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* SECTION 1: CASHFLOW (CASH IN vs CASH OUT) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                    PART 1: CASHFLOW STATEMENT (Actual Cash Inflows vs Outflows)
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">Cash Basis Accounting</span>
                </div>

                <div className="p-4 space-y-4">
                  {/* Cash Inflows */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2 flex items-center gap-1.5">
                      <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" /> Cash Inflows (Gross Receipts Received)
                    </h5>
                    <table className="w-full text-xs text-left">
                      <thead className="bg-emerald-50/60 text-emerald-900 border-y border-emerald-100">
                        <tr>
                          <th className="py-2 px-3">Inflow Category</th>
                          <th className="py-2 px-3">Description</th>
                          <th className="py-2 px-3 text-right font-mono">Amount (PKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        <tr>
                          <td className="py-2 px-3 font-medium">Customer Advances &amp; Booking Deposits</td>
                          <td className="py-2 px-3 text-slate-500">Gross cash received at counter &amp; bank deposits</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                            Rs. {kpiMetrics.grossCashInflow.toLocaleString()}
                          </td>
                        </tr>
                        {kpiMetrics.pendingReceivables > 0 && (
                          <tr className="bg-amber-50/40 text-amber-900">
                            <td className="py-2 px-3 font-medium">&bull; Pending Customer Receivables (Uncollected)</td>
                            <td className="py-2 px-3 text-amber-700">Pending final settlement invoice</td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-amber-700">
                              (Rs. {kpiMetrics.pendingReceivables.toLocaleString()})
                            </td>
                          </tr>
                        )}
                        <tr className="bg-emerald-50/40 font-bold">
                          <td colSpan={2} className="py-2 px-3 text-emerald-900">Total Gross Cash Inflow:</td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-800">
                            Rs. {kpiMetrics.grossCashInflow.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Cash Outflows */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2 flex items-center gap-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" /> Cash Outflows (Refunds Disbursed &amp; Event Expenses)
                    </h5>
                    <table className="w-full text-xs text-left">
                      <thead className="bg-rose-50/60 text-rose-900 border-y border-rose-100">
                        <tr>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Vendor / Recipient</th>
                          <th className="py-2 px-3 text-right font-mono">Amount (PKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {/* Show Refund row if any cancellation refunds occurred */}
                        {kpiMetrics.totalRefundsPaid > 0 && (
                          <tr className="bg-rose-50/30">
                            <td className="py-2 px-3 font-medium text-rose-900">Client Cancellation Refund (Cash Out)</td>
                            <td className="py-2 px-3 text-slate-500">Refunded to client after cancellation</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                              Rs. {kpiMetrics.totalRefundsPaid.toLocaleString()}
                            </td>
                          </tr>
                        )}
                        {filteredExpenses.length === 0 && kpiMetrics.totalRefundsPaid === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-3 px-3 text-center text-slate-400">
                              No cash disbursements logged for this event.
                            </td>
                          </tr>
                        ) : (
                          filteredExpenses.map((exp) => (
                            <tr key={exp.id}>
                              <td className="py-2 px-3 font-medium">{exp.category} - {exp.description}</td>
                              <td className="py-2 px-3 text-slate-500">{exp.paidTo || 'Operational Cash'}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                                Rs. {exp.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                        <tr className="bg-rose-50/40 font-bold">
                          <td colSpan={2} className="py-2 px-3 text-rose-900">Total Cash Outflow (Refunds + Expenses):</td>
                          <td className="py-2 px-3 text-right font-mono text-rose-800">
                            Rs. {(kpiMetrics.totalRefundsPaid + filteredExpenses.reduce((s, e) => s + e.amount, 0)).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Net Cashflow Summary Box */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-slate-700 uppercase">
                      Net Cashflow Balance (Gross Inflows &minus; Client Refunds &minus; Expenses):
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        kpiMetrics.netCashFlow >= 0
                          ? 'text-emerald-700'
                          : 'text-rose-600'
                      }`}
                    >
                      Rs. {kpiMetrics.netCashFlow.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PROFIT & LOSS STATEMENT (ACCRUAL BASIS) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-teal-700" />
                    PART 2: EVENT PROFIT &amp; LOSS (P&amp;L) STATEMENT
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">Recognized Revenue vs Incurred Costs</span>
                </div>

                <div className="p-4">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="py-2 px-3">Accounting Item</th>
                        <th className="py-2 px-3 text-right font-mono">Subtotal (PKR)</th>
                        <th className="py-2 px-3 text-right font-mono">Total (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {/* Revenue */}
                      <tr className="bg-slate-50/70 font-semibold text-slate-900">
                        <td className="py-2 px-3">A. GROSS RECOGNIZED EVENT REVENUE</td>
                        <td className="py-2 px-3 text-right font-mono"></td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-teal-800">
                          Rs. {kpiMetrics.totalRevenue.toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-6 text-slate-600">Base Venue Rent, Catering, Stage &amp; Extras</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-700">Rs. {kpiMetrics.totalRevenue.toLocaleString()}</td>
                        <td></td>
                      </tr>

                      {/* Direct Costs */}
                      <tr className="bg-slate-50/70 font-semibold text-slate-900">
                        <td className="py-2 px-3">B. DIRECT OPERATING &amp; EVENT COSTS</td>
                        <td className="py-2 px-3 text-right font-mono"></td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                          (Rs. {filteredExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()})
                        </td>
                      </tr>
                      {['Food', 'Outside Waiters', 'Decor', 'Operational Funds', 'Staff', 'Damage', 'Other'].map((cat) => {
                        const sum = filteredExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
                        if (sum <= 0) return null;
                        return (
                          <tr key={cat}>
                            <td className="py-1.5 px-6 text-slate-600">{cat} Incurred Cost</td>
                            <td className="py-1.5 px-3 text-right font-mono text-slate-700">Rs. {sum.toLocaleString()}</td>
                            <td></td>
                          </tr>
                        );
                      })}

                      {/* Gross Profit / Net Profit */}
                      <tr className="bg-teal-50 border-t-2 border-slate-300 font-bold text-sm">
                        <td className="py-2.5 px-3 text-teal-950">
                          NET EVENT PROFIT / CONTRIBUTION MARGIN:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-teal-700">
                          {kpiMetrics.profitMargin}% Margin
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono text-base ${kpiMetrics.netProfitNumeric >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          Rs. {kpiMetrics.netProfitNumeric.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" /> Print Financial Statement
              </button>
              <button
                type="button"
                onClick={() => setIsStatementModalOpen(false)}
                className="rounded-lg bg-teal-800 hover:bg-teal-900 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};