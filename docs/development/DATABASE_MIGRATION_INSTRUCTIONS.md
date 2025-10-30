---
created_date: 2025-01-24
last_modified_date: 2025-01-24
last_modified_summary: Database migration instructions
---

# Database Migration Instructions

## Critical: Migration Required Before Project Creation

### Status

- ✅ Code fixed: All campaign → project references updated
- ✅ Schema ready: Migration file created
- ⏳ **ACTION REQUIRED**: Database migration must be applied

### Problem

The database currently has a `campaigns` table, but the application expects a `projects` table.

### Solution: Apply Migration via Supabase Dashboard

#### Step 1: Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select project: **ohkueislstxomdjavyhs**
3. Click **SQL Editor** in left sidebar

#### Step 2: Run Migration Script

Copy and paste this **ENTIRE** script into SQL Editor:

```sql
-- MVP Consolidation: Ensure projects table has all needed columns
-- Date: 2025-01-24

-- If campaigns table exists, rename it to projects
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    ALTER TABLE campaigns RENAME TO projects;
  END IF;
END $$;

-- Ensure projects table has all MVP columns
ALTER TABLE projects
  DROP COLUMN IF EXISTS organization_id,
  DROP COLUMN IF EXISTS owner_type,
  DROP COLUMN IF EXISTS owner_id,
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS slug;

-- Rename columns if needed
DO $$
BEGIN
  -- Rename name to title if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'name') THEN
    ALTER TABLE projects RENAME COLUMN name TO title;
  END IF;

  -- Rename owner_id to user_id if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'owner_id') THEN
    ALTER TABLE projects RENAME COLUMN owner_id TO user_id;
  END IF;
END $$;

-- Add missing columns
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS goal_amount numeric(20,8),
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'SATS',
  ADD COLUMN IF NOT EXISTS funding_purpose text,
  ADD COLUMN IF NOT EXISTS bitcoin_address text,
  ADD COLUMN IF NOT EXISTS lightning_address text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS raised_amount numeric(20,8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Make user_id required if it exists
ALTER TABLE projects ALTER COLUMN user_id SET NOT NULL;

-- Drop any organization-related indexes
DROP INDEX IF EXISTS idx_projects_owner;
DROP INDEX IF EXISTS idx_projects_slug;

-- Create necessary indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

COMMENT ON TABLE projects IS 'MVP: Projects created by individual users for Bitcoin fundraising';
```

#### Step 3: Execute

1. Click **Run** button (or press Cmd/Ctrl + Enter)
2. Wait for success message
3. **Done!** Project creation will now work

### Alternative: Via Supabase CLI (if available)

```bash
# 1. Login to Supabase
supabase login

# 2. Link project
supabase link --project-ref ohkueislstxomdjavyhs

# 3. Apply migration
supabase db push
```

### Verification

After migration, test project creation:

1. Navigate to http://localhost:3000/projects/create
2. Fill out form
3. Submit project
4. Should see success message
5. Project appears on dashboard

### Git Status

All code changes committed on `simplify-mvp` branch:

- 17 commits ready for deployment
- Database migration required before testing
- Ready to push to GitHub → Vercel

### Next Steps After Migration

1. ✅ Test project creation
2. ✅ Verify project appears on dashboard
3. ✅ Check discover page shows projects
4. ✅ Push to GitHub
5. ✅ Deploy to Vercel
