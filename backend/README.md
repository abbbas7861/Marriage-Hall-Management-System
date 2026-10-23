# Marriage Hall Management System (MHMS) Enterprise Backend

A high-performance modular Django REST Framework backend designed to power the Marriage Hall Management System React frontend.

---

## 🏗️ Architecture & Apps

| App | Scope & Endpoints | Models |
|---|---|---|
| `apps.venues` | `/api/v1/halls/`, `/api/v1/blocked-dates/` | `Hall`, `BlockedDate` |
| `apps.bookings` | `/api/v1/bookings/`, `/api/v1/bookings/check_availability/`, `/api/v1/extra-time-requests/` | `Booking`, `ExtraTimeRequest` |
| `apps.customers` | `/api/v1/customers/` | `Customer` CRM ledger |
| `apps.events_catering` | `/api/v1/event-types/`, `/api/v1/menu-packages/` | `EventTypeConfig`, `MenuPackage` |
| `apps.inventory` | `/api/v1/inventory/`, `/api/v1/inventory/{id}/issue/` | `InventoryItem` |
| `apps.finance` | `/api/v1/invoices/`, `/api/v1/payments/`, `/api/v1/expenses/` | `InvoiceRecord`, `PaymentTransaction`, `ExpenseRecord` |
| `apps.workforce` | `/api/v1/staff/`, `/api/v1/vendors/` | `StaffMember`, `VendorPartner` |
| `apps.core` | `/api/v1/settings/`, `/api/v1/dashboard/metrics/`, `/api/v1/reports/summary/`, `/api/v1/audit-logs/` | `SystemSetting`, `AuditLogEntry` |

---

## 🚀 Quickstart

### 1. Activate Virtual Environment
```bash
cd backend
source venv/bin/activate
```

### 2. Apply Database Migrations
```bash
python manage.py migrate
```

### 3. Seed Realistic Enterprise Demo Data
```bash
python manage.py seed_data
```
Populates System Settings, 4 Halls, 4 Event Types, 3 Menu Packages, 3 Customers, Bookings, Invoices, Transactions, Inventory, Staff & Vendors, Expenses, and Audit Logs.

### 4. Run Development Server
```bash
python manage.py runserver 8000
```
API endpoints will be live at `http://localhost:8000/api/v1/`.

### 5. Run Test Suite
```bash
python manage.py test
```
All integration and synchronization tests will execute.

---

## 🔗 Frontend Connection
The React frontend in `../frontend` is pre-configured with `VITE_API_BASE_URL=http://localhost:8000/api/v1` via `frontend/.env` and Vite proxy in `frontend/vite.config.ts`.
CORS is enabled for all origins during development in `backend/config/settings.py`.

