-- Allow all authenticated users to read lender and bank profiles
create policy "Allow all authenticated users to read lender and bank profiles"
on public.profiles
for select
to authenticated
using ( role in ('LENDER', 'BANK') );

-- Allow vendors to update their received loan offers
create policy "Allow vendors to update their received loan offers"
on public.loan_offers
for update
to authenticated
using ( (select auth.uid()) = vendor_id )
with check ( (select auth.uid()) = vendor_id );
