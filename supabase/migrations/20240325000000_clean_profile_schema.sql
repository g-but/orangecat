-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables if they exist
drop table if exists public.transactions;
drop table if exists public.funding_pages;
drop table if exists public.profiles;

-- Create profiles table
create table public.profiles (
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

-- Create funding_pages table
create table public.funding_pages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  bitcoin_address text not null,
  is_active boolean default true not null,
  is_public boolean default true not null,
  total_funding decimal default 0 not null,
  contributor_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create transactions table
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  funding_page_id uuid references public.funding_pages on delete cascade not null,
  amount decimal not null,
  transaction_hash text not null,
  status text check (status in ('pending', 'confirmed', 'failed')) default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.funding_pages enable row level security;
alter table public.transactions enable row level security;

-- Profiles policies
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Funding pages policies
create policy "Public funding pages are viewable by everyone"
  on public.funding_pages for select
  using (is_public = true);

create policy "Users can view their own funding pages"
  on public.funding_pages for select
  using (auth.uid() = user_id);

create policy "Users can create their own funding pages"
  on public.funding_pages for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own funding pages"
  on public.funding_pages for update
  using (auth.uid() = user_id);

-- Transactions policies
create policy "Public transactions are viewable by everyone"
  on public.transactions for select
  using (true);

create policy "Users can create transactions"
  on public.transactions for insert
  with check (true);

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
exception
  when others then
    raise warning 'Error creating profile for user %: %', new.id, SQLERRM;
    return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 