import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Sidebar, ROLE_NAV_ITEMS } from './Sidebar';
import { Topbar } from './Topbar';
import { HallsRegistryPage } from '../modules/HallsRegistryPage';
import { BookingsManagementPage } from '../modules/BookingsManagementPage';
import { ManagerEventSettlementPage } from '../modules/ManagerEventSettlementPage';
import { KitchenPortalPage } from '../modules/KitchenPortalPage';
import { FloorCommandPage } from '../modules/FloorCommandPage';
import { MenuPackagesPage } from '../modules/MenuPackagesPage';
import { MasterCalendarPage } from '../modules/MasterCalendarPage';
import { UserManagementPage } from '../modules/UserManagementPage';
import { SettingsConfigurationPage } from '../modules/SettingsConfigurationPage';
import { StaffRostersPage } from '../modules/StaffRostersPage';
import { InvoicesBillingPage } from '../modules/InvoicesBillingPage';
import { ExpensesManagementPage } from '../modules/ExpensesManagementPage';
import { FinancialReportsPage } from '../modules/FinancialReportsPage';
import { EventControlCenterPage } from '../modules/EventControlCenterPage';
import { KitchenRequisitionsPage } from '../modules/KitchenRequisitionsPage';
import { EventProfitabilityTrackerPage } from '../modules/EventProfitabilityTrackerPage';
import { AdminExecutiveDashboard } from '../dashboard/AdminExecutiveDashboard';
import { AccountsDashboard } from '../dashboard/AccountsDashboard';
import { ManagerDashboard } from '../dashboard/ManagerDashboard';
import { KitchenDashboard } from '../dashboard/KitchenDashboard';
import type { UserRole } from '../auth/LoginScreen';

interface MainLayoutProps {
  activeRole: UserRole;
  userIdentifier: string;
  onSignOut: () => void;
}

const ROLE_SHORTCUT_DESCRIPTIONS: Record<UserRole, Record<string, string>> = {
  Admin: {
    'halls-registry': 'Configure halls, capacities, and venue amenities.',
    bookings: 'Review and manage event reservations.',
    'master-calendar': 'View hall availability across all dates.',
    'menu-packages': 'Maintain catering menus and package tiers.',
    'financial-reports': 'Review revenue, expense, and profitability summaries.',
    users: 'Manage staff accounts and role permissions.',
    settings: 'Configure organization profile, tax compliance, and system preferences.',
  },
  Manager: {
    bookings: 'Review and manage event reservations and contracts.',
    'master-calendar': 'View hall availability and block maintenance dates.',
    'assigned-events': 'View events assigned to your supervision and live execution.',
    'table-monitoring': 'Track live banquet table status and guest seating.',
    'refill-dispatcher': 'Dispatch food and beverage refill requests to the kitchen.',
    'overtime-request': 'Submit and track event overtime extension requests.',
    'halls-registry': 'Configure halls, capacities, and venue amenities.',
    'menu-packages': 'Maintain catering menus and per-head package tiers.',
    'staff-rosters': 'Coordinate floor shifts and duty allocations.',
    'final-settlement': 'Record post-event charges and finalize billing settlements.',
    users: 'Manage staff accounts and system roles.',
    settings: 'Configure business profile and operational preferences.',
  },
  Kitchen: {
    'kitchen-display': 'Manage live floor requests and active cooking stations.',
    'pantry-inventory': 'Track raw ingredient stock levels and log kitchen usage.',
  },
  Accounts: {
    invoices: 'Issue client invoices and monitor billing status.',
    expenses: 'Record operational and vendor expenses.',
    'financial-reports': 'Access revenue and financial summaries.',
  },
};

export const MainLayout: React.FC<MainLayoutProps> = ({
  activeRole,
  userIdentifier,
  onSignOut,
}) => {
  const getDefaultNavId = (role: UserRole): string => {
    if (role === 'Kitchen') return 'kitchen-display';
    if (role === 'Manager') return 'event-control-center';
    return 'dashboard';
  };

  const [activeNavId, setActiveNavId] = useState<string>(() => getDefaultNavId(activeRole));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setActiveNavId(getDefaultNavId(activeRole));
  }, [activeRole]);

  const navItems = ROLE_NAV_ITEMS[activeRole];
  const activeItem = navItems.find((item) => item.id === activeNavId) || navItems[0];
  const shortcutItems = navItems.filter((item) => item.id !== 'dashboard');

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 flex flex-col antialiased selection:bg-teal-100 selection:text-teal-900">
      <Sidebar
        activeRole={activeRole}
        activeNavId={activeNavId}
        onSelectNav={setActiveNavId}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Topbar
          user={{ identifier: userIdentifier, role: activeRole }}
          activeLabel={activeItem.label}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          onSignOut={onSignOut}
          onNavigate={setActiveNavId}
        />

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {activeRole === 'Admin' && activeNavId === 'dashboard' ? (
            <AdminExecutiveDashboard />
          ) : activeRole === 'Admin' && activeNavId === 'halls-registry' ? (
            <HallsRegistryPage />
          ) : activeRole === 'Admin' && activeNavId === 'bookings' ? (
            <BookingsManagementPage />
          ) : activeRole === 'Admin' && activeNavId === 'master-calendar' ? (
            <MasterCalendarPage />
          ) : activeRole === 'Admin' && activeNavId === 'menu-packages' ? (
            <MenuPackagesPage />
          ) : activeRole === 'Admin' && activeNavId === 'financial-reports' ? (
            <FinancialReportsPage />
          ) : activeRole === 'Admin' && activeNavId === 'users' ? (
            <UserManagementPage />
          ) : activeRole === 'Admin' && activeNavId === 'settings' ? (
            <SettingsConfigurationPage />
          ) : activeRole === 'Manager' && activeNavId === 'event-control-center' ? (
            <EventControlCenterPage />
          ) : activeRole === 'Manager' && activeNavId === 'dashboard' ? (
            <ManagerDashboard onNavigate={setActiveNavId} />
          ) : activeRole === 'Manager' && activeNavId === 'bookings' ? (
            <BookingsManagementPage />
          ) : activeRole === 'Manager' && activeNavId === 'master-calendar' ? (
            <MasterCalendarPage />
          ) : activeRole === 'Manager' && activeNavId === 'assigned-events' ? (
            <ManagerEventSettlementPage initialView="list" />
          ) : activeRole === 'Manager' && activeNavId === 'table-monitoring' ? (
            <FloorCommandPage view="tables" />
          ) : activeRole === 'Manager' && activeNavId === 'refill-dispatcher' ? (
            <FloorCommandPage view="refill" />
          ) : activeRole === 'Manager' && activeNavId === 'overtime-request' ? (
            <FloorCommandPage view="overtime" />
          ) : activeRole === 'Manager' && activeNavId === 'halls-registry' ? (
            <HallsRegistryPage />
          ) : activeRole === 'Manager' && activeNavId === 'menu-packages' ? (
            <MenuPackagesPage />
          ) : activeRole === 'Manager' && activeNavId === 'staff-rosters' ? (
            <StaffRostersPage />
          ) : activeRole === 'Manager' && activeNavId === 'final-settlement' ? (
            <ManagerEventSettlementPage initialView="settlement" />
          ) : activeRole === 'Manager' && activeNavId === 'users' ? (
            <UserManagementPage />
          ) : activeRole === 'Manager' && activeNavId === 'settings' ? (
            <SettingsConfigurationPage />
          ) : activeRole === 'Kitchen' && activeNavId === 'dashboard' ? (
            <KitchenDashboard onNavigate={setActiveNavId} />
          ) : activeRole === 'Kitchen' && activeNavId === 'kitchen-display' ? (
            <KitchenPortalPage view="kds" />
          ) : activeRole === 'Kitchen' && activeNavId === 'event-requisitions' ? (
            <KitchenRequisitionsPage />
          ) : activeRole === 'Kitchen' && activeNavId === 'pantry-inventory' ? (
            <KitchenPortalPage view="pantry" />
          ) : activeRole === 'Accounts' && activeNavId === 'dashboard' ? (
            <AccountsDashboard />
          ) : activeRole === 'Accounts' && activeNavId === 'event-tracker' ? (
            <EventProfitabilityTrackerPage />
          ) : activeRole === 'Accounts' && activeNavId === 'invoices' ? (
            <InvoicesBillingPage />
          ) : activeRole === 'Accounts' && activeNavId === 'expenses' ? (
            <ExpensesManagementPage />
          ) : activeRole === 'Accounts' && activeNavId === 'financial-reports' ? (
            <FinancialReportsPage />
          ) : activeNavId === 'dashboard' ? (
            <div className="space-y-8">
              {/* Role Portal Placeholder Card */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans']">
                  {activeRole} Portal
                </h1>
                <p className="text-sm text-slate-500 mt-2">
                  Welcome to the {activeRole} workspace.
                </p>
              </div>

              {/* Role-Specific Shortcut Cards */}
              <div>
                <h2 className="text-xs font-medium text-slate-500 mb-3">
                  Quick Shortcuts
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shortcutItems.map((item) => {
                    const Icon = item.icon;
                    const description =
                      ROLE_SHORTCUT_DESCRIPTIONS[activeRole]?.[item.id] ||
                      `Open ${item.label}.`;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveNavId(item.id)}
                        className="group bg-white rounded-xl border border-slate-200/90 hover:border-teal-600/40 p-5 text-left transition-colors cursor-pointer flex flex-col justify-between gap-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-50 group-hover:bg-teal-50 text-slate-500 group-hover:text-teal-700 flex items-center justify-center shrink-0 transition-colors">
                            <Icon className="w-4 h-4" />
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-700 transition-colors shrink-0 mt-1" />
                        </div>

                        <div>
                          <div className="text-sm font-medium text-slate-900 group-hover:text-teal-800 transition-colors">
                            {item.label}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Clean Empty-State Placeholder for Selected Sidebar Section */
            <div className="bg-white rounded-xl border border-slate-200/90 p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <activeItem.icon className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans']">
                    {activeItem.label}
                  </h1>
                  <p className="text-xs text-slate-500">
                    {activeRole} Portal
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-start gap-4">
                <p className="text-sm text-slate-500">
                  No records available in {activeItem.label} yet.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveNavId('dashboard')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  <span>Back to {activeRole} Portal</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
