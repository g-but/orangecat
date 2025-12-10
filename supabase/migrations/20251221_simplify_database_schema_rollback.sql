-- ROLLBACK: 20251221_simplify_database_schema
-- Generated: 2025-12-04T12:37:00.500Z
-- Source: 20251221_simplify_database_schema.sql

DROP FUNCTION IF EXISTS public;
-- MANUAL: Review data inserted into public
DROP TABLE IF EXISTS profiles_simplified CASCADE;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_key;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_format;
DROP FUNCTION IF EXISTS public;
DROP TRIGGER IF EXISTS set_updated_at ON profiles;
ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_project_id_fkey;
ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_project_id_fkey;

-- Rollback completed: 20251221_simplify_database_schema