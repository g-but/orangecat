-- Create roles enum
create type public.user_role as enum ('admin', 'user', 'moderator');

-- Add role column to profiles
alter table public.profiles
add column role public.user_role not null default 'user';

-- Create role-based policies
create policy "Admins can do everything"
  on public.profiles
  for all
  using (auth.uid() = id or (select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Moderators can view all profiles"
  on public.profiles
  for select
  using ((select role from public.profiles where id = auth.uid()) = 'moderator');

-- Update existing policies to consider roles
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id or (select role from public.profiles where id = auth.uid()) = 'admin');

-- Add admin user function
create or replace function public.make_admin(user_id uuid)
returns void as $$
begin
  update public.profiles
  set role = 'admin'
  where id = user_id;
end;
$$ language plpgsql security definer; 