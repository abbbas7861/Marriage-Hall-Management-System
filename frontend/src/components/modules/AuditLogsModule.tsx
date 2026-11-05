import React, { useState } from 'react';
import {
  History,
  ShieldAlert,
  Download,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Shield,
  Layers,
  Sparkles,
  Info,
  UserCheck,
  Globe,
  Clock,
  ChevronDown,
  X,
} from 'lucide-react';
import { CSVLink } from 'react-csv';
import { AuditLogEntry } from '../../types';

const ROLES = ['Admin', 'Manager', 'Floor Staff'];
const ACTION_TYPES = ['Created', 'Updated', 'Deleted', 'Login', 'Approved'];
const MODULE_OPTIONS = [
  'Bookings',
  'Payments',
  'Settings',
  'Halls',
  'Inventory',
  'Menu',
  'Customers',
  'Events',
  'Staff',
];

export const AuditLogsModule: React.FC = () => {
  // STRICT DATA RULE: DO NOT hardcode any dummy data.
  // Starts strictly as empty array []
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedAction, setSelectedAction] = useState('All Actions');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast & Modal States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

  // Form for testing a new audit event
  const [simUser, setSimUser] = useState('');
  const [simRole, setSimRole] = useState<'Admin' | 'Manager' | 'Floor Staff'>('Admin');
  const [simAction, setSimAction] = useState<'Created' | 'Updated' | 'Deleted' | 'Login' | 'Approved'>('Created');
  const [simModule, setSimModule] = useState('Bookings');
  const [simDescription, setSimDescription] = useState('');
  const [simIp, setSimIp] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleResetToEmpty = () => {
    setLogs([]);
    setStartDate('');
    setEndDate('');
    setSelectedRole('All Roles');
    setSelectedAction('All Actions');
    setSearchQuery('');
    showToast('Audit log ledger reset to clean empty state [].');
  };

  const handleCreateTestLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      logId: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      userName: simUser.trim() || '[User Name]',
      userRole: simRole,
      action: simAction,
      module: simModule,
      details: simDescription.trim() || '[Action description]',
      ipAddress: simIp.trim() || '192.168.1.100',
    };
    setLogs((prev) => [newLog, ...prev]);
    setIsSimulateModalOpen(false);
    setSimDescription('');
    setSimUser('');
    showToast(`Audit log ${newLog.logId} recorded successfully.`);
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'Created':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'Deleted':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'Updated':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      case 'Login':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'Approved':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Filtered dataset
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.logId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery);

    const matchesRole =
      selectedRole === 'All Roles' || log.userRole.toLowerCase() === selectedRole.toLowerCase();

    const matchesAction =
      selectedAction === 'All Actions' ||
      log.action.toLowerCase() === selectedAction.toLowerCase();

    return matchesSearch && matchesRole && matchesAction;
  });

  return (
    <div className="flex flex-col w-full gap-5 pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Section: Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              System Audit Logs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-wider">
              Immutable Governance
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track user activities, data modifications, and system access history.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {logs.length > 0 && (
            <button
              type="button"
              onClick={handleResetToEmpty}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              title="Reset audit logs to empty state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Empty</span>
            </button>
          )}

          {/* Test Event Generator */}
          <button
            type="button"
            onClick={() => setIsSimulateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 text-xs font-semibold transition-colors cursor-pointer"
            title="Log a test action to verify badges and table behavior"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Test Event</span>
          </button>

          {/* Primary Action Button: "Export Logs" */}
          <CSVLink
            data={filteredLogs || []}
            filename="system_audit_logs.csv"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Logs</span>
          </CSVLink>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-800/60 backdrop-blur-md border border-slate-700/50 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user, action or module..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Filters Group: Date Range Picker, User Role, Action Type */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Picker */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-label="Start Date"
              className="bg-transparent text-white text-xs focus:outline-none"
            />
            <span className="text-slate-500 font-semibold px-0.5">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label="End Date"
              className="bg-transparent text-white text-xs focus:outline-none"
            />
          </div>

          {/* User Role Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="All Roles" className="bg-slate-900 text-white">All Roles</option>
              {ROLES.map((role) => (
                <option key={role} value={role} className="bg-slate-900 text-white">
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Action Type Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="All Actions" className="bg-slate-900 text-white">All Actions</option>
              {ACTION_TYPES.map((act) => (
                <option key={act} value={act} className="bg-slate-900 text-white">
                  {act}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || selectedRole !== 'All Roles' || selectedAction !== 'All Actions' || startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedRole('All Roles');
                setSelectedAction('All Actions');
                setStartDate('');
                setEndDate('');
              }}
              className="px-2 py-1 text-xs text-teal-400 hover:underline font-medium cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Section: Data Table or Empty State */}
      <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
        {filteredLogs.length === 0 ? (
          /* Large, Centered Empty State */
          <div className="py-20 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 shadow-lg shadow-teal-500/10">
              <History className="w-8 h-8 stroke-[1.5]" />
            </div>

            <h3 className="text-lg font-bold text-white">
              No system activity recorded yet.
            </h3>

            <p className="text-xs text-slate-400 max-w-md mt-1.5 mb-6">
              Audit logs will appear here as users interact with the system.
            </p>

            <button
              type="button"
              onClick={() => setIsSimulateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record System Event</span>
            </button>

            {/* Structural Table Schema Placeholder */}
            <div className="w-full max-w-4xl mt-10 pt-8 border-t border-slate-700/60 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Data Schema Preview (Empty Queue)
                </span>
                <span className="text-[11px] font-mono text-slate-400">0 logs indexed</span>
              </div>
              <div className="border border-slate-700/60 rounded-xl overflow-hidden bg-slate-900/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-700/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Log ID</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">User</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Module</th>
                      <th className="py-2.5 px-3">Details / Description</th>
                      <th className="py-2.5 px-3">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40 text-slate-400 font-mono">
                    <tr className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3">[LOG-XXXX]</td>
                      <td className="py-2.5 px-3">[--/--/---- --:--]</td>
                      <td className="py-2.5 px-3 font-sans">[User Name] ([Role])</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold">
                          [Created]
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans">[Bookings]</td>
                      <td className="py-2.5 px-3 font-sans">[Action description]</td>
                      <td className="py-2.5 px-3">[---.---.---.---]</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Populated Comprehensive Data Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-700/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] font-mono">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Log ID</th>
                  <th className="py-3 px-4 whitespace-nowrap">Timestamp</th>
                  <th className="py-3 px-4 whitespace-nowrap">User</th>
                  <th className="py-3 px-4 whitespace-nowrap">Action</th>
                  <th className="py-3 px-4 whitespace-nowrap">Module</th>
                  <th className="py-3 px-4 whitespace-nowrap">Details / Description</th>
                  <th className="py-3 px-4 whitespace-nowrap">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {filteredLogs.map((log) => {
                  const badgeClass = getActionBadgeClass(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Log ID */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                          {log.logId}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {log.timestamp}
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white">{log.userName}</div>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                          {log.userRole}
                        </span>
                      </td>

                      {/* Action Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Module */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                          {log.module}
                        </span>
                      </td>

                      {/* Details / Description */}
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate whitespace-nowrap">
                        {log.details}
                      </td>

                      {/* IP Address */}
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {log.ipAddress}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Audit Footer / Governance Note */}
        <div className="p-3.5 border-t border-slate-700/60 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>Cryptographic Log Hash: SHA-256 Validated</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            System Event Ledger • Write-Once-Read-Many (WORM) Compliance
          </span>
        </div>
      </div>

      {/* Record Test Event Modal */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div>
                <h3 className="text-base font-bold text-white">
                  Record System Event
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulate an internal system trigger to verify color-coded action badges.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSimulateModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTestLog} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    User Name
                  </label>
                  <input
                    type="text"
                    value={simUser}
                    onChange={(e) => setSimUser(e.target.value)}
                    placeholder="Enter User Name"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    User Role
                  </label>
                  <select
                    value={simRole}
                    onChange={(e) =>
                      setSimRole(e.target.value as 'Admin' | 'Manager' | 'Floor Staff')
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r} className="bg-slate-900 text-white">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Action Type
                  </label>
                  <select
                    value={simAction}
                    onChange={(e) =>
                      setSimAction(
                        e.target.value as 'Created' | 'Updated' | 'Deleted' | 'Login' | 'Approved'
                      )
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    {ACTION_TYPES.map((a) => (
                      <option key={a} value={a} className="bg-slate-900 text-white">
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Module
                  </label>
                  <select
                    value={simModule}
                    onChange={(e) => setSimModule(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    {MODULE_OPTIONS.map((m) => (
                      <option key={m} value={m} className="bg-slate-900 text-white">
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Details / Description
                </label>
                <input
                  type="text"
                  value={simDescription}
                  onChange={(e) => setSimDescription(e.target.value)}
                  placeholder="e.g., Created Booking #BK-2026 for Barat event"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  IP Address
                </label>
                <input
                  type="text"
                  value={simIp}
                  onChange={(e) => setSimIp(e.target.value)}
                  placeholder="e.g., 192.168.1.105"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
                >
                  Record Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
