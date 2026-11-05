import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Building2,
  CalendarDays,
  Clock,
  ArrowRight,
  ShieldCheck,
  Trash2,
  PackageCheck,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { Booking, InventoryItem } from '../../types';
import { bookingsApi, inventoryApi, requisitionsApi, AssetRequisitionItem } from '../../api/client';
import { formatTo12Hour } from '../../utils/timeFormat';

interface ManagerAssetRequisitionsProps {
  initialBooking?: Booking | null;
}

export const ManagerAssetRequisitions: React.FC<ManagerAssetRequisitionsProps> = ({ initialBooking }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingRef, setSelectedBookingRef] = useState<string>(initialBooking?.bookingRef || '');
  const [requisitions, setRequisitions] = useState<AssetRequisitionItem[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Requisition Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [customItemName, setCustomItemName] = useState('');
  const [requestedQty, setRequestedQty] = useState(1);
  const [reqNotes, setReqNotes] = useState('');

  // Return Modal
  const [returnTarget, setReturnTarget] = useState<AssetRequisitionItem | null>(null);
  const [returnQty, setReturnQty] = useState(1);
  const [damageNotes, setDamageNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial Load
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [bookingsData, invData] = await Promise.all([
          bookingsApi.list(),
          inventoryApi.list(),
        ]);
        const activeBookings = Array.isArray(bookingsData) ? bookingsData : [];
        setBookings(activeBookings);
        setInventoryList(Array.isArray(invData) ? invData : []);

        if (!selectedBookingRef && activeBookings.length > 0) {
          setSelectedBookingRef(activeBookings[0].bookingRef);
        }
      } catch (err) {
        console.error('Failed to load initial requisition data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load Requisitions for selected booking
  const loadRequisitions = async (ref: string) => {
    if (!ref) return;
    try {
      setLoading(true);
      const data = await requisitionsApi.list(ref);
      setRequisitions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load requisitions:', err);
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBookingRef) {
      loadRequisitions(selectedBookingRef);
    }
  }, [selectedBookingRef]);

  const activeBooking = useMemo(() => {
    return bookings.find((b) => b.bookingRef === selectedBookingRef) || null;
  }, [bookings, selectedBookingRef]);

  // Filtered Requisitions
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((r) => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.itemName.toLowerCase().includes(q);
        const matchRef = r.requisitionRef.toLowerCase().includes(q);
        const matchNotes = r.notes?.toLowerCase().includes(q);
        if (!matchName && !matchRef && !matchNotes) return false;
      }
      return true;
    });
  }, [requisitions, statusFilter, searchQuery]);

  // Metrics
  const totalRequested = requisitions.reduce((sum, r) => sum + r.requestedQuantity, 0);
  const totalIssued = requisitions.reduce((sum, r) => sum + r.issuedQuantity, 0);
  const totalReturned = requisitions.reduce((sum, r) => sum + r.returnedQuantity, 0);
  const shortageCount = requisitions.filter((r) => r.status === 'Shortage').length;

  // Actions
  const handleApproveIssue = async (item: AssetRequisitionItem) => {
    try {
      const updated = await requisitionsApi.approveIssue(item.id);
      setRequisitions((prev) => prev.map((r) => (r.id === item.id ? updated : r)));
      showToast(`Approved & issued ${item.itemName} (${item.requestedQuantity} units) to floor.`);
    } catch (err: any) {
      console.error('Failed to issue requisition:', err);
      showToast(err?.message || 'Error issuing items');
    }
  };

  const handleOpenReturnModal = (item: AssetRequisitionItem) => {
    setReturnTarget(item);
    setReturnQty(item.issuedQuantity || item.requestedQuantity);
    setDamageNotes('');
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTarget) return;

    try {
      const updated = await requisitionsApi.markReturned(returnTarget.id, returnQty, damageNotes);
      setRequisitions((prev) => prev.map((r) => (r.id === returnTarget.id ? updated : r)));
      setReturnTarget(null);
      showToast(`Returned ${returnQty} units of ${returnTarget.itemName}.`);
    } catch (err: any) {
      console.error('Failed to record return:', err);
      alert(err?.message || 'Error processing return');
    }
  };

  const handleDeleteRequisition = async (id: string, name: string) => {
    if (!window.confirm(`Delete requisition for ${name}?`)) return;
    try {
      await requisitionsApi.delete(id);
      setRequisitions((prev) => prev.filter((r) => r.id !== id));
      showToast(`Requisition deleted.`);
    } catch (err) {
      console.error('Failed to delete requisition:', err);
    }
  };

  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingRef) return;

    let itemName = customItemName.trim();
    let itemCode = '';
    let invItemId: number | undefined = undefined;

    if (selectedItemId) {
      const found = inventoryList.find((i) => String(i.id) === selectedItemId);
      if (found) {
        itemName = found.itemName;
        itemCode = found.itemCode || '';
        invItemId = Number(found.id);
      }
    }

    if (!itemName) {
      alert('Please choose an inventory item or enter custom name.');
      return;
    }

    try {
      const created = await requisitionsApi.create({
        eventRef: selectedBookingRef,
        hallName: activeBooking?.hallName || '',
        itemId: invItemId,
        itemCode: itemCode,
        itemName: itemName,
        requestedQuantity: requestedQty,
        notes: reqNotes.trim(),
        status: 'Requested',
      });
      setRequisitions((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setSelectedItemId('');
      setCustomItemName('');
      setRequestedQty(1);
      setReqNotes('');
      showToast(`Requisition filed for ${created.itemName} (${created.requestedQuantity} units).`);
    } catch (err: any) {
      console.error('Failed to create requisition:', err);
      alert(err?.message || 'Error creating requisition');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs font-semibold border border-slate-700 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Event Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[11px] font-bold uppercase tracking-wider">
              Warehouse Ops
            </span>
            <span className="text-xs text-slate-400 font-medium">Warehouse Asset Requisition</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Asset &amp; Inventory Requisition
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Requisition banquet chairs, stainless chafing dishes, audio-visual rigging, and track warehouse returns.
          </p>
        </div>

        {/* Event Selector Box */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-slate-300 mb-1">
              Select Active Event:
            </label>
            <select
              value={selectedBookingRef}
              onChange={(e) => setSelectedBookingRef(e.target.value)}
              className="px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-teal-500 min-w-[260px] cursor-pointer"
            >
              {bookings.map((b) => (
                <option key={b.bookingRef} value={b.bookingRef} className="bg-slate-900 text-white">
                  [{b.bookingRef}] {b.customerName} • {b.hallName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              disabled={!selectedBookingRef}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Requisition</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selected Event Context Pill */}
      {activeBooking && (
        <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-purple-400" />
              <strong className="text-white">{activeBooking.hallName}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-purple-400" />
              <span className="font-mono text-slate-200 font-semibold">{activeBooking.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="font-mono text-slate-200 font-semibold">
                {formatTo12Hour(activeBooking.time || activeBooking.slot)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Event Function:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-900/60 border border-purple-700/60 text-purple-200 font-bold text-[11px]">
              {activeBooking.eventType}
            </span>
          </div>
        </div>
      )}

      {/* Requisition Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-700/50 shadow-xl">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase block">
            Requested Assets
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-2 font-mono">
            {totalRequested}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Gross units requisitioned</span>
        </div>

        <div className="p-6 rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-700/50 shadow-xl">
          <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase block">
            Issued to Floor
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-2 font-mono">
            {totalIssued}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Currently deployed in hall</span>
        </div>

        <div className="p-6 rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-700/50 shadow-xl">
          <span className="text-xs font-semibold tracking-wider text-teal-400 uppercase block">
            Returned to Stock
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-teal-400 mt-2 font-mono">
            {totalReturned}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Restocked &amp; verified</span>
        </div>

        <div className="p-6 rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-700/50 shadow-xl">
          <span className="text-xs font-semibold tracking-wider text-rose-400 uppercase block">
            Shortage / Damage
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-rose-400 mt-2 font-mono">
            {shortageCount}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Flagged for deposit deduction</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/60 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['All', 'Requested', 'Issued', 'Returned', 'Shortage'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                  : 'bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search requisition items..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Requisitions Table */}
      <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-900/80 text-slate-400 uppercase tracking-wider font-bold text-[10px] font-mono">
                <th className="py-3 px-4">Requisition Ref</th>
                <th className="py-3 px-4">Item Name &amp; Code</th>
                <th className="py-3 px-4">Requested</th>
                <th className="py-3 px-4">Issued</th>
                <th className="py-3 px-4">Returned</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {filteredRequisitions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Layers className="w-10 h-10 mx-auto text-slate-500 mb-2" />
                    <p className="font-semibold text-slate-200">No Asset Requisitions Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click 'New Requisition' to request banquet furniture, chafing dishes, or audio visual equipment.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequisitions.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {item.requisitionRef}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div>{item.itemName}</div>
                        {item.itemCode && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.itemCode}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {item.requestedQuantity}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {item.issuedQuantity || '—'}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-teal-400">
                        {item.returnedQuantity || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                            item.status === 'Issued'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              : item.status === 'Returned'
                              ? 'bg-teal-500/10 text-teal-300 border-teal-500/20'
                              : item.status === 'Shortage'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/20 animate-pulse'
                              : item.status === 'Approved'
                              ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate text-[11px]">
                        {item.notes || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {item.status === 'Requested' || item.status === 'Approved' ? (
                            <button
                              type="button"
                              onClick={() => handleApproveIssue(item)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              Issue to Floor
                            </button>
                          ) : item.status === 'Issued' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenReturnModal(item)}
                              className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              Check-in Return
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => handleDeleteRequisition(item.id, item.itemName)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Requisition Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Requisition Physical Asset
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Request items from warehouse storage for [{selectedBookingRef}]
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequisition} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Choose Central Inventory Item
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => {
                    setSelectedItemId(e.target.value);
                    if (e.target.value) setCustomItemName('');
                  }}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-white">[Pick from Central Inventory Storage]</option>
                  {inventoryList.map((item) => (
                    <option key={item.id} value={item.id} className="bg-slate-900 text-white">
                      {item.itemName} ({item.itemCode || 'INV'}) • Available: {item.availableQuantity}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedItemId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Or Enter Custom Asset Item Name
                  </label>
                  <input
                    type="text"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder="e.g., Red Carpet Runner (50 ft)"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Requested Quantity <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={requestedQty}
                  onChange={(e) => setRequestedQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Placement / Staging Notes
                </label>
                <textarea
                  rows={2}
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="e.g., Stage backdrop, buffet line entrance"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return & Damage Modal */}
      {returnTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Restock &amp; Return Inspection
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Receiving {returnTarget.itemName} from {returnTarget.eventRef}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReturnTarget(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReturn} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Issued to Floor:</span>
                  <strong className="font-mono text-white">{returnTarget.issuedQuantity || returnTarget.requestedQuantity}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Returned Quantity in Good Condition
                </label>
                <input
                  type="number"
                  min="0"
                  max={returnTarget.issuedQuantity || returnTarget.requestedQuantity}
                  value={returnQty}
                  onChange={(e) => setReturnQty(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              {returnQty < (returnTarget.issuedQuantity || returnTarget.requestedQuantity) && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Shortage Detected: {(returnTarget.issuedQuantity || returnTarget.requestedQuantity) - returnQty} items missing/damaged.</span>
                  </div>
                  <p>
                    This shortage will be flagged for Security Deposit deduction under Task 3.5.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Damage / Shortage Inspection Notes
                </label>
                <textarea
                  rows={2}
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  placeholder="e.g., 2 chafing glass lids broken during buffet cleanup"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReturnTarget(null)}
                  className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  Confirm Check-in Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
