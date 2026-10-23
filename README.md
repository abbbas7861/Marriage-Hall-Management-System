# 🏰 Marriage Hall Management System (MHMS) Enterprise

An end-to-end, full-stack enterprise management system for Marriage Halls, Banquets, and Event Complexes.

---

## 📁 Repository Structure

```
MarriageHall/
├── backend/                       # Django 6 & DRF REST API
│   ├── apps/
│   │   ├── core/                  # Settings, WORM Audit Logs, Dashboard & Reports API
│   │   ├── venues/                # Hall capacity, pricing & blocked dates
│   │   ├── bookings/              # Reservations & overtime workflow
│   │   ├── customers/             # Customer CRM & lifetime value tracking
│   │   ├── events_catering/       # Event types & Menu package packages
│   │   ├── inventory/             # Asset tracking & event issue workflow
│   │   ├── finance/               # Invoices, transactions & expenses
│   │   └── workforce/             # Staff shifts & vendor directories
│   ├── config/                    # Django project configuration & URLs
│   ├── venv/                      # Python 3.12 virtual environment
│   ├── manage.py
│   ├── requirements.txt
│   └── README.md
│
├── frontend/                      # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/                   # Fully typed client.ts connecting to Django API
│   │   ├── components/            # Modules, Dashboard, Bookings, Layout, Common
│   │   └── types/                 # Unified TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
│
└── FRONTEND_REVIEW_AND_BACKEND_SPEC.md  # Architectural specification
```

---

## ⚡ Quickstart Guide

### 1. Launch the Django Backend
Open a terminal and run:
```bash
cd backend
source venv/bin/activate
python manage.py migrate
python manage.py seed_data        # Populates realistic demo records
python manage.py runserver 8000
```
Backend API will be running at `http://localhost:8000/api/v1/`.

### 2. Launch the React Frontend
Open a second terminal and run:
```bash
cd frontend
npm run dev
```
Open `http://localhost:3000/` in your browser.

---

## 🧪 Testing & Verification

- **Backend tests:**
  ```bash
  cd backend
  ./venv/bin/python manage.py test
  ```
- **Frontend TypeScript check & build:**
  ```bash
  cd frontend
  npm run lint       # tsc --noEmit
  npm run build      # Vite production bundle
  ```

