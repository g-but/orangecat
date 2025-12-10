-- ROLLBACK: 20250130_fix_profile_name_and_transactions
-- Generated: 2025-12-04T12:37:00.356Z
-- Source: 20250130_fix_profile_name_and_transactions.sql

ALTER TABLE profiles DROP COLUMN IF EXISTS name;
ALTER TABLE profiles DROP COLUMN IF EXISTS name;
ALTER TABLE transactions DROP COLUMN IF EXISTS amount_sats;
ALTER TABLE transactions DROP COLUMN IF EXISTS amount_sats;
ALTER TABLE transactions DROP COLUMN IF EXISTS from_entity_type;
ALTER TABLE transactions DROP COLUMN IF EXISTS from_entity_id;
ALTER TABLE transactions DROP COLUMN IF EXISTS to_entity_type;
ALTER TABLE transactions DROP COLUMN IF EXISTS to_entity_id;
ALTER TABLE transactions DROP COLUMN IF EXISTS status;

-- Rollback completed: 20250130_fix_profile_name_and_transactions