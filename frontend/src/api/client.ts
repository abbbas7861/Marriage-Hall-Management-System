/**
 * Marriage Hall Management System (MHMS) Enterprise API Client
 * Fully typed client connecting the React frontend to the Django REST API.
 */

import {
  Booking,
  Hall,
  Customer,
  EventTypeConfig,
  MenuPackage,
  InventoryItem,
  PaymentTransaction,
  ExpenseRecord,
  InvoiceRecord,
  BlockedDate,
  StaffMember,
  VendorPartner,
  AuditLogEntry,
  ExtraTimeRequest,
  FeedbackLogEntry,
  RevenueTrendPoint,
  HallOccupancySlice,
} from '../types';

export interface AuthUser {
  id?: number | string;
  username: string;
  email?: string;
  fullName?: string;
  role: 'admin' | 'manager' | 'kitchen' | 'accounts' | string;
  token?: string;
  access?: string;
  refresh?: string;
}

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || '/api/v1';

const FALLBACK_DIRECT_API = 'http://127.0.0.1:8000/api/v1';

function normalizePath(endpoint: string): string {
  const [path, query] = endpoint.split('?');
  const normalizedPath = path.endsWith('/') ? path : `${path}/`;
  return query ? `${normalizedPath}?${query}` : normalizedPath;
}

function normalizeId<T extends { id?: string | number }>(item: T): T {
  if (item && item.id !== undefined && item.id !== null) {
    return { ...item, id: String(item.id) };
  }
  return item;
}

function normalizeList<T extends { id?: string | number }>(list: any): T[] {
  if (!list) return [];
  if (Array.isArray(list)) return list.map(normalizeId);
  if (Array.isArray(list.results)) return list.results.map(normalizeId);
  return [];
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const primaryUrl = `${API_BASE_URL.replace(/\/+$/, '')}/${normalizePath(cleanEndpoint)}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  const token =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('mhms_jwt_access') ||
        localStorage.getItem('mhms_auth_token') ||
        localStorage.getItem('token')
      : null;

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    let response: Response;
    try {
      response = await fetch(primaryUrl, config);
    } catch (networkErr: any) {
      // If primary relative URL failed and we are running in browser locally, try direct backend URL
      if (
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1') &&
        !primaryUrl.startsWith('http://127.0.0.1:8000') &&
        !primaryUrl.startsWith('http://localhost:8000')
      ) {
        const directUrl = `${FALLBACK_DIRECT_API.replace(/\/+$/, '')}/${normalizePath(cleanEndpoint)}`;
        response = await fetch(directUrl, config);
      } else {
        throw networkErr;
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (typeof errorJson === 'object' && errorJson !== null) {
          const detail =
            errorJson.detail ||
            errorJson.message ||
            errorJson.error ||
            errorJson.non_field_errors ||
            Object.entries(errorJson)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
              .join(' | ');
          if (detail) errorMessage = detail;
        }
      } catch {
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.warn(`API Error on [${options.method || 'GET'}] ${endpoint}:`, err.message || err);
    throw err;
  }
}

// -------------------------------------------------------------
// Bookings API
// -------------------------------------------------------------
export const bookingsApi = {
  async list(params?: {
    search?: string;
    hall?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    manager?: string;
    operationalStatus?: string;
  }): Promise<Booking[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.hall && params.hall !== 'All Halls') query.set('hall', params.hall);
    if (params?.status && params.status !== 'All Statuses' && params.status !== 'All') query.set('status', params.status);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.manager && params.manager !== 'All' && params.manager !== 'All Managers') query.set('manager', params.manager);
    if (params?.operationalStatus && params.operationalStatus !== 'All Stages') query.set('operationalStatus', params.operationalStatus);

    const qs = query.toString();
    const data = await request<any>(`bookings${qs ? `?${qs}` : ''}`);
    return normalizeList<Booking>(data);
  },

  async get(id: string): Promise<Booking> {
    const data = await request<Booking>(`bookings/${id}`);
    return normalizeId(data);
  },

  async create(payload: Partial<Booking> | any): Promise<Booking> {
    const data = await request<Booking>('bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<Booking> | any): Promise<Booking> {
    const data = await request<Booking>(`bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async patch(id: string, payload: Partial<Booking> | any): Promise<Booking> {
    const data = await request<Booking>(`bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`bookings/${id}`, { method: 'DELETE' });
  },

  async approve(id: string): Promise<Booking> {
    const data = await request<Booking>(`bookings/${id}/approve`, { method: 'POST' });
    return normalizeId(data);
  },

  async cancel(
    id: string,
    payload?: {
      cancellation_type: 'refund' | 'pause_and_adjust';
      reason: string;
      deduction_amount?: number;
      notes?: string;
    }
  ): Promise<{ message: string; booking: Booking; cancellation: any }> {
    const data = await request<any>(`bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
    return data;
  },

  async updateOperationalStatus(id: string, operationalStatus: string): Promise<Booking> {
    const data = await request<Booking>(`bookings/${id}/update-operational-status`, {
      method: 'POST',
      body: JSON.stringify({ operationalStatus }),
    });
    return normalizeId(data);
  },

  async amendBooking(id: string, payload: any): Promise<Booking> {
    const data = await request<Booking>(`bookings/${id}/amend`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async addExtraService(id: string, payload: { title: string; price: number; category?: string; requestedBy?: string; notes?: string }): Promise<Booking> {
    const data = await request<Booking>(`bookings/${id}/add-extra-service`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async recordDamage(id: string, payload: { itemDescription: string; penaltyAmount: number; deductionFromDeposit?: boolean; photosOrNotes?: string; reportedBy?: string }): Promise<Booking> {
    const data = await request<Booking>(`bookings/${id}/record-damage`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async closeEvent(
    id: string,
    payload: {
      extraServices?: Array<{ title: string; price: number; category?: string; notes?: string }>;
      damages?: Array<{ item: string; amount: number; deductionType?: 'invoice' | 'security_deposit'; notes?: string }>;
      notes?: string;
    }
  ): Promise<{ message: string; booking: Booking; invoice: any }> {
    const data = await request<any>(`bookings/${id}/close-event`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
    return data;
  },

  async checkAvailability(params: {
    hall: string;
    date: string;
    startTime?: string;
    endTime?: string;
    slot?: string;
    bookingType?: string;
    excludeId?: string;
  }): Promise<{
    available: boolean;
    conflict?: string;
    conflictType?: string;
    details?: string;
    existingBooking?: any;
  }> {
    const query = new URLSearchParams();
    query.set('hall', params.hall);
    query.set('date', params.date);
    if (params.startTime) query.set('startTime', params.startTime);
    if (params.endTime) query.set('endTime', params.endTime);
    if (params.slot) query.set('slot', params.slot);
    if (params.bookingType) query.set('bookingType', params.bookingType);
    if (params.excludeId) query.set('excludeId', params.excludeId);
    return await request<{
      available: boolean;
      conflict?: string;
      conflictType?: string;
      details?: string;
      existingBooking?: any;
    }>(`bookings/check-availability?${query.toString()}`);
  },
};

// -------------------------------------------------------------
// Halls API
// -------------------------------------------------------------
export const hallsApi = {
  async list(): Promise<Hall[]> {
    const data = await request<any>('halls');
    return normalizeList<Hall>(data);
  },

  async get(id: string): Promise<Hall> {
    const data = await request<Hall>(`halls/${id}`);
    return normalizeId(data);
  },

  async create(payload: Partial<Hall> | any): Promise<Hall> {
    const data = await request<Hall>('halls', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<Hall> | any): Promise<Hall> {
    const data = await request<Hall>(`halls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`halls/${id}`, { method: 'DELETE' });
  },
};

// -------------------------------------------------------------
// Menu Packages API
// -------------------------------------------------------------
export const menuApi = {
  async list(): Promise<MenuPackage[]> {
    const data = await request<any>('menu-packages');
    return normalizeList<MenuPackage>(data);
  },

  async get(id: string): Promise<MenuPackage> {
    const data = await request<MenuPackage>(`menu-packages/${id}`);
    return normalizeId(data);
  },

  async create(payload: Partial<MenuPackage> | any): Promise<MenuPackage> {
    const data = await request<MenuPackage>('menu-packages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<MenuPackage> | any): Promise<MenuPackage> {
    const data = await request<MenuPackage>(`menu-packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`menu-packages/${id}`, { method: 'DELETE' });
  },
};

// -------------------------------------------------------------
// Invoices & Billing API
// -------------------------------------------------------------
export const invoicesApi = {
  async list(params?: { search?: string; status?: string }): Promise<InvoiceRecord[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    const qs = query.toString();
    const data = await request<any>(`invoices${qs ? `?${qs}` : ''}`);
    return normalizeList<InvoiceRecord>(data);
  },

  async get(id: string): Promise<InvoiceRecord> {
    const data = await request<InvoiceRecord>(`invoices/${id}`);
    return normalizeId(data);
  },

  async create(payload: Partial<InvoiceRecord> | any): Promise<InvoiceRecord> {
    const data = await request<InvoiceRecord>('invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<InvoiceRecord> | any): Promise<InvoiceRecord> {
    const data = await request<InvoiceRecord>(`invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async listInvoices(params?: { search?: string; status?: string }): Promise<InvoiceRecord[]> {
    return invoicesApi.list(params);
  },

  async recordCollection(id: string, payload: any): Promise<any> {
    return request<any>(`invoices/${id}/record-collection/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const financeApi = invoicesApi;

// -------------------------------------------------------------
// Expenses API
// -------------------------------------------------------------
export const expensesApi = {
  async list(params?: { category?: string; search?: string; bookingRef?: string }): Promise<ExpenseRecord[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.bookingRef) query.set('bookingRef', params.bookingRef);
    const qs = query.toString();
    const data = await request<any>(`expenses${qs ? `?${qs}` : ''}`);
    return normalizeList<ExpenseRecord>(data);
  },

  async create(payload: Partial<ExpenseRecord> | any): Promise<ExpenseRecord> {
    const data = await request<ExpenseRecord>('expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string | number, payload: Partial<ExpenseRecord> | any): Promise<ExpenseRecord> {
    const data = await request<ExpenseRecord>(`expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async delete(id: string | number): Promise<void> {
    await request(`expenses/${id}`, { method: 'DELETE' });
  },
};

// -------------------------------------------------------------
// Manager Fund Requests API (Manager <-> Accounts)
// -------------------------------------------------------------
export interface FundRequestItem {
  id: string;
  requestRef?: string;
  bookingRef?: string;
  eventName?: string;
  requestedBy: string;
  reason: string;
  amount: number;
  notes?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
}

export const fundRequestsApi = {
  async list(params?: { bookingRef?: string; status?: string }): Promise<FundRequestItem[]> {
    const query = new URLSearchParams();
    if (params?.bookingRef) query.set('bookingRef', params.bookingRef);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    const data = await request<any>(`fund-requests${qs ? `?${qs}` : ''}`);
    return normalizeList<FundRequestItem>(data);
  },

  async create(payload: Partial<FundRequestItem> | any): Promise<FundRequestItem> {
    const data = await request<FundRequestItem>('fund-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async approve(id: string | number): Promise<FundRequestItem> {
    const data = await request<FundRequestItem>(`fund-requests/${id}/approve`, {
      method: 'POST',
    });
    return normalizeId(data);
  },

  async reject(id: string | number): Promise<FundRequestItem> {
    const data = await request<FundRequestItem>(`fund-requests/${id}/reject`, {
      method: 'POST',
    });
    return normalizeId(data);
  },
};

// -------------------------------------------------------------
// Asset & Kitchen Requisitions API (Kitchen <-> Manager)
// -------------------------------------------------------------
export interface EventChecklistItem {
  id: string;
  eventRef: string;
  phase: 'Pre-Event Setup' | 'During Event' | 'Post-Event / Wrap-up' | string;
  taskName: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export const checklistsApi = {
  async list(eventRef?: string): Promise<EventChecklistItem[]> {
    const query = eventRef ? `?eventRef=${encodeURIComponent(eventRef)}` : '';
    const data = await request<EventChecklistItem[]>(`checklists${query}`);
    return normalizeList(data);
  },

  async create(payload: Partial<EventChecklistItem>): Promise<EventChecklistItem> {
    const data = await request<EventChecklistItem>('checklists/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async toggle(id: string, completedBy?: string): Promise<EventChecklistItem> {
    const data = await request<EventChecklistItem>(`checklists/${id}/toggle/`, {
      method: 'POST',
      body: JSON.stringify({ completedBy }),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`checklists/${id}/`, { method: 'DELETE' });
  },
};

export interface AssetRequisitionItem {
  id: string | number;
  requisitionRef: string;
  eventRef: string;
  hallName?: string;
  itemId?: number | string | null;
  itemCode?: string;
  itemName: string;
  requestedQuantity: number;
  unit?: string;
  estimatedCost?: number;
  requestedBy?: string;
  issuedQuantity: number;
  returnedQuantity: number;
  status: 'Requested' | 'Approved' | 'Issued' | 'Returned' | 'Shortage';
  notes?: string;
}

export const requisitionsApi = {
  async list(eventRef?: string): Promise<AssetRequisitionItem[]> {
    const query = new URLSearchParams();
    if (eventRef) query.set('eventRef', eventRef);
    const qs = query.toString();
    const data = await request<any>(`requisitions${qs ? `?${qs}` : ''}`);
    return normalizeList<AssetRequisitionItem>(data);
  },

  async create(payload: Partial<AssetRequisitionItem> | any): Promise<AssetRequisitionItem> {
    const data = await request<AssetRequisitionItem>('requisitions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async approve(id: string | number): Promise<AssetRequisitionItem> {
    const data = await request<AssetRequisitionItem>(`requisitions/${id}/approve`, {
      method: 'POST',
    });
    return normalizeId(data);
  },

  async approveIssue(id: string | number): Promise<AssetRequisitionItem> {
    const data = await request<AssetRequisitionItem>(`requisitions/${id}/approve-issue`, {
      method: 'POST',
    });
    return normalizeId(data);
  },

  async markReturned(id: string | number, returnedQuantity: number, notes?: string): Promise<AssetRequisitionItem> {
    const data = await request<AssetRequisitionItem>(`requisitions/${id}/mark-returned`, {
      method: 'POST',
      body: JSON.stringify({ returnedQuantity, notes }),
    });
    return normalizeId(data);
  },

  async delete(id: string | number): Promise<void> {
    await request(`requisitions/${id}`, { method: 'DELETE' });
  },
};

// -------------------------------------------------------------
// Vendors API
// -------------------------------------------------------------
export const vendorsApi = {
  async list(params?: { category?: string; search?: string }): Promise<VendorPartner[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    const data = await request<any>(`vendors${qs ? `?${qs}` : ''}`);
    return normalizeList<VendorPartner>(data);
  },

  async create(payload: Partial<VendorPartner> | any): Promise<VendorPartner> {
    const data = await request<VendorPartner>('vendors', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<VendorPartner> | any): Promise<VendorPartner> {
    const data = await request<VendorPartner>(`vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`vendors/${id}`, { method: 'DELETE' });
  },
};

// -------------------------------------------------------------
// Staff API
// -------------------------------------------------------------
export const staffApi = {
  async list(): Promise<StaffMember[]> {
    const data = await request<any>('staff');
    return normalizeList<StaffMember>(data);
  },

  async create(payload: Partial<StaffMember> | any): Promise<StaffMember> {
    const data = await request<StaffMember>('staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<StaffMember> | any): Promise<StaffMember> {
    const data = await request<StaffMember>(`staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`staff/${id}`, { method: 'DELETE' });
  },
};

// -------------------------------------------------------------
// Inventory API
// -------------------------------------------------------------
export const inventoryApi = {
  async list(): Promise<InventoryItem[]> {
    const data = await request<any>('inventory');
    return normalizeList<InventoryItem>(data);
  },

  async create(payload: Partial<InventoryItem> | any): Promise<InventoryItem> {
    const data = await request<InventoryItem>('inventory', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<InventoryItem> | any): Promise<InventoryItem> {
    const data = await request<InventoryItem>(`inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`inventory/${id}`, { method: 'DELETE' });
  },
};

// -------------------------------------------------------------
// Customers API
// -------------------------------------------------------------
export const customersApi = {
  async list(): Promise<Customer[]> {
    const data = await request<any>('customers');
    return normalizeList<Customer>(data);
  },

  async create(payload: Partial<Customer> | any): Promise<Customer> {
    const data = await request<Customer>('customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },
};

// -------------------------------------------------------------
// Payments API
// -------------------------------------------------------------
export const paymentsApi = {
  async list(): Promise<PaymentTransaction[]> {
    const data = await request<any>('payments');
    return normalizeList<PaymentTransaction>(data);
  },

  async create(payload: Partial<PaymentTransaction> | any): Promise<PaymentTransaction> {
    const data = await request<PaymentTransaction>('payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },
};

// -------------------------------------------------------------
// Blocked Dates API
// -------------------------------------------------------------
export const blockedDatesApi = {
  async list(): Promise<BlockedDate[]> {
    const data = await request<any>('blocked-dates');
    return normalizeList<BlockedDate>(data);
  },

  async create(payload: Partial<BlockedDate> | any): Promise<BlockedDate> {
    const data = await request<BlockedDate>('blocked-dates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`blocked-dates/${id}`, { method: 'DELETE' });
  },
};

// -------------------------------------------------------------
// Dashboard & Reports API
// -------------------------------------------------------------
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

export const dashboardApi = {
  async getMetrics(): Promise<any> {
    return request<any>('dashboard/metrics');
  },
  async getStats(): Promise<DashboardStatsResponse> {
    return request<DashboardStatsResponse>('dashboard/stats');
  },
  async getCharts(): Promise<any> {
    return request<any>('dashboard/charts');
  },
};

export const reportsApi = {
  async getSummary(params?: { startDate?: string; endDate?: string; hall?: string; bookingRef?: string }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.hall && params.hall !== 'All Halls') query.set('hall', params.hall);
    if (params?.bookingRef && params.bookingRef !== 'All' && params.bookingRef !== 'All Events') {
      query.set('bookingRef', params.bookingRef);
    }
    const qs = query.toString();
    return request<any>(`reports/summary${qs ? `?${qs}` : ''}`);
  },
};

// -------------------------------------------------------------
// Audit Logs API
// -------------------------------------------------------------
export const auditLogsApi = {
  async list(params?: { role?: string; action?: string; module?: string }): Promise<AuditLogEntry[]> {
    const query = new URLSearchParams();
    if (params?.role && params.role !== 'All') query.set('user_role', params.role);
    if (params?.action && params.action !== 'All') query.set('action', params.action);
    if (params?.module && params.module !== 'All') query.set('module', params.module);
    const qs = query.toString();
    const data = await request<any>(`audit-logs${qs ? `?${qs}` : ''}`);
    return normalizeList<AuditLogEntry>(data);
  },
};

// -------------------------------------------------------------
// Settings API
// -------------------------------------------------------------
export const settingsApi = {
  async get(): Promise<any> {
    return request<any>('settings');
  },
  async update(payload: any): Promise<any> {
    return request<any>('settings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// -------------------------------------------------------------
// Authentication API
// -------------------------------------------------------------
export const authApi = {
  async hasAdmin(): Promise<{ hasAdmin: boolean }> {
    return request<{ hasAdmin: boolean }>('auth/has-admin');
  },

  async registerAdmin(payload: {
    username: string;
    email?: string;
    password: string;
    fullName?: string;
    businessName?: string;
  }): Promise<{ token: string; access?: string; refresh?: string; user: AuthUser; message: string }> {
    const res = await request<{
      token: string;
      access?: string;
      refresh?: string;
      user: AuthUser;
      message: string;
    }>('auth/register-admin', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const jwtToken = res.access || res.token;
    if (jwtToken) {
      localStorage.setItem('mhms_jwt_access', jwtToken);
      localStorage.setItem('mhms_auth_token', jwtToken);
    }
    if (res.refresh) {
      localStorage.setItem('mhms_jwt_refresh', res.refresh);
    }
    if (res.user) {
      localStorage.setItem('mhms_user', JSON.stringify(res.user));
    }
    return res;
  },

  async login(payload: {
    username: string;
    password: string;
  }): Promise<{ token: string; access?: string; refresh?: string; user: AuthUser; message: string }> {
    const res = await request<{
      token: string;
      access?: string;
      refresh?: string;
      user: AuthUser;
      message: string;
    }>('auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const jwtToken = res.access || res.token;
    if (jwtToken) {
      localStorage.setItem('mhms_jwt_access', jwtToken);
      localStorage.setItem('mhms_auth_token', jwtToken);
    }
    if (res.refresh) {
      localStorage.setItem('mhms_jwt_refresh', res.refresh);
    }
    if (res.user) {
      localStorage.setItem('mhms_user', JSON.stringify(res.user));
    }
    return res;
  },

  async refreshJwt(): Promise<{ access: string }> {
    const refresh = localStorage.getItem('mhms_jwt_refresh');
    if (!refresh) throw new Error('No refresh token available');
    const res = await request<{ access: string }>('auth/jwt/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    });
    if (res.access) {
      localStorage.setItem('mhms_jwt_access', res.access);
      localStorage.setItem('mhms_auth_token', res.access);
    }
    return res;
  },

  async getMe(): Promise<AuthUser> {
    return request<AuthUser>('auth/me');
  },

  async logout(): Promise<{ message: string }> {
    const refresh = localStorage.getItem('mhms_jwt_refresh');
    try {
      return await request<{ message: string }>('auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
      });
    } finally {
      localStorage.removeItem('mhms_jwt_access');
      localStorage.removeItem('mhms_jwt_refresh');
      localStorage.removeItem('mhms_auth_token');
      localStorage.removeItem('mhms_user');
      localStorage.removeItem('token');
    }
  },

  async listUsers(): Promise<any[]> {
    return request<any[]>('auth/users');
  },

  async createUser(payload: {
    username: string;
    password: string;
    role: string;
    fullName?: string;
    email?: string;
    phone?: string;
    salary?: number;
  }): Promise<any> {
    return request<any>('auth/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateUser(id: number | string, payload: any): Promise<any> {
    return request<any>(`auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteUser(id: number | string): Promise<any> {
    return request<any>(`auth/users/${id}`, {
      method: 'DELETE',
    });
  },
};

export const systemApi = {
  async getStatus(): Promise<{ success: boolean; gitInfo: { branch: string; commit: string; message: string; date: string } }> {
    return request<{ success: boolean; gitInfo: { branch: string; commit: string; message: string; date: string } }>('system/update/');
  },

  async triggerUpdate(buildFrontend: boolean = true): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    gitInfo?: { branch: string; commit: string; message: string; date: string };
    logs?: string[];
  }> {
    return request<{
      success: boolean;
      message?: string;
      error?: string;
      gitInfo?: { branch: string; commit: string; message: string; date: string };
      logs?: string[];
    }>('system/update/', {
      method: 'POST',
      body: JSON.stringify({ buildFrontend }),
    });
  },
};

export interface PortalNotificationItem {
  id: string | number;
  targetRole: string;
  senderRole?: string;
  senderName?: string;
  type: string;
  title: string;
  description: string;
  targetNavId: string;
  actionLabel: string;
  relatedId?: string;
  status: string;
  isRead: boolean;
  createdAt: string;
}

export const portalNotificationsApi = {
  async list(role?: string): Promise<PortalNotificationItem[]> {
    const qs = role ? `?role=${encodeURIComponent(role)}` : '';
    const data = await request<any>(`portal-notifications${qs}`);
    return normalizeList<PortalNotificationItem>(data);
  },

  async markAllRead(role?: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('portal-notifications/mark-all-read/', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  },

  async respond(id: string | number, action: 'accept' | 'reject', reviewerName?: string): Promise<{ success: boolean; status: string; message: string }> {
    return request<{ success: boolean; status: string; message: string }>(`portal-notifications/${id}/respond/`, {
      method: 'POST',
      body: JSON.stringify({ action, reviewerName }),
    });
  },
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
  system: systemApi,
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
