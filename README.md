<p align="center">
  <img src="https://img.shields.io/badge/SalonSync-Enterprise%20SaaS-d4af37?style=for-the-badge&logo=scissors&logoColor=white" alt="SalonSync Badge"/>
</p>

<h1 align="center">✂️ SalonSync — Enterprise Salon Management SaaS Platform</h1>

<p align="center">
  <b>A full-stack, multi-tenant, enterprise-grade salon management platform built for salons, spas, barbershops, and beauty studio franchises.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.7-61DAFB?style=flat-square&logo=react" alt="React 19"/>
  <img src="https://img.shields.io/badge/Vite-8.1.0-646CFF?style=flat-square&logo=vite" alt="Vite 8"/>
  <img src="https://img.shields.io/badge/Express-5.2.1-000000?style=flat-square&logo=express" alt="Express 5"/>
  <img src="https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=nodedotjs" alt="Node.js"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Redis-Distributed%20Cache-DC382D?style=flat-square&logo=redis" alt="Redis"/>
  <img src="https://img.shields.io/badge/JWT-tokenVersion%20Revocation-000000?style=flat-square&logo=jsonwebtokens" alt="JWT"/>
  <img src="https://img.shields.io/badge/Tests-172%20Passing-brightgreen?style=flat-square&logo=jest" alt="Tests"/>
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
- [System Highlights & Production Engineering](#-system-highlights--production-engineering)
- [Key Modules & Features](#-key-modules--features)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Database Architecture (29 Mongoose Models)](#-database-architecture-29-mongoose-models)
- [Tech Stack](#-tech-stack)
- [Architecture Diagram](#-architecture-diagram)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Security & Secrets](#-security--secrets)
- [Testing Suite (172+ Automated Tests)](#-testing-suite-172-automated-tests)
- [Deployment](#-deployment)
- [Demo Accounts](#-demo-accounts)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔭 Overview

**SalonSync** is a production-ready, multi-tenant SaaS platform built to power the modern salon economy. From single-chair studios to multi-location beauty franchises, SalonSync unifies customer relationship management (CRM), atomic conflict-free appointment scheduling, high-speed POS billing with inventory decrementing, staff rosters with automated commission calculations, marketing automation with WhatsApp messaging, immutable audit trails, and real-time Profit & Loss (P&L) business intelligence.

Built on **React 19**, **Vite 8**, **Express 5**, and **MongoDB Atlas**, the platform features luxury dark-mode aesthetics, sub-second API response times, comprehensive role-based access control, distributed rate limiting, and zero double-booking concurrency guarantees.

### 🎯 Target Audience

| Persona | Capabilities |
|---|---|
| **Solo Salon Owners** | Single-branch management with CRM, POS billing, inventory tracking, and daily financial KPIs |
| **Franchise Networks** | Multi-branch consolidated command center, branch switcher, cross-location benchmarking |
| **Salon Managers** | Daily operational workflows: walk-ins, staff rosters, appointments, billing, and stock adjustments |
| **Stylists & Staff** | Personal appointment schedule, attendance check-in/out, earnings, and real-time commission tracking |
| **End Clients** | Public discovery portal, service browsing, verified reviews, self-service online booking, and loyalty points |
| **Super Admins** | Multi-tenant governance, subscription plan management (Starter & Franchise tiers), platform MRR analytics |

---

## 🚀 System Highlights & Production Engineering

- 🛡️ **Zero-Conflict Booking Concurrency**: Mathematical interval overlap detection combined with an atomic database-level `SlotReservation` unique index guarantees zero double-bookings across concurrent client and manager requests.
- 📦 **Atomic Inventory & Stock Movement Audit**: Product quantities update atomically using conditional `$inc` queries. Every modification is logged in the `InventoryMovement` ledger (SALE, REFUND, ADJUSTMENT, SERVICE_USAGE, PURCHASE, DAMAGE).
- 🔁 **Distributed API Idempotency**: `Idempotency-Key` header support with automatic response caching and 24h TTL prevents duplicate payments, billing mutations, and accidental double submissions.
- 📊 **Authoritative P&L Engine & Animated KPIs**: Real-time aggregation pipeline computing gross revenue, overhead expenses, net profit, and profit margins. 60fps smooth count-up animations (`AnimatedNumber`) enhance the executive dashboard.
- 🔐 **Hardened JWT Session Security**: JWT authentication with active `tokenVersion` verification enables immediate global session revocation upon logout, password reset, or permission changes.
- ⚡ **Distributed Rate Limiting**: Multi-instance rate limiting with Redis store and in-memory fallback protects authentication, public discovery, and critical business mutation endpoints.
- ⚡ **Frontend Route Code Splitting**: Dynamic `React.lazy` loading and Vite chunk splitting keep initial bundle load times minimal and provide smooth UI transitions via React 19 `Suspense`.
- 📱 **PWA & Mobile-First Luxury UI**: Installable Progressive Web App with custom service worker, swipe gestures, glassmorphism cards, responsive navigation drawer, and persistent dark/light theme toggle.

---

## ✨ Key Modules & Features

### 🧑‍💼 1. Customer 360 CRM
- Complete customer profiles: contact details, date of birth, gender, address, personal notes, and avatars.
- **Loyalty Tier Engine**: Tier progression (**None → Silver → Gold → Platinum**) with dynamic discount rules.
- **360° Activity Timeline**: Real-time aggregation of visit frequency, appointments, billing invoices, loyalty point history, and active membership passes.
- Customer search, filtering, and export capabilities.

### 📅 2. Smart Appointment Scheduling
- Interactive visual appointment calendar with daily and weekly views.
- Multi-service booking support with staff allocation and estimated duration calculation.
- Lifecycle state machine: `Scheduled → Confirmed → In Progress → Completed → Cancelled / No-Show`.
- Direct **Appointment-to-Checkout** conversion into POS invoice.
- **Client Self-Service Booking**: Public reservation flow with salon selection, service picks, staff preference, and instant confirmation.

### 💰 3. POS Billing & Invoicing
- Fast POS interface with instant search for services and retail products.
- Multi-payment support: **Cash, UPI, Credit/Debit Card, Bank Transfer, Split Payments**.
- Automatic GST tax calculations and customizable discount percentages/fixed amounts.
- **Thermal Receipt & PDF Invoice Generator** (via `html2pdf.js`).
- Automatic loyalty points accrual (1 point per ₹100 spent) and instant checkout redemption.
- Automatic staff commission computation tied to invoice line items.
- Full invoice refund flow with automated inventory replenishment and audit tracking.

### 📦 4. Inventory & Supply Chain
- Product catalog tracking SKU, barcode, category, purchase price, selling price, and reorder levels.
- Real-time stock status flags: `In Stock`, `Low Stock`, `Out of Stock`.
- Supplier directory with contact details and outstanding accounts payable ledger.
- Automated stock-out deduction when retail items are billed.
- Immutable `InventoryMovement` audit log tracking all quantity changes.

### 👨‍💼 5. Staff & HR Management
- Staff directory with customizable roles: *Manager, Senior Stylist, Stylist, Colorist, Therapist, Receptionist*.
- Daily attendance logging with check-in, check-out, working hours, and overtime computation.
- Automated commission tracker linked directly to billed services and products.
- **Staff Privacy Isolation**: Staff members only see their assigned appointments, attendance, and commission earnings.

### 📊 6. Business Intelligence & Financial Analytics
- **Executive P&L Dashboard**: Gross revenue, expenses, net profit, and profit margin with period-over-period comparison.
- Interactive SVG charts: Revenue trends, profit bars, service-share donut charts, and hourly booking heatmaps.
- Customer retention metrics, average ticket size, and staff revenue performance leaderboards.
- Critical inventory alerts and low-stock replenishment notifications.

### 🏢 7. Franchise & Multi-Branch Management
- Centralized multi-branch control under a unified salon tenant.
- Fast branch switcher in the navigation bar for franchise owners.
- Role-scoped branch isolation for branch managers and staff.
- Cross-branch revenue benchmarking and performance comparison.

### 📣 8. Marketing Automation & WhatsApp Hub
- Simulated WhatsApp Business messaging engine for automated appointment confirmations, reminders, birthday greetings, and win-back offers.
- Notification activity log with delivery tracking (Sent, Pending, Failed).
- Multi-channel support: WhatsApp, SMS, Email, and In-App notifications.

### 🛡️ 9. Audit Logging & System Diagnostics
- Immutable `AuditLog` records for all CRUD mutations, price changes, role upgrades, and authentication events.
- **System Health Diagnostics**: Real-time MongoDB response latency, memory utilization, server uptime, and active connection tracking.
- Interactive Role Permission Matrix viewer.

### 🌐 10. Public Salon Discovery Portal
- Consumer discovery portal allowing clients to find salons by locality, ratings, and price tier.
- Rich public salon profiles featuring photo galleries, service menus, verified customer reviews, operating hours, and instant online booking.

### ⌨️ 11. Command Palette & AI Assistant
- Global shortcut (`Ctrl + K` / `Cmd + K`) for instant navigation, search, and action execution.
- Integrated AI Assistant modal for operational guidance and revenue optimization insights.

---

## 🔑 Role-Based Access Control (RBAC)

SalonSync enforces a **6-tier role hierarchy** across API routes and frontend views:

```
SUPER_ADMIN  ──► Platform-wide tenant management & SaaS metrics
     │
SALON_OWNER  ──► Full salon control: CRM, POS, Staff, BI, Marketing, Branches
     │
FRANCHISE_OWNER ──► Multi-branch governance & cross-branch comparisons
     │
SALON_MANAGER  ──► Branch-scoped operations: Appointments, CRM, Billing, Stock
     │
STAFF        ──► Assigned appointments, personal attendance & commission earnings
     │
CLIENT       ──► Public salon discovery, self-booking, loyalty & memberships
```

### Page & Module Permission Matrix

| Module / Page | SUPER_ADMIN | SALON_OWNER | FRANCHISE_OWNER | SALON_MANAGER | STAFF | CLIENT |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ *(Scoped)* | ✅ *(Explore)* |
| **Customer CRM** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Appointments** | ❌ | ✅ | ✅ | ✅ | ✅ *(Assigned)* | ✅ *(Self-Book)* |
| **POS Billing** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Services & Packages** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Memberships & Loyalty** | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ *(View Only)* |
| **Inventory & Suppliers** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Staff & Attendance** | ❌ | ✅ | ✅ | ✅ | ✅ *(Self)* | ❌ |
| **BI Analytics & P&L** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Expenses** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Marketing & WhatsApp** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Franchise Overview** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Audit Logs** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Salon Health Center** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Super Admin Panel** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🗄 Database Architecture (29 Mongoose Models)

SalonSync utilizes 29 structured MongoDB models with compound indexes for optimized multi-tenant querying:

| # | Model | Purpose | Key Compound Indexes |
|---|---|---|---|
| 1 | **User** | Authentication accounts with roles, salon/branch refs, and `tokenVersion` | `{ email: 1 }`, `{ salonId: 1, role: 1 }` |
| 2 | **Salon** | Multi-tenant business entity, subscription plan, slug, and public profile | `{ slug: 1 }`, `{ subscriptionPlan: 1 }` |
| 3 | **Branch** | Multi-branch salon locations | `{ salonId: 1, status: 1 }` |
| 4 | **Customer** | CRM profiles, contact info, loyalty tier, and lifetime stats | `{ salonId: 1, phone: 1 }`, `{ salonId: 1, branchId: 1 }` |
| 5 | **Appointment** | Bookings with customer, service list, staff, date/time, and status | `{ salonId: 1, staffId: 1, date: 1 }`, `{ salonId: 1, status: 1 }` |
| 6 | **Service** | Service catalog, pricing, duration, material cost, and profit margin | `{ salonId: 1, category: 1 }` |
| 7 | **Package** | Bundled service packages with session quotas and expiry | `{ salonId: 1, isActive: 1 }` |
| 8 | **Membership** | Tiered membership plans with discounts and duration | `{ salonId: 1, tier: 1 }` |
| 9 | **CustomerMembership** | Active membership subscriptions held by customers | `{ salonId: 1, customerId: 1, status: 1 }` |
| 10 | **LoyaltyPoint** | Transaction ledger for points earned, redeemed, or expired | `{ salonId: 1, customerId: 1, createdAt: -1 }` |
| 11 | **LoyaltyReward** | Redeemable reward catalog | `{ salonId: 1, pointsRequired: 1 }` |
| 12 | **LoyaltyRule** | Rules for earning points per spend | `{ salonId: 1 }` |
| 13 | **Invoice** | Billing records with items, taxes, discounts, payment status, staff | `{ salonId: 1, createdAt: -1 }`, `{ salonId: 1, paymentStatus: 1 }` |
| 14 | **Expense** | Overhead expense tracking with categories and branch allocation | `{ salonId: 1, branchId: 1, date: -1 }` |
| 15 | **Product** | Retail inventory items with SKU, price, stock, and reorder alert | `{ salonId: 1, sku: 1 }`, `{ salonId: 1, stockQuantity: 1 }` |
| 16 | **Supplier** | Vendor directory and accounts payable tracking | `{ salonId: 1, name: 1 }` |
| 17 | **Staff** | Employee profiles, salary, commission rates, and branch link | `{ salonId: 1, branchId: 1, status: 1 }` |
| 18 | **Attendance** | Daily check-in/out records with hours and overtime | `{ salonId: 1, staffId: 1, date: 1 }` |
| 19 | **Commission** | Calculated commission ledger per billed invoice line item | `{ salonId: 1, staffId: 1, invoiceId: 1 }` |
| 20 | **Subscription** | SaaS subscription tier records (Starter / Franchise) | `{ salonId: 1, status: 1 }` |
| 21 | **Notification** | WhatsApp, SMS, Email, and In-App message activity logs | `{ salonId: 1, status: 1, createdAt: -1 }` |
| 22 | **WhatsAppConfig** | WhatsApp Business API credentials and template definitions | `{ salonId: 1 }` |
| 23 | **NotificationPref** | Salon notification routing preferences | `{ salonId: 1 }` |
| 24 | **Review** | Customer feedback ratings and comments for public profile | `{ salonId: 1, staffId: 1 }`, `{ salonId: 1, rating: -1 }` |
| 25 | **InventoryConsumption**| Internal stock deduction logs from service execution | `{ salonId: 1, createdAt: -1 }` |
| 26 | **InventoryMovement** | Complete stock audit trail (Sale, Refund, Adjustment, Damage) | `{ salonId: 1, productId: 1, createdAt: -1 }`, `{ salonId: 1, type: 1 }` |
| 27 | **AuditLog** | Immutable security and business event ledger | `{ salonId: 1, createdAt: -1 }`, `{ salonId: 1, entity: 1, action: 1 }` |
| 28 | **SlotReservation** | Unique atomic lock index preventing double-booking race conditions | `{ salonId: 1, staffId: 1, date: 1, slotTime: 1 }` *(Unique)* |
| 29 | **IdempotencyKey** | Request deduplication store with 24-hour auto-expiration | `{ salonId: 1, userId: 1, endpoint: 1, key: 1 }` *(Unique, TTL: 86400s)* |

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19.2.7 (Functional components, Context API, Hooks, Suspense)
- **Bundler & Build**: Vite 8.1.0 (ESM, Hot Module Replacement, Rollup code-splitting)
- **Icons**: Lucide React 1.21.0
- **PDF Generation**: html2pdf.js 0.14.0
- **Styling**: Vanilla CSS Design System with custom CSS variables & glassmorphism
- **PWA**: Custom Service Worker (`sw.js`) & Web App Manifest
- **Testing**: Vitest 4.1.10, React Testing Library, JSDOM

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express 5.2.1
- **Database ODM**: Mongoose 9.7.2
- **Authentication**: JSON Web Tokens (`jsonwebtoken` 9.0.3) & `bcryptjs` 3.0.3
- **Rate Limiting**: `express-rate-limit` 8.6.2 & `rate-limit-redis` 6.0.1
- **Distributed Cache / Store**: `ioredis` 6.0.0 (with automatic in-memory fallback)
- **Security & Validation**: `helmet` 8.3.0, `cors` 2.8.6, `express-validator` 7.3.2
- **Testing**: Jest 30.4.2, Supertest 7.2.2, `mongodb-memory-server` 11.2.0

### Infrastructure
- **Cloud Database**: MongoDB Atlas (Tier M0 / Serverless)
- **Frontend Hosting**: Vercel (SPA rewrites via `vercel.json`)
- **Backend Hosting**: Render / Railway / Docker
- **Caching**: Upstash Redis / Redis Cloud

---

## 🏗 Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT TIER (Browser)                                │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │  React 19 + Vite 8 Single Page Application                                       │  │
│  │  ├─ AppContext (Global State, Auth Hydration, Offline Sync Layer)                │  │
│  │  ├─ Public Landing Page & Public Salon Discovery Portal                          │  │
│  │  ├─ Auth Flow (Login, Signup, Forgot Password, Role Redirects)                   │  │
│  │  ├─ Global Command Palette (Ctrl+K) & AI Assistant Modal                         │  │
│  │  └─ Workspace Shell (Protected Layout + React.lazy Route Splitting)              │  │
│  │     ├─ Executive Dashboard (P&L BI Engine + 60fps AnimatedNumber KPIs)           │  │
│  │     ├─ Customer 360 CRM (Profiles, Loyalty Tiers, Activity Timeline)             │  │
│  │     ├─ Smart Appointments (Staff Rosters, Double-Booking Prevention)             │  │
│  │     ├─ POS Billing (Line Items, Split Payments, PDF Receipts, Refunds)           │  │
│  │     ├─ Inventory & Suppliers (Stock Alerts, Movement Audit Log)                  │  │
│  │     ├─ Staff & Attendance (Rosters, Check-In/Out, Commissions)                   │  │
│  │     ├─ Financial Analytics & Expense Management                                  │  │
│  │     ├─ Marketing Automation & WhatsApp Messaging Hub                             │  │
│  │     ├─ Audit Logs & System Health Diagnostics                                    │  │
│  │     └─ Super Admin Command Center (Tenant & Subscription Governance)             │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTPS / RESTful JSON
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   BACKEND TIER (Node.js / Express 5)                   │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Express 5 API Middleware Pipeline                                               │  │
│  │  ├─ Helmet Security Headers & CORS Enforcement                                   │  │
│  │  ├─ Distributed Rate Limiting (Redis / In-Memory Store)                          │  │
│  │  ├─ Request Observability & Correlation ID Injection                             │  │
│  │  ├─ Idempotency Middleware (`Idempotency-Key` deduplication)                     │  │
│  │  ├─ JWT Verification & `tokenVersion` Active Session Check                       │  │
│  │  ├─ RBAC Role Whitelisting (`authorize`)                                         │  │
│  │  ├─ Multi-Tenant Isolation Middleware (`restrictToTenant`)                       │  │
│  │  ├─ Branch Access & Resource Ownership Verification                              │  │
│  │  └─ Express-Validator Input Sanitization                                         │  │
│  │                                                                                  │  │
│  │  REST API Controllers & Business Logic Services                                  │  │
│  │  ├─ Financial Aggregation Service (Authoritative P&L, Reconciliations)           │  │
│  │  ├─ Concurrency Reservation Engine (`SlotReservation` Unique Locking)            │  │
│  │  ├─ Inventory Management Engine (Atomic `$inc` & Movement Audit Trail)           │  │
│  │  └─ Auto-Seeding & Database Initialization Routine                               │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Mongoose ODM / TCP
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DATA TIER                                            │
│  ┌────────────────────────────────────────┐   ┌─────────────────────────────────────┐  │
│  │  MongoDB Atlas (Primary Store)         │   │  Redis Cloud / Upstash (Cache)      │  │
│  │  └─ 29 Collections with Compound Index │   │  └─ Distributed Rate Limits         │  │
│  │     and Multi-Tenant Isolation         │   │     & Idempotency Responses         │  │
│  └────────────────────────────────────────┘   └─────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### 🔐 Authentication & Session Security
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Register a new Salon Owner or Client account |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials and issue JWT token |
| `POST` | `/api/auth/logout` | Protected | Invalidate user session and increment `tokenVersion` |
| `POST` | `/api/auth/create-user` | Owner / Manager | Create staff or manager account under tenant |
| `GET` | `/api/auth/me` | Protected | Hydrate current authenticated user profile |

### 🏢 Salons & Multi-Branch Governance
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/salons/mine` | Protected | Retrieve authenticated tenant salon profile |
| `PUT` | `/api/salons/mine` | Owner | Update salon business details, logo, and profile |
| `GET` | `/api/salons/public` | Public | Discover active salons for client exploration |
| `GET` | `/api/salons/public/:slug` | Public | View public profile, gallery, and reviews by slug |
| `GET` | `/api/branches` | Protected | List all branches under tenant |
| `POST` | `/api/branches` | Owner | Create a new branch location |
| `PUT` | `/api/branches/:id` | Owner | Update branch details |
| `DELETE` | `/api/branches/:id` | Owner | Remove a branch |

### 🧑‍💼 Customer CRM & Loyalty
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/customers` | Owner / Manager | List customers with search, tier filter & pagination |
| `GET` | `/api/customers/:id` | Owner / Manager | Get 360° customer profile with full history |
| `POST` | `/api/customers` | Owner / Manager | Create customer record |
| `PUT` | `/api/customers/:id` | Owner / Manager | Update customer profile |
| `DELETE` | `/api/customers/:id` | Owner | Delete customer record |
| `GET` | `/api/loyalty-points` | Owner / Manager | View customer loyalty point transaction history |
| `POST` | `/api/loyalty-points` | Owner / Manager | Award or redeem loyalty points |
| `GET` | `/api/memberships` | Protected | List membership tiers and client passes |
| `POST` | `/api/memberships` | Owner | Create new membership tier definition |

### 📅 Smart Appointments & Concurrency
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/appointments` | Protected | List appointments (Staff filtered to assigned only) |
| `POST` | `/api/appointments` | Protected / Client | Create appointment with atomic slot reservation lock |
| `PUT` | `/api/appointments/:id` | Owner / Manager | Modify appointment time, staff, or services |
| `PUT` | `/api/appointments/:id/status`| Protected | Advance appointment lifecycle state |
| `DELETE` | `/api/appointments/:id` | Owner / Manager | Cancel booking and release slot reservation lock |

### 💰 POS Billing & Invoicing
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/invoices` | Owner / Manager | List invoices with date range and status filters |
| `GET` | `/api/invoices/:id` | Owner / Manager | Get invoice details for thermal/PDF printing |
| `POST` | `/api/invoices` | Owner / Manager | Create invoice (idempotent, atomic stock deduction) |
| `POST` | `/api/invoices/:id/refund` | Owner | Process invoice refund and replenish stock |

### 📦 Inventory & Stock Movement Audit
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/products` | Owner / Manager | List inventory products with stock levels |
| `POST` | `/api/products` | Owner / Manager | Add new inventory item |
| `PUT` | `/api/products/:id` | Owner / Manager | Update product pricing, reorder point, or quantity |
| `DELETE` | `/api/products/:id` | Owner | Remove product from inventory |
| `GET` | `/api/inventory/movements` | Owner / Manager | Query immutable stock movement audit ledger |
| `GET` | `/api/suppliers` | Owner / Manager | List suppliers and accounts payable |
| `POST` | `/api/suppliers` | Owner / Manager | Register new supplier |

### 👨‍💼 Staff, Attendance & Commissions
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/staff` | Owner / Manager / Staff | List staff directory (Staff sees own profile) |
| `POST` | `/api/staff` | Owner | Create staff profile with salary & commission rate |
| `PUT` | `/api/staff/:id` | Owner | Update staff compensation or branch assignment |
| `GET` | `/api/attendance` | Protected | Fetch attendance records (Staff sees own logs) |
| `POST` | `/api/attendance` | Protected | Log check-in or check-out timestamp |
| `GET` | `/api/commissions` | Protected | Fetch commission earnings (Staff sees own earnings) |

### 📊 BI Analytics & Financial Engine
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Protected | Executive KPI metrics (Revenue, Profit, Orders, Clients) |
| `GET` | `/api/analytics/financial-summary` | Owner / Manager | Authoritative P&L report across selected date range |
| `GET` | `/api/analytics/financial-reconciliation` | Owner | Financial reconciliation comparing ledger vs invoices |
| `GET` | `/api/expenses` | Owner / Manager | List categorized business expenses |
| `POST` | `/api/expenses` | Owner / Manager | Log new expense item |

### 📣 Marketing & System Health
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Owner | View message delivery log |
| `POST` | `/api/notifications/send` | Owner | Dispatch simulated WhatsApp/SMS/Email campaign |
| `GET` | `/api/audit-logs` | Owner | Query immutable security and mutation audit logs |
| `GET` | `/api/health` | Public | Real-time system health (DB latency, uptime, memory) |

---

## 📁 Project Structure

```
SalonSync/
├── 📄 package.json                    # Root workspace package & concurrent dev scripts
├── 📄 run.bat                         # One-click Windows startup script
├── 📄 .gitignore                      # Git ignore rules
│
├── 📂 backend/                        # Express 5 REST API Backend
│   ├── 📄 server.js                   # Application entry point, middleware, routes mount
│   ├── 📄 package.json                # Backend dependencies & Jest test runner scripts
│   ├── 📄 .env                        # Local secrets/config (gitignored; never commit)
│   ├── 📂 src/
│   │   ├── 📂 config/
│   │   │   └── 📄 db.js               # MongoDB Atlas connection & auto-seeding routine
│   │   ├── 📂 middleware/
│   │   │   ├── 📄 auth.js             # JWT verification, RBAC, tenant isolation & guards
│   │   │   ├── 📄 idempotency.js      # Multi-instance mutation deduplication
│   │   │   ├── 📄 observability.js    # Request tracing, correlation IDs & error logging
│   │   │   ├── 📄 rateLimiter.js      # Distributed Redis/In-Memory rate limiting
│   │   │   └── 📄 sanitize.js         # Input sanitization and error formatters
│   │   ├── 📂 models/
│   │   │   └── 📄 index.js            # All 29 Mongoose schemas & compound indexes
│   │   ├── 📂 routes/
│   │   │   └── 📄 api.js              # Comprehensive REST API route declarations
│   │   └── 📂 services/
│   │       ├── 📄 financialService.js # Authoritative P&L calculation & financial trends
│   │       └── 📄 inventoryService.js # Atomic stock movement and consumption logger
│   └── 📂 tests/                      # Automated test suite (164 tests)
│       ├── 📄 setup.js                # Test harness & MongoDB Memory Server setup
│       ├── 📂 integration/            # 21 Integration, concurrency & stress test suites
│       └── 📂 unit/                   # 5 Unit test suites (calculations, sanitize, etc.)
│
├── 📂 frontend/                       # React 19 + Vite 8 Frontend
│   ├── 📄 index.html                  # HTML entry point with SEO metadata
│   ├── 📄 package.json                # Frontend dependencies & Vitest runner
│   ├── 📄 vite.config.js              # Vite bundler configuration with chunk splitting
│   ├── 📄 vercel.json                 # Vercel SPA routing rewrite configuration
│   ├── 📂 public/
│   │   ├── 📄 favicon.svg             # Application favicon
│   │   ├── 📄 manifest.json           # PWA web manifest
│   │   └── 📄 sw.js                   # Service Worker for offline asset caching
│   └── 📂 src/
│       ├── 📄 main.jsx                # React root mount & PWA service worker registration
│       ├── 📄 App.jsx                 # Route definitions, layout shell & React.lazy routes
│       ├── 📄 App.css                 # Base layout styling
│       ├── 📄 index.css               # Luxury gold dark/light design system (CSS variables)
│       ├── 📂 components/             # Reusable UI component library
│       │   ├── 📄 AIAssistantModal.jsx# AI Assistant guidance modal
│       │   ├── 📄 AnimatedNumber.jsx  # 60fps KPI number count-up animation
│       │   ├── 📄 CommandPalette.jsx  # Ctrl+K global search & action palette
│       │   ├── 📄 DashboardCharts.jsx # High-performance SVG charts & heatmaps
│       │   ├── 📄 ErrorBoundary.jsx   # Production error boundary fallback UI
│       │   ├── 📄 Header.jsx          # Top navigation bar with branch switcher
│       │   ├── 📄 Sidebar.jsx         # Role-filtered navigation sidebar
│       │   ├── 📄 StaffDashboard.jsx  # Scoped stylist/staff portal view
│       │   ├── 📄 ToastContainer.jsx  # Toast notification dispatcher
│       │   └── 📄 UIComponents.jsx    # Buttons, inputs, modals, and badge primitives
│       ├── 📂 context/
│       │   └── 📄 AppContext.jsx      # Global state, authentication & API sync engine
│       ├── 📂 pages/                  # Route views (Lazy-loaded)
│       │   ├── 📄 Analytics.jsx       # BI Analytics & P&L reports
│       │   ├── 📄 Appointments.jsx    # Appointment scheduler & calendar
│       │   ├── 📄 AuditLogs.jsx       # Security & business audit logs
│       │   ├── 📄 Billing.jsx         # POS billing & receipt printing
│       │   ├── 📄 Customers.jsx       # Customer 360 CRM
│       │   ├── 📄 Dashboard.jsx       # Executive KPI dashboard
│       │   ├── 📄 Expenses.jsx        # Overhead expense tracking
│       │   ├── 📄 FranchiseOverview.jsx# Multi-branch franchise comparison
│       │   ├── 📄 Inventory.jsx       # Product stock & supplier management
│       │   ├── 📄 LandingPage.jsx     # Public marketing homepage
│       │   ├── 📄 Loyalty.jsx         # Loyalty reward programs & rules
│       │   ├── 📄 Marketing.jsx       # Marketing campaign automation
│       │   ├── 📄 Memberships.jsx     # Customer membership subscriptions
│       │   ├── 📄 PublicSalonProfile.jsx# Client public salon booking page
│       │   ├── 📄 SalonDiscovery.jsx  # Public directory to browse salons
│       │   ├── 📄 SalonHealth.jsx     # Live system health diagnostics
│       │   ├── 📄 Services.jsx        # Service catalog & pricing
│       │   ├── 📄 Staff.jsx           # Staff HR & attendance management
│       │   ├── 📄 WhatsAppHub.jsx     # WhatsApp messaging hub
│       │   ├── 📂 Admin/
│       │   │   └── 📄 SuperAdmin.jsx  # Super Admin platform command center
│       │   └── 📂 Auth/
│       │       └── 📄 AuthPages.jsx   # Login, signup, and recovery pages
│       └── 📂 tests/                  # Frontend component & permission tests (8 tests)
│           ├── 📄 navigation.test.jsx # Routing tests
│           └── 📄 permissions.test.jsx# RBAC guard tests
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** — Cloud [MongoDB Atlas](https://www.mongodb.com/atlas) cluster or local `mongodb://localhost:27017`

### ⚡ One-Click Startup (Windows)

Double-click the root `run.bat` file. It will automatically:
1. Install all dependencies across root, frontend, and backend
2. Start both the Vite dev server and Express API concurrently

### 🛠️ Manual Installation & Launch

```bash
# 1. Clone the repository
git clone https://github.com/ankitpalani24/SalonSync.git
cd SalonSync

# 2. Install all dependencies (root, frontend, backend)
npm run install-all

# 3. Configure backend environment variables
#    Create backend/.env (see Environment Variables section below)

# 4. Launch both servers concurrently
npm run dev-all
```

The application will be accessible at:
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

### 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| **Install All** | `npm run install-all` | Install root, frontend, and backend dependencies |
| **Full Stack Dev** | `npm run dev-all` | Start Vite dev server and Express API concurrently |
| **Dev (Network/LAN)** | `npm run dev-all-host` | Start with `--host` to test on mobile devices over LAN |
| **Frontend Dev** | `npm run dev` | Run Vite frontend only (`localhost:5173`) |
| **Backend Dev** | `npm run server` | Run Express API server only (`localhost:5000`) |
| **Frontend Tests** | `npm test --prefix frontend` | Run Vitest unit and component tests |
| **Backend Tests** | `npm test --prefix backend` | Run complete Jest integration & unit test suite |
| **Frontend Build** | `npm run build --prefix frontend` | Generate optimized production bundle in `frontend/dist` |

---

## 🔧 Environment Variables

### Backend Configuration (`backend/.env`)

Create `backend/.env` locally. **Never commit this file or place real credentials in this README.**

```env
# Server Port
PORT=5000

# Node Environment
NODE_ENV=development

# MongoDB Atlas or local MongoDB connection
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/Salonsync

# Generate a long, random secret for production
JWT_SECRET=YOUR_LONG_RANDOM_JWT_SECRET

# Optional: Redis URL for distributed rate limiting
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT
```

> ⚠️ **Security:** Never commit `backend/.env`, production credentials, MongoDB passwords,
> JWT secrets, Redis credentials, API keys, or other secrets to GitHub.
> Use Vercel/Render/Railway environment variables for production secrets.
> If a secret is ever exposed publicly, rotate it immediately.

### Frontend Configuration (`frontend/.env.production`)

```env
# Production API Base URL
VITE_API_URL=https://salonsync-api.onrender.com/api
```

---

## 🔐 Security & Secrets

SalonSync keeps application secrets outside source control.

### Never commit

- `backend/.env`
- `.env`
- `.env.*` files containing real credentials
- MongoDB connection strings with real passwords
- `JWT_SECRET`
- Redis credentials
- WhatsApp/Twilio/API credentials
- Production tokens or private keys

### Local development

Create your own `backend/.env` using the variable names shown in the Environment Variables section.

### Production

Configure secrets through the hosting provider's environment-variable settings:

- **Vercel** — Project Settings → Environment Variables
- **Render** — Service → Environment Variables
- **Railway** — Variables

Never paste production secrets into README files, source code, screenshots, issue trackers, or public GitHub discussions.

### Secret exposure response

If a credential is accidentally committed or exposed:

1. Revoke/rotate the credential immediately.
2. Remove the secret from the current source.
3. Check Git history and repository access.
4. Replace the production environment variable.
5. Redeploy affected services.

> **Important:** Removing a secret from the latest commit does not make an already-exposed secret safe. Rotate it.

---

## 🧪 Testing Suite (172+ Automated Tests)

SalonSync features a comprehensive testing architecture covering unit logic, integration endpoints, concurrency locking, stress benchmarks, and security abuse vectors:

```bash
# Run all backend unit & integration tests (164 tests across 26 suites)
npm test --prefix backend

# Run frontend component & RBAC tests (8 tests)
npm test --prefix frontend
```

### Backend Test Coverage Breakdown (26 Suites, 172+ Tests)

```
Test Suites: 26 passed, 26 total
Tests:       172+ passed, 172+ total
Snapshots:   0 total
Time:        ~99s (with in-memory MongoDB)

- Concurrency & Double-Booking Protection (SlotReservation atomic locks)
- Multi-Instance Distributed Mutation Idempotency (Idempotency-Key tests)
- Atomic Inventory Decrementing, Multi-Product Rollbacks & Refund Restocking
- JWT tokenVersion Invalidation & Session Revocation
- Authoritative Financial P&L Engine, Historical Reconciliation & Net Profit Aggregations
- Distributed Rate Limiting & Security Abuse Defenses
- 50-Thread Concurrent Load Benchmark (0% error rate, sub-second p50 latency)
- Large Dataset Stress Benchmark (1,000+ records)
- Full End-to-End Salon Lifecycle Flows (Onboarding → Booking → POS Billing → Inventory → Analytics)
```

---

## ☁️ Deployment

### 1. Frontend Deployment (Vercel)

The frontend is configured with `vercel.json` for single-page app (SPA) rewrites:

```bash
cd frontend
npm install -g vercel
vercel --prod
```

Configure the environment variable in your Vercel Project Settings:
- `VITE_API_URL`: `https://your-backend-api.onrender.com/api`

### 2. Backend Deployment (Render / Railway / Docker)

1. Create a new **Web Service** on [Render](https://render.com) or [Railway](https://railway.app).
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas Connection String>`
   - `JWT_SECRET`: `<Your Production Secret Key>`
   - `REDIS_URL`: *(Optional) `<Your Redis Connection String>`*

### 3. Database Deployment (MongoDB Atlas)

1. Create a free or dedicated cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Configure Network Access: Whitelist your backend server IP (or `0.0.0.0/0` for cloud providers).
3. Create a database user with read/write permissions.
4. Copy the connection URI into `MONGODB_URI`.
5. The database **automatically seeds** default demo salons, branches, services, staff, products, and admin users on first startup!

---

## 🧪 Demo Accounts

The database automatically seeds the following accounts for instant testing:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Super Admin** | `admin@salonsync.com` | `password123` | Platform-wide management & MRR analytics |
| **Salon Owner** | `alexander@luxesalon.com` | `password123` | Full Luxe Salon franchise control |
| **Salon Manager** | `aarav@luxesalon.com` | `password123` | Branch operations, appointments & billing |
| **Staff Member** | `isha@luxesalon.com` | `password123` | Stylist portal, roster & commissions |
| **Client** | *Register from UI* | *Your choice* | Public discovery, booking & loyalty |

> 💡 **Tip**: You can register brand new **Salon Owner** or **Client** accounts directly from the registration page to test fresh tenant onboarding and public self-booking workflows.

---

## 🤝 Contributing

Contributions, feedback, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit your Changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the Branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">
  <b>Built with ❤️ by <a href="https://github.com/ankitpalani24" target="_blank">Ankit Palani</a></b>
</p>

<p align="center">
  <i>If you find SalonSync helpful, please consider giving it a ⭐ on GitHub!</i>
</p>
