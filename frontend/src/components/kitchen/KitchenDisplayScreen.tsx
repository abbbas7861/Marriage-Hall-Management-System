import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChefHat,
  Bell,
  Volume2,
  VolumeX,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Building2,
  Sparkles,
  Send,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  User,
  Coffee,
  UtensilsCrossed,
} from 'lucide-react';
import { Booking } from '../../types';
import { bookingsApi, kdsApi, KitchenOrderTicketItem } from '../../api/client';
import { formatTo12Hour } from '../../utils/timeFormat';

// Popular banquet dish presets for quick refill creation
const QUICK_DISH_PRESETS = [
  { name: 'Mutton Dum Biryani (Zafrani)', portion: '2 Chafing Trays (80 portions)', station: 'Hot Buffet Line 1' },
  { name: 'Chicken White Karahi (Desi Ghee)', portion: '1 Large Handi (40 portions)', station: 'Live BBQ & Karahi' },
  { name: 'Fresh Roghnai Naan & Kulcha', portion: '100 Fresh Pieces', station: 'Tandoor & Breads' },
  { name: 'Chicken Reshmi Seekh Kabab', portion: '60 Skewers Hot', station: 'Live BBQ & Karahi' },
  { name: 'Shahi Kheer & Pistachio Badam', portion: '2 Large Platters', station: 'Desserts & Beverages' },
  { name: 'Fresh Salad & Zeera Raita', portion: '4 Bowls Refill', station: 'Salad & Cold Station' },
  { name: 'Mineral Water & Soft Drinks', portion: '6 Crates Chilled', station: 'Desserts & Beverages' },
];

export const KitchenDisplayScreen: React.FC = () => {
  const [tickets, setTickets] = useState<KitchenOrderTicketItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHallFilter, setSelectedHallFilter] = useState<string>('All');
  const [selectedStationFilter, setSelectedStationFilter] = useState<string>('All');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileLaneFilter, setMobileLaneFilter] = useState<'All' | 'Requested' | 'Prep' | 'Ready' | 'Dispatched'>('All');

  // New ticket modal
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    eventRef: '',
    hallName: 'Grand Crystal Ballroom',
    dishName: 'Mutton Dum Biryani (Zafrani)',
    quantity: 1,
    portionSize: '1 Chafing Tray (40 portions)',
    priority: 'Urgent' as 'Normal' | 'Urgent' | 'Critical',
    station: 'Hot Buffet Line 1',
    requestedBy: 'Floor Captain',
    chefAssigned: '',
    notes: '',
  });

  // Clock tick for live elapsed timer
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const prevTicketCountRef = useRef<number>(0);

  // Web Audio API Chime synthesizer
  const playKitchenChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Note 1: High tone (880 Hz - A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.6);

      // Note 2: Higher chime (1175 Hz - D6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1175, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.9);
    } catch (err) {
      console.warn('Audio chime playback error:', err);
    }
  };

  const loadData = async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      const [fetchedTickets, fetchedBookings] = await Promise.all([
        kdsApi.list(),
        bookingsApi.list(),
      ]);

      // If new tickets arrived since last fetch, chime!
      if (prevTicketCountRef.current > 0 && fetchedTickets.length > prevTicketCountRef.current) {
        playKitchenChime();
        showToast('🔔 New urgent dish refill order received from hall!');
      }
      prevTicketCountRef.current = fetchedTickets.length;

      setTickets(fetchedTickets);
      setBookings(fetchedBookings);

      if (fetchedBookings.length > 0 && !ticketForm.eventRef) {
        setTicketForm((prev) => ({
          ...prev,
          eventRef: fetchedBookings[0].bookingRef,
          hallName: fetchedBookings[0].hallName,
        }));
      }
    } catch (err) {
      console.error('Failed to load KDS data:', err);
      if (!isPolling) showToast('Error loading live tickets');
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-refresh poll every 5 seconds for live kitchen responsiveness
    const pollInterval = setInterval(() => {
      loadData(true);
    }, 5000);

    // Live clock timer update every second
    const timerInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [soundEnabled]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Status transitions
  const handleAdvanceStatus = async (ticket: KitchenOrderTicketItem) => {
    try {
      const updated = await kdsApi.advanceStatus(ticket.id);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showToast(`Ticket ${ticket.ticketNumber} advanced to "${updated.status}"`);
      playKitchenChime();
    } catch (err) {
      console.error('Failed to advance status:', err);
      showToast('Failed to advance ticket status.');
    }
  };

  // Create new ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await kdsApi.create(ticketForm);
      setTickets((prev) => [created, ...prev]);
      prevTicketCountRef.current += 1;
      setIsNewTicketOpen(false);
      showToast(`Refill order ${created.ticketNumber} created!`);
      playKitchenChime();
    } catch (err) {
      console.error('Failed to create ticket:', err);
      showToast('Failed to create order ticket.');
    }
  };

  // Quick preset loader
  const handleApplyPreset = (preset: typeof QUICK_DISH_PRESETS[0]) => {
    setTicketForm((prev) => ({
      ...prev,
      dishName: preset.name,
      portionSize: preset.portion,
      station: preset.station,
    }));
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedHallFilter !== 'All' && t.hallName !== selectedHallFilter) return false;
      if (selectedStationFilter !== 'All' && t.station !== selectedStationFilter) return false;
      return true;
    });
  }, [tickets, selectedHallFilter, selectedStationFilter]);

  // Grouped status lanes
  const laneRequested = useMemo(
    () => filteredTickets.filter((t) => t.status === 'Refill Requested'),
    [filteredTickets]
  );
  const laneInPrep = useMemo(
    () => filteredTickets.filter((t) => t.status === 'In Preparation'),
    [filteredTickets]
  );
  const laneReady = useMemo(
    () => filteredTickets.filter((t) => t.status === 'Ready for Pickup'),
    [filteredTickets]
  );
  const laneDispatched = useMemo(
    () => filteredTickets.filter((t) => t.status === 'Dispatched to Hall'),
    [filteredTickets]
  );

  // Format elapsed time string
  const getElapsedMinutes = (dateString?: string) => {
    if (!dateString) return 0;
    const createdTime = new Date(dateString).getTime();
    if (isNaN(createdTime)) return 0;
    const diffMs = currentTime - createdTime;
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400/40 animate-slide-up">
          <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / KDS Control Header */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 via-emerald-500/10 to-transparent rounded-full blur-3xl -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
              <ChefHat className="w-3.5 h-3.5" />
              <span>Phase 4 — Task 4.1: Kitchen Display Screen (KDS)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Kitchen Display Screen (KDS)</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold uppercase tracking-wider animate-pulse">
                <Flame className="w-3.5 h-3.5" />
                LIVE QUEUE
              </span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              High-contrast touch board receiving instant dish refill orders from floor stewards. Color-coded prep states ensure hot buffet replenishment without delay.
            </p>
          </div>

          {/* Action buttons & Audio Chime Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Audio Chime Bell */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playKitchenChime();
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition shadow-sm ${
                soundEnabled
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Audio Chime: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" />
                  <span>Audio Chime: MUTED</span>
                </>
              )}
            </button>

            {/* Test bell */}
            <button
              onClick={playKitchenChime}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
              title="Test Kitchen Service Chime"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Bell</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => loadData(false)}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 text-sky-400 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Add New Ticket Button */}
            <button
              onClick={() => setIsNewTicketOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Dispatch Refill Order</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Hall selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedHallFilter}
                onChange={(e) => setSelectedHallFilter(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-slate-900 text-white">All Halls / Venues</option>
                <option value="Grand Crystal Ballroom" className="bg-slate-900 text-white">Grand Crystal Ballroom</option>
                <option value="Royal Emerald Hall" className="bg-slate-900 text-white">Royal Emerald Hall</option>
                <option value="Sapphire Banquet" className="bg-slate-900 text-white">Sapphire Banquet</option>
                <option value="Imperial Courtyard Lawn" className="bg-slate-900 text-white">Imperial Courtyard Lawn</option>
              </select>
            </div>

            {/* Station selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <UtensilsCrossed className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedStationFilter}
                onChange={(e) => setSelectedStationFilter(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-slate-900 text-white">All Kitchen Stations</option>
                <option value="Hot Buffet Line 1" className="bg-slate-900 text-white">Hot Buffet Line 1</option>
                <option value="Hot Buffet Line 2" className="bg-slate-900 text-white">Hot Buffet Line 2</option>
                <option value="Live BBQ & Karahi" className="bg-slate-900 text-white">Live BBQ & Karahi</option>
                <option value="Tandoor & Breads" className="bg-slate-900 text-white">Tandoor & Breads</option>
                <option value="Desserts & Beverages" className="bg-slate-900 text-white">Desserts & Beverages</option>
                <option value="Salad & Cold Station" className="bg-slate-900 text-white">Salad & Cold Station</option>
              </select>
            </div>
          </div>

          {/* Quick counts summary */}
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <strong className="text-white">{laneRequested.length}</strong> New Refills
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <strong className="text-white">{laneInPrep.length}</strong> In Prep
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <strong className="text-white">{laneReady.length}</strong> Ready at Pass
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Lane Switcher Tabs (Phones & Small Screens) */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {[
          { key: 'All', label: `All (${filteredTickets.length})` },
          { key: 'Requested', label: `1. Refills (${laneRequested.length})` },
          { key: 'Prep', label: `2. In Prep (${laneInPrep.length})` },
          { key: 'Ready', label: `3. Ready (${laneReady.length})` },
          { key: 'Dispatched', label: `4. Out (${laneDispatched.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMobileLaneFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
              mobileLaneFilter === tab.key
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4-Lane High-Contrast Touch KDS Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Lane 1: 🟡 Refill Requested (New & Urgent) */}
        <div className={`bg-slate-900/60 backdrop-blur-md rounded-2xl border border-amber-500/30 flex flex-col min-h-[580px] ${
          mobileLaneFilter !== 'All' && mobileLaneFilter !== 'Requested' ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="p-3.5 bg-amber-500/10 border-b border-amber-500/20 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <h2 className="font-black text-amber-300 text-sm tracking-wide uppercase">
                1. Refill Requested
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
              {laneRequested.length}
            </span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[700px]">
            {laneRequested.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No pending refill calls. Floor buffets currently fully stocked.
              </div>
            ) : (
              laneRequested.map((ticket) => {
                const elapsedMin = getElapsedMinutes(ticket.createdAt);
                const isOverdue = elapsedMin >= 10;

                return (
                  <div
                    key={ticket.id}
                    className={`bg-slate-800/90 rounded-xl p-4 border transition-all shadow-md relative ${
                      ticket.priority === 'Critical'
                        ? 'border-rose-500/80 shadow-rose-500/10 ring-1 ring-rose-500/30'
                        : isOverdue
                        ? 'border-amber-400 shadow-amber-500/10'
                        : 'border-slate-700/80 hover:border-amber-500/50'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {ticket.ticketNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {ticket.priority === 'Critical' && (
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-500 text-white animate-pulse">
                            CRITICAL
                          </span>
                        )}
                        <span
                          className={`text-xs font-mono font-bold flex items-center gap-1 ${
                            isOverdue ? 'text-rose-400 font-extrabold' : 'text-slate-400'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{elapsedMin}m ago</span>
                        </span>
                      </div>
                    </div>

                    {/* Dish & Quantity */}
                    <h3 className="text-base font-extrabold text-white leading-tight">
                      {ticket.dishName}
                    </h3>
                    <p className="text-xs text-amber-200/90 font-medium mt-1">
                      Qty: {ticket.portionSize}
                    </p>

                    {/* Location & Requester */}
                    <div className="mt-3 space-y-1 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="text-slate-300 font-semibold truncate">{ticket.hallName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="text-slate-400">{ticket.station}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <User className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>Called by {ticket.requestedBy}</span>
                      </div>
                    </div>

                    {ticket.notes && (
                      <p className="mt-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-amber-300/90 italic">
                        "{ticket.notes}"
                      </p>
                    )}

                    {/* Touch Action Button */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-700/80">
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(ticket)}
                        className="w-full py-2.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Flame className="w-4 h-4 text-slate-950" />
                        <span>Claim & Start Cooking</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Lane 2: 🟠 In Preparation (Active on Stoves/Tandoors) */}
        <div className={`bg-slate-900/60 backdrop-blur-md rounded-2xl border border-orange-500/30 flex flex-col min-h-[580px] ${
          mobileLaneFilter !== 'All' && mobileLaneFilter !== 'Prep' ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="p-3.5 bg-orange-500/10 border-b border-orange-500/20 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
              <h2 className="font-black text-orange-300 text-sm tracking-wide uppercase">
                2. In Preparation
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono text-xs font-bold border border-orange-500/30">
              {laneInPrep.length}
            </span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[700px]">
            {laneInPrep.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No dishes currently being cooked. Ready to take next refill.
              </div>
            ) : (
              laneInPrep.map((ticket) => {
                const elapsedMin = getElapsedMinutes(ticket.inPrepAt || ticket.createdAt);

                return (
                  <div
                    key={ticket.id}
                    className="bg-slate-800/90 rounded-xl p-4 border border-orange-500/40 transition-all shadow-md"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
                      <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-xs font-mono font-bold text-orange-300 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        <span>Cooking: {elapsedMin}m</span>
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-white leading-tight">
                      {ticket.dishName}
                    </h3>
                    <p className="text-xs text-orange-200/90 font-medium mt-1">
                      Qty: {ticket.portionSize}
                    </p>

                    <div className="mt-3 space-y-1 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="text-slate-300 font-semibold truncate">{ticket.hallName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="text-slate-400">{ticket.station}</span>
                      </div>
                      {ticket.chefAssigned && (
                        <div className="flex items-center gap-1.5 text-[11px] text-orange-300">
                          <ChefHat className="w-3 h-3 text-orange-400 shrink-0" />
                          <span>Chef: {ticket.chefAssigned}</span>
                        </div>
                      )}
                    </div>

                    {/* Touch Action Button */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-700/80">
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(ticket)}
                        className="w-full py-2.5 px-3 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        <span>Ready at Pass Counter</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Lane 3: 🟢 Ready for Pickup (Plated & Waiting for Floor Runner) */}
        <div className={`bg-slate-900/60 backdrop-blur-md rounded-2xl border border-emerald-500/30 flex flex-col min-h-[580px] ${
          mobileLaneFilter !== 'All' && mobileLaneFilter !== 'Ready' ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="p-3.5 bg-emerald-500/10 border-b border-emerald-500/20 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h2 className="font-black text-emerald-300 text-sm tracking-wide uppercase">
                3. Ready for Pickup
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
              {laneReady.length}
            </span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[700px]">
            {laneReady.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No orders waiting on the pass shelf.
              </div>
            ) : (
              laneReady.map((ticket) => {
                const elapsedMin = getElapsedMinutes(ticket.readyAt || ticket.createdAt);

                return (
                  <div
                    key={ticket.id}
                    className="bg-slate-800/90 rounded-xl p-4 border border-emerald-500/40 transition-all shadow-md"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>At Pass: {elapsedMin}m</span>
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-white leading-tight">
                      {ticket.dishName}
                    </h3>
                    <p className="text-xs text-emerald-200/90 font-medium mt-1">
                      Qty: {ticket.portionSize}
                    </p>

                    <div className="mt-3 space-y-1 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="text-slate-300 font-semibold truncate">{ticket.hallName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="text-slate-400">{ticket.station}</span>
                      </div>
                    </div>

                    {/* Touch Action Button */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-700/80">
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(ticket)}
                        className="w-full py-2.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4 text-slate-950" />
                        <span>Dispatch to Hall Buffet</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Lane 4: 🔵 Dispatched to Hall (Runner Handover & Completed) */}
        <div className={`bg-slate-900/60 backdrop-blur-md rounded-2xl border border-sky-500/30 flex flex-col min-h-[580px] ${
          mobileLaneFilter !== 'All' && mobileLaneFilter !== 'Dispatched' ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="p-3.5 bg-sky-500/10 border-b border-sky-500/20 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-400" />
              <h2 className="font-black text-sky-300 text-sm tracking-wide uppercase">
                4. Dispatched to Hall
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-xs font-bold border border-sky-500/30">
              {laneDispatched.length}
            </span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[700px]">
            {laneDispatched.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No orders currently in transit to halls.
              </div>
            ) : (
              laneDispatched.map((ticket) => {
                return (
                  <div
                    key={ticket.id}
                    className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 transition-all opacity-85 hover:opacity-100"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60">
                      <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-xs text-sky-300 font-semibold">
                        Runner En Route
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-200 leading-tight">
                      {ticket.dishName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {ticket.portionSize} • {ticket.hallName}
                    </p>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(ticket)}
                        className="w-full py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Archive Completed</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* New Refill Dispatch Modal */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsNewTicketOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Call Instant Dish Refill</h3>
                <p className="text-xs text-slate-400">Dispatches prioritized prep ticket to live kitchen display</p>
              </div>
            </div>

            {/* Quick Dish Presets */}
            <div className="mb-5">
              <span className="text-xs text-slate-400 mb-2 block font-medium">Quick Banquet Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_DISH_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  >
                    {p.name.split(' ')[0]} {p.name.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Event Reference
                  </label>
                  <select
                    value={ticketForm.eventRef}
                    onChange={(e) => {
                      const found = bookings.find((b) => b.bookingRef === e.target.value);
                      setTicketForm((prev) => ({
                        ...prev,
                        eventRef: e.target.value,
                        hallName: found?.hallName || prev.hallName,
                      }));
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {bookings.map((b) => (
                      <option key={b.id || b.bookingRef} value={b.bookingRef}>
                        {b.bookingRef} — {b.customerName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Banquet Hall
                  </label>
                  <input
                    type="text"
                    value={ticketForm.hallName}
                    readOnly
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dish / Food Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={ticketForm.dishName}
                  onChange={(e) => setTicketForm({ ...ticketForm, dishName: e.target.value })}
                  placeholder="e.g. Mutton Dum Biryani, Roghnai Naan..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Portion Size / Container
                  </label>
                  <input
                    type="text"
                    value={ticketForm.portionSize}
                    onChange={(e) => setTicketForm({ ...ticketForm, portionSize: e.target.value })}
                    placeholder="e.g. 2 Chafing Trays, 50 Naans..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kitchen Station
                  </label>
                  <select
                    value={ticketForm.station}
                    onChange={(e) => setTicketForm({ ...ticketForm, station: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Hot Buffet Line 1">Hot Buffet Line 1</option>
                    <option value="Hot Buffet Line 2">Hot Buffet Line 2</option>
                    <option value="Live BBQ & Karahi">Live BBQ & Karahi</option>
                    <option value="Tandoor & Breads">Tandoor & Breads</option>
                    <option value="Desserts & Beverages">Desserts & Beverages</option>
                    <option value="Salad & Cold Station">Salad & Cold Station</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ticket Urgency
                  </label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) =>
                      setTicketForm({
                        ...ticketForm,
                        priority: e.target.value as 'Normal' | 'Urgent' | 'Critical',
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Normal">Normal Refill</option>
                    <option value="Urgent">Urgent (Buffet low)</option>
                    <option value="Critical">Critical (Buffet empty)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Called By
                  </label>
                  <input
                    type="text"
                    value={ticketForm.requestedBy}
                    onChange={(e) => setTicketForm({ ...ticketForm, requestedBy: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Special Kitchen Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={ticketForm.notes}
                  onChange={(e) => setTicketForm({ ...ticketForm, notes: e.target.value })}
                  placeholder="e.g. VIP section waiting, serve extra spicy, replenish with warmers on..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Ticket to KDS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

