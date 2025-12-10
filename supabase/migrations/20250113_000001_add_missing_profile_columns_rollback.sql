-- ROLLBACK: 20250113_000001_add_missing_profile_columns
-- Generated: 2025-12-04T12:37:00.325Z
-- Source: 20250113_000001_add_missing_profile_columns.sql

ALTER TABLE public DROP COLUMN IF EXISTS IF;
ALTER TABLE public DROP CONSTRAINT IF EXISTS profiles_bitcoin_address_format;
ALTER TABLE public DROP CONSTRAINT IF EXISTS profiles_lightning_address_format;
ALTER TABLE public DROP CONSTRAINT IF EXISTS profiles_website_format;

-- Rollback completed: 20250113_000001_add_missing_profile_columns