import React, { useMemo, useState } from 'react';
import {
  Clock,
  Eye,
  Pencil,
  PieChart,
  Plus,
  Receipt,
  Search,
  Trash2,
  TrendingDown,
  X,
} from 'lucide-react';

export type ExpenseCategory =
  | 'Utilities'
  | 'Staff'
  | 'Maintenance'
  | 'Supplies'
  | 'Other';

export type ExpenseStatus = 'Paid' | 'Pending';

export interface ExpenseRecord {
  id: string;
  description: string;
  category: ExpenseCategory;
  paidTo: string;
  date: string;
  amount: number;
  status: ExpenseStatus;
  notes?: string;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Utilities',
  'Staff',
  'Maintenance',
  'Supplies',
  'Other',
];

const CATEGORY_BADGE_STYLES: Record<ExpenseCategory, string> = {
  Utilities: 'bg-blue-50 text-blue-800 border-blue-200',
  Staff: 'bg-teal-50 text-teal-800 border-teal-200',
  Maintenance: 'bg-orange-50 text-orange-800 border-orange-200',
  Supplies: 'bg-purple-50 text-purple-800 border-purple-200',
  Other: 'bg-slate-100 text-slate-700 border-slate-200',
};

const STATUS_BADGE_STYLES: Record<ExpenseStatus, string> = {
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
};

export const ExpensesManagementPage: React.FC = () => {
  // Strictly empty initial state — zero hardcoded dummy data
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  // Filter bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | ExpenseCategory>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingExpense, setViewingExpense] = useState<ExpenseRecord | null>(null);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Utilities');
  const [paidTo, setPaidTo] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  const kpiMetrics = useMemo(() => {
    if (expenses.length === 0) {
      return {
        totalExpenses: '[--]',
        highestCategory: '[--]',
        pendingApprovals: '[--]',
      };
    }

    const totalSum = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const pendingCount = expenses.filter((exp) => exp.status === 'Pending').length;

    const totalsByCat = new Map<ExpenseCategory, number>();
    for (const exp of expenses) {
      totalsByCat.set(exp.category, (totalsByCat.get(exp.category) ?? 0) + exp.amount);
    }

    let topCategory: ExpenseCategory = expenses[0].category;
    let maxVal = -1;
    totalsByCat.forEach((val, cat) => {
      if (val > maxVal) {
        maxVal = val;
        topCategory = cat;
      }
    });

    return {
      totalExpenses: `Rs. ${totalSum.toLocaleString()}`,
      highestCategory: topCategory,
      pendingApprovals: String(pendingCount),
    };
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        exp.id.toLowerCase().includes(q) ||
        exp.description.toLowerCase().includes(q) ||
        exp.paidTo.toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === 'All' || exp.category === categoryFilter;

      const matchesStart = !startDate || exp.date >= startDate;
      const matchesEnd = !endDate || exp.date <= endDate;

      return matchesSearch && matchesCategory && matchesStart && matchesEnd;
    });
  }, [expenses, searchQuery, categoryFilter, startDate, endDate]);

  const openCreateModal = () => {
    setEditingId(null);
    setDescription('');
    setAmount('');
    setCategory('Utilities');
    setPaidTo('');
    setDate('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (exp: ExpenseRecord) => {
    setEditingId(exp.id);
    setDescription(exp.description);
    setAmount(String(exp.amount));
    setCategory(exp.category);
    setPaidTo(exp.paidTo);
    setDate(exp.date === '[--]' ? '' : exp.date);
    setNotes(exp.notes ?? '');
    setIsModalOpen(true);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDesc = description.trim();
    const trimmedVendor = paidTo.trim();
    const parsedAmount = parseFloat(amount);
    if (!trimmedDesc || !trimmedVendor || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    if (editingId) {
      setExpenses((prev) =>
        prev.map((exp) =>
          exp.id === editingId
            ? {
                ...exp,
                description: trimmedDesc,
                amount: parsedAmount,
                category,
                paidTo: trimmedVendor,
                date: date || '[--]',
                notes: notes.trim() || undefined,
              }
            : exp
        )
      );
    } else {
      const created: ExpenseRecord = {
        id: `EXP-${Date.now().toString().slice(-4)}`,
        description: trimmedDesc,
        category,
        paidTo: trimmedVendor,
        date: date || '[--]',
        amount: parsedAmount,
        status: 'Paid',
        notes: notes.trim() || undefined,
      };
      setExpenses((prev) => [created, ...prev]);
    }

    setIsModalOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
            Operational Expenses
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track and manage all hall operational costs and outflows.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Log New Expense
        </button>
      </div>

      {/* KPI Metrics Bar (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Expenses (This Month)
            </span>
            <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.totalExpenses}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Highest Expense Category
            </span>
            <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900 truncate">
            {kpiMetrics.highestCategory}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Approvals
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.pendingApprovals}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by vendor or description..."
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filter by Category"
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as 'All' | ExpenseCategory)
            }
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
          >
            <option value="All">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-700 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              aria-label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-700 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            />
          </div>
        </div>
      </div>

      {/* Main Section: Data Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Expense ID
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Description
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Category
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Paid To
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Date
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Amount
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 px-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
                        <Receipt className="w-7 h-7 text-slate-400" />
                      </div>
                      <p className="text-base font-semibold text-slate-900">
                        No expenses logged yet.
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Log your first operational expense to start tracking outflows.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-5 text-sm font-mono font-semibold text-slate-900">
                      {exp.id}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-medium text-slate-900">
                      {exp.description}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_BADGE_STYLES[exp.category]}`}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-slate-700">
                      {exp.paidTo}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-mono text-slate-600">
                      {exp.date}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-mono tabular-nums font-semibold text-red-600">
                      Rs. {exp.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_STYLES[exp.status]}`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingExpense(exp)}
                          aria-label={`View ${exp.id}`}
                          className="p-2 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(exp)}
                          aria-label={`Edit ${exp.id}`}
                          className="p-2 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp.id)}
                          aria-label={`Delete ${exp.id}`}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Log / Edit Expense Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="expense-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3
                id="expense-modal-title"
                className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900"
              >
                {editingId ? 'Edit Expense' : 'Log New Expense'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-5 space-y-4">
              <div>
                <label
                  htmlFor="exp-title"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Expense Title / Description
                </label>
                <input
                  id="exp-title"
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="[--]"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="exp-amount"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Amount (Rs.)
                  </label>
                  <input
                    id="exp-amount"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="[--]"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="exp-category"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Category
                  </label>
                  <select
                    id="exp-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="exp-vendor"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Paid To / Vendor Name
                  </label>
                  <input
                    id="exp-vendor"
                    type="text"
                    required
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    placeholder="[--]"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="exp-date"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Date
                  </label>
                  <input
                    id="exp-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="exp-notes"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Notes
                </label>
                <textarea
                  id="exp-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="[--]"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Expense Modal */}
      {viewingExpense && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-expense-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3
                id="view-expense-modal-title"
                className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900"
              >
                Expense {viewingExpense.id}
              </h3>
              <button
                type="button"
                onClick={() => setViewingExpense(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Description</span>
                <span className="font-medium text-slate-900">
                  {viewingExpense.description}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Category</span>
                <span className="font-medium text-slate-900">
                  {viewingExpense.category}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Paid To</span>
                <span className="font-medium text-slate-900">
                  {viewingExpense.paidTo}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Date</span>
                <span className="font-mono text-slate-700">
                  {viewingExpense.date}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Amount</span>
                <span className="font-mono tabular-nums font-semibold text-red-600">
                  Rs. {viewingExpense.amount.toLocaleString()}
                </span>
              </div>
              {viewingExpense.notes && (
                <div className="pt-1.5">
                  <span className="block text-xs text-slate-500 mb-1">Notes</span>
                  <p className="text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs">
                    {viewingExpense.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingExpense(null)}
                className="rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
