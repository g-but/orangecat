-- Create My Cat Action System tables
-- Supports user-granted permissions for My Cat to execute actions autonomously

-- Create action category enum
DO $$ BEGIN
  CREATE TYPE cat_action_category AS ENUM ('entities', 'communication', 'payments', 'organization', 'settings', 'context');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create action status enum
DO $$ BEGIN
  CREATE TYPE cat_action_status AS ENUM ('pending', 'executing', 'completed', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ====================
-- CAT PERMISSIONS TABLE
-- ====================
-- Stores user permissions for My Cat actions
CREATE TABLE IF NOT EXISTS cat_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User who granted the permission
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What is being permitted
  action_id TEXT NOT NULL,              -- Specific action ID or '*' for category-wide
  category cat_action_category NOT NULL,

  -- Permission settings
  granted BOOLEAN NOT NULL DEFAULT true,
  requires_confirmation BOOLEAN NOT NULL DEFAULT true,  -- Always confirm before executing

  -- Rate limits
  daily_limit INTEGER,                  -- Max executions per day (null = unlimited)
  max_sats_per_action INTEGER,          -- Max sats for payment actions (null = unlimited)

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one permission per user/action/category combo
  CONSTRAINT cat_permissions_unique UNIQUE (user_id, action_id, category)
);

-- Indexes for cat_permissions
CREATE INDEX IF NOT EXISTS idx_cat_permissions_user_id ON cat_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_cat_permissions_category ON cat_permissions(category);
CREATE INDEX IF NOT EXISTS idx_cat_permissions_action ON cat_permissions(action_id);
CREATE INDEX IF NOT EXISTS idx_cat_permissions_user_category ON cat_permissions(user_id, category);

-- ====================
-- CAT ACTION LOG TABLE
-- ====================
-- Audit trail of all actions executed by My Cat
CREATE TABLE IF NOT EXISTS cat_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who and what
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  category cat_action_category NOT NULL,

  -- Action details
  status cat_action_status NOT NULL DEFAULT 'pending',
  parameters JSONB NOT NULL DEFAULT '{}',    -- Input parameters
  result JSONB,                               -- Output/result data
  error_message TEXT,                         -- If failed

  -- Context
  conversation_id UUID,                       -- Reference to chat conversation (if any)
  message_id UUID,                            -- Which chat message triggered this

  -- Execution metadata
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,                   -- When user confirmed (if required)
  started_at TIMESTAMPTZ,                     -- When execution began
  completed_at TIMESTAMPTZ,                   -- When execution finished

  -- Resource tracking (for payment actions)
  sats_amount INTEGER,                        -- Amount in sats if payment action

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for cat_action_log
CREATE INDEX IF NOT EXISTS idx_cat_action_log_user_id ON cat_action_log(user_id);
CREATE INDEX IF NOT EXISTS idx_cat_action_log_action_id ON cat_action_log(action_id);
CREATE INDEX IF NOT EXISTS idx_cat_action_log_status ON cat_action_log(status);
CREATE INDEX IF NOT EXISTS idx_cat_action_log_created_at ON cat_action_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cat_action_log_user_action_date ON cat_action_log(user_id, action_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cat_action_log_conversation ON cat_action_log(conversation_id);

-- ====================
-- CAT PENDING ACTIONS TABLE
-- ====================
-- Actions waiting for user confirmation
CREATE TABLE IF NOT EXISTS cat_pending_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who and what
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  category cat_action_category NOT NULL,

  -- Action details
  parameters JSONB NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,                  -- Human-readable description of what will happen

  -- Context
  conversation_id UUID,                       -- Reference to chat conversation (if any)
  message_id UUID,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'expired')),

  -- Expiration (pending actions expire after some time)
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),

  -- Response
  confirmed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for cat_pending_actions
CREATE INDEX IF NOT EXISTS idx_cat_pending_actions_user_id ON cat_pending_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_cat_pending_actions_status ON cat_pending_actions(status);
CREATE INDEX IF NOT EXISTS idx_cat_pending_actions_expires ON cat_pending_actions(expires_at);
CREATE INDEX IF NOT EXISTS idx_cat_pending_actions_user_pending ON cat_pending_actions(user_id, status) WHERE status = 'pending';

-- ====================
-- ENABLE RLS
-- ====================
ALTER TABLE cat_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_action_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_pending_actions ENABLE ROW LEVEL SECURITY;

-- ====================
-- RLS POLICIES
-- ====================

-- cat_permissions: Users can manage their own permissions
CREATE POLICY "Users can view own cat permissions"
  ON cat_permissions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own cat permissions"
  ON cat_permissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cat permissions"
  ON cat_permissions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own cat permissions"
  ON cat_permissions FOR DELETE
  USING (user_id = auth.uid());

-- cat_action_log: Users can view their own action history
CREATE POLICY "Users can view own cat action log"
  ON cat_action_log FOR SELECT
  USING (user_id = auth.uid());

-- Service role can insert/update action log entries
CREATE POLICY "Service role can manage cat action log"
  ON cat_action_log FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- cat_pending_actions: Users can view and respond to their pending actions
CREATE POLICY "Users can view own pending cat actions"
  ON cat_pending_actions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own pending cat actions"
  ON cat_pending_actions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage pending cat actions"
  ON cat_pending_actions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ====================
-- TRIGGERS
-- ====================

-- Update trigger for cat_permissions
CREATE OR REPLACE FUNCTION update_cat_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cat_permissions_updated_at ON cat_permissions;
CREATE TRIGGER trigger_cat_permissions_updated_at
  BEFORE UPDATE ON cat_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_cat_permissions_updated_at();

-- ====================
-- FUNCTIONS
-- ====================

-- Function to get daily usage count for an action
CREATE OR REPLACE FUNCTION get_cat_action_daily_usage(
  p_user_id UUID,
  p_action_id TEXT
) RETURNS INTEGER AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO usage_count
  FROM cat_action_log
  WHERE user_id = p_user_id
    AND action_id = p_action_id
    AND status IN ('completed', 'executing')
    AND created_at >= CURRENT_DATE;

  RETURN COALESCE(usage_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission for an action
CREATE OR REPLACE FUNCTION check_cat_permission(
  p_user_id UUID,
  p_action_id TEXT,
  p_category cat_action_category
) RETURNS TABLE (
  allowed BOOLEAN,
  requires_confirmation BOOLEAN,
  daily_limit INTEGER,
  daily_usage INTEGER,
  max_sats INTEGER
) AS $$
DECLARE
  specific_perm RECORD;
  category_perm RECORD;
  current_usage INTEGER;
BEGIN
  -- Check specific action permission first
  SELECT * INTO specific_perm
  FROM cat_permissions
  WHERE user_id = p_user_id
    AND action_id = p_action_id
    AND category = p_category;

  IF FOUND THEN
    current_usage := get_cat_action_daily_usage(p_user_id, p_action_id);

    RETURN QUERY SELECT
      specific_perm.granted AND (specific_perm.daily_limit IS NULL OR current_usage < specific_perm.daily_limit),
      specific_perm.requires_confirmation,
      specific_perm.daily_limit,
      current_usage,
      specific_perm.max_sats_per_action;
    RETURN;
  END IF;

  -- Check category-wide permission
  SELECT * INTO category_perm
  FROM cat_permissions
  WHERE user_id = p_user_id
    AND action_id = '*'
    AND category = p_category;

  IF FOUND THEN
    current_usage := get_cat_action_daily_usage(p_user_id, p_action_id);

    RETURN QUERY SELECT
      category_perm.granted,
      category_perm.requires_confirmation,
      category_perm.daily_limit,
      current_usage,
      category_perm.max_sats_per_action;
    RETURN;
  END IF;

  -- No permission found - default to denied
  RETURN QUERY SELECT
    false,
    true,
    NULL::INTEGER,
    0,
    NULL::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old pending actions
CREATE OR REPLACE FUNCTION expire_cat_pending_actions()
RETURNS void AS $$
BEGIN
  UPDATE cat_pending_actions
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ====================
-- COMMENTS
-- ====================
COMMENT ON TABLE cat_permissions IS 'User permissions for My Cat autonomous actions - controls what My Cat can do on behalf of the user';
COMMENT ON TABLE cat_action_log IS 'Audit trail of all actions executed by My Cat - full history for transparency';
COMMENT ON TABLE cat_pending_actions IS 'Actions waiting for user confirmation before execution';
COMMENT ON COLUMN cat_permissions.action_id IS 'Specific action ID or * for category-wide permission';
COMMENT ON COLUMN cat_permissions.daily_limit IS 'Maximum times this action can be executed per day (null = unlimited)';
COMMENT ON COLUMN cat_permissions.max_sats_per_action IS 'Maximum satoshis for payment actions (null = unlimited)';
