export type UserRole = 'admin' | 'manager' | 'kitchen' | 'waiter' | 'accountant';

export type PortalType = 'admin' | 'manager' | 'kitchen' | 'waiter' | 'vendors' | 'finance';

export interface AuthUser {
  id: number | string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export type NavModuleId =
  | 'dashboard'
  | 'halls'
  | 'bookings'
  | 'calendar'
  | 'customers'
  | 'events'
  | 'menu'
  | 'inventory'
  | 'payments'
  | 'expenses'
  | 'staff'
  | 'vendors'
  | 'reports'
  | 'audit-logs'
  | 'settings'
  | 'card-studio'
  | 'feedback'
  // Admin Portal Tabs
  | 'admin-overview'
  | 'admin-halls'
  | 'admin-bookings'
  | 'admin-users'
  | 'admin-closings'
  | 'admin-fbr'
  | 'admin-audit'
  // Manager Portal Tabs
  | 'manager-overview'
  | 'manager-decor'
  | 'manager-roster'
  | 'manager-readiness'
  | 'manager-assets'
  // Kitchen Portal Tabs
  | 'kitchen-kds'
  | 'kitchen-menu'
  | 'kitchen-stock'
  | 'kitchen-calculator'
  | 'kitchen-reorder'
  // Waiter Portal Tabs
  | 'waiter-kiosk'
  | 'waiter-refills'
  | 'waiter-tables'
  // Vendors Portal Tabs
  | 'vendors-directory'
  | 'vendors-labor'
  | 'vendors-payables'
  | 'vendors-deliveries'
  // Finance Portal Tabs
  | 'finance-overview'
  | 'finance-ledger'
  | 'finance-receivables'
  | 'finance-payables'
  | 'finance-statements'
  | 'finance-expenses';

export interface FeedbackLogEntry {
  id: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  eventType: string;
  rating: number;
  rawNotes: string;
  generatedReview?: string;
}

export interface Booking {
  id: string;
  bookingRef: string;
  customerName: string;
  contactRef: string;
  eventType: string;
  hallName: string;
  date: string;
  time?: string;
  slot: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Under Review' | 'Deposit Paid' | 'Completed';
  paymentStatus?: 'Paid' | 'Partial' | 'Unpaid' | 'Pending';
  amount?: number;
  guestCount?: number;
}

export interface Hall {
  id: string;
  code?: string;
  name: string;
  capacity: number;
  baseRent: number;
  hourlyRate?: number;
  locationFloor: string;
  facilities: string[];
  status: 'Active' | 'Under Maintenance';
  dimension?: string;
  tier?: string;
  imageUrl?: string;
}

export interface Customer {
  id: string;
  clientRef?: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  cnic?: string;
  address?: string;
  notes?: string;
  totalBookings: number;
  lifetimeValue: number;
  outstandingBalance?: number;
  status: 'Active' | 'Inactive';
  tier?: 'VIP' | 'Corporate' | 'Standard';
  lastActive?: string;
  createdAt?: string;
}

export interface EventTypeConfig {
  id: string;
  name: string;
  defaultStartTime: string;
  defaultEndTime: string;
  calendarColor: string;
  description: string;
}

export interface MenuPackage {
  id: string;
  packageCode?: string;
  name: string;
  pricePerHead: number;
  description: string;
  includedItems: string[];
  status: 'Active' | 'Inactive';
}

export interface MenuItem {
  id: string;
  packageCode: string;
  packageName: string;
  cuisine: string;
  courses: number;
  pricePerPlate: number;
  station: string;
  status: 'Active' | 'Discontinued';
}

export interface InventoryItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  inUseQuantity?: number;
  reservedQuantity?: number;
  condition: 'Good' | 'Needs Repair' | 'Damaged';
  storageLocation?: string;
}

export interface PaymentTransaction {
  id: string;
  txnRef: string;
  category: string;
  channel: string;
  billingStatus: 'Settled' | 'Pending' | 'Unpaid' | 'Processing';
  amount: number;
  timestamp: string;
  bookingRef?: string;
}

export interface ExpenseRecord {
  id: string;
  expenseRef: string;
  category: string;
  vendor: string;
  amount: number;
  approvedBy: string;
  date: string;
  paymentMethod: string;
}

export interface SparklinePoint {
  index: number;
  value: number;
}

export interface RevenueTrendPoint {
  period: string;
  bookedRevenue?: number;
  ancillaryCatering?: number;
  hallRentals?: number;
}

export interface HallOccupancySlice {
  name: string;
  value: number;
  color?: string;
}

export interface ExtraTimeRequest {
  id: string;
  hallName: string;
  bookingRef: string;
  requestedHours: number;
  reason: string;
  estimatedCharges: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceId: string;
  bookingId: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  date: string;
}

export interface BlockedDate {
  id: string;
  hallName: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface StaffMember {
  id: string;
  employeeId: string;
  fullName: string;
  role: 'Manager' | 'Floor Staff' | 'Admin' | 'Accountant' | string;
  contactNumber: string;
  shiftTiming: string;
  status: 'Active' | 'On Leave' | 'Inactive';
}

export interface VendorPartner {
  id: string;
  vendorId: string;
  businessName: string;
  category: 'Decorator' | 'Caterer' | 'Photographer' | 'Sound/Lights' | 'Other' | string;
  contactPerson: string;
  phoneNumber: string;
}

export interface AuditLogEntry {
  id: string;
  logId: string;
  timestamp: string;
  userName: string;
  userRole: 'Admin' | 'Manager' | 'Floor Staff' | string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Login' | 'Approved';
  module: string;
  details: string;
  ipAddress: string;
}
