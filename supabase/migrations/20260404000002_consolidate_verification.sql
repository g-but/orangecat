-- Phase 2: Consolidate verification columns (6 → 2)
--
-- Keep: verification_status (text), verification_data (jsonb)
-- Drop: verification_level, is_verified, kyc_status, verification_badge
--
-- Backfill verification_status from is_verified before dropping.

UPDATE profiles SET verification_status = 'verified'
WHERE is_verified = true AND verification_status IS NULL;

ALTER TABLE profiles
  DROP COLUMN IF EXISTS verification_level,
  DROP COLUMN IF EXISTS is_verified,
  DROP COLUMN IF EXISTS kyc_status,
  DROP COLUMN IF EXISTS verification_badge;
