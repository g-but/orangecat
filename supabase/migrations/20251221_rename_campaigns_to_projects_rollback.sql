-- ROLLBACK: 20251221_rename_campaigns_to_projects
-- Generated: 2025-12-04T12:37:00.500Z
-- Source: 20251221_rename_campaigns_to_projects.sql

ALTER TABLE campaigns DROP COLUMN IF EXISTS IF;

-- Rollback completed: 20251221_rename_campaigns_to_projects