import React, { useState, useEffect } from 'react';
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
  Loader2,
  RefreshCw,
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
import { fetchDashboardStats, DashboardStatsResponse } from '../../api/client';

interface DashboardProps {
  onNavigateToModule?: (moduleId: string) => void;
  onOpenCreateBooking?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateToModule,
  onOpenCreateBooking,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Live state fetched from API
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Booking[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<PaymentTransaction[]>([]);
  const [sparklineData, setSparklineData] = useState<any[]>([]);

  const [activeHallFilter, setActiveHallFilter] = useState<'all' | 'main' | 'annex'>('all');
  const [activeRevenueType, setActiveRevenueType] = useState<'invoiced' | 'collected'>('invoiced');

  // Fetch dashboard stats from client.ts in useEffect
  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const data = await fetchDashboardStats();
      setStats(data);
      setRevenueData(data.revenueTrend || []);
      setOccupancyData(data.occupancyData || []);
      setUpcomingEvents(data.upcomingEvents || []);
      setRecentTransactions(data.recentTransactions || []);
    } catch (err: any) {
      console.error('Failed to fetch dashboard stats from API client:', err);
      setFetchError(err?.message || 'Unable to connect to backend server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Placeholder ticks for empty axes
  const emptyXAxisTicks = ['[Q1 - Period 01]', '[Q2 - Period 02]', '[Q3 - Period 03]', '[Q4 - Period 04]'];
  const emptyRevenuePoints = [
    { period: '[Q1 - Period 01]' },
    { period: '[Q2 - Period 02]' },
    { period: '[Q3 - Period 03]' },
    { period: '[Q4 - Period 04]' },
  ];

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Executive Header Console */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
              Executive Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
              <span>SYSTEM SYNCHRONIZED</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Overview of venue capacity, operations, and transaction flows
          </p>
        </div>

        {/* Quick Action Toolset */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-semibold">Period:</span>
            <span className="font-mono text-slate-800">[-- / -- / ---- — -- / -- / ----]</span>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-teal-700" />
            <span>Export Summary</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 text-white hover:bg-teal-800 text-xs font-semibold shadow-xs transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter Scope</span>
          </button>
        </div>
      </div>

      {/* Loading state banner */}
      {isLoading && (
        <div className="flex items-center justify-center p-3.5 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold gap-2.5 shadow-2xs">
          <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
          <span>Synchronizing live metrics and bookings from backend API...</span>
        </div>
      )}

      {/* Top Row: 4 Summary Metric Containers with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Total Bookings */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Bookings
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
                  {stats?.totalBookings != null ? stats.totalBookings : '[--]'}
                </span>
                <span className="text-xs font-semibold text-slate-400">SLOTS</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 my-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-slate-500 font-mono text-[11px] border border-slate-100">
              <TrendingUp className="w-3 h-3 text-slate-400" />
              <span>[+ --% vs prev period]</span>
            </span>
          </div>

          {/* Sparkline chart at the bottom */}
          <Sparkline data={sparklineData} color="#00685f" />
        </div>

        {/* KPI 2: Hall Occupancy */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Hall Occupancy
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
                  {stats?.occupancyRate != null ? `${stats.occupancyRate}%` : '[--]'}
                </span>
                <span className="text-xs font-semibold text-slate-400">CAPACITY</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 my-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-slate-500 font-mono text-[11px] border border-slate-100">
              <Activity className="w-3 h-3 text-slate-400" />
              <span>[--% Target Variance]</span>
            </span>
          </div>

          {/* Sparkline chart at the bottom */}
          <Sparkline data={sparklineData} color="#316bf3" />
        </div>

        {/* KPI 3: Pending Payments */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pending Payments
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
                  {stats?.totalExpenses != null
                    ? `Rs. ${stats.totalExpenses.toLocaleString('en-PK')}`
                    : stats?.totalRevenue != null
                    ? `Rs. ${stats.totalRevenue.toLocaleString('en-PK')}`
                    : '[--]'}
                </span>
                <span className="text-xs font-semibold text-slate-400">ACCRUED</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 my-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-slate-500 font-mono text-[11px] border border-slate-100">
              <Receipt className="w-3 h-3 text-slate-400" />
              <span>[-- Invoices Outstanding]</span>
            </span>
          </div>

          {/* Sparkline chart at the bottom */}
          <Sparkline data={sparklineData} color="#d97706" />
        </div>

        {/* KPI 4: Upcoming Events */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Upcoming Events
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
                  {upcomingEvents.length > 0
                    ? upcomingEvents.length
                    : stats?.upcomingEvents?.length != null
                    ? stats.upcomingEvents.length
                    : '[--]'}
                </span>
                <span className="text-xs font-semibold text-slate-400">SCHEDULED</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
              <PartyPopper className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 my-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-slate-500 font-mono text-[11px] border border-slate-100">
              <CalendarCheck className="w-3 h-3 text-slate-400" />
              <span>[-- Next 7-Day Window]</span>
            </span>
          </div>

          {/* Sparkline chart at the bottom */}
        </div>
      </div>

      {/* Middle Row: Revenue Trends & Hall Occupancy with Recharts and data={[]} */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Revenue Trends Chart (8 Cols) */}
        <div className="xl:col-span-8 flex flex-col rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900 font-['Plus_Jakarta_Sans']">
                Revenue Overview
              </h2>
              <p className="text-xs text-slate-500">
                Monthly &amp; quarterly cash flow projection
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveHallFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    activeHallFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  [All Halls]
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHallFilter('main')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeHallFilter === 'main'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  [Main Wing]
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHallFilter('annex')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeHallFilter === 'annex'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  [Annex]
                </button>
              </div>

              <div className="h-4 w-px bg-slate-200"></div>

              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveRevenueType('invoiced')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    activeRevenueType === 'invoiced'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  [Invoiced]
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRevenueType('collected')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeRevenueType === 'collected'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  [Collected]
                </button>
              </div>
            </div>
          </div>

          {/* Chart Frame with empty array fallback rendering X & Y axes and live lines when data exists */}
          <div className="relative w-full h-72 flex flex-col justify-between py-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenueData.length > 0 ? revenueData : emptyRevenuePoints}
                margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="period"
                  ticks={revenueData.length > 0 ? undefined : emptyXAxisTicks}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  ticks={revenueData.length > 0 ? undefined : [0, 25, 50, 75, 100]}
                  tickFormatter={(val) => revenueData.length > 0 ? `Rs. ${Number(val).toLocaleString('en-PK')}` : `[${val}%]`}
                  domain={revenueData.length > 0 ? ['auto', 'auto'] : [0, 100]}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                {revenueData.length > 0 && (
                  <Tooltip
                    formatter={(val: any) => [`Rs. ${Number(val).toLocaleString('en-PK')}`, '']}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="bookedRevenue"
                  name="Booked Revenue"
                  stroke="#00685f"
                  strokeWidth={2}
                  dot={revenueData.length > 0 ? { r: 3, fill: '#00685f' } : false}
                />
                <Line
                  type="monotone"
                  dataKey="ancillaryCatering"
                  name="Ancillary Catering"
                  stroke="#316bf3"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={revenueData.length > 0 ? { r: 3, fill: '#316bf3' } : false}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Subtle empty state message overlay only when revenueData is empty */}
            {revenueData.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none pl-12 pr-4 pb-8">
                <div className="px-4 py-2 rounded-lg bg-white/95 border border-slate-200/90 shadow-xs flex items-center gap-2 backdrop-blur-xs">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500 font-['Plus_Jakarta_Sans']">
                    No data available for the selected period.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Legend Footer */}
          <div className="flex items-center justify-center gap-6 pt-3 mt-1 border-t border-slate-100 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-teal-700"></span>
              <span className="text-xs text-slate-600 font-medium">
                [Booked Revenue Frame]
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
              <span className="text-xs text-slate-600 font-medium">
                [Ancillary Catering Frame]
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-300"></span>
              <span className="text-xs text-slate-600 font-medium">
                [Hall Rentals Baseline]
              </span>
            </div>
          </div>
        </div>

        {/* Hall Occupancy Rate (4 Cols) */}
        <div className="xl:col-span-4 flex flex-col justify-between rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-start justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900 font-['Plus_Jakarta_Sans']">
                Hall Occupancy Rate
              </h2>
              <p className="text-xs text-slate-500">
                Utilization breakdown by venue hall
              </p>
            </div>
            <button className="p-1 text-slate-400 hover:text-slate-700 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* Donut Chart using Recharts PieChart */}
          <div className="relative w-full py-4 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData.length > 0 ? occupancyData : [{ name: 'Empty', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={occupancyData.length > 0 ? 3 : 0}
                    dataKey="value"
                  >
                    {occupancyData.length > 0 ? (
                      occupancyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || ['#00685f', '#316bf3', '#d97706', '#94a3b8'][index % 4]} />
                      ))
                    ) : (
                      <Cell fill="#e2e8f0" />
                    )}
                  </Pie>
                  {occupancyData.length > 0 && <Tooltip formatter={(val: any) => [`${val}%`, 'Occupancy']} />}
                </PieChart>
              </ResponsiveContainer>

              {/* Empty state donut ring wireframe placeholder */}
              {occupancyData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="11"
                      strokeDasharray="238.76"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#00685f"
                      strokeOpacity="0.25"
                      strokeWidth="11"
                      strokeDasharray="75 238.76"
                    />
                  </svg>
                </div>
              )}

              {/* Center Metrics readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest font-mono">
                  Average
                </span>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  {stats?.occupancyRate != null ? `${stats.occupancyRate}%` : '[--]'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {occupancyData.length > 0 ? `${occupancyData.length} VENUES` : '[-- VENUES]'}
                </span>
              </div>
            </div>

            {/* Subtle empty state message */}
            {occupancyData.length === 0 && (
              <div className="mt-2 text-center">
                <span className="text-xs text-slate-400 italic font-['Plus_Jakarta_Sans']">
                  No data available for the selected period.
                </span>
              </div>
            )}
          </div>

          {/* Legend Items */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-700"></span>
                <span className="text-slate-800 font-medium">[Grand Ballroom]</span>
              </div>
              <span className="font-mono text-slate-400">[--%]</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span className="text-slate-800 font-medium">[Crystal Pavilion]</span>
              </div>
              <span className="font-mono text-slate-400">[--%]</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                <span className="text-slate-800 font-medium">[Royal Banquet]</span>
              </div>
              <span className="font-mono text-slate-400">[--%]</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                <span className="text-slate-800 font-medium">[Garden Lawn]</span>
              </div>
              <span className="font-mono text-slate-400">[--%]</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: UpcomingEventsList and RecentTransactionsList with empty data arrays data={[]} */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-6">
          <UpcomingEventsList
            events={upcomingEvents}
            onViewCalendar={() => onNavigateToModule?.('calendar')}
            onCreateBooking={onOpenCreateBooking}
          />
        </div>
        <div className="xl:col-span-6">
          <RecentTransactionsList
            transactions={recentTransactions}
            onViewInvoices={() => onNavigateToModule?.('payments')}
            onRecordPayment={() => onNavigateToModule?.('payments')}
          />
        </div>
      </div>

      {/* Operational Footer Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-xl bg-slate-100/80 border border-slate-200/70 gap-2">
        <div className="flex items-center gap-2.5 text-xs text-slate-600 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-teal-700" />
            <span>
              Venue Master Nodes:{' '}
              <span className="font-semibold text-slate-900">[Active Sync]</span>
            </span>
          </div>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">
            Data Feed Ref:{' '}
            <span className="font-mono text-slate-700">[MHMS-CORE-CLUSTER-09]</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-600"></span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-800 font-mono">
            [Live Stream Ready]
          </span>
        </div>
      </div>
    </div>
  );
};
