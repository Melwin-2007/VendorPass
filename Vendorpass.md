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
4.  **`public.chats`**: Stores 1-to-1 conversation sessions between lenders and vendors.
5.  **`public.messages`**: Stores message history, unread markers, and action card attributes.
6.  **`public.chat_flags`**: Manages flag status, reasons, and timeline logs for escalations.

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
│   ├── chat/               # Chat Flow group
│   │   ├── index.tsx       # Screen 1 — Chat Inbox (Filter chips, SwipeableRow)
│   │   ├── [id].tsx        # Screen 2 — Conversation View (Action Cards)
│   │   └── flagged.tsx     # Screen 3 — Flagged / Escalation View
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
*   Form collects real picker camera uploads for selfies and business docs.

### 2. Lender Dashboard Redesign (`(tabs)/index.tsx`)
*   **Hero Portfolio Card**: Gradient panel (`#1A3A4A` -> `#0A1A24`) showing total deployed capital, active counts, avg returns, and sparklines.
*   **Applicants Queue**: Swipe queue supporting live Decline/Approve actions.

### 3. Lender Search/Browse Redesign (`(tabs)/explore.tsx`)
*   Live query searches combined with filter pills and metric cards in a responsive layout.

### 4. Real-Time Chat & Escalation Suite (`src/app/chat`)
*   **Inbox Screen (`index.tsx`)**: Shows unread count indicators with a 4s pulse, active-today indicators with a glow opacity cycle, filter chips (*All*, *Unread*, *Flagged*, *Overdue*), a 300ms easing search slider, and custom `PanResponder` rows for Flag/Archive (swipe-left) and Mark Read (swipe-right).
*   **Conversation Screen (`[id].tsx`)**: Dynamic header displaying appropriate badges based on user role (TrustScore ★ or Verified Lender badge). Implements standard spring-animated message bubbles and **6 Specialized Action Cards**:
    *   *Loan Approved card*: teal gradient, linking to active repayments.
    *   *EMI Reminder card*: amber background, with working "Mark Received" triggers updating repayment details and adding wallet history.
    *   *Payment Received card*: green background, with updated percentage progress bar indicators.
    *   *Overdue Alert card*: red background, providing manual reminders and quick escalation.
    *   *Counter Offer card*: gold border, side-by-side terms displaying Accept/Decline triggers.
    *   *Loan Application card*: left-border accented, presenting vendor statistics and a link to review application profile details.
*   **Escalation Screen (`flagged.tsx`)**: Red warning banner, reason selectors, and history log timeline showing changes in flag state.

---

## 🛠️ Local Setup & Development Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup (Supabase)
Apply migrations locally:
```bash
npx supabase db reset
```

### 4. Run the Development Server
```bash
npm start
```

---

## 🚀 Recent Updates

### 1. Real-Time Chat Engine
* **DB Schema Sync**: Migrations set up `chats`, `messages`, and `chat_flags` with RLS policies and realtime enabled.
* **Hybrid Trigger sync**: Trigger functions automatically dispatch chat action cards in response to changes on the `loan_offers` table.
* **Unique Channel Caching Fix**: Appended dynamic user ID + random + timestamp values to `supabase.channel()` name parameters to prevent React remounts fetching cached already-subscribed channels.
* **BottomTabBar standard**: Wired up the bottom navigation bars to direct vendors and lenders to `/chat` using type assertions.
