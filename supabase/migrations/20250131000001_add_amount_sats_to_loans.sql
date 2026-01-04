-- Migration: Add amount_sats column to loans table
-- Date: 2025-01-31
-- Purpose: Add missing amount_sats column required by schema

-- Add amount_sats column if it doesn't exist
ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS amount_sats bigint;

-- Update existing rows to have a default value based on original_amount
UPDATE public.loans
  SET amount_sats = COALESCE(
    CASE 
      WHEN currency = 'CHF' THEN FLOOR(COALESCE(original_amount, 0) * 100000000 / 86000)
      WHEN currency = 'EUR' THEN FLOOR(COALESCE(original_amount, 0) * 100000000 / 95000)
      WHEN currency = 'USD' THEN FLOOR(COALESCE(original_amount, 0) * 100000000 / 90000)
      WHEN currency = 'GBP' THEN FLOOR(COALESCE(original_amount, 0) * 100000000 / 110000)
      WHEN currency = 'BTC' THEN FLOOR(COALESCE(original_amount, 0) * 100000000)
      WHEN currency = 'SATS' THEN FLOOR(COALESCE(original_amount, 0))
      ELSE 1000000
    END,
    1000000
  )
  WHERE amount_sats IS NULL;

-- Make it NOT NULL with a default
ALTER TABLE public.loans
  ALTER COLUMN amount_sats SET DEFAULT 1000000,
  ALTER COLUMN amount_sats SET NOT NULL;

-- Add CHECK constraint
ALTER TABLE public.loans
  DROP CONSTRAINT IF EXISTS loans_amount_sats_check,
  ADD CONSTRAINT loans_amount_sats_check CHECK (amount_sats > 0);
