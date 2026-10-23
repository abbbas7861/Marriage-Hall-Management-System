# MHMS Enterprise — Frontend Review & Django Backend Specification

**Project:** Marriage Hall Management System (MHMS Enterprise)  
**Document Type:** Frontend Codebase Audit & Django Backend Architectural Specification  
**Date of Review:** October 2026  
**Status:** Frontend Complete (Strict Zero-Mock-Data State) • Backend Ready for Implementation  

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Frontend Technology Stack & Architecture](#2-frontend-technology-stack--architecture)
3. [Strict Data Rules & UI/UX Design System](#3-strict-data-rules--uiux-design-system)
4. [Exhaustive Frontend Module Audit](#4-exhaustive-frontend-module-audit)
   - 4.1 [Main Layout & Global Navigation](#41-main-layout--global-navigation)
   - 4.2 [Executive Dashboard](#42-executive-dashboard)
   - 4.3 [Halls & Venue Management](#43-halls--venue-management)
   - 4.4 [Bookings & Reservations](#44-bookings--reservations)
   - 4.5 [Calendar & Multi-Hall Scheduling](#45-calendar--multi-hall-scheduling)
   - 4.6 [Customers & CRM](#46-customers--crm)
   - 4.7 [Event Types & Ceremonial Configurations](#47-event-types--ceremonial-configurations)
   - 4.8 [Menu & Catering Management](#48-menu--catering-management)
   - 4.9 [Inventory & Banquet Assets](#49-inventory--banquet-assets)
   - 4.10 [Invoices, Payments & Overtime Approvals](#410-invoices-payments--overtime-approvals)
   - 4.11 [Operational Expenses](#411-operational-expenses)
   - 4.12 [Staff & Vendor Directory](#412-staff--vendor-directory)
   - 4.13 [Floor Staff Tablet Interface](#413-floor-staff-tablet-interface)
   - 4.14 [Business Reports & GAAP Analytics](#414-business-reports--gaap-analytics)
   - 4.15 [System Audit Logs & WORM Governance](#415-system-audit-logs--worm-governance)
   - 4.16 [System Settings & FBR Compliance](#416-system-settings--fbr-compliance)
5. [TypeScript Data Models & Schema Reference](#5-typescript-data-models--schema-reference)
6. [Django Backend Architecture Plan](#6-django-backend-architecture-plan)
   - 6.1 [Modular Django App Structure](#61-modular-django-app-structure)
   - 6.2 [Relational Database Schema & Models](#62-relational-database-schema--models)
   - 6.3 [Business Rules & Validation Logic](#63-business-rules--validation-logic)
   - 6.4 [Authentication & Role-Based Access Control (RBAC)](#64-authentication--role-based-access-control-rbac)
   - 6.5 [REST API Endpoint Matrix (Django REST Framework)](#65-rest-api-endpoint-matrix-django-rest-framework)
7. [Frontend-to-Backend Integration Roadmap](#7-frontend-to-backend-integration-roadmap)

---

## 1. Executive Summary

The **MHMS Enterprise** frontend is an operations management application built for high-throughput marriage halls, banquet complexes, and convention centers. The system centralizes multi-venue hall reservation, guest catering tiers, warehouse asset tracking, staff shift rotation, live floor staff tablet workflows, administrative overtime approval pipelines, GAAP financial reports, and tax compliance with Pakistan's Federal Board of Revenue (FBR POS e-invoicing).

The frontend code is complete, featuring 15 distinct modules/views, clean state encapsulation, responsive layouts for desktop and tablet screens, and an explicit **Strict Zero-Mock-Data** pattern ready for REST API connectivity.

---

## 2. Frontend Technology Stack & Architecture

### Core Technologies
- **Runtime & Build Tooling:** Node.js / Bun, Vite 8.3.0 (`@vitejs/plugin-react` 6.1.1)
- **Framework & Language:** React 19.0.1, TypeScript 7.0.2
- **Styling & Design System:** Tailwind CSS v4.3.3 (`@tailwindcss/vite`), Custom Plus Jakarta Sans & monospace typography
- **Data Visualization:** Recharts 3.10.1 (ResponsiveContainer, LineChart, BarChart, PieChart)
- **Iconography:** Lucide React 0.546.0
- **Animations:** Motion 12.23.24, Tailwind CSS animation utilities

### Directory Structure
```
MarriageHall/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── metadata.json
│   ├── .env.example
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── types/
│       │   └── index.ts                 # Full TypeScript contract definitions
│       └── components/
│           ├── layout/
│           │   ├── MainLayout.tsx       # Root orchestrator & module routing
│           │   ├── Sidebar.tsx          # 3-tier categorized navigation
│           │   └── Topbar.tsx           # Global search, profile, alerts & tablet toggle
│           ├── dashboard/
│           │   ├── Dashboard.tsx        # Executive KPIs, Recharts lines & donuts
│           │   ├── UpcomingEventsList.tsx
│           │   └── RecentTransactionsList.tsx
│           ├── bookings/
│           │   └── CreateBookingForm.tsx # 5-step booking creation & edit form
│           ├── modules/
│           │   ├── HallsModule.tsx      # Venue capacity & amenities configuration
│           │   ├── BookingsModule.tsx   # Reservation registry & ledger table
│           │   ├── CalendarModule.tsx   # Month/Week view & date blocking
│           │   ├── CustomersModule.tsx  # Client CRM & LTV history
│           │   ├── EventsModule.tsx     # Ceremonial templates & color swatches
│           │   ├── MenuModule.tsx       # Culinary packages & dish tagging
│           │   ├── InventoryModule.tsx  # Banquet assets, stock & dispatch
│           │   ├── PaymentsModule.tsx   # Invoices, ledger & overtime approvals
│           │   ├── ExpensesModule.tsx   # Operating expense claims & vouchers
│           │   ├── StaffVendorsModule.tsx # Internal staff & external vendor directory
│           │   ├── FloorStaffTabletView.tsx # On-site touch UI & overtime requests
│           │   ├── ReportsModule.tsx    # Financial trends, bookings by hall & CSV/PDF exports
│           │   ├── AuditLogsModule.tsx  # WORM audit trail & security events
│           │   └── SettingsModule.tsx   # Business profile, FBR compliance & RBAC
│           └── common/
│               ├── DataTable.tsx        # Reusable typed table with pagination & empty states
│               └── Sparkline.tsx        # Micro-chart component for KPI trends
```

---

## 3. Strict Data Rules & UI/UX Design System

The frontend adheres to an architectural principle across all modules:
1. **Zero Hardcoded Mock Data:** Every module initializes its primary datasets as empty arrays (`useState<T[]>([])`). There are no fabricated customer names, dummy transactions, or pre-filled statistics.
2. **First-Class Empty States:** When datasets are empty, components render informative, professional empty-state banners explaining the module's operational purpose, accompanied by primary CTA buttons (e.g., `+ Create New Booking`, `+ Add Venue Hall`).
3. **Structured Placeholders:** Metrics and unpopulated fields render standard structural wireframe placeholders such as `[--]`, `[--:--]`, or `[PKG-01]`, preventing layout shifts while indicating pending backend synchronization.
4. **Optimistic Form Validation:** All forms include client-side validation for required fields, numeric constraints, date sequences (start date <= end date), and dynamic balance calculations before submitting payloads.

---

## 4. Exhaustive Frontend Module Audit

### 4.1 Main Layout & Global Navigation
- **File:** `frontend/src/components/layout/MainLayout.tsx`, `Sidebar.tsx`, `Topbar.tsx`
- **Module ID Type:** `NavModuleId = 'dashboard' | 'halls' | 'bookings' | 'calendar' | 'customers' | 'events' | 'menu' | 'inventory' | 'payments' | 'expenses' | 'staff' | 'vendors' | 'reports' | 'audit-logs' | 'settings'`
- **Sidebar Categories:**
  1. *Main Navigation:* Dashboard, Halls, Bookings, Calendar, Customers, Events, Menu, Inventory.
  2. *Finance & Personnel:* Invoices & Payments, Expenses, Staff & Vendors, Vendors.
  3. *System Governance:* Reports, Audit Logs, Settings.
- **Topbar Features:**
  - Responsive hamburger drawer for mobile viewports.
  - Live system connectivity indicator (`Online` pulsing badge).
  - Global search bar wired to filter bookings, customers, halls, and invoices.
  - Direct `Tablet View` switcher button for switching between executive console and floor staff mode.
  - Notifications dropdown for system alerts.
  - User profile modal indicating RBAC clearance (`[Admin / Operator]`), security links, and node identifier (`CLUSTER-09`).

---

### 4.2 Executive Dashboard
- **File:** `frontend/src/components/dashboard/Dashboard.tsx`
- **Sub-components:** `UpcomingEventsList.tsx`, `RecentTransactionsList.tsx`, `Sparkline.tsx`
- **Metrics Tracked:**
  - *Total Bookings:* Total scheduled reservation slots, trend variance indicator vs previous period.
  - *Hall Occupancy:* Operational capacity percentage, target variance.
  - *Pending Payments:* Accrued receivables, outstanding invoice count.
  - *Upcoming Events:* Scheduled event volume in the next 7-day window.
- **Visualizations (Recharts):**
  - *Revenue Overview Line Chart:* Multi-period projection comparing Booked Revenue vs Ancillary Catering. Filterable by Hall (`All`, `Main Wing`, `Annex`) and Revenue Stream (`Invoiced` vs `Collected`).
  - *Hall Occupancy Donut (PieChart):* Proportional utilization breakdown for Grand Ballroom, Crystal Pavilion, Royal Banquet, and Garden Lawn.
- **Quick Tables:**
  - *Upcoming Events List:* Event type/customer, date, hall, status badge with calendar navigation link.
  - *Recent Transactions List:* Transaction reference, billing amount, timestamp, settlement badge with link to invoices.

---

### 4.3 Halls & Venue Management
- **File:** `frontend/src/components/modules/HallsModule.tsx`
- **Model:** `Hall`
- **Features & UI Controls:**
  - Top Metrics: Configured Halls, Active Venues, Aggregate Guest Capacity, Average Base Rent per shift.
  - Filter Bar: Free text search (hall name, floor, code), Operational Status filter (`All`, `Active`, `Under Maintenance`).
  - Venue Cards: Code (`HL-01`), guest capacity, shift base rent, floor/location, facilities badges.
  - Facility Amenities Catalog:
    1. Air Conditioning (AC)
    2. Dedicated Parking
    3. Acoustic Stage & Rigging
    4. Backup Power Generator
    5. Executive Bridal Suite
  - Modal Form: Hall Name, Max Capacity, Base Rent, Location/Floor, multi-select facilities toggles, and Operational Status.

---

### 4.4 Bookings & Reservations
- **Files:** `frontend/src/components/modules/BookingsModule.tsx`, `frontend/src/components/bookings/CreateBookingForm.tsx`
- **Model:** `Booking`
- **Features & UI Controls:**
  - Filter Bar: Search by Booking ID, customer name, or event type; Date range picker; Hall selector dropdown; Status selector (`Pending`, `Confirmed`, `Cancelled`); Filter reset.
  - Comprehensive Data Table:
    - Columns: Booking ID, Customer Name + Contact Ref, Event Type, Hall/Venue, Event Date & Time, Status, Payment Status, Actions (View, Edit, Delete).
    - Status Badges: Confirmed (emerald), Pending/Under Review (amber), Cancelled (rose).
    - Payment Badges: Paid (teal), Partial (amber), Unpaid (rose).
  - Details Modal: Read-only modal displaying customer, hall, timings, contractual amount, and settlement status.
  - Create/Edit Booking Form (`CreateBookingForm.tsx`):
    - *Step 1: Customer Information:* Full Name (required), Phone (required), CNIC / National ID, Address.
    - *Step 2: Event & Venue Details:* Event Type (Mehndi, Barat, Walima, Other), Hall/Venue (Hall 1, Hall 2, Hall 3, Garden Lawn), Event Date (required), Expected Headcount, Seating Arrangement (Theater, Round Tables, Mixed).
    - *Step 3: Menu & Catering:* Package Selection (Package A Standard, Package B Imperial, Package C Executive, Custom/Hall Only), Special Dietary Instructions.
    - *Step 4: Timing & Extra Time:* Start Time, End Time, Overtime calculator (Extra Hours × Rate Per Hour = Total Extra Charges).
    - *Step 5: Payment Summary (Admin Only):* Total Booking Amount, Advance Payment Received, auto-calculated Remaining Balance.

---

### 4.5 Calendar & Multi-Hall Scheduling
- **File:** `frontend/src/components/modules/CalendarModule.tsx`
- **Models:** `Booking`, `BlockedDate`
- **Features & UI Controls:**
  - View Modes: Full Month Grid (35/42 cells with padded sibling days) and 7-day Week View.
  - Controls: Month/Week navigator, Today jump button, Hall dropdown filter (`All Halls`, individual halls).
  - Availability & Maintenance Blocking:
    - "Block Date" Modal: Select Hall, Start Date, End Date, Reason (e.g., deep cleaning, acoustic installation, floor carpet replacement).
    - Blocked dates render high-visibility amber badges across affected calendar cells.
    - Clickable day cells trigger the maintenance block modal pre-populated with selected date.

---

### 4.6 Customers & CRM
- **File:** `frontend/src/components/modules/CustomersModule.tsx`
- **Model:** `Customer`
- **Features & UI Controls:**
  - Customer Ledger: Customer ID (`CUST-1001`), Full Name + CNIC, Phone & Email, Total Bookings count, Lifetime Value ($ LTV), Status (`Active`, `Inactive`).
  - Search & Sorting: Search across names, phone numbers, CNIC, and IDs; filter by status; sort by Newest, Alphabetical (A-Z), or Lifetime Value.
  - Profile View Modal: Customer card showing total bookings, lifetime value, residential address, and special notes.
  - Add/Edit Customer Modal: Full Name, Phone, Email, CNIC, Residential/Office Address, Notes, Status.

---

### 4.7 Event Types & Ceremonial Configurations
- **File:** `frontend/src/components/modules/EventsModule.tsx`
- **Model:** `EventTypeConfig`
- **Features & UI Controls:**
  - Purpose: Standardizes booking parameters for traditional and corporate events.
  - Metrics: Total Event Types, Standard Shift Timings, Color Code Matrix.
  - Card Grid: Event Type Name, Default Start Time, Default End Time, Accent Color swatch, Description.
  - Color Swatches / Presets:
    - Amber Gold `#f59e0b` (Mehndi)
    - Crimson Rose `#e11d48` (Barat)
    - Emerald Velvet `#059669` (Walima)
    - Royal Purple `#7c3aed` (Reception)
    - Sapphire Blue `#2563eb` (Engagement)
    - Teal Horizon `#00685f` (Qawwali / Musical)
  - Add/Edit Modal: Name, default start/end shift hours, live color picker input + quick preset buttons, setup description.

---

### 4.8 Menu & Catering Management
- **File:** `frontend/src/components/modules/MenuModule.tsx`
- **Model:** `MenuPackage`, `MenuItem`
- **Features & UI Controls:**
  - Culinary Package Catalog: Package Code (`PKG-01`), Package Name, Price Per Head ($), Description, Included Dishes tag list, Status (`Active` / `Inactive`).
  - Metrics: Total Packages, Cataloged Dishes count, Average Price Per Head.
  - Search & Filter: Search by package name, description, or included dishes; status filter.
  - Add/Edit Package Modal: Package Name, Price Per Head, Description, Tag Input with Enter-key support and quick suggestion pills (Chicken Biryani, Mutton Karahi, Seekh Kabab, Chicken Tikka, Roghnai Naan, Fresh Salad & Raita, Gulab Jamun, Kheer/Firni, Mint Lemonade).

---

### 4.9 Inventory & Banquet Assets
- **File:** `frontend/src/components/modules/InventoryModule.tsx`
- **Model:** `InventoryItem`
- **Features & UI Controls:**
  - KPI Cards: Total Items registered, Items Currently In Use (dispatched to events), Low Stock alert count (< 10 units), Assets Needing Repair / Damaged.
  - Filter Bar: Search by item name, code (`INV-1001`), or storage location; Category filter (`Furniture`, `Crockery`, `Electronics`, `Decor`, `Lighting`); Condition filter (`Good`, `Needs Repair`, `Damaged`).
  - Data Table: Item Code, Item Name + Storage Location, Category, Total Stock, Available Stock, In Use Quantity, Condition badge, Actions.
  - Actions:
    - *Issue to Event Modal:* Dispatch available units to an active hall/event, updating available and in-use balances.
    - *Add/Edit Item Modal:* Item Name, Category, Total Quantity, Condition, Storage Location.
    - *Delete Asset.*

---

### 4.10 Invoices, Payments & Overtime Approvals
- **File:** `frontend/src/components/modules/PaymentsModule.tsx`
- **Models:** `InvoiceRecord`, `PaymentTransaction`, `ExtraTimeRequest`
- **Features & UI Controls:**
  - KPI Cards: Total Revenue, Pending Receivables, Approved Extra Time Surcharges, Total Refunds.
  - **Overtime Escalation Queue (Critical Admin Feature):**
    - Floor staff overtime requests appear in an approval table.
    - Displays: Hall Name, Booking Ref, Requested Hours (`+X hr`), Delay Justification Reason, Estimated Extra Charges.
    - Actions: One-click "Approve" (commits charges to the invoice ledger) or "Reject".
  - Main Invoices Ledger:
    - Filters: Search (invoice ID, booking ref, client name), Date range picker, Status filter (`Paid`, `Partial`, `Unpaid`).
    - Table: Invoice ID, Booking Ref, Customer Name, Total Contract Amount, Paid Amount, Remaining Balance, Payment Status, Actions (View Statement, Print Invoice).
  - Print & Statement Modal: Displays printable invoice statement with browser `window.print()` trigger.

---

### 4.11 Operational Expenses
- **File:** `frontend/src/components/modules/ExpensesModule.tsx`
- **Model:** `ExpenseRecord`
- **Features & UI Controls:**
  - Tracks operational expenditures: Staff overtime wages, utility surges, laundry, floral sourcing.
  - KPI Cards: Total Outflow, Vendor Payables, Facility Utilities, Turnover Costs.
  - Data Table (`DataTable` component): Expense Ref, Operational Category, Payee/Vendor, Approved By, Disbursement Date, Disbursement Amount.
  - File Expense Claim action trigger.

---

### 4.12 Staff & Vendor Directory
- **File:** `frontend/src/components/modules/StaffVendorsModule.tsx`
- **Models:** `StaffMember`, `VendorPartner`
- **Features & UI Controls:**
  - Tabbed Layout:
    - *Tab 1: Internal Staff:* Employee ID (`EMP-1001`), Full Name, Role (`Manager`, `Floor Staff`, `Admin`, `Accountant`), Contact Number, Shift Timing (Morning, Evening, Night Setup, Full Day Rotation), Status (`Active`, `On Leave`, `Inactive`).
    - *Tab 2: External Vendors:* Vendor ID (`VEN-1001`), Business Name, Category (`Decorator`, `Caterer`, `Photographer`, `Sound/Lights`, `Other`), Contact Person, Phone Number.
  - Filters: Free text search, Role/Category filters, Status filters.
  - Modals: Add/Edit Staff and Add/Edit Vendor with full form validation.
  - Direct shortcut: `Tablet Mode` switcher button.

---

### 4.13 Floor Staff Tablet Interface
- **File:** `frontend/src/components/modules/FloorStaffTabletView.tsx`
- **Target Form Factor:** Tablet / Touch Devices on event floors
- **Security Scope:** Read-Only event specifications with a single escalation action.
- **Features & UI Controls:**
  - High-contrast banner with Live Event pulsing indicator, active Hall, and Event Date.
  - Event Details Card: Customer Name, Event Type, Expected Headcount (seats).
  - Timing Schedule Card: Event Start Time, Event End Time.
  - Seating Architecture Card: Arrangement Style (Theater, Round Tables), Total Tables count.
  - Menu & Catering Specifications Card: Selected Menu Package, Special Instructions (food allergies, dietary requirements, sugar-free desserts).
  - **Prominent Touch Button: "Request Extra Time"**:
    - Large primary button opening a touch-optimized modal.
    - Fields: Extra Hours Required (e.g. 1.5 hr), Delay Reason.
    - Dispatches a request directly to the Admin Invoices & Payments module (`ExtraTimeRequest`).

---

### 4.14 Business Reports & GAAP Analytics
- **File:** `frontend/src/components/modules/ReportsModule.tsx`
- **Features & UI Controls:**
  - Header Controls: Date range picker, Hall selector dropdown, Quick Presets (`This Month`, `Last Quarter`, `Year to Date`).
  - KPI Summary: Total Revenue, Total Bookings, Total Expenses, Net Operating Profit.
  - Visual Analytics (Recharts):
    - *Chart 1 (Full Width):* Revenue vs Expenses Trend (12-month dual bar chart).
    - *Chart 2 (Half Width):* Bookings by Hall (Donut occupancy breakdown).
    - *Chart 3 (Half Width):* Top Selling Menu Packages (Horizontal bar chart ranked by sales volume).
  - Monthly Financial Breakdown Table: Month, Total Bookings, Gross Revenue, Total Expenses, Net Profit.
  - Export Options: Immediate CSV and PDF export triggers.

---

### 4.15 System Audit Logs & WORM Governance
- **File:** `frontend/src/components/modules/AuditLogsModule.tsx`
- **Model:** `AuditLogEntry`
- **Features & UI Controls:**
  - Purpose: WORM (Write-Once-Read-Many) immutable security ledger tracking user actions.
  - Filters: Free search, Date range, User Role filter (`Admin`, `Manager`, `Floor Staff`), Action Type filter (`Created`, `Updated`, `Deleted`, `Login`, `Approved`).
  - Data Table: Log ID, Timestamp, User + Role, Color-Coded Action Badge (Created = Green, Deleted = Red, Updated = Blue, Login = Gray, Approved = Teal), Target Module, Action Description/Details, Client IP Address.
  - Test Event Trigger: "Record Test Event" modal to simulate audit entries and verify badge styling.
  - Export: Exports logs in CSV and JSON formats.

---

### 4.16 System Settings & FBR Compliance
- **File:** `frontend/src/components/modules/SettingsModule.tsx`
- **Features & UI Controls:**
  - Organized into 4 tabs:
    - *Tab 1: Business Profile:* Business Name, Head Office Address, Phone, Email, Business Logo file upload placeholder.
    - *Tab 2: Tax & FBR Compliance (Pakistan Fiscal SRO):*
      - Toggle: "Enable FBR Digital Invoicing" (Default: Off).
      - NTN (National Tax Number) & STRN (Sales Tax Registration Number).
      - FBR Integrator dropdown (`PRAL` / `Private Integrator`).
      - FBR POS ID, API Client ID, API Client Secret with show/hide password toggle.
      - Fiscal notice confirming automatic appending of QR stamps and USIN reference numbers.
    - *Tab 3: Invoicing & Billing:* Currency Symbol (`PKR`, `$`), Default Tax Rate (%), Invoice Prefix (`INV-`), Terms & Conditions agreement text block.
    - *Tab 4: User Roles & Permissions:* Standard System Roles Matrix (Admin, Floor Staff, Manager) and custom granular role builder.

---

## 5. TypeScript Data Models & Schema Reference

From `frontend/src/types/index.ts`:

```typescript
export type NavModuleId =
  | 'dashboard' | 'halls' | 'bookings' | 'calendar' | 'customers'
  | 'events' | 'menu' | 'inventory' | 'payments' | 'expenses'
  | 'staff' | 'vendors' | 'reports' | 'audit-logs' | 'settings';

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
```

---

## 6. Django Backend Architecture Plan

To support this frontend seamlessly, the backend will be implemented using **Django 5.x** and **Django REST Framework (DRF)**.

### 6.1 Modular Django App Structure

```
backend/
├── manage.py
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── local.py
│   │   └── production.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
└── apps/
    ├── authentication/      # Custom User, JWT auth, RBAC permissions
    ├── venues/              # Hall, Facility, HallMaintenanceBlock models
    ├── reservations/        # Booking, ExtraTimeRequest, Slot collision logic
    ├── customers/           # Customer CRM, CNIC, Lifetime value computation
    ├── event_types/         # EventTypeConfig, shift templates, color tags
    ├── catering/            # MenuPackage, MenuItem, Dish catalog
    ├── inventory/           # InventoryItem, AssetDispatchHistory
    ├── billing/             # InvoiceRecord, PaymentTransaction, ExpenseRecord
    ├── workforce/           # StaffMember, VendorPartner, Shift assignments
    ├── audit/               # AuditLogEntry, automated signals/middleware
    ├── reporting/           # Analytics aggregations, CSV & PDF generators
    └── compliance/          # FBR POS e-invoicing, QR code generation, SRO payload
```

---

### 6.2 Relational Database Schema & Models

#### App: `apps.authentication`
- **`User` (Custom User Model):**
  - `id`: UUID (Primary Key)
  - `username` / `email`: Unique
  - `first_name`, `last_name`
  - `role`: Choices (`ADMIN`, `MANAGER`, `FLOOR_STAFF`, `ACCOUNTANT`)
  - `is_active`, `is_staff`, `date_joined`

#### App: `apps.venues`
- **`Hall`:**
  - `id`: UUID
  - `code`: CharField(max_length=10, unique=True, default="HL-01")
  - `name`: CharField(max_length=150)
  - `capacity`: PositiveIntegerField
  - `base_rent`: DecimalField(max_digits=10, decimal_places=2)
  - `hourly_rate`: DecimalField(max_digits=8, decimal_places=2, default=0)
  - `location_floor`: CharField(max_length=100)
  - `facilities`: JSONField(default=list)  # ['AC', 'Parking', 'Stage', 'Generator', 'Bridal Room']
  - `status`: CharField(choices=['Active', 'Under Maintenance'], default='Active')
  - `image`: ImageField(upload_to='halls/', null=True, blank=True)
- **`BlockedDate`:**
  - `id`: UUID
  - `hall`: ForeignKey(Hall, null=True, blank=True, on_delete=CASCADE) # null = All Halls
  - `start_date`: DateField
  - `end_date`: DateField
  - `reason`: CharField(max_length=255)

#### App: `apps.customers`
- **`Customer`:**
  - `id`: UUID
  - `customer_id`: CharField(max_length=20, unique=True, db_index=True) # e.g. "CUST-1001"
  - `name`: CharField(max_length=200)
  - `email`: EmailField(blank=True)
  - `phone`: CharField(max_length=30, db_index=True)
  - `cnic`: CharField(max_length=30, blank=True)
  - `address`: TextField(blank=True)
  - `notes`: TextField(blank=True)
  - `status`: CharField(choices=['Active', 'Inactive'], default='Active')
  - `created_at`: DateTimeField(auto_now_add=True)
  - *Dynamic Properties:* `total_bookings`, `lifetime_value`, `outstanding_balance` calculated via DB aggregates.

#### App: `apps.event_types`
- **`EventTypeConfig`:**
  - `id`: UUID
  - `name`: CharField(max_length=100, unique=True)
  - `default_start_time`: TimeField
  - `default_end_time`: TimeField
  - `calendar_color`: CharField(max_length=10, default="#00685f")
  - `description`: TextField(blank=True)

#### App: `apps.catering`
- **`MenuPackage`:**
  - `id`: UUID
  - `package_code`: CharField(max_length=20, unique=True) # e.g. "PKG-01"
  - `name`: CharField(max_length=150)
  - `price_per_head`: DecimalField(max_digits=8, decimal_places=2)
  - `description`: TextField(blank=True)
  - `included_items`: JSONField(default=list) # Array of dish names
  - `status`: CharField(choices=['Active', 'Inactive'], default='Active')

#### App: `apps.reservations`
- **`Booking`:**
  - `id`: UUID
  - `booking_ref`: CharField(max_length=25, unique=True, db_index=True) # e.g. "BK-82914"
  - `customer`: ForeignKey('customers.Customer', on_delete=PROTECT, related_name='bookings')
  - `event_type`: ForeignKey('event_types.EventTypeConfig', on_delete=PROTECT)
  - `hall`: ForeignKey('venues.Hall', on_delete=PROTECT, related_name='bookings')
  - `menu_package`: ForeignKey('catering.MenuPackage', on_delete=SET_NULL, null=True, blank=True)
  - `date`: DateField(db_index=True)
  - `start_time`: TimeField()
  - `end_time`: TimeField()
  - `guest_count`: PositiveIntegerField()
  - `seating_arrangement`: CharField(max_length=50, blank=True) # Theater, Round Tables, Mixed
  - `special_instructions`: TextField(blank=True)
  - `status`: CharField(choices=['Pending', 'Confirmed', 'Under Review', 'Cancelled', 'Deposit Paid', 'Completed'], default='Confirmed')
  - `total_amount`: DecimalField(max_digits=12, decimal_places=2)
  - `advance_payment`: DecimalField(max_digits=12, decimal_places=2, default=0)
  - `created_at`: DateTimeField(auto_now_add=True)
  - `updated_at`: DateTimeField(auto_now=True)
- **`ExtraTimeRequest`:**
  - `id`: UUID
  - `booking`: ForeignKey(Booking, on_delete=CASCADE, related_name='extra_time_requests')
  - `requested_hours`: DecimalField(max_digits=4, decimal_places=1) # e.g. 1.5
  - `rate_per_hour`: DecimalField(max_digits=8, decimal_places=2)
  - `estimated_charges`: DecimalField(max_digits=10, decimal_places=2)
  - `reason`: TextField(blank=True)
  - `status`: CharField(choices=['Pending', 'Approved', 'Rejected'], default='Pending')
  - `requested_by`: ForeignKey('authentication.User', on_delete=SET_NULL, null=True)
  - `created_at`: DateTimeField(auto_now_add=True)

#### App: `apps.inventory`
- **`InventoryItem`:**
  - `id`: UUID
  - `item_code`: CharField(max_length=20, unique=True, db_index=True) # e.g. "INV-4921"
  - `item_name`: CharField(max_length=200)
  - `category`: CharField(choices=['Furniture', 'Crockery', 'Electronics', 'Decor', 'Lighting'])
  - `total_quantity`: PositiveIntegerField()
  - `available_quantity`: PositiveIntegerField()
  - `in_use_quantity`: PositiveIntegerField(default=0)
  - `condition`: CharField(choices=['Good', 'Needs Repair', 'Damaged'], default='Good')
  - `storage_location`: CharField(max_length=150, blank=True)
- **`AssetDispatch`:**
  - `id`: UUID
  - `item`: ForeignKey(InventoryItem, on_delete=PROTECT)
  - `booking`: ForeignKey('reservations.Booking', on_delete=SET_NULL, null=True, blank=True)
  - `quantity`: PositiveIntegerField()
  - `dispatched_at`: DateTimeField(auto_now_add=True)
  - `returned_at`: DateTimeField(null=True, blank=True)

#### App: `apps.billing`
- **`InvoiceRecord`:**
  - `id`: UUID
  - `invoice_id`: CharField(max_length=30, unique=True, db_index=True) # e.g. "INV-1092"
  - `booking`: OneToOneField('reservations.Booking', on_delete=PROTECT, related_name='invoice')
  - `total_amount`: DecimalField(max_digits=12, decimal_places=2)
  - `paid_amount`: DecimalField(max_digits=12, decimal_places=2, default=0)
  - `remaining_balance`: DecimalField(max_digits=12, decimal_places=2)
  - `payment_status`: CharField(choices=['Paid', 'Partial', 'Unpaid'], default='Unpaid')
  - `date`: DateField(auto_now_add=True)
  - `fbr_invoice_number`: CharField(max_length=100, blank=True, null=True)
  - `fbr_qr_code`: TextField(blank=True, null=True)
- **`PaymentTransaction`:**
  - `id`: UUID
  - `txn_ref`: CharField(max_length=30, unique=True) # e.g. "TXN-8472"
  - `invoice`: ForeignKey(InvoiceRecord, on_delete=PROTECT, related_name='transactions')
  - `amount`: DecimalField(max_digits=12, decimal_places=2)
  - `channel`: CharField(max_length=50) # Cash, Bank Transfer, Card, Cheque
  - `billing_status`: CharField(choices=['Settled', 'Pending', 'Unpaid', 'Processing'], default='Settled')
  - `timestamp`: DateTimeField(auto_now_add=True)
- **`ExpenseRecord`:**
  - `id`: UUID
  - `expense_ref`: CharField(max_length=30, unique=True) # e.g. "EXP-3091"
  - `category`: CharField(max_length=100) # Staff Overtime, Utility Surges, Floral Sourcing, Laundry
  - `vendor`: CharField(max_length=150)
  - `amount`: DecimalField(max_digits=10, decimal_places=2)
  - `approved_by`: CharField(max_length=100)
  - `payment_method`: CharField(max_length=50)
  - `date`: DateField()

#### App: `apps.workforce`
- **`StaffMember`:**
  - `id`: UUID
  - `employee_id`: CharField(max_length=20, unique=True) # e.g. "EMP-9281"
  - `full_name`: CharField(max_length=150)
  - `role`: CharField(choices=['Manager', 'Floor Staff', 'Admin', 'Accountant'])
  - `contact_number`: CharField(max_length=30)
  - `shift_timing`: CharField(max_length=100)
  - `status`: CharField(choices=['Active', 'On Leave', 'Inactive'], default='Active')
- **`VendorPartner`:**
  - `id`: UUID
  - `vendor_id`: CharField(max_length=20, unique=True) # e.g. "VEN-4912"
  - `business_name`: CharField(max_length=200)
  - `category`: CharField(choices=['Decorator', 'Caterer', 'Photographer', 'Sound/Lights', 'Other'])
  - `contact_person`: CharField(max_length=150)
  - `phone_number`: CharField(max_length=30)

#### App: `apps.audit`
- **`AuditLogEntry`:**
  - `id`: UUID
  - `log_id`: CharField(max_length=30, unique=True) # e.g. "LOG-3912"
  - `timestamp`: DateTimeField(auto_now_add=True, db_index=True)
  - `user`: ForeignKey('authentication.User', on_delete=SET_NULL, null=True)
  - `user_name`: CharField(max_length=150)
  - `user_role`: CharField(max_length=50)
  - `action`: CharField(choices=['Created', 'Updated', 'Deleted', 'Login', 'Approved'])
  - `module`: CharField(max_length=50)
  - `details`: TextField()
  - `ip_address`: GenericIPAddressField()

#### App: `apps.compliance` & `apps.reporting`
- **`SystemSetting`:** Singleton model for business profile, FBR credentials (NTN, STRN, POS ID, Client ID/Secret), and invoice terms.

---

### 6.3 Business Rules & Validation Logic

1. **Scheduling Conflict Prevention (Slot Collision Check):**
   - A hall cannot have overlapping bookings on the same date and overlapping shift times.
   - A hall cannot be booked during dates blocked for maintenance in `BlockedDate`.
2. **Dynamic Balance & Payment Status Calculation:**
   - Whenever an advance payment or transaction is recorded, `remaining_balance = total_amount - paid_amount`.
   - If `remaining_balance <= 0`, set status to `'Paid'`. If `paid_amount > 0` but `remaining_balance > 0`, set status to `'Partial'`. Else `'Unpaid'`.
3. **Extra Time Approval Workflow:**
   - Floor staff submits an `ExtraTimeRequest` via the Tablet View.
   - Admin reviews the request in the Invoices & Payments module.
   - Upon `Approved`, the system:
     1. Updates the request status to `'Approved'`.
     2. Appends `estimated_charges` to the corresponding `Booking.total_amount` and `InvoiceRecord.total_amount`.
     3. Recalculates `InvoiceRecord.remaining_balance`.
     4. Creates an `AuditLogEntry` recording the approval and charge addition.
4. **Inventory Stock Reservation & Dispatch:**
   - On dispatch: `available_quantity` is decremented and `in_use_quantity` is incremented.
   - Dispatch fails with a 400 Bad Request if requested units exceed `available_quantity`.
5. **Automated Audit Logging:**
   - Django signals (`post_save`, `post_delete`) and middleware log operations with user identity, client IP, and model diffs.

---

### 6.4 Authentication & Role-Based Access Control (RBAC)

| Role | Access Scope | Specific Permissions |
|---|---|---|
| **Admin** | Global (Full Access) | Can approve overtime, modify FBR keys, view GAAP financial statements, manage user accounts. |
| **Manager** | Operational Console | Can create/edit bookings, manage halls, menu packages, customer CRM, and inventory. |
| **Floor Staff** | Floor Tablet View | Read-only access to live hall events, guest counts, seating, menu requirements; write access only to `Request Extra Time`. |
| **Accountant** | Financial Console | Invoices, payments, expense filing, and financial reports. |

---

### 6.5 REST API Endpoint Matrix (Django REST Framework)

| Module / Scope | HTTP Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/api/v1/auth/token/` | JWT token obtain (pair) |
| | `POST` | `/api/v1/auth/token/refresh/` | JWT token refresh |
| | `GET` | `/api/v1/auth/me/` | Current user profile & role |
| **Dashboard** | `GET` | `/api/v1/dashboard/metrics/` | Summary KPIs (bookings, occupancy, receivables, upcoming) |
| | `GET` | `/api/v1/dashboard/revenue-trend/` | Line chart points (quarterly/monthly revenue) |
| | `GET` | `/api/v1/dashboard/occupancy-slice/`| Donut chart slices for hall distribution |
| **Halls** | `GET`, `POST` | `/api/v1/halls/` | List/filter halls, create new hall |
| | `GET`, `PUT`, `DELETE` | `/api/v1/halls/{id}/` | Retrieve, update, remove hall |
| **Calendar** | `GET` | `/api/v1/calendar/events/` | Monthly/weekly scheduled events matrix |
| | `GET`, `POST` | `/api/v1/calendar/blocked-dates/` | List blocked dates, schedule new maintenance block |
| | `DELETE` | `/api/v1/calendar/blocked-dates/{id}/` | Clear a maintenance block |
| **Bookings** | `GET`, `POST` | `/api/v1/bookings/` | List/filter bookings, create reservation |
| | `GET`, `PUT`, `DELETE` | `/api/v1/bookings/{id}/` | Retrieve booking details, edit, delete |
| | `POST` | `/api/v1/bookings/check-availability/` | Pre-submission slot conflict check |
| **Overtime** | `GET` | `/api/v1/overtime-requests/` | List overtime escalation queue |
| | `POST` | `/api/v1/overtime-requests/` | Floor staff creates extra time request |
| | `POST` | `/api/v1/overtime-requests/{id}/approve/` | Admin approves extra hours & updates billing |
| | `POST` | `/api/v1/overtime-requests/{id}/reject/` | Admin rejects request |
| **Customers** | `GET`, `POST` | `/api/v1/customers/` | List/search customers, create customer profile |
| | `GET`, `PUT`, `DELETE` | `/api/v1/customers/{id}/` | Retrieve, edit, delete customer |
| **Events** | `GET`, `POST` | `/api/v1/event-types/` | List/create ceremonial event templates & color swatches |
| | `GET`, `PUT`, `DELETE` | `/api/v1/event-types/{id}/` | Retrieve, edit, delete event template |
| **Menu** | `GET`, `POST` | `/api/v1/menu-packages/` | List/create catering packages |
| | `GET`, `PUT`, `DELETE` | `/api/v1/menu-packages/{id}/` | Retrieve, edit, delete catering package |
| **Inventory** | `GET`, `POST` | `/api/v1/inventory/` | List/search inventory assets, register new item |
| | `GET`, `PUT`, `DELETE` | `/api/v1/inventory/{id}/` | Retrieve, update, delete asset |
| | `POST` | `/api/v1/inventory/{id}/issue/` | Dispatch stock units to an event |
| **Billing** | `GET` | `/api/v1/invoices/` | List/filter invoices ledger |
| | `GET` | `/api/v1/invoices/{id}/` | Retrieve invoice details with transactions |
| | `POST` | `/api/v1/payments/` | Record transaction payment tranche |
| | `GET`, `POST` | `/api/v1/expenses/` | List/file operational expense vouchers |
| **Workforce** | `GET`, `POST` | `/api/v1/staff/` | List/enroll internal staff members |
| | `GET`, `PUT`, `DELETE` | `/api/v1/staff/{id}/` | Retrieve, edit, delete staff record |
| | `GET`, `POST` | `/api/v1/vendors/` | List/register external vendor partners |
| | `GET`, `PUT`, `DELETE` | `/api/v1/vendors/{id}/` | Retrieve, edit, delete vendor partner |
| **Reports** | `GET` | `/api/v1/reports/financial-summary/` | GAAP financial statement and monthly breakdown |
| | `GET` | `/api/v1/reports/export-csv/` | Download CSV report |
| | `GET` | `/api/v1/reports/export-pdf/` | Download PDF statement |
| **Audit** | `GET`, `POST` | `/api/v1/audit-logs/` | Query WORM audit records, record test event |
| | `GET` | `/api/v1/audit-logs/export/` | Download CSV/JSON audit export |
| **Settings** | `GET`, `PUT` | `/api/v1/settings/profile/` | Business profile & logo |
| | `GET`, `PUT` | `/api/v1/settings/tax-compliance/` | FBR POS keys and digital invoicing toggle |
| | `GET`, `PUT` | `/api/v1/settings/billing/` | Currency, default tax rate, and terms |

---

## 7. Frontend-to-Backend Integration Roadmap

When backend development begins, connect the frontend with the following implementation steps:

1. **API Client Layer:**
   - Install `axios` and `@tanstack/react-query` in `frontend/`.
   - Create `frontend/src/api/client.ts` with base URL configuration (`VITE_API_BASE_URL`), request interceptor for JWT `Bearer` token injection, and response interceptor for automatic token refresh.

2. **Environment Configuration:**
   - In `frontend/.env`:
     ```env
     VITE_API_BASE_URL=http://localhost:8000/api/v1
     ```

3. **State Hydration:**
   - Replace empty `useState<T[]>([])` declarations across each module with React Query hooks (e.g. `useBookings()`, `useHalls()`, `useInvoices()`).
   - Retain existing empty-state JSX wireframes for `data.length === 0` responses from the API.

4. **Django CORS & CSRF:**
   - In Django `settings.py`, configure `django-cors-headers` to allow frontend origins (`http://localhost:3000`, `http://localhost:5173`).
   - Enable `CORS_ALLOW_CREDENTIALS = True`.

5. **Floor Staff Tablet Authentication:**
   - Provide a simplified PIN or fast-login endpoint for tablet devices that automatically grants Floor Staff scoped read-only access and redirects to `FloorStaffTabletView`.

---

*Document compiled and preserved in project workspace as authoritative specification for subsequent Django backend engineering.*
