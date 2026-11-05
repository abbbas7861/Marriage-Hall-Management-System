import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Layers,
  MoreVertical,
  PartyPopper,
  Radio,
  Receipt,
  RotateCcw,
  SlidersHorizontal,
  TrendingUp,
  Server,
  Activity,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Sparkline } from '../common/Sparkline';
import { UpcomingEventsList } from './UpcomingEventsList';
import { RecentTransactionsList } from './RecentTransactionsList';
import { Booking, PaymentTransaction } from '../../types';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

interface DashboardSummary {
  totalBookings: number;
  hallOccupancy: number;
  pendingPayments: number;
  pendingInvoicesCount: number;
  upcomingEventsCount: number;
  revenueData: any[];
  occupancyData: any[];
  upcomingEvents: Booking[];
  recentTransactions: PaymentTransaction[];
}

interface DashboardProps {
  onNavigateToModule?: (moduleId: string) => void;
  onOpenCreateBooking?: () => void;
}

const EMPTY_DASHBOARD_SUMMARY: DashboardSummary = {
  totalBookings: 0,
  hallOccupancy: 0,
  pendingPayments: 0,
  pendingInvoicesCount: 0,
  upcomingEventsCount: 0,
  revenueData: [],
  occupancyData: [],
  upcomingEvents: [],
  recentTransactions: [],
};

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateToModule,
  onOpenCreateBooking,
}) => {
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_DASHBOARD_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [emptySparklineData] = useState<any[]>([]);
  const [emptyRevenueData] = useState<any[]>([]);
  const [emptyOccupancyData] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Booking[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<PaymentTransaction[]>([]);

  const [activeHallFilter, setActiveHallFilter] = useState<'all' | 'main' | 'annex'>('all');
  const [activeRevenueType, setActiveRevenueType] = useState<'invoiced' | 'collected'>('invoiced');

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        setLoading(true);

        const statsResponse = await fetch(`${API_BASE_URL}/dashboard/stats/`).catch(() => null);
        const chartsResponse = await fetch(`${API_BASE_URL}/dashboard/charts/`).catch(() => null);

        let dashboardSummary: DashboardSummary | null = null;

        if (statsResponse && statsResponse.ok) {
          dashboardSummary = await statsResponse.json();
        } else {
          const metricsResponse = await fetch(`${API_BASE_URL}/dashboard/metrics/`).catch(() => null);
          if (metricsResponse && metricsResponse.ok) {
            dashboardSummary = await metricsResponse.json();
          }
        }

        if (!isMounted) return;

        if (dashboardSummary) {
          const nextSummary: DashboardSummary = {
            ...EMPTY_DASHBOARD_SUMMARY,
            ...dashboardSummary,
            revenueData: Array.isArray(dashboardSummary.revenueData) ? dashboardSummary.revenueData : [],
            occupancyData: Array.isArray(dashboardSummary.occupancyData) ? dashboardSummary.occupancyData : [],
            upcomingEvents: Array.isArray(dashboardSummary.upcomingEvents) ? dashboardSummary.upcomingEvents : [],
            recentTransactions: Array.isArray(dashboardSummary.recentTransactions) ? dashboardSummary.recentTransactions : [],
          };

          if (chartsResponse && chartsResponse.ok) {
            const charts = await chartsResponse.json();
            if (Array.isArray(charts?.revenueData)) {
              nextSummary.revenueData = charts.revenueData;
            }
            if (Array.isArray(charts?.occupancyData)) {
              nextSummary.occupancyData = charts.occupancyData;
            }
          }

          setSummary(nextSummary);
          setUpcomingEvents(nextSummary.upcomingEvents);
          setRecentTransactions(nextSummary.recentTransactions);
        } else {
          setSummary(EMPTY_DASHBOARD_SUMMARY);
          setUpcomingEvents([]);
          setRecentTransactions([]);
        }
      } catch (error) {
        if (!isMounted) return;
        setSummary(EMPTY_DASHBOARD_SUMMARY);
        setUpcomingEvents([]);
        setRecentTransactions([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const chartData = summary.revenueData.length ? summary.revenueData : emptyRevenueData;
  const occupancyData = summary.occupancyData.length ? summary.occupancyData : emptyOccupancyData;
  const dashboardEvents = upcomingEvents.length ? upcomingEvents : summary.upcomingEvents;
  const dashboardTransactions = recentTransactions.length ? recentTransactions : summary.recentTransactions;

  const emptyXAxisTicks = ['[Q1 - Period 01]', '[Q2 - Period 02]', '[Q3 - Period 03]', '[Q4 - Period 04]'];

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3 text-slate-300">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-teal-400" />
          <span className="text-sm font-medium">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-6 text-slate-100">
      {/* Executive Header Console */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans']">
              Executive Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-teal-300 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              <span>SYSTEM SYNCHRONIZED</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Overview of venue capacity, operations, and transaction flows
          </p>
        </div>

        {/* Quick Action Toolset */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs shadow-md">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-semibold">Period:</span>
            <span className="font-mono text-slate-200">[Fiscal Year 2026]</span>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export Summary</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-semibold shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter Scope</span>
          </button>
        </div>
      </div>

      {/* Top Row: 4 Summary Metric Containers with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Total Bookings */}
        <div className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-700/50 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
                Total Bookings
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-white text-3xl sm:text-4xl font-bold font-mono tracking-tight font-['Plus_Jakarta_Sans']">
                  {summary.totalBookings || 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">SLOTS</span>
              </div>
            </div>
            <div className="bg-slate-700/50 p-2 rounded-lg text-teal-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 my-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/60 text-slate-400 font-mono text-[11px] border border-slate-700/50">
              <TrendingUp className="w-3 h-3 text-teal-400" />
              <span>[+ --% vs prev period]</span>
            </span>
          </div>

          <Sparkline data={emptySparklineData} color="#14b8a6" />
        </div>

        {/* KPI 2: Hall Occupancy */}
        <div className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-700/50 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
                Hall Occupancy
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-white text-3xl sm:text-4xl font-bold font-mono tracking-tight font-['Plus_Jakarta_Sans']">
                  {summary.hallOccupancy || 0}%
                </span>
                <span className="text-xs font-semibold text-slate-500">CAPACITY</span>
              </div>
            </div>
            <div className="bg-slate-700/50 p-2 rounded-lg text-sky-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 my-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/60 text-slate-400 font-mono text-[11px] border border-slate-700/50">
              <Activity className="w-3 h-3 text-sky-400" />
              <span>[--% Target Variance]</span>
            </span>
          </div>

          <Sparkline data={emptySparklineData} color="#38bdf8" />
        </div>

        {/* KPI 3: Pending Payments */}
        <div className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-700/50 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
                Pending Payments
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-white text-3xl sm:text-4xl font-bold font-mono tracking-tight font-['Plus_Jakarta_Sans']">
                  Rs. {Number(summary.pendingPayments || 0).toLocaleString('en-PK')}
                </span>
              </div>
            </div>
            <div className="bg-slate-700/50 p-2 rounded-lg text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 my-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/60 text-slate-400 font-mono text-[11px] border border-slate-700/50">
              <Receipt className="w-3 h-3 text-amber-400" />
              <span>[-- Invoices Outstanding]</span>
            </span>
          </div>

          <Sparkline data={emptySparklineData} color="#f59e0b" />
        </div>

        {/* KPI 4: Upcoming Events */}
        <div className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-700/50 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
                Upcoming Events
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-white text-3xl sm:text-4xl font-bold font-mono tracking-tight font-['Plus_Jakarta_Sans']">
                  {summary.upcomingEventsCount || 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">SCHEDULED</span>
              </div>
            </div>
            <div className="bg-slate-700/50 p-2 rounded-lg text-emerald-400">
              <PartyPopper className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 my-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/60 text-slate-400 font-mono text-[11px] border border-slate-700/50">
              <CalendarCheck className="w-3 h-3 text-emerald-400" />
              <span>[-- Next 7-Day Window]</span>
            </span>
          </div>

          <Sparkline data={emptySparklineData} color="#10b981" />
        </div>
      </div>

      {/* Middle Row: Revenue Trends & Hall Occupancy */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Revenue Trends Chart (8 Cols) */}
        <div className="xl:col-span-8 flex flex-col rounded-2xl bg-slate-800/60 backdrop-blur-md p-6 border border-slate-700/50 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-700/60">
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-['Plus_Jakarta_Sans']">
                Revenue Overview
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Monthly &amp; quarterly cash flow projection
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-xl bg-slate-900 p-1 text-xs border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setActiveHallFilter('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeHallFilter === 'all'
                      ? 'bg-slate-800 text-teal-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  [All Halls]
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHallFilter('main')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activeHallFilter === 'main'
                      ? 'bg-slate-800 text-teal-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  [Main Wing]
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHallFilter('annex')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activeHallFilter === 'annex'
                      ? 'bg-slate-800 text-teal-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  [Annex]
                </button>
              </div>

              <div className="h-4 w-px bg-slate-700"></div>

              <div className="inline-flex rounded-xl bg-slate-900 p-1 text-xs border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setActiveRevenueType('invoiced')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeRevenueType === 'invoiced'
                      ? 'bg-slate-800 text-teal-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  [Invoiced]
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRevenueType('collected')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activeRevenueType === 'collected'
                      ? 'bg-slate-800 text-teal-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  [Collected]
                </button>
              </div>
            </div>
          </div>

          {/* Chart Frame */}
          <div className="relative w-full h-72 flex flex-col justify-between py-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                <XAxis
                  dataKey="period"
                  ticks={chartData.length ? undefined : emptyXAxisTicks}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={{ stroke: '#475569' }}
                />
                <YAxis
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(val) => `[${val}%]`}
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={{ stroke: '#475569' }}
                />
                <Line
                  type="monotone"
                  dataKey="bookedRevenue"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="ancillaryCatering"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>

            {!chartData.length && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none pl-12 pr-4 pb-8">
                <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg flex items-center gap-2 backdrop-blur-sm">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400 font-['Plus_Jakarta_Sans']">
                    No data available for the selected period.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Legend Footer */}
          <div className="flex items-center justify-center gap-6 pt-3 mt-1 border-t border-slate-700/60 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-teal-400"></span>
              <span className="text-xs text-slate-300 font-medium">
                [Booked Revenue Frame]
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-400"></span>
              <span className="text-xs text-slate-300 font-medium">
                [Ancillary Catering Frame]
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-500"></span>
              <span className="text-xs text-slate-300 font-medium">
                [Hall Rentals Baseline]
              </span>
            </div>
          </div>
        </div>

        {/* Hall Occupancy Rate (4 Cols) */}
        <div className="xl:col-span-4 flex flex-col justify-between rounded-2xl bg-slate-800/60 backdrop-blur-md p-6 border border-slate-700/50 shadow-xl">
          <div className="flex items-start justify-between pb-3 border-b border-slate-700/60">
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-['Plus_Jakarta_Sans']">
                Hall Occupancy Rate
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Utilization breakdown by venue hall
              </p>
            </div>
            <button className="p-1 text-slate-400 hover:text-white transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 h-64 w-full">
            {occupancyData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {occupancyData.map((entry: any, index: number) => (
                      <Cell key={`${entry.name}-${index}`} fill={entry.color || ['#14b8a6', '#38bdf8', '#f59e0b', '#94a3b8', '#a855f7'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${value ?? 0} bookings`, 'Bookings']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/40 text-xs text-slate-400">
                No occupancy data available.
              </div>
            )}
          </div>

          {/* Legend Items */}
          <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-700/60">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                <span className="text-slate-200 font-medium">Grand Crystal Ballroom</span>
              </div>
              <span className="font-mono text-slate-400">[--%]</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                <span className="text-slate-200 font-medium">Royal Emerald Hall</span>
              </div>
              <span className="font-mono text-slate-400">[--%]</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="text-slate-200 font-medium">Sapphire Banquet</span>
              </div>
              <span className="font-mono text-slate-400">[--%]</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: UpcomingEventsList and RecentTransactionsList */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-6">
          <UpcomingEventsList
            events={dashboardEvents}
            onViewCalendar={() => onNavigateToModule?.('calendar')}
            onCreateBooking={onOpenCreateBooking}
          />
        </div>
        <div className="xl:col-span-6">
          <RecentTransactionsList
            transactions={dashboardTransactions}
            onViewInvoices={() => onNavigateToModule?.('payments')}
            onRecordPayment={() => onNavigateToModule?.('payments')}
          />
        </div>
      </div>

      {/* Operational Footer Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 gap-2">
        <div className="flex items-center gap-2.5 text-xs text-slate-400 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-teal-400" />
            <span>
              Venue Master Nodes:{' '}
              <span className="font-semibold text-slate-200">[Active Sync]</span>
            </span>
          </div>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            Data Feed Ref:{' '}
            <span className="font-mono text-slate-300">[MHMS-CORE-CLUSTER-09]</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-300 font-mono">
            [Live Stream Ready]
          </span>
        </div>
      </div>
    </div>
  );
};
