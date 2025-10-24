---
created_date: 2025-01-23
last_modified_date: 2025-01-23
last_modified_summary: Created comprehensive MVP simplification plan
---

# OrangeCat MVP Simplification Plan

## Executive Summary

OrangeCat is currently too complex for an MVP. This plan outlines removing unnecessary features and legacy code to focus on core functionality: **Individual Profiles** and **Project Profiles** with Bitcoin wallets.

## Current State Analysis

### What Exists (TOO COMPLEX)

- ❌ Organizations (complex governance, memberships, roles)
- ❌ Campaigns (merged with projects, causing confusion)
- ❌ Associations (polymorphic relationships table)
- ❌ Events (placeholder, not implemented)
- ❌ Assets (placeholder, not implemented)
- ❌ Complex profile_associations table
- ❌ Memberships system
- ❌ Multiple overlapping services

### What We Need (MVP)

- ✅ **Profiles** - Individual users with profiles and Bitcoin wallets
- ✅ **Projects** - Projects created by individuals with Bitcoin wallets
- ✅ **Transactions** - Simple Bitcoin transactions between profiles and projects

## Core Requirements

### Individual Profiles

- Profile with name, bio, avatar, banner
- Bitcoin address and Lightning address
- Can create and manage projects
- Can make transactions to projects

### Project Profiles

- Name, description, avatar, banner
- Bitcoin address and Lightning address
- Created by an individual
- Can receive transactions
- Can be edited by creator

### Transactions

- Simple transfer from profile to project
- Track Bitcoin and Lightning payments
- Status tracking (pending, confirmed, failed)
- Transparent transaction history

## Database Schema Simplification

### Tables to REMOVE

```sql
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS profile_associations CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE; -- already renamed to projects
DROP TABLE IF EXISTS funding_pages CASCADE;
DROP TABLE IF EXISTS donations CASCADE; -- already renamed to transactions
```

### Tables to KEEP

```sql
-- Core entities
profiles (individuals)
projects (created by individuals)
transactions (payments between profiles and projects)
```

### Simplified Profiles Table

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  website TEXT,
  bitcoin_address TEXT,
  lightning_address TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Simplified Projects Table

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  bitcoin_address TEXT,
  lightning_address TEXT,
  creator_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  goal_amount BIGINT, -- in satoshis, optional
  current_amount BIGINT DEFAULT 0, -- in satoshis
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Simplified Transactions Table

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_profile_id UUID NOT NULL REFERENCES profiles(id),
  to_project_id UUID NOT NULL REFERENCES projects(id),
  amount_sats BIGINT NOT NULL CHECK (amount_sats > 0),
  currency TEXT DEFAULT 'SATS',
  payment_method TEXT CHECK (payment_method IN ('bitcoin', 'lightning')),
  transaction_hash TEXT,
  lightning_payment_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  message TEXT,
  anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);
```

## API Simplification

### API Routes to REMOVE

```
/api/organizations/** (all routes)
/api/associations/** (all routes)
/api/profiles/*/organizations (remove)
/api/organizations/*/projects (remove)
/api/onboarding/** (too complex)
```

### API Routes to KEEP

```
/api/profile (current user profile)
/api/profiles/[userId] (public profile)
/api/projects (list/create projects)
/api/projects/[id] (get/update/delete project)
/api/transactions (create/list transactions)
/api/upload (avatar/banner uploads)
```

## Frontend Simplification

### Pages to REMOVE

```
/dashboard/organizations
/dashboard/campaigns
/dashboard/events
/dashboard/assets
/associations
/organizations/**
/campaigns/create (already merged with projects)
```

### Pages to KEEP

```
/dashboard (main overview)
/dashboard/projects (list user's projects)
/dashboard/people (browse profiles - simplified)
/projects/create (create new project)
/projects/[slug] (view project)
/profile (edit own profile)
/discover (browse all projects)
```

### Components to REMOVE

```
src/components/organizations/** (all files)
src/components/campaigns/** (all files)
src/components/associations/** (all files)
src/components/events/** (all files)
src/components/assets/** (all files)
```

### Components to KEEP

```
src/components/projects/** (all files)
src/components/profiles/** (all files)
src/components/transactions/** (all files)
src/components/shared/** (reusable components)
```

## Services Simplification

### Services to REMOVE

```
src/services/organizations/** (entire directory)
src/services/supabase/associations.ts
src/services/campaigns/** (if exists)
src/services/onboarding/** (too complex)
```

### Services to KEEP/REFACTOR

```
src/services/profile.ts (individual profiles)
src/services/projects.ts (project management)
src/services/transactions.ts (payment handling)
src/services/supabase/core/client.ts (database client)
```

## Migration Strategy

### Phase 1: Database Cleanup

1. Create new migration to drop unnecessary tables
2. Simplify profiles table
3. Simplify projects table (remove organization_id)
4. Simplify transactions table (remove multi-entity support)
5. Update RLS policies
6. Update indexes

### Phase 2: Backend Cleanup

1. Remove organization API routes
2. Remove association API routes
3. Remove campaign API routes
4. Simplify project routes
5. Simplify transaction routes
6. Update services

### Phase 3: Frontend Cleanup

1. Remove organization pages
2. Remove campaign pages
3. Remove association pages
4. Update navigation
5. Update dashboard
6. Clean up components

### Phase 4: Testing & Documentation

1. Update tests
2. Update documentation
3. Update API docs
4. Verify end-to-end flows

## Implementation Steps

### Step 1: Database Migration

Create migration file: `supabase/migrations/20250123_simplify_mvp.sql`

### Step 2: Remove Backend Code

- Delete organization services
- Delete association services
- Simplify remaining services

### Step 3: Remove Frontend Code

- Delete organization pages/components
- Delete campaign pages/components
- Update navigation configuration

### Step 4: Update Documentation

- Update database schema docs
- Update API documentation
- Update architecture docs

## Expected Outcomes

### Simplicity

- ✅ Clear mental model: Profiles → Projects → Transactions
- ✅ Easy to understand and maintain
- ✅ No AI-generated complexity
- ✅ Clean, professional codebase

### Maintainability

- ✅ Single source of truth for each entity
- ✅ No redundant code
- ✅ Clear separation of concerns
- ✅ Simple database queries

### User Experience

- ✅ Clear purpose: create projects, receive Bitcoin
- ✅ No confusing options
- ✅ Fast, simple workflows
- ✅ Focus on Bitcoin payments

## Success Criteria

- [ ] Only 3 core tables exist: profiles, projects, transactions
- [ ] No organizations, campaigns, associations, events, assets
- [ ] All code is clean, intentional, professional
- [ ] No legacy AI-generated code
- [ ] Simple navigation: Dashboard → Projects → Profile
- [ ] End-to-end flow works: Create project → Receive Bitcoin → View transactions

## Timeline

**Estimated Duration:** 4-6 hours

1. **Database migration** (1 hour)
2. **Backend cleanup** (1.5 hours)
3. **Frontend cleanup** (1.5 hours)
4. **Testing & fixes** (1 hour)
5. **Documentation** (1 hour)

## Risk Mitigation

- Backup current database before migration
- Create feature branch for changes
- Test thoroughly before merging
- Keep migration reversible
- Document all changes

## Next Steps

Once simplification is complete:

1. Verify all core flows work
2. Run full test suite
3. Update user documentation
4. Deploy to production
5. Monitor for issues

---

**Conclusion:** This simplification will transform OrangeCat from a complex, feature-bloated platform into a clean, focused MVP that clearly demonstrates its core value proposition: Bitcoin-powered crowdfunding with individual profiles and project pages.
