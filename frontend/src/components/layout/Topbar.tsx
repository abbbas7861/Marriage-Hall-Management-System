import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import type { AuthUser } from '../auth/LoginScreen';
import { NotificationCenter } from './NotificationCenter';

interface TopbarProps {
  user: AuthUser;
  activeLabel: string;
  onToggleMobileMenu: () => void;
  onSignOut: () => void;
  onNavigate?: (navId: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  user,
  activeLabel,
  onToggleMobileMenu,
  onSignOut,
  onNavigate,
}) => {
  return (
    <header className="no-print sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      {/* Left: Mobile menu button + Breadcrumb trail */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Open navigation"
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-slate-400 whitespace-nowrap hidden sm:inline">
            {user.role} Portal
          </span>
          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
            /
          </span>
          <span className="font-medium text-slate-900 truncate">
            {activeLabel}
          </span>
        </nav>
      </div>

      {/* Right: Notifications + Account identity + Sign Out action */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <NotificationCenter role={user.role} onNavigate={onNavigate} />

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span className="text-slate-700 font-medium truncate max-w-[180px]">
            {user.identifier}
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span>{user.role}</span>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
