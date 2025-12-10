-- ROLLBACK: 20251119100000_fix_wallet_architecture_v2
-- Generated: 2025-12-04T12:37:00.483Z
-- Source: 20251119100000_fix_wallet_architecture_v2.sql

DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_wallet_definitions_address;
DROP INDEX IF EXISTS idx_wallet_definitions_creator;
DROP INDEX IF EXISTS idx_wallet_definitions_balance;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_wallet_ownerships_wallet;
DROP INDEX IF EXISTS idx_wallet_ownerships_profile;
DROP INDEX IF EXISTS idx_wallet_ownerships_project;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_wallet_categories_wallet;
DROP INDEX IF EXISTS idx_wallet_categories_entity_profile;
DROP INDEX IF EXISTS idx_wallet_categories_entity_project;
DROP FUNCTION IF EXISTS validate_wallet_ownership;
DROP TRIGGER IF EXISTS validate_wallet_ownership_trigger ON public;
DROP FUNCTION IF EXISTS cleanup_wallet_ownerships_on_entity_delete;
DROP TRIGGER IF EXISTS cleanup_wallet_ownerships_on_profile_delete ON public;
DROP TRIGGER IF EXISTS cleanup_wallet_ownerships_on_project_delete ON public;
DROP FUNCTION IF EXISTS validate_wallet_category;
DROP TRIGGER IF EXISTS validate_wallet_category_trigger ON public;
DROP FUNCTION IF EXISTS cleanup_wallet_categories_on_entity_delete;
DROP TRIGGER IF EXISTS cleanup_wallet_categories_on_profile_delete ON public;
DROP TRIGGER IF EXISTS cleanup_wallet_categories_on_project_delete ON public;
DROP FUNCTION IF EXISTS update_wallet_definition_timestamp;
DROP TRIGGER IF EXISTS update_wallet_definition_timestamp_trigger ON public;
DROP FUNCTION IF EXISTS update_wallet_ownership_timestamp;
DROP TRIGGER IF EXISTS update_wallet_ownership_timestamp_trigger ON public;
DROP FUNCTION IF EXISTS update_wallet_category_timestamp;
DROP TRIGGER IF EXISTS update_wallet_category_timestamp_trigger ON public;
DROP FUNCTION IF EXISTS check_wallet_category_limit;
DROP TRIGGER IF EXISTS enforce_wallet_category_limit ON public;
DROP FUNCTION IF EXISTS get_entity_wallets;

-- Rollback completed: 20251119100000_fix_wallet_architecture_v2