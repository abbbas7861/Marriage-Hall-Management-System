import React from 'react';
import { Receipt, ChevronRight, Inbox, PlusCircle } from 'lucide-react';
import { PaymentTransaction } from '../../types';

interface RecentTransactionsListProps {
  transactions?: PaymentTransaction[];
  onViewInvoices?: () => void;
  onRecordPayment?: () => void;
}

export const RecentTransactionsList: React.FC<RecentTransactionsListProps> = ({
  transactions = [],
  onViewInvoices,
  onRecordPayment,
}) => {
  const isEmpty = !transactions || transactions.length === 0;

  return (
    <div className="flex flex-col rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Receipt className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-slate-800 font-['Plus_Jakarta_Sans']">
            Recent Transactions
          </h3>
        </div>
        <button
          type="button"
          onClick={onViewInvoices}
          className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors"
        >
          <span>[View Invoices]</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider rounded-md">
              <th className="py-2.5 px-3 rounded-l-md">Customer</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3 text-right rounded-r-md">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {isEmpty ? (
              <tr>
                <td colSpan={4} className="py-12 px-3 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Inbox className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-slate-500 text-xs font-['Plus_Jakarta_Sans']">
                      No recent transactions.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((txn, idx) => (
                <tr key={txn.id || idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    {txn.txnRef}
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-800">
                    ${txn.amount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                    {txn.timestamp}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
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
