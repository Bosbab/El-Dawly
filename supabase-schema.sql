-- =============================================================
-- EL DAWLY - Supabase products table (v2 - simplified)
-- Run in: Supabase Dashboard -> SQL Editor -> New query
-- Make sure the selected database is your project's main DB.
-- You should see "Success. No rows returned" after running.
-- =============================================================

-- Drop the old table if it exists (so we always start clean)
drop table if exists public.products;

-- Create the table
create table public.products (
  id bigint primary key,
  name text not null,
  category text not null,
  price numeric not null,
  description text not null,
  stock integer not null,
  sizes jsonb not null default '[]'::jsonb,
  image text,
  emoji text default '👟',
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz
);

-- Enable Row Level Security
alter table public.products enable row level security;

-- Explicitly grant privileges to anon & authenticated roles (some projects
-- need this for the table to be exposed via PostgREST)
grant usage on schema public to anon, authenticated, service_role;
grant all on public.products to anon, authenticated, service_role;

-- Policies: allow anon & authenticated full access
create policy "enable all for anon" on public.products
  for all using (true) with check (true);

-- Force PostgREST to reload its schema cache so the new table is
-- immediately visible to the REST API (fixes PGRST205 on a fresh table).
select pg_notify('pgrst', 'reload schema');

-- Verify the table exists
select 'table exists' as status, count(*) as total_tables
from information_schema.tables
where table_schema = 'public' and table_name = 'products';
