-- Create organizations table
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('community', 'collective', 'dao', 'company', 'nonprofit', 'foundation', 'guild', 'circle')),
  category text,
  governance_model text NOT NULL CHECK (governance_model IN ('hierarchical', 'flat', 'democratic', 'consensus', 'liquid_democracy', 'quadratic_voting', 'stake_weighted', 'reputation_based')),
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
CREATE TABLE organization_stakeholders (
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
CREATE TABLE organization_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proposer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  proposal_type text NOT NULL CHECK (proposal_type IN ('general', 'treasury', 'membership', 'governance', 'emergency')),
  voting_type text NOT NULL DEFAULT 'simple' CHECK (voting_type IN ('simple', 'quadratic', 'stake_weighted', 'reputation')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'passed', 'failed', 'executed', 'cancelled')),
  voting_threshold decimal(5,2) DEFAULT 50.0, -- percentage required to pass
  execution_time timestamp with time zone,
  execution_delay interval DEFAULT '24 hours',
  data jsonb DEFAULT '{}', -- proposal-specific data
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create organization_votes table
CREATE TABLE organization_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES organization_proposals(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('yes', 'no', 'abstain')),
  voting_power decimal(20,8) DEFAULT 1.0,
  quadratic_cost integer DEFAULT 0, -- for quadratic voting
  voted_at timestamp with time zone DEFAULT now(),
  UNIQUE(proposal_id, voter_id)
);

-- Create organization_projects table (linking organizations to their projects)
CREATE TABLE organization_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at timestamp with time zone DEFAULT now(),
  UNIQUE(organization_id, project_id)
);

-- Create organization_invites table
CREATE TABLE organization_invites (
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

-- Indexes for performance
CREATE INDEX idx_organizations_created_by ON organizations(created_by);
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_is_public ON organizations(is_public);

CREATE INDEX idx_organization_stakeholders_org_id ON organization_stakeholders(organization_id);
CREATE INDEX idx_organization_stakeholders_user_id ON organization_stakeholders(user_id);
CREATE INDEX idx_organization_stakeholders_role ON organization_stakeholders(role_type);

CREATE INDEX idx_organization_proposals_org_id ON organization_proposals(organization_id);
CREATE INDEX idx_organization_proposals_status ON organization_proposals(status);
CREATE INDEX idx_organization_proposals_execution_time ON organization_proposals(execution_time);

CREATE INDEX idx_organization_votes_proposal_id ON organization_votes(proposal_id);
CREATE INDEX idx_organization_votes_voter_id ON organization_votes(voter_id);

CREATE INDEX idx_organization_projects_org_id ON organization_projects(organization_id);
CREATE INDEX idx_organization_projects_project_id ON organization_projects(project_id);

CREATE INDEX idx_organization_invites_org_id ON organization_invites(organization_id);
CREATE INDEX idx_organization_invites_token ON organization_invites(token);
CREATE INDEX idx_organization_invites_expires_at ON organization_invites(expires_at);

-- Row Level Security (RLS) Policies

-- Organizations: public read for public orgs, authenticated for private
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public organizations are viewable by everyone" ON organizations
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view organizations they are stakeholders in" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_stakeholders.organization_id = organizations.id
      AND organization_stakeholders.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Organization stakeholders can update their organizations" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_stakeholders.organization_id = organizations.id
      AND organization_stakeholders.user_id = auth.uid()
    )
  );

-- Organization Stakeholders: stakeholders can view their org's stakeholders
ALTER TABLE organization_stakeholders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization stakeholders can view their org's stakeholders" ON organization_stakeholders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_stakeholders os
      WHERE os.organization_id = organization_stakeholders.organization_id
      AND os.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization founders can manage stakeholders" ON organization_stakeholders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_stakeholders os
      WHERE os.organization_id = organization_stakeholders.organization_id
      AND os.user_id = auth.uid()
      AND os.role_type = 'founder'
    )
  );

-- Organization Proposals: stakeholders can view their org's proposals
ALTER TABLE organization_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization stakeholders can view proposals" ON organization_proposals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_stakeholders.organization_id = organization_proposals.organization_id
      AND organization_stakeholders.user_id = auth.uid()
    )
  );

CREATE POLICY "Stakeholders can create proposals" ON organization_proposals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_stakeholders.organization_id = organization_proposals.organization_id
      AND organization_stakeholders.user_id = auth.uid()
    )
  );

CREATE POLICY "Proposal creators and founders can update proposals" ON organization_proposals
  FOR UPDATE USING (
    proposer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_stakeholders.organization_id = organization_proposals.organization_id
      AND organization_stakeholders.user_id = auth.uid()
      AND organization_stakeholders.role_type = 'founder'
    )
  );

-- Organization Votes: stakeholders can vote on their org's proposals
ALTER TABLE organization_votes ENABLE ROW LEVEL SECURITY;

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

-- Organization Projects: stakeholders can manage their org's projects
ALTER TABLE organization_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization stakeholders can view projects" ON organization_projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_stakeholders.organization_id = organization_projects.organization_id
      AND organization_stakeholders.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization stakeholders can manage projects" ON organization_projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_stakeholders.organization_id = organization_projects.organization_id
      AND organization_stakeholders.user_id = auth.uid()
    )
  );

-- Organization Invites: founders can manage invites
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization founders can manage invites" ON organization_invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_stakeholders
      WHERE organization_stakeholders.organization_id = organization_invites.organization_id
      AND organization_stakeholders.user_id = auth.uid()
      AND organization_stakeholders.role_type = 'founder'
    )
  );

-- Functions for organization management

-- Function to calculate voting power for a user in an organization
CREATE OR REPLACE FUNCTION get_user_voting_power(org_id uuid, user_id uuid)
RETURNS decimal(20,8)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT voting_weight FROM organization_stakeholders
     WHERE organization_id = org_id AND user_id = user_id),
    0
  );
$$;

-- Function to calculate proposal voting results
CREATE OR REPLACE FUNCTION get_proposal_results(proposal_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'total_votes', COUNT(*),
    'yes_votes', SUM(CASE WHEN vote = 'yes' THEN voting_power ELSE 0 END),
    'no_votes', SUM(CASE WHEN vote = 'no' THEN voting_power ELSE 0 END),
    'abstain_votes', SUM(CASE WHEN vote = 'abstain' THEN voting_power ELSE 0 END),
    'total_voting_power', SUM(voting_power),
    'yes_percentage', CASE
      WHEN SUM(voting_power) > 0
      THEN ROUND((SUM(CASE WHEN vote = 'yes' THEN voting_power ELSE 0 END) / SUM(voting_power)) * 100, 2)
      ELSE 0
    END
  )
  FROM organization_votes
  WHERE organization_votes.proposal_id = proposal_id;
$$;

-- Function to check if a proposal has passed
CREATE OR REPLACE FUNCTION has_proposal_passed(proposal_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    CASE
      WHEN (SELECT voting_threshold FROM organization_proposals WHERE id = proposal_id) <=
           (SELECT yes_percentage FROM get_proposal_results(proposal_id))
      THEN true
      ELSE false
    END;
$$;

-- Function to calculate organization transparency score
CREATE OR REPLACE FUNCTION calculate_organization_transparency_score(org_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  score integer := 0;
  total_possible integer := 100;
BEGIN
  -- Public organization (+20)
  IF (SELECT is_public FROM organizations WHERE id = org_id) THEN
    score := score + 20;
  END IF;

  -- Has description (+10)
  IF (SELECT description FROM organizations WHERE id = org_id) IS NOT NULL THEN
    score := score + 10;
  END IF;

  -- Has website (+10)
  IF (SELECT website_url FROM organizations WHERE id = org_id) IS NOT NULL THEN
    score := score + 10;
  END IF;

  -- Has treasury address (+20)
  IF (SELECT treasury_address FROM organizations WHERE id = org_id) IS NOT NULL THEN
    score := score + 20;
  END IF;

  -- Has avatar (+5)
  IF (SELECT avatar_url FROM organizations WHERE id = org_id) IS NOT NULL THEN
    score := score + 5;
  END IF;

  -- Has stakeholders (+15)
  IF (SELECT COUNT(*) FROM organization_stakeholders WHERE organization_id = org_id) > 0 THEN
    score := score + 15;
  END IF;

  -- Has proposals (+10)
  IF (SELECT COUNT(*) FROM organization_proposals WHERE organization_id = org_id) > 0 THEN
    score := score + 10;
  END IF;

  -- Has public proposals (+10)
  IF EXISTS (
    SELECT 1 FROM organization_proposals op
    JOIN organizations o ON o.id = op.organization_id
    WHERE op.organization_id = org_id AND o.is_public = true
  ) THEN
    score := score + 10;
  END IF;

  RETURN LEAST(score, total_possible);
END;
$$;

-- Trigger to update organization transparency score
CREATE OR REPLACE FUNCTION update_organization_transparency_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE organizations
  SET transparency_score = calculate_organization_transparency_score(
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.organization_id
      ELSE NEW.organization_id
    END
  ),
  updated_at = now()
  WHERE id = CASE
    WHEN TG_OP = 'DELETE' THEN OLD.organization_id
    ELSE NEW.organization_id
  END;

  RETURN CASE
    WHEN TG_OP = 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$;

-- Create triggers for transparency score updates
CREATE TRIGGER update_organization_transparency_on_stakeholder_change
  AFTER INSERT OR UPDATE OR DELETE ON organization_stakeholders
  FOR EACH ROW EXECUTE FUNCTION update_organization_transparency_score();

CREATE TRIGGER update_organization_transparency_on_proposal_change
  AFTER INSERT OR UPDATE OR DELETE ON organization_proposals
  FOR EACH ROW EXECUTE FUNCTION update_organization_transparency_score();

CREATE TRIGGER update_organization_transparency_on_org_change
  AFTER UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_organization_transparency_score();

-- Updated at triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_proposals_updated_at
  BEFORE UPDATE ON organization_proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



