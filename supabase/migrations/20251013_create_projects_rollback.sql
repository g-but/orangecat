-- ROLLBACK: 20251013_create_projects
-- Generated: 2025-12-04T12:37:00.404Z
-- Source: 20251013_create_projects.sql

DROP TABLE IF EXISTS projects CASCADE;
DROP INDEX IF EXISTS idx_projects_slug;
DROP INDEX IF EXISTS idx_projects_owner;
DROP INDEX IF EXISTS idx_projects_status;
DROP INDEX IF EXISTS idx_projects_visibility;
DROP INDEX IF EXISTS idx_projects_created_at;
DROP INDEX IF EXISTS idx_projects_tags;
DROP INDEX IF EXISTS idx_projects_search;
DROP FUNCTION IF EXISTS generate_project_slug;
DROP TRIGGER IF EXISTS generate_project_slug_trigger ON projects;
DROP FUNCTION IF EXISTS update_projects_updated_at;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;

-- Rollback completed: 20251013_create_projects