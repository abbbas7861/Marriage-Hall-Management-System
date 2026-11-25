import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Sidebar, ROLE_NAV_ITEMS } from './Sidebar';
import { Topbar } from './Topbar';
import { HallsRegistryPage } from '../modules/HallsRegistryPage';
import { BookingsManagementPage } from '../modules/BookingsManagementPage';
import { ManagerEventSettlementPage } from '../modules/ManagerEventSettlementPage';
import { KitchenPortalPage } from '../modules/KitchenPortalPage';
import { KitchenDisplayScreen } from '../kitchen/KitchenDisplayScreen';
import { KitchenPantryInventory } from '../kitchen/KitchenPantryInventory';
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
import { VendorDirectoryPage } from '../modules/VendorDirectoryPage';
import { ErrorBoundary } from '../common/ErrorBoundary';
import type { UserRole } from '../auth/LoginScreen';

interface MainLayoutProps {
  activeRole: UserRole;
  userIdentifier: string;
  onSignOut: () => void;
}

const ROLE_SHORTCUT_DESCRIPTIONS: Record<UserRole, Record<string, string>> = {
  'Senior Manager': {
    'event-control-center': 'Coordinate active banquet execution and supervisor checkpoints.',
    bookings: 'Create, review, reschedule, or cancel bookings and process refunds.',
    'master-calendar': 'View hall availability across all dates and block maintenance slots.',
    'kitchen-display': 'Direct access to live kitchen display screen and active stations.',
    'event-requisitions': 'Approve or track ingredient requisitions for events.',
    'pantry-inventory': 'Manage pantry inventory, stock arrivals, and cost logging.',
    'event-tracker': 'Inspect per-event profitability, gross margin, and cost breakdowns.',
    invoices: 'Issue client invoices, tax invoices, and record balance payments.',
    expenses: 'Log hall operational overhead and kitchen purchases into Accounts.',
    'financial-reports': 'Analyze business revenue, expenses, and net profit statements.',
    users: 'Manage staff roles, system credentials, and account statuses.',
    settings: 'Configure hall profiles, tax numbers, and system policies.',
  },
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
    if (role === 'Senior Manager') return 'event-control-center';
    if (role === 'Kitchen') return 'kitchen-display';
    if (role === 'Manager') return 'event-control-center';
    return 'dashboard';
  };

  const [activeNavId, setActiveNavId] = useState<string>(() => getDefaultNavId(activeRole));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<{
    date?: string;
    hall?: string;
    slot?: string;
    bookingType?: string;
    customerName?: string;
    eventType?: string;
    guestCount?: string;
  } | null>(null);

  useEffect(() => {
    setActiveNavId(getDefaultNavId(activeRole));
  }, [activeRole]);

  const handleProceedToBooking = (prefill: any) => {
    setBookingPrefill(prefill);
    setActiveNavId('bookings');
  };

  const handleNavigateToCalendar = () => {
    setActiveNavId('master-calendar');
  };

  const navItems = ROLE_NAV_ITEMS[activeRole];
  const activeItem = navItems.find((item) => item.id === activeNavId) || navItems[0];
  const shortcutItems = navItems.filter((item) => item.id !== 'dashboard');

  const renderContent = () => {
    switch (activeNavId) {
      case 'event-control-center':
        return <EventControlCenterPage />;
      case 'kitchen-display':
        return <KitchenDisplayScreen />;
      case 'event-requisitions':
        return <KitchenRequisitionsPage />;
      case 'pantry-inventory':
        return <KitchenPantryInventory />;
      case 'event-tracker':
        return <EventProfitabilityTrackerPage />;
      case 'invoices':
        return <InvoicesBillingPage />;
      case 'expenses':
        return <ExpensesManagementPage />;
      case 'financial-reports':
        return <FinancialReportsPage />;
      case 'bookings':
        return (
          <BookingsManagementPage
            onNavigateToCalendar={handleNavigateToCalendar}
            prefillData={bookingPrefill}
            onClearPrefill={() => setBookingPrefill(null)}
          />
        );
      case 'master-calendar':
        return <MasterCalendarPage onProceedToBooking={handleProceedToBooking} />;
      case 'assigned-events':
        return <ManagerEventSettlementPage initialView="list" />;
      case 'final-settlement':
        return <ManagerEventSettlementPage initialView="settlement" />;
      case 'table-monitoring':
        return <FloorCommandPage view="tables" />;
      case 'refill-dispatcher':
        return <FloorCommandPage view="refill" />;
      case 'overtime-request':
        return <FloorCommandPage view="overtime" />;
      case 'halls-registry':
        return <HallsRegistryPage />;
      case 'menu-packages':
        return <MenuPackagesPage />;
      case 'staff-rosters':
        return <StaffRostersPage />;
      case 'vendors':
        return <VendorDirectoryPage />;
      case 'users':
        return <UserManagementPage />;
      case 'settings':
        return <SettingsConfigurationPage />;
      case 'dashboard':
        if (activeRole === 'Admin') {
          return <AdminExecutiveDashboard onNavigate={setActiveNavId} />;
        }
        if (activeRole === 'Accounts') {
          return <AccountsDashboard onNavigate={setActiveNavId} />;
        }
        if (activeRole === 'Kitchen') {
          return <KitchenDashboard onNavigate={setActiveNavId} />;
        }
        return <ManagerDashboard onNavigate={setActiveNavId} />;
      default:
        return (
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
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-teal-100 selection:text-teal-900">
      <Sidebar
        activeRole={activeRole}
        activeNavId={activeNavId}
        onSelectNav={setActiveNavId}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="lg:pl-64 print:pl-0 flex flex-col min-h-screen">
        <Topbar
          user={{ identifier: userIdentifier, role: activeRole }}
          activeLabel={activeItem.label}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          onSignOut={onSignOut}
          onNavigate={setActiveNavId}
        />

        <main className="flex-1 w-full max-w-6xl print:max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 print:p-0">
          <ErrorBoundary fallbackTitle={`${activeItem.label} Error`}>
            {renderContent()}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
