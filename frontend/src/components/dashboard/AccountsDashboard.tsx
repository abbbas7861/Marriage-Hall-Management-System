import React from 'react';
import {
  BarChart3,
  Clock,
  DollarSign,
  FileText,
  Receipt,
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
import { SEED_FINANCIAL_TREND, SEED_INVOICES } from '../../data/seedData';

interface RecentInvoiceItem {
  id: string;
  customer: string;
  amount: string;
  status: 'Paid' | 'Unpaid' | 'Partial';
}

interface AccountsDashboardProps {
  onNavigate?: (navId: string) => void;
}

export const AccountsDashboard: React.FC<AccountsDashboardProps> = ({
  onNavigate,
}) => {
  const chartData = SEED_FINANCIAL_TREND;
  const recentInvoices: RecentInvoiceItem[] = SEED_INVOICES.map((inv) => ({
    id: inv.id,
    customer: inv.customerName,
    amount: `Rs. ${inv.totalAmount.toLocaleString('en-PK')}`,
    status: inv.status,
  }));

  const kpiCards = [
    {
      label: 'Total Revenue',
      value: 'Rs. 5,931,000',
      caption: 'Collected & billed period total',
      icon: TrendingUp,
      iconBox:
        'bg-gradient-to-br from-teal-50 to-teal-100/90 border border-teal-200/70 text-teal-700',
    },
    {
      label: 'Pending Receivables',
      value: 'Rs. 3,251,000',
      caption: 'Awaiting customer settlement',
      icon: Clock,
      iconBox:
        'bg-gradient-to-br from-amber-50 to-amber-100/90 border border-amber-200/70 text-amber-600',
    },
    {
      label: 'Total Expenses',
      value: 'Rs. 2,290,000',
      caption: 'Catering, utilities & payroll',
      icon: TrendingDown,
      iconBox:
        'bg-gradient-to-br from-rose-50 to-rose-100/90 border border-rose-200/70 text-rose-600',
    },
    {
      label: 'Net Profit',
      value: 'Rs. 3,641,000',
      caption: 'Net operating margin',
      icon: DollarSign,
      iconBox:
        'bg-gradient-to-br from-emerald-50 to-emerald-100/90 border border-emerald-200/70 text-emerald-700',
    },
  ];

  const getStatusClass = (status: RecentInvoiceItem['status']) => {
    if (status === 'Paid') return 'text-emerald-700 bg-emerald-50 border-emerald-200/80';
    if (status === 'Partial') return 'text-amber-700 bg-amber-50 border-amber-200/80';
    return 'text-rose-700 bg-rose-50 border-rose-200/80';
  };

  return (
    <div className="space-y-7">
      {/* Hero Banner Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-6 sm:p-8 text-white shadow-lg shadow-slate-900/10 border border-slate-800">
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-300 text-xs font-medium shadow-[0_0_16px_rgba(20,184,166,0.2)]">
              <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
              <span>Live System Active</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
                Accounts Executive Overview
              </h1>
              <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                Real-time visibility into revenue inflows, pending receivables, operational expenses, and net profitability.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate?.('financial-reports')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <BarChart3 className="w-4 h-4 text-slate-200" />
              <span>Financial Reports</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('invoices')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Receipt className="w-4 h-4" />
              <span>Invoices &amp; Billing</span>
            </button>
          </div>
        </div>
      </section>

      {/* Top Row: 4 Impactful KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-shadow flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.label}
                </span>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBox}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums">
                  {card.value}
                </p>
                <p className="text-xs text-slate-400 mt-1.5">{card.caption}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Middle Row: Chart + Recent Invoices */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Revenue vs Expenses BarChart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-6 shadow-lg shadow-slate-200/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
                Revenue vs Expenses
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly comparison of collected revenue and operational outflows
              </p>
            </div>
            {chartData.length > 0 && (
              <div className="flex items-center gap-4 text-xs text-slate-600 shrink-0">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-teal-700" />
                  Revenue
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                  Expenses
                </span>
              </div>
            )}
          </div>

          <div className="h-72 w-full mt-5">
            {chartData.length === 0 ? (
              <div className="h-full w-full rounded-xl border border-dashed border-slate-200 bg-slate-50/70 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center mb-3 text-slate-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  No data available for this period.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Monthly revenue and expense comparisons will appear here once recorded.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 16, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(val) => `${Math.round(Number(val) / 1000000)}M`}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.08)',
                      fontSize: '12px',
                    }}
                    formatter={(val, name) => [
                      `Rs. ${Number(val ?? 0).toLocaleString('en-PK')}`,
                      name === 'revenue' ? 'Revenue' : 'Expenses',
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#0f766e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Recent Invoices */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-xl shadow-lg shadow-slate-200/40 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
              Recent Invoices
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              ({recentInvoices.length})
            </span>
          </div>

          <div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-200/80 grid grid-cols-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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
                  className="px-6 py-3.5 grid grid-cols-3 items-center text-xs hover:bg-slate-50/60 transition-colors"
                >
                  <span className="font-semibold text-slate-900 truncate pr-2">
                    {inv.customer}
                  </span>
                  <span className="font-mono tabular-nums text-right text-slate-700 font-medium">
                    {inv.amount}
                  </span>
                  <div className="flex justify-end">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getStatusClass(
                        inv.status
                      )}`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};
