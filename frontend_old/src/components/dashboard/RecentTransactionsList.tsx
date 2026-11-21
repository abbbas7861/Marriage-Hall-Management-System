import React from 'react';
import { Receipt, ChevronRight, Inbox } from 'lucide-react';
import { PaymentTransaction } from '../../types';

interface RecentTransactionsListProps {
  transactions?: PaymentTransaction[];
  onViewInvoices?: () => void;
  onRecordPayment?: () => void;
}

export const RecentTransactionsList: React.FC<RecentTransactionsListProps> = ({
  transactions = [],
  onViewInvoices,
}) => {
  const isEmpty = !transactions || transactions.length === 0;

  return (
    <div className="flex flex-col rounded-2xl bg-slate-800/60 backdrop-blur-md p-5 sm:p-6 border border-slate-700/50 shadow-xl h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Receipt className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-slate-100 font-['Plus_Jakarta_Sans']">
            Recent Transactions
          </h3>
        </div>
        <button
          type="button"
          onClick={onViewInvoices}
          className="inline-flex items-center gap-1 text-xs text-sky-400 font-semibold hover:text-sky-300 transition-colors cursor-pointer"
        >
          <span>[View Invoices]</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider rounded-lg">
              <th className="py-2.5 px-3 rounded-l-lg">Customer</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3 text-right rounded-r-lg">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40 text-xs">
            {isEmpty ? (
              <tr>
                <td colSpan={4} className="py-12 px-3 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-slate-400 text-xs font-['Plus_Jakarta_Sans']">
                      No recent transactions.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((txn, idx) => (
                <tr key={txn.id || idx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-200">
                    {txn.txnRef}
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-teal-300">
                    Rs. {(txn.amount || 0).toLocaleString('en-PK')}
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {txn.timestamp}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{txn.billingStatus}</span>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
