-- 1. Create the profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  username text unique,
  email text,
  phone text,
  role text check (role in ('VENDOR', 'LENDER', 'BANK')),
  selfie text,
  business_photo text,
  score integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Expose the table to the Data API (Required due to the April 2026 Supabase breaking change)
grant usage on schema public to anon, authenticated;
grant all on table public.profiles to anon, authenticated;

-- 3. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 4. Create RLS Policies
-- Allow users to view their own profile
create policy "Allow users to read their own profile"
on public.profiles
for select
to authenticated
using ( (select auth.uid()) = id );

-- Allow users to update their own profile
create policy "Allow users to update their own profile"
on public.profiles
for update
to authenticated
using ( (select auth.uid()) = id )
with check ( (select auth.uid()) = id );

-- Allow Lenders and Banks to view all profiles (needed for the dashboard credit pipelines)
create policy "Allow lenders and banks to read all profiles"
on public.profiles
for select
to authenticated
using (
  (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()) in ('LENDER', 'BANK')
);

-- 5. Create Trigger function to sync new auth signups to profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, username, email, phone, role, selfie, business_photo, score)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'username', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'VENDOR'),
    new.raw_user_meta_data->>'selfie',
    new.raw_user_meta_data->>'businessPhoto',
    coalesce((new.raw_user_meta_data->>'score')::integer, 620)
  );
  return new;
end;
$$;

-- 6. Secure trigger function (Revoke EXECUTE from PUBLIC roles as defense in depth)
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 7. Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Initialize Storage Buckets and Policies for User Documents
-- Create the documents bucket if it does not exist
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Set up policies for the documents bucket
-- Allow public uploads (insert) to documents bucket
create policy "Allow public uploads to documents"
on storage.objects
for insert
to public
with check (bucket_id = 'documents');

-- Allow public read (select) from documents bucket
create policy "Allow public read from documents"
on storage.objects
for select
to public
using (bucket_id = 'documents');

-- 9. Create Wallet Transactions Table
create table public.wallet_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null,
  type text check (type in ('ADD', 'SEND')) not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Expose to data API
grant all on table public.wallet_transactions to anon, authenticated;

-- Row Level Security
alter table public.wallet_transactions enable row level security;

create policy "Allow users to read their own wallet transactions"
on public.wallet_transactions for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Allow users to insert their own wallet transactions"
on public.wallet_transactions for insert to authenticated
with check ((select auth.uid()) = user_id);

-- 10. Add trust_score_data to profiles
alter table public.profiles add column if not exists trust_score_data jsonb;

-- 11. Create Webhook for TrustScore Engine
-- This trigger will call the edge function whenever a new transaction is recorded
create or replace function public.invoke_trust_score_calculation()
returns trigger
language plpgsql
security definer
as $$
declare
  endpoint_url text := current_setting('app.settings.edge_function_url', true);
  auth_key text := current_setting('app.settings.edge_function_key', true);
begin
  -- For local testing or if the variable isn't set, we might need a fallback or just skip
  -- In production, the URL and Key must be set in the database parameters
  if endpoint_url is null then
    return new;
  end if;

  perform net.http_post(
    url := endpoint_url || '/calculate_trust_score',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || auth_key
    ),
    body := jsonb_build_object('record', row_to_json(new))
  );
  return new;
end;
$$;

drop trigger if exists on_wallet_transaction on public.wallet_transactions;
create trigger on_wallet_transaction
  after insert on public.wallet_transactions
  for each row execute procedure public.invoke_trust_score_calculation();

-- 12. Add funding_status to profiles for realtime tracking
alter table public.profiles add column if not exists funding_status text default 'LOOKING_FOR_FUNDS' check (funding_status in ('LOOKING_FOR_FUNDS', 'FUNDED'));

-- 13. Create watchlists table for Lenders
create table public.watchlists (
  id uuid default gen_random_uuid() primary key,
  lender_id uuid references public.profiles(id) on delete cascade not null,
  vendor_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(lender_id, vendor_id)
);

grant all on table public.watchlists to anon, authenticated;
alter table public.watchlists enable row level security;

create policy "Allow lenders to manage their watchlists"
on public.watchlists for all to authenticated
using ((select auth.uid()) = lender_id)
with check ((select auth.uid()) = lender_id);

-- 14. Create loan_offers table
create table public.loan_offers (
  id uuid default gen_random_uuid() primary key,
  lender_id uuid references public.profiles(id) on delete cascade not null,
  vendor_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null,
  interest_rate numeric not null,
  tenure text not null,
  status text default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'DECLINED')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

grant all on table public.loan_offers to anon, authenticated;
alter table public.loan_offers enable row level security;

create policy "Allow lenders to manage their loan offers"
on public.loan_offers for all to authenticated
using ((select auth.uid()) = lender_id)
with check ((select auth.uid()) = lender_id);

create policy "Allow vendors to view their received loan offers"
on public.loan_offers for select to authenticated
using ((select auth.uid()) = vendor_id);

-- 15. Enable Realtime on tables
-- Drop existing publication if it exists to recreate it
drop publication if exists supabase_realtime cascade;
create publication supabase_realtime;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.loan_offers;
