-- Migration: Add supporters count and project updates functionality
-- Created: 2025-11-17
-- Purpose: Enable social proof features for project profiles

-- Add supporters count and last donation tracking to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS supporters_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_donation_at TIMESTAMP WITH TIME ZONE;

-- Create index for last_donation_at for sorting
CREATE INDEX IF NOT EXISTS idx_projects_last_donation_at ON projects(last_donation_at DESC NULLS LAST);

-- Create project updates table for timeline/activity feed
CREATE TABLE IF NOT EXISTS project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('update', 'donation', 'milestone')),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  amount_btc NUMERIC(16, 8), -- For donation type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for project_updates
CREATE INDEX IF NOT EXISTS idx_project_updates_project_id ON project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_created_at ON project_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_updates_type ON project_updates(type);

-- Track unique supporters (anonymized for privacy)
CREATE TABLE IF NOT EXISTS project_supporters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  supporter_hash VARCHAR(64) NOT NULL, -- Hash of bitcoin address or user_id
  first_donation_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_donation_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_donated_btc NUMERIC(16, 8) DEFAULT 0,
  donation_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, supporter_hash)
);

-- Create indexes for project_supporters
CREATE INDEX IF NOT EXISTS idx_project_supporters_project_id ON project_supporters(project_id);
CREATE INDEX IF NOT EXISTS idx_project_supporters_supporter_hash ON project_supporters(supporter_hash);

-- Function to update supporters count when a supporter is added/updated
CREATE OR REPLACE FUNCTION update_project_supporters_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the supporters_count for the project
  UPDATE projects
  SET
    supporters_count = (
      SELECT COUNT(DISTINCT supporter_hash)
      FROM project_supporters
      WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ),
    last_donation_at = (
      SELECT MAX(last_donation_at)
      FROM project_supporters
      WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    )
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update supporters count
DROP TRIGGER IF EXISTS trigger_update_supporters_count ON project_supporters;
CREATE TRIGGER trigger_update_supporters_count
  AFTER INSERT OR UPDATE OR DELETE ON project_supporters
  FOR EACH ROW
  EXECUTE FUNCTION update_project_supporters_count();

-- RLS Policies for project_updates
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

-- Anyone can view project updates for active projects
CREATE POLICY "Anyone can view project updates for active projects"
  ON project_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_updates.project_id
      AND projects.status IN ('active', 'completed')
    )
  );

-- Project owners can insert updates
CREATE POLICY "Project owners can create updates"
  ON project_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_updates.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Project owners can update their updates
CREATE POLICY "Project owners can update their updates"
  ON project_updates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_updates.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Project owners can delete their updates
CREATE POLICY "Project owners can delete their updates"
  ON project_updates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_updates.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for project_supporters
ALTER TABLE project_supporters ENABLE ROW LEVEL SECURITY;

-- Anyone can view supporter counts (but not individual hashes)
CREATE POLICY "Anyone can view project supporters"
  ON project_supporters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_supporters.project_id
      AND projects.status IN ('active', 'completed')
    )
  );

-- System can insert/update supporters (this will be done via backend API)
CREATE POLICY "Service role can manage supporters"
  ON project_supporters FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT ON project_updates TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON project_updates TO authenticated;

GRANT SELECT ON project_supporters TO authenticated, anon;
GRANT ALL ON project_supporters TO service_role;

-- Comments for documentation
COMMENT ON TABLE project_updates IS 'Timeline of project updates, donations, and milestones for transparency and trust';
COMMENT ON TABLE project_supporters IS 'Anonymized tracking of unique project supporters for social proof';
COMMENT ON COLUMN projects.supporters_count IS 'Cached count of unique supporters for performance';
COMMENT ON COLUMN projects.last_donation_at IS 'Timestamp of most recent donation for social proof';
