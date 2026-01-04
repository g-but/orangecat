-- Migration: Add Loan Form Fields
-- Date: 2025-01-31
-- Purpose: Add missing columns to loans table to match loan form schema

-- Add missing columns to loans table
ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS original_amount numeric,
  ADD COLUMN IF NOT EXISTS remaining_balance numeric,
  ADD COLUMN IF NOT EXISTS interest_rate numeric,
  ADD COLUMN IF NOT EXISTS loan_category_id uuid,
  ADD COLUMN IF NOT EXISTS bitcoin_address text,
  ADD COLUMN IF NOT EXISTS lightning_address text,
  ADD COLUMN IF NOT EXISTS fulfillment_type text DEFAULT 'manual' CHECK (fulfillment_type IN ('manual', 'automatic')),
  -- Fields for existing loan refinancing
  ADD COLUMN IF NOT EXISTS current_lender text,
  ADD COLUMN IF NOT EXISTS current_interest_rate numeric,
  ADD COLUMN IF NOT EXISTS monthly_payment numeric,
  ADD COLUMN IF NOT EXISTS desired_rate numeric;

-- Update currency column constraint to support fiat currencies
-- Drop old constraint if it exists (from original schema)
ALTER TABLE public.loans DROP CONSTRAINT IF EXISTS loans_currency_check;

-- Add new constraint with expanded currency support
ALTER TABLE public.loans ADD CONSTRAINT loans_currency_check 
  CHECK (currency IN ('CHF', 'EUR', 'USD', 'GBP', 'BTC', 'SATS'));

-- Update currency column default and constraint if column already exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loans' 
    AND column_name = 'currency'
  ) THEN
    -- Column exists, just update default
    ALTER TABLE public.loans ALTER COLUMN currency SET DEFAULT 'CHF';
  ELSE
    -- Column doesn't exist, add it with new constraint
    ALTER TABLE public.loans ADD COLUMN currency text DEFAULT 'CHF' 
      CHECK (currency IN ('CHF', 'EUR', 'USD', 'GBP', 'BTC', 'SATS'));
  END IF;
END $$;

-- Update existing loans to set defaults (only if amount_sats exists, otherwise skip)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loans' 
    AND column_name = 'amount_sats'
  ) THEN
    UPDATE public.loans
      SET original_amount = amount_sats,
          remaining_balance = amount_sats,
          fulfillment_type = 'manual',
          currency = 'SATS'
      WHERE original_amount IS NULL;
  END IF;
END $$;

-- Add index for loan_category_id lookups
CREATE INDEX IF NOT EXISTS idx_loans_category ON public.loans(loan_category_id);

-- Add comment for documentation
COMMENT ON COLUMN public.loans.original_amount IS 'Original loan amount in the specified currency';
COMMENT ON COLUMN public.loans.remaining_balance IS 'Remaining balance to be paid';
COMMENT ON COLUMN public.loans.interest_rate IS 'Annual interest rate percentage';
COMMENT ON COLUMN public.loans.current_lender IS 'Name of current lender (for refinancing)';
COMMENT ON COLUMN public.loans.current_interest_rate IS 'Current annual interest rate (for refinancing)';
COMMENT ON COLUMN public.loans.monthly_payment IS 'Current monthly payment amount (for refinancing)';
COMMENT ON COLUMN public.loans.desired_rate IS 'Desired interest rate after refinancing';
