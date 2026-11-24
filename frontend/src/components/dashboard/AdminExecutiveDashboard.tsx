import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Building,
  Building2,
  Calendar,
  CalendarDays,
  CalendarPlus,
  DollarSign,
  Receipt,
  TrendingUp,
  Users,
  GitPullRequest,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  SEED_BOOKINGS,
  SEED_FINANCIAL_TREND,
  SEED_HALLS,
  SEED_INVOICES,
  SEED_OCCUPANCY_DATA,
} from '../../data/seedData';
import { dashboardApi, hallsApi, bookingsApi, invoicesApi, DashboardStatsResponse } from '../../api/client';
import { SystemUpdateModal } from '../admin/SystemUpdateModal';

interface AdminExecutiveDashboardProps {
  onNavigate?: (navId: string) => void;
}

const OCCUPANCY_COLORS = ['#0f766e', '#2563eb', '#d97706', '#64748b'];

export const AdminExecutiveDashboard: React.FC<AdminExecutiveDashboardProps> = ({
  onNavigate,
}) => {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [liveBookings, setLiveBookings] = useState<any[]>([]);
  const [liveInvoices, setLiveInvoices] = useState<any[]>([]);
  const [hallsCount, setHallsCount] = useState<number>(SEED_HALLS.length);
  const [activeHalls, setActiveHalls] = useState<number>(
    SEED_HALLS.filter((h) => h.status === 'Active').length
  );
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  useEffect(() => {
    dashboardApi
      .getStats()
      .then((data) => {
        if (data) setStats(data);
      })
      .catch((err) => console.warn('Dashboard stats API error:', err));

    bookingsApi
      .list()
      .then((data) => {
        if (Array.isArray(data)) setLiveBookings(data);
      })
      .catch(() => {});

    invoicesApi
      .list()
      .then((data) => {
        if (Array.isArray(data)) setLiveInvoices(data);
      })
      .catch(() => {});

    hallsApi
      .list()
      .then((data) => {
        if (data && data.length > 0) {
          setHallsCount(data.length);
          setActiveHalls(data.filter((h) => h.status === 'Active').length);
        }
      })
      .catch((err) => console.warn('Halls list API error in dashboard:', err));
  }, []);

  const revenueData = stats?.revenueTrend?.length
    ? stats.revenueTrend.map((item: any) => ({
        period: item.period || item.month,
        revenue: item.bookedRevenue || item.revenue || 0,
        expenses: item.ancillaryCatering || item.expenses || 0,
      }))
    : SEED_FINANCIAL_TREND.map((item) => ({
        period: item.month,
        revenue: item.revenue,
        expenses: item.expenses,
      }));

  const occupancyData = stats?.occupancyData?.length ? stats.occupancyData : SEED_OCCUPANCY_DATA;
  const upcomingEvents = liveBookings.length > 0
    ? liveBookings.slice(0, 5).map((b: any) => ({
        id: String(b.id),
        bookingRef: b.bookingRef || b.bookingId || `BK-${b.id}`,
        customerName: b.customerName || b.customer_name || 'Client',
        eventType: b.eventType || b.event_type || 'Event',
        hallName: b.hallName || b.hall_name || 'Main Hall',
        eventDate: b.date || b.eventDate || b.event_date || '',
        date: b.date || b.eventDate || b.event_date || '',
        time: b.time || b.slot || '12:00 PM – 04:00 PM',
        status: b.status || 'Confirmed',
        totalAmount: Number(b.amount || b.totalAmount || b.total_amount) || 0,
        remainingBalance: Math.max(0, (Number(b.amount || b.totalAmount || b.total_amount) || 0) - (Number(b.advancePayment || b.advance_payment) || 0)),
      }))
    : SEED_BOOKINGS;

  const recentTransactions = liveInvoices.length > 0
    ? liveInvoices.slice(0, 5).map((inv: any) => ({
        id: inv.invoiceNumber || inv.invoice_number || (inv.id ? `INV-${inv.id}` : 'INV-000'),
        invoiceNumber: inv.invoiceNumber || inv.invoice_number || (inv.id ? `INV-${inv.id}` : 'INV-000'),
        customerName: inv.customerName || inv.customer_name || 'Client',
        hallName: inv.hallName || 'Hall',
        totalAmount: Number(inv.totalAmount || inv.total_amount || inv.amount) || 0,
        amount: Number(inv.totalAmount || inv.total_amount || inv.amount) || 0,
        status: inv.paymentStatus || inv.payment_status || inv.status || 'Unpaid',
        paymentStatus: inv.paymentStatus || inv.payment_status || inv.status || 'Unpaid',
        date: inv.date || inv.dueDate || '',
      }))
    : SEED_INVOICES;

  const totalRevenue =
    stats?.totalRevenue ??
    (liveBookings.length > 0
      ? liveBookings.reduce((sum, b: any) => sum + (Number(b.amount) || 0), 0)
      : SEED_BOOKINGS.reduce((sum, b) => sum + b.totalAmount, 0));
  const pendingPayments =
    stats
      ? stats.totalRevenue - (stats.netProfit || 0)
      : liveBookings.length > 0
      ? liveBookings.reduce(
          (sum, b: any) =>
            sum + Math.max(0, (Number(b.amount) || 0) - (Number(b.advancePayment) || 0)),
          0
        )
      : SEED_BOOKINGS.reduce((sum, b) => sum + b.remainingBalance, 0);
  const totalBookingsCount = liveBookings.length > 0 ? liveBookings.length : SEED_BOOKINGS.length;
  const activeHallsCount = activeHalls;
  const averageOccupancy =
    occupancyData.length > 0
      ? Math.round(
          occupancyData.reduce((sum, item) => sum + item.value, 0) / occupancyData.length
        )
      : null;

  const kpiCards = [
    {
      label: 'Total Revenue',
      value: `Rs. ${totalRevenue.toLocaleString('en-PK')}`,
      caption: 'Across active period bookings',
      icon: DollarSign,
      iconBox:
        'bg-gradient-to-br from-teal-50 to-teal-100/90 border border-teal-200/70 text-teal-700',
    },
    {
      label: 'Total Bookings',
      value: String(totalBookingsCount),
      caption: 'Confirmed & pending reservations',
      icon: Calendar,
      iconBox:
        'bg-gradient-to-br from-blue-50 to-blue-100/90 border border-blue-200/70 text-blue-600',
    },
    {
      label: 'Active Halls',
      value: `${activeHallsCount} / ${SEED_HALLS.length}`,
      caption: 'Operational event venues',
      icon: Building,
      iconBox:
        'bg-gradient-to-br from-emerald-50 to-emerald-100/90 border border-emerald-200/70 text-emerald-700',
    },
    {
      label: 'Pending Payments',
      value: `Rs. ${pendingPayments.toLocaleString('en-PK')}`,
      caption: 'Outstanding receivables',
      icon: AlertCircle,
      iconBox:
        'bg-gradient-to-br from-amber-50 to-amber-100/90 border border-amber-200/70 text-amber-600',
    },
  ];

  const getEventStatusBadge = (status: 'Confirmed' | 'Pending' | 'Cancelled') => {
    if (status === 'Confirmed') {
      return 'bg-teal-50 text-teal-800 border-teal-200/80';
    }
    if (status === 'Pending') {
      return 'bg-amber-50 text-amber-800 border-amber-200/80';
    }
    return 'bg-rose-50 text-rose-800 border-rose-200/80';
  };

  const getInvoiceStatusBadge = (status: 'Paid' | 'Partial' | 'Unpaid') => {
    if (status === 'Paid') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
    }
    if (status === 'Partial') {
      return 'bg-amber-50 text-amber-800 border-amber-200/80';
    }
    return 'bg-rose-50 text-rose-800 border-rose-200/80';
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
                Admin Executive Overview
              </h1>
              <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                Real-time visibility into venue revenue, hall utilization, confirmed bookings, and financial settlements.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-400/40 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
            >
              <GitPullRequest className="w-4 h-4 text-teal-300" />
              <span>Update System</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('users')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Users className="w-4 h-4 text-slate-200" />
              <span>User Directory</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('bookings')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>New Booking Intake</span>
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

      {/* Middle Row: Charts (2/3 Revenue Overview, 1/3 Hall Occupancy) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Chart: Revenue Overview (2/3 width) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/80 p-6 shadow-lg shadow-slate-200/40 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900 font-['Plus_Jakarta_Sans']">
                Revenue Overview
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly revenue and expense trajectory across all halls
              </p>
            </div>
            {revenueData.length > 0 && (
              <div className="flex items-center gap-4 text-xs text-slate-600 shrink-0">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-teal-700" />
                  Revenue
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-400" />
                  Expenses
                </span>
              </div>
            )}
          </div>

          <div className="h-72 w-full mt-5">
            {revenueData.length === 0 ? (
              <div className="h-full w-full rounded-xl border border-dashed border-slate-200 bg-slate-50/70 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center mb-3 text-slate-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  No data available for this period.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Revenue trends will populate once bookings and invoices are recorded.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueData}
                  margin={{ top: 10, right: 16, left: 4, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="period"
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
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0f766e"
                    strokeWidth={2.5}
                    fill="url(#adminRevenueFill)"
                    activeDot={{ r: 5, fill: '#0f766e', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#94a3b8"
                    strokeWidth={1.75}
                    strokeDasharray="4 4"
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Chart: Hall Occupancy (1/3 width) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 p-6 shadow-lg shadow-slate-200/40 flex flex-col">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900 font-['Plus_Jakarta_Sans']">
              Hall Occupancy
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Utilization breakdown by venue hall
            </p>
          </div>

          {occupancyData.length === 0 ? (
            <div className="flex-1 min-h-[260px] mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center mb-3 text-slate-400">
                <Building2 className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                No data available for this period.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Hall utilization metrics will display when events are scheduled.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between mt-4 gap-4">
              <div className="relative h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={occupancyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={76}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {occupancyData.map((entry, idx) => (
                        <Cell
                          key={entry.name}
                          fill={OCCUPANCY_COLORS[idx % OCCUPANCY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                      formatter={(val) => [`${val ?? 0}%`, 'Occupancy']}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">
                    {averageOccupancy !== null ? `${averageOccupancy}%` : '[--]'}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    Avg. Rate
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                {occupancyData.map((item, idx) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="inline-flex items-center gap-2 text-slate-700 font-medium truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            OCCUPANCY_COLORS[idx % OCCUPANCY_COLORS.length],
                        }}
                      />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Bottom Row: Data Tables */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Table: Upcoming Events */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-lg shadow-slate-200/40 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-4 h-4 text-teal-700" />
              <h2 className="text-base font-semibold text-slate-900 font-['Plus_Jakarta_Sans']">
                Upcoming Events
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('bookings')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>View Bookings</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-6">Event</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Hall</th>
                  <th className="py-3 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 px-6 text-center text-sm text-slate-500">
                      No upcoming events scheduled.
                    </td>
                  </tr>
                ) : (
                  upcomingEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6">
                        <p className="font-semibold text-slate-900">{ev.customerName}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{ev.eventType}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {ev.eventDate}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        {ev.hallName}
                      </td>
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${getEventStatusBadge(
                            ev.status
                          )}`}
                        >
                          {ev.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Table: Recent Transactions */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-lg shadow-slate-200/40 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Receipt className="w-4 h-4 text-teal-700" />
              <h2 className="text-base font-semibold text-slate-900 font-['Plus_Jakarta_Sans']">
                Recent Transactions
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('financial-reports')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Financial Reports</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-6">Invoice</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 px-6 text-center text-sm text-slate-500">
                      No recent transactions.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {inv.invoiceNumber || inv.id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                        {inv.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                        Rs. {Number(inv.totalAmount ?? inv.amount ?? 0).toLocaleString('en-PK')}
                      </td>
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${getInvoiceStatusBadge(
                            inv.status || inv.paymentStatus || 'Unpaid'
                          )}`}
                        >
                          {inv.status || inv.paymentStatus || 'Unpaid'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* System Update Modal */}
      <SystemUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />
    </div>
  );
};
