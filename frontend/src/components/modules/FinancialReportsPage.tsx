import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  DollarSign,
  Download,
  TrendingDown,
  TrendingUp,
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

export interface MonthlySummaryRow {
  month: string;
  totalBookings: number;
  grossRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

export const FinancialReportsPage: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Strictly empty arrays — zero hardcoded dummy data
  const trendData: Array<{ month: string; revenue: number; expenses: number }> = [];
  const expenseBreakdownData: Array<{ name: string; value: number }> = [];
  const monthlySummary: MonthlySummaryRow[] = [];

  const handleExportReport = () => {
    const headers = [
      'Month',
      'Total Bookings',
      'Gross Revenue',
      'Total Expenses',
      'Net Profit',
    ];
    const csvContent = `${headers.join(',')}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'financial-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
            Financial Reports &amp; Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Analyze revenue, expenses, and overall business profitability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
            <input
              type="date"
              aria-label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm font-mono text-slate-700 bg-transparent focus:outline-none"
            />
            <span className="text-xs text-slate-400">–</span>
            <input
              type="date"
              aria-label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm font-mono text-slate-700 bg-transparent focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleExportReport}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Top Row: 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Revenue */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Gross Revenue
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            [--]
          </p>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Expenses
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            [--]
          </p>
        </div>

        {/* Card 3: Net Profit */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Net Profit
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            [--]
          </p>
        </div>

        {/* Card 4: Profit Margin */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Profit Margin
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            [--]%
          </p>
        </div>
      </div>

      {/* Middle Row: Charts using Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Chart (2/3 width): Revenue vs Expenses Trend */}
        <section className="lg:col-span-2 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
                Revenue vs Expenses Trend
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly comparison of gross inflows and operational outflows
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
              <BarChart
                data={trendData}
                margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <Tooltip />
                <Bar dataKey="revenue" fill="#0f766e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {trendData.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="rounded-lg bg-white/90 border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500">
                  No data available for the selected period.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Right Chart (1/3 width): Expense Breakdown */}
        <section className="lg:col-span-1 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col">
          <div className="mb-4">
            <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
              Expense Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribution by operational category
            </p>
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

            {expenseBreakdownData.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <div className="w-28 h-28 rounded-full border-[10px] border-slate-100 flex items-center justify-center mb-3">
                  <span className="font-mono text-xs text-slate-400">[--]</span>
                </div>
                <p className="text-sm font-medium text-slate-500">
                  No expense data available.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Bottom Section: Monthly Financial Summary Table */}
      <section className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
            Monthly Financial Summary
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {monthlySummary.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Month
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Bookings
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Gross Revenue
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Expenses
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Net Profit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlySummary.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 px-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                        <BarChart3 className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        No financial records found for the selected period.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                monthlySummary.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-medium text-slate-900">
                      {row.month}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-mono tabular-nums text-slate-700">
                      {row.totalBookings}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-mono tabular-nums text-teal-700 font-semibold">
                      Rs. {row.grossRevenue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-mono tabular-nums text-rose-600 font-semibold">
                      Rs. {row.totalExpenses.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-mono tabular-nums text-emerald-700 font-semibold">
                      Rs. {row.netProfit.toLocaleString()}
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
