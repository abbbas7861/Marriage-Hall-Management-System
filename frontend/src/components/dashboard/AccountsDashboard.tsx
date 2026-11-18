import React from 'react';
import {
  Clock,
  DollarSign,
  FileText,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface RecentInvoiceItem {
  id: string;
  customer: string;
  amount: string;
  status: 'Paid' | 'Unpaid' | 'Partial';
}

export const AccountsDashboard: React.FC = () => {
  // Strictly empty arrays — zero hardcoded dummy data
  const chartData: Array<{ month: string; revenue: number; expenses: number }> = [];
  const recentInvoices: RecentInvoiceItem[] = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
          Accounts Executive Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Real-time overview of revenue inflows, receivables, operational expenses, and net profitability.
        </p>
      </div>

      {/* Top Row: 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Revenue
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            [--]
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Receivables
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            [--]
          </p>
        </div>

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
      </div>

      {/* Middle Row: Chart + Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Revenue vs Expenses BarChart */}
        <section className="lg:col-span-2 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
                Revenue vs Expenses
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly comparison of collected revenue and operational outflows
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
                data={chartData}
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

            {chartData.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="rounded-lg bg-white/90 border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500">
                  No financial data available.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Right: Recent Invoices */}
        <section className="lg:col-span-1 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
              Recent Invoices
            </h2>
            <span className="text-xs font-mono text-slate-400">
              ({recentInvoices.length})
            </span>
          </div>

          <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-200 grid grid-cols-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <span>Customer</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Status</span>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 px-5 text-center">
              <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                No recent invoices found.
              </p>
              <div className="mt-4 w-full rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2 grid grid-cols-3 text-xs font-mono text-slate-400">
                <span className="text-left">[--]</span>
                <span className="text-right">[--]</span>
                <span className="text-right">[--]</span>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentInvoices.map((inv) => (
                <li
                  key={inv.id}
                  className="px-5 py-3 grid grid-cols-3 items-center text-sm"
                >
                  <span className="font-medium text-slate-900 truncate">
                    {inv.customer}
                  </span>
                  <span className="font-mono tabular-nums text-right text-slate-700">
                    {inv.amount}
                  </span>
                  <span className="text-right text-xs font-semibold text-teal-700">
                    {inv.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
