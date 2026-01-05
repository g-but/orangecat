-- Update events table currency constraint to match CURRENCY_CODES
-- This fixes the mismatch between validation schema and database constraint
-- CURRENCY_CODES = ['USD', 'EUR', 'CHF', 'BTC', 'SATS']

ALTER TABLE public.events 
  DROP CONSTRAINT IF EXISTS events_currency_check;

ALTER TABLE public.events 
  ADD CONSTRAINT events_currency_check 
  CHECK (currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS'));

-- Update default to match platform default (SATS)
ALTER TABLE public.events 
  ALTER COLUMN currency SET DEFAULT 'SATS';
