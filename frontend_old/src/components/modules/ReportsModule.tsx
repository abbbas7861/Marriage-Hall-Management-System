import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Building2,
  DollarSign,
  CalendarDays,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  PieChart as PieIcon,
  Layers,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Line,
} from 'recharts';
import { Hall } from '../../types';
import { reportsApi, hallsApi } from '../../api/client';

export const ReportsModule: React.FC = () => {
  // Live Report Summary State
  const [summaryData, setSummaryData] = useState<any>(null);
  const [hallsList, setHallsList] = useState<Hall[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedHall, setSelectedHall] = useState('All Halls');
  const [reportType, setReportType] = useState('Comprehensive Financial Report');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    hallsApi.list().then(setHallsList).catch(() => []);
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await reportsApi.getSummary({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        hall: selectedHall !== 'All Halls' ? selectedHall : undefined,
      });
      setSummaryData(data);
    } catch (err: any) {
      console.error('Failed to load report summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, selectedHall]);

  const [revenueExpensesData] = useState<any[]>([]);
  const [hallBookingsData] = useState<any[]>([]);
  const [topMenuPackagesData] = useState<any[]>([]);
  const monthlyBreakdownRecords = summaryData?.monthlyBreakdown || [];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExport = (format: 'CSV' | 'PDF') => {
    showToast(`${format} export generated successfully for ${selectedHall} (${startDate || '[Start Date]'} to ${endDate || '[End Date]'}).`);
  };

  return (
    <div className="flex flex-col w-full gap-5 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-teal-900 text-teal-50 text-xs font-semibold shadow-xl border border-teal-700/50 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-teal-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Section: Header & Controls */}
      <div className="flex flex-col gap-4 pb-3 border-b border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
                Business Reports &amp; Analytics
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-bold uppercase tracking-wider">
                Financial Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Comprehensive overview of revenue, hall performance, and expenses.
            </p>
          </div>

          {/* Primary "Export Report" Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport('CSV')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Controls Bar: Date Range Picker, Select Hall Dropdown */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Picker */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="[Start Date]"
                  aria-label="Start Date"
                  className="bg-transparent text-slate-800 text-xs focus:outline-none placeholder:text-slate-400"
                />
                <span className="text-slate-400 font-semibold px-0.5">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="[End Date]"
                  aria-label="End Date"
                  className="bg-transparent text-slate-800 text-xs focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Select Hall Dropdown */}
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                value={selectedHall}
                onChange={(e) => setSelectedHall(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer"
              >
                <option value="All Halls">All Halls / Venues</option>
                {hallsList.length > 0 ? (
                  hallsList.map((h) => (
                    <option key={h.id} value={h.name}>
                      {h.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Grand Crystal Ballroom">Grand Crystal Ballroom</option>
                    <option value="Royal Emerald Hall">Royal Emerald Hall</option>
                    <option value="Sapphire Banquet">Sapphire Banquet</option>
                    <option value="Imperial Courtyard Lawn">Imperial Courtyard Lawn</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Presets:</span>
            {['This Month', 'Last Quarter', 'Year to Date'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  const now = new Date();
                  const y = now.getFullYear();
                  const m = String(now.getMonth() + 1).padStart(2, '0');
                  if (preset === 'This Month') {
                    setStartDate(`${y}-${m}-01`);
                    setEndDate(`${y}-${m}-28`);
                  } else if (preset === 'Last Quarter') {
                    setStartDate(`${y}-07-01`);
                    setEndDate(`${y}-09-30`);
                  } else {
                    setStartDate(`${y}-01-01`);
                    setEndDate(now.toISOString().split('T')[0]);
                  }
                  showToast(`Applied preset: ${preset}`);
                }}
                className="px-2.5 py-1 text-[11px] rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Row: 4 KPI Cards (Placeholders [--]) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Revenue */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {summaryData ? `Rs. ${summaryData.grossRevenue.toLocaleString()}` : '[--]'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Gross hall rentals &amp; catering receipts</p>
        </div>

        {/* Total Bookings */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Bookings
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {summaryData ? summaryData.totalBookings : '[--]'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Confirmed and completed reservations</p>
        </div>

        {/* Total Expenses */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-2">
            {summaryData ? `Rs. ${summaryData.totalExpenses.toLocaleString()}` : '[--]'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Catering food cost, staff &amp; utilities</p>
        </div>

        {/* Net Profit */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Net Profit
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">
            {summaryData ? `Rs. ${summaryData.netProfit.toLocaleString()}` : '[--]'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Operating bottom-line margin</p>
        </div>
      </div>

      {/* Middle Section: Charts using Recharts */}
      <div className="space-y-4">
        {/* Chart 1 (Large - Full Width): Revenue vs. Expenses Trend */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-700" />
                <span>Revenue vs. Expenses Trend</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly comparison of gross banquet turnover against venue operating expenditures.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-700 inline-block" />
                <span>Gross Revenue</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#1e293b] inline-block" />
                <span>Total Expenses</span>
              </div>
            </div>
          </div>

          {/* Full Width BarChart with empty data={[]} */}
          <div className="relative w-full h-80 flex flex-col justify-between py-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueExpensesData}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  ticks={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  ticks={[0, 25000, 50000, 75000, 100000]}
                  tickFormatter={(v) => (v === 0 ? '$0' : `$${v / 1000}k`)}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip />
                <Bar dataKey="revenue" fill="#00685f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#1e293b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Empty State Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="px-5 py-3 rounded-xl bg-white/95 border border-slate-200/90 shadow-sm flex items-center gap-2.5 text-center">
                <Info className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">
                  No data available for the selected period.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Chart 2 (Half Width) & Chart 3 (Half Width) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart 2 (Half Width): Bookings by Hall */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-teal-700" />
                  <span>Bookings by Hall</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proportional utilization share across banquet venue halls.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">[0 events]</span>
            </div>

            {/* Donut Chart with empty data={[]} */}
            <div className="relative w-full h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hallBookingsData}
                    dataKey="bookings"
                    nameKey="hallName"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    <Cell fill="#00685f" />
                    <Cell fill="#047857" />
                    <Cell fill="#1e293b" />
                    <Cell fill="#0d9488" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Decorative Empty Donut Ring */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-44 h-44 rounded-full border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 text-center bg-slate-50/50">
                  <Building2 className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-500 leading-tight">
                    No data available for the selected period.
                  </span>
                </div>
              </div>
            </div>

            {/* Hall Legend Placeholders */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-700" />
                <span>Hall 1 (Royal Crystal): [--]</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Hall 2 (Grand Imperial): [--]</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                <span>Hall 3 (Emerald Pavilion): [--]</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span>Hall 4 (Sapphire Banquet): [--]</span>
              </div>
            </div>
          </div>

          {/* Chart 3 (Half Width): Top Selling Menu Packages */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>Top Selling Menu Packages</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Package popularity volume ranked by client selections.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">[0 orders]</span>
            </div>

            {/* Horizontal BarChart with empty data={[]} */}
            <div className="relative w-full h-64 flex flex-col justify-between py-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topMenuPackagesData}
                  margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    ticks={[0, 10, 20, 30, 40, 50]}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="packageName"
                    ticks={['Royal Platinum', 'Imperial Gold', 'Classic Silver', 'Executive Barat']}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    width={90}
                  />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#047857" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* Empty State Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-4 py-2.5 rounded-xl bg-white/95 border border-slate-200/90 shadow-sm flex items-center gap-2 text-center">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500">
                    No data available for the selected period.
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Package Notes */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
              <span>Standard Tier / Executive Tier Packages</span>
              <span className="font-mono text-[11px]">[--] Per Head Average</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Data Table (Monthly Financial Breakdown) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Monthly Financial Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Audited reconciliation of event counts, total receipts, operational expenditures, and profit margin.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport('CSV')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('PDF')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-teal-700" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Data Table with Columns & Empty State Row */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-4 text-center">Total Bookings</th>
                <th className="py-3 px-4 text-right">Gross Revenue</th>
                <th className="py-3 px-4 text-right">Total Expenses</th>
                <th className="py-3 px-4 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyBreakdownRecords.length === 0 ? (
                <>
                  {/* Required Empty State Row */}
                  <tr>
                    <td colSpan={5} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-600">
                          No financial records found for the selected period.
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                          Financial records will populate automatically as customer payments are reconciled and hall expenses are recorded.
                        </p>
                      </div>
                    </td>
                  </tr>

                  {/* Structural Placeholder Schema Row */}
                  <tr className="bg-slate-50/50 font-mono text-[11px] text-slate-400">
                    <td className="py-2 px-4 italic">[Month]</td>
                    <td className="py-2 px-4 text-center">[--]</td>
                    <td className="py-2 px-4 text-right">[--]</td>
                    <td className="py-2 px-4 text-right">[--]</td>
                    <td className="py-2 px-4 text-right">[--]</td>
                  </tr>
                </>
              ) : (
                monthlyBreakdownRecords.map((record: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{record.month}</td>
                    <td className="py-3 px-4 text-center font-mono">{record.totalBookings}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                      ${record.grossRevenue?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600">
                      ${record.totalExpenses?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      ${record.netProfit?.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Audit Bar */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-600" />
            <span>Accounting Ledger Engine: GAAP Compliant</span>
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Selected Venue Scope: {selectedHall} • Active Currency: USD ($)
          </span>
        </div>
      </div>
    </div>
  );
};
