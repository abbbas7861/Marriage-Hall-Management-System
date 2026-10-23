import React, { useState } from 'react';
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
import { NavModuleId } from '../../types';

export const MainLayout: React.FC = () => {
  const [activeModule, setActiveModule] = useState<NavModuleId>('feedback');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showFloorTabletView, setShowFloorTabletView] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigateToModule={(mod) => setActiveModule(mod as NavModuleId)}
            onOpenCreateBooking={() => setActiveModule('bookings')}
          />
        );
      case 'bookings':
        return <BookingsModule />;
      case 'halls':
        return <HallsModule />;
      case 'calendar':
        return (
          <CalendarModule
            onOpenCreate={() => setActiveModule('bookings')}
          />
        );
      case 'customers':
        return <CustomersModule />;
      case 'events':
        return <EventsModule />;
      case 'menu':
        return <MenuModule />;
      case 'inventory':
        return <InventoryModule />;
      case 'payments':
        return <PaymentsModule />;
      case 'expenses':
        return <ExpensesModule />;
      case 'reports':
        return <ReportsModule />;
      case 'settings':
        return <SettingsModule />;
      case 'staff':
        if (showFloorTabletView) {
          return (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowFloorTabletView(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  &larr; Back to Staff &amp; Vendor Directory
                </button>
              </div>
              <FloorStaffTabletView />
            </div>
          );
        }
        return (
          <StaffVendorsModule
            initialTab="staff"
            onLaunchTabletMode={() => setShowFloorTabletView(true)}
          />
        );
      case 'vendors':
        return (
          <StaffVendorsModule
            initialTab="vendors"
            onLaunchTabletMode={() => setShowFloorTabletView(true)}
          />
        );
      case 'audit-logs':
        return <AuditLogsModule />;
      case 'card-studio':
        return <CardStudioModule />;
      case 'feedback':
        return <FeedbackReviewsModule />;
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
    <div className="min-h-screen bg-[#f8fafc] text-[#131b2e] flex flex-col antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Sidebar with Navigation Links to All Modules */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Column */}
      <div className="lg:pl-64 flex flex-col min-h-screen transition-all">
        {/* Topbar with Search, Profile, and Tablet View Switch */}
        <Topbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          searchValue={globalSearch}
          onSearchChange={setGlobalSearch}
          activeModule={activeModule}
          onSelectTabletView={() => setActiveModule('staff')}
        />

        {/* Main Content Area */}
        <main className="relative pt-16 bg-[#f8fafc] flex-1">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            {renderActiveModule()}
          </div>
        </main>
      </div>
    </div>
  );
};
