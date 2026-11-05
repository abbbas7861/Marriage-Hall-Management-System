import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  CheckCircle2,
  Truck,
  Plus,
  Search,
  Filter,
  Flame,
  Phone,
  RotateCcw,
  Clock,
  Sparkles,
  X,
  FileText,
  DollarSign,
  Scale,
  Building2,
  Check,
} from 'lucide-react';
import {
  pantryApi,
  PantryStockItem,
  PantryPurchaseOrder,
} from '../../api/client';

export const KitchenPantryInventory: React.FC = () => {
  const [items, setItems] = useState<PantryStockItem[]>([]);
  const [orders, setOrders] = useState<PantryPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeView, setActiveView] = useState<'inventory' | 'orders'>('inventory');

  // Supplier Order Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedItemForOrder, setSelectedItemForOrder] = useState<PantryStockItem | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(50);
  const [orderSupplier, setOrderSupplier] = useState<string>('');
  const [orderContact, setOrderContact] = useState<string>('');
  const [orderUrgency, setOrderUrgency] = useState<'Normal' | 'Urgent' | 'Critical Emergency'>('Urgent');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Quick Stock Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<PantryStockItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Daily Event Consumption');

  // New Item Modal
  const [newItemModalOpen, setNewItemModalOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    category: 'Meat & Poultry',
    unit: 'kg',
    currentStock: 50,
    minThreshold: 20,
    reorderQuantity: 100,
    unitPrice: 500,
    preferredSupplier: '',
    supplierContact: '',
    storageLocation: 'Dry Pantry',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedItems, fetchedOrders] = await Promise.all([
        pantryApi.listItems(),
        pantryApi.listOrders(),
      ]);
      setItems(fetchedItems);
      setOrders(fetchedOrders);
    } catch (err) {
      console.error('Failed to load pantry data:', err);
      showToast('Error loading pantry stock records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const lowStockItems = useMemo(
    () => items.filter((item) => item.currentStock <= item.minThreshold),
    [items]
  );

  const activeOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'Ordered').length,
    [orders]
  );

  const totalPantryValue = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.currentStock * it.unitPrice), 0);
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (categoryFilter !== 'All' && it.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          it.name.toLowerCase().includes(q) ||
          it.itemCode.toLowerCase().includes(q) ||
          it.preferredSupplier.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, categoryFilter, searchQuery]);

  // Open Order Modal for an item
  const handleOpenOrderModal = (item: PantryStockItem) => {
    setSelectedItemForOrder(item);
    setOrderQuantity(item.reorderQuantity || 50);
    setOrderSupplier(item.preferredSupplier || 'Authorized Ingredient Vendor');
    setOrderContact(item.supplierContact || '');
    setOrderUrgency(item.currentStock <= 0 ? 'Critical Emergency' : 'Urgent');
    setOrderNotes(`Replenishment for ${item.name} (${item.currentStock} ${item.unit} remaining)`);
    setOrderModalOpen(true);
  };

  // Submit Supplier Purchase Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForOrder) return;
    try {
      setSubmittingOrder(true);
      const newOrder = await pantryApi.quickOrder(selectedItemForOrder.id, {
        quantity: orderQuantity,
        supplierName: orderSupplier,
        supplierContact: orderContact,
        urgency: orderUrgency,
        orderedBy: 'Executive Chef',
        notes: orderNotes,
      });

      setOrders((prev) => [newOrder, ...prev]);
      setOrderModalOpen(false);
      showToast(`Purchase order ${newOrder.orderRef} dispatched to ${orderSupplier}!`);
    } catch (err) {
      console.error('Failed to submit purchase order:', err);
      showToast('Failed to create purchase order.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Handle Mark Received & Stock
  const handleMarkReceived = async (order: PantryPurchaseOrder) => {
    try {
      const updated = await pantryApi.markOrderReceived(order.id, 'Receiving Clerk');
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));

      // Refresh items to show incremented stock
      const refreshedItems = await pantryApi.listItems();
      setItems(refreshedItems);
      showToast(`Order ${order.orderRef} received! +${order.quantity} ${order.unit} added to stock.`);
    } catch (err) {
      console.error('Failed to receive order:', err);
      showToast('Failed to receive order.');
    }
  };

  // Handle Quick Stock Adjust
  const handleOpenAdjustModal = (item: PantryStockItem) => {
    setSelectedItemForAdjust(item);
    setAdjustDelta(0);
    setAdjustReason('Daily Event Consumption');
    setAdjustModalOpen(true);
  };

  const handleSubmitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdjust || adjustDelta === 0) return;
    try {
      const updated = await pantryApi.adjustStock(
        selectedItemForAdjust.id,
        adjustDelta,
        adjustReason,
        'Executive Chef'
      );
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      setAdjustModalOpen(false);
      showToast(`Stock for ${updated.name} updated to ${updated.currentStock} ${updated.unit}.`);
    } catch (err) {
      console.error('Failed to adjust stock:', err);
      showToast('Failed to adjust stock.');
    }
  };

  // Handle Create New Item
  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await pantryApi.createItem(newItemForm);
      setItems((prev) => [...prev, created]);
      setNewItemModalOpen(false);
      showToast(`Added ${created.name} to pantry inventory!`);
    } catch (err) {
      console.error('Failed to create item:', err);
      showToast('Failed to create item.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400/40 animate-slide-up">
          <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-amber-500/10 to-transparent rounded-full blur-3xl -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Kitchen Pantry & Raw Ingredient Stock
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Live tracking of raw meat, basmati rice, cooking oil, ghee, dairy, and spices with automated safety threshold warnings and 1-click supplier purchase orders.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView(activeView === 'inventory' ? 'orders' : 'inventory')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Truck className="w-4 h-4 text-sky-400" />
              <span>
                {activeView === 'inventory'
                  ? `View Supplier Orders (${orders.length})`
                  : 'Back to Stock Grid'}
              </span>
            </button>

            <button
              onClick={() => setNewItemModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Ingredient</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Tracked Ingredients</span>
              <Package className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <p className="text-xl font-bold text-white">{items.length} Items</p>
            <span className="text-[11px] text-slate-500">Active Pantry Catalog</span>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Low Stock Alerts</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <p className="text-xl font-bold text-rose-400">{lowStockItems.length} Items</p>
            <span className="text-[11px] text-rose-300/80 font-medium">Below Minimum Threshold</span>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Orders in Pipeline</span>
              <Truck className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xl font-bold text-amber-400">{activeOrdersCount} Pending</p>
            <span className="text-[11px] text-slate-500">Awaiting Supplier Delivery</span>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Stock Value</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-emerald-400">
              Rs. {totalPantryValue.toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-500">Asset Cost Basis</span>
          </div>
        </div>
      </div>

      {/* Prominent Low-Stock Warning Ribbon (If Any) */}
      {lowStockItems.length > 0 && activeView === 'inventory' && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Immediate Kitchen Restock Required!</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold uppercase">
                  {lowStockItems.length} LOW ITEMS
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                The following essentials are below safety threshold for upcoming banquets:{' '}
                <span className="font-semibold text-rose-200">
                  {lowStockItems.map((it) => `${it.name} (${it.currentStock} ${it.unit})`).join(', ')}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenOrderModal(lowStockItems[0])}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-500/20 transition whitespace-nowrap self-start md:self-auto"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Reorder {lowStockItems[0].name.split(' ')[0]}</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {activeView === 'inventory' ? (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            {/* Category tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                'All',
                'Meat & Poultry',
                'Grains & Rice',
                'Oils & Ghee',
                'Dairy',
                'Spices & Seasonings',
                'Bakery & Dry Goods',
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    categoryFilter === cat
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700/80 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ingredients, supplier..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const isLow = item.currentStock <= item.minThreshold;
              const ratio = Math.min(100, Math.round((item.currentStock / item.minThreshold) * 100));

              return (
                <div
                  key={item.id}
                  className={`bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border transition-all shadow-md flex flex-col justify-between ${
                    isLow
                      ? 'border-rose-500/60 shadow-rose-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Top Meta */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {item.itemCode}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {item.category}
                        </span>
                      </div>

                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          IN STOCK
                        </span>
                      )}
                    </div>

                    {/* Title & Current Stock Level */}
                    <div className="mt-3">
                      <h3 className="text-base font-bold text-white leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Storage: {item.storageLocation}
                      </p>
                    </div>

                    {/* Stock Meter */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                      <div className="flex items-end justify-between mb-1.5">
                        <div>
                          <span className="text-xs text-slate-400 block">Available Balance</span>
                          <span
                            className={`text-2xl font-black ${
                              isLow ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {item.currentStock.toLocaleString()}{' '}
                            <span className="text-xs font-bold text-slate-300">{item.unit}</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">Safety Min:</span>
                          <span className="text-xs font-bold text-slate-300 font-mono">
                            {item.minThreshold} {item.unit}
                          </span>
                        </div>
                      </div>

                      {/* Visual Health Bar */}
                      <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLow ? 'bg-rose-500' : ratio < 150 ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(10, ratio))}%` }}
                        />
                      </div>
                    </div>

                    {/* Supplier Info */}
                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Unit Cost:</span>
                        <span className="font-semibold text-white">
                          Rs. {item.unitPrice.toLocaleString()} / {item.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Vendor:</span>
                        <span className="font-medium text-slate-300 truncate max-w-[180px]">
                          {item.preferredSupplier || 'Wholesale Mandi'}
                        </span>
                      </div>
                      {item.supplierContact && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Phone:</span>
                          <span className="font-mono text-slate-300 text-[11px] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-sky-400" />
                            {item.supplierContact}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenAdjustModal(item)}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5"
                    >
                      <Scale className="w-3.5 h-3.5 text-amber-400" />
                      <span>Log Usage</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenOrderModal(item)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
                        isLow
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Order Restock</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Purchase Orders View */
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-400" />
                <span>Supplier Purchase Orders & Deliveries</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Track dispatched grocery requisitions and log incoming deliveries directly into pantry balance.
              </p>
            </div>
            <button
              onClick={() => setActiveView('inventory')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 hover:bg-slate-700"
            >
              Back to Inventory
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">PO Ref</th>
                  <th className="py-3 px-4">Ingredient Name</th>
                  <th className="py-3 px-4">Quantity Ordered</th>
                  <th className="py-3 px-4">Total Cost</th>
                  <th className="py-3 px-4">Supplier & Phone</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {po.orderRef}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {po.itemName}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400 font-mono">
                        {po.quantity} {po.unit}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        Rs. {po.totalCost.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="block font-medium text-slate-200">{po.supplierName}</span>
                        {po.supplierContact && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            {po.supplierContact}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            po.urgency === 'Critical Emergency'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : po.urgency === 'Urgent'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {po.urgency}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            po.status === 'Received & Stocked'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : po.status === 'Cancelled'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                          }`}
                        >
                          {po.status === 'Received & Stocked' && <Check className="w-3 h-3" />}
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {po.status === 'Ordered' && (
                          <button
                            type="button"
                            onClick={() => handleMarkReceived(po)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1 ml-auto"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Receive & Stock</span>
                          </button>
                        )}
                        {po.status === 'Received & Stocked' && (
                          <span className="text-xs text-slate-500 italic">
                            Stocked on {new Date(po.receivedAt || po.orderedAt || '').toLocaleDateString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Order Modal */}
      {orderModalOpen && selectedItemForOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setOrderModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Generate Supplier Purchase Order</h3>
                <p className="text-xs text-slate-400">
                  Replenishing <strong className="text-white">{selectedItemForOrder.name}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block">Current Stock:</span>
                  <span className="font-bold text-rose-400">
                    {selectedItemForOrder.currentStock} {selectedItemForOrder.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Safety Minimum:</span>
                  <span className="font-bold text-slate-200">
                    {selectedItemForOrder.minThreshold} {selectedItemForOrder.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reorder Quantity ({selectedItemForOrder.unit}) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Number(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex gap-1.5">
                    {[50, 100, 200].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setOrderQuantity(q)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                          orderQuantity === q
                            ? 'bg-emerald-500 text-white border-emerald-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Supplier / Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={orderSupplier}
                    onChange={(e) => setOrderSupplier(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Supplier Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={orderContact}
                    onChange={(e) => setOrderContact(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Order Urgency
                  </label>
                  <select
                    value={orderUrgency}
                    onChange={(e) =>
                      setOrderUrgency(e.target.value as 'Normal' | 'Urgent' | 'Critical Emergency')
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Normal">Normal Restock</option>
                    <option value="Urgent">Urgent (Upcoming event)</option>
                    <option value="Critical Emergency">Critical Emergency (Running low now)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Estimated Cost
                  </label>
                  <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-mono text-xs font-bold">
                    Rs. {(orderQuantity * selectedItemForOrder.unitPrice).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Delivery Specifications & Notes
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Deliver before 10 AM, check moisture content, deliver to Cold Storage Dock 2..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>Confirm & Dispatch Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      {adjustModalOpen && selectedItemForAdjust && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setAdjustModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Log Pantry Stock Adjustment</h3>
                <p className="text-xs text-slate-400">{selectedItemForAdjust.name}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitAdjust} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs flex justify-between items-center">
                <span className="text-slate-400">Current Balance:</span>
                <span className="text-base font-bold text-white font-mono">
                  {selectedItemForAdjust.currentStock} {selectedItemForAdjust.unit}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Stock Change (+ for received, - for used) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(Number(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setAdjustDelta(-20)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-rose-400 text-xs font-bold border border-slate-700 hover:bg-slate-700"
                    >
                      -20
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustDelta(50)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-emerald-400 text-xs font-bold border border-slate-700 hover:bg-slate-700"
                    >
                      +50
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  New Resulting Balance:{' '}
                  <strong className="text-white">
                    {Math.max(0, selectedItemForAdjust.currentStock + adjustDelta)}{' '}
                    {selectedItemForAdjust.unit}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Adjustment
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Daily Event Consumption">Daily Event Consumption</option>
                  <option value="Direct Local Market Purchase">Direct Local Market Purchase</option>
                  <option value="Pantry Audit Count Correction">Pantry Audit Count Correction</option>
                  <option value="Spoilage or Wastage Write-off">Spoilage or Wastage Write-off</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Ingredient Modal */}
      {newItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setNewItemModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Add New Pantry Ingredient</h3>
                <p className="text-xs text-slate-400">Register new raw material into kitchen ERP</p>
              </div>
            </div>

            <form onSubmit={handleCreateNewItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ingredient Name *
                </label>
                <input
                  type="text"
                  required
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  placeholder="e.g. Sella Basmati Rice, Boneless Veal..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Meat & Poultry">Meat & Poultry</option>
                    <option value="Grains & Rice">Grains & Rice</option>
                    <option value="Oils & Ghee">Oils & Ghee</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Spices & Seasonings">Spices & Seasonings</option>
                    <option value="Produce & Veggies">Produce & Veggies</option>
                    <option value="Bakery & Dry Goods">Bakery & Dry Goods</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Unit</label>
                  <select
                    value={newItemForm.unit}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="kg">kg</option>
                    <option value="Liters">Liters</option>
                    <option value="50kg Bags">50kg Bags</option>
                    <option value="16kg Tins">16kg Tins</option>
                    <option value="Crates">Crates</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={newItemForm.currentStock}
                    onChange={(e) =>
                      setNewItemForm({ ...newItemForm, currentStock: Number(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={newItemForm.minThreshold}
                    onChange={(e) =>
                      setNewItemForm({ ...newItemForm, minThreshold: Number(e.target.value) || 10 })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Price (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={newItemForm.unitPrice}
                    onChange={(e) =>
                      setNewItemForm({ ...newItemForm, unitPrice: Number(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Preferred Supplier</label>
                  <input
                    type="text"
                    value={newItemForm.preferredSupplier}
                    onChange={(e) =>
                      setNewItemForm({ ...newItemForm, preferredSupplier: e.target.value })
                    }
                    placeholder="e.g. Haji Poultry Farms"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Supplier Contact</label>
                  <input
                    type="text"
                    value={newItemForm.supplierContact}
                    onChange={(e) =>
                      setNewItemForm({ ...newItemForm, supplierContact: e.target.value })
                    }
                    placeholder="+92 300 0000000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

