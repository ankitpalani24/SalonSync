# SalonSync CI/CD & Deployment Guide

This document provides a comprehensive overview of the SalonSync deployment architecture, GitHub Actions CI/CD pipeline, environment segregation, secret management, and status checks.

---

## 1. Deployment Architecture

SalonSync utilizes a decoupled cloud architecture:

```
                  ┌─────────────────────────────────────────┐
                  │          GitHub Repository              │
                  │   (ankitpalani24/SalonSync: main)       │
                  └────────────────────┬────────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      │    GitHub Actions CI/CD Pipeline│
                      │  (Lint, Test, Build, Health)   │
                      └────────────────┬────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────┐                     ┌───────────────────────────────┐
│     Frontend (Vercel)         │                     │      Backend (Render)         │
│ URL: salonsync-iota.vercel.app│                     │ URL: salonsync-api.onrender.com│
└───────────────────────────────┘                     └───────────────────────────────┘
```

---

## 2. GitHub Actions CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

The pipeline runs automatically on:
- **Push** to `main` or `develop` branches.
- **Pull Requests** targeting `main` or `develop` branches.
- **Manual Trigger** (`workflow_dispatch`).

### Pipeline Stages & Jobs

1. **🔍 Lint & Syntax Validation (`lint-and-typecheck`)**
   - Installs common dependencies.
   - Runs `oxlint` on both backend and frontend codebases.

2. **🧪 Automated Test Suite (`test`)**
   - Runs **Jest** unit & API integration tests (37 tests) in `backend/`.
   - Runs **Vitest** component tests (8 tests) in `frontend/`.
   - Passes using an isolated in-memory test environment (`MongoMemoryServer`).

3. **🏗️ Production Build Verification (`build`)**
   - Runs `npm run build` in `frontend/`.
   - Verifies bundle creation and uploads build artifacts (`dist/`).

4. **🚀 Deployment Health Checks & Gates (`deployment-checks`)**
   - Selects environment (`Development`, `Staging`, or `Production`).
   - Pings live backend API health endpoint (`https://salonsync-api.onrender.com/`).
   - Safely triggers Render deploy hook if `RENDER_DEPLOY_HOOK_URL` secret is configured.

---

## 3. GitHub Environments & Secret Management

SalonSync supports 3 logical deployment environments in GitHub Actions:

| Environment | Trigger | Purpose | Deploy Hook / Secret Target |
| :--- | :--- | :--- | :--- |
| **Development** | Pull Requests | Preview feature branch changes | Ephemeral preview builds |
| **Staging** | Push to `develop` | Pre-release integration testing | Staging server deploy hooks |
| **Production** | Push to `main` | Production customer-facing release | Production Render & Vercel deploy hooks |

### Required GitHub Secrets

To configure secrets in your GitHub Repository:
Nav: **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**

| Secret Name | Required For | Description |
| :--- | :--- | :--- |
| `JWT_SECRET` | Backend Tests & Runtime | Secret key used for signing JWT authentication tokens. |
| `MONGODB_URI` | Backend Production DB | MongoDB Atlas connection string. |
| `RENDER_DEPLOY_HOOK_URL` | Production Deployments | Deploy hook URL from Render dashboard to trigger backend redeploys. |
| `VERCEL_TOKEN` | Production Deployments | Vercel Personal Access Token for Vercel CLI deployments. |
| `VERCEL_ORG_ID` | Production Deployments | Vercel Organization ID. |
| `VERCEL_PROJECT_ID` | Production Deployments | Vercel Project ID. |

---

## 4. Setting Up Required Status Checks (Branch Protection)

To prevent un-tested code from breaking `main`:

1. Go to **Settings** -> **Branches** -> **Add branch protection rule**.
2. Set **Branch pattern name** to `main`.
3. Enable **Require a pull request before merging**.
4. Enable **Require status checks to pass before merging**.
5. Search and select the following status check jobs:
   - `🔍 Lint & Syntax Validation`
   - `🧪 Automated Test Suite`
   - `🏗️ Production Build Verification`
6. Click **Save Changes**.

---

## 5. Production Release Procedure

1. **Feature Development**: Create a feature branch (e.g., `feature/custom-reports`).
2. **Pull Request**: Open a PR targeting `develop` or `main`.
3. **CI Validation**: GitHub Actions automatically runs linter, test suite, and frontend build.
4. **Merge to Main**: Upon PR approval and status checks passing, merge to `main`.
5. **Auto-Deployment**: GitHub Actions verifies the build and notifies Render / Vercel deploy hooks.
