import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Plus,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
import { SEED_ASSIGNED_EVENTS } from '../../data/seedData';

interface UpcomingEventOption {
  id: string;
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
  const [upcomingEvents] = useState<UpcomingEventOption[]>(
    SEED_ASSIGNED_EVENTS.map((e) => ({
      id: e.id,
      label: `${e.customerName} (${e.hallName} — ${e.eventDate})`,
      guestCount: e.totalGuests,
    }))
  );
  const [selectedEventId, setSelectedEventId] = useState(SEED_ASSIGNED_EVENTS[0]?.id ?? '');
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
  const [isSubmitted, setIsSubmitted] = useState(false);

  const selectedEvent = useMemo(
    () => upcomingEvents.find((ev) => ev.id === selectedEventId) ?? null,
    [upcomingEvents, selectedEventId]
  );

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

  const handleSubmitRequisition = () => {
    if (rows.length === 0) return;
    setIsSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Header & Upcoming Event Selector */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
            Event Requisitions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Calculate raw ingredient requirements for upcoming events and send requisitions to the Manager.
          </p>
        </div>

        <div className="w-full lg:w-80 shrink-0">
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
            <option value="">
              {upcomingEvents.length === 0
                ? 'Select Upcoming Event ([--])'
                : 'Choose an upcoming event...'}
            </option>
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
                  {selectedEvent ? selectedEvent.guestCount : '[--]'}
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
                  ? 'Rs. [--]'
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
                        placeholder="[--]"
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
                          placeholder="[--]"
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
                        placeholder="[--]"
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
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-mono font-semibold text-amber-800">
                    [Pending Manager Approval]
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Your ingredient requisition ({rows.length} item{rows.length === 1 ? '' : 's'}) has been forwarded to the Manager.
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
              New Requisition
            </button>
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Ready to submit ingredient requisition?
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Once submitted, the Manager will review and approve the purchase request.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubmitRequisition}
              disabled={rows.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              Send Requisition to Manager for Approval
            </button>
          </>
        )}
      </div>
    </div>
  );
};
