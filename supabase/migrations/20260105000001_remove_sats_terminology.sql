-- =============================================
-- REMOVE SATS TERMINOLOGY - STORE IN USER CURRENCY
-- 
-- This migration removes all "_sats" suffixes and changes storage
-- to store amounts in the currency specified by the currency column.
-- 
-- Amounts are stored as numeric/decimal in the user's preferred currency.
-- Conversion to satoshis happens ONLY when sending Bitcoin transactions.
--
-- Created: 2026-01-05
-- =============================================

-- Events table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'ticket_price_sats'
  ) THEN
    -- Rename and change type
    ALTER TABLE public.events 
      RENAME COLUMN ticket_price_sats TO ticket_price;
    
    ALTER TABLE public.events 
      ALTER COLUMN ticket_price TYPE numeric(20, 8);
    
    -- Rename funding_goal_sats
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'events' 
      AND column_name = 'funding_goal_sats'
    ) THEN
      ALTER TABLE public.events 
        RENAME COLUMN funding_goal_sats TO funding_goal;
      
      ALTER TABLE public.events 
        ALTER COLUMN funding_goal TYPE numeric(20, 8);
    END IF;
  END IF;
END $$;

-- User Products table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_products' 
    AND column_name = 'price_sats'
  ) THEN
    ALTER TABLE public.user_products 
      RENAME COLUMN price_sats TO price;
    
    ALTER TABLE public.user_products 
      ALTER COLUMN price TYPE numeric(20, 8);
  END IF;
END $$;

-- User Services table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_services' 
    AND column_name = 'hourly_rate_sats'
  ) THEN
    ALTER TABLE public.user_services 
      RENAME COLUMN hourly_rate_sats TO hourly_rate;
    
    ALTER TABLE public.user_services 
      ALTER COLUMN hourly_rate TYPE numeric(20, 8);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_services' 
    AND column_name = 'fixed_price_sats'
  ) THEN
    ALTER TABLE public.user_services 
      RENAME COLUMN fixed_price_sats TO fixed_price;
    
    ALTER TABLE public.user_services 
      ALTER COLUMN fixed_price TYPE numeric(20, 8);
  END IF;
END $$;

-- User Causes table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_causes' 
    AND column_name = 'goal_sats'
  ) THEN
    ALTER TABLE public.user_causes 
      RENAME COLUMN goal_sats TO goal_amount;
    
    ALTER TABLE public.user_causes 
      ALTER COLUMN goal_amount TYPE numeric(20, 8);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_causes' 
    AND column_name = 'total_raised_sats'
  ) THEN
    ALTER TABLE public.user_causes 
      RENAME COLUMN total_raised_sats TO total_raised;
    
    ALTER TABLE public.user_causes 
      ALTER COLUMN total_raised TYPE numeric(20, 8);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_causes' 
    AND column_name = 'total_distributed_sats'
  ) THEN
    ALTER TABLE public.user_causes 
      RENAME COLUMN total_distributed_sats TO total_distributed;
    
    ALTER TABLE public.user_causes 
      ALTER COLUMN total_distributed TYPE numeric(20, 8);
  END IF;
END $$;

-- Loans table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loans' 
    AND column_name = 'amount_sats'
  ) THEN
    ALTER TABLE public.loans 
      RENAME COLUMN amount_sats TO amount;
    
    ALTER TABLE public.loans 
      ALTER COLUMN amount TYPE numeric(20, 8);
  END IF;
END $$;

-- Projects table (goal_amount already exists, but check for raised_amount_sats)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'raised_amount_sats'
  ) THEN
    ALTER TABLE public.projects 
      RENAME COLUMN raised_amount_sats TO raised_amount;
    
    ALTER TABLE public.projects 
      ALTER COLUMN raised_amount TYPE numeric(20, 8);
  END IF;
  
  -- Ensure goal_amount is numeric if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'goal_amount'
  ) THEN
    ALTER TABLE public.projects 
      ALTER COLUMN goal_amount TYPE numeric(20, 8);
  END IF;
END $$;

-- AI Assistants table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ai_assistants' 
    AND column_name = 'price_per_message_sats'
  ) THEN
    ALTER TABLE public.ai_assistants 
      RENAME COLUMN price_per_message_sats TO price_per_message;
    
    ALTER TABLE public.ai_assistants 
      ALTER COLUMN price_per_message TYPE numeric(20, 8);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ai_assistants' 
    AND column_name = 'price_per_1k_tokens_sats'
  ) THEN
    ALTER TABLE public.ai_assistants 
      RENAME COLUMN price_per_1k_tokens_sats TO price_per_1k_tokens;
    
    ALTER TABLE public.ai_assistants 
      ALTER COLUMN price_per_1k_tokens TYPE numeric(20, 8);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ai_assistants' 
    AND column_name = 'subscription_price_sats'
  ) THEN
    ALTER TABLE public.ai_assistants 
      RENAME COLUMN subscription_price_sats TO subscription_price;
    
    ALTER TABLE public.ai_assistants 
      ALTER COLUMN subscription_price TYPE numeric(20, 8);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ai_assistants' 
    AND column_name = 'total_revenue_sats'
  ) THEN
    ALTER TABLE public.ai_assistants 
      RENAME COLUMN total_revenue_sats TO total_revenue;
    
    ALTER TABLE public.ai_assistants 
      ALTER COLUMN total_revenue TYPE numeric(20, 8);
  END IF;
END $$;

-- Update CHECK constraints to allow positive amounts (not just integers)
-- Remove any constraints that check for integer values
DO $$
BEGIN
  -- Events - only if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'events'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'events_ticket_price_check'
    ) THEN
      ALTER TABLE public.events DROP CONSTRAINT events_ticket_price_check;
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'events'
      AND column_name = 'ticket_price'
    ) THEN
      ALTER TABLE public.events 
        ADD CONSTRAINT events_ticket_price_check CHECK (ticket_price IS NULL OR ticket_price > 0);
    END IF;
  END IF;
  
  -- Products - only if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'user_products'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'user_products_price_check'
    ) THEN
      ALTER TABLE public.user_products DROP CONSTRAINT user_products_price_check;
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'user_products'
      AND column_name = 'price'
    ) THEN
      ALTER TABLE public.user_products 
        ADD CONSTRAINT user_products_price_check CHECK (price > 0);
    END IF;
  END IF;
END $$;
