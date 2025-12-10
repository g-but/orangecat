-- ROLLBACK: 20251112000000_create_wallets_system_fixed
-- Generated: 2025-12-04T12:37:00.447Z
-- Source: 20251112000000_create_wallets_system_fixed.sql

DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_wallets_profile;
DROP INDEX IF EXISTS idx_wallets_project;
DROP INDEX IF EXISTS idx_wallets_user;
DROP INDEX IF EXISTS idx_wallets_balance;
DROP FUNCTION IF EXISTS set_wallet_user_id;
DROP TRIGGER IF EXISTS set_wallet_user_id_trigger ON public;
DROP FUNCTION IF EXISTS check_wallet_limit;
DROP TRIGGER IF EXISTS enforce_wallet_limit ON public;
DROP FUNCTION IF EXISTS update_wallet_timestamp;
DROP TRIGGER IF EXISTS update_wallet_timestamp_trigger ON public;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_wallet_addresses_wallet;
DROP INDEX IF EXISTS idx_wallet_addresses_balance;
DROP VIEW IF EXISTS wallets_with_totals;

-- Rollback completed: 20251112000000_create_wallets_system_fixed