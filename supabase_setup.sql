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

