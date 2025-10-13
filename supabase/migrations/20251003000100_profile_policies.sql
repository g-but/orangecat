-- Ensure BTC address columns exist
alter table if exists public.profiles
  add column if not exists bitcoin_address text,
  add column if not exists lightning_address text;

-- Enable RLS
alter table if exists public.profiles enable row level security;

-- Allow users to select public profiles
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_public'
  ) then
    create policy profiles_select_public on public.profiles
      for select using (true);
  end if;
end $$;

-- Allow authenticated users to insert their own profile
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_insert_own'
  ) then
    create policy profiles_insert_own on public.profiles
      for insert with check (auth.uid() = id);
  end if;
end $$;

-- Allow users to update their own profile
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_update_own'
  ) then
    create policy profiles_update_own on public.profiles
      for update using (auth.uid() = id);
  end if;
end $$;

-- Optional: prevent updates to username by others (guard in application too)
-- You can refine with column-level policies if needed.
