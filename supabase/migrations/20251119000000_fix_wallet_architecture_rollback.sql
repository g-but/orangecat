-- ROLLBACK: 20251119000000_fix_wallet_architecture
-- Generated: 2025-12-04T12:37:00.479Z
-- Source: 20251119000000_fix_wallet_architecture.sql

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
DROP FUNCTION IF EXISTS update_wallet_definition_timestamp;
DROP TRIGGER IF EXISTS update_wallet_definition_timestamp_trigger ON public;
DROP FUNCTION IF EXISTS update_wallet_category_timestamp;
DROP TRIGGER IF EXISTS update_wallet_category_timestamp_trigger ON public;
DROP FUNCTION IF EXISTS check_wallet_category_limit;
DROP TRIGGER IF EXISTS enforce_wallet_category_limit ON public;
DROP FUNCTION IF EXISTS get_entity_wallets;

-- Rollback completed: 20251119000000_fix_wallet_architecture