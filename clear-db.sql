-- SQL script to clear all data in the database for a fresh start.
-- Run this in your Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/zzbpemhcccwmdlikztse/sql/new)

-- Disable triggers temporarily to avoid side effects during bulk delete
SET session_replication_role = 'replica';

-- Delete all users (cascades to profiles, wallet_transactions, watchlists, loan_offers, notifications, public_loan_requests)
TRUNCATE auth.users CASCADE;

-- Clear storage metadata for uploaded files
TRUNCATE storage.objects CASCADE;

-- Reset session replication role to default
SET session_replication_role = 'origin';

-- Verify counts (should all return 0)
SELECT 
  (SELECT count(*) FROM auth.users) as auth_users_count,
  (SELECT count(*) FROM public.profiles) as profiles_count,
  (SELECT count(*) FROM public.wallet_transactions) as transactions_count,
  (SELECT count(*) FROM public.loan_offers) as loan_offers_count,
  (SELECT count(*) FROM public.public_loan_requests) as loan_requests_count,
  (SELECT count(*) FROM public.notifications) as notifications_count,
  (SELECT count(*) FROM public.watchlists) as watchlists_count,
  (SELECT count(*) FROM storage.objects) as storage_objects_count;
