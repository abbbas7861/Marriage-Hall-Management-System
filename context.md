# Marriage Hall Management System (MHMS) Enterprise - Project Context & Audit

> **Generated on:** October 28, 2026  
> **Repository:** `https://github.com/abbbas7861/Marriage-Hall-Management-System.git`  
> **Local Workspace:** `/home/salman/DjangoProject/MarriageHall`  
> **Status:** Full-Stack Active (Django 5.x REST API + React 19 + TypeScript + Vite + Tailwind CSS)

---

## 1. Executive Summary & System Overview

The **Marriage Hall Management System (MHMS) Enterprise** is a comprehensive ERP and venue management solution designed specifically for banquet halls, marriage lawns, event complexes, and marquee venues.

The platform provides administrative control over:
- **Hall & Venue Registry:** Multi-hall floor management, guest capacity tiers, pricing structures, and maintenance blocks.
- **Bookings & Reservations:** Customer booking pipeline, slot allocations (Morning/Evening/Night), event packages, and automated CRM record generation.
- **Catering & Menu Engineering:** Preset catering tiers, dish customization, per-head pricing, and menu package assignments.
- **Operational Inventory & Assets:** Tracking furniture, decor, lighting, and electronic equipment, with dispatch (issue) and return workflows.
- **Finance, Invoicing & Billing:** Auto-invoicing, advance deposit tracking, settlement ledgers, tax/FBR integration readiness, and expense claims.
- **Workforce & Vendor Logistics:** Floor staff duty shifts, third-party vendor directories (decorators, caterers, sound/lights), and tablet-based floor supervision.
- **Client Engagement & Studio:** Live invitation card previewer (`Card Studio`), customer review collection (`Feedback & Reviews`), and WhatsApp notification triggers.
- **Governance & Analytics:** Audit log ledger with export capabilities, real-time revenue analytics, hall occupancy charts, and financial statements.

---

## 2. Tech Stack & Environment

### Frontend
- **Framework:** React 19.0.1 (`frontend/`)
- **Language:** TypeScript 5.8
- **Build Tool:** Vite 8.3.5
- **Styling:** Tailwind CSS 4.x with Lucide React 0.546 icons
- **Visualizations:** Recharts 3.10 (LineCharts, PieCharts, BarCharts)
- **Data Export:** `react-csv` 2.2.2
- **API Communication:** Fetch-based strongly-typed client (`frontend/src/api/client.ts`) targeting `http://127.0.0.1:8000/api/v1`

### Backend
- **Framework:** Django 5.x / Django REST Framework (`backend/`)
- **Virtual Environment:** Python 3.12 (`backend/venv/`)
- **Database:** SQLite (`backend/db.sqlite3`)
- **CORS:** `django-cors-headers` (Configured for universal development origins)
- **Filtering:** `django-filter` 24.x + REST Framework SearchFilter & OrderingFilter
- **Architecture:** 8 Modular Django Apps (`apps/core`, `apps/venues`, `apps/customers`, `apps/events_catering`, `apps/bookings`, `apps/inventory`, `apps/finance`, `apps/workforce`)

---

## 3. Database State & Backend Endpoints

The backend database contains initialized data and fully registered database models:

| App | Model | Existing DB Records | Active Endpoints |
|---|---|---|---|
| **venues** | `Hall` | 4 records | `GET/POST/PUT/DELETE /api/v1/halls/` |
| **venues** | `BlockedDate` | 0 records | `GET/POST/PUT/DELETE /api/v1/blocked-dates/` |
| **customers** | `Customer` | 3 records | `GET/POST/PUT/DELETE /api/v1/customers/` |
| **customers** | `FeedbackReview` | 0 records | `GET/POST/PUT/DELETE /api/v1/feedback/` & `/reviews/` |
| **bookings** | `Booking` | 3 records | `GET/POST/PUT/DELETE /api/v1/bookings/`, `/check_availability/` |
| **bookings** | `ExtraTimeRequest` | 0 records | `GET/POST/PUT/DELETE /api/v1/extra-time-requests/`, `/approve/`, `/reject/` |
| **events_catering** | `EventTypeConfig` | 4 records | `GET/POST/PUT/DELETE /api/v1/event-types/` |
| **events_catering** | `MenuPackage` | 3 records | `GET/POST/PUT/DELETE /api/v1/menu-packages/` |
| **inventory** | `InventoryItem` | 4 records | `GET/POST/PUT/DELETE /api/v1/inventory/`, `/issue/`, `/return/` |
| **finance** | `InvoiceRecord` | 3 records | `GET/POST/PUT/DELETE /api/v1/invoices/` |
| **finance** | `PaymentTransaction` | 2 records | `GET/POST/PUT/DELETE /api/v1/payments/` |
| **finance** | `ExpenseRecord` | 2 records | `GET/POST/PUT/DELETE /api/v1/expenses/` |
| **workforce** | `StaffMember` | 3 records | `GET/POST/PUT/DELETE /api/v1/staff/` |
| **workforce** | `VendorPartner` | 2 records | `GET/POST/PUT/DELETE /api/v1/vendors/` |
| **core** | `AuditLogEntry` | 1 record | `GET/POST/PUT/DELETE /api/v1/audit-logs/`, `/export/` |
| **core** | `SystemSetting` | 1 record | `GET/PUT/POST /api/v1/settings/` |
| **core** | *(Analytics)* | Dynamic | `GET /api/v1/dashboard/stats/`, `/charts/`, `/metrics/`, `/reports/summary/` |

---

## 4. Frontend-to-Backend Integration Audit Matrix

| Module / Component | Data Loading (GET) | Create (POST) | Update (PUT) | Delete (DELETE) | Overall Status |
|---|---|---|---|---|---|
| **Dashboard** | ✅ Live API (`stats`, `charts`, `metrics`) | N/A | N/A | N/A | **Fully Working** |
| **Bookings & Reservations** | ✅ Live API (`bookingsApi.list`) | ✅ Live API (`bookingsApi.create`) | ✅ Live API (`bookingsApi.update`) | ✅ Live API (`bookingsApi.delete`) | **Fully Working** |
| **Halls Registry** | ✅ Live API (`hallsApi.list`) | ✅ Live API (`hallsApi.create`) | ✅ Live API (`hallsApi.update`) | ✅ Live API (`hallsApi.delete`) | **Fully Working** |
| **Feedback & Reviews** | ✅ Live API (`feedbackApi.list`) | ✅ Live API (`feedbackApi.create`) | N/A | ✅ Live API (`feedbackApi.delete`) | **Fully Working** |
| **Card Studio** | N/A (Client Tool) | N/A (Local Export) | N/A | N/A | **Fully Working (Client Tool)** |
| **Calendar Module** | ❌ Empty `useState` (`[]`) | ❌ Local State Only | ❌ Not implemented | ❌ Not implemented | **Disconnected (Fake State)** |
| **Customers (CRM)** | ❌ Empty `useState` (`[]`) | ❌ Local State Only | ❌ Local State Only | ❌ Local State Only | **Disconnected (Fake State)** |
| **Events Configuration** | ❌ Empty `useState` (`[]`) | ❌ Local State Only | ❌ Local State Only | ❌ Local State Only | **Disconnected (Fake State)** |
| **Menu Engineering** | ❌ Empty `useState` (`[]`) | ❌ Local State Only | ❌ Local State Only | ❌ Local State Only | **Disconnected (Fake State)** |
| **Inventory Management** | ❌ Empty `useState` (`[]`) | ❌ Local State Only | ❌ Local State Only | ❌ Local State Only | **Disconnected (Fake State)** |
| **Invoices & Payments** | ❌ Empty `useState` (`[]`) | ❌ No Create Modal | ❌ Local State Only | ❌ Not implemented | **Disconnected (Fake State)** |
| **Operational Expenses** | ❌ Empty `useState` (`[]`) | ❌ Dead Button (No Op) | ❌ Not implemented | ❌ Not implemented | **Broken / Non-Functional** |
| **Staff & Vendors** | ❌ Empty `useState` (`[]`) | ❌ Local State Only | ❌ Local State Only | ❌ Local State Only | **Disconnected (Fake State)** |
| **Reports & Analytics** | ❌ Empty `useState` (`[]`) | N/A | N/A | N/A | **Disconnected (Fake State)** |
| **Audit Logs Ledger** | ❌ Empty `useState` (`[]`) | ❌ Local State Only | N/A | N/A | **Disconnected (Fake State)** |
| **System Settings** | ❌ Empty inputs | ❌ Toast Only | ❌ Toast Only | N/A | **Non-Functional (Toast Only)** |
| **Floor Staff Tablet View** | ❌ Hardcoded placeholders | ❌ Timeout Only | N/A | N/A | **Non-Functional (Simulated)** |

---

## 5. Detailed In-Depth Module Analysis & Button Inventory

### 5.1 Dashboard (`Dashboard.tsx`, `UpcomingEventsList.tsx`, `RecentTransactionsList.tsx`)
* **Purpose:** Live executive cockpit showing business KPIs, upcoming events, financial transactions, and operational charts.
* **Backend Connection:** Connected to `/api/v1/dashboard/stats/`, `/api/v1/dashboard/charts/`, and `/api/v1/dashboard/metrics/`.
* **What is Working:**
  - Dynamic KPI cards (Total Bookings, Hall Occupancy %, Pending Payments, Upcoming Events in 7 days).
  - Recharts quarterly revenue trends (Booked Revenue, Hall Rentals, Ancillary Catering).
  - Hall Occupancy PieChart with custom color palettes.
  - Upcoming Events list populated from database bookings.
  - Recent Transactions list populated from database payment transactions.
  - Navigation links: "View Calendar", "Create Booking", "View All Invoices", "Record Payment" correctly switch active modules.
* **What is Not Working / Cosmetic Only:**
  - **Hall Filter Toggles (`All`, `Main Ballroom`, `Annex`):** Only update a React state string; do not filter the chart datasets.
  - **Revenue View Toggles (`Invoiced`, `Collected`):** Only update a React state string; chart series do not change.

---

### 5.2 Bookings & Reservations (`BookingsModule.tsx`, `CreateBookingForm.tsx`)
* **Purpose:** Manage customer reservation contracts, date slots, hall venues, and payment terms.
* **Backend Connection:** Fully hooked to `bookingsApi` (`/api/v1/bookings/`).
* **What is Working:**
  - Fetching and listing all bookings from the database.
  - Filtering by Search query, Hall dropdown, Status dropdown, and Date range.
  - Modal viewing complete booking details.
  - Creating new booking: persists to DB, automatically creates/updates CRM Customer, generates Invoice record, records advance payment transaction, and logs audit record.
  - Editing booking: updates DB and recalculates invoice balance and payment status (`Paid` / `Partial` / `Unpaid`).
  - Deleting booking: deletes record from DB.
* **What is Not Working / Missing:**
  - In `CreateBookingForm.tsx`, the `bookingsApi.checkAvailability` endpoint exists on the backend (`/api/v1/bookings/check_availability/`), but the frontend form never calls it to warn the user about double-booking or maintenance collisions before submission.

---

### 5.3 Halls Registry (`HallsModule.tsx`)
* **Purpose:** Venue catalog, capacity limits, base rentals, floor locations, and facility tags.
* **Backend Connection:** Fully hooked to `hallsApi` (`/api/v1/halls/`).
* **What is Working:**
  - Fetching and listing all halls from database.
  - Search and status filter (`All`, `Active`, `Under Maintenance`).
  - Creating a hall: persists to DB via `POST /api/v1/halls/`.
  - Editing a hall: updates DB via `PUT /api/v1/halls/{id}/`.
  - Deleting a hall: deletes from DB via `DELETE /api/v1/halls/{id}/`.
  - Multi-select facility tags (`AC`, `Parking`, `Stage`, `Generator`, `Bridal Room`).
* **Buttons with Toast-Only / Caveats:**
  - **`Reset to Initial State` button:** Clears local React state (`setHalls([])`) and triggers a toast; does not alter the backend.
  - **Image Upload field:** Expects a typed URL string; does not upload binary images to Django media storage.

---

### 5.4 Client Feedback & Reviews (`FeedbackReviewsModule.tsx`)
* **Purpose:** Collect client reviews, calculate star ratings, track event feedback, and follow up on WhatsApp.
* **Backend Connection:** Fully hooked to `feedbackApi` (`/api/v1/feedback/` and `/api/v1/reviews/`).
* **What is Working:**
  - Loading existing feedback records on mount from Django.
  - Interactive 5-star rating selector with hover effect.
  - Creating feedback: saves to SQLite, records audit log, and prepends to list.
  - Deleting feedback: removes from DB via `DELETE /api/v1/feedback/{id}/`.
  - View Modal: displays review details.
  - **WhatsApp Follow-up button in Modal:** Opens WhatsApp Web (`https://wa.me/{phone}?text=...`) with an auto-filled thank-you message.
  - Reset form fields button.

---

### 5.5 Card Studio (`CardStudioModule.tsx`)
* **Purpose:** Real-time digital invitation card generator and previewer with royal Pakistan wedding themes.
* **Backend Connection:** None required (designed as a client-side visual design studio).
* **What is Working:**
  - 12 themed card templates (Royal Emerald, Ruby Crimson, Sapphire Nizam, Rose Gold, etc.).
  - Real-time form synchronization (Event Type, Host Name, Honoree/Couple Name, Date, Time, Venue, RSVP, Special Notes).
  - Copy Invite Text button (`navigator.clipboard.writeText`).
  - WhatsApp share button (`https://wa.me/?text=...`).
  - "Download PDF" button triggers browser print (`window.print()`).
  - Reset form button.
* **What is Not Working / Missing:**
  - No database persistence to save custom card drafts to a user profile or booking record.

---

### 5.6 Calendar & Date Blocking (`CalendarModule.tsx`)
* **Purpose:** Interactive calendar grid (Month/Week views) to visualize scheduled events and block halls for maintenance.
* **Backend Connection:** **DISCONNECTED**. Has `blockedDatesApi` in `client.ts` and `/api/v1/blocked-dates/` in backend, but component uses pure local state.
* **What is Working:**
  - Date navigation (Previous Month, Next Month, Today).
  - Switching between Month View and Week View.
  - Calculation of days, previous month padding, and week cells.
  - Block Date modal UI and form validation.
* **Buttons that DO NOT Perform Backend Action (Toast / Local State Only):**
  - **`Save Maintenance Block` (Form submit):** Only appends to local `blockedDates` array in React memory and calls `showToast()`. Changes vanish on page refresh.
  - **`Clear Maintenance Blocks` button:** Only sets local `blockedDates` to `[]` and shows toast.
  - **Calendar Event Display:** `events` state is hardcoded to `[]`. Real bookings from the database are never fetched or displayed on the calendar grid.

---

### 5.7 Customers & CRM (`CustomersModule.tsx`)
* **Purpose:** Customer directory, contact numbers, CNIC records, booking history counts, and lifetime customer value.
* **Backend Connection:** **DISCONNECTED**. Backend has 3 customers in DB and `/api/v1/customers/`, but this module has no `useEffect`.
* **What is Working:**
  - UI table layout, search filter, tier filter, modals for create, edit, and view.
* **Buttons that DO NOT Perform Backend Action (Toast / Local State Only):**
  - **Initial Load:** Table renders empty because it does not fetch from `customersApi.list()`.
  - **`Save Customer` (Modal submit):** Appends to local React state `customers` and shows a toast. Does not call `POST /api/v1/customers/`.
  - **`Edit Customer` (Modal submit):** Updates local state only and shows a toast. Does not call `PUT /api/v1/customers/{id}/`.
  - **`Delete Customer` button:** Removes item from local state and shows a toast. Does not call `DELETE /api/v1/customers/{id}/`.
  - **`Reset to Empty` button:** Sets local state to `[]` and shows a toast.

---

### 5.8 Events Configuration (`EventsModule.tsx`)
* **Purpose:** Configure standardized event types (Barat, Walima, Mehndi, Corporate) with default slot timings and calendar badge colors.
* **Backend Connection:** **DISCONNECTED**. Backend has 4 event types in DB and `/api/v1/event-types/`, but module uses local state.
* **What is Working:**
  - Color preset pickers, timing inputs, search filter.
* **Buttons that DO NOT Perform Backend Action (Toast / Local State Only):**
  - **Initial Load:** Starts with `[]` because it does not call `eventTypesApi.list()`.
  - **`Save Event Template` (Form submit):** Appends to local state and shows toast `Event template configured`. Does not save to backend.
  - **`Edit Event Template`:** Modifies local state and shows toast.
  - **`Delete Event Template` button:** Filters local state and shows toast.
  - **`Reset to Empty` button:** Sets local state to `[]` and shows toast.

---

### 5.9 Menu & Catering Engineering (`MenuModule.tsx`)
* **Purpose:** Package catering menus, define per-head prices, and bundle multi-course dishes.
* **Backend Connection:** **DISCONNECTED**. Backend has 3 menu packages in DB and `/api/v1/menu-packages/`, but module uses local state.
* **What is Working:**
  - Dynamic dish tag input (`Enter` key to add dish, delete dish tag).
  - Quick dish suggestions pills (`Chicken Biryani`, `Mutton Karahi`, `Seekh Kabab`, etc.).
  - Search and Active/Inactive status filtering.
* **Buttons that DO NOT Perform Backend Action (Toast / Local State Only):**
  - **Initial Load:** Starts empty `[]`; does not call `menuPackagesApi.list()`.
  - **`Save Menu Package` (Form submit):** Only updates local state `packages` and shows toast `New menu package created`.
  - **`Edit Package`:** Updates local state and shows toast.
  - **`Delete Package` button:** Filters local state and shows toast.
  - **`Reset to Empty` button:** Sets local state to `[]` and shows toast.

---

### 5.10 Operational Inventory (`InventoryModule.tsx`)
* **Purpose:** Manage physical assets (Chairs, Tables, Chafing Dishes, Audio Speakers, Stage Lights), track available vs. in-use units, and dispatch to events.
* **Backend Connection:** **DISCONNECTED**. Backend has 4 inventory items in DB and `/api/v1/inventory/` (with `/issue/` and `/return/`), but module uses local state.
* **What is Working:**
  - Condition badges, category filters, search input.
  - Issue modal calculation of available quantity.
* **Buttons that DO NOT Perform Backend Action (Toast / Local State Only):**
  - **Initial Load:** Table renders empty; does not call `inventoryApi.list()`.
  - **`Save Asset Item` (Create modal submit):** Updates local state only and shows toast. Does not call `POST /api/v1/inventory/`.
  - **`Edit Item` (Edit modal submit):** Updates local state only and shows toast. Does not call `PUT /api/v1/inventory/{id}/`.
  - **`Delete Item` button:** Filters local state and shows toast. Does not call `DELETE /api/v1/inventory/{id}/`.
  - **`Confirm Dispatch` (Issue modal submit):** Only decrements local state `availableQuantity` and shows toast `Issued X units to event`. Does not call backend `POST /api/v1/inventory/{id}/issue/`.
  - **`Reset to Empty` button:** Sets local state to `[]` and shows toast.

---

### 5.11 Invoices & Payments (`PaymentsModule.tsx`)
* **Purpose:** Review customer billing ledgers, outstanding balances, payment settlements, extra time requests, and printable receipts.
* **Backend Connection:** **DISCONNECTED**. Backend has 3 invoices and 2 payment transactions in DB, but module uses local state.
* **What is Working:**
  - Printable receipt modal triggering `window.print()`.
  - Invoice detail modal showing line items and balances.
* **Buttons that DO NOT Perform Backend Action (Toast / Local State Only):**
  - **Initial Load:** Invoices, Payment Transactions, and Extra Time Requests all start as `[]`. Does not call `financeApi.listInvoices()`, `financeApi.listTransactions()`, or `floorStaffApi.listExtraTimeRequests()`.
  - **`Approve Extra Time` button:** Only mutates local state to `status: 'Approved'`. Does not call `POST /api/v1/extra-time-requests/{id}/approve/` (which updates billing ledger in backend).
  - **`Reject Extra Time` button:** Only mutates local state to `status: 'Rejected'`. Does not call backend `/reject/`.
  - **Missing Action:** There is no button to record an invoice payment directly inside this module (requires doing it via Dashboard quick action or API).

---

### 5.12 Operational Expenses (`ExpensesModule.tsx`)
* **Purpose:** Record operational venue costs (staff overtime wages, utility surges, floral decor sourcing, laundry, generator fuel).
* **Backend Connection:** **BROKEN / DISCONNECTED**.
* **What is Working:**
  - Static DataTable headers.
* **Buttons that DO NOT Perform Any Action (Dead Buttons):**
  - **`+ File Expense Claim` button (Line 86):** **NO `onClick` HANDLER AT ALL.** Clicking it does absolutely nothing.
  - **Row Action button `<MoreVertical>` (Line 67):** **NO `onClick` HANDLER AT ALL.**
  - **Initial Load:** `expenses` array is hardcoded to `[]`; never calls `financeApi.listExpenses()`.
  - **Metric cards:** Display hardcoded placeholder strings: `[--,---.--]`.

---

### 5.13 Staff & Vendors (`StaffVendorsModule.tsx`)
* **Purpose:** Personnel management for venue staff (Managers, Floor Staff, Accountants) and external vendor partners (Decorators, Caterers, Sound/Lights).
* **Backend Connection:** **DISCONNECTED**. Backend has 3 staff and 2 vendors in DB, but module uses local state.
* **What is Working:**
  - Tab switching between "Staff Members" and "Vendor Partners".
  - Shift timing selector dropdown and role badges.
  - "Launch Floor Tablet" button toggles full-screen tablet view prop.
* **Buttons that DO NOT Perform Backend Action (Toast / Local State Only):**
  - **Initial Load:** Both staff and vendor lists start empty `[]`; does not call `workforceApi.listStaff()` or `workforceApi.listVendors()`.
  - **`Save Staff Member` (Modal submit):** Updates local state only and shows toast. Does not call `POST /api/v1/staff/`.
  - **`Edit Staff Member`:** Updates local state and shows toast.
  - **`Delete Staff Member`:** Filters local state and shows toast.
  - **`Save Vendor Partner` (Modal submit):** Updates local state only and shows toast. Does not call `POST /api/v1/vendors/`.
  - **`Edit Vendor Partner`:** Updates local state and shows toast.
  - **`Delete Vendor Partner`:** Filters local state and shows toast.
  - **`Reset to Empty` button:** Sets both lists to `[]` and shows toast.

---

### 5.14 Reports & Financial Intelligence (`ReportsModule.tsx`)
* **Purpose:** Visual business analytics, gross revenue vs. expenses comparison, hall booking popularity, and CSV export.
* **Backend Connection:** **DISCONNECTED**. Backend has `ReportsSummaryView` (`/api/v1/reports/summary/`) returning comprehensive monthly analytics, but module does not fetch it.
* **What is Working:**
  - Layout structure with Recharts BarCharts and PieCharts.
* **Buttons that DO NOT Perform Backend Action (Toast / Fake Only):**
  - **Initial Load:** All datasets (`revenueExpensesData`, `hallBookingsData`, `topMenuPackagesData`, `monthlyBreakdownRecords`) are static `[]`. Charts render in empty states.
  - **`Export Report` (CSVLink button):** Downloads an empty CSV file (`financial_analytics_report.csv`) because `revenueExpensesData` is empty `[]`.
  - **`PDF Export` button (Line 463):** **ONLY SHOWS A TOAST:** `showToast("PDF export generated successfully...")`. It does not generate, render, or download any PDF file!
  - **Preset Buttons (`This Month`, `Last 30 Days`, `YTD 2026`):** Hardcoded date values (`2026-10-01`, `2026-10-17`) and shows toast.

---

### 5.15 Audit Logs (`AuditLogsModule.tsx`)
* **Purpose:** Immutable compliance ledger recording user logins, deletions, booking creations, and security actions.
* **Backend Connection:** **DISCONNECTED**. Backend has `AuditLogEntry` model and `/api/v1/audit-logs/` (with CSV/JSON `/export/`), but module uses local state.
* **What is Working:**
  - Action badge styling (`Created`, `Updated`, `Deleted`, `Login`, `Approved`), module filters, and user role filters.
* **Buttons that DO NOT Perform Backend Action (Toast / Local State Only):**
  - **Initial Load:** Starts empty `[]`; does not call `auditLogsApi.list()`.
  - **`Export Audit Log` button (Line 69):** **ONLY SHOWS A TOAST:** `showToast("Audit log export triggered. Formats: CSV & JSON...")`. It does not download any file, ignoring backend `/api/v1/audit-logs/export/`.
  - **`Log Test Event` (Simulate modal submit):** Generates a random `LOG-XXXX` ID and prepends to local state only; shows toast. Does not save to backend.
  - **`Reset to Empty` button:** Sets local state to `[]` and shows toast.

---

### 5.16 System Settings (`SettingsModule.tsx`)
* **Purpose:** Configure business branding, FBR digital invoicing compliance (NTN, STRN, POS ID, API Keys), tax rates, currency symbols, and custom roles.
* **Backend Connection:** **NON-FUNCTIONAL**. Backend has `SystemSetting` model and `/api/v1/settings/`, but this module never loads or saves to it.
* **What is Working:**
  - Tab navigation (Business Profile, Tax & FBR Compliance, Invoicing & Billing, Roles & Permissions).
  - Password visibility toggle on API Client Secret field.
* **Buttons that DO NOT Perform Backend Action (Toast Only):**
  - **Initial Load:** All input fields are blank strings; never calls `settingsApi.get()`.
  - **`Save Configuration Changes` button (Line 69):** **ONLY SHOWS A TOAST:** `showToast("System configuration changes saved successfully.")`. It does not send any HTTP request or save settings!
  - **`Logo File Upload` input (Line 97):** Only takes `file.name` and shows toast `Selected logo file: ...`. It does not upload the image file to the backend.
  - **`Enable FBR Digital Invoicing` toggle:** Flips local boolean and shows toast.
  - **`Configure Custom Permissions` button (Line 631):** Only shows toast `Custom role builder is ready. Connect directory to enroll custom rules.`.
  - **`Reset All Settings` button:** Clears inputs and shows toast.

---

### 5.17 Floor Staff Tablet View (`FloorStaffTabletView.tsx`)
* **Purpose:** High-contrast, touch-optimized tablet kiosk interface for hall floor supervisors to monitor active event schedules and request emergency overtime.
* **Backend Connection:** **NON-FUNCTIONAL (Hardcoded Placeholders + Simulated Action).**
* **What is Working:**
  - High-contrast dark theme UI, responsive modal for overtime request.
* **Issues & Fake Triggers:**
  - **Event Data Display:** All data is hardcoded placeholders:
    - Hall Name: `[Hall Name]`
    - Date: `[--/--/----]`
    - Customer Name: `[Customer Name]`
    - Event Type: `[Event Type]`
    - Guests: `[--] Seats`
    - Schedule: `[--:--]` Start / End
    - Seating: `[--]` Style / Rows
  - **`Dispatch Extra Time Notice` (Form submit line 28):** Sets a local boolean `setRequestSent(true)`, waits `1200ms` via `setTimeout`, and closes the modal with a fake green banner. It **DOES NOT** call `floorStaffApi.createExtraTimeRequest(...)`!

---

### 5.18 Layout & Header Navigation (`Topbar.tsx`, `Sidebar.tsx`)
* **What is Working:**
  - Sidebar correctly switches active view between all 17 modules.
  - Sidebar mobile overlay toggles and closes properly.
  - Topbar tablet mode toggle launches and exits the kiosk mode.
  - Notification icon toggles alerts dropdown.
  - Profile icon toggles user credentials dropdown.
* **Buttons with No Actions (Cosmetic Only):**
  - **Topbar Search Input (`globalSearch`):** Stores input string in `MainLayout`, but is never passed as a filter to any child module.
  - **Profile Dropdown -> "Security & RBAC Access":** Cosmetic `<div>` with no `onClick`.
  - **Profile Dropdown -> "Venue Preferences":** Cosmetic `<div>` with no `onClick`.
  - **Notification Dropdown:** Hardcoded text `0 Pending. All venue channels healthy.` (no live notification fetch).

---

## 6. Summary: Complete Breakdown of Issues by Category

### Category A: Buttons with NO Action (Dead Buttons - Zero Code)
1. **`ExpensesModule.tsx` (Line 86):** `+ File Expense Claim` button has no `onClick` and opens no form.
2. **`ExpensesModule.tsx` (Line 67):** Row action `<MoreVertical>` button has no handler.
3. **`Topbar.tsx` (Line 157):** "Security & RBAC Access" link in profile dropdown does nothing.
4. **`Topbar.tsx` (Line 161):** "Venue Preferences" link in profile dropdown does nothing.

### Category B: Buttons that ONLY Show a Toast (Fake Actions)
1. **`SettingsModule.tsx` (Line 69):** `Save Configuration Changes` button shows toast; does not call API.
2. **`SettingsModule.tsx` (Line 631):** `Configure Custom Permissions` button shows toast.
3. **`ReportsModule.tsx` (Line 463):** `Download PDF Report` button shows toast; generates no file.
4. **`AuditLogsModule.tsx` (Line 69):** `Export Audit Log (CSV/JSON)` button shows toast; downloads nothing.
5. **`FloorStaffTabletView.tsx` (Line 28):** `Send Overtime Request` button sets a 1.2s timer and fake toast; creates no DB request.

### Category C: Modules Running on Isolated Local State (Data Lost on Refresh)
1. **`CustomersModule.tsx`:** Create, Edit, Delete only mutate local `useState`. Initial load is blank.
2. **`EventsModule.tsx`:** Create, Edit, Delete only mutate local `useState`. Initial load is blank.
3. **`MenuModule.tsx`:** Create, Edit, Delete only mutate local `useState`. Initial load is blank.
4. **`InventoryModule.tsx`:** Create, Edit, Delete, Issue only mutate local `useState`. Initial load is blank.
5. **`PaymentsModule.tsx`:** Approve/Reject overtime only mutate local `useState`. Initial load is blank.
6. **`StaffVendorsModule.tsx`:** Create, Edit, Delete for Staff & Vendors mutate local `useState`. Initial load is blank.
7. **`CalendarModule.tsx`:** Maintenance date blocks only save to local `useState`. Calendar displays 0 bookings.
8. **`ReportsModule.tsx`:** Charts render empty because analytics endpoint is never queried.
9. **`AuditLogsModule.tsx`:** Test events only save to local `useState`.

### Category D: Fully Integrated & Production-Ready Modules
1. **`Dashboard.tsx`:** Fully connected to stats & charts API endpoints; live KPI metrics and charts render real data.
2. **`BookingsModule.tsx` & `CreateBookingForm.tsx`:** Fully connected to backend CRUD; auto-creates CRM customers, invoices, and payments.
3. **`HallsModule.tsx`:** Fully connected to backend CRUD; creates, edits, and deletes halls in database.
4. **`FeedbackReviewsModule.tsx`:** Fully connected to backend CRUD; persists customer reviews, star ratings, and WhatsApp sharing.
5. **`CardStudioModule.tsx`:** Complete, working client-side invitation card generation with copy and WhatsApp triggers.

---

## 7. Recommended Action Plan to Make the Entire System 100% Functional

To transform the remaining disconnected modules into a fully integrated enterprise application, follow this priority order:

1. **Wire Up Disconnected CRUD Modules to Existing API Client (`client.ts`):**
   - Add `useEffect` on mount to call `*.list()`.
   - Update submit handlers to call `*.create()`, `*.update()`, and `*.delete()`.
   - Modules to wire: `CustomersModule`, `EventsModule`, `MenuModule`, `StaffVendorsModule`, `InventoryModule`.
2. **Implement Operational Expenses Modal & API Connection:**
   - Add Create Expense Claim modal in `ExpensesModule.tsx` with category, payee, amount, date, and payment method fields.
   - Connect to `financeApi.listExpenses()`, `financeApi.createExpense()`, and `financeApi.deleteExpense()`.
3. **Connect Calendar & Floor Tablet to Real Data:**
   - In `CalendarModule.tsx`, fetch `bookingsApi.list()` and `blockedDatesApi.list()` to display actual scheduled events and maintenance blocks on the calendar.
   - In `FloorStaffTabletView.tsx`, query today's active booking for the selected hall and call `floorStaffApi.createExtraTimeRequest` upon form submission.
4. **Activate Reports & Audit Log Exports:**
   - In `ReportsModule.tsx`, query `reportsApi.getSummary()` on mount and map results to the Recharts Bar/Pie components.
   - In `AuditLogsModule.tsx`, wire `Export` button directly to `auditLogsApi.getExportUrl('csv')`.
5. **Persist System Settings:**
   - In `SettingsModule.tsx`, call `settingsApi.get()` on mount to populate existing business profile, NTN, and tax rates.
   - Call `settingsApi.update()` on form submission to save changes in `SystemSetting` table.

---

## 8. Target Vision & Blueprint: What We Are Going to Build

This section defines the complete future architectural specification and role-based portal requirements agreed upon for the platform.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 TOP NAVIGATION BAR                                     │
│  [👑 Admin / Owner]   [👔 Event Manager]   [🍳 Kitchen ERP]   [📱 Waiter]   [💼 Finance]│
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │ Switches Context
                                         ▼
┌───────────────────────────────────┬────────────────────────────────────────────────────┐
│      CONTEXTUAL SIDEBAR           │               ACTIVE WORKSPACE                     │
│  (Dynamically updates based on    │  (Role-specific dashboards, accounting ledgers,    │
│   the selected top portal)        │   kitchen screens, formula calculators & KDS)      │
└───────────────────────────────────┴────────────────────────────────────────────────────┘
```

---

### 8.1 User Roles & Dedicated Portals Matrix

| Role | Target Portal | Primary Responsibilities & Access Scope |
|---|---|---|
| **Admin (Owner)** | **Admin Master Suite** | Full omniscient access: oversee all halls, bookings, complete user directory & salaries, RBAC rights assignment, sales & closings (day, week, month, year), expenses, kitchen stock, vendors/suppliers, full financial statements, and ability to inspect/switch into any staff portal. |
| **Event Manager** | **Manager Operations Console** | Manage assigned events from start to finish: coordinate decoration crew, waiters, kitchen readiness, inventory allocations, cleaning teams, helpers, and floor execution. (Optional access to vendors if delegated by Admin). |
| **Kitchen Staff & Chef** | **Kitchen ERP & KDS** | Pantry inventory & raw material stocks, menu recipe costing, live kitchen display screen (KDS), urgent refill order queue from waiters, and **Raw Material Formula Calculator** for event grocery planning. |
| **Permanent Staff / Lead Waiters** | **Waiter Floor Kiosk** | Clean, fast touch interface for live event monitoring, table readiness checks, and dispatching instant dish refill requests directly to the kitchen display screen. |
| **Suppliers & Vendors Lead** | **Vendors & Procurement** | Track external suppliers (poultry/meat, dairy, floral decor, stage sound, outsourced labor), purchase orders, trade ledgers, payment schedules, and Accounts Payable (A/P). Restricted to Admin by default. |
| **Finance & Accountant** | **Financial Accounting Suite** | Double-entry bookkeeping, Accounts Receivable (A/R), Accounts Payable (A/P), overdue payment push alerts, General Ledger, Balance Sheet, Income Statement (P&L), and period closings. |

---

### 8.2 Top Navbar & Dynamic Contextual Sidebar Architecture

The UI layout will feature a **dual-tiered navigation system**:

1. **Top Navbar (Portal Switcher):**
   - Displays primary functional domains:
     - `👑 Admin Console`
     - `👔 Event Manager`
     - `🍳 Kitchen & Pantry`
     - `📱 Waiter & Floor`
     - `🚚 Vendors & Suppliers`
     - `💼 Financial Statements`
   - *Admin Super-Access:* The Owner/Admin can toggle freely between any portal to monitor real-time activities and manage entries directly within that role's context.

2. **Contextual Sidebar (Sub-Operations):**
   - Dynamically reconfigures its links based on the active top navbar selection:
     - **When `👑 Admin Console` is selected:**
       - *Executive Overview:* Hall occupancy KPI, sales velocity, active booking count.
       - *Halls & Slot Calendar:* Hall setup, capacity tiers, Morning/Evening slot allocations.
       - *Bookings Master Ledger:* Contract reservations, advance payments, CRM links.
       - *User & Staff Management:* Complete personnel directory, staff salaries, role assignment & rights editor.
       - *Closings & Audits:* Day closings, week closings, month closings, fiscal year-end statements.
       - *System Settings:* Business profile, security policies, and dynamic FBR credentials.
     - **When `🍳 Kitchen & Pantry` is selected:**
       - *Live Kitchen Display (KDS):* Real-time order screen receiving waiter refill tickets.
       - *Pantry Inventory:* Raw material stocks (chicken, mutton, rice, cooking oil, spices) with minimum stock alerts.
       - *Menu Engineering & Recipes:* Dish ingredients and per-head cost calculations.
       - *📐 Raw Material Formula Calculator (Dedicated Tab):* Formula engine where kitchen staff feed guest counts and custom consumption ratios to generate grocery procurement lists.
     - **When `👔 Event Manager` is selected:**
       - *Assigned Events:* Timeline of upcoming and today's bookings.
       - *Team Coordination:* Duty rosters for Waiters, Decorators, Cleaners, and Helpers.
       - *Asset & Inventory Requisition:* Requesting chairs, chafing dishes, and stage rigs from storage.
       - *Live Event Checklist:* Pre-event inspection, food service timing, and hall handover.
     - **When `📱 Waiter & Floor` is selected:**
       - *Live Event Status:* Assigned tables and active hall details.
       - *⚡ Quick Refill Dispatch:* One-touch buttons ("Refill Biryani", "Refill Naan", "Water Refill") sent straight to the Kitchen KDS.
       - *Overtime Alert Trigger:* Urgent extra-time request forwarding to Manager/Admin.
     - **When `🚚 Vendors & Suppliers` is selected:**
       - *Vendor Directory:* Raw material suppliers, decorators, photographers, sound crews.
       - *Procurement Orders:* Purchase invoices and goods received notes.
       - *Financial Trades:* Total billed, amount paid, and balance payable (A/P).
     - **When `💼 Financial Statements` is selected:**
       - *Overview & Graphs:* Interactive cash flow and revenue trajectory charts.
       - *General Ledger:* Complete double-entry transaction journal.
       - *Income Statement (P&L):* Gross revenue minus operational expenses and COGS.
       - *Accounts Receivable (A/R):* Client payment schedules, deposit balances, and overdue notices.
       - *Accounts Payable (A/P):* Outstanding supplier and contractor dues.
       - *Periodic Closings:* Automated Day, Week, Month, and Year financial closeout summaries.

---

### 8.3 Specialized Operational Features To Be Built

#### 1. Kitchen Raw Material Formula & Calculator Tab
- Dedicated tab in the Kitchen sidebar.
- Kitchen staff input the **Guest Count** and select the **Menu Package / Dishes**.
- Supports custom user-defined formula ratios (e.g., *250g meat/head, 150g rice/head, 20ml oil/head*).
- Outputs the **Total Grocery Requisition**:
  $$\text{Required Quantity} = \text{Guest Count} \times \text{Per-Head Ratio} \times (1 + \text{Wastage Buffer})$$
- Staff can save this requisition and directly dispatch it to the inventory or supplier purchase order list.

#### 2. Kitchen Display Screen (KDS) & Waiter Live Connection
- Real-time communication between floor staff and the kitchen.
- Lead waiters tap on an active event dish: *"Chicken Biryani at 20% remaining — Refill Needed"*.
- The Kitchen KDS screen chimes and displays an urgent card with table/hall location and timestamp.
- Kitchen staff mark *"In Preparation"* $\rightarrow$ *"Dispatched to Floor"*.

#### 3. Dual Time-Slot Lock & Conflict Engine
- Halls are allocated by **Morning / Afternoon Slot** (*12:00 PM – 04:00 PM*) or **Evening / Dinner Slot** (*07:00 PM – 11:30 PM*).
- Automatic backend validation prevents managers from creating overlapping bookings for the same hall and slot.

#### 4. Refundable Security Deposit & Damage/Overtime Deductions
- Dedicated ledger field for `Refundable Security Deposit` (e.g., Rs. 50,000–100,000).
- Post-event settlement interface allows managers/admin to log:
  - Broken crockery or property damage charges.
  - Overtime hours elapsed beyond contract closing.
- Deductions automatically adjust the remaining refundable balance before refund issuance.

#### 5. Accounts Receivable (A/R), Accounts Payable (A/P) & Push Alerts
- Complete milestone tracking: *Advance Deposit (Booking)* $\rightarrow$ *Mid Payment (2 Weeks Prior)* $\rightarrow$ *Final Settlement (Event Day)*.
- Real-time on-screen banner/push notification alerts when a client or supplier payment passes its due date.

#### 6. Official Printable Booking Contract & Thermal Invoices
- One-click generation of a branded PDF/print contract featuring hall policies, sound/curfew rules, menu attachments, CNIC verification, payment schedule, and signature blocks.

#### 7. Dynamic FBR Integration (Inactive by Default)
- Full architectural support for Pakistan FBR Digital POS Invoicing (PRAL API schemas, FBR Invoice Numbering, QR code rendering, and provincial sales tax breakdown).
- **Dormant by Default:** Operates 100% offline without FBR dependencies.
- **Dynamic Activation:** Activates only when the Admin enters valid credentials (*NTN, STRN, POS ID, Client ID, Client Secret*) in Admin Settings and flips the *Enable FBR Integration* toggle.


