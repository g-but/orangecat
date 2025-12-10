-- ROLLBACK: 20251221_fix_kyc_status_error
-- Generated: 2025-12-04T12:37:00.499Z
-- Source: 20251221_fix_kyc_status_error.sql

ALTER TABLE profiles DROP COLUMN IF EXISTS name;
ALTER TABLE profiles DROP COLUMN IF EXISTS bio;
ALTER TABLE profiles DROP COLUMN IF EXISTS bitcoin_address;
ALTER TABLE profiles DROP COLUMN IF EXISTS lightning_address;

-- Rollback completed: 20251221_fix_kyc_status_error