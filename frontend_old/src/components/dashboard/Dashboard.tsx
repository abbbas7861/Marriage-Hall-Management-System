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
  DollarSign,
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
import { dashboardApi } from '../../api/client';

interface DashboardProps {
  onNavigateToModule?: (moduleId: string) => void;
  onOpenCreateBooking?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateToModule,
  onOpenCreateBooking,
}) => {
  // Live Metrics State
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    dashboardApi.getMetrics()
      .then((data) => setMetrics(data))
      .catch((err) => console.error('Failed to load dashboard metrics:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const [emptySparklineData] = useState<any[]>([]);
  const [emptyRevenueData] = useState<any[]>([]);
  const [emptyOccupancyData] = useState<any[]>([]);
  const [upcomingEvents] = useState<Booking[]>([]);
  const [recentTransactions] = useState<PaymentTransaction[]>([]);

  const [activeHallFilter, setActiveHallFilter] = useState<'all' | 'main' | 'annex'>('all');
  const [activeRevenueType, setActiveRevenueType] = useState<'invoiced' | 'collected'>('invoiced');

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
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse"></span>
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

      {/* Top Row: 4 Summary Metric Containers with Sparklines (data={[]}) */}
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
                  {metrics ? metrics.totalBookings : '[--]'}
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
              <span>{metrics ? `${metrics.totalBookings} Active Reservations` : '[+ --% vs prev period]'}</span>
            </span>
          </div>

          {/* Tiny empty Sparkline chart at the bottom */}
          <Sparkline data={emptySparklineData} color="#00685f" />
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
                  {metrics ? `${metrics.hallOccupancy}%` : '[--]'}
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
              <span>{metrics ? `Live Peak Utilization` : '[--% Target Variance]'}</span>
            </span>
          </div>

          {/* Tiny empty Sparkline chart at the bottom */}
          <Sparkline data={emptySparklineData} color="#316bf3" />
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
                  {metrics ? `Rs. ${metrics.pendingPayments.toLocaleString()}` : '[--]'}
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
              <span>{metrics ? `${metrics.pendingInvoicesCount} Invoices Outstanding` : '[-- Invoices Outstanding]'}</span>
            </span>
          </div>

          {/* Tiny empty Sparkline chart at the bottom */}
          <Sparkline data={emptySparklineData} color="#d97706" />
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
                  {metrics ? metrics.upcomingEventsCount : '[--]'}
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
              <span>{metrics ? `${metrics.upcomingEventsCount} in Next 7-Day Window` : '[-- Next 7-Day Window]'}</span>
            </span>
          </div>

          {/* Tiny empty Sparkline chart at the bottom */}
          <Sparkline data={emptySparklineData} color="#00685f" />
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

          {/* Chart Frame with empty array data={[]} rendering X & Y axes and watermark empty state */}
          <div className="relative w-full h-72 flex flex-col justify-between py-1">
            <ResponsiveContainer width="100%" height="100%">
              {/* LineChart with empty data array data={[]} */}
              <LineChart
                data={emptyRevenueData}
                margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="period"
                  ticks={emptyXAxisTicks}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(val) => `[${val}%]`}
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                {/* No data lines rendered since data is empty array */}
                <Line
                  type="monotone"
                  dataKey="bookedRevenue"
                  stroke="#00685f"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="ancillaryCatering"
                  stroke="#316bf3"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Subtle empty state message overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pl-12 pr-4 pb-8">
              <div className="px-4 py-2 rounded-lg bg-white/95 border border-slate-200/90 shadow-xs flex items-center gap-2 backdrop-blur-xs">
                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 font-['Plus_Jakarta_Sans']">
                  No data available for the selected period.
                </span>
              </div>
            </div>
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

          {/* Donut Chart using Recharts PieChart with data={[]} */}
          <div className="relative w-full py-4 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emptyOccupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {emptyOccupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#00685f'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Empty state donut ring wireframe placeholder */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
                  {/* Outer base track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="11"
                    strokeDasharray="238.76"
                  />
                  {/* Subtle placeholder segment tracks */}
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
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#316bf3"
                    strokeOpacity="0.25"
                    strokeWidth="11"
                    strokeDasharray="55 238.76"
                    strokeDashoffset="-80"
                  />
                </svg>
              </div>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase font-mono">
                  [DISTRIBUTION]
                </span>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  [--]
                </span>
                <span className="text-[10px] text-slate-400 font-mono">[-- VENUES]</span>
              </div>
            </div>

            {/* Subtle empty state message */}
            <div className="mt-2 text-center">
              <span className="text-xs text-slate-400 italic font-['Plus_Jakarta_Sans']">
                No data available for the selected period.
              </span>
            </div>
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
            events={metrics?.upcomingEvents || upcomingEvents}
            onViewCalendar={() => onNavigateToModule?.('calendar')}
            onCreateBooking={onOpenCreateBooking}
          />
        </div>
        <div className="xl:col-span-6">
          <RecentTransactionsList
            transactions={metrics?.recentTransactions || recentTransactions}
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
          <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping"></span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-800 font-mono">
            [Live Stream Ready]
          </span>
        </div>
      </div>
    </div>
  );
};
