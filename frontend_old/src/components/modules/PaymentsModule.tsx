import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Clock,
  Clock4,
  RotateCcw,
  Check,
  X,
  Eye,
  Printer,
  FileText,
  Search,
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Receipt,
  Download,
  Filter,
  Plus,
} from 'lucide-react';
import { ExtraTimeRequest, InvoiceRecord } from '../../types';
import { financeApi, floorStaffApi } from '../../api/client';

export const PaymentsModule: React.FC = () => {
  // STRICT DATA RULE: DO NOT hardcode any dummy data. Start as empty arrays.
  const [extraTimeRequests, setExtraTimeRequests] = useState<ExtraTimeRequest[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invData, reqData] = await Promise.all([
        financeApi.listInvoices().catch(() => []),
        floorStaffApi.listExtraTimeRequests().catch(() => []),
      ]);
      setInvoices(invData);
      setExtraTimeRequests(reqData);
    } catch (err: any) {
      console.error('Failed to load finance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Bar state for Main Invoices & Payments Table
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');

  // Modal Preview States
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  // Approve action
  const handleApprove = (id: string) => {
    floorStaffApi.approveExtraTimeRequest(id).then((updated) => {
      setExtraTimeRequests((prev) =>
        prev.map((req) => (req.id === id ? updated : req))
      );
      setApprovalFeedback('Extra time request approved. Charges appended to billing ledger.');
      setTimeout(() => setApprovalFeedback(null), 3500);
      fetchData(); // Refresh invoices as extra charges might be billed
    }).catch((err: any) => {
      alert(err.message || 'Failed to approve request.');
    });
  };

  // Reject action
  const handleReject = (id: string) => {
    floorStaffApi.rejectExtraTimeRequest(id).then((updated) => {
      setExtraTimeRequests((prev) =>
        prev.map((req) => (req.id === id ? updated : req))
      );
      setApprovalFeedback('Extra time request rejected by Admin.');
      setTimeout(() => setApprovalFeedback(null), 3500);
    }).catch((err: any) => {
      alert(err.message || 'Failed to reject request.');
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setPaymentStatusFilter('All');
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        inv.invoiceId.toLowerCase().includes(q) ||
        inv.bookingId.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (paymentStatusFilter !== 'All' && inv.paymentStatus !== paymentStatusFilter) {
      return false;
    }
    if (startDate && inv.date < startDate) return false;
    if (endDate && inv.date > endDate) return false;
    return true;
  });

  const getPaymentStatusBadge = (status: InvoiceRecord['paymentStatus']) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Paid</span>
          </span>
        );
      case 'Partial':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Partial</span>
          </span>
        );
      case 'Unpaid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            <span>Unpaid</span>
          </span>
        );
      default:
        return (
          <span className="font-mono text-xs text-slate-400">
            [--]
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
              Invoices, Payments &amp; Approvals
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00685f]"></span>
              ADMIN VIEW
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Oversee venue billing tranches, authorize floor overtime requests, and audit settlement receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Ledgers</span>
          </button>
        </div>
      </div>

      {/* Top Section (4 KPI Cards with placeholders [--]) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Revenue
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight mt-1 font-['Plus_Jakarta_Sans']">
                [--]
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#00685f]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-2">
            [Accrued Gross Revenue]
          </span>
        </div>

        {/* Card 2: Pending Payments */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pending Payments
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight mt-1 font-['Plus_Jakarta_Sans']">
                [--]
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-2">
            [Outstanding Tranches]
          </span>
        </div>

        {/* Card 3: Approved Extra Time Charges */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Approved Extra Time Charges
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight mt-1 font-['Plus_Jakarta_Sans']">
                [--]
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Clock4 className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-2">
            [Overtime Surcharges]
          </span>
        </div>

        {/* Card 4: Total Refunds */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Refunds
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight mt-1 font-['Plus_Jakarta_Sans']">
                [--]
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-2">
            [Disbursed Remittances]
          </span>
        </div>
      </div>

      {approvalFeedback && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-2.5 text-xs shadow-xs animate-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
          <span>{approvalFeedback}</span>
        </div>
      )}

      {/* Middle Section: Extra Time Approvals (Crucial for Admin) */}
      <div className="w-full bg-white rounded-2xl border-2 border-amber-200/80 shadow-xs overflow-hidden flex flex-col">
        {/* Section Header */}
        <div className="px-5 py-4 bg-amber-50/50 border-b border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Clock4 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                  Pending Extra Time Requests
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-800 text-[10px] font-mono font-bold">
                  {extraTimeRequests.filter((r) => r.status === 'Pending').length} Pending
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Approve or reject requests sent by Floor Staff.
              </p>
            </div>
          </div>

          <div className="text-[11px] font-mono text-amber-800/80 bg-amber-100/60 px-2.5 py-1 rounded-md">
            [Floor Staff Operational Stream]
          </div>
        </div>

        {/* Pending Requests Table or Empty State */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                <th scope="col" className="py-3 px-4">Hall Name</th>
                <th scope="col" className="py-3 px-4">Booking ID</th>
                <th scope="col" className="py-3 px-4">Requested Hours</th>
                <th scope="col" className="py-3 px-4">Reason</th>
                <th scope="col" className="py-3 px-4">Estimated Charges</th>
                <th scope="col" className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {extraTimeRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                        <Check className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <span className="font-semibold text-slate-700 text-xs sm:text-sm font-['Plus_Jakarta_Sans']">
                        No pending extra time requests.
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Floor staff overtime escalations will appear here for administrative clearance.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                extraTimeRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>[{req.hallName}]</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                      [{req.bookingRef}]
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      +{req.requestedHours} hr
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {req.reason || '[No reason specified]'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      ${req.estimatedCharges.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {req.status === 'Pending' ? (
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => handleApprove(req.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(req.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            req.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          [{req.status}]
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Section: Main Invoices & Payments Table */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
        {/* Title & Filter Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-[#00685f]">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                  All Transactions &amp; Invoices
                </h2>
                <p className="text-[11px] text-slate-400">
                  Comprehensive ledger of invoice issuances, partial deposits, and final settlements.
                </p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              {/* Search input */}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by invoice ID, booking ID, customer..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all"
                />
              </div>

              {/* Date Range Picker */}
              <div className="relative w-full flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  title="Start Date"
                  className="w-1/2 bg-transparent text-xs text-slate-700 focus:outline-none"
                />
                <span className="text-slate-300 text-xs">—</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  title="End Date"
                  className="w-1/2 bg-transparent text-xs text-slate-700 focus:outline-none"
                />
              </div>

              {/* Payment Status Dropdown */}
              <div className="relative w-full">
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all cursor-pointer"
                >
                  <option value="All">Payment Status: All</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            {/* Reset Filters */}
            <div className="flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Invoices Data Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                <th scope="col" className="py-3 px-4">Invoice ID</th>
                <th scope="col" className="py-3 px-4">Booking ID</th>
                <th scope="col" className="py-3 px-4">Customer Name</th>
                <th scope="col" className="py-3 px-4">Total Amount</th>
                <th scope="col" className="py-3 px-4">Paid Amount</th>
                <th scope="col" className="py-3 px-4">Remaining Balance</th>
                <th scope="col" className="py-3 px-4">Payment Status</th>
                <th scope="col" className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredInvoices.length === 0 ? (
                /* Professional Empty State */
                <tr>
                  <td colSpan={8} className="py-16 px-4 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#00685f] shadow-xs">
                        <FileText className="w-7 h-7 stroke-[1.6]" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                          No invoices found.
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                          Financial records and customer invoices will populate here once reservations are created or transaction tranches are logged.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-mono mt-1">
                        <span>invoices: []</span>
                        <span>•</span>
                        <span>[Ledger Empty]</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Invoice ID */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-semibold">
                        [{inv.invoiceId}]
                      </span>
                    </td>

                    {/* Booking ID */}
                    <td className="py-3.5 px-4 font-mono text-teal-800 font-medium">
                      [{inv.bookingId}]
                    </td>

                    {/* Customer Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      [{inv.customerName}]
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      ${inv.totalAmount.toLocaleString()}
                    </td>

                    {/* Paid Amount */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">
                      ${inv.paidAmount.toLocaleString()}
                    </td>

                    {/* Remaining Balance */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      ${inv.remainingBalance.toLocaleString()}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4">
                      {getPaymentStatusBadge(inv.paymentStatus)}
                    </td>

                    {/* Actions: Eye & Printer */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          title="View Invoice Details"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-teal-700 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setIsPrintModalOpen(true);
                          }}
                          title="Print Invoice"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
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

        {/* Footer info strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-slate-50 border-t border-slate-200 text-slate-500 text-xs">
          <span className="font-medium text-slate-600">
            Showing <span className="font-mono">{filteredInvoices.length > 0 ? 1 : 0}</span> -{' '}
            <span className="font-mono">{filteredInvoices.length}</span> of{' '}
            <span className="font-mono">{filteredInvoices.length}</span> total invoices
          </span>
          <div className="text-[11px] text-slate-400 font-mono">
            Audit State: [RECONCILED]
          </div>
        </div>
      </div>

      {/* Invoice Detail / Print Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-[#00685f]">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                    {isPrintModalOpen ? 'Invoice Print Preview' : 'Invoice Statement'} [{selectedInvoice.invoiceId}]
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Booking Ref: {selectedInvoice.bookingId}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedInvoice(null);
                  setIsPrintModalOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Billed Client</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedInvoice.customerName}</div>
                </div>
                <div>{getPaymentStatusBadge(selectedInvoice.paymentStatus)}</div>
              </div>

              <div className="flex flex-col divide-y divide-slate-100">
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Gross Contract Amount</span>
                  <span className="font-mono font-bold text-slate-900">${selectedInvoice.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Advance Paid &amp; Settled</span>
                  <span className="font-mono font-semibold text-emerald-700">-${selectedInvoice.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2.5 font-bold text-slate-900 text-sm">
                  <span>Remaining Balance Due</span>
                  <span className="font-mono text-amber-700">${selectedInvoice.remainingBalance.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedInvoice(null);
                  setIsPrintModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00685f] hover:bg-[#005049] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
