-- ROLLBACK: 20251117_add_supporters_and_updates
-- Generated: 2025-12-04T12:37:00.478Z
-- Source: 20251117_add_supporters_and_updates.sql

ALTER TABLE projects DROP COLUMN IF EXISTS IF;
DROP TABLE IF EXISTS project_updates CASCADE;
DROP TABLE IF EXISTS project_supporters CASCADE;
DROP FUNCTION IF EXISTS update_project_supporters_count;
DROP TRIGGER IF EXISTS trigger_update_supporters_count ON project_supporters;

-- Rollback completed: 20251117_add_supporters_and_updates