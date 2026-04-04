-- Phase A: Drop dead money columns and research counters
--
-- projects: amount_sats, amount_btc, bitcoin_balance_btc, bitcoin_balance_updated_at
--   (all zeros — active columns are goal_amount and raised_amount)
-- events: organization_id (FK to dropped organizations table)
-- research_entities: 9 denormalized counters (all initialized to 0, never updated)

ALTER TABLE projects
  DROP COLUMN IF EXISTS amount_sats,
  DROP COLUMN IF EXISTS amount_btc,
  DROP COLUMN IF EXISTS bitcoin_balance_btc,
  DROP COLUMN IF EXISTS bitcoin_balance_updated_at;

ALTER TABLE events
  DROP COLUMN IF EXISTS organization_id;

ALTER TABLE research_entities
  DROP COLUMN IF EXISTS total_votes,
  DROP COLUMN IF EXISTS average_rating,
  DROP COLUMN IF EXISTS total_contributors,
  DROP COLUMN IF EXISTS completion_percentage,
  DROP COLUMN IF EXISTS days_active,
  DROP COLUMN IF EXISTS funding_velocity,
  DROP COLUMN IF EXISTS follower_count,
  DROP COLUMN IF EXISTS share_count,
  DROP COLUMN IF EXISTS citation_count;
