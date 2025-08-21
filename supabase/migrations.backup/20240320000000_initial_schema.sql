-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  website text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create funding_pages table
create table public.funding_pages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  bitcoin_address text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_verified boolean default false not null,
  verification_level integer default 0 not null,
  is_public boolean default true not null
);

-- Create transactions table
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  funding_page_id uuid references public.funding_pages(id) on delete cascade not null,
  amount numeric not null,
  transaction_hash text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text check (status in ('pending', 'confirmed', 'failed')) not null
);

-- Create indexes
create index profiles_username_idx on public.profiles(username);
create index funding_pages_user_id_idx on public.funding_pages(user_id);
create index funding_pages_created_at_idx on public.funding_pages(created_at);
create index transactions_funding_page_id_idx on public.transactions(funding_page_id);
create index transactions_created_at_idx on public.transactions(created_at);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.funding_pages enable row level security;
alter table public.transactions enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

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

create policy "Users can create funding pages"
  on public.funding_pages for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own funding pages"
  on public.funding_pages for update
  using (auth.uid() = user_id);

create policy "Users can delete their own funding pages"
  on public.funding_pages for delete
  using (auth.uid() = user_id);

-- Transactions policies
create policy "Users can view transactions for their funding pages"
  on public.transactions for select
  using (
    exists (
      select 1 from public.funding_pages
      where funding_pages.id = transactions.funding_page_id
      and funding_pages.user_id = auth.uid()
    )
  );

create policy "Users can create transactions for their funding pages"
  on public.transactions for insert
  with check (
    exists (
      select 1 from public.funding_pages
      where funding_pages.id = transactions.funding_page_id
      and funding_pages.user_id = auth.uid()
    )
  );

-- Create function to handle profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 