-- Migration: Add user AI preferences table
-- Created: 2026-01-20
-- Description: Stores user AI preferences for BYOK (Bring Your Own Key) functionality

-- Create the user_ai_preferences table
CREATE TABLE IF NOT EXISTS user_ai_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Model preferences
  default_model_id TEXT, -- OpenRouter model ID
  default_tier TEXT DEFAULT 'economy' CHECK (default_tier IN ('free', 'economy', 'standard', 'premium')),
  auto_router_enabled BOOLEAN DEFAULT true,

  -- Cost controls
  max_cost_sats INTEGER DEFAULT 100, -- Maximum cost per request in satoshis

  -- Capability requirements
  require_vision BOOLEAN DEFAULT false,
  require_function_calling BOOLEAN DEFAULT false,

  -- Onboarding state
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  onboarding_step INTEGER DEFAULT 0, -- Current step if not completed

  -- Usage tracking (cached for display, actual tracking in api_keys table)
  cached_total_requests INTEGER DEFAULT 0,
  cached_total_tokens INTEGER DEFAULT 0,
  cached_total_cost_sats INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one preferences row per user
  CONSTRAINT user_ai_preferences_user_id_unique UNIQUE (user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_ai_preferences_user_id ON user_ai_preferences(user_id);

-- Enable RLS
ALTER TABLE user_ai_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own preferences
CREATE POLICY "Users can view own AI preferences"
  ON user_ai_preferences
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own AI preferences"
  ON user_ai_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own AI preferences"
  ON user_ai_preferences
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own AI preferences"
  ON user_ai_preferences
  FOR DELETE
  USING (user_id = auth.uid());

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_ai_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_ai_preferences_updated_at
  BEFORE UPDATE ON user_ai_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_ai_preferences_updated_at();

-- Function to get or create user AI preferences
CREATE OR REPLACE FUNCTION get_or_create_user_ai_preferences(p_user_id UUID)
RETURNS user_ai_preferences AS $$
DECLARE
  result user_ai_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO result FROM user_ai_preferences WHERE user_id = p_user_id;

  -- If not found, create new preferences with defaults
  IF result IS NULL THEN
    INSERT INTO user_ai_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_user_ai_preferences(UUID) TO authenticated;

-- Comment on table
COMMENT ON TABLE user_ai_preferences IS 'Stores user preferences for AI features including BYOK settings, model preferences, and onboarding state';
