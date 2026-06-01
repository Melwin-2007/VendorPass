-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up any existing records with our predictable IDs to allow multiple resets
DELETE FROM auth.identities WHERE user_id IN ('1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b');
DELETE FROM auth.users WHERE id IN ('1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b');

-- 1. Insert Good Vendor Rajesh Kumar (Created 6 months ago)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a',
  'authenticated',
  'authenticated',
  'goodvendor@vendorpass.com',
  crypt('Password123!', gen_salt('bf')),
  now() - interval '6 months',
  '{"provider":"email","providers":["email"]}',
  '{"name": "Rajesh Kumar", "username": "rajesh_kirana", "phone": "+919876543210", "role": "VENDOR", "selfie": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop", "businessPhoto": "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=300&auto=format&fit=crop", "score": 780}',
  now() - interval '6 months',
  now() - interval '6 months',
  '',
  '',
  '',
  ''
);

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a',
  '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a',
  'goodvendor@vendorpass.com',
  '{"sub":"1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a","email":"goodvendor@vendorpass.com"}',
  'email',
  now(),
  now() - interval '6 months',
  now() - interval '6 months'
);

-- 2. Insert Bad Vendor Fast Cash Traders (Created 10 days ago)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b',
  'authenticated',
  'authenticated',
  'badvendor@vendorpass.com',
  crypt('Password123!', gen_salt('bf')),
  now() - interval '10 days',
  '{"provider":"email","providers":["email"]}',
  '{"name": "Fast Cash Traders", "username": "fast_cash_fake", "phone": "+919999988888", "role": "VENDOR", "selfie": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop", "businessPhoto": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=300&auto=format&fit=crop", "score": 450}',
  now() - interval '10 days',
  now() - interval '10 days',
  '',
  '',
  '',
  ''
);

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b',
  '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b',
  'badvendor@vendorpass.com',
  '{"sub":"2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b","email":"badvendor@vendorpass.com"}',
  'email',
  now(),
  now() - interval '10 days',
  now() - interval '10 days'
);

-- 3. Update profiles for both vendors with exact scores, created_at, and trustScoreData
UPDATE public.profiles
SET 
  score = 780,
  created_at = now() - interval '6 months',
  trust_score_data = '{
    "vendor_id": "1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a",
    "score_date": "2026-06-01",
    "trust_score": 780,
    "risk_tier": "Low Risk",
    "classification_badge": "PLATINUM - HIGH ELIGIBILITY",
    "default_probability": "1.2%",
    "recommended_loan_limit": "₹2,50,000",
    "recommended_interest_band": "11% - 13% p.a.",
    "repayment_frequency_suggestion": "Monthly",
    "pillar_scores": {
      "income_stability": 85,
      "cash_flow_health": 80,
      "business_regularity": 82,
      "payment_discipline": 90,
      "digital_adoption": 75,
      "risk_signals": 95
    },
    "score_explanation": "Consistent income and solid financial discipline over 6 months.",
    "key_findings": {
      "financial_integrity": [
        "Consistent daily business revenues.",
        "Clear business transactions with regular suppliers."
      ],
      "behavioral_indicators": [
        "Strong digital payment adoption.",
        "Zero overdue payments on record."
      ],
      "compliance_gaps": []
    },
    "risk_signals_table": [],
    "history": [
      {
        "timestamp": "2026-06-01T12:00:00Z",
        "score_change": 15,
        "narrative": "Consistent sales growth and timely utility bill payments.",
        "type": "reward"
      }
    ]
  }'::jsonb
WHERE id = '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a';

UPDATE public.profiles
SET 
  score = 450,
  created_at = now() - interval '10 days',
  trust_score_data = '{
    "vendor_id": "2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b",
    "score_date": "2026-06-01",
    "trust_score": 450,
    "risk_tier": "High Risk",
    "classification_badge": "CRITICAL - HIGH DEFAULT PROBABILITY",
    "default_probability": "42%",
    "recommended_loan_limit": "₹5,000",
    "recommended_interest_band": "24% - 30% p.a.",
    "repayment_frequency_suggestion": "Weekly",
    "pillar_scores": {
      "income_stability": 30,
      "cash_flow_health": 35,
      "business_regularity": 40,
      "payment_discipline": 25,
      "digital_adoption": 50,
      "risk_signals": 20
    },
    "score_explanation": "Highly irregular cash flow, stacking loans, and suspicious counterparty transactions.",
    "key_findings": {
      "financial_integrity": [
        "Irregular, round-number credits suggesting non-business funding.",
        "Multiple cash outlaws in quick succession."
      ],
      "behavioral_indicators": [
        "Multiple repayments to online credit apps (loan stacking).",
        "Suspicious counterparties including gambling sites."
      ],
      "compliance_gaps": [
        "No utility payments, no supplier invoices."
      ]
    },
    "risk_signals_table": [
      {
        "signal": "Loan Stacking",
        "evidence": "3 active payday loans in parallel",
        "severity": "Critical"
      },
      {
        "signal": "Suspicious Outflows",
        "evidence": "Recurring payments to ''WinBig Gambling''",
        "severity": "High"
      }
    ],
    "history": [
      {
        "timestamp": "2026-06-01T12:00:00Z",
        "score_change": -35,
        "narrative": "Detected multiple micro-lending apps query hits and direct debit failures.",
        "type": "penalty"
      }
    ]
  }'::jsonb
WHERE id = '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b';

-- 5. Seed Wallet Transactions (Trigger runs normally to calculate/verify score at startup)
-- Rajesh Kumar (Good Vendor) - Monthly spaced transactions spanning 5 months
INSERT INTO public.wallet_transactions (id, user_id, amount, type, description, created_at)
VALUES 
  (gen_random_uuid(), '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', 85000, 'ADD', 'Monthly Store Revenue - Cash & UPI', now() - interval '5 months'),
  (gen_random_uuid(), '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', 92000, 'ADD', 'Monthly Store Revenue - Cash & UPI', now() - interval '4 months'),
  (gen_random_uuid(), '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', 78000, 'ADD', 'Monthly Store Revenue - Cash & UPI', now() - interval '3 months'),
  (gen_random_uuid(), '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', 95000, 'ADD', 'Monthly Store Revenue - Cash & UPI', now() - interval '2 months'),
  (gen_random_uuid(), '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', 88000, 'ADD', 'Monthly Store Revenue - Cash & UPI', now() - interval '1 month'),
  (gen_random_uuid(), '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', 15000, 'SEND', 'Supplier Invoice - Kirana Distributors', now() - interval '1 month'),
  (gen_random_uuid(), '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', 3500, 'SEND', 'Electricity Bill Payment - BSES', now() - interval '1 month'),
  (gen_random_uuid(), '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', 98000, 'ADD', 'Monthly Store Revenue - Cash & UPI', now());

-- Fast Cash Traders (Bad Vendor) - Spaced suspicious/irregular transactions
INSERT INTO public.wallet_transactions (id, user_id, amount, type, description, created_at)
VALUES 
  (gen_random_uuid(), '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b', 5000, 'ADD', 'Direct Deposit', now() - interval '10 days'),
  (gen_random_uuid(), '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b', 12000, 'ADD', 'Instant Loan Disbursement - QuickCash', now() - interval '8 days'),
  (gen_random_uuid(), '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b', 8000, 'SEND', 'Online Settlement - WinBig Casino', now() - interval '7 days'),
  (gen_random_uuid(), '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b', 15000, 'ADD', 'Disbursement - Payday Cash App', now() - interval '6 days'),
  (gen_random_uuid(), '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b', 4500, 'SEND', 'Repayment - QuickCash EMI', now() - interval '5 days'),
  (gen_random_uuid(), '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b', 6200, 'SEND', 'Repayment - Payday Cash EMI', now() - interval '3 days'),
  (gen_random_uuid(), '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b', 10000, 'SEND', 'Cash Withdrawal - self', now() - interval '2 days');
