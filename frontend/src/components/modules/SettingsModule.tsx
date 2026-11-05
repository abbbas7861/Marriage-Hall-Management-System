import React, { useState } from 'react';
import {
  KeyRound,
  HelpCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Server,
  Mail,
  BookOpen,
  ExternalLink,
} from 'lucide-react';

type SettingsTab = 'security' | 'support';

export const SettingsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('security');

  // Security & Password Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password updated successfully.');
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Section: Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Venue Settings &amp; Security
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-wider">
              Governance
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage your authentication credentials, session security, system version details, and technical support.
          </p>
        </div>
      </div>

      {/* Main Section: Tabbed Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Tab Navigation Menu */}
        <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-1.5 bg-slate-800/60 backdrop-blur-md p-2 rounded-2xl border border-slate-700/50 shadow-xl overflow-x-auto">
          {/* Tab 1: Security */}
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <KeyRound className={`w-4 h-4 ${activeTab === 'security' ? 'text-white' : 'text-rose-400'}`} />
            <span>Security</span>
          </button>

          {/* Tab 2: Support */}
          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
              activeTab === 'support'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className={`w-4 h-4 ${activeTab === 'support' ? 'text-white' : 'text-purple-400'}`} />
            <span>Support</span>
          </button>
        </div>

        {/* Tab Content Cards */}
        <div className="flex-1 w-full">
          {/* TAB 1: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden animate-in fade-in duration-150">
              <div className="p-5 border-b border-slate-700/60 bg-slate-900/80">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-rose-400" />
                  <span>Security &amp; Password</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update your authentication credentials and manage session password security.
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="p-6 space-y-5 max-w-xl">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 pr-10 text-xs font-mono rounded-lg border border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 pr-10 text-xs font-mono rounded-lg border border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Must be at least 6 characters long.</p>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 pr-10 text-xs font-mono rounded-lg border border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SUPPORT & SYSTEM INFO */}
          {activeTab === 'support' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* System Version & Spec Card */}
              <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
                <div className="p-5 border-b border-slate-700/60 bg-slate-900/80 flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-teal-400" />
                    <span>System Information</span>
                  </h2>
                  <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-teal-500/10 text-teal-300 border border-teal-500/30">
                    System Version: v3.5 Enterprise
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Core Edition
                      </span>
                      <div className="text-base font-bold text-white mt-1">
                        Marriage Hall ERP Suite
                      </div>
                      <span className="text-[11px] text-teal-400 mt-1 block">Release 2026.3 LTS</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        API Gateway Status
                      </span>
                      <div className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Connected &amp; Online</span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">Django REST Framework v3.15</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Database Engine
                      </span>
                      <div className="text-base font-bold text-white mt-1">
                        ACID SQLite / Production
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">Zero-latency embedded backend</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Support & Documentation Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Support */}
                <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-3">
                      <Mail className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-white">Contact Enterprise Support</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      Need assistance with live hall operations, fiscal integration, or custom feature requests? Our dedicated engineering team is on standby 24/7.
                    </p>
                  </div>

                  <div className="mt-6">
                    <a
                      href="mailto:support@marriagehall-erp.com?subject=Enterprise%20Support%20Request%20v3.5"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email Support</span>
                    </a>
                  </div>
                </div>

                {/* Documentation */}
                <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-white">System Documentation</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      Browse user guides, floor staff tablet operating procedures, recipe formula calibration manuals, and accounting workflows.
                    </p>
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => showToast('Opening enterprise documentation portal...')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      <ExternalLink className="w-4 h-4 text-purple-400" />
                      <span>Documentation</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
