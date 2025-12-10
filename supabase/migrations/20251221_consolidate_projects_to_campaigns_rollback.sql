-- ROLLBACK: 20251221_consolidate_projects_to_campaigns
-- Generated: 2025-12-04T12:37:00.498Z
-- Source: 20251221_consolidate_projects_to_campaigns.sql

ALTER TABLE campaigns DROP COLUMN IF EXISTS IF;

-- Rollback completed: 20251221_consolidate_projects_to_campaigns