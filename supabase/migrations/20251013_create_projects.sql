-- Create projects table for long-term initiatives
-- Projects can contain multiple campaigns and are owned by profiles or organizations

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,

  -- Ownership (polymorphic relationship)
  owner_type text NOT NULL CHECK (owner_type IN ('profile', 'organization')),
  owner_id uuid NOT NULL,

  -- Branding
  avatar_url text,
  banner_url text,
  website text,

  -- Bitcoin payment addresses
  bitcoin_address text,
  lightning_address text,

  -- Status and visibility
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('planning', 'active', 'completed', 'on_hold', 'cancelled')),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),

  -- Tags and categorization
  tags text[] DEFAULT '{}',
  category text,

  -- Timeline
  start_date timestamp with time zone DEFAULT now(),
  target_completion timestamp with time zone,
  completed_at timestamp with time zone,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_owner ON projects(owner_id, owner_type);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_visibility ON projects(visibility);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_tags ON projects USING gin(tags);

-- Full-text search index
CREATE INDEX idx_projects_search ON projects USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Function to generate unique slug from name
CREATE OR REPLACE FUNCTION generate_project_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  new_slug text;
  counter integer := 0;
BEGIN
  -- Generate base slug from name
  base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  -- If slug is provided, use it
  IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    RETURN NEW;
  END IF;

  -- Find unique slug
  new_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM projects WHERE slug = new_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := new_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug
CREATE TRIGGER generate_project_slug_trigger
  BEFORE INSERT OR UPDATE OF name ON projects
  FOR EACH ROW
  EXECUTE FUNCTION generate_project_slug();

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Public projects are viewable by everyone
CREATE POLICY "Public projects are viewable by everyone"
  ON projects
  FOR SELECT
  USING (visibility = 'public');

-- Policy: Unlisted projects are viewable by anyone with the link
CREATE POLICY "Unlisted projects are viewable by everyone"
  ON projects
  FOR SELECT
  USING (visibility = 'unlisted');

-- Policy: Users can view their own projects
CREATE POLICY "Users can view their own projects"
  ON projects
  FOR SELECT
  USING (
    owner_type = 'profile' AND owner_id = auth.uid()
  );

-- Policy: Organization members can view their org's projects
CREATE POLICY "Org members can view org projects"
  ON projects
  FOR SELECT
  USING (
    owner_type = 'organization' AND
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = projects.owner_id
      AND organization_members.profile_id = auth.uid()
      AND organization_members.status = 'active'
    )
  );

-- Policy: Users can create projects for themselves
CREATE POLICY "Users can create their own projects"
  ON projects
  FOR INSERT
  WITH CHECK (
    owner_type = 'profile' AND owner_id = auth.uid()
  );

-- Policy: Organization admins can create projects
CREATE POLICY "Org admins can create org projects"
  ON projects
  FOR INSERT
  WITH CHECK (
    owner_type = 'organization' AND
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = projects.owner_id
      AND organization_members.profile_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
      AND organization_members.status = 'active'
      AND (organization_members.permissions->>'can_create_campaigns')::boolean = true
    )
  );

-- Policy: Users can update their own projects
CREATE POLICY "Users can update their own projects"
  ON projects
  FOR UPDATE
  USING (
    owner_type = 'profile' AND owner_id = auth.uid()
  );

-- Policy: Organization admins can update org projects
CREATE POLICY "Org admins can update org projects"
  ON projects
  FOR UPDATE
  USING (
    owner_type = 'organization' AND
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = projects.owner_id
      AND organization_members.profile_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
      AND organization_members.status = 'active'
      AND (organization_members.permissions->>'can_edit_org')::boolean = true
    )
  );

-- Policy: Users can delete their own projects
CREATE POLICY "Users can delete their own projects"
  ON projects
  FOR DELETE
  USING (
    owner_type = 'profile' AND owner_id = auth.uid()
  );

-- Policy: Organization owners can delete org projects
CREATE POLICY "Org owners can delete org projects"
  ON projects
  FOR DELETE
  USING (
    owner_type = 'organization' AND
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = projects.owner_id
      AND organization_members.profile_id = auth.uid()
      AND organization_members.role = 'owner'
      AND organization_members.status = 'active'
    )
  );

-- Comment on table
COMMENT ON TABLE projects IS 'Long-term initiatives that can contain multiple campaigns. Owned by profiles or organizations.';
COMMENT ON COLUMN projects.owner_type IS 'Type of owner: profile (individual) or organization (group entity)';
COMMENT ON COLUMN projects.owner_id IS 'UUID of the owning profile or organization';
COMMENT ON COLUMN projects.status IS 'Current status of the project lifecycle';
COMMENT ON COLUMN projects.visibility IS 'Who can see this project: public (everyone), unlisted (with link), private (owner only)';
