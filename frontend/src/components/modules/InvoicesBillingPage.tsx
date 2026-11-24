import React, { useMemo, useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  Plus,
  Printer,
  Search,
  Crown,
  X,
} from 'lucide-react';
import {
  SEED_BOOKINGS,
  SEED_HALLS,
  SEED_INVOICES,
  SEED_MENU_PACKAGES,
} from '../../data/seedData';
import { invoicesApi, bookingsApi } from '../../api/client';
import { EventSearchSelect } from '../common/EventSearchSelect';

export type InvoiceStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Cancelled';

export interface InvoiceRecord {
  id: string;
  bookingRef: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: InvoiceStatus;
  dueDate: string;
  notes?: string;
  cancellationRecord?: any;
}

interface FullBookingRecord {
  ref: string;
  id: string;
  customerName: string;
  contactRef?: string;
  cnic?: string;
  eventType?: string;
  hallName?: string;
  date?: string;
  time?: string;
  guestCount?: number;
  menuPackage?: string;
  hallRent: number;
  menuAmount: number;
  djAmount: number;
  decorAmount: number;
  extraHours: number;
  ratePerHour: number;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  extraServices?: Array<{ id: string; title: string; price: number; category?: string }>;
  damagesRecord?: Array<{ id: string; item: string; amount: number; deduction_type?: string; deductionType?: string }>;
  notes?: string;
  cancellationRecord?: any;
}

const STATUS_BADGE_STYLES: Record<InvoiceStatus, string> = {
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Partial: 'bg-amber-50 text-amber-800 border-amber-200',
  Unpaid: 'bg-red-50 text-red-700 border-red-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const InvoicesBillingPage: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [bookings, setBookings] = useState<FullBookingRecord[]>([]);

  const loadData = React.useCallback(() => {
    invoicesApi
      .list()
      .then((data) => {
        if (Array.isArray(data)) {
          setInvoices(
            data.map((inv: any) => {
              const rawStatus = inv.paymentStatus || inv.status;
              const isCancelled = rawStatus === 'Cancelled' || inv.status === 'Cancelled';
              const normalizedStatus: InvoiceStatus = isCancelled
                ? 'Cancelled'
                : rawStatus === 'Paid'
                ? 'Paid'
                : rawStatus === 'Partial'
                ? 'Partial'
                : 'Unpaid';

              const total = Number(inv.totalAmount) || 0;
              const paid = Number(inv.paidAmount) || 0;
              const balance = isCancelled
                ? 0
                : Number(inv.remainingBalance ?? inv.balanceDue ?? (total - paid)) || 0;

              return {
                id: inv.invoiceId || `INV-${inv.id}`,
                bookingRef: inv.bookingRef || inv.bookingId || `BK-${inv.id}`,
                customerName: inv.customerName || 'Client',
                totalAmount: total,
                paidAmount: paid,
                balanceDue: balance,
                status: normalizedStatus,
                dueDate: inv.dueDate || inv.date || '',
                notes: inv.notes,
                cancellationRecord: inv.cancellationRecord || null,
              };
            })
          );
        }
      })
      .catch((err) => console.warn('Invoices API error:', err));

    bookingsApi
      .list()
      .then((data) => {
        if (data && data.length > 0) {
          setBookings(
            data.map((b: any) => {
              const tot = Number(b.amount || b.subtotal || b.totalAmount) || 0;
              const adv = Number(b.advancePayment || b.paidAmount) || 0;
              const hallRent = Number(b.hallRent) || 0;
              const menuAmount = Number(b.menuAmount) || 0;
              const djAmount = Number(b.djAmount) || 0;
              const decorAmount = Number(b.decorAmount) || 0;
              const extraHours = Number(b.extraHours) || 0;
              const ratePerHour = Number(b.ratePerHour) || 0;
              const overtimeAmount = extraHours * ratePerHour;
              const subtotal =
                Number(b.subtotal) ||
                (hallRent + menuAmount + djAmount + decorAmount + overtimeAmount);
              const discountPercentage = Number(b.discountPercentage) || 0;
              const discountAmount = Number(b.discountAmount) || 0;

              return {
                ref: b.bookingRef || `BK-${b.id}`,
                id: String(b.id),
                customerName: b.customerName && b.customerName !== '[--]' ? b.customerName : 'Client',
                contactRef: b.contactRef || '',
                cnic: b.cnic || '',
                eventType: b.eventType || 'Event Reservation',
                hallName: b.hallName || 'Main Hall',
                date: b.date || '',
                time: b.time || '',
                guestCount: Number(b.guestCount) || 0,
                menuPackage: b.menuPackage || '',
                hallRent,
                menuAmount,
                djAmount,
                decorAmount,
                extraHours,
                ratePerHour,
                subtotal: subtotal > 0 ? subtotal : tot,
                discountPercentage,
                discountAmount,
                totalAmount: tot,
                paidAmount: adv,
                remainingBalance: Math.max(0, tot - adv),
                extraServices: b.extraServices || b.extra_services || [],
                damagesRecord: b.damagesRecord || b.damages_record || [],
                cancellationRecord: b.cancellationRecord,
              };
            })
          );
        } else {
          setBookings(
            SEED_BOOKINGS.map((b: any) => ({
              ref: b.bookingId || b.bookingRef || b.id,
              id: b.id,
              customerName: b.customerName || 'Client',
              contactRef: b.contactRef || b.phone || '',
              eventType: b.eventType || 'Event Reservation',
              hallName: b.hallName || 'Main Hall',
              date: b.date || b.eventDate || '',
              time: b.time || b.slot || '',
              guestCount: Number(b.guestCount) || 100,
              menuPackage: b.menuPackage || '',
              hallRent: 50000,
              menuAmount: (Number(b.amount || b.totalAmount || 0)) * 0.7,
              djAmount: 0,
              decorAmount: 0,
              extraHours: Number(b.extraHours) || 0,
              ratePerHour: Number(b.ratePerHour) || 0,
              subtotal: Number(b.amount || b.totalAmount || 0),
              discountPercentage: 0,
              discountAmount: 0,
              totalAmount: Number(b.amount || b.totalAmount || 0),
              paidAmount: Number(b.advancePayment || b.paidAmount || 0),
              remainingBalance: Math.max(0, (Number(b.amount || b.totalAmount || 0)) - (Number(b.advancePayment || b.paidAmount || 0))),
            }))
          );
        }
      })
      .catch((err) => console.warn('Bookings API error:', err));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | InvoiceStatus>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceRecord | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<InvoiceRecord | null>(null);

  // Create Manual Invoice form state
  const [selectedBookingRef, setSelectedBookingRef] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isRemainingPayment, setIsRemainingPayment] = useState<boolean>(true);
  const [paymentAmountNow, setPaymentAmountNow] = useState<string>('');
  const [paymentChannel, setPaymentChannel] = useState<string>('Cash');
  const [totalAmount, setTotalAmount] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const kpiMetrics = useMemo(() => {
    if (invoices.length === 0) {
      return {
        totalInvoiced: 'Rs. 0',
        totalCollected: 'Rs. 0',
        pendingReceivables: 'Rs. 0',
      };
    }

    const invoicedSum = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
    const collectedSum = invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
    const pendingSum = invoices.reduce((sum, inv) => sum + (Number(inv.balanceDue) || 0), 0);

    return {
      totalInvoiced: `Rs. ${invoicedSum.toLocaleString()}`,
      totalCollected: `Rs. ${collectedSum.toLocaleString()}`,
      pendingReceivables: `Rs. ${pendingSum.toLocaleString()}`,
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        inv.id.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.bookingRef.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'All' || inv.status === statusFilter;

      const matchesStart = !startDate || inv.dueDate >= startDate;
      const matchesEnd = !endDate || inv.dueDate <= endDate;

      return matchesSearch && matchesStatus && matchesStart && matchesEnd;
    });
  }, [invoices, searchQuery, statusFilter, startDate, endDate]);

  const handleBookingChange = (ref: string) => {
    setSelectedBookingRef(ref);
    const matched = bookings.find((b) => b.ref === ref);
    if (matched) {
      setCustomerName(matched.customerName);
      if (matched.remainingBalance > 0) {
        setIsRemainingPayment(true);
        setPaymentAmountNow(String(matched.remainingBalance));
      } else {
        setIsRemainingPayment(false);
        setPaymentAmountNow('');
      }
      setTotalAmount(String(matched.totalAmount));
      setAdvancePaid(String(matched.paidAmount));
    } else {
      setCustomerName('');
      setPaymentAmountNow('');
      setTotalAmount('');
      setAdvancePaid('');
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedBookingRef('');
    setCustomerName('');
    setIsRemainingPayment(true);
    setPaymentAmountNow('');
    setPaymentChannel('Cash');
    setTotalAmount('');
    setAdvancePaid('');
    setDueDate(new Date().toISOString().slice(0, 10));
    setNotes('');
    setIsCreateOpen(true);
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRemainingPayment && selectedBookingRef) {
      const payNow = parseFloat(paymentAmountNow);
      if (Number.isNaN(payNow) || payNow <= 0) {
        alert('Please enter a valid payment collection amount.');
        return;
      }
      const matched = bookings.find((b) => b.ref === selectedBookingRef);
      const currentRemaining = matched ? matched.remainingBalance : 0;
      if (currentRemaining > 0 && payNow > currentRemaining) {
        const proceed = window.confirm(
          `Collection amount (Rs. ${payNow.toLocaleString()}) exceeds the pending balance (Rs. ${currentRemaining.toLocaleString()}). Proceed anyway?`
        );
        if (!proceed) return;
      }

      try {
        const res = await invoicesApi.create({
          bookingId: selectedBookingRef,
          isRemainingPayment: true,
          amountPaidNow: payNow,
          channel: paymentChannel,
          date: dueDate || new Date().toISOString().slice(0, 10),
          notes: notes.trim(),
        });

        setIsCreateOpen(false);
        loadData();

        if (res) {
          const recInv: InvoiceRecord = {
            id: res.invoiceId || String(res.id) || `INV-COL-${Date.now().toString().slice(-4)}`,
            bookingRef: selectedBookingRef,
            customerName: customerName || (matched ? matched.customerName : 'Client'),
            totalAmount: matched ? matched.totalAmount : payNow,
            paidAmount: matched ? matched.paidAmount + payNow : payNow,
            balanceDue: Math.max(0, (matched ? matched.remainingBalance : payNow) - payNow),
            status: (matched ? matched.remainingBalance - payNow : 0) <= 0 ? 'Paid' : 'Partial',
            dueDate: dueDate || new Date().toISOString().slice(0, 10),
            notes: notes.trim() || `Collected remaining payment of Rs. ${payNow.toLocaleString()} via ${paymentChannel}`,
          };
          setPrintingInvoice(recInv);
        }
      } catch (err) {
        console.warn('Error recording balance collection:', err);
        alert('Failed to record balance payment.');
      }
      return;
    }

    // Additional New Charge / Standalone Manual Invoice
    const total = parseFloat(totalAmount);
    const paid = parseFloat(advancePaid || '0');
    if (Number.isNaN(total) || total <= 0) {
      alert('Please enter a valid total amount.');
      return;
    }

    const safePaid = Number.isNaN(paid) ? 0 : Math.max(0, Math.min(paid, total));
    const balance = Math.max(0, total - safePaid);
    const computedStatus: InvoiceStatus =
      balance === 0 ? 'Paid' : safePaid > 0 ? 'Partial' : 'Unpaid';

    const tempId = `INV-${Date.now().toString().slice(-4)}`;
    const created: InvoiceRecord = {
      id: tempId,
      bookingRef: selectedBookingRef || '[BK-XXXX]',
      customerName: customerName || '[--]',
      totalAmount: total,
      paidAmount: safePaid,
      balanceDue: balance,
      status: computedStatus,
      dueDate: dueDate || '[--]',
      notes: notes.trim() || undefined,
    };

    setInvoices((prev) => [created, ...prev]);

    const apiPayload = {
      bookingId: selectedBookingRef || 'BK-MANUAL',
      customerName: customerName || '[--]',
      totalAmount: total,
      paidAmount: safePaid,
      remainingBalance: balance,
      paymentStatus: computedStatus,
      date: dueDate || new Date().toISOString().split('T')[0],
      notes: notes.trim(),
    };

    try {
      await invoicesApi.create(apiPayload);
      setIsCreateOpen(false);
      loadData();
    } catch (err) {
      console.warn('Invoice API create error:', err);
    }
  };

  const handleOpenPrintModal = (inv: InvoiceRecord) => {
    setViewingInvoice(null);
    setPrintingInvoice(inv);
  };

  return (
    <>
      <div className={printingInvoice ? 'no-print space-y-6' : 'space-y-6'}>
      {/* Top Section: Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
            Invoice &amp; Billing Ledger
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage customer billing, track payments, and view outstanding balances.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Manual Invoice
        </button>
      </div>

      {/* KPI Metrics Bar (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Invoiced
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.totalInvoiced}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Collected
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.totalCollected}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Receivables
            </span>
            <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.pendingReceivables}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Invoice ID or Customer..."
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filter by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | InvoiceStatus)}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-700 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              aria-label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-700 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            />
          </div>
        </div>
      </div>

      {/* Main Section: Data Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Invoice ID
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Booking Ref
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Customer Name
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Amount
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Paid Amount
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Balance Due
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 px-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
                        <FileText className="w-7 h-7 text-slate-400" />
                      </div>
                      <p className="text-base font-semibold text-slate-900">
                        No invoices recorded yet.
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Invoices will appear here once bookings are finalized.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-5 text-sm font-mono font-semibold text-slate-900">
                      {inv.id}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-mono text-slate-600">
                      {inv.bookingRef}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-medium text-slate-900">
                      {inv.customerName}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-mono tabular-nums text-slate-900">
                      <div>Rs. {inv.totalAmount.toLocaleString()}</div>
                      {inv.status === 'Cancelled' && (
                        <div className="text-[10px] text-rose-600 font-sans font-medium">Booked Contract</div>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-mono tabular-nums text-emerald-700">
                      <div>Rs. {inv.paidAmount.toLocaleString()}</div>
                      {inv.status === 'Cancelled' && (
                        <div className="text-[10px] text-slate-500 font-sans">Advance Paid</div>
                      )}
                    </td>
                    <td
                      className={`py-3.5 px-5 text-sm font-mono tabular-nums font-semibold ${
                        inv.status === 'Cancelled'
                          ? 'text-slate-500'
                          : inv.balanceDue > 0
                          ? 'text-red-600'
                          : 'text-slate-600'
                      }`}
                    >
                      <div>Rs. {inv.balanceDue.toLocaleString()}</div>
                      {inv.status === 'Cancelled' && (
                        <div className="text-[10px] text-emerald-600 font-sans font-normal">Settled / Closed</div>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="space-y-0.5">
                        <span
                          className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                            STATUS_BADGE_STYLES[inv.status] || STATUS_BADGE_STYLES.Unpaid
                          }`}
                        >
                          {inv.status === 'Cancelled' && inv.cancellationRecord?.cancellation_type === 'pause_and_adjust'
                            ? 'Cancelled (Credit)'
                            : inv.status === 'Cancelled'
                            ? 'Cancelled (Refunded)'
                            : inv.status}
                        </span>
                        {inv.status === 'Cancelled' && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            Used: Rs. {(inv.cancellationRecord?.amount_used || inv.cancellationRecord?.deduction_amount || 0).toLocaleString()}
                          </div>
                        )}
                        {inv.status === 'Cancelled' && (
                          <div className="text-[10px] text-slate-700 font-mono font-medium">
                            {inv.cancellationRecord?.cancellation_type === 'pause_and_adjust'
                              ? `Credit: Rs. ${(inv.cancellationRecord?.net_amount || 0).toLocaleString()}`
                              : `Refund: Rs. ${(inv.cancellationRecord?.net_amount || 0).toLocaleString()}`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingInvoice(inv)}
                          aria-label={`View ${inv.id}`}
                          className="p-2 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenPrintModal(inv)}
                          aria-label={`Print ${inv.id}`}
                          title="Print Receipt"
                          className="p-2 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Manual Invoice Modal */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-invoice-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3
                id="create-invoice-modal-title"
                className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900"
              >
                Create Invoice &amp; Payment Collection
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateInvoice} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* Select Booking Event with Searchable Combobox */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Booking Event <span className="text-teal-700 font-normal">(Search by Name, CNIC, Booking Ref, or Invoice #)</span>
                </label>
                <EventSearchSelect
                  bookings={bookings}
                  selectedRef={selectedBookingRef}
                  onSelect={(ref) => handleBookingChange(ref)}
                  invoices={invoices}
                />
              </div>

              {/* Customer Name */}
              <div>
                <label
                  htmlFor="inv-customer"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Customer Name
                </label>
                <input
                  id="inv-customer"
                  type="text"
                  readOnly
                  value={customerName}
                  placeholder="Auto-filled from selected booking"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              {/* Remaining Balance vs Additional Charge Area */}
              {selectedBookingRef && (() => {
                const matched = bookings.find((b) => b.ref === selectedBookingRef);
                const parsedPayNow = parseFloat(paymentAmountNow) || 0;

                return (
                  <div className="space-y-4 pt-1">
                    {/* Mode Selector */}
                    <div className="rounded-xl border border-teal-200/80 bg-teal-50/40 p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                          Invoice / Settlement Type:
                        </span>
                        {matched && matched.remainingBalance > 0 && (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                            Due: Rs. {matched.remainingBalance.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsRemainingPayment(true);
                            if (matched) {
                              setPaymentAmountNow(String(matched.remainingBalance));
                            }
                          }}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                            isRemainingPayment
                              ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Remaining Amount Collection
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsRemainingPayment(false)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                            !isRemainingPayment
                              ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          New / Additional Charge
                        </button>
                      </div>
                    </div>

                    {/* MODE 1: Remaining Balance Collection */}
                    {isRemainingPayment ? (
                      <div className="space-y-3">
                        {/* Live Financial Breakdown Card */}
                        {matched && (
                          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                            <div>
                              <span className="text-[10px] text-slate-500 block uppercase font-medium">Contract Total</span>
                              <strong className="font-mono text-slate-900 text-sm font-bold">
                                Rs. {matched.totalAmount.toLocaleString()}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block uppercase font-medium">Already Paid</span>
                              <strong className="font-mono text-emerald-700 text-sm font-bold">
                                Rs. {matched.paidAmount.toLocaleString()}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block uppercase font-medium">Pending Balance</span>
                              <strong className="font-mono text-red-600 text-sm font-bold">
                                Rs. {matched.remainingBalance.toLocaleString()}
                              </strong>
                            </div>
                          </div>
                        )}

                        {/* Amount Collected Input */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="inv-pay-now" className="block text-xs font-semibold text-slate-800">
                              Amount to Collect / Settle (Rs.) <span className="text-red-500">*</span>
                            </label>
                            {matched && matched.remainingBalance > 0 && (
                              <button
                                type="button"
                                onClick={() => setPaymentAmountNow(String(matched.remainingBalance))}
                                className="text-[10px] font-semibold text-teal-700 hover:text-teal-800 underline cursor-pointer"
                              >
                                Full Remaining (Rs. {matched.remainingBalance.toLocaleString()})
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">Rs.</span>
                            <input
                              id="inv-pay-now"
                              type="number"
                              min="1"
                              required
                              value={paymentAmountNow}
                              onChange={(e) => setPaymentAmountNow(e.target.value)}
                              placeholder={matched ? String(matched.remainingBalance) : 'e.g. 200000'}
                              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                            />
                          </div>

                          {/* Quick Preset Buttons */}
                          {matched && matched.remainingBalance > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              <span className="text-[10px] text-slate-400 font-medium mr-1">Quick Fill:</span>
                              <button
                                type="button"
                                onClick={() => setPaymentAmountNow(String(matched.remainingBalance))}
                                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 cursor-pointer"
                              >
                                Full Remaining
                              </button>
                              {matched.remainingBalance >= 50000 && (
                                <button
                                  type="button"
                                  onClick={() => setPaymentAmountNow(String(Math.round(matched.remainingBalance / 2)))}
                                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 cursor-pointer"
                                >
                                  50%
                                </button>
                              )}
                              {matched.remainingBalance >= 100000 && (
                                <button
                                  type="button"
                                  onClick={() => setPaymentAmountNow('100000')}
                                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 cursor-pointer"
                                >
                                  Rs. 100k
                                </button>
                              )}
                            </div>
                          )}

                          {/* Live Balance Deduction Display */}
                          {matched && parsedPayNow > 0 && (
                            <div className="mt-3 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs space-y-1.5">
                              <div className="flex items-center justify-between text-slate-700">
                                <span>Deducting from pending balance:</span>
                                <strong className="font-mono text-emerald-800 font-bold">- Rs. {parsedPayNow.toLocaleString()}</strong>
                              </div>
                              <div className="flex items-center justify-between text-slate-700">
                                <span>New total paid to date:</span>
                                <strong className="font-mono">Rs. {(matched.paidAmount + parsedPayNow).toLocaleString()}</strong>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-emerald-200 font-semibold">
                                <span className="text-slate-800">Remaining balance due after payment:</span>
                                <strong className={`font-mono ${Math.max(0, matched.remainingBalance - parsedPayNow) > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                                  Rs. {Math.max(0, matched.remainingBalance - parsedPayNow).toLocaleString()}
                                  {matched.remainingBalance - parsedPayNow <= 0 && ' (Fully Paid)'}
                                </strong>
                              </div>
                              <p className="text-[10px] text-teal-800 pt-0.5 font-medium">
                                ✓ Deducts from pending balance. Contract total remains intact at Rs. {matched.totalAmount.toLocaleString()}.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Payment Method / Channel */}
                        <div>
                          <label htmlFor="inv-channel" className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Payment Method
                          </label>
                          <select
                            id="inv-channel"
                            value={paymentChannel}
                            onChange={(e) => setPaymentChannel(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                          >
                            <option value="Cash">Cash in Hand</option>
                            <option value="Bank Transfer">Bank Transfer / Online</option>
                            <option value="Cheque">Bank Cheque</option>
                            <option value="Debit/Credit Card">Debit/Credit Card (POS)</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      /* MODE 2: Additional New Charge */
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="inv-total"
                              className="block text-xs font-semibold text-slate-700 mb-1.5"
                            >
                              Additional Charge (Rs.) <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="inv-total"
                              type="number"
                              min="0"
                              step="1"
                              required
                              value={totalAmount}
                              onChange={(e) => setTotalAmount(e.target.value)}
                              placeholder="e.g. 50000"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="inv-advance"
                              className="block text-xs font-semibold text-slate-700 mb-1.5"
                            >
                              Amount Paid Now (Rs.)
                            </label>
                            <input
                              id="inv-advance"
                              type="number"
                              min="0"
                              step="1"
                              value={advancePaid}
                              onChange={(e) => setAdvancePaid(e.target.value)}
                              placeholder="e.g. 50000"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Adds this new amount to the event contract total.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Due Date / Receipt Date */}
              <div>
                <label
                  htmlFor="inv-due-date"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Invoice / Payment Date
                </label>
                <input
                  id="inv-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="inv-notes"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Notes / Reference
                </label>
                <textarea
                  id="inv-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional payment reference or terms..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  {isRemainingPayment && selectedBookingRef
                    ? 'Record Payment & Cut from Balance'
                    : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {viewingInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-invoice-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3
                id="view-invoice-modal-title"
                className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900"
              >
                Invoice {viewingInvoice.id}
              </h3>
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-sm">
              {viewingInvoice.status === 'Cancelled' && (
                <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-900 space-y-1 mb-2">
                  <div className="font-bold text-xs flex items-center gap-1.5 text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Cancelled Booking Settlement</span>
                  </div>
                  {viewingInvoice.notes && (
                    <p className="text-[11px] text-rose-700">{viewingInvoice.notes}</p>
                  )}
                </div>
              )}

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Booking Ref</span>
                <span className="font-mono font-semibold text-slate-900">
                  {viewingInvoice.bookingRef}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Customer Name</span>
                <span className="font-medium text-slate-900">
                  {viewingInvoice.customerName}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">{viewingInvoice.status === 'Cancelled' ? 'Booked Contract Amount' : 'Total Amount'}</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  Rs. {viewingInvoice.totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">{viewingInvoice.status === 'Cancelled' ? 'Advance Paid' : 'Paid Amount'}</span>
                <span className="font-mono tabular-nums font-semibold text-emerald-700">
                  Rs. {viewingInvoice.paidAmount.toLocaleString()}
                </span>
              </div>
              {viewingInvoice.status === 'Cancelled' && (
                <>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Amount Used (Deductions)</span>
                    <span className="font-mono tabular-nums font-semibold text-rose-700">
                      Rs. {(viewingInvoice.cancellationRecord?.amount_used || viewingInvoice.cancellationRecord?.deduction_amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">
                      {viewingInvoice.cancellationRecord?.cancellation_type === 'pause_and_adjust'
                        ? 'Retained Credit Voucher'
                        : 'Refund Disbursed'}
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-teal-800">
                      Rs. {(viewingInvoice.cancellationRecord?.net_amount || 0).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Pending Balance</span>
                <span
                  className={`font-mono tabular-nums font-semibold ${
                    viewingInvoice.status === 'Cancelled'
                      ? 'text-emerald-700'
                      : viewingInvoice.balanceDue > 0
                      ? 'text-red-600'
                      : 'text-slate-900'
                  }`}
                >
                  Rs. {viewingInvoice.balanceDue.toLocaleString()} {viewingInvoice.status === 'Cancelled' && '(Closed)'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Date</span>
                <span className="font-mono text-slate-700">
                  {viewingInvoice.dueDate}
                </span>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => handleOpenPrintModal(viewingInvoice)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-700 bg-white hover:bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-700 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Full-Screen Printable Invoice / Receipt Modal */}
      {printingInvoice && (() => {
        const matchedBooking = bookings.find(
          (b) => b.ref === printingInvoice.bookingRef || b.id === printingInvoice.bookingRef
        );

        const hallName = matchedBooking?.hallName || 'Hall Venue';
        const hallRent = matchedBooking ? matchedBooking.hallRent : 0;
        const menuAmount = matchedBooking ? matchedBooking.menuAmount : 0;
        const menuPackage = matchedBooking?.menuPackage || 'Catering Package';
        const guestCount = matchedBooking?.guestCount || 0;
        const djAmount = matchedBooking ? matchedBooking.djAmount : 0;
        const decorAmount = matchedBooking ? matchedBooking.decorAmount : 0;
        const extraHours = matchedBooking ? matchedBooking.extraHours : 0;
        const ratePerHour = matchedBooking ? matchedBooking.ratePerHour : 0;
        const extraCharges = extraHours * ratePerHour;
        const subtotal = matchedBooking
          ? (matchedBooking.subtotal > 0
              ? matchedBooking.subtotal
              : hallRent + menuAmount + djAmount + decorAmount + extraCharges)
          : printingInvoice.totalAmount;
        const discountPct = matchedBooking ? matchedBooking.discountPercentage : 0;
        const discountAmount = matchedBooking ? matchedBooking.discountAmount : 0;
        const extraServices = matchedBooking?.extraServices || [];
        const damagesRecord = (matchedBooking?.damagesRecord || []).filter(
          (d: any) => (d.deduction_type || d.deductionType || 'invoice') === 'invoice'
        );
        const contractTotal = printingInvoice.totalAmount || (matchedBooking ? matchedBooking.totalAmount : 0);
        const paidAmount = printingInvoice.paidAmount;
        const balanceDue = printingInvoice.balanceDue;
        const customerName = printingInvoice.customerName || matchedBooking?.customerName || 'Client';
        const contactRef = matchedBooking?.contactRef || '';
        const eventType = matchedBooking?.eventType || 'Hall Reservation';
        const eventDate = matchedBooking?.date || printingInvoice.dueDate || '';
        const eventTime = matchedBooking?.time || '';

        const receiptDate =
          printingInvoice.dueDate && printingInvoice.dueDate !== '[--]'
            ? printingInvoice.dueDate
            : new Date().toISOString().slice(0, 10);

        // Parse payment history from notes cleanly (e.g. "[Remaining Balance Payment on 2026-11-23]: Rs. 100,000 via Cash")
        const paymentHistory: Array<{ date: string; amount: string; method: string }> = [];
        if (printingInvoice.notes) {
          const lines = printingInvoice.notes.split('\n');
          lines.forEach((line) => {
            const match = line.match(/\[(?:Remaining Balance Payment on )?([^\]]+)\]:\s*Rs\.\s*([\d,]+(?:\.\d+)?)\s*(?:via\s*([^\n\r]+))?/i);
            if (match) {
              paymentHistory.push({
                date: match[1].trim(),
                amount: match[2].trim(),
                method: match[3] ? match[3].trim() : 'Cash / Counter',
              });
            }
          });
        }

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[1px] flex items-center justify-center p-4 print:static print:bg-white print:p-0 print:block"
            role="dialog"
            aria-modal="true"
            aria-label="Printable Invoice Receipt"
          >
            <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden print:max-h-none print:border-none print:shadow-none print:max-w-none print:rounded-none print:overflow-visible">
              {/* Top Action Bar (Hidden in Print) */}
              <div className="no-print shrink-0 px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  INVOICE RECEIPT PREVIEW
                </span>
                <button
                  type="button"
                  onClick={() => setPrintingInvoice(null)}
                  className="no-print inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>

              {/* Physical A4 Receipt Sheet (Optimized to fit on 1 A4 Page) */}
              <div
                id="printable-receipt"
                className="print-only flex-1 min-h-0 overflow-y-auto bg-white text-black p-6 sm:p-7 print:p-6 print:overflow-visible print:max-h-none text-xs"
              >
                {/* Header: Royal Letterhead with Gold & Emerald Accents */}
                <div className="pb-4 border-b-2 border-teal-900/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-teal-900 text-amber-400 flex items-center justify-center border border-amber-400/40 shadow-xs shrink-0">
                        <Crown className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-['Playfair_Display','Cormorant_Garamond',serif]">
                            Mehar Palace Marquee
                          </h2>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Luxury Banquets
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                          Main Canal Road, near PSO Petrol Pump, Fateh Garh Mughalpura, Lahore, 54000
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Phone: <strong className="text-slate-800">0321 1000806</strong> &bull; Official Accounts &amp; Billing Desk
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="inline-block px-3 py-1 bg-teal-900 text-amber-300 font-bold uppercase tracking-wider text-[11px] rounded border border-teal-700">
                        Official Payment Receipt
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 font-mono">
                        Status:{' '}
                        <span className={`font-bold uppercase ${balanceDue <= 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {balanceDue <= 0 ? 'PAID / CLEAR' : printingInvoice.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  {/* Decorative Letterhead Bar */}
                  <div className="mt-3.5 h-1 w-full bg-gradient-to-r from-teal-900 via-amber-500 to-teal-900 rounded-full" />
                </div>

                {/* Meta Grid: Invoice ID, Date, Customer & Event Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-slate-300 text-xs">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      Receipt / Invoice ID
                    </p>
                    <p className="font-mono font-bold text-black mt-1">
                      {printingInvoice.id || 'INV-0000'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      Booking Reference
                    </p>
                    <p className="font-mono font-semibold text-black mt-1">
                      {printingInvoice.bookingRef || 'Direct'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      Date of Receipt
                    </p>
                    <p className="font-mono font-medium text-black mt-1">
                      {receiptDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      Customer Name
                    </p>
                    <p className="font-semibold text-black mt-1">
                      {customerName}
                    </p>
                    {contactRef && (
                      <p className="text-[11px] text-slate-600 font-mono mt-0.5">{contactRef}</p>
                    )}
                  </div>
                </div>

                {/* Event Schedule Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 bg-slate-50/70 border-b border-slate-200 text-xs px-3 rounded-lg mt-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium block">
                      Event Type
                    </span>
                    <strong className="text-slate-900 font-semibold">{eventType}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium block">
                      Venue / Hall
                    </span>
                    <strong className="text-slate-900 font-semibold">{hallName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium block">
                      Event Date &amp; Time
                    </span>
                    <span className="text-slate-800 font-mono">
                      {eventDate} {eventTime ? `(${eventTime})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium block">
                      Expected Guests
                    </span>
                    <span className="text-slate-800 font-mono">
                      {guestCount > 0 ? `${guestCount} Guests` : 'Standard'}
                    </span>
                  </div>
                </div>

                {/* Table 1: What It Is For (Itemized Scope) */}
                <div className="py-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-black pb-2 border-b border-black">
                    Reservation &amp; Service Package Breakdown
                  </h3>
                  <table className="w-full text-left border-collapse border border-slate-300 text-xs mt-2">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-black">
                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider w-12">
                          Sr.
                        </th>
                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider">
                          Service / Description
                        </th>
                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider">
                          Package Scope &amp; Details
                        </th>
                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-right">
                          Agreed Amount (PKR)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {matchedBooking ? (
                        <>
                          {/* Hall Rent */}
                          <tr>
                            <td className="py-2.5 px-4 font-mono text-slate-500">01</td>
                            <td className="py-2.5 px-4 font-semibold text-black">Venue Hall Rental</td>
                            <td className="py-2.5 px-4 text-slate-700">
                              {hallName} Base Reservation
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-black">
                              Rs. {hallRent.toLocaleString('en-PK')}
                            </td>
                          </tr>

                          {/* Menu Amount */}
                          <tr>
                            <td className="py-2.5 px-4 font-mono text-slate-500">02</td>
                            <td className="py-2.5 px-4 font-semibold text-black">Catering &amp; Food Menu</td>
                            <td className="py-2.5 px-4 text-slate-700">
                              {menuPackage} {guestCount > 0 ? `(${guestCount} guests)` : ''}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-black">
                              Rs. {menuAmount.toLocaleString('en-PK')}
                            </td>
                          </tr>

                          {/* DJ & Sound */}
                          {djAmount > 0 && (
                            <tr>
                              <td className="py-2.5 px-4 font-mono text-slate-500">03</td>
                              <td className="py-2.5 px-4 font-semibold text-black">DJ &amp; Sound System</td>
                              <td className="py-2.5 px-4 text-slate-700">
                                Professional audio sound &amp; microphone arrangement
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-black">
                                Rs. {djAmount.toLocaleString('en-PK')}
                              </td>
                            </tr>
                          )}

                          {/* Stage Decor */}
                          {decorAmount > 0 && (
                            <tr>
                              <td className="py-2.5 px-4 font-mono text-slate-500">04</td>
                              <td className="py-2.5 px-4 font-semibold text-black">Stage &amp; Floral Decor</td>
                              <td className="py-2.5 px-4 text-slate-700">
                                Stage florals, lighting &amp; backdrop styling
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-black">
                                Rs. {decorAmount.toLocaleString('en-PK')}
                              </td>
                            </tr>
                          )}

                          {/* Extra Hours */}
                          {extraCharges > 0 && (
                            <tr>
                              <td className="py-2 px-3 font-mono text-slate-500">05</td>
                              <td className="py-2 px-3 font-semibold text-black">Extra Hours Overtime</td>
                              <td className="py-2 px-3 text-slate-700">
                                {extraHours} hour(s) @ Rs. {ratePerHour.toLocaleString('en-PK')}/hr
                              </td>
                              <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-black">
                                Rs. {extraCharges.toLocaleString('en-PK')}
                              </td>
                            </tr>
                          )}

                          {/* Live Extra Services Added During Event */}
                          {extraServices.map((srv: any, idx: number) => (
                            <tr key={`srv-${idx}`} className="bg-teal-50/30">
                              <td className="py-2 px-3 font-mono text-slate-500">0{6 + idx}</td>
                              <td className="py-2 px-3 font-semibold text-teal-950">+ {srv.title}</td>
                              <td className="py-2 px-3 text-teal-800">
                                Additional during-event service ({srv.category || 'Extras'})
                              </td>
                              <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-teal-800">
                                Rs. {(Number(srv.price) || 0).toLocaleString('en-PK')}
                              </td>
                            </tr>
                          ))}

                          {/* Venue Damage Penalties Invoiced to Client */}
                          {damagesRecord.map((dmg: any, idx: number) => (
                            <tr key={`dmg-${idx}`} className="bg-rose-50/30">
                              <td className="py-2 px-3 font-mono text-slate-500">D{idx + 1}</td>
                              <td className="py-2 px-3 font-semibold text-rose-950">+ Damage Penalty: {dmg.item}</td>
                              <td className="py-2 px-3 text-rose-800">
                                Venue damage settlement billed to final client invoice
                              </td>
                              <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-rose-700">
                                Rs. {(Number(dmg.amount) || 0).toLocaleString('en-PK')}
                              </td>
                            </tr>
                          ))}
                        </>
                      ) : (
                        <tr>
                          <td className="py-2.5 px-4 font-mono text-slate-500">01</td>
                          <td className="py-2.5 px-4 font-semibold text-black">Invoice Service / Charge</td>
                          <td className="py-2.5 px-4 text-slate-700">
                            {printingInvoice.notes || 'Event Reservation & Services'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-black">
                            Rs. {printingInvoice.totalAmount.toLocaleString('en-PK')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table 2: Payment & Settlement Breakdown (Clean Structured Table, Fits A4) */}
                <div className="py-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-black pb-1.5 border-b border-black">
                    Payment &amp; Settlement Ledger
                  </h3>
                  <table className="w-full text-left border-collapse border border-slate-300 text-xs mt-1.5">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-black">
                        <th className="py-1.5 px-3 font-bold uppercase">Financial Category</th>
                        <th className="py-1.5 px-3 font-bold uppercase">Specification / Ledger Note</th>
                        <th className="py-1.5 px-3 font-bold uppercase text-right">Amount (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {subtotal > 0 && discountAmount > 0 && (
                        <>
                          <tr>
                            <td className="py-1.5 px-3 text-slate-700">Gross Subtotal</td>
                            <td className="py-1.5 px-3 text-slate-500">Package, extras &amp; venue line items</td>
                            <td className="py-1.5 px-3 text-right font-mono font-medium text-black">
                              Rs. {subtotal.toLocaleString('en-PK')}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-teal-700 font-semibold">Special Discount ({discountPct}%)</td>
                            <td className="py-1.5 px-3 text-teal-600">Concession applied on total contract</td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold text-teal-700">
                              - Rs. {discountAmount.toLocaleString('en-PK')}
                            </td>
                          </tr>
                        </>
                      )}

                      {/* Cancelled Booking Special Ledger */}
                      {printingInvoice.status === 'Cancelled' ? (
                        <>
                          <tr className="bg-rose-50/70 font-semibold text-rose-900">
                            <td className="py-1.5 px-3">Original Booked Contract</td>
                            <td className="py-1.5 px-3">Contract Value Before Cancellation</td>
                            <td className="py-1.5 px-3 text-right font-mono">
                              Rs. {printingInvoice.totalAmount.toLocaleString('en-PK')}
                            </td>
                          </tr>
                          <tr className="bg-teal-50/60 font-semibold text-teal-900">
                            <td className="py-1.5 px-3">Advance Received from Client</td>
                            <td className="py-1.5 px-3">Collected Deposit</td>
                            <td className="py-1.5 px-3 text-right font-mono">
                              Rs. {printingInvoice.paidAmount.toLocaleString('en-PK')}
                            </td>
                          </tr>
                          <tr className="text-rose-700 font-semibold">
                            <td className="py-1.5 px-3">Amount Used / Retained Deductions</td>
                            <td className="py-1.5 px-3">Operational charges retained by hall</td>
                            <td className="py-1.5 px-3 text-right font-mono">
                              Rs. {(printingInvoice.cancellationRecord?.amount_used || printingInvoice.cancellationRecord?.deduction_amount || 0).toLocaleString('en-PK')}
                            </td>
                          </tr>
                          <tr className="text-teal-900 font-bold bg-teal-50/60">
                            <td className="py-1.5 px-3">
                              {printingInvoice.cancellationRecord?.cancellation_type === 'pause_and_adjust'
                                ? 'Retained Credit Voucher (Future Event)'
                                : 'Refund Disbursed to Client'}
                            </td>
                            <td className="py-1.5 px-3">
                              {printingInvoice.cancellationRecord?.type_label || 'Settled Settlement'}
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono text-sm">
                              Rs. {(printingInvoice.cancellationRecord?.net_amount || 0).toLocaleString('en-PK')}
                            </td>
                          </tr>
                          <tr className="border-t-2 border-black font-bold">
                            <td className="py-1.5 px-3 text-slate-700">Pending Balance</td>
                            <td className="py-1.5 px-3 text-slate-500 font-normal">Voided / Settled (Date Freed)</td>
                            <td className="py-1.5 px-3 text-right font-mono">Rs. 0</td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr className="font-bold bg-slate-50">
                            <td className="py-1.5 px-3 text-black">Total Net Contract Amount</td>
                            <td className="py-1.5 px-3 text-slate-600 font-normal">Rent, Catering, Decor, Extras &amp; Invoiced Damages</td>
                            <td className="py-1.5 px-3 text-right font-mono text-black font-bold">
                              Rs. {contractTotal.toLocaleString('en-PK')}
                            </td>
                          </tr>

                          {/* Itemized Payment History Table Rows */}
                          {paymentHistory.length > 0 ? (
                            paymentHistory.map((p, pIdx) => (
                              <tr key={`pay-${pIdx}`} className="bg-emerald-50/40 text-emerald-950">
                                <td className="py-1.5 px-3 font-semibold">&bull; Payment Received ({p.date})</td>
                                <td className="py-1.5 px-3 text-emerald-800 text-[11px]">Installment via {p.method}</td>
                                <td className="py-1.5 px-3 text-right font-mono text-emerald-800 font-semibold">
                                  Rs. {p.amount}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr className="bg-emerald-50/40 text-emerald-950">
                              <td className="py-1.5 px-3 font-semibold">&bull; Total Advance Received</td>
                              <td className="py-1.5 px-3 text-emerald-800 text-[11px]">Advance payment deposit</td>
                              <td className="py-1.5 px-3 text-right font-mono text-emerald-800 font-semibold">
                                Rs. {paidAmount.toLocaleString('en-PK')}
                              </td>
                            </tr>
                          )}

                          <tr className="bg-emerald-50/80 font-bold border-t border-emerald-200">
                            <td className="py-2 px-3 text-emerald-950">Total Paid by Client</td>
                            <td className="py-2 px-3 text-emerald-800 text-[11px] font-normal">
                              Cumulative payments credited to invoice
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-800 text-sm">
                              Rs. {paidAmount.toLocaleString('en-PK')}
                            </td>
                          </tr>

                          <tr className="border-t-2 border-black font-bold bg-slate-50/50">
                            <td className="py-2 px-3 text-black">Remaining Balance Due</td>
                            <td className="py-2 px-3 text-[11px] font-normal">
                              {balanceDue <= 0 ? (
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 uppercase tracking-wide">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Fully Settled &amp; Paid Clear
                                </span>
                              ) : (
                                <span className="text-rose-600 font-medium">Pending client balance payable</span>
                              )}
                            </td>
                            <td className={`py-2 px-3 text-right font-mono text-sm ${balanceDue > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                              Rs. {balanceDue.toLocaleString('en-PK')}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Notes & Signatures (Clean A4 Fit) */}
                <div className="pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-xs">
                  <div>
                    <p className="font-bold text-black uppercase tracking-wider text-[10px]">
                      Terms &amp; Acknowledgement
                    </p>
                    <p className="text-slate-600 mt-0.5 max-w-sm text-[10px] leading-tight">
                      This is an official system-generated receipt. Payments are acknowledged and reconciled. Hall reservation is governed by agreed event policies.
                    </p>
                  </div>
                  <div className="w-52 text-center sm:text-right shrink-0">
                    <div className="h-8 border-b border-black mb-1" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                      Authorized Accounts Officer
                    </p>
                    <p className="text-[9px] text-slate-500">Mehar Palace Marquee &middot; Finance Dept</p>
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar (Hidden in Print) */}
              <div className="no-print shrink-0 px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPrintingInvoice(null)}
                  className="no-print px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="no-print inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Official Slip</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};
