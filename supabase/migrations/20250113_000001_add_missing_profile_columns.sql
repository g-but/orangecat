-- =====================================================================
-- ADD MISSING PROFILE COLUMNS - January 2025
-- =====================================================================
-- This migration adds the missing columns that the API expects:
-- - display_name, bio, website, bitcoin_address, lightning_address
-- =====================================================================

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS bitcoin_address text,
  ADD COLUMN IF NOT EXISTS lightning_address text;

-- Add constraints for Bitcoin address format validation (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_bitcoin_address_format' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_bitcoin_address_format 
    CHECK (bitcoin_address IS NULL OR bitcoin_address ~ '^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,}$');
  END IF;
END $$;

-- Add constraints for Lightning address format validation (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_lightning_address_format' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_lightning_address_format 
    CHECK (lightning_address IS NULL OR lightning_address ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$');
  END IF;
END $$;

-- Add constraints for website URL format validation (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_website_format' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_website_format 
    CHECK (website IS NULL OR website ~ '^https?://');
  END IF;
END $$;

-- Update existing profiles to have display_name = username where display_name is null
UPDATE public.profiles 
SET display_name = username 
WHERE display_name IS NULL AND username IS NOT NULL;

-- Add helpful comment
COMMENT ON TABLE public.profiles IS 'User profiles with Bitcoin-native features';
COMMENT ON COLUMN public.profiles.display_name IS 'User-friendly display name';
COMMENT ON COLUMN public.profiles.bio IS 'User biography/description';
COMMENT ON COLUMN public.profiles.website IS 'User website URL';
COMMENT ON COLUMN public.profiles.bitcoin_address IS 'Bitcoin address for receiving payments';
COMMENT ON COLUMN public.profiles.lightning_address IS 'Lightning Network address for instant payments';
