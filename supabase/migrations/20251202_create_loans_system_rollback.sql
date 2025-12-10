-- ROLLBACK: 20251202_create_loans_system
-- Generated: 2025-12-04T12:37:00.494Z
-- Source: 20251202_create_loans_system.sql

DROP TABLE IF EXISTS loan_categories CASCADE;
-- MANUAL: Review data inserted into loan_categories
DROP TABLE IF EXISTS loans CASCADE;
DROP INDEX IF EXISTS idx_loans_user;
DROP INDEX IF EXISTS idx_loans_status;
DROP INDEX IF EXISTS idx_loans_category;
DROP INDEX IF EXISTS idx_loans_public;
DROP INDEX IF EXISTS idx_loans_remaining_balance;
DROP FUNCTION IF EXISTS update_loans_updated_at;
DROP TRIGGER IF EXISTS trigger_update_loans_updated_at ON loans;
DROP TABLE IF EXISTS loan_offers CASCADE;
DROP INDEX IF EXISTS idx_loan_offers_loan;
DROP INDEX IF EXISTS idx_loan_offers_offerer;
DROP INDEX IF EXISTS idx_loan_offers_status;
DROP INDEX IF EXISTS idx_loan_offers_expires;
DROP FUNCTION IF EXISTS update_loan_offers_updated_at;
DROP TRIGGER IF EXISTS trigger_update_loan_offers_updated_at ON loan_offers;
DROP TABLE IF EXISTS loan_payments CASCADE;
DROP INDEX IF EXISTS idx_loan_payments_loan;
DROP INDEX IF EXISTS idx_loan_payments_offer;
DROP INDEX IF EXISTS idx_loan_payments_payer;
DROP INDEX IF EXISTS idx_loan_payments_recipient;
DROP INDEX IF EXISTS idx_loan_payments_status;
DROP VIEW IF EXISTS loan_stats;
DROP FUNCTION IF EXISTS get_user_loans;
DROP FUNCTION IF EXISTS get_available_loans;
DROP FUNCTION IF EXISTS create_loan_offer;
-- MANUAL: Review data inserted into loan_offers

-- Rollback completed: 20251202_create_loans_system