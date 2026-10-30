import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Dashboard } from '../dashboard/Dashboard';
import { BookingsModule } from '../modules/BookingsModule';
import { HallsModule } from '../modules/HallsModule';
import { CustomersModule } from '../modules/CustomersModule';
import { MenuModule } from '../modules/MenuModule';
import { InventoryModule } from '../modules/InventoryModule';
import { PaymentsModule } from '../modules/PaymentsModule';
import { ExpensesModule } from '../modules/ExpensesModule';
import { ReportsModule } from '../modules/ReportsModule';
import { SettingsModule } from '../modules/SettingsModule';
import { CalendarModule } from '../modules/CalendarModule';
import { FloorStaffTabletView } from '../modules/FloorStaffTabletView';
import { EventsModule } from '../modules/EventsModule';
import { StaffVendorsModule } from '../modules/StaffVendorsModule';
import { AuditLogsModule } from '../modules/AuditLogsModule';
import { CardStudioModule } from '../modules/CardStudioModule';
import { FeedbackReviewsModule } from '../modules/FeedbackReviewsModule';
import { AdminExecutiveOverview } from '../dashboard/AdminExecutiveOverview';
import { AdminUserManagement } from '../admin/AdminUserManagement';
import { AdminPeriodicClosings } from '../admin/AdminPeriodicClosings';
import { PortalModulePlaceholder } from '../common/PortalModulePlaceholder';
import { NavModuleId, AuthUser, PortalType } from '../../types';
import { PORTAL_CONFIGS } from '../../config/portals';

interface MainLayoutProps {
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ currentUser, onLogout }) => {
  // Resolve user role to initial portal
  const resolveInitialPortal = (): PortalType => {
    switch (currentUser?.role) {
      case 'admin':
        return 'admin';
      case 'manager':
        return 'manager';
      case 'kitchen':
        return 'kitchen';
      case 'waiter':
        return 'waiter';
      case 'accountant':
        return 'finance';
      default:
        return 'admin';
    }
  };

  // Allowed portals for current user (RBAC)
  const allowedPortals: PortalType[] = React.useMemo(() => {
    if (!currentUser) return ['admin', 'manager', 'kitchen', 'waiter', 'vendors', 'finance'];
    if (currentUser.role === 'admin') {
      return ['admin', 'manager', 'kitchen', 'waiter', 'vendors', 'finance'];
    }
    if (currentUser.role === 'manager') {
      return ['manager', 'vendors'];
    }
    if (currentUser.role === 'kitchen') {
      return ['kitchen'];
    }
    if (currentUser.role === 'waiter') {
      return ['waiter'];
    }
    if (currentUser.role === 'accountant') {
      return ['finance'];
    }
    return ['admin'];
  }, [currentUser]);

  const [activePortal, setActivePortal] = useState<PortalType>(resolveInitialPortal);
  const [activeModule, setActiveModule] = useState<NavModuleId>(() => {
    const p = resolveInitialPortal();
    return PORTAL_CONFIGS[p]?.defaultModule || 'dashboard';
  });

  const [bookingPreload, setBookingPreload] = useState<{
    hallName?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  } | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Handle portal switch
  const handleSelectPortal = (newPortal: PortalType) => {
    if (!allowedPortals.includes(newPortal)) return;
    setActivePortal(newPortal);
    const targetModule = PORTAL_CONFIGS[newPortal]?.defaultModule || 'dashboard';
    setActiveModule(targetModule);
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      // -------------------------------------------------------------
      // Shared & Admin Modules
      // -------------------------------------------------------------
      case 'admin-overview':
        return (
          <AdminExecutiveOverview
            onNavigateToModule={(mod) => setActiveModule(mod as NavModuleId)}
            onOpenCreateBooking={() => setActiveModule('bookings')}
          />
        );

      case 'dashboard':
        return (
          <Dashboard
            onNavigateToModule={(mod) => setActiveModule(mod as NavModuleId)}
            onOpenCreateBooking={() => setActiveModule('bookings')}
          />
        );

      case 'admin-halls':
      case 'halls':
        return <HallsModule />;

      case 'admin-bookings':
      case 'bookings':
        return (
          <BookingsModule
            key={bookingPreload ? `preload-${bookingPreload.hallName || ''}-${bookingPreload.date || ''}-${bookingPreload.startTime || ''}` : 'bookings-table'}
            initialCreateData={bookingPreload}
            initialMode={bookingPreload ? 'create' : 'table'}
          />
        );

      case 'calendar':
        return (
          <CalendarModule
            onOpenCreate={(preload) => {
              setBookingPreload(preload || null);
              setActiveModule('bookings');
            }}
          />
        );

      case 'customers':
        return <CustomersModule />;

      case 'card-studio':
        return <CardStudioModule />;

      case 'feedback':
        return <FeedbackReviewsModule />;

      case 'settings':
      case 'admin-fbr':
        return <SettingsModule />;

      case 'admin-audit':
      case 'audit-logs':
        return <AuditLogsModule />;

      case 'admin-users':
        return <AdminUserManagement />;

      case 'admin-closings':
        return <AdminPeriodicClosings />;

      // -------------------------------------------------------------
      // Manager Portal Modules
      // -------------------------------------------------------------
      case 'manager-overview':
      case 'events':
        return <EventsModule />;

      case 'manager-decor':
        return (
          <PortalModulePlaceholder
            title="Stage & Decor Checklist Management"
            subtitle="Digital verification board for wedding themes, floral backdrops, LED ambient lighting, sound curfews, and photo booth staging."
            phaseTag="Phase 3"
            taskRef="Task 3.2"
            features={[
              'Stage setup verification with photo uploads',
              'Sound system curfew timer adherence',
              'Client custom theme inspection checklist',
              'Digital handover sign-off with customer signature',
            ]}
          />
        );

      case 'manager-roster':
        return (
          <PortalModulePlaceholder
            title="Staff Shift Rostering & Attendance"
            subtitle="Daily and event-specific shift scheduling for managers, head waiters, cleaning crew, and floor helpers."
            phaseTag="Phase 3"
            taskRef="Task 3.3"
            features={[
              'Morning vs. Evening slot roster allocations',
              'Attendance punch-in and overtime tracking',
              'Floor supervisor assignment per hall',
              'Instant replacement dispatcher for absent staff',
            ]}
          />
        );

      case 'manager-readiness':
        return (
          <PortalModulePlaceholder
            title="Service Readiness Board"
            subtitle="Live pre-event countdown tracker ensuring HVAC climate control, table seating, crockery hygiene, and buffet line readiness."
            phaseTag="Phase 3"
            taskRef="Task 3.4"
            features={[
              'Pre-event readiness checklist with time-to-guest countdown',
              'HVAC temperature monitoring confirmation',
              'Crockery and cutlery sanitization inspection',
              'Emergency contact directory for rapid issue resolution',
            ]}
          />
        );

      case 'manager-assets':
        return (
          <PortalModulePlaceholder
            title="Asset Requisitions & Damage Deposit Protocol"
            subtitle="Equipment checkout tracking, breakage deductions from security deposits, and settlement reconciliation."
            phaseTag="Phase 3"
            taskRef="Task 3.5"
            features={[
              'Banquet asset checkout (chafing dishes, projectors, chandeliers)',
              'Damage incident reporting with repair cost appraisal',
              'Customer deposit deduction voucher generation',
              'Automatic sync with Accounts Receivable ledger',
            ]}
          />
        );

      // -------------------------------------------------------------
      // Kitchen & Chef Modules
      // -------------------------------------------------------------
      case 'kitchen-kds':
        return (
          <PortalModulePlaceholder
            title="Kitchen Display Screen (KDS)"
            subtitle="High-contrast live preparation board receiving instant refill requests from floor staff with audible and visual alerts."
            phaseTag="Phase 4"
            taskRef="Task 4.1"
            features={[
              'Live dish queue prioritized by event serving schedule',
              'Instant push alerts from Waiter Kiosk for urgent refills',
              'Buffet readiness status: Queued -> In Prep -> Ready -> Dispatched',
              'Audio chime for new urgent refill orders',
            ]}
          />
        );

      case 'kitchen-menu':
      case 'menu':
        return <MenuModule />;

      case 'kitchen-stock':
      case 'inventory':
        return <InventoryModule />;

      case 'kitchen-calculator':
        return (
          <PortalModulePlaceholder
            title="Raw Material Formula Calculator"
            subtitle="Automatic grocery requisition engine calculating exact quantities (Rice, Meat, Cooking Oil, Spices, Dairy) based on Guest Count and per-head ratios."
            phaseTag="Phase 4"
            taskRef="Task 4.4"
            features={[
              'Dynamic Formula: Total Guests * Ratio (kg per head) = Requisition',
              'Custom ingredient ratio profiles (e.g. Biryani, Mutton Karahi, Kheer)',
              'Direct conversion into grocery purchase order requisition',
              'Variance comparison against actual pantry consumption',
            ]}
          />
        );

      case 'kitchen-reorder':
        return (
          <PortalModulePlaceholder
            title="Kitchen Stock Alert & Purchase Order Generator"
            subtitle="Low stock threshold warnings with 1-click supplier purchase order generation."
            phaseTag="Phase 4"
            taskRef="Task 4.5"
            features={[
              'Color-coded low stock warnings',
              'Automated reorder point triggers',
              '1-click Purchase Order generation linked to Supplier Ledger',
              'Direct dispatch to verified ingredient suppliers',
            ]}
          />
        );

      // -------------------------------------------------------------
      // Waiter Kiosk Modules
      // -------------------------------------------------------------
      case 'waiter-kiosk':
      case 'staff':
        return <FloorStaffTabletView />;

      case 'waiter-refills':
        return (
          <PortalModulePlaceholder
            title="Live Dish Refill Dispatcher"
            subtitle="Touch-optimized mobile interface allowing floor waiters to notify the kitchen that a dish is running low with 1 tap."
            phaseTag="Phase 5"
            taskRef="Task 5.2"
            features={[
              'Big-button touch interface for tablet/mobile use on the floor',
              'Dish running low alerts: 25% remaining, 10% remaining, Empty',
              'Real-time socket/polling status updates from chef',
              'Delivery confirmation when replacement chafing dish arrives',
            ]}
          />
        );

      case 'waiter-tables':
        return (
          <PortalModulePlaceholder
            title="Table Cleanliness & Turnover Tracker"
            subtitle="Live seating status and rapid post-event table cleaning board."
            phaseTag="Phase 5"
            taskRef="Task 5.3"
            features={[
              'Table map with status: Occupied, Needs Clearing, Sanitized',
              'Cleaning staff assignment per hall sector',
              'Lost & Found item logger with customer phone lookup',
            ]}
          />
        );

      // -------------------------------------------------------------
      // Vendors & Suppliers Modules
      // -------------------------------------------------------------
      case 'vendors-directory':
      case 'vendors':
        return <StaffVendorsModule initialTab="vendors" onLaunchTabletMode={() => setActiveModule('waiter-kiosk')} />;

      case 'vendors-labor':
        return (
          <PortalModulePlaceholder
            title="Outside Staff & Labor Contractor Section"
            subtitle="Specialized contractor management tracking daily outside labor: male count, female count, hourly/shift rates, and automated wage bill calculation."
            phaseTag="Phase 6"
            taskRef="Task 6.2"
            features={[
              'Labor Contractor profile with rate cards',
              'Shift attendance: Male Count, Female Count, Total Count',
              'Automated bill: (Male * Rate) + (Female * Rate) = Total Payable',
              'Contractor statement with payment voucher generation',
            ]}
          />
        );

      case 'vendors-payables':
        return (
          <PortalModulePlaceholder
            title="Supplier Trade Ledger & Purchase Invoices"
            subtitle="Financial trade history with decorators, caterers, lighting vendors, and raw ingredient suppliers."
            phaseTag="Phase 6"
            taskRef="Task 6.3"
            features={[
              'Supplier-by-supplier transaction history',
              'Purchase invoice intake against purchase orders',
              'Outstanding Accounts Payable ledger with due date alerts',
              'Payment voucher disbursement recording',
            ]}
          />
        );

      case 'vendors-deliveries':
        return (
          <PortalModulePlaceholder
            title="Delivery Schedule & Goods Receipt Note (GRN)"
            subtitle="Expected ingredient and floral deliveries check-in verification."
            phaseTag="Phase 6"
            taskRef="Task 6.4"
            features={[
              'Calendar view of scheduled vendor deliveries',
              'Goods Receipt Note (GRN) quality and weight verification',
              'Discrepancy / rejection reporting with vendor notification',
            ]}
          />
        );

      // -------------------------------------------------------------
      // Financial Accounting Modules
      // -------------------------------------------------------------
      case 'finance-overview':
      case 'reports':
        return <ReportsModule />;

      case 'finance-ledger':
        return (
          <PortalModulePlaceholder
            title="General Ledger & Chart of Accounts (COA)"
            subtitle="Full double-entry bookkeeping system: Assets, Liabilities, Equity, Revenue, and Cost of Goods Sold."
            phaseTag="Phase 7"
            taskRef="Task 7.2"
            features={[
              'Customizable Chart of Accounts tailored for hospitality/banquets',
              'Journal entry composer with automatic debit = credit validation',
              'Account-by-account transaction history with running balances',
              'Trial Balance generation with 1 click',
            ]}
          />
        );

      case 'finance-receivables':
      case 'payments':
        return <PaymentsModule />;

      case 'finance-payables':
        return (
          <PortalModulePlaceholder
            title="Accounts Payable (A/P) Master Ledger"
            subtitle="Comprehensive tracking of all supplier, contractor, and vendor liabilities with due dates and aging reports."
            phaseTag="Phase 7"
            taskRef="Task 7.4"
            features={[
              'Aging analysis: Current, 30 days, 60 days, 90+ days overdue',
              'Vendor payment scheduling and batch settlement',
              'Automatic sync with General Ledger and cash accounts',
            ]}
          />
        );

      case 'finance-expenses':
      case 'expenses':
        return <ExpensesModule />;

      case 'finance-statements':
        return (
          <PortalModulePlaceholder
            title="Audited Income Statement & Balance Sheet"
            subtitle="Interactive GAAP-compliant periodic financial statements with customizable date range filters and PDF exports."
            phaseTag="Phase 7"
            taskRef="Task 7.5"
            features={[
              'Income Statement (P&L): Gross Margin, Net Profit, Operating Expenses',
              'Balance Sheet: Venue Assets, Retained Earnings, Current Liabilities',
              'Multi-duration filter: Daily, Weekly, Monthly, Quarterly, Annual',
              'High-resolution PDF report export for auditors and owners',
            ]}
          />
        );

      default:
        return (
          <Dashboard
            onNavigateToModule={(mod) => setActiveModule(mod as NavModuleId)}
            onOpenCreateBooking={() => setActiveModule('bookings')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#131b2e] flex flex-col antialiased selection:bg-teal-100 selection:text-teal-900 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar with Navigation Links Dynamically Contextualized to Active Portal */}
      <Sidebar
        activePortal={activePortal}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Column */}
      <div className="lg:pl-64 flex flex-col min-h-screen transition-all">
        {/* Topbar with 6 Portal Tabs, Global Search, and Profile Console */}
        <Topbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          searchValue={globalSearch}
          onSearchChange={setGlobalSearch}
          activeModule={activeModule}
          onSelectTabletView={() => {
            setActivePortal('waiter');
            setActiveModule('waiter-kiosk');
          }}
          currentUser={currentUser}
          onLogout={onLogout}
          activePortal={activePortal}
          onSelectPortal={handleSelectPortal}
          allowedPortals={allowedPortals}
        />

        {/* Main Content Area */}
        <main className="relative pt-16 bg-[#f8fafc] flex-1">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">{renderActiveModule()}</div>
        </main>
      </div>
    </div>
  );
};
