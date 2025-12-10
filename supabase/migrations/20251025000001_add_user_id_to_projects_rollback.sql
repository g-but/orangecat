-- ROLLBACK: 20251025000001_add_user_id_to_projects
-- Generated: 2025-12-04T12:37:00.425Z
-- Source: 20251025000001_add_user_id_to_projects.sql

ALTER TABLE projects DROP COLUMN IF EXISTS IF;

-- Rollback completed: 20251025000001_add_user_id_to_projects