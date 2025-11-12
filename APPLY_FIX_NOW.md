# 🚨 APPLY THIS FIX NOW - Simple Instructions

## The Problem
Your database has `display_name` but your code queries `name`. This is why you see "User cec88bc9" everywhere.

## The Fix (Takes 2 minutes)

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql

### Step 2: Copy & Paste This SQL
```sql
-- FIX #1: Rename display_name to name (THE CRITICAL FIX)
ALTER TABLE profiles RENAME COLUMN display_name TO name;

-- FIX #2: Add missing contributor_count to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contributor_count INTEGER DEFAULT 0;

-- FIX #3: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status) WHERE status IN ('active', 'draft');
```

### Step 3: Click "Run"

### Step 4: Verify It Worked
Run this query in the SQL editor:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'name';
```

You should see one row with `name`.

## What This Fixes
✅ All "User cec88bc9" displays will show real names
✅ Profile pages will show correct names
✅ Project creator names will display
✅ Search by name will work

## After Applying
1. Restart your dev server: `npm run dev`
2. Refresh your browser
3. Check the discover page - you should see real names!

---

## Technical Details

**Before:**
- Database column: `display_name`
- Code queries: `name`
- Result: NULL (column doesn't exist) → Shows "User [id]"

**After:**
- Database column: `name`
- Code queries: `name`
- Result: Actual names display correctly ✅

This is a **safe, reversible migration**. If something goes wrong, you can rollback with:
```sql
ALTER TABLE profiles RENAME COLUMN name TO display_name;
```
