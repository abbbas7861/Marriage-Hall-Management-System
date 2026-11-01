import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  Clock,
  Building2,
  CalendarDays,
  Printer,
  Sparkles,
  FileCheck,
  User,
  CreditCard,
  DollarSign,
  HelpCircle,
  X,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { Booking } from '../../types';
import {
  bookingsApi,
  depositSettlementsApi,
  SecurityDepositSettlement,
} from '../../api/client';
import { formatTo12Hour } from '../../utils/timeFormat';

interface ManagerDepositSettlementProps {
  initialBooking?: Booking | null;
}

export const ManagerDepositSettlement: React.FC<ManagerDepositSettlementProps> = ({ initialBooking }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settlements, setSettlements] = useState<SecurityDepositSettlement[]>([]);
  const [selectedBookingRef, setSelectedBookingRef] = useState<string>(initialBooking?.bookingRef || '');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Settlement Form State for selected event
  const [depositHeld, setDepositHeld] = useState<number>(50000);
  const [damageDeductions, setDamageDeductions] = useState<number>(0);
  const [damageNotes, setDamageNotes] = useState<string>('');
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [overtimeRatePerHour, setOvertimeRatePerHour] = useState<number>(25000);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);
  const [otherNotes, setOtherNotes] = useState<string>('');
  const [refundChannel, setRefundChannel] = useState<'Cash' | 'Bank Transfer' | 'Cheque' | 'Adjustment'>('Cash');
  const [refundReference, setRefundReference] = useState<string>('');
  const [clientSignatureAcknowledged, setClientSignatureAcknowledged] = useState<boolean>(true);
  const [settledBy, setSettledBy] = useState<string>('Floor Operations Manager');

  // Print voucher modal state
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [savingSettlement, setSavingSettlement] = useState(false);

  // Load bookings and existing settlements
  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedBookings, fetchedSettlements] = await Promise.all([
        bookingsApi.list(),
        depositSettlementsApi.list(),
      ]);
      setBookings(fetchedBookings);
      setSettlements(fetchedSettlements);

      // Default select the first booking if none selected
      if (!selectedBookingRef && fetchedBookings.length > 0) {
        setSelectedBookingRef(fetchedBookings[0].bookingRef);
      }
    } catch (err) {
      console.error('Failed to load deposit settlement data:', err);
      showToast('Error loading settlement records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedBooking = useMemo(() => {
    return bookings.find((b) => b.bookingRef === selectedBookingRef) || null;
  }, [bookings, selectedBookingRef]);

  const currentSettlement = useMemo(() => {
    return settlements.find((s) => s.bookingRef === selectedBookingRef) || null;
  }, [settlements, selectedBookingRef]);

  // Sync form inputs when selected booking or current settlement changes
  useEffect(() => {
    if (currentSettlement) {
      setDepositHeld(currentSettlement.depositHeld ?? 50000);
      setDamageDeductions(currentSettlement.damageDeductions ?? 0);
      setDamageNotes(currentSettlement.damageNotes ?? '');
      setOvertimeHours(currentSettlement.overtimeHours ?? 0);
      setOvertimeRatePerHour(currentSettlement.overtimeRatePerHour ?? (selectedBooking?.ratePerHour || 25000));
      setOtherDeductions(currentSettlement.otherDeductions ?? 0);
      setOtherNotes(currentSettlement.otherNotes ?? '');
      setRefundChannel(currentSettlement.refundChannel ?? 'Cash');
      setRefundReference(currentSettlement.refundReference ?? '');
      setClientSignatureAcknowledged(currentSettlement.clientSignatureAcknowledged ?? true);
      setSettledBy(currentSettlement.settledBy || 'Floor Operations Manager');
    } else if (selectedBooking) {
      setDepositHeld(selectedBooking.securityDeposit ?? 50000);
      setDamageDeductions(0);
      setDamageNotes('');
      setOvertimeHours(selectedBooking.extraHours ?? 0);
      setOvertimeRatePerHour(selectedBooking.ratePerHour || 25000);
      setOtherDeductions(0);
      setOtherNotes('');
      setRefundChannel('Cash');
      setRefundReference('');
      setClientSignatureAcknowledged(true);
      setSettledBy('Floor Operations Manager');
    }
  }, [currentSettlement, selectedBooking]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Calculated fields
  const overtimeCharges = useMemo(() => {
    return (Number(overtimeHours) || 0) * (Number(overtimeRatePerHour) || 0);
  }, [overtimeHours, overtimeRatePerHour]);

  const totalDeductions = useMemo(() => {
    return (Number(damageDeductions) || 0) + overtimeCharges + (Number(otherDeductions) || 0);
  }, [damageDeductions, overtimeCharges, otherDeductions]);

  const netRefundAmount = useMemo(() => {
    return Math.max(0, (Number(depositHeld) || 0) - totalDeductions);
  }, [depositHeld, totalDeductions]);

  const balanceDeficit = useMemo(() => {
    return totalDeductions > (Number(depositHeld) || 0) ? totalDeductions - (Number(depositHeld) || 0) : 0;
  }, [depositHeld, totalDeductions]);

  // Overall KPIs
  const kpis = useMemo(() => {
    const totalDeposits = settlements.reduce((acc, s) => acc + (s.depositHeld || 0), 0);
    const totalDeductionsAll = settlements.reduce((acc, s) => acc + (s.damageDeductions || 0) + (s.overtimeCharges || 0) + (s.otherDeductions || 0), 0);
    const totalRefunded = settlements.filter(s => s.status === 'Settled').reduce((acc, s) => acc + (s.netRefundAmount || 0), 0);
    const settledCount = settlements.filter((s) => s.status === 'Settled').length;
    const pendingCount = settlements.filter((s) => s.status === 'Held').length;

    return {
      totalDeposits,
      totalDeductionsAll,
      totalRefunded,
      settledCount,
      pendingCount,
    };
  }, [settlements]);

  // Handle Save / Update Draft Settlement
  const handleSaveDraft = async () => {
    if (!selectedBooking) return;
    try {
      setSavingSettlement(true);
      const payload: Partial<SecurityDepositSettlement> = {
        bookingRef: selectedBooking.bookingRef,
        customerName: selectedBooking.customerName,
        hallName: selectedBooking.hallName,
        eventDate: selectedBooking.date,
        depositHeld,
        damageDeductions,
        damageNotes,
        overtimeHours,
        overtimeRatePerHour,
        overtimeCharges,
        otherDeductions,
        otherNotes,
        netRefundAmount,
        refundChannel,
        refundReference,
        clientSignatureAcknowledged,
        settledBy,
      };

      if (currentSettlement?.id) {
        const updated = await depositSettlementsApi.update(currentSettlement.id, payload);
        setSettlements((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await depositSettlementsApi.create(payload);
        setSettlements((prev) => [created, ...prev]);
      }
      showToast('Settlement draft saved successfully!');
    } catch (err) {
      console.error('Failed to save settlement:', err);
      showToast('Failed to save settlement.');
    } finally {
      setSavingSettlement(false);
    }
  };

  // Handle Finalize Settlement
  const handleFinalizeSettlement = async () => {
    if (!selectedBooking) return;
    try {
      setSavingSettlement(true);
      // Ensure record exists
      let targetId = currentSettlement?.id;
      if (!targetId) {
        const created = await depositSettlementsApi.create({
          bookingRef: selectedBooking.bookingRef,
          customerName: selectedBooking.customerName,
          hallName: selectedBooking.hallName,
          eventDate: selectedBooking.date,
          depositHeld,
          damageDeductions,
          damageNotes,
          overtimeHours,
          overtimeRatePerHour,
          overtimeCharges,
          otherDeductions,
          otherNotes,
          netRefundAmount,
          refundChannel,
          refundReference,
          clientSignatureAcknowledged,
          settledBy,
        });
        targetId = created.id;
      } else {
        await depositSettlementsApi.update(targetId, {
          depositHeld,
          damageDeductions,
          damageNotes,
          overtimeHours,
          overtimeRatePerHour,
          overtimeCharges,
          otherDeductions,
          otherNotes,
          netRefundAmount,
          refundChannel,
          refundReference,
          clientSignatureAcknowledged,
          settledBy,
        });
      }

      const finalized = await depositSettlementsApi.finalize(targetId, {
        settledBy,
        refundChannel,
        refundReference,
        clientSignatureAcknowledged,
      });

      setSettlements((prev) => prev.map((s) => (s.id === finalized.id ? finalized : s)));
      showToast('Deposit finalized and refunded successfully! Voucher ready.');
      setIsVoucherModalOpen(true);
    } catch (err) {
      console.error('Failed to finalize settlement:', err);
      showToast('Failed to finalize settlement.');
    } finally {
      setSavingSettlement(false);
    }
  };

  // Common damage preset buttons
  const applyDamagePreset = (amount: number, reason: string) => {
    setDamageDeductions((prev) => prev + amount);
    setDamageNotes((prev) => {
      const addition = `${reason} (Rs. ${amount.toLocaleString()})`;
      return prev ? `${prev}, ${addition}` : addition;
    });
    showToast(`Added deduction: ${reason}`);
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

      {/* Top Banner */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-sky-500/5 to-transparent rounded-full blur-3xl -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Phase 3 — Task 3.5: Security Deposit Settlement & Deductions Protocol</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Post-Event Deposit Settlement & Deductions
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Inspect banquet physical damages, assess sound curfew overtime penalties, compute client net refunds, and issue signed financial release vouchers.
            </p>
          </div>

          {/* Quick stats badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsVoucherModalOpen(true)}
              disabled={!selectedBooking}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition shadow-sm disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Preview Voucher</span>
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={savingSettlement || !selectedBooking}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition shadow-sm disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4 text-amber-400" />
              <span>Save Draft</span>
            </button>
            <button
              onClick={handleFinalizeSettlement}
              disabled={savingSettlement || !selectedBooking || currentSettlement?.status === 'Settled'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{currentSettlement?.status === 'Settled' ? 'Settled & Closed' : 'Finalize Settlement'}</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Deposits Held</span>
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <p className="text-xl font-bold text-white">
              Rs. {kpis.totalDeposits.toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-500">{settlements.length} Event Deposits</span>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Deductions & Penalties</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <p className="text-xl font-bold text-rose-400">
              Rs. {kpis.totalDeductionsAll.toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-500">Damages & Overtime</span>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Disbursed Refunds</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-emerald-400">
              Rs. {kpis.totalRefunded.toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-500">{kpis.settledCount} Settled Vouchers</span>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Awaiting Reconciliation</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xl font-bold text-amber-400">{kpis.pendingCount} Events</p>
            <span className="text-[11px] text-slate-500">Held in Escrow</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Settlement Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Event Selector & Deduction Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Event Selector Card */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-slate-200">
                Select Active or Concluded Event
              </label>
              {currentSettlement && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    currentSettlement.status === 'Settled'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : currentSettlement.status === 'Forfeited'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  Status: {currentSettlement.status}
                </span>
              )}
            </div>

            <select
              value={selectedBookingRef}
              onChange={(e) => setSelectedBookingRef(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            >
              {bookings.map((b) => (
                <option key={b.id || b.bookingRef} value={b.bookingRef}>
                  [{b.bookingRef}] {b.customerName} — {b.hallName} ({b.date} • {formatTo12Hour(b.time || '18:00 - 23:00')})
                </option>
              ))}
            </select>

            {selectedBooking && (
              <div className="mt-4 grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs">
                <div>
                  <span className="text-slate-400 block">Host Name</span>
                  <span className="font-semibold text-white">{selectedBooking.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Hall</span>
                  <span className="font-semibold text-white">{selectedBooking.hallName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Operational Stage</span>
                  <span className="font-semibold text-sky-400">{selectedBooking.operationalStatus || 'Event Concluded'}</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Base Security Deposit Held */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">1. Security Deposit Received</h3>
                <p className="text-xs text-slate-400">Pre-event refundable caution money deposited by host</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={depositHeld}
                  onChange={(e) => setDepositHeld(Number(e.target.value) || 0)}
                  disabled={currentSettlement?.status === 'Settled'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-2.5 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
                />
              </div>
              <div className="flex gap-2">
                {[50000, 75000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositHeld(amt)}
                    disabled={currentSettlement?.status === 'Settled'}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                      depositHeld === amt
                        ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    Rs. {(amt / 1000)}k
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Venue & Asset Damage Logging */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">2. Venue Breakage & Property Damages</h3>
                  <p className="text-xs text-slate-400">Itemized deductions for broken chinaware, linen stains, and fixtures</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Damage Total</span>
                <span className="text-base font-bold text-rose-400">
                  Rs. {damageDeductions.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Quick preset buttons */}
            <div className="mb-4">
              <span className="text-xs text-slate-400 mb-2 block font-medium">Quick Incident Presets:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyDamagePreset(3500, '3x Broken Porcelain Dinner Plates')}
                  disabled={currentSettlement?.status === 'Settled'}
                  className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  + Broken Crockery (Rs. 3,500)
                </button>
                <button
                  type="button"
                  onClick={() => applyDamagePreset(6000, 'Stage Backdrop Floral Velvet Tear')}
                  disabled={currentSettlement?.status === 'Settled'}
                  className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  + Stage Velvet Tear (Rs. 6,000)
                </button>
                <button
                  type="button"
                  onClick={() => applyDamagePreset(12000, 'Chafing Dish Glass Dome Crack')}
                  disabled={currentSettlement?.status === 'Settled'}
                  className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  + Chafing Dish Dome (Rs. 12,000)
                </button>
                <button
                  type="button"
                  onClick={() => applyDamagePreset(5000, 'Deep Carpet Burn/Wax Removal')}
                  disabled={currentSettlement?.status === 'Settled'}
                  className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  + Carpet Wax Spill (Rs. 5,000)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDamageDeductions(0);
                    setDamageNotes('');
                  }}
                  disabled={currentSettlement?.status === 'Settled'}
                  className="px-2.5 py-1.5 rounded-lg text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear Damages
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Damage Amount (Rs.)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={damageDeductions}
                    onChange={(e) => setDamageDeductions(Number(e.target.value) || 0)}
                    disabled={currentSettlement?.status === 'Settled'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-2.5 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Breakage & Incident Description (Printed on Client Receipt)
                </label>
                <textarea
                  rows={2}
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  disabled={currentSettlement?.status === 'Settled'}
                  placeholder="e.g. 2x Gold rim bone china broken, stage truss scratches, excessive candle wax on front VIP carpet..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-60 resize-none"
                />
              </div>
            </div>
          </div>

          {/* 4. Sound Curfew & Overtime Hours */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">3. Curfew Overtime Duration</h3>
                  <p className="text-xs text-slate-400">Exceeded contract sound cutoff time beyond contracted window</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Overtime Surcharge</span>
                <span className="text-base font-bold text-amber-400">
                  Rs. {overtimeCharges.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Overtime Elapsed (Hours)
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  step="0.5"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(Number(e.target.value) || 0)}
                  disabled={currentSettlement?.status === 'Settled'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hourly Penalty Rate (Rs./hr)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={overtimeRatePerHour}
                    onChange={(e) => setOvertimeRatePerHour(Number(e.target.value) || 0)}
                    disabled={currentSettlement?.status === 'Settled'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-2.5 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              Formula: {overtimeHours || 0} hr(s) × Rs. {(overtimeRatePerHour || 0).toLocaleString()} = Rs. {overtimeCharges.toLocaleString()}
            </p>
          </div>

          {/* 5. Miscellaneous Charges */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">4. Other Adjustments & Diesel Surcharges</h3>
                  <p className="text-xs text-slate-400">Generator extra runtime, specialized heavy cleaning or garbage haulage</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Other Deductions</span>
                <span className="text-base font-bold text-purple-400">
                  Rs. {otherDeductions.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deduction Amount (Rs.)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={otherDeductions}
                    onChange={(e) => setOtherDeductions(Number(e.target.value) || 0)}
                    disabled={currentSettlement?.status === 'Settled'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-2.5 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason / Item
                </label>
                <input
                  type="text"
                  value={otherNotes}
                  onChange={(e) => setOtherNotes(e.target.value)}
                  disabled={currentSettlement?.status === 'Settled'}
                  placeholder="e.g. Extra Generator 45 Liters Diesel, Firework clean-up fee"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Reconciliation Summary & Settlement Disbursal (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Net Calculation Summary Card */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <span>Settlement Reconciliation</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {currentSettlement?.settlementRef || 'DEP-NEW'}
              </span>
            </div>

            {/* Step-by-step tally table */}
            <div className="space-y-3.5 py-4 text-sm border-b border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Base Deposit Received</span>
                <span className="font-semibold text-white">
                  + Rs. {depositHeld.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-rose-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Property / Decor Damage
                </span>
                <span className="font-semibold">
                  - Rs. {damageDeductions.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-amber-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Overtime ({overtimeHours} hrs @ {overtimeRatePerHour.toLocaleString()})
                </span>
                <span className="font-semibold">
                  - Rs. {overtimeCharges.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-purple-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Other Surcharges / Fuel
                </span>
                <span className="font-semibold">
                  - Rs. {otherDeductions.toLocaleString()}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between font-medium text-xs text-slate-400">
                <span>Total Deductions Applied:</span>
                <span className="text-rose-400 font-bold">
                  Rs. {totalDeductions.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Net Amount Callout */}
            <div className="my-5 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
              <span className="text-xs uppercase tracking-wider text-slate-400 block mb-1 font-semibold">
                {balanceDeficit > 0 ? 'Excess Payable by Client' : 'Net Refund Disbursable'}
              </span>
              <p
                className={`text-3xl font-extrabold tracking-tight ${
                  balanceDeficit > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                Rs. {balanceDeficit > 0 ? balanceDeficit.toLocaleString() : netRefundAmount.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {balanceDeficit > 0
                  ? '⚠️ Total damages exceeded initial deposit. Client must pay the deficit amount.'
                  : '✅ Returnable to customer against signature and official cash voucher.'}
              </p>
            </div>

            {/* Disbursal details form */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Disbursal Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Cash', 'Bank Transfer', 'Cheque', 'Adjustment'] as const).map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => setRefundChannel(channel)}
                      disabled={currentSettlement?.status === 'Settled'}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition text-center ${
                        refundChannel === channel
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Reference / Cheque # / Trx ID
                </label>
                <input
                  type="text"
                  value={refundReference}
                  onChange={(e) => setRefundReference(e.target.value)}
                  disabled={currentSettlement?.status === 'Settled'}
                  placeholder="e.g. Cash Voucher #4092 or HBL-99214"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Operations Manager Signoff
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={settledBy}
                    onChange={(e) => setSettledBy(e.target.value)}
                    disabled={currentSettlement?.status === 'Settled'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="clientSig"
                  checked={clientSignatureAcknowledged}
                  onChange={(e) => setClientSignatureAcknowledged(e.target.checked)}
                  disabled={currentSettlement?.status === 'Settled'}
                  className="mt-1 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="clientSig" className="text-xs text-slate-400 leading-relaxed">
                  Host representative has inspected returned property, acknowledged damage appraisal, and accepted net refund settlement.
                </label>
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleFinalizeSettlement}
                  disabled={savingSettlement || !selectedBooking || currentSettlement?.status === 'Settled'}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {currentSettlement?.status === 'Settled'
                      ? 'Settlement Formally Completed'
                      : `Finalize & Disburse Rs. ${netRefundAmount.toLocaleString()}`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(true)}
                  disabled={!selectedBooking}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4 text-sky-400" />
                  <span>Generate Printable Client Voucher</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Settlement Voucher Modal */}
      {isVoucherModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setIsVoucherModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Area */}
            <div id="printable-voucher" className="bg-white text-slate-900 p-8 rounded-2xl shadow-inner font-sans">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-5 mb-6 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tight text-slate-950 uppercase">
                      Royal Banquet Palace
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                      OFFICIAL SETTLEMENT
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Main Boulevard, Gulberg III, Lahore • Tel: (042) 3578-9000
                  </p>
                  <p className="text-xs text-slate-500">
                    NTN: 8291039-4 • STRN: 3277876123456
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    VOUCHER REF
                  </span>
                  <span className="text-lg font-mono font-bold text-slate-900">
                    {currentSettlement?.settlementRef || 'DEP-VOUCHER'}
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    Date: {new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-6">
                <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 underline decoration-2 decoration-amber-500">
                  Security Deposit Clearance & Refund Voucher
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Issued upon final venue inspection and turnover reconciliation
                </p>
              </div>

              {/* Event Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-6">
                <div>
                  <span className="text-slate-500 block">Host Name / Client:</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedBooking.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Booking Reference:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedBooking.bookingRef}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Banquet Hall:</span>
                  <span className="font-semibold text-slate-900">{selectedBooking.hallName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Event Date & Timing:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedBooking.date} • {formatTo12Hour(selectedBooking.time || '18:00 - 23:00')}
                  </span>
                </div>
              </div>

              {/* Ledger Statement Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 text-left">Description</th>
                      <th className="py-2.5 px-4 text-left">Notes / Specifications</th>
                      <th className="py-2.5 px-4 text-right">Debit (Rs.)</th>
                      <th className="py-2.5 px-4 text-right">Credit (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    <tr>
                      <td className="py-2.5 px-4 font-semibold">Security Deposit Held</td>
                      <td className="py-2.5 px-4 text-slate-500">Initial Caution Money Received</td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-700">
                        {depositHeld.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-rose-700">Property / Crockery Damage</td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {damageNotes || 'No property breakage or damages recorded'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-rose-700">
                        {damageDeductions.toLocaleString()}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-amber-700">Curfew Overtime Surcharge</td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {overtimeHours > 0
                          ? `${overtimeHours} Overtime Hour(s) @ Rs. ${overtimeRatePerHour.toLocaleString()}/hr`
                          : 'Adhered strictly to contract curfew'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-amber-700">
                        {overtimeCharges.toLocaleString()}
                      </td>
                    </tr>

                    {otherDeductions > 0 && (
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-purple-700">Miscellaneous Surcharges</td>
                        <td className="py-2.5 px-4 text-slate-600">{otherNotes || 'Auxiliary Services'}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-purple-700">
                          {otherDeductions.toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                    <tr>
                      <td colSpan={2} className="py-3 px-4 text-slate-900 text-sm">
                        NET REFUND PAYABLE TO CLIENT:
                      </td>
                      <td colSpan={2} className="py-3 px-4 text-right text-base font-mono text-emerald-700">
                        Rs. {netRefundAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Settlement Method & Signatures */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block">Payment Disbursal Channel:</span>
                    <span className="font-bold text-slate-900">{refundChannel}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Transaction Reference / Voucher ID:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {refundReference || 'CASH-DISBURSED-ON-SITE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dual Signature Blocks */}
              <div className="grid grid-cols-2 gap-12 pt-6 border-t border-slate-300">
                <div className="text-center">
                  <div className="border-b border-dashed border-slate-400 pb-12 mb-2" />
                  <span className="font-bold text-slate-900 text-xs block">{settledBy}</span>
                  <span className="text-[11px] text-slate-500">Venue Operations Manager</span>
                </div>

                <div className="text-center">
                  <div className="border-b border-dashed border-slate-400 pb-12 mb-2" />
                  <span className="font-bold text-slate-900 text-xs block">{selectedBooking.customerName}</span>
                  <span className="text-[11px] text-slate-500">Client / Host Representative</span>
                </div>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

