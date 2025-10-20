-- Organization wallets for HD address derivation
-- Creates wallets and wallet_addresses tables for xpub/descriptor-based receipt addresses

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  -- Read-only material for deriving addresses
  xpub text,
  descriptor text,
  network text not null default 'mainnet', -- 'mainnet' | 'testnet' | 'regtest'
  next_index_receive integer not null default 0,
  next_index_change integer not null default 0,
  gap_limit integer not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallets_org_unique unique (organization_id)
);

create table if not exists public.wallet_addresses (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  idx integer not null,
  addr_type text not null check (addr_type in ('receive','change')),
  address text not null,
  campaign_id uuid null references public.campaigns(id) on delete set null,
  status text not null default 'allocated', -- allocated | used | retired
  created_at timestamptz not null default now(),
  constraint wallet_addresses_unique unique (wallet_id, addr_type, idx),
  constraint wallet_addresses_address_unique unique (address)
);

-- Simple updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_wallets_updated_at on public.wallets;
create trigger set_wallets_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

-- NOTE: RLS policies should be added to scope access to org owners/admins only.
-- Example (adjust to your roles/tables):
-- alter table public.wallets enable row level security;
-- create policy org_wallet_read on public.wallets
--   for select using (exists (
--     select 1 from public.memberships m
--     where m.organization_id = wallets.organization_id
--       and m.profile_id = auth.uid()
--       and m.status = 'active'
--   ));
-- create policy org_wallet_write on public.wallets
--   for all using (exists (
--     select 1 from public.memberships m
--     where m.organization_id = wallets.organization_id
--       and m.profile_id = auth.uid()
--       and m.role in ('owner','admin')
--       and m.status = 'active'
--   ));

