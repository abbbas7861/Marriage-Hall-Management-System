import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Building,
  DollarSign,
  Star,
  FileText,
  CreditCard,
  Edit2,
  Trash2,
  Sparkles,
  Shield,
  Layers,
  X,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { VendorPartner } from '../../types';
import { workforceApi } from '../../api/client';

interface VendorMasterDirectoryProps {
  onNavigateToTab?: (tabId: string) => void;
}

const VENDOR_CATEGORIES = [
  'All',
  'Poultry/Meat',
  'Dairy & Bakery',
  'Floral Decor',
  'Stage & Lighting',
  'Outsourced Labor',
  'Valet & Security',
  'Beverages & Ice',
];

const PAYMENT_TERMS_OPTIONS = [
  'Immediate',
  'Net 7 Days',
  'Net 15 Days',
  'Net 30 Days',
  '50% Advance / 50% Post-Event',
];

export const VendorMasterDirectory: React.FC<VendorMasterDirectoryProps> = ({
  onNavigateToTab,
}) => {
  const [vendors, setVendors] = useState<VendorPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorPartner | null>(null);
  const [formData, setFormData] = useState({
    businessName: '',
    category: 'Floral Decor',
    contactPerson: '',
    phoneNumber: '',
    ntnNumber: '',
    paymentTerms: 'Net 15 Days',
    address: '',
    bankDetails: '',
    status: 'Active',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await workforceApi.listVendors();
      setVendors(data);
    } catch (err) {
      console.error('Failed to load vendors:', err);
      showToast('Error loading vendor directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (categoryFilter !== 'All' && v.category !== categoryFilter) return false;
      if (statusFilter !== 'All' && v.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = v.businessName.toLowerCase().includes(q);
        const matchesPerson = v.contactPerson?.toLowerCase().includes(q);
        const matchesNtn = v.ntnNumber?.toLowerCase().includes(q);
        const matchesCat = v.category.toLowerCase().includes(q);
        return matchesName || matchesPerson || matchesNtn || matchesCat;
      }
      return true;
    });
  }, [vendors, categoryFilter, statusFilter, searchQuery]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const total = vendors.length;
    const active = vendors.filter((v) => v.status === 'Active' || v.status === 'Preferred').length;
    const totalBilled = vendors.reduce((acc, v) => acc + (v.totalBilled || 0), 0);
    const balanceDue = vendors.reduce((acc, v) => acc + (v.balanceDue || 0), 0);
    return { total, active, totalBilled, balanceDue };
  }, [vendors]);

  const handleOpenCreateModal = () => {
    setEditingVendor(null);
    setFormData({
      businessName: '',
      category: 'Floral Decor',
      contactPerson: '',
      phoneNumber: '',
      ntnNumber: '',
      paymentTerms: 'Net 15 Days',
      address: '',
      bankDetails: '',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vendor: VendorPartner) => {
    setEditingVendor(vendor);
    setFormData({
      businessName: vendor.businessName,
      category: vendor.category,
      contactPerson: vendor.contactPerson,
      phoneNumber: vendor.phoneNumber,
      ntnNumber: vendor.ntnNumber || '',
      paymentTerms: vendor.paymentTerms || 'Net 15 Days',
      address: vendor.address || '',
      bankDetails: vendor.bankDetails || '',
      status: vendor.status || 'Active',
    });
    setIsModalOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName.trim()) return;

    try {
      if (editingVendor) {
        const updated = await workforceApi.updateVendor(editingVendor.id, formData);
        setVendors((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
        showToast(`Vendor "${updated.businessName}" updated successfully!`);
      } else {
        const created = await workforceApi.createVendor(formData);
        setVendors((prev) => [created, ...prev]);
        showToast(`New vendor "${created.businessName}" registered!`);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save vendor:', err);
      showToast('Error saving vendor record.');
    }
  };

  const handleDeleteVendor = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove vendor "${name}"?`)) return;
    try {
      await workforceApi.deleteVendor(id);
      setVendors((prev) => prev.filter((v) => v.id !== id));
      showToast(`Vendor "${name}" removed.`);
    } catch (err) {
      console.error('Failed to delete vendor:', err);
      showToast('Error deleting vendor.');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 select-none animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900 border border-teal-500/40 text-white rounded-2xl shadow-2xl animate-in slide-in-from-top-3">
          <Sparkles className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#131b2e] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-700/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-teal-500/15 via-emerald-500/10 to-transparent rounded-full blur-3xl -z-10" />

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-500/20 border border-teal-400/40 text-teal-300 font-bold text-xs uppercase tracking-wider">
              <Store className="w-4 h-4 text-teal-400" />
              <span>Phase 6 • Task 6.1: Vendors &amp; Suppliers Suite</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified Directory</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans'] text-white">
            Vendor &amp; Supplier Master Directory
          </h1>
          <p className="text-sm text-slate-300">
            Comprehensive catalog of verified event vendors, poultry/meat butchers, floral decorators, stage technicians, and labor contractors.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-600 active:scale-95 text-slate-950 font-extrabold text-sm shadow-lg shadow-teal-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Onboard New Vendor</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Directory</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{stats.total} Partners</span>
            <span className="text-[11px] text-teal-600 font-semibold mt-0.5 block">{stats.active} Active Contracts</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Store className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Trade Volume</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              Rs. {Math.round(stats.totalBilled).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">Lifetime Billed Invoices</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total A/P Balance Due</span>
            <span className="text-2xl font-black text-rose-600 font-mono mt-1 block">
              Rs. {Math.round(stats.balanceDue).toLocaleString()}
            </span>
            <span className="text-[11px] text-rose-500 font-semibold mt-0.5 block">Pending Disbursements</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Settlement Health</span>
            <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
              {stats.totalBilled > 0
                ? `${Math.round(((stats.totalBilled - stats.balanceDue) / stats.totalBilled) * 100)}%`
                : '100%'}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Disbursement Ratio</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by vendor, person, NTN or category..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
        </div>

        {/* Category & Status Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Preferred">Preferred Partner</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading verified vendor profiles...</p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
          <Store className="w-10 h-10 text-slate-300" />
          <span className="text-base font-bold text-slate-800">No matching vendors found</span>
          <span className="text-xs text-slate-400">Try adjusting your category filter or search keywords.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Top Badge & Rating */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-teal-50 text-teal-700 border border-teal-200">
                    {vendor.category}
                  </span>
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 text-xs font-bold text-amber-700">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{vendor.rating || 4.8}</span>
                  </div>
                </div>

                {/* Business Name & ID */}
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition">
                  {vendor.businessName}
                </h3>
                <span className="text-xs font-mono text-slate-400 block mt-0.5">
                  ID: {vendor.vendorId} {vendor.ntnNumber && `• NTN: ${vendor.ntnNumber}`}
                </span>

                {/* Contact Person & Phone */}
                <div className="mt-4 space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl">
                  <div className="flex items-center gap-2 font-medium">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-800 font-bold">{vendor.contactPerson || 'Authorized Rep'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{vendor.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>Terms: <strong className="text-slate-800">{vendor.paymentTerms || 'Net 15 Days'}</strong></span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[11px]">Total Billed</span>
                    <span className="font-extrabold text-slate-800 font-mono mt-0.5 block">
                      Rs. {Math.round(vendor.totalBilled || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl ${vendor.balanceDue && vendor.balanceDue > 0 ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'}`}>
                    <span className="block text-[11px] opacity-80">Balance Due</span>
                    <span className="font-extrabold font-mono mt-0.5 block">
                      Rs. {Math.round(vendor.balanceDue || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('vendors-payables')}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-bold text-xs transition cursor-pointer text-center"
                >
                  View Ledger
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(vendor)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Edit Profile"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteVendor(vendor.id, vendor.businessName)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onboard / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                    {editingVendor ? 'Edit Vendor Profile' : 'Onboard New Vendor / Contractor'}
                  </h3>
                  <span className="text-xs text-slate-500">Record NTN, category, payment terms & banking details</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Business / Trade Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Royal Decorators & Events"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition"
                  >
                    {VENDOR_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Haji Farooq"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="e.g. +92 300 1234567"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">NTN / FBR Tax ID</label>
                  <input
                    type="text"
                    value={formData.ntnNumber}
                    onChange={(e) => setFormData({ ...formData, ntnNumber: e.target.value })}
                    placeholder="e.g. 1234567-8"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Agreed Payment Terms</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition"
                  >
                    {PAYMENT_TERMS_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Bank Account &amp; IBAN Details</label>
                <input
                  type="text"
                  value={formData.bankDetails}
                  onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
                  placeholder="e.g. Meezan Bank, Gulberg Branch, PK72MEZN00001234567890"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Physical Shop / Office Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Shop #12, Wholesale Flower Market, Lahore"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-extrabold shadow-md transition cursor-pointer"
                >
                  {editingVendor ? 'Save Changes' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

