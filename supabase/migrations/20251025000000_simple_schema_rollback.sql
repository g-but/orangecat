-- ROLLBACK: 20251025000000_simple_schema
-- Generated: 2025-12-04T12:37:00.424Z
-- Source: 20251025000000_simple_schema.sql

DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON update_updated_at_column;
DROP TRIGGER IF EXISTS update_projects_updated_at ON update_updated_at_column;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON update_updated_at_column;
DROP FUNCTION IF EXISTS public;
-- MANUAL: Review data inserted into public
DROP TRIGGER IF EXISTS on_auth_user_created ON auth;

-- Rollback completed: 20251025000000_simple_schema