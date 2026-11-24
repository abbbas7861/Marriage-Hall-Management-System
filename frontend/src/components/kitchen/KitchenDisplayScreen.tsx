import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChefHat,
  Bell,
  Volume2,
  VolumeX,
  Flame,
  Clock,
  CheckCircle2,
  Plus,
  Building2,
  Send,
  RefreshCw,
  Search,
  Check,
  X,
  UtensilsCrossed,
  Calendar,
} from 'lucide-react';
import { Booking } from '../../types';
import { bookingsApi, kdsApi, KitchenOrderTicketItem } from '../../api/client';
import { formatTo12Hour } from '../../utils/timeFormat';
import { isEventActiveOrUpcoming } from '../../utils/formatters';

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
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('All');
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
        showToast('New urgent dish refill order received from hall!');
      }
      prevTicketCountRef.current = fetchedTickets.length;

      // Only keep active or upcoming events on KDS
      const activeBookings = (fetchedBookings || []).filter(isEventActiveOrUpcoming);

      setTickets(fetchedTickets);
      setBookings(activeBookings);

      if (activeBookings.length > 0 && !ticketForm.eventRef) {
        setTicketForm((prev) => ({
          ...prev,
          eventRef: activeBookings[0].bookingRef,
          hallName: activeBookings[0].hallName,
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
      showToast(`Ticket ${ticket.ticketNumber} updated to "${updated.status}"`);
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
      if (selectedEventFilter !== 'All' && t.eventRef !== selectedEventFilter) return false;
      if (selectedHallFilter !== 'All' && t.hallName !== selectedHallFilter) return false;
      if (selectedStationFilter !== 'All' && t.station !== selectedStationFilter) return false;
      return true;
    });
  }, [tickets, selectedEventFilter, selectedHallFilter, selectedStationFilter]);

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
        <div className="fixed bottom-6 right-6 z-50 bg-teal-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-teal-700 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-teal-300" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / KDS Control Header - Clean System Light Theme */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
              Kitchen Display System (KDS)
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
              LIVE QUEUE
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time floor tickets receiving dish refills. Track cooking stages and dispatch food to banquets.
          </p>
        </div>

        {/* Action buttons & Audio Chime Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playKitchenChime();
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-teal-50 border-teal-200 text-teal-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-teal-700" />
                <span>Audio Chime: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span>Audio Chime: OFF</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={playKitchenChime}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            title="Test Kitchen Service Bell"
          >
            <Bell className="w-3.5 h-3.5 text-slate-500" />
            <span>Test Bell</span>
          </button>

          <button
            type="button"
            onClick={() => loadData(false)}
            disabled={loading}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 text-teal-700 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsNewTicketOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Call Refill Order</span>
          </button>
        </div>
      </div>

      {/* Filter Bar with Event, Hall & Station Selectors */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Event selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-700" />
            <span className="font-semibold text-slate-500">Event:</span>
            <select
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="All">All Active Events</option>
              {bookings.map((b) => (
                <option key={b.bookingRef} value={b.bookingRef}>
                  {b.bookingRef} - {b.customerName} ({b.hallName})
                </option>
              ))}
            </select>
          </div>

          {/* Hall selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-teal-700" />
            <span className="font-semibold text-slate-500">Hall:</span>
            <select
              value={selectedHallFilter}
              onChange={(e) => setSelectedHallFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Halls / Venues</option>
              <option value="Grand Crystal Ballroom">Grand Crystal Ballroom</option>
              <option value="Royal Emerald Hall">Royal Emerald Hall</option>
              <option value="Sapphire Banquet">Sapphire Banquet</option>
              <option value="Imperial Courtyard Lawn">Imperial Courtyard Lawn</option>
            </select>
          </div>

          {/* Station selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5 text-teal-700" />
            <span className="font-semibold text-slate-500">Station:</span>
            <select
              value={selectedStationFilter}
              onChange={(e) => setSelectedStationFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Kitchen Stations</option>
              <option value="Hot Buffet Line 1">Hot Buffet Line 1</option>
              <option value="Hot Buffet Line 2">Hot Buffet Line 2</option>
              <option value="Live BBQ & Karahi">Live BBQ & Karahi</option>
              <option value="Tandoor & Breads">Tandoor & Breads</option>
              <option value="Desserts & Beverages">Desserts & Beverages</option>
              <option value="Salad & Cold Station">Salad & Cold Station</option>
            </select>
          </div>
        </div>

        {/* Quick summary counts */}
        <div className="flex items-center gap-3 text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <strong className="text-slate-900">{laneRequested.length}</strong> New Refills
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-600" />
            <strong className="text-slate-900">{laneInPrep.length}</strong> In Prep
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <strong className="text-slate-900">{laneReady.length}</strong> Ready to Serve
          </span>
        </div>
      </div>

      {/* Mobile Lane Switcher */}
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
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              mobileLaneFilter === tab.key
                ? 'bg-teal-700 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4-Lane Board in Clean Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Lane 1: 🟡 Refill Requested */}
        <div
          className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col min-h-[580px] overflow-hidden ${
            mobileLaneFilter !== 'All' && mobileLaneFilter !== 'Requested' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-3.5 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h2 className="font-bold text-amber-900 text-xs tracking-wide uppercase">
                1. Refill Requested
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono text-xs font-bold">
              {laneRequested.length}
            </span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[700px]">
            {laneRequested.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No pending refill calls. Floor buffets currently fully stocked.
              </div>
            ) : (
              laneRequested.map((ticket) => {
                const elapsedMin = getElapsedMinutes(ticket.createdAt);
                const isOverdue = elapsedMin >= 10;

                return (
                  <div
                    key={ticket.id}
                    className={`bg-white rounded-xl p-4 border transition-all shadow-xs ${
                      ticket.priority === 'Critical'
                        ? 'border-rose-300 bg-rose-50/30'
                        : isOverdue
                        ? 'border-amber-300 bg-amber-50/30'
                        : 'border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {ticket.ticketNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {ticket.priority === 'Critical' && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                            CRITICAL
                          </span>
                        )}
                        <span
                          className={`text-xs font-mono font-bold flex items-center gap-1 ${
                            isOverdue ? 'text-rose-700' : 'text-slate-500'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{elapsedMin}m ago</span>
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {ticket.dishName}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      Qty: {ticket.portionSize}
                    </p>

                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span className="text-slate-700 font-semibold truncate">{ticket.hallName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600">{ticket.station}</span>
                      </div>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(ticket)}
                        className="w-full py-2 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Start Cooking</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Lane 2: 🟠 In Preparation */}
        <div
          className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col min-h-[580px] overflow-hidden ${
            mobileLaneFilter !== 'All' && mobileLaneFilter !== 'Prep' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-3.5 bg-teal-50/70 border-b border-teal-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              <h2 className="font-bold text-teal-900 text-xs tracking-wide uppercase">
                2. In Preparation
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 font-mono text-xs font-bold">
              {laneInPrep.length}
            </span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[700px]">
            {laneInPrep.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No dishes currently being cooked. Ready to take next refill.
              </div>
            ) : (
              laneInPrep.map((ticket) => {
                const elapsedMin = getElapsedMinutes(ticket.inPrepAt || ticket.createdAt);

                return (
                  <div
                    key={ticket.id}
                    className="bg-white rounded-xl p-4 border border-teal-200/90 shadow-xs"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-xs font-mono font-bold text-teal-800 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-teal-700" />
                        <span>Cooking: {elapsedMin}m</span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {ticket.dishName}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      Qty: {ticket.portionSize}
                    </p>

                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span className="text-slate-700 font-semibold truncate">{ticket.hallName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600">{ticket.station}</span>
                      </div>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(ticket)}
                        className="w-full py-2 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ready at Pass Counter</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Lane 3: 🟢 Ready for Pickup */}
        <div
          className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col min-h-[580px] overflow-hidden ${
            mobileLaneFilter !== 'All' && mobileLaneFilter !== 'Ready' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-3.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <h2 className="font-bold text-emerald-900 text-xs tracking-wide uppercase">
                3. Ready to Serve
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono text-xs font-bold">
              {laneReady.length}
            </span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[700px]">
            {laneReady.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No orders waiting on the pass shelf.
              </div>
            ) : (
              laneReady.map((ticket) => {
                const elapsedMin = getElapsedMinutes(ticket.readyAt || ticket.createdAt);

                return (
                  <div
                    key={ticket.id}
                    className="bg-white rounded-xl p-4 border border-emerald-200/90 shadow-xs"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>At Pass: {elapsedMin}m</span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {ticket.dishName}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      Qty: {ticket.portionSize}
                    </p>

                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span className="text-slate-700 font-semibold truncate">{ticket.hallName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600">{ticket.station}</span>
                      </div>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(ticket)}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch to Hall Buffet</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Lane 4: 🔵 Dispatched to Hall */}
        <div
          className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col min-h-[580px] overflow-hidden ${
            mobileLaneFilter !== 'All' && mobileLaneFilter !== 'Dispatched' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-3.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-700" />
              <h2 className="font-bold text-blue-900 text-xs tracking-wide uppercase">
                4. Dispatched to Hall
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-mono text-xs font-bold">
              {laneDispatched.length}
            </span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[700px]">
            {laneDispatched.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No orders currently in transit to halls.
              </div>
            ) : (
              laneDispatched.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs opacity-90 hover:opacity-100"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {ticket.ticketNumber}
                    </span>
                    <span className="text-xs text-blue-700 font-semibold">
                      Runner En Route
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {ticket.dishName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {ticket.portionSize} • {ticket.hallName}
                  </p>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(ticket)}
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Archive Completed</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* New Refill Dispatch Modal */}
      {isNewTicketOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Call Instant Dish Refill
                  </h3>
                  <p className="text-xs text-slate-500">Dispatches prioritized prep ticket to live kitchen display</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Dish Presets */}
            <div className="p-5 pb-0">
              <span className="text-xs font-semibold text-slate-600 mb-2 block">Quick Banquet Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_DISH_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    {p.name.split(' ')[0]} {p.name.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateTicket} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    {bookings.map((b) => (
                      <option key={b.id || b.bookingRef} value={b.bookingRef}>
                        {b.bookingRef} — {b.customerName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Banquet Hall
                  </label>
                  <input
                    type="text"
                    value={ticketForm.hallName}
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dish / Food Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={ticketForm.dishName}
                  onChange={(e) => setTicketForm({ ...ticketForm, dishName: e.target.value })}
                  placeholder="e.g. Mutton Dum Biryani, Roghnai Naan..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Portion Size / Container
                  </label>
                  <input
                    type="text"
                    value={ticketForm.portionSize}
                    onChange={(e) => setTicketForm({ ...ticketForm, portionSize: e.target.value })}
                    placeholder="e.g. 2 Chafing Trays, 50 Naans..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kitchen Station
                  </label>
                  <select
                    value={ticketForm.station}
                    onChange={(e) => setTicketForm({ ...ticketForm, station: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    <option value="Normal">Normal Refill</option>
                    <option value="Urgent">Urgent (Buffet low)</option>
                    <option value="Critical">Critical (Buffet empty)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Called By
                  </label>
                  <input
                    type="text"
                    value={ticketForm.requestedBy}
                    onChange={(e) => setTicketForm({ ...ticketForm, requestedBy: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Special Kitchen Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={ticketForm.notes}
                  onChange={(e) => setTicketForm({ ...ticketForm, notes: e.target.value })}
                  placeholder="e.g. VIP section waiting, serve extra spicy, replenish with warmers on..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-teal-700 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
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
