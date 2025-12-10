-- ROLLBACK: 20250206_add_projects_profiles_fk
-- Generated: 2025-12-04T12:37:00.369Z
-- Source: 20250206_add_projects_profiles_fk.sql

ALTER TABLE public DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

-- Rollback completed: 20250206_add_projects_profiles_fk