# Apply Database Migration - CRITICAL

## Problem

Database has conflicting schema - `campaigns` table exists but code expects `projects` table.

Error: `relation "public.projects" does not exist`

## Solution: Apply Migration via Supabase Dashboard

### Step 1: Go to Supabase Dashboard

1. Open https://supabase.com/dashboard
2. Select project: `ohkueislstxomdjavyhs`
3. Click "SQL Editor" in left sidebar

### Step 2: Run This SQL Script

Copy and paste this ENTIRE script into SQL Editor:

```sql
-- MVP Consolidation: Rename campaigns to projects
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    ALTER TABLE campaigns RENAME TO projects;
  END IF;
END $$;

-- Add missing columns
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'SATS',
  ADD COLUMN IF NOT EXISTS funding_purpose text,
  ADD COLUMN IF NOT EXISTS lightning_address text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

COMMENT ON TABLE projects IS 'MVP: Projects created by individual users for Bitcoin fundraising';
```

### Step 3: Click "Run" button

### Step 4: Verify Success

You should see: "Success. No rows returned"

### Step 5: Test Project Creation

Try creating a project in the app - it should work now!

## Current Git Commits Ready

```
94c80cc - docs: Add MVP database schema documentation
5f3f300 - feat: Add migration to consolidate campaigns/projects tables
b7c82fe - fix: Map validation schema to database columns
56a688e - fix: Smart currency conversion
c2f025a - fix: Improve validation error handling
```

## Alternative: Use Supabase CLI (if you have it)

```bash
export SUPABASE_ACCESS_TOKEN=sbp_7bc7546939c5675c6146d5773f83f05b0131c614
supabase db push
```
