-- Create organization_members table for managing organization membership
-- This replaces the generic profile_associations approach for clearer organization management

CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Role-based access control
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'contributor')),

  -- Granular permissions (JSONB for flexibility)
  permissions jsonb DEFAULT '{
    "can_edit_org": false,
    "can_create_campaigns": false,
    "can_invite_members": false,
    "can_manage_funds": false,
    "can_remove_members": false,
    "can_edit_campaigns": false
  }'::jsonb,

  -- Bitcoin reward system
  bitcoin_reward_address text,
  reward_share_percentage numeric DEFAULT 0 CHECK (reward_share_percentage >= 0 AND reward_share_percentage <= 100),

  -- Membership tracking
  joined_at timestamp with time zone DEFAULT now(),
  invited_by uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'removed', 'suspended')),

  -- Metadata
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Ensure one membership per profile per organization
  UNIQUE(organization_id, profile_id)
);

-- Indexes for performance
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_profile ON organization_members(profile_id);
CREATE INDEX idx_org_members_status ON organization_members(status);
CREATE INDEX idx_org_members_role ON organization_members(role);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organization_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_members_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all active memberships in public organizations
CREATE POLICY "Public organizations memberships are viewable by everyone"
  ON organization_members
  FOR SELECT
  USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_members.organization_id
      AND organizations.visibility = 'public'
    )
  );

-- Policy: Users can view their own memberships
CREATE POLICY "Users can view their own memberships"
  ON organization_members
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Policy: Organization owners and admins can view all memberships
CREATE POLICY "Org admins can view all memberships"
  ON organization_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.profile_id = auth.uid()
      AND om.role IN ('owner', 'admin')
      AND om.status = 'active'
    )
  );

-- Policy: Organization owners and admins can insert new members
CREATE POLICY "Org admins can add members"
  ON organization_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND profile_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND status = 'active'
      AND (permissions->>'can_invite_members')::boolean = true
    )
  );

-- Policy: Organization owners and admins can update memberships
CREATE POLICY "Org admins can update memberships"
  ON organization_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.profile_id = auth.uid()
      AND om.role IN ('owner', 'admin')
      AND om.status = 'active'
    )
  );

-- Policy: Organization owners can remove members
CREATE POLICY "Org owners can remove members"
  ON organization_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND profile_id = auth.uid()
      AND role = 'owner'
      AND status = 'active'
    )
  );

-- Comment on table
COMMENT ON TABLE organization_members IS 'Manages membership relationships between profiles and organizations with role-based permissions';
COMMENT ON COLUMN organization_members.role IS 'Member role: owner (founder/full control), admin (management), member (standard), contributor (limited)';
COMMENT ON COLUMN organization_members.permissions IS 'Granular permissions that override default role permissions';
COMMENT ON COLUMN organization_members.reward_share_percentage IS 'Percentage of organization Bitcoin rewards allocated to this member';
