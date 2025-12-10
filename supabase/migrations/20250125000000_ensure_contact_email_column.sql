-- =====================================================================
-- Ensure contact_email column exists in profiles table
-- =====================================================================
-- This migration ensures the contact_email column exists, even if
-- the previous migration (20251124060022) was not fully applied.
-- =====================================================================

BEGIN;

-- Add contact_email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN contact_email TEXT;
    RAISE NOTICE 'contact_email column added successfully';
  ELSE
    RAISE NOTICE 'contact_email column already exists';
  END IF;
END $$;

-- Add comment if column was just created
COMMENT ON COLUMN public.profiles.contact_email IS 
  'Public contact email (different from registration email). Visible on profile for supporters to contact the user.';

-- Add index for searchability (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_profiles_contact_email 
  ON public.profiles(contact_email) 
  WHERE contact_email IS NOT NULL;

COMMIT;





































