import React, { useState, useEffect } from 'react';
import { DollarSign, PlusCircle, TrendingDown, MoreVertical, X, Check } from 'lucide-react';
import { DataTable, Column } from '../common/DataTable';
import { ExpenseRecord } from '../../types';
import { financeApi } from '../../api/client';

export const ExpensesModule: React.FC = () => {
  // STRICT DATA RULE: Empty mock array
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formCategory, setFormCategory] = useState('Utilities');
  const [formVendor, setFormVendor] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formApprovedBy, setFormApprovedBy] = useState('Admin');
  const [formMethod, setFormMethod] = useState('Bank Transfer');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await financeApi.listExpenses();
      setExpenses(data);
    } catch (err: any) {
      console.error('Failed to load expenses from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVendor.trim() || !formAmount) return;

    try {
      const created = await financeApi.createExpense({
        category: formCategory,
        vendor: formVendor.trim(),
        amount: parseFloat(formAmount),
        approvedBy: formApprovedBy,
        paymentMethod: formMethod,
        date: formDate,
      });
      setExpenses((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setFormVendor('');
      setFormAmount('');
    } catch (err: any) {
      alert(err.message || 'Failed to record expense voucher');
    }
  };

  const totalOutflow = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const vendorPayables = expenses
    .filter((e) => e.category.toLowerCase().includes('vendor') || e.category.toLowerCase().includes('decor') || e.category.toLowerCase().includes('kitchen'))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const utilityCosts = expenses
    .filter((e) => e.category.toLowerCase().includes('util'))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

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
          Rs. {item.amount.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <button
          onClick={async () => {
            if (window.confirm(`Delete expense ${item.expenseRef}?`)) {
              await financeApi.deleteExpense(item.id);
              setExpenses((prev) => prev.filter((e) => e.id !== item.id));
            }
          }}
          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
          title="Delete voucher"
        >
          <X className="w-3.5 h-3.5" />
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
            Audit operational venue costs: staff overtime wages, utility surges, floral decor sourcing, and kitchen logistics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all w-fit cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ File Expense Claim</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Outflow</span>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">
            {totalOutflow > 0 ? `Rs. ${totalOutflow.toLocaleString()}` : '[--,---.--]'}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Vendor Payables</span>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">
            {vendorPayables > 0 ? `Rs. ${vendorPayables.toLocaleString()}` : '[--,---.--]'}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Facility Utilities</span>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">
            {utilityCosts > 0 ? `Rs. ${utilityCosts.toLocaleString()}` : '[--,---.--]'}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Vouchers</span>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">{expenses.length}</div>
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors cursor-pointer"
          >
            Record Venue Expense
          </button>
        }
        totalCountLabel="expense vouchers"
      />

      {/* File Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Record Operational Expense</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateExpense} className="p-4 flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Utilities & Generators">Utilities &amp; Generators</option>
                  <option value="Kitchen Fresh Produce">Kitchen Fresh Produce</option>
                  <option value="Floral & Decor Sourcing">Floral &amp; Decor Sourcing</option>
                  <option value="Staff Overtime Wages">Staff Overtime Wages</option>
                  <option value="Facility Maintenance">Facility Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payee / Vendor</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Petroleum"
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (Rs.)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 25000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursement Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-700 text-xs font-semibold text-white hover:bg-teal-800"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
