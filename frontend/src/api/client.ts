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
} from '../types';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://127.0.0.1:8000/api/v1';

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

function normalizeList<T extends { id?: string | number }>(list: T[]): T[] {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeId);
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const fullUrl = `${API_BASE_URL.replace(/\/+$/, '')}/${normalizePath(cleanEndpoint)}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(fullUrl, config);
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (typeof errorJson === 'object' && errorJson !== null) {
          const detail =
            errorJson.detail ||
            errorJson.message ||
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
    console.error(`API Error on [${options.method || 'GET'}] ${fullUrl}:`, err);
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
  }): Promise<Booking[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.hall && params.hall !== 'All Halls') query.set('hall', params.hall);
    if (params?.status && params.status !== 'All Statuses') query.set('status', params.status);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);

    const qs = query.toString();
    const data = await request<Booking[]>(`bookings${qs ? `?${qs}` : ''}`);
    return normalizeList(data);
  },

  async get(id: string): Promise<Booking> {
    const data = await request<Booking>(`bookings/${id}`);
    return normalizeId(data);
  },

  async create(payload: Partial<Booking>): Promise<Booking> {
    const data = await request<Booking>('bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<Booking>): Promise<Booking> {
    const data = await request<Booking>(`bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`bookings/${id}`, { method: 'DELETE' });
  },

  async checkAvailability(hall: string, date: string, slot?: string): Promise<{ available: boolean; conflict?: any }> {
    const query = new URLSearchParams({ hall, date });
    if (slot) query.set('slot', slot);
    return request(`bookings/check_availability?${query.toString()}`);
  },
};

// -------------------------------------------------------------
// Halls & Blocked Dates API
// -------------------------------------------------------------
export const hallsApi = {
  async list(): Promise<Hall[]> {
    const data = await request<Hall[]>('halls');
    return normalizeList(data);
  },

  async create(payload: Partial<Hall>): Promise<Hall> {
    const data = await request<Hall>('halls', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<Hall>): Promise<Hall> {
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

export const blockedDatesApi = {
  async list(): Promise<BlockedDate[]> {
    const data = await request<BlockedDate[]>('blocked-dates');
    return normalizeList(data);
  },

  async create(payload: Partial<BlockedDate>): Promise<BlockedDate> {
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
// Customers API
// -------------------------------------------------------------
export const customersApi = {
  async list(params?: { search?: string; status?: string }): Promise<Customer[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    const qs = query.toString();
    const data = await request<Customer[]>(`customers${qs ? `?${qs}` : ''}`);
    return normalizeList(data);
  },

  async create(payload: Partial<Customer>): Promise<Customer> {
    const data = await request<Customer>('customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<Customer>): Promise<Customer> {
    const data = await request<Customer>(`customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`customers/${id}`, { method: 'DELETE' });
  },
};

// -------------------------------------------------------------
// Events & Catering API
// -------------------------------------------------------------
export const eventTypesApi = {
  async list(): Promise<EventTypeConfig[]> {
    const data = await request<EventTypeConfig[]>('event-types');
    return normalizeList(data);
  },

  async create(payload: Partial<EventTypeConfig>): Promise<EventTypeConfig> {
    const data = await request<EventTypeConfig>('event-types', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<EventTypeConfig>): Promise<EventTypeConfig> {
    const data = await request<EventTypeConfig>(`event-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`event-types/${id}`, { method: 'DELETE' });
  },
};

export const menuPackagesApi = {
  async list(): Promise<MenuPackage[]> {
    const data = await request<MenuPackage[]>('menu-packages');
    return normalizeList(data);
  },

  async create(payload: Partial<MenuPackage>): Promise<MenuPackage> {
    const data = await request<MenuPackage>('menu-packages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<MenuPackage>): Promise<MenuPackage> {
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
// Inventory API
// -------------------------------------------------------------
export const inventoryApi = {
  async list(params?: { category?: string; search?: string }): Promise<InventoryItem[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    const data = await request<InventoryItem[]>(`inventory${qs ? `?${qs}` : ''}`);
    return normalizeList(data);
  },

  async create(payload: Partial<InventoryItem>): Promise<InventoryItem> {
    const data = await request<InventoryItem>('inventory', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<InventoryItem>): Promise<InventoryItem> {
    const data = await request<InventoryItem>(`inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`inventory/${id}`, { method: 'DELETE' });
  },

  async issue(id: string, quantity: number, bookingRef?: string): Promise<InventoryItem> {
    const data = await request<InventoryItem>(`inventory/${id}/issue`, {
      method: 'POST',
      body: JSON.stringify({ quantity, bookingRef }),
    });
    return normalizeId(data);
  },
};

// -------------------------------------------------------------
// Finance API (Invoices, Payments, Expenses)
// -------------------------------------------------------------
export const financeApi = {
  async listInvoices(): Promise<InvoiceRecord[]> {
    const data = await request<InvoiceRecord[]>('invoices');
    return normalizeList(data);
  },

  async createInvoice(payload: Partial<InvoiceRecord>): Promise<InvoiceRecord> {
    const data = await request<InvoiceRecord>('invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async listTransactions(): Promise<PaymentTransaction[]> {
    const data = await request<PaymentTransaction[]>('payments');
    return normalizeList(data);
  },

  async createTransaction(payload: Partial<PaymentTransaction>): Promise<PaymentTransaction> {
    const data = await request<PaymentTransaction>('payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async listExpenses(): Promise<ExpenseRecord[]> {
    const data = await request<ExpenseRecord[]>('expenses');
    return normalizeList(data);
  },

  async createExpense(payload: Partial<ExpenseRecord>): Promise<ExpenseRecord> {
    const data = await request<ExpenseRecord>('expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async deleteExpense(id: string): Promise<void> {
    await request(`expenses/${id}`, { method: 'DELETE' });
  },
};

// -------------------------------------------------------------
// Workforce API (Staff & Vendors)
// -------------------------------------------------------------
export const workforceApi = {
  async listStaff(): Promise<StaffMember[]> {
    const data = await request<StaffMember[]>('staff');
    return normalizeList(data);
  },

  async createStaff(payload: Partial<StaffMember>): Promise<StaffMember> {
    const data = await request<StaffMember>('staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async updateStaff(id: string, payload: Partial<StaffMember>): Promise<StaffMember> {
    const data = await request<StaffMember>(`staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async deleteStaff(id: string): Promise<void> {
    await request(`staff/${id}`, { method: 'DELETE' });
  },

  async listVendors(): Promise<VendorPartner[]> {
    const data = await request<VendorPartner[]>('vendors');
    return normalizeList(data);
  },

  async createVendor(payload: Partial<VendorPartner>): Promise<VendorPartner> {
    const data = await request<VendorPartner>('vendors', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async updateVendor(id: string, payload: Partial<VendorPartner>): Promise<VendorPartner> {
    const data = await request<VendorPartner>(`vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async deleteVendor(id: string): Promise<void> {
    await request(`vendors/${id}`, { method: 'DELETE' });
  },
};

// -------------------------------------------------------------
// Floor Staff & Extra Time Requests API
// -------------------------------------------------------------
export const floorStaffApi = {
  async listExtraTimeRequests(): Promise<ExtraTimeRequest[]> {
    const data = await request<ExtraTimeRequest[]>('extra-time-requests');
    return normalizeList(data);
  },

  async createExtraTimeRequest(payload: Partial<ExtraTimeRequest>): Promise<ExtraTimeRequest> {
    const data = await request<ExtraTimeRequest>('extra-time-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async approveExtraTimeRequest(id: string): Promise<ExtraTimeRequest> {
    const data = await request<ExtraTimeRequest>(`extra-time-requests/${id}/approve`, {
      method: 'POST',
    });
    return normalizeId(data);
  },

  async rejectExtraTimeRequest(id: string): Promise<ExtraTimeRequest> {
    const data = await request<ExtraTimeRequest>(`extra-time-requests/${id}/reject`, {
      method: 'POST',
    });
    return normalizeId(data);
  },
};

// -------------------------------------------------------------
// Core System (Audit Logs, Settings, Dashboard, Reports)
// -------------------------------------------------------------
export const auditLogsApi = {
  async list(params?: {
    search?: string;
    role?: string;
    action?: string;
    module?: string;
  }): Promise<AuditLogEntry[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.role && params.role !== 'All') query.set('user_role', params.role);
    if (params?.action && params.action !== 'All') query.set('action', params.action);
    if (params?.module && params.module !== 'All') query.set('module', params.module);
    const qs = query.toString();
    const data = await request<AuditLogEntry[]>(`audit-logs${qs ? `?${qs}` : ''}`);
    return normalizeList(data);
  },

  async create(payload: Partial<AuditLogEntry>): Promise<AuditLogEntry> {
    const data = await request<AuditLogEntry>('audit-logs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  getExportUrl(format: 'csv' | 'json' = 'csv'): string {
    return `${API_BASE_URL.replace(/\/+$/, '')}/audit-logs/export/?format=${format}`;
  },
};

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

export const dashboardApi = {
  async getMetrics(): Promise<any> {
    return request<any>('dashboard/metrics');
  },
};

export const reportsApi = {
  async getSummary(params?: {
    startDate?: string;
    endDate?: string;
    hall?: string;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.hall && params.hall !== 'All Halls') query.set('hall', params.hall);
    const qs = query.toString();
    return request<any>(`reports/summary${qs ? `?${qs}` : ''}`);
  },
};
