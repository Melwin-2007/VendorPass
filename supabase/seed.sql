-- seed-demo.sql
-- Run this in your Supabase Dashboard SQL Editor to seed the VendorPass demo accounts.
-- This script clears existing demo IDs to allow clean re-runs.

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Disable triggers temporarily to prevent stale asynchronous AI calculations from overwriting our seeded scores
ALTER TABLE public.wallet_transactions DISABLE TRIGGER on_wallet_transaction;

-- Clean up any existing records with our predictable demo IDs
DELETE FROM auth.identities WHERE user_id IN (
  '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', 
  '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b',
  '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c',
  '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d',
  '5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e',
  '6f6f6f6f-6f6f-6f6f-6f6f-6f6f6f6f6f6f'
);
DELETE FROM auth.users WHERE id IN (
  '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', 
  '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b',
  '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c',
  '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d',
  '5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e',
  '6f6f6f6f-6f6f-6f6f-6f6f-6f6f6f6f6f6f'
);

--------------------------------------------------------------------------------
-- 1. SEED VENDOR: GreenLeaf Fresh Produce Pvt. Ltd. (Genuine Vendor, Score: 782 / 92%)
--------------------------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c',
  'authenticated', 'authenticated', 'vendor1@vendorpass.com', crypt('Password123!', gen_salt('bf')),
  now() - interval '6 months', '{"provider":"email","providers":["email"]}',
  '{"name": "GreenLeaf Fresh Produce Pvt. Ltd.", "username": "greenleaf", "phone": "+919876543222", "role": "VENDOR", "selfie": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop", "businessPhoto": "https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=300&auto=format&fit=crop", "score": 605}',
  now() - interval '6 months', now() - interval '6 months', '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c',
  'vendor1@vendorpass.com', '{"sub":"3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c","email":"vendor1@vendorpass.com"}',
  'email', now(), now() - interval '6 months', now() - interval '6 months'
);

-- Update profile with exact score and detailed trustScoreData
UPDATE public.profiles
SET 
  score = 605,
  created_at = now() - interval '6 months',
  trust_score_data = '{
    "vendor_id": "3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c",
    "score_date": "2026-06-02",
    "trust_score": 605,
    "risk_tier": "Medium Risk",
    "classification_badge": "SILVER - MEDIUM ELIGIBILITY",
    "default_probability": "4.8%",
    "recommended_loan_limit": "₹1,50,000",
    "recommended_interest_band": "14% - 16% p.a.",
    "repayment_frequency_suggestion": "Weekly/Monthly",
    "pillar_scores": {
      "income_stability": 68,
      "cash_flow_health": 65,
      "business_regularity": 72,
      "payment_discipline": 70,
      "digital_adoption": 75,
      "risk_signals": 70
    },
    "score_explanation": "Consistent daily business revenues with standard retail transactions. Moderate credit score due to regular rent and helper salary expenses, but no active negative marks.",
    "key_findings": {
      "financial_integrity": [
        "Regular cash flow from multiple sources (Golden Residency, Sunrise Hotel, City Mart).",
        "Higher operational expenses including regular helper salaries and shop rent."
      ],
      "behavioral_indicators": [
        "Active digital payment history.",
        "Zero default history on commercial invoices."
      ],
      "compliance_gaps": []
    },
    "risk_signals_table": [],
    "history": [
      {
        "timestamp": "2026-06-02T12:00:00Z",
        "score_change": 12,
        "narrative": "Verified consistent sales volumes and strong repeat customer network.",
        "type": "reward"
      }
    ]
  }'::jsonb
WHERE id = '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c';

-- Seed rich, diversified wallet transactions spanning 5 months for GreenLeaf Fresh Produce (Good Vendor)
-- This includes credits (ADD) and debits (SEND) for supplier invoices, utility bills, and mobile recharges to satisfy the TrustScore engine requirements.
INSERT INTO public.wallet_transactions (id, user_id, amount, type, description, created_at)
VALUES 
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 18500, 'ADD', 'Fresh vegetables supply - Sunrise Hotel (UPI Transfer)', now() - interval '5 months'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 4200, 'SEND', 'Supplier Invoice - Patel Dairy (Bank Transfer)', now() - interval '5 months'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 1200, 'SEND', 'Packaging Supplies - PolyPack India (UPI)', now() - interval '5 months' + interval '5 days'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 9500, 'ADD', 'Organic produce sale - Green Shoots Cafe (UPI)', now() - interval '5 months' + interval '10 days'),
  
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 24200, 'ADD', 'Fruits and vegetables - City Mart (Bank Transfer)', now() - interval '4 months'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 2500, 'SEND', 'Utility Bill - BSES Electricity (Auto-debit)', now() - interval '4 months'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 500, 'SEND', 'Mobile Recharge - Jio Prepaid', now() - interval '4 months'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 8000, 'SEND', 'Shop Rent - Gupta Realty (Bank Transfer)', now() - interval '4 months' + interval '2 days'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 15000, 'ADD', 'Daily Sales Settlement - BharatPe', now() - interval '4 months' + interval '15 days'),
  
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 16800, 'ADD', 'Weekly produce delivery - Golden Residency (UPI Transfer)', now() - interval '3 months'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 5100, 'SEND', 'Supplier Invoice - Aziz Wholesale (Bank Transfer)', now() - interval '3 months'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 8000, 'SEND', 'Shop Rent - Gupta Realty (Bank Transfer)', now() - interval '3 months' + interval '2 days'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 12500, 'ADD', 'Fruits sale - Imperial Club (UPI)', now() - interval '3 months' + interval '10 days'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 3500, 'SEND', 'Fuel Expense - Indian Oil Corp (UPI)', now() - interval '3 months' + interval '20 days'),
  
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 31400, 'ADD', 'Bulk produce order - Fresh Basket Retail (UPI Transfer)', now() - interval '2 months'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 2700, 'SEND', 'Utility Bill - BSES Electricity (Auto-debit)', now() - interval '2 months'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 8000, 'SEND', 'Shop Rent - Gupta Realty (Bank Transfer)', now() - interval '2 months' + interval '2 days'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 6000, 'SEND', 'Part-time Helper Salary - Ramesh Singh (UPI)', now() - interval '2 months' + interval '5 days'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 14000, 'ADD', 'Catering produce order - Royal Gardens (Bank Transfer)', now() - interval '2 months' + interval '12 days'),
  
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 19100, 'ADD', 'Fresh vegetables supply - Sunrise Hotel (UPI Transfer)', now() - interval '1 month'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 4500, 'SEND', 'Supplier Invoice - Patel Dairy (Bank Transfer)', now() - interval '1 month'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 600, 'SEND', 'Mobile Recharge - Jio Prepaid', now() - interval '1 month'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 8000, 'SEND', 'Shop Rent - Gupta Realty (Bank Transfer)', now() - interval '1 month' + interval '2 days'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 6500, 'SEND', 'Part-time Helper Salary - Ramesh Singh (UPI)', now() - interval '1 month' + interval '5 days'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 11000, 'ADD', 'Vegetable stall daily collection - GPay', now() - interval '1 month' + interval '18 days'),
  
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 25000, 'ADD', 'Weekly produce delivery - Golden Residency (UPI Transfer)', now() - interval '10 days'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 3000, 'SEND', 'Utility Bill - BSES Electricity (Auto-debit)', now() - interval '5 days'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 8000, 'SEND', 'Shop Rent - Gupta Realty (Bank Transfer)', now() - interval '3 days'),
  (gen_random_uuid(), '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 28000, 'ADD', 'Fresh vegetables supply - Sunrise Hotel (UPI Transfer)', now() - interval '2 days');


--------------------------------------------------------------------------------
-- 2. SEED VENDOR: Rapid Supplies Enterprise (Fraudulent Vendor, Score: 238 / 28%)
--------------------------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d',
  'authenticated', 'authenticated', 'vendor2@vendorpass.com', crypt('Password123!', gen_salt('bf')),
  now() - interval '2 weeks', '{"provider":"email","providers":["email"]}',
  '{"name": "Rapid Supplies Enterprise", "username": "rapid_supplies", "phone": "+919999911111", "role": "VENDOR", "selfie": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop", "businessPhoto": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=300&auto=format&fit=crop", "score": 238}',
  now() - interval '2 weeks', now() - interval '2 weeks', '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d', '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d',
  'vendor2@vendorpass.com', '{"sub":"4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d","email":"vendor2@vendorpass.com"}',
  'email', now(), now() - interval '2 weeks', now() - interval '2 weeks'
);

-- Update profile with exact score and detailed trustScoreData containing fraud signals
UPDATE public.profiles
SET 
  score = 238,
  created_at = now() - interval '2 weeks',
  trust_score_data = '{
    "vendor_id": "4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d",
    "score_date": "2026-06-02",
    "trust_score": 238,
    "risk_tier": "Critical Risk",
    "classification_badge": "CRITICAL - FRAUD DANGER",
    "default_probability": "84%",
    "recommended_loan_limit": "₹0",
    "recommended_interest_band": "N/A",
    "repayment_frequency_suggestion": "N/A",
    "pillar_scores": {
      "income_stability": 15,
      "cash_flow_health": 12,
      "business_regularity": 10,
      "payment_discipline": 5,
      "digital_adoption": 20,
      "risk_signals": 8
    },
    "score_explanation": "Newly registered entity with a sudden spike of high-value round-number transactions with shell companies.",
    "key_findings": {
      "financial_integrity": [
        "Extremely high-value, uniform transactions (e.g. ₹5,00,000) over 4 days.",
        "Transactions conducted with newly formed, unverified shell counterparties."
      ],
      "behavioral_indicators": [
        "No prior organic transaction history.",
        "Sequential invoice numbers issued in bulk."
      ],
      "compliance_gaps": [
        "No physical delivery evidence or logistics trails.",
        "Circular fund movement indicators."
      ]
    },
    "risk_signals_table": [
      {
        "signal": "Circular Fund Movement",
        "evidence": "Funds routed back to origin accounts within 24 hours",
        "severity": "Critical"
      },
      {
        "signal": "Uniform Round-Number Transactions",
        "evidence": "5 consecutive transactions near ₹5,00,000",
        "severity": "High"
      },
      {
        "signal": "Recent Registration",
        "evidence": "Business entity registered 2 weeks ago",
        "severity": "Medium"
      }
    ],
    "history": [
      {
        "timestamp": "2026-06-02T12:00:00Z",
        "score_change": -120,
        "narrative": "System detected critical fraud patterns and circular transactions.",
        "type": "penalty"
      }
    ]
  }'::jsonb
WHERE id = '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d';

-- Seed wallet transactions for Rapid Supplies Enterprise
INSERT INTO public.wallet_transactions (id, user_id, amount, type, description, created_at)
VALUES 
  (gen_random_uuid(), '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d', 495000, 'ADD', 'Electronics supply - ABC Traders (TXN-900111)', '2026-05-01T10:00:00Z'),
  (gen_random_uuid(), '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d', 510000, 'ADD', 'Electronics supply - XYZ Solutions (TXN-900112)', '2026-05-02T11:00:00Z'),
  (gen_random_uuid(), '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d', 489000, 'ADD', 'Electronics supply - PQR Services (TXN-900113)', '2026-05-02T16:30:00Z'),
  (gen_random_uuid(), '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d', 505000, 'ADD', 'Electronics supply - LMN Enterprises (TXN-900114)', '2026-05-03T10:00:00Z'),
  (gen_random_uuid(), '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d', 498000, 'ADD', 'Electronics supply - OPQ Global (TXN-900115)', '2026-05-04T14:15:00Z');


--------------------------------------------------------------------------------
-- 3. SEED VENDOR: Goel Logistics (Secondary Vendor for Lender Portfolio Diversity)
--------------------------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', '6f6f6f6f-6f6f-6f6f-6f6f-6f6f6f6f6f6f',
  'authenticated', 'authenticated', 'goel@vendorpass.com', crypt('Password123!', gen_salt('bf')),
  now() - interval '8 months', '{"provider":"email","providers":["email"]}',
  '{"name": "Goel Logistics", "username": "goel_logistics", "phone": "+919876543233", "role": "VENDOR", "selfie": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop", "businessPhoto": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=300&auto=format&fit=crop", "score": 520}',
  now() - interval '8 months', now() - interval '8 months', '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  '6f6f6f6f-6f6f-6f6f-6f6f-6f6f6f6f6f6f', '6f6f6f6f-6f6f-6f6f-6f6f-6f6f6f6f6f6f',
  'goel@vendorpass.com', '{"sub":"6f6f6f6f-6f6f-6f6f-6f6f-6f6f6f6f6f6f","email":"goel@vendorpass.com"}',
  'email', now(), now() - interval '8 months', now() - interval '8 months'
);

UPDATE public.profiles
SET score = 520, created_at = now() - interval '8 months'
WHERE id = '6f6f6f6f-6f6f-6f6f-6f6f-6f6f6f6f6f6f';


--------------------------------------------------------------------------------
-- 4. SEED VENDOR: Rajesh Kumar (Third Vendor for Lender Portfolio Diversity)
--------------------------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a',
  'authenticated', 'authenticated', 'goodvendor@vendorpass.com', crypt('Password123!', gen_salt('bf')),
  now() - interval '7 months', '{"provider":"email","providers":["email"]}',
  '{"name": "Rajesh Kumar", "username": "rajesh_kirana", "phone": "+919876543210", "role": "VENDOR", "selfie": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop", "businessPhoto": "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=300&auto=format&fit=crop", "score": 680}',
  now() - interval '7 months', now() - interval '7 months', '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a',
  'goodvendor@vendorpass.com', '{"sub":"1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a","email":"goodvendor@vendorpass.com"}',
  'email', now(), now() - interval '7 months', now() - interval '7 months'
);

UPDATE public.profiles
SET score = 680, created_at = now() - interval '7 months'
WHERE id = '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a';


--------------------------------------------------------------------------------
-- 5. SEED LENDER: Apex Credit Fund (Lender, High Portfolio)
--------------------------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', '5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e',
  'authenticated', 'authenticated', 'lender@vendorpass.com', crypt('Password123!', gen_salt('bf')),
  now() - interval '9 months', '{"provider":"email","providers":["email"]}',
  '{"name": "Apex Credit Fund", "username": "apex_credit", "phone": "+919999922222", "role": "LENDER", "selfie": "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop", "businessPhoto": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=300&auto=format&fit=crop", "score": 0}',
  now() - interval '9 months', now() - interval '9 months', '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  '5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e', '5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e',
  'lender@vendorpass.com', '{"sub":"5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e","email":"lender@vendorpass.com"}',
  'email', now(), now() - interval '9 months', now() - interval '9 months'
);

UPDATE public.profiles
SET role = 'LENDER', created_at = now() - interval '9 months'
WHERE id = '5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e';


--------------------------------------------------------------------------------
-- 6. SEED LOANS (To populate Lender's portfolio)
--------------------------------------------------------------------------------
-- Loan 1: Active Loan to GreenLeaf Fresh Produce (Removed as per requirements)
--------------------------------------------------------------------------------

-- Loan 2: Closed/Fully Paid Loan to Rajesh Kumar
-- Principal: ₹2,00,000, 12% Interest, 6 Months. Total payback: ₹2,24,000.
-- Accepted 7 months ago. Amount Paid: ₹2,24,000. Status: ACCEPTED.
INSERT INTO public.loan_offers (
  id, lender_id, vendor_id, amount, interest_rate, tenure, status, created_by, created_at, accepted_at, amount_paid
) VALUES (
  gen_random_uuid(), '5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e', '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a',
  200000, 12, '6 Months', 'ACCEPTED', 'LENDER', now() - interval '7 months', now() - interval '7 months', 224000
);

-- Loan 3: Overdue Loan to Goel Logistics (Delinquent progress)
-- Principal: ₹5,00,000, 14% Interest, 12 Months. Total payback: ₹5,70,000. EMI: ₹47,500.
-- Accepted 8 months ago. Amount Paid: ₹95,000 (only 2 EMIs paid). Status: ACCEPTED.
INSERT INTO public.loan_offers (
  id, lender_id, vendor_id, amount, interest_rate, tenure, status, created_by, created_at, accepted_at, amount_paid
) VALUES (
  gen_random_uuid(), '5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e', '6f6f6f6f-6f6f-6f6f-6f6f-6f6f6f6f6f6f',
  500000, 14, '12 Months', 'ACCEPTED', 'LENDER', now() - interval '8 months', now() - interval '8 months', 95000
);

-- Re-enable the trigger
ALTER TABLE public.wallet_transactions ENABLE TRIGGER on_wallet_transaction;
