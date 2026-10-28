import {
  Crown,
  Briefcase,
  ChefHat,
  Smartphone,
  Truck,
  Landmark,
  LayoutDashboard,
  Building2,
  CalendarDays,
  Users,
  CalendarCheck,
  Receipt,
  History,
  Sparkles,
  ClipboardCheck,
  Clock,
  Layers,
  UtensilsCrossed,
  Package,
  Calculator,
  AlertTriangle,
  Tablet,
  Coffee,
  CheckCircle2,
  Store,
  UserCheck,
  FileSpreadsheet,
  FileText,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Scale,
  Settings,
  LucideIcon,
} from 'lucide-react';
import { PortalType, NavModuleId } from '../types';

export interface PortalNavItem {
  id: NavModuleId;
  label: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
}

export interface PortalNavGroup {
  groupTitle?: string;
  items: PortalNavItem[];
}

export interface PortalConfig {
  id: PortalType;
  name: string;
  shortName: string;
  icon: LucideIcon;
  themeColor: string;
  accentBg: string;
  description: string;
  defaultModule: NavModuleId;
  navGroups: PortalNavGroup[];
}

export const PORTAL_CONFIGS: Record<PortalType, PortalConfig> = {
  admin: {
    id: 'admin',
    name: 'Admin Suite',
    shortName: 'Admin',
    icon: Crown,
    themeColor: 'from-amber-500 to-amber-700',
    accentBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'Owner Master Command & Overall Venue Operations',
    defaultModule: 'admin-overview',
    navGroups: [
      {
        groupTitle: 'Executive Operations',
        items: [
          { id: 'admin-overview', label: 'Executive Dashboard', icon: LayoutDashboard },
          { id: 'admin-halls', label: 'Halls Registry', icon: Building2 },
          { id: 'admin-bookings', label: 'Bookings Ledger', icon: CalendarDays },
          { id: 'calendar', label: 'Master Calendar', icon: CalendarCheck },
        ],
      },
      {
        groupTitle: 'Control & Closings',
        items: [
          { id: 'admin-users', label: 'User Directory & Rights', icon: Users, badge: 'RBAC' },
          { id: 'admin-closings', label: 'Period Closings', icon: Clock },
          { id: 'admin-fbr', label: 'FBR Digital Invoicing', icon: Receipt, badge: 'Optional' },
          { id: 'admin-audit', label: 'System Audit Logs', icon: History },
          { id: 'settings', label: 'Venue Settings', icon: Settings },
        ],
      },
    ],
  },

  manager: {
    id: 'manager',
    name: 'Event Manager',
    shortName: 'Manager',
    icon: Briefcase,
    themeColor: 'from-sky-500 to-sky-700',
    accentBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    description: 'Floor Operations, Decor Verification & Staff Shift Rosters',
    defaultModule: 'manager-overview',
    navGroups: [
      {
        groupTitle: 'Floor Command',
        items: [
          { id: 'manager-overview', label: 'Events Control Center', icon: CalendarDays },
          { id: 'manager-decor', label: 'Stage & Decor Checklist', icon: Sparkles },
          { id: 'manager-readiness', label: 'Service Readiness Board', icon: ClipboardCheck },
        ],
      },
      {
        groupTitle: 'Personnel & Assets',
        items: [
          { id: 'manager-roster', label: 'Staff Shift Rosters', icon: Users },
          { id: 'manager-assets', label: 'Damage & Deposit Protocol', icon: Layers },
          { id: 'feedback', label: 'Customer Reviews', icon: CheckCircle2 },
        ],
      },
    ],
  },

  kitchen: {
    id: 'kitchen',
    name: 'Kitchen & Chef ERP',
    shortName: 'Kitchen',
    icon: ChefHat,
    themeColor: 'from-emerald-500 to-emerald-700',
    accentBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Kitchen Display Screen, Menu Formulas & Pantry Stock Control',
    defaultModule: 'kitchen-kds',
    navGroups: [
      {
        groupTitle: 'Live Kitchen',
        items: [
          { id: 'kitchen-kds', label: 'Kitchen Display Screen', icon: Tablet, badge: 'Live KDS' },
          { id: 'kitchen-menu', label: 'Recipe & Menu Packages', icon: UtensilsCrossed },
        ],
      },
      {
        groupTitle: 'Pantry & Formula',
        items: [
          { id: 'kitchen-stock', label: 'Pantry Stock & Inventory', icon: Package },
          { id: 'kitchen-calculator', label: 'Raw Material Calculator', icon: Calculator, badge: 'Formula' },
          { id: 'kitchen-reorder', label: 'Reorder Requisitions', icon: AlertTriangle },
        ],
      },
    ],
  },

  waiter: {
    id: 'waiter',
    name: 'Staff & Waiter Kiosk',
    shortName: 'Waiters',
    icon: Smartphone,
    themeColor: 'from-violet-500 to-violet-700',
    accentBg: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    description: 'Mobile/Tablet Service Dispatcher & Refill Orders',
    defaultModule: 'waiter-kiosk',
    navGroups: [
      {
        groupTitle: 'Floor Kiosk',
        items: [
          { id: 'waiter-kiosk', label: 'Floor Staff Tablet', icon: Tablet },
          { id: 'waiter-refills', label: 'Dish Refill Dispatcher', icon: Coffee, badge: 'Urgent' },
          { id: 'waiter-tables', label: 'Table Readiness Turnover', icon: CheckCircle2 },
        ],
      },
    ],
  },

  vendors: {
    id: 'vendors',
    name: 'Vendors & Suppliers',
    shortName: 'Vendors',
    icon: Truck,
    themeColor: 'from-teal-500 to-teal-700',
    accentBg: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    description: 'External Contractors, Outside Staff & Trade Ledgers',
    defaultModule: 'vendors-directory',
    navGroups: [
      {
        groupTitle: 'Contractors & Labor',
        items: [
          { id: 'vendors-directory', label: 'Vendor Directory', icon: Store },
          { id: 'vendors-labor', label: 'Outside Labor Contractor', icon: UserCheck, badge: 'Staff Bill' },
        ],
      },
      {
        groupTitle: 'Trades & Payables',
        items: [
          { id: 'vendors-payables', label: 'Supplier Trade Ledger', icon: FileSpreadsheet },
          { id: 'vendors-deliveries', label: 'Delivery Schedule', icon: Truck },
        ],
      },
    ],
  },

  finance: {
    id: 'finance',
    name: 'Financial Accounting',
    shortName: 'Accounting',
    icon: Landmark,
    themeColor: 'from-indigo-500 to-indigo-700',
    accentBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    description: 'Full Accrual General Ledger, A/R, A/P & Periodic Financials',
    defaultModule: 'finance-overview',
    navGroups: [
      {
        groupTitle: 'Accounting Core',
        items: [
          { id: 'finance-overview', label: 'Financial Statement KPI', icon: BarChart3 },
          { id: 'finance-ledger', label: 'General Ledger (GL)', icon: Scale },
          { id: 'finance-receivables', label: 'Accounts Receivable (A/R)', icon: ArrowDownLeft, badge: 'Invoices' },
          { id: 'finance-payables', label: 'Accounts Payable (A/P)', icon: ArrowUpRight },
        ],
      },
      {
        groupTitle: 'Reports & Expenses',
        items: [
          { id: 'finance-expenses', label: 'Expense Journal', icon: Wallet },
          { id: 'finance-statements', label: 'P&L & Balance Sheet', icon: FileText },
        ],
      },
    ],
  },
};

