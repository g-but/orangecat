-- ============================================================================
-- FIX PROFILE NAME AND TRANSACTIONS SCHEMA
-- ============================================================================
-- This migration ensures:
-- 1. Profiles table uses 'name' (not display_name)
-- 2. Transactions table has amount_sats column
-- 3. All schema inconsistencies are resolved
-- ============================================================================

-- ============================================================================
-- STEP 1: ENSURE PROFILES TABLE HAS 'name' COLUMN
-- ============================================================================

-- Add name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'name'
  ) THEN
    -- If display_name exists, migrate data and rename
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'display_name'
    ) THEN
      ALTER TABLE profiles ADD COLUMN name text;
      UPDATE profiles SET name = display_name WHERE name IS NULL AND display_name IS NOT NULL;
      ALTER TABLE profiles DROP COLUMN display_name;
    ELSE
      ALTER TABLE profiles ADD COLUMN name text;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: ENSURE TRANSACTIONS TABLE HAS amount_sats COLUMN
-- ============================================================================

-- Add amount_sats column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'amount_sats'
  ) THEN
    -- If amount column exists, migrate data and rename
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'transactions' 
      AND column_name = 'amount'
    ) THEN
      ALTER TABLE transactions ADD COLUMN amount_sats BIGINT;
      -- Convert amount to amount_sats (assuming amount is in satoshis or needs conversion)
      UPDATE transactions SET amount_sats = COALESCE(amount::bigint, 0) WHERE amount_sats IS NULL;
      ALTER TABLE transactions ALTER COLUMN amount_sats SET NOT NULL;
      ALTER TABLE transactions DROP COLUMN amount;
    ELSE
      ALTER TABLE transactions ADD COLUMN amount_sats BIGINT NOT NULL DEFAULT 0;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: ENSURE REQUIRED TRANSACTION COLUMNS EXIST
-- ============================================================================

-- Add required columns if they don't exist
DO $$
BEGIN
  -- from_entity_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'from_entity_type'
  ) THEN
    ALTER TABLE transactions ADD COLUMN from_entity_type TEXT;
  END IF;

  -- from_entity_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'from_entity_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN from_entity_id uuid;
  END IF;

  -- to_entity_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'to_entity_type'
  ) THEN
    ALTER TABLE transactions ADD COLUMN to_entity_type TEXT;
  END IF;

  -- to_entity_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'to_entity_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN to_entity_id uuid;
  END IF;

  -- status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE transactions ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: ADD INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_transactions_amount_sats ON transactions(amount_sats DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_from_entity ON transactions(from_entity_id, from_entity_type);
CREATE INDEX IF NOT EXISTS idx_transactions_to_entity ON transactions(to_entity_id, to_entity_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON COLUMN profiles.name IS 'User display name (standardized from display_name)';
COMMENT ON COLUMN transactions.amount_sats IS 'Transaction amount in satoshis';

