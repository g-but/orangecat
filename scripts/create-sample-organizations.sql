-- Create sample organizations for testing
-- This simulates what would happen through the UI

-- Create BitBaum organization
INSERT INTO organizations (
  id, name, slug, description, type, governance_model,
  website_url, treasury_address, is_public, transparency_score,
  created_by
) VALUES (
  'bitbaum-org-id'::uuid,
  'BitBaum AG',
  'bitbaum',
  'Growing Bitcoin communities through transparent commerce and collective intelligence',
  'company',
  'quadratic_voting',
  'https://bitbaum.com',
  'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  true,
  95,
  'user-creator-id'::uuid
) ON CONFLICT (slug) DO NOTHING;

-- Create Martian Sovereignty organization
INSERT INTO organizations (
  id, name, slug, description, type, governance_model,
  website_url, treasury_address, is_public, transparency_score,
  created_by
) VALUES (
  'martian-org-id'::uuid,
  'Martian Sovereignty Initiative',
  'martian-sovereignty',
  'Raising Bitcoin to purchase sovereignty over Valles territory from the Ares Federation and Olympus Republic',
  'nonprofit',
  'democratic',
  null,
  'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  true,
  88,
  'user-creator-id'::uuid
) ON CONFLICT (slug) DO NOTHING;

-- Add creator as founder for BitBaum
INSERT INTO organization_stakeholders (
  organization_id, user_id, role_type, voting_weight, permissions, equity_percentage
) VALUES (
  'bitbaum-org-id'::uuid,
  'user-creator-id'::uuid,
  'founder',
  3.0,
  '["governance", "treasury", "management"]',
  100.0
) ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Add creator as founder for Martian Sovereignty
INSERT INTO organization_stakeholders (
  organization_id, user_id, role_type, voting_weight, permissions, equity_percentage
) VALUES (
  'martian-org-id'::uuid,
  'user-creator-id'::uuid,
  'founder',
  3.0,
  '["governance", "treasury", "management"]',
  100.0
) ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Create sample proposals for BitBaum
INSERT INTO organization_proposals (
  organization_id, proposer_id, title, description, proposal_type, voting_type, status
) VALUES (
  'bitbaum-org-id'::uuid,
  'user-creator-id'::uuid,
  'Q1 2026 Budget Approval',
  'Approve the Q1 2026 budget allocation for OrangeCat development and operations',
  'treasury',
  'quadratic',
  'active'
) ON CONFLICT DO NOTHING;

INSERT INTO organization_proposals (
  organization_id, proposer_id, title, description, proposal_type, voting_type, status
) VALUES (
  'bitbaum-org-id'::uuid,
  'user-creator-id'::uuid,
  'New Office Space Lease',
  'Consider leasing office space in Zurich for team collaboration',
  'treasury',
  'simple',
  'passed'
) ON CONFLICT DO NOTHING;

-- Create sample votes
INSERT INTO organization_votes (
  proposal_id, voter_id, vote, voting_power
) SELECT
  p.id, 'user-creator-id'::uuid, 'yes', 3.0
FROM organization_proposals p
WHERE p.title = 'New Office Space Lease'
ON CONFLICT DO NOTHING;

-- Associate OrangeCat project with BitBaum (assuming project exists)
-- This would normally be done through the UI
-- INSERT INTO organization_projects (organization_id, project_id, added_by)
-- SELECT 'bitbaum-org-id'::uuid, p.id, 'user-creator-id'::uuid
-- FROM projects p WHERE p.slug = 'orangecat-platform';



