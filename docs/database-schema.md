# Database Schema Documentation

## Overview
This document describes the database schema for the OrangeCat crowdfunding platform. The database uses Supabase as the backend and includes tables for user profiles, funding pages, and transactions.

## Tables

### Profiles
Stores user profile information.

| Column          | Type      | Nullable | Description                               |
|-----------------|-----------|----------|-------------------------------------------|
| id              | uuid      | No       | Primary key, references `auth.users.id`   |
| username        | text      | Yes      | User-chosen unique username               |
| display_name    | text      | Yes      | User's display name                       |
| avatar_url      | text      | Yes      | URL to profile picture                    |
| bio             | text      | Yes      | Short user biography                      |
| bitcoin_address | text      | Yes      | User's Bitcoin address for donations    |
| created_at      | timestamp | No       | Record creation timestamp (UTC)           |
| updated_at      | timestamp | No       | Last update timestamp (UTC)               |

### Funding Pages
Stores crowdfunding campaign information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| title | text | Campaign title |
| description | text | Campaign description |
| goal_amount | decimal | Target funding amount |
| current_amount | decimal | Current amount raised |
| status | text | Campaign status (active/inactive) |
| created_at | timestamp | Record creation timestamp |
| updated_at | timestamp | Last update timestamp |

### Transactions
Records donations and transactions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| funding_page_id | uuid | References funding_pages |
| user_id | uuid | References auth.users |
| amount | decimal | Transaction amount |
| status | text | Transaction status (pending/completed) |
| created_at | timestamp | Record creation timestamp |
| updated_at | timestamp | Last update timestamp |

## Row Level Security (RLS) Policies

### Profiles
- Public profiles are viewable by everyone
- Users can update their own profile
- Users can insert their own profile

### Funding Pages
- Funding pages are viewable by everyone
- Users can create their own funding pages
- Users can update their own funding pages

### Transactions
- Transactions are viewable by everyone
- Users can create transactions
- Users can update their own transactions

## Triggers

### User Creation Trigger
When a new user signs up, a profile is automatically created with:
- `id` set to the user's UUID
- `username` set to the user's email
- `created_at` and `updated_at` set to the current timestamp

## Database Setup
The database is initialized with the following steps:
1. Enable UUID extension
2. Create tables (profiles, funding_pages, transactions)
3. Enable Row Level Security
4. Create security policies
5. Set up user creation trigger

## API Access
The database is accessed through Supabase's client library. Environment variables required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## TypeScript Types

```typescript
// Profile (matches src/types/database.ts)
export interface Profile {
  id: string;                  
  username?: string | null;
  display_name: string | null; 
  avatar_url?: string | null;    
  bio: string | null;            
  bitcoin_address: string | null; 
  created_at: string;          
  updated_at: string;          
}

// Project Funding Page
interface ProjectFundingPage {
  id: string;
  user_id: string;
  title: string;
  description: string;
  goal_amount: number;
  current_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// Project Transaction
interface ProjectTransaction {
  id: string;
  funding_page_id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
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
   - Transactions are linked to projects via `funding_page_id`

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