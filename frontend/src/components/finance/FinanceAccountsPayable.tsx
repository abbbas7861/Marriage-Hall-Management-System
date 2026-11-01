import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  Printer,
  Calendar,
  CreditCard,
  Building,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Download,
  X,
  FileText,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';
import { workforceApi, financeApi } from '../../api/client';
import { VendorPartner, ExpenseRecord } from '../../types';

interface FinanceAccountsPayableProps {
  onNavigateToTab?: (tabId: string) => void;
}

export const FinanceAccountsPayable: React.FC<FinanceAccountsPayableProps> = ({
  onNavigateToTab,
}) => {
  const [vendors, setVendors] = useState<VendorPartner[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authorization Modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorPartner | null>(null);
  const [disbursementGross, setDisbursementGross] = useState<number>(0);
  const [withholdingTaxPct, setWithholdingTaxPct] = useState<number>(0); // 0%, 4%, 7.5%
  const [disbursementChannel, setDisbursementChannel] = useState<'Bank Transfer' | 'Cheque' | 'Cash'>('Bank Transfer');
  const [disbursementRef, setDisbursementRef] = useState('');
  const [disbursementAuthNotes, setDisbursementAuthNotes] = useState('');

  // Printable Payment Voucher
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherData, setVoucherData] = useState<{
    vendor: VendorPartner;
    grossAmount: number;
    taxWithheld: number;
    netPaid: number;
    channel: string;
    refNumber: string;
    date: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [vnds, exps] = await Promise.all([
        workforceApi.listVendors(),
        financeApi.listExpenses(),
      ]);
      setVendors(vnds);
      setExpenses(exps);
    } catch (err) {
      console.error('Failed to load accounts payable:', err);
      showToast('Error loading accounts payable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAuthDialog = (vendor: VendorPartner) => {
    setSelectedVendor(vendor);
    setDisbursementGross(vendor.balanceDue || 0);
    setWithholdingTaxPct(vendor.ntnNumber ? 4 : 0); // 4% withholding if NTN registered filer
    setDisbursementRef(`DISB-${Math.floor(10000 + Math.random() * 90000)}`);
    setDisbursementAuthNotes(`Disbursement approved for ${vendor.businessName} under ${vendor.paymentTerms || 'Net 15 Days'}`);
    setIsAuthModalOpen(true);
  };

  const netPayable = Math.max(0, disbursementGross - Math.round((disbursementGross * withholdingTaxPct) / 100));
  const taxAmount = Math.round((disbursementGross * withholdingTaxPct) / 100);

  const handleAuthorizeDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || disbursementGross <= 0) return;

    try {
      const res = await workforceApi.recordVendorPayment(selectedVendor.id, {
        amount: disbursementGross,
        channel: disbursementChannel,
        transactionRef: disbursementRef,
        notes: `Net Disbursed: Rs. ${netPayable.toLocaleString()} | WHT (${withholdingTaxPct}%): Rs. ${taxAmount.toLocaleString()} | Notes: ${disbursementAuthNotes}`,
      });

      setVendors((prev) => prev.map((v) => (v.id === res.vendor.id ? res.vendor : v)));
      setIsAuthModalOpen(false);

      // Open Payment Voucher Modal
      setVoucherData({
        vendor: res.vendor,
        grossAmount: disbursementGross,
        taxWithheld: taxAmount,
        netPaid: netPayable,
        channel: disbursementChannel,
        refNumber: disbursementRef,
        date: new Date().toISOString().slice(0, 10),
      });
      setIsVoucherModalOpen(true);
      showToast(`Payment of Rs. ${netPayable.toLocaleString()} authorized for ${res.vendor.businessName}!`);
    } catch (err) {
      console.error('Failed to authorize disbursement:', err);
      showToast('Error recording disbursement authorization.');
    }
  };

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (categoryFilter !== 'All' && v.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.businessName.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          v.vendorId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [vendors, categoryFilter, searchQuery]);

  const stats = useMemo(() => {
    const totalPayables = vendors.reduce((acc, v) => acc + (v.balanceDue || 0), 0);
    const totalDisbursed = vendors.reduce((acc, v) => acc + (v.totalPaid || 0), 0);
    const totalBilled = vendors.reduce((acc, v) => acc + (v.totalBilled || 0), 0);
    const dueCount = vendors.filter((v) => (v.balanceDue || 0) > 0).length;
    return { totalPayables, totalDisbursed, totalBilled, dueCount };
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
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-rose-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl -z-10" />

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-300 font-bold text-xs uppercase tracking-wider">
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
              <span>Phase 7 • Task 7.4: Accounts Payable (A/P) Master</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Tax Withholding &amp; Vouchers</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans'] text-white">
            Accounts Payable (A/P) &amp; Vendor Disbursements
          </h1>
          <p className="text-sm text-slate-300">
            Track commitments to raw material suppliers, outside labor, and stage decorators with withholding tax deductions and payment vouchers.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total A/P Liabilities</span>
            <span className="text-2xl font-black text-rose-600 font-mono mt-1 block">
              Rs. {Math.round(stats.totalPayables).toLocaleString()}
            </span>
            <span className="text-[11px] text-rose-500 font-semibold mt-0.5 block">{stats.dueCount} Suppliers Due</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Disbursed</span>
            <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
              Rs. {Math.round(stats.totalDisbursed).toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Settled to Date</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Gross Procurement</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              Rs. {Math.round(stats.totalBilled).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">Lifetime Vendor Intake</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Disbursement Ratio</span>
            <span className="text-2xl font-black text-teal-600 font-mono mt-1 block">
              {stats.totalBilled > 0
                ? `${Math.round((stats.totalDisbursed / stats.totalBilled) * 100)}%`
                : '100%'}
            </span>
            <span className="text-[11px] text-teal-600 font-semibold mt-0.5 block">Payment Reliability</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
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

      {/* Payables Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Vendor Name &amp; ID</th>
                <th className="py-4 px-4">Trade Category</th>
                <th className="py-4 px-4">NTN / Tax Status</th>
                <th className="py-4 px-4 text-right">Total Billed</th>
                <th className="py-4 px-4 text-right">Total Paid</th>
                <th className="py-4 px-4 text-right">Outstanding A/P</th>
                <th className="py-4 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-mono">
              {filteredVendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-900 block font-sans">{v.businessName}</span>
                    <span className="text-[11px] text-slate-400 block">{v.vendorId} • {v.paymentTerms || 'Net 15 Days'}</span>
                  </td>
                  <td className="py-4 px-4 font-sans">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                      {v.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-sans text-xs">
                    {v.ntnNumber ? (
                      <span className="text-emerald-700 font-bold font-mono">NTN: {v.ntnNumber} (Active Filer)</span>
                    ) : (
                      <span className="text-slate-400">Non-Filer / Unregistered</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-slate-900">
                    Rs. {Math.round(v.totalBilled || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-emerald-700">
                    Rs. {Math.round(v.totalPaid || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right font-black">
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
                  <td className="py-4 px-6 text-center">
                    {v.balanceDue && v.balanceDue > 0 ? (
                      <button
                        type="button"
                        onClick={() => openAuthDialog(v)}
                        className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold text-xs shadow-xs transition cursor-pointer"
                      >
                        Authorize Payment
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-bold font-sans">Account Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Authorization Modal */}
      {isAuthModalOpen && selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                    Authorize Vendor Disbursement
                  </h3>
                  <span className="text-xs text-slate-500">Apply withholding tax deductions and generate payment voucher</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAuthorizeDisbursement} className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block">Vendor Account:</span>
                  <strong className="text-slate-900 text-sm">{selectedVendor.businessName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Outstanding:</span>
                  <strong className="text-rose-600 font-mono text-sm">
                    Rs. {Math.round(selectedVendor.balanceDue || 0).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Gross Bill Amount to Clear (Rs.) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={disbursementGross}
                  onChange={(e) => setDisbursementGross(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Withholding Tax (WHT %)</label>
                  <select
                    value={withholdingTaxPct}
                    onChange={(e) => setWithholdingTaxPct(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition"
                  >
                    <option value={0}>0% (Tax Exempt / Non-deductible)</option>
                    <option value={4}>4% (Goods / Raw Materials - Filer)</option>
                    <option value={7.5}>7.5% (Services / Decoration / Sound)</option>
                    <option value={10}>10% (Non-Filer Penalty Rate)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Disbursement Channel</label>
                  <select
                    value={disbursementChannel}
                    onChange={(e) => setDisbursementChannel(e.target.value as 'Bank Transfer' | 'Cheque' | 'Cash')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition"
                  >
                    <option value="Bank Transfer">Bank Transfer (Online/IBAN)</option>
                    <option value="Cheque">Crossed Cheque</option>
                    <option value="Cash">Cash Voucher</option>
                  </select>
                </div>
              </div>

              {/* Deduction & Net Payable Calculation Box */}
              <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-600 font-sans">
                  <span>Gross Invoice Amount:</span>
                  <span className="font-bold text-slate-900">Rs. {disbursementGross.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-sans">
                  <span>Less Withholding Tax ({withholdingTaxPct}%):</span>
                  <span>- Rs. {taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-teal-950 font-bold text-sm border-t border-teal-200 pt-1 font-sans">
                  <span>NET PAYABLE DISBURSEMENT:</span>
                  <span className="font-mono text-base text-teal-800">Rs. {netPayable.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Authorization Signature / Notes</label>
                <textarea
                  rows={2}
                  value={disbursementAuthNotes}
                  onChange={(e) => setDisbursementAuthNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-extrabold shadow-md transition cursor-pointer"
                >
                  Authorize &amp; Print Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Voucher Modal */}
      {isVoucherModalOpen && voucherData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <span className="text-[11px] font-mono text-teal-400 uppercase tracking-widest block">
                  MARRIAGE HALL MANAGEMENT SYSTEM
                </span>
                <h3 className="text-lg font-bold">Payment Disbursement Voucher</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Voucher Ref:</span>
                  <strong className="text-slate-900 font-mono text-sm">{voucherData.refNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Date:</span>
                  <strong className="text-slate-900">{voucherData.date}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Beneficiary / Payee:</span>
                  <strong className="text-slate-900">{voucherData.vendor.businessName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Mode:</span>
                  <strong className="text-slate-900">{voucherData.channel}</strong>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Invoice Total:</span>
                  <span>Rs. {voucherData.grossAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Withholding Tax Deduction:</span>
                  <span>- Rs. {voucherData.taxWithheld.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1 text-sm">
                  <span>Net Disbursed Amount:</span>
                  <span className="text-teal-700">Rs. {voucherData.netPaid.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-[11px] text-slate-400">
                <div className="border-t border-slate-300 pt-1">
                  <span>Payee Acknowledgment</span>
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <span>Authorized Executive Signatory</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Voucher</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

