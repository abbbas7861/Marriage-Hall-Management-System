import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  TrendingDown,
  Wallet,
  Receipt,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  CreditCard,
  UserCheck,
  Search,
  Filter,
} from 'lucide-react';
import { DataTable, Column } from '../common/DataTable';
import { ExpenseRecord } from '../../types';
import { expensesApi } from '../../api/client';

export const ExpensesModule: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form Fields
  const [formCategory, setFormCategory] = useState('Utilities (Electricity / Generator Fuel)');
  const [formVendor, setFormVendor] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Cash');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formApprovedBy, setFormApprovedBy] = useState('Admin / Owner');
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expensesApi.list();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const totalOutflow = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const utilitiesOutflow = expenses
    .filter((e) => e.category.toLowerCase().includes('utilities') || e.category.toLowerCase().includes('fuel'))
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const decorOutflow = expenses
    .filter((e) => e.category.toLowerCase().includes('decor') || e.category.toLowerCase().includes('stage'))
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const staffOutflow = expenses
    .filter((e) => e.category.toLowerCase().includes('staff') || e.category.toLowerCase().includes('salary'))
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formVendor.trim()) {
      setFormError('Please enter Payee or Vendor Name.');
      return;
    }

    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid expense amount.');
      return;
    }

    try {
      const created = await expensesApi.create({
        expenseRef: `EXP-${Date.now().toString().slice(-5)}`,
        category: formCategory,
        vendor: formVendor.trim(),
        amount: amt,
        paymentMethod: formPaymentMethod,
        date: formDate,
        approvedBy: formApprovedBy,
      });

      setExpenses((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setFormVendor('');
      setFormAmount('');
      showToast(`Expense voucher ${created.expenseRef} recorded successfully.`);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to record expense.');
    }
  };

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
          {item.category}
        </span>
      ),
    },
    {
      header: 'Payee / Vendor',
      accessorKey: 'vendor',
      render: (item) => (
        <span className="text-xs text-slate-800 font-medium">{item.vendor}</span>
      ),
    },
    {
      header: 'Payment Mode',
      accessorKey: 'paymentMethod',
      render: (item) => (
        <span className="text-xs text-slate-600 font-mono">{item.paymentMethod || 'Cash'}</span>
      ),
    },
    {
      header: 'Approved By',
      accessorKey: 'approvedBy',
      render: (item) => (
        <span className="text-xs text-teal-700 font-mono font-semibold">{item.approvedBy}</span>
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
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-rose-600">
          PKR {(Number(item.amount) || 0).toLocaleString('en-PK')}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full gap-5 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-slate-900 text-white shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-slate-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Operational Expenses &amp; Claim Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit operational venue costs: staff overtime wages, utility surges, generator fuel, floral decor sourcing, and laundry.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-all w-fit cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>File Expense Claim</span>
        </button>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase font-mono">Total Disbursed</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            PKR {totalOutflow.toLocaleString('en-PK')}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{expenses.length} claims settled</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase font-mono">Utilities &amp; Fuel</span>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">
            PKR {utilitiesOutflow.toLocaleString('en-PK')}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Power, HVAC &amp; Generator</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase font-mono">Stage &amp; Decor</span>
          <div className="text-xl font-bold font-mono text-sky-600 mt-1">
            PKR {decorOutflow.toLocaleString('en-PK')}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Floral &amp; Audio/Visual setup</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase font-mono">Staff &amp; Overtime</span>
          <div className="text-xl font-bold font-mono text-indigo-600 mt-1">
            PKR {staffOutflow.toLocaleString('en-PK')}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Cleaning &amp; Floor Helpers</span>
        </div>
      </div>

      {/* Expenses Table */}
      <DataTable<ExpenseRecord>
        columns={columns}
        data={expenses}
        keyExtractor={(item) => item.id}
        showSearchBar={true}
        searchPlaceholder="Filter expense records by category or payee..."
        emptyTitle="No expense vouchers recorded"
        emptyMessage="The expense journal has zero disbursed vouchers for the active fiscal period."
        emptyAction={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors"
          >
            Record Venue Expense
          </button>
        }
        totalCountLabel="expense vouchers"
      />

      {/* Record Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Record Operational Expense</h3>
                  <p className="text-xs text-slate-400">File a venue cost claim and disburse payment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Expense Category *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-teal-700 cursor-pointer"
                >
                  <option value="Utilities (Electricity / Generator Fuel)">Utilities (Electricity / Generator Fuel)</option>
                  <option value="Stage Decor & Floral Sourcing">Stage Decor &amp; Floral Sourcing</option>
                  <option value="Sound, Lighting & DJ Rigging">Sound, Lighting &amp; DJ Rigging</option>
                  <option value="Kitchen Gas & Raw Spices">Kitchen Gas &amp; Raw Spices</option>
                  <option value="Staff Overtime & Floor Labor">Staff Overtime &amp; Floor Labor</option>
                  <option value="Laundry & Table Cloth Sanitization">Laundry &amp; Table Cloth Sanitization</option>
                  <option value="Facility Repairs & Maintenance">Facility Repairs &amp; Maintenance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payee / Vendor Name *
                  </label>
                  <input
                    type="text"
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    placeholder="e.g. Shell Petrol Pump / Floral City"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="25000"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Channel
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-teal-700"
                  >
                    <option value="Cash">Cash Voucher</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Company Cheque</option>
                    <option value="Online / Raast">Online / Raast</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Disbursement Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Approved By Authority
                </label>
                <input
                  type="text"
                  value={formApprovedBy}
                  onChange={(e) => setFormApprovedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-teal-700"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold transition-colors cursor-pointer"
                >
                  Confirm Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
