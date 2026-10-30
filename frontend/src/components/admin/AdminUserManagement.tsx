import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Wallet,
  Phone,
  Mail,
  CheckCircle2,
  Trash2,
  Edit2,
  Search,
  Lock,
  Sparkles,
  AlertCircle,
  X,
  ChevronDown,
} from 'lucide-react';
import { authApi } from '../../api/client';
import { UserRole } from '../../types';

interface StaffUser {
  id: number | string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone: string;
  salary: number;
  isActive: boolean;
  dateJoined: string;
}

const ROLE_LABELS: Record<UserRole, { label: string; badge: string; desc: string }> = {
  admin: {
    label: 'Admin / Owner',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    desc: 'Full unrestricted superuser control over all 6 portals and settings',
  },
  manager: {
    label: 'Event Manager',
    badge: 'bg-sky-100 text-sky-800 border-sky-300',
    desc: 'Manages floor operations, duty rosters, decor, and service readiness',
  },
  kitchen: {
    label: 'Kitchen & Chef Staff',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    desc: 'Kitchen display screen, recipe formulas, and stock requisitions',
  },
  waiter: {
    label: 'Waiter / Floor Staff',
    badge: 'bg-violet-100 text-violet-800 border-violet-300',
    desc: 'Floor tablet kiosk, urgent dish refills, and table turnover',
  },
  accountant: {
    label: 'Accountant',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    desc: 'Full General Ledger, accounts receivable/payable, and financial closings',
  },
};

export const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  // Form Fields
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('manager');
  const [formPhone, setFormPhone] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await authApi.listUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormPassword('');
    setFormFullName('');
    setFormEmail('');
    setFormRole('manager');
    setFormPhone('');
    setFormSalary('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (u: StaffUser) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormPassword('');
    setFormFullName(u.fullName || '');
    setFormEmail(u.email || '');
    setFormRole(u.role || 'manager');
    setFormPhone(u.phone || '');
    setFormSalary(u.salary ? String(u.salary) : '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formUsername.trim()) {
      setFormError('Username is required.');
      return;
    }

    if (!editingUser && !formPassword) {
      setFormError('Initial password is required for new accounts.');
      return;
    }

    setActionLoading(true);
    try {
      if (editingUser) {
        await authApi.updateUser(editingUser.id, {
          username: formUsername.trim(),
          password: formPassword || undefined,
          fullName: formFullName.trim(),
          email: formEmail.trim(),
          role: formRole,
          phone: formPhone.trim(),
          salary: parseFloat(formSalary) || 0,
        });
        showToast(`Staff member '${formUsername}' updated successfully.`);
      } else {
        await authApi.createUser({
          username: formUsername.trim(),
          password: formPassword,
          fullName: formFullName.trim(),
          email: formEmail.trim(),
          role: formRole,
          phone: formPhone.trim(),
          salary: parseFloat(formSalary) || 0,
        });
        showToast(`Staff member '${formUsername}' added to system.`);
      }

      setIsModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      setFormError(err?.message || 'Operation failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (u: StaffUser) => {
    if (!window.confirm(`Are you sure you want to delete user account '${u.username}'?`)) {
      return;
    }

    try {
      await authApi.deleteUser(u.id);
      showToast(`User '${u.username}' deleted.`);
      setUsers((prev) => prev.filter((item) => item.id !== u.id));
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete user.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.username.toLowerCase().includes(q) ||
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q));

    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex flex-col w-full gap-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-slate-900 text-white shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-slate-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Shield className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                User Directory &amp; RBAC Control
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Add employees, assign roles (Managers, Kitchen, Waiters, Accountants), and set monthly salaries.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Staff Account</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username, name, or phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-teal-700"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500">Filter Role:</span>
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs">
            {['All', 'admin', 'manager', 'kitchen', 'waiter', 'accountant'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all ${
                  roleFilter === r
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'All' ? 'All Roles' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 font-mono">
              <tr>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Role &amp; Portal Rights</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4 text-right">Monthly Salary</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleConfig = ROLE_LABELS[u.role] || ROLE_LABELS.manager;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs uppercase">
                            {u.username.slice(0, 2)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{u.fullName || u.username}</span>
                            <span className="text-[11px] text-slate-400 font-mono">@{u.username}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${roleConfig.badge}`}>
                            {roleConfig.label}
                          </span>
                          <span className="text-[10px] text-slate-400">{roleConfig.desc}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div>{u.email || '—'}</div>
                        <div className="text-slate-400">{u.phone || '—'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-xs">
                        PKR {Number(u.salary || 0).toLocaleString('en-PK')}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-semibold border border-teal-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
                          <span>Active</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit User Rights & Salary"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Terminate Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingUser ? `Edit Rights: @${editingUser.username}` : 'Provision New Staff User'}
                  </h3>
                  <p className="text-xs text-slate-400">Configure role access, credentials, and monthly wage</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="e.g. chef_ahmad"
                    required
                    disabled={!!editingUser}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {editingUser ? 'New Password (Leave blank to keep)' : 'Initial Password *'}
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                    required={!editingUser}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="e.g. Ahmad Raza"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Role &amp; Portal *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-teal-700 cursor-pointer"
                  >
                    <option value="manager">Event Manager (Floor Ops)</option>
                    <option value="kitchen">Kitchen Staff &amp; Chef</option>
                    <option value="waiter">Waiter / Floor Staff Kiosk</option>
                    <option value="accountant">Accountant (General Ledger)</option>
                    <option value="admin">Admin / Owner (Full Access)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Salary (PKR)</label>
                  <input
                    type="number"
                    value={formSalary}
                    onChange={(e) => setFormSalary(e.target.value)}
                    placeholder="45000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="employee@banquet.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : editingUser ? 'Update Account' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

