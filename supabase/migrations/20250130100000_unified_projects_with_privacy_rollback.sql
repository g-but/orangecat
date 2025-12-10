-- ROLLBACK: 20250130100000_unified_projects_with_privacy
-- Generated: 2025-12-04T12:37:00.346Z
-- Source: 20250130100000_unified_projects_with_privacy.sql

DROP TABLE IF EXISTS project_categories CASCADE;
-- MANUAL: Review data inserted into project_categories
DROP TABLE IF EXISTS projects CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS IF;
ALTER TABLE profiles DROP COLUMN IF EXISTS IF;
ALTER TABLE profiles DROP COLUMN IF EXISTS IF;
ALTER TABLE profiles DROP COLUMN IF EXISTS IF;
ALTER TABLE profiles DROP COLUMN IF EXISTS IF;
ALTER TABLE profiles DROP COLUMN IF EXISTS IF;
DROP FUNCTION IF EXISTS generate_slug;
DROP FUNCTION IF EXISTS can_view_field;
DROP FUNCTION IF EXISTS expire_past_events;
DROP FUNCTION IF EXISTS projects_generate_slug;
DROP TRIGGER IF EXISTS projects_slug_trigger ON projects;
DROP FUNCTION IF EXISTS update_updated_at;
DROP TRIGGER IF EXISTS projects_updated_at ON projects;
DROP FUNCTION IF EXISTS search_projects;
DROP VIEW IF EXISTS project_analytics;

-- Rollback completed: 20250130100000_unified_projects_with_privacy