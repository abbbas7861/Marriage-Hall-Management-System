import React, { useState } from 'react';
import {
  Package,
  Plus,
  Box,
  Search,
  SlidersHorizontal,
  Check,
  X,
  Edit2,
  Trash2,
  Share2,
  RotateCcw,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  MapPin,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { InventoryItem } from '../../types';

const CATEGORIES = ['Furniture', 'Crockery', 'Electronics', 'Decor', 'Lighting'];
const CONDITIONS: ('Good' | 'Needs Repair' | 'Damaged')[] = ['Good', 'Needs Repair', 'Damaged'];

export const InventoryModule: React.FC = () => {
  // STRICT DATA RULE: DO NOT hardcode any dummy data.
  // Starts strictly as empty array []
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Issue to Event Modal state
  const [issueModalItem, setIssueModalItem] = useState<InventoryItem | null>(null);
  const [issueQuantity, setIssueQuantity] = useState<string>('');
  const [issueEventName, setIssueEventName] = useState<string>('');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Furniture');
  const [formTotalQty, setFormTotalQty] = useState('');
  const [formCondition, setFormCondition] = useState<'Good' | 'Needs Repair' | 'Damaged'>('Good');
  const [formStorageLocation, setFormStorageLocation] = useState('');
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('Furniture');
    setFormTotalQty('');
    setFormCondition('Good');
    setFormStorageLocation('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormName(item.itemName);
    setFormCategory(item.category);
    setFormTotalQty(item.totalQuantity.toString());
    setFormCondition(item.condition);
    setFormStorageLocation(item.storageLocation || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormError('');
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      setFormError('Please enter an item name.');
      return;
    }

    const qty = parseInt(formTotalQty, 10);
    if (isNaN(qty) || qty < 0) {
      setFormError('Please enter a valid total quantity (0 or greater).');
      return;
    }

    if (editingItem) {
      setInventory((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                itemName: formName.trim(),
                category: formCategory,
                totalQuantity: qty,
                availableQuantity: Math.max(0, qty - (item.inUseQuantity || 0)),
                condition: formCondition,
                storageLocation: formStorageLocation.trim() || undefined,
              }
            : item
        )
      );
      showToast(`Inventory item "${formName.trim()}" updated successfully.`);
    } else {
      const generatedCode = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        itemCode: generatedCode,
        itemName: formName.trim(),
        category: formCategory,
        totalQuantity: qty,
        availableQuantity: qty,
        inUseQuantity: 0,
        condition: formCondition,
        storageLocation: formStorageLocation.trim() || undefined,
      };
      setInventory((prev) => [newItem, ...prev]);
      showToast(`Asset "${formName.trim()}" (${generatedCode}) added to inventory.`);
    }

    closeModal();
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from inventory?`)) {
      setInventory((prev) => prev.filter((item) => item.id !== id));
      showToast(`Removed "${name}" from inventory.`);
    }
  };

  const handleOpenIssueModal = (item: InventoryItem) => {
    setIssueModalItem(item);
    setIssueQuantity('1');
    setIssueEventName('');
  };

  const handleConfirmIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueModalItem) return;

    const qtyToIssue = parseInt(issueQuantity, 10);
    if (isNaN(qtyToIssue) || qtyToIssue <= 0) {
      alert('Please enter a valid quantity to issue.');
      return;
    }

    if (qtyToIssue > issueModalItem.availableQuantity) {
      alert(`Cannot issue more than available quantity (${issueModalItem.availableQuantity}).`);
      return;
    }

    setInventory((prev) =>
      prev.map((item) =>
        item.id === issueModalItem.id
          ? {
              ...item,
              inUseQuantity: (item.inUseQuantity || 0) + qtyToIssue,
              availableQuantity: Math.max(0, item.availableQuantity - qtyToIssue),
            }
          : item
      )
    );

    showToast(`Issued ${qtyToIssue} units of "${issueModalItem.itemName}" to event.`);
    setIssueModalItem(null);
  };

  const handleResetToEmpty = () => {
    setInventory([]);
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedCondition('All');
    showToast('Inventory reset to clean empty state [].');
  };

  // Filtered inventory
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.storageLocation && item.storageLocation.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesCondition =
      selectedCondition === 'All' || item.condition.toLowerCase() === selectedCondition.toLowerCase();

    return matchesSearch && matchesCategory && matchesCondition;
  });

  return (
    <div className="flex flex-col w-full gap-5 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-teal-900 text-teal-50 text-xs font-semibold shadow-xl border border-teal-700/50 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-teal-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Section: Header & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
              Inventory &amp; Assets
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-bold uppercase tracking-wider">
              Banquet Assets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track banquet equipment, furniture, crockery, and maintenance status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {inventory.length > 0 && (
            <button
              type="button"
              onClick={handleResetToEmpty}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
              title="Reset inventory to empty state for testing"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Empty</span>
            </button>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Inventory Item</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards (Placeholders [--]) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Items */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Items
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {inventory.length > 0
              ? inventory.reduce((sum, item) => sum + item.totalQuantity, 0).toLocaleString()
              : '[--]'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total physical units registered</p>
        </div>

        {/* Items In Use */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Items In Use
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-2">
            {inventory.length > 0
              ? inventory.reduce((sum, item) => sum + (item.inUseQuantity || 0), 0).toLocaleString()
              : '[--]'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Dispatched to active hall setups</p>
        </div>

        {/* Low Stock */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Low Stock
            </span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-2">
            {inventory.length > 0
              ? inventory.filter((item) => item.availableQuantity < 10).length
              : '[--]'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Items below safety reorder threshold</p>
        </div>

        {/* Needs Repair */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Needs Repair
            </span>
            <div className="p-1.5 rounded-lg bg-orange-50 text-orange-700">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-orange-600 mt-2">
            {inventory.length > 0
              ? inventory.filter((item) => item.condition === 'Needs Repair' || item.condition === 'Damaged').length
              : '[--]'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting carpentry, audio or cutlery servicing</p>
        </div>
      </div>

      {/* Main Section: Filter Bar & Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="[Search items...]"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              >
                <option value="All">All Categories</option>
                <option value="Furniture">Furniture</option>
                <option value="Crockery">Crockery</option>
                <option value="Electronics">Electronics</option>
                <option value="Decor">Decor</option>
                <option value="Lighting">Lighting</option>
              </select>
            </div>

            {/* Status / Condition Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium">Condition:</span>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              >
                <option value="All">All Conditions</option>
                <option value="Good">Good</option>
                <option value="Needs Repair">Needs Repair</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>

            {(searchQuery || selectedCategory !== 'All' || selectedCondition !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedCondition('All');
                }}
                className="px-2.5 py-1.5 text-xs text-teal-800 hover:text-teal-950 font-medium hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Data Table or Empty State */}
        {filteredInventory.length === 0 ? (
          /* Empty State as explicitly specified */
          <div className="py-20 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-800 mb-4 shadow-xs">
              <Box className="w-8 h-8 stroke-[1.5]" />
            </div>

            <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              No inventory items registered
            </h3>

            <p className="text-xs text-slate-500 max-w-md mt-1.5 mb-6">
              No inventory items registered. Add your equipment and assets to track stock levels.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Inventory Item</span>
            </button>

            {/* Structural Table Skeleton Placeholder for No-Mock-Data Rule */}
            <div className="w-full max-w-3xl mt-10 pt-8 border-t border-slate-100 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Data Schema Preview (Empty Queue)
                </span>
                <span className="text-[11px] font-mono text-slate-400">0 records mapped</span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Item ID</th>
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Total Stock</th>
                      <th className="py-2.5 px-3">Available</th>
                      <th className="py-2.5 px-3">In Use</th>
                      <th className="py-2.5 px-3">Condition</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-400 font-mono">
                    <tr className="hover:bg-white/80 transition-colors">
                      <td className="py-2.5 px-3">[INV-XXXX]</td>
                      <td className="py-2.5 px-3">[Item Name]</td>
                      <td className="py-2.5 px-3">[Category]</td>
                      <td className="py-2.5 px-3">[--]</td>
                      <td className="py-2.5 px-3">[--]</td>
                      <td className="py-2.5 px-3">[--]</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200/70 text-slate-600 font-sans">
                          [--]
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <span className="text-[11px] text-slate-400">[Actions]</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Comprehensive Data Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Item ID</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Total Stock</th>
                  <th className="py-3 px-4 text-center">Available</th>
                  <th className="py-3 px-4 text-center">In Use</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item) => {
                  const conditionBadge =
                    item.condition === 'Good'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                      : item.condition === 'Needs Repair'
                      ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                      : 'bg-rose-50 text-rose-800 border-rose-200/80';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Item ID */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {item.itemCode}
                        </span>
                      </td>

                      {/* Item Name */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.itemName}</div>
                        {item.storageLocation && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{item.storageLocation}</span>
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/60">
                          {item.category}
                        </span>
                      </td>

                      {/* Total Stock */}
                      <td className="py-3 px-4 text-center font-mono font-medium text-slate-800">
                        {item.totalQuantity}
                      </td>

                      {/* Available */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-teal-800">
                        {item.availableQuantity}
                      </td>

                      {/* In Use */}
                      <td className="py-3 px-4 text-center font-mono font-medium text-amber-700">
                        {item.inUseQuantity || 0}
                      </td>

                      {/* Condition Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${conditionBadge}`}
                        >
                          {item.condition === 'Good' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {item.condition === 'Needs Repair' && <Wrench className="w-3 h-3 text-amber-600" />}
                          {item.condition === 'Damaged' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                          <span>{item.condition}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Issue to Event */}
                          <button
                            type="button"
                            onClick={() => handleOpenIssueModal(item)}
                            title="Issue to Event"
                            disabled={item.availableQuantity <= 0}
                            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                              item.availableQuantity > 0
                                ? 'border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100'
                                : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline font-medium">Issue</span>
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            title="Edit Item"
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id, item.itemName)}
                            title="Delete Item"
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info bar */}
        {filteredInventory.length > 0 && (
          <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{filteredInventory.length}</strong> of{' '}
              <strong className="text-slate-800">{inventory.length}</strong> inventory items
            </span>
            <span className="font-mono text-[11px] text-slate-400">Warehouse Ledger Sync: Active</span>
          </div>
        )}
      </div>

      {/* Simulated "Add / Edit Inventory Item" Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                  {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingItem
                    ? `Updating parameters for ${editingItem.itemCode}`
                    : 'Register physical equipment or assets for wedding hall events.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Item Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="[Enter Item Name]"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              {/* Category & Condition 2-col */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Condition Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condition <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCondition}
                    onChange={(e) =>
                      setFormCondition(e.target.value as 'Good' | 'Needs Repair' | 'Damaged')
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  >
                    {CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>
                        {cond}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Total Quantity & Storage Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Total Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formTotalQty}
                    onChange={(e) => {
                      setFormTotalQty(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="[0]"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>

                {/* Storage Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Storage Location
                  </label>
                  <input
                    type="text"
                    value={formStorageLocation}
                    onChange={(e) => setFormStorageLocation(e.target.value)}
                    placeholder="[e.g., Hall 1 Storage Room]"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  {editingItem ? 'Update Item' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulated "Issue to Event" Modal */}
      {issueModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                  Issue Item to Event
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  {issueModalItem.itemCode} • {issueModalItem.itemName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIssueModalItem(null)}
                className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmIssue} className="p-5 space-y-4">
              <div className="p-3 rounded-lg bg-teal-50 border border-teal-200/80 text-xs text-teal-800">
                <span>Available units for dispatch: </span>
                <strong className="font-mono text-teal-950 font-bold">
                  {issueModalItem.availableQuantity}
                </strong>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity to Issue <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={issueModalItem.availableQuantity}
                  value={issueQuantity}
                  onChange={(e) => setIssueQuantity(e.target.value)}
                  placeholder="[Enter quantity]"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event / Hall Assignment
                </label>
                <input
                  type="text"
                  value={issueEventName}
                  onChange={(e) => setIssueEventName(e.target.value)}
                  placeholder="[e.g., Barat - Hall 1 (Royal Crystal)]"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIssueModalItem(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 shadow-xs"
                >
                  Confirm Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
