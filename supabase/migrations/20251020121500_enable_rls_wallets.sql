-- Enable RLS and add policies for wallets and wallet_addresses

alter table public.wallets enable row level security;
alter table public.wallet_addresses enable row level security;

-- Read: active org members can read
create policy wallets_read on public.wallets
  for select using (
    exists (
      select 1 from public.memberships m
      where m.organization_id = wallets.organization_id
        and m.profile_id = auth.uid()
        and m.status = 'active'
    )
  );

create policy wallet_addresses_read on public.wallet_addresses
  for select using (
    exists (
      select 1 from public.wallets w
      join public.memberships m on m.organization_id = w.organization_id
      where w.id = wallet_addresses.wallet_id
        and m.profile_id = auth.uid()
        and m.status = 'active'
    )
  );

-- Write: only owner/admin active members
create policy wallets_write on public.wallets
  for all using (
    exists (
      select 1 from public.memberships m
      where m.organization_id = wallets.organization_id
        and m.profile_id = auth.uid()
        and m.role in ('owner','admin')
        and m.status = 'active'
    )
  );

create policy wallet_addresses_write on public.wallet_addresses
  for all using (
    exists (
      select 1 from public.wallets w
      join public.memberships m on m.organization_id = w.organization_id
      where w.id = wallet_addresses.wallet_id
        and m.profile_id = auth.uid()
        and m.role in ('owner','admin')
        and m.status = 'active'
    )
  );

