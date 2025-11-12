-- =====================================================================
-- CRITICAL FIX: display_name -> name + missing columns
-- Date: 2025-01-30
-- Purpose: Fix the root cause of "User cec88bc9" display issues
-- =====================================================================

-- =====================================================================
-- FIX #1: Rename display_name to name (THE CRITICAL FIX)
-- =====================================================================
-- This fixes ALL the "User cec88bc9" issues
-- The code queries 'name' but DB has 'display_name'
ALTER TABLE profiles RENAME COLUMN display_name TO name;

-- =====================================================================
-- FIX #2: Add missing contributor_count to projects
-- =====================================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contributor_count INTEGER DEFAULT 0;

-- Note: Skipping transaction-based calculation since transactions table is empty
-- contributor_count will be populated as new transactions come in via triggers

-- =====================================================================
-- FIX #3: Add performance indexes
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status) WHERE status IN ('active', 'draft');

-- =====================================================================
-- VERIFICATION QUERIES (run these after migration)
-- =====================================================================
-- Verify name column exists:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'name';
--
-- Verify contributor_count exists:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'contributor_count';
