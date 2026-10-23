import React from 'react';
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Calendar,
  Users,
  PartyPopper,
  Utensils,
  Package,
  Receipt,
  DollarSign,
  BadgeCheck,
  Store,
  BarChart3,
  History,
  Settings,
  Lock,
  Building,
} from 'lucide-react';
import { NavModuleId } from '../../types';

interface SidebarProps {
  activeModule: NavModuleId;
  onSelectModule: (id: NavModuleId) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  isOpenMobile,
  onCloseMobile,
}) => {
  const mainNav = [
    { id: 'dashboard' as NavModuleId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'halls' as NavModuleId, label: 'Halls', icon: Building2 },
    { id: 'bookings' as NavModuleId, label: 'Bookings', icon: CalendarDays },
    { id: 'calendar' as NavModuleId, label: 'Calendar', icon: Calendar },
    { id: 'customers' as NavModuleId, label: 'Customers', icon: Users },
    { id: 'events' as NavModuleId, label: 'Events', icon: PartyPopper },
    { id: 'menu' as NavModuleId, label: 'Menu', icon: Utensils },
    { id: 'inventory' as NavModuleId, label: 'Inventory', icon: Package },
  ];

  const financeNav = [
    { id: 'payments' as NavModuleId, label: 'Invoices & Payments', icon: Receipt },
    { id: 'expenses' as NavModuleId, label: 'Expenses', icon: DollarSign },
    { id: 'staff' as NavModuleId, label: 'Staff & Vendors', icon: Users },
    { id: 'vendors' as NavModuleId, label: 'Vendors', icon: Store },
  ];

  const governanceNav = [
    { id: 'reports' as NavModuleId, label: 'Reports', icon: BarChart3 },
    { id: 'audit-logs' as NavModuleId, label: 'Audit Logs', icon: History },
    { id: 'settings' as NavModuleId, label: 'Settings', icon: Settings },
  ];

  const renderNavGroup = (items: typeof mainNav, groupTitle?: string) => (
    <div className="flex flex-col gap-1 mb-3">
      {groupTitle && (
        <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {groupTitle}
        </div>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeModule === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onSelectModule(item.id);
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
              isActive
                ? 'bg-[#00685f] text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-[#131b2e] text-slate-200 z-50 flex flex-col justify-between border-r border-slate-700/30 transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="h-16 px-4 flex items-center gap-3 border-b border-slate-700/30 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-[#00685f] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Building className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-white tracking-tight font-['Plus_Jakarta_Sans'] truncate">
                MHMS Enterprise
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest truncate">
                Venue Operations
              </span>
            </div>
          </div>

          {/* Navigation Links Scrollable Area */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {renderNavGroup(mainNav, 'Main Navigation')}
            <div className="my-2 border-t border-slate-700/30"></div>
            {renderNavGroup(financeNav, 'Finance & Personnel')}
            <div className="my-2 border-t border-slate-700/30"></div>
            {renderNavGroup(governanceNav, 'System Governance')}
          </div>
        </div>

        {/* Footer Build Status */}
        <div className="p-3.5 border-t border-slate-700/30 shrink-0 bg-[#0f172a]/60">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span>v3.4.2 Core Build</span>
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>
      </aside>
    </>
  );
};
