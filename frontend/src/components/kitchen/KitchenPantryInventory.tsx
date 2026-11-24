import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  CheckCircle2,
  Truck,
  Plus,
  Search,
  Scale,
  X,
  Phone,
  Calendar,
  Box,
  RefreshCw,
  Minus,
} from 'lucide-react';
import {
  pantryApi,
  PantryStockItem,
  PantryPurchaseOrder,
  bookingsApi,
} from '../../api/client';
import { Booking } from '../../types';
import { isEventActiveOrUpcoming } from '../../utils/formatters';

interface KitchenPantryInventoryProps {
  initialView?: 'inventory' | 'orders';
}

const INGREDIENT_CATEGORIES = [
  'All',
  'Meat & Poultry',
  'Grains & Rice',
  'Oils & Ghee',
  'Dairy',
  'Spices & Seasonings',
  'Produce & Veggies',
  'Bakery & Dry Goods',
];

export const KitchenPantryInventory: React.FC<KitchenPantryInventoryProps> = ({
  initialView = 'inventory',
}) => {
  const [items, setItems] = useState<PantryStockItem[]>([]);
  const [orders, setOrders] = useState<PantryPurchaseOrder[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedEventRef, setSelectedEventRef] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeView, setActiveView] = useState<'inventory' | 'orders'>(initialView);

  useEffect(() => {
    if (initialView) {
      setActiveView(initialView);
    }
  }, [initialView]);

  // Supplier Order Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedItemForOrder, setSelectedItemForOrder] = useState<PantryStockItem | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(50);
  const [orderSupplier, setOrderSupplier] = useState<string>('');
  const [orderContact, setOrderContact] = useState<string>('');
  const [orderUrgency, setOrderUrgency] = useState<'Normal' | 'Urgent' | 'Critical Emergency'>('Urgent');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Quick Stock Adjustment / Usage Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<PantryStockItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustCost, setAdjustCost] = useState<number>(0);
  const [adjustEventRef, setAdjustEventRef] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('Direct Local Market Purchase');

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
    totalCost: 25000,
    eventRef: '',
    preferredSupplier: '',
    supplierContact: '',
    storageLocation: 'Dry Pantry',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedItems, fetchedOrders, fetchedBookings] = await Promise.all([
        pantryApi.listItems(),
        pantryApi.listOrders(),
        bookingsApi.list().catch(() => []),
      ]);
      const activeBookings = (fetchedBookings || []).filter(isEventActiveOrUpcoming);
      setItems(fetchedItems);
      setOrders(fetchedOrders);
      setBookings(activeBookings);
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
    () => items.filter((item) => Number(item.currentStock) <= Number(item.minThreshold)),
    [items]
  );

  const activeOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'Ordered').length,
    [orders]
  );

  const totalPantryValue = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.currentStock) * Number(it.unitPrice)), 0);
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
          (it.preferredSupplier && it.preferredSupplier.toLowerCase().includes(q))
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
    setOrderUrgency(Number(item.currentStock) <= 0 ? 'Critical Emergency' : 'Urgent');
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
      const updated = await pantryApi.markReceived(order.id, {
        receivedBy: 'Receiving Clerk',
        eventRef: selectedEventRef || '',
      });
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

  // Handle Quick Stock Adjust / Usage
  const handleOpenAdjustModal = (item: PantryStockItem, defaultDelta: number = 0) => {
    setSelectedItemForAdjust(item);
    setAdjustDelta(defaultDelta);
    setAdjustCost(0);
    setAdjustEventRef(selectedEventRef);
    setAdjustReason(defaultDelta < 0 ? 'Daily Event Consumption' : 'Direct Local Market Purchase');
    setAdjustModalOpen(true);
  };

  const handleSubmitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdjust || adjustDelta === 0) return;
    try {
      const updated = await pantryApi.adjustStock(
        selectedItemForAdjust.id,
        {
          adjustment: adjustDelta,
          reason: adjustReason,
          staffName: 'Executive Chef',
          eventRef: adjustEventRef,
          cost: adjustCost,
        }
      );
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      setAdjustModalOpen(false);
      showToast(
        `Stock for ${updated.name} updated to ${updated.currentStock} ${updated.unit}${
          adjustDelta > 0 && adjustCost > 0 ? ' (Cost logged in Accounts)' : ''
        }.`
      );
    } catch (err) {
      console.error('Failed to adjust stock:', err);
      showToast('Failed to adjust stock.');
    }
  };

  // Handle Create New Item
  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newItemForm,
        eventRef: newItemForm.eventRef || selectedEventRef || '',
      };
      const created = await pantryApi.createItem(payload);
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
        <div className="fixed bottom-6 right-6 z-50 bg-teal-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-teal-700 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-teal-300" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card in System Light Theme */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
            {activeView === 'orders'
              ? 'Ingredient Reorders & Supplier Orders'
              : 'Kitchen Pantry Inventory'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeView === 'orders'
              ? 'Track supplier orders and confirm incoming ingredient deliveries into live stock.'
              : 'Track raw ingredient stock levels, low-stock thresholds, and event allocations.'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveView(activeView === 'inventory' ? 'orders' : 'inventory')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
          >
            <Truck className="w-4 h-4 text-teal-700" />
            <span>
              {activeView === 'inventory'
                ? `Supplier Orders (${orders.length})`
                : 'Pantry Stock List'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setNewItemModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ingredient</span>
          </button>
        </div>
      </div>

      {/* 3 Impactful KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Tracked SKUs
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <Box className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {items.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Active inventory items</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Low Stock Alerts
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-amber-700">
            {lowStockItems.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Below safety reorder threshold</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Stock Valuation
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Truck className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            Rs. {totalPantryValue.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">{activeOrdersCount} supplier orders pending</p>
        </div>
      </div>

      {/* Main Content Area */}
      {activeView === 'inventory' ? (
        <div className="space-y-4">
          {/* Filter Bar with Event Selector & Category Tabs */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {INGREDIENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-teal-50 text-teal-800 border-teal-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Event Allocation Filter */}
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span className="font-semibold text-slate-500">Event:</span>
                <select
                  value={selectedEventRef}
                  onChange={(e) => setSelectedEventRef(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer max-w-[200px] truncate"
                >
                  <option value="">General Kitchen (No Event)</option>
                  {bookings.map((b) => (
                    <option key={b.bookingRef} value={b.bookingRef}>
                      {b.bookingRef} - {b.customerName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ingredient or vendor..."
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>
            </div>
          </div>

          {/* Clean List View Table (Matching Old Theme) */}
          <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-5">Code</th>
                    <th className="py-3.5 px-5">Ingredient Name</th>
                    <th className="py-3.5 px-5">Category</th>
                    <th className="py-3.5 px-5">Current Stock</th>
                    <th className="py-3.5 px-5">Min Threshold</th>
                    <th className="py-3.5 px-5">Unit Price</th>
                    <th className="py-3.5 px-5">Preferred Vendor</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 px-6 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                            <Box className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">
                            No pantry ingredients found.
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Click &ldquo;+ Add Ingredient&rdquo; to register new inventory stock.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isLowStock = Number(item.currentStock) <= Number(item.minThreshold);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-500">
                            {item.itemCode}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-slate-900">
                            {item.name}
                          </td>
                          <td className="py-3.5 px-5 text-slate-600 text-xs">
                            {item.category}
                          </td>
                          <td className="py-3.5 px-5 font-mono tabular-nums font-bold text-slate-900">
                            {item.currentStock} {item.unit}
                          </td>
                          <td className="py-3.5 px-5 font-mono tabular-nums text-slate-500 text-xs">
                            {item.minThreshold} {item.unit}
                          </td>
                          <td className="py-3.5 px-5 font-mono text-slate-700 text-xs">
                            Rs. {Number(item.unitPrice).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-5 text-slate-600 text-xs">
                            <span>{item.preferredSupplier || '—'}</span>
                            {item.supplierContact && (
                              <span className="block font-mono text-[11px] text-slate-400">
                                {item.supplierContact}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5">
                            {isLowStock ? (
                              <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenAdjustModal(item, -10)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                title="Log Kitchen Usage"
                              >
                                <Minus className="w-3.5 h-3.5 text-teal-700" />
                                Usage
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenOrderModal(item)}
                                className="inline-flex items-center gap-1 rounded-lg bg-teal-700 hover:bg-teal-800 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                                title="Order Restock from Supplier"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                Reorder
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Purchase Orders View in Clean Theme */
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-700" />
                <span>Supplier Purchase Orders & Deliveries</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Confirm incoming supplier deliveries into live pantry stock balance and record costs.
              </p>
            </div>
            <button
              onClick={() => setActiveView('inventory')}
              className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              Back to Stock List
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-5">PO Ref</th>
                  <th className="py-3 px-5">Ingredient</th>
                  <th className="py-3 px-5">Quantity</th>
                  <th className="py-3 px-5">Total Cost</th>
                  <th className="py-3 px-5">Supplier</th>
                  <th className="py-3 px-5">Urgency</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-5 font-mono text-xs font-semibold text-slate-600">
                        {po.orderRef}
                      </td>
                      <td className="py-3 px-5 font-semibold text-slate-900">
                        {po.itemName}
                      </td>
                      <td className="py-3 px-5 font-mono text-slate-900 font-bold">
                        {po.quantity} {po.unit}
                      </td>
                      <td className="py-3 px-5 font-mono text-teal-800 font-semibold">
                        Rs. {Number(po.totalCost).toLocaleString()}
                      </td>
                      <td className="py-3 px-5 text-xs text-slate-600">
                        <span className="font-medium text-slate-800">{po.supplierName}</span>
                        {po.supplierContact && (
                          <span className="block font-mono text-[11px] text-slate-400">
                            {po.supplierContact}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            po.urgency === 'Critical Emergency'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {po.urgency}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                            po.status === 'Received & Stocked'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        {po.status === 'Ordered' ? (
                          <button
                            type="button"
                            onClick={() => handleMarkReceived(po)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Confirm Delivery & Stock
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Stocked</span>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Order Restock from Supplier
                </h3>
                <p className="text-xs text-slate-500">{selectedItemForOrder.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setOrderModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="p-5 space-y-4">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <span className="text-xs text-slate-500">Current Stock:</span>
                <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                  {selectedItemForOrder.currentStock} {selectedItemForOrder.unit} (Safety Min: {selectedItemForOrder.minThreshold} {selectedItemForOrder.unit})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity to Order ({selectedItemForOrder.unit}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-mono focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Urgency
                  </label>
                  <select
                    value={orderUrgency}
                    onChange={(e) => setOrderUrgency(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Critical Emergency">Critical Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supplier Name
                </label>
                <input
                  type="text"
                  required
                  value={orderSupplier}
                  onChange={(e) => setOrderSupplier(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supplier Contact Phone
                </label>
                <input
                  type="text"
                  value={orderContact}
                  onChange={(e) => setOrderContact(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOrderModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingOrder ? 'Placing Order...' : 'Dispatch Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Adjustment & Usage Modal */}
      {adjustModalOpen && selectedItemForAdjust && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Log Pantry Usage / Stock In
                </h3>
                <p className="text-xs text-slate-500">{selectedItemForAdjust.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjust} className="p-5 space-y-4">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex justify-between items-center">
                <span className="text-xs text-slate-500">Current Balance:</span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {selectedItemForAdjust.currentStock} {selectedItemForAdjust.unit}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjustment (+ for Stock In, - for Used) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-mono focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Resulting Balance:{' '}
                  <strong className="text-slate-900 font-mono">
                    {Math.max(0, Number(selectedItemForAdjust.currentStock) + adjustDelta)}{' '}
                    {selectedItemForAdjust.unit}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                >
                  <option value="Direct Local Market Purchase">Direct Local Market Purchase / Stock In</option>
                  <option value="Daily Event Consumption">Daily Event Consumption</option>
                  <option value="Pantry Audit Count Correction">Pantry Audit Count Correction</option>
                  <option value="Spoilage or Wastage Write-off">Spoilage or Wastage Write-off</option>
                </select>
              </div>

              {adjustDelta > 0 && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-teal-50/50 rounded-xl border border-teal-200/80">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Event Allocation
                    </label>
                    <select
                      value={adjustEventRef}
                      onChange={(e) => setAdjustEventRef(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
                    >
                      <option value="">General Kitchen (No Event)</option>
                      {bookings.map((b) => (
                        <option key={b.bookingRef} value={b.bookingRef}>
                          {b.bookingRef} - {b.customerName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Purchase Cost (PKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={adjustCost}
                      onChange={(e) => setAdjustCost(Number(e.target.value) || 0)}
                      placeholder="Auto calculates if 0"
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-teal-700 focus:outline-none"
                    />
                  </div>
                  <p className="col-span-2 text-[11px] text-teal-800">
                    * Recorded in Accounts under {adjustEventRef ? `Event ${adjustEventRef}` : 'General Kitchen Expense'}.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Add New Pantry Ingredient
                </h3>
                <p className="text-xs text-slate-500">Register new raw material into kitchen ERP</p>
              </div>
              <button
                type="button"
                onClick={() => setNewItemModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ingredient Name *
                </label>
                <input
                  type="text"
                  required
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  placeholder="e.g. Sella Basmati Rice, Boneless Veal..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Unit</label>
                  <select
                    value={newItemForm.unit}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={newItemForm.currentStock}
                    onChange={(e) =>
                      setNewItemForm({ ...newItemForm, currentStock: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-mono focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={newItemForm.minThreshold}
                    onChange={(e) =>
                      setNewItemForm({ ...newItemForm, minThreshold: Number(e.target.value) || 10 })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-mono focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={newItemForm.unitPrice}
                    onChange={(e) =>
                      setNewItemForm({ ...newItemForm, unitPrice: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-mono focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-teal-50/50 rounded-xl border border-teal-200/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Allocation
                  </label>
                  <select
                    value={newItemForm.eventRef}
                    onChange={(e) => setNewItemForm({ ...newItemForm, eventRef: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    <option value="">General Kitchen Stock (No Event)</option>
                    {bookings.map((b) => (
                      <option key={b.bookingRef} value={b.bookingRef}>
                        {b.bookingRef} - {b.customerName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Purchase Cost (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={newItemForm.totalCost}
                    onChange={(e) =>
                      setNewItemForm({ ...newItemForm, totalCost: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-teal-700 focus:outline-none"
                  />
                </div>
                <p className="col-span-2 text-[11px] text-teal-800">
                  * Cost recorded in Accounts under {newItemForm.eventRef ? `Event ${newItemForm.eventRef}` : 'General Kitchen Expense'}.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Supplier</label>
                  <input
                    type="text"
                    value={newItemForm.preferredSupplier}
                    onChange={(e) =>
                      setNewItemForm({ ...newItemForm, preferredSupplier: e.target.value })
                    }
                    placeholder="e.g. Haji Poultry Farms"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Contact</label>
                  <input
                    type="text"
                    value={newItemForm.supplierContact}
                    onChange={(e) =>
                      setNewItemForm({ ...newItemForm, supplierContact: e.target.value })
                    }
                    placeholder="0300-0000000"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewItemModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
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
