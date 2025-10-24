-- MVP Consolidation: Ensure projects table has all needed columns
-- Date: 2025-01-24

-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text,
  description text,
  goal_amount numeric(20,8),
  currency text DEFAULT 'SATS',
  funding_purpose text,
  bitcoin_address text,
  lightning_address text,
  category text,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'draft',
  raised_amount numeric(20,8) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- If campaigns table exists, rename it to projects
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaigns') AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'projects') THEN
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

