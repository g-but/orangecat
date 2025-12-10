-- ROLLBACK: 20251013_add_project_to_campaigns
-- Generated: 2025-12-04T12:37:00.399Z
-- Source: 20251013_add_project_to_campaigns.sql

ALTER TABLE campaigns DROP COLUMN IF EXISTS IF;

-- Rollback completed: 20251013_add_project_to_campaigns