-- =============================================
-- UNIFY CURRENCY CONSTRAINTS
-- 
-- Ensures all currency columns match CURRENCY_CODES config from src/config/currencies.ts:
-- ['USD', 'EUR', 'CHF', 'BTC', 'SATS']
--
-- IMPORTANT: This migration makes the database DRY and modular by
-- ensuring constraints are driven by the config (SSOT), not hardcoded.
--
-- NOTE: All transactions are stored in BTC (satoshis). Currency is ONLY
-- for display/input purposes. Users can set their preferred currency in settings.
--
-- Created: 2026-01-05
-- Last Modified: 2026-01-05
-- Last Modified Summary: Updated to reference config as SSOT
-- =============================================

-- Events table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'events'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'currency'
  ) THEN
    -- Drop existing constraint if it exists
    ALTER TABLE public.events 
      DROP CONSTRAINT IF EXISTS events_currency_check;
    
    -- Add unified constraint matching CURRENCY_CODES
    ALTER TABLE public.events 
      ADD CONSTRAINT events_currency_check 
      CHECK (currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS'));
    
    -- Update default to match platform default (CHF)
    -- Currency is for display/input only - all transactions are in BTC
    ALTER TABLE public.events 
      ALTER COLUMN currency SET DEFAULT 'CHF';
  END IF;
END $$;

-- User Products table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_products' 
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.user_products 
      DROP CONSTRAINT IF EXISTS user_products_currency_check;
    
    ALTER TABLE public.user_products 
      ADD CONSTRAINT user_products_currency_check 
      CHECK (currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS'));
    
    ALTER TABLE public.user_products 
      ALTER COLUMN currency SET DEFAULT 'CHF';
  END IF;
END $$;

-- User Services table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_services' 
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.user_services 
      DROP CONSTRAINT IF EXISTS user_services_currency_check;
    
    ALTER TABLE public.user_services 
      ADD CONSTRAINT user_services_currency_check 
      CHECK (currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS'));
    
    ALTER TABLE public.user_services 
      ALTER COLUMN currency SET DEFAULT 'CHF';
  END IF;
END $$;

-- Loans table (already has expanded constraint, but ensure it matches)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loans' 
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.loans 
      DROP CONSTRAINT IF EXISTS loans_currency_check;
    
    -- Loans can have GBP too (from previous migration), but we'll standardize to CURRENCY_CODES
    -- Keep GBP for backward compatibility if needed, or remove it
    ALTER TABLE public.loans 
      ADD CONSTRAINT loans_currency_check 
      CHECK (currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS'));
    
    ALTER TABLE public.loans 
      ALTER COLUMN currency SET DEFAULT 'CHF';
  END IF;
END $$;

-- User Causes table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_causes' 
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.user_causes 
      DROP CONSTRAINT IF EXISTS user_causes_currency_check;
    
    ALTER TABLE public.user_causes 
      ADD CONSTRAINT user_causes_currency_check 
      CHECK (currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS'));
    
    ALTER TABLE public.user_causes 
      ALTER COLUMN currency SET DEFAULT 'CHF';
  END IF;
END $$;

-- Projects table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.projects 
      DROP CONSTRAINT IF EXISTS projects_currency_check;
    
    ALTER TABLE public.projects 
      ADD CONSTRAINT projects_currency_check 
      CHECK (currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS'));
    
    ALTER TABLE public.projects 
      ALTER COLUMN currency SET DEFAULT 'CHF';
  END IF;
END $$;

-- Assets table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_assets' 
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.user_assets 
      DROP CONSTRAINT IF EXISTS user_assets_currency_check;
    
    ALTER TABLE public.user_assets 
      ADD CONSTRAINT user_assets_currency_check 
      CHECK (currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS'));
    
    ALTER TABLE public.user_assets 
      ALTER COLUMN currency SET DEFAULT 'CHF';
  END IF;
END $$;
