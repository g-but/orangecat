-- =============================================
-- UNIFIED GROUPS SYSTEM
--
-- Creates a simplified groups system where:
-- - Labels influence defaults but don't restrict capabilities
-- - Governance presets provide role permissions
-- - Features are optional toggles
-- =============================================

-- Step 1: Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,

  -- Label (identity/template, not capability lock)
  -- Values: circle, family, dao, company, nonprofit, cooperative, guild, network_state
  label text NOT NULL DEFAULT 'circle',
  tags text[] DEFAULT '{}',

  -- Display
  avatar_url text,
  banner_url text,

  -- Settings (all optional, can be changed anytime)
  is_public boolean DEFAULT true,
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'members_only', 'private')),
  bitcoin_address text,
  lightning_address text,

  -- Governance (preset provides defaults, can be customized)
  -- Values: consensus, democratic, hierarchical
  governance_preset text DEFAULT 'consensus',
  voting_threshold integer, -- Override preset threshold if needed

  -- Metadata
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 2: Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role (determines base permissions from governance preset)
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('founder', 'admin', 'member')),

  -- Permission overrides (optional, NULL = use role defaults from governance preset)
  permission_overrides jsonb,

  -- Metadata
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at timestamptz DEFAULT now(),

  UNIQUE(group_id, user_id)
);

-- Step 3: Create group_features table (enabled features per group)
CREATE TABLE IF NOT EXISTS group_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  feature_key text NOT NULL,  -- Values: treasury, proposals, voting, events, marketplace, shared_wallet
  enabled boolean DEFAULT true,
  config jsonb DEFAULT '{}',  -- Feature-specific settings
  enabled_at timestamptz DEFAULT now(),
  enabled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  UNIQUE(group_id, feature_key)
);

-- Step 4: Create group_proposals table (for voting feature)
CREATE TABLE IF NOT EXISTS group_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  proposer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  title text NOT NULL,
  description text,
  proposal_type text NOT NULL DEFAULT 'general' CHECK (proposal_type IN ('general', 'treasury', 'membership', 'governance')),

  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'passed', 'failed', 'executed', 'cancelled')),
  voting_threshold integer, -- Percentage required to pass (override group default)

  -- Action data (what happens if passed)
  action_type text,
  action_data jsonb DEFAULT '{}',

  -- Timing
  voting_starts_at timestamptz,
  voting_ends_at timestamptz,
  executed_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 5: Create group_votes table
CREATE TABLE IF NOT EXISTS group_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES group_proposals(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('yes', 'no', 'abstain')),
  voting_power decimal(20,8) DEFAULT 1.0,
  voted_at timestamptz DEFAULT now(),

  UNIQUE(proposal_id, voter_id)
);

-- Step 6: Create group_wallets table (for treasury/shared_wallet features)
CREATE TABLE IF NOT EXISTS group_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  purpose text CHECK (purpose IN ('general', 'projects', 'investment', 'community', 'emergency', 'savings', 'other')),
  bitcoin_address text,
  lightning_address text,
  current_balance_sats bigint DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  required_signatures integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_groups_slug ON groups(slug);
CREATE INDEX IF NOT EXISTS idx_groups_label ON groups(label);
CREATE INDEX IF NOT EXISTS idx_groups_is_public ON groups(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_groups_tags ON groups USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);

CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(role);

CREATE INDEX IF NOT EXISTS idx_group_features_group ON group_features(group_id);

CREATE INDEX IF NOT EXISTS idx_group_proposals_group ON group_proposals(group_id);
CREATE INDEX IF NOT EXISTS idx_group_proposals_status ON group_proposals(status);

CREATE INDEX IF NOT EXISTS idx_group_votes_proposal ON group_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_group_votes_voter ON group_votes(voter_id);

CREATE INDEX IF NOT EXISTS idx_group_wallets_group ON group_wallets(group_id);

-- Step 8: Enable Row Level Security
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_wallets ENABLE ROW LEVEL SECURITY;

-- Step 9: RLS Policies for groups table
CREATE POLICY "Public groups are viewable by everyone" ON groups
  FOR SELECT USING (is_public = true);

CREATE POLICY "Members can view their groups" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Members can update their groups" ON groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('founder', 'admin')
    )
  );

CREATE POLICY "Founders can delete groups" ON groups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'founder'
    )
  );

-- Step 10: RLS Policies for group_members table
CREATE POLICY "Members can view group members" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Public group members are viewable" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.is_public = true
    )
  );

CREATE POLICY "Founders and admins can manage members" ON group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('founder', 'admin')
    )
  );

-- Step 11: RLS Policies for group_features table
CREATE POLICY "Members can view group features" ON group_features
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_features.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Founders and admins can manage features" ON group_features
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_features.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('founder', 'admin')
    )
  );

-- Step 12: RLS Policies for group_proposals table
CREATE POLICY "Members can view proposals" ON group_proposals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_proposals.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create proposals" ON group_proposals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_proposals.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Proposers can update their proposals" ON group_proposals
  FOR UPDATE USING (proposer_id = auth.uid());

-- Step 13: RLS Policies for group_votes table
CREATE POLICY "Members can view votes" ON group_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = (
        SELECT group_id FROM group_proposals WHERE id = group_votes.proposal_id
      )
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can vote" ON group_votes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = (
        SELECT group_id FROM group_proposals WHERE id = group_votes.proposal_id
      )
      AND group_members.user_id = auth.uid()
    )
  );

-- Step 14: RLS Policies for group_wallets table
CREATE POLICY "Members can view wallets" ON group_wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_wallets.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Founders and admins can manage wallets" ON group_wallets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_wallets.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('founder', 'admin')
    )
  );

-- Step 15: Updated_at triggers
CREATE OR REPLACE FUNCTION update_groups_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_groups_updated_at();

CREATE TRIGGER group_proposals_updated_at
  BEFORE UPDATE ON group_proposals
  FOR EACH ROW EXECUTE FUNCTION update_groups_updated_at();

CREATE TRIGGER group_wallets_updated_at
  BEFORE UPDATE ON group_wallets
  FOR EACH ROW EXECUTE FUNCTION update_groups_updated_at();

-- Step 16: Add group_id to entity tables for ownership

-- Projects can be owned by groups
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'group_id') THEN
    ALTER TABLE projects ADD COLUMN group_id uuid REFERENCES groups(id) ON DELETE SET NULL;
    CREATE INDEX idx_projects_group_id ON projects(group_id) WHERE group_id IS NOT NULL;
  END IF;
END $$;

-- Products can be owned by groups
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_products' AND column_name = 'group_id') THEN
    ALTER TABLE user_products ADD COLUMN group_id uuid REFERENCES groups(id) ON DELETE SET NULL;
    CREATE INDEX idx_user_products_group_id ON user_products(group_id) WHERE group_id IS NOT NULL;
  END IF;
END $$;

-- Services can be owned by groups
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_services' AND column_name = 'group_id') THEN
    ALTER TABLE user_services ADD COLUMN group_id uuid REFERENCES groups(id) ON DELETE SET NULL;
    CREATE INDEX idx_user_services_group_id ON user_services(group_id) WHERE group_id IS NOT NULL;
  END IF;
END $$;

-- Step 17: Helper functions

-- Get user's groups
CREATE OR REPLACE FUNCTION get_user_groups(user_uuid uuid)
RETURNS TABLE (
  group_id uuid,
  group_name text,
  group_slug text,
  label text,
  role text,
  joined_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    g.id,
    g.name,
    g.slug,
    g.label,
    gm.role,
    gm.joined_at
  FROM groups g
  JOIN group_members gm ON g.id = gm.group_id
  WHERE gm.user_id = user_uuid
  ORDER BY gm.joined_at DESC;
$$;

-- Get group member count
CREATE OR REPLACE FUNCTION get_group_member_count(group_uuid uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer
  FROM group_members
  WHERE group_id = group_uuid;
$$;

-- Check if user is group member
CREATE OR REPLACE FUNCTION is_group_member(user_uuid uuid, group_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM group_members
    WHERE user_id = user_uuid AND group_id = group_uuid
  );
$$;

-- Get user's role in a group
CREATE OR REPLACE FUNCTION get_group_role(user_uuid uuid, group_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM group_members
  WHERE user_id = user_uuid AND group_id = group_uuid;
$$;

-- Step 18: Migration function from organizations to groups
CREATE OR REPLACE FUNCTION migrate_organization_to_group(org_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_group_id uuid;
  org_record RECORD;
BEGIN
  -- Get organization data
  SELECT * INTO org_record FROM organizations WHERE id = org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found: %', org_id;
  END IF;

  -- Map organization type to group label
  DECLARE
    group_label text := CASE org_record.type
      WHEN 'circle' THEN 'circle'
      WHEN 'community' THEN 'circle'
      WHEN 'collective' THEN 'cooperative'
      WHEN 'dao' THEN 'dao'
      WHEN 'company' THEN 'company'
      WHEN 'nonprofit' THEN 'nonprofit'
      WHEN 'foundation' THEN 'nonprofit'
      WHEN 'guild' THEN 'guild'
      ELSE 'circle'
    END;

    -- Map governance model to preset
    gov_preset text := CASE org_record.governance_model
      WHEN 'consensus' THEN 'consensus'
      WHEN 'democratic' THEN 'democratic'
      WHEN 'flat' THEN 'consensus'
      WHEN 'hierarchical' THEN 'hierarchical'
      WHEN 'liquid_democracy' THEN 'democratic'
      WHEN 'quadratic_voting' THEN 'democratic'
      WHEN 'stake_weighted' THEN 'democratic'
      WHEN 'reputation_based' THEN 'democratic'
      ELSE 'consensus'
    END;
  BEGIN
    -- Create group from organization
    INSERT INTO groups (
      id, -- Preserve the ID for easier migration
      name,
      slug,
      description,
      label,
      avatar_url,
      banner_url,
      is_public,
      visibility,
      bitcoin_address,
      lightning_address,
      governance_preset,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      org_record.id,
      org_record.name,
      org_record.slug,
      org_record.description,
      group_label,
      org_record.avatar_url,
      org_record.banner_url,
      org_record.is_public,
      COALESCE(org_record.visibility, CASE WHEN org_record.is_public THEN 'public' ELSE 'private' END),
      org_record.treasury_address,
      org_record.lightning_address,
      gov_preset,
      org_record.created_by,
      org_record.created_at,
      org_record.updated_at
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO new_group_id;

    -- If already exists, use existing ID
    IF new_group_id IS NULL THEN
      new_group_id := org_record.id;
    END IF;

    -- Migrate organization_stakeholders to group_members
    INSERT INTO group_members (group_id, user_id, role, permission_overrides, joined_at, invited_by)
    SELECT
      new_group_id,
      os.user_id,
      CASE os.role_type
        WHEN 'founder' THEN 'founder'
        WHEN 'employee' THEN 'admin'
        WHEN 'contractor' THEN 'admin'
        ELSE 'member'
      END,
      os.permissions,
      os.joined_at,
      os.invited_by
    FROM organization_stakeholders os
    WHERE os.organization_id = org_id
    ON CONFLICT (group_id, user_id) DO NOTHING;

    -- Enable treasury feature if organization has treasury address
    IF org_record.treasury_address IS NOT NULL THEN
      INSERT INTO group_features (group_id, feature_key, enabled)
      VALUES (new_group_id, 'treasury', true)
      ON CONFLICT (group_id, feature_key) DO NOTHING;
    END IF;

    RETURN new_group_id;
  END;
END;
$$;

-- Step 19: Comments for documentation
COMMENT ON TABLE groups IS 'Unified groups system - labels influence defaults but dont restrict capabilities';
COMMENT ON COLUMN groups.label IS 'Group identity/template: circle, family, dao, company, nonprofit, cooperative, guild, network_state';
COMMENT ON COLUMN groups.governance_preset IS 'Default permission model: consensus (unanimous), democratic (majority), hierarchical (founder/admin control)';
COMMENT ON TABLE group_members IS 'Group membership with roles and optional permission overrides';
COMMENT ON COLUMN group_members.permission_overrides IS 'JSON object overriding specific permissions for this member';
COMMENT ON TABLE group_features IS 'Optional features enabled per group: treasury, proposals, voting, events, marketplace, shared_wallet';

-- =============================================
-- MIGRATION COMPLETE
--
-- Tables created:
-- - groups
-- - group_members
-- - group_features
-- - group_proposals
-- - group_votes
-- - group_wallets
--
-- Entity tables updated:
-- - projects.group_id
-- - user_products.group_id
-- - user_services.group_id
--
-- Next steps:
-- 1. Deploy application code
-- 2. Migrate existing organizations using migrate_organization_to_group()
-- 3. Test thoroughly
-- 4. Deprecate organizations table after verification
-- =============================================
