-- ============================================================
-- AI Assistants Table
-- Autonomous AI services that creators build and monetize
--
-- Part of OrangeCat's decentralized AI marketplace vision:
-- - Creators define prompts/context (portable AI software)
-- - Flexible compute: API providers OR self-hosted/community
-- - Direct Bitcoin micropayments (95%+ creator share)
--
-- Created: 2025-12-25
-- ============================================================

-- Create compute provider type enum
CREATE TYPE compute_provider_type AS ENUM (
  'api',           -- External API (OpenAI, Anthropic, etc.)
  'self_hosted',   -- Creator's own hardware
  'community'      -- Community-provided compute (circles, orgs)
);

-- Create AI assistant status enum
CREATE TYPE ai_assistant_status AS ENUM (
  'draft',     -- Not yet published
  'active',    -- Live and accepting requests
  'paused',    -- Temporarily disabled
  'archived'   -- Soft deleted
);

-- Create pricing model enum
CREATE TYPE ai_pricing_model AS ENUM (
  'per_message',     -- Fixed price per message
  'per_token',       -- Price based on token usage
  'subscription',    -- Monthly subscription
  'free'             -- Free to use
);

-- ==================== MAIN TABLE ====================

CREATE TABLE IF NOT EXISTS ai_assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  avatar_url TEXT,

  -- AI Configuration (the "software")
  system_prompt TEXT NOT NULL,
  welcome_message TEXT,
  personality_traits TEXT[],  -- e.g., ['friendly', 'professional', 'concise']
  knowledge_base_urls TEXT[], -- URLs the AI can reference

  -- Model Preferences
  model_preference TEXT DEFAULT 'any',  -- 'gpt-4', 'claude-3-opus', 'any', etc.
  max_tokens_per_response INTEGER DEFAULT 1000,
  temperature DECIMAL(3,2) DEFAULT 0.7,

  -- Compute Configuration
  compute_provider_type compute_provider_type DEFAULT 'api',
  compute_provider_id UUID,  -- Reference to compute provider if self-hosted/community
  api_provider TEXT,         -- 'openai', 'anthropic', 'local' etc.

  -- Pricing (in satoshis)
  pricing_model ai_pricing_model DEFAULT 'per_message',
  price_per_message_sats INTEGER DEFAULT 0,
  price_per_1k_tokens_sats INTEGER DEFAULT 0,
  subscription_price_sats INTEGER DEFAULT 0,  -- Monthly subscription price
  free_messages_per_day INTEGER DEFAULT 0,    -- Free tier limit

  -- Visibility & Status
  status ai_assistant_status DEFAULT 'draft',
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,

  -- Usage Statistics (denormalized for performance)
  total_conversations INTEGER DEFAULT 0,
  total_messages BIGINT DEFAULT 0,
  total_tokens_used BIGINT DEFAULT 0,
  total_revenue_sats BIGINT DEFAULT 0,
  average_rating DECIMAL(3,2),
  total_ratings INTEGER DEFAULT 0,

  -- Bitcoin Payment Info
  lightning_address TEXT,
  bitcoin_address TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,  -- When first made active

  -- Constraints
  CONSTRAINT valid_price CHECK (
    (pricing_model = 'free') OR
    (pricing_model = 'per_message' AND price_per_message_sats >= 0) OR
    (pricing_model = 'per_token' AND price_per_1k_tokens_sats >= 0) OR
    (pricing_model = 'subscription' AND subscription_price_sats >= 0)
  ),
  CONSTRAINT valid_temperature CHECK (temperature >= 0 AND temperature <= 2)
);

-- ==================== INDEXES ====================

CREATE INDEX idx_ai_assistants_user_id ON ai_assistants(user_id);
CREATE INDEX idx_ai_assistants_status ON ai_assistants(status);
CREATE INDEX idx_ai_assistants_category ON ai_assistants(category);
CREATE INDEX idx_ai_assistants_is_public ON ai_assistants(is_public) WHERE is_public = true;
CREATE INDEX idx_ai_assistants_is_featured ON ai_assistants(is_featured) WHERE is_featured = true;
CREATE INDEX idx_ai_assistants_created_at ON ai_assistants(created_at DESC);

-- ==================== RLS POLICIES ====================

ALTER TABLE ai_assistants ENABLE ROW LEVEL SECURITY;

-- Anyone can view public, active AI assistants
CREATE POLICY "Public AI assistants are viewable by everyone"
  ON ai_assistants FOR SELECT
  USING (status = 'active' AND is_public = true);

-- Owners can view all their own AI assistants
CREATE POLICY "Users can view their own AI assistants"
  ON ai_assistants FOR SELECT
  USING (auth.uid() = user_id);

-- Owners can create AI assistants
CREATE POLICY "Users can create AI assistants"
  ON ai_assistants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owners can update their AI assistants
CREATE POLICY "Users can update their own AI assistants"
  ON ai_assistants FOR UPDATE
  USING (auth.uid() = user_id);

-- Owners can delete their AI assistants
CREATE POLICY "Users can delete their own AI assistants"
  ON ai_assistants FOR DELETE
  USING (auth.uid() = user_id);

-- ==================== TRIGGERS ====================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_assistant_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_assistants_updated_at
  BEFORE UPDATE ON ai_assistants
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_assistant_timestamp();

-- Set published_at when first activated
CREATE OR REPLACE FUNCTION set_ai_assistant_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status != 'active' AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ai_assistants_published_at
  BEFORE UPDATE ON ai_assistants
  FOR EACH ROW
  EXECUTE FUNCTION set_ai_assistant_published_at();

-- ==================== COMMENTS ====================

COMMENT ON TABLE ai_assistants IS 'AI Assistants created by users - autonomous AI services with customizable prompts, pricing, and compute providers';
COMMENT ON COLUMN ai_assistants.system_prompt IS 'The core prompt/context that defines the AI behavior - this is the "software"';
COMMENT ON COLUMN ai_assistants.compute_provider_type IS 'Where the AI runs: api (OpenAI/Anthropic), self_hosted (user hardware), or community (shared compute)';
COMMENT ON COLUMN ai_assistants.pricing_model IS 'How users pay: per message, per token, subscription, or free';
