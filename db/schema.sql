-- Latest migration schema from supabase/migrations/20240325000000_clean_profile_schema.sql
-- This schema should be used for local development and testing

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  bio text,
  avatar_url text,
  bitcoin_address text,
  lightning_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create a function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, created_at, updated_at)
  values (
    new.id,
    new.email,
    split_part(new.email, '@', 1),
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to automatically create a profile for new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create an RPC function for profile updates
create or replace function public.update_profile(profile_data jsonb)
returns jsonb as $$
declare
  result jsonb;
  user_id uuid := auth.uid(); -- Get the current user ID
begin
  -- Verify the user is authenticated
  if user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Verify the user is updating their own profile
  if (profile_data->>'id')::uuid != user_id then
    raise exception 'Cannot update another user''s profile';
  end if;

  -- Perform the update
  update public.profiles
  set 
    username = coalesce(profile_data->>'username', username),
    display_name = coalesce(profile_data->>'display_name', display_name),
    bio = coalesce(profile_data->>'bio', bio),
    bitcoin_address = coalesce(profile_data->>'bitcoin_address', bitcoin_address),
    lightning_address = coalesce(profile_data->>'lightning_address', lightning_address),
    avatar_url = coalesce(profile_data->>'avatar_url', avatar_url),
    updated_at = now()
  where id = user_id
  returning to_jsonb(profiles.*) into result;

  return result;
end;
$$ language plpgsql security definer; 