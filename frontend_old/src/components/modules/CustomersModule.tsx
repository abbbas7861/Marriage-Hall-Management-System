import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Mail,
  Phone,
  Eye,
  Edit2,
  Trash2,
  X,
  Check,
  CheckCircle2,
  RotateCcw,
  User,
  Building2,
  CreditCard,
  FileText,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Customer } from '../../types';
import { customersApi } from '../../api/client';

export const CustomersModule: React.FC = () => {
  // STRICT DATA RULE: DO NOT hardcode any dummy data.
  // No fake names, phone numbers, or emails. Start as empty array [].
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await customersApi.list();
      setCustomers(data);
    } catch (err: any) {
      console.error('Failed to load customers from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter Bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'name-asc' | 'ltv'>('newest');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCnic, setFormCnic] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormFullName('');
    setFormPhone('');
    setFormEmail('');
    setFormCnic('');
    setFormAddress('');
    setFormNotes('');
    setFormStatus('Active');
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormFullName(cust.name);
    setFormPhone(cust.phone);
    setFormEmail(cust.email);
    setFormCnic(cust.cnic || '');
    setFormAddress(cust.address || '');
    setFormNotes(cust.notes || '');
    setFormStatus(cust.status);
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const openViewModal = (cust: Customer) => {
    setSelectedCustomer(cust);
    setIsViewModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setEditingCustomer(null);
    setFormError('');
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formFullName.trim()) {
      setFormError('Please enter a customer full name.');
      return;
    }
    if (!formPhone.trim()) {
      setFormError('Please enter a contact phone number.');
      return;
    }

    if (editingCustomer) {
      customersApi.update(editingCustomer.id, {
        name: formFullName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        cnic: formCnic.trim(),
        address: formAddress.trim(),
        notes: formNotes.trim(),
        status: formStatus,
      }).then((updated) => {
        setCustomers((prev) =>
          prev.map((c) => (c.id === editingCustomer.id ? updated : c))
        );
        showToast(`Customer profile "${formFullName.trim()}" updated.`);
      }).catch((err: any) => {
        setFormError(err.message || 'Failed to update customer profile.');
      });
    } else {
      customersApi.create({
        name: formFullName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        cnic: formCnic.trim(),
        address: formAddress.trim(),
        notes: formNotes.trim(),
        status: formStatus,
      }).then((newCustomer) => {
        setCustomers((prev) => [newCustomer, ...prev]);
        showToast(`New customer profile "${formFullName.trim()}" created successfully.`);
      }).catch((err: any) => {
        setFormError(err.message || 'Failed to create customer profile.');
      });
    }

    closeCreateModal();
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete profile for "${name}"?`)) {
      customersApi.delete(id).then(() => {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        showToast(`Customer "${name}" removed from CRM.`);
      }).catch((err: any) => {
        alert(err.message || 'Failed to delete customer.');
      });
    }
  };

  const handleResetToEmpty = () => {
    setCustomers([]);
    setSearchQuery('');
    setStatusFilter('All');
    showToast('Customer records reset to initial empty state.');
  };

  // Filter & Sort
  const filteredCustomers = customers
    .filter((cust) => {
      if (statusFilter !== 'All' && cust.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = cust.name.toLowerCase().includes(q);
        const matchPhone = cust.phone.toLowerCase().includes(q);
        const matchEmail = cust.email.toLowerCase().includes(q);
        const matchId = cust.customerId.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchId) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'ltv') {
        return b.lifetimeValue - a.lifetimeValue;
      }
      return 0; // default newest order
    });

  return (
    <div className="flex flex-col w-full gap-6 pb-12 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-teal-900 text-white shadow-xl flex items-center gap-2.5 text-xs font-medium animate-in slide-in-from-top-2 border border-teal-700">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Section (Header) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
              Customers &amp; CRM
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00685f]"></span>
              CLIENT DIRECTORY
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage client profiles, contact details, and lifetime booking history.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {customers.length > 0 && (
            <button
              type="button"
              onClick={handleResetToEmpty}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Empty</span>
            </button>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00685f] hover:bg-[#00524b] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4 stroke-[2.2]" />
            <span>+ Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="[Search by name or phone...]"
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] transition-all"
          />
        </div>

        {/* Filter by Status & Sort By Dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#00685f] cursor-pointer"
            >
              <option value="All">Filter by Status: All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="relative flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#00685f] cursor-pointer"
            >
              <option value="newest">Sort By: Newest</option>
              <option value="name-asc">Sort By: Name (A-Z)</option>
              <option value="ltv">Sort By: Lifetime Value</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Section: Data Table */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                <th scope="col" className="py-3.5 px-4">Customer ID</th>
                <th scope="col" className="py-3.5 px-4">Full Name</th>
                <th scope="col" className="py-3.5 px-4">Contact Info</th>
                <th scope="col" className="py-3.5 px-4 text-center">Total Bookings</th>
                <th scope="col" className="py-3.5 px-4 text-right">Lifetime Value</th>
                <th scope="col" className="py-3.5 px-4 text-center">Status</th>
                <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredCustomers.length === 0 ? (
                /* Large Centered Empty State */
                <tr>
                  <td colSpan={7} className="py-20 px-4 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#00685f] shadow-sm">
                        <Users className="w-8 h-8 stroke-[1.6]" />
                      </div>

                      <div className="flex flex-col gap-1 mt-1">
                        <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                          No customers found. Add your first customer to start building your CRM.
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                          Maintain detailed customer contact books, log government CNIC credentials, and track lifetime booking frequency.
                        </p>
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={openCreateModal}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00685f] hover:bg-[#00524b] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.98]"
                        >
                          <UserPlus className="w-4 h-4 stroke-[2.2]" />
                          <span>+ Add New Customer</span>
                        </button>
                      </div>

                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-400 text-[11px] font-mono mt-3">
                        <span>customers: []</span>
                        <span>•</span>
                        <span>[CRM Registry Empty]</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const isActive = cust.status === 'Active';

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Customer ID */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-[11px]">
                          [{cust.customerId}]
                        </span>
                      </td>

                      {/* Full Name with Avatar Placeholder Icon */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-[#00685f] shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                              {cust.name}
                            </span>
                            {cust.cnic ? (
                              <span className="text-[10px] text-slate-400 font-mono">
                                CNIC: [{cust.cnic}]
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">
                                CNIC: [--]
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Info (Phone and Email placeholders) */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-800">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-mono">{cust.phone || '[--]'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-mono truncate max-w-[180px]">
                              {cust.email || '[--]'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Total Bookings */}
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-800">
                        {cust.totalBookings === 0 ? '[--]' : `${cust.totalBookings} Events`}
                      </td>

                      {/* Lifetime Value */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#00685f]">
                        {cust.lifetimeValue === 0 ? '[--]' : `$${cust.lifetimeValue.toLocaleString()}`}
                      </td>

                      {/* Status Badge: Active, Inactive */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          ></span>
                          <span>{cust.status}</span>
                        </span>
                      </td>

                      {/* Actions: View Profile, Edit, Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openViewModal(cust)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#00685f] hover:bg-teal-50 transition-colors cursor-pointer"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(cust)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* "Add New Customer" Modal (Simulated) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#00685f]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                    {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Register client credentials, CNIC reference, and communication channel.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCustomer} className="overflow-y-auto p-6 flex flex-col gap-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="[Enter Full Name]"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f]"
                  required
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-700">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="[Enter Phone Number]"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f]"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="[Enter Email Address]"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f]"
                    />
                  </div>
                </div>
              </div>

              {/* CNIC / ID */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">
                  CNIC / ID Number
                </label>
                <input
                  type="text"
                  value={formCnic}
                  onChange={(e) => setFormCnic(e.target.value)}
                  placeholder="[Enter CNIC / ID]"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f]"
                />
              </div>

              {/* Address */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">
                  Residential / Office Address
                </label>
                <textarea
                  rows={2}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="[Enter Complete Address]"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] resize-none"
                />
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">
                  Notes &amp; Preferences
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="[Enter any specific preferences or notes]"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] resize-none"
                />
              </div>

              {/* Status (Dropdown: Active, Inactive) */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">
                  Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00685f] cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00685f] hover:bg-[#00524b] text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{editingCustomer ? 'Save Changes' : 'Save Customer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* "View Profile" Modal */}
      {isViewModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-gradient-to-r from-slate-900 to-teal-950 text-white flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-300">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400">
                    [{selectedCustomer.customerId}]
                  </span>
                  <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans']">
                    {selectedCustomer.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-300">{selectedCustomer.phone}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-xs text-slate-300">{selectedCustomer.email || '[No Email]'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Bookings</span>
                  <div className="text-base font-mono font-bold text-slate-900 mt-0.5">
                    {selectedCustomer.totalBookings === 0 ? '[--]' : `${selectedCustomer.totalBookings} Events`}
                  </div>
                </div>
                <div className="border-l border-slate-200 pl-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Lifetime Value</span>
                  <div className="text-base font-mono font-bold text-[#00685f] mt-0.5">
                    {selectedCustomer.lifetimeValue === 0 ? '[--]' : `$${selectedCustomer.lifetimeValue.toLocaleString()}`}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700">Address:</span>
                    <p className="text-slate-600 mt-0.5">{selectedCustomer.address || '[--]'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700">Special Notes:</span>
                    <p className="text-slate-600 mt-0.5">{selectedCustomer.notes || '[No notes recorded]'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
