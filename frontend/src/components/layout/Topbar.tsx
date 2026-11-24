import React, { useState } from 'react';
import { Menu, LogOut, GitPullRequest } from 'lucide-react';
import type { AuthUser } from '../auth/LoginScreen';
import { NotificationCenter } from './NotificationCenter';
import { SystemUpdateModal } from '../admin/SystemUpdateModal';

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
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  return (
    <>
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

        {/* Right: Notifications + Account identity + Update Button + Sign Out action */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Admin System Update Button */}
          {user.role === 'Admin' && (
            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
              title="Pull latest updates from GitHub"
            >
              <GitPullRequest className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">Check Update</span>
              <span className="sm:hidden">Update</span>
            </button>
          )}

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

      {/* System Update Modal */}
      {user.role === 'Admin' && (
        <SystemUpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
        />
      )}
    </>
  );
};
