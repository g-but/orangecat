-- Organizations schema for OrangeCat
-- Creates core organizations and memberships with RLS

create extension if not exists "uuid-ossp";

-- Organizations table
create table if not exists public.organizations (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  avatar_url text,
  banner_url text,
  website_url text,
  type text not null default 'foundation',
  category text,
  tags text[] not null default '{}',
  governance_model text not null default 'hierarchical',
  treasury_address text,
  treasury_balance bigint not null default 0,
  is_public boolean not null default true,
  requires_approval boolean not null default false,
  contact_info jsonb not null default '{}',
  settings jsonb not null default '{}',
  member_count integer not null default 0,
  campaign_count integer not null default 0,
  total_funding bigint not null default 0,
  trust_score integer not null default 0,
  status text not null default 'active',
  founded_at timestamptz,
  dissolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizations_slug_idx on public.organizations(slug);
create index if not exists organizations_type_idx on public.organizations(type);
create index if not exists organizations_public_idx on public.organizations(is_public);

alter table public.organizations enable row level security;

-- View policy
create policy if not exists organizations_select_all
  on public.organizations for select
  using (is_public = true or auth.uid() = profile_id);

-- Insert policy (creator is the current user)
create policy if not exists organizations_insert_own
  on public.organizations for insert
  with check (auth.uid() = profile_id);

-- Update policy (owner-only for now)
create policy if not exists organizations_update_owner
  on public.organizations for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- Memberships table
create table if not exists public.organization_memberships (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  title text,
  bio text,
  permissions jsonb not null default '{}',
  joined_at timestamptz not null default now(),
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create index if not exists org_memberships_org_idx on public.organization_memberships(organization_id);
create index if not exists org_memberships_profile_idx on public.organization_memberships(profile_id);

alter table public.organization_memberships enable row level security;

create policy if not exists org_memberships_select_member
  on public.organization_memberships for select
  using (auth.uid() = profile_id);

create policy if not exists org_memberships_insert_self
  on public.organization_memberships for insert
  with check (auth.uid() = profile_id);

create policy if not exists org_memberships_update_self
  on public.organization_memberships for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

