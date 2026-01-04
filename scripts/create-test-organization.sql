-- Create a test BitBaum organization directly in the database
-- This will test that the organization system works end-to-end

INSERT INTO organizations (
  id,
  name,
  slug,
  description,
  type,
  category,
  governance_model,
  website_url,
  treasury_address,
  lightning_address,
  is_public,
  requires_approval,
  transparency_score,
  created_by
) VALUES (
  'bitbaum-test-id'::uuid,
  'BitBaum AG',
  'bitbaum',
  'Growing Bitcoin communities through transparent commerce and collective intelligence. BitBaum is the parent company of OrangeCat, building the future of Bitcoin-powered social commerce and AI.',
  'company',
  'Technology, Finance, AI',
  'liquid_democracy',
  'https://bitbaum.com',
  'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  null,
  true,
  true,
  85,
  'cec88bc9-557f-452b-92f1-e093092fe093'::uuid
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  category = EXCLUDED.category,
  governance_model = EXCLUDED.governance_model,
  website_url = EXCLUDED.website_url,
  treasury_address = EXCLUDED.treasury_address,
  transparency_score = EXCLUDED.transparency_score;

-- Add the creator as a founder
INSERT INTO organization_stakeholders (
  organization_id,
  user_id,
  role_type,
  voting_weight,
  permissions,
  equity_percentage
) VALUES (
  'bitbaum-test-id'::uuid,
  'cec88bc9-557f-452b-92f1-e093092fe093'::uuid,
  'founder',
  3.0,
  '["governance", "treasury", "management", "invitations"]',
  100.0
) ON CONFLICT (organization_id, user_id) DO UPDATE SET
  role_type = EXCLUDED.role_type,
  voting_weight = EXCLUDED.voting_weight,
  permissions = EXCLUDED.permissions,
  equity_percentage = EXCLUDED.equity_percentage;

-- Create a sample proposal
INSERT INTO organization_proposals (
  id,
  organization_id,
  proposer_id,
  title,
  description,
  proposal_type,
  voting_type,
  status,
  voting_threshold,
  data
) VALUES (
  'sample-proposal-id'::uuid,
  'bitbaum-test-id'::uuid,
  'cec88bc9-557f-452b-92f1-e093092fe093'::uuid,
  'Q1 2026 Budget Approval',
  'Approve the Q1 2026 budget allocation for OrangeCat platform development and operations totaling ₿ 45.5',
  'treasury',
  'quadratic',
  'active',
  50.0,
  '{"amount": "45.5", "currency": "BTC", "purpose": "OrangeCat development"}'
) ON CONFLICT DO NOTHING;

-- Add a sample vote
INSERT INTO organization_votes (
  proposal_id,
  voter_id,
  vote,
  voting_power
) VALUES (
  'sample-proposal-id'::uuid,
  'cec88bc9-557f-452b-92f1-e093092fe093'::uuid,
  'yes',
  3.0
) ON CONFLICT DO NOTHING;



