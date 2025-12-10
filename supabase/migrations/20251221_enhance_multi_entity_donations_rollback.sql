-- ROLLBACK: 20251221_enhance_multi_entity_donations
-- Generated: 2025-12-04T12:37:00.499Z
-- Source: 20251221_enhance_multi_entity_donations.sql

ALTER TABLE profiles DROP COLUMN IF EXISTS IF;
ALTER TABLE organizations DROP COLUMN IF EXISTS IF;
ALTER TABLE projects DROP COLUMN IF EXISTS IF;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_transactions_from_entity;
DROP INDEX IF EXISTS idx_transactions_to_entity;
DROP INDEX IF EXISTS idx_transactions_status;
DROP INDEX IF EXISTS idx_transactions_created_at;
DROP INDEX IF EXISTS idx_transactions_amount;
DROP INDEX IF EXISTS idx_transactions_from_profiles;
DROP INDEX IF EXISTS idx_transactions_to_profiles;
DROP INDEX IF EXISTS idx_transactions_from_orgs;
DROP INDEX IF EXISTS idx_transactions_to_orgs;
DROP INDEX IF EXISTS idx_transactions_from_projects;
DROP INDEX IF EXISTS idx_transactions_to_projects;
DROP INDEX IF EXISTS idx_transactions_public;
DROP INDEX IF EXISTS idx_transactions_anonymous;
-- MANUAL: Review data inserted into transactions
DROP FUNCTION IF EXISTS get_entity_wallet_balance;
DROP FUNCTION IF EXISTS get_entity_transaction_history;

-- Rollback completed: 20251221_enhance_multi_entity_donations