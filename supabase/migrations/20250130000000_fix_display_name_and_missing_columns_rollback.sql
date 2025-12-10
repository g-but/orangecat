-- ROLLBACK: 20250130000000_fix_display_name_and_missing_columns
-- Generated: 2025-12-04T12:37:00.337Z
-- Source: 20250130000000_fix_display_name_and_missing_columns.sql

ALTER TABLE projects DROP COLUMN IF EXISTS IF;

-- Rollback completed: 20250130000000_fix_display_name_and_missing_columns