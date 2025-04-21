-- Function to enable UUID extension
create or replace function public.enable_uuid_extension()
returns void as $$
begin
  create extension if not exists "uuid-ossp";
end;
$$ language plpgsql security definer;

-- Function to create profiles table
create or replace function public.create_profiles_table()
returns void as $$
begin
  create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    username text unique,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
end;
$$ language plpgsql security definer;

-- Function to create funding_pages table
create or replace function public.create_funding_pages_table()
returns void as $$
begin
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
end;
$$ language plpgsql security definer;

-- Function to create transactions table
create or replace function public.create_transactions_table()
returns void as $$
begin
  create table if not exists public.transactions (
    id uuid default uuid_generate_v4() primary key,
    funding_page_id uuid references public.funding_pages on delete cascade not null,
    user_id uuid references auth.users on delete cascade not null,
    amount decimal not null,
    status text default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
end;
$$ language plpgsql security definer;

-- Function to enable RLS
create or replace function public.enable_rls(table_name text)
returns void as $$
begin
  execute format('alter table public.%I enable row level security', table_name);
end;
$$ language plpgsql security definer;

-- Function to create profile policies
create or replace function public.create_profile_policies()
returns void as $$
begin
  create policy "Public profiles are viewable by everyone"
    on public.profiles for select
    using (true);

  create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

  create policy "Users can insert their own profile"
    on public.profiles for insert
    with check (auth.uid() = id);
end;
$$ language plpgsql security definer;

-- Function to create funding_pages policies
create or replace function public.create_funding_pages_policies()
returns void as $$
begin
  create policy "Funding pages are viewable by everyone"
    on public.funding_pages for select
    using (true);

  create policy "Users can create their own funding pages"
    on public.funding_pages for insert
    with check (auth.uid() = user_id);

  create policy "Users can update their own funding pages"
    on public.funding_pages for update
    using (auth.uid() = user_id);
end;
$$ language plpgsql security definer;

-- Function to create transactions policies
create or replace function public.create_transactions_policies()
returns void as $$
begin
  create policy "Transactions are viewable by everyone"
    on public.transactions for select
    using (true);

  create policy "Users can create transactions"
    on public.transactions for insert
    with check (auth.uid() = user_id);

  create policy "Users can update their own transactions"
    on public.transactions for update
    using (auth.uid() = user_id);
end;
$$ language plpgsql security definer;

-- Function to create user trigger function
create or replace function public.create_user_trigger_function()
returns void as $$
begin
  create or replace function public.handle_new_user()
  returns trigger as $$
  begin
    insert into public.profiles (id, username)
    values (new.id, new.email);
    return new;
  end;
  $$ language plpgsql security definer;
end;
$$ language plpgsql security definer;

-- Function to create user trigger
create or replace function public.create_user_trigger()
returns void as $$
begin
  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
end;
$$ language plpgsql security definer; 