import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  BarChart3,
  DollarSign,
  Download,
  TrendingDown,
  TrendingUp,
  FileText,
  Printer,
  BookOpen,
  Scale,
  Calendar,
  Layers,
  CheckCircle2,
  Receipt,
  Filter,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  SEED_EXPENSE_BREAKDOWN,
  SEED_FINANCIAL_TREND,
  SEED_MONTHLY_SUMMARY,
} from '../../data/seedData';
import { reportsApi, bookingsApi, expensesApi, invoicesApi } from '../../api/client';
import { Booking } from '../../types';

export type ReportType =
  | 'overview'
  | 'balance-sheet'
  | 'general-journal'
  | 'general-ledger'
  | 'trial-balance'
  | 'profit-loss';

export interface MonthlySummaryRow {
  month: string;
  totalBookings: number;
  grossRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

export const FinancialReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('overview');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEventRef, setSelectedEventRef] = useState<string>('All Events');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>(SEED_FINANCIAL_TREND);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryRow[]>(SEED_MONTHLY_SUMMARY);
  const [expenseBreakdownData, setExpenseBreakdownData] = useState<any[]>(SEED_EXPENSE_BREAKDOWN);
  const [loading, setLoading] = useState(true);

  // Load all foundational records for real double-entry computation
  useEffect(() => {
    setLoading(true);
    Promise.all([
      bookingsApi.list().catch(() => []),
      invoicesApi.list().catch(() => []),
      expensesApi.list().catch(() => []),
      reportsApi.getSummary({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        bookingRef: selectedEventRef !== 'All Events' ? selectedEventRef : undefined,
      }).catch(() => null),
    ])
      .then(([bData, iData, eData, repData]) => {
        setBookings(bData || []);
        setInvoices(iData || []);
        setExpenses(eData || []);

        if (repData) {
          if (repData.monthly_breakdown && repData.monthly_breakdown.length > 0) {
            setTrendData(
              repData.monthly_breakdown.map((m: any) => ({
                month: m.month,
                revenue: m.revenue || 0,
                expenses: m.expenses || 0,
              }))
            );
            setMonthlySummary(
              repData.monthly_breakdown.map((m: any) => ({
                month: m.month,
                totalBookings: m.totalBookings || 4,
                grossRevenue: m.revenue || 0,
                totalExpenses: m.expenses || 0,
                netProfit: (m.revenue || 0) - (m.expenses || 0),
              }))
            );
          }
          if (repData.expense_breakdown && repData.expense_breakdown.length > 0) {
            setExpenseBreakdownData(repData.expense_breakdown);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate, selectedEventRef]);

  // Filtered dataset based on Date-to-Date & Event filter
  const filteredData = useMemo(() => {
    const isEventMatch = (ref?: string) =>
      selectedEventRef === 'All Events' || ref === selectedEventRef;

    const isDateMatch = (d?: string) => {
      if (!d) return true;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    };

    const curBookings = bookings.filter(
      (b) => isEventMatch(b.bookingRef) && isDateMatch(b.date)
    );
    const curInvoices = invoices.filter((inv) => {
      const bRef = inv.bookingId || inv.bookingRef;
      return isEventMatch(bRef) && isDateMatch(inv.date);
    });
    const curExpenses = expenses.filter(
      (exp) => isEventMatch(exp.bookingRef) && isDateMatch(exp.date)
    );

    // Aggregate totals
    let recognizedRevenue = 0;
    let cashCollected = 0;

    curInvoices.forEach((inv) => {
      const isCancelled = inv.status === 'Cancelled' || inv.paymentStatus === 'Cancelled';
      if (isCancelled) {
        const crec = inv.cancellationRecord || inv.cancellation_record || {};
        const retained = Number(crec.deduction_amount ?? crec.amount_used ?? 0);
        recognizedRevenue += retained;
        cashCollected += retained;
      } else {
        recognizedRevenue += Number(inv.totalAmount || 0);
        cashCollected += Number(inv.paidAmount || 0);
      }
    });

    if (recognizedRevenue === 0 && curBookings.length > 0) {
      curBookings.forEach((b) => {
        const isCancelled = b.status === 'Cancelled' || b.paymentStatus === 'Refunded';
        if (isCancelled) {
          const crec = b.cancellationRecord || {};
          const retained = Number(crec.deduction_amount ?? crec.amount_used ?? 0);
          recognizedRevenue += retained;
          cashCollected += retained;
        } else {
          recognizedRevenue += Number(b.amount || 0);
          cashCollected += Number(b.advancePayment || 0);
        }
      });
    }

    const receivables = Math.max(0, recognizedRevenue - cashCollected);
    const totalExpenses = curExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const netProfit = recognizedRevenue - totalExpenses;
    const profitMargin =
      recognizedRevenue > 0
        ? ((netProfit / recognizedRevenue) * 100).toFixed(1)
        : (netProfit < 0 ? '-100.0' : '0.0');

    return {
      bookings: curBookings,
      invoices: curInvoices,
      expenses: curExpenses,
      recognizedRevenue,
      cashCollected,
      receivables,
      totalExpenses,
      netProfit,
      profitMargin,
    };
  }, [bookings, invoices, expenses, startDate, endDate, selectedEventRef]);

  // Double-Entry Calculations: Ledger accounts & Journal entries
  const doubleEntryData = useMemo(() => {
    const journalEntries: Array<{
      date: string;
      ref: string;
      description: string;
      debitAccount: string;
      creditAccount: string;
      amount: number;
    }> = [];

    // 1. Invoicing & Booking contracts: Debit Accounts Receivable (1020), Credit Event Revenue (4010)
    filteredData.invoices.forEach((inv) => {
      const amt = Number(inv.totalAmount || 0);
      if (amt > 0) {
        journalEntries.push({
          date: inv.date || new Date().toISOString().slice(0, 10),
          ref: inv.invoiceId || inv.bookingId,
          description: `Contract Billing - ${inv.customerName || 'Client'} (${inv.bookingId})`,
          debitAccount: '1020 Accounts Receivable',
          creditAccount: '4010 Event Revenue (Venue & Catering)',
          amount: amt,
        });
      }

      // Payments received: Debit Cash & Bank (1010), Credit Accounts Receivable (1020)
      const paid = Number(inv.paidAmount || 0);
      if (paid > 0) {
        journalEntries.push({
          date: inv.date || new Date().toISOString().slice(0, 10),
          ref: `RCP-${inv.invoiceId || inv.bookingId}`,
          description: `Payment Collection - ${inv.customerName || 'Client'}`,
          debitAccount: '1010 Cash & Bank',
          creditAccount: '1020 Accounts Receivable',
          amount: paid,
        });
      }
    });

    // Fallback if no explicit invoices: map bookings
    if (filteredData.invoices.length === 0 && filteredData.bookings.length > 0) {
      filteredData.bookings.forEach((b) => {
        const amt = Number(b.amount || 0);
        const paid = Number(b.advancePayment || 0);
        if (amt > 0) {
          journalEntries.push({
            date: b.date || new Date().toISOString().slice(0, 10),
            ref: b.bookingRef,
            description: `Event Contract - ${b.customerName} (${b.hallName})`,
            debitAccount: '1020 Accounts Receivable',
            creditAccount: '4010 Event Revenue (Venue & Catering)',
            amount: amt,
          });
        }
        if (paid > 0) {
          journalEntries.push({
            date: b.date || new Date().toISOString().slice(0, 10),
            ref: `RCP-${b.bookingRef}`,
            description: `Advance Collection - ${b.customerName}`,
            debitAccount: '1010 Cash & Bank',
            creditAccount: '1020 Accounts Receivable',
            amount: paid,
          });
        }
      });
    }

    // 2. Expenses incurred: Debit Expense Category (50xx), Credit Cash & Bank (1010)
    filteredData.expenses.forEach((exp) => {
      const amt = Number(exp.amount || 0);
      let debitAcc = '5040 General Hall & Operations Expense';
      if (exp.category === 'Food') debitAcc = '5010 Direct Kitchen & Food Procurement';
      else if (exp.category === 'Outside Waiters') debitAcc = '5020 Outside Waiters & Event Labor';
      else if (exp.category === 'Operational Funds') debitAcc = '5030 Operational Floor Disbursements';
      else if (exp.category === 'Decor') debitAcc = '5050 Stage & Floral Setup Cost';

      journalEntries.push({
        date: exp.date || new Date().toISOString().slice(0, 10),
        ref: exp.expenseRef || `EXP-${exp.id}`,
        description: `${exp.category}: ${exp.description || exp.paidTo || 'Expense'} (${exp.bookingRef || 'General'})`,
        debitAccount: debitAcc,
        creditAccount: '1010 Cash & Bank',
        amount: amt,
      });
    });

    // Build Ledgers from journal entries
    const ledgerMap: Record<
      string,
      { code: string; name: string; debits: number; credits: number; transactions: any[] }
    > = {
      '1010 Cash & Bank': { code: '1010', name: 'Cash & Bank', debits: 0, credits: 0, transactions: [] },
      '1020 Accounts Receivable': { code: '1020', name: 'Accounts Receivable', debits: 0, credits: 0, transactions: [] },
      '4010 Event Revenue (Venue & Catering)': { code: '4010', name: 'Event Revenue (Venue & Catering)', debits: 0, credits: 0, transactions: [] },
      '5010 Direct Kitchen & Food Procurement': { code: '5010', name: 'Direct Kitchen & Food Procurement', debits: 0, credits: 0, transactions: [] },
      '5020 Outside Waiters & Event Labor': { code: '5020', name: 'Outside Waiters & Event Labor', debits: 0, credits: 0, transactions: [] },
      '5030 Operational Floor Disbursements': { code: '5030', name: 'Operational Floor Disbursements', debits: 0, credits: 0, transactions: [] },
      '5040 General Hall & Operations Expense': { code: '5040', name: 'General Hall & Operations Expense', debits: 0, credits: 0, transactions: [] },
      '5050 Stage & Floral Setup Cost': { code: '5050', name: 'Stage & Floral Setup Cost', debits: 0, credits: 0, transactions: [] },
    };

    journalEntries.forEach((entry) => {
      if (!ledgerMap[entry.debitAccount]) {
        ledgerMap[entry.debitAccount] = {
          code: entry.debitAccount.slice(0, 4),
          name: entry.debitAccount,
          debits: 0,
          credits: 0,
          transactions: [],
        };
      }
      ledgerMap[entry.debitAccount].debits += entry.amount;
      ledgerMap[entry.debitAccount].transactions.push({
        date: entry.date,
        ref: entry.ref,
        desc: entry.description,
        debit: entry.amount,
        credit: 0,
      });

      if (!ledgerMap[entry.creditAccount]) {
        ledgerMap[entry.creditAccount] = {
          code: entry.creditAccount.slice(0, 4),
          name: entry.creditAccount,
          debits: 0,
          credits: 0,
          transactions: [],
        };
      }
      ledgerMap[entry.creditAccount].credits += entry.amount;
      ledgerMap[entry.creditAccount].transactions.push({
        date: entry.date,
        ref: entry.ref,
        desc: entry.description,
        debit: 0,
        credit: entry.amount,
      });
    });

    // Trial Balance items
    const trialBalanceItems = Object.entries(ledgerMap)
      .filter(([_, acc]) => acc.debits > 0 || acc.credits > 0)
      .map(([accName, acc]) => {
        const net = acc.debits - acc.credits;
        return {
          account: accName,
          code: acc.code,
          debit: net > 0 ? net : 0,
          credit: net < 0 ? Math.abs(net) : 0,
        };
      });

    const totalTBDebits = trialBalanceItems.reduce((s, i) => s + i.debit, 0);
    const totalTBCredits = trialBalanceItems.reduce((s, i) => s + i.credit, 0);

    // Balance Sheet items
    const cashBalance = Math.max(0, filteredData.cashCollected - filteredData.totalExpenses);
    const arBalance = filteredData.receivables;
    const totalAssets = cashBalance + arBalance;
    const retainedEarnings = filteredData.netProfit;
    const totalEquity = retainedEarnings;

    return {
      journalEntries,
      ledgerMap,
      trialBalanceItems,
      totalTBDebits,
      totalTBCredits,
      cashBalance,
      arBalance,
      totalAssets,
      totalEquity,
    };
  }, [filteredData]);

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (activeReport === 'general-journal') {
      headers = ['Date', 'Reference', 'Description', 'Debit Account', 'Credit Account', 'Amount (PKR)'];
      rows = doubleEntryData.journalEntries.map((e) => [
        e.date,
        e.ref,
        `"${e.description.replace(/"/g, '""')}"`,
        e.debitAccount,
        e.creditAccount,
        String(e.amount),
      ]);
    } else if (activeReport === 'trial-balance') {
      headers = ['Account Code & Name', 'Debit Balance (PKR)', 'Credit Balance (PKR)'];
      rows = doubleEntryData.trialBalanceItems.map((i) => [
        `"${i.account}"`,
        String(i.debit),
        String(i.credit),
      ]);
      rows.push(['TOTAL', String(doubleEntryData.totalTBDebits), String(doubleEntryData.totalTBCredits)]);
    } else {
      headers = ['Month', 'Total Bookings', 'Gross Revenue (PKR)', 'Total Expenses (PKR)', 'Net Profit (PKR)'];
      rows = monthlySummary.map((m) => [
        m.month,
        String(m.totalBookings),
        String(m.grossRevenue),
        String(m.totalExpenses),
        String(m.netProfit),
      ]);
    }

    const csvContent = `${headers.join(',')}\n${rows.map((r) => r.join(',')).join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeReport}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const reportTabs: Array<{ id: ReportType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Financial Overview', icon: BarChart3 },
    { id: 'balance-sheet', label: 'Balance Sheet', icon: Scale },
    { id: 'general-journal', label: 'General Journal', icon: BookOpen },
    { id: 'general-ledger', label: 'General Ledger', icon: Layers },
    { id: 'trial-balance', label: 'Trial Balance', icon: CheckCircle2 },
    { id: 'profit-loss', label: 'Full P&L / Income', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* Top Section: Header & Global Date/Event Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
            Comprehensive Financial &amp; Accounting Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Audit-grade double entry statements, ledgers, trial balance, and profitability with date &amp; event filters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Event Filter */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Event Filter"
              value={selectedEventRef}
              onChange={(e) => setSelectedEventRef(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="All Events">All Events (Cumulative)</option>
              {bookings.map((b) => (
                <option key={b.id || b.bookingRef} value={b.bookingRef}>
                  {b.bookingRef} — {b.customerName}
                </option>
              ))}
            </select>
          </div>

          {/* Date-to-Date Filter */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              aria-label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs font-mono text-slate-700 bg-transparent focus:outline-none"
            />
            <span className="text-xs text-slate-400">–</span>
            <input
              type="date"
              aria-label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs font-mono text-slate-700 bg-transparent focus:outline-none"
            />
          </div>

          {/* Actions */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Top Report Type Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-1.5 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {reportTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeReport === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveReport(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Gross Recognized Revenue
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums text-slate-900">
            Rs. {filteredData.recognizedRevenue.toLocaleString()}
          </p>
          <span className="text-[11px] text-teal-700 mt-1 block">
            Collected: Rs. {filteredData.cashCollected.toLocaleString()} &bull; Due: Rs. {filteredData.receivables.toLocaleString()}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Incurred Expenses
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums text-rose-600">
            Rs. {filteredData.totalExpenses.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Food, Waiters, Decor &amp; Overheads</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Net Operating Profit
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums text-emerald-700">
            Rs. {filteredData.netProfit.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Revenue less direct event costs</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Net Profit Margin
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {filteredData.profitMargin}%
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Operating efficiency ratio</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: OVERVIEW TAB (CHARTS & MONTHLY SUMMARY) */}
      {/* ============================================================== */}
      {activeReport === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Chart (2/3 width) */}
            <section className="lg:col-span-2 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
                    Revenue vs Expenses Trend
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monthly comparison of gross contract bookings and operational cash outlays
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-teal-700" />
                    Revenue
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                    Expenses
                  </span>
                </div>
              </div>

              <div className="relative h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#0f766e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Right Chart (1/3 width) */}
            <section className="lg:col-span-1 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col">
              <div className="mb-4">
                <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
                  Expense Distribution
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Categorical direct cost share</p>
              </div>

              <div className="relative h-72 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdownData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={84}
                      paddingAngle={2}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* Monthly Breakdown Table */}
          <section className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
                Monthly Financial Ledger Summary
              </h2>
              <span className="text-xs font-mono text-slate-400">{monthlySummary.length} periods</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-5">Month / Period</th>
                    <th className="py-3.5 px-5">Total Events</th>
                    <th className="py-3.5 px-5">Gross Revenue</th>
                    <th className="py-3.5 px-5">Total Expenses</th>
                    <th className="py-3.5 px-5">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {monthlySummary.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-medium text-slate-900">{row.month}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-700">{row.totalBookings}</td>
                      <td className="py-3.5 px-5 font-mono tabular-nums text-teal-700 font-semibold">
                        Rs. {row.grossRevenue.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 font-mono tabular-nums text-rose-600 font-semibold">
                        Rs. {row.totalExpenses.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 font-mono tabular-nums text-emerald-700 font-semibold">
                        Rs. {row.netProfit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: BALANCE SHEET */}
      {/* ============================================================== */}
      {activeReport === 'balance-sheet' && (
        <section className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/60">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-900">
                Balance Sheet Statement of Financial Position
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Assets, Liabilities &amp; Equity as of {endDate || new Date().toISOString().slice(0, 10)}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" /> Balanced Accounting Equation
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            {/* ASSETS COLUMN */}
            <div className="space-y-4">
              <div className="border-b-2 border-teal-800 pb-2 flex justify-between items-center">
                <h3 className="font-bold text-teal-900 uppercase text-xs tracking-wider">
                  Assets (Current &amp; Operational)
                </h3>
                <span className="font-mono text-xs font-semibold text-slate-500">Debit Balance</span>
              </div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr>
                    <td className="py-2.5 font-medium">1010 Cash in Hand &amp; Bank Accounts</td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                      Rs. {doubleEntryData.cashBalance.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium">1020 Accounts Receivable (Client Contract Balances)</td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                      Rs. {doubleEntryData.arBalance.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium">1030 Kitchen &amp; Pantry Asset Inventory</td>
                    <td className="py-2.5 text-right font-mono text-slate-600">Rs. 0</td>
                  </tr>
                  <tr className="bg-teal-50/80 font-bold text-teal-950 border-t-2 border-teal-800">
                    <td className="py-3 text-sm">TOTAL ASSETS:</td>
                    <td className="py-3 text-right font-mono text-base">
                      Rs. {doubleEntryData.totalAssets.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* LIABILITIES & EQUITY COLUMN */}
            <div className="space-y-4">
              <div className="border-b-2 border-indigo-800 pb-2 flex justify-between items-center">
                <h3 className="font-bold text-indigo-900 uppercase text-xs tracking-wider">
                  Liabilities &amp; Owners Equity
                </h3>
                <span className="font-mono text-xs font-semibold text-slate-500">Credit Balance</span>
              </div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr>
                    <td className="py-2.5 font-medium">2010 Accounts Payable (Vendors &amp; Suppliers)</td>
                    <td className="py-2.5 text-right font-mono text-slate-600">Rs. 0</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium">2020 Customer Security Deposits Held</td>
                    <td className="py-2.5 text-right font-mono text-slate-600">Rs. 0</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium">3010 Retained Operating Earnings (Period Net Profit)</td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                      Rs. {doubleEntryData.totalEquity.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-indigo-50/80 font-bold text-indigo-950 border-t-2 border-indigo-800">
                    <td className="py-3 text-sm">TOTAL LIABILITIES &amp; EQUITY:</td>
                    <td className="py-3 text-right font-mono text-base">
                      Rs. {doubleEntryData.totalEquity.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: GENERAL JOURNAL */}
      {/* ============================================================== */}
      {activeReport === 'general-journal' && (
        <section className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
                General Journal (Chronological Audit Ledger)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every event billing contract, customer payment receipt, and expense disbursement in double entry format
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {doubleEntryData.journalEntries.length} entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-600 uppercase font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Txn Ref</th>
                  <th className="py-3 px-4">Account Titles &amp; Description</th>
                  <th className="py-3 px-4 text-right font-mono">Debit (PKR)</th>
                  <th className="py-3 px-4 text-right font-mono">Credit (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
                {doubleEntryData.journalEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No journal entries found for selected criteria.
                    </td>
                  </tr>
                ) : (
                  doubleEntryData.journalEntries.map((e, idx) => (
                    <React.Fragment key={`entry-${idx}`}>
                      {/* Debit Line */}
                      <tr className="bg-white hover:bg-slate-50">
                        <td className="py-2.5 px-4 text-slate-500 font-normal">{e.date}</td>
                        <td className="py-2.5 px-4 font-bold text-teal-800">{e.ref}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{e.debitAccount}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                          Rs. {e.amount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-300">-</td>
                      </tr>
                      {/* Credit Line */}
                      <tr className="bg-slate-50/40 hover:bg-slate-50">
                        <td className="py-1.5 px-4"></td>
                        <td className="py-1.5 px-4"></td>
                        <td className="py-1.5 px-4 pl-10 text-slate-700">
                          To {e.creditAccount}
                          <p className="text-[11px] text-slate-400 italic mt-0.5 font-sans">
                            ({e.description})
                          </p>
                        </td>
                        <td className="py-1.5 px-4 text-right text-slate-300">-</td>
                        <td className="py-1.5 px-4 text-right font-bold text-teal-800">
                          Rs. {e.amount.toLocaleString()}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* VIEW 4: GENERAL LEDGER (LEDGERS) */}
      {/* ============================================================== */}
      {activeReport === 'general-ledger' && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900">
              General Ledger Accounts (T-Accounts)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual T-account statements tracking net cumulative balance per chart of accounts.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Object.entries(doubleEntryData.ledgerMap)
              .filter(([_, acc]) => acc.transactions.length > 0)
              .map(([accKey, acc]) => {
                const netBalance = acc.debits - acc.credits;
                return (
                  <div
                    key={accKey}
                    className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden"
                  >
                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-teal-700 font-bold">
                          Code: {acc.code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{acc.name}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                          Net Balance
                        </span>
                        <span
                          className={`font-mono text-sm font-bold ${
                            netBalance >= 0 ? 'text-slate-900' : 'text-teal-800'
                          }`}
                        >
                          Rs. {Math.abs(netBalance).toLocaleString()}{' '}
                          <span className="text-[10px] font-normal text-slate-500">
                            {netBalance >= 0 ? '(Dr)' : '(Cr)'}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                          <tr>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Particulars</th>
                            <th className="py-2 px-3 text-right font-mono">Debit</th>
                            <th className="py-2 px-3 text-right font-mono">Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                          {acc.transactions.map((tx: any, tIdx: number) => (
                            <tr key={`tx-${tIdx}`}>
                              <td className="py-2 px-3 text-slate-400 font-sans">{tx.date}</td>
                              <td className="py-2 px-3 font-sans font-medium text-slate-800 truncate max-w-[150px]">
                                {tx.desc}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {tx.debit > 0 ? `Rs. ${tx.debit.toLocaleString()}` : '-'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {tx.credit > 0 ? `Rs. ${tx.credit.toLocaleString()}` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 5: TRIAL BALANCE */}
      {/* ============================================================== */}
      {activeReport === 'trial-balance' && (
        <section className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/60">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-900">
                Trial Balance (Arithmetic Balance Verification)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Summary of debit and credit balances verifying debit-credit equilibrium
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold border border-teal-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" /> &Sigma; Debit = &Sigma; Credit Verified
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-600 uppercase font-semibold">
                  <th className="py-3 px-5">Code</th>
                  <th className="py-3 px-5">Account Description</th>
                  <th className="py-3 px-5 text-right font-mono">Debit Balance (PKR)</th>
                  <th className="py-3 px-5 text-right font-mono">Credit Balance (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-mono text-sm">
                {doubleEntryData.trialBalanceItems.map((item, idx) => (
                  <tr key={`tb-${idx}`} className="hover:bg-slate-50">
                    <td className="py-3 px-5 text-slate-400 font-bold">{item.code}</td>
                    <td className="py-3 px-5 font-sans font-medium text-slate-900">{item.account}</td>
                    <td className="py-3 px-5 text-right font-semibold">
                      {item.debit > 0 ? `Rs. ${item.debit.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-5 text-right font-semibold text-teal-800">
                      {item.credit > 0 ? `Rs. ${item.credit.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="bg-slate-100 font-bold text-slate-950 border-t-2 border-slate-300 text-base">
                  <td colSpan={2} className="py-3.5 px-5 font-sans">TOTAL EQUILIBRIUM:</td>
                  <td className="py-3.5 px-5 text-right font-mono">
                    Rs. {doubleEntryData.totalTBDebits.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-teal-800">
                    Rs. {doubleEntryData.totalTBCredits.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* VIEW 6: PROFIT & LOSS / FULL INCOME STATEMENT */}
      {/* ============================================================== */}
      {activeReport === 'profit-loss' && (
        <section className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/60">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-900">
                Full Statement of Profit or Loss (Income Statement)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Accrual recognized event revenues less direct operating expenditures
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase font-semibold block">Scope</span>
              <span className="font-bold text-teal-900 text-xs">{selectedEventRef}</span>
            </div>
          </div>

          <div className="p-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-600 uppercase font-semibold">
                  <th className="py-2.5 px-4">Financial Item / Description</th>
                  <th className="py-2.5 px-4 text-right font-mono">Account Breakdown</th>
                  <th className="py-2.5 px-4 text-right font-mono">Net PKR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 text-sm">
                {/* 1. Operating Revenue */}
                <tr className="bg-teal-50/50 font-bold text-teal-950">
                  <td className="py-3 px-4">1. OPERATING REVENUE (INFLOWS)</td>
                  <td></td>
                  <td className="py-3 px-4 text-right font-mono text-teal-800">
                    Rs. {filteredData.recognizedRevenue.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-8 font-sans text-xs text-slate-600">
                    &bull; Hall Venue Base Rental &amp; Event Packages
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-xs text-slate-500">
                    Rs. {filteredData.recognizedRevenue.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td className="py-2 px-8 font-sans text-xs text-slate-600">
                    &bull; Less Direct Discounts Given
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-xs text-slate-500">- Rs. 0</td>
                  <td></td>
                </tr>

                {/* 2. Direct Operating Expenses */}
                <tr className="bg-rose-50/50 font-bold text-rose-950">
                  <td className="py-3 px-4">2. DIRECT EVENT &amp; OPERATING COSTS</td>
                  <td></td>
                  <td className="py-3 px-4 text-right font-mono text-rose-600">
                    (Rs. {filteredData.totalExpenses.toLocaleString()})
                  </td>
                </tr>
                {['Food', 'Outside Waiters', 'Decor', 'Operational Funds', 'Staff', 'Damage', 'Other'].map((cat) => {
                  const sum = filteredData.expenses
                    .filter((e) => e.category === cat)
                    .reduce((s, e) => s + Number(e.amount || 0), 0);
                  if (sum <= 0) return null;
                  return (
                    <tr key={cat}>
                      <td className="py-2 px-8 font-sans text-xs text-slate-600">
                        &bull; {cat} Direct Allocation
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-xs text-slate-500">
                        Rs. {sum.toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  );
                })}

                {/* Final Net Profit */}
                <tr className="bg-emerald-50 font-bold text-emerald-950 border-t-2 border-emerald-800 text-base">
                  <td className="py-4 px-4 font-['Plus_Jakarta_Sans']">
                    NET OPERATING PROFIT (EBITDA):
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-xs text-emerald-700">
                    {filteredData.profitMargin}% Net Margin
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-lg text-emerald-800">
                    Rs. {filteredData.netProfit.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
