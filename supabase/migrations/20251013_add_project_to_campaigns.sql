-- Add project_id foreign key to campaigns table
-- This links campaigns to their parent projects

-- Add the project_id column
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_project ON campaigns(project_id);

-- Add helpful comment
COMMENT ON COLUMN campaigns.project_id IS 'Optional link to parent project. Campaigns can belong to a project or be standalone.';

-- Note: RLS policies for campaigns should already handle project relationships
-- If campaign belongs to a project, visibility follows project visibility rules
