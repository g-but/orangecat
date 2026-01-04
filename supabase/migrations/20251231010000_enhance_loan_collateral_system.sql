-- Migration: Enhance Loan Collateral System
-- Date: 2025-12-31
-- Purpose: Add wallet support to collateral system and loan type distinction

-- Step 1: Add loan_type to loans table
ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS loan_type TEXT DEFAULT 'new_request'
    CHECK (loan_type IN ('new_request', 'existing_refinance'));

-- Step 2: Update existing loans to have type
UPDATE public.loans
  SET loan_type = 'new_request'
  WHERE loan_type IS NULL;

-- Step 3: Add new columns to loan_collateral table
ALTER TABLE public.loan_collateral
  ADD COLUMN IF NOT EXISTS collateral_type TEXT DEFAULT 'asset',
  ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE;

-- Step 4: Update existing collateral records
UPDATE public.loan_collateral
  SET collateral_type = 'asset'
  WHERE asset_id IS NOT NULL AND collateral_type IS NULL;

-- Step 5: Make asset_id nullable (when wallet is used)
ALTER TABLE public.loan_collateral
  ALTER COLUMN asset_id DROP NOT NULL;

-- Step 6: Add constraint to ensure proper collateral type usage
ALTER TABLE public.loan_collateral
  DROP CONSTRAINT IF EXISTS loan_collateral_type_check,
  ADD CONSTRAINT loan_collateral_type_check 
    CHECK (
      (collateral_type = 'asset' AND asset_id IS NOT NULL AND wallet_id IS NULL) OR
      (collateral_type = 'wallet' AND wallet_id IS NOT NULL AND asset_id IS NULL)
    );

-- Step 7: Add index for wallet_id lookups
CREATE INDEX IF NOT EXISTS idx_loan_collateral_wallet 
  ON public.loan_collateral(wallet_id);

-- Step 8: Add index for loan_type lookups
CREATE INDEX IF NOT EXISTS idx_loans_type 
  ON public.loans(loan_type);

-- Step 9: Add comment for documentation
COMMENT ON COLUMN public.loans.loan_type IS 
  'Type of loan: new_request (user wants to borrow) or existing_refinance (user wants to refinance existing loan)';

COMMENT ON COLUMN public.loan_collateral.collateral_type IS 
  'Type of collateral: asset (physical/real asset) or wallet (Bitcoin wallet)';

COMMENT ON COLUMN public.loan_collateral.wallet_id IS 
  'Reference to wallet used as collateral (when collateral_type = wallet)';
