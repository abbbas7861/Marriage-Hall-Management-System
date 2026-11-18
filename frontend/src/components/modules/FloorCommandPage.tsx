import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Grid,
  RefreshCw,
  Send,
  ShieldCheck,
  Users,
} from 'lucide-react';

export type TableStatus = 'Occupied' | 'Needs Cleaning' | 'Ready';

export interface FloorTable {
  id: string;
  label: string;
  status: TableStatus;
  guestCount: number;
}

export interface RefillRequest {
  id: string;
  table: string;
  item: string;
  quantity: number;
  status: 'Preparing' | 'Dispatched' | 'Served';
  timestamp: string;
}

export interface OvertimeRequestRecord {
  id: string;
  hallEvent: string;
  extraHours: number;
  reason: string;
  status: 'Pending Manager Review';
  submittedAt: string;
}

interface FloorCommandPageProps {
  view: 'tables' | 'refill' | 'overtime';
}

const REFILL_ITEMS = [
  'Water',
  'Naan',
  'Biryani',
  'Karahi',
  'Raita & Salad',
  'Cold Drinks',
  'Tea / Kahwa',
];

const TABLE_STATUS_STYLES: Record<
  TableStatus,
  { badge: string; border: string; dot: string }
> = {
  Occupied: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    border: 'border-blue-200 hover:border-blue-300',
    dot: 'bg-blue-600',
  },
  'Needs Cleaning': {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    border: 'border-amber-200 hover:border-amber-300',
    dot: 'bg-amber-500',
  },
  Ready: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    border: 'border-emerald-200 hover:border-emerald-300',
    dot: 'bg-emerald-600',
  },
};

export const FloorCommandPage: React.FC<FloorCommandPageProps> = ({ view }) => {
  // Strictly empty initial arrays — zero hardcoded dummy data
  const [tables] = useState<FloorTable[]>([]);
  const [assignedEvents] = useState<string[]>([]);

  // Refill Dispatcher state
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedItem, setSelectedItem] = useState(REFILL_ITEMS[0]);
  const [refillQuantity, setRefillQuantity] = useState<string>('1');
  const [refillRequests, setRefillRequests] = useState<RefillRequest[]>([]);

  // Overtime Request state
  const [selectedHallEvent, setSelectedHallEvent] = useState('');
  const [extraHours, setExtraHours] = useState<string>('1');
  const [overtimeReason, setOvertimeReason] = useState('');
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequestRecord[]>([]);

  const handleDispatchRefill = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(refillQuantity, 10);
    if (!selectedTable || Number.isNaN(qty) || qty <= 0) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newReq: RefillRequest = {
      id: `RF-${Date.now().toString().slice(-4)}`,
      table: selectedTable,
      item: selectedItem,
      quantity: qty,
      status: 'Preparing',
      timestamp: timeStr,
    };

    setRefillRequests((prev) => [newReq, ...prev]);
    setRefillQuantity('1');
  };

  const handleSubmitOvertime = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(extraHours);
    if (!selectedHallEvent || Number.isNaN(hours) || hours <= 0 || !overtimeReason.trim()) {
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const record: OvertimeRequestRecord = {
      id: `OT-${Date.now().toString().slice(-4)}`,
      hallEvent: selectedHallEvent,
      extraHours: hours,
      reason: overtimeReason.trim(),
      status: 'Pending Manager Review',
      submittedAt: timeStr,
    };

    setOvertimeRequests((prev) => [record, ...prev]);
    setExtraHours('1');
    setOvertimeReason('');
  };

  const renderFloorBadge = () => (
    <span className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-teal-800 shrink-0">
      <ShieldCheck className="w-4 h-4 text-teal-700" />
      Floor Command
    </span>
  );

  // TAB 1: TABLE MONITORING
  if (view === 'tables') {
    const occupiedCount = tables.filter((t) => t.status === 'Occupied').length;
    const cleaningCount = tables.filter((t) => t.status === 'Needs Cleaning').length;
    const readyCount = tables.filter((t) => t.status === 'Ready').length;

    return (
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Floor Operations &amp; Table Monitoring
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-500">
              Live event tracking and table service dispatch.
            </p>
          </div>
          {renderFloorBadge()}
        </div>

        {/* Status Summary Strip (No Financial Data) */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <p className="text-xs sm:text-sm font-medium text-slate-500">Occupied</p>
            <p className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-blue-700">
              {tables.length === 0 ? '[--]' : occupiedCount}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <p className="text-xs sm:text-sm font-medium text-slate-500">Needs Cleaning</p>
            <p className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-600">
              {tables.length === 0 ? '[--]' : cleaningCount}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <p className="text-xs sm:text-sm font-medium text-slate-500">Ready</p>
            <p className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-700">
              {tables.length === 0 ? '[--]' : readyCount}
            </p>
          </div>
        </div>

        {/* Main Section: Live Table Map */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <Grid className="w-5 h-5" />
              </div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg sm:text-xl font-bold text-slate-900">
                Live Table Map
              </h2>
            </div>

            <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Occupied
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Needs Cleaning
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Ready
              </span>
            </div>
          </div>

          {tables.length === 0 ? (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
                <Grid className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-base sm:text-lg font-semibold text-slate-700">
                No active tables assigned to this hall.
              </p>
              <p className="mt-1 text-sm text-slate-500 max-w-md">
                Assigned banquet tables and VIP seating will appear here once the floor manager activates an event.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {tables.map((table) => {
                const style = TABLE_STATUS_STYLES[table.status];
                return (
                  <div
                    key={table.id}
                    className={`rounded-xl border-2 bg-white p-5 sm:p-6 flex flex-col justify-between min-h-[164px] transition-colors ${style.border}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                        {table.label}
                      </span>
                      <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                    </div>

                    <div className="mt-3 space-y-2.5">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${style.badge}`}
                      >
                        {table.status}
                      </span>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="font-mono tabular-nums">{table.guestCount}</span>
                        <span>Guests</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  }

  // TAB 2: REFILL DISPATCHER
  if (view === 'refill') {
    return (
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Kitchen Refill Dispatcher
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-500">
              Send immediate food and beverage refill requests directly to the kitchen display.
            </p>
          </div>
          {renderFloorBadge()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left: Touch-Friendly Dispatch Form */}
          <form
            onSubmit={handleDispatchRefill}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">New Refill Request</h2>
            </div>

            <div>
              <label
                htmlFor="refill-table"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Select Table
              </label>
              <select
                id="refill-table"
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                required
                className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
              >
                <option value="">
                  {tables.length === 0
                    ? 'No tables assigned yet'
                    : 'Choose a table...'}
                </option>
                {tables.map((t) => (
                  <option key={t.id} value={t.label}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="refill-item"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Select Item
                </label>
                <select
                  id="refill-item"
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                >
                  {REFILL_ITEMS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="refill-qty"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Quantity
                </label>
                <input
                  id="refill-qty"
                  type="number"
                  min={1}
                  required
                  value={refillQuantity}
                  onChange={(e) => setRefillQuantity(e.target.value)}
                  className="w-full h-12 rounded-xl border border-slate-300 px-4 text-base font-mono tabular-nums text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={tables.length === 0}
              className="w-full h-14 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-base sm:text-lg font-semibold inline-flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-5 h-5" />
              Dispatch Refill to Kitchen
            </button>
          </form>

          {/* Right: Active Requests List */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Active Requests</h2>
              <span className="font-mono tabular-nums text-sm font-semibold text-slate-500">
                ({refillRequests.length})
              </span>
            </div>

            {refillRequests.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm sm:text-base font-medium text-slate-600">
                  No active refill requests.
                </p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Dispatched kitchen requests will appear here.
                </p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {refillRequests.map((req) => (
                  <li
                    key={req.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {req.table} &mdash; {req.item} (×{req.quantity})
                      </p>
                      <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                        Sent at {req.timestamp}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                      {req.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    );
  }

  // TAB 3: OVERTIME REQUEST
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Request Event Overtime
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            Notify the floor manager when an event requires extended service hours.
          </p>
        </div>
        {renderFloorBadge()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left: Overtime Form */}
        <form
          onSubmit={handleSubmitOvertime}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Overtime Extension Form</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="overtime-hall"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Select Hall / Event
              </label>
              <select
                id="overtime-hall"
                value={selectedHallEvent}
                onChange={(e) => setSelectedHallEvent(e.target.value)}
                required
                className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
              >
                <option value="">
                  {assignedEvents.length === 0
                    ? 'No active halls/events assigned'
                    : 'Choose hall or event...'}
                </option>
                {assignedEvents.map((ev) => (
                  <option key={ev} value={ev}>
                    {ev}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="overtime-hours"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Extra Hours Needed
              </label>
              <input
                id="overtime-hours"
                type="number"
                step="0.5"
                min="0.5"
                required
                value={extraHours}
                onChange={(e) => setExtraHours(e.target.value)}
                className="w-full h-12 rounded-xl border border-slate-300 px-4 text-base font-mono tabular-nums text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="overtime-reason"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Reason
            </label>
            <textarea
              id="overtime-reason"
              rows={4}
              required
              value={overtimeReason}
              onChange={(e) => setOvertimeReason(e.target.value)}
              placeholder="Function is running late"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={assignedEvents.length === 0}
            className="w-full h-14 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-base sm:text-lg font-semibold inline-flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            <Send className="w-5 h-5" />
            Send Request to Manager
          </button>
        </form>

        {/* Right: Submitted Overtime Requests */}
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Submitted Requests</h2>
            <span className="font-mono tabular-nums text-sm font-semibold text-slate-500">
              ({overtimeRequests.length})
            </span>
          </div>

          {overtimeRequests.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm sm:text-base font-medium text-slate-600">
                No overtime requests submitted.
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Your manager will be alerted as soon as you submit a request.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {overtimeRequests.map((req) => (
                <li
                  key={req.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-base font-semibold text-slate-900">
                      {req.hallEvent}
                    </p>
                    <span className="shrink-0 font-mono tabular-nums text-sm font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md">
                      +{req.extraHours}h
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{req.reason}</p>
                  <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {req.status}
                    </span>
                    <span className="font-mono tabular-nums">{req.submittedAt}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
