import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Grid,
  RefreshCw,
  Send,
  ShieldCheck,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Save,
  Crown,
  Star,
} from 'lucide-react';
import { bookingsApi, kdsApi, KitchenOrderTicketItem } from '../../api/client';
import { Booking } from '../../types';

export type TableStatus = 'Occupied' | 'Needs Cleaning' | 'Ready';

export interface FloorTable {
  id: string;
  tableNumber: number;
  label: string;
  isVIP: boolean;
  status: TableStatus;
  guestCount: number;
}

export interface RefillRequest {
  id: string;
  table: string;
  item: string;
  quantity: number;
  status: string;
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
  { badge: string; border: string; dot: string; bg: string }
> = {
  Occupied: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    border: 'border-blue-200 hover:border-blue-300',
    dot: 'bg-blue-600',
    bg: 'hover:bg-blue-50/30',
  },
  'Needs Cleaning': {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    border: 'border-amber-200 hover:border-amber-300',
    dot: 'bg-amber-500',
    bg: 'hover:bg-amber-50/30',
  },
  Ready: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    border: 'border-emerald-200 hover:border-emerald-300',
    dot: 'bg-emerald-600',
    bg: 'hover:bg-emerald-50/30',
  },
};

const PERSONS_PER_TABLE_PRESETS = [6, 8, 10, 12];

export const FloorCommandPage: React.FC<FloorCommandPageProps> = ({ view }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [personsPerTable, setPersonsPerTable] = useState<number>(10);
  const [vipTables, setVipTables] = useState<number[]>([1, 2]);
  const [showAllTables, setShowAllTables] = useState<boolean>(false);
  const [tableStatusMap, setTableStatusMap] = useState<Record<string, TableStatus>>({});
  const [isSavingPersons, setIsSavingPersons] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Load bookings from API
  useEffect(() => {
    bookingsApi
      .list()
      .then((data) => {
        if (Array.isArray(data)) {
          const activeOnly = data.filter((b: any) => {
            if (b.status === 'Cancelled' || b.status === 'Rejected' || b.status === 'Completed') return false;
            const op = (b.operationalStatus || b.operational_status || '').toLowerCase();
            if (op.includes('concluded') || op.includes('completed') || op.includes('closed')) return false;
            return true;
          });
          if (activeOnly.length > 0) {
            setBookings(activeOnly);
            const first = activeOnly[0];
            setSelectedBookingId(String(first.id));
            const initialPpt = Number(first.personsPerTable) || 10;
            setPersonsPerTable(initialPpt);
            const initialVip = Array.isArray(first.vipTables) && first.vipTables.length > 0
              ? first.vipTables.map(Number)
              : [1, 2];
            setVipTables(initialVip);
            setSelectedHallEvent(`${first.hallName} — ${first.customerName || first.bookingRef} (${first.date})`);
          } else {
            setBookings([]);
            setSelectedBookingId('');
            setSelectedHallEvent('');
          }
        }
      })
      .catch(() => {});
  }, []);

  // Selected Booking
  const selectedBooking = useMemo(() => {
    return bookings.find((b) => String(b.id) === String(selectedBookingId)) || bookings[0] || null;
  }, [bookings, selectedBookingId]);

  // When selected event changes, update personsPerTable and vipTables
  const handleSelectBooking = (id: string) => {
    setSelectedBookingId(id);
    const found = bookings.find((b) => String(b.id) === String(id));
    if (found) {
      setPersonsPerTable(Number(found.personsPerTable) || 10);
      const foundVips = Array.isArray(found.vipTables) && found.vipTables.length > 0
        ? found.vipTables.map(Number)
        : [1, 2];
      setVipTables(foundVips);
      setSelectedHallEvent(`${found.hallName} — ${found.customerName || found.bookingRef} (${found.date})`);
    }
  };

  // Persist personsPerTable to booking in backend
  const handleSavePersonsPerTable = async (newVal?: number) => {
    const val = newVal !== undefined ? newVal : personsPerTable;
    if (!selectedBooking) return;
    setIsSavingPersons(true);
    try {
      if (selectedBooking.id && !String(selectedBooking.id).startsWith('seed-')) {
        await bookingsApi.patch(String(selectedBooking.id), { personsPerTable: val });
        setBookings((prev) =>
          prev.map((b) =>
            String(b.id) === String(selectedBooking.id) ? { ...b, personsPerTable: val } : b
          )
        );
        window.dispatchEvent(
          new CustomEvent('booking_updated', {
            detail: { bookingId: String(selectedBooking.id), personsPerTable: val, vipTables },
          })
        );
      }
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    } catch (err) {
      console.warn('Failed to persist persons per table:', err);
    } finally {
      setIsSavingPersons(false);
    }
  };

  const handlePersonsPresetClick = (preset: number) => {
    setPersonsPerTable(preset);
    handleSavePersonsPerTable(preset);
  };

  // Toggle VIP designation for a table number
  const handleToggleVipTable = async (tableNum: number) => {
    const nextVip = vipTables.includes(tableNum)
      ? vipTables.filter((n) => n !== tableNum)
      : [...vipTables, tableNum].sort((a, b) => a - b);

    setVipTables(nextVip);
    if (selectedBooking?.id && !String(selectedBooking.id).startsWith('seed-')) {
      try {
        await bookingsApi.patch(String(selectedBooking.id), { vipTables: nextVip });
        setBookings((prev) =>
          prev.map((b) =>
            String(b.id) === String(selectedBooking.id) ? { ...b, vipTables: nextVip } : b
          )
        );
        window.dispatchEvent(
          new CustomEvent('booking_updated', {
            detail: { bookingId: String(selectedBooking.id), personsPerTable, vipTables: nextVip },
          })
        );
      } catch (err) {
        console.warn('Failed to persist VIP tables:', err);
      }
    }
  };

  // Calculations
  const guestCount = Number(selectedBooking?.guestCount) || 100;
  const effectivePersonsPerTable = Math.max(1, personsPerTable);
  const exactTableCount = Math.max(1, Math.ceil(guestCount / effectivePersonsPerTable));

  // Dynamically generate table list
  const dynamicTables: FloorTable[] = useMemo(() => {
    const list: FloorTable[] = [];
    for (let i = 1; i <= exactTableCount; i++) {
      const tableId = `T-${String(i).padStart(2, '0')}`;
      const isVIP = vipTables.includes(i);
      const label = isVIP ? `VIP Table ${i}` : `Table ${i}`;
      
      // Default initial status distribution: first 65% occupied, 15% needs cleaning, 20% ready
      let defaultStatus: TableStatus = 'Occupied';
      if (i > Math.floor(exactTableCount * 0.8)) {
        defaultStatus = 'Ready';
      } else if (i > Math.floor(exactTableCount * 0.65)) {
        defaultStatus = 'Needs Cleaning';
      }

      // Guest count at this table: either personsPerTable or remainder for last table
      const isLast = i === exactTableCount;
      const remainder = guestCount % effectivePersonsPerTable;
      const tableGuests = isLast && remainder > 0 ? remainder : effectivePersonsPerTable;

      list.push({
        id: tableId,
        tableNumber: i,
        label,
        isVIP,
        status: tableStatusMap[tableId] || defaultStatus,
        guestCount: tableGuests,
      });
    }
    return list;
  }, [exactTableCount, guestCount, effectivePersonsPerTable, tableStatusMap, vipTables]);

  // Cycle table status: Ready -> Occupied -> Needs Cleaning -> Ready
  const handleCycleTableStatus = (tableId: string) => {
    setTableStatusMap((prev) => {
      const current = dynamicTables.find((t) => t.id === tableId)?.status || 'Ready';
      let next: TableStatus = 'Occupied';
      if (current === 'Occupied') next = 'Needs Cleaning';
      else if (current === 'Needs Cleaning') next = 'Ready';
      else next = 'Occupied';
      return { ...prev, [tableId]: next };
    });
  };

  // Refill Dispatcher state
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedItem, setSelectedItem] = useState(REFILL_ITEMS[0]);
  const [refillQuantity, setRefillQuantity] = useState<string>('1');
  const [refillRequests, setRefillRequests] = useState<RefillRequest[]>([]);
  const [isDispatchingRefill, setIsDispatchingRefill] = useState(false);

  // Overtime Request state
  const [selectedHallEvent, setSelectedHallEvent] = useState('');
  const [extraHours, setExtraHours] = useState<string>('1');
  const [overtimeReason, setOvertimeReason] = useState('');
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequestRecord[]>([]);

  const mapTicketToRefillRequest = (ticket: KitchenOrderTicketItem): RefillRequest => {
    const notesStr = ticket.notes || '';
    const tableMatch = notesStr.match(/^Table:\s*(.+)$/i);
    const tableLabel = tableMatch ? tableMatch[1].trim() : ticket.hallName || 'Floor Table';
    const timeStr = ticket.createdAt
      ? new Date(ticket.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : '';

    return {
      id: String(ticket.id),
      table: tableLabel,
      item: ticket.dishName,
      quantity: ticket.quantity || 1,
      status: ticket.status,
      timestamp: timeStr,
    };
  };

  const fetchRefillRequests = async () => {
    try {
      const tickets = await kdsApi.list();
      const active = tickets
        .filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled')
        .map(mapTicketToRefillRequest);
      setRefillRequests(active);
    } catch (err) {
      console.error('Failed to load refill requests from KDS:', err);
    }
  };

  useEffect(() => {
    fetchRefillRequests();
    if (view !== 'refill') return;
    const interval = setInterval(() => {
      fetchRefillRequests();
    }, 4000);
    return () => clearInterval(interval);
  }, [view]);

  const getStationForRefillItem = (item: string): string => {
    switch (item) {
      case 'Naan':
        return 'Tandoor & Breads';
      case 'Karahi':
        return 'Live BBQ & Karahi';
      case 'Raita & Salad':
        return 'Salad & Cold Station';
      case 'Water':
      case 'Cold Drinks':
      case 'Tea / Kahwa':
        return 'Desserts & Beverages';
      default:
        return 'Hot Buffet Line 1';
    }
  };

  const handleDispatchRefill = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(refillQuantity, 10);
    if (!selectedTable || Number.isNaN(qty) || qty <= 0 || isDispatchingRefill) return;

    setIsDispatchingRefill(true);
    try {
      await kdsApi.create({
        eventRef: selectedBooking?.bookingRef || 'FLOOR-GENERAL',
        hallName: selectedBooking?.hallName || 'Grand Crystal Ballroom',
        dishName: selectedItem,
        quantity: qty,
        portionSize: `${qty} × ${selectedItem} (${selectedTable})`,
        priority: 'Urgent',
        station: getStationForRefillItem(selectedItem),
        requestedBy: 'Floor Manager',
        notes: `Table: ${selectedTable}`,
      });
      await fetchRefillRequests();
      setRefillQuantity('1');
    } catch (err) {
      console.error('Failed to dispatch refill to Kitchen KDS:', err);
    } finally {
      setIsDispatchingRefill(false);
    }
  };

  const handleSubmitOvertime = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(extraHours);
    if (!selectedHallEvent || Number.isNaN(hours) || hours <= 0 || !overtimeReason.trim()) {
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

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
    const occupiedCount = dynamicTables.filter((t) => t.status === 'Occupied').length;
    const cleaningCount = dynamicTables.filter((t) => t.status === 'Needs Cleaning').length;
    const readyCount = dynamicTables.filter((t) => t.status === 'Ready').length;

    return (
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Floor Operations &amp; Table Monitoring
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-500">
              Live banquet hall table tracking, seating calculation, and service status.
            </p>
          </div>
          {renderFloorBadge()}
        </div>

        {/* Configuration Card: Active Event & Persons per Table Option */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            {/* Event Selector */}
            <div className="flex-1 min-w-[260px]">
              <label htmlFor="event-select" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Current Active Event
              </label>
              <div className="relative">
                <select
                  id="event-select"
                  value={selectedBookingId}
                  onChange={(e) => handleSelectBooking(e.target.value)}
                  className="w-full h-11 appearance-none rounded-lg border border-slate-300 bg-white px-3.5 pr-10 text-sm font-semibold text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 cursor-pointer"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.hallName} — {b.customerName || b.bookingRef} ({b.eventType} · {b.guestCount || 100} Guests · {b.date})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Persons Per Table Setting */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Persons per Table
                </label>
                <div className="flex items-center gap-1.5">
                  {PERSONS_PER_TABLE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePersonsPresetClick(preset)}
                      className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        personsPerTable === preset
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                  <div className="relative flex items-center ml-1">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={personsPerTable}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                        setPersonsPerTable(val);
                      }}
                      onBlur={() => handleSavePersonsPerTable()}
                      className="w-16 h-9 rounded-lg border border-slate-300 px-2 text-center text-xs font-bold text-slate-900 font-mono focus:border-teal-700 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-500 ml-1.5">guests/table</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSavePersonsPerTable()}
                disabled={isSavingPersons}
                className="h-10 px-3.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Save this table capacity for this event"
              >
                <Save className="w-3.5 h-3.5 text-teal-700" />
                {isSavingPersons ? 'Saving...' : 'Save Capacity'}
              </button>
            </div>
          </div>

          {/* Table Count Formula Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-teal-50/80 to-sky-50/60 border border-teal-200/70 rounded-xl p-3.5 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                {exactTableCount}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Exact Table Requirement: <span className="text-teal-800 font-mono">{exactTableCount} Banquet Tables</span>
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Calculated dynamically: <span className="font-semibold text-slate-800">{guestCount} Expected Guests</span> ÷{' '}
                  <span className="font-semibold text-slate-800">{effectivePersonsPerTable} persons per table</span>
                  {guestCount % effectivePersonsPerTable !== 0 && (
                    <span className="text-slate-500 italic ml-1">
                      (includes 1 table of {guestCount % effectivePersonsPerTable} guests)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {saveSuccessNotice && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Capacity saved to event!
              </span>
            )}
          </div>
        </div>

        {/* Status Summary Strip with Exact Table Counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-slate-500">Exact Total Tables</p>
              <Grid className="w-4 h-4 text-teal-700" />
            </div>
            <p className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
              {exactTableCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              For {guestCount} guests @ {effectivePersonsPerTable}/table
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-slate-500">Occupied</p>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            </div>
            <p className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-blue-700">
              {occupiedCount}
            </p>
            <p className="text-[11px] text-blue-600/80 mt-1 font-mono">
              ~{occupiedCount * effectivePersonsPerTable} guests seated
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-slate-500">Needs Cleaning</p>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            </div>
            <p className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-600">
              {cleaningCount}
            </p>
            <p className="text-[11px] text-amber-600/80 mt-1">
              Turnover in progress
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-slate-500">Ready &amp; Set</p>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            </div>
            <p className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-700">
              {readyCount}
            </p>
            <p className="text-[11px] text-emerald-600/80 mt-1">
              Available for arrival
            </p>
          </div>
        </div>

        {/* Main Section: Live Table Map with Exact Calculated Tables */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <Grid className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>Live Table Map</span>
                  <span className="text-sm font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md font-mono">
                    {exactTableCount} Active Tables
                  </span>
                  {vipTables.length > 0 && (
                    <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1 font-mono">
                      <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                      {vipTables.length} VIP
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any table number to toggle VIP / Regular · Click card body to cycle service state
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Occupied ({occupiedCount})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Needs Cleaning ({cleaningCount})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Ready ({readyCount})
              </span>
            </div>
          </div>

          {/* Table Cards Grid (Preview limited or scrollable) */}
          <div
            className={
              showAllTables
                ? 'mt-6 max-h-[560px] overflow-y-auto pr-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                : 'mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
            }
          >
            {(showAllTables ? dynamicTables : dynamicTables.slice(0, 10)).map((table) => {
              const style = TABLE_STATUS_STYLES[table.status];
              return (
                <div
                  key={table.id}
                  onClick={() => handleCycleTableStatus(table.id)}
                  className={`rounded-xl border-2 bg-white p-4 flex flex-col justify-between min-h-[148px] transition-all cursor-pointer select-none shadow-2xs hover:shadow-sm ${
                    table.isVIP
                      ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20'
                      : style.border
                  } ${style.bg}`}
                  title="Click card to cycle status · Click table number to toggle VIP"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVipTable(table.tableNumber);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        table.isVIP
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 shadow-2xs'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title="Click to toggle VIP / Regular seating"
                    >
                      {table.isVIP ? (
                        <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0" />
                      ) : (
                        <Star className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span>
                        {table.isVIP ? `VIP T-${table.tableNumber}` : `Table ${table.tableNumber}`}
                      </span>
                    </button>
                    <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                  </div>

                  <div className="mt-3 space-y-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}
                    >
                      {table.status}
                    </span>
                    <div className="flex items-center justify-between text-xs font-medium text-slate-600 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono font-bold text-slate-800">{table.guestCount}</span>
                        <span>Seats</span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Tap to cycle
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show More / Show Less Controls to Enable Scrolling */}
          {dynamicTables.length > 10 && (
            <div className="mt-5 pt-3 border-t border-slate-100">
              {!showAllTables ? (
                <button
                  type="button"
                  onClick={() => setShowAllTables(true)}
                  className="w-full py-3 px-4 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                  Show More Tables ({dynamicTables.length - 10} hidden) · Enable Scroll
                </button>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Displaying all {dynamicTables.length} tables with vertical scroll enabled
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAllTables(false)}
                    className="py-1.5 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    Show Less
                  </button>
                </div>
              )}
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
              Send immediate food and beverage refill requests directly to the kitchen display for active tables.
            </p>
          </div>
          {renderFloorBadge()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left: Touch-Friendly Dispatch Form */}
          <form
            onSubmit={handleDispatchRefill}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs"
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">New Refill Request</h2>
            </div>

            {/* Select Table from exact dynamic tables */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="refill-table"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Select Table
                </label>
                <span className="text-xs text-slate-500">
                  {exactTableCount} Tables Available ({effectivePersonsPerTable} seats/table)
                </span>
              </div>
              <select
                id="refill-table"
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                required
                className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 cursor-pointer"
              >
                <option value="">Choose a table...</option>
                {dynamicTables.map((t) => (
                  <option key={t.id} value={t.label}>
                    {t.label} ({t.guestCount} seats — {t.status})
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
                  className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 cursor-pointer"
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
              disabled={dynamicTables.length === 0 || isDispatchingRefill}
              className="w-full h-14 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-base sm:text-lg font-semibold inline-flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-5 h-5" />
              Dispatch Refill to Kitchen
            </button>
          </form>

          {/* Right: Active Requests List */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
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
  const assignedEvents = bookings.map(
    (b) => `${b.hallName} — ${b.customerName || b.bookingRef} (${b.date})`
  );

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
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs"
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
                className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 cursor-pointer"
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
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
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
