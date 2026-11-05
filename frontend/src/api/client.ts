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
  ContractorLaborShift,
  AuditLogEntry,
  ExtraTimeRequest,
  FeedbackLogEntry,
  AuthUser,
  Recipe,
  RecipeIngredient,
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

  const token = localStorage.getItem('mhms_auth_token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Token ${token}`);
  }

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

  async updateOperationalStatus(id: string, operationalStatus: string): Promise<Booking> {
    const data = await request<Booking>(`bookings/${id}/update-operational-status/`, {
      method: 'POST',
      body: JSON.stringify({ operationalStatus }),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`bookings/${id}`, { method: 'DELETE' });
  },

  async checkAvailability(
    paramsOrHall: string | { hall: string; date: string; slot?: string; startTime?: string; endTime?: string; excludeId?: string },
    date?: string,
    slot?: string,
    startTime?: string,
    endTime?: string
  ): Promise<{
    available: boolean;
    conflict?: string;
    details?: string;
    conflictType?: string;
    existingBooking?: any;
  }> {
    let hallVal = '';
    let dateVal = '';
    let slotVal = slot;
    let startVal = startTime;
    let endVal = endTime;
    let excludeIdVal: string | undefined;

    if (typeof paramsOrHall === 'object') {
      hallVal = paramsOrHall.hall;
      dateVal = paramsOrHall.date;
      slotVal = paramsOrHall.slot;
      startVal = paramsOrHall.startTime;
      endVal = paramsOrHall.endTime;
      excludeIdVal = paramsOrHall.excludeId;
    } else {
      hallVal = paramsOrHall;
      dateVal = date || '';
    }

    const query = new URLSearchParams();
    if (hallVal) query.set('hall', hallVal);
    if (dateVal) query.set('date', dateVal);
    if (slotVal) query.set('slot', slotVal);
    if (startVal) query.set('startTime', startVal);
    if (endVal) query.set('endTime', endVal);
    if (excludeIdVal) query.set('excludeId', excludeIdVal);

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
// Hall & Table Floor Monitoring API (Waiter Kiosk Task 5.1)
// -------------------------------------------------------------
export interface HallTableStatusItem {
  id: string;
  eventRef: string;
  hallName: string;
  tableNumber: string;
  sector: 'VIP Stage' | 'Family Sector A' | 'General Sector B' | 'Bridal Lounge';
  capacity: number;
  status: 'Ready' | 'Seated' | 'Served' | 'Needs Clearing' | 'Cleaned';
  assignedWaiter?: string;
  notes?: string;
  updatedAt?: string;
}

export const tablesApi = {
  async list(params?: { eventRef?: string; hallName?: string; status?: string }): Promise<HallTableStatusItem[]> {
    const query = new URLSearchParams();
    if (params?.eventRef && params.eventRef !== 'All') query.set('event_ref', params.eventRef);
    if (params?.hallName && params.hallName !== 'All') query.set('hall_name', params.hallName);
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    const qs = query.toString();
    const data = await request<HallTableStatusItem[]>(`tables${qs ? `?${qs}` : ''}`);
    return normalizeList(data);
  },

  async toggleStatus(id: string, payload?: { status?: string; assignedWaiter?: string }): Promise<HallTableStatusItem> {
    const data = await request<HallTableStatusItem>(`tables/${id}/toggle-status`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
    return normalizeId(data);
  },

  async initTables(eventRef: string, hallName: string): Promise<HallTableStatusItem[]> {
    const data = await request<HallTableStatusItem[]>('tables/init-tables', {
      method: 'POST',
      body: JSON.stringify({ eventRef, hallName }),
    });
    return normalizeList(data);
  },

  async update(id: string, payload: Partial<HallTableStatusItem>): Promise<HallTableStatusItem> {
    const data = await request<HallTableStatusItem>(`tables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
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
// Kitchen Recipes & Dish Costing API (Task 4.3)
// -------------------------------------------------------------
export const recipesApi = {
  async list(params?: { category?: string; search?: string }): Promise<Recipe[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    const data = await request<Recipe[]>(`recipes${qs ? `?${qs}` : ''}`);
    return normalizeList(data);
  },

  async create(payload: Partial<Recipe>): Promise<Recipe> {
    const data = await request<Recipe>('recipes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<Recipe>): Promise<Recipe> {
    const data = await request<Recipe>(`recipes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`recipes/${id}`, { method: 'DELETE' });
  },
};


// -------------------------------------------------------------
// Event Live Checklist API (Manager Portal Task 3.4)
// -------------------------------------------------------------
export interface EventChecklistItem {
  id: string;
  eventRef: string;
  phase: 'Pre-Event Setup' | 'During Event' | 'Post-Event / Wrap-up';
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

// -------------------------------------------------------------
// Kitchen Display Screen (KDS) API (Task 4.1)
// -------------------------------------------------------------
export interface KitchenOrderTicketItem {
  id: string;
  ticketNumber: string;
  eventRef: string;
  hallName: string;
  dishName: string;
  quantity: number;
  portionSize: string;
  priority: 'Normal' | 'Urgent' | 'Critical';
  status: 'Refill Requested' | 'In Preparation' | 'Ready for Pickup' | 'Dispatched to Hall' | 'Completed' | 'Cancelled';
  station: string;
  requestedBy: string;
  chefAssigned?: string;
  notes?: string;
  createdAt?: string;
  inPrepAt?: string | null;
  readyAt?: string | null;
  dispatchedAt?: string | null;
}

export const kdsApi = {
  async list(params?: { eventRef?: string; status?: string; hallName?: string }): Promise<KitchenOrderTicketItem[]> {
    const query = new URLSearchParams();
    if (params?.eventRef && params.eventRef !== 'All') query.set('event_ref', params.eventRef);
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    if (params?.hallName && params.hallName !== 'All') query.set('hall_name', params.hallName);
    const qs = query.toString();
    const data = await request<KitchenOrderTicketItem[]>(`kds-tickets${qs ? `?${qs}` : ''}`);
    return normalizeList(data);
  },

  async create(payload: Partial<KitchenOrderTicketItem>): Promise<KitchenOrderTicketItem> {
    const data = await request<KitchenOrderTicketItem>('kds-tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<KitchenOrderTicketItem>): Promise<KitchenOrderTicketItem> {
    const data = await request<KitchenOrderTicketItem>(`kds-tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async advanceStatus(id: string, payload?: { status?: string; chefAssigned?: string }): Promise<KitchenOrderTicketItem> {
    const data = await request<KitchenOrderTicketItem>(`kds-tickets/${id}/advance`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`kds-tickets/${id}`, { method: 'DELETE' });
  },
};

// -------------------------------------------------------------
// Kitchen Pantry & Raw Material Inventory API (Task 4.2)
// -------------------------------------------------------------
export interface PantryStockItem {
  id: string;
  itemCode: string;
  name: string;
  itemName?: string;
  category: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  reorderQuantity: number;
  unitPrice: number;
  unitCost?: number;
  preferredSupplier: string;
  supplierContact?: string;
  storageLocation: string;
  notes?: string;
  isLowStock: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PantryPurchaseOrder {
  id: string;
  orderRef: string;
  poNumber?: string;
  itemId?: number;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  unitCost?: number;
  totalCost: number;
  supplierName: string;
  supplierContact?: string;
  urgency?: 'Normal' | 'Urgent' | 'Critical Emergency';
  status: 'Draft' | 'Ordered' | 'Received & Stocked' | 'Cancelled' | 'Received' | 'Pending';
  orderedBy?: string;
  orderedAt?: string;
  deliveryDate?: string;
  grnNumber?: string;
  receivedBy?: string;
  receivedAt?: string | null;
  notes?: string;
}

export type PantryPurchaseOrderItem = PantryPurchaseOrder;

export const pantryApi = {
  async listItems(params?: { category?: string; search?: string }): Promise<PantryStockItem[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    const data = await request<PantryStockItem[]>(`pantry-items${qs ? `?${qs}` : ''}`);
    return normalizeList(data).map((item) => ({
      ...item,
      itemName: item.itemName || item.name,
      unitCost: item.unitCost !== undefined ? item.unitCost : item.unitPrice,
    }));
  },

  async createItem(payload: Partial<PantryStockItem>): Promise<PantryStockItem> {
    const data = await request<PantryStockItem>('pantry-items', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async updateItem(id: string, payload: Partial<PantryStockItem>): Promise<PantryStockItem> {
    const data = await request<PantryStockItem>(`pantry-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async adjustStock(id: string, adjustment: number, reason: string, staffName?: string): Promise<PantryStockItem> {
    const data = await request<PantryStockItem>(`pantry-items/${id}/adjust_stock`, {
      method: 'POST',
      body: JSON.stringify({ adjustment, reason, staffName }),
    });
    return normalizeId(data);
  },

  async quickOrder(id: string, payload: {
    quantity?: number;
    supplierName?: string;
    supplierContact?: string;
    urgency?: string;
    orderedBy?: string;
    notes?: string;
  }): Promise<PantryPurchaseOrder> {
    const data = await request<PantryPurchaseOrder>(`pantry-items/${id}/quick_order`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async listOrders(params?: { status?: string }): Promise<PantryPurchaseOrder[]> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    const qs = query.toString();
    const data = await request<PantryPurchaseOrder[]>(`pantry-orders${qs ? `?${qs}` : ''}`);
    return normalizeList(data).map((order) => ({
      ...order,
      poNumber: order.poNumber || order.orderRef,
      unitCost: order.unitCost !== undefined ? order.unitCost : order.unitPrice,
    }));
  },

  listPOs(params?: { status?: string }): Promise<PantryPurchaseOrder[]> {
    return pantryApi.listOrders(params);
  },

  listStock(params?: { category?: string; search?: string }): Promise<PantryStockItem[]> {
    return pantryApi.listItems(params);
  },

  async createPO(payload: any): Promise<PantryPurchaseOrder> {
    const body: any = {
      item_name: payload.itemName || payload.name,
      supplier_name: payload.supplierName,
      quantity: payload.quantity,
      unit: payload.unit,
      unit_price: payload.unitCost !== undefined ? payload.unitCost : payload.unitPrice,
      total_cost: payload.totalCost !== undefined ? payload.totalCost : (payload.quantity * (payload.unitCost || payload.unitPrice || 0)),
      status: payload.status || 'Ordered',
      notes: payload.notes || '',
      ordered_by: payload.orderedBy || 'Vendor Purchasing',
      urgency: payload.urgency || 'Normal',
    };
    if (payload.deliveryDate) {
      body.notes = `${body.notes} [Delivery: ${payload.deliveryDate}]`.trim();
    }
    const data = await request<PantryPurchaseOrder>('pantry-orders', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const normalized = normalizeId(data);
    return {
      ...normalized,
      poNumber: normalized.poNumber || normalized.orderRef,
      unitCost: normalized.unitCost !== undefined ? normalized.unitCost : normalized.unitPrice,
    };
  },

  async receivePO(orderId: string, payload?: any): Promise<PantryPurchaseOrder> {
    const data = await pantryApi.markOrderReceived(orderId, payload?.receivedBy);
    return {
      ...data,
      poNumber: data.poNumber || data.orderRef,
      unitCost: data.unitCost !== undefined ? data.unitCost : data.unitPrice,
    };
  },

  async markOrderReceived(orderId: string, receivedBy?: string): Promise<PantryPurchaseOrder> {
    const data = await request<PantryPurchaseOrder>(`pantry-orders/${orderId}/mark_received`, {
      method: 'POST',
      body: JSON.stringify({ receivedBy }),
    });
    return normalizeId(data);
  },

  async cancelOrder(orderId: string, reason?: string): Promise<PantryPurchaseOrder> {
    const data = await request<PantryPurchaseOrder>(`pantry-orders/${orderId}/cancel_order`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return normalizeId(data);
  },

  async bulkRequisition(payload: {
    items: {
      itemId: number | string;
      quantity: number;
      supplierName?: string;
      unitPrice?: number;
      notes?: string;
    }[];
    eventRef?: string;
    orderedBy?: string;
    urgency?: string;
  }): Promise<PantryPurchaseOrder[]> {
    const data = await request<PantryPurchaseOrder[]>('pantry-orders/bulk-requisition', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeList(data);
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
// Asset & Inventory Requisitions API (Manager Portal Task 3.3)
// -------------------------------------------------------------
export interface AssetRequisitionItem {
  id: string;
  requisitionRef: string;
  eventRef: string;
  hallName: string;
  itemId?: number | null;
  itemCode: string;
  itemName: string;
  requestedQuantity: number;
  issuedQuantity: number;
  returnedQuantity: number;
  status: 'Requested' | 'Approved' | 'Issued' | 'Returned' | 'Shortage';
  notes?: string;
}

export const requisitionsApi = {
  async list(eventRef?: string): Promise<AssetRequisitionItem[]> {
    const query = eventRef ? `?eventRef=${encodeURIComponent(eventRef)}` : '';
    const data = await request<AssetRequisitionItem[]>(`requisitions${query}`);
    return normalizeList(data);
  },

  async create(payload: Partial<AssetRequisitionItem>): Promise<AssetRequisitionItem> {
    const data = await request<AssetRequisitionItem>('requisitions/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async approveIssue(id: string): Promise<AssetRequisitionItem> {
    const data = await request<AssetRequisitionItem>(`requisitions/${id}/approve-issue/`, {
      method: 'POST',
    });
    return normalizeId(data);
  },

  async markReturned(id: string, returnedQuantity?: number, notes?: string): Promise<AssetRequisitionItem> {
    const data = await request<AssetRequisitionItem>(`requisitions/${id}/mark-returned/`, {
      method: 'POST',
      body: JSON.stringify({ returnedQuantity, notes }),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`requisitions/${id}/`, { method: 'DELETE' });
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

  async recordCollection(
    id: string,
    payload: { amount: number; channel?: string; transactionRef?: string; notes?: string }
  ): Promise<{ message: string; invoice: InvoiceRecord; transactionRef: string }> {
    return request(`invoices/${id}/record-collection`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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

export const expensesApi = {
  list: financeApi.listExpenses,
  create: financeApi.createExpense,
  delete: financeApi.deleteExpense,
};

// -------------------------------------------------------------
// Security Deposit Settlement API (Manager Portal Task 3.5)
// -------------------------------------------------------------
export interface SecurityDepositSettlement {
  id: string;
  settlementRef: string;
  bookingRef: string;
  customerName: string;
  hallName: string;
  eventDate: string;
  depositHeld: number;
  damageDeductions: number;
  damageNotes?: string;
  overtimeHours: number;
  overtimeRatePerHour: number;
  overtimeCharges: number;
  otherDeductions: number;
  otherNotes?: string;
  netRefundAmount: number;
  refundChannel: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Adjustment';
  refundReference?: string;
  status: 'Held' | 'Settled' | 'Forfeited';
  settledAt?: string | null;
  settledBy?: string;
  clientSignatureAcknowledged: boolean;
  createdAt?: string;
}

export const depositSettlementsApi = {
  async list(params?: { status?: string; bookingRef?: string }): Promise<SecurityDepositSettlement[]> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    if (params?.bookingRef) query.set('booking_ref', params.bookingRef);
    const qs = query.toString();
    const data = await request<SecurityDepositSettlement[]>(`deposit-settlements${qs ? `?${qs}` : ''}`);
    return normalizeList(data);
  },

  async create(payload: Partial<SecurityDepositSettlement>): Promise<SecurityDepositSettlement> {
    const data = await request<SecurityDepositSettlement>('deposit-settlements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<SecurityDepositSettlement>): Promise<SecurityDepositSettlement> {
    const data = await request<SecurityDepositSettlement>(`deposit-settlements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async finalize(id: string, payload: {
    settledBy?: string;
    refundChannel?: string;
    refundReference?: string;
    clientSignatureAcknowledged?: boolean;
  }): Promise<SecurityDepositSettlement> {
    const data = await request<SecurityDepositSettlement>(`deposit-settlements/${id}/finalize_settlement`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
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

  async recordVendorPayment(
    id: string,
    payload: { amount: number; channel?: string; transactionRef?: string; notes?: string }
  ): Promise<{ message: string; vendor: VendorPartner; expenseRef: string; txnRef: string }> {
    return request(`vendors/${id}/record-payment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async addVendorBill(
    id: string,
    payload: { amount: number; invoiceRef?: string; notes?: string }
  ): Promise<{ message: string; vendor: VendorPartner }> {
    return request(`vendors/${id}/add-bill`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const contractorLaborApi = {
  async list(params?: { bookingRef?: string }): Promise<ContractorLaborShift[]> {
    const qs = params?.bookingRef ? `?bookingRef=${encodeURIComponent(params.bookingRef)}` : '';
    const data = await request<ContractorLaborShift[]>(`contractor-labor-shifts${qs}`);
    return normalizeList(data);
  },

  async create(payload: Partial<ContractorLaborShift>): Promise<ContractorLaborShift> {
    const data = await request<ContractorLaborShift>('contractor-labor-shifts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<ContractorLaborShift>): Promise<ContractorLaborShift> {
    const data = await request<ContractorLaborShift>(`contractor-labor-shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`contractor-labor-shifts/${id}`, { method: 'DELETE' });
  },

  async postToExpenses(id: string): Promise<{ message: string; expenseRef: string; shift: ContractorLaborShift }> {
    return request(`contractor-labor-shifts/${id}/post-to-expenses`, {
      method: 'POST',
    });
  },
};

// -------------------------------------------------------------
// Duty Rosters API (Manager Team Coordination)
// -------------------------------------------------------------
export interface DutyRosterItem {
  id: string;
  eventRef: string;
  staffId?: number | null;
  staffName: string;
  teamRole: string;
  shiftStatus: 'Present' | 'Absent' | 'Replaced';
  replacementName?: string;
  notes?: string;
}

export const rostersApi = {
  async list(eventRef?: string): Promise<DutyRosterItem[]> {
    const query = eventRef ? `?eventRef=${encodeURIComponent(eventRef)}` : '';
    const data = await request<DutyRosterItem[]>(`duty-rosters${query}`);
    return normalizeList(data);
  },

  async create(payload: Partial<DutyRosterItem>): Promise<DutyRosterItem> {
    const data = await request<DutyRosterItem>('duty-rosters/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async update(id: string, payload: Partial<DutyRosterItem>): Promise<DutyRosterItem> {
    const data = await request<DutyRosterItem>(`duty-rosters/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`duty-rosters/${id}/`, { method: 'DELETE' });
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

// -------------------------------------------------------------
// Feedback & Reviews API
// -------------------------------------------------------------
export const feedbackApi = {
  async list(params?: { rating?: number; eventType?: string; search?: string }): Promise<FeedbackLogEntry[]> {
    const query = new URLSearchParams();
    if (params?.rating) query.set('rating', String(params.rating));
    if (params?.eventType && params.eventType !== 'All') query.set('event_type', params.eventType);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    const data = await request<FeedbackLogEntry[]>(`feedback${qs ? `?${qs}` : ''}`);
    return normalizeList(data);
  },

  async create(payload: Partial<FeedbackLogEntry>): Promise<FeedbackLogEntry> {
    const data = await request<FeedbackLogEntry>('feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeId(data);
  },

  async delete(id: string): Promise<void> {
    await request(`feedback/${id}`, { method: 'DELETE' });
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
  }): Promise<{ token: string; user: AuthUser; message: string }> {
    return request<{ token: string; user: AuthUser; message: string }>('auth/register-admin', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async login(payload: {
    username: string;
    password: string;
  }): Promise<{ token: string; user: AuthUser; message: string }> {
    return request<{ token: string; user: AuthUser; message: string }>('auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMe(): Promise<AuthUser> {
    return request<AuthUser>('auth/me');
  },

  async logout(): Promise<{ message: string }> {
    try {
      return await request<{ message: string }>('auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('mhms_auth_token');
      localStorage.removeItem('mhms_user');
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
