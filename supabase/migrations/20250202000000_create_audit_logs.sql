-- ============================================================================
-- Audit Logs Table
-- Description: Track all critical operations for security, compliance, and debugging
-- Author: Architecture Team
-- Date: 2025-02-02
-- Week: 3
-- ============================================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Action information
  action TEXT NOT NULL,
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  -- User information
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Entity information
  entity_type TEXT CHECK (entity_type IN ('profile', 'project', 'wallet', 'post', 'donation', 'other')),
  entity_id UUID,

  -- Additional context
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes for performance
-- ============================================================================

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
ON audit_logs(user_id, created_at DESC);

-- Index for querying by action
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
ON audit_logs(action, created_at DESC);

-- Index for querying by entity
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
ON audit_logs(entity_type, entity_id, created_at DESC);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON audit_logs(created_at DESC);

-- Index for failed operations
CREATE INDEX IF NOT EXISTS idx_audit_logs_failures
ON audit_logs(success, created_at DESC)
WHERE success = false;

-- GIN index for metadata search
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata
ON audit_logs USING gin(metadata);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own audit logs
CREATE POLICY "Users can view own audit logs"
ON audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Only authenticated users can create audit logs (via API)
-- Note: In production, this should be restricted to service role
CREATE POLICY "Service can insert audit logs"
ON audit_logs
FOR INSERT
WITH CHECK (true);

-- Nobody can update or delete audit logs (immutable for compliance)
-- No policies for UPDATE or DELETE - audit logs are append-only

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE audit_logs IS 'Immutable audit trail of all critical operations';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (e.g., WALLET_CREATED, USER_LOGIN)';
COMMENT ON COLUMN audit_logs.success IS 'Whether the operation succeeded';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity affected';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID of entity affected';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context about the operation (JSON)';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the request';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent of the request';

-- ============================================================================
-- Partitioning (optional, for high-volume deployments)
-- ============================================================================

-- For high-volume applications, consider partitioning by month
-- This improves query performance and makes old data archival easier
-- Uncomment below to enable monthly partitioning:

/*
-- Convert to partitioned table
CREATE TABLE audit_logs_partitioned (
  LIKE audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create partitions for each month
CREATE TABLE audit_logs_2025_02 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE audit_logs_2025_03 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Add more partitions as needed
*/

-- ============================================================================
-- Cleanup policy (optional, for GDPR compliance)
-- ============================================================================

-- Uncomment to enable automatic deletion of old audit logs after 90 days
-- Adjust retention period based on compliance requirements

/*
CREATE OR REPLACE FUNCTION delete_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Schedule cleanup to run daily
SELECT cron.schedule(
  'delete-old-audit-logs',
  '0 2 * * *', -- Run at 2 AM daily
  'SELECT delete_old_audit_logs();'
);
*/

-- ============================================================================
-- Verification queries
-- ============================================================================

-- Check table exists
SELECT EXISTS (
  SELECT FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'audit_logs'
);

-- Check RLS is enabled
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'audit_logs';

-- Check indexes created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'audit_logs'
ORDER BY indexname;
