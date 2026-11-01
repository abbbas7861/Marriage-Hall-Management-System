import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Building,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Printer,
  Download,
  X,
  Send,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown,
} from 'lucide-react';
import { workforceApi } from '../../api/client';
import { VendorPartner } from '../../types';

interface VendorTradePayablesProps {
  onNavigateToTab?: (tabId: string) => void;
}

export const VendorTradePayables: React.FC<VendorTradePayablesProps> = ({
  onNavigateToTab,
}) => {
  const [vendors, setVendors] = useState<VendorPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Disbursement Modal
  const [isDisbursementModalOpen, setIsDisbursementModalOpen] = useState(false);
  const [selectedVendorForPayment, setSelectedVendorForPayment] = useState<VendorPartner | null>(null);
  const [disbursementAmount, setDisbursementAmount] = useState<number>(0);
  const [disbursementChannel, setDisbursementChannel] = useState<'Bank Transfer' | 'Cash' | 'Cheque'>('Bank Transfer');
  const [disbursementRef, setDisbursementRef] = useState('');
  const [disbursementNotes, setDisbursementNotes] = useState('');

  // Bill Intake Modal
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [selectedVendorForBill, setSelectedVendorForBill] = useState<VendorPartner | null>(null);
  const [billAmount, setBillAmount] = useState<number>(0);
  const [billInvoiceRef, setBillInvoiceRef] = useState('');
  const [billNotes, setBillNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await workforceApi.listVendors();
      setVendors(data);
    } catch (err) {
      console.error('Failed to load vendor payables:', err);
      showToast('Error loading vendor payables.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const openDisbursementModal = (vendor: VendorPartner) => {
    setSelectedVendorForPayment(vendor);
    setDisbursementAmount(vendor.balanceDue || 0);
    setDisbursementRef(`TXN-V${Math.floor(10000 + Math.random() * 90000)}`);
    setDisbursementNotes(`Disbursement for ${vendor.businessName} trade account`);
    setIsDisbursementModalOpen(true);
  };

  const openBillModal = (vendor: VendorPartner) => {
    setSelectedVendorForBill(vendor);
    setBillAmount(0);
    setBillInvoiceRef(`INV-SUP-${Math.floor(10000 + Math.random() * 90000)}`);
    setBillNotes(`Supplier purchase invoice for ${vendor.category}`);
    setIsBillModalOpen(true);
  };

  const handleRecordDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorForPayment || disbursementAmount <= 0) return;

    try {
      const res = await workforceApi.recordVendorPayment(selectedVendorForPayment.id, {
        amount: disbursementAmount,
        channel: disbursementChannel,
        transactionRef: disbursementRef,
        notes: disbursementNotes,
      });

      setVendors((prev) => prev.map((v) => (v.id === res.vendor.id ? res.vendor : v)));
      setIsDisbursementModalOpen(false);
      showToast(`Disbursed Rs. ${disbursementAmount.toLocaleString()} to ${res.vendor.businessName} via ${disbursementChannel}!`);
    } catch (err) {
      console.error('Failed to disburse payment:', err);
      showToast('Error recording disbursement.');
    }
  };

  const handleRecordBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorForBill || billAmount <= 0) return;

    try {
      const res = await workforceApi.addVendorBill(selectedVendorForBill.id, {
        amount: billAmount,
        invoiceRef: billInvoiceRef,
        notes: billNotes,
      });

      setVendors((prev) => prev.map((v) => (v.id === res.vendor.id ? res.vendor : v)));
      setIsBillModalOpen(false);
      showToast(`Supplier bill of Rs. ${billAmount.toLocaleString()} added to ${res.vendor.businessName}!`);
    } catch (err) {
      console.error('Failed to add bill:', err);
      showToast('Error recording supplier bill.');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Vendor ID,Business Name,Category,Payment Terms,Total Billed,Total Paid,Balance Due,Status'];
    const rows = filteredVendors.map((v) =>
      `"${v.vendorId}","${v.businessName}","${v.category}","${v.paymentTerms || 'Net 15 Days'}",${v.totalBilled || 0},${v.totalPaid || 0},${v.balanceDue || 0},"${v.status || 'Active'}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vendor_trade_payables_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (categoryFilter !== 'All' && v.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = v.businessName.toLowerCase().includes(q);
        const matchesCat = v.category.toLowerCase().includes(q);
        const matchesId = v.vendorId?.toLowerCase().includes(q);
        return matchesName || matchesCat || matchesId;
      }
      return true;
    });
  }, [vendors, categoryFilter, searchQuery]);

  const stats = useMemo(() => {
    const totalBilled = vendors.reduce((acc, v) => acc + (v.totalBilled || 0), 0);
    const totalPaid = vendors.reduce((acc, v) => acc + (v.totalPaid || 0), 0);
    const totalDue = vendors.reduce((acc, v) => acc + (v.balanceDue || 0), 0);
    const vendorsWithDues = vendors.filter((v) => (v.balanceDue || 0) > 0).length;
    return { totalBilled, totalPaid, totalDue, vendorsWithDues };
  }, [vendors]);

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
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-teal-500/15 via-emerald-500/10 to-transparent rounded-full blur-3xl -z-10" />

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-500/20 border border-teal-400/40 text-teal-300 font-bold text-xs uppercase tracking-wider">
              <FileSpreadsheet className="w-4 h-4 text-teal-400" />
              <span>Phase 6 • Task 6.4: Trade Ledgers &amp; Accounts Payable</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Disbursement &amp; Expense Sync</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans'] text-white">
            Vendor Financial Trades &amp; Accounts Payable (A/P)
          </h1>
          <p className="text-sm text-slate-300">
            Track vendor purchase billing, outstanding commitments, and disburse payments via Cash, Bank Transfer, or Cheque with immediate sync into general expenses.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Billed Trade</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              Rs. {Math.round(stats.totalBilled).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">Supplier Invoices Intake</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Disbursements Paid</span>
            <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
              Rs. {Math.round(stats.totalPaid).toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Settled Transactions</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Outstanding A/P Due</span>
            <span className="text-2xl font-black text-rose-600 font-mono mt-1 block">
              Rs. {Math.round(stats.totalDue).toLocaleString()}
            </span>
            <span className="text-[11px] text-rose-500 font-semibold mt-0.5 block">
              {stats.vendorsWithDues} Vendors with Balance
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Payment Compliance</span>
            <span className="text-2xl font-black text-blue-600 font-mono mt-1 block">
              {stats.totalBilled > 0
                ? `${Math.round((stats.totalPaid / stats.totalBilled) * 100)}%`
                : '100%'}
            </span>
            <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">Paid / Billed Ratio</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor name, ID, or trade category..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Poultry/Meat">Poultry/Meat</option>
              <option value="Dairy & Bakery">Dairy &amp; Bakery</option>
              <option value="Floral Decor">Floral Decor</option>
              <option value="Stage & Lighting">Stage &amp; Lighting</option>
              <option value="Outsourced Labor">Outsourced Labor</option>
              <option value="Valet & Security">Valet &amp; Security</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trade Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Vendor / Supplier</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4">Credit Terms</th>
                <th className="py-4 px-4 text-right">Total Billed</th>
                <th className="py-4 px-4 text-right">Total Paid</th>
                <th className="py-4 px-4 text-right">Balance Due</th>
                <th className="py-4 px-6 text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredVendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-900 block">{v.businessName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {v.vendorId} {v.contactPerson && `• ${v.contactPerson}`}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                      {v.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-slate-600">
                    {v.paymentTerms || 'Net 15 Days'}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                    Rs. {Math.round(v.totalBilled || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-emerald-700">
                    Rs. {Math.round(v.totalPaid || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-black">
                    <span
                      className={`px-2.5 py-1 rounded-xl ${
                        v.balanceDue && v.balanceDue > 0
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      Rs. {Math.round(v.balanceDue || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openDisbursementModal(v)}
                        className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openBillModal(v)}
                        className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
                      >
                        + Bill
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disbursement Modal */}
      {isDisbursementModalOpen && selectedVendorForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                    Record Vendor Disbursement
                  </h3>
                  <span className="text-xs text-slate-500">Pay supplier invoice and auto-log to General Expense</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDisbursementModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordDisbursement} className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block">Vendor:</span>
                  <strong className="text-slate-900 text-sm">{selectedVendorForPayment.businessName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Current Balance Due:</span>
                  <strong className="text-rose-600 text-sm font-mono">
                    Rs. {Math.round(selectedVendorForPayment.balanceDue || 0).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Disbursement Amount (Rs.) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={disbursementAmount}
                  onChange={(e) => setDisbursementAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Method</label>
                  <select
                    value={disbursementChannel}
                    onChange={(e) => setDisbursementChannel(e.target.value as 'Bank Transfer' | 'Cash' | 'Cheque')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition"
                  >
                    <option value="Bank Transfer">Bank Transfer (IBAN/Online)</option>
                    <option value="Cash">Cash Voucher</option>
                    <option value="Cheque">Crossed Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Transaction Ref / Cheque #</label>
                  <input
                    type="text"
                    required
                    value={disbursementRef}
                    onChange={(e) => setDisbursementRef(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Disbursement Notes / Invoice Allocation</label>
                <textarea
                  rows={2}
                  value={disbursementNotes}
                  onChange={(e) => setDisbursementNotes(e.target.value)}
                  placeholder="e.g. Cleared 50% invoice for Barat meat supply..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDisbursementModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-extrabold shadow-md transition cursor-pointer"
                >
                  Disburse &amp; Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Intake Modal */}
      {isBillModalOpen && selectedVendorForBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                    Intake Supplier Bill / Invoice
                  </h3>
                  <span className="text-xs text-slate-500">Record incoming bill to increase vendor Accounts Payable</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBillModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordBill} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <span className="text-slate-400 block">Vendor Account:</span>
                <strong className="text-slate-900 text-sm">{selectedVendorForBill.businessName}</strong>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Bill Amount (Rs.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={billAmount}
                    onChange={(e) => setBillAmount(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 75000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Supplier Invoice #</label>
                  <input
                    type="text"
                    required
                    value={billInvoiceRef}
                    onChange={(e) => setBillInvoiceRef(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description / Goods Details</label>
                <textarea
                  rows={2}
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  placeholder="e.g. 50kg fresh mutton + 30kg chicken breast for Barat event..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBillModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md transition cursor-pointer"
                >
                  Intake Bill to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

