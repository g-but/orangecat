-- ROLLBACK: 20251113032119_enhance_profile_location_fields
-- Generated: 2025-12-04T12:37:00.471Z
-- Source: 20251113032119_enhance_profile_location_fields.sql

ALTER TABLE IF DROP COLUMN IF EXISTS IF;
ALTER TABLE public DROP CONSTRAINT IF EXISTS profiles_location_country_format;
ALTER TABLE public DROP CONSTRAINT IF EXISTS profiles_location_city_length;
ALTER TABLE public DROP CONSTRAINT IF EXISTS profiles_location_zip_length;

-- Rollback completed: 20251113032119_enhance_profile_location_fields