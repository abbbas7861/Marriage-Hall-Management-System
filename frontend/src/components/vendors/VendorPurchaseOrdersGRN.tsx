import React, { useState, useEffect, useMemo } from 'react';
import {
  PackageCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Truck,
  DollarSign,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Printer,
  X,
  ChevronRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { pantryApi, PantryPurchaseOrderItem, PantryStockItem } from '../../api/client';
import { workforceApi } from '../../api/client';
import { VendorPartner } from '../../types';

interface VendorPurchaseOrdersGRNProps {
  onNavigateToTab?: (tabId: string) => void;
}

export const VendorPurchaseOrdersGRN: React.FC<VendorPurchaseOrdersGRNProps> = ({
  onNavigateToTab,
}) => {
  const [orders, setOrders] = useState<PantryPurchaseOrderItem[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryStockItem[]>([]);
  const [vendors, setVendors] = useState<VendorPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
  const [activePOForGRN, setActivePOForGRN] = useState<PantryPurchaseOrderItem | null>(null);

  // New PO Form
  const [poSupplier, setPoSupplier] = useState('');
  const [poItemName, setPoItemName] = useState('');
  const [poQuantity, setPoQuantity] = useState(50);
  const [poUnit, setPoUnit] = useState('kg');
  const [poUnitCost, setPoUnitCost] = useState(850);
  const [poDeliveryDate, setPoDeliveryDate] = useState('');
  const [poNotes, setPoNotes] = useState('');

  // GRN Verification Form
  const [grnReceivedQty, setGrnReceivedQty] = useState(50);
  const [grnReceiverName, setGrnReceiverName] = useState('Chef Aslam / Receiver');
  const [grnNumber, setGrnNumber] = useState('');
  const [grnQualityNotes, setGrnQualityNotes] = useState('Quality checked, fresh delivery, batch verified.');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [posData, itemsData, vendorsData] = await Promise.all([
        pantryApi.listPOs(),
        pantryApi.listStock(),
        workforceApi.listVendors(),
      ]);
      setOrders(posData);
      setPantryItems(itemsData);
      setVendors(vendorsData);

      if (itemsData.length > 0) {
        setPoItemName(itemsData[0].itemName);
        setPoUnit(itemsData[0].unit);
        setPoUnitCost(itemsData[0].unitCost);
      }
      if (vendorsData.length > 0) {
        setPoSupplier(vendorsData[0].businessName);
      }
    } catch (err) {
      console.error('Failed to load purchase orders:', err);
      showToast('Error loading POs & GRN records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleItemSelect = (itemName: string) => {
    setPoItemName(itemName);
    const item = pantryItems.find((p) => p.itemName === itemName);
    if (item) {
      setPoUnit(item.unit);
      setPoUnitCost(item.unitCost);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await pantryApi.createPO({
        supplierName: poSupplier,
        itemName: poItemName,
        quantity: poQuantity,
        unit: poUnit,
        unitCost: poUnitCost,
        totalCost: poQuantity * poUnitCost,
        status: 'Ordered',
        deliveryDate: poDeliveryDate || undefined,
        notes: poNotes,
      });

      setOrders((prev) => [created, ...prev]);
      setIsPOModalOpen(false);
      showToast(`Purchase Order "${created.poNumber}" created and sent to ${created.supplierName}!`);
    } catch (err) {
      console.error('Failed to create PO:', err);
      showToast('Error creating purchase order.');
    }
  };

  const handleOpenGRNModal = (po: PantryPurchaseOrderItem) => {
    setActivePOForGRN(po);
    setGrnReceivedQty(po.quantity);
    setGrnNumber(`GRN-${Math.floor(10000 + Math.random() * 90000)}`);
    setGrnQualityNotes('Verified weight, quality standard passed, temperature compliant.');
    setIsGRNModalOpen(true);
  };

  const handleConfirmGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePOForGRN) return;

    try {
      const updated = await pantryApi.receivePO(activePOForGRN.id, {
        receivedQuantity: grnReceivedQty,
        receivedBy: grnReceiverName,
        grnNumber: grnNumber,
        notes: grnQualityNotes,
      });

      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setIsGRNModalOpen(false);
      showToast(`GRN ${grnNumber} Verified! ${grnReceivedQty} ${activePOForGRN.unit} credited to Pantry Stock!`);
      // Refresh stock
      pantryApi.listStock().then(setPantryItems).catch(() => {});
    } catch (err) {
      console.error('Failed to verify GRN:', err);
      showToast('Error verifying GRN delivery.');
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'All' && o.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPO = o.poNumber.toLowerCase().includes(q);
        const matchesSupplier = o.supplierName.toLowerCase().includes(q);
        const matchesItem = o.itemName.toLowerCase().includes(q);
        const matchesGRN = o.grnNumber?.toLowerCase().includes(q);
        return matchesPO || matchesSupplier || matchesItem || matchesGRN;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = orders.length;
    const received = orders.filter((o) => o.status === 'Received').length;
    const pending = orders.filter((o) => o.status === 'Ordered' || o.status === 'Pending').length;
    const totalValue = orders.reduce((acc, o) => acc + (o.totalCost || 0), 0);
    return { total, received, pending, totalValue };
  }, [orders]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 select-none animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900 border border-teal-500/40 text-white rounded-2xl shadow-2xl animate-in slide-in-from-top-3">
          <Sparkles className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-[#131b2e] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-700/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-teal-500/15 via-emerald-500/10 to-transparent rounded-full blur-3xl -z-10" />

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-500/20 border border-teal-400/40 text-teal-300 font-bold text-xs uppercase tracking-wider">
              <PackageCheck className="w-4 h-4 text-teal-400" />
              <span>Phase 6 • Task 6.3: Purchase Orders &amp; GRN</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pantry Inventory Auto-Credit</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans'] text-white">
            Purchase Orders &amp; Goods Received Notes (GRN)
          </h1>
          <p className="text-sm text-slate-300">
            Create supplier raw material requisitions, track scheduled commissary deliveries, verify quality intake, and automatically update kitchen pantry stock.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
          <button
            type="button"
            onClick={() => setIsPOModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-600 active:scale-95 text-slate-950 font-extrabold text-sm shadow-lg shadow-teal-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total POs Issued</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{stats.total} Orders</span>
            <span className="text-[11px] text-teal-600 font-semibold mt-0.5 block">Procurement History</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Awaiting Delivery</span>
            <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">{stats.pending} In Transit</span>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">Pending GRN Verification</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">GRN Verified</span>
            <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">{stats.received} Received</span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Credited to Pantry Stock</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Gross Procurement</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              Rs. {Math.round(stats.totalValue).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">Raw Materials Total</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PO#, supplier, ingredient, or GRN#..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Ordered">Ordered / In Transit</option>
              <option value="Received">Received &amp; Stocked</option>
              <option value="Pending">Pending Approval</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading purchase orders and GRN ledger...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
          <PackageCheck className="w-10 h-10 text-slate-300" />
          <span className="text-base font-bold text-slate-800">No purchase orders found</span>
          <span className="text-xs text-slate-400">Click "Create Purchase Order" to requisition raw ingredients.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((po) => (
            <div
              key={po.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2 lg:w-1/3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-extrabold text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                    {po.poNumber}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold ${
                      po.status === 'Received'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {po.status === 'Received' ? 'GRN Verified' : 'In Transit'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{po.itemName}</h3>
                <div className="text-xs text-slate-500 space-y-0.5">
                  <p>Supplier: <strong className="text-slate-800">{po.supplierName}</strong></p>
                  {po.deliveryDate && <p>Expected: <strong className="text-slate-700">{po.deliveryDate}</strong></p>}
                  {po.grnNumber && (
                    <p className="text-emerald-700 font-mono font-bold">
                      GRN Slip: {po.grnNumber} (Verified by: {po.receivedBy || 'Staff'})
                    </p>
                  )}
                </div>
              </div>

              {/* Quantities & Rate */}
              <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 p-4 rounded-2xl border border-slate-100 lg:w-1/3">
                <div className="p-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Ordered Qty</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {po.quantity} {po.unit}
                  </span>
                </div>
                <div className="p-2 border-x border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Unit Cost</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    Rs. {po.unitCost}
                  </span>
                </div>
                <div className="p-2">
                  <span className="text-[11px] font-semibold text-teal-700 uppercase block">Total Value</span>
                  <span className="text-lg font-black text-teal-800 font-mono">
                    Rs. {Math.round(po.totalCost).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Column */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 lg:w-1/4">
                <span className="text-xs text-slate-400 block text-right">
                  Status: <strong>{po.status}</strong>
                </span>

                <div className="flex items-center gap-2 w-full lg:w-auto">
                  {po.status !== 'Received' ? (
                    <button
                      type="button"
                      onClick={() => handleOpenGRNModal(po)}
                      className="w-full lg:w-auto px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 active:scale-95 text-slate-950 font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify GRN Intake</span>
                    </button>
                  ) : (
                    <span className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Pantry Stock Credited</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create PO Modal */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                    Create Raw Material Purchase Order
                  </h3>
                  <span className="text-xs text-slate-500">Requisition grocery, meats, dairy, or spice inventory</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPOModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Supplier / Vendor <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={poSupplier}
                    onChange={(e) => setPoSupplier(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.businessName}>
                        {v.businessName} ({v.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={poDeliveryDate}
                    onChange={(e) => setPoDeliveryDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Raw Material Item Name <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={poItemName}
                    onChange={(e) => handleItemSelect(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition"
                  >
                    {pantryItems.map((item) => (
                      <option key={item.id} value={item.itemName}>
                        {item.itemName} (Pantry: {item.currentStock} {item.unit})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Requisition Qty</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={poQuantity}
                    onChange={(e) => setPoQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Unit (kg/tin/bag)</label>
                  <input
                    type="text"
                    required
                    value={poUnit}
                    onChange={(e) => setPoUnit(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Est. Rate / Unit</label>
                  <input
                    type="number"
                    min="1"
                    value={poUnitCost}
                    onChange={(e) => setPoUnitCost(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-teal-50 rounded-2xl border border-teal-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-teal-800">Total Purchase Order Estimate:</span>
                <span className="text-base font-black text-teal-950 font-mono">
                  Rs. {(poQuantity * poUnitCost).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Instructions / Spec Notes</label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="e.g. Mutton must be fresh, cut size 1.5 inches, deliver before 10:00 AM..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPOModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-extrabold shadow-md transition cursor-pointer"
                >
                  Dispatch Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRN Verification Modal */}
      {isGRNModalOpen && activePOForGRN && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-emerald-50 text-emerald-950">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-['Plus_Jakarta_Sans']">
                    Goods Received Note (GRN) Verification
                  </h3>
                  <span className="text-xs text-emerald-700">Audit quality and credit physical inventory</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGRNModalOpen(false)}
                className="p-2 rounded-xl text-emerald-800 hover:bg-emerald-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmGRN} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block">Purchase Order:</span>
                  <strong className="text-slate-900 font-mono text-sm">{activePOForGRN.poNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Supplier:</span>
                  <strong className="text-slate-900">{activePOForGRN.supplierName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Item:</span>
                  <strong className="text-slate-900">{activePOForGRN.itemName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Ordered Qty:</span>
                  <strong className="text-slate-900 font-mono">
                    {activePOForGRN.quantity} {activePOForGRN.unit}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    GRN Number Reference
                  </label>
                  <input
                    type="text"
                    required
                    value={grnNumber}
                    onChange={(e) => setGrnNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Actual Received Quantity ({activePOForGRN.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={grnReceivedQty}
                    onChange={(e) => setGrnReceivedQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Receiving Officer / Chef</label>
                <input
                  type="text"
                  required
                  value={grnReceiverName}
                  onChange={(e) => setGrnReceiverName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Quality Inspection Notes</label>
                <textarea
                  rows={2}
                  value={grnQualityNotes}
                  onChange={(e) => setGrnQualityNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition resize-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
                <span className="font-bold block mb-0.5">Automated Inventory Sync:</span>
                Confirming this GRN will automatically credit +{grnReceivedQty} {activePOForGRN.unit} directly into the kitchen commissary inventory ledger.
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGRNModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition cursor-pointer"
                >
                  Confirm GRN &amp; Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

