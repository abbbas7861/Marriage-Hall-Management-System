import React, { useState } from 'react';
import { PlusCircle, TrendingDown, MoreVertical, Wallet } from 'lucide-react';
import { DataTable, Column } from '../common/DataTable';
import { ExpenseRecord } from '../../types';

export const ExpensesModule: React.FC = () => {
  // STRICT DATA RULE: Empty mock array
  const [expenses] = useState<ExpenseRecord[]>([]);

  const columns: Column<ExpenseRecord>[] = [
    {
      header: 'Expense Ref',
      accessorKey: 'expenseRef',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
          [{item.expenseRef}]
        </span>
      ),
    },
    {
      header: 'Operational Category',
      accessorKey: 'category',
      sortable: true,
      render: (item) => (
        <span className="font-semibold text-slate-900 text-xs">
          [{item.category}]
        </span>
      ),
    },
    {
      header: 'Payee / Vendor',
      accessorKey: 'vendor',
      render: (item) => (
        <span className="text-xs text-slate-700">{item.vendor}</span>
      ),
    },
    {
      header: 'Approved By',
      accessorKey: 'approvedBy',
      render: (item) => (
        <span className="text-xs text-slate-600 font-mono">{item.approvedBy}</span>
      ),
    },
    {
      header: 'Disbursement Date',
      accessorKey: 'date',
      render: (item) => (
        <span className="text-xs text-slate-500 font-mono">{item.date}</span>
      ),
    },
    {
      header: 'Disbursement Amount',
      accessorKey: 'amount',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          Rs. {(item.amount || 0).toLocaleString('en-PK')}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: () => (
        <button className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700">
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full gap-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
            Operational Expenses
          </h1>
          <p className="text-xs text-slate-500">
            Audit operational venue costs: staff overtime wages, utility surges, floral decor sourcing, and laundry.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ File Expense Claim</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Outflow</span>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">[--,---.--]</div>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Vendor Payables</span>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">[--,---.--]</div>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Facility Utilities</span>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">[--,---.--]</div>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Turnover Costs</span>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">[--,---.--]</div>
        </div>
      </div>

      <DataTable<ExpenseRecord>
        columns={columns}
        data={expenses}
        keyExtractor={(item) => item.id}
        showSearchBar={true}
        searchPlaceholder="Filter expense records..."
        emptyTitle="No expense vouchers recorded"
        emptyMessage="The expense journal has zero disbursed vouchers for the active fiscal period."
        emptyAction={
          <button className="px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors">
            Record Venue Expense
          </button>
        }
        totalCountLabel="expense vouchers"
      />
    </div>
  );
};
