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
} from 'lucide-react';
import type { UserRole } from '../auth/LoginScreen';
import { SEED_USERS } from '../../data/seedData';
import { authApi } from '../../api/client';

export type AccountStatus = 'Active' | 'Inactive';

export interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  salary?: number;
  phone?: string;
  status: AccountStatus;
  lastLogin: string;
}

const SYSTEM_ROLES: UserRole[] = ['Admin', 'Senior Manager', 'Manager', 'Kitchen', 'Accounts'];
const ACCOUNT_STATUSES: AccountStatus[] = ['Active', 'Inactive'];

const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  Admin: 'bg-teal-50 text-teal-800 border-teal-200',
  'Senior Manager': 'bg-indigo-50 text-indigo-800 border-indigo-200',
  Manager: 'bg-blue-50 text-blue-800 border-blue-200',
  Kitchen: 'bg-amber-50 text-amber-800 border-amber-200',
  Accounts: 'bg-emerald-50 text-emerald-800 border-emerald-200',
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
  const [users, setUsers] = useState<StaffUser[]>(SEED_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .listUsers()
      .then((data) => {
        if (data && data.length > 0) {
          setUsers(
            data.map((u: any) => ({
              id: String(u.id),
              fullName: u.fullName || u.username,
              email: u.email || `${u.username}@mhms.local`,
              role:
                u.role === 'admin'
                  ? 'Admin'
                  : (u.role === 'senior_manager' || u.role === 'senior manager')
                  ? 'Senior Manager'
                  : u.role === 'kitchen'
                  ? 'Kitchen'
                  : u.role === 'accounts'
                  ? 'Accounts'
                  : 'Manager',
              salary: Number(u.salary) || 0,
              phone: u.phone || '',
              status: u.isActive !== false ? 'Active' : 'Inactive',
              lastLogin: u.dateJoined || 'Active',
            }))
          );
        }
      })
      .catch((err) => console.warn('User management API error:', err));
  }, []);

  // Modal form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [salary, setSalary] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('Manager');
  const [status, setStatus] = useState<AccountStatus>('Active');

  const kpiMetrics = useMemo(() => {
    if (users.length === 0) {
      return {
        totalUsers: '[--]',
        activeAccounts: '[--]',
        totalRoles: String(SYSTEM_ROLES.length),
      };
    }

    const activeCount = users.filter((u) => u.status === 'Active').length;
    return {
      totalUsers: String(users.length),
      activeAccounts: String(activeCount),
      totalRoles: String(SYSTEM_ROLES.length),
    };
  }, [users]);

  const openCreateModal = () => {
    setEditingId(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setSalary('');
    setPhone('');
    setRole('Manager');
    setStatus('Active');
    setIsModalOpen(true);
  };

  const openEditModal = (user: StaffUser) => {
    setEditingId(user.id);
    setFullName(user.fullName);
    setEmail(user.email);
    setPassword('');
    setSalary(user.salary ? String(user.salary) : '');
    setPhone(user.phone || '');
    setRole(user.role);
    setStatus(user.status);
    setIsModalOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    authApi.deleteUser(id).catch((err) => console.warn('User API delete error:', err));
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) return;

    const apiPayload = {
      fullName: trimmedName,
      email: trimmedEmail,
      username:
        trimmedEmail.split('@')[0] ||
        trimmedName.toLowerCase().replace(/\s+/g, ''),
      role: role.toLowerCase(),
      password: password || 'SecurePass123!',
      salary: parseFloat(salary) || 0,
      phone: phone.trim(),
    };

    if (editingId) {
      authApi
        .updateUser(editingId, apiPayload)
        .catch((err) => console.warn('User API update error:', err));

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingId
            ? {
                ...u,
                fullName: trimmedName,
                email: trimmedEmail,
                salary: parseFloat(salary) || 0,
                phone: phone.trim(),
                role,
                status,
              }
            : u
        )
      );
    } else {
      const tempId = `USR-${Date.now().toString().slice(-5)}`;
      const created: StaffUser = {
        id: tempId,
        fullName: trimmedName,
        email: trimmedEmail,
        role,
        salary: parseFloat(salary) || 0,
        phone: phone.trim(),
        status,
        lastLogin: '[--]',
      };
      setUsers((prev) => [created, ...prev]);

      authApi
        .createUser(apiPayload)
        .then((res: any) => {
          if (res && res.id) {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === tempId ? { ...u, id: String(res.id) } : u
              )
            );
          }
        })
        .catch((err) => console.warn('User API create error:', err));
    }

    setIsModalOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
            Staff &amp; User Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage employee accounts, login credentials, and system roles.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* KPI Metrics Bar (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Users
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.totalUsers}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Accounts
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.activeAccounts}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Roles
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
            {kpiMetrics.totalRoles}
          </p>
        </div>
      </div>

      {/* Main Section: Data Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  User Details
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Role
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Monthly Salary
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Last Login
                </th>
                <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 px-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-4">
                        <UserPlus className="w-7 h-7 text-teal-700" />
                      </div>
                      <p className="text-base font-semibold text-slate-900">
                        No users found. Create your first staff account.
                      </p>
                      <button
                        type="button"
                        onClick={openCreateModal}
                        className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Add New User
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 shrink-0">
                          {getInitials(user.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE_STYLES[user.role]}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-sm font-semibold text-slate-800">
                      {user.salary ? `Rs. ${user.salary.toLocaleString()}` : 'Rs. 0'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_STYLES[user.status]}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-sm font-mono tabular-nums text-slate-500">
                      {user.lastLogin}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          aria-label={`Edit ${user.fullName}`}
                          className="p-2 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.id)}
                          aria-label={`Delete ${user.fullName}`}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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

      {/* Add / Edit New User Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3
                id="user-modal-title"
                className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900"
              >
                {editingId ? 'Edit User Account' : 'Add New User'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              <div>
                <label
                  htmlFor="user-full-name"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="user-full-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="[--]"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div>
                <label
                  htmlFor="user-email"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="user-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="[--]"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div>
                <label
                  htmlFor="user-password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="user-password"
                  type="password"
                  required={!editingId}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="[--]"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="user-salary"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Monthly Salary (PKR) <span className="text-teal-700 font-normal">(Posts to Accounts)</span>
                  </label>
                  <input
                    id="user-salary"
                    type="number"
                    min="0"
                    step="500"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. 45000"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="user-phone"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Contact Phone
                  </label>
                  <input
                    id="user-phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300 1234567"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="user-role"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    System Role
                  </label>
                  <select
                    id="user-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  >
                    {SYSTEM_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="user-status"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Account Status
                  </label>
                  <select
                    id="user-status"
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
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
