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
import { ManagerEventsOverview } from '../manager/ManagerEventsOverview';
import { ManagerDutyRosters } from '../manager/ManagerDutyRosters';
import { ManagerAssetRequisitions } from '../manager/ManagerAssetRequisitions';
import { ManagerLiveChecklist } from '../manager/ManagerLiveChecklist';
import { ManagerDepositSettlement } from '../manager/ManagerDepositSettlement';
import { KitchenDisplayScreen } from '../kitchen/KitchenDisplayScreen';
import { KitchenPantryInventory } from '../kitchen/KitchenPantryInventory';
import { KitchenRecipeManager } from '../kitchen/KitchenRecipeManager';
import { KitchenFormulaCalculator } from '../kitchen/KitchenFormulaCalculator';
import { WaiterHallTableMonitoring } from '../waiter/WaiterHallTableMonitoring';
import { WaiterRefillDispatcher } from '../waiter/WaiterRefillDispatcher';
import { WaiterOvertimeTrigger } from '../waiter/WaiterOvertimeTrigger';
import { VendorMasterDirectory } from '../vendors/VendorMasterDirectory';
import { VendorContractorLabor } from '../vendors/VendorContractorLabor';
import { VendorPurchaseOrdersGRN } from '../vendors/VendorPurchaseOrdersGRN';
import { VendorTradePayables } from '../vendors/VendorTradePayables';
import { FinanceExecutiveOverview } from '../finance/FinanceExecutiveOverview';
import { FinanceGeneralLedger } from '../finance/FinanceGeneralLedger';
import { FinanceReceivablesCollector } from '../finance/FinanceReceivablesCollector';
import { FinanceAccountsPayable } from '../finance/FinanceAccountsPayable';
import { FinanceProfitLossTax } from '../finance/FinanceProfitLossTax';
import { PortalModulePlaceholder } from '../common/PortalModulePlaceholder';
import { NavModuleId, AuthUser, PortalType, Booking } from '../../types';
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

  const [managerBookingContext, setManagerBookingContext] = useState<Booking | null>(null);

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
        return (
          <ManagerEventsOverview
            onNavigateToTab={(tabId, booking) => {
              if (booking) setManagerBookingContext(booking);
              setActiveModule(tabId as NavModuleId);
            }}
          />
        );

      case 'events':
        return <EventsModule />;

      case 'manager-decor':
        return <ManagerAssetRequisitions initialBooking={managerBookingContext} />;

      case 'manager-roster':
        return <ManagerDutyRosters initialBooking={managerBookingContext} />;

      case 'manager-readiness':
        return <ManagerLiveChecklist initialBooking={managerBookingContext} />;

      case 'manager-assets':
        return <ManagerDepositSettlement initialBooking={managerBookingContext} />;

      // -------------------------------------------------------------
      // Kitchen & Chef Modules
      // -------------------------------------------------------------
      case 'kitchen-kds':
        return <KitchenDisplayScreen />;

      case 'kitchen-menu':
        return <KitchenRecipeManager />;

      case 'menu':
        return <MenuModule />;

      case 'kitchen-stock':
        return <KitchenPantryInventory />;

      case 'inventory':
        return <InventoryModule />;

      case 'kitchen-calculator':
        return <KitchenFormulaCalculator />;

      case 'kitchen-reorder':
        return <KitchenPantryInventory />;

      // -------------------------------------------------------------
      // Waiter Kiosk Modules
      // -------------------------------------------------------------
      case 'waiter-kiosk':
      case 'waiter-tables':
      case 'staff':
        return (
          <WaiterHallTableMonitoring
            onNavigateToTab={(tabId) => setActiveModule(tabId as NavModuleId)}
          />
        );

      case 'waiter-refills':
        return (
          <WaiterRefillDispatcher
            onNavigateToTab={(tabId) => setActiveModule(tabId as NavModuleId)}
          />
        );

      case 'waiter-overtime':
        return (
          <WaiterOvertimeTrigger
            onNavigateToTab={(tabId) => setActiveModule(tabId as NavModuleId)}
            currentUser={currentUser}
          />
        );

      // -------------------------------------------------------------
      // Vendors & Suppliers Modules (Phase 6)
      // -------------------------------------------------------------
      case 'vendors-directory':
      case 'vendors':
        return <VendorMasterDirectory onNavigateToTab={(tabId) => setActiveModule(tabId as NavModuleId)} />;

      case 'vendors-labor':
        return <VendorContractorLabor onNavigateToTab={(tabId) => setActiveModule(tabId as NavModuleId)} />;

      case 'vendors-deliveries':
        return <VendorPurchaseOrdersGRN onNavigateToTab={(tabId) => setActiveModule(tabId as NavModuleId)} />;

      case 'vendors-payables':
        return <VendorTradePayables onNavigateToTab={(tabId) => setActiveModule(tabId as NavModuleId)} />;

      // -------------------------------------------------------------
      // Financial Accounting Modules (Phase 7)
      // -------------------------------------------------------------
      case 'finance-overview':
      case 'reports':
        return <FinanceExecutiveOverview onNavigateToTab={(tabId) => setActiveModule(tabId as NavModuleId)} />;

      case 'finance-ledger':
        return <FinanceGeneralLedger onNavigateToTab={(tabId) => setActiveModule(tabId as NavModuleId)} />;

      case 'finance-receivables':
      case 'payments':
        return <FinanceReceivablesCollector onNavigateToTab={(tabId) => setActiveModule(tabId as NavModuleId)} />;

      case 'finance-payables':
        return <FinanceAccountsPayable onNavigateToTab={(tabId) => setActiveModule(tabId as NavModuleId)} />;

      case 'finance-expenses':
      case 'expenses':
        return <ExpensesModule />;

      case 'finance-statements':
        return <FinanceProfitLossTax onNavigateToTab={(tabId) => setActiveModule(tabId as NavModuleId)} />;

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
        onSelectPortal={handleSelectPortal}
        allowedPortals={allowedPortals}
      />

      {/* Main Column */}
      <div className="lg:pl-64 flex flex-col min-h-screen transition-all overflow-x-hidden min-w-0">
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
        <main className="relative pt-16 bg-[#f8fafc] flex-1 overflow-x-hidden min-w-0">
          <div className="w-full max-w-full px-3 sm:px-6 lg:px-8 py-5 sm:py-6 overflow-x-hidden min-w-0">{renderActiveModule()}</div>
        </main>
      </div>
    </div>
  );
};
