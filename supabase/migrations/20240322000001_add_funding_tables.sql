-- Create funding_pages table
create table public.funding_pages (
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
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  funding_page_id uuid references public.funding_pages on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  amount decimal not null,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on new tables
alter table public.funding_pages enable row level security;
alter table public.transactions enable row level security;

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