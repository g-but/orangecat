-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('community', 'collective', 'dao', 'company', 'nonprofit', 'foundation', 'guild', 'circle')),
  category text,
  governance_model text NOT NULL DEFAULT 'hierarchical' CHECK (governance_model IN ('hierarchical', 'flat', 'democratic', 'consensus', 'liquid_democracy', 'quadratic_voting', 'stake_weighted', 'reputation_based')),
  website_url text,
  treasury_address text,
  lightning_address text,
  avatar_url text,
  banner_url text,
  is_public boolean DEFAULT true,
  requires_approval boolean DEFAULT true,
  transparency_score integer DEFAULT 0 CHECK (transparency_score >= 0 AND transparency_score <= 100),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create organization_stakeholders table
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

-- Create organization_proposals table
CREATE TABLE IF NOT EXISTS organization_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proposer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  proposal_type text NOT NULL DEFAULT 'general' CHECK (proposal_type IN ('general', 'treasury', 'membership', 'governance', 'emergency')),
  voting_type text NOT NULL DEFAULT 'simple' CHECK (voting_type IN ('simple', 'quadratic', 'stake_weighted', 'reputation')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'passed', 'failed', 'executed', 'cancelled')),
  voting_threshold decimal(5,2) DEFAULT 50.0,
  execution_time timestamp with time zone,
  execution_delay interval DEFAULT '24 hours',
  data jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create organization_votes table
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

-- Create organization_projects table
CREATE TABLE IF NOT EXISTS organization_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at timestamp with time zone DEFAULT now(),
  UNIQUE(organization_id, project_id)
);

-- Create organization_invites table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_is_public ON organizations(is_public);

CREATE INDEX IF NOT EXISTS idx_organization_stakeholders_org_id ON organization_stakeholders(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_stakeholders_user_id ON organization_stakeholders(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_stakeholders_role ON organization_stakeholders(role_type);

CREATE INDEX IF NOT EXISTS idx_organization_proposals_org_id ON organization_proposals(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_proposals_status ON organization_proposals(status);
CREATE INDEX IF NOT EXISTS idx_organization_proposals_execution_time ON organization_proposals(execution_time);

CREATE INDEX IF NOT EXISTS idx_organization_votes_proposal_id ON organization_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_organization_votes_voter_id ON organization_votes(voter_id);

CREATE INDEX IF NOT EXISTS idx_organization_projects_org_id ON organization_projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_projects_project_id ON organization_projects(project_id);

CREATE INDEX IF NOT EXISTS idx_organization_invites_org_id ON organization_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invites_token ON organization_invites(token);
CREATE INDEX IF NOT EXISTS idx_organization_invites_expires_at ON organization_invites(expires_at);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified for development)
CREATE POLICY "organizations_select" ON organizations FOR SELECT USING (true);
CREATE POLICY "organizations_insert" ON organizations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "organizations_update" ON organizations FOR UPDATE USING (
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM organization_stakeholders WHERE organization_id = organizations.id AND user_id = auth.uid())
);

-- Similar policies for other tables
CREATE POLICY "stakeholders_select" ON organization_stakeholders FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_stakeholders os WHERE os.organization_id = organization_stakeholders.organization_id AND os.user_id = auth.uid())
);
CREATE POLICY "stakeholders_all" ON organization_stakeholders FOR ALL USING (
  EXISTS (SELECT 1 FROM organization_stakeholders os WHERE os.organization_id = organization_stakeholders.organization_id AND os.user_id = auth.uid() AND os.role_type = 'founder')
);

-- Functions
CREATE OR REPLACE FUNCTION calculate_organization_transparency_score(org_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  score integer := 0;
BEGIN
  -- Basic scoring logic
  IF (SELECT description FROM organizations WHERE id = org_id) IS NOT NULL THEN
    score := score + 10;
  END IF;
  IF (SELECT treasury_address FROM organizations WHERE id = org_id) IS NOT NULL THEN
    score := score + 20;
  END IF;
  IF (SELECT COUNT(*) FROM organization_stakeholders WHERE organization_id = org_id) > 0 THEN
    score := score + 15;
  END IF;
  RETURN LEAST(score, 100);
END;
$$;

-- Sample data for testing
INSERT INTO organizations (name, slug, description, type, governance_model, treasury_address, is_public, transparency_score)
VALUES
  ('BitBaum AG', 'bitbaum', 'Growing Bitcoin communities through transparent commerce and collective intelligence', 'company', 'quadratic_voting', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', true, 95),
  ('Martian Sovereignty Initiative', 'martian-sovereignty', 'Raising Bitcoin to purchase sovereignty over Valles territory from the Ares Federation and Olympus Republic', 'nonprofit', 'democratic', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', true, 88)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample stakeholders for BitBaum
INSERT INTO organization_stakeholders (organization_id, user_id, role_type, voting_weight, permissions, equity_percentage)
SELECT
  o.id,
  '00000000-0000-0000-0000-000000000001'::uuid, -- Placeholder user ID
  'founder',
  3.0,
  '["governance", "treasury", "management"]',
  33.33
FROM organizations o WHERE o.slug = 'bitbaum'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_stakeholders (organization_id, user_id, role_type, voting_weight, permissions, equity_percentage)
SELECT
  o.id,
  '00000000-0000-0000-0000-000000000002'::uuid, -- Placeholder user ID
  'founder',
  3.0,
  '["governance", "treasury", "management"]',
  33.33
FROM organizations o WHERE o.slug = 'bitbaum'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_stakeholders (organization_id, user_id, role_type, voting_weight, permissions, equity_percentage)
SELECT
  o.id,
  '00000000-0000-0000-0000-000000000003'::uuid, -- Placeholder user ID
  'founder',
  3.0,
  '["governance", "treasury", "management"]',
  33.33
FROM organizations o WHERE o.slug = 'bitbaum'
ON CONFLICT (organization_id, user_id) DO NOTHING;



