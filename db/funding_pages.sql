-- Funding Pages (Campaigns) schema for OrangeCat
-- Creates a minimal campaigns table used by the app/API

create extension if not exists "uuid-ossp";

create table if not exists public.funding_pages (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  slug text unique,
  title text not null,
  description text,
  category text,
  tags text[] not null default '{}',
  goal_btc numeric,
  bitcoin_address text,
  lightning_address text,
  website_url text,
  image_url text,
  is_public boolean not null default true,
  is_active boolean not null default true,
  total_raised numeric not null default 0,
  supporter_count integer not null default 0,
  end_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists funding_pages_creator_idx on public.funding_pages(creator_id);
create index if not exists funding_pages_slug_idx on public.funding_pages(slug);
create index if not exists funding_pages_public_active_idx on public.funding_pages(is_public, is_active);

alter table public.funding_pages enable row level security;

-- View policy (public campaigns)
create policy if not exists funding_pages_select_public
  on public.funding_pages for select
  using (is_public = true);

-- Creator can manage their campaigns
create policy if not exists funding_pages_insert_self
  on public.funding_pages for insert
  with check (auth.uid() = creator_id);

create policy if not exists funding_pages_update_self
  on public.funding_pages for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

