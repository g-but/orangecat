-- Initial schema for OrangeCat Bitcoin Crowdfunding Platform
-- This creates the basic tables needed for authentication and profile management

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  banner_url text,
  bio text,
  website text,
  bitcoin_address text,
  lightning_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create campaigns table  
create table if not exists public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  goal_amount numeric(20,8),
  raised_amount numeric(20,8) default 0,
  bitcoin_address text,
  status text default 'draft' check (status in ('draft', 'active', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Campaigns policies  
create policy "Campaigns are viewable by everyone" on public.campaigns
  for select using (true);

create policy "Users can insert their own campaigns" on public.campaigns
  for insert with check (auth.uid() = user_id);

create policy "Users can update own campaigns" on public.campaigns
  for update using (auth.uid() = user_id);

-- Create function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user registration
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();