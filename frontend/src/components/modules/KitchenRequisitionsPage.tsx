import React, { useMemo, useState, useEffect } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Package,
  Plus,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
import { SEED_ASSIGNED_EVENTS } from '../../data/seedData';
import { bookingsApi, requisitionsApi, AssetRequisitionItem } from '../../api/client';

interface UpcomingEventOption {
  id: string;
  bookingRef: string;
  hallName: string;
  customerName: string;
  label: string;
  guestCount: number;
}

interface IngredientRequirementRow {
  id: string;
  ingredientName: string;
  requiredQty: string;
  unit: string;
  estimatedCost: string;
}

const QTY_UNITS = ['kg', 'g', 'liters', 'ml', 'pcs', 'packs', 'boxes'];

export const KitchenRequisitionsPage: React.FC = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [submittedRequisitions, setSubmittedRequisitions] = useState<AssetRequisitionItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [rows, setRows] = useState<IngredientRequirementRow[]>([
    {
      id: 'REQ-ROW-1',
      ingredientName: 'Fresh Mutton',
      requiredQty: '65',
      unit: 'kg',
      estimatedCost: '130000',
    },
    {
      id: 'REQ-ROW-2',
      ingredientName: 'Basmati Sella Rice',
      requiredQty: '80',
      unit: 'kg',
      estimatedCost: '28000',
    },
  ]);

  const loadEventRequisitions = async (eventRef: string) => {
    if (!eventRef) return;
    try {
      const data = await requisitionsApi.list(eventRef);
      setSubmittedRequisitions(data || []);
    } catch (err) {
      console.warn('Failed to load requisitions for event:', err);
    }
  };

  useEffect(() => {
    bookingsApi
      .list()
      .then((data) => {
        if (data && data.length > 0) {
          const activeOnly = data.filter((b: any) => {
            if (b.status === 'Cancelled' || b.status === 'Rejected' || b.status === 'Completed') return false;
            const op = (b.operationalStatus || b.operational_status || '').toLowerCase();
            if (op.includes('concluded') || op.includes('completed') || op.includes('closed')) return false;
            return true;
          });
          const mapped = activeOnly.map((b: any) => ({
            id: String(b.id),
            bookingRef: b.bookingRef || `BK-${b.id}`,
            hallName: b.hallName || 'Main Hall',
            customerName: b.customerName || 'Client',
            label: `${b.bookingRef || `BK-${b.id}`} — ${b.customerName || 'Client'} (${b.hallName} • ${b.date})`,
            guestCount: Number(b.guestCount) || 100,
          }));
          setUpcomingEvents(mapped);
          if (mapped.length > 0) {
            setSelectedEventId(mapped[0].id);
            loadEventRequisitions(mapped[0].bookingRef);
          } else {
            setSelectedEventId('');
          }
        } else {
          setUpcomingEvents([]);
          setSelectedEventId('');
        }
      })
      .catch(() => {});
  }, []);

  const selectedEvent = useMemo(
    () => upcomingEvents.find((ev) => ev.id === selectedEventId) ?? null,
    [upcomingEvents, selectedEventId]
  );

  useEffect(() => {
    if (selectedEvent?.bookingRef) {
      loadEventRequisitions(selectedEvent.bookingRef);
    }
  }, [selectedEvent?.bookingRef]);

  const totalEstimatedCost = useMemo(() => {
    if (rows.length === 0) return null;
    return rows.reduce((sum, r) => {
      const val = parseFloat(r.estimatedCost);
      return sum + (Number.isNaN(val) ? 0 : val);
    }, 0);
  }, [rows]);

  const handleAddRow = () => {
    setIsSubmitted(false);
    setRows((prev) => [
      ...prev,
      {
        id: `REQ-ROW-${Date.now()}-${prev.length}`,
        ingredientName: '',
        requiredQty: '',
        unit: 'kg',
        estimatedCost: '',
      },
    ]);
  };

  const handleUpdateRow = (
    id: string,
    field: keyof Omit<IngredientRequirementRow, 'id'>,
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleRemoveRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSubmitRequisition = async () => {
    if (rows.length === 0 || !selectedEvent) return;
    setIsSubmitting(true);
    try {
      for (const row of rows) {
        if (!row.ingredientName.trim()) continue;
        await requisitionsApi.create({
          eventRef: selectedEvent.bookingRef,
          hallName: selectedEvent.hallName,
          itemName: row.ingredientName.trim(),
          requestedQuantity: parseFloat(row.requiredQty) || 1,
          unit: row.unit,
          estimatedCost: parseFloat(row.estimatedCost) || 0,
          requestedBy: 'Kitchen Chef',
          notes: `Estimated Cost: Rs. ${row.estimatedCost || '0'}`,
        });
      }
      setIsSubmitted(true);
      await loadEventRequisitions(selectedEvent.bookingRef);
    } catch (err) {
      console.error('Failed to submit requisition:', err);
      alert('Error submitting requisition to manager. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Header & Upcoming Event Selector */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
            Kitchen Event Requisitions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Calculate raw ingredient requirements for upcoming events and forward requisitions directly to the Manager for review &amp; approval.
          </p>
        </div>

        <div className="w-full lg:w-96 shrink-0">
          <label
            htmlFor="upcoming-event-select"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
          >
            Select Upcoming Event
          </label>
          <select
            id="upcoming-event-select"
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setIsSubmitted(false);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
          >
            <option value="">Choose an upcoming event...</option>
            {upcomingEvents.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Section: Ingredient Calculator */}
      <section className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        {/* Calculator Summary Bar */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-teal-700" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Expected Guest Count
                </p>
                <p className="text-lg font-bold font-mono tabular-nums text-slate-900">
                  {selectedEvent ? selectedEvent.guestCount : '—'}
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Total Estimated Cost
              </p>
              <p className="text-lg font-bold font-mono tabular-nums text-teal-700">
                {totalEstimatedCost === null
                  ? 'Rs. 0'
                  : `Rs. ${totalEstimatedCost.toLocaleString()}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-teal-700 bg-white hover:bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Ingredient Requirement
          </button>
        </div>

        {/* Ingredient Requirements Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Ingredient Name
                </th>
                <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Required Qty
                </th>
                <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Estimated Cost (Rs.)
                </th>
                <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 px-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                        <ClipboardCheck className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        No ingredient requirements added yet.
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Click &ldquo;+ Add Ingredient Requirement&rdquo; to build your event requisition list.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-5">
                      <input
                        type="text"
                        value={row.ingredientName}
                        onChange={(e) =>
                          handleUpdateRow(row.id, 'ingredientName', e.target.value)
                        }
                        placeholder="e.g. Fresh Chicken / Tomatoes"
                        disabled={isSubmitted}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={row.requiredQty}
                          onChange={(e) =>
                            handleUpdateRow(row.id, 'requiredQty', e.target.value)
                          }
                          placeholder="e.g. 50"
                          disabled={isSubmitted}
                          className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 disabled:bg-slate-50 disabled:text-slate-500"
                        />
                        <select
                          aria-label="Unit"
                          value={row.unit}
                          onChange={(e) =>
                            handleUpdateRow(row.id, 'unit', e.target.value)
                          }
                          disabled={isSubmitted}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 disabled:bg-slate-50"
                        >
                          {QTY_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={row.estimatedCost}
                        onChange={(e) =>
                          handleUpdateRow(row.id, 'estimatedCost', e.target.value)
                        }
                        placeholder="e.g. 45000"
                        disabled={isSubmitted}
                        className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        disabled={isSubmitted}
                        aria-label="Remove ingredient"
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Submit Section */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {isSubmitted ? (
          <div className="flex flex-wrap items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-mono font-semibold text-amber-800">
                    Forwarded to Manager &bull; Pending Review
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Your ingredient requisition has been saved and dispatched to the Manager Event Control Center.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setRows([]);
                setIsSubmitted(false);
              }}
              className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors cursor-pointer"
            >
              + Create Another Requisition
            </button>
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Ready to submit ingredient requisition?
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Once submitted, the Manager will see and approve the items in the Event Control Center.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubmitRequisition}
              disabled={rows.length === 0 || isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Sending to Manager...' : 'Send Requisition to Manager for Approval'}
            </button>
          </>
        )}
      </div>

      {/* Submitted Requisitions Status Tracker */}
      {submittedRequisitions.length > 0 && (
        <section className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-700" />
                Live Status of Requisitions Sent to Manager ({selectedEvent?.bookingRef})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track whether the Manager has approved or issued items requested by Kitchen
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {submittedRequisitions.length} item{submittedRequisitions.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-5">Ref</th>
                  <th className="py-3 px-5">Item Name</th>
                  <th className="py-3 px-5">Qty Requested</th>
                  <th className="py-3 px-5">Qty Issued</th>
                  <th className="py-3 px-5">Estimated Cost</th>
                  <th className="py-3 px-5 text-right">Manager Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {submittedRequisitions.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-5 font-mono text-xs text-slate-500 font-semibold">
                      {req.requisitionRef}
                    </td>
                    <td className="py-3 px-5 font-medium text-slate-900">
                      {req.itemName}
                    </td>
                    <td className="py-3 px-5 font-mono">
                      {req.requestedQuantity} {req.unit || 'units'}
                    </td>
                    <td className="py-3 px-5 font-mono">
                      {req.issuedQuantity || 0} {req.unit || 'units'}
                    </td>
                    <td className="py-3 px-5 font-mono text-teal-800">
                      Rs. {Number(req.estimatedCost || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                          req.status === 'Approved' || req.status === 'Issued'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : req.status === 'Shortage'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {req.status === 'Approved' ? 'Approved by Manager' : req.status === 'Issued' ? 'Issued' : 'Pending Manager Review'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};