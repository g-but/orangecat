-- ROLLBACK: 20250202000000_create_audit_logs
-- Generated: 2025-12-04T12:37:00.367Z
-- Source: 20250202000000_create_audit_logs.sql

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS audit_logs_partitioned CASCADE;
DROP TABLE IF EXISTS audit_logs_2025_02 CASCADE;
DROP TABLE IF EXISTS audit_logs_2025_03 CASCADE;
DROP FUNCTION IF EXISTS delete_old_audit_logs;

-- Rollback completed: 20250202000000_create_audit_logs