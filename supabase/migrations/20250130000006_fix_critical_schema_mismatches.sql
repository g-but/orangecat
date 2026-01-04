-- =============================================
-- FIX CRITICAL SCHEMA MISMATCHES
-- 
-- This migration fixes critical mismatches between
-- database schema and codebase expectations.
--
-- Issues Fixed:
-- 1. profiles.display_name → profiles.name (code expects 'name')
-- 2. projects.contributor_count (missing column)
-- 3. Add indexes for performance
--
-- Created: 2025-01-30
-- =============================================

-- =====================================================================
-- FIX #1: Rename display_name to name
-- =====================================================================
-- This fixes ALL the "User [id]" issues
-- Code expects 'name' but database has 'display_name'
DO $$
BEGIN
  -- Check if display_name exists and name doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'display_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN display_name TO name;
    RAISE NOTICE 'Renamed display_name to name in profiles table';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'name'
  ) THEN
    RAISE NOTICE 'name column already exists in profiles table';
  ELSE
    RAISE NOTICE 'Neither display_name nor name found in profiles table';
  END IF;
END $$;

-- =====================================================================
-- FIX #2: Add missing contributor_count to projects
-- =====================================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contributor_count INTEGER DEFAULT 0;

-- Calculate initial values from transactions (if transactions table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions'
  ) THEN
    UPDATE projects p
    SET contributor_count = (
      SELECT COUNT(DISTINCT from_user_id)
      FROM transactions t
      WHERE t.to_project_id = p.id
      AND t.status = 'completed'
    )
    WHERE contributor_count = 0;
    RAISE NOTICE 'Updated contributor_count from transactions';
  ELSE
    RAISE NOTICE 'transactions table not found, skipping contributor_count calculation';
  END IF;
END $$;

-- =====================================================================
-- FIX #3: Add indexes for performance
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status) WHERE status IN ('active', 'draft');
CREATE INDEX IF NOT EXISTS idx_projects_contributor_count ON projects(contributor_count) WHERE contributor_count > 0;

-- Add indexes for transactions if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_transactions_project ON transactions(to_project_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(from_user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    RAISE NOTICE 'Created transaction indexes';
  END IF;
END $$;

-- =====================================================================
-- FIX #4: Update trigger to use new contributor_count column
-- =====================================================================
-- Only if transactions table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions'
  ) THEN
    -- Create or replace the function
    CREATE OR REPLACE FUNCTION update_project_stats()
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        UPDATE projects
        SET
          raised_amount = COALESCE(raised_amount, 0) + NEW.amount_sats,
          contributor_count = (
            SELECT COUNT(DISTINCT from_user_id)
            FROM transactions
            WHERE to_project_id = NEW.to_project_id
            AND status = 'completed'
          )
        WHERE id = NEW.to_project_id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Recreate trigger if it exists
    DROP TRIGGER IF EXISTS transaction_stats ON transactions;
    CREATE TRIGGER transaction_stats
      AFTER INSERT ON transactions
      FOR EACH ROW
      EXECUTE FUNCTION update_project_stats();
    
    RAISE NOTICE 'Updated project stats trigger';
  END IF;
END $$;

-- =====================================================================
-- VERIFICATION
-- =====================================================================
-- Verify the changes
DO $$
DECLARE
  has_name_col boolean;
  has_contributor_count boolean;
BEGIN
  -- Check profiles.name
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'name'
  ) INTO has_name_col;
  
  -- Check projects.contributor_count
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'contributor_count'
  ) INTO has_contributor_count;
  
  IF has_name_col THEN
    RAISE NOTICE '✅ profiles.name column exists';
  ELSE
    RAISE WARNING '❌ profiles.name column missing';
  END IF;
  
  IF has_contributor_count THEN
    RAISE NOTICE '✅ projects.contributor_count column exists';
  ELSE
    RAISE WARNING '❌ projects.contributor_count column missing';
  END IF;
END $$;
