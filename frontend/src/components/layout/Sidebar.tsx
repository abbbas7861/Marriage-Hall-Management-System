import React from 'react';
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Calendar,
  UtensilsCrossed,
  Users,
  Settings,
  ClipboardCheck,
  Receipt,
  UserCheck,
  ChefHat,
  Package,
  BookOpen,
  FileText,
  Wallet,
  BarChart3,
  ConciergeBell,
  Clock,
  LayoutGrid,
  X,
} from 'lucide-react';
import type { UserRole } from '../auth/LoginScreen';

export interface RoleNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: string;
}

export const ROLE_NAV_ITEMS: Record<UserRole, RoleNavItem[]> = {
  Admin: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'halls-registry', label: 'Halls Registry', icon: Building2 },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays },
    { id: 'master-calendar', label: 'Master Calendar', icon: Calendar },
    { id: 'menu-packages', label: 'Menu Packages', icon: UtensilsCrossed },
    { id: 'financial-reports', label: 'Financial Reports', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
  Manager: [
    // Core Operations
    { id: 'event-control-center', label: 'Event Control Center', icon: LayoutGrid, section: 'Core Operations' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Core Operations' },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays, section: 'Core Operations' },
    { id: 'master-calendar', label: 'Master Calendar', icon: Calendar, section: 'Core Operations' },
    { id: 'assigned-events', label: 'Assigned Events', icon: ClipboardCheck, section: 'Core Operations' },
    // Floor Command
    { id: 'table-monitoring', label: 'Table Monitoring', icon: LayoutGrid, section: 'Floor Command' },
    { id: 'refill-dispatcher', label: 'Refill Dispatcher', icon: ConciergeBell, section: 'Floor Command' },
    { id: 'overtime-request', label: 'Overtime Request', icon: Clock, section: 'Floor Command' },
    // Venue & Catering
    { id: 'halls-registry', label: 'Halls Registry', icon: Building2, section: 'Venue & Catering' },
    { id: 'menu-packages', label: 'Menu Packages', icon: UtensilsCrossed, section: 'Venue & Catering' },
    // Management
    { id: 'staff-rosters', label: 'Staff Rosters', icon: UserCheck, section: 'Management' },
    { id: 'final-settlement', label: 'Final Settlement', icon: Receipt, section: 'Management' },
    // System
    { id: 'users', label: 'Users', icon: Users, section: 'System' },
    { id: 'settings', label: 'Settings', icon: Settings, section: 'System' },
  ],
  Kitchen: [
    { id: 'dashboard', label: 'Kitchen Dashboard', icon: LayoutDashboard },
    { id: 'kitchen-display', label: 'Kitchen Display (KDS)', icon: ChefHat },
    { id: 'event-requisitions', label: 'Event Requisitions', icon: ClipboardCheck },
    { id: 'pantry-inventory', label: 'Pantry Inventory', icon: Package },
  ],
  Accounts: [
    { id: 'dashboard', label: 'Accounts Dashboard', icon: LayoutDashboard },
    { id: 'event-tracker', label: 'Event Tracker', icon: Receipt },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'expenses', label: 'Expenses', icon: Wallet },
    { id: 'financial-reports', label: 'Financial Reports', icon: BarChart3 },
  ],
};

interface SidebarProps {
  activeRole: UserRole;
  activeNavId: string;
  onSelectNav: (id: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeRole,
  activeNavId,
  onSelectNav,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const navItems = ROLE_NAV_ITEMS[activeRole];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px] lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-slate-200/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm text-slate-900 tracking-tight font-['Plus_Jakarta_Sans'] whitespace-nowrap truncate">
              Marriage Hall ERP
            </span>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label={`${activeRole} navigation`}>
          <div className="px-2.5 pb-2 text-xs font-medium text-slate-400">
            {activeRole} Portal
          </div>

          <ul className="space-y-0.5">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeNavId === item.id;
              const prevSection = idx > 0 ? navItems[idx - 1].section : undefined;
              const showSectionHeader = item.section && item.section !== prevSection;
              return (
                <React.Fragment key={item.id}>
                  {showSectionHeader && (
                    <li className={`${idx > 0 ? 'pt-4' : 'pt-1'} pb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400`}>
                      {item.section}
                    </li>
                  )}
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectNav(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors text-left cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-teal-50 text-teal-800 font-medium'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-normal'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-teal-700' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                </React.Fragment>
              );
            })}
          </ul>
        </nav>

        {/* Quiet Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200/80 text-xs text-slate-400 shrink-0">
          {activeRole} Workspace
        </div>
      </aside>
    </>
  );
};
