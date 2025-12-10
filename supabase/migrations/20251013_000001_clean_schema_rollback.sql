-- ROLLBACK: 20251013_000001_clean_schema
-- Generated: 2025-12-04T12:37:00.399Z
-- Source: 20251013_000001_clean_schema.sql

DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_profiles_username;
DROP INDEX IF EXISTS idx_profiles_display_name;
DROP INDEX IF EXISTS idx_campaigns_creator;
DROP INDEX IF EXISTS idx_campaigns_status;
DROP INDEX IF EXISTS idx_campaigns_featured;
DROP INDEX IF EXISTS idx_donations_campaign;
DROP INDEX IF EXISTS idx_donations_donor;
DROP INDEX IF EXISTS idx_donations_status;
DROP FUNCTION IF EXISTS update_updated_at_column;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public;
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON to;
DROP FUNCTION IF EXISTS public;
-- MANUAL: Review data inserted into public
DROP TRIGGER IF EXISTS on_auth_user_created ON auth;

-- Rollback completed: 20251013_000001_clean_schema