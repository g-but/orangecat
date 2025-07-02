-- Consolidate Schema Fixes
-- This migration resolves critical schema inconsistencies found in the database
-- Date: 2025-07-02

-- Step 1: Ensure consistent column names in profiles table
-- Fix the inconsistency between full_name and display_name
DO $$
BEGIN
    -- Check if full_name column exists and rename it to display_name for consistency
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'full_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles RENAME COLUMN full_name TO display_name;
    END IF;
    
    -- Ensure display_name column exists if neither full_name nor display_name exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'display_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN display_name text;
    END IF;
END $$;

-- Step 2: Fix foreign key reference inconsistencies
-- Ensure all user_id references point to the same target
DO $$
BEGIN
    -- Drop and recreate funding_pages foreign key to ensure consistency
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%funding_pages%user_id%'
        AND table_name = 'funding_pages'
    ) THEN
        ALTER TABLE public.funding_pages 
        DROP CONSTRAINT IF EXISTS funding_pages_user_id_fkey;
    END IF;
    
    -- Recreate with consistent reference to auth.users with CASCADE
    ALTER TABLE public.funding_pages 
    ADD CONSTRAINT funding_pages_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Fix transactions table foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'transactions' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.transactions 
        DROP CONSTRAINT IF EXISTS transactions_funding_page_id_fkey;
        
        ALTER TABLE public.transactions 
        ADD CONSTRAINT transactions_funding_page_id_fkey 
        FOREIGN KEY (funding_page_id) REFERENCES public.funding_pages(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 3: Add missing constraints and indexes for data integrity
DO $$
BEGIN
    -- Add unique constraint on username if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_username_key'
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
    END IF;
    
    -- Add check constraint for Bitcoin addresses (basic validation)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'profiles_bitcoin_address_check'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_bitcoin_address_check 
        CHECK (bitcoin_address IS NULL OR length(bitcoin_address) >= 26);
    END IF;
    
    -- Ensure proper decimal precision for monetary values
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'funding_pages' 
        AND column_name = 'total_funding'
        AND data_type = 'numeric'
    ) THEN
        ALTER TABLE public.funding_pages 
        ALTER COLUMN total_funding TYPE numeric(20,8);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'amount'
        AND data_type = 'numeric'
    ) THEN
        ALTER TABLE public.transactions 
        ALTER COLUMN amount TYPE numeric(20,8);
    END IF;
END $$;

-- Step 4: Create missing indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS profiles_display_name_idx 
ON public.profiles(display_name) WHERE display_name IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS funding_pages_is_public_active_idx 
ON public.funding_pages(is_public, is_active, created_at) 
WHERE is_public = true AND is_active = true;

-- Step 5: Update the user creation function to use consistent column names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, created_at, updated_at)
    VALUES (
        new.id,
        new.email,
        split_part(new.email, '@', 1),
        now(),
        now()
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
    RETURN new;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Ensure RLS policies are properly set
-- Update any overly permissive policies
DROP POLICY IF EXISTS "Public transactions are viewable by everyone" ON public.transactions;

-- Create more secure transaction policy
CREATE POLICY "Users can view relevant transactions" ON public.transactions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.funding_pages fp
        WHERE fp.id = transactions.funding_page_id
        AND (fp.is_public = true OR fp.user_id = auth.uid())
    )
);

-- Ensure proper insert policy for transactions
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
CREATE POLICY "Authenticated users can create transactions" ON public.transactions
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

COMMENT ON MIGRATION IS 'Consolidated schema fixes addressing critical inconsistencies in profiles table columns, foreign key references, and security policies. Fixes issues identified in schema integrity audit.';