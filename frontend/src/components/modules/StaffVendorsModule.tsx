import React, { useState } from 'react';
import {
  Users,
  Store,
  UserPlus,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Briefcase,
  Edit2,
  Trash2,
  RotateCcw,
  X,
  Check,
  Building,
  Shield,
  Layers,
  Sparkles,
  Tablet,
} from 'lucide-react';
import { StaffMember, VendorPartner } from '../../types';

interface StaffVendorsModuleProps {
  initialTab?: 'staff' | 'vendors';
  onLaunchTabletMode?: () => void;
}

const STAFF_ROLES = ['Manager', 'Floor Staff', 'Admin', 'Accountant'];
const VENDOR_CATEGORIES = ['Decorator', 'Caterer', 'Photographer', 'Sound/Lights', 'Other'];
const SHIFT_OPTIONS = [
  'Morning (09:00 AM - 05:00 PM)',
  'Evening (04:00 PM - 12:00 AM)',
  'Night Setup (10:00 PM - 06:00 AM)',
  'Full Day Event Rotation',
];

export const StaffVendorsModule: React.FC<StaffVendorsModuleProps> = ({
  initialTab = 'staff',
  onLaunchTabletMode,
}) => {
  // STRICT DATA RULE: DO NOT hardcode any dummy data.
  // Both datasets start strictly as empty arrays [].
  const [activeTab, setActiveTab] = useState<'staff' | 'vendors'>(initialTab);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [vendorList, setVendorList] = useState<VendorPartner[]>([]);

  // Filter States for Staff
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedStaffRole, setSelectedStaffRole] = useState('All');
  const [selectedStaffStatus, setSelectedStaffStatus] = useState('All');

  // Filter States for Vendors
  const [vendorSearch, setVendorSearch] = useState('');
  const [selectedVendorCategory, setSelectedVendorCategory] = useState('All');

  // Modal States
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorPartner | null>(null);

  // Staff Form
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Floor Staff');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffShift, setStaffShift] = useState(SHIFT_OPTIONS[0]);
  const [staffStatus, setStaffStatus] = useState<'Active' | 'On Leave' | 'Inactive'>('Active');
  const [staffError, setStaffError] = useState('');

  // Vendor Form
  const [vendorBusinessName, setVendorBusinessName] = useState('');
  const [vendorCategory, setVendorCategory] = useState('Decorator');
  const [vendorContactPerson, setVendorContactPerson] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorError, setVendorError] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Staff Modal Controls
  const openAddStaffModal = () => {
    setEditingStaff(null);
    setStaffName('');
    setStaffRole('Floor Staff');
    setStaffPhone('');
    setStaffShift(SHIFT_OPTIONS[0]);
    setStaffStatus('Active');
    setStaffError('');
    setIsStaffModalOpen(true);
  };

  const openEditStaffModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setStaffName(staff.fullName);
    setStaffRole(staff.role);
    setStaffPhone(staff.contactNumber);
    setStaffShift(staff.shiftTiming);
    setStaffStatus(staff.status);
    setStaffError('');
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      setStaffError('Please enter full name.');
      return;
    }

    if (editingStaff) {
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === editingStaff.id
            ? {
                ...s,
                fullName: staffName.trim(),
                role: staffRole,
                contactNumber: staffPhone.trim() || '[--]',
                shiftTiming: staffShift,
                status: staffStatus,
              }
            : s
        )
      );
      showToast(`Staff member "${staffName.trim()}" updated.`);
    } else {
      const generatedId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      const newStaff: StaffMember = {
        id: `staff-${Date.now()}`,
        employeeId: generatedId,
        fullName: staffName.trim(),
        role: staffRole,
        contactNumber: staffPhone.trim() || '[--]',
        shiftTiming: staffShift,
        status: staffStatus,
      };
      setStaffList((prev) => [newStaff, ...prev]);
      showToast(`Added employee "${staffName.trim()}" (${generatedId}).`);
    }

    setIsStaffModalOpen(false);
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove employee "${name}"?`)) {
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      showToast(`Employee "${name}" removed.`);
    }
  };

  // Vendor Modal Controls
  const openAddVendorModal = () => {
    setEditingVendor(null);
    setVendorBusinessName('');
    setVendorCategory('Decorator');
    setVendorContactPerson('');
    setVendorPhone('');
    setVendorError('');
    setIsVendorModalOpen(true);
  };

  const openEditVendorModal = (vendor: VendorPartner) => {
    setEditingVendor(vendor);
    setVendorBusinessName(vendor.businessName);
    setVendorCategory(vendor.category);
    setVendorContactPerson(vendor.contactPerson);
    setVendorPhone(vendor.phoneNumber);
    setVendorError('');
    setIsVendorModalOpen(true);
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorBusinessName.trim()) {
      setVendorError('Please enter business name.');
      return;
    }

    if (editingVendor) {
      setVendorList((prev) =>
        prev.map((v) =>
          v.id === editingVendor.id
            ? {
                ...v,
                businessName: vendorBusinessName.trim(),
                category: vendorCategory,
                contactPerson: vendorContactPerson.trim() || '[--]',
                phoneNumber: vendorPhone.trim() || '[--]',
              }
            : v
        )
      );
      showToast(`Vendor partner "${vendorBusinessName.trim()}" updated.`);
    } else {
      const generatedId = `VEN-${Math.floor(1000 + Math.random() * 9000)}`;
      const newVendor: VendorPartner = {
        id: `ven-${Date.now()}`,
        vendorId: generatedId,
        businessName: vendorBusinessName.trim(),
        category: vendorCategory,
        contactPerson: vendorContactPerson.trim() || '[--]',
        phoneNumber: vendorPhone.trim() || '[--]',
      };
      setVendorList((prev) => [newVendor, ...prev]);
      showToast(`Registered vendor "${vendorBusinessName.trim()}" (${generatedId}).`);
    }

    setIsVendorModalOpen(false);
  };

  const handleDeleteVendor = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove vendor "${name}"?`)) {
      setVendorList((prev) => prev.filter((v) => v.id !== id));
      showToast(`Vendor "${name}" removed.`);
    }
  };

  const handleResetToEmpty = () => {
    setStaffList([]);
    setVendorList([]);
    setStaffSearch('');
    setVendorSearch('');
    setSelectedStaffRole('All');
    setSelectedStaffStatus('All');
    setSelectedVendorCategory('All');
    showToast('Staff and Vendor directory reset to clean empty state [].');
  };

  // Filtered staff
  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.fullName.toLowerCase().includes(staffSearch.toLowerCase()) ||
      staff.employeeId.toLowerCase().includes(staffSearch.toLowerCase()) ||
      staff.contactNumber.includes(staffSearch);

    const matchesRole =
      selectedStaffRole === 'All' || staff.role.toLowerCase() === selectedStaffRole.toLowerCase();

    const matchesStatus =
      selectedStaffStatus === 'All' || staff.status.toLowerCase() === selectedStaffStatus.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filtered vendors
  const filteredVendors = vendorList.filter((vendor) => {
    const matchesSearch =
      vendor.businessName.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      vendor.vendorId.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      vendor.contactPerson.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      vendor.phoneNumber.includes(vendorSearch);

    const matchesCategory =
      selectedVendorCategory === 'All' ||
      vendor.category.toLowerCase() === selectedVendorCategory.toLowerCase();

    return matchesSearch && matchesCategory;
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
      <div className="flex flex-col gap-4 pb-3 border-b border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
                Staff &amp; Vendor Directory
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-bold uppercase tracking-wider">
                Workforce Management
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage internal employees, floor staff, and external service providers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(staffList.length > 0 || vendorList.length > 0) && (
              <button
                type="button"
                onClick={handleResetToEmpty}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
                title="Reset datasets to empty state"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Empty</span>
              </button>
            )}

            {onLaunchTabletMode && (
              <button
                type="button"
                onClick={onLaunchTabletMode}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
                title="Open Floor Staff Tablet Interface"
              >
                <Tablet className="w-3.5 h-3.5 text-teal-700" />
                <span>Tablet Mode</span>
              </button>
            )}

            {/* Primary Action Button based on activeTab */}
            {activeTab === 'staff' ? (
              <button
                type="button"
                onClick={openAddStaffModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Staff</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openAddVendorModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Store className="w-4 h-4" />
                <span>Add Vendor</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Component: Internal Staff vs External Vendors */}
        <div className="flex items-center justify-between border-b border-slate-200 pt-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'staff'
                  ? 'border-teal-700 text-teal-800 bg-teal-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Internal Staff</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
                {staffList.length > 0 ? staffList.length : '[--]'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vendors')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'vendors'
                  ? 'border-teal-700 text-teal-800 bg-teal-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>External Vendors</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
                {vendorList.length > 0 ? vendorList.length : '[--]'}
              </span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
            Directory Status: Online • Role-Based Access Control
          </div>
        </div>
      </div>

      {/* TAB 1: INTERNAL STAFF */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Staff Filter Bar */}
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="[Search staff by name, ID or phone...]"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Role Dropdown Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Role:</span>
                <select
                  value={selectedStaffRole}
                  onChange={(e) => setSelectedStaffRole(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                >
                  <option value="All">All Roles</option>
                  {STAFF_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Dropdown Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Status:</span>
                <select
                  value={selectedStaffStatus}
                  onChange={(e) => setSelectedStaffStatus(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {(staffSearch || selectedStaffRole !== 'All' || selectedStaffStatus !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setStaffSearch('');
                    setSelectedStaffRole('All');
                    setSelectedStaffStatus('All');
                  }}
                  className="px-2 py-1 text-xs text-teal-800 hover:underline font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table / Empty State */}
          {filteredStaff.length === 0 ? (
            <div className="py-20 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-800 mb-4 shadow-xs">
                <Users className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                No staff members found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mt-1.5 mb-6">
                No staff members found. Add your first employee to manage shifts.
              </p>
              <button
                type="button"
                onClick={openAddStaffModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Staff</span>
              </button>

              {/* Structural Placeholder Schema Preview */}
              <div className="w-full max-w-3xl mt-10 pt-8 border-t border-slate-100 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Schema Preview (Empty Dataset)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">0 records</span>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Employee ID</th>
                        <th className="py-2.5 px-3">Full Name</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Contact Number</th>
                        <th className="py-2.5 px-3">Shift Timing</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-400 font-mono">
                      <tr className="hover:bg-white/80 transition-colors">
                        <td className="py-2.5 px-3">[EMP-XXXX]</td>
                        <td className="py-2.5 px-3">[--]</td>
                        <td className="py-2.5 px-3">[Manager/Floor Staff]</td>
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Contact Number</th>
                    <th className="py-3 px-4">Shift Timing</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((staff) => {
                    const statusBadge =
                      staff.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : staff.status === 'On Leave'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200';

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {staff.employeeId}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{staff.fullName}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-medium text-[11px] border border-teal-200/70">
                            <Briefcase className="w-3 h-3 text-teal-600" />
                            <span>{staff.role}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {staff.contactNumber || '[--]'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 flex items-center gap-1.5 mt-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{staff.shiftTiming}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                staff.status === 'Active'
                                  ? 'bg-emerald-500'
                                  : staff.status === 'On Leave'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            <span>{staff.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditStaffModal(staff)}
                              title="Edit Staff"
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(staff.id, staff.fullName)}
                              title="Delete Staff"
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
        </div>
      )}

      {/* TAB 2: EXTERNAL VENDORS */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Vendor Filter Bar */}
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                placeholder="[Search vendors by business, category or contact...]"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Dropdown Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Category:</span>
                <select
                  value={selectedVendorCategory}
                  onChange={(e) => setSelectedVendorCategory(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                >
                  <option value="All">All Categories</option>
                  {VENDOR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {(vendorSearch || selectedVendorCategory !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setVendorSearch('');
                    setSelectedVendorCategory('All');
                  }}
                  className="px-2 py-1 text-xs text-teal-800 hover:underline font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table / Empty State */}
          {filteredVendors.length === 0 ? (
            <div className="py-20 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-800 mb-4 shadow-xs">
                <Store className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                No vendors found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mt-1.5 mb-6">
                No vendors found. Add your trusted external partners here.
              </p>
              <button
                type="button"
                onClick={openAddVendorModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Store className="w-4 h-4" />
                <span>Add Vendor</span>
              </button>

              {/* Structural Placeholder Schema Preview */}
              <div className="w-full max-w-3xl mt-10 pt-8 border-t border-slate-100 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Schema Preview (Empty Dataset)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">0 records</span>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Vendor ID</th>
                        <th className="py-2.5 px-3">Business Name</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Contact Person</th>
                        <th className="py-2.5 px-3">Phone Number</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-400 font-mono">
                      <tr className="hover:bg-white/80 transition-colors">
                        <td className="py-2.5 px-3">[VEN-XXXX]</td>
                        <td className="py-2.5 px-3">[--]</td>
                        <td className="py-2.5 px-3">[Decorator/Caterer]</td>
                        <td className="py-2.5 px-3">[--]</td>
                        <td className="py-2.5 px-3">[--]</td>
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Vendor ID</th>
                    <th className="py-3 px-4">Business Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Contact Person</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {vendor.vendorId}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {vendor.businessName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[11px] font-medium border border-teal-200/70">
                          {vendor.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {vendor.contactPerson || '[--]'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {vendor.phoneNumber || '[--]'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditVendorModal(vendor)}
                            title="Edit Vendor"
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVendor(vendor.id, vendor.businessName)}
                            title="Delete Vendor"
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Simulated "Add / Edit Staff" Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                  {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingStaff
                    ? `Updating credentials for ${editingStaff.employeeId}`
                    : 'Enroll internal staff, floor supervisor, or venue admin.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-4">
              {staffError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{staffError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => {
                    setStaffName(e.target.value);
                    if (staffError) setStaffError('');
                  }}
                  placeholder="[Enter Full Name]"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  >
                    {STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={staffStatus}
                    onChange={(e) =>
                      setStaffStatus(e.target.value as 'Active' | 'On Leave' | 'Inactive')
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="[Enter Contact Number]"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              {/* Shift Timing */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shift Timing
                </label>
                <select
                  value={staffShift}
                  onChange={(e) => setStaffShift(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                >
                  {SHIFT_OPTIONS.map((shift) => (
                    <option key={shift} value={shift}>
                      {shift}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all"
                >
                  {editingStaff ? 'Update Staff' : 'Save Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulated "Add / Edit Vendor" Modal */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                  {editingVendor ? 'Edit External Vendor' : 'Add External Vendor'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingVendor
                    ? `Updating parameters for ${editingVendor.vendorId}`
                    : 'Register an external contractor, decorator, DJ/lights, or catering partner.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsVendorModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="p-6 space-y-4">
              {vendorError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{vendorError}</span>
                </div>
              )}

              {/* Business Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={vendorBusinessName}
                  onChange={(e) => {
                    setVendorBusinessName(e.target.value);
                    if (vendorError) setVendorError('');
                  }}
                  placeholder="[Enter Business Name]"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={vendorCategory}
                  onChange={(e) => setVendorCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                >
                  {VENDOR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={vendorContactPerson}
                  onChange={(e) => setVendorContactPerson(e.target.value)}
                  placeholder="[Enter Contact Person]"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={vendorPhone}
                  onChange={(e) => setVendorPhone(e.target.value)}
                  placeholder="[Enter Phone Number]"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all"
                >
                  {editingVendor ? 'Update Vendor' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
