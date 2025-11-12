-- Migration: Add CHECK constraint to projects.status column
-- Enforces valid status values: draft, active, paused, completed, cancelled
-- Date: 2025-11-11

BEGIN;

-- Drop existing constraint if it exists (to avoid conflicts)
DO $$
BEGIN
  -- Check if constraint exists and drop it
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'projects_status_check' 
    AND table_name = 'projects'
  ) THEN
    ALTER TABLE public.projects DROP CONSTRAINT projects_status_check;
  END IF;
END $$;

-- Add CHECK constraint to enforce valid status values
ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check 
  CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled'));

-- Update any invalid status values to 'draft' (safety measure)
UPDATE public.projects
SET status = 'draft'
WHERE status NOT IN ('draft', 'active', 'paused', 'completed', 'cancelled');

-- Add comment explaining status values
COMMENT ON COLUMN public.projects.status IS 
  'Project status: draft (author only, not in search), active (published, accepting donations), paused (published, not accepting donations), completed (finished), cancelled (archived)';

COMMIT;

