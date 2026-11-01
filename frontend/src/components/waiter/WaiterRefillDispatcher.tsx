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
  Shield,
  Layers,
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
      const [fetchedBookings, fetchedTickets] = await Promise.all([
        bookingsApi.list(),
        kdsApi.list(),
      ]);
      setBookings(fetchedBookings);
      setTickets(fetchedTickets);

      if (!selectedBookingRef && fetchedBookings.length > 0) {
        setSelectedBookingRef(fetchedBookings[0].bookingRef);
      }
    } catch (err) {
      console.error('Failed to load refill dispatcher data:', err);
      if (!isPolling) showToast('Error loading live tickets.');
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-poll active tickets every 4 seconds to reflect chef prep status
    const pollInterval = setInterval(() => {
      loadData(true);
    }, 4000);

    const clockInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(clockInterval);
    };
  }, [selectedBookingRef]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selectedBooking = useMemo(() => {
    return bookings.find((b) => b.bookingRef === selectedBookingRef) || null;
  }, [bookings, selectedBookingRef]);

  // Active tickets for this event (excluding completed)
  const activeEventTickets = useMemo(() => {
    return tickets.filter(
      (t) =>
        t.status !== 'Completed' &&
        t.status !== 'Cancelled' &&
        (!selectedBookingRef || t.eventRef === selectedBookingRef)
    );
  }, [tickets, selectedBookingRef]);

  // Check if a dish is currently active in the kitchen
  const getActiveDishStatus = (dishName: string) => {
    const active = activeEventTickets.find(
      (t) => t.dishName.toLowerCase().trim() === dishName.toLowerCase().trim()
    );
    return active || null;
  };

  // Instant 1-Touch Refill Dispatch
  const handleInstantDispatch = async (
    dish: BuffetDishItem,
    priority: 'Normal' | 'Urgent' | 'Critical' = 'Urgent'
  ) => {
    if (!selectedBooking) return;
    try {
      const created = await kdsApi.create({
        eventRef: selectedBooking.bookingRef,
        hallName: selectedBooking.hallName,
        dishName: dish.name,
        quantity: 1,
        portionSize: dish.defaultPortion,
        priority,
        station: dish.station,
        requestedBy: 'Floor Steward',
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
    <div className="w-full max-w-7xl mx-auto space-y-6 select-none animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-600 text-slate-950 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-amber-400 font-extrabold text-sm animate-slide-up">
          <Sparkles className="w-5 h-5 text-slate-950 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Tablet Header Bar */}
      <div className="w-full bg-slate-900/90 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/15 via-rose-500/10 to-transparent rounded-full blur-3xl -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Flame className="w-3.5 h-3.5" />
                <span>Phase 5 — Task 5.2: Instant Dish Refill Dispatcher</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                <span>1-TAP DISPATCH READY</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Instant Buffet Dish Refill Dispatcher</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Tap any buffet dish to alert the kitchen instantly with an audible chime. Monitor live cooking progress and confirm runner delivery.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => onNavigateToTab?.('waiter-tables')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <span>Back to Table Map</span>
            </button>

            <button
              onClick={() => onNavigateToTab?.('waiter-overtime')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 transition cursor-pointer"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Overtime Request</span>
            </button>

            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-black shadow-lg shadow-orange-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Special Custom Order</span>
            </button>
          </div>
        </div>

        {/* Event Selector & Live Queue Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Target Banquet Event:</span>
            <select
              value={selectedBookingRef}
              onChange={(e) => setSelectedBookingRef(e.target.value)}
              className="w-full bg-transparent font-bold text-white focus:outline-none cursor-pointer truncate"
            >
              {bookings.map((b) => (
                <option key={b.bookingRef} value={b.bookingRef} className="bg-slate-900 text-white">
                  [{b.bookingRef}] {b.customerName} ({b.hallName})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Banquet Hall:</span>
            <span className="font-bold text-white text-sm flex items-center gap-1.5 truncate">
              <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              {selectedBooking?.hallName || 'Grand Crystal Ballroom'}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Operational Stage:</span>
            <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {selectedBooking?.operationalStatus || 'Food Service Active'}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Active Refill Tickets:</span>
            <span className="font-bold text-amber-300 text-sm flex items-center gap-1.5 font-mono">
              <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              {activeEventTickets.length} in Kitchen Pipeline
            </span>
          </div>
        </div>
      </div>

      {/* Live Pipeline Tracker Ribbon (If Any Active Tickets) */}
      {activeEventTickets.length > 0 && (
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-amber-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Live Kitchen Preparation Tracker ({activeEventTickets.length} Active Dishes)
              </h2>
            </div>
            <span className="text-xs text-amber-300 font-semibold">
              Tap "Confirm Delivered" when runner places tray on buffet table
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeEventTickets.map((t) => {
              const elapsed = getElapsedMinutes(t.createdAt);
              const statusBadge = {
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
              }[t.status] || {
                bg: 'bg-slate-800 text-slate-300',
                label: t.status,
              };

              return (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        {t.ticketNumber}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{elapsed}m ago</span>
                      </span>
                    </div>

                    <h3 className="font-extrabold text-white text-sm leading-tight">
                      {t.dishName}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">{t.portionSize}</p>

                    <div className="mt-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${statusBadge.bg}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-700/80">
                    <button
                      type="button"
                      onClick={() => handleConfirmDelivered(t.id)}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Delivered to Buffet</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Station Category Switcher */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                categoryFilter === cat
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Showing {filteredDishes.length} Standard Buffet Items
        </span>
      </div>

      {/* Giant Touch Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDishes.map((dish) => {
          const activeTicket = getActiveDishStatus(dish.name);
          const isPending = !!activeTicket;

          return (
            <div
              key={dish.id}
              className={`rounded-3xl p-5 border transition-all shadow-md flex flex-col justify-between ${
                isPending
                  ? 'bg-slate-900/90 border-amber-500/70 shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-2xl">{dish.icon}</span>
                  <span className="text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                    {dish.station}
                  </span>
                </div>

                {/* Dish Name */}
                <h3 className="text-lg font-black text-white mt-3 leading-snug">
                  {dish.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Standard Refill: <strong className="text-slate-200">{dish.defaultPortion}</strong>
                </p>

                {/* Active Kitchen Pipeline Pill */}
                {isPending && (
                  <div className="mt-3.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>{activeTicket.status}</span>
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {getElapsedMinutes(activeTicket.createdAt)}m ago
                    </span>
                  </div>
                )}
              </div>

              {/* Big Touch Urgency Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
                <span className="text-[11px] text-slate-400 block font-semibold">
                  Tap Urgency to Alert Kitchen:
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInstantDispatch(dish, 'Urgent')}
                    className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5 text-slate-950" />
                    <span>Buffet Low (10%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInstantDispatch(dish, 'Critical')}
                    className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Empty (Critical)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleInstantDispatch(dish, 'Normal')}
                  className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] font-semibold transition"
                >
                  Standard 25% Routine Refill
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Special Custom Item Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsCustomModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Call Custom Kitchen Order</h3>
                <p className="text-xs text-slate-400">Special table requests or unlisted dishes</p>
              </div>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Item Description *
                </label>
                <input
                  type="text"
                  required
                  value={customForm.dishName}
                  onChange={(e) => setCustomForm({ ...customForm, dishName: e.target.value })}
                  placeholder="e.g. Extra spicy karahi for VIP Table 1, Diet Pepsi cans..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Portion / Quantity
                  </label>
                  <input
                    type="text"
                    value={customForm.portionSize}
                    onChange={(e) => setCustomForm({ ...customForm, portionSize: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kitchen Station
                  </label>
                  <select
                    value={customForm.station}
                    onChange={(e) => setCustomForm({ ...customForm, station: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Hot Buffet Line 1">Hot Buffet Line 1</option>
                    <option value="Live BBQ & Karahi">Live BBQ & Karahi</option>
                    <option value="Tandoor & Breads">Tandoor & Breads</option>
                    <option value="Desserts & Beverages">Desserts & Beverages</option>
                    <option value="Salad & Cold Station">Salad & Cold Station</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Urgency Level
                </label>
                <select
                  value={customForm.priority}
                  onChange={(e) =>
                    setCustomForm({
                      ...customForm,
                      priority: e.target.value as 'Normal' | 'Urgent' | 'Critical',
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Normal">Normal Request</option>
                  <option value="Urgent">Urgent Floor Call</option>
                  <option value="Critical">Critical VIP Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Special Steward Notes
                </label>
                <textarea
                  rows={2}
                  value={customForm.notes}
                  onChange={(e) => setCustomForm({ ...customForm, notes: e.target.value })}
                  placeholder="e.g. Host requested personally, serve immediately..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition"
                >
                  Dispatch to Kitchen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
