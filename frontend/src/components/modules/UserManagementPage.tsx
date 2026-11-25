import React, { useMemo, useState, useEffect } from 'react';
import {
  Briefcase,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
  KeyRound,
  UserX,
  CheckCircle,
} from 'lucide-react';
import type { UserRole } from '../auth/LoginScreen';
import { authApi, staffApi } from '../../api/client';
import { StaffMember } from '../../types';

export type AccountStatus = 'Active' | 'Inactive';

export interface UnifiedStaffRecord {
  id: string; // "USR-<id>" or "STF-<id>"
  staffId?: string; // ID in StaffMember if exists
  userId?: string; // ID in User if exists
  fullName: string;
  employeeId?: string;
  email: string;
  role: string;
  phone?: string;
  salary?: number;
  status: AccountStatus;
  hasLogin: boolean;
  username?: string;
  lastLogin: string;
}

const SYSTEM_ROLES: UserRole[] = ['Admin', 'Senior Manager', 'Manager', 'Kitchen', 'Accounts'];
const WORKFORCE_ROLES: string[] = [
  'Admin',
  'Senior Manager',
  'Manager',
  'Kitchen Staff',
  'Waiter / Floor Staff',
  'Accountant',
  'Head Chef',
  'Cleaning Staff',
  'Security Guard',
  'Electrician / Tech',
];

const ACCOUNT_STATUSES: AccountStatus[] = ['Active', 'Inactive'];

const ROLE_BADGE_STYLES: Record<string, string> = {
  Admin: 'bg-teal-50 text-teal-800 border-teal-200',
  'Senior Manager': 'bg-indigo-50 text-indigo-800 border-indigo-200',
  Manager: 'bg-blue-50 text-blue-800 border-blue-200',
  Kitchen: 'bg-amber-50 text-amber-800 border-amber-200',
  'Kitchen Staff': 'bg-amber-50 text-amber-800 border-amber-200',
  Accounts: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Accountant: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Waiter / Floor Staff': 'bg-purple-50 text-purple-800 border-purple-200',
  'Head Chef': 'bg-orange-50 text-orange-800 border-orange-200',
  'Cleaning Staff': 'bg-slate-100 text-slate-700 border-slate-200',
  'Security Guard': 'bg-zinc-100 text-zinc-800 border-zinc-200',
};

const STATUS_BADGE_STYLES: Record<AccountStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '--';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const UserManagementPage: React.FC = () => {
  const [unifiedStaff, setUnifiedStaff] = useState<UnifiedStaffRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'WithLogin' | 'NoLogin'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UnifiedStaffRecord | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [salary, setSalary] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<string>('Waiter / Floor Staff');
  const [status, setStatus] = useState<AccountStatus>('Active');
  const [enableLogin, setEnableLogin] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Load both User accounts and StaffMember records to build a unified single-source of truth
  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, staffData] = await Promise.all([
        authApi.listUsers().catch(() => []),
        staffApi.list().catch(() => []),
      ]);

      const recordsMap = new Map<string, UnifiedStaffRecord>();

      // 1. Process Permanent Staff Members (StaffMember model)
      (staffData || []).forEach((s: StaffMember) => {
        const key = s.fullName.toLowerCase().trim();
        recordsMap.set(key, {
          id: `STF-${s.id}`,
          staffId: String(s.id),
          fullName: s.fullName,
          employeeId: s.employeeId,
          email: `${s.fullName.toLowerCase().replace(/\s+/g, '')}@meharpalace.local`,
          role: s.role || 'Floor Staff',
          phone: s.contactNumber || '',
          salary: Number(s.salary) || 0,
          status: s.status === 'Inactive' ? 'Inactive' : 'Active',
          hasLogin: false,
          username: '',
          lastLogin: 'Staff Record',
        });
      });

      // 2. Process System User Accounts (User + UserProfile model)
      (usersData || []).forEach((u: any) => {
        const key = (u.fullName || u.username).toLowerCase().trim();
        const existing = recordsMap.get(key);

        let mappedRole = 'Manager';
        if (u.role === 'admin') mappedRole = 'Admin';
        else if (u.role === 'senior_manager' || u.role === 'senior manager') mappedRole = 'Senior Manager';
        else if (u.role === 'kitchen') mappedRole = 'Kitchen Staff';
        else if (u.role === 'accounts') mappedRole = 'Accountant';
        else if (u.role === 'waiter') mappedRole = 'Waiter / Floor Staff';

        if (existing) {
          existing.userId = String(u.id);
          existing.hasLogin = true;
          existing.username = u.username;
          existing.email = u.email || existing.email;
          if (u.salary && Number(u.salary) > 0) existing.salary = Number(u.salary);
          if (u.phone) existing.phone = u.phone;
          existing.role = mappedRole;
          existing.lastLogin = u.dateJoined || 'Active';
          existing.status = u.isActive !== false ? 'Active' : 'Inactive';
        } else {
          recordsMap.set(key, {
            id: `USR-${u.id}`,
            userId: String(u.id),
            fullName: u.fullName || u.username,
            employeeId: `EMP-${u.id}`,
            email: u.email || `${u.username}@meharpalace.local`,
            role: mappedRole,
            phone: u.phone || '',
            salary: Number(u.salary) || 0,
            status: u.isActive !== false ? 'Active' : 'Inactive',
            hasLogin: true,
            username: u.username,
            lastLogin: u.dateJoined || 'Active',
          });
        }
      });

      setUnifiedStaff(Array.from(recordsMap.values()));
    } catch (err) {
      console.warn('Error loading staff & users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered List & KPI Metrics
  const filteredStaff = useMemo(() => {
    return unifiedStaff.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        s.fullName.toLowerCase().includes(q) ||
        (s.username && s.username.toLowerCase().includes(q)) ||
        (s.employeeId && s.employeeId.toLowerCase().includes(q)) ||
        s.role.toLowerCase().includes(q);

      if (!matchQuery) return false;
      if (activeTab === 'WithLogin') return s.hasLogin;
      if (activeTab === 'NoLogin') return !s.hasLogin;
      return true;
    });
  }, [unifiedStaff, searchQuery, activeTab]);

  const kpiMetrics = useMemo(() => {
    const totalStaff = unifiedStaff.length;
    const loginAccounts = unifiedStaff.filter((s) => s.hasLogin).length;
    const noLoginStaff = totalStaff - loginAccounts;
    const totalPayroll = unifiedStaff.reduce((sum, s) => sum + (Number(s.salary) || 0), 0);

    return {
      totalStaff: String(totalStaff),
      loginAccounts: String(loginAccounts),
      noLoginStaff: String(noLoginStaff),
      totalPayroll: `Rs. ${totalPayroll.toLocaleString()}`,
    };
  }, [unifiedStaff]);

  const openCreateModal = () => {
    setEditingRecord(null);
    setFullName('');
    setEmail('');
    setUsername('');
    setPassword('');
    setSalary('');
    setPhone('');
    setRole('Waiter / Floor Staff');
    setStatus('Active');
    setEnableLogin(false);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (rec: UnifiedStaffRecord) => {
    setEditingRecord(rec);
    setFullName(rec.fullName);
    setEmail(rec.email);
    setUsername(rec.username || '');
    setPassword('');
    setSalary(rec.salary ? String(rec.salary) : '');
    setPhone(rec.phone || '');
    setRole(rec.role);
    setStatus(rec.status);
    setEnableLogin(rec.hasLogin);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDeleteStaff = async (rec: UnifiedStaffRecord) => {
    if (!window.confirm(`Are you sure you want to remove permanent staff member "${rec.fullName}"?`)) {
      return;
    }

    try {
      if (rec.userId) {
        await authApi.deleteUser(rec.userId).catch(() => {});
      }
      if (rec.staffId) {
        await staffApi.delete(rec.staffId).catch(() => {});
      }
      setUnifiedStaff((prev) => prev.filter((item) => item.id !== rec.id));
    } catch (err) {
      console.warn('Failed to delete staff:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setModalError('Staff full name is required.');
      return;
    }

    const numSalary = parseFloat(salary) || 0;
    const trimmedPhone = phone.trim();
    const effectiveEmail = email.trim() || `${trimmedName.toLowerCase().replace(/\s+/g, '')}@meharpalace.local`;
    const effectiveUsername = username.trim() || trimmedName.toLowerCase().replace(/\s+/g, '');

    // Map UI role to backend user role
    let authRole = 'manager';
    if (role === 'Admin') authRole = 'admin';
    else if (role === 'Senior Manager') authRole = 'senior_manager';
    else if (role.includes('Kitchen') || role.includes('Chef')) authRole = 'kitchen';
    else if (role.includes('Account')) authRole = 'accounts';
    else if (role.includes('Waiter')) authRole = 'waiter';

    setModalError(null);

    try {
      if (editingRecord) {
        // Updating existing record
        // 1. If staffId exists, update StaffMember
        if (editingRecord.staffId) {
          await staffApi.update(editingRecord.staffId, {
            fullName: trimmedName,
            role,
            contactNumber: trimmedPhone,
            salary: numSalary,
            status: status === 'Active' ? 'Active' : 'Inactive',
          }).catch(() => {});
        } else {
          // If was user only, also ensure StaffMember exists
          await staffApi.create({
            fullName: trimmedName,
            role,
            contactNumber: trimmedPhone,
            salary: numSalary,
            status: status === 'Active' ? 'Active' : 'Inactive',
          }).catch(() => {});
        }

        // 2. If user had or now enabled login
        if (enableLogin) {
          if (editingRecord.userId) {
            await authApi.updateUser(editingRecord.userId, {
              fullName: trimmedName,
              email: effectiveEmail,
              username: effectiveUsername,
              role: authRole,
              salary: numSalary,
              phone: trimmedPhone,
              password: password ? password : undefined,
            }).catch(() => {});
          } else {
            // Provision new login credentials for existing staff
            await authApi.createUser({
              fullName: trimmedName,
              email: effectiveEmail,
              username: effectiveUsername,
              role: authRole,
              password: password || 'StaffPass123!',
              salary: numSalary,
              phone: trimmedPhone,
            }).catch(() => {});
          }
        }

        setIsModalOpen(false);
        await loadData();
      } else {
        // Creating new permanent staff
        // 1. Always create in permanent StaffMember registry
        const staffRes = await staffApi.create({
          fullName: trimmedName,
          role,
          contactNumber: trimmedPhone,
          shiftTiming: 'Full Day',
          salary: numSalary,
          status: status === 'Active' ? 'Active' : 'Inactive',
        });

        // 2. If login is enabled, also create system user credentials
        if (enableLogin) {
          await authApi.createUser({
            fullName: trimmedName,
            email: effectiveEmail,
            username: effectiveUsername,
            role: authRole,
            password: password || 'StaffPass123!',
            salary: numSalary,
            phone: trimmedPhone,
          });
        }

        setIsModalOpen(false);
        await loadData();
      }
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save staff record.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
            Permanent Staff &amp; System Roles
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Every employee is part of permanent staff. Select members and provision login credentials as needed.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Enroll Permanent Staff
        </button>
      </div>

      {/* KPI Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Permanent Staff
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.totalStaff}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Full workforce roster</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Login Provisioned
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-indigo-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-indigo-950">
            {kpiMetrics.loginAccounts}
          </p>
          <span className="text-xs text-indigo-600 mt-1 block">Have Portal credentials</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Floor Staff (No Login)
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <UserX className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-amber-950">
            {kpiMetrics.noLoginStaff}
          </p>
          <span className="text-xs text-amber-600 mt-1 block">Waiters, helpers, cleaners</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Monthly Base Payroll
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums text-emerald-950">
            {kpiMetrics.totalPayroll}
          </p>
          <span className="text-xs text-emerald-600 mt-1 block">Staff expense burden</span>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'All'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Permanent Staff ({unifiedStaff.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('WithLogin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'WithLogin'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            System Login Enabled ({unifiedStaff.filter((s) => s.hasLogin).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('NoLogin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'NoLogin'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Floor Staff (No Login) ({unifiedStaff.filter((s) => !s.hasLogin).length})
          </button>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, role, ID..."
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
          />
        </div>
      </div>

      {/* Main Staff Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Staff Member
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Role / Designation
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  System Access
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Monthly Salary
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Contact
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                    Loading permanent staff roster...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-3">
                        <UserPlus className="w-6 h-6 text-teal-700" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        No staff members match the selected filter.
                      </p>
                      <button
                        type="button"
                        onClick={openCreateModal}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Enroll Staff Member
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 shrink-0">
                          {getInitials(staff.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {staff.fullName}
                          </p>
                          <p className="text-xs font-mono text-slate-400 truncate">
                            {staff.employeeId || staff.id} {staff.username && `• @${staff.username}`}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                          ROLE_BADGE_STYLES[staff.role] || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {staff.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-5">
                      {staff.hasLogin ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <KeyRound className="w-3 h-3 text-indigo-600" />
                          <span>Login Active (@{staff.username || 'user'})</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <UserX className="w-3 h-3 text-slate-400" />
                          <span>Permanent Staff (No Login)</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="text-sm font-semibold font-mono tabular-nums text-slate-900">
                        {staff.salary && Number(staff.salary) > 0
                          ? `Rs. ${Number(staff.salary).toLocaleString()}`
                          : 'Rs. 0'}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-sans">Per Month</span>
                    </td>

                    <td className="py-3.5 px-5 text-xs text-slate-600">
                      <div>{staff.phone || 'No phone'}</div>
                      <div className="text-slate-400 text-[11px] truncate max-w-[150px]">{staff.email}</div>
                    </td>

                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE_STYLES[staff.status]}`}
                      >
                        {staff.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(staff)}
                          title={`Edit ${staff.fullName}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(staff)}
                          title={`Remove ${staff.fullName}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Permanent Staff Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900">
                  {editingRecord ? 'Edit Staff Member' : 'Enroll Permanent Staff'}
                </h3>
                <p className="text-xs text-slate-500">
                  Add to permanent staff and optionally grant portal login credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                  {modalError}
                </div>
              )}

              {/* Staff Member Info */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Muhammad Aslam / Tariq Mehmood"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Staff Designation / Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  >
                    {WORKFORCE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Employment Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AccountStatus)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  >
                    {ACCOUNT_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Monthly Salary (PKR) <span className="text-teal-700 font-normal">(Expense Burden)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. 45000"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300 1234567"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>
              </div>

              {/* Login Credentials Provisioning Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/60 border border-indigo-100">
                  <div>
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-700" />
                      Provide Portal Login Access (Username &amp; Password)
                    </span>
                    <p className="text-[11px] text-indigo-700 mt-0.5">
                      Leave off for floor staff/waiters who do not need system portal login.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableLogin}
                    onChange={(e) => setEnableLogin(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {enableLogin && (
                  <div className="mt-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          System Username *
                        </label>
                        <input
                          type="text"
                          required={enableLogin}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="e.g. aslam_mgr"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/15"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Password {editingRecord && '(Leave blank to keep current)'}
                        </label>
                        <input
                          type="password"
                          required={enableLogin && !editingRecord?.userId}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={editingRecord?.userId ? '••••••••' : 'Initial password'}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/15"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Portal Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="aslam@meharpalace.com"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/15"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  {editingRecord ? 'Save Staff Changes' : 'Enroll Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
