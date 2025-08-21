-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text,
  display_name text,
  website text,
  description text,
  bitcoin_address text,
  lightning_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create funding_pages table
create table if not exists public.funding_pages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  goal_amount decimal not null,
  current_amount decimal default 0,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create transactions table
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  funding_page_id uuid references public.funding_pages on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  amount decimal not null,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.funding_pages enable row level security;
alter table public.transactions enable row level security;

-- Basic policies for profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Policies for funding_pages
create policy "Funding pages are viewable by everyone"
  on public.funding_pages for select
  using (true);

create policy "Users can create their own funding pages"
  on public.funding_pages for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own funding pages"
  on public.funding_pages for update
  using (auth.uid() = user_id);

-- Policies for transactions
create policy "Transactions are viewable by everyone"
  on public.transactions for select
  using (true);

create policy "Users can create transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, username, display_name)
  values (new.id, new.email, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 