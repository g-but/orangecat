# Database Schema Documentation

## Overview
The Orange Cat platform uses a hierarchical structure to support user profiles and their associated project funding pages. This document outlines the database schema and relationships.

## Tables

### 1. User Profiles (`user_profiles`)
Stores basic user information and profile settings.

```sql
create table user_profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  bio text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table user_profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone"
  on user_profiles for select
  using (true);

create policy "Users can update their own profile"
  on user_profiles for update
  using (auth.uid() = id);
```

### 2. Project Funding Pages (`project_funding_pages`)
Stores individual project funding pages associated with user profiles.

```sql
create table project_funding_pages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references user_profiles(id) on delete cascade not null,
  project_name text not null,
  description text not null,
  bitcoin_address text not null,
  lightning_address text,
  transparency_score integer default 0,
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table project_funding_pages enable row level security;

-- Create policies
create policy "Public projects are viewable by everyone"
  on project_funding_pages for select
  using (is_public = true);

create policy "Users can view their own projects"
  on project_funding_pages for select
  using (auth.uid() = user_id);

create policy "Users can create their own projects"
  on project_funding_pages for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own projects"
  on project_funding_pages for update
  using (auth.uid() = user_id);
```

### 3. Project Transactions (`project_transactions`)
Stores transaction history for each project.

```sql
create table project_transactions (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references project_funding_pages(id) on delete cascade not null,
  amount numeric not null,
  type text check (type in ('incoming', 'outgoing')) not null,
  status text check (status in ('confirmed', 'pending')) not null,
  timestamp timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table project_transactions enable row level security;

-- Create policies
create policy "Transactions are viewable by project owners"
  on project_transactions for select
  using (
    exists (
      select 1 from project_funding_pages
      where project_funding_pages.id = project_transactions.project_id
      and project_funding_pages.user_id = auth.uid()
    )
  );
```

## TypeScript Types

```typescript
// User Profile
interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Project Funding Page
interface ProjectFundingPage {
  id: string;
  user_id: string;
  project_name: string;
  description: string;
  bitcoin_address: string;
  lightning_address: string | null;
  transparency_score: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Project Transaction
interface ProjectTransaction {
  id: string;
  project_id: string;
  amount: number;
  type: 'incoming' | 'outgoing';
  status: 'confirmed' | 'pending';
  timestamp: string;
  created_at: string;
}
```

## Relationships

1. **User Profile to Projects**:
   - One-to-many relationship
   - A user can have multiple project funding pages
   - Projects are linked to users via `user_id`

2. **Project to Transactions**:
   - One-to-many relationship
   - A project can have multiple transactions
   - Transactions are linked to projects via `project_id`

## Security Considerations

1. **Row Level Security (RLS)**:
   - Enabled on all tables
   - Public profiles and projects are viewable by everyone
   - Users can only modify their own profiles and projects
   - Transactions are only viewable by project owners

2. **Data Validation**:
   - Bitcoin address format validation
   - Lightning address format validation
   - Transaction type and status constraints
   - Required fields enforcement

## API Endpoints

1. **User Profile**:
   - GET `/api/profiles/[username]`
   - PUT `/api/profiles/[username]`

2. **Project Funding Pages**:
   - GET `/api/projects/[projectId]`
   - POST `/api/projects`
   - PUT `/api/projects/[projectId]`
   - DELETE `/api/projects/[projectId]`

3. **Project Transactions**:
   - GET `/api/projects/[projectId]/transactions`
   - POST `/api/projects/[projectId]/transactions`

## Next Steps

1. Implement database migrations
2. Set up TypeScript types
3. Create API endpoints
4. Build frontend components
5. Implement form validation
6. Add transaction tracking
7. Set up transparency score calculation 