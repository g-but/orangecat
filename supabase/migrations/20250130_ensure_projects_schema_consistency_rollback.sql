-- ROLLBACK: 20250130_ensure_projects_schema_consistency
-- Generated: 2025-12-04T12:37:00.352Z
-- Source: 20250130_ensure_projects_schema_consistency.sql

ALTER TABLE projects DROP COLUMN IF EXISTS raised_amount;
ALTER TABLE projects DROP COLUMN IF EXISTS contributor_count;

-- Rollback completed: 20250130_ensure_projects_schema_consistency