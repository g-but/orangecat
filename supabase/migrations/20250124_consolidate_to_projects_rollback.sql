-- ROLLBACK: 20250124_consolidate_to_projects
-- Generated: 2025-12-04T12:37:00.328Z
-- Source: 20250124_consolidate_to_projects.sql

DROP TABLE IF EXISTS projects CASCADE;
ALTER TABLE projects DROP COLUMN IF EXISTS IF;

-- Rollback completed: 20250124_consolidate_to_projects