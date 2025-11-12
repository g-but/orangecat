# 🏗️ OrangeCat Supabase Database Schema Guide

## Overview

This document explains the complete database structure for OrangeCat, how authentication works, and how all the pieces fit together. This is your single source of truth for understanding the backend system.

## 🗄️ Database Tables

### 1. `auth.users` (Supabase Built-in)

This is Supabase's built-in authentication table that stores user account information.

**Purpose**: Core authentication and user management
**Managed by**: Supabase Auth service (automatic)

| Column               | Type      | Description                          |
| -------------------- | --------- | ------------------------------------ |
| `id`                 | uuid      | Primary key, automatically generated |
| `email`              | text      | User's email address                 |
| `created_at`         | timestamp | When account was created             |
| `last_sign_in_at`    | timestamp | Last login time                      |
| `email_confirmed_at` | timestamp | Email verification status            |

### 2. `public.profiles` (Custom Application Table)

This is our custom table that extends user information beyond what Supabase Auth provides.

**Purpose**: Store user profile information, preferences, and Bitcoin addresses
**Linked to**: `auth.users` via foreign key relationship

| Column              | Type      | Nullable | Description                                               |
| ------------------- | --------- | -------- | --------------------------------------------------------- |
| `id`                | uuid      | ❌       | Primary key, references `auth.users.id`                   |
| `username`          | text      | ✅       | Unique username chosen by user                            |
| `name`              | text      | ✅       | Display name shown in UI (standardized from display_name) |
| `bio`               | text      | ✅       | User biography/description                                |
| `avatar_url`        | text      | ✅       | Profile picture URL                                       |
| `banner_url`        | text      | ✅       | Profile banner image URL                                  |
| `bitcoin_address`   | text      | ✅       | Bitcoin address for receiving donations                   |
| `lightning_address` | text      | ✅       | Lightning address for instant payments                    |
| `website`           | text      | ✅       | User's website URL                                        |
| `created_at`        | timestamp | ❌       | When profile was created                                  |
| `updated_at`        | timestamp | ❌       | Last profile update                                       |

### 3. `public.funding_pages` (Crowdfunding Projects)

Stores information about crowdfunding projects created by users.

**Purpose**: Manage crowdfunding projects and projects
**Linked to**: `auth.users` via `user_id`

| Column              | Type      | Description                         |
| ------------------- | --------- | ----------------------------------- |
| `id`                | uuid      | Primary key                         |
| `user_id`           | uuid      | References `auth.users.id`          |
| `title`             | text      | Campaign title                      |
| `description`       | text      | Campaign description                |
| `bitcoin_address`   | text      | Bitcoin address for donations       |
| `is_active`         | boolean   | Whether project is active           |
| `is_public`         | boolean   | Whether project is publicly visible |
| `total_funding`     | decimal   | Total amount raised                 |
| `contributor_count` | integer   | Number of contributors              |
| `created_at`        | timestamp | Campaign creation date              |
| `updated_at`        | timestamp | Last update                         |

### 4. `public.transactions` (Payment Records)

Records all donations and transactions made through the platform.

**Purpose**: Track all payments and donations
**Linked to**: `funding_pages` and `auth.users`

| Column             | Type      | Description                                   |
| ------------------ | --------- | --------------------------------------------- |
| `id`               | uuid      | Primary key                                   |
| `funding_page_id`  | uuid      | References `funding_pages.id`                 |
| `amount`           | decimal   | Transaction amount                            |
| `transaction_hash` | text      | Bitcoin transaction hash                      |
| `status`           | text      | Transaction status (pending/confirmed/failed) |
| `created_at`       | timestamp | Transaction timestamp                         |
| `updated_at`       | timestamp | Last status update                            |

## 🔐 Authentication Flow

### How User Registration Works

1. **User signs up** → Email/password sent to Supabase Auth
2. **Supabase creates account** → New record in `auth.users`
3. **Trigger fires automatically** → `handle_new_user()` function runs
4. **Profile created** → New record in `public.profiles` with same ID

```sql
-- This trigger automatically runs when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### How User Login Works

1. **User enters credentials** → Frontend calls Supabase Auth
2. **Supabase validates** → Returns session with JWT token
3. **App fetches profile** → Queries `public.profiles` using user ID
4. **State updated** → User and profile data stored in app state

## 🔒 Row Level Security (RLS)

All tables use Supabase's Row Level Security to ensure users can only access their own data.

### Profiles Policies

```sql
-- Anyone can view profiles (for public profile pages)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Funding Pages Policies

```sql
-- Public projects are viewable by everyone
CREATE POLICY "Public funding pages are viewable by everyone"
  ON public.funding_pages FOR SELECT
  USING (is_public = true);

-- Users can only manage their own projects
CREATE POLICY "Users can manage their own funding pages"
  ON public.funding_pages FOR ALL
  USING (auth.uid() = user_id);
```

## 🔧 Database Functions

### `handle_new_user()`

**Purpose**: Automatically creates a profile when a new user signs up
**Trigger**: Runs after INSERT on `auth.users`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, created_at, updated_at)
  VALUES (
    new.id,
    split_part(new.email, '@', 1), -- Use email username as initial username
    split_part(new.email, '@', 1), -- Use email username as initial display name
    NOW(),
    NOW()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `update_profile(profile_data jsonb)`

**Purpose**: Safely update user profiles with validation
**Security**: Only allows users to update their own profile

```sql
-- Usage example:
SELECT update_profile('{
  "username": "new_username",
  "bio": "Updated bio",
  "bitcoin_address": "bc1q..."
}'::jsonb);
```

### `update_updated_at_column()`

**Purpose**: Automatically updates the `updated_at` timestamp
**Trigger**: Runs before UPDATE on any table with `updated_at` column

## 🚀 How Your App Integrates

### Frontend → Database Flow

1. **Authentication**: Frontend uses Supabase client for login/signup
2. **Profile Management**: App calls `ProfileService` which uses direct table access
3. **Real-time Updates**: Supabase client provides real-time subscriptions
4. **Security**: All requests automatically include user JWT for RLS

### Key Integration Points

```typescript
// Your app's auth store automatically syncs with Supabase
const { user, session, profile } = useAuth();

// Profile updates go through your service layer
await ProfileService.updateProfile(userId, profileData);

// Real-time subscriptions for live data
supabase
  .from('profiles')
  .on('UPDATE', payload => {
    // Handle real-time profile updates
  })
  .subscribe();
```

## 🛠️ Recent Schema Issues & Fixes

### Problem Identified

Your profiles table was missing several expected columns:

- ❌ Missing: `bio`, `name`, `bitcoin_address`, `lightning_address`, `banner_url`
- ✅ Present: `id`, `username`, `name`, `avatar_url`, `website`, `created_at`, `updated_at`

### Solution Applied

Run the migration in `supabase/migrations/20250525000000_fix_profiles_schema.sql` to:

1. Add all missing columns
2. Create proper constraints and indexes
3. Add RPC functions for safe updates
4. Update triggers and policies

## 📝 Manual Steps Required

### 1. Apply Database Migration

Go to your Supabase dashboard → SQL Editor and run:

```sql
-- Copy and paste the contents of:
-- supabase/migrations/20250525000000_fix_profiles_schema.sql
```

### 2. Verify Schema

After running the migration, all these columns should exist in `public.profiles`:

- ✅ `id`, `username`, `name`, `bio`, `bitcoin_address`
- ✅ `lightning_address`, `avatar_url`, `banner_url`, `created_at`, `updated_at`

### 3. Test Profile Updates

Your profile edit form should now work correctly with all fields.

## 🔍 Troubleshooting

### Common Issues

1. **"Column does not exist" errors**
   - **Cause**: Migration not applied
   - **Solution**: Run the schema migration in Supabase SQL Editor

2. **"Row Level Security" errors**
   - **Cause**: User not authenticated or wrong permissions
   - **Solution**: Check auth state and RLS policies

3. **"Profile not found" errors**
   - **Cause**: Profile wasn't created during signup
   - **Solution**: Check `handle_new_user()` trigger is active

### Debug Commands

```javascript
// Check current schema
const { data } = await supabase.from('profiles').select('*').limit(1);
console.log('Current columns:', Object.keys(data[0]));

// Test profile update
const { error } = await supabase.from('profiles').update({ bio: 'test' }).eq('id', userId);
console.log('Update error:', error);
```

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase SQL Editor](https://supabase.com/dashboard/project/YOUR_PROJECT/sql)

This documentation should be updated whenever the schema changes to keep it accurate and useful for development and debugging.
