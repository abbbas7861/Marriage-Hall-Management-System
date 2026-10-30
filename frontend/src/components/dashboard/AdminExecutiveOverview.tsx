import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Building2,
  CalendarDays,
  Percent,
  Wallet,
  ArrowDownLeft,
  CalendarCheck,
  TrendingUp,
  PlusCircle,
  Users,
  Scale,
  Receipt,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Booking, PaymentTransaction } from '../../types';

interface DashboardStats {
  totalHalls: number;
  totalBookings: number;
  hallOccupancy: number;
  mtdRevenue: number;
  totalYearRevenue: number;
  pendingPayments: number;
  pendingInvoicesCount: number;
  upcomingEventsCount: number;
  revenueData: any[];
  occupancyData: any[];
  upcomingEvents: Booking[];
  recentTransactions: PaymentTransaction[];
}

interface AdminExecutiveOverviewProps {
  onNavigateToModule?: (moduleId: string) => void;
  onOpenCreateBooking?: () => void;
}

const DEFAULT_STATS: DashboardStats = {
  totalHalls: 0,
  totalBookings: 0,
  hallOccupancy: 0,
  mtdRevenue: 0,
  totalYearRevenue: 0,
  pendingPayments: 0,
  pendingInvoicesCount: 0,
  upcomingEventsCount: 0,
  revenueData: [],
  occupancyData: [],
  upcomingEvents: [],
  recentTransactions: [],
};

const formatPKR = (amount: number) => {
  return `PKR ${Number(amount || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
};

export const AdminExecutiveOverview: React.FC<AdminExecutiveOverviewProps> = ({
  onNavigateToModule,
  onOpenCreateBooking,
}) => {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'year' | 'quarter'>('year');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/v1/dashboard/metrics/');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load admin overview metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Live KPI Cards configuration
  const kpiCards = [
    {
      title: 'Active Halls',
      value: `${stats.totalHalls || 0} Halls`,
      subtext: 'Operational Venue Capacity',
      icon: Building2,
      color: 'from-emerald-500/20 to-teal-500/10',
      border: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      actionModule: 'admin-halls',
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings || 0,
      subtext: `${stats.upcomingEventsCount || 0} events scheduled soon`,
      icon: CalendarDays,
      color: 'from-sky-500/20 to-blue-500/10',
      border: 'border-sky-500/30',
      textColor: 'text-sky-400',
      actionModule: 'admin-bookings',
    },
    {
      title: "Today's Occupancy",
      value: `${stats.hallOccupancy || 0}%`,
      subtext: stats.hallOccupancy > 0 ? 'Halls active today' : 'No events today',
      icon: Percent,
      color: 'from-amber-500/20 to-orange-500/10',
      border: 'border-amber-500/30',
      textColor: 'text-amber-400',
      actionModule: 'calendar',
    },
    {
      title: 'Month-to-Date Revenue',
      value: formatPKR(stats.mtdRevenue || stats.totalYearRevenue || 0),
      subtext: `Year: ${formatPKR(stats.totalYearRevenue || 0)}`,
      icon: Wallet,
      color: 'from-teal-500/20 to-cyan-500/10',
      border: 'border-teal-500/30',
      textColor: 'text-teal-400',
      actionModule: 'finance-overview',
    },
    {
      title: 'Outstanding Receivables',
      value: formatPKR(stats.pendingPayments || 0),
      subtext: `${stats.pendingInvoicesCount || 0} pending payment invoices`,
      icon: ArrowDownLeft,
      color: 'from-rose-500/20 to-pink-500/10',
      border: 'border-rose-500/30',
      textColor: 'text-rose-400',
      actionModule: 'finance-receivables',
    },
  ];

  return (
    <div className="flex flex-col w-full gap-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header with Luxury Glassmorphism Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#0d222b] to-slate-900 border border-slate-700/60 p-6 sm:p-7 shadow-xl shadow-slate-950/20 text-white"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wider uppercase inline-flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Owner Master Console</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span>Live Telemetry</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              Admin Executive Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              High-level operational control, live hall capacity telemetry, and revenue trajectories.
            </p>
          </div>

          {/* Quick Actions Action Bar */}
          <div className="flex items-center flex-wrap gap-2.5">
            {onOpenCreateBooking && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onOpenCreateBooking}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950/50 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Booking Intake</span>
              </motion.button>
            )}

            <button
              type="button"
              onClick={() => onNavigateToModule?.('admin-users')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer backdrop-blur-md"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>User Directory</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToModule?.('finance-overview')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer backdrop-blur-md"
            >
              <Scale className="w-3.5 h-3.5 text-teal-400" />
              <span>Financial Statements</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* 5 Live KPI Cards in Responsive Glassmorphic Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              onClick={() => onNavigateToModule?.(kpi.actionModule)}
              className={`relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border ${kpi.border} p-4.5 shadow-sm hover:shadow-md transition-all cursor-pointer group`}
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                    {kpi.title}
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 tracking-tight font-mono">
                    {kpi.value}
                  </div>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center ${kpi.textColor} shrink-0 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="truncate">{kpi.subtext}</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section: Sales Velocity Trajectory & Multi-Hall Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Velocity Area Chart (2 Cols) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col justify-between"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Sales Velocity &amp; Revenue Trajectory
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-period venue rental income vs. catering &amp; ancillary services
              </p>
            </div>

            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveFilter('year')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeFilter === 'year'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Fiscal Year
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('quarter')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeFilter === 'quarter'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Quarters
              </button>
            </div>
          </div>

          <div className="w-full h-72 sm:h-80">
            {stats.revenueData && stats.revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bookedRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="hallRentalsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(val) => `PKR ${(val / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatPKR(val), 'Amount']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookedRevenue"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#bookedRevenueGrad)"
                    name="Total Gross Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="hallRentals"
                    stroke="#0284c7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#hallRentalsGrad)"
                    name="Hall Rental Portion"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center rounded-xl bg-slate-50 text-slate-400 text-xs">
                <TrendingUp className="w-8 h-8 mb-2 text-slate-300" />
                <span>No historic revenue logs recorded for this fiscal timeframe.</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Multi-Hall Occupancy Distribution Donut Chart (1 Col) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col justify-between"
        >
          <div className="pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Multi-Hall Occupancy
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Booking share distribution across halls
            </p>
          </div>

          <div className="w-full h-64 sm:h-72 flex items-center justify-center">
            {stats.occupancyData && stats.occupancyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.occupancyData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#00685f'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val} Bookings`, 'Events']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center rounded-xl bg-slate-50 text-slate-400 text-xs">
                <Building2 className="w-8 h-8 mb-2 text-slate-300" />
                <span>No hall bookings logged yet.</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigateToModule?.('admin-halls')}
            className="w-full mt-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Manage Hall Capacities</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </motion.div>
      </div>

      {/* Quick Launchpad to Phase 2 Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Admin Master Suite Launchpad
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Owner Access Granted</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'admin-halls', label: 'Halls Registry', icon: Building2, desc: 'Tiers & Slots' },
            { id: 'admin-bookings', label: 'Bookings Master', icon: CalendarDays, desc: 'Contracts & PDF' },
            { id: 'admin-users', label: 'Users & Rights', icon: Users, desc: 'Salaries & RBAC' },
            { id: 'admin-closings', label: 'Period Closings', icon: Clock, desc: 'Day / Month Lock' },
            { id: 'admin-fbr', label: 'FBR Invoicing', icon: Receipt, desc: 'Digital Tax QR' },
            { id: 'finance-overview', label: 'General Ledger', icon: Scale, desc: 'A/R, A/P & P&L' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigateToModule?.(item.id)}
                className="flex flex-col items-start p-3 rounded-xl bg-slate-50 hover:bg-teal-50/60 border border-slate-200/80 hover:border-teal-300 transition-all text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-white shadow-xs border border-slate-200 flex items-center justify-center text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors mb-2">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900 leading-tight">
                  {item.label}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

