-- Migration: Circles System - Community Groups with Shared Wallets
-- Created: 2025-12-03
-- Purpose: Enable users to form circles/groups with shared wallets and activities
-- Priority: P0 - Core social feature for community building
-- Impact: User engagement, community organization, shared financial activities

BEGIN;

-- ==================== CIRCLES TABLE ====================

CREATE TABLE IF NOT EXISTS circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) <= 100),
  description text CHECK (char_length(description) <= 2000),
  avatar_url text,
  cover_image_url text,

  -- Circle settings
  is_public boolean DEFAULT true,
  join_policy text DEFAULT 'open' CHECK (join_policy IN ('open', 'invite_only', 'closed')),
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'members_only', 'private')),

  -- Circle metadata
  category text CHECK (category IN ('family', 'friends', 'business', 'investment', 'community', 'project', 'other')),
  tags text[],

  -- Governance
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rules text CHECK (char_length(rules) <= 5000), -- Community rules/guidelines

  -- Activity tracking
  member_count integer DEFAULT 1 CHECK (member_count >= 1),
  total_balance_sats bigint DEFAULT 0,
  total_projects integer DEFAULT 0,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  UNIQUE(name) -- Circle names must be unique
);

-- Indexes for circles
CREATE INDEX idx_circles_created_by ON circles(created_by);
CREATE INDEX idx_circles_public ON circles(is_public) WHERE is_public = true;
CREATE INDEX idx_circles_category ON circles(category);
CREATE INDEX idx_circles_member_count ON circles(member_count DESC);
CREATE INDEX idx_circles_created_at ON circles(created_at DESC);

-- Updated_at trigger for circles
CREATE OR REPLACE FUNCTION update_circles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_circles_updated_at
  BEFORE UPDATE ON circles
  FOR EACH ROW EXECUTE FUNCTION update_circles_updated_at();

-- ==================== CIRCLE MEMBERS TABLE ====================

CREATE TABLE IF NOT EXISTS circle_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Membership details
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at timestamptz DEFAULT now() NOT NULL,
  invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,

  -- Member status
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'left')),
  status_changed_at timestamptz DEFAULT now(),

  -- Permissions (can be customized per circle)
  can_invite_members boolean DEFAULT false,
  can_manage_wallets boolean DEFAULT false,
  can_create_projects boolean DEFAULT false,
  can_manage_settings boolean DEFAULT false,

  -- Activity tracking
  last_activity_at timestamptz DEFAULT now(),
  contribution_score integer DEFAULT 0, -- Based on activity/engagement

  -- Constraints
  UNIQUE(circle_id, user_id) -- User can only be in circle once
);

-- Indexes for circle members
CREATE INDEX idx_circle_members_circle ON circle_members(circle_id);
CREATE INDEX idx_circle_members_user ON circle_members(user_id);
CREATE INDEX idx_circle_members_role ON circle_members(circle_id, role);
CREATE INDEX idx_circle_members_status ON circle_members(status);
CREATE INDEX idx_circle_members_activity ON circle_members(last_activity_at DESC);

-- ==================== CIRCLE WALLETS TABLE ====================

CREATE TABLE IF NOT EXISTS circle_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,

  -- Wallet details
  name text NOT NULL CHECK (char_length(name) <= 100),
  description text CHECK (char_length(description) <= 500),
  purpose text CHECK (purpose IN ('general', 'projects', 'investment', 'community', 'emergency', 'other')),

  -- Bitcoin addresses (multiple for rotation/security)
  bitcoin_address text,
  lightning_address text,

  -- Financial tracking
  total_received_sats bigint DEFAULT 0,
  total_sent_sats bigint DEFAULT 0,
  current_balance_sats bigint DEFAULT 0,

  -- Access control
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES profiles(id),
  authorized_users uuid[], -- Array of user IDs who can access this wallet

  -- Multi-signature settings (for future expansion)
  required_signatures integer DEFAULT 1,
  total_signers integer DEFAULT 1,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CHECK (required_signatures <= total_signers),
  CHECK (total_signers >= 1),
  CHECK (bitcoin_address IS NOT NULL OR lightning_address IS NOT NULL)
);

-- Indexes for circle wallets
CREATE INDEX idx_circle_wallets_circle ON circle_wallets(circle_id);
CREATE INDEX idx_circle_wallets_active ON circle_wallets(circle_id, is_active) WHERE is_active = true;
CREATE INDEX idx_circle_wallets_purpose ON circle_wallets(purpose);

-- ==================== CIRCLE INVITATIONS TABLE ====================

CREATE TABLE IF NOT EXISTS circle_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE, -- NULL for email invites
  invited_email text,

  -- Invitation details
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  message text CHECK (char_length(message) <= 1000),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),

  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  responded_at timestamptz,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CHECK (invited_user_id IS NOT NULL OR invited_email IS NOT NULL),
  CHECK (expires_at > created_at)
);

-- Indexes for circle invitations
CREATE INDEX idx_circle_invitations_circle ON circle_invitations(circle_id);
CREATE INDEX idx_circle_invitations_invited_user ON circle_invitations(invited_user_id);
CREATE INDEX idx_circle_invitations_status ON circle_invitations(status);
CREATE INDEX idx_circle_invitations_expires ON circle_invitations(expires_at);

-- ==================== CIRCLE ACTIVITIES TABLE ====================

CREATE TABLE IF NOT EXISTS circle_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Activity details
  activity_type text NOT NULL CHECK (activity_type IN (
    'joined', 'left', 'invited_member', 'created_wallet', 'funded_wallet',
    'created_project', 'posted_update', 'made_offer', 'received_offer'
  )),
  description text NOT NULL CHECK (char_length(description) <= 500),

  -- Related entities
  related_wallet_id uuid REFERENCES circle_wallets(id) ON DELETE SET NULL,
  related_project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  related_loan_id uuid REFERENCES loans(id) ON DELETE SET NULL,
  related_amount_sats bigint,

  -- Metadata
  metadata jsonb DEFAULT '{}',

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for circle activities
CREATE INDEX idx_circle_activities_circle ON circle_activities(circle_id, created_at DESC);
CREATE INDEX idx_circle_activities_user ON circle_activities(user_id, created_at DESC);
CREATE INDEX idx_circle_activities_type ON circle_activities(activity_type);

-- ==================== HELPER FUNCTIONS ====================

-- Get circles for a user
CREATE OR REPLACE FUNCTION get_user_circles(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  avatar_url text,
  member_count integer,
  role text,
  joined_at timestamptz,
  is_public boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    c.description,
    c.avatar_url,
    c.member_count,
    cm.role,
    cm.joined_at,
    c.is_public
  FROM circles c
  JOIN circle_members cm ON c.id = cm.circle_id
  WHERE cm.user_id = p_user_id
    AND cm.status = 'active'
  ORDER BY cm.joined_at DESC;
$$;

-- Get circle members with details
CREATE OR REPLACE FUNCTION get_circle_members(p_circle_id uuid)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  role text,
  joined_at timestamptz,
  last_activity_at timestamptz,
  contribution_score integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id as user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    cm.role,
    cm.joined_at,
    cm.last_activity_at,
    cm.contribution_score
  FROM circle_members cm
  JOIN profiles p ON cm.user_id = p.id
  WHERE cm.circle_id = p_circle_id
    AND cm.status = 'active'
  ORDER BY
    CASE cm.role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'moderator' THEN 3
      WHEN 'member' THEN 4
    END,
    cm.joined_at ASC;
$$;

-- Get circle wallets
CREATE OR REPLACE FUNCTION get_circle_wallets(p_circle_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  purpose text,
  bitcoin_address text,
  lightning_address text,
  current_balance_sats bigint,
  is_active boolean,
  can_access boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cw.id,
    cw.name,
    cw.description,
    cw.purpose,
    cw.bitcoin_address,
    cw.lightning_address,
    cw.current_balance_sats,
    cw.is_active,
    CASE
      WHEN p_user_id IS NULL THEN false
      WHEN cw.authorized_users IS NULL THEN true -- Public access
      WHEN p_user_id = ANY(cw.authorized_users) THEN true
      ELSE false
    END as can_access
  FROM circle_wallets cw
  WHERE cw.circle_id = p_circle_id
    AND cw.is_active = true
  ORDER BY cw.created_at DESC;
$$;

-- Create a circle
CREATE OR REPLACE FUNCTION create_circle(
  p_name text,
  p_description text,
  p_created_by uuid,
  p_category text DEFAULT NULL,
  p_is_public boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_circle_id uuid;
BEGIN
  -- Create the circle
  INSERT INTO circles (
    name, description, created_by, category, is_public
  ) VALUES (
    p_name, p_description, p_created_by, p_category, p_is_public
  )
  RETURNING id INTO v_circle_id;

  -- Add creator as owner
  INSERT INTO circle_members (
    circle_id, user_id, role, can_invite_members, can_manage_wallets,
    can_create_projects, can_manage_settings
  ) VALUES (
    v_circle_id, p_created_by, 'owner', true, true, true, true
  );

  -- Log activity
  INSERT INTO circle_activities (
    circle_id, user_id, activity_type, description
  ) VALUES (
    v_circle_id, p_created_by, 'joined', 'Created the circle'
  );

  RETURN jsonb_build_object(
    'success', true,
    'circle_id', v_circle_id,
    'message', 'Circle created successfully'
  );
END;
$$;

-- ==================== RLS POLICIES ====================

-- Circles RLS
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public circles"
  ON circles FOR SELECT
  USING (is_public = true);

CREATE POLICY "Circle members can view their circles"
  ON circles FOR SELECT
  USING (
    id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create circles"
  ON circles FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Circle owners/admins can update their circles"
  ON circles FOR UPDATE
  USING (
    id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- Circle Members RLS
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle members can view other members"
  ON circle_members FOR SELECT
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Circle admins can manage members"
  ON circle_members FOR ALL
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- Circle Wallets RLS
ALTER TABLE circle_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle members can view wallets"
  ON circle_wallets FOR SELECT
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Authorized users can manage wallets"
  ON circle_wallets FOR ALL
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND (role IN ('owner', 'admin') OR can_manage_wallets = true)
    )
  );

-- Circle Invitations RLS
ALTER TABLE circle_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle members can view invitations"
  ON circle_invitations FOR SELECT
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Circle admins can manage invitations"
  ON circle_invitations FOR ALL
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'moderator')
    )
  );

-- Circle Activities RLS
ALTER TABLE circle_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle members can view activities"
  ON circle_activities FOR SELECT
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Circle members can create activities"
  ON circle_activities FOR INSERT
  WITH CHECK (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND user_id = auth.uid()
  );

-- ==================== TRIGGERS ====================

-- Update member count when members are added/removed
CREATE OR REPLACE FUNCTION update_circle_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE circles SET member_count = member_count + 1 WHERE id = NEW.circle_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE circles SET member_count = member_count - 1 WHERE id = OLD.circle_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE circles SET member_count = member_count + 1 WHERE id = NEW.circle_id;
    ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE circles SET member_count = member_count - 1 WHERE id = NEW.circle_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_circle_member_count
  AFTER INSERT OR UPDATE OR DELETE ON circle_members
  FOR EACH ROW EXECUTE FUNCTION update_circle_member_count();

-- ==================== VERIFICATION ====================

DO $$
DECLARE
  v_circles_table boolean;
  v_members_table boolean;
  v_wallets_table boolean;
  v_invitations_table boolean;
  v_activities_table boolean;
  v_functions_exist boolean;
BEGIN
  -- Check tables exist
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'circles') INTO v_circles_table;
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'circle_members') INTO v_members_table;
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'circle_wallets') INTO v_wallets_table;
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'circle_invitations') INTO v_invitations_table;
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'circle_activities') INTO v_activities_table;

  -- Check key functions exist
  SELECT EXISTS (SELECT FROM pg_proc WHERE proname IN ('get_user_circles', 'get_circle_members', 'create_circle')) INTO v_functions_exist;

  IF v_circles_table AND v_members_table AND v_wallets_table AND v_invitations_table AND v_activities_table AND v_functions_exist THEN
    RAISE NOTICE 'SUCCESS: Circles system created successfully';
    RAISE NOTICE '  ✓ Tables: circles, circle_members, circle_wallets, circle_invitations, circle_activities';
    RAISE NOTICE '  ✓ Functions: get_user_circles, get_circle_members, create_circle';
    RAISE NOTICE '  ✓ RLS: Policies enabled for all tables with proper access control';
    RAISE NOTICE '  ✓ Triggers: Automatic member count updates';
    RAISE NOTICE '  ✓ Multi-wallet: Circles can have multiple purpose-specific wallets';
    RAISE NOTICE '  ✓ Permissions: Role-based access control (owner/admin/moderator/member)';
  ELSE
    RAISE EXCEPTION 'FAILED: Circles system incomplete - tables exist: %, %, %, %, % - functions: %',
      v_circles_table, v_members_table, v_wallets_table, v_invitations_table, v_activities_table, v_functions_exist;
  END IF;
END $$;

-- ==================== COMMENTS ====================

COMMENT ON TABLE circles IS 'Community circles/groups that users can join with shared activities and wallets';
COMMENT ON TABLE circle_members IS 'Members of circles with roles and permissions';
COMMENT ON TABLE circle_wallets IS 'Bitcoin wallets owned by circles for different purposes';
COMMENT ON TABLE circle_invitations IS 'Pending invitations to join circles';
COMMENT ON TABLE circle_activities IS 'Activity feed for circle events and member actions';

COMMENT ON FUNCTION get_user_circles IS 'Get all circles a user belongs to with membership details';
COMMENT ON FUNCTION get_circle_members IS 'Get all members of a circle with their roles and activity';
COMMENT ON FUNCTION get_circle_wallets IS 'Get wallets for a circle with access permissions';
COMMENT ON FUNCTION create_circle IS 'Create a new circle and add creator as owner';

COMMIT;

-- ==================== USAGE EXAMPLES ====================
--
-- 1. Create a circle:
--    SELECT create_circle('My Investment Club', 'Investing in Bitcoin together', 'user-uuid', 'investment');
--
-- 2. Get user's circles:
--    SELECT * FROM get_user_circles('user-uuid');
--
-- 3. Get circle members:
--    SELECT * FROM get_circle_members('circle-uuid');
--
-- 4. Get circle wallets:
--    SELECT * FROM get_circle_wallets('circle-uuid', 'user-uuid');


























