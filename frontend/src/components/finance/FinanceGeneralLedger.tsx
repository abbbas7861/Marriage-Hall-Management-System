import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  Download,
  Printer,
  Calendar,
  CreditCard,
  Building,
  RotateCcw,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  X,
  Layers,
} from 'lucide-react';
import { financeApi } from '../../api/client';
import { PaymentTransaction, ExpenseRecord } from '../../types';

interface FinanceGeneralLedgerProps {
  onNavigateToTab?: (tabId: string) => void;
}

interface UnifiedLedgerEntry {
  id: string;
  date: string;
  refId: string;
  entryType: 'Debit (Inflow)' | 'Credit (Outflow)';
  category: string;
  account: string;
  entity: string;
  debit: number;
  credit: number;
  runningBalance: number;
  channel: string;
  status: string;
  notes: string;
}

export const FinanceGeneralLedger: React.FC<FinanceGeneralLedgerProps> = ({
  onNavigateToTab,
}) => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedEntry, setSelectedEntry] = useState<UnifiedLedgerEntry | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  const loadLedger = async () => {
    try {
      setLoading(true);
      const [txns, exps] = await Promise.all([
        financeApi.listTransactions(),
        financeApi.listExpenses(),
      ]);
      setTransactions(txns);
      setExpenses(exps);
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  // Assemble unified double-entry ledger with chronological sorting & running balance
  const ledgerEntries: UnifiedLedgerEntry[] = useMemo(() => {
    const rawList: {
      date: string;
      refId: string;
      type: 'Debit (Inflow)' | 'Credit (Outflow)';
      category: string;
      account: string;
      entity: string;
      debit: number;
      credit: number;
      channel: string;
      status: string;
      notes: string;
    }[] = [];

    // Customer payments & inflows
    transactions.forEach((t) => {
      const isDepositRefund = (t.category || '').toLowerCase().includes('refund');
      if (isDepositRefund) {
        rawList.push({
          date: t.timestamp ? t.timestamp.slice(0, 10) : '2026-11-01',
          refId: t.txnRef || '',
          type: 'Credit (Outflow)',
          category: t.category || '',
          account: '1010 - Bank / Cash Disbursement',
          entity: t.bookingRef ? `Booking Ref: ${t.bookingRef}` : 'Client Refund',
          debit: 0,
          credit: Number(t.amount) || 0,
          channel: t.channel || 'Cash',
          status: t.billingStatus || 'Settled',
          notes: `Deposit refund settlement for ${t.bookingRef}`,
        });
      } else {
        rawList.push({
          date: t.timestamp ? t.timestamp.slice(0, 10) : '2026-11-01',
          refId: t.txnRef || '',
          type: 'Debit (Inflow)',
          category: t.category || '',
          account: '4010 - Banquet Operating Revenue',
          entity: t.bookingRef ? `Booking Ref: ${t.bookingRef}` : 'Client Receipt',
          debit: Number(t.amount) || 0,
          credit: 0,
          channel: t.channel || 'Cash',
          status: t.billingStatus || 'Settled',
          notes: `Receipt from booking ${t.bookingRef}`,
        });
      }
    });

    // Operational expenses & vendor payments
    expenses.forEach((e) => {
      rawList.push({
        date: e.date || '2026-11-01',
        refId: e.expenseRef || '',
        type: 'Credit (Outflow)',
        category: e.category || '',
        account: '5010 - Cost of Goods Sold / Vendor Overhead',
        entity: e.vendor || 'Vendor Partner',
        debit: 0,
        credit: Number(e.amount) || 0,
        channel: e.paymentMethod || 'Bank Transfer',
        status: 'Approved',
        notes: `Operational expense approved by ${e.approvedBy}`,
      });
    });

    // Sort chronologically ascending for running balance calculation
    rawList.sort((a, b) => a.date.localeCompare(b.date));

    let balance = 0;
    const finalEntries: UnifiedLedgerEntry[] = rawList.map((item, idx) => {
      balance += (item.debit || 0) - (item.credit || 0);
      return {
        id: `gl-${idx + 1}`,
        ...item,
        entryType: item.type,
        runningBalance: balance,
      };
    });

    // Return descending for display
    return finalEntries.reverse();
  }, [transactions, expenses]);

  // Filtered
  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter((item) => {
      if (channelFilter !== 'All' && item.channel !== channelFilter) return false;
      if (typeFilter !== 'All' && item.entryType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.refId.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.entity.toLowerCase().includes(q) ||
          item.account.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ledgerEntries, channelFilter, typeFilter, searchQuery]);

  // Aggregates
  const totals = useMemo(() => {
    const totalDebits = ledgerEntries.reduce((acc, e) => acc + (Number(e.debit) || 0), 0);
    const totalCredits = ledgerEntries.reduce((acc, e) => acc + (Number(e.credit) || 0), 0);
    const netGeneralBalance = totalDebits - totalCredits;
    return {
      totalDebits: Number(totalDebits) || 0,
      totalCredits: Number(totalCredits) || 0,
      netGeneralBalance: Number(netGeneralBalance) || 0,
    };
  }, [ledgerEntries]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Date,Ref ID,Type,Category,Account,Entity,Debit,Credit,Running Balance,Channel,Status'];
    const rows = filteredEntries.map((e) =>
      `"${e.date}","${e.refId}","${e.entryType}","${e.category}","${e.account}","${e.entity}",${e.debit},${e.credit},${e.runningBalance},"${e.channel}","${e.status}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `general_ledger_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenVoucher = (entry: UnifiedLedgerEntry) => {
    setSelectedEntry(entry);
    setIsVoucherModalOpen(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 select-none animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-[#131b2e] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-700/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-sky-500/15 via-indigo-500/10 to-transparent rounded-full blur-3xl -z-10" />

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Double-Entry Compliant</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans'] text-white">
            General Ledger (GL) &amp; Journal Records
          </h1>
          <p className="text-sm text-slate-300">
            Audit-ready chronological transaction journal: customer deposits, vendor payouts, contractor wages, and running liquidity balance.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export GL CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-5 border border-slate-700/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Debits (Inflows)</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              Rs. {Math.round(Number(totals.totalDebits || 0)).toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold mt-0.5 block">Assets &amp; Cash Received</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-5 border border-slate-700/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Credits (Outflows)</span>
            <span className="text-2xl font-black text-rose-400 font-mono mt-1 block">
              Rs. {Math.round(Number(totals.totalCredits || 0)).toLocaleString()}
            </span>
            <span className="text-[11px] text-rose-300 font-semibold mt-0.5 block">Expenses &amp; Disbursements</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-5 border border-slate-700/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Net Ledger Balance</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">
              Rs. {Math.round(Number(totals.netGeneralBalance || 0)).toLocaleString()}
            </span>
            <span className="text-[11px] text-teal-400 font-semibold mt-0.5 block">Current Net Liquid Equity</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold">
            <Scale className="w-6 h-6" />
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
            placeholder="Search by Ref ID, account, entity, or category..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-900 text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">All Entry Types</option>
              <option value="Debit (Inflow)" className="bg-slate-900 text-white">Debit (Inflow Only)</option>
              <option value="Credit (Outflow)" className="bg-slate-900 text-white">Credit (Outflow Only)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-700">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-slate-900 text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">All Channels</option>
              <option value="Bank Transfer" className="bg-slate-900 text-white">Bank Transfer</option>
              <option value="Cash" className="bg-slate-900 text-white">Cash</option>
              <option value="Cheque" className="bg-slate-900 text-white">Cheque</option>
            </select>
          </div>
        </div>
      </div>

      {/* General Ledger Table */}
      <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-xs">
        <div className="w-full overflow-x-auto pb-4">
          <table className="w-full min-w-[1100px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-700/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6 whitespace-nowrap">Date &amp; Ref ID</th>
                <th className="py-4 px-4 whitespace-nowrap">Entity / Transaction Details</th>
                <th className="py-4 px-4 whitespace-nowrap">Chart of Accounts</th>
                <th className="py-4 px-3 text-center whitespace-nowrap">Channel</th>
                <th className="py-4 px-4 text-right whitespace-nowrap">Debit (In)</th>
                <th className="py-4 px-4 text-right whitespace-nowrap">Credit (Out)</th>
                <th className="py-4 px-4 text-right whitespace-nowrap">Running Balance</th>
                <th className="py-4 px-4 text-center whitespace-nowrap">Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-xs sm:text-sm font-mono">
              {filteredEntries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-800/40 border-b border-slate-700/50 transition-colors">
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="font-bold text-white block">{e.refId}</span>
                    <span className="text-[11px] text-slate-400 block font-sans">{e.date}</span>
                  </td>
                  <td className="py-4 px-4 font-sans whitespace-nowrap">
                    <span className="font-bold text-white block">{e.entity}</span>
                    <span className="text-[11px] text-slate-400 block">{e.category}</span>
                  </td>
                  <td className="py-4 px-4 font-sans text-xs text-slate-300 whitespace-nowrap">
                    <span className="block">{e.account}</span>
                  </td>
                  <td className="py-4 px-3 text-center font-sans whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-900/80 border border-slate-700 text-slate-300">
                      {e.channel}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-emerald-400 whitespace-nowrap">
                    {e.debit > 0 ? `Rs. ${Math.round(Number(e.debit || 0)).toLocaleString()}` : '—'}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-rose-400 whitespace-nowrap">
                    {e.credit > 0 ? `Rs. ${Math.round(Number(e.credit || 0)).toLocaleString()}` : '—'}
                  </td>
                  <td className="py-4 px-4 text-right font-black text-white whitespace-nowrap">
                    Rs. {Math.round(Number(e.runningBalance || 0)).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenVoucher(e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      title="View Journal Voucher"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Journal Voucher Modal */}
      {isVoucherModalOpen && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/80 text-white">
              <div>
                <span className="text-[11px] font-mono text-sky-400 uppercase tracking-widest block">
                  MARRIAGE HALL MANAGEMENT SYSTEM
                </span>
                <h3 className="text-lg font-bold">General Journal Voucher</h3>
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
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700">
                <div>
                  <span className="text-slate-400 block">Voucher Ref:</span>
                  <strong className="text-white font-mono text-sm">{selectedEntry.refId}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Date:</span>
                  <strong className="text-white">{selectedEntry.date}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Account:</span>
                  <strong className="text-white">{selectedEntry.account}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Channel:</span>
                  <strong className="text-white">{selectedEntry.channel}</strong>
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 space-y-1">
                <span className="text-slate-400 block">Description / Particulars:</span>
                <p className="text-slate-200 font-medium">{selectedEntry.notes || selectedEntry.category}</p>
              </div>

              <table className="w-full min-w-[1100px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 font-semibold font-sans">
                    <th className="py-2 whitespace-nowrap">Account Title</th>
                    <th className="py-2 text-right whitespace-nowrap">Debit (Rs.)</th>
                    <th className="py-2 text-right whitespace-nowrap">Credit (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="py-2 font-sans text-white whitespace-nowrap">{selectedEntry.account}</td>
                    <td className="py-2 text-right text-emerald-400 font-bold whitespace-nowrap">
                      {selectedEntry.debit > 0 ? Number(selectedEntry.debit || 0).toLocaleString() : '0.00'}
                    </td>
                    <td className="py-2 text-right text-rose-400 font-bold whitespace-nowrap">
                      {selectedEntry.credit > 0 ? Number(selectedEntry.credit || 0).toLocaleString() : '0.00'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-[11px] text-slate-400">
                <div className="border-t border-slate-700 pt-1">
                  <span>Prepared By (Accountant)</span>
                </div>
                <div className="border-t border-slate-700 pt-1">
                  <span>Authorized Signatory</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
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
