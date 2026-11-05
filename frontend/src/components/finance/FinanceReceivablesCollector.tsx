import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowDownLeft,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  Printer,
  Calendar,
  CreditCard,
  Building2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Download,
  X,
  FileText,
  User,
  ShieldCheck,
} from 'lucide-react';
import { financeApi, bookingsApi } from '../../api/client';
import { InvoiceRecord, Booking } from '../../types';

interface FinanceReceivablesCollectorProps {
  onNavigateToTab?: (tabId: string) => void;
}

export const FinanceReceivablesCollector: React.FC<FinanceReceivablesCollectorProps> = ({
  onNavigateToTab,
}) => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Collection Modal
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectChannel, setCollectChannel] = useState<'Cash' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [collectRef, setCollectRef] = useState('');
  const [collectNotes, setCollectNotes] = useState('');

  // Receipt Modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    invoice: InvoiceRecord;
    amountPaid: number;
    channel: string;
    txnRef: string;
    date: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [invs, bks] = await Promise.all([
        financeApi.listInvoices(),
        bookingsApi.list(),
      ]);
      setInvoices(invs);
      setBookings(bks);
    } catch (err) {
      console.error('Failed to load receivables:', err);
      showToast('Error loading accounts receivable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCollectDialog = (invoice: InvoiceRecord) => {
    setSelectedInvoice(invoice);
    setCollectAmount(Number(invoice.remainingBalance) || 0);
    setCollectRef(`REC-${Math.floor(10000 + Math.random() * 90000)}`);
    setCollectNotes(`Collection for event booking ${invoice.bookingId}`);
    setIsCollectModalOpen(true);
  };

  const handleRecordCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || collectAmount <= 0) return;

    try {
      const res = await financeApi.recordCollection(selectedInvoice.id, {
        amount: collectAmount,
        channel: collectChannel,
        transactionRef: collectRef,
        notes: collectNotes,
      });

      setInvoices((prev) => prev.map((inv) => (inv.id === res.invoice.id ? res.invoice : inv)));
      setIsCollectModalOpen(false);

      // Open Customer Receipt Voucher
      setReceiptData({
        invoice: res.invoice,
        amountPaid: collectAmount,
        channel: collectChannel,
        txnRef: res.transactionRef || collectRef,
        date: new Date().toISOString().slice(0, 10),
      });
      setIsReceiptModalOpen(true);
      showToast(`Collected Rs. ${Number(collectAmount || 0).toLocaleString()} from ${res.invoice.customerName}!`);
    } catch (err) {
      console.error('Failed to record collection:', err);
      showToast('Error recording customer collection.');
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== 'All' && inv.paymentStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (inv.customerName || '').toLowerCase().includes(q);
        const matchesInv = (inv.invoiceId || '').toLowerCase().includes(q);
        const matchesBk = (inv.bookingId || '').toLowerCase().includes(q);
        return matchesName || matchesInv || matchesBk;
      }
      return true;
    });
  }, [invoices, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const totalReceivables = invoices.reduce((acc, i) => acc + (Number(i.remainingBalance) || 0), 0);
    const totalCollected = invoices.reduce((acc, i) => acc + (Number(i.paidAmount) || 0), 0);
    const totalBilled = invoices.reduce((acc, i) => acc + (Number(i.totalAmount) || 0), 0);
    const pendingCount = invoices.filter((i) => i.paymentStatus !== 'Paid').length;
    return {
      totalReceivables: Number(totalReceivables) || 0,
      totalCollected: Number(totalCollected) || 0,
      totalBilled: Number(totalBilled) || 0,
      pendingCount,
    };
  }, [invoices]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 select-none animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900 border border-teal-500/40 text-white rounded-2xl shadow-2xl animate-in slide-in-from-top-3">
          <Sparkles className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-[#131b2e] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-700/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl -z-10" />

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Live Invoice Reconciliation</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans'] text-white">
            Accounts Receivable (A/R) &amp; Collections
          </h1>
          <p className="text-sm text-slate-300">
            Monitor client billing balances, advance payments, and record instant collections with automatic receipt generation.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-5 border border-slate-700/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Outstanding A/R Due</span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
              Rs. {Math.round(Number(stats.totalReceivables || 0)).toLocaleString()}
            </span>
            <span className="text-[11px] text-amber-300 font-semibold mt-0.5 block">{stats.pendingCount} Invoices Due</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-5 border border-slate-700/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Collected</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              Rs. {Math.round(Number(stats.totalCollected || 0)).toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold mt-0.5 block">Settled Advances</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-5 border border-slate-700/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gross Billed</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">
              Rs. {Math.round(Number(stats.totalBilled || 0)).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">Total Contracts</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-5 border border-slate-700/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Collection Rate</span>
            <span className="text-2xl font-black text-teal-400 font-mono mt-1 block">
              {stats.totalBilled > 0
                ? `${Math.round(((stats.totalCollected || 0) / stats.totalBilled) * 100)}%`
                : '100%'}
            </span>
            <span className="text-[11px] text-teal-300 font-semibold mt-0.5 block">Recovery Efficiency</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-700/50 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, invoice ID, or booking ref..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">All Invoices</option>
              <option value="Partial" className="bg-slate-900 text-white">Partial Dues</option>
              <option value="Unpaid" className="bg-slate-900 text-white">Unpaid</option>
              <option value="Paid" className="bg-slate-900 text-white">Fully Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Receivables Table */}
      <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-700/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6 whitespace-nowrap">Invoice # &amp; Booking</th>
                <th className="py-4 px-4 whitespace-nowrap">Client Name</th>
                <th className="py-4 px-4 whitespace-nowrap">Event Date</th>
                <th className="py-4 px-4 text-right whitespace-nowrap">Contract Total</th>
                <th className="py-4 px-4 text-right whitespace-nowrap">Paid Amount</th>
                <th className="py-4 px-4 text-right whitespace-nowrap">Balance Due</th>
                <th className="py-4 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-4 px-6 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-xs sm:text-sm font-mono">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40 border-b border-slate-700/50 transition-colors">
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="font-bold text-white block">{inv.invoiceId}</span>
                    <span className="text-[11px] text-teal-400 font-bold">{inv.bookingId}</span>
                  </td>
                  <td className="py-4 px-4 font-sans whitespace-nowrap">
                    <span className="font-bold text-white">{inv.customerName}</span>
                  </td>
                  <td className="py-4 px-4 font-sans text-xs text-slate-400 whitespace-nowrap">
                    {inv.date}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-white whitespace-nowrap">
                    Rs. {Math.round(Number(inv.totalAmount || 0)).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-emerald-400 whitespace-nowrap">
                    Rs. {Math.round(Number(inv.paidAmount || 0)).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right font-black whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-xl border ${
                        inv.remainingBalance > 0
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      Rs. {Math.round(Number(inv.remainingBalance || 0)).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-sans whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        inv.paymentStatus === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : inv.paymentStatus === 'Partial'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center whitespace-nowrap">
                    {inv.remainingBalance > 0 ? (
                      <button
                        type="button"
                        onClick={() => openCollectDialog(inv)}
                        className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs shadow-xs transition cursor-pointer whitespace-nowrap inline-flex items-center justify-center shrink-0"
                      >
                        Record Collection
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-bold font-sans">Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Collection Modal */}
      {isCollectModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                    Record Customer Collection
                  </h3>
                  <span className="text-xs text-slate-400">Intake payment against outstanding booking balance</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCollectModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordCollection} className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block">Customer:</span>
                  <strong className="text-white text-sm">{selectedInvoice.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Booking Reference:</span>
                  <strong className="text-white font-mono text-sm">{selectedInvoice.bookingId}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Contract Total:</span>
                  <strong className="text-white font-mono">
                    Rs. {Math.round(Number(selectedInvoice.totalAmount || 0)).toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Outstanding Balance:</span>
                  <strong className="text-amber-400 font-mono text-sm">
                    Rs. {Math.round(Number(selectedInvoice.remainingBalance || 0)).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Collection Amount (Rs.) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedInvoice.remainingBalance}
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-base font-black font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Payment Mode</label>
                  <select
                    value={collectChannel}
                    onChange={(e) => setCollectChannel(e.target.value as 'Cash' | 'Bank Transfer' | 'Cheque')}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-teal-500 transition"
                  >
                    <option value="Cash" className="bg-slate-900 text-white">Cash Receipt</option>
                    <option value="Bank Transfer" className="bg-slate-900 text-white">Bank Transfer (Online/IBAN)</option>
                    <option value="Cheque" className="bg-slate-900 text-white">Bank Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Transaction Ref / Receipt #</label>
                  <input
                    type="text"
                    required
                    value={collectRef}
                    onChange={(e) => setCollectRef(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Remarks / Payment Notes</label>
                <textarea
                  rows={2}
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-extrabold shadow-md transition cursor-pointer"
                >
                  Confirm &amp; Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Customer Payment Receipt Modal */}
      {isReceiptModalOpen && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/80 text-white">
              <div>
                <span className="text-[11px] font-mono text-teal-400 uppercase tracking-widest block">
                  MARRIAGE HALL MANAGEMENT SYSTEM
                </span>
                <h3 className="text-lg font-bold">Official Payment Receipt</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700">
                <div>
                  <span className="text-slate-400 block">Receipt No:</span>
                  <strong className="text-white font-mono text-sm">{receiptData.txnRef}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Date:</span>
                  <strong className="text-white">{receiptData.date}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Received From:</span>
                  <strong className="text-white">{receiptData.invoice.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Event Ref:</span>
                  <strong className="text-teal-400 font-mono">{receiptData.invoice.bookingId}</strong>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-300 font-semibold block">Amount Received</span>
                  <span className="text-xs text-emerald-400">Mode: {receiptData.channel}</span>
                </div>
                <span className="text-2xl font-black text-emerald-300 font-mono">
                  Rs. {Number(receiptData.amountPaid || 0).toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Contract Total:</span>
                  <span>Rs. {Math.round(Number(receiptData.invoice.totalAmount || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Total Amount Paid to Date:</span>
                  <span className="text-emerald-400 font-bold">
                    Rs. {Math.round(Number(receiptData.invoice.paidAmount || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-white font-bold border-t border-slate-700 pt-1">
                  <span>Remaining Balance Due:</span>
                  <span className="text-amber-400">
                    Rs. {Math.round(Number(receiptData.invoice.remainingBalance || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-[11px] text-slate-400">
                <div className="border-t border-slate-700 pt-1">
                  <span>Customer Signature</span>
                </div>
                <div className="border-t border-slate-700 pt-1">
                  <span>Cashier / Finance Officer</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
