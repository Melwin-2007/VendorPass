# VendorPass / TrustScore AI — Project Overview & Architecture

VendorPass is a cross-platform mobile application designed to bridge micro-merchants and vendors in Bharat with lenders and financial institutions. It implements a behavior-based credit scoring mechanism (TrustScore AI) and matches merchants with custom credit limits.

---

## 🎨 Theme & Styling System
*   **Design Aesthetic**: "Saffron Gold Fintech" (Warm luxury meets digital trust).
*   **Palette**: Warm background colors (`#fdf9f3`), Saffron Gold accents (`#D4820A`), Slate Blue secondary details (`#446274`), and dark slate (`#1A3A4A`).
*   **Fonts**: Playfair Display, Sora, DM Sans, JetBrains Mono (dynamic Google Fonts import on Web, system fallbacks on iOS/Android).
*   **Styling Tooling**: Vanilla React Native `StyleSheet` leveraging design tokens from `@/constants/theme`.

---

## 👥 Target User Roles
The application dynamically alters its dashboard and layout depending on the authenticated role:
1.  **VENDOR / MERCHANT**:
    *   **TrustScore AI**: Dynamic semi-circular credit-score meter gauge (ranging from 300 to 850).
    *   **Credit limits**: Dynamic limit tracking (e.g. pre-approved for ₹50,000).
    *   **Features**: Record sale/repay ledger entries, check credit score insights, and access Vendor Credit Hub offers.
2.  **LENDER / NBFC**:
    *   **Overview**: Total asset monitoring, active limits disbursed, and average portfolio health metrics.
    *   **Features**: Credit pipeline with dynamic approve/decline actions, and active loans tracking feed.
3.  **BANK / FINANCIAL INSTITUTION**:
    *   Similar to Lender view, optimized for processing merchant compliance and direct loan syndications.

---

## ⏱️ Accelerated Demo Timeline
For testing and demonstration purposes, the application operates on an accelerated physics engine where **5 real-world minutes equals 1 in-app month**. 
This scaling factor applies globally across:
* **Loan Repayments**: EMI due dates and "Overdue" status calculations.
* **TrustScore Engine**: pg_cron functions that penalize vendors for missing monthly payments.
* **Active Loans Feed**: Lender dashboards dynamically track loan maturity based on this 5-minute cycle.

---

## 💾 Database Integration & Calculations
The project utilizes a Supabase database instance with the following schemas and integrations:
1.  **`public.profiles`**: Synchronizes auth signups with user metadata (`name`, `role`, `selfie`, `business_photo`, `score`).
2.  **`public.wallet_transactions`**: Stores transaction ledgers (`amount`, `type` check `'ADD' | 'SEND'`, `description`).
3.  **`calculate_trust_score` (Edge Function)**: Triggered dynamically on database transaction updates to compute and update the merchant's trust score in real-time.

---

## ⚙️ Core Architecture & Directories

### 1. Context & Global State
*   [`src/context/auth.tsx`](file:///c:/Users/HP/Desktop/VendorPass/src/context/auth.tsx): Houses the central `AuthProvider` handling real Supabase signup/login, role updates, and token sessions.

### 2. Custom Symbol View (Icon Adapter)
*   [`src/components/symbol-view.tsx`](file:///c:/Users/HP/Desktop/VendorPass/src/components/symbol-view.tsx): A cross-platform adapter mapping iOS SF Symbols dynamically to `@expo/vector-icons` (`Ionicons` and `Feather`) on Android and Web while preserving native SF Symbols on iOS.

### 3. File & Navigation Structure
Expo Router (v56) file-based navigation tree:
```
src/
├── app/
│   ├── (auth)/             # Auth stack group
│   │   ├── _layout.tsx     # Animated stack transitions
│   │   ├── login.tsx       # Login screen with curved overlay header
│   │   ├── role-selection.tsx # Interactive choosing cards
│   │   ├── signup.tsx      # Multi-step forms, photo picker & document upload
│   │   └── success.tsx     # Confetti & TrustScore gauge meter pop
│   ├── (tabs)/             # Main app tab group
│   │   ├── _layout.tsx     # Tab configuration wrapper
│   │   ├── index.tsx       # Dynamic Dashboard (Lender vs Vendor View)
│   │   └── explore.tsx     # Lender Search & Browse / Vendor Credit Hub
│   ├── _layout.tsx         # Root container & Context Provider mapping
│   └── index.tsx           # Entry Splash Screen & scaling Splash Mandala Logo
├── components/             # Reusable UI components & custom theme layouts
├── constants/
│   └── theme.ts            # Saffron Gold colors, layout spacing & fonts map
└── hooks/                  # Dark/light theme state detectors
```

---

## 📱 Redesigned Screens & Modules

### 1. Signup & Verification Flow
*   Bypasses the mock OTP verification screen, registering the profile directly in Supabase on form submit.
*   Form collects real picker camera uploads for selfies and business docs (resolving local image blob colons path upload 400 error by extracting correct mime types and extensions from assets metadata).
*   Features verify password matching validation fields.

### 2. Lender Dashboard Redesign (`(tabs)/index.tsx`)
*   **Top Bar**: Fixed header displaying profile portrait, "VERIFIED" badge, greeting "Welcome Back, [user.name] 👋", notification bell, and settings gear.
*   **Hero Portfolio Card**: Gradient panel (`#1A3A4A` -> `#0A1A24`) showing TOTAL CAPITAL DEPLOYED (₹4,85,000), Active Loans (12), Avg Return (18.4%), repayments (94%), and Sparkline trend bar graph.
*   **Quick Actions Grid**: Row of 4 modules: Browse Vendors (routes to search), New Loan, Portfolio, and At-Risk.
*   **Applicants Queue**: Renders live vendor profiles loaded from Supabase. Clicking Decline/Approve filters them out from the lender's active attention queue.
*   **Active Feed**: Displays active loan records (Krishna General Store, S.K. Logistics, Anita Boutique) showing installments progress bars, next EMI dates, status tags, and "At-Risk" alerts.

### 3. Lender Search/Browse Redesign (`(tabs)/explore.tsx`)
*   **Role-Based Wrapper**: Displays Lender Search & Browse for Lenders, and the personalized loan offers for Vendors.
*   **Top Header & Search Bar**: Live query input search bar filtering names, categories, or locations in real-time.
*   **Filter Pills**: Scrollable pills ("Near Me", "High Score", "Micro-Retail") that dynamically filter the active opportunities list.
*   **Metric Cards**: Verified Today ("128+") and Total Volume ("₹4.2M") with checkmark shield and trend line SVG watermarks in the background.
*   **Opportunities Feed**: Merged listing of vendor profiles loaded from Supabase and high-fidelity mockup opportunities (Priya's Organic Mart, Artisan Ceramics, TechFix Solutions).
*   **FAB**: Rounded floating map FAB button in the bottom right corner.

---

## 🛠️ Local Setup & Development Guide

Follow these steps to configure and run VendorPass on your local machine:

### 1. Install Dependencies
Ensure you have Node.js installed, then run:
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory and add your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup (Supabase)
Copy the entire contents of `supabase_setup.sql` and run it in your Supabase SQL Editor. 
*Note: Make sure the `pg_cron` extension is enabled in your Supabase Database settings for the time-based TrustScore logic to work.*

### 4. Run the Development Server
Start the Expo Metro Bundler:
```bash
npm start
```
* **Web**: Press `w` (or run `npm run web`)
* **Android**: Press `a` (or run `npm run android`)
* **Clear Cache**: `npm start -- -c` (useful if you encounter module resolution errors)

### 5. Verification Commands
*   **TypeScript Validation**: `npx.cmd tsc --noEmit`
*   **Linter Checks**: `npm run lint`

---

## 🚀 Recent Updates (TrustScore AI & P2P Integrations)

### 1. Global Professional UI Overhaul
* Replaced fragmented, emoji-based local toasts with the `react-native-toast-message` global provider inside `_layout.tsx`.
* Upgraded notification copywriting across `index.tsx`, `explore.tsx`, and `history.tsx` to maintain a formal, banking-grade tone.

### 2. Time-Based TrustScore Engine
* Built `public.process_overdue_loans()` as a **pg_cron** function running every minute to enforce a strict demo lifecycle (1 month = 5 minutes).
* **Penalty Triggers**:
  * If a Vendor misses the payment window, they receive a "Friendly Reminder" notification.
  * If the entire month cycle passes unaddressed, a **Severe Penalty (-50 points)** is executed directly by Postgres, injecting a negative AI Narrative into the user's `trust_score_data` profile.

### 3. P2P Wallet & EMI Math
* Updated Row-Level Security (RLS) policies on `wallet_transactions` to allow cross-user (Vendor -> Lender) insertions via `check (true)`.
* Established standardized EMI calculation: `emi = (principal + (principal * interest / 100)) / tenure`.
* Automated `history.tsx` repayment tracking:
  * **On-Time Reward**: `+5 points`.
  * **Late Penalty**: `-10 points`.
  * **Completion Bonus**: `+15 points`.

### 4. Vendor Dashboard Fixes (`index.tsx`)
* Activated global Notification Bell with dynamic unread badging.
* "Apply for Loan" center tab button natively redirects across all screens and auto-triggers the Lenders Modal globally.
* Added eligibility guardrails to block the "Apply" modal if the vendor currently holds an active (not fully paid off) or pending loan.
* Limited "Recent Activity" ledger to 5 entries and linked "See All" directly to the Wallet interface.
* Corrected visual Trend Text to calculate dynamically against the baseline score of `620`.

### 5. TrustScore AI Insights Engine
* **Dynamic AI Prompts**: Edge Functions (like `calculate_trust_score`) are explicitly instructed to calculate metrics using the `5 real-world minutes = 1 in-app month` rule to avoid falsely penalizing short-time spans as "distressed" financial patterns.
* **Score History Ledger**: `trust_score_data` Postgres JSONB now tracks a complete `history` array. Both the pg_cron overdue function and the manual repayment methods (`history.tsx`) prepend structured narrative objects (`timestamp`, `score_change`, `type`, `narrative`).
* **AI Score Insights UI**: 
  * A new "View AI Score Insights" button on the Vendor Dashboard triggers a dynamic Credit Report Modal.
  * The modal reads the latest `history` block and dynamically updates the summary card (turning green for recent score bumps, and red for recent drops).
  * A vertical scrollable timeline renders every narrative chronologically with color-coded impacts.
