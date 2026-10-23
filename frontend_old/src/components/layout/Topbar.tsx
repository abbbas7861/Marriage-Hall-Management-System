import React, { useState } from 'react';
import {
  Search,
  Bell,
  User,
  ChevronDown,
  Menu as MenuIcon,
  CheckCircle2,
  Shield,
  LogOut,
  Sliders,
} from 'lucide-react';

interface TopbarProps {
  onToggleMobileMenu: () => void;
  searchValue: string;
  onSearchChange: (val: string) => void;
  activeModule?: string;
  onSelectTabletView?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleMobileMenu,
  searchValue,
  onSearchChange,
  activeModule,
  onSelectTabletView,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4 lg:px-6">
      {/* Left side: Hamburger (mobile), Title & Status, Global Search */}
      <div className="flex items-center gap-3 lg:gap-4 flex-1">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="font-semibold text-sm text-slate-900 hidden sm:inline font-['Plus_Jakarta_Sans']">
            Marriage Hall Management System
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200/60 text-teal-800 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse"></span>
            <span>Online</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative max-w-md w-full ml-1 sm:ml-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search bookings, customers, halls, invoices..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-700 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right side: Tablet Quick Toggle, Notifications & Operations Console */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {onSelectTabletView && (
          <button
            type="button"
            onClick={onSelectTabletView}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              activeModule === 'staff'
                ? 'bg-[#131b2e] text-teal-300 border-[#131b2e] shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Floor Staff Tablet Mode"
          >
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            <span>Tablet View</span>
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsNotificationOpen(!isNotificationOpen);
              setIsProfileOpen(false);
            }}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-semibold text-slate-800">Operational Alerts</span>
                <span className="text-[10px] text-teal-700 font-mono">0 Pending</span>
              </div>
              <p className="text-xs text-slate-400 py-3 text-center">
                All venue channels healthy. No alerts requiring intervention.
              </p>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-slate-200"></div>

        {/* Profile Dropdown */}
        <div className="relative">
          <div
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationOpen(false);
            }}
            className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-full bg-[#00685f] flex items-center justify-center text-white shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-semibold text-xs text-slate-800 leading-tight">
                Operations Console
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                [Admin / Operator]
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          </div>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 mb-2">
                <div className="w-9 h-9 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                  OP
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">
                    Operations Console
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    cluster-admin@mhms.ops
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-xs text-slate-600">
                <div className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-50 cursor-pointer">
                  <Shield className="w-3.5 h-3.5 text-teal-700" />
                  <span>Security &amp; RBAC Access</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-50 cursor-pointer">
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>Venue Preferences</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono">Node: CLUSTER-09</span>
                <span className="text-teal-700 font-semibold">Active</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
