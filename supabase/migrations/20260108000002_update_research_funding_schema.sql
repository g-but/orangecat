-- Update research entities schema to remove sats terminology
-- Replace funding_goal_sats and funding_raised_sats with funding_goal, funding_goal_currency, and funding_raised_btc

-- Add new columns
ALTER TABLE research_entities
  ADD COLUMN IF NOT EXISTS funding_goal NUMERIC(20,8),
  ADD COLUMN IF NOT EXISTS funding_goal_currency TEXT DEFAULT 'CHF',
  ADD COLUMN IF NOT EXISTS funding_raised_btc NUMERIC(20,8) DEFAULT 0;

-- Update research_contributions table
ALTER TABLE research_contributions
  ADD COLUMN IF NOT EXISTS amount_btc NUMERIC(20,8);

-- Migrate existing data (assuming CHF as default currency and rough BTC conversion)
-- This is a simplified migration - in production you'd want more sophisticated currency conversion
UPDATE research_entities
SET
  funding_goal = funding_goal_sats / 100000000.0, -- Rough conversion assuming sats were in BTC equivalent
  funding_goal_currency = 'BTC',
  funding_raised_btc = funding_raised_sats / 100000000.0
WHERE funding_goal_sats IS NOT NULL;

-- Migrate contributions data
UPDATE research_contributions
SET amount_btc = amount_sats / 100000000.0
WHERE amount_sats IS NOT NULL;

-- Update the RPC function to use new schema
CREATE OR REPLACE FUNCTION update_research_funding(
  research_entity_id UUID,
  amount_btc NUMERIC
) RETURNS void AS $$
BEGIN
  UPDATE research_entities
  SET
    funding_raised_btc = funding_raised_btc + amount_btc,
    total_contributors = (
      SELECT COUNT(DISTINCT user_id)
      FROM research_contributions
      WHERE research_entity_id = research_entities.id
      AND user_id IS NOT NULL
      AND anonymous = false
    ),
    funding_velocity = CASE
      WHEN days_active > 0 THEN
        ROUND((funding_raised_btc + amount_btc)::numeric / days_active, 2)
      ELSE 0
    END,
    updated_at = NOW()
  WHERE id = research_entity_id;
END;
$$ LANGUAGE plpgsql;

-- Drop old columns after data migration
-- Note: In production, you'd want to do this in a separate migration after verifying data integrity
-- ALTER TABLE research_entities DROP COLUMN IF EXISTS funding_goal_sats;
-- ALTER TABLE research_entities DROP COLUMN IF EXISTS funding_raised_sats;
-- ALTER TABLE research_contributions DROP COLUMN IF EXISTS amount_sats;