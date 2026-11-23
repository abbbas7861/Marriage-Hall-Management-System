import {
  Booking,
  Hall,
  Customer,
  MenuItem,
  InventoryItem,
  PaymentTransaction,
  ExpenseRecord,
  StaffMember,
  VendorPartner,
  AuditLogEntry,
  RevenueTrendPoint,
  HallOccupancySlice,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Generic JSON fetch helper with timeout and error handling for Django REST backend
 */
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  
  const headers = new Headers(options?.headers || {});
  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`API error ${response.status} (${response.statusText}): ${errorText || 'Endpoint unavailable'}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export interface DashboardStatsResponse {
  totalRevenue: number;
  totalBookings: number;
  totalExpenses: number;
  netProfit: number;
  occupancyRate: number;
  pendingApprovals: number;
  revenueTrend: RevenueTrendPoint[];
  occupancyData: HallOccupancySlice[];
  upcomingEvents: Booking[];
  recentTransactions: PaymentTransaction[];
}

/**
 * Fetch Executive Dashboard statistics and chart trends
 */
export async function fetchDashboardStats(): Promise<DashboardStatsResponse> {
  return request<DashboardStatsResponse>('dashboard/stats/');
}

/**
 * Fetch Halls
 */
export async function fetchHalls(): Promise<Hall[]> {
  const data = await request<Hall[] | { results: Hall[] }>('halls/');
  return Array.isArray(data) ? data : data.results || [];
}

/**
 * Fetch Bookings
 */
export async function fetchBookings(): Promise<Booking[]> {
  const data = await request<Booking[] | { results: Booking[] }>('bookings/');
  return Array.isArray(data) ? data : data.results || [];
}

/**
 * Fetch Staff Members
 */
export async function fetchStaff(): Promise<StaffMember[]> {
  const data = await request<StaffMember[] | { results: StaffMember[] }>('staff/');
  return Array.isArray(data) ? data : data.results || [];
}

/**
 * Fetch Vendor Partners
 */
export async function fetchVendors(): Promise<VendorPartner[]> {
  const data = await request<VendorPartner[] | { results: VendorPartner[] }>('vendors/');
  return Array.isArray(data) ? data : data.results || [];
}

/**
 * Fetch Inventory Items
 */
export async function fetchInventory(): Promise<InventoryItem[]> {
  const data = await request<InventoryItem[] | { results: InventoryItem[] }>('inventory/');
  return Array.isArray(data) ? data : data.results || [];
}

/**
 * Fetch Menu Items
 */
export async function fetchMenuItems(): Promise<MenuItem[]> {
  const data = await request<MenuItem[] | { results: MenuItem[] }>('menu/');
  return Array.isArray(data) ? data : data.results || [];
}

/**
 * Fetch Customers
 */
export async function fetchCustomers(): Promise<Customer[]> {
  const data = await request<Customer[] | { results: Customer[] }>('customers/');
  return Array.isArray(data) ? data : data.results || [];
}

/**
 * Fetch Payment Transactions
 */
export async function fetchPayments(): Promise<PaymentTransaction[]> {
  const data = await request<PaymentTransaction[] | { results: PaymentTransaction[] }>('payments/');
  return Array.isArray(data) ? data : data.results || [];
}

/**
 * Fetch Expenses
 */
export async function fetchExpenses(): Promise<ExpenseRecord[]> {
  const data = await request<ExpenseRecord[] | { results: ExpenseRecord[] }>('expenses/');
  return Array.isArray(data) ? data : data.results || [];
}

/**
 * Fetch Audit Logs
 */
export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  const data = await request<AuditLogEntry[] | { results: AuditLogEntry[] }>('audit-logs/');
  return Array.isArray(data) ? data : data.results || [];
}

export default {
  fetchDashboardStats,
  fetchHalls,
  fetchBookings,
  fetchStaff,
  fetchVendors,
  fetchInventory,
  fetchMenuItems,
  fetchCustomers,
  fetchPayments,
  fetchExpenses,
  fetchAuditLogs,
};

// -------------------------------------------------------------
// Backward compatibility helper exports
// -------------------------------------------------------------
export const fetchDashboardStats = dashboardApi.getStats;
export const fetchHalls = hallsApi.list;
export const fetchBookings = bookingsApi.list;
export const fetchStaff = staffApi.list;
export const fetchVendors = vendorsApi.list;
export const fetchInventory = inventoryApi.list;
export const fetchMenuItems = menuApi.list;
export const fetchCustomers = customersApi.list;
export const fetchPayments = paymentsApi.list;
export const fetchExpenses = expensesApi.list;
export const fetchAuditLogs = auditLogsApi.list;

export default {
  bookings: bookingsApi,
  halls: hallsApi,
  menu: menuApi,
  invoices: invoicesApi,
  expenses: expensesApi,
  fundRequests: fundRequestsApi,
  requisitions: requisitionsApi,
  vendors: vendorsApi,
  staff: staffApi,
  inventory: inventoryApi,
  customers: customersApi,
  payments: paymentsApi,
  dashboard: dashboardApi,
  reports: reportsApi,
  auditLogs: auditLogsApi,
  settings: settingsApi,
  auth: authApi,
  fetchDashboardStats,
  fetchHalls,
  fetchBookings,
  fetchStaff,
  fetchVendors,
  fetchInventory,
  fetchMenuItems,
  fetchCustomers,
  fetchPayments,
  fetchExpenses,
  fetchAuditLogs,
};
