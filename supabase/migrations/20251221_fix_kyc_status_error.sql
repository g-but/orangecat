-- ============================================================================
-- FIX KYC_STATUS CONSTRAINT ERROR
-- ============================================================================
-- This migration fixes the error where we try to drop a constraint that
-- doesn't exist yet due to migration order issues
-- ============================================================================

-- Safely drop kyc_status constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_kyc_status_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_kyc_status_check;
  END IF;
END $$;

-- Ensure profiles table has the basic columns we need
DO $$
BEGIN
  -- Add name column if it doesn't exist (standardized from display_name)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN name text;
  END IF;

  -- Add bio column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;

  -- Add bitcoin_address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'bitcoin_address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bitcoin_address text;
  END IF;

  -- Add lightning_address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'lightning_address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN lightning_address text;
  END IF;
END $$;

