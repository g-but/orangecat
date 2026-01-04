-- Fix organizations schema: Add missing tables and columns
-- This migration adds the stakeholder/proposal system while preserving existing data

-- 1. Add missing columns to organizations table if they don't exist
DO $$
BEGIN
  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'created_by') THEN
    ALTER TABLE organizations ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    -- Populate created_by from profile_id if it exists
    UPDATE organizations SET created_by = profile_id WHERE profile_id IS NOT NULL AND created_by IS NULL;
  END IF;

  -- Add transparency_score if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'transparency_score') THEN
    ALTER TABLE organizations ADD COLUMN transparency_score integer DEFAULT 0 CHECK (transparency_score >= 0 AND transparency_score <= 100);
  END IF;

  -- Add lightning_address if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'lightning_address') THEN
    ALTER TABLE organizations ADD COLUMN lightning_address text;
  END IF;
END $$;

-- 2. Create organization_stakeholders table
CREATE TABLE IF NOT EXISTS organization_stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_type text NOT NULL CHECK (role_type IN ('founder', 'employee', 'contractor', 'shareholder', 'lender', 'donor')),
  voting_weight decimal(10,4) DEFAULT 1.0,
  permissions jsonb DEFAULT '[]',
  equity_percentage decimal(5,2) DEFAULT 0 CHECK (equity_percentage >= 0 AND equity_percentage <= 100),
  joined_at timestamp with time zone DEFAULT now(),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(organization_id, user_id)
);

-- 3. Create organization_proposals table
CREATE TABLE IF NOT EXISTS organization_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proposer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  proposal_type text NOT NULL CHECK (proposal_type IN ('general', 'treasury', 'membership', 'governance', 'emergency')),
  voting_type text NOT NULL DEFAULT 'simple' CHECK (voting_type IN ('simple', 'quadratic', 'stake_weighted', 'reputation')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'passed', 'failed', 'executed', 'cancelled')),
  voting_threshold decimal(5,2) DEFAULT 50.0,
  execution_time timestamp with time zone,
  execution_delay interval DEFAULT '24 hours',
  data jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. Create organization_votes table
CREATE TABLE IF NOT EXISTS organization_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES organization_proposals(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('yes', 'no', 'abstain')),
  voting_power decimal(20,8) DEFAULT 1.0,
  quadratic_cost integer DEFAULT 0,
  voted_at timestamp with time zone DEFAULT now(),
  UNIQUE(proposal_id, voter_id)
);

-- 5. Create organization_projects table (only if projects table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    CREATE TABLE IF NOT EXISTS organization_projects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
      added_at timestamp with time zone DEFAULT now(),
      UNIQUE(organization_id, project_id)
    );
  END IF;
END $$;

-- 6. Create organization_invites table
CREATE TABLE IF NOT EXISTS organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role_type text NOT NULL CHECK (role_type IN ('founder', 'employee', 'contractor', 'shareholder', 'lender', 'donor')),
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamp with time zone DEFAULT now()
);

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_organization_stakeholders_org_id ON organization_stakeholders(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_stakeholders_user_id ON organization_stakeholders(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_stakeholders_role ON organization_stakeholders(role_type);

CREATE INDEX IF NOT EXISTS idx_organization_proposals_org_id ON organization_proposals(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_proposals_status ON organization_proposals(status);

CREATE INDEX IF NOT EXISTS idx_organization_votes_proposal_id ON organization_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_organization_votes_voter_id ON organization_votes(voter_id);

CREATE INDEX IF NOT EXISTS idx_organization_invites_org_id ON organization_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invites_token ON organization_invites(token);

-- 8. Add RLS policies for new tables
ALTER TABLE organization_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- Stakeholders policies
DROP POLICY IF EXISTS "Organization stakeholders can view their org's stakeholders" ON organization_stakeholders;
CREATE POLICY "Organization stakeholders can view their org's stakeholders" ON organization_stakeholders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_stakeholders os
      WHERE os.organization_id = organization_stakeholders.organization_id
      AND os.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organization founders can manage stakeholders" ON organization_stakeholders;
CREATE POLICY "Organization founders can manage stakeholders" ON organization_stakeholders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_stakeholders os
      WHERE os.organization_id = organization_stakeholders.organization_id
      AND os.user_id = auth.uid()
      AND os.role_type = 'founder'
    )
  );

-- Allow inserting first founder (for new orgs)
DROP POLICY IF EXISTS "Users can add themselves as founder to new orgs" ON organization_stakeholders;
CREATE POLICY "Users can add themselves as founder to new orgs" ON organization_stakeholders
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    role_type = 'founder' AND
    NOT EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_id = organization_stakeholders.organization_id
    )
  );

-- Proposals policies
DROP POLICY IF EXISTS "Organization stakeholders can view proposals" ON organization_proposals;
CREATE POLICY "Organization stakeholders can view proposals" ON organization_proposals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_stakeholders.organization_id = organization_proposals.organization_id
      AND organization_stakeholders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Stakeholders can create proposals" ON organization_proposals;
CREATE POLICY "Stakeholders can create proposals" ON organization_proposals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_stakeholders.organization_id = organization_proposals.organization_id
      AND organization_stakeholders.user_id = auth.uid()
    )
  );

-- Votes policies
DROP POLICY IF EXISTS "Organization stakeholders can view votes" ON organization_votes;
CREATE POLICY "Organization stakeholders can view votes" ON organization_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_stakeholders.organization_id = (
        SELECT organization_id FROM organization_proposals WHERE id = organization_votes.proposal_id
      )
      AND organization_stakeholders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organization stakeholders can vote" ON organization_votes;
CREATE POLICY "Organization stakeholders can vote" ON organization_votes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_stakeholders.organization_id = (
        SELECT organization_id FROM organization_proposals WHERE id = organization_votes.proposal_id
      )
      AND organization_stakeholders.user_id = auth.uid()
    )
  );

-- Invites policies
DROP POLICY IF EXISTS "Organization founders can manage invites" ON organization_invites;
CREATE POLICY "Organization founders can manage invites" ON organization_invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_stakeholders.organization_id = organization_invites.organization_id
      AND organization_stakeholders.user_id = auth.uid()
      AND organization_stakeholders.role_type = 'founder'
    )
  );

-- 9. Add founder stakeholders for existing organizations (based on profile_id or created_by)
INSERT INTO organization_stakeholders (organization_id, user_id, role_type, voting_weight, equity_percentage, permissions)
SELECT
  id as organization_id,
  COALESCE(created_by, profile_id) as user_id,
  'founder' as role_type,
  3.0 as voting_weight,
  100.0 as equity_percentage,
  '["admin", "invite", "manage_treasury", "create_proposals"]'::jsonb as permissions
FROM organizations
WHERE COALESCE(created_by, profile_id) IS NOT NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 10. Update organizations RLS to include DELETE for founders
DROP POLICY IF EXISTS "Founders can delete organizations" ON organizations;
CREATE POLICY "Founders can delete organizations" ON organizations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_stakeholders.organization_id = organizations.id
      AND organization_stakeholders.user_id = auth.uid()
      AND organization_stakeholders.role_type = 'founder'
    )
  );
