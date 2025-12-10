-- ROLLBACK: 20251202_create_personal_economy_tables
-- Generated: 2025-12-04T12:37:00.495Z
-- Source: 20251202_create_personal_economy_tables.sql

DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP TABLE IF EXISTS public CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column;
DROP TRIGGER IF EXISTS update_user_products_updated_at ON user_products;
DROP TRIGGER IF EXISTS update_user_services_updated_at ON user_services;
DROP TRIGGER IF EXISTS update_user_causes_updated_at ON user_causes;
DROP TRIGGER IF EXISTS update_user_ai_assistants_updated_at ON user_ai_assistants;

-- Rollback completed: 20251202_create_personal_economy_tables