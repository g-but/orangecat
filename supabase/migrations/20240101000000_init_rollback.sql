-- ROLLBACK: 20240101000000_init
-- Generated: 2025-12-04T12:37:00.318Z
-- Source: 20240101000000_init.sql

DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP FUNCTION IF EXISTS public;
-- MANUAL: Review data inserted into public
DROP TRIGGER IF EXISTS on_auth_user_created ON auth;

-- Rollback completed: 20240101000000_init