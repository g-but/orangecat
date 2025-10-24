-- ============================================================================
-- ADD PROJECT ENHANCEMENTS - December 2025
-- ============================================================================
-- This migration adds user-friendly fields to projects:
-- 1. goal_currency (CHF, USD, EUR, etc.) - so users don't have to think in sats
-- 2. funding_purpose - what the money will be used for
-- 3. Multiple categories (tags array already exists)
-- ============================================================================

-- Add goal_currency to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS goal_currency TEXT DEFAULT 'BTC';

-- Add funding_purpose to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS funding_purpose TEXT;

-- Add index for goal_currency for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_goal_currency ON projects(goal_currency);

-- Update projects table comment
COMMENT ON COLUMN projects.goal_currency IS 'Currency for the goal amount (CHF, USD, EUR, BTC, etc.)';
COMMENT ON COLUMN projects.funding_purpose IS 'What the funds will be used for (e.g., equipment, team salaries, marketing)';

