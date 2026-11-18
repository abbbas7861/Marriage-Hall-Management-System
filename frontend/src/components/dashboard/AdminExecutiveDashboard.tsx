import React from 'react';
import {
  DollarSign,
  Calendar,
  Building,
  AlertCircle,
  CalendarDays,
  Receipt,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
} from 'recharts';

export const AdminExecutiveDashboard: React.FC = () => {
  // Strictly empty arrays — no hardcoded dummy data
  const revenueData: never[] = [];
  const occupancyData: never[] = [];
  const upcomingEvents: never[] = [];
  const recentTransactions: never[] = [];

  const kpiCards = [
    {
      label: 'Total Revenue',
      value: '[--]',
      icon: DollarSign,
      iconTone: 'bg-teal-50 text-teal-700 border-teal-200/70',
    },
    {
      label: 'Total Bookings',
      value: '[--]',
      icon: Calendar,
      iconTone: 'bg-gray-50 text-gray-600 border-gray-200/80',
    },
    {
      label: 'Active Halls',
      value: '[--]',
      icon: Building,
      iconTone: 'bg-gray-50 text-gray-600 border-gray-200/80',
    },
    {
      label: 'Pending Payments',
      value: '[--]',
      icon: AlertCircle,
      iconTone: 'bg-amber-50 text-amber-700 border-amber-200/70',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-['Plus_Jakarta_Sans']">
          Admin Executive Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of venue revenue, bookings, hall occupancy, and recent activity.
        </p>
      </div>

      {/* Top Row: 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between gap-3"
            >
              <div>
                <p className="text-xs font-medium text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2 font-mono tabular-nums">
                  {card.value}
                </p>
              </div>
              <div
                className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${card.iconTone}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Row: Charts (2/3 Revenue Overview, 1/3 Hall Occupancy) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Chart: Revenue Overview (2/3 width) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
          <div className="pb-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Revenue Overview</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Revenue performance across the selected reporting period
            </p>
          </div>

          <div className="relative h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenueData}
                margin={{ top: 16, right: 16, left: 0, bottom: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0f766e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Empty State Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pl-10 pb-6">
              <p className="text-xs font-medium text-gray-500 bg-white/95 px-3.5 py-2 rounded-lg border border-gray-200">
                No data available for this period.
              </p>
            </div>
          </div>
        </div>

        {/* Right Chart: Hall Occupancy (1/3 width) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
          <div className="pb-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Hall Occupancy</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Utilization breakdown by hall
            </p>
          </div>

          <div className="relative flex-1 min-h-[260px] flex flex-col items-center justify-center mt-4">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={76}
                    dataKey="value"
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Subtle Empty Donut Ring */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="10"
                  />
                </svg>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-lg font-bold text-gray-900 font-mono tabular-nums">
                  [--]
                </span>
                <span className="text-[11px] text-gray-400">Occupancy</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              No occupancy data available.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Row: Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Table: Upcoming Events */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Upcoming Events</h2>
            <CalendarDays className="w-4 h-4 text-gray-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-medium">
                  <th className="py-3 px-5">Event Name</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Hall</th>
                  <th className="py-3 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingEvents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 px-5 text-center text-sm text-gray-500">
                      No upcoming events scheduled.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Table: Recent Transactions */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent Transactions</h2>
            <Receipt className="w-4 h-4 text-gray-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-medium">
                  <th className="py-3 px-5">Invoice ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 px-5 text-center text-sm text-gray-500">
                      No recent transactions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
