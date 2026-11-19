import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  Plus,
  Printer,
  Search,
  X,
} from 'lucide-react';
import { SEED_BOOKINGS, SEED_INVOICES } from '../../data/seedData';

export type InvoiceStatus = 'Paid' | 'Partial' | 'Unpaid';

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
}

interface BookingOption {
  ref: string;
  customerName: string;
}

const STATUS_BADGE_STYLES: Record<InvoiceStatus, string> = {
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Partial: 'bg-amber-50 text-amber-800 border-amber-200',
  Unpaid: 'bg-red-50 text-red-700 border-red-200',
};

export const InvoicesBillingPage: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(SEED_INVOICES);
  const [bookings] = useState<BookingOption[]>(
    SEED_BOOKINGS.map((b) => ({ ref: b.bookingId, customerName: b.customerName }))
  );

  // Filter bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | InvoiceStatus>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceRecord | null>(null);

  // Create Manual Invoice form state
  const [selectedBookingRef, setSelectedBookingRef] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const kpiMetrics = useMemo(() => {
    if (invoices.length === 0) {
      return {
        totalInvoiced: '[--]',
        totalCollected: '[--]',
        pendingReceivables: '[--]',
      };
    }

    const invoicedSum = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const collectedSum = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const pendingSum = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

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
    setCustomerName(matched ? matched.customerName : '');
  };

  const handleOpenCreateModal = () => {
    setSelectedBookingRef('');
    setCustomerName('');
    setTotalAmount('');
    setAdvancePaid('');
    setDueDate('');
    setNotes('');
    setIsCreateOpen(true);
  };

  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(totalAmount);
    const paid = parseFloat(advancePaid || '0');
    if (Number.isNaN(total) || total <= 0) return;

    const safePaid = Number.isNaN(paid) ? 0 : Math.max(0, Math.min(paid, total));
    const balance = Math.max(0, total - safePaid);
    const computedStatus: InvoiceStatus =
      balance === 0 ? 'Paid' : safePaid > 0 ? 'Partial' : 'Unpaid';

    const created: InvoiceRecord = {
      id: `INV-${Date.now().toString().slice(-4)}`,
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
    setIsCreateOpen(false);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
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
                      Rs. {inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-mono tabular-nums text-emerald-700">
                      Rs. {inv.paidAmount.toLocaleString()}
                    </td>
                    <td
                      className={`py-3.5 px-5 text-sm font-mono tabular-nums font-semibold ${
                        inv.balanceDue > 0 ? 'text-red-600' : 'text-slate-600'
                      }`}
                    >
                      Rs. {inv.balanceDue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_STYLES[inv.status]}`}
                      >
                        {inv.status}
                      </span>
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
                          onClick={handlePrintInvoice}
                          aria-label={`Print ${inv.id}`}
                          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
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
                Create Manual Invoice
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

            <form onSubmit={handleGenerateInvoice} className="p-5 space-y-4">
              <div>
                <label
                  htmlFor="inv-booking"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Select Booking
                </label>
                <select
                  id="inv-booking"
                  value={selectedBookingRef}
                  onChange={(e) => handleBookingChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                >
                  <option value="">[--]</option>
                  {bookings.map((b) => (
                    <option key={b.ref} value={b.ref}>
                      {b.ref} — {b.customerName}
                    </option>
                  ))}
                </select>
              </div>

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
                  placeholder="[--]"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="inv-total"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Total Amount (Rs.)
                  </label>
                  <input
                    id="inv-total"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="[--]"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="inv-advance"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Advance Paid (Rs.)
                  </label>
                  <input
                    id="inv-advance"
                    type="number"
                    min="0"
                    step="1"
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(e.target.value)}
                    placeholder="[--]"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="inv-due-date"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Due Date
                </label>
                <input
                  id="inv-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div>
                <label
                  htmlFor="inv-notes"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Notes
                </label>
                <textarea
                  id="inv-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="[--]"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 resize-none"
                />
              </div>

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
                  Generate Invoice
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
                <span className="text-slate-500">Total Amount</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  Rs. {viewingInvoice.totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Paid Amount</span>
                <span className="font-mono tabular-nums font-semibold text-emerald-700">
                  Rs. {viewingInvoice.paidAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Balance Due</span>
                <span
                  className={`font-mono tabular-nums font-semibold ${
                    viewingInvoice.balanceDue > 0 ? 'text-red-600' : 'text-slate-900'
                  }`}
                >
                  Rs. {viewingInvoice.balanceDue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Due Date</span>
                <span className="font-mono text-slate-700">
                  {viewingInvoice.dueDate}
                </span>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handlePrintInvoice}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
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
  );
};
