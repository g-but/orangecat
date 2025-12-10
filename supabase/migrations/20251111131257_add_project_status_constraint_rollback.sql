-- ROLLBACK: 20251111131257_add_project_status_constraint
-- Generated: 2025-12-04T12:37:00.430Z
-- Source: 20251111131257_add_project_status_constraint.sql

ALTER TABLE public DROP CONSTRAINT IF EXISTS projects_status_check;

-- Rollback completed: 20251111131257_add_project_status_constraint