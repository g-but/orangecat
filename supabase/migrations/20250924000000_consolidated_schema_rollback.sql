-- ROLLBACK: 20250924000000_consolidated_schema
-- Generated: 2025-12-04T12:37:00.373Z
-- Source: 20250924000000_consolidated_schema.sql

DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP FUNCTION IF EXISTS public;
-- MANUAL: Review data inserted into public
DROP FUNCTION IF EXISTS public;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth;

-- Rollback completed: 20250924000000_consolidated_schema