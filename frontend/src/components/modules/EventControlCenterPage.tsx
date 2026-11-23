import React, { useMemo, useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Grid,
  Lightbulb,
  Plus,
  Receipt,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
  UserCheck,
  Package,
} from 'lucide-react';
import { SEED_ASSIGNED_EVENTS } from '../../data/seedData';
import { bookingsApi, expensesApi, fundRequestsApi, requisitionsApi, AssetRequisitionItem, FundRequestItem } from '../../api/client';
import { formatTo12Hour } from '../../utils/timeFormat';

type ControlTab = 'seating' | 'decor' | 'catering' | 'floor-changes';

interface ActiveEventOption {
  id: string;
  bookingRef?: string;
  label: string;
  customerName: string;
  hallName: string;
  eventDate: string;
  eventTime: string;
  bookingRevenue: number;
  guestCount?: number;
  seatingArrangement?: string;
  menuPackage?: string;
  customMenuItems?: string[];
  assignedManager?: string;
  specialInstructions?: string;
}

interface ChecklistItem {
  id: string;
  category: 'Floral' | 'Lighting';
  label: string;
  completed: boolean;
}

interface FloorChangeLog {
  id: string;
  note: string;
  timestamp: string;
}

interface EventExpenseRow {
  id: string;
  category: string;
  description: string;
  date: string;
  amount: number;
  status: string;
}

export const EventControlCenterPage: React.FC = () => {
  const [activeEvents, setActiveEvents] = useState<ActiveEventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ControlTab>('seating');

  // Backend connected states
  const [fundRequests, setFundRequests] = useState<FundRequestItem[]>([]);
  const [kitchenRequisitions, setKitchenRequisitions] = useState<AssetRequisitionItem[]>([]);
  const [eventExpenses, setEventExpenses] = useState<EventExpenseRow[]>([]);

  useEffect(() => {
    bookingsApi
      .list()
      .then((data) => {
        if (data && data.length > 0) {
          const mapped: ActiveEventOption[] = data.map((b: any) => ({
            id: String(b.id),
            bookingRef: b.bookingRef,
            customerName: b.customerName || b.bookingRef || 'Client',
            hallName: b.hallName || 'Main Hall',
            eventDate: b.date || '',
            eventTime: formatTo12Hour(b.time || b.slot) || '12:00 PM – 04:00 PM',
            label: `${b.customerName || b.bookingRef} — ${b.hallName} (${b.date} • ${formatTo12Hour(b.time || b.slot) || '12:00 PM – 04:00 PM'}) [${b.assignedManager || 'Manager'}]`,
            bookingRevenue: Number(b.amount) || 0,
            guestCount: Number(b.guestCount) || 100,
            seatingArrangement: b.seatingArrangement || 'Round Tables',
            menuPackage: b.menuPackage || 'Standard Menu',
            customMenuItems: b.customMenuItems || [],
            assignedManager: b.assignedManager || 'Manager',
            specialInstructions: b.specialInstructions || '',
          }));
          setActiveEvents(mapped);
          if (mapped.length > 0) {
            setSelectedEventId(mapped[0].id);
          }
        } else {
          // Fallback to seed data if empty
          const fallback: ActiveEventOption[] = SEED_ASSIGNED_EVENTS.map((e) => ({
            id: e.id,
            bookingRef: e.id,
            label: `${e.customerName} (${e.hallName})`,
            customerName: e.customerName,
            hallName: e.hallName,
            eventDate: e.eventDate,
            eventTime: e.eventTime,
            bookingRevenue: 1500000,
            guestCount: e.totalGuests,
            seatingArrangement: 'Round Tables',
            menuPackage: e.menuPackage,
            assignedManager: 'Manager',
          }));
          setActiveEvents(fallback);
          setSelectedEventId(fallback[0]?.id || '');
        }
      })
      .catch(() => {});
  }, []);

  const selectedEvent = useMemo(
    () => activeEvents.find((e) => e.id === selectedEventId) ?? null,
    [activeEvents, selectedEventId]
  );

  const loadEventBackendData = async (bRef: string) => {
    if (!bRef) return;
    try {
      const [fetchedFunds, fetchedReqs, fetchedExpenses] = await Promise.all([
        fundRequestsApi.list({ bookingRef: bRef }).catch(() => []),
        requisitionsApi.list(bRef).catch(() => []),
        expensesApi.list({ bookingRef: bRef }).catch(() => []),
      ]);

      setFundRequests(fetchedFunds || []);
      setKitchenRequisitions(fetchedReqs || []);

      if (fetchedExpenses && fetchedExpenses.length > 0) {
        setEventExpenses(
          fetchedExpenses.map((exp: any) => ({
            id: String(exp.id || exp.expenseRef),
            category: exp.category || 'General',
            description: exp.description || exp.category || 'Operational cost',
            date: exp.date || '',
            amount: Number(exp.amount) || 0,
            status: exp.status || 'Recorded',
          }))
        );
      } else {
        setEventExpenses([
          {
            id: 'EEX-1',
            category: 'Base Hall Rent',
            description: `${selectedEvent?.hallName || 'Hall'} Operational Allocation`,
            date: selectedEvent?.eventDate || new Date().toISOString().slice(0, 10),
            amount: 250000,
            status: 'Recorded',
          },
        ]);
      }
    } catch (err) {
      console.warn('Error loading backend data for event in Control Center:', err);
    }
  };

  useEffect(() => {
    if (selectedEvent?.bookingRef) {
      loadEventBackendData(selectedEvent.bookingRef);
    }
  }, [selectedEvent?.bookingRef]);

  // Decor & Stage checklists
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    { id: 'CHK-1', category: 'Floral', label: 'Main bridal stage fresh rose backdrop', completed: true },
    { id: 'CHK-2', category: 'Lighting', label: 'Warm chandelier dimmer & spotlight test', completed: false },
  ]);
  const [newChecklistLabel, setNewChecklistLabel] = useState('');
  const [newChecklistCategory, setNewChecklistCategory] = useState<'Floral' | 'Lighting'>('Floral');

  // Live Floor Changes
  const [floorChangeInput, setFloorChangeInput] = useState('');
  const [floorChanges, setFloorChanges] = useState<FloorChangeLog[]>([
    { id: 'FLR-1', note: 'Added 2 extra VIP tables near main stage', timestamp: '07:45 PM' },
  ]);

  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [fundReason, setFundReason] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [fundNotes, setFundNotes] = useState('');

  const financialSnapshot = useMemo(() => {
    if (!selectedEvent && eventExpenses.length === 0) {
      return {
        revenue: 'Rs. 0',
        expenses: 'Rs. 0',
        profit: 'Rs. 0',
      };
    }

    const totalRevenue = selectedEvent ? selectedEvent.bookingRevenue : 0;
    const totalExpenses = eventExpenses.reduce((sum, row) => sum + row.amount, 0);
    const estimatedProfit = totalRevenue - totalExpenses;

    return {
      revenue: `Rs. ${totalRevenue.toLocaleString()}`,
      expenses: `Rs. ${totalExpenses.toLocaleString()}`,
      profit: `Rs. ${estimatedProfit.toLocaleString()}`,
    };
  }, [selectedEvent, eventExpenses]);

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newChecklistLabel.trim();
    if (!trimmed) return;

    setChecklistItems((prev) => [
      {
        id: `CHK-${Date.now().toString().slice(-4)}`,
        category: newChecklistCategory,
        label: trimmed,
        completed: false,
      },
      ...prev,
    ]);
    setNewChecklistLabel('');
  };

  const handleToggleChecklist = (id: string) => {
    setChecklistItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleLogFloorChange = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = floorChangeInput.trim();
    if (!trimmed) return;

    const timeStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    setFloorChanges((prev) => [
      {
        id: `FLR-${Date.now().toString().slice(-4)}`,
        note: trimmed,
        timestamp: timeStr,
      },
      ...prev,
    ]);
    setFloorChangeInput('');
  };

  const handleSubmitFundRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = fundReason.trim();
    const parsedAmount = parseFloat(fundAmount);
    if (!trimmedReason || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    try {
      await fundRequestsApi.create({
        bookingRef: selectedEvent?.bookingRef || selectedEvent?.id || '',
        eventName: selectedEvent?.customerName || '',
        reason: trimmedReason,
        amount: parsedAmount,
        notes: fundNotes.trim(),
        requestedBy: 'Manager',
      });

      if (selectedEvent?.bookingRef) {
        await loadEventBackendData(selectedEvent.bookingRef);
      }

      setFundReason('');
      setFundAmount('');
      setFundNotes('');
      setIsFundModalOpen(false);
    } catch (err) {
      console.error('Failed to submit fund request to accounts:', err);
      alert('Error submitting fund request to accounts.');
    }
  };

  const handleApproveRequisition = async (reqId: string | number) => {
    try {
      await requisitionsApi.approve(reqId);
      if (selectedEvent?.bookingRef) {
        await loadEventBackendData(selectedEvent.bookingRef);
      }
    } catch (err) {
      console.error('Failed to approve kitchen requisition:', err);
      alert('Error approving requisition.');
    }
  };

  const tabs: Array<{
    id: ControlTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'seating', label: 'Seating & Layout', icon: Grid },
    { id: 'decor', label: 'Decor & Stage', icon: Sparkles },
    { id: 'catering', label: 'Catering & Menu', icon: UtensilsCrossed },
    { id: 'floor-changes', label: 'Live Floor Changes', icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      {/* Top Section: Header & Active Event Selector */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
            Unified Event Control Center
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Command seating, decor, catering, live floor changes, and event financials from one workspace.
          </p>
        </div>

        <div className="w-full lg:w-80 shrink-0">
          <label
            htmlFor="active-event-select"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
          >
            Select Active Event
          </label>
          <select
            id="active-event-select"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
          >
            <option value="">
              {activeEvents.length === 0
                ? 'No active events found'
                : 'Choose an active event...'}
            </option>
            {activeEvents.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Operational Command Tabs */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        {/* Horizontal Tab Bar */}
        <div className="border-b border-slate-200 bg-slate-50/70 px-3 pt-2 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-teal-700 text-teal-800 bg-white rounded-t-lg'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-teal-700' : 'text-slate-400'
                    }`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="p-5 sm:p-6">
          {/* TAB 1: SEATING & LAYOUT */}
          {activeTab === 'seating' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Expected Guests
                    </span>
                    <Users className="w-4 h-4 text-teal-700" />
                  </div>
                  <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
                    {selectedEvent?.guestCount ?? 150}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Assigned Tables
                    </span>
                    <Grid className="w-4 h-4 text-teal-700" />
                  </div>
                  <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
                    {selectedEvent?.guestCount ? Math.ceil(selectedEvent.guestCount / 10) : 15} Tables
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Arrangement
                    </span>
                    <Sparkles className="w-4 h-4 text-teal-700" />
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {selectedEvent?.seatingArrangement || 'Round Tables'}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Manager
                    </span>
                    <UserCheck className="w-4 h-4 text-teal-700" />
                  </div>
                  <p className="mt-2 text-sm font-bold text-teal-800">
                    {selectedEvent?.assignedManager || 'Manager'}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-14 px-6 text-center">
                <Grid className="w-7 h-7 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">
                  No table map loaded for this event.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Select an active event to view live table assignments and guest counts.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: DECOR & STAGE */}
          {activeTab === 'decor' && (
            <div className="space-y-5">
              <form
                onSubmit={handleAddChecklistItem}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
              >
                <select
                  aria-label="Checklist Category"
                  value={newChecklistCategory}
                  onChange={(e) =>
                    setNewChecklistCategory(e.target.value as 'Floral' | 'Lighting')
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                >
                  <option value="Floral">Floral &amp; Stage</option>
                  <option value="Lighting">Lighting &amp; Audio</option>
                </select>
                <input
                  type="text"
                  value={newChecklistLabel}
                  onChange={(e) => setNewChecklistLabel(e.target.value)}
                  placeholder="Add decor or lighting verification item..."
                  className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </form>

              {checklistItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-14 px-6 text-center">
                  <Lightbulb className="w-7 h-7 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-700">
                    No floral or lighting checklist items yet.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Add stage, floral, or lighting verification items above to track setup completion.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {checklistItems.map((item) => (
                    <li
                      key={item.id}
                      className="px-4 py-3 bg-white flex items-center justify-between gap-3"
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleChecklist(item.id)}
                          className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                        />
                        <span
                          className={`text-sm ${
                            item.completed
                              ? 'line-through text-slate-400'
                              : 'text-slate-800 font-medium'
                          }`}
                        >
                          {item.label}
                        </span>
                      </label>
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {item.category}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* TAB 3: CATERING & MENU */}
          {activeTab === 'catering' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Assigned Menu Package
                  </span>
                  <p className="mt-2 text-base font-bold text-slate-900">
                    {selectedEvent?.menuPackage || 'Custom Package'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Guest Headcount
                  </span>
                  <p className="mt-2 text-xl font-bold font-mono tabular-nums text-teal-700">
                    {selectedEvent?.guestCount ?? 150} Guests
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Live Serving Status
                  </span>
                  <p className="mt-2 text-base font-bold text-emerald-700">
                    Kitchen Prep Active
                  </p>
                </div>
              </div>

              {selectedEvent?.specialInstructions && (
                <div className="rounded-lg bg-amber-50/60 border border-amber-200 p-4 text-xs text-amber-900">
                  <span className="font-semibold">Special Dietary &amp; Service Instructions:</span>{' '}
                  {selectedEvent.specialInstructions}
                </div>
              )}

              {/* Kitchen Requisitions Sent to Manager */}
              <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-teal-700" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      Kitchen Ingredient &amp; Stock Requisitions
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {kitchenRequisitions.length} item{kitchenRequisitions.length === 1 ? '' : 's'}
                  </span>
                </div>

                {kitchenRequisitions.length === 0 ? (
                  <div className="py-10 px-6 text-center text-xs text-slate-500">
                    <UtensilsCrossed className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    No ingredient requisitions forwarded from the Kitchen for this event yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/40 text-xs text-slate-500 uppercase">
                          <th className="py-2.5 px-4 font-semibold">Item Name</th>
                          <th className="py-2.5 px-4 font-semibold">Quantity</th>
                          <th className="py-2.5 px-4 font-semibold">Est. Cost</th>
                          <th className="py-2.5 px-4 font-semibold">Status</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {kitchenRequisitions.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/60">
                            <td className="py-3 px-4 font-medium text-slate-900">
                              {req.itemName}
                            </td>
                            <td className="py-3 px-4 font-mono">
                              {req.requestedQuantity} {req.unit || 'units'}
                            </td>
                            <td className="py-3 px-4 font-mono text-teal-800">
                              Rs. {Number(req.estimatedCost || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                                  req.status === 'Approved' || req.status === 'Issued'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {req.status === 'Approved' ? 'Approved' : req.status === 'Issued' ? 'Issued' : 'Pending Manager Review'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {req.status === 'Requested' ? (
                                <button
                                  type="button"
                                  onClick={() => handleApproveRequisition(req.id)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                              ) : (
                                <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {selectedEvent?.customMenuItems && selectedEvent.customMenuItems.length > 0 && (
                <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Custom Menu Additions Requested by Client:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.customMenuItems.map((item, idx) => (
                      <span key={idx} className="bg-teal-50 border border-teal-200 text-teal-800 px-2.5 py-1 rounded-md text-xs font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LIVE FLOOR CHANGES */}
          {activeTab === 'floor-changes' && (
            <div className="space-y-5">
              <form
                onSubmit={handleLogFloorChange}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
              >
                <input
                  type="text"
                  value={floorChangeInput}
                  onChange={(e) => setFloorChangeInput(e.target.value)}
                  placeholder='Log sudden floor change (e.g., "Add 2 extra tables")'
                  className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Log Change
                </button>
              </form>

              {floorChanges.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-14 px-6 text-center">
                  <ClipboardList className="w-7 h-7 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-700">
                    No live floor changes logged yet.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Record last-minute guest additions, extra tables, or service adjustments above.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {floorChanges.map((entry) => (
                    <li
                      key={entry.id}
                      className="px-4 py-3 bg-white flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {entry.note}
                        </span>
                      </div>
                      <span className="text-xs font-mono tabular-nums text-slate-400 shrink-0">
                        {entry.timestamp}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Financials & Requisitions */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-900">
              Financials &amp; Requisitions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Read-only profit snapshot, accounts fund requisitions, and event-specific expense ledger.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsFundModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Request Funds from Accounts
          </button>
        </div>

        {/* Profit Snapshot (Read-only) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Revenue (Booking)
              </span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-teal-700" />
              </div>
            </div>
            <p className="mt-2.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
              {financialSnapshot.revenue}
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Expenses
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
            </div>
            <p className="mt-2.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
              {financialSnapshot.expenses}
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Estimated Profit
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="mt-2.5 text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {financialSnapshot.profit}
            </p>
          </div>
        </div>

        {/* Submitted Fund Requests Strip (if any) */}
        {fundRequests.length > 0 && (
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 inline-flex items-center gap-2">
                <Wallet className="w-4 h-4 text-teal-700" />
                Fund Requisitions Sent to Accounts
              </h3>
              <span className="text-xs font-mono text-slate-400">
                ({fundRequests.length})
              </span>
            </div>
            <ul className="divide-y divide-slate-100">
              {fundRequests.map((req) => (
                <li
                  key={req.id}
                  className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <div>
                    <span className="font-semibold text-slate-900">{req.reason}</span>
                    {req.notes && (
                      <span className="text-xs text-slate-500 ml-2">— {req.notes}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      Rs. {req.amount.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      {req.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Event Expense Ledger Table */}
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
              Event Expense Ledger
            </h3>
            <span className="text-xs text-slate-400">
              Base Hall Rent &middot; Kitchen Requisition &middot; Decor &middot; Damages &middot; Extra Time
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Category
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Description
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Amount
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eventExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 px-6 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                          <Receipt className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">
                          No event expenses recorded yet.
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Expenses for Base Hall Rent, Kitchen Requisition, Decor, Damages, and Extra Time will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  eventExpenses.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 text-sm font-semibold text-slate-900">
                        {row.category}
                      </td>
                      <td className="py-3.5 px-5 text-sm text-slate-700">
                        {row.description}
                      </td>
                      <td className="py-3.5 px-5 text-sm font-mono text-slate-600">
                        {row.date}
                      </td>
                      <td className="py-3.5 px-5 text-sm font-mono tabular-nums font-semibold text-rose-600">
                        Rs. {row.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Request Funds from Accounts Modal */}
      {isFundModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fund-request-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3
                id="fund-request-modal-title"
                className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900"
              >
                Request Funds from Accounts
              </h3>
              <button
                type="button"
                onClick={() => setIsFundModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitFundRequest} className="p-5 space-y-4">
              <div>
                <label
                  htmlFor="fund-reason"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Reason / Purpose *
                </label>
                <input
                  id="fund-reason"
                  type="text"
                  required
                  value={fundReason}
                  onChange={(e) => setFundReason(e.target.value)}
                  placeholder="e.g. Additional Ice &amp; Disposable Cutlery"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div>
                <label
                  htmlFor="fund-amount"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Amount (Rs.) *
                </label>
                <input
                  id="fund-amount"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="e.g. 8000"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div>
                <label
                  htmlFor="fund-notes"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Notes / Urgent Justification
                </label>
                <textarea
                  id="fund-notes"
                  rows={3}
                  value={fundNotes}
                  onChange={(e) => setFundNotes(e.target.value)}
                  placeholder="Additional explanation for accounts disbursement..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFundModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
