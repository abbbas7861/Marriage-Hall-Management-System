import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Building2,
  CalendarDays,
  Percent,
  Wallet,
  ArrowDownLeft,
  TrendingUp,
  PlusCircle,
  Users,
  Scale,
  Receipt,
  Sparkles,
  Layers,
  ArrowUpRight,
  Clock,
  ChevronRight,
  BarChart3,
  ShieldCheck,
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

  // Live KPI Cards configuration with rich glowing accents & dark borders
  const kpiCards = [
    {
      title: 'Active Halls',
      value: `${stats.totalHalls || 0} Halls`,
      subtext: 'Operational Venue Capacity',
      icon: Building2,
      glow: 'shadow-emerald-500/10 hover:shadow-emerald-500/20',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
      accentGlow: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
      borderColor: 'border-slate-700/60 hover:border-emerald-500/50',
      actionModule: 'admin-halls',
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings || 0,
      subtext: `${stats.upcomingEventsCount || 0} events scheduled soon`,
      icon: CalendarDays,
      glow: 'shadow-sky-500/10 hover:shadow-sky-500/20',
      iconBg: 'bg-sky-500/10 text-sky-400 border border-sky-500/30',
      accentGlow: 'from-sky-500/15 via-sky-500/5 to-transparent',
      borderColor: 'border-slate-700/60 hover:border-sky-500/50',
      actionModule: 'admin-bookings',
    },
    {
      title: "Today's Occupancy",
      value: `${stats.hallOccupancy || 0}%`,
      subtext: stats.hallOccupancy > 0 ? 'Active banquet shifts' : 'No bookings today',
      icon: Percent,
      glow: 'shadow-amber-500/10 hover:shadow-amber-500/20',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
      accentGlow: 'from-amber-500/15 via-amber-500/5 to-transparent',
      borderColor: 'border-slate-700/60 hover:border-amber-500/50',
      actionModule: 'calendar',
    },
    {
      title: 'Month-to-Date Revenue',
      value: formatPKR(stats.mtdRevenue || stats.totalYearRevenue || 0),
      subtext: `Fiscal Year: ${formatPKR(stats.totalYearRevenue || 0)}`,
      icon: Wallet,
      glow: 'shadow-teal-500/10 hover:shadow-teal-500/20',
      iconBg: 'bg-teal-500/10 text-teal-400 border border-teal-500/30',
      accentGlow: 'from-teal-500/15 via-teal-500/5 to-transparent',
      borderColor: 'border-slate-700/60 hover:border-teal-500/50',
      actionModule: 'finance-overview',
    },
    {
      title: 'Outstanding Receivables',
      value: formatPKR(stats.pendingPayments || 0),
      subtext: `${stats.pendingInvoicesCount || 0} pending billing settlements`,
      icon: ArrowDownLeft,
      glow: 'shadow-rose-500/10 hover:shadow-rose-500/20',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
      accentGlow: 'from-rose-500/15 via-rose-500/5 to-transparent',
      borderColor: 'border-slate-700/60 hover:border-rose-500/50',
      actionModule: 'finance-receivables',
    },
  ];

  return (
    <div className="flex flex-col w-full gap-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Premium Executive Command Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-700/50 p-6 sm:p-8 shadow-2xl shadow-black/40 backdrop-blur-xl text-slate-100"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-teal-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/4 w-80 h-80 bg-gradient-to-tr from-sky-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Telemetry Active</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-50 mt-1">
              Admin Executive Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Omniscient venue orchestration, real-time occupancy distribution, and financial health trajectories.
            </p>
          </div>

          {/* Neatly Grouped Clean Action Toolbar */}
          <div className="flex items-center flex-wrap gap-3 shrink-0">
            {onOpenCreateBooking && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={onOpenCreateBooking}
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs sm:text-sm font-extrabold shadow-lg shadow-teal-500/25 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>New Booking Intake</span>
              </motion.button>
            )}

            <button
              type="button"
              onClick={() => onNavigateToModule?.('admin-users')}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 hover:border-slate-600 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all hover:scale-105 cursor-pointer backdrop-blur-md shadow-md"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>User Directory</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToModule?.('finance-overview')}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 hover:border-slate-600 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all hover:scale-105 cursor-pointer backdrop-blur-md shadow-md"
            >
              <Scale className="w-4 h-4 text-teal-400" />
              <span>Financial Statements</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* 5 High-Impact KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => onNavigateToModule?.(kpi.actionModule)}
              className="relative overflow-hidden w-full rounded-2xl bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/50 p-6 shadow-xl backdrop-blur-md transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${kpi.accentGlow} rounded-full blur-2xl pointer-events-none`} />

              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
                    {kpi.title}
                  </span>
                  <div
                    className="w-10 h-10 rounded-xl bg-slate-700/50 border border-slate-600/50 flex items-center justify-center shrink-0 text-teal-400 group-hover:scale-110 shadow-lg transition-transform duration-300"
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="text-white text-2xl font-bold mt-2 font-mono truncate tracking-tight" title={String(kpi.value)}>
                  {kpi.value}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-sm text-slate-500">
                <span className="truncate">{kpi.subtext}</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Spacious Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Velocity Area Chart (2 Columns) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl bg-slate-800/40 border border-slate-700/50 shadow-xl shadow-black/20 p-6 sm:p-8 backdrop-blur-md flex flex-col justify-between"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-700/50 mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-50 tracking-tight">
                  Sales Velocity &amp; Revenue Trajectory
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 pl-10.5">
                Multi-period venue rental revenue vs. catering &amp; ancillary services
              </p>
            </div>

            <div className="inline-flex rounded-xl bg-slate-900/80 border border-slate-700/60 p-1 text-xs font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveFilter('year')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeFilter === 'year'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Fiscal Year
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('quarter')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeFilter === 'quarter'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Quarters
              </button>
            </div>
          </div>

          <div className="w-full h-80 sm:h-96">
            {stats.revenueData && stats.revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bookedRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="hallRentalsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(val) => `PKR ${(val / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatPKR(val), 'Amount']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '16px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      border: '1px solid #334155',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      padding: '10px 14px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookedRevenue"
                    stroke="#14b8a6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#bookedRevenueGrad)"
                    name="Total Gross Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="hallRentals"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#hallRentalsGrad)"
                    name="Hall Rental Portion"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center rounded-xl bg-slate-900/40 border border-slate-700/40 text-slate-400 text-xs">
                <TrendingUp className="w-10 h-10 mb-2 text-slate-600" />
                <span className="font-medium">No historic revenue logs recorded for this fiscal timeframe.</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Multi-Hall Occupancy Distribution Donut Chart (1 Column) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-2xl bg-slate-800/40 border border-slate-700/50 shadow-xl shadow-black/20 p-6 sm:p-8 backdrop-blur-md flex flex-col justify-between"
        >
          <div className="pb-5 border-b border-slate-700/50 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-50 tracking-tight">
                Multi-Hall Occupancy
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 pl-10.5">
              Booking share volume distribution across halls
            </p>
          </div>

          <div className="w-full h-72 sm:h-80 flex items-center justify-center">
            {stats.occupancyData && stats.occupancyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.occupancyData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#14b8a6'} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val} Bookings`, 'Events']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '16px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      border: '1px solid #334155',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      padding: '10px 14px',
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '14px', color: '#cbd5e1' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center rounded-xl bg-slate-900/40 border border-slate-700/40 text-slate-400 text-xs">
                <Building2 className="w-10 h-10 mb-2 text-slate-600" />
                <span className="font-medium">No hall bookings logged yet.</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigateToModule?.('admin-halls')}
            className="w-full mt-4 py-3 rounded-xl bg-slate-900/60 hover:bg-slate-700/50 border border-slate-700/60 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.01]"
          >
            <span>Manage Hall Capacities</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>
      </div>

      {/* Admin Master Suite Launchpad */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="rounded-2xl bg-slate-800/40 border border-slate-700/50 shadow-xl shadow-black/20 p-6 sm:p-8 backdrop-blur-md"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/50 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Admin Master Suite Launchpad
            </h3>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-400">
            Owner Access Granted
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { id: 'admin-halls', label: 'Halls Registry', icon: Building2, desc: 'Tiers & Slots', color: 'text-emerald-400' },
            { id: 'admin-bookings', label: 'Bookings Master', icon: CalendarDays, desc: 'Contracts & PDF', color: 'text-sky-400' },
            { id: 'admin-users', label: 'Users & Rights', icon: Users, desc: 'Salaries & RBAC', color: 'text-amber-400' },
            { id: 'admin-closings', label: 'Period Closings', icon: Clock, desc: 'Day / Month Lock', color: 'text-rose-400' },
            { id: 'admin-fbr', label: 'FBR Invoicing', icon: Receipt, desc: 'Digital Tax QR', color: 'text-violet-400' },
            { id: 'finance-overview', label: 'General Ledger', icon: Scale, desc: 'A/R, A/P & P&L', color: 'text-teal-400' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigateToModule?.(item.id)}
                className="flex flex-col items-start p-4 rounded-xl bg-slate-900/60 hover:bg-slate-700/40 border border-slate-700/50 hover:border-teal-500/50 transition-all text-left cursor-pointer group hover:scale-[1.02] shadow-sm"
              >
                <div className={`w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform mb-3 shadow-inner`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-teal-300 leading-tight">
                  {item.label}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
