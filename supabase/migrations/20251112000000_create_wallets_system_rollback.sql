-- ROLLBACK: 20251112000000_create_wallets_system
-- Generated: 2025-12-04T12:37:00.436Z
-- Source: 20251112000000_create_wallets_system.sql

DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_wallets_profile;
DROP INDEX IF EXISTS idx_wallets_project;
DROP INDEX IF EXISTS idx_wallets_active;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_wallet_addresses_wallet;
DROP INDEX IF EXISTS idx_wallet_addresses_has_balance;
DROP FUNCTION IF EXISTS get_wallet_total_balance;
DROP FUNCTION IF EXISTS get_entity_total_balance;

-- Rollback completed: 20251112000000_create_wallets_system