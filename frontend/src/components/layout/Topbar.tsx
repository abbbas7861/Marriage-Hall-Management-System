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
  Crown,
  Briefcase,
  ChefHat,
  Smartphone,
  Truck,
  Landmark,
  Lock,
} from 'lucide-react';
import { AuthUser, PortalType } from '../../types';
import { PORTAL_CONFIGS } from '../../config/portals';

interface TopbarProps {
  onToggleMobileMenu: () => void;
  searchValue: string;
  onSearchChange: (val: string) => void;
  activeModule?: string;
  onSelectTabletView?: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  activePortal: PortalType;
  onSelectPortal: (portal: PortalType) => void;
  allowedPortals: PortalType[];
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleMobileMenu,
  searchValue,
  onSearchChange,
  activeModule,
  onSelectTabletView,
  currentUser,
  onLogout,
  activePortal,
  onSelectPortal,
  allowedPortals,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications] = useState<any[]>([]);

  const userInitials = currentUser?.fullName
    ? currentUser.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD';

  const portalKeys: PortalType[] = ['admin', 'manager', 'kitchen', 'waiter', 'vendors', 'finance'];

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 z-40 flex items-center justify-between px-3 sm:px-4 lg:px-6 shadow-xs">
      {/* Left side: Hamburger (mobile), Title, and 6 Portal Tabs */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden shrink-0"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        {/* 6 Portal Tabs (Glassmorphic Luxury Pill Switcher) */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 no-scrollbar shrink-0">
          {portalKeys.map((pKey) => {
            const config = PORTAL_CONFIGS[pKey];
            const Icon = config.icon;
            const isActive = activePortal === pKey;
            const isAllowed = allowedPortals.includes(pKey);

            return (
              <button
                key={pKey}
                type="button"
                disabled={!isAllowed}
                onClick={() => isAllowed && onSelectPortal(pKey)}
                title={isAllowed ? `${config.name}: ${config.description}` : 'Access restricted by Administrator'}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-800'
                    : isAllowed
                    ? 'bg-slate-100/80 hover:bg-slate-200/90 text-slate-700 hover:text-slate-900'
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="hidden md:inline">{config.shortName}</span>
                {!isAllowed && <Lock className="w-2.5 h-2.5 text-slate-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Global Search Bar */}
        <div className="relative max-w-xs sm:max-w-sm w-full hidden xl:block ml-2">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search venue records..."
            className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-700 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right side: Superuser Indicator, Notifications & Operations Console */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
        {/* Admin Impersonation / Superuser Notice */}
        {currentUser?.role === 'admin' && activePortal !== 'admin' && (
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
            <Crown className="w-3 h-3 text-amber-600" />
            <span>Admin Impersonation: {PORTAL_CONFIGS[activePortal].shortName}</span>
          </div>
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
            {notifications && notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            )}
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
            <div className="w-8 h-8 rounded-full bg-[#00685f] flex items-center justify-center text-white shadow-xs font-bold text-xs">
              {userInitials}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-semibold text-xs text-slate-800 leading-tight">
                {currentUser?.fullName || currentUser?.username || 'Administrator'}
              </span>
              <span className="text-[10px] text-teal-700 font-mono font-semibold uppercase">
                [{currentUser?.role || 'Admin'}]
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          </div>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 mb-2">
                <div className="w-9 h-9 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                  {userInitials}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {currentUser?.fullName || currentUser?.username || 'Administrator'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono truncate">
                    {currentUser?.email || `${currentUser?.username || 'admin'}@hall.local`}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-xs text-slate-600">
                <div className="flex items-center justify-between p-1.5 rounded-md bg-slate-50">
                  <span className="text-slate-500 font-medium">Assigned Role</span>
                  <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold uppercase text-[10px]">
                    {currentUser?.role || 'Admin'}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-50 cursor-pointer">
                  <Shield className="w-3.5 h-3.5 text-teal-700" />
                  <span>Security &amp; RBAC Access</span>
                </div>
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full mt-1 flex items-center gap-2 p-1.5 rounded-md hover:bg-rose-50 text-rose-600 font-semibold cursor-pointer transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono">Status: Authenticated</span>
                <span className="text-teal-700 font-semibold">Active</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
