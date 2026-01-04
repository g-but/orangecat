-- =============================================
-- UNIFY CIRCLES INTO ORGANIZATIONS
-- Migration: Add circle-specific fields to organizations table
-- Makes organizations table support both circles and formal organizations
-- =============================================

-- Step 1: Add circle-specific fields to organizations table (all optional)
-- These fields will be NULL for formal organizations, populated for circles

DO $$
BEGIN
  -- Member approval (auto/manual/invite) - default 'manual' for orgs, 'auto' for circles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'member_approval') THEN
    ALTER TABLE organizations ADD COLUMN member_approval text 
      CHECK (member_approval IN ('auto', 'manual', 'invite')) DEFAULT 'manual';
  END IF;

  -- Location restrictions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'location_restricted') THEN
    ALTER TABLE organizations ADD COLUMN location_restricted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'location_radius_km') THEN
    ALTER TABLE organizations ADD COLUMN location_radius_km integer;
  END IF;

  -- Activity tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'activity_level') THEN
    ALTER TABLE organizations ADD COLUMN activity_level text 
      CHECK (activity_level IN ('casual', 'regular', 'intensive'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'meeting_frequency') THEN
    ALTER TABLE organizations ADD COLUMN meeting_frequency text 
      CHECK (meeting_frequency IN ('none', 'weekly', 'monthly', 'quarterly'));
  END IF;

  -- Feature toggles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'enable_projects') THEN
    ALTER TABLE organizations ADD COLUMN enable_projects boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'enable_events') THEN
    ALTER TABLE organizations ADD COLUMN enable_events boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'enable_discussions') THEN
    ALTER TABLE organizations ADD COLUMN enable_discussions boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'require_member_intro') THEN
    ALTER TABLE organizations ADD COLUMN require_member_intro boolean DEFAULT false;
  END IF;

  -- Contribution requirements
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'contribution_required') THEN
    ALTER TABLE organizations ADD COLUMN contribution_required boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'contribution_amount') THEN
    ALTER TABLE organizations ADD COLUMN contribution_amount integer;
  END IF;

  -- Wallet purpose (for circles with optional treasury)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'wallet_purpose') THEN
    ALTER TABLE organizations ADD COLUMN wallet_purpose text;
  END IF;

  -- Member count tracking (if not exists)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'member_count') THEN
    ALTER TABLE organizations ADD COLUMN member_count integer DEFAULT 0;
  END IF;

  -- Total balance tracking (if not exists)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'total_balance_sats') THEN
    ALTER TABLE organizations ADD COLUMN total_balance_sats bigint DEFAULT 0;
  END IF;

  -- Total projects tracking (if not exists)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'total_projects') THEN
    ALTER TABLE organizations ADD COLUMN total_projects integer DEFAULT 0;
  END IF;
END $$;

-- Step 2: Make treasury_address optional (required for formal orgs, optional for circles)
-- Note: This may already be nullable, but we ensure it
DO $$
BEGIN
  -- Check if treasury_address has NOT NULL constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' 
    AND column_name = 'treasury_address' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE organizations ALTER COLUMN treasury_address DROP NOT NULL;
  END IF;
END $$;

-- Step 3: Ensure 'consensus' is in governance_model enum
-- Note: This should already exist, but we verify
DO $$
BEGIN
  -- Check if 'consensus' is allowed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%governance_model%' 
    AND check_clause LIKE '%consensus%'
  ) THEN
    -- If constraint exists but doesn't include consensus, we need to recreate it
    -- This is complex, so we'll assume it's already there
    -- If not, manual intervention may be needed
    RAISE NOTICE 'Please verify that governance_model includes ''consensus'' option';
  END IF;
END $$;

-- Step 4: Add visibility options if needed
-- Organizations currently have is_public boolean, circles have visibility enum
-- We'll use is_public for now, but add visibility column for future use
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'visibility') THEN
    ALTER TABLE organizations ADD COLUMN visibility text 
      CHECK (visibility IN ('public', 'members_only', 'private', 'hidden')) 
      DEFAULT 'public';
    
    -- Populate from is_public
    UPDATE organizations 
    SET visibility = CASE 
      WHEN is_public = true THEN 'public'
      ELSE 'private'
    END;
  END IF;
END $$;

-- Step 5: Create organization_wallets table (for multi-wallet support)
-- This mirrors circle_wallets structure
CREATE TABLE IF NOT EXISTS organization_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  purpose text CHECK (purpose IN ('general', 'projects', 'investment', 'community', 'emergency', 'other')),
  bitcoin_address text,
  lightning_address text,
  total_received_sats bigint DEFAULT 0,
  total_sent_sats bigint DEFAULT 0,
  current_balance_sats bigint DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  authorized_users text[], -- Array of user IDs
  required_signatures integer DEFAULT 1,
  total_signers integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 6: Create organization_activities table (for activity tracking)
-- This mirrors circle_activities structure
CREATE TABLE IF NOT EXISTS organization_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN (
    'joined', 'left', 'invited_member', 'created_wallet', 'funded_wallet', 
    'created_project', 'posted_update', 'made_offer', 'received_offer',
    'created_proposal', 'voted', 'proposal_passed', 'proposal_failed'
  )),
  description text NOT NULL,
  related_wallet_id uuid REFERENCES organization_wallets(id) ON DELETE SET NULL,
  related_project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  related_loan_id uuid REFERENCES loans(id) ON DELETE SET NULL,
  related_proposal_id uuid REFERENCES organization_proposals(id) ON DELETE SET NULL,
  related_amount_sats bigint,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_wallets_org_id ON organization_wallets(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_wallets_purpose ON organization_wallets(purpose);
CREATE INDEX IF NOT EXISTS idx_organization_activities_org_id ON organization_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_activities_user_id ON organization_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_activities_type ON organization_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_organization_activities_created_at ON organization_activities(created_at DESC);

-- Step 8: Enable RLS on new tables
ALTER TABLE organization_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_wallets
CREATE POLICY "Organization stakeholders can view wallets" ON organization_wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_stakeholders.organization_id = organization_wallets.organization_id
      AND organization_stakeholders.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization stakeholders with wallet permission can manage wallets" ON organization_wallets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_stakeholders.organization_id = organization_wallets.organization_id
      AND organization_stakeholders.user_id = auth.uid()
      AND (
        organization_stakeholders.role_type = 'founder'
        OR (organization_stakeholders.permissions::jsonb ? 'can_manage_wallets')
      )
    )
  );

-- RLS Policies for organization_activities
CREATE POLICY "Organization stakeholders can view activities" ON organization_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_stakeholders.organization_id = organization_activities.organization_id
      AND organization_stakeholders.user_id = auth.uid()
    )
  );

CREATE POLICY "Public organizations have public activities" ON organization_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_activities.organization_id
      AND organizations.is_public = true
    )
  );

-- Step 9: Create function to migrate circles to organizations
-- This will be called separately via a data migration script
CREATE OR REPLACE FUNCTION migrate_circle_to_organization(circle_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id uuid;
  circle_record RECORD;
BEGIN
  -- Get circle data
  SELECT * INTO circle_record FROM circles WHERE id = circle_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Circle not found: %', circle_id;
  END IF;

  -- Generate slug from name (simple version, may need improvement)
  -- In production, ensure slug uniqueness
  DECLARE
    org_slug text := lower(regexp_replace(circle_record.name, '[^a-zA-Z0-9]+', '-', 'g'));
    slug_exists boolean;
  BEGIN
    -- Check if slug exists, append number if needed
    SELECT EXISTS(SELECT 1 FROM organizations WHERE slug = org_slug) INTO slug_exists;
    IF slug_exists THEN
      org_slug := org_slug || '-' || substr(circle_record.id::text, 1, 8);
    END IF;

    -- Create organization from circle
    INSERT INTO organizations (
      name,
      slug,
      description,
      type,
      governance_model,
      is_public,
      requires_approval,
      visibility,
      member_approval,
      location_restricted,
      location_radius_km,
      activity_level,
      meeting_frequency,
      enable_projects,
      enable_events,
      enable_discussions,
      require_member_intro,
      contribution_required,
      contribution_amount,
      wallet_purpose,
      treasury_address,
      lightning_address,
      avatar_url,
      banner_url,
      category,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      circle_record.name,
      org_slug,
      circle_record.description,
      'circle',
      'consensus',
      circle_record.is_public,
      CASE 
        WHEN circle_record.member_approval = 'auto' THEN false
        ELSE true
      END,
      COALESCE(circle_record.visibility, CASE WHEN circle_record.is_public THEN 'public' ELSE 'private' END),
      circle_record.member_approval,
      circle_record.location_restricted,
      circle_record.location_radius_km,
      circle_record.activity_level,
      circle_record.meeting_frequency,
      circle_record.enable_projects,
      circle_record.enable_events,
      circle_record.enable_discussions,
      circle_record.require_member_intro,
      circle_record.contribution_required,
      circle_record.contribution_amount,
      circle_record.wallet_purpose,
      circle_record.bitcoin_address,
      NULL, -- lightning_address (add if exists in circles)
      NULL, -- avatar_url (add if exists in circles)
      NULL, -- banner_url (add if exists in circles)
      circle_record.category,
      circle_record.created_by,
      circle_record.created_at,
      circle_record.updated_at
    ) RETURNING id INTO new_org_id;

    -- Migrate circle_members to organization_stakeholders
    INSERT INTO organization_stakeholders (
      organization_id,
      user_id,
      role_type,
      voting_weight,
      permissions,
      joined_at,
      invited_by
    )
    SELECT 
      new_org_id,
      cm.user_id,
      CASE cm.role
        WHEN 'owner' THEN 'founder'
        WHEN 'admin' THEN 'founder'
        WHEN 'moderator' THEN 'employee'
        ELSE 'donor'
      END,
      1.0,
      jsonb_build_object(
        'can_invite_members', cm.can_invite_members,
        'can_manage_wallets', cm.can_manage_wallets,
        'can_create_projects', cm.can_create_projects,
        'can_manage_settings', cm.can_manage_settings
      ),
      cm.joined_at,
      cm.invited_by
    FROM circle_members cm
    WHERE cm.circle_id = circle_id
    AND cm.status = 'active';

    -- Migrate circle_wallets to organization_wallets
    INSERT INTO organization_wallets (
      organization_id,
      name,
      description,
      purpose,
      bitcoin_address,
      lightning_address,
      total_received_sats,
      total_sent_sats,
      current_balance_sats,
      is_active,
      created_by,
      authorized_users,
      required_signatures,
      total_signers,
      created_at,
      updated_at
    )
    SELECT 
      new_org_id,
      cw.name,
      cw.description,
      cw.purpose,
      cw.bitcoin_address,
      cw.lightning_address,
      cw.total_received_sats,
      cw.total_sent_sats,
      cw.current_balance_sats,
      cw.is_active,
      cw.created_by,
      cw.authorized_users,
      cw.required_signatures,
      cw.total_signers,
      cw.created_at,
      cw.updated_at
    FROM circle_wallets cw
    WHERE cw.circle_id = circle_id;

    -- Migrate circle_activities to organization_activities
    INSERT INTO organization_activities (
      organization_id,
      user_id,
      activity_type,
      description,
      related_wallet_id,
      related_project_id,
      related_loan_id,
      related_amount_sats,
      metadata,
      created_at
    )
    SELECT 
      new_org_id,
      ca.user_id,
      ca.activity_type,
      ca.description,
      NULL, -- related_wallet_id (would need mapping)
      ca.related_project_id,
      ca.related_loan_id,
      ca.related_amount_sats,
      ca.metadata,
      ca.created_at
    FROM circle_activities ca
    WHERE ca.circle_id = circle_id;

    RETURN new_org_id;
  END;
END;
$$;

-- Step 10: Add updated_at trigger for new tables
CREATE TRIGGER update_organization_wallets_updated_at
  BEFORE UPDATE ON organization_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Add comments for documentation
COMMENT ON COLUMN organizations.member_approval IS 'Membership approval method: auto (instant), manual (requires approval), invite (invite-only). Default manual for orgs, auto for circles.';
COMMENT ON COLUMN organizations.location_restricted IS 'Whether membership is restricted to a geographic area';
COMMENT ON COLUMN organizations.activity_level IS 'Expected activity level: casual, regular, or intensive';
COMMENT ON COLUMN organizations.enable_projects IS 'Whether members can create projects in this group';
COMMENT ON COLUMN organizations.enable_events IS 'Whether members can organize events';
COMMENT ON COLUMN organizations.enable_discussions IS 'Whether members can create discussion topics';
COMMENT ON TABLE organization_wallets IS 'Multi-wallet support for organizations (especially circles)';
COMMENT ON TABLE organization_activities IS 'Activity tracking/audit log for organizations';

-- =============================================
-- MIGRATION COMPLETE
-- 
-- Next steps:
-- 1. Run data migration script to move existing circles
-- 2. Update application code to use organizations table
-- 3. Test thoroughly
-- 4. Deprecate circles table after verification
-- =============================================


