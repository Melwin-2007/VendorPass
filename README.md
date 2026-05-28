<div align="center">
  <img src="./assets/images/logo-glow.png" alt="VendorPass Header" width="100%" style="border-radius: 16px; margin-bottom: 20px;"/>

  # 🚀 VendorPass
  **AI-Powered Behavioral Credit Intelligence for Bharat**

  [![Expo](https://img.shields.io/badge/Expo-1C1E24?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
  [![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
</div>

---

## 📖 Overview

**VendorPass** is a revolutionary cross-platform financial platform designed to bridge the gap between micro-merchants (kirana stores, street vendors) and institutional lenders (NBFCs, Banks) in India. 

It replaces static, exclusionary credit scores (like CIBIL) with **TrustScore™ AI**—a dynamic trust-modeling engine that evaluates transaction behavior, financial patterns, and business regularity to enable smarter, inclusive lending for the underbanked.

---

## ✨ Key Features

### 🧠 TrustScore™ AI Insights Engine
A proprietary scoring algorithm that evaluates raw ledger data and generates a dynamic score (300-850). 
- **AI Score Insights:** A real-time credit report timeline that explains the "Why" behind every score change using human-readable narratives.
- **Behavioral Modeling:** Evaluates income stability, cash flow health, payment discipline, and digital adoption.

### 🎭 Dual-Role Dynamic Interface
A single unified application that radically alters its UI/UX based on the authenticated user:
- **🏪 For Vendors:** A dashboard focusing on TrustScore building, credit limit tracking, loan applications, and wallet ledger management.
- **🏦 For Lenders:** A sophisticated portfolio management suite showing total capital deployed, active loan feeds, and a Tinder-style swipe queue for pending vendor loan approvals.

### 🤝 Peer-to-Peer Counter-Offer Negotiations
- **Custom Terms Proposal:** Lenders can review vendor profiles or public broadcast requests and submit customized counter-offers (specifying amount, rate, and tenure).
- **Direct Vendor Decisions:** Vendors can accept or decline lender counter-proposals from their History section, which auto-triggers instant P2P wallet disbursements.

### ❌ In-Modal Request Cancellation
- Vendors can click the main loan section tab button to view any pending direct or broadcast request and cancel it immediately (deleting it from Supabase) to clear the way for new applications.

### ✨ Dynamic UI Animations & Polish
- **Score Count-Up:** The credit score display counts up dynamically from 300 to its current score on entry.
- **Pillar Slides:** Scoring Pillars and risk indicators feature smooth progress bar sliding animations on tab changes.
- **Cross-Platform Symbols:** Extended SF symbols mappings for perfect icon rendering on Android/Web.

### 🔒 Live Supabase Sync & Data Integrity
- **Real-Time Dashboards:** All lender portfolio metrics, active loans, and public broadcast requests are deeply synchronized with live Supabase data, avoiding any hardcoded fallbacks.
- **Automated Request Fulfillment:** When a lender funds a broadcast request, it's immediately auto-fulfilled and purged from the global "Top Opportunities" feed to prevent obsolete queues.


### ⏱️ Accelerated "Physics Engine" (Demo Mode)
For demonstration and testing purposes, VendorPass operates on an accelerated timeline:
> **5 real-world minutes = 1 in-app financial month**

Supabase `pg_cron` jobs and Edge Functions rigorously enforce this timeline. If a vendor misses their 5-minute EMI payment window, the backend instantly issues a severe TrustScore penalty, simulating a real-world loan default.

---

## 🛠️ Tech Stack

* **Frontend:** React Native, Expo Router (v56), TypeScript
* **Styling:** Custom Vanilla CSS via React Native `StyleSheet` (Saffron Gold & Slate Theme)
* **Backend & Auth:** Supabase (PostgreSQL, Auth, Edge Functions, pg_cron)
* **AI Integration:** OpenRouter / Gemini Pro (for transaction parsing & TrustScore narratives)

---

## 🚀 Quick Start (Local Setup)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/VendorPass.git
cd VendorPass
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Migration
Copy the contents of `supabase_setup.sql` and execute it in your Supabase SQL Editor.
*Ensure the `pg_cron` extension is enabled in your database settings to activate the accelerated timeline engine.*

### 4. Start the App
```bash
npx expo start
```
*Press `i` for iOS simulator, `a` for Android emulator, or `w` for Web.*

---

## 🗺️ Roadmap to 10/10

VendorPass is actively evolving. Our upcoming milestones include:
1. **Bank/Institutional Portal:** A macro-level dashboard for banks to fund massive pools of high-TrustScore vendors via NBFCs.
2. **AI "Khata" Digitization:** Vision AI integration allowing vendors to photograph physical ledger books to instantly digitize transactions.
3. **B2B BNPL Network:** Enabling vendors to use their credit limits to pay suppliers directly inside the app.
4. **Multi-Language Support:** Full localization in Hindi, Marathi, and Tamil for true financial inclusion.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---
<div align="center">
  <i>Built with ❤️ for Bharat.</i>
</div>
