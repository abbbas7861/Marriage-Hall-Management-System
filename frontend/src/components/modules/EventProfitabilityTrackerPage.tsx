import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Receipt,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import {
  SEED_EVENT_TRACKER_EXPENSES,
  SEED_PENDING_FUND_REQUESTS,
} from '../../data/seedData';

export type TrackerExpenseCategory = 'Food' | 'Decor' | 'Damage';
export type TrackerExpenseStatus = 'Approved' | 'Pending';

export interface PendingFundRequest {
  id: string;
  eventName: string;
  requestedBy: string;
  reason: string;
  amount: number;
  requestedAt: string;
}

export interface EventTrackerExpense {
  id: string;
  eventName: string;
  date: string;
  category: TrackerExpenseCategory;
  description: string;
  amount: number;
  status: TrackerExpenseStatus;
}

const EVENT_FILTER_OPTIONS = ['All Events', 'Event A', 'Event B'];

const CATEGORY_BADGE_STYLES: Record<TrackerExpenseCategory, string> = {
  Food: 'bg-teal-50 text-teal-800 border-teal-200',
  Decor: 'bg-purple-50 text-purple-800 border-purple-200',
  Damage: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_BADGE_STYLES: Record<TrackerExpenseStatus, string> = {
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
};

export const EventProfitabilityTrackerPage: React.FC = () => {
  // Filter bar state
  const [selectedEvent, setSelectedEvent] = useState<string>('All Events');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [fundRequests, setFundRequests] = useState<PendingFundRequest[]>(
    SEED_PENDING_FUND_REQUESTS
  );
  const [expenses, setExpenses] = useState<EventTrackerExpense[]>(
    SEED_EVENT_TRACKER_EXPENSES
  );
  const [eventRevenues] = useState<Record<string, number>>({
    'Event A': 1930000,
    'Event B': 1180000,
  });

  const filteredRequests = useMemo(() => {
    return fundRequests.filter(
      (req) => selectedEvent === 'All Events' || req.eventName === selectedEvent
    );
  }, [fundRequests, selectedEvent]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesEvent =
        selectedEvent === 'All Events' || exp.eventName === selectedEvent;
      const matchesStart = !startDate || exp.date >= startDate;
      const matchesEnd = !endDate || exp.date <= endDate;
      return matchesEvent && matchesStart && matchesEnd;
    });
  }, [expenses, selectedEvent, startDate, endDate]);

  const kpiMetrics = useMemo(() => {
    const hasRevenue =
      selectedEvent === 'All Events'
        ? Object.keys(eventRevenues).length > 0
        : eventRevenues[selectedEvent] !== undefined;

    if (!hasRevenue && filteredExpenses.length === 0) {
      return {
        revenueLabel: '[--]',
        expensesLabel: '[--]',
        netProfitLabel: '[--]',
        netProfitNumeric: null as number | null,
      };
    }

    const totalRevenue =
      selectedEvent === 'All Events'
        ? Object.values(eventRevenues).reduce((sum, v) => sum + v, 0)
        : eventRevenues[selectedEvent] ?? 0;

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    return {
      revenueLabel: `Rs. ${totalRevenue.toLocaleString()}`,
      expensesLabel: `Rs. ${totalExpenses.toLocaleString()}`,
      netProfitLabel: `Rs. ${netProfit.toLocaleString()}`,
      netProfitNumeric: netProfit,
    };
  }, [eventRevenues, filteredExpenses, selectedEvent]);

  const handleApproveRequest = (req: PendingFundRequest) => {
    setFundRequests((prev) => prev.filter((item) => item.id !== req.id));
    setExpenses((prev) => [
      {
        id: `EXP-${Date.now().toString().slice(-4)}`,
        eventName: req.eventName,
        date: new Date().toISOString().slice(0, 10),
        category: 'Food',
        description: req.reason,
        amount: req.amount,
        status: 'Approved',
      },
      ...prev,
    ]);
  };

  const handleRejectRequest = (id: string) => {
    setFundRequests((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
          Event Expense &amp; Profitability Tracker
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor event-level revenue, approve manager fund requisitions, and track net profitability.
        </p>
      </div>

      {/* Top Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <label
            htmlFor="tracker-event-filter"
            className="text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
          >
            Filter by Event
          </label>
          <select
            id="tracker-event-filter"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 min-w-[180px]"
          >
            {EVENT_FILTER_OPTIONS.map((ev) => (
              <option key={ev} value={ev}>
                {ev}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
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

      {/* KPI Cards (3 Cards - Dynamic based on filter) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Event Revenue
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.revenueLabel}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Event Expenses
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.expensesLabel}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Event Net Profit
            </span>
            <div
              className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                kpiMetrics.netProfitNumeric !== null && kpiMetrics.netProfitNumeric < 0
                  ? 'bg-rose-50 border-rose-100'
                  : 'bg-emerald-50 border-emerald-100'
              }`}
            >
              <DollarSign
                className={`w-4 h-4 ${
                  kpiMetrics.netProfitNumeric !== null && kpiMetrics.netProfitNumeric < 0
                    ? 'text-rose-600'
                    : 'text-emerald-600'
                }`}
              />
            </div>
          </div>
          <p
            className={`mt-3 text-3xl font-bold font-mono tabular-nums ${
              kpiMetrics.netProfitNumeric === null
                ? 'text-slate-900'
                : kpiMetrics.netProfitNumeric < 0
                  ? 'text-rose-600'
                  : 'text-emerald-700'
            }`}
          >
            {kpiMetrics.netProfitLabel}
          </p>
        </div>
      </div>

      {/* Pending Fund Requests Section */}
      <section className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
              Pending Fund Requests
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and disburse operational fund requisitions submitted by Managers
            </p>
          </div>
          <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-mono font-semibold text-amber-800">
            {filteredRequests.length} Pending
          </span>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              No pending fund requests from managers.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Incoming requisitions from the Manager Event Control Center will appear here for approval.
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
                      {req.requestedBy} requested{' '}
                      <span className="font-mono tabular-nums text-teal-800">
                        Rs. {req.amount.toLocaleString()}
                      </span>{' '}
                      for {req.reason}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Event: <span className="font-medium text-slate-700">{req.eventName}</span>{' '}
                    &middot; Requested at <span className="font-mono">{req.requestedAt}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApproveRequest(req)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve &amp; Disburse
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectRequest(req.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
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
          <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
            Event Expense Ledger
          </h2>
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
                  Description
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
                  <td colSpan={5} className="py-16 px-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                        <Receipt className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        No event expenses recorded yet.
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Approved disbursements and event costs (Food, Decor, Damage) will be itemized here.
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
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_BADGE_STYLES[exp.category]}`}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-sm font-medium text-slate-900">
                      {exp.description}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-mono tabular-nums font-semibold text-rose-600">
                      Rs. {exp.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_STYLES[exp.status]}`}
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
    </div>
  );
};
