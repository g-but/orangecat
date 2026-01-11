-- ============================================================================
-- User API Keys (BYOK - Bring Your Own Key)
-- ============================================================================
-- Allows users to provide their own OpenRouter API keys for AI assistants
-- Keys are encrypted at rest using pgcrypto
--
-- Created: 2026-01-08
-- ============================================================================

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==================== MAIN TABLE ====================

CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Key identification
  provider TEXT NOT NULL DEFAULT 'openrouter',
  key_name TEXT NOT NULL DEFAULT 'Default',

  -- Encrypted API key (encrypted with server-side secret)
  -- We store the key encrypted, decryption happens in application layer
  encrypted_key TEXT NOT NULL,
  key_hint TEXT, -- Last 4 characters for display (e.g., "...abc123")

  -- Validation & status
  is_valid BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  last_validated_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  validation_error TEXT,

  -- Usage tracking
  total_requests INTEGER DEFAULT 0,
  total_tokens_used BIGINT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_provider CHECK (provider IN ('openrouter')),
  UNIQUE(user_id, provider, key_name)
);

-- ==================== PLATFORM USAGE TRACKING ====================

-- Track platform API key usage for rate limiting free tier
CREATE TABLE IF NOT EXISTS platform_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Daily usage counters (reset daily)
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INTEGER DEFAULT 0,
  token_count BIGINT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, usage_date)
);

-- ==================== INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON user_api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_is_primary ON user_api_keys(user_id, is_primary) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_platform_api_usage_user_date ON platform_api_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_platform_api_usage_date ON platform_api_usage(usage_date);

-- ==================== RLS POLICIES ====================

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_api_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own API keys
CREATE POLICY "Users can view own API keys"
  ON user_api_keys FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own API keys"
  ON user_api_keys FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own API keys"
  ON user_api_keys FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own API keys"
  ON user_api_keys FOR DELETE
  USING (user_id = auth.uid());

-- Users can view their own platform usage
CREATE POLICY "Users can view own platform usage"
  ON platform_api_usage FOR SELECT
  USING (user_id = auth.uid());

-- ==================== FUNCTIONS ====================

-- Function to increment platform usage (called by API)
CREATE OR REPLACE FUNCTION increment_platform_usage(
  p_user_id UUID,
  p_request_count INTEGER DEFAULT 1,
  p_token_count BIGINT DEFAULT 0
)
RETURNS TABLE(
  daily_requests INTEGER,
  daily_tokens BIGINT,
  limit_reached BOOLEAN
) AS $$
DECLARE
  v_daily_limit INTEGER := 10; -- Free tier: 10 requests/day
  v_current_requests INTEGER;
BEGIN
  -- Upsert usage record for today
  INSERT INTO platform_api_usage (user_id, usage_date, request_count, token_count)
  VALUES (p_user_id, CURRENT_DATE, p_request_count, p_token_count)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    request_count = platform_api_usage.request_count + p_request_count,
    token_count = platform_api_usage.token_count + p_token_count,
    updated_at = NOW();

  -- Get current usage
  SELECT request_count INTO v_current_requests
  FROM platform_api_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  RETURN QUERY SELECT
    v_current_requests,
    (SELECT token_count FROM platform_api_usage WHERE user_id = p_user_id AND usage_date = CURRENT_DATE),
    v_current_requests >= v_daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check platform usage limits
CREATE OR REPLACE FUNCTION check_platform_limit(p_user_id UUID)
RETURNS TABLE(
  daily_requests INTEGER,
  daily_limit INTEGER,
  requests_remaining INTEGER,
  can_use_platform BOOLEAN
) AS $$
DECLARE
  v_daily_limit INTEGER := 10; -- Free tier limit
  v_current_requests INTEGER := 0;
BEGIN
  SELECT COALESCE(request_count, 0) INTO v_current_requests
  FROM platform_api_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  RETURN QUERY SELECT
    v_current_requests,
    v_daily_limit,
    GREATEST(0, v_daily_limit - v_current_requests),
    v_current_requests < v_daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's primary API key (returns encrypted - decrypt in app)
CREATE OR REPLACE FUNCTION get_user_primary_key(p_user_id UUID, p_provider TEXT DEFAULT 'openrouter')
RETURNS TABLE(
  key_id UUID,
  encrypted_key TEXT,
  key_hint TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT k.id, k.encrypted_key, k.key_hint
  FROM user_api_keys k
  WHERE k.user_id = p_user_id
    AND k.provider = p_provider
    AND k.is_valid = true
    AND k.is_primary = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update key usage stats
CREATE OR REPLACE FUNCTION update_key_usage(
  p_key_id UUID,
  p_tokens_used BIGINT DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_api_keys
  SET
    total_requests = total_requests + 1,
    total_tokens_used = total_tokens_used + p_tokens_used,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE id = p_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== TRIGGERS ====================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_api_key_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_api_keys_timestamp
  BEFORE UPDATE ON user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_key_timestamp();

-- Ensure only one primary key per provider
CREATE OR REPLACE FUNCTION ensure_single_primary_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE user_api_keys
    SET is_primary = false
    WHERE user_id = NEW.user_id
      AND provider = NEW.provider
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_api_key
  BEFORE INSERT OR UPDATE ON user_api_keys
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_key();

-- ==================== COMMENTS ====================

COMMENT ON TABLE user_api_keys IS 'Stores user-provided API keys (BYOK) for AI services like OpenRouter';
COMMENT ON COLUMN user_api_keys.encrypted_key IS 'AES-256 encrypted API key - decrypted in application layer';
COMMENT ON COLUMN user_api_keys.key_hint IS 'Last 4 chars of key for UI display (e.g., "sk-...a1b2")';
COMMENT ON TABLE platform_api_usage IS 'Tracks daily usage of platform shared API key for rate limiting';
