import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Coffee,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  Building2,
  Users,
  UtensilsCrossed,
  Sparkles,
  Plus,
  X,
  Check,
  RotateCcw,
  Volume2,
  ChevronRight,
  ChevronDown,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Booking } from '../../types';
import {
  bookingsApi,
  kdsApi,
  KitchenOrderTicketItem,
} from '../../api/client';
import { formatTo12Hour } from '../../utils/timeFormat';

interface BuffetDishItem {
  id: string;
  name: string;
  category: string;
  defaultPortion: string;
  station: string;
  icon: string;
}

const STANDARD_BUFFET_DISHES: BuffetDishItem[] = [
  {
    id: 'dish-1',
    name: 'Mutton Dum Biryani (Zafrani)',
    category: 'Rice & Main Course',
    defaultPortion: '2 Chafing Trays (80 portions)',
    station: 'Hot Buffet Line 1',
    icon: '🍚',
  },
  {
    id: 'dish-2',
    name: 'Chicken White Karahi (Desi Ghee)',
    category: 'Karahi & Curries',
    defaultPortion: '1 Large Handi (40 portions)',
    station: 'Live BBQ & Karahi',
    icon: '🥘',
  },
  {
    id: 'dish-3',
    name: 'Fresh Roghnai Naan & Sesame Kulcha',
    category: 'Tandoor & Breads',
    defaultPortion: '100 Fresh Pieces',
    station: 'Tandoor & Breads',
    icon: '🥖',
  },
  {
    id: 'dish-4',
    name: 'Chicken Reshmi Seekh Kabab',
    category: 'Live BBQ & Grills',
    defaultPortion: '60 Skewers Hot',
    station: 'Live BBQ & Karahi',
    icon: '🍢',
  },
  {
    id: 'dish-5',
    name: 'Shahi Pistachio Badam Kheer',
    category: 'Desserts & Chai',
    defaultPortion: '2 Large Platters',
    station: 'Desserts & Beverages',
    icon: '🍨',
  },
  {
    id: 'dish-6',
    name: 'Hot Gulab Jamun Warmers',
    category: 'Desserts & Chai',
    defaultPortion: '80 Pieces Hot in Syrup',
    station: 'Desserts & Beverages',
    icon: '🍯',
  },
  {
    id: 'dish-7',
    name: 'Fresh Salad, Mint & Zeera Raita',
    category: 'Salads & Raita',
    defaultPortion: '4 Large Bowls',
    station: 'Salad & Cold Station',
    icon: '🥗',
  },
  {
    id: 'dish-8',
    name: 'Chilled Mineral Water & Soft Drinks',
    category: 'Water & Beverages',
    defaultPortion: '6 Crates Chilled',
    station: 'Desserts & Beverages',
    icon: '🥤',
  },
  {
    id: 'dish-9',
    name: 'Crispy Lahori Fish Fry',
    category: 'Live BBQ & Grills',
    defaultPortion: '50 Fillets with Tartar Sauce',
    station: 'Live BBQ & Karahi',
    icon: '🐟',
  },
  {
    id: 'dish-10',
    name: 'Kashmiri Chai / Pink Tea with Dry Fruits',
    category: 'Desserts & Chai',
    defaultPortion: '2 Samovars (120 Cups)',
    station: 'Desserts & Beverages',
    icon: '☕',
  },
];

interface WaiterRefillDispatcherProps {
  onNavigateToTab?: (tabId: string) => void;
}

export const WaiterRefillDispatcher: React.FC<WaiterRefillDispatcherProps> = ({
  onNavigateToTab,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingRef, setSelectedBookingRef] = useState<string>('');
  const [tickets, setTickets] = useState<KitchenOrderTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom refill modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState({
    dishName: '',
    portionSize: '1 Chafing Tray',
    station: 'Hot Buffet Line 1',
    priority: 'Urgent' as 'Normal' | 'Urgent' | 'Critical',
    notes: '',
  });

  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  const loadData = async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      const [bookingsData, ticketsData] = await Promise.all([
        bookingsApi.list(),
        kdsApi.list(),
      ]);
      setBookings(bookingsData);
      setTickets(ticketsData);

      if (!selectedBookingRef && bookingsData.length > 0) {
        setSelectedBookingRef(bookingsData[0].bookingRef);
      }
    } catch (err) {
      console.error('Failed to load waiter refill data:', err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Polling every 4 seconds to sync status with kitchen KDS
    const interval = setInterval(() => {
      loadData(true);
      setCurrentTime(Date.now());
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedBookingRef]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedBooking = useMemo(() => {
    return bookings.find((b) => b.bookingRef === selectedBookingRef) || bookings[0];
  }, [bookings, selectedBookingRef]);

  // Active tickets for this event
  const activeEventTickets = useMemo(() => {
    if (!selectedBooking) return [];
    return tickets.filter(
      (t) =>
        t.eventRef === selectedBooking.bookingRef &&
        t.status !== 'Completed' &&
        t.status !== 'Cancelled'
    );
  }, [tickets, selectedBooking]);

  // Check if a dish is currently in kitchen queue
  const getActiveDishStatus = (dishName: string) => {
    return activeEventTickets.find(
      (t) => t.dishName.toLowerCase() === dishName.toLowerCase()
    );
  };

  // Instant dispatch button handler
  const handleInstantDispatch = async (dish: BuffetDishItem, priority: 'Normal' | 'Urgent' | 'Critical') => {
    if (!selectedBooking) {
      showToast('Select an active banquet event first.');
      return;
    }

    try {
      const created = await kdsApi.create({
        eventRef: selectedBooking.bookingRef,
        hallName: selectedBooking.hallName,
        dishName: dish.name,
        quantity: 1,
        portionSize: dish.defaultPortion,
        priority: priority,
        station: dish.station,
        requestedBy: 'Lead Floor Waiter',
        notes: `Urgent floor refill requested for ${dish.station}`,
      });

      setTickets((prev) => [created, ...prev]);
      showToast(`🔔 Dispatched "${dish.name}" to Kitchen KDS!`);
    } catch (err) {
      console.error('Failed to dispatch refill:', err);
      showToast('Error dispatching refill order.');
    }
  };

  // Confirm delivery on buffet line
  const handleConfirmDelivered = async (ticketId: string) => {
    try {
      const updated = await kdsApi.advanceStatus(ticketId, { status: 'Completed' });
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showToast(`Refill delivered and confirmed on buffet line!`);
    } catch (err) {
      console.error('Failed to complete ticket:', err);
      showToast('Failed to update ticket.');
    }
  };

  // Custom refill submit
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      const created = await kdsApi.create({
        eventRef: selectedBooking.bookingRef,
        hallName: selectedBooking.hallName,
        dishName: customForm.dishName,
        quantity: 1,
        portionSize: customForm.portionSize,
        priority: customForm.priority,
        station: customForm.station,
        requestedBy: 'Floor Steward',
        notes: customForm.notes,
      });

      setTickets((prev) => [created, ...prev]);
      setIsCustomModalOpen(false);
      setCustomForm({
        dishName: '',
        portionSize: '1 Chafing Tray',
        station: 'Hot Buffet Line 1',
        priority: 'Urgent',
        notes: '',
      });
      showToast(`Custom order "${created.dishName}" dispatched to kitchen!`);
    } catch (err) {
      console.error('Failed to create custom order:', err);
      showToast('Error sending order.');
    }
  };

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return STANDARD_BUFFET_DISHES.filter((d) => {
      if (categoryFilter !== 'All' && d.category !== categoryFilter) return false;
      return true;
    });
  }, [categoryFilter]);

  // Elapsed minutes helper
  const getElapsedMinutes = (dateString?: string) => {
    if (!dateString) return 0;
    const t = new Date(dateString).getTime();
    if (isNaN(t)) return 0;
    return Math.max(0, Math.floor((currentTime - t) / 60000));
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 select-none animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-amber-300 font-extrabold text-sm animate-bounce shadow-black/40">
          <Sparkles className="w-5 h-5 text-slate-950 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Tablet Header & Control Panel */}
      <div className="w-full bg-slate-900/80 border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40 backdrop-blur-xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/15 via-rose-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/4 w-80 h-80 bg-gradient-to-tr from-teal-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                <span>1-TAP DISPATCH READY</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-50 tracking-tight flex items-center gap-3">
              <span>Instant Buffet Dish Refill Dispatcher</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Tap any buffet dish to alert the kitchen immediately with an audible KDS chime. Monitor culinary preparation in real-time and confirm floor delivery.
            </p>
          </div>

          {/* Sleek Action Buttons Header */}
          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button
              onClick={() => onNavigateToTab?.('waiter-tables')}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 hover:border-slate-600 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all hover:scale-105 cursor-pointer backdrop-blur-md shadow-md"
            >
              <span>Back to Table Map</span>
            </button>

            <button
              onClick={() => onNavigateToTab?.('waiter-overtime')}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs sm:text-sm transition-all hover:scale-105 cursor-pointer backdrop-blur-md shadow-lg shadow-amber-500/10"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Overtime Request</span>
            </button>

            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Special Custom Order</span>
            </button>
          </div>
        </div>

        {/* Sleek Redesigned Control Panel Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-700/50">
          {/* Target Event Dropdown Input */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 shadow-md backdrop-blur-sm transition-all focus-within:border-amber-500/60 hover:border-slate-600">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
              Target Banquet Event
            </span>
            <div className="relative">
              <select
                value={selectedBookingRef}
                onChange={(e) => setSelectedBookingRef(e.target.value)}
                className="w-full bg-transparent font-bold text-slate-100 text-sm focus:outline-none cursor-pointer truncate pr-6 appearance-none"
              >
                {bookings.map((b) => (
                  <option key={b.bookingRef} value={b.bookingRef} className="bg-slate-900 text-slate-100">
                    [{b.bookingRef}] {b.customerName} ({b.hallName})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Banquet Hall Card */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 shadow-md backdrop-blur-sm">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
              Banquet Hall
            </span>
            <span className="font-bold text-slate-100 text-sm flex items-center gap-2 truncate">
              <Building2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="truncate">{selectedBooking?.hallName || 'Grand Crystal Ballroom'}</span>
            </span>
          </div>

          {/* Operational Stage Card */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 shadow-md backdrop-blur-sm">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
              Operational Stage
            </span>
            <span className="font-bold text-emerald-400 text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">{selectedBooking?.operationalStatus || 'Food Service Active'}</span>
            </span>
          </div>

          {/* Active Refill Tickets Status */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 shadow-md backdrop-blur-sm">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
              Active Refill Tickets
            </span>
            <span className="font-black text-amber-300 text-sm flex items-center gap-2 font-mono">
              <Flame className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{activeEventTickets.length} in Kitchen Pipeline</span>
            </span>
          </div>
        </div>
      </div>

      {/* Live Pipeline Tracker Ribbon (When Tickets Active) */}
      {activeEventTickets.length > 0 && (
        <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-amber-500/30 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Flame className="w-4 h-4 animate-pulse" />
              </div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Live Kitchen Preparation Tracker ({activeEventTickets.length} Active Dishes)
              </h2>
            </div>
            <span className="text-xs text-amber-300 font-semibold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Tap "Confirm Delivered" when runner places tray on buffet table
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEventTickets.map((t) => {
              const elapsed = getElapsedMinutes(t.createdAt);
              const statusMap: Record<string, { bg: string; label: string }> = {
                'Refill Requested': {
                  bg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
                  label: '🟡 Refill Called (Waiting for Chef)',
                },
                'In Preparation': {
                  bg: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
                  label: `🟠 Chef Preparing ${t.chefAssigned ? `(${t.chefAssigned})` : ''}`,
                },
                'Ready for Pickup': {
                  bg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
                  label: '🟢 Plated at Kitchen Pass',
                },
                'Dispatched to Hall': {
                  bg: 'bg-sky-500/20 border-sky-500/40 text-sky-300',
                  label: '🔵 Runner En Route to Buffet',
                },
                'Completed': {
                  bg: 'bg-teal-500/20 border-teal-500/40 text-teal-300',
                  label: '✅ Delivered & Served',
                },
                'Cancelled': {
                  bg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
                  label: '❌ Ticket Cancelled',
                },
              };
              const statusBadge = statusMap[t.status] || {
                bg: 'bg-slate-800 text-slate-300',
                label: t.status,
              };

              return (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-lg flex flex-col justify-between hover:border-slate-600 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        {t.ticketNumber}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{elapsed}m ago</span>
                      </span>
                    </div>

                    <h3 className="font-extrabold text-slate-50 text-base leading-tight">
                      {t.dishName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{t.portionSize}</p>

                    <div className="mt-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${statusBadge.bg}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleConfirmDelivered(t.id)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Confirm Delivered to Buffet</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Station Category Switcher Pills */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-black/20">
        <div className="flex flex-wrap items-center gap-2">
          {[
            'All',
            'Rice & Main Course',
            'Karahi & Curries',
            'Tandoor & Breads',
            'Live BBQ & Grills',
            'Desserts & Chai',
            'Salads & Raita',
            'Water & Beverages',
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20 scale-105'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-700/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-medium px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-700/40">
          Showing {filteredDishes.length} Standard Dishes
        </span>
      </div>

      {/* Modern High-Contrast Buffet Dishes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDishes.map((dish) => {
          const activeTicket = getActiveDishStatus(dish.name);
          const isPending = !!activeTicket;

          return (
            <div
              key={dish.id}
              className={`rounded-xl p-4 border transition-colors shadow-lg flex flex-col justify-between group ${
                isPending
                  ? 'bg-slate-800 border-amber-500/60 ring-1 ring-amber-500/30'
                  : 'bg-slate-800 border-slate-700 hover:border-teal-500/50'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
                    {dish.icon}
                  </div>
                  <span className="text-xs font-semibold text-slate-400 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700">
                    {dish.station}
                  </span>
                </div>

                {/* Dish Name */}
                <h3 className="text-lg font-bold text-white mt-3 leading-snug">
                  {dish.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Standard Refill: <strong className="text-slate-200">{dish.defaultPortion}</strong>
                </p>

                {/* Active Kitchen Pipeline Pill */}
                {isPending && (
                  <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-bold flex items-center justify-between shadow-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      <span>{activeTicket.status}</span>
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {getElapsedMinutes(activeTicket.createdAt)}m ago
                    </span>
                  </div>
                )}
              </div>

              {/* High-Visibility Touch Urgency Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-700 space-y-2.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold font-mono">
                  Dispatch Refill:
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInstantDispatch(dish, 'Urgent')}
                    className="bg-teal-600 hover:bg-teal-500 text-white rounded-lg px-3 py-2 font-medium text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Flame className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Low (10%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInstantDispatch(dish, 'Critical')}
                    className="py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Empty (Critical)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleInstantDispatch(dish, 'Normal')}
                  className="w-full py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
                >
                  Standard 25% Refill
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Special Custom Item Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/60 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative shadow-black/80">
            <button
              onClick={() => setIsCustomModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-50 tracking-tight">Call Custom Kitchen Order</h3>
                <p className="text-xs text-slate-400 mt-0.5">Special table requests or unlisted dishes</p>
              </div>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono tracking-wider">
                  Item Description *
                </label>
                <input
                  type="text"
                  required
                  value={customForm.dishName}
                  onChange={(e) => setCustomForm({ ...customForm, dishName: e.target.value })}
                  placeholder="e.g. Extra spicy karahi for VIP Table 1, Diet Pepsi cans..."
                  className="w-full bg-slate-800/80 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none transition-all placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono tracking-wider">
                    Portion / Batch Size
                  </label>
                  <input
                    type="text"
                    value={customForm.portionSize}
                    onChange={(e) => setCustomForm({ ...customForm, portionSize: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono tracking-wider">
                    Kitchen Station
                  </label>
                  <select
                    value={customForm.station}
                    onChange={(e) => setCustomForm({ ...customForm, station: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Hot Buffet Line 1">Hot Buffet Line 1</option>
                    <option value="Live BBQ & Karahi">Live BBQ & Karahi</option>
                    <option value="Tandoor & Breads">Tandoor & Breads</option>
                    <option value="Salad & Cold Station">Salad & Cold Station</option>
                    <option value="Desserts & Beverages">Desserts & Beverages</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono tracking-wider">
                  Ticket Urgency
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Normal', 'Urgent', 'Critical'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCustomForm({ ...customForm, priority: p })}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        customForm.priority === p
                          ? p === 'Critical'
                            ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                            : p === 'Urgent'
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                            : 'bg-teal-500 text-slate-950 border-teal-400 shadow-md shadow-teal-500/30'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono tracking-wider">
                  Special Kitchen Notes
                </label>
                <textarea
                  rows={2}
                  value={customForm.notes}
                  onChange={(e) => setCustomForm({ ...customForm, notes: e.target.value })}
                  placeholder="e.g. Guest has severe peanut allergy, plate on silver platter..."
                  className="w-full bg-slate-800/80 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none transition-all placeholder:text-slate-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-orange-500/25 transition cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Ticket to Kitchen KDS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
