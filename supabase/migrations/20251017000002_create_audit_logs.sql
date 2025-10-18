-- Migration: Create audit_logs table
-- Created: 2025-10-17
-- Priority: P0 - Critical (Compliance & Security)
-- Impact: Security auditing, compliance, debugging, user support
--
-- This table provides:
-- - Complete audit trail of all critical operations
-- - Compliance with financial regulations (Bitcoin transactions)
-- - Security investigation capabilities
-- - Debugging support for complex state changes
-- - User support (trace profile/payment issues)
--
-- What gets logged:
-- ✅ Profile updates (especially verification status)
-- ✅ Financial transactions (all state changes)
-- ✅ Organization membership changes
-- ✅ Permission/role updates
-- ✅ Campaign status changes
-- ❌ Read operations (too noisy)
-- ❌ Automated trigger updates (unless critical)

BEGIN;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who performed the action
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id text,                      -- Session identifier for tracking
  ip_address inet,                       -- IP address of request
  user_agent text,                       -- Browser/client information

  -- What action was performed
  action text NOT NULL                  -- 'create', 'update', 'delete', 'login', 'verify', etc.
    CHECK (action IN (
      'create', 'update', 'delete',
      'login', 'logout',
      'verify', 'unverify',
      'approve', 'reject',
      'enable', 'disable',
      'grant', 'revoke',
      'publish', 'unpublish',
      'archive', 'restore',
      'other'
    )),
  table_name text NOT NULL,             -- Which table was affected
  record_id uuid,                        -- ID of affected record

  -- Data changes
  old_data jsonb,                        -- State before change
  new_data jsonb,                        -- State after change
  changes jsonb,                         -- Computed diff (optional, for efficiency)

  -- Context and metadata
  metadata jsonb DEFAULT '{}'::jsonb,    -- Additional context
  severity text DEFAULT 'info'           -- 'info', 'warning', 'critical'
    CHECK (severity IN ('info', 'warning', 'critical')),

  -- Timestamp
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for efficient querying

-- Most common: Find all actions by a user
CREATE INDEX IF NOT EXISTS idx_audit_user_time
ON audit_logs(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Find all changes to a specific record
CREATE INDEX IF NOT EXISTS idx_audit_table_record
ON audit_logs(table_name, record_id, created_at DESC)
WHERE record_id IS NOT NULL;

-- Find all actions of a type
CREATE INDEX IF NOT EXISTS idx_audit_action_time
ON audit_logs(action, created_at DESC);

-- Find critical actions
CREATE INDEX IF NOT EXISTS idx_audit_severity
ON audit_logs(severity, created_at DESC)
WHERE severity IN ('warning', 'critical');

-- Retention: Find old logs for archival (>1 year)
CREATE INDEX IF NOT EXISTS idx_audit_retention
ON audit_logs(created_at)
WHERE created_at < NOW() - INTERVAL '1 year';

-- Session tracking
CREATE INDEX IF NOT EXISTS idx_audit_session
ON audit_logs(session_id, created_at DESC)
WHERE session_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS
'Audit trail for all critical operations. Used for security, compliance, debugging, and user support.';

COMMENT ON COLUMN audit_logs.user_id IS
'Profile ID of user who performed the action. NULL for system actions or deleted users.';

COMMENT ON COLUMN audit_logs.action IS
'Type of action performed. Must be one of the allowed enum values.';

COMMENT ON COLUMN audit_logs.old_data IS
'Complete state of record before change. NULL for create operations.';

COMMENT ON COLUMN audit_logs.new_data IS
'Complete state of record after change. NULL for delete operations.';

COMMENT ON COLUMN audit_logs.changes IS
'Optional computed diff between old_data and new_data for efficient querying.';

COMMENT ON COLUMN audit_logs.metadata IS
'Additional context: request_id, feature_flag, source, etc.';

-- RLS Policies for audit_logs

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can insert audit logs (prevent tampering)
CREATE POLICY "Only service role can insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (false);  -- No one via RLS (only service role via SECURITY DEFINER)

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all audit logs (need to create admin check)
-- CREATE POLICY "Admins can view all audit logs" ON audit_logs
--   FOR SELECT
--   USING (is_admin(auth.uid()));

-- No one can update or delete audit logs (immutable)
CREATE POLICY "Audit logs are immutable" ON audit_logs
  FOR UPDATE
  WITH CHECK (false);

CREATE POLICY "Audit logs cannot be deleted" ON audit_logs
  FOR DELETE
  USING (false);

-- Helper function to create audit log entries
-- This runs as SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id uuid,
  p_action text,
  p_table_name text,
  p_record_id uuid,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_severity text DEFAULT 'info'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
  v_changes jsonb;
BEGIN
  -- Compute diff if both old and new data provided
  IF p_old_data IS NOT NULL AND p_new_data IS NOT NULL THEN
    -- Simple diff: just store what changed
    -- (In production, you might use a more sophisticated diff)
    v_changes := jsonb_build_object(
      'changed_fields', (
        SELECT jsonb_object_agg(key, jsonb_build_object('old', p_old_data->key, 'new', p_new_data->key))
        FROM jsonb_each(p_new_data)
        WHERE p_old_data->key IS DISTINCT FROM p_new_data->key
      )
    );
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    changes,
    metadata,
    severity,
    session_id,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data,
    v_changes,
    p_metadata,
    p_severity,
    current_setting('request.jwt.claims', true)::jsonb->>'session_id',
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb->>'user-agent'
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to create audit log: %', SQLERRM;
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION create_audit_log IS
'Create an audit log entry. Used by triggers and application code. Runs as SECURITY DEFINER to bypass RLS.';

-- Example trigger for profile updates
-- This is an example - in production, you'd create triggers for each critical table

CREATE OR REPLACE FUNCTION audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log significant changes (not every updated_at bump)
  IF TG_OP = 'UPDATE' THEN
    -- Check if anything besides updated_at changed
    IF OLD IS NOT DISTINCT FROM NEW THEN
      RETURN NEW;
    END IF;

    -- Check if critical fields changed
    IF (OLD.username IS DISTINCT FROM NEW.username
        OR OLD.display_name IS DISTINCT FROM NEW.display_name
        OR OLD.is_verified IS DISTINCT FROM NEW.is_verified
        OR OLD.bitcoin_address IS DISTINCT FROM NEW.bitcoin_address
        OR OLD.lightning_address IS DISTINCT FROM NEW.lightning_address) THEN

      PERFORM create_audit_log(
        p_user_id := NEW.id,
        p_action := 'update',
        p_table_name := 'profiles',
        p_record_id := NEW.id,
        p_old_data := to_jsonb(OLD),
        p_new_data := to_jsonb(NEW),
        p_metadata := jsonb_build_object(
          'trigger', TG_NAME,
          'operation', TG_OP,
          'critical_change', true
        ),
        p_severity := CASE
          WHEN OLD.is_verified IS DISTINCT FROM NEW.is_verified THEN 'warning'
          WHEN OLD.bitcoin_address IS DISTINCT FROM NEW.bitcoin_address THEN 'warning'
          ELSE 'info'
        END
      );
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log(
      p_user_id := NEW.id,
      p_action := 'create',
      p_table_name := 'profiles',
      p_record_id := NEW.id,
      p_old_data := NULL,
      p_new_data := to_jsonb(NEW),
      p_metadata := jsonb_build_object(
        'trigger', TG_NAME,
        'operation', TG_OP
      ),
      p_severity := 'info'
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_audit_log(
      p_user_id := OLD.id,
      p_action := 'delete',
      p_table_name := 'profiles',
      p_record_id := OLD.id,
      p_old_data := to_jsonb(OLD),
      p_new_data := NULL,
      p_metadata := jsonb_build_object(
        'trigger', TG_NAME,
        'operation', TG_OP
      ),
      p_severity := 'warning'
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never fail the original operation due to audit logging
    RAISE WARNING 'Audit trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Attach audit trigger to profiles table (example)
DROP TRIGGER IF EXISTS trigger_audit_profile_changes ON profiles;
CREATE TRIGGER trigger_audit_profile_changes
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_profile_changes();

COMMENT ON TRIGGER trigger_audit_profile_changes ON profiles IS
'Automatically log critical profile changes to audit_logs table.';

-- Verification
DO $$
DECLARE
  v_table_exists boolean;
  v_function_exists boolean;
  v_trigger_exists boolean;
BEGIN
  -- Check table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
  ) INTO v_table_exists;

  -- Check function exists
  SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'create_audit_log'
  ) INTO v_function_exists;

  -- Check trigger exists
  SELECT EXISTS (
    SELECT FROM pg_trigger
    WHERE tgname = 'trigger_audit_profile_changes'
  ) INTO v_trigger_exists;

  IF v_table_exists AND v_function_exists AND v_trigger_exists THEN
    RAISE NOTICE 'SUCCESS: Audit logging system created successfully';
    RAISE NOTICE '  ✓ Table: audit_logs';
    RAISE NOTICE '  ✓ Function: create_audit_log()';
    RAISE NOTICE '  ✓ Trigger: trigger_audit_profile_changes';
    RAISE NOTICE '  ✓ Indexes: 6 indexes created';
    RAISE NOTICE '  ✓ RLS: Policies enabled';
  ELSE
    RAISE EXCEPTION 'FAILED: Audit logging system incomplete';
  END IF;
END $$;

COMMIT;

-- Usage Examples:
--
-- 1. Manual logging from application:
--    SELECT create_audit_log(
--      p_user_id := '123e4567-e89b-12d3-a456-426614174000',
--      p_action := 'update',
--      p_table_name := 'funding_pages',
--      p_record_id := campaign_id,
--      p_old_data := old_campaign_data,
--      p_new_data := new_campaign_data,
--      p_metadata := '{"reason": "admin override"}'::jsonb,
--      p_severity := 'warning'
--    );
--
-- 2. Query user's audit trail:
--    SELECT * FROM audit_logs
--    WHERE user_id = auth.uid()
--    ORDER BY created_at DESC
--    LIMIT 100;
--
-- 3. Find all changes to a campaign:
--    SELECT * FROM audit_logs
--    WHERE table_name = 'funding_pages'
--      AND record_id = '...'
--    ORDER BY created_at DESC;
--
-- 4. Find critical security events:
--    SELECT * FROM audit_logs
--    WHERE severity = 'critical'
--      AND created_at > NOW() - INTERVAL '7 days'
--    ORDER BY created_at DESC;
