# VendorPass / TrustScore AI — Project Overview & Architecture

VendorPass is a cross-platform mobile application designed to bridge micro-merchants and vendors in Bharat with lenders and banks. It implements a behavior-based credit scoring mechanism (TrustScore AI) and matches merchants with custom credit limits.

---

## 🎨 Theme & Styling System
*   **Design Aesthetic**: "Saffron Gold Fintech" (Warm luxury meets digital trust).
*   **Palette**: Warm ivory backgrounds (`#F9F5EF`), Saffron Gold accents (`#D4820A`), Teal-Navy primary details (`#1A3A4A`), and Soft Gold/Amber highlights.
*   **Fonts**: Playfair Display, Sora, DM Sans, JetBrains Mono (dynamic Google Fonts import on Web, system fallbacks on iOS/Android).
*   **Styling Tooling**: Vanilla React Native `StyleSheet` leveraging design tokens from `@/constants/theme`.

---

## 👥 Target User Roles
The application dynamically alters its dashboard and layout depending on the authenticated role:
1.  **VENDOR / MERCHANT**:
    *   **TrustScore AI**: Dynamic rising credit-score meter gauge (ranging from 0 to 40% onboarded).
    *   **Credit limits**: Dynamic limit tracking (e.g., active ₹25,000 credit limit).
    *   **Features**: Record sale/repay ledger entries, peer comparison rankings, and microfinance explore hub.
2.  **LENDER / NBFC**:
    *   **Overview**: Total asset monitoring, active limits disbursed, and average portfolio health metrics.
    *   **Features**: Credit pipeline and merchant limits approval panel.
3.  **BANK / FINANCIAL INSTITUTION**:
    *   Similar to Lender view, optimized for processing merchant compliance and direct loan syndications.

---

## ⚙️ Core Architecture & Directories

### 1. Context & Global State
*   [`src/context/auth.tsx`](file:///c:/Users/HP/Desktop/VendorPass/src/context/auth.tsx): Houses the central `AuthProvider` handling simulated login, profile registration progress, role selections (`'VENDOR' | 'LENDER' | 'BANK'`), and mock verification flow (default mock OTP is `123456`).

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
│   │   ├── signup.tsx      # Multi-step forms & upload placeholders
│   │   ├── otp.tsx         # Auto-focusing code entry fields
│   │   └── success.tsx     # Confetti & TrustScore gauge meter pop
│   ├── (tabs)/             # Main app tab group
│   │   ├── _layout.tsx     # Tab configuration wrapper
│   │   ├── index.tsx       # Dynamic Dashboard (Lender vs Vendor View)
│   │   └── explore.tsx     # Credit Hub comparison & educational resources
│   ├── _layout.tsx         # Root container & Context Provider mapping
│   └── index.tsx           # Entry controller & scaling Splash Mandala Logo
├── components/             # Reusable UI components & custom theme layouts
├── constants/
│   └── theme.ts            # Saffron Gold colors, layout spacing & fonts map
└── hooks/                  # Dark/light theme state detectors
```

---

## 🛠️ Verification & Development Commands

To check project health or run the local development server:

*   **Run Web Server**: `npm run web` (or `npm run web -- --clear` to clear Metro bundler cache)
*   **Run Android Emulator**: `npm run android`
*   **TypeScript Validation**: `npx.cmd tsc --noEmit`
*   **Linter Checks**: `npm run lint`
