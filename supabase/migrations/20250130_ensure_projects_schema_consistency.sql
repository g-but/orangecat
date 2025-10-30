-- Ensure projects table has correct schema for MVP
-- Fix any missing columns and ensure consistency
-- Date: 2025-01-30

-- Ensure raised_amount column exists (used by frontend)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND column_name = 'raised_amount'
  ) THEN
    ALTER TABLE projects ADD COLUMN raised_amount numeric(20,8) DEFAULT 0;
  END IF;
END $$;

-- Ensure title and description are NOT NULL (required fields)
DO $$
BEGIN
  -- Only alter if column exists and is nullable
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'title' AND is_nullable = 'YES') THEN
    ALTER TABLE projects ALTER COLUMN title SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'description' AND is_nullable = 'YES') THEN
    ALTER TABLE projects ALTER COLUMN description SET NOT NULL;
  END IF;
END $$;

-- Set default for raised_amount if NULL
UPDATE projects SET raised_amount = 0 WHERE raised_amount IS NULL;

-- Add index on raised_amount for performance
CREATE INDEX IF NOT EXISTS idx_projects_raised_amount ON projects(raised_amount DESC);

-- Ensure currency has default value
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'currency') THEN
    ALTER TABLE projects ALTER COLUMN currency SET DEFAULT 'SATS';
  END IF;
END $$;

-- Add contributor_count if missing (for future use)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND column_name = 'contributor_count'
  ) THEN
    ALTER TABLE projects ADD COLUMN contributor_count integer DEFAULT 0;
  END IF;
END $$;

COMMENT ON COLUMN projects.raised_amount IS 'Total amount raised in sats (or base currency unit)';
COMMENT ON COLUMN projects.contributor_count IS 'Number of unique contributors to this project';






