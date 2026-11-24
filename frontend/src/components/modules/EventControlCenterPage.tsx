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
  Crown,
  Star,
  ChevronDown,
  ChevronUp,
  Save,
  Flag,
  FileText,
  Printer,
  ShieldAlert,
} from 'lucide-react';
import { SEED_ASSIGNED_EVENTS } from '../../data/seedData';
import {
  bookingsApi,
  expensesApi,
  fundRequestsApi,
  requisitionsApi,
  checklistsApi,
  AssetRequisitionItem,
  FundRequestItem,
  EventChecklistItem,
} from '../../api/client';
import { formatTo12Hour } from '../../utils/timeFormat';

type ControlTab = 'seating' | 'decor' | 'catering' | 'floor-changes' | 'event-closing';

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
  personsPerTable?: number;
  vipTables?: number[];
  seatingArrangement?: string;
  menuPackage?: string;
  customMenuItems?: string[];
  assignedManager?: string;
  specialInstructions?: string;
  operationalStatus?: string;
  paymentStatus?: string;
  advancePayment?: number;
  extraServices?: any[];
  damagesRecord?: any[];
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
  const [showAllTablesInECC, setShowAllTablesInECC] = useState(false);

  // Backend connected states
  const [fundRequests, setFundRequests] = useState<FundRequestItem[]>([]);
  const [kitchenRequisitions, setKitchenRequisitions] = useState<AssetRequisitionItem[]>([]);
  const [eventExpenses, setEventExpenses] = useState<EventExpenseRow[]>([]);

  useEffect(() => {
    bookingsApi
      .list()
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped: ActiveEventOption[] = data
            .filter((b: any) => {
              if (b.status === 'Cancelled' || b.status === 'Rejected' || b.status === 'Completed') return false;
              const op = (b.operationalStatus || b.operational_status || '').toLowerCase();
              if (op.includes('concluded') || op.includes('completed') || op.includes('closed')) return false;
              return true;
            })
            .map((b: any) => ({
            id: String(b.id),
            bookingRef: b.bookingRef,
            customerName: b.customerName || b.bookingRef || 'Client',
            hallName: b.hallName || 'Main Hall',
            eventDate: b.date || '',
            eventTime: formatTo12Hour(b.time || b.slot) || '12:00 PM – 04:00 PM',
            label: `${b.customerName || b.bookingRef} — ${b.hallName} (${b.date} • ${formatTo12Hour(b.time || b.slot) || '12:00 PM – 04:00 PM'}) [${b.assignedManager || 'Manager'}]`,
            bookingRevenue: Number(b.amount) || 0,
            guestCount: Number(b.guestCount) || 100,
            personsPerTable: Number(b.personsPerTable) || 10,
            vipTables: Array.isArray(b.vipTables) && b.vipTables.length > 0 ? b.vipTables.map(Number) : [1, 2],
            seatingArrangement: b.seatingArrangement || 'Round Tables',
            menuPackage: b.menuPackage || 'Standard Menu',
            customMenuItems: b.customMenuItems || [],
            assignedManager: b.assignedManager || 'Manager',
            specialInstructions: b.specialInstructions || '',
            operationalStatus: b.operationalStatus || b.operational_status || 'Setup in Progress',
            paymentStatus: b.paymentStatus || b.payment_status || 'Unpaid',
            advancePayment: Number(b.advancePayment || b.advance_payment || 0),
            extraServices: b.extraServices || b.extra_services || [],
            damagesRecord: b.damagesRecord || b.damages_record || [],
          }));
          setActiveEvents(mapped);
          if (mapped.length > 0) {
            setSelectedEventId(mapped[0].id);
          } else {
            setSelectedEventId('');
          }
        }
      })
      .catch(() => {});
  }, []);

  // Listen to external booking updates (e.g. from Table Monitoring page)
  useEffect(() => {
    const handleBookingUpdate = (e: any) => {
      const detail = e.detail;
      if (!detail || !detail.bookingId) return;
      setActiveEvents((prev) =>
        prev.map((ev) =>
          String(ev.id) === String(detail.bookingId)
            ? {
                ...ev,
                personsPerTable:
                  detail.personsPerTable !== undefined
                    ? detail.personsPerTable
                    : ev.personsPerTable,
                vipTables:
                  detail.vipTables !== undefined ? detail.vipTables : ev.vipTables,
              }
            : ev
        )
      );
    };

    window.addEventListener('booking_updated', handleBookingUpdate);

    // Listen to external booking cancellations to remove them from Event Control Center immediately
    const handleBookingCancelled = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      const cancelledId = String(detail.bookingId || '');
      const freedDate = detail.freedDate;
      const freedHall = detail.freedHall;

      setActiveEvents((prev) => {
        const filtered = prev.filter((ev) => {
          if (cancelledId && (ev.id === cancelledId || ev.bookingRef === cancelledId)) return false;
          if (freedDate && freedHall && ev.eventDate === freedDate && ev.hallName === freedHall) return false;
          return true;
        });
        if (selectedEventId && (selectedEventId === cancelledId || !filtered.some((e) => e.id === selectedEventId))) {
          setSelectedEventId(filtered[0]?.id || '');
        }
        return filtered;
      });
    };

    window.addEventListener('booking_cancelled', handleBookingCancelled);

    return () => {
      window.removeEventListener('booking_updated', handleBookingUpdate);
      window.removeEventListener('booking_cancelled', handleBookingCancelled);
    };
  }, [selectedEventId]);

  const selectedEvent = useMemo(
    () => activeEvents.find((e) => e.id === selectedEventId) ?? null,
    [activeEvents, selectedEventId]
  );

  // Toggle VIP designation for a table in Event Control Center
  const handleToggleVipControlCenter = async (tableNum: number) => {
    if (!selectedEvent) return;
    const currentVip = Array.isArray(selectedEvent.vipTables) ? selectedEvent.vipTables : [1, 2];
    const nextVip = currentVip.includes(tableNum)
      ? currentVip.filter((n) => n !== tableNum)
      : [...currentVip, tableNum].sort((a, b) => a - b);

    setActiveEvents((prev) =>
      prev.map((e) => (e.id === selectedEvent.id ? { ...e, vipTables: nextVip } : e))
    );

    if (selectedEvent.id && !String(selectedEvent.id).startsWith('seed-')) {
      try {
        await bookingsApi.patch(String(selectedEvent.id), { vipTables: nextVip });
        window.dispatchEvent(
          new CustomEvent('booking_updated', {
            detail: {
              bookingId: selectedEvent.id,
              personsPerTable: selectedEvent.personsPerTable || 10,
              vipTables: nextVip,
            },
          })
        );
      } catch (err) {
        console.warn('Failed to save VIP table in ECC:', err);
      }
    }
  };

  // Update persons per table directly in Event Control Center
  const handleUpdatePersonsPerTableECC = async (val: number) => {
    if (!selectedEvent) return;
    setActiveEvents((prev) =>
      prev.map((e) => (e.id === selectedEvent.id ? { ...e, personsPerTable: val } : e))
    );
    if (selectedEvent.id && !String(selectedEvent.id).startsWith('seed-')) {
      try {
        await bookingsApi.patch(String(selectedEvent.id), { personsPerTable: val });
        window.dispatchEvent(
          new CustomEvent('booking_updated', {
            detail: {
              bookingId: selectedEvent.id,
              personsPerTable: val,
              vipTables: selectedEvent.vipTables || [1, 2],
            },
          })
        );
      } catch (err) {
        console.warn('Failed to update persons per table in ECC:', err);
      }
    }
  };

  const loadEventBackendData = async (bRef: string) => {
    if (!bRef) return;
    try {
      const [fetchedFunds, fetchedReqs, fetchedExpenses, fetchedChecklists] = await Promise.all([
        fundRequestsApi.list({ bookingRef: bRef }).catch(() => []),
        requisitionsApi.list(bRef).catch(() => []),
        expensesApi.list({ bookingRef: bRef }).catch(() => []),
        checklistsApi.list(bRef).catch(() => []),
      ]);

      setFundRequests(fetchedFunds || []);
      setKitchenRequisitions(fetchedReqs || []);
      setLiveFloorChecklists(fetchedChecklists || []);

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

  // Live Floor Changes & Checklists
  const [floorChangeInput, setFloorChangeInput] = useState('');
  const [floorChanges, setFloorChanges] = useState<FloorChangeLog[]>([
    { id: 'FLR-1', note: 'Added 2 extra VIP tables near main stage', timestamp: '07:45 PM' },
  ]);
  const [liveFloorChecklists, setLiveFloorChecklists] = useState<EventChecklistItem[]>([]);
  const [newFloorChecklistTask, setNewFloorChecklistTask] = useState('');
  const [newFloorChecklistPhase, setNewFloorChecklistPhase] = useState<'Pre-Event Setup' | 'During Event' | 'Post-Event / Wrap-up'>('During Event');
  const [newFloorChecklistNotes, setNewFloorChecklistNotes] = useState('');
  const [isSubmittingChecklist, setIsSubmittingChecklist] = useState(false);

  // Event Closing State
  const [closingChecklist, setClosingChecklist] = useState([
    { id: 'chk-catering-done', label: 'Catering & Dinner Service concluded and cleared', done: false },
    { id: 'chk-hall-inspection', label: 'Floor and hall perimeter inspected for venue damages', done: false },
    { id: 'chk-decor-inventory', label: 'Stage props, audio gear and lighting dismantled & verified', done: false },
    { id: 'chk-guest-departure', label: 'Guests departed and venue handover started', done: false },
  ]);

  // Extra services added during closing
  const [closingExtraServices, setClosingExtraServices] = useState<Array<{ id: string; title: string; price: number; category: string; notes: string }>>([]);
  const [newExtraTitle, setNewExtraTitle] = useState('');
  const [newExtraPrice, setNewExtraPrice] = useState('');
  const [newExtraCategory, setNewExtraCategory] = useState('Extra Service');
  const [newExtraNotes, setNewExtraNotes] = useState('');

  // Damages added during closing
  const [closingDamages, setClosingDamages] = useState<Array<{ id: string; item: string; amount: number; deductionType: 'invoice' | 'security_deposit'; notes: string }>>([]);
  const [newDamageItem, setNewDamageItem] = useState('');
  const [newDamageAmount, setNewDamageAmount] = useState('');
  const [newDamageDeduction, setNewDamageDeduction] = useState<'invoice' | 'security_deposit'>('invoice');
  const [newDamageNotes, setNewDamageNotes] = useState('');

  const [closingNotes, setClosingNotes] = useState('');
  const [isClosingSubmitting, setIsClosingSubmitting] = useState(false);
  const [settlementSlipData, setSettlementSlipData] = useState<any | null>(null);

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

  const handleAddLiveFloorChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    const task = newFloorChecklistTask.trim();
    if (!task || !selectedEvent?.bookingRef) return;

    try {
      setIsSubmittingChecklist(true);
      const created = await checklistsApi.create({
        eventRef: selectedEvent.bookingRef,
        phase: newFloorChecklistPhase,
        taskName: task,
        isCompleted: false,
        notes: newFloorChecklistNotes.trim(),
        completedBy: '',
      });

      setLiveFloorChecklists((prev) => [...prev, created]);
      setNewFloorChecklistTask('');
      setNewFloorChecklistNotes('');
    } catch (err: any) {
      console.error('Failed to create checklist item:', err);
      // Fallback local state if network or backend issue
      const localItem: EventChecklistItem = {
        id: `CHK-${Date.now().toString().slice(-4)}`,
        eventRef: selectedEvent.bookingRef,
        phase: newFloorChecklistPhase,
        taskName: task,
        isCompleted: false,
        notes: newFloorChecklistNotes.trim(),
      };
      setLiveFloorChecklists((prev) => [...prev, localItem]);
      setNewFloorChecklistTask('');
      setNewFloorChecklistNotes('');
    } finally {
      setIsSubmittingChecklist(false);
    }
  };

  const handleToggleLiveFloorChecklist = async (item: EventChecklistItem) => {
    try {
      const updated = await checklistsApi.toggle(item.id, 'Manager');
      setLiveFloorChecklists((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, isCompleted: updated.isCompleted, completedBy: updated.completedBy } : c))
      );
    } catch (err) {
      // Toggle locally
      setLiveFloorChecklists((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, isCompleted: !c.isCompleted } : c))
      );
    }
  };

  const handleDeleteLiveFloorChecklist = async (id: string) => {
    try {
      await checklistsApi.delete(id);
      setLiveFloorChecklists((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setLiveFloorChecklists((prev) => prev.filter((c) => c.id !== id));
    }
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

  const handleAddClosingExtra = () => {
    const title = newExtraTitle.trim();
    const price = parseFloat(newExtraPrice);
    if (!title || isNaN(price) || price <= 0) {
      alert('Please enter a valid extra service title and positive price.');
      return;
    }
    setClosingExtraServices((prev) => [
      ...prev,
      {
        id: `SRV-${Date.now().toString().slice(-4)}`,
        title,
        price,
        category: newExtraCategory,
        notes: newExtraNotes.trim(),
      },
    ]);
    setNewExtraTitle('');
    setNewExtraPrice('');
    setNewExtraNotes('');
  };

  const handleAddClosingDamage = () => {
    const item = newDamageItem.trim();
    const amount = parseFloat(newDamageAmount);
    if (!item || isNaN(amount) || amount <= 0) {
      alert('Please enter a damaged item description and penalty amount.');
      return;
    }
    setClosingDamages((prev) => [
      ...prev,
      {
        id: `DMG-${Date.now().toString().slice(-4)}`,
        item,
        amount,
        deductionType: newDamageDeduction,
        notes: newDamageNotes.trim(),
      },
    ]);
    setNewDamageItem('');
    setNewDamageAmount('');
    setNewDamageNotes('');
  };

  const handleExecuteEventClosing = async () => {
    if (!selectedEvent) return;
    const allChecked = closingChecklist.every((c) => c.done);
    const uncompletedFloorTasks = liveFloorChecklists.filter((c) => !c.isCompleted);

    if (!allChecked || uncompletedFloorTasks.length > 0) {
      let warning = '';
      if (!allChecked && uncompletedFloorTasks.length > 0) {
        warning = `There are ${uncompletedFloorTasks.length} pending live floor task(s) and operational handover items still unmarked. Are you sure you want to conclude and close this event now?`;
      } else if (uncompletedFloorTasks.length > 0) {
        warning = `There are ${uncompletedFloorTasks.length} uncompleted live floor checklist task(s) (e.g. "${uncompletedFloorTasks[0].taskName}"). Are you sure you want to conclude and close this event now?`;
      } else {
        warning = 'Not all handover checklist items are marked done. Are you sure you want to conclude and close this event now?';
      }

      if (!confirm(warning)) {
        return;
      }
    }

    try {
      setIsClosingSubmitting(true);
      const res = await bookingsApi.closeEvent(String(selectedEvent.id), {
        extraServices: closingExtraServices.map((s) => ({
          title: s.title,
          price: s.price,
          category: s.category,
          notes: s.notes,
        })),
        damages: closingDamages.map((d) => ({
          item: d.item,
          amount: d.amount,
          deductionType: d.deductionType,
          notes: d.notes,
        })),
        notes: closingNotes,
      });

      // Remove closed/concluded event from active list & release the hall on calendar
      setActiveEvents((prev) => {
        const remainingEvents = prev.filter((e) => e.id !== selectedEvent.id);
        if (remainingEvents.length > 0) {
          setSelectedEventId(remainingEvents[0].id);
        } else {
          setSelectedEventId('');
        }
        return remainingEvents;
      });

      // Broadcast event closed to release calendar and synchronize other views
      window.dispatchEvent(
        new CustomEvent('event_concluded', {
          detail: { bookingId: String(selectedEvent.id), bookingRef: selectedEvent.bookingRef },
        })
      );
      window.dispatchEvent(
        new CustomEvent('booking_updated', {
          detail: { bookingId: String(selectedEvent.id), status: 'Completed', operationalStatus: 'Event Concluded' },
        })
      );

      // Prepare settlement slip
      const inv = res?.invoice || {};
      setSettlementSlipData({
        event: selectedEvent,
        invoice: inv,
        booking: res?.booking || selectedEvent,
        closingExtras: closingExtraServices,
        closingDamages: closingDamages,
        timestamp: new Date().toLocaleString(),
      });

      // Clear closing form
      setClosingExtraServices([]);
      setClosingDamages([]);
      setClosingNotes('');
      alert('Event successfully concluded! Operational status marked as Concluded and final invoice updated.');
    } catch (err: any) {
      console.error('Failed to conclude event:', err);
      alert(err.message || 'Error concluding event. Please check inputs.');
    } finally {
      setIsClosingSubmitting(false);
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
    { id: 'event-closing', label: 'Event Closing & Settlement', icon: Flag },
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
          {activeTab === 'seating' && (() => {
            const guestTotal = Number(selectedEvent?.guestCount) || 150;
            const personsPerTable = Number(selectedEvent?.personsPerTable) || 10;
            const exactTablesCount = Math.max(1, Math.ceil(guestTotal / personsPerTable));
            const vipList: number[] = Array.isArray(selectedEvent?.vipTables) ? selectedEvent.vipTables : [1, 2];

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Expected Guests
                      </span>
                      <Users className="w-4 h-4 text-teal-700" />
                    </div>
                    <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
                      {guestTotal}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Guest Headcount</p>
                  </div>

                  <div className="rounded-lg border border-teal-200 bg-teal-50/40 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                        Persons / Table
                      </span>
                      <Users className="w-4 h-4 text-teal-700" />
                    </div>
                    <div className="mt-1.5 flex items-center gap-1">
                      {[6, 8, 10, 12].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleUpdatePersonsPerTableECC(preset)}
                          className={`px-2 py-1 text-xs font-bold rounded border transition-all cursor-pointer ${
                            personsPerTable === preset
                              ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                          title={`Set ${preset} persons per table`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-teal-700/80 mt-1.5 font-medium">
                      Current: <span className="font-bold">{personsPerTable} seats</span> per table
                    </p>
                  </div>

                  <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-teal-900 font-bold">
                        Exact Table Count
                      </span>
                      <Grid className="w-4 h-4 text-teal-700" />
                    </div>
                    <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-teal-900">
                      {exactTablesCount} Tables
                    </p>
                    <p className="text-[11px] text-teal-700 font-medium mt-0.5">
                      {guestTotal} ÷ {personsPerTable} guests/table
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Arrangement
                      </span>
                      <Sparkles className="w-4 h-4 text-teal-700" />
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-900 truncate">
                      {selectedEvent?.seatingArrangement || 'Round Tables'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Mgr: {selectedEvent?.assignedManager || 'Manager'}
                    </p>
                  </div>
                </div>

                {/* Visual Floor Grid of Exact Tables */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
                    <div className="flex items-center gap-2">
                      <Grid className="w-4 h-4 text-teal-700" />
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>Floor Seating Map ({exactTablesCount} Banquet Tables)</span>
                        {vipList.length > 0 && (
                          <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1 font-mono">
                            <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
                            {vipList.length} VIP Tables
                          </span>
                        )}
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500">
                      💡 Click any table to toggle VIP / Regular · {personsPerTable} seats/table
                    </span>
                  </div>

                  {/* Table Grid (Limited to 12 when collapsed, scrollable when expanded) */}
                  <div
                    className={
                      showAllTablesInECC
                        ? 'max-h-[460px] overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3'
                        : 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3'
                    }
                  >
                    {(showAllTablesInECC
                      ? Array.from({ length: exactTablesCount })
                      : Array.from({ length: Math.min(12, exactTablesCount) })
                    ).map((_, idx) => {
                      const tableNum = idx + 1;
                      const isVIP = vipList.includes(tableNum);
                      const isLast = tableNum === exactTablesCount;
                      const remainder = guestTotal % personsPerTable;
                      const seats = isLast && remainder > 0 ? remainder : personsPerTable;

                      return (
                        <div
                          key={tableNum}
                          onClick={() => handleToggleVipControlCenter(tableNum)}
                          className={`rounded-lg border p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none shadow-2xs hover:shadow-xs ${
                            isVIP
                              ? 'border-amber-300 ring-2 ring-amber-400/30 bg-amber-50 text-amber-900 hover:bg-amber-100/70'
                              : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-800'
                          }`}
                          title="Click to toggle VIP / Regular designation"
                        >
                          <div className="flex items-center gap-1 text-xs font-bold leading-tight">
                            {isVIP ? (
                              <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0" />
                            ) : (
                              <Star className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span>{isVIP ? `VIP T-${tableNum}` : `Table ${tableNum}`}</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 mt-1">
                            {seats} seats
                          </span>
                          <span
                            className={`mt-1.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                              isVIP
                                ? 'bg-amber-200/80 text-amber-900'
                                : 'bg-slate-200/70 text-slate-600'
                            }`}
                          >
                            {isVIP ? 'VIP' : 'Regular'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Show More / Show Less Controls */}
                  {exactTablesCount > 12 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {!showAllTablesInECC ? (
                        <button
                          type="button"
                          onClick={() => setShowAllTablesInECC(true)}
                          className="w-full py-2.5 px-4 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                        >
                          <ChevronDown className="w-4 h-4" />
                          Show More Tables ({exactTablesCount - 12} hidden) · Enable Scroll
                        </button>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-500">
                            Showing all {exactTablesCount} banquet tables (Scroll view enabled)
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowAllTablesInECC(false)}
                            className="py-1 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                            Show Less
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

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

          {/* TAB 4: LIVE FLOOR CHANGES & OPERATIONAL CHECKLISTS */}
          {activeTab === 'floor-changes' && (
            <div className="space-y-6">
              {/* Floor Checklist Section */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-teal-700" />
                      Live Floor Operations Checklist
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Assign and check off real-time tasks. Any tasks added here will directly reflect on the Event Closing page for final audit.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    <span>
                      {liveFloorChecklists.filter((c) => c.isCompleted).length} / {liveFloorChecklists.length} Done
                    </span>
                  </div>
                </div>

                {/* Add New Checklist Task Form */}
                <form
                  onSubmit={handleAddLiveFloorChecklist}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80"
                >
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Phase
                    </label>
                    <select
                      value={newFloorChecklistPhase}
                      onChange={(e: any) => setNewFloorChecklistPhase(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-teal-700 focus:outline-none"
                    >
                      <option value="Pre-Event Setup">Pre-Event Setup</option>
                      <option value="During Event">During Event</option>
                      <option value="Post-Event / Wrap-up">Post-Event / Wrap-up</option>
                    </select>
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Task Description *
                    </label>
                    <input
                      type="text"
                      value={newFloorChecklistTask}
                      onChange={(e) => setNewFloorChecklistTask(e.target.value)}
                      placeholder='e.g., "VIP Buffet warmers lit", "AC set to 22C", "Extra cutlery placed"'
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3 flex items-end">
                    <button
                      type="submit"
                      disabled={isSubmittingChecklist || !newFloorChecklistTask.trim()}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Task
                    </button>
                  </div>
                </form>

                {/* Checklist items list */}
                {liveFloorChecklists.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 py-8 px-4 text-center">
                    <ClipboardList className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">
                      No live checklist tasks added for this event yet.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Add operational tasks above to track floor execution and ensure full handover at closing.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {liveFloorChecklists.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                          task.isCompleted
                            ? 'bg-emerald-50/40 border-emerald-200/80 text-emerald-900'
                            : 'bg-white border-slate-200 hover:border-teal-600/40 text-slate-800'
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={task.isCompleted}
                            onChange={() => handleToggleLiveFloorChecklist(task)}
                            className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-semibold truncate ${
                                  task.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {task.taskName}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-md font-medium shrink-0 ${
                                  task.phase === 'Pre-Event Setup'
                                    ? 'bg-amber-100 text-amber-800'
                                    : task.phase === 'During Event'
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-indigo-50 text-indigo-800'
                                }`}
                              >
                                {task.phase}
                              </span>
                            </div>
                            {task.notes && (
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{task.notes}</p>
                            )}
                          </div>
                        </label>

                        <div className="flex items-center gap-2 shrink-0">
                          {task.isCompleted ? (
                            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                              Done
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                              Pending
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteLiveFloorChecklist(task.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                            title="Delete task"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sudden Floor Adjustments & Logs Section */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-700" />
                    Sudden Floor Adjustments &amp; Notes
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Log fast floor notes such as extra tables added, shift adjustments, or unexpected changes.
                  </p>
                </div>

                <form
                  onSubmit={handleLogFloorChange}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                >
                  <input
                    type="text"
                    value={floorChangeInput}
                    onChange={(e) => setFloorChangeInput(e.target.value)}
                    placeholder='Log sudden floor change (e.g., "Add 2 extra tables for bride family")'
                    className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Log Note
                  </button>
                </form>

                {floorChanges.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 px-6 text-center">
                    <ClipboardList className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">
                      No sudden floor change notes logged yet.
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
            </div>
          )}

          {/* TAB 5: EVENT CLOSING & SETTLEMENT */}
          {activeTab === 'event-closing' && (
            <div className="space-y-6">
              {/* Event Closing Header Banner */}
              <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-teal-700 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                      Operational Status
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {selectedEvent?.operationalStatus || 'In Progress'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    Conclude the event at departure. Review the operational checklist, bill additional during-event services or damages, and generate the final client settlement slip.
                  </p>
                </div>
                {selectedEvent?.operationalStatus === 'Event Concluded' && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Event Already Concluded
                  </div>
                )}
              </div>

              {/* 1. Operational Handover & Live Floor Checklists */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-teal-700" />
                      1. Operational Handover &amp; Live Floor Tasks Verification
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verify standard venue clearance and check off all live floor tasks added during the event.
                    </p>
                  </div>

                  {/* Summary badge */}
                  {(() => {
                    const totalTasks = closingChecklist.length + liveFloorChecklists.length;
                    const completedTasks =
                      closingChecklist.filter((c) => c.done).length +
                      liveFloorChecklists.filter((c) => c.isCompleted).length;
                    const isAllDone = totalTasks > 0 && completedTasks === totalTasks;

                    return (
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                          isAllDone
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {isAllDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                        )}
                        <span>
                          {completedTasks} / {totalTasks} Tasks Completed
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Standard Venue Clearance Items */}
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Standard Handover Items:
                  </h5>
                  <div className="space-y-2">
                    {closingChecklist.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() =>
                            setClosingChecklist((prev) =>
                              prev.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c))
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700 cursor-pointer"
                        />
                        <span className={`text-sm ${item.done ? 'line-through text-slate-400 font-normal' : 'text-slate-800 font-medium'}`}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Live Floor Tasks Recorded on Live Floor Changes Tab */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                      Live Floor Tasks (From Floor Changes Tab):
                    </h5>
                    <button
                      type="button"
                      onClick={() => setActiveTab('floor-changes')}
                      className="text-xs text-teal-700 hover:underline font-medium inline-flex items-center gap-1"
                    >
                      + Add More Floor Tasks
                    </button>
                  </div>

                  {liveFloorChecklists.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-lg text-center border border-dashed border-slate-200">
                      <p className="text-xs text-slate-500">
                        No live floor tasks recorded on the Floor Changes tab yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {liveFloorChecklists.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border transition-all ${
                            task.isCompleted
                              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                              : 'bg-amber-50/40 border-amber-200 text-amber-950'
                          }`}
                        >
                          <label className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={task.isCompleted}
                              onChange={() => handleToggleLiveFloorChecklist(task)}
                              className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700 cursor-pointer shrink-0"
                            />
                            <div className="min-w-0">
                              <span
                                className={`text-sm font-semibold truncate ${
                                  task.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {task.taskName}
                              </span>
                              <span className="ml-2 text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                                {task.phase}
                              </span>
                              {task.notes && (
                                <p className="text-xs text-slate-500 mt-0.5">{task.notes}</p>
                              )}
                            </div>
                          </label>

                          <div className="shrink-0 flex items-center gap-2">
                            {task.isCompleted ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                Done
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Additional Services Provided During Event */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-teal-700" />
                    2. Additional Services &amp; Extras During Event
                  </h4>
                  <span className="text-xs text-slate-500">
                    Added to client's final invoice
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Service title (e.g., Extra 50 Naan, Extra 1 Hr Overtime)"
                      value={newExtraTitle}
                      onChange={(e) => setNewExtraTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      value={newExtraCategory}
                      onChange={(e) => setNewExtraCategory(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-teal-700 outline-none"
                    >
                      <option value="Extra Service">Extra Service</option>
                      <option value="Catering Extra">Catering Extra</option>
                      <option value="Overtime">Hall Overtime</option>
                      <option value="Decor/Stage">Decor Addition</option>
                      <option value="Sound/DJ">Sound / AV</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      placeholder="Price (Rs.)"
                      value={newExtraPrice}
                      onChange={(e) => setNewExtraPrice(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddClosingExtra}
                      className="w-full rounded-lg bg-teal-700 hover:bg-teal-800 px-3 py-2 text-sm font-semibold text-white transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add Extra
                    </button>
                  </div>
                </div>

                {closingExtraServices.length > 0 && (
                  <div className="mt-3 overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                        <tr>
                          <th className="py-2 px-3">Service</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3 font-mono">Amount</th>
                          <th className="py-2 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {closingExtraServices.map((srv) => (
                          <tr key={srv.id}>
                            <td className="py-2 px-3 font-medium text-slate-800">{srv.title}</td>
                            <td className="py-2 px-3 text-slate-500">{srv.category}</td>
                            <td className="py-2 px-3 font-mono font-bold text-teal-800">Rs. {srv.price.toLocaleString()}</td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setClosingExtraServices((prev) => prev.filter((s) => s.id !== srv.id))}
                                className="text-rose-600 hover:text-rose-800 font-bold"
                              >
                                &times;
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 3. Venue Damage Charges (If Any) */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    3. Damage Penalties (If Any)
                  </h4>
                  <span className="text-xs text-slate-500">
                    Optionally billed to invoice or cut from security deposit
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Damaged item (e.g., 2 Chandelier Bulbs, Sofa Stain)"
                      value={newDamageItem}
                      onChange={(e) => setNewDamageItem(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      value={newDamageDeduction}
                      onChange={(e) => setNewDamageDeduction(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-teal-700 outline-none"
                    >
                      <option value="invoice">Add to Final Invoice Bill</option>
                      <option value="security_deposit">Deduct from Security Deposit</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="number"
                      placeholder="Penalty Amount (Rs.)"
                      value={newDamageAmount}
                      onChange={(e) => setNewDamageAmount(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-teal-700 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddClosingDamage}
                      className="w-full rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-2 text-sm font-semibold text-white transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Record Damage
                    </button>
                  </div>
                </div>

                {closingDamages.length > 0 && (
                  <div className="mt-3 overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                        <tr>
                          <th className="py-2 px-3">Damage Description</th>
                          <th className="py-2 px-3">Deduction Route</th>
                          <th className="py-2 px-3 font-mono">Amount</th>
                          <th className="py-2 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {closingDamages.map((dmg) => (
                          <tr key={dmg.id}>
                            <td className="py-2 px-3 font-medium text-slate-800">{dmg.item}</td>
                            <td className="py-2 px-3 text-slate-500">
                              {dmg.deductionType === 'invoice' ? 'Added to Client Invoice' : 'Deducted from Security Deposit'}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-rose-600">Rs. {dmg.amount.toLocaleString()}</td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setClosingDamages((prev) => prev.filter((d) => d.id !== dmg.id))}
                                className="text-rose-600 hover:text-rose-800 font-bold"
                              >
                                &times;
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 4. Manager Closing Sign-off Notes */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
                <label className="text-sm font-bold text-slate-900 block">
                  4. Manager Closing Sign-Off Notes
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="e.g., Event concluded smoothly without major incidents. Extra guests accommodated with 2 additional tables."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-teal-700 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500">
                  Concluding this event will mark its operational status as <strong>Event Concluded</strong> and update the final accounts invoice.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isClosingSubmitting}
                    onClick={handleExecuteEventClosing}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-800 hover:bg-teal-900 disabled:opacity-50 px-5 py-2.5 text-sm font-bold text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {isClosingSubmitting ? 'Closing Event...' : 'Done & Conclude Event Successfully'}
                  </button>
                </div>
              </div>
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

      {/* Final Event Settlement Slip Modal */}
      {settlementSlipData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="printable-settlement-area w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Header: Royal Letterhead */}
            <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-900 p-6 text-white flex items-start justify-between border-b-2 border-amber-400/40">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-900/90 text-amber-400 flex items-center justify-center border border-amber-400/40 shadow-xs shrink-0">
                  <Crown className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight text-white font-['Playfair_Display','Cormorant_Garamond',serif]">
                      Mehar Palace Marquee
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                      Official Statement
                    </span>
                  </div>
                  <p className="text-xs text-teal-100/90 mt-1">
                    Main Canal Road, near PSO Petrol Pump, Fateh Garh Mughalpura, Lahore, 54000
                  </p>
                  <p className="text-[11px] text-amber-300/90 font-mono mt-0.5">
                    Phone: <strong className="text-white">0321 1000806</strong> &bull; Event Operations &amp; Billing Reconciliation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettlementSlipData(null)}
                className="no-print text-white/70 hover:text-white p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 text-sm">
              {/* Event info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Booking Ref</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{settlementSlipData.invoice.bookingRef || settlementSlipData.event.bookingRef}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Customer</span>
                  <span className="font-bold text-slate-800 text-sm">{settlementSlipData.invoice.customerName || settlementSlipData.event.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Hall &amp; Guests</span>
                  <span className="font-bold text-slate-800">{settlementSlipData.event.hallName} ({settlementSlipData.event.guestCount || 100} guests)</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Concluded At</span>
                  <span className="font-medium text-slate-700">{settlementSlipData.timestamp}</span>
                </div>
              </div>

              {/* Settlement table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Item / Description</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4 text-right font-mono">Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr>
                      <td className="py-2.5 px-4 font-semibold">Initial Base Contract (Hall + Menu + Package)</td>
                      <td className="py-2.5 px-4 text-slate-500">Contract Base</td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold">
                        Rs. {(Number(settlementSlipData.event.bookingRevenue) || 0).toLocaleString()}
                      </td>
                    </tr>
                    {settlementSlipData.closingExtras && settlementSlipData.closingExtras.map((s: any, idx: number) => (
                      <tr key={`extra-${idx}`} className="bg-teal-50/40">
                        <td className="py-2 px-4 font-medium text-teal-950">+ {s.title}</td>
                        <td className="py-2 px-4 text-teal-800">{s.category}</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-teal-800">
                          Rs. {Number(s.price).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {settlementSlipData.closingDamages && settlementSlipData.closingDamages.filter((d: any) => d.deductionType === 'invoice').map((d: any, idx: number) => (
                      <tr key={`dmg-${idx}`} className="bg-rose-50/40">
                        <td className="py-2 px-4 font-medium text-rose-950">+ Damage Penalty: {d.item}</td>
                        <td className="py-2 px-4 text-rose-800">Billed to Invoice</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-rose-700">
                          Rs. {Number(d.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {settlementSlipData.closingDamages && settlementSlipData.closingDamages.filter((d: any) => d.deductionType === 'security_deposit').map((d: any, idx: number) => (
                      <tr key={`dmg-sec-${idx}`} className="bg-amber-50/40">
                        <td className="py-2 px-4 font-medium text-amber-950">&bull; Damage: {d.item} (Deducted from Security Deposit)</td>
                        <td className="py-2 px-4 text-amber-800">Security Deposit Route</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-amber-700">
                          -Rs. {Number(d.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial summary calculations */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono text-sm">
                <div className="flex justify-between text-slate-700 font-semibold">
                  <span>Gross Final Contract Total:</span>
                  <span className="text-base text-slate-950 font-bold">
                    Rs. {(Number(settlementSlipData.invoice.totalAmount) || Number(settlementSlipData.event.bookingRevenue) || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Client Paid So Far (Advance &amp; Collections):</span>
                  <span>
                    - Rs. {(Number(settlementSlipData.invoice.paidAmount) || Number(settlementSlipData.event.advancePayment) || 0).toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between text-base font-bold text-rose-600">
                  <span>Remaining Payable Balance:</span>
                  <span className={`text-lg ${(Number(settlementSlipData.invoice.remainingBalance) || 0) <= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {(Number(settlementSlipData.invoice.remainingBalance) || 0) <= 0
                      ? 'Rs. 0 (PAID / CLEAR)'
                      : `Rs. ${(Number(settlementSlipData.invoice.remainingBalance) || 0).toLocaleString()}`}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-xs text-slate-500">
                <div className="border-t border-dashed border-slate-400 pt-2 text-center">
                  <p className="font-semibold text-slate-700">Manager Sign &amp; Stamp</p>
                  <p className="text-[10px]">Operations &amp; Floor Authority</p>
                </div>
                <div className="border-t border-dashed border-slate-400 pt-2 text-center">
                  <p className="font-semibold text-slate-700">Client Signature</p>
                  <p className="text-[10px]">Settlement Acknowledged</p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" /> Print Settlement Slip
              </button>
              <button
                type="button"
                onClick={() => setSettlementSlipData(null)}
                className="rounded-lg bg-teal-800 hover:bg-teal-900 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
