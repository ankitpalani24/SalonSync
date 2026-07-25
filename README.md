<p align="center">
  <img src="https://img.shields.io/badge/SalonSync-Enterprise%20SaaS-d4af37?style=for-the-badge&logo=scissors&logoColor=white" alt="SalonSync Badge"/>
</p>

<h1 align="center">✂️ SalonSync — Enterprise Salon Management SaaS Platform</h1>

<p align="center">
  <b>A full-stack, multi-tenant, enterprise-grade salon management platform built for salons, spas, barbershops, and beauty studio franchises.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite" alt="Vite 8"/>
  <img src="https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express" alt="Express 5"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens" alt="JWT"/>
  <img src="https://img.shields.io/badge/PWA-Installable-5A0FC8?style=flat-square&logo=pwa" alt="PWA"/>
  <img src="https://img.shields.io/badge/License-ISC-blue?style=flat-square" alt="License"/>
</p>

<p align="center">
  <a href="https://salonsync-iota.vercel.app" target="_blank"><b>🌐 Live Demo (Frontend)</b></a> &nbsp;·&nbsp;
  <a href="https://salonsync-api.onrender.com" target="_blank"><b>⚡ Live API (Backend)</b></a>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database Schema (18 Models)](#-database-schema-18-models)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Demo Accounts](#-demo-accounts)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔭 Overview

**SalonSync** is a production-ready, enterprise-grade SaaS platform designed to digitize and automate every aspect of salon and beauty studio operations. It provides a unified workspace for managing customers, appointments, billing, inventory, staff, marketing, and analytics — all with multi-tenant data isolation, franchise-level multi-branch support, and a luxury dark-mode UI.

The platform supports **6 distinct user roles**, from Super Admin (platform operator) down to Client (end customer), each with their own tailored dashboard and feature access.

### 🎯 Who Is This For?

| Audience | Use Case |
|---|---|
| **Solo Salon Owners** | Manage a single-branch salon with CRM, billing, staff, and inventory |
| **Franchise Owners** | Oversee multiple branches with centralized reports and branch comparison |
| **Salon Managers** | Day-to-day operations: appointments, walk-ins, billing, staff scheduling |
| **Staff Members** | View assigned appointments, track commissions, log attendance |
| **Clients** | Explore salons, book services, track loyalty points and membership tiers |
| **Platform Admin (Super Admin)** | Manage all tenants, subscription licensing, and platform-wide analytics |

---

## ✨ Key Features

### 🧑‍💼 Customer CRM
- Full customer profiles with contact info, birthday, gender, notes, and photo
- Membership tiers: **None → Silver → Gold → Platinum**
- Loyalty points system (earn points per ₹100 spent, track redemptions)
- Service history and visit tracking

### 📅 Smart Appointment Booking
- Real-time calendar with staff-roster allocation
- Multi-service appointment support
- Status workflow: `Scheduled → Confirmed → In Progress → Completed → Cancelled`
- Appointment-to-checkout flow (direct billing from completed appointments)
- **Client self-booking** with salon/service/branch/staff selection

### 💰 POS Billing & Invoicing
- Professional invoice generation with auto-incrementing invoice numbers
- Services + retail product line items with quantity tracking
- Tax & discount calculations with final amount
- Payment methods: **Cash, UPI, Card, Bank Transfer**
- Automatic inventory stock deduction on product sales
- Automatic loyalty point awarding on paid invoices
- Staff commission auto-calculation on completed bills

### 📦 Inventory Management
- Full product catalog with SKU, category, purchase/selling price tracking
- Low-stock threshold alerts
- Supplier management with outstanding dues tracking
- Automatic stock-out deduction when products are billed

### 👨‍💼 Staff & HR Management
- Staff profiles with salary, commission percentage, and ratings
- Role-based assignments (Stylist, Senior Stylist, Manager, etc.)
- Attendance tracking with check-in/check-out and working hours/overtime
- Commission calculator tied to revenue generated per invoice

### 📊 Business Intelligence Analytics
- **Profit & Loss Engine**: Revenue, expenses, net profit with month-over-month trends
- Revenue line charts, profit bar charts, and service-share donut charts
- Peak booking hour analysis
- Customer retention metrics
- Low-stock inventory alerts
- Top-performing staff by revenue

### 💳 Expense Tracking
- Categorized expense logging: Rent, Electricity, Internet, Water, Staff Salary, Product Purchases, Marketing, Miscellaneous
- Branch-level expense filtering
- Monthly expense aggregation for P&L reports

### 📦 Service & Package Management
- Full service catalog with categories: Haircut, Hair Color, Facial, Makeup, Waxing, Spa, Bridal Services, Other
- Duration, price, and material cost tracking with **auto-calculated profit margins**
- Bundled service packages with session counts and expiry dates
- Membership plans with custom discount percentages and validity periods

### 📣 Marketing Automation
- WhatsApp message simulation for appointment reminders, birthday wishes, promotional campaigns
- Notification activity log with send status tracking (Sent, Pending, Failed)
- Support for WhatsApp, SMS, and Email notification types

### 🏢 Multi-Branch & Franchise Engine
- Centralized multi-branch management under a single salon tenant
- Branch-level data isolation for managers and staff
- Branch switcher in the sidebar for franchise owners
- Cross-branch reporting and comparison for franchise-level analytics

### 👑 Super Admin Command Center
- Platform-wide tenant management (view/manage all salons)
- Subscription plan management: **Starter Salon** (₹1,999/mo) & **Franchise** (₹9,999/mo)
- Subscription status control: Active, Trial, Expired
- Total SaaS MRR (Monthly Recurring Revenue) tracking
- Support ticket overview

### 🔐 Authentication & Security
- JWT-based authentication with 30-day token expiry
- Bcrypt password hashing (10 rounds salt)
- Role-based route protection with middleware guards
- Multi-tenant data isolation (salon-scoped queries enforced server-side)
- Branch-level access restrictions for managers and staff
- Resource ownership validation middleware

### 🌗 UI/UX
- **Dark mode** (default) and **Light mode** with persistent theme toggle
- Luxury gold-accent design system with glassmorphism components
- Fully responsive with mobile sidebar drawer (swipe-to-close)
- Scroll lock on modal/drawer overlays
- Smooth animations and micro-interactions
- Google Fonts (Inter typography)
- **PWA (Progressive Web App)** with service worker for home-screen installation

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2.7 | UI component library |
| **Vite** | 8.1.0 | Build tool & dev server |
| **Lucide React** | 1.21.0 | Icon system |
| **Vanilla CSS** | — | Custom design system with CSS variables |
| **Context API** | — | Global state management |
| **PWA / Service Worker** | — | Offline-capable, installable app |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | — | Runtime environment |
| **Express** | 5.2.1 | REST API framework |
| **Mongoose** | 9.7.2 | MongoDB ODM |
| **jsonwebtoken** | 9.0.3 | JWT authentication |
| **bcryptjs** | 3.0.3 | Password hashing |
| **cors** | 2.8.6 | Cross-origin resource sharing |
| **dotenv** | 17.4.2 | Environment variable management |

### Infrastructure
| Service | Purpose |
|---|---|
| **MongoDB Atlas** | Cloud database (primary) |
| **Vercel** | Frontend deployment |
| **Render** | Backend API deployment |
| **Local MongoDB** | Fallback database for development |

---

## 🏗 Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  React 19 + Vite 8 SPA                                   │ │
│  │  ├─ AppContext (Global State + API Sync Layer)           │ │
│  │  ├─ Landing Page (Public)                                │ │
│  │  ├─ Auth Pages (Login / Signup / Forgot Password)        │ │
│  │  └─ Workspace (Protected)                                │ │
│  │     ├─ Sidebar + Header + Notifications                  │ │
│  │     ├─ Dashboard (P&L Engine + Client Explore Mode)      │ │
│  │     ├─ Customer CRM                                      │ │
│  │     ├─ Appointments Calendar                             │ │
│  │     ├─ Services & Packages                               │ │
│  │     ├─ POS Billing                                       │ │
│  │     ├─ Inventory & Suppliers                             │ │
│  │     ├─ Staff & Attendance                                │ │
│  │     ├─ BI Analytics                                      │ │
│  │     ├─ Marketing Automation                              │ │
│  │     └─ Super Admin Panel                                 │ │
│  └──────────────────────────────────────────────────────────┘ │
│                            │ REST API                         │
│                            ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Express 5 API Server (Node.js)                          │ │
│  │  ├─ Auth Middleware (JWT + RBAC)                         │ │
│  │  ├─ Tenant Isolation Middleware                          │ │
│  │  ├─ Branch Access Control                                │ │
│  │  ├─ Subscription Validation                              │ │
│  │  ├─ Ownership Validation                                 │ │
│  │  └─ RESTful CRUD Routes (All 18 Entities)                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                            │ Mongoose ODM                     │
│                            ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  MongoDB Atlas (Cloud) / Local MongoDB (Fallback)        │ │
│  │  └─ 18 Collections with Auto-Seeding                     │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

---

## 🗄 Database Schema (18 Models)

| # | Model | Description |
|---|---|---|
| 1 | **User** | Authentication accounts with name, email, phone, password hash, role, salon & branch associations |
| 2 | **Salon** | Tenant entity — salon name, owner, contact, GST, business type, subscription plan & status |
| 3 | **Branch** | Multi-branch locations under a salon with address, city, state, status |
| 4 | **Customer** | CRM profiles — contact info, birthday, notes, photo, loyalty points, membership tier |
| 5 | **Appointment** | Bookings — customer, services, staff, date/time, status workflow |
| 6 | **Service** | Service catalog — name, category, duration, price, material cost, auto-calculated profit margin |
| 7 | **Package** | Bundled service packages with session counts and expiry dates |
| 8 | **Membership** | Membership tier definitions (Silver/Gold/Platinum) with discount % and pricing |
| 9 | **LoyaltyPoint** | Points earned/redeemed per customer per transaction |
| 10 | **Invoice** | Billing records — services, products, tax, discount, final amount, payment method/status, linked staff |
| 11 | **Expense** | Categorized expense records (Rent, Salary, Utilities, etc.) |
| 12 | **Product** | Inventory items — SKU, quantity, purchase/selling price, low-stock threshold, supplier link |
| 13 | **Supplier** | Supplier directory with outstanding dues tracking |
| 14 | **Staff** | Staff profiles — role, salary, commission %, rating, branch assignment |
| 15 | **Attendance** | Daily check-in/check-out logs with working hours and overtime calculation |
| 16 | **Commission** | Per-invoice commission earned by staff (revenue × commission rate) |
| 17 | **Subscription** | SaaS subscription records per salon — plan, pricing, dates, status |
| 18 | **Notification** | WhatsApp/SMS/Email message logs with send status |

All models include automatic `createdAt` / `updatedAt` timestamps via Mongoose.

---

## 🔑 Role-Based Access Control (RBAC)

SalonSync implements a **6-tier role hierarchy** with page-level and API-level access enforcement:

| Role | Access Scope |
|---|---|
| **SUPER_ADMIN** | Platform-wide — manages all tenants, subscriptions, support |
| **SALON_OWNER** | Full salon access — all modules including marketing & analytics |
| **FRANCHISE_OWNER** | Multi-branch access — same as Salon Owner across branches |
| **SALON_MANAGER** | Branch-level access — operations, CRM, billing (no marketing) |
| **STAFF** | Limited — own appointments, attendance, commissions |
| **CLIENT** | Consumer-facing — explore salons, book services, view loyalty/membership |

### Page Permission Matrix

| Page | SALON_OWNER | FRANCHISE_OWNER | SALON_MANAGER | STAFF | CLIENT |
|---|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Customer CRM | ✅ | ✅ | ✅ | ❌ | ❌ |
| Appointments | ✅ | ✅ | ✅ | ✅ | ✅* |
| Services & Packages | ✅ | ✅ | ✅ | ❌ | ❌ |
| POS Billing | ✅ | ✅ | ✅ | ❌ | ❌ |
| Inventory | ✅ | ✅ | ✅ | ❌ | ❌ |
| Staff & Roster | ✅ | ✅ | ✅ | ✅ | ❌ |
| BI Analytics | ✅ | ✅ | ✅ | ❌ | ❌ |
| Marketing Auto | ✅ | ✅ | ❌ | ❌ | ❌ |
| Super Admin | ❌ | ❌ | ❌ | ❌ | ❌ |

*\* Clients see an "Explore" mode to discover and book salon services.*

### Middleware Stack

```
protect          → JWT token verification & user hydration
authorize        → Role whitelist enforcement
restrictToTenant → Multi-tenant salonId isolation
checkBranchAccess → Branch-level data restriction
validateOwnership → Resource ownership verification
validateSubscription → Subscription plan tier gating
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register new salon owner or client |
| `POST` | `/api/auth/login` | Login and receive JWT token |

### Protected Resources (Bearer Token Required)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/salons/mine` | Get current user's salon details |
| `GET/POST/PUT/DELETE` | `/api/branches` | Branch CRUD operations |
| `GET/POST/PUT/DELETE` | `/api/customers` | Customer CRM operations |
| `GET/POST/PUT/DELETE` | `/api/appointments` | Appointment management |
| `PUT` | `/api/appointments/:id/status` | Update appointment status |
| `GET/POST/PUT/DELETE` | `/api/services` | Service catalog operations |
| `GET/POST/PUT/DELETE` | `/api/packages` | Package bundle operations |
| `GET/POST/PUT/DELETE` | `/api/memberships` | Membership tier operations |
| `GET/POST` | `/api/loyalty-points` | Loyalty point transactions |
| `GET/POST/PUT/DELETE` | `/api/invoices` | Invoice/billing operations |
| `GET/POST/PUT/DELETE` | `/api/expenses` | Expense tracking |
| `GET/POST/PUT/DELETE` | `/api/products` | Inventory product management |
| `GET/POST/PUT/DELETE` | `/api/suppliers` | Supplier directory |
| `GET/POST/PUT/DELETE` | `/api/staff` | Staff management |
| `GET/POST` | `/api/attendance` | Attendance logging |
| `GET/POST` | `/api/commissions` | Commission records |
| `GET/POST` | `/api/notifications` | Notification message logs |
| `GET` | `/api/users` | User list (Super Admin) |
| `GET/PUT` | `/api/salons` | Salon management (Super Admin) |

---

## 📁 Project Structure

```
SalonSync/
├── 📄 package.json              # Root workspace (concurrently scripts)
├── 📄 run.bat                   # One-click Windows startup script
├── 📄 .gitignore
│
├── 📂 backend/
│   ├── 📄 server.js             # Express server entry point
│   ├── 📄 package.json          # Backend dependencies
│   ├── 📄 .env                  # Environment variables (gitignored)
│   └── 📂 src/
│       ├── 📂 config/
│       │   └── 📄 db.js         # MongoDB connection + auto-seeding (656 lines)
│       ├── 📂 middleware/
│       │   └── 📄 auth.js       # JWT, RBAC, tenant isolation, subscription guards
│       ├── 📂 models/
│       │   └── 📄 index.js      # All 18 Mongoose schemas & models
│       └── 📂 routes/
│           └── 📄 api.js        # All REST API routes (943 lines)
│
├── 📂 frontend/
│   ├── 📄 index.html            # HTML entry with SEO meta tags
│   ├── 📄 package.json          # Frontend dependencies
│   ├── 📄 vite.config.js        # Vite build configuration
│   ├── 📄 vercel.json           # Vercel SPA rewrite rules
│   ├── 📄 .env.production       # Production API URL
│   ├── 📂 public/
│   │   ├── 📄 favicon.svg       # App favicon
│   │   ├── 📄 icons.svg         # PWA icons
│   │   ├── 📄 manifest.json     # PWA manifest
│   │   └── 📄 sw.js             # Service Worker for offline/PWA
│   └── 📂 src/
│       ├── 📄 main.jsx          # React entry point + PWA registration
│       ├── 📄 App.jsx           # Root component with routing & layout
│       ├── 📄 App.css           # App-specific styles
│       ├── 📄 index.css         # Global design system (22K+ lines)
│       ├── 📂 config/
│       │   └── 📄 api.js        # Smart API URL resolver (local/production)
│       ├── 📂 context/
│       │   └── 📄 AppContext.jsx # Global state, auth, API sync layer
│       ├── 📂 data/
│       │   └── 📄 mockData.js   # Offline demo/mock data
│       ├── 📂 components/
│       │   ├── 📄 Sidebar.jsx   # Navigation sidebar with role filtering
│       │   ├── 📄 Header.jsx    # Top header with profile & branch switcher
│       │   └── 📄 DashboardCharts.jsx # Revenue, profit & service charts
│       └── 📂 pages/
│           ├── 📄 LandingPage.jsx    # Public marketing landing page
│           ├── 📄 Dashboard.jsx      # Main dashboard with P&L engine
│           ├── 📄 Customers.jsx      # Customer CRM module
│           ├── 📄 Appointments.jsx   # Booking calendar module
│           ├── 📄 Services.jsx       # Service & package management
│           ├── 📄 Billing.jsx        # POS billing & invoicing
│           ├── 📄 Inventory.jsx      # Product & supplier management
│           ├── 📄 Staff.jsx          # Staff & attendance management
│           ├── 📄 Analytics.jsx      # BI analytics dashboards
│           ├── 📄 Marketing.jsx      # Marketing automation module
│           ├── 📂 Auth/
│           │   └── 📄 AuthPages.jsx  # Login, signup, forgot password
│           └── 📂 Admin/
│               └── 📄 SuperAdmin.jsx # Super admin command center
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (v9+)
- **MongoDB** — either [MongoDB Atlas](https://www.mongodb.com/atlas) (cloud) or local MongoDB installation

### Quick Start (Windows)

Simply double-click the included `run.bat` file — it will:
1. Install all root, frontend, and backend dependencies
2. Launch both the Vite dev server and Express API concurrently

### Manual Setup

```bash
# 1. Clone the repository
git clone https://github.com/ankitpalani24/SalonSync.git
cd SalonSync

# 2. Install all dependencies (root + frontend + backend)
npm run install-all

# 3. Configure environment variables
#    Create backend/.env (see Environment Variables section below)

# 4. Start both servers concurrently
npm run dev-all
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

### Available Scripts

| Script | Command | Description |
|---|---|---|
| Install All | `npm run install-all` | Install root, frontend, and backend dependencies |
| Frontend Only | `npm run dev` | Start Vite dev server |
| Backend Only | `npm run server` | Start Express API server |
| Full Stack | `npm run dev-all` | Start both servers concurrently |
| Full Stack (LAN) | `npm run dev-all-host` | Start with `--host` for network access |

---

## 🔧 Environment Variables

Create a `backend/.env` file:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/Salonsync?appName=Cluster0
JWT_SECRET=your_secure_secret_key_here
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | Optional | API server port (default: `5000`) |
| `MONGODB_URI` | **Required** | MongoDB Atlas connection string or local `mongodb://127.0.0.1:27017/salonsync` |
| `JWT_SECRET` | **Required** | Secret key for JWT token signing |

For the frontend production build, configure `frontend/.env.production`:

```env
VITE_API_URL=https://your-api-domain.com/api
```

---

## ☁️ Deployment

### Frontend → Vercel

The frontend is pre-configured for Vercel with `vercel.json` SPA rewrites:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod
```

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Set the root directory to `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables: `MONGODB_URI`, `JWT_SECRET`

### Database → MongoDB Atlas

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Whitelist your server IP (or use `0.0.0.0/0` for Render)
3. Create a database user and copy the connection string
4. The database auto-seeds with default data on first connection

---

## 🧪 Demo Accounts

The database auto-seeds the following test accounts on first run:

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@salonsync.com` | `password123` |
| **Salon Owner** | `alexander@luxesalon.com` | `password123` |
| **Salon Manager** | `aarav@luxesalon.com` | `password123` |
| **Staff** | `isha@luxesalon.com` | `password123` |

> **Tip**: You can also sign up as a new **Salon Owner** or **Client** from the registration page to test the full onboarding flow.

---

## 📸 Screenshots

> *Screenshots coming soon — the app features a luxury dark-mode UI with gold accents, glassmorphism cards, and responsive design across all modules.*

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code patterns and naming conventions
- Keep components focused and reusable
- Use CSS variables from the existing design system
- Test with multiple user roles before submitting PRs
- Ensure mobile responsiveness

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">
  <b>Built with ❤️ by <a href="https://github.com/ankitpalani24">Ankit Palani</a></b>
</p>

<p align="center">
  <i>If you found this project useful, please consider giving it a ⭐ on GitHub!</i>
</p>
