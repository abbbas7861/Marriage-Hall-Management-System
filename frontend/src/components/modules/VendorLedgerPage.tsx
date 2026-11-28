import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CreditCard,
  Eye,
  Plus,
  Printer,
  Search,
  Store,
  Wallet,
  X,
} from 'lucide-react';
import {
  bookingsApi,
  vendorsApi,
  vendorTransactionsApi,
  VendorLedgerEntryItem,
} from '../../api/client';
import { Booking } from '../../types';

interface VendorAccountRow {
  id: string;
  businessName: string;
  category: string;
  contactPerson: string;
  phoneNumber: string;
  totalBilled: number;
  totalPaid: number;
  balanceDue: number;
  status: string;
}

const VENDOR_CATEGORIES = [
  'Decorator',
  'Caterer',
  'Photographer',
  'Sound/Lights',
  'Other',
];

const STATUS_BADGE_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200',
};

const formatCurrency = (amount: number): string => {
  return `Rs. ${Number(amount || 0).toLocaleString()}`;
};

export const VendorLedgerPage: React.FC = () => {
  const [vendors, setVendors] = useState<VendorAccountRow[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');

  // Add Vendor Modal state
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorCategory, setNewVendorCategory] = useState(VENDOR_CATEGORIES[0]);
  const [newVendorContact, setNewVendorContact] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [addVendorError, setAddVendorError] = useState<string | null>(null);
  const [submittingVendor, setSubmittingVendor] = useState(false);

  // Ledger Detail Modal state
  const [selectedVendor, setSelectedVendor] = useState<VendorAccountRow | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<VendorLedgerEntryItem[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Record Transaction Modal state
  const [txnVendor, setTxnVendor] = useState<VendorAccountRow | null>(null);
  const [txnEventRef, setTxnEventRef] = useState('');
  const [txnDate, setTxnDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [txnDescription, setTxnDescription] = useState('');
  const [txnTotalBill, setTxnTotalBill] = useState('');
  const [txnAmountPaid, setTxnAmountPaid] = useState('0');
  const [txnPaymentMode, setTxnPaymentMode] = useState<'Cash' | 'Bank' | 'Credit'>('Cash');
  const [txnError, setTxnError] = useState<string | null>(null);
  const [submittingTxn, setSubmittingTxn] = useState(false);

  // Record Payment Modal state
  const [paymentVendor, setPaymentVendor] = useState<VendorAccountRow | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank' | 'Cheque'>('Cash');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Printable Vendor Receipt Modal state
  const [vendorReceiptData, setVendorReceiptData] = useState<{
    receiptNumber: string;
    date: string;
    vendorName: string;
    eventRef?: string;
    amountPaid: number;
    paymentMode: string;
    remainingBalance: number;
    notes?: string;
  } | null>(null);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorsApi.list();
      if (Array.isArray(data)) {
        setVendors(
          data.map((v: any) => ({
            id: String(v.id),
            businessName: v.businessName || v.name || '[--]',
            category: v.category || 'Other',
            contactPerson: v.contactPerson || '',
            phoneNumber: v.phoneNumber || v.phone || '',
            totalBilled: Number(v.totalBilled) || 0,
            totalPaid: Number(v.totalPaid) || 0,
            balanceDue: Number(v.balanceDue) || 0,
            status: v.status || 'Active',
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load vendor accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
    bookingsApi
      .list()
      .then((data) => {
        if (Array.isArray(data)) setBookings(data);
      })
      .catch(() => {});
  }, []);

  const loadVendorLedger = async (vendor: VendorAccountRow) => {
    setSelectedVendor(vendor);
    setLoadingLedger(true);
    try {
      const res = await vendorsApi.getLedger(vendor.id);
      if (res?.vendor) {
        setSelectedVendor({
          id: String(res.vendor.id),
          businessName: res.vendor.businessName || vendor.businessName,
          category: res.vendor.category || vendor.category,
          contactPerson: res.vendor.contactPerson || vendor.contactPerson,
          phoneNumber: res.vendor.phoneNumber || vendor.phoneNumber,
          totalBilled: Number(res.vendor.totalBilled) || 0,
          totalPaid: Number(res.vendor.totalPaid) || 0,
          balanceDue: Number(res.vendor.balanceDue) || 0,
          status: res.vendor.status || vendor.status,
        });
      }
      setLedgerEntries(Array.isArray(res?.entries) ? res.entries : []);
    } catch (err) {
      console.error('Failed to load vendor ledger:', err);
      setLedgerEntries([]);
    } finally {
      setLoadingLedger(false);
    }
  };

  const openAddVendorModal = () => {
    setNewVendorName('');
    setNewVendorCategory(VENDOR_CATEGORIES[0]);
    setNewVendorContact('');
    setNewVendorPhone('');
    setAddVendorError(null);
    setIsAddVendorOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim() || submittingVendor) {
      if (!newVendorName.trim()) setAddVendorError('Vendor Name is required.');
      return;
    }

    setSubmittingVendor(true);
    setAddVendorError(null);
    try {
      await vendorsApi.create({
        businessName: newVendorName.trim(),
        category: newVendorCategory,
        contactPerson: newVendorContact.trim(),
        phoneNumber: newVendorPhone.trim(),
        status: 'Active',
      });
      await loadVendors();
      setIsAddVendorOpen(false);
    } catch (err: any) {
      setAddVendorError(err?.message || 'Failed to save vendor.');
    } finally {
      setSubmittingVendor(false);
    }
  };

  const openTransactionModal = (vendor: VendorAccountRow) => {
    setTxnVendor(vendor);
    setTxnEventRef(bookings[0]?.bookingRef || '');
    setTxnDate(new Date().toISOString().slice(0, 10));
    setTxnDescription('');
    setTxnTotalBill('');
    setTxnAmountPaid('0');
    setTxnPaymentMode('Cash');
    setTxnError(null);
  };

  const txnRemainingBalance = useMemo(() => {
    const bill = parseFloat(txnTotalBill) || 0;
    const paid = parseFloat(txnAmountPaid) || 0;
    return Math.max(0, bill - paid);
  }, [txnTotalBill, txnAmountPaid]);

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnVendor || submittingTxn) return;

    const bill = parseFloat(txnTotalBill) || 0;
    const paid = parseFloat(txnAmountPaid) || 0;
    if (bill <= 0 && paid <= 0) {
      setTxnError('Enter a valid Total Bill Amount or Amount Paid greater than 0.');
      return;
    }
    if (!txnDescription.trim()) {
      setTxnError('Item / Description is required.');
      return;
    }

    setSubmittingTxn(true);
    setTxnError(null);
    try {
      await vendorTransactionsApi.create({
        vendorId: txnVendor.id,
        eventRef: txnEventRef,
        date: txnDate,
        description: txnDescription.trim(),
        totalBill: bill,
        amountPaid: paid,
        paymentMode: txnPaymentMode,
      });
      await loadVendors();
      if (selectedVendor && selectedVendor.id === txnVendor.id) {
        await loadVendorLedger(txnVendor);
      }
      const savedVendorName = txnVendor.businessName;
      const updatedBalance = Math.max(0, txnVendor.balanceDue + bill - paid);
      setTxnVendor(null);
      if (paid > 0) {
        setVendorReceiptData({
          receiptNumber: `VR-${Date.now().toString().slice(-6)}`,
          date: txnDate,
          vendorName: savedVendorName,
          eventRef: txnEventRef || undefined,
          amountPaid: paid,
          paymentMode: txnPaymentMode,
          remainingBalance: updatedBalance,
          notes: txnDescription.trim(),
        });
      }
    } catch (err: any) {
      setTxnError(err?.message || 'Failed to save transaction.');
    } finally {
      setSubmittingTxn(false);
    }
  };

  const openPaymentModal = (vendor: VendorAccountRow) => {
    setPaymentVendor(vendor);
    setPaymentAmount(vendor.balanceDue > 0 ? String(vendor.balanceDue) : '');
    setPaymentMode('Cash');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentNotes('');
    setPaymentError(null);
  };

  const closePaymentModal = () => {
    setPaymentVendor(null);
    setPaymentError(null);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentVendor || submittingPayment) return;

    const amount = parseFloat(paymentAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setPaymentError('Please enter a valid payment amount greater than 0.');
      return;
    }

    setSubmittingPayment(true);
    setPaymentError(null);
    try {
      await vendorsApi.recordPayment(paymentVendor.id, {
        amount,
        paymentMode,
        date: paymentDate,
        notes: paymentNotes.trim(),
      });

      await loadVendors();
      if (selectedVendor && selectedVendor.id === paymentVendor.id) {
        await loadVendorLedger(paymentVendor);
      }
      const savedVendorName = paymentVendor.businessName;
      const updatedBalance = Math.max(0, paymentVendor.balanceDue - amount);
      closePaymentModal();
      setVendorReceiptData({
        receiptNumber: `VR-${Date.now().toString().slice(-6)}`,
        date: paymentDate,
        vendorName: savedVendorName,
        amountPaid: amount,
        paymentMode,
        remainingBalance: updatedBalance,
        notes: paymentNotes.trim() || undefined,
      });
    } catch (err: any) {
      setPaymentError(err?.message || 'Failed to record vendor payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const filteredVendors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (v) =>
        v.businessName.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.contactPerson.toLowerCase().includes(q)
    );
  }, [vendors, searchQuery]);

  const filteredLedgerEntries = useMemo(() => {
    return ledgerEntries.filter((entry) => {
      const entryDate = (entry.date || '').slice(0, 10);
      if (appliedFromDate && entryDate < appliedFromDate) return false;
      if (appliedToDate && entryDate > appliedToDate) return false;
      return true;
    });
  }, [ledgerEntries, appliedFromDate, appliedToDate]);

  const handleApplyDateFilter = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  };

  const kpis = useMemo(() => {
    if (vendors.length === 0) {
      return {
        totalVendors: '[--]',
        totalPayable: '[--]',
        totalPaid: '[--]',
      };
    }
    const payableSum = vendors.reduce((acc, v) => acc + v.balanceDue, 0);
    const paidSum = vendors.reduce((acc, v) => acc + v.totalPaid, 0);

    return {
      totalVendors: String(vendors.length),
      totalPayable: formatCurrency(payableSum),
      totalPaid: formatCurrency(paidSum),
    };
  }, [vendors]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
            Vendor Accounts &amp; Ledger
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage vendor credits, debits, and event-specific purchases.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddVendorModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Vendors
            </p>
            <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
              {kpis.totalVendors}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Payable (Credit)
            </p>
            <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-amber-700">
              {kpis.totalPayable}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Paid (Debit)
            </p>
            <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {kpis.totalPaid}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Date Range Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor by name, category, or contact..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              aria-label="From Date"
              title="From Date"
              placeholder="mm/dd/yyyy"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            />
            <input
              type="date"
              aria-label="To Date"
              title="To Date"
              placeholder="mm/dd/yyyy"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            />
            <button
              type="button"
              onClick={handleApplyDateFilter}
              className="h-10 px-4 rounded-lg bg-teal-700 text-xs font-semibold text-white hover:bg-teal-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              Apply Filter
            </button>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-500">
          {filteredVendors.length} {filteredVendors.length === 1 ? 'vendor' : 'vendors'} listed
        </span>
      </div>

      {/* Vendor Accounts Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Vendor Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Total Billed</th>
                <th className="py-3.5 px-4 text-right">Total Paid</th>
                <th className="py-3.5 px-4 text-right">Balance Due</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading vendor accounts...
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No vendors found.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{vendor.businessName}</p>
                      {(vendor.contactPerson || vendor.phoneNumber) && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {[vendor.contactPerson, vendor.phoneNumber].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {vendor.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {formatCurrency(vendor.totalBilled)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-700 font-medium">
                      {formatCurrency(vendor.totalPaid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatCurrency(vendor.balanceDue)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                          STATUS_BADGE_STYLES[vendor.status] || STATUS_BADGE_STYLES.Active
                        }`}
                      >
                        {vendor.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => loadVendorLedger(vendor)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-teal-300 hover:text-teal-700 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Ledger
                        </button>
                        <button
                          type="button"
                          onClick={() => openTransactionModal(vendor)}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-teal-300 hover:text-teal-700 transition-colors cursor-pointer"
                        >
                          Add Entry
                        </button>
                        <button
                          type="button"
                          onClick={() => openPaymentModal(vendor)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Pay
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

      {/* Add Vendor Modal */}
      {isAddVendorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900">
                  Add Vendor
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Register a new supplier or vendor account
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddVendorOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="p-6 space-y-4">
              {addVendorError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {addVendorError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Vendor Name
                </label>
                <input
                  type="text"
                  required
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="e.g. Royal Stage & Floral Studio"
                  className="w-full h-10 rounded-lg border border-slate-300 px-3.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category
                </label>
                <select
                  value={newVendorCategory}
                  onChange={(e) => setNewVendorCategory(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 cursor-pointer"
                >
                  {VENDOR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={newVendorContact}
                    onChange={(e) => setNewVendorContact(e.target.value)}
                    placeholder="e.g. Tariq Mahmood"
                    className="w-full h-10 rounded-lg border border-slate-300 px-3.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newVendorPhone}
                    onChange={(e) => setNewVendorPhone(e.target.value)}
                    placeholder="e.g. +92 300 1234567"
                    className="w-full h-10 rounded-lg border border-slate-300 px-3.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddVendorOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVendor}
                  className="px-4 py-2 rounded-lg bg-teal-700 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submittingVendor ? 'Saving...' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Ledger Detail Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70">
              <div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-900">
                  {selectedVendor.businessName}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Contact:{' '}
                  {[selectedVendor.contactPerson, selectedVendor.phoneNumber]
                    .filter(Boolean)
                    .join(' • ') || '[--]'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right mr-1">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                    Balance Due
                  </p>
                  <p className="text-base font-bold font-mono tabular-nums text-amber-700">
                    {formatCurrency(selectedVendor.balanceDue)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openTransactionModal(selectedVendor)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-teal-300 hover:text-teal-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  New Transaction
                </button>
                <button
                  type="button"
                  onClick={() => openPaymentModal(selectedVendor)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVendor(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Transaction History Table */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Event Ref</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4 text-right">Total Billed (Credit)</th>
                        <th className="py-3 px-4 text-right">Amount Paid (Debit)</th>
                        <th className="py-3 px-4 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {loadingLedger ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-500">
                            Loading transaction history...
                          </td>
                        </tr>
                      ) : filteredLedgerEntries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-500">
                            No transactions recorded for this vendor{appliedFromDate || appliedToDate ? ' in the selected date range' : ' yet'}.
                          </td>
                        </tr>
                      ) : (
                        filteredLedgerEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-50/60">
                            <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                              {entry.date}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                              {entry.eventRef || '[--]'}
                            </td>
                            <td className="py-3 px-4 text-slate-800">
                              <p className="font-medium">{entry.description}</p>
                              {(entry.paymentMode || entry.reference) && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {[entry.paymentMode, entry.reference].filter(Boolean).join(' • ')}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-700">
                              {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700">
                              {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                              {formatCurrency(entry.balance)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Transaction Modal */}
      {txnVendor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900">
                  Record Transaction
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{txnVendor.businessName}</p>
              </div>
              <button
                type="button"
                onClick={() => setTxnVendor(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
              {txnError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {txnError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Event
                  </label>
                  <select
                    value={txnEventRef}
                    onChange={(e) => setTxnEventRef(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 cursor-pointer"
                  >
                    <option value="">General / No Event</option>
                    {bookings.map((b) => (
                      <option key={b.id || b.bookingRef} value={b.bookingRef}>
                        [{b.bookingRef}] {b.customerName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    required
                    value={txnDate}
                    onChange={(e) => setTxnDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Item / Description
                </label>
                <input
                  type="text"
                  required
                  value={txnDescription}
                  onChange={(e) => setTxnDescription(e.target.value)}
                  placeholder="e.g. Stage Flowers, Tent Chairs"
                  className="w-full h-10 rounded-lg border border-slate-300 px-3.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Total Bill Amount (Credit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={txnTotalBill}
                    onChange={(e) => setTxnTotalBill(e.target.value)}
                    placeholder="0"
                    className="w-full h-10 rounded-lg border border-slate-300 px-3.5 text-sm font-mono tabular-nums text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Amount Paid Now (Debit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={txnAmountPaid}
                    onChange={(e) => setTxnAmountPaid(e.target.value)}
                    placeholder="0"
                    className="w-full h-10 rounded-lg border border-slate-300 px-3.5 text-sm font-mono tabular-nums text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Remaining Balance
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formatCurrency(txnRemainingBalance)}
                    className="w-full h-10 rounded-lg border border-amber-200 bg-amber-50 px-3.5 text-sm font-bold font-mono tabular-nums text-amber-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Payment Mode
                  </label>
                  <select
                    value={txnPaymentMode}
                    onChange={(e) => setTxnPaymentMode(e.target.value as 'Cash' | 'Bank' | 'Credit')}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="Credit">Credit</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setTxnVendor(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTxn}
                  className="px-4 py-2 rounded-lg bg-teal-700 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submittingTxn ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentVendor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900">
                  Record Payment
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {paymentVendor.businessName} (Balance: {formatCurrency(paymentVendor.balanceDue)})
                </p>
              </div>
              <button
                type="button"
                onClick={closePaymentModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {paymentError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {paymentError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Amount (Rs.)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  className="w-full h-10 rounded-lg border border-slate-300 px-3.5 text-sm font-mono tabular-nums text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as 'Cash' | 'Bank' | 'Cheque')}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notes / Reference
                </label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Cheque #, bank transfer ref, or invoice notes..."
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-4 py-2 rounded-lg bg-teal-700 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submittingPayment ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Vendor Payment Receipt Modal */}
      {vendorReceiptData && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px] p-4 overflow-y-auto print:static print:bg-white print:p-0 print:block"
          role="dialog"
          aria-modal="true"
          aria-label="Vendor Payment Receipt"
        >
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden my-auto print:border-none print:shadow-none print:max-w-none print:rounded-none">
            {/* Modal Controls (Hidden in Print) */}
            <div className="no-print px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Print Payment Receipt
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVendorReceiptData(null)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Printable Receipt Content */}
            <div id="printable-receipt" className="bg-white text-black p-6 sm:p-8 text-xs space-y-5">
              <div className="flex items-center justify-between gap-4 pb-4 border-b-2 border-teal-900/40">
                <img src="/logo.png" alt="Logo Left" className="h-16 w-16 object-contain shrink-0" />
                <div className="text-center flex-1">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase font-['Playfair_Display','Cormorant_Garamond',serif]">
                    Mehar Palace Marquee
                  </h2>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Main Canal Road, near PSO Petrol Pump, Fateh Garh Mughalpura, Lahore, 54000
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Phone: <strong className="text-slate-800">0321 1000806</strong> &bull; Vendor Payment Receipt
                  </p>
                </div>
                <img src="/logo.png" alt="Logo Right" className="h-16 w-16 object-contain shrink-0" />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Receipt #</span>
                  <span className="font-mono font-bold text-slate-900">{vendorReceiptData.receiptNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase block">Date</span>
                  <span className="font-mono font-semibold text-slate-900">{vendorReceiptData.date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Vendor Name</span>
                  <span className="font-semibold text-slate-900">{vendorReceiptData.vendorName}</span>
                </div>
                {vendorReceiptData.eventRef ? (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block">Event Ref</span>
                    <span className="font-mono font-semibold text-slate-900">{vendorReceiptData.eventRef}</span>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block">Payment Mode</span>
                    <span className="font-semibold text-slate-900">{vendorReceiptData.paymentMode}</span>
                  </div>
                )}
              </div>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                <div className="flex justify-between py-2.5 px-4">
                  <span className="text-slate-600">Payment Mode</span>
                  <span className="font-semibold text-slate-900">{vendorReceiptData.paymentMode}</span>
                </div>
                {vendorReceiptData.notes && (
                  <div className="flex justify-between py-2.5 px-4 gap-4">
                    <span className="text-slate-600 shrink-0">Notes / Reference</span>
                    <span className="text-slate-800 text-right">{vendorReceiptData.notes}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 px-4 bg-emerald-50/50">
                  <span className="font-bold text-slate-900">Amount Paid</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {formatCurrency(vendorReceiptData.amountPaid)}
                  </span>
                </div>
                <div className="flex justify-between py-3 px-4 bg-slate-50">
                  <span className="font-bold text-slate-900">Remaining Balance</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(vendorReceiptData.remainingBalance)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center text-[11px] text-slate-500">
                <div>
                  <div className="border-t border-dashed border-slate-400 pt-2 mt-6 font-semibold text-slate-700">
                    Authorized Signature
                  </div>
                </div>
                <div>
                  <div className="border-t border-dashed border-slate-400 pt-2 mt-6 font-semibold text-slate-700">
                    Vendor / Receiver Signature
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
