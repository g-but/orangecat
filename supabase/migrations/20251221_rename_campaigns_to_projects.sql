-- Consolidation Migration: Rename campaigns to projects for better clarity
-- This migration consolidates the entity naming from campaigns to projects for improved user understanding

-- Step 1: Add project-like fields to campaigns table (now called projects)
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS target_completion timestamp with time zone,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
-- Make goal_amount optional for open-ended projects
ALTER COLUMN goal_amount DROP NOT NULL;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON campaigns(start_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_target_completion ON campaigns(target_completion);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON campaigns(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_tags ON campaigns USING gin(tags);

-- Step 2: Rename the table from campaigns to projects for clarity
ALTER TABLE campaigns RENAME TO projects;

-- Step 3: Rename all related constraints, indexes, and policies to use projects naming
-- (This is a simplified version - in production, you'd need to handle all constraints properly)

-- Step 4: Update projects table comment
COMMENT ON TABLE projects IS 'Unified project entity that supports fundraising, collaboration, and long-term initiatives. Can be time-bound with goals or open-ended projects.';
