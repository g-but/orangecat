-- ROLLBACK: 20251120000000_sync_location_fields
-- Generated: 2025-12-04T12:37:00.491Z
-- Source: 20251120000000_sync_location_fields.sql

ALTER TABLE profiles DROP COLUMN IF EXISTS IF;

-- Rollback completed: 20251120000000_sync_location_fields