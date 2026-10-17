# 🇮🇳 BillSetu — Smart GST Billing & Books Platform for Indian Enterprise

> **The Calm, Professional GST Billing Platform Built for India.**  
> Seamless B2B Tax Invoicing, Scan-to-Books AI, Dynamic NPCI UPI QR Codes, Bluetooth Thermal Printing, Customer Khata Ledgers, and an Executive SaaS Subscription Admin Portal.

[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GST Compliance](https://img.shields.io/badge/CBIC%20GST-Section%2031%20%26%2033%20Ready-emerald)](https://cbic.gov.in/)

---

## 🌟 Key Product Capabilities

### 1. 🏛️ Deterministic Indian GST Tax Engine
- **Intra-State vs Inter-State Auto-Detection**: Uses 2-digit State Codes (e.g. `09` UP, `27` MH, `07` DL) to automatically compute **CGST (half) + SGST (half)** or **IGST (full)**.
- **CBIC Standard Tax Slabs**: Full native support for `0%`, `5%`, `12%`, `18%`, and `28%` tax rates with line-level discounts and trade discounts.
- **Reverse Charge Mechanism (RCM)**: Full compliance with Section 9(3) and 9(4) for GTA and unregistered supplier duties.
- **Section 33 Pure Agent Exemption**: Handles non-taxable reimbursements (Tolls, Parking, State Permits) without adding illegitimate GST liability.
- **Integer Paise Math**: Eliminates JavaScript floating-point errors (`0.1 + 0.2 !== 0.3`) by running all arithmetic strictly in integer paise.

### 2. ⚡ Dynamic NPCI UPI QR Payments
- Generates **bank-grade dynamic UPI QR codes** embedded directly on every printed, PDF, and online bill.
- Encodes exact invoice amounts down to the single paisa (`upi://pay?pa=...&am=...&tn=INV-2026-001`).
- Eliminates 2% - 3% merchant gateway fees — payments land straight into your current bank account via PhonePe, Google Pay, Paytm, or BHIM.

### 3. 🔍 Scan-to-Books AI & OCR Pipeline
- Digitize paper receipts, fuel bills, toll receipts, and vendor invoices in sub-second speed.
- Extracts vendor GSTIN, legal name, tax amounts, line items, and invoice dates.
- Validates supplier GSTIN checksum and automatically records purchase expenses into your digital ledger.

### 4. 🖨️ Dual-Format Printing: A4 Corporate & Thermal POS
- **Corporate A4 PDF**: Clean, professional GST Tax Invoices formatted with your custom logo, authorized signatory signature, bank details, and terms.
- **Counter POS Thermal Slips**: Direct output for **58mm (2-inch)** and **80mm (3-inch)** Bluetooth and USB ESC/POS thermal printers.

### 5. 📒 Customer & Vendor Khata Ledger
- Track balances, payments received, pending dues, and overdue alerts.
- Issue and export official **Customer Ledger Statements** in PDF for audit confirmation.
- One-click WhatsApp invoice dispatch with personalized polite payment reminders.

### 6. ⚙️ Executive SaaS Subscription Admin Dashboard
- **Real-Time SaaS KPIs**: Monthly Recurring Revenue (MRR), Annual Run Rate (ARR), Active Paid Tenants, Churn Rate, and AI OCR scan pool usage.
- **Tenant Management**: Filter, search, upgrade/downgrade, grant complimentary trial days, expand OCR quotas, and toggle feature flags (white-labeling, WhatsApp, multi-user seats).
- **Pricing Tier Manager**: Configure Starter Free (₹0), Pro Business (₹999/yr), and Enterprise Fleet (₹3,499/yr) plans.
- **Promotional Coupon Engine**: Create and manage campaign discount codes (`DIWALI50`, `STARTUPGST`, `FLEETVIP`) with redemption limits and expiry.
- **Revenue Ledger**: Complete audit log of subscription transactions with Razorpay, UPI, Cashfree, and NEFT references, including GST SaaS tax invoice generation.

### 7. 🛡️ Local-First Privacy & Offline Architecture
- Powered by client-side **IndexedDB** — create bills, search parties, and print receipts with zero network connection.
- 100% compliant with the **Digital Personal Data Protection Act (DPDPA), 2023** — your financial books remain under your sovereign control.
- Native **Android Mobile App** (`.apk`) included for on-the-go billing counters and logistics fleet drivers.

---

## 🏗️ Architecture & Tech Stack

```
billsetu/
├── src/
│   ├── components/
│   │   ├── showcase/               # Public Feature Showcase & Landing Page
│   │   │   └── FeatureShowcase.tsx # Live interactive calculators, tour & ROI engine
│   │   ├── admin/                  # SaaS Subscription Management Dashboard
│   │   │   └── AdminSubscriptionDashboard.tsx # Tenants, MRR, Coupons, Plans
│   │   ├── home/                   # App Dashboard & Quick Action metrics
│   │   ├── invoices/               # A4 Invoices, Thermal Receipts, Payment Modals
│   │   ├── scan/                   # Scan-to-Books AI document OCR pipeline
│   │   ├── parties/                # Customer Khata & Vendor ledgers
│   │   ├── items/                  # Item catalog & HSN/SAC code directory
│   │   ├── subscription/           # User-facing Pro branding & logo setup
│   │   └── layout/                 # Sticky Navigation, Header, Command Palette
│   ├── services/
│   │   ├── taxEngine.ts            # Deterministic GST arithmetic (paise-precision)
│   │   ├── ocrPipeline.ts          # Computer vision document parser
│   │   ├── gstinService.ts         # Indian GSTIN checksum validator
│   │   ├── storageService.ts       # Multi-tenant IndexedDB & local persistence
│   │   └── authService.ts          # Tenant session management & setup wizard
│   ├── types/                      # TypeScript domain models
│   └── App.tsx                     # Top-level portal switcher (Showcase / App / Admin)
├── public/                         # Logos, Favicons, Android APK & sample bills
├── vercel.json                     # Vercel SPA routing & cache optimization
└── package.json
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**

### Installation
```bash
# Clone the repository
git clone https://github.com/utkarshsingh11011/billsetu.git

# Enter project directory
cd billsetu

# Install dependencies
npm install

# Start local development server with Vite HMR
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🧭 Navigation & Portal Modes

BillSetu includes deep URL-hash routing to access each portal:

| Portal | URL Route | Description |
|---|---|---|
| **Public Feature Showcase** | `/#showcase` | Interactive product tour, live GST calculator, MSME ROI calculator, and pricing |
| **Billing Workspace** | `/#app` | Full invoicing application (Sales, Scan, Khata, Thermal, Reports) |
| **Subscription Admin** | `/#admin` | Executive SuperAdmin console (MRR, Tenants, Coupons, Plans, SaaS Invoices) |

---

## ☁️ Vercel Deployment

This project is pre-configured with `vercel.json` for high-performance deployment on [Vercel](https://vercel.com):

```bash
# Deploy with Vercel CLI
npx vercel

# Deploy directly to Production
npx vercel --prod
```

### `vercel.json` Features:
- Single Page Application (SPA) rewrite rules so direct links like `/#admin` and hosted bill links `/?bill=...` route correctly.
- Long-term immutable caching for Vite asset bundles (`/assets/*`).
- Optimized `Content-Disposition` headers for the Android APK (`.apk`) download.

---

## 📱 Android App Build

BillSetu includes a native Android build (`billsetu-v1.0.0-debug.apk`) located in `public/` ready for immediate download and installation on any Android phone (Android 8.0+).

---

## 👨‍💻 Author & Engineering Credits

**Architected & Developed by Utkarsh Singh**
- GitHub: [@utkarshsingh11011](https://github.com/utkarshsingh11011)
- Project Repository: [https://github.com/utkarshsingh11011/billsetu](https://github.com/utkarshsingh11011/billsetu)
- Live Platform: [https://billsetu.vercel.app](https://billsetu.vercel.app)

---

## ⚖️ License & Disclosures

Distributed under the MIT License. Designed and engineered for Indian MSMEs, taxi fleets, retailers, and wholesale traders.
BillSetu is fully compliant with CBIC GST Portal rules and the Digital Personal Data Protection Act (DPDPA), 2023.
