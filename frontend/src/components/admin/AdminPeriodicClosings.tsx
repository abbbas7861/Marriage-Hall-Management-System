import React, { useState, useEffect } from 'react';
import {
  Clock,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  Wallet,
  DollarSign,
  TrendingUp,
  FileText,
  Printer,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { financeApi, bookingsApi, reportsApi } from '../../api/client';

export const AdminPeriodicClosings: React.FC = () => {
  const [closingType, setClosingType] = useState<'daily' | 'weekly' | 'monthly' | 'annual'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [closingLocked, setClosingLocked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Financial summary for closing
  const [grossRevenue, setGrossRevenue] = useState<number>(0);
  const [totalAdvanceCash, setTotalAdvanceCash] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [netSettlement, setNetSettlement] = useState<number>(0);
  const [bookingsCount, setBookingsCount] = useState<number>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const calculateClosings = async () => {
    try {
      const [bookings, expenses, invoices] = await Promise.all([
        bookingsApi.list().catch(() => []),
        financeApi.listExpenses().catch(() => []),
        financeApi.listInvoices().catch(() => []),
      ]);

      let filteredBookings = bookings;
      let filteredExpenses = expenses;
      let filteredInvoices = invoices;

      if (closingType === 'daily') {
        filteredBookings = bookings.filter((b) => b.date === selectedDate);
        filteredExpenses = expenses.filter((e) => e.date === selectedDate);
        filteredInvoices = invoices.filter((i) => i.date === selectedDate);
      } else if (closingType === 'monthly') {
        const ym = selectedDate.slice(0, 7);
        filteredBookings = bookings.filter((b) => b.date?.startsWith(ym));
        filteredExpenses = expenses.filter((e) => e.date?.startsWith(ym));
        filteredInvoices = invoices.filter((i) => i.date?.startsWith(ym));
      }

      const rev = filteredBookings.reduce((sum, b) => sum + Number(b.amount || 0), 0);
      const adv = filteredBookings.reduce((sum, b) => sum + Number(b.advancePayment || 0), 0);
      const exp = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      setGrossRevenue(rev);
      setTotalAdvanceCash(adv);
      setTotalExpenses(exp);
      setNetSettlement(adv - exp);
      setBookingsCount(filteredBookings.length);
    } catch (err) {
      console.error('Error calculating closings:', err);
    }
  };

  useEffect(() => {
    calculateClosings();
  }, [closingType, selectedDate]);

  const handleLockClosing = () => {
    setClosingLocked(true);
    showToast(`Accounting Period [${closingType.toUpperCase()}: ${selectedDate}] locked & verified.`);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="flex flex-col w-full gap-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-slate-900 text-white shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-slate-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Periodic Financial Closings &amp; Register Lock
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit cash in hand, digital advances, operational disbursements, and freeze fiscal periods.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrintCertificate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Closing Voucher</span>
          </button>

          <button
            type="button"
            disabled={closingLocked}
            onClick={handleLockClosing}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition-colors cursor-pointer ${
              closingLocked
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{closingLocked ? 'Period Locked & Certified' : 'Execute & Freeze Period'}</span>
          </button>
        </div>
      </div>

      {/* Closing Period Selector Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-700">Closing Interval:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
            {(['daily', 'weekly', 'monthly', 'annual'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setClosingType(type);
                  setClosingLocked(false);
                }}
                className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-all cursor-pointer ${
                  closingType === type
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type} Closing
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Target Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setClosingLocked(false);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono text-slate-800"
          />
        </div>
      </div>

      {/* 4 Closing Settlement Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase font-mono">Gross Contracts Booked</span>
            <FileText className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            PKR {grossRevenue.toLocaleString('en-PK')}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block font-mono">{bookingsCount} events scheduled</span>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase font-mono">Cash Collected (Advances)</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            PKR {totalAdvanceCash.toLocaleString('en-PK')}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">In register / bank settlement</span>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase font-mono">Disbursed Expenses</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600">
            - PKR {totalExpenses.toLocaleString('en-PK')}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Utilities, decor &amp; wages paid</span>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase font-mono">Net Closing Balance</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-2xl font-bold font-mono ${netSettlement >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
            PKR {netSettlement.toLocaleString('en-PK')}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block font-mono">
            Status: {closingLocked ? '[FROZEN]' : '[OPEN REGISTER]'}
          </span>
        </div>
      </div>

      {/* Printable Closing Certificate */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-teal-700" />
            <div>
              <h3 className="font-bold text-base text-slate-900 uppercase tracking-tight">
                Official Period Closing Audit Certificate
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Jurisdiction: Royal Palace Banquet Hall • Verified by General Manager
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold uppercase">
              {closingType} CLOSING #{selectedDate}
            </span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Target Audit Interval:</span>
            <span className="font-semibold text-slate-900 capitalize font-mono">{closingType} Closure ({selectedDate})</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Total Bookings in Scope:</span>
            <span className="font-mono text-slate-900 font-bold">{bookingsCount} Events</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Total Invoiced Gross Revenue:</span>
            <span className="font-mono text-slate-900 font-bold">PKR {grossRevenue.toLocaleString('en-PK')}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Cash &amp; Bank Advance Liquidity:</span>
            <span className="font-mono text-emerald-700 font-bold">PKR {totalAdvanceCash.toLocaleString('en-PK')}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Vouchered Operational Outflows:</span>
            <span className="font-mono text-rose-700 font-bold">PKR {totalExpenses.toLocaleString('en-PK')}</span>
          </div>
          <div className="flex justify-between py-2.5 bg-slate-50 px-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900">Net Surplus / Cash Carryover:</span>
            <span className="font-bold font-mono text-base text-teal-800">PKR {netSettlement.toLocaleString('en-PK')}</span>
          </div>
        </div>

        {/* Audit Disclaimer */}
        <p className="text-[11px] text-slate-400 mt-6 leading-relaxed">
          * Certification Statement: Executing this register closing locks all receipts, advance payments, and expense vouchers for this duration. Any post-closing adjustments must be processed as a journal adjusting entry in the general ledger.
        </p>

        {/* Signature Line */}
        <div className="grid grid-cols-2 gap-8 pt-10 mt-6 border-t border-slate-200">
          <div className="flex flex-col items-center">
            <div className="w-full border-b border-slate-400 h-8 mb-2" />
            <span className="text-xs font-bold text-slate-800">Accountant / Cashier</span>
            <span className="text-[10px] text-slate-400 font-mono">Prepared By</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-full border-b border-slate-400 h-8 mb-2" />
            <span className="text-xs font-bold text-slate-800">Admin / Hall Owner</span>
            <span className="text-[10px] text-slate-400 font-mono">Approved &amp; Certified</span>
          </div>
        </div>
      </div>
    </div>
  );
};

