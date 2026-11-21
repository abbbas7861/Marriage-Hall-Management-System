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

interface KitchenPantryInventoryProps {
  initialView?: 'inventory' | 'orders';
}

export const KitchenPantryInventory: React.FC<KitchenPantryInventoryProps> = ({
  initialView = 'inventory',
}) => {
  const [items, setItems] = useState<PantryStockItem[]>([]);
  const [orders, setOrders] = useState<PantryPurchaseOrder[]>([]);
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
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up" style={{ backgroundColor: '#059669', color: '#ffffff', border: '1px solid #34d399' }}>
          <Sparkles className="w-5 h-5" style={{ color: '#a7f3d0' }} />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner - FORCED DARK */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-amber-500/10 to-transparent rounded-full blur-3xl -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: '#ffffff' }}>
              {activeView === 'orders'
                ? 'Reorder Requisitions & Supplier Orders'
                : 'Kitchen Pantry & Raw Ingredient Stock'}
            </h1>
            <p className="text-xs sm:text-sm mt-1 max-w-2xl" style={{ color: '#cbd5e1' }}>
              {activeView === 'orders'
                ? 'Track pipeline grocery purchase orders, create emergency requisitions for low ingredients, and record stock replenishment.'
                : 'Live tracking of raw meat, basmati rice, cooking oil, ghee, dairy, and spices with automated safety threshold warnings.'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveView(activeView === 'inventory' ? 'orders' : 'inventory')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
              style={{ backgroundColor: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }}
            >
              <Truck className="w-4 h-4" style={{ color: '#38bdf8' }} />
              <span>
                {activeView === 'inventory'
                  ? `Switch to Requisitions (${orders.length})`
                  : 'Switch to Stock Grid'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setNewItemModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition cursor-pointer"
              style={{ background: 'linear-gradient(to right, #10b981, #0d9488)', color: '#ffffff', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)' }}
            >
              <Plus className="w-4 h-4" />
              <span>Add New Ingredient</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Ribbon - FORCED DARK */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6" style={{ borderTop: '1px solid #1e293b' }}>
          <div className="rounded-xl p-3.5" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: '#94a3b8' }}>
              <span>Tracked Ingredients</span>
              <Package className="w-3.5 h-3.5" style={{ color: '#38bdf8' }} />
            </div>
            <p className="text-xl font-bold" style={{ color: '#ffffff' }}>{items.length} Items</p>
            <span className="text-[11px]" style={{ color: '#64748b' }}>Active Pantry Catalog</span>
          </div>

          <div className="rounded-xl p-3.5" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: '#94a3b8' }}>
              <span>Low Stock Alerts</span>
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#fb7185' }} />
            </div>
            <p className="text-xl font-bold" style={{ color: '#fb7185' }}>{lowStockItems.length} Items</p>
            <span className="text-[11px]" style={{ color: '#fda4af' }}>Below Safety Threshold</span>
          </div>

          <div className="rounded-xl p-3.5" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: '#94a3b8' }}>
              <span>Orders in Pipeline</span>
              <Truck className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
            </div>
            <p className="text-xl font-bold" style={{ color: '#fbbf24' }}>{activeOrdersCount} Pending</p>
            <span className="text-[11px]" style={{ color: '#64748b' }}>Awaiting Supplier Delivery</span>
          </div>

          <div className="rounded-xl p-3.5" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: '#94a3b8' }}>
              <span>Total Stock Value</span>
              <DollarSign className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
            </div>
            <p className="text-xl font-bold" style={{ color: '#34d399' }}>
              Rs. {totalPantryValue.toLocaleString()}
            </p>
            <span className="text-[11px]" style={{ color: '#64748b' }}>Asset Cost Basis</span>
          </div>
        </div>
      </div>

      {/* Prominent Low-Stock Warning Ribbon (If Any) */}
      {lowStockItems.length > 0 && activeView === 'inventory' && (
        <div className="rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fb7185' }}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#ffffff' }}>
                <span>Immediate Kitchen Restock Required!</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase" style={{ backgroundColor: '#e11d48', color: '#ffffff' }}>
                  {lowStockItems.length} LOW ITEMS
                </span>
              </h3>
              <p className="text-xs mt-0.5" style={{ color: '#cbd5e1' }}>
                The following essentials are below safety threshold for upcoming banquets:{' '}
                <span className="font-semibold" style={{ color: '#fecdd3' }}>
                  {lowStockItems.map((it) => `${it.name} (${it.currentStock} ${it.unit})`).join(', ')}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenOrderModal(lowStockItems[0])}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition whitespace-nowrap self-start md:self-auto"
            style={{ backgroundColor: '#e11d48', color: '#ffffff', boxShadow: '0 4px 14px 0 rgba(225, 29, 72, 0.39)' }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Reorder {lowStockItems[0].name.split(' ')[0]}</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {activeView === 'inventory' ? (
        <div className="space-y-6">
          {/* Filter Bar - FORCED DARK */}
          <div className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
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
                      ? ''
                      : 'hover:bg-slate-700'
                  }`}
                  style={
                    categoryFilter === cat
                      ? { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', borderColor: 'rgba(16, 185, 129, 0.4)' }
                      : { backgroundColor: '#1e293b', color: '#94a3b8', borderColor: '#334155' }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ingredients, supplier..."
                className="w-full rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none"
                style={{ backgroundColor: '#1e293b', color: '#ffffff', border: '1px solid #334155' }}
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
                  className="rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between"
                  style={{ backgroundColor: '#0f172a', border: isLow ? '1px solid rgba(244, 63, 94, 0.6)' : '1px solid #1e293b' }}
                >
                  <div>
                    {/* Top Meta */}
                    <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #1e293b' }}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
                          {item.itemCode}
                        </span>
                        <span className="text-[11px] font-medium" style={{ color: '#94a3b8' }}>
                          {item.category}
                        </span>
                      </div>

                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold" style={{ backgroundColor: 'rgba(244, 63, 94, 0.2)', color: '#fda4af', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                          <AlertTriangle className="w-3 h-3" />
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          <CheckCircle2 className="w-3 h-3" />
                          IN STOCK
                        </span>
                      )}
                    </div>

                    {/* Title & Current Stock Level */}
                    <div className="mt-3">
                      <h3 className="text-base font-bold leading-tight" style={{ color: '#ffffff' }}>
                        {item.name}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                        Storage: {item.storageLocation}
                      </p>
                    </div>

                    {/* Stock Meter */}
                    <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                      <div className="flex items-end justify-between mb-1.5">
                        <div>
                          <span className="text-xs block" style={{ color: '#94a3b8' }}>Available Balance</span>
                          <span
                            className="text-2xl font-black"
                            style={{ color: isLow ? '#fb7185' : '#34d399' }}
                          >
                            {item.currentStock.toLocaleString()}{' '}
                            <span className="text-xs font-bold" style={{ color: '#cbd5e1' }}>{item.unit}</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] block" style={{ color: '#94a3b8' }}>Safety Min:</span>
                          <span className="text-xs font-bold font-mono" style={{ color: '#cbd5e1' }}>
                            {item.minThreshold} {item.unit}
                          </span>
                        </div>
                      </div>

                      {/* Visual Health Bar */}
                      <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'rgba(51, 65, 85, 0.5)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(100, Math.max(10, ratio))}%`,
                            backgroundColor: isLow ? '#f43f5e' : ratio < 150 ? '#fbbf24' : '#10b981'
                          }}
                        />
                      </div>
                    </div>

                    {/* Supplier Info */}
                    <div className="mt-3.5 space-y-1.5 text-xs" style={{ color: '#94a3b8' }}>
                      <div className="flex items-center justify-between">
                        <span style={{ color: '#64748b' }}>Unit Cost:</span>
                        <span className="font-semibold" style={{ color: '#ffffff' }}>
                          Rs. {item.unitPrice.toLocaleString()} / {item.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: '#64748b' }}>Vendor:</span>
                        <span className="font-medium truncate max-w-[180px]" style={{ color: '#cbd5e1' }}>
                          {item.preferredSupplier || 'Wholesale Mandi'}
                        </span>
                      </div>
                      {item.supplierContact && (
                        <div className="flex items-center justify-between">
                          <span style={{ color: '#64748b' }}>Phone:</span>
                          <span className="font-mono text-[11px] flex items-center gap-1" style={{ color: '#cbd5e1' }}>
                            <Phone className="w-3 h-3" style={{ color: '#38bdf8' }} />
                            {item.supplierContact}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 pt-3 grid grid-cols-2 gap-2" style={{ borderTop: '1px solid #1e293b' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenAdjustModal(item)}
                      className="py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155' }}
                    >
                      <Scale className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
                      <span>Log Usage</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenOrderModal(item)}
                      className="py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                      style={
                        isLow
                          ? { backgroundColor: '#e11d48', color: '#ffffff', boxShadow: '0 4px 14px 0 rgba(225, 29, 72, 0.2)' }
                          : { backgroundColor: '#059669', color: '#ffffff', boxShadow: '0 4px 14px 0 rgba(5, 150, 105, 0.2)' }
                      }
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
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
          <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid #1e293b' }}>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#ffffff' }}>
                <Truck className="w-5 h-5" style={{ color: '#38bdf8' }} />
                <span>Supplier Purchase Orders & Deliveries</span>
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                Track dispatched grocery requisitions and log incoming deliveries directly into pantry balance.
              </p>
            </div>
            <button
              onClick={() => setActiveView('inventory')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155' }}
            >
              Back to Inventory
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="uppercase text-[10px] tracking-wider" style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
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
              <tbody className="divide-y" style={{ borderColor: '#1e293b', color: '#cbd5e1' }}>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center" style={{ color: '#64748b' }}>
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((po) => (
                    <tr key={po.id} className="transition hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-mono font-bold" style={{ color: '#ffffff' }}>
                        {po.orderRef}
                      </td>
                      <td className="py-3.5 px-4 font-semibold" style={{ color: '#ffffff' }}>
                        {po.itemName}
                      </td>
                      <td className="py-3.5 px-4 font-bold font-mono" style={{ color: '#34d399' }}>
                        {po.quantity} {po.unit}
                      </td>
                      <td className="py-3.5 px-4 font-semibold" style={{ color: '#ffffff' }}>
                        Rs. {po.totalCost.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="block font-medium" style={{ color: '#e2e8f0' }}>{po.supplierName}</span>
                        {po.supplierContact && (
                          <span className="text-[11px] font-mono" style={{ color: '#64748b' }}>
                            {po.supplierContact}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold"
                          style={
                            po.urgency === 'Critical Emergency'
                              ? { backgroundColor: 'rgba(244, 63, 94, 0.2)', color: '#fda4af', border: '1px solid rgba(244, 63, 94, 0.3)' }
                              : po.urgency === 'Urgent'
                              ? { backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', border: '1px solid rgba(245, 158, 11, 0.3)' }
                              : { backgroundColor: '#1e293b', color: '#cbd5e1' }
                          }
                        >
                          {po.urgency}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                          style={
                            po.status === 'Received & Stocked'
                              ? { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }
                              : po.status === 'Cancelled'
                              ? { backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.3)' }
                              : { backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }
                          }
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
                            className="px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition flex items-center gap-1 ml-auto"
                            style={{ backgroundColor: '#059669', color: '#ffffff' }}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Receive & Stock</span>
                          </button>
                        )}
                        {po.status === 'Received & Stocked' && (
                          <span className="text-xs italic" style={{ color: '#64748b' }}>
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

      {/* Supplier Order Modal (Original Dark Theme) */}
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

      {/* Stock Adjust Modal (Original Dark Theme) */}
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

      {/* Add New Ingredient Modal (Original Dark Theme) */}
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