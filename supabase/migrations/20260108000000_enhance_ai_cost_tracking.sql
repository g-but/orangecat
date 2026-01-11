-- ============================================================================
-- Enhanced AI Cost Tracking Migration
-- ============================================================================
-- Purpose: Separate API cost from creator markup for transparency
-- Created: 2026-01-08
-- ============================================================================

-- Add new columns to ai_messages for transparent cost tracking
ALTER TABLE ai_messages
ADD COLUMN IF NOT EXISTS api_cost_sats BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS creator_markup_sats BIGINT DEFAULT 0;

-- Add allowed_models column to ai_assistants for creator model restrictions
ALTER TABLE ai_assistants
ADD COLUMN IF NOT EXISTS allowed_models TEXT[] DEFAULT '{}';

-- Add default_model column to ai_assistants
ALTER TABLE ai_assistants
ADD COLUMN IF NOT EXISTS default_model TEXT DEFAULT 'auto';

-- Update existing records to estimate cost split (assume 70% was API cost)
-- Only update records where api_cost_sats is still 0 but cost_sats > 0
UPDATE ai_messages
SET
  api_cost_sats = FLOOR(cost_sats * 0.7),
  creator_markup_sats = CEIL(cost_sats * 0.3)
WHERE cost_sats > 0 AND api_cost_sats = 0;

-- Add comments for documentation
COMMENT ON COLUMN ai_messages.api_cost_sats IS 'Actual OpenRouter API cost in satoshis';
COMMENT ON COLUMN ai_messages.creator_markup_sats IS 'Creator markup above API cost in satoshis';
COMMENT ON COLUMN ai_assistants.allowed_models IS 'List of OpenRouter model IDs users can select (empty = all available)';
COMMENT ON COLUMN ai_assistants.default_model IS 'Default model ID or "auto" for automatic selection';

-- Create index for analytics on model_used
CREATE INDEX IF NOT EXISTS idx_ai_messages_model_used ON ai_messages(model_used);

-- Create index for cost analytics
CREATE INDEX IF NOT EXISTS idx_ai_messages_cost_tracking
ON ai_messages(conversation_id, api_cost_sats, creator_markup_sats);

-- ============================================================================
-- Update ai_assistants to support new model selection options
-- ============================================================================

-- Add column for minimum model tier (economy, standard, premium)
ALTER TABLE ai_assistants
ADD COLUMN IF NOT EXISTS min_model_tier TEXT DEFAULT 'economy'
  CHECK (min_model_tier IN ('economy', 'standard', 'premium'));

COMMENT ON COLUMN ai_assistants.min_model_tier IS 'Minimum model tier for this assistant (economy, standard, premium)';

-- ============================================================================
-- Create view for cost analytics
-- ============================================================================

CREATE OR REPLACE VIEW ai_cost_analytics AS
SELECT
  a.id AS assistant_id,
  a.title AS assistant_title,
  a.user_id AS creator_id,
  COUNT(m.id) AS total_messages,
  SUM(m.tokens_used) AS total_tokens,
  SUM(m.cost_sats) AS total_cost_sats,
  SUM(m.api_cost_sats) AS total_api_cost_sats,
  SUM(m.creator_markup_sats) AS total_creator_earnings_sats,
  AVG(m.cost_sats) AS avg_cost_per_message,
  COUNT(DISTINCT c.user_id) AS unique_users
FROM ai_assistants a
LEFT JOIN ai_conversations c ON c.assistant_id = a.id
LEFT JOIN ai_messages m ON m.conversation_id = c.id AND m.role = 'assistant'
GROUP BY a.id, a.title, a.user_id;

COMMENT ON VIEW ai_cost_analytics IS 'Analytics view for AI assistant costs and earnings';

-- ============================================================================
-- Grant permissions
-- ============================================================================

-- Allow authenticated users to see the analytics for their own assistants
-- (RLS on the underlying tables will handle access control)
