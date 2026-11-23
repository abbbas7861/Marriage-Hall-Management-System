import React, { useMemo, useState, useEffect } from 'react';
import {
  Pencil,
  Plus,
  Search,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import { vendorsApi } from '../../api/client';

export type VendorCategory = 'Decorator' | 'Photographer' | 'Sound' | 'Other';
export type VendorStatus = 'Active' | 'Inactive';

export interface VendorRecord {
  id: string;
  businessName: string;
  category: VendorCategory;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  status: VendorStatus;
}

const VENDOR_CATEGORIES: VendorCategory[] = [
  'Decorator',
  'Photographer',
  'Sound',
  'Other',
];

const CATEGORY_BADGE_STYLES: Record<VendorCategory, string> = {
  Decorator: 'bg-teal-50 text-teal-800 border-teal-200',
  Photographer: 'bg-blue-50 text-blue-800 border-blue-200',
  Sound: 'bg-amber-50 text-amber-800 border-amber-200',
  Other: 'bg-slate-100 text-slate-700 border-slate-200',
};

const STATUS_BADGE_STYLES: Record<VendorStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const VendorDirectoryPage: React.FC = () => {
  const [vendors, setVendors] = useState<VendorRecord[]>([]);

  useEffect(() => {
    vendorsApi
      .list()
      .then((data) => {
        if (data && data.length > 0) {
          setVendors(
            data.map((v: any) => ({
              id: String(v.id),
              businessName: v.businessName || v.name || '[--]',
              category: (['Decorator', 'Photographer', 'Sound'].includes(v.category)
                ? v.category
                : 'Other') as any,
              contactPerson: v.contactPerson || '[--]',
              phone: v.phoneNumber || v.phone || '[--]',
              email: v.email || '[--]',
              address: v.address || '[--]',
              notes: v.notes || '',
              status: v.status || 'Active',
            }))
          );
        }
      })
      .catch((err) => console.warn('Vendors API error:', err));
  }, []);

  // Filter Bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | VendorCategory>('All');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<VendorCategory>('Decorator');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<VendorStatus>('Active');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setBusinessName('');
    setCategory('Decorator');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setStatus('Active');
    setFormError(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (vendor: VendorRecord) => {
    setEditingId(vendor.id);
    setBusinessName(vendor.businessName);
    setCategory(vendor.category);
    setContactPerson(vendor.contactPerson);
    setPhone(vendor.phone);
    setEmail(vendor.email);
    setAddress(vendor.address);
    setNotes(vendor.notes);
    setStatus(vendor.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setFormError('Vendor/Business Name is required.');
      return;
    }
    if (!contactPerson.trim()) {
      setFormError('Contact Person Name is required.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Phone Number is required.');
      return;
    }

    const apiPayload = {
      businessName: businessName.trim(),
      category,
      contactPerson: contactPerson.trim(),
      phoneNumber: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      notes: notes.trim(),
    };

    if (editingId) {
      vendorsApi
        .update(editingId, apiPayload)
        .catch((err) => console.warn('Vendor API update error:', err));

      setVendors((prev) =>
        prev.map((v) =>
          v.id === editingId
            ? {
                ...v,
                businessName: businessName.trim(),
                category,
                contactPerson: contactPerson.trim(),
                phone: phone.trim(),
                email: email.trim(),
                address: address.trim(),
                notes: notes.trim(),
                status,
              }
            : v
        )
      );
    } else {
      const tempId = `vnd-${Date.now()}`;
      const created: VendorRecord = {
        id: tempId,
        businessName: businessName.trim(),
        category,
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: notes.trim(),
        status,
      };
      setVendors((prev) => [created, ...prev]);

      vendorsApi
        .create(apiPayload)
        .then((res: any) => {
          if (res && res.id) {
            setVendors((prev) =>
              prev.map((v) =>
                v.id === tempId ? { ...v, id: String(res.id) } : v
              )
            );
          }
        })
        .catch((err) => console.warn('Vendor API create error:', err));
    }

    closeModal();
  };

  const handleDeleteVendor = (id: string) => {
    vendorsApi.delete(id).catch((err) => console.warn('Vendor API delete error:', err));
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  const filteredVendors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vendors.filter((v) => {
      const matchesSearch =
        !q ||
        v.businessName.toLowerCase().includes(q) ||
        v.contactPerson.toLowerCase().includes(q) ||
        v.phone.toLowerCase().includes(q);
      const matchesCategory =
        categoryFilter === 'All' || v.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [vendors, searchQuery, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
            Vendor Directory
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage external partners like decorators, photographers, and suppliers.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vendor</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by vendor name, contact person, or phone..."
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
          />
        </div>

        <select
          aria-label="Filter by Category"
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value as 'All' | VendorCategory)
          }
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 cursor-pointer sm:w-48"
        >
          <option value="All">All Categories</option>
          {VENDOR_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Vendor Name
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Category
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Contact Person
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Phone
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
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 px-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
                        <Store className="w-7 h-7 text-slate-400 stroke-[1.5]" />
                      </div>
                      <p className="text-base font-semibold text-slate-900">
                        No vendors added yet.
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Register external decorators, photographers, and sound suppliers to coordinate events.
                      </p>
                      <button
                        type="button"
                        onClick={openAddModal}
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Vendor</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 px-6 text-center">
                    <p className="text-sm font-medium text-slate-900">
                      No matching vendors found.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try adjusting your search query or category filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('All');
                      }}
                      className="mt-3 text-xs font-semibold text-teal-700 hover:text-teal-800 underline cursor-pointer"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <p className="text-sm font-semibold text-slate-900">
                        {vendor.businessName}
                      </p>
                      {vendor.address && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                          {vendor.address}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_BADGE_STYLES[vendor.category]}`}
                      >
                        {vendor.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-slate-700">
                      <p className="font-medium text-slate-900">
                        {vendor.contactPerson}
                      </p>
                      {vendor.email && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {vendor.email}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {vendor.phone}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_STYLES[vendor.status]}`}
                      >
                        {vendor.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(vendor)}
                          aria-label={`Edit ${vendor.businessName}`}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-teal-700 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVendor(vendor.id)}
                          aria-label={`Delete ${vendor.businessName}`}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Vendor Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vendor-modal-title"
        >
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2
                id="vendor-modal-title"
                className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900"
              >
                {editingId ? 'Edit Vendor' : 'Add New Vendor'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="p-6 space-y-4">
              {formError && (
                <div className="px-3.5 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="vendor-business-name"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Vendor/Business Name
                  </label>
                  <input
                    id="vendor-business-name"
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="[--]"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="vendor-category"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Category
                  </label>
                  <select
                    id="vendor-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VendorCategory)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 cursor-pointer"
                  >
                    {VENDOR_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="vendor-status"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Status
                  </label>
                  <select
                    id="vendor-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as VendorStatus)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="vendor-contact-person"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Contact Person Name
                  </label>
                  <input
                    id="vendor-contact-person"
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="[--]"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="vendor-phone"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Phone Number
                  </label>
                  <input
                    id="vendor-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="[--]"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="vendor-email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Email (Optional)
                  </label>
                  <input
                    id="vendor-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="[--]"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="vendor-address"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Address
                  </label>
                  <input
                    id="vendor-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="[--]"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="vendor-notes"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Notes
                  </label>
                  <textarea
                    id="vendor-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="[--]"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
