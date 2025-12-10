-- ROLLBACK: 20250130100001_migrate_existing_data
-- Generated: 2025-12-04T12:37:00.350Z
-- Source: 20250130100001_migrate_existing_data.sql

-- MANUAL: Review data inserted into projects
-- MANUAL: Review data inserted into projects
ALTER TABLE transactions DROP COLUMN IF EXISTS project_id;

-- Rollback completed: 20250130100001_migrate_existing_data