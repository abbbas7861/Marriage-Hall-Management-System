import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Users,
  Scale,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Printer,
  RotateCcw,
  Building2,
  CalendarDays,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  X,
  FileText,
  Truck,
  Check,
} from 'lucide-react';
import { Booking } from '../../types';
import {
  bookingsApi,
  pantryApi,
  PantryStockItem,
  PantryPurchaseOrder,
} from '../../api/client';
import { formatTo12Hour } from '../../utils/timeFormat';

interface FormulaLineItem {
  id: string;
  name: string;
  category: string;
  pantryItemId?: string;
  ratioPerHeadGrams: number; 
  unit: string;
  displayUnit: string;
  unitPrice: number;
  currentStock: number;
  supplierName: string;
  included: boolean;
}

const DEFAULT_FORMULA_PRESETS: Omit<FormulaLineItem, 'id' | 'currentStock'>[] = [
  {
    name: 'Fresh Broiler Chicken (Curry Cut, Skinless)',
    category: 'Meat & Poultry',
    ratioPerHeadGrams: 250, 
    unit: 'kg',
    displayUnit: 'g/head',
    unitPrice: 580,
    supplierName: 'Haji Poultry & Meat Suppliers',
    included: true,
  },
  {
    name: 'Premium Desi Mutton (Mix Boti/Chops)',
    category: 'Meat & Poultry',
    ratioPerHeadGrams: 220, 
    unit: 'kg',
    displayUnit: 'g/head',
    unitPrice: 2200,
    supplierName: 'Punjab Halal Livestock',
    included: true,
  },
  {
    name: 'Super Kernel Basmati Rice (Aged 2 Years)',
    category: 'Grains & Rice',
    ratioPerHeadGrams: 160, 
    unit: 'kg',
    displayUnit: 'g/head',
    unitPrice: 390,
    supplierName: 'Al-Rehman Rice & Grain Traders',
    included: true,
  },
  {
    name: 'Pure Desi Ghee (Tin 16 kg)',
    category: 'Oils & Ghee',
    ratioPerHeadGrams: 25, 
    unit: 'kg',
    displayUnit: 'g/head',
    unitPrice: 1530,
    supplierName: 'Khabeesa Dairies & Ghee',
    included: true,
  },
  {
    name: 'Canola Premium Cooking Oil',
    category: 'Oils & Ghee',
    ratioPerHeadGrams: 30, 
    unit: 'Liters',
    displayUnit: 'ml/head',
    unitPrice: 490,
    supplierName: 'Habib Oil Mills Distributor',
    included: true,
  },
  {
    name: 'Fine White Wheat Flour (Special Maida Grade 1)',
    category: 'Bakery & Dry Goods',
    ratioPerHeadGrams: 120, 
    unit: 'kg',
    displayUnit: 'g/head',
    unitPrice: 136,
    supplierName: 'Lahore Flour Mills Association',
    included: true,
  },
  {
    name: 'Fresh Full Cream Dairy Buffalo Milk',
    category: 'Dairy',
    ratioPerHeadGrams: 80, 
    unit: 'Liters',
    displayUnit: 'ml/head',
    unitPrice: 210,
    supplierName: 'Sahiwal Milk Farm Co.',
    included: true,
  },
  {
    name: 'Whole Spices Mix (Shahi Garam Masala & Cardamom)',
    category: 'Spices & Seasonings',
    ratioPerHeadGrams: 12, 
    unit: 'kg',
    displayUnit: 'g/head',
    unitPrice: 3200,
    supplierName: 'Akbari Mandi Spices Traders',
    included: true,
  },
];

export const KitchenFormulaCalculator: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingRef, setSelectedBookingRef] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(500);
  const [wastageBufferPct, setWastageBufferPct] = useState<number>(8); 
  const [formulaLines, setFormulaLines] = useState<FormulaLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dispatch orders modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [orderMode, setOrderMode] = useState<'deficitOnly' | 'grossTotal'>('deficitOnly');
  const [dispatchedOrders, setDispatchedOrders] = useState<PantryPurchaseOrder[]>([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load bookings and pantry stock
  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedBookings, fetchedPantry] = await Promise.all([
        bookingsApi.list(),
        pantryApi.listItems(),
      ]);
      setBookings(fetchedBookings);

      if (fetchedBookings.length > 0) {
        setSelectedBookingRef(fetchedBookings[0].bookingRef);
        setGuestCount(fetchedBookings[0].guestCount || 500);
      }

      // Map presets to live pantry items
      const mappedLines: FormulaLineItem[] = DEFAULT_FORMULA_PRESETS.map((preset, idx) => {
        const found = fetchedPantry.find(
          (p) =>
            p.name.toLowerCase().includes(preset.name.toLowerCase().split(' ')[0]) ||
            preset.name.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
        );

        return {
          ...preset,
          id: `line-${idx}`,
          pantryItemId: found ? found.id : undefined,
          currentStock: found ? found.currentStock : 0,
          unitPrice: found && found.unitPrice > 0 ? found.unitPrice : preset.unitPrice,
          supplierName: found && found.preferredSupplier ? found.preferredSupplier : preset.supplierName,
        };
      });

      setFormulaLines(mappedLines);
    } catch (err) {
      console.error('Failed to load calculator data:', err);
      showToast('Error loading live data.');
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

  // When selected booking changes, auto-update guest count
  const handleSelectBooking = (ref: string) => {
    setSelectedBookingRef(ref);
    const found = bookings.find((b) => b.bookingRef === ref);
    if (found && found.guestCount) {
      setGuestCount(found.guestCount);
      showToast(`Loaded ${found.guestCount} guests for ${found.customerName} (${found.hallName})`);
    }
  };

  const selectedBooking = useMemo(() => {
    return bookings.find((b) => b.bookingRef === selectedBookingRef) || null;
  }, [bookings, selectedBookingRef]);

  // Handle ratio edit
  const handleUpdateRatio = (id: string, newRatioGrams: number) => {
    setFormulaLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ratioPerHeadGrams: Math.max(0, newRatioGrams) } : line))
    );
  };

  // Toggle ingredient include
  const handleToggleInclude = (id: string) => {
    setFormulaLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, included: !line.included } : line))
    );
  };

  // Calculations for each line item
  const calculatedItems = useMemo(() => {
    const bufferMultiplier = 1 + (Number(wastageBufferPct) || 0) / 100;

    return formulaLines.map((line) => {
      const netQty = (guestCount * line.ratioPerHeadGrams) / 1000;
      const grossQty = Math.round(netQty * bufferMultiplier * 10) / 10;
      const deficitQty = Math.max(0, Math.round((grossQty - line.currentStock) * 10) / 10);
      const totalEstimatedCost = Math.round(grossQty * line.unitPrice);
      const deficitCost = Math.round(deficitQty * line.unitPrice);

      return {
        ...line,
        netQty,
        grossQty,
        deficitQty,
        totalEstimatedCost,
        deficitCost,
        isShortage: deficitQty > 0,
      };
    });
  }, [formulaLines, guestCount, wastageBufferPct]);

  // Aggregate Totals
  const totals = useMemo(() => {
    const active = calculatedItems.filter((i) => i.included);
    const totalGrossWeightKg = active.reduce((acc, i) => acc + i.grossQty, 0);
    const totalGrossCost = active.reduce((acc, i) => acc + i.totalEstimatedCost, 0);
    const totalDeficitCost = active.reduce((acc, i) => acc + i.deficitCost, 0);
    const shortageCount = active.filter((i) => i.isShortage).length;
    const foodCostPerGuest = guestCount > 0 ? Math.round(totalGrossCost / guestCount) : 0;

    return {
      totalGrossWeightKg: Math.round(totalGrossWeightKg * 10) / 10,
      totalGrossCost,
      totalDeficitCost,
      shortageCount,
      foodCostPerGuest,
    };
  }, [calculatedItems, guestCount]);

  // Bulk Dispatch Requisitions
  const handleDispatchRequisitions = async () => {
    try {
      setSubmitting(true);
      const activeLines = calculatedItems.filter((i) => i.included);
      const itemsToOrder = activeLines
        .filter((i) => (orderMode === 'deficitOnly' ? i.deficitQty > 0 : i.grossQty > 0))
        .map((i) => ({
          itemId: i.pantryItemId || 1,
          quantity: orderMode === 'deficitOnly' ? i.deficitQty : i.grossQty,
          supplierName: i.supplierName,
          unitPrice: i.unitPrice,
          notes: `Event Formula Requisition for ${selectedBookingRef || 'Banquet Production'} (${guestCount} Guests, +${wastageBufferPct}% buffer)`,
        }));

      if (itemsToOrder.length === 0) {
        showToast('All items are already fully stocked in pantry! No orders needed.');
        setIsConfirmModalOpen(false);
        return;
      }

      const ordersCreated = await pantryApi.bulkRequisition({
        items: itemsToOrder,
        eventRef: selectedBookingRef || 'Banquet Production',
        orderedBy: 'Executive Chef',
        urgency: 'Urgent',
      });

      setDispatchedOrders(ordersCreated);
      setIsConfirmModalOpen(false);
      setIsReceiptModalOpen(true);
      showToast(`Dispatched ${ordersCreated.length} grocery supplier purchase orders!`);
    } catch (err) {
      console.error('Failed to dispatch grocery orders:', err);
      showToast('Error dispatching grocery requisitions.');
    } finally {
      setSubmitting(false);
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
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-teal-500/10 via-amber-500/10 to-transparent rounded-full blur-3xl -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            {/* REPLACED H1 WITH DIV + INLINE STYLES TO PREVENT HIDING */}
            <div style={{ color: '#ffffff', fontSize: '28px', fontWeight: '900', marginBottom: '4px', lineHeight: '1.2' }}>
              Raw Ingredient Formula & Grocery Requisition Engine
            </div>
            <p className="text-xs sm:text-sm mt-1 max-w-2xl" style={{ color: '#cbd5e1' }}>
              Automatic banquet calculator computing exact raw weights (Rice, Meat, Cooking Oil, Dairy, Spices) based on Guest Count and per-head ratios with 1-click supplier purchase order generation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition"
              style={{ backgroundColor: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }}
            >
              <Printer className="w-4 h-4" style={{ color: '#38bdf8' }} />
              <span>Print Kitchen Prep Sheet</span>
            </button>

            <button
              onClick={() => setIsConfirmModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition cursor-pointer"
              style={{ background: 'linear-gradient(to right, #10b981, #0d9488)', color: '#ffffff', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)' }}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Generate Grocery Requisition</span>
            </button>
          </div>
        </div>

        {/* Dynamic Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6" style={{ borderTop: '1px solid #1e293b' }}>
          {/* 1. Linked Event Selector */}
          <div className="p-3.5 rounded-xl" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <label className="block text-xs font-semibold mb-1.5 flex items-center justify-between" style={{ color: '#cbd5e1' }}>
              <span>Select Active Banquet Event:</span>
              <Building2 className="w-3.5 h-3.5" style={{ color: '#38bdf8' }} />
            </label>
            <select
              value={selectedBookingRef}
              onChange={(e) => handleSelectBooking(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-xs font-medium focus:outline-none"
              style={{ backgroundColor: '#0f172a', color: '#ffffff', border: '1px solid #334155' }}
            >
              <option value="">Custom Manual Estimate (No Booking)</option>
              {bookings.map((b) => (
                <option key={b.id || b.bookingRef} value={b.bookingRef}>
                  {b.bookingRef} — {b.customerName} ({b.guestCount || 500} Guests • {b.hallName})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Guest Count Stepper */}
          <div className="p-3.5 rounded-xl" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <label className="block text-xs font-semibold mb-1.5 flex items-center justify-between" style={{ color: '#cbd5e1' }}>
              <span>Guest Headcount:</span>
              <Users className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="50"
                step="25"
                value={guestCount}
                onChange={(e) => setGuestCount(Math.max(10, Number(e.target.value) || 0))}
                className="w-full rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none"
                style={{ backgroundColor: '#0f172a', color: '#ffffff', border: '1px solid #334155' }}
              />
              <div className="flex gap-1 shrink-0">
                {[300, 500, 750, 1000].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setGuestCount(count)}
                    className="px-2 py-1.5 rounded-lg text-xs font-semibold border transition"
                    style={
                      guestCount === count
                        ? { backgroundColor: '#10b981', color: '#ffffff', borderColor: '#34d399' }
                        : { backgroundColor: '#0f172a', color: '#cbd5e1', borderColor: '#334155' }
                    }
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Wastage Buffer Contingency */}
          <div className="p-3.5 rounded-xl" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <label className="block text-xs font-semibold mb-1.5 flex items-center justify-between" style={{ color: '#cbd5e1' }}>
              <span>Contingency / Wastage Buffer:</span>
              <span className="font-bold font-mono" style={{ color: '#fbbf24' }}>+{wastageBufferPct}%</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={wastageBufferPct}
                onChange={(e) => setWastageBufferPct(Number(e.target.value) || 0)}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-bold w-10 text-right font-mono" style={{ color: '#cbd5e1' }}>
                {wastageBufferPct}%
              </span>
            </div>
            <span className="text-[10px] mt-1 block" style={{ color: '#64748b' }}>
              Covers kitchen trimming, evaporation & refill buffers
            </span>
          </div>
        </div>

        {/* Live Calculation KPI Ribbon - FORCED DARK */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6" style={{ borderTop: '1px solid #1e293b' }}>
          <div className="p-3 rounded-xl" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <span className="text-[11px] block" style={{ color: '#94a3b8' }}>Total Raw Food Required</span>
            <p className="text-xl font-black" style={{ color: '#ffffff' }}>
              {totals.totalGrossWeightKg.toLocaleString()} <span className="text-xs font-semibold" style={{ color: '#cbd5e1' }}>kg/liters</span>
            </p>
            <span className="text-[10px]" style={{ color: '#64748b' }}>Gross for {guestCount} Guests</span>
          </div>

          <div className="p-3 rounded-xl" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <span className="text-[11px] block" style={{ color: '#94a3b8' }}>Estimated Grocery Budget</span>
            <p className="text-xl font-black" style={{ color: '#34d399' }}>
              Rs. {totals.totalGrossCost.toLocaleString()}
            </p>
            <span className="text-[10px]" style={{ color: '#059669' }}>Total Ingredient Value</span>
          </div>

          <div className="p-3 rounded-xl" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <span className="text-[11px] block" style={{ color: '#94a3b8' }}>Raw Cost / Guest Head</span>
            <p className="text-xl font-black" style={{ color: '#ffffff' }}>
              Rs. {totals.foodCostPerGuest.toLocaleString()}
            </p>
            <span className="text-[10px]" style={{ color: '#64748b' }}>Excludes overheads & hall</span>
          </div>

          <div className="p-3 rounded-xl" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <span className="text-[11px] block" style={{ color: '#94a3b8' }}>Pantry Shortage Deficit</span>
            <p className="text-xl font-black" style={{ color: totals.shortageCount > 0 ? '#fb7185' : '#34d399' }}>
              Rs. {totals.totalDeficitCost.toLocaleString()}
            </p>
            <span className="text-[10px]" style={{ color: '#cbd5e1' }}>
              {totals.shortageCount > 0 ? `${totals.shortageCount} Items Below Required` : 'Fully in stock!'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Ingredient Formula Table - FORCED DARK */}
      <div className="rounded-2xl p-6 shadow-xl overflow-hidden" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4" style={{ borderBottom: '1px solid #1e293b' }}>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: '#ffffff' }}>
              <Scale className="w-4 h-4" style={{ color: '#34d399' }} />
              <span>Dynamic Catering Ingredient Formula ({guestCount} Guests)</span>
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
              Formula: <code className="font-mono" style={{ color: '#6ee7b7' }}>Total Guests × Ratio per Head + {wastageBufferPct}% Buffer = Requisition</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFormulaLines((prev) => prev.map((l) => ({ ...l, included: true })))}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155' }}
            >
              Select All
            </button>
            <button
              onClick={() => setFormulaLines((prev) => prev.map((l) => ({ ...l, included: false })))}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155' }}
            >
              Deselect All
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="uppercase text-[10px] tracking-wider" style={{ backgroundColor: '#1e293b', color: '#cbd5e1', borderBottom: '1px solid #334155' }}>
              <tr>
                <th className="py-3 px-3 w-10 text-center">Inc</th>
                <th className="py-3 px-4">Raw Ingredient</th>
                <th className="py-3 px-3 text-center">Per-Head Ratio</th>
                <th className="py-3 px-3 text-right">Net Req.</th>
                <th className="py-3 px-3 text-right">Gross (+{wastageBufferPct}%)</th>
                <th className="py-3 px-3 text-right">Pantry Stock</th>
                <th className="py-3 px-4 text-center">Stock Balance Status</th>
                <th className="py-3 px-4 text-right">Est. Cost (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#1e293b', color: '#cbd5e1' }}>
              {calculatedItems.map((item) => (
                <tr
                  key={item.id}
                  className="transition hover:bg-slate-800/30"
                  style={{ opacity: !item.included ? 0.4 : 1, backgroundColor: !item.included ? 'rgba(15, 23, 42, 0.3)' : 'transparent' }}
                >
                  {/* Checkbox */}
                  <td className="py-3.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={item.included}
                      onChange={() => handleToggleInclude(item.id)}
                      className="rounded cursor-pointer"
                      style={{ accentColor: '#10b981' }}
                    />
                  </td>

                  {/* Ingredient Name & Category */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold block text-sm" style={{ color: '#ffffff' }}>{item.name}</span>
                    <span className="text-[11px]" style={{ color: '#94a3b8' }}>
                      {item.category} • Supplier: <strong style={{ color: '#cbd5e1' }}>{item.supplierName}</strong>
                    </span>
                  </td>

                  {/* Editable Ratio */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1" style={{ backgroundColor: '#334155', border: '1px solid #475569' }}>
                      <input
                        type="number"
                        min="1"
                        step="5"
                        value={item.ratioPerHeadGrams}
                        onChange={(e) => handleUpdateRatio(item.id, Number(e.target.value) || 0)}
                        className="w-14 bg-transparent font-bold text-xs text-right focus:outline-none"
                        style={{ color: '#ffffff' }}
                      />
                      <span className="text-[10px] font-semibold" style={{ color: '#cbd5e1' }}>{item.displayUnit}</span>
                    </div>
                  </td>

                  {/* Net Requirement */}
                  <td className="py-3.5 px-3 text-right font-mono font-semibold" style={{ color: '#cbd5e1' }}>
                    {item.netQty.toLocaleString()} {item.unit}
                  </td>

                  {/* Gross with Buffer */}
                  <td className="py-3.5 px-3 text-right font-mono font-extrabold text-sm" style={{ color: '#ffffff' }}>
                    {item.grossQty.toLocaleString()} {item.unit}
                  </td>

                  {/* Current Pantry Balance */}
                  <td className="py-3.5 px-3 text-right font-mono" style={{ color: '#94a3b8' }}>
                    {item.currentStock.toLocaleString()} {item.unit}
                  </td>

                  {/* Shortage / Stock Status */}
                  <td className="py-3.5 px-4 text-center">
                    {item.isShortage ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold" style={{ backgroundColor: '#e11d48', color: '#ffffff', border: '1px solid #fb7185' }}>
                        <AlertTriangle className="w-3 h-3" />
                        Shortage: {item.deficitQty} {item.unit}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <CheckCircle2 className="w-3 h-3" />
                        Pantry Covered
                      </span>
                    )}
                  </td>

                  {/* Total Cost */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-sm" style={{ color: '#ffffff' }}>
                    Rs. {item.totalEstimatedCost.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="font-bold text-xs" style={{ backgroundColor: '#1e293b', borderTop: '2px solid #334155' }}>
              <tr>
                <td colSpan={4} className="py-3 px-4 uppercase tracking-wider" style={{ color: '#ffffff' }}>
                  TOTAL GROSS REQUISITION BUDGET:
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm" style={{ color: '#ffffff' }}>
                  {totals.totalGrossWeightKg.toLocaleString()} kg
                </td>
                <td colSpan={2} className="py-3 px-4 text-right font-mono" style={{ color: '#fb7185' }}>
                  Shortage Cost: Rs. {totals.totalDeficitCost.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono text-base" style={{ color: '#34d399' }}>
                  Rs. {totals.totalGrossCost.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Confirmation & Order Generation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Generate Official Grocery Requisitions</h3>
                <p className="text-xs text-slate-400">
                  Convert formula calculation into purchase orders sent to verified suppliers.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Event:</span>
                  <span className="font-bold text-white">{selectedBookingRef || 'General Banquet Production'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Guest Count:</span>
                  <span className="font-bold text-white">{guestCount} Guests (+{wastageBufferPct}% buffer)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Selected Ingredients:</span>
                  <span className="font-bold text-emerald-400">
                    {calculatedItems.filter((i) => i.included).length} Items
                  </span>
                </div>
              </div>

              {/* Order Mode Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Requisition Mode:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOrderMode('deficitOnly')}
                    className={`p-3 rounded-xl border text-left transition ${
                      orderMode === 'deficitOnly'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-bold text-xs block text-white mb-0.5">Shortage Deficit Only</span>
                    <span className="text-[11px] leading-tight block text-slate-400">
                      Order only items lacking in pantry ({totals.shortageCount} items • Rs. {totals.totalDeficitCost.toLocaleString()})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderMode('grossTotal')}
                    className={`p-3 rounded-xl border text-left transition ${
                      orderMode === 'grossTotal'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-bold text-xs block text-white mb-0.5">Full Gross Requisition</span>
                    <span className="text-[11px] leading-tight block text-slate-400">
                      Order full banquet requirement ({totals.totalGrossWeightKg} kg • Rs. {totals.totalGrossCost.toLocaleString()})
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleDispatchRequisitions}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{submitting ? 'Generating Orders...' : 'Confirm & Dispatch to Suppliers'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispatched Orders Receipt Modal */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setIsReceiptModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Purchase Orders Dispatched Successfully!</h3>
                <p className="text-xs text-slate-400">
                  {dispatchedOrders.length} supplier orders registered in Accounts Payable & Inventory.
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 text-xs">
              {dispatchedOrders.map((po) => (
                <div
                  key={po.id}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-emerald-400 block">{po.orderRef}</span>
                    <span className="font-bold text-white text-sm">{po.itemName}</span>
                    <span className="text-[11px] text-slate-400 block">Vendor: {po.supplierName}</span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-white font-mono text-sm block">
                      {po.quantity} {po.unit}
                    </span>
                    <span className="text-slate-400 font-mono">
                      Rs. {po.totalCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition"
              >
                Close & Return to Calculator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};