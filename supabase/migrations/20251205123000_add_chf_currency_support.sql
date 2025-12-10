-- Add CHF currency support across loans, payments, assets, and collateral.
-- Keeps DB constraints aligned with frontend currency source-of-truth.

BEGIN;

-- Loans
ALTER TABLE public.loans DROP CONSTRAINT IF EXISTS loans_currency_check;
ALTER TABLE public.loans
  ADD CONSTRAINT loans_currency_check CHECK (currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS'));
ALTER TABLE public.loans ALTER COLUMN currency SET DEFAULT 'USD';

-- Loan payments
ALTER TABLE public.loan_payments DROP CONSTRAINT IF EXISTS loan_payments_currency_check;
ALTER TABLE public.loan_payments
  ADD CONSTRAINT loan_payments_currency_check CHECK (currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS'));
ALTER TABLE public.loan_payments ALTER COLUMN currency SET DEFAULT 'USD';

-- Assets
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_currency_check;
ALTER TABLE public.assets
  ADD CONSTRAINT assets_currency_check CHECK (currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS'));
ALTER TABLE public.assets ALTER COLUMN currency SET DEFAULT 'USD';

-- Loan collateral
ALTER TABLE public.loan_collateral DROP CONSTRAINT IF EXISTS loan_collateral_currency_check;
ALTER TABLE public.loan_collateral
  ADD CONSTRAINT loan_collateral_currency_check CHECK (currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS'));
ALTER TABLE public.loan_collateral ALTER COLUMN currency SET DEFAULT 'USD';

COMMIT;
















