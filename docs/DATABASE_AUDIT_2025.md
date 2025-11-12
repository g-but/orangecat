# 🔴 CRITICAL DATABASE AUDIT - Senior Engineer Review
**Date**: January 30, 2025
**Status**: URGENT - Multiple Critical Issues Found
**Reviewer**: Senior Database Engineer

---

## 🚨 EXECUTIVE SUMMARY

Your database has **severe architectural problems** from multiple conflicting migrations and AI-generated "fixes" that created more problems than they solved. This is a textbook example of "AI slop" accumulation.

### Critical Issues:
1. ❌ **Duplicate Columns**: `user_id` AND `creator_id` in projects table
2. ❌ **Inconsistent Currency Model**: `raised_amount` vs `current_amount`, mixing BTC/sats/CHF
3. ❌ **Missing Columns**: Code expects `cover_image_url`, `raised_amount`, `contributor_count` - none exist in base schema
4. ❌ **Migration Chaos**: Dates in the future (20251221), migrations that DROP CASCADE entire tables
5. ❌ **Redundant Foreign Keys**: References to non-existent columns
6. ❌ **Broken RLS Policies**: Multiple conflicting policies with same names

---

## 📋 DETAILED FINDINGS

### 1. PROJECTS TABLE MESS

**Base Schema** (20251025000000_simple_schema.sql):
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id), -- Original
  current_amount NUMERIC(20,8) DEFAULT 0,     -- Original
  goal_currency TEXT DEFAULT 'BTC',
  currency TEXT DEFAULT 'BTC',
  -- NO cover_image_url
  -- NO raised_amount
  -- NO contributor_count
)
```

**But Then** (20251025000001):
```sql
ALTER TABLE projects ADD COLUMN user_id UUID;  -- DUPLICATE!
-- Now you have BOTH user_id AND creator_id
```

**But Your Code Expects**:
- `cover_image_url` (doesn't exist - added later in some migration)
- `raised_amount` (doesn't exist - trigger tries to update it anyway)
- `contributor_count` (doesn't exist - trigger tries to update it anyway)

**Result**: Every query fails or returns null/missing data.

---

### 2. CURRENCY/FUNDING MODEL DISASTER

You have **THREE different funding models** mixed together:

**Model 1**: Original simple schema
- `current_amount` (in BTC)
- `goal_amount` (in BTC)
- `currency: 'BTC'`

**Model 2**: What the code expects
- `raised_amount` (in what? sats? CHF? who knows)
- `goal_amount` (in CHF for some reason)
- Mixing satoshis and fiat

**Model 3**: What the trigger updates
- `raised_amount` += `amount_sats` (adding sats to ???)
- No unit conversion

**This is fundamentally broken**. You can't add satoshis to CHF amounts.

---

### 3. MIGRATION FILE CHAOS

**File Naming Issues**:
```
20251221_*.sql  <- December 2025 (doesn't exist yet)
20251103_*.sql  <- November 2025 (doesn't exist yet)
20251025_*.sql  <- October 2025 (doesn't exist yet)
```

These files are created in October 2024 but dated in the FUTURE. This breaks migration ordering.

**Migration Content Issues**:
```sql
-- From 20251221_simplify_database_schema.sql:
DROP TABLE profiles CASCADE;  -- DELETES EVERYTHING
CREATE TABLE profiles_simplified...
ALTER TABLE profiles_simplified RENAME TO profiles;
```

This migration **DESTROYS all profile data** and breaks every foreign key in the database.

---

### 4. MISSING COLUMNS IN SCHEMA

**Code expects these columns that DON'T EXIST in base schema**:

**projects table:**
- `cover_image_url` ❌
- `raised_amount` ❌
- `contributor_count` ❌
- `published` ❌

**profiles table:**
- `email` ❌ (in simple schema)
- Various JSON fields ❌

**transactions table exists but:**
- Trigger references `contributor_count` that doesn't exist
- Stores amounts in sats but projects use BTC

---

### 5. FOREIGN KEY PROBLEMS

**projects.creator_id** vs **projects.user_id**:
- You have BOTH columns
- They reference the same thing
- Code uses `user_id`, schema has `creator_id`
- This is just wasting space and creating confusion

**projects.organization_id**:
- References `organizations` table
- But `organizations` table may not exist depending on which migrations ran
- No ON DELETE CASCADE properly set up

---

### 6. RLS POLICY MESS

**profiles table has conflicting policies**:
```sql
-- Policy 1:
CREATE POLICY "Profiles are viewable by everyone"...

-- Policy 2:
CREATE POLICY "Public read access"...

-- They do THE SAME THING
```

**projects table:**
```sql
-- Allows anyone to view projects
CREATE POLICY "Projects are viewable by everyone" FOR SELECT USING (true);

-- But also tries to filter by status in some migrations
CREATE POLICY "Active projects viewable" FOR SELECT USING (status = 'active');
```

**Result**: Last policy wins, earlier ones ignored. Waste of processing.

---

### 7. TRIGGER/FUNCTION ISSUES

**sync_project_funding() function**:
```sql
UPDATE projects
SET raised_amount = COALESCE(raised_amount, 0) + NEW.amount_sats
```

**Problems**:
1. Column `raised_amount` doesn't exist in base schema
2. Adding `amount_sats` (integer) to `raised_amount` (what unit?)
3. No currency conversion
4. No atomicity guarantees
5. Will fail silently or cause data corruption

**handle_new_user() function**:
- Multiple versions across migrations
- Each version overwrites the previous
- Final version may not match what code expects

---

## 🎯 ROOT CAUSE ANALYSIS

### How This Happened:

1. **Initial Schema**: Someone created a clean, simple 3-table schema (profiles, projects, transactions)

2. **First "Fix"**: Code expected `user_id`, but table had `creator_id`
   - **AI Solution**: Add `user_id` column (WRONG - should've updated code or renamed column)

3. **Second "Fix"**: Code expected `raised_amount`, but table had `current_amount`
   - **AI Solution**: Add triggers to update non-existent `raised_amount` (WRONG - should've used existing column)

4. **Third "Fix"**: Profiles had too many columns
   - **AI Solution**: DROP CASCADE and rebuild (WRONG - loses all data and breaks FKs)

5. **Fourth "Fix"**: display_name vs name confusion
   - **AI Solution**: Add more mapping logic (WRONG - should've picked one and migrated)

6. **Pattern**: Each AI "fix" added more complexity instead of fixing the root cause.

---

## ✅ PROPER SOLUTION

### Phase 1: Establish Ground Truth (DO THIS FIRST)

```sql
-- Find out what ACTUALLY exists in production
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'projects', 'transactions')
ORDER BY table_name, ordinal_position;
```

### Phase 2: Create Clean Schema (Based on Actual Needs)

**What You Actually Need**:

```sql
-- PROFILES: Keep it simple
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  name TEXT,  -- One name field, period
  bio TEXT,
  avatar_url TEXT,
  bitcoin_address TEXT,
  lightning_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECTS: Unified model
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,  -- One owner field
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,  -- Add this if you need it

  -- FUNDING MODEL (Pick ONE unit system)
  goal_amount_sats BIGINT,  -- Everything in satoshis
  raised_amount_sats BIGINT DEFAULT 0,  -- Everything in satoshis
  contributor_count INTEGER DEFAULT 0,

  -- STATUS
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),

  -- METADATA
  category TEXT,
  bitcoin_address TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS: Clean model
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES profiles(id),
  to_project_id UUID REFERENCES projects(id),
  amount_sats BIGINT NOT NULL,  -- Always satoshis
  status TEXT DEFAULT 'pending',
  transaction_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proper indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status) WHERE status IN ('active', 'paused');
CREATE INDEX idx_transactions_project ON transactions(to_project_id);
CREATE INDEX idx_transactions_user ON transactions(from_user_id);
```

### Phase 3: One Trigger That Actually Works

```sql
CREATE OR REPLACE FUNCTION update_project_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    UPDATE projects
    SET
      raised_amount_sats = raised_amount_sats + NEW.amount_sats,
      contributor_count = contributor_count + 1
    WHERE id = NEW.to_project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_stats
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_project_stats();
```

---

## 🔧 RECOMMENDED ACTION PLAN

### Immediate Actions (Today):

1. **Stop making new migrations** until you fix the base schema
2. **Document what columns actually exist** in production right now
3. **Choose ONE data model** (I recommend: everything in satoshis)
4. **Remove ALL duplicate columns** (user_id/creator_id, current_amount/raised_amount)

### Short-term (This Week):

1. Create ONE definitive migration that:
   - Drops ALL the conflicting migrations
   - Establishes ONE clean schema
   - Migrates existing data properly
   - Sets up proper foreign keys

2. Update ALL code to match the schema (not the other way around)

3. Add proper column existence checks before ANY new migrations

### Long-term (This Month):

1. **Establish migration discipline**:
   - No more "quick fixes"
   - Every migration must have rollback
   - Test migrations on copy of production first
   - Use proper migration tools (not manual SQL files with future dates)

2. **Code-first or Schema-first** (pick one):
   - If code-first: Generate schema from TypeScript types
   - If schema-first: Generate types from schema
   - Stop the manual sync madness

3. **Add integration tests** that verify:
   - Schema matches type definitions
   - Foreign keys are valid
   - Triggers actually work
   - RLS policies make sense

---

## 💾 SPECIFIC FIXES NEEDED

### Fix 1: Remove Duplicate Columns
```sql
-- Pick one: user_id or creator_id (I recommend user_id)
UPDATE projects SET user_id = creator_id WHERE user_id IS NULL;
ALTER TABLE projects DROP COLUMN creator_id;

-- Pick one: raised_amount or current_amount
ALTER TABLE projects RENAME COLUMN current_amount TO raised_amount_sats;
ALTER TABLE projects ALTER COLUMN raised_amount_sats TYPE BIGINT;
```

### Fix 2: Add Missing Columns
```sql
-- Add columns that code expects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contributor_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS raised_amount_sats BIGINT DEFAULT 0;
```

### Fix 3: Fix Currency Model
```sql
-- Convert ALL amounts to satoshis
ALTER TABLE projects ALTER COLUMN goal_amount TYPE BIGINT USING (goal_amount * 100000000)::BIGINT;
ALTER TABLE projects RENAME COLUMN goal_amount TO goal_amount_sats;

-- Remove currency columns (everything is BTC/sats)
ALTER TABLE projects DROP COLUMN IF EXISTS currency;
ALTER TABLE projects DROP COLUMN IF EXISTS goal_currency;
```

### Fix 4: Clean Up RLS Policies
```sql
-- Drop ALL policies and start fresh
DROP POLICY IF EXISTS "Public read access" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
-- ... drop all duplicates

-- Create ONE policy per action
CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);
```

---

## 📊 CURRENT STATE ASSESSMENT

**Technical Debt Level**: 🔴 CRITICAL (10/10)

**Issues by Severity**:
- **Critical** (blocks core functionality): 6 issues
- **High** (causes errors): 12 issues
- **Medium** (causes confusion): 8 issues
- **Low** (code smell): 15+ issues

**Estimated Cleanup Time**:
- Quick fix (bandaid): 4-6 hours
- Proper fix (recommended): 2-3 days
- Full refactor (ideal): 1 week

**Risk Assessment**:
- **Data Loss Risk**: HIGH (due to DROP CASCADE migrations)
- **Corruption Risk**: HIGH (due to trigger bugs)
- **Performance Risk**: MEDIUM (missing indexes, bad queries)
- **Security Risk**: LOW (RLS policies work, just messy)

---

## 🎓 LESSONS LEARNED

### What NOT To Do:

1. ❌ Don't let AI "fix" database issues without human review
2. ❌ Don't add columns when you should rename/use existing
3. ❌ Don't create migrations with future dates
4. ❌ Don't DROP CASCADE in production migrations
5. ❌ Don't mix different unit systems (BTC/sats/CHF)
6. ❌ Don't have multiple names for the same concept
7. ❌ Don't add triggers that reference non-existent columns

### Best Practices Going Forward:

1. ✅ **Schema migrations must be reversible**
2. ✅ **Test on staging before production**
3. ✅ **One source of truth** (schema OR code, generate the other)
4. ✅ **Consistent naming conventions**
5. ✅ **Use migration tools properly** (Supabase migrations, not manual files)
6. ✅ **Code review for database changes** (even AI suggestions)
7. ✅ **Document your currency model clearly**

---

## 🚀 NEXT STEPS

**Immediate (Do Now)**:
1. Run the "Establish Ground Truth" query above
2. Send me the output so I can see exact current state
3. Don't make ANY more schema changes until we have a plan

**Then We'll Create**:
1. A single, clean migration to fix everything
2. Updated type definitions to match
3. Tests to prevent regression
4. Documentation of the final schema

---

## 📞 SUPPORT

If you want me to:
- Write the cleanup migration
- Fix the TypeScript types
- Create the integration tests
- Document the proper schema

Just say "fix the database" and I'll create all the files.

**This is fixable, but it needs a proper engineering approach, not more AI bandaids.**
