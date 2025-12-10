-- ROLLBACK: 20251017000002_create_audit_logs
-- Generated: 2025-12-04T12:37:00.409Z
-- Source: 20251017000002_create_audit_logs.sql

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP FUNCTION IF EXISTS create_audit_log;
-- MANUAL: Review data inserted into audit_logs
DROP FUNCTION IF EXISTS audit_profile_changes;
DROP TRIGGER IF EXISTS trigger_audit_profile_changes ON profiles;

-- Rollback completed: 20251017000002_create_audit_logs