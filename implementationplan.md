# Marriage Hall Management System (MHMS) Enterprise
## Implementation Plan & Task Breakdown

> **Tracking Rule:** We will execute **one subtask at a time**. After each subtask is implemented, tested, and verified, its checkbox will be updated to `[x]` (Done).  
> **Git Policy:** No commits or pushes to GitHub will be made without explicit user instruction.

---

## 📌 Status Summary
- **Total Phases:** 7
- **Total Subtasks:** 32
- **Completed:** 11 (Phase 1: 100%, Phase 2: 100%)
- **In Progress:** 0
- **Pending:** 21

---

## Phase 1: Authentication & Navigation Framework (Completed)

- [x] **Task 1.1: Backend Authentication & User Role Endpoints**
  - [x] Implement Admin registration API (only for initial admin account/owner onboarding).
  - [x] Implement Login API returning user token/session, role (`admin`, `manager`, `kitchen`, `waiter`, `accountant`), full name, and permissions.
  - [x] Implement Current User (`/api/v1/auth/me/`) and Logout endpoints.
  - [x] Ensure non-admin users cannot register themselves (only Admin can create employees/users from User Directory).

- [x] **Task 1.2: Frontend Authentication Views (Login & Admin Register Screens)**
  - [x] Create dedicated luxury banquet-themed `LoginScreen` with email/username and password inputs.
  - [x] Create initial `AdminRegisterScreen` (visible when no admin exists or via admin registration link).
  - [x] Wire authentication state with persistent storage (`localStorage` / token) and auto-redirection.
  - [x] Add Logout button to topbar profile menu.

- [x] **Task 1.3: Top Navbar Portal Switcher & Dynamic Sidebar Shell**
  - [x] Build Top Navigation Bar with 6 portal buttons (`👑 Admin Console`, `👔 Event Manager`, `🍳 Kitchen ERP`, `📱 Waiter Kiosk`, `🚚 Vendors & Suppliers`, `💼 Financial Accounting`).
  - [x] Implement reactive state in `MainLayout` that completely swaps the Sidebar navigation links and icons according to the active portal.
  - [x] Add active tab styling and mobile responsive drawer support.

- [x] **Task 1.4: Role Guard & Admin "View As" Impersonation**
  - [x] Restrict portal views based on logged-in user role (e.g. Waiter automatically lands on Waiter Kiosk; Kitchen lands on KDS).
  - [x] Enable Admin super-user toggle: Admin can freely switch into any portal to view and manage entries in that specific role's context.


---

## Phase 2: 👑 Admin (Owner) Master Suite (Completed)

- [x] **Task 2.1: Admin Executive Overview Tab**
  - [x] Live KPI Cards: Total Active Halls, Bookings Count, Today's Occupancy %, Month-to-date Revenue, Outstanding Receivables.
  - [x] Visual trajectory charts for sales velocity and multi-hall occupancy distribution.
  - [x] Quick links to Hall Creation, User Management, and Financial Statements.

- [x] **Task 2.2: Halls Registry & Morning/Evening Slot Calendar Tab**
  - [x] Wire full CRUD for halls with capacity tiers, base rent, and facility tags to SQLite backend.
  - [x] Implement dual-slot calendar engine: Morning/Afternoon (*12:00 PM – 04:00 PM*) vs. Evening/Dinner (*07:00 PM – 11:30 PM*).
  - [x] Real-time slot collision detection preventing double-bookings.

- [x] **Task 2.3: Bookings Master Ledger & Branded Contract PDF Tab**
  - [x] Unified booking contract intake with customer details, CNIC, and event selections.
  - [x] Real-time availability verification before booking confirmation.
  - [x] Branded PDF/Printable Booking Contract generation featuring hall terms, sound curfews, payment schedules, and signature blocks.

- [x] **Task 2.4: User & Staff Directory Tab (Salaries & RBAC Rights)**
  - [x] Staff and worker personnel directory (Managers, Waiters, Chefs, Cleaners, Helpers).
  - [x] Monthly salary configuration and disbursement status tracking.
  - [x] Role-Based Access Control (RBAC) editor: assign permissions per user role (e.g., allow specific managers to access vendors).

- [x] **Task 2.5: Operational Expenses & Claim Approvals Tab**
  - [x] Working modal to file operational venue expenses (utilities, floral decor, stage repairs, fuel).
  - [x] Manager submission vs. Admin approval workflow with status (`Pending`, `Approved`, `Settled`).
  - [x] Auto-integration with General Ledger and cash disbursement records.

- [x] **Task 2.6: Periodic Closings Tab (Day, Week, Month, Fiscal Year)**
  - [x] Daily register closing summary: cash in hand, digital receipts, payments disbursed, net balance.
  - [x] Weekly and monthly audit roll-ups.
  - [x] Fiscal year-end closing ledger with lock-out archive.

- [x] **Task 2.7: Dynamic FBR Digital Invoicing & System Settings Tab**
  - [x] Venue business profile editor (Logo, business name, address, tax NTN/STRN).
  - [x] Dynamic FBR integration panel (POS ID, Client ID, Client Secret, PRAL endpoint toggle).
  - [x] Keep FBR **dormant by default** until credentials are provided and validated.

---

## Phase 3: 👔 Event Manager Portal

- [ ] **Task 3.1: Manager Dashboard & Assigned Events Overview Tab**
  - [ ] Filtered overview of today's and upcoming events assigned to the logged-in manager.
  - [ ] Event status indicators: Setup in Progress, Guests Arrived, Food Service Active, Event Concluded.

- [ ] **Task 3.2: Team Coordination & Duty Rosters Tab**
  - [ ] Assign team rosters per event: Decoration Crew, Waiters, Kitchen Team, Cleaners, Helpers.
  - [ ] Shift attendance check-in and replacement tracking.

- [ ] **Task 3.3: Asset & Inventory Requisition Tab**
  - [ ] Form to request physical items from central storage (e.g., 300 Banquet Chairs, 30 Chafing Dishes, Spotlights).
  - [ ] Warehouse approval & checkout/return status tracking.

- [ ] **Task 3.4: Event Day Live Checklist & Overtime Watch Tab**
  - [ ] Live step-by-step checklist (Hall Air Conditioning started, Stage sound checked, Buffet tables setup, Food served).
  - [ ] Event countdown clock with automated alerts as contract end time approaches.

- [ ] **Task 3.5: Security Deposit Settlement & Deductions Tab**
  - [ ] Refundable Security Deposit balance review (e.g., Rs. 50,000–100,000 held).
  - [ ] Post-event damage logging (broken crockery, stage decor tears).
  - [ ] Overtime duration charges calculation.
  - [ ] Net deposit refund calculation and client settlement receipt.

---

## Phase 4: 🍳 Kitchen ERP & Kitchen Display System (KDS)

- [ ] **Task 4.1: Kitchen Live Order Display Screen (KDS) Tab**
  - [ ] Touch-screen visual KDS showing urgent refill tickets sent from lead waiters.
  - [ ] Color-coded ticket urgency: Yellow (Refill Requested) $\rightarrow$ Orange (In Preparation) $\rightarrow$ Green (Dispatched to Hall).
  - [ ] Audio chime alert upon new order arrival.

- [ ] **Task 4.2: Kitchen Pantry & Raw Material Inventory Tab**
  - [ ] Live tracking of pantry ingredients (Chicken, Mutton, Basmati Rice, Cooking Oil, Flour, Spices).
  - [ ] Minimum safety threshold alerts (e.g., Rice below 50 kg).
  - [ ] Direct "Order from Supplier" button when stock is low.

- [ ] **Task 4.3: Menu Recipes & Per-Head Costing Tab**
  - [ ] Define standard catering packages (Executive, Royal, Budget).
  - [ ] Recipe builder: ingredients required per plate/dish and per-head cost margin calculations.

- [ ] **Task 4.4: 📐 Raw Material Formula Calculator (Dedicated Tab)**
  - [ ] Interactive formula tool: user inputs **Guest Count** (e.g., 500) and selects dishes.
  - [ ] Custom ratio inputs per head (e.g., *250g Chicken, 150g Rice, 20ml Oil, 1 Naan*).
  - [ ] Automated calculation of total gross weight including wastage buffer percentage.
  - [ ] "Generate Grocery Requisition" button to convert calculation into an official supplier order.

---

## Phase 5: 📱 Waiter & Floor Staff Touch Kiosk

- [ ] **Task 5.1: Live Hall & Table Monitoring Tab**
  - [ ] High-contrast, tablet-optimized layout showing the active hall and table layout.
  - [ ] Real-time schedule display (Guests seated, food serving time).

- [ ] **Task 5.2: ⚡ Instant Dish Refill Dispatcher Tab**
  - [ ] Big touch buttons for buffet line items (e.g., "Refill Chicken Biryani", "Refill Roghnai Naan", "Water Refill").
  - [ ] One-touch dispatch that instantly alerts the Kitchen KDS screen.
  - [ ] Status indicator: *"Chef Preparing"* vs. *"Dispatched"*.

- [ ] **Task 5.3: Overtime Extension Trigger Tab**
  - [ ] Form to submit client extra-time request (number of hours and reason).
  - [ ] Real-time notification routed directly to Manager and Admin for immediate approval.

---

## Phase 6: 🚚 Vendors & Suppliers Portal

- [ ] **Task 6.1: Vendor & Supplier Master Directory Tab**
  - [ ] Directory of suppliers categorized by service: Poultry/Meat, Dairy, Floral Decor, Stage & Lighting, Outsourced Labor, Valet.
  - [ ] Vendor contact profiles, NTN/tax data, and agreed payment terms.

- [ ] **Task 6.2: Outside Labor & Contractor Management Tab**
  - [ ] Tag contractor to specific event and date.
  - [ ] Detailed staff breakdown:
    - **Male Person Count**
    - **Female Person Count**
    - **Total Headcount**
  - [ ] Rate calculation: Male rate/shift, Female rate/shift, Overtime hours.
  - [ ] Automated total cost computation linked to event expense ledger.

- [ ] **Task 6.3: Purchase Orders & Goods Received Tab**
  - [ ] Create raw material purchase orders sent to suppliers.
  - [ ] Goods Received Note (GRN) verification and pantry stock update.

- [ ] **Task 6.4: Vendor Financial Trades & Accounts Payable (A/P) Tab**
  - [ ] Vendor billing ledger: Total billed, payments made, remaining balance due.
  - [ ] Payment disbursement recording (Cash, Bank Transfer, Cheque).

---

## Phase 7: 💼 Financial Accounting & Statements Suite

- [ ] **Task 7.1: Financial Overview & Cash Flow Graphs Tab**
  - [ ] Executive summary of net cash flow, daily receipts, operational outflows, and liquidity.
  - [ ] Visual trajectory charts for monthly profit margins and revenue streams.

- [ ] **Task 7.2: Double-Entry General Ledger Tab**
  - [ ] Complete transaction journal with Date, Reference, Account (Debit/Credit), Description, and Balance.
  - [ ] Multi-criteria filters: by account, date range, payment method.

- [ ] **Task 7.3: Income Statement (Profit & Loss / P&L) Tab**
  - [ ] Revenue: Hall Rentals, Catering, Ancillary Services.
  - [ ] Cost of Goods Sold (COGS): Kitchen raw materials, outsourced labor.
  - [ ] Operating Expenses: Staff wages, electricity/fuel, repairs, marketing.
  - [ ] Net Profit calculation with comparative period filters.

- [ ] **Task 7.4: Accounts Receivable (A/R) & Overdue Push Alerts Tab**
  - [ ] Customer payment milestone tracking (Booking Advance $\rightarrow$ Mid Payment $\rightarrow$ Final Settlement).
  - [ ] Real-time overdue alert badges and on-screen push notifications for clients with unpaid dues past deadline.

- [ ] **Task 7.5: Accounts Payable (A/P) & Supplier Due Date Tracking Tab**
  - [ ] Contractor and supplier payment due date ledger.
  - [ ] Upcoming payment alerts and vendor settlement scheduling.

- [ ] **Task 7.6: Compliance Audit Logs with Export Tab**
  - [ ] Full immutable ledger of system actions (user logins, deletions, price edits, invoice settlements).
  - [ ] Fully functional CSV and JSON export downloads.

